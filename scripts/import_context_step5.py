#!/usr/bin/env python3
"""Install the Bíblia X Step 5 contextual corpus.

The installer combines two deliberately separate layers:

* 66 concise Portuguese editorial book profiles (project-authored data file);
* Easton's 1897 Bible Dictionary in its original English, distributed by the
  CrossWire Bible Society as Public Domain.

The SWORD zLD reader below is intentionally small and read-only.  It is used
only while building the pre-installed SQLite database; the application itself
does not need SWORD or an internet connection.
"""

from __future__ import annotations

import argparse
import hashlib
import html
import io
import json
from pathlib import Path
import re
import sqlite3
import struct
import urllib.request
import zipfile
import zlib


ROOT = Path(__file__).resolve().parents[1]
DEFAULT_DATABASE = ROOT / "app" / "biblia_x" / "biblia_x.sqlite3"
DEFAULT_PROFILES = (
    ROOT / "app" / "biblia_x" / "resources" / "context_book_profiles_pt.json"
)
EASTON_URL = (
    "https://crosswire.org/ftpmirror/pub/sword/packages/rawzip/Easton.zip"
)
EASTON_LICENSE_URL = (
    "https://crosswire.org/sword/modules/ModInfo.jsp?modName=Easton"
)
EXPECTED_EASTON_SHA256 = (
    "f6dd054554764e2e97d5d189a697eb26039054578a9ccf98ce668ab810341c6e"
)


def _read_source(source: str) -> bytes:
    path = Path(source)
    if path.exists():
        return path.read_bytes()
    with urllib.request.urlopen(source, timeout=90) as response:
        return response.read()


def _zip_member(archive: zipfile.ZipFile, suffix: str) -> bytes:
    name = next(
        (item for item in archive.namelist() if item.lower().endswith(suffix)),
        None,
    )
    if not name:
        raise ValueError(f"Arquivo SWORD ausente no ZIP: {suffix}")
    return archive.read(name)


def _zld_blocks(zdx: bytes, zdt: bytes) -> list[list[str]]:
    blocks: list[list[str]] = []
    if len(zdx) % 8:
        raise ValueError("Índice zLD inválido")
    for cursor in range(0, len(zdx), 8):
        offset, size = struct.unpack_from("<II", zdx, cursor)
        raw = zlib.decompress(zdt[offset : offset + size])
        count = struct.unpack_from("<I", raw, 0)[0]
        entries: list[str] = []
        for entry_index in range(count):
            position, length = struct.unpack_from("<II", raw, 4 + entry_index * 8)
            entries.append(
                raw[position : position + length]
                .rstrip(b"\0")
                .decode("utf-8", "replace")
            )
        blocks.append(entries)
    return blocks


def parse_easton_sword(raw_zip: bytes) -> list[tuple[str, str]]:
    """Return ordered ``(title, TEI)`` entries from the CrossWire zLD module."""

    with zipfile.ZipFile(io.BytesIO(raw_zip)) as archive:
        index = _zip_member(archive, "/easton.idx")
        keys = _zip_member(archive, "/easton.dat")
        blocks = _zld_blocks(
            _zip_member(archive, "/easton.zdx"),
            _zip_member(archive, "/easton.zdt"),
        )
    if len(index) % 8:
        raise ValueError("Índice de verbetes Easton inválido")
    rows: list[tuple[str, str]] = []
    for cursor in range(0, len(index), 8):
        offset, size = struct.unpack_from("<II", index, cursor)
        record = keys[offset : offset + size]
        title_bytes, locator = record.split(b"\r\n", 1)
        block_index, entry_index = struct.unpack("<II", locator)
        rows.append(
            (
                title_bytes.decode("utf-8", "replace").strip(),
                blocks[block_index][entry_index],
            )
        )
    return rows


def clean_tei(value: str, title: str) -> str:
    text = re.sub(r"</(?:p|div|list|item|entryFree)>", "\n\n", value, flags=re.I)
    text = re.sub(r"<(?:lb|br)\s*/?>", "\n", text, flags=re.I)
    text = re.sub(r"<[^>]+>", "", text)
    text = html.unescape(text).replace("\r", "")
    text = re.sub(r"[ \t]+", " ", text)
    text = re.sub(r" *\n *", "\n", text)
    text = re.sub(r"\n{3,}", "\n\n", text).strip()
    if text.casefold().startswith(title.casefold()):
        text = text[len(title) :].lstrip(" \n:—-")
    return text


