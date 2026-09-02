#!/usr/bin/env python3
"""Import the BibleForge original-language corpus into Bíblia X.

The input is the unmodified ``bible_original.sql.gz`` MySQL dump published by
BibleForgeDB.  Only the ``bible_original`` rows are read.  No MySQL server is
required.

The importer intentionally replaces the older WEBP word-association layer.
That layer tags translated English words and is not a reliable word-for-word
representation of the Hebrew and Greek source texts.  The lexical dictionary
(``strong_lexicon``) is preserved.
"""

from __future__ import annotations

import argparse
import gzip
import hashlib
import json
from pathlib import Path
import sqlite3
from typing import Iterator


SOURCE_URL = (
    "https://raw.githubusercontent.com/bibleforge/BibleForgeDB/"
    "master/bible_original.sql.gz"
)
SOURCE_LICENSE = "Public Domain / CC0 (BibleForgeDB)"
SOURCE_NAME = "BibleForgeDB original-language corpus"
TRANSLATION_ID = "strong_original"
INSERT_MARKER = "INSERT INTO `bible_original` VALUES "

BOOK_CODES = (
    "GEN", "EXO", "LEV", "NUM", "DEU", "JOS", "JDG", "RUT", "1SA", "2SA",
    "1KI", "2KI", "1CH", "2CH", "EZR", "NEH", "EST", "JOB", "PSA", "PRO",
    "ECC", "SNG", "ISA", "JER", "LAM", "EZK", "DAN", "HOS", "JOL", "AMO",
    "OBA", "JON", "MIC", "NAM", "HAB", "ZEP", "HAG", "ZEC", "MAL", "MAT",
    "MRK", "LUK", "JHN", "ACT", "ROM", "1CO", "2CO", "GAL", "EPH", "PHP",
    "COL", "1TH", "2TH", "1TI", "2TI", "TIT", "PHM", "HEB", "JAS", "1PE",
    "2PE", "1JN", "2JN", "3JN", "JUD", "REV",
)

MYSQL_ESCAPES = {
    "0": "\0",
    "b": "\b",
    "n": "\n",
    "r": "\r",
    "t": "\t",
    "Z": "\x1a",
    "\\": "\\",
    "'": "'",
    '"': '"',
}


