import sqlite3

from fastapi.testclient import TestClient

from app.biblia_x import bible_service as strong
from app.main import app
from scripts.import_strong_originals import _parse_mysql_values


def test_strong_number_normalization_and_ranked_search():
    assert strong.normalize_strong_number("G0026") == "G26"
    assert strong.normalize_strong_number(" h0430 ") == "H430"
    assert strong.normalize_strong_number("X26") == ""

    exact = strong.strong_search("G0026", limit=10)
    assert exact["total"] == 1
    assert exact["items"][0]["number"] == "G26"

    assert strong.strong_search("agape", "G", limit=3)["items"][0]["number"] == "G26"
    assert strong.strong_search("elohim", "H", limit=3)["items"][0]["number"] == "H430"
    assert strong.strong_search("chesed", "H", limit=3)["items"][0]["number"] == "H2617"


def test_bundled_strong_dictionary_and_original_corpus_are_complete():
    status = strong.strong_status()
    assert status["ready"] is True
    assert status["lexicon"] == {"total": 14_197, "hebrew": 8_674, "greek": 5_523}
    assert status["corpus"]["words"] == 446_232
    assert status["corpus"]["books"] == 66
    assert status["corpus"]["verses"] == 31_232
    assert status["corpus"]["unique_strong"] == 14_097

    with sqlite3.connect(str(strong.DB_PATH)) as connection:
        obsolete = connection.execute(
            "SELECT COUNT(*) FROM verse_words WHERE translation_id='engwebp'"
        ).fetchone()[0]
    assert obsolete == 0


def test_original_language_words_are_accurate_at_known_references():
    genesis = strong.get_strong("porbr2018", "GEN", 1, "1")
    assert [row["strong"] for row in genesis] == [
        "H7225", "H1254", "H430", "H853", "H8064", "H853", "H776"
    ]
    assert [row["surface"] for row in genesis][:3] == [
        "בְּרֵאשִׁ֖ית", "בָּרָ֣א", "אֱלֹהִ֑ים"
    ]

    john = strong.get_strong("porbr2018", "JHN", 3, "16")
    numbers = [row["strong"] for row in john]
    assert len(john) == 26
    assert {"G25", "G2316", "G2889", "G3439", "G4100", "G2222"}.issubset(numbers)
    assert john[0]["surface"] == "Οὕτως"


def test_occurrences_are_paged_and_joined_to_portuguese_verse_text():
    page = strong.strong_occurrence_page("G0026", limit=2, translation_id="porbr2018")
    assert page["number"] == "G26"
    assert page["total"] == 116
    assert len(page["items"]) == 2
    assert all(item["reference_pt"] for item in page["items"])
    assert all(item["surface"] for item in page["items"])
    assert all(item["verse_text"] for item in page["items"])


def test_step3_strong_api_endpoints():
    client = TestClient(app)

    status = client.get("/api/bible/strong/status")
    assert status.status_code == 200
    assert status.json()["corpus"]["words"] == 446_232

    search = client.get("/api/bible/strong/search", params={"q": "G0026"})
    assert search.status_code == 200
    assert search.json()["items"][0]["number"] == "G26"

    entry = client.get("/api/bible/strong/entry", params={"number": "H0430"})
    assert entry.status_code == 200
    assert entry.json()["number"] == "H430"
    assert entry.json()["occurrence_count"] == 2_602

    occurrences = client.get(
        "/api/bible/strong/occurrences",
        params={"number": "G26", "translation": "porbr2018", "limit": 2},
    )
    assert occurrences.status_code == 200
    assert occurrences.json()["total"] == 116

    words = client.get(
        "/api/bible/strong",
        params={"translation": "porbr2018", "book": "GEN", "chapter": 1, "verse": "1"},
    )
    assert words.status_code == 200
    assert [row["strong"] for row in words.json()["words"]] == [
        "H7225", "H1254", "H430", "H853", "H8064", "H853", "H776"
    ]


def test_mysql_dump_parser_preserves_nulls_numbers_and_escapes():
    payload = r"(1,'linha\nseguinte',NULL,-2),(2,'it\'s',3,4);"
    assert list(_parse_mysql_values(payload)) == [
        (1, "linha\nseguinte", None, -2),
        (2, "it's", 3, 4),
    ]