def _fold(value: str) -> str:
    import unicodedata

    value = unicodedata.normalize("NFKD", str(value or "")).casefold()
    value = "".join(char for char in value if not unicodedata.combining(char))
    return " ".join(re.sub(r"[^a-z0-9]+", " ", value).split())


def classify_article(title: str, body: str) -> list[str]:
    searchable = f" {title} {body[:4000]} ".casefold()
    kinds = {"historical"}
    if any(
        token in searchable
        for token in (
            " book of ", " epistle ", " gospel ", " pentateuch ",
            " psalm ", " prophecy ", " parable ", " poet", " literature",
        )
    ):
        kinds.add("literary")
    if any(
        token in searchable
        for token in (
            " city ", " town ", " village ", " mountain ", " river ",
            " sea ", " island ", " valley ", " wilderness ", " country ",
            " province ", " situated ", " miles ", " region ", " plain ",
        )
    ):
        kinds.add("geographic")
    if any(
        token in searchable
        for token in (
            " custom", " feast", " sacrifice", " priest", " marriage",
            " temple", " synagogue", " coin", " measure", " garment",
            " worship", " rite", " festival", " agriculture", " trade ",
        )
    ):
        kinds.add("cultural")
    return [kind for kind in ("historical", "cultural", "literary", "geographic") if kind in kinds]


def _schema(connection: sqlite3.Connection) -> None:
    connection.executescript(
        """
        DROP TABLE IF EXISTS context_article_fts;
        DROP TABLE IF EXISTS context_articles;
        DROP TABLE IF EXISTS context_book_profiles;
        DROP TABLE IF EXISTS context_metadata;

        CREATE TABLE context_metadata(
          key TEXT PRIMARY KEY,
          value TEXT NOT NULL
        );
        CREATE TABLE context_articles(
          id TEXT PRIMARY KEY,
          title TEXT NOT NULL,
          title_key TEXT NOT NULL,
          body TEXT NOT NULL,
          types_json TEXT NOT NULL,
          language TEXT NOT NULL DEFAULT 'en',
          source TEXT NOT NULL,
          source_license TEXT NOT NULL,
          source_url TEXT NOT NULL,
          source_order INTEGER NOT NULL UNIQUE
        );
        CREATE INDEX ix_context_articles_title_key
          ON context_articles(title_key,source_order);
        CREATE VIRTUAL TABLE context_article_fts USING fts5(
          article_id UNINDEXED,
          title,
          body,
          tokenize='unicode61 remove_diacritics 2'
        );
        CREATE TABLE context_book_profiles(
          book_code TEXT PRIMARY KEY REFERENCES books(code),
          genre TEXT NOT NULL,
          period TEXT NOT NULL,
          authorship TEXT NOT NULL,
          audience TEXT NOT NULL,
          purpose TEXT NOT NULL,
          historical TEXT NOT NULL,
          cultural TEXT NOT NULL,
          literary TEXT NOT NULL,
          geographic TEXT NOT NULL,
          themes_json TEXT NOT NULL,
          places_json TEXT NOT NULL,
          outline_json TEXT NOT NULL,
          key_refs_json TEXT NOT NULL,
          easton_title TEXT,
          source_article_id TEXT REFERENCES context_articles(id),
          editorial_source TEXT NOT NULL,
          source_note TEXT NOT NULL
        );
        """
    )


