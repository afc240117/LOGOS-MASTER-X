#!/usr/bin/env python3
"""Import the public-domain BibleForge Greek and Hebrew lexicons into Bíblia X.

The input files are the unmodified ``lexicon_greek.sql.gz`` and
``lexicon_hebrew.sql.gz`` dumps published by BibleForgeDB.  The importer keeps
each source row as a lexical analysis, including the longer sense list,
pronunciation systems, derivation, related entries, notes and (when supplied)
part of speech.  The existing Strong dictionary and original-language corpus
are not modified.
"""

from __future__ import annotations

import argparse
import gzip
import hashlib
import json
from pathlib import Path
import sqlite3
from typing import Iterator

try:
    from scripts.import_strong_originals import _parse_mysql_values
except ModuleNotFoundError:  # Direct execution: ``python scripts/<file>.py``.
    from import_strong_originals import _parse_mysql_values


SOURCE_REPOSITORY = "https://github.com/bibleforge/BibleForgeDB"
SOURCE_LICENSE = "Public Domain / CC0 (BibleForgeDB)"
SOURCE_NAME = "BibleForgeDB Greek and Hebrew Lexicons"
SOURCE_SPECS = {
    "G": {
        "name": "Greek",
        "table": "lexicon_greek",
        "url": (
            "https://raw.githubusercontent.com/bibleforge/BibleForgeDB/"
            "master/lexicon_greek.sql.gz"
        ),
        "sha256": "594d0b5340b673583ee73f1405a7d294d8e7b41913a1275b72689cf4e4304c08",
        "fields": 5,
    },
    "H": {
        "name": "Hebrew",
        "table": "lexicon_hebrew",
        "url": (
            "https://raw.githubusercontent.com/bibleforge/BibleForgeDB/"
            "master/lexicon_hebrew.sql.gz"
        ),
        "sha256": "992a717645101b47c388e055c68b42d04cc941bbcab0dfc548e57f48ef3754a2",
        "fields": 6,
    },
}


