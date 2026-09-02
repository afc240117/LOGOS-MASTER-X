import sqlite3

from app.biblia_x import study_resources as resources


def test_nave_parser_covers_all_books_and_repeated_references():
    refs = resources.parse_nave_references(
        "Ex 6:16-20; Jos 21:4,10; 1Ch 6:2,3; 23:13; Jud 6:12; Jude 1:3"
    )
    assert ("EXO", 6, 16, 20, 0) in refs
    assert ("JOS", 21, 10, 10, 0) in refs
    assert ("1CH", 23, 13, 13, 0) in refs
    assert ("JDG", 6, 12, 12, 0) in refs
    assert ("JUD", 1, 3, 3, 0) in refs


def test_fresh_step2_database_migrates_and_supports_whole_chapters(tmp_path, monkeypatch):
    monkeypatch.setattr(resources, "DB", tmp_path / "step2.sqlite3")
    sample = "\n" * 20 + """
   TEST TOPIC
          -Main references Ge 1:1-2; Ex 3; Jud 6:12; Jude 1:3
"""
    assert resources.install_nave(sample) == (1, 4)

    con = resources.db()
    cross_columns = {row[1] for row in con.execute("PRAGMA table_info(crossrefs)")}
    nave_columns = {row[1] for row in con.execute("PRAGMA table_info(nave_refs)")}
    con.close()
    assert "anchor" in cross_columns
    assert {"whole_chapter", "section"}.issubset(nave_columns)

    topics = resources.nave_for_verse("EXO", 3, 15, 10)
    assert len(topics) == 1
    detail = resources.nave_topic(topics[0]["topic_id"], 10)
    assert any(item["reference"] == "Êxodo 3" for item in detail["items"])


def test_legacy_step2_schema_is_migrated_without_data_loss(tmp_path, monkeypatch):
    legacy = tmp_path / "legacy.sqlite3"
    con = sqlite3.connect(legacy)
    con.executescript("""
      CREATE TABLE metadata(key TEXT PRIMARY KEY,value TEXT);
      CREATE TABLE crossrefs(id INTEGER PRIMARY KEY,from_book TEXT,from_chapter INTEGER,from_verse INTEGER,to_book TEXT,to_chapter INTEGER,to_verse_start INTEGER,to_verse_end INTEGER,votes INTEGER,source TEXT);
      CREATE TABLE nave_topics(id INTEGER PRIMARY KEY,topic TEXT,section TEXT,raw TEXT);
      CREATE TABLE nave_refs(topic_id INTEGER,book_code TEXT,chapter INTEGER,verse_start INTEGER,verse_end INTEGER);
      INSERT INTO nave_topics VALUES(1,'FAITH','','');
      INSERT INTO nave_refs VALUES(1,'JHN',3,16,16);
    """)
    con.commit();con.close()
    monkeypatch.setattr(resources, "DB", legacy)
    con = resources.db()
    assert con.execute("SELECT COUNT(*) FROM nave_refs").fetchone()[0] == 1
    assert "anchor" in {row[1] for row in con.execute("PRAGMA table_info(crossrefs)")}
    assert "topic_pt" in {row[1] for row in con.execute("PRAGMA table_info(nave_topics)")}
    assert "whole_chapter" in {row[1] for row in con.execute("PRAGMA table_info(nave_refs)")}
    con.close()


def test_bundled_tsk_and_nave_are_complete_enough_for_offline_use():
    status = resources.status()
    assert status["counts"]["crossrefs"] > 300_000
    assert status["counts"]["crossref_verses"] > 29_000
    assert status["counts"]["nave_topics"] > 5_000
    assert status["counts"]["nave_refs"] > 70_000
    assert status["metadata"]["nave_parser_version"] == "2"

    references = resources.crossrefs("JHN", 3, 16, 30)
    assert any(item["reference"] == "Romanos 5:8" for item in references)

    faith = resources.search_nave_topics("fé", 10)
    assert [item["topic"] for item in faith] == ["Fé"]