def install(database: Path, profiles_path: Path, source: str) -> dict[str, object]:
    raw_zip = _read_source(source)
    digest = hashlib.sha256(raw_zip).hexdigest()
    if digest != EXPECTED_EASTON_SHA256:
        raise ValueError(
            "SHA-256 do módulo Easton não corresponde à versão auditada: " + digest
        )
    easton_rows = parse_easton_sword(raw_zip)
    profiles = json.loads(profiles_path.read_text(encoding="utf-8"))
    if not isinstance(profiles, list) or len(profiles) != 66:
        raise ValueError("A fonte editorial precisa conter exatamente 66 perfis")

    connection = sqlite3.connect(database)
    connection.row_factory = sqlite3.Row
    try:
        _schema(connection)
        title_to_id: dict[str, str] = {}
        article_rows = []
        fts_rows = []
        type_counts = {kind: 0 for kind in ("historical", "cultural", "literary", "geographic")}
        for order, (title, tei) in enumerate(easton_rows):
            article_id = f"easton:{order + 1}"
            body = clean_tei(tei, title)
            types = classify_article(title, body)
            for kind in types:
                type_counts[kind] += 1
            article_rows.append(
                (
                    article_id,
                    title,
                    _fold(title),
                    body,
                    json.dumps(types, ensure_ascii=False),
                    "en",
                    "Easton's Bible Dictionary, 3rd ed. (1897)",
                    "Public Domain",
                    EASTON_LICENSE_URL,
                    order,
                )
            )
            fts_rows.append((article_id, title, body))
            title_to_id[title.casefold()] = article_id
        connection.executemany(
            """INSERT INTO context_articles(
              id,title,title_key,body,types_json,language,source,source_license,
              source_url,source_order
            ) VALUES(?,?,?,?,?,?,?,?,?,?)""",
            article_rows,
        )
        connection.executemany(
            "INSERT INTO context_article_fts(article_id,title,body) VALUES(?,?,?)",
            fts_rows,
        )

        book_codes = {
            row[0] for row in connection.execute("SELECT code FROM books").fetchall()
        }
        profile_codes = {str(row.get("code") or "") for row in profiles}
        if profile_codes != book_codes:
            missing = sorted(book_codes - profile_codes)
            extra = sorted(profile_codes - book_codes)
            raise ValueError(f"Perfis incompatíveis; faltam={missing}, extras={extra}")
        profile_rows = []
        for row in profiles:
            easton_title = str(row.get("easton_title") or "").strip()
            article_id = title_to_id.get(easton_title.casefold()) if easton_title else None
            if easton_title and not article_id:
                raise ValueError(f"Verbete Easton não localizado: {easton_title}")
            profile_rows.append(
                (
                    row["code"], row["genre"], row["period"], row["authorship"],
                    row["audience"], row["purpose"], row["historical"],
                    row["cultural"], row["literary"], row["geographic"],
                    json.dumps(row["themes"], ensure_ascii=False),
                    json.dumps(row["places"], ensure_ascii=False),
                    json.dumps(row["outline"], ensure_ascii=False),
                    json.dumps(row["key_refs"], ensure_ascii=False),
                    easton_title or None,
                    article_id,
                    "Bíblia X — síntese editorial em português",
                    (
                        "Síntese contextual do projeto. Autoria e data são apresentadas "
                        "como tradição, dado textual ou questão debatida; o verbete Easton "
                        "permanece separado e no inglês original."
                    ),
                )
            )
        connection.executemany(
            """INSERT INTO context_book_profiles(
              book_code,genre,period,authorship,audience,purpose,historical,
              cultural,literary,geographic,themes_json,places_json,outline_json,
              key_refs_json,easton_title,source_article_id,editorial_source,source_note
            ) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)""",
            profile_rows,
        )
        chapter_count = connection.execute(
            """SELECT COUNT(*) FROM navigation_cache
               WHERE translation_id='porbr2018'"""
        ).fetchone()[0]
        metadata = {
            "schema_version": "5",
            "delivery": "preinstalled-offline",
            "book_profiles": str(len(profile_rows)),
            "chapter_contexts": str(chapter_count),
            "articles": str(len(article_rows)),
            "article_language": "en",
            "profile_language": "pt-BR",
            "editorial_source": "Bíblia X — síntese editorial em português",
            "easton_source": "Easton's Bible Dictionary, 3rd ed. (1897)",
            "easton_module": "CrossWire SWORD Easton 2.0.1",
            "easton_license": "Public Domain",
            "easton_source_url": EASTON_URL,
            "easton_license_url": EASTON_LICENSE_URL,
            "easton_sha256": digest,
            **{f"articles_{kind}": str(total) for kind, total in type_counts.items()},
        }
        connection.executemany(
            "INSERT INTO context_metadata(key,value) VALUES(?,?)", metadata.items()
        )
        connection.commit()
        connection.execute("ANALYZE")
        connection.commit()
        integrity = connection.execute("PRAGMA integrity_check").fetchone()[0]
        if integrity != "ok":
            raise RuntimeError(f"SQLite integrity_check: {integrity}")
        return {
            "database": str(database),
            "profiles": len(profile_rows),
            "chapters": int(chapter_count),
            "articles": len(article_rows),
            "types": type_counts,
            "sha256": digest,
            "integrity": integrity,
        }
    finally:
        connection.close()


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--database", type=Path, default=DEFAULT_DATABASE)
    parser.add_argument("--profiles", type=Path, default=DEFAULT_PROFILES)
    parser.add_argument("--source", default=EASTON_URL)
    args = parser.parse_args()
    print(json.dumps(install(args.database, args.profiles, args.source), ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