def sha256(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for chunk in iter(lambda: handle.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def iter_lexicon_rows(path: Path, table: str) -> Iterator[tuple[object, ...]]:
    marker = f"INSERT INTO `{table}` VALUES "
    with gzip.open(path, "rt", encoding="utf-8", errors="strict") as handle:
        for line in handle:
            if line.startswith(marker):
                yield from _parse_mysql_values(line[len(marker):])


def _flatten_strings(value: object) -> list[str]:
    out: list[str] = []

    def visit(item: object) -> None:
        if isinstance(item, str):
            text = item.strip()
            if text and text not in out:
                out.append(text)
        elif isinstance(item, (list, tuple)):
            for child in item:
                visit(child)
        elif isinstance(item, dict):
            for child in item.values():
                visit(child)

    visit(value)
    return out


def _ensure_schema(connection: sqlite3.Connection) -> None:
    connection.executescript(
        """
        DROP TABLE IF EXISTS lexicon_fts;
        DROP TABLE IF EXISTS lexicon_entries;
        DROP TABLE IF EXISTS lexicon_metadata;

        CREATE TABLE lexicon_entries(
          id TEXT PRIMARY KEY,
          source_row_id INTEGER NOT NULL,
          strong TEXT NOT NULL,
          language TEXT NOT NULL,
          lemma TEXT NOT NULL,
          transliteration TEXT,
          pronunciation TEXT,
          pronunciation_alt TEXT,
          ipa TEXT,
          ipa_mod TEXT,
          definition_short TEXT,
          senses_json TEXT NOT NULL,
          literal TEXT,
          usage TEXT,
          derivation TEXT,
          related_json TEXT NOT NULL,
          comment TEXT,
          part_of_speech TEXT,
          aramaic INTEGER NOT NULL DEFAULT 0,
          source TEXT NOT NULL,
          data_json TEXT NOT NULL,
          UNIQUE(language,source_row_id)
        );
        CREATE INDEX ix_lexicon_entries_strong
          ON lexicon_entries(strong,source_row_id);
        CREATE INDEX ix_lexicon_entries_language
          ON lexicon_entries(language,strong,source_row_id);
        CREATE INDEX ix_lexicon_entries_transliteration
          ON lexicon_entries(transliteration);

        CREATE VIRTUAL TABLE lexicon_fts USING fts5(
          entry_id UNINDEXED,
          strong,
          lemma,
          transliteration,
          definition,
          usage,
          derivation,
          literal,
          comment,
          part_of_speech,
          tokenize='unicode61 remove_diacritics 2'
        );

        CREATE TABLE lexicon_metadata(
          key TEXT PRIMARY KEY,
          value TEXT NOT NULL
        );
        """
    )


def _entry_from_row(prefix: str, row: tuple[object, ...]) -> tuple[object, ...]:
    row_id = int(row[0])
    strong_number = int(row[1])
    lemma = str(row[2] or "")
    raw_data = str(row[3] or "{}")
    usage = str(row[4] or "")
    part_of_speech = str(row[5] or "") if len(row) > 5 else ""
    data = json.loads(raw_data)
    definition = data.get("def") if isinstance(data.get("def"), dict) else {}
    pronunciation = (
        data.get("pronun") if isinstance(data.get("pronun"), dict) else {}
    )
    senses = _flatten_strings(definition.get("long"))
    related = _flatten_strings(data.get("see"))
    strong = f"{prefix}{strong_number}"
    language = "Greek" if prefix == "G" else "Hebrew"
    entry_id = f"{strong}:{row_id}"
    return (
        entry_id,
        row_id,
        strong,
        language,
        lemma,
        str(pronunciation.get("sbl") or ""),
        str(pronunciation.get("dic_mod") or pronunciation.get("dic") or ""),
        str(pronunciation.get("dic") or ""),
        str(pronunciation.get("ipa") or ""),
        str(pronunciation.get("ipa_mod") or ""),
        str(definition.get("short") or ""),
        json.dumps(senses, ensure_ascii=False, separators=(",", ":")),
        str(definition.get("lit") or ""),
        usage,
        str(data.get("deriv") or ""),
        json.dumps(related, ensure_ascii=False, separators=(",", ":")),
        str(data.get("comment") or ""),
        part_of_speech,
        1 if data.get("aramaic") else 0,
        SOURCE_NAME,
        json.dumps(data, ensure_ascii=False, separators=(",", ":")),
    )


def import_lexicons(greek_source: Path, hebrew_source: Path, database: Path) -> dict[str, object]:
    sources = {"G": greek_source.resolve(), "H": hebrew_source.resolve()}
    database = database.resolve()
    for source in sources.values():
        if not source.is_file():
            raise FileNotFoundError(source)
    if not database.is_file():
        raise FileNotFoundError(database)

    digests = {prefix: sha256(path) for prefix, path in sources.items()}
    for prefix, digest in digests.items():
        expected = str(SOURCE_SPECS[prefix]["sha256"])
        if digest != expected:
            raise ValueError(
                f"SHA-256 inesperado para {sources[prefix].name}: {digest}; esperado {expected}"
            )

    counts = {"G": 0, "H": 0}
    sense_count = 0
    unique_strong: set[str] = set()
    entries: list[tuple[object, ...]] = []

    for prefix, source in sources.items():
        spec = SOURCE_SPECS[prefix]
        for row in iter_lexicon_rows(source, str(spec["table"])):
            if len(row) != int(spec["fields"]):
                raise ValueError(
                    f"Registro {spec['table']} com {len(row)} campos; esperado {spec['fields']}"
                )
            entry = _entry_from_row(prefix, row)
            entries.append(entry)
            counts[prefix] += 1
            unique_strong.add(str(entry[2]))
            sense_count += len(json.loads(str(entry[11])))

    connection = sqlite3.connect(database)
    try:
        connection.execute("PRAGMA foreign_keys=OFF")
        connection.execute("BEGIN IMMEDIATE")
        _ensure_schema(connection)
        connection.executemany(
            """
            INSERT INTO lexicon_entries(
              id,source_row_id,strong,language,lemma,transliteration,
              pronunciation,pronunciation_alt,ipa,ipa_mod,definition_short,
              senses_json,literal,usage,derivation,related_json,comment,
              part_of_speech,aramaic,source,data_json
            ) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
            """,
            entries,
        )
        connection.executemany(
            """
            INSERT INTO lexicon_fts(
              entry_id,strong,lemma,transliteration,definition,usage,
              derivation,literal,comment,part_of_speech
            ) VALUES(?,?,?,?,?,?,?,?,?,?)
            """,
            [
                (
                    entry[0],
                    entry[2],
                    entry[4],
                    entry[5],
                    " ".join([str(entry[10] or ""), *json.loads(str(entry[11]))]),
                    entry[13],
                    entry[14],
                    entry[12],
                    entry[16],
                    entry[17],
                )
                for entry in entries
            ],
        )
        metadata = {
            "source_name": SOURCE_NAME,
            "source_repository": SOURCE_REPOSITORY,
            "source_license": SOURCE_LICENSE,
            "greek_source_file": sources["G"].name,
            "greek_source_url": SOURCE_SPECS["G"]["url"],
            "greek_source_sha256": digests["G"],
            "greek_entries": str(counts["G"]),
            "hebrew_source_file": sources["H"].name,
            "hebrew_source_url": SOURCE_SPECS["H"]["url"],
            "hebrew_source_sha256": digests["H"],
            "hebrew_entries": str(counts["H"]),
            "total_entries": str(len(entries)),
            "unique_strong": str(len(unique_strong)),
            "long_senses": str(sense_count),
        }
        connection.executemany(
            "INSERT INTO lexicon_metadata(key,value) VALUES(?,?)",
            metadata.items(),
        )
        connection.execute(
            """
            INSERT OR REPLACE INTO schema_migrations(version,name,applied_at)
            VALUES(6,'bibleforge_greek_hebrew_lexicons',CURRENT_TIMESTAMP)
            """
        )
        connection.commit()
    except Exception:
        connection.rollback()
        raise
    finally:
        connection.close()

    return {
        "entries": len(entries),
        "greek": counts["G"],
        "hebrew": counts["H"],
        "unique_strong": len(unique_strong),
        "long_senses": sense_count,
        "sources": {
            prefix: {
                "path": str(sources[prefix]),
                "sha256": digests[prefix],
                "url": SOURCE_SPECS[prefix]["url"],
            }
            for prefix in ("G", "H")
        },
        "license": SOURCE_LICENSE,
    }


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("greek_source", type=Path)
    parser.add_argument("hebrew_source", type=Path)
    parser.add_argument(
        "--database",
        type=Path,
        default=Path(__file__).resolve().parents[1] / "app/biblia_x/biblia_x.sqlite3",
    )
    args = parser.parse_args()
    result = import_lexicons(args.greek_source, args.hebrew_source, args.database)
    print(json.dumps(result, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
