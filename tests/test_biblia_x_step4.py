from pathlib import Path

from fastapi.testclient import TestClient

from app.biblia_x import bible_service as lexicon
from app.main import app
from scripts.import_bibleforge_lexicons import _flatten_strings


ROOT = Path(__file__).resolve().parents[1]
JAVASCRIPT = (ROOT / "app/web/static/app-381-v133.js").read_text(encoding="utf-8")
STYLESHEET = (ROOT / "app/web/static/style-v133.css").read_text(encoding="utf-8")


def test_bundled_bibleforge_lexicons_are_complete():
    status = lexicon.lexicon_status()

    assert status["ready"] is True
    assert status["entries"] == {
        "total": 14_812,
        "hebrew": 9_289,
        "greek": 5_523,
        "unique_strong": 14_197,
        "long_senses": 37_789,
    }
    assert status["corpus"]["words"] == 446_232
    assert status["corpus"]["forms"] == 134_078
    assert status["metadata"]["source_license"] == "Public Domain / CC0 (BibleForgeDB)"
    assert status["metadata"]["greek_source_sha256"] == (
        "594d0b5340b673583ee73f1405a7d294d8e7b41913a1275b72689cf4e4304c08"
    )
    assert status["metadata"]["hebrew_source_sha256"] == (
        "992a717645101b47c388e055c68b42d04cc941bbcab0dfc548e57f48ef3754a2"
    )


def test_lexicon_search_supports_strong_scripts_transliteration_and_portuguese_aliases():
    exact = lexicon.lexicon_search("G0026", limit=10)
    assert exact["total"] == 1
    assert exact["items"][0]["id"] == "G26:26"

    assert lexicon.lexicon_search("agape", "G", 10)["items"][0]["strong"] == "G26"
    assert lexicon.lexicon_search("אֱלֹהִים", "H", 10)["items"][0]["strong"] == "H430"

    love = {row["strong"] for row in lexicon.lexicon_search("amor", limit=20)["items"]}
    assert {"G25", "G26", "G5368", "H157", "H2617"}.issubset(love)

    faith = {row["strong"] for row in lexicon.lexicon_search("fé", limit=20)["items"]}
    assert faith == {"G4102", "H539"}


def test_lexicon_entry_has_real_senses_forms_morphology_roots_and_variants():
    greek = lexicon.get_lexicon_entry(strong="G4102")
    assert greek["lemma"] == "πίστις"
    assert greek["transliteration"] == "pistis"
    assert greek["sense_count"] == 9
    assert greek["forms_total"] == 10
    assert greek["occurrence_count"] == 244
    assert greek["morphologies"][0]["morph"] == "N-GSF"
    assert greek["related"] == ["G3982"]

    hebrew = lexicon.get_lexicon_entry(strong="H2617")
    assert hebrew["lemma"] == "חֵסֵד"
    assert hebrew["part_of_speech_pt"] == "substantivo masculino"
    assert hebrew["variant_count"] == 2
    assert hebrew["occurrence_count"] == 247
    assert hebrew["related"] == ["H2616"]


def test_lexicon_occurrences_can_be_filtered_by_original_form():
    page = lexicon.lexicon_occurrence_page(
        "G26", limit=10, translation_id="porbr2018", surface="ἀγάπη"
    )
    assert page["number"] == "G26"
    assert page["surface"] == "ἀγάπη"
    assert page["total"] == 36
    assert len(page["items"]) == 10
    assert all(row["surface"] == "ἀγάπη" for row in page["items"])
    assert all(row["verse_text"] for row in page["items"])


def test_step4_lexicon_api_endpoints():
    client = TestClient(app)

    status = client.get("/api/bible/lexicon/status")
    assert status.status_code == 200
    assert status.json()["entries"]["total"] == 14_812

    search = client.get(
        "/api/bible/lexicon/search", params={"q": "fé", "language": "G"}
    )
    assert search.status_code == 200
    assert search.json()["items"][0]["strong"] == "G4102"

    entry = client.get("/api/bible/lexicon/entry", params={"id": "G26:26"})
    assert entry.status_code == 200
    assert entry.json()["sense_count"] == 2
    assert entry.json()["forms_total"] == 7

    occurrences = client.get(
        "/api/bible/lexicon/occurrences",
        params={
            "number": "G26",
            "translation": "porbr2018",
            "surface": "ἀγάπη",
            "limit": 2,
        },
    )
    assert occurrences.status_code == 200
    assert occurrences.json()["total"] == 36


def test_step4_frontend_uses_preinstalled_server_lexicon_and_mobile_layout():
    assert 'id="bxLexStatus"' in JAVASCRIPT
    assert '/api/bible/lexicon/status' in JAVASCRIPT
    assert '/api/bible/lexicon/search' in JAVASCRIPT
    assert '/api/bible/lexicon/entry' in JAVASCRIPT
    assert 'data-lex-surface' in JAVASCRIPT
    assert 'Complementos lexicais pessoais' in JAVASCRIPT
    assert 'id="bxLexExample"' not in JAVASCRIPT
    assert '.bx-lex-status{display:grid' in STYLESHEET
    assert '@media(max-width:560px)' in STYLESHEET
    assert '.bx-lex-forms{grid-template-columns:repeat(2,minmax(0,1fr))' in STYLESHEET


def test_nested_bibleforge_senses_are_flattened_without_duplicates():
    assert _flatten_strings(["one", ["two", ["one", "three"]]]) == [
        "one",
        "two",
        "three",
    ]