def sha256(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for chunk in iter(lambda: handle.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def _parse_mysql_values(payload: str) -> Iterator[tuple[object, ...]]:
    """Yield rows from one MySQL ``VALUES (...)`` payload."""

    index = 0
    length = len(payload)
    while index < length:
        while index < length and (payload[index].isspace() or payload[index] in ",;"):
            index += 1
        if index >= length:
            return
        if payload[index] != "(":
            raise ValueError(f"Esperado '(' na posição {index}")
        index += 1
        row: list[object] = []

        while True:
            while index < length and payload[index].isspace():
                index += 1
            if index >= length:
                raise ValueError("Linha SQL terminou dentro de uma tupla")

            if payload[index] == "'":
                index += 1
                chars: list[str] = []
                while index < length:
                    char = payload[index]
                    if char == "\\":
                        index += 1
                        if index >= length:
                            raise ValueError("Escape MySQL incompleto")
                        escaped = payload[index]
                        chars.append(MYSQL_ESCAPES.get(escaped, escaped))
                        index += 1
                        continue
                    if char == "'":
                        if index + 1 < length and payload[index + 1] == "'":
                            chars.append("'")
                            index += 2
                            continue
                        index += 1
                        break
                    chars.append(char)
                    index += 1
                else:
                    raise ValueError("String MySQL sem fechamento")
                value: object = "".join(chars)
            else:
                start = index
                while index < length and payload[index] not in ",)":
                    index += 1
                token = payload[start:index].strip()
                if token.upper() == "NULL":
                    value = None
                elif token:
                    value = int(token)
                else:
                    raise ValueError(f"Valor vazio na posição {start}")

            row.append(value)
            while index < length and payload[index].isspace():
                index += 1
            if index >= length:
                raise ValueError("Tupla SQL sem fechamento")
            if payload[index] == ",":
                index += 1
                continue
            if payload[index] == ")":
                index += 1
                yield tuple(row)
                break
            raise ValueError(f"Separador inesperado na posição {index}")


def iter_bibleforge_rows(path: Path) -> Iterator[tuple[object, ...]]:
    with gzip.open(path, "rt", encoding="utf-8", errors="strict") as handle:
        for line in handle:
            if not line.startswith(INSERT_MARKER):
                continue
            payload = line[len(INSERT_MARKER):]
            yield from _parse_mysql_values(payload)


def _pronunciation_fields(raw: object) -> tuple[str, str]:
    if not raw:
        return "", ""
    try:
        data = json.loads(str(raw))
    except (TypeError, ValueError, json.JSONDecodeError):
        return "", ""
    transliteration = str(data.get("sbl") or "")
    pronunciation = str(data.get("dic_mod") or data.get("dic") or "")
    return transliteration, pronunciation


def _ensure_schema(connection: sqlite3.Connection) -> None:
    columns = {
        row[1] for row in connection.execute("PRAGMA table_info(verse_words)").fetchall()
    }
    for name in ("transliteration", "pronunciation", "source"):
        if name not in columns:
            connection.execute(f"ALTER TABLE verse_words ADD COLUMN {name} TEXT")

    connection.executescript(
        """
        CREATE TABLE IF NOT EXISTS strong_metadata(
          key TEXT PRIMARY KEY,
          value TEXT NOT NULL
        );
        """
    )


def import_corpus(source: Path, database: Path) -> dict[str, object]:
    source = source.resolve()
    database = database.resolve()
    if not source.is_file():
        raise FileNotFoundError(source)
    if not database.is_file():
        raise FileNotFoundError(database)

    digest = sha256(source)
    connection = sqlite3.connect(database)
    inserted = 0
    skipped = 0
    books: set[str] = set()
    verses: set[tuple[str, int, int]] = set()
    unique_strong: set[str] = set()
    verse_positions: dict[tuple[str, int, int], int] = {}
    batch: list[tuple[object, ...]] = []

    try:
        connection.execute("PRAGMA foreign_keys=OFF")
        connection.execute("BEGIN IMMEDIATE")
        _ensure_schema(connection)
        connection.execute(
            "DELETE FROM verse_words WHERE translation_id IN ('engwebp', ?)",
            (TRANSLATION_ID,),
        )

        statement = """
            INSERT INTO verse_words(
              translation_id,book_code,chapter,verse,word_index,surface,
              strong,lemma,morph,transliteration,pronunciation,source
            ) VALUES(?,?,?,?,?,?,?,?,?,?,?,?)
        """

        for row in iter_bibleforge_rows(source):
            if len(row) != 13:
                raise ValueError(f"Registro BibleForge com {len(row)} campos; esperado 13")
            (
                _row_id, _verse_id, book_number, chapter, verse, word,
                pronunciation_raw, strong_number, morph, original_order,
                _connected, _parashah, _notes,
            ) = row
            book_number = int(book_number)
            if not 1 <= book_number <= len(BOOK_CODES):
                skipped += 1
                continue
            code = BOOK_CODES[book_number - 1]
            prefix = "H" if book_number <= 39 else "G"
            strong = f"{prefix}{int(strong_number)}" if int(strong_number or 0) else None
            transliteration, pronunciation = _pronunciation_fields(pronunciation_raw)
            verse_key = (code, int(chapter), int(verse))
            # BibleForge has a handful of documented textual alternatives that
            # share ``orig_order``.  A sequential local position preserves both
            # rows without violating Bíblia X's primary key.
            word_index = verse_positions.get(verse_key, 0) + 1
            verse_positions[verse_key] = word_index
            batch.append(
                (
                    TRANSLATION_ID, code, int(chapter), str(int(verse)),
                    word_index, str(word), strong, None, str(morph or ""),
                    transliteration, pronunciation, SOURCE_NAME,
                )
            )
            inserted += 1
            books.add(code)
            verses.add(verse_key)
            if strong:
                unique_strong.add(strong)
            if len(batch) >= 5000:
                connection.executemany(statement, batch)
                batch.clear()

        if batch:
            connection.executemany(statement, batch)

        connection.executescript(
            """
            DROP INDEX IF EXISTS ix_verse_words_strong;
            CREATE INDEX ix_verse_words_strong
              ON verse_words(translation_id,strong,book_code,chapter,verse,word_index);
            CREATE INDEX IF NOT EXISTS ix_verse_words_reference
              ON verse_words(translation_id,book_code,chapter,verse,word_index);
            """
        )
        metadata = {
            "source_name": SOURCE_NAME,
            "source_url": SOURCE_URL,
            "source_license": SOURCE_LICENSE,
            "source_sha256": digest,
            "source_file": source.name,
            "source_rows": str(inserted),
            "source_books": str(len(books)),
            "source_verses": str(len(verses)),
            "source_unique_strong": str(len(unique_strong)),
            "source_translation_id": TRANSLATION_ID,
        }
        connection.executemany(
            "INSERT OR REPLACE INTO strong_metadata(key,value) VALUES(?,?)",
            metadata.items(),
        )
        connection.execute(
            """
            INSERT OR REPLACE INTO schema_migrations(version,name,applied_at)
            VALUES(5,'strong_original_language_corpus',CURRENT_TIMESTAMP)
            """
        )
        connection.commit()
    except Exception:
        connection.rollback()
        raise
    finally:
        connection.close()

    return {
        "inserted": inserted,
        "skipped": skipped,
        "books": len(books),
        "verses": len(verses),
        "unique_strong": len(unique_strong),
        "sha256": digest,
        "source": SOURCE_URL,
        "license": SOURCE_LICENSE,
    }


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("source", type=Path, help="Caminho para bible_original.sql.gz")
    parser.add_argument(
        "--database",
        type=Path,
        default=Path(__file__).resolve().parents[1] / "app/biblia_x/biblia_x.sqlite3",
    )
    args = parser.parse_args()
    print(json.dumps(import_corpus(args.source, args.database), ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
