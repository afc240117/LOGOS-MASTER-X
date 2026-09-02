from pathlib import Path

from fastapi.testclient import TestClient

from app.biblia_x import bible_service as context
from app.main import app


ROOT = Path(__file__).resolve().parents[1]
JAVASCRIPT = (ROOT / "app/web/static/app-381-v133.js").read_text(encoding="utf-8")
STYLESHEET = (ROOT / "app/web/static/style-v133.css").read_text(encoding="utf-8")


def test_step5_context_corpus_is_complete_and_preinstalled():
    status = context.context_status()

    assert status["ready"] is True
    assert status["profiles"] == 66
    assert status["chapters"] == 1_189
    assert status["articles"] == 3_963
    assert status["types"] == {
        "historical": 3_963,
        "cultural": 832,
        "literary": 250,
        "geographic": 1_062,
    }
    assert status["metadata"]["easton_license"] == "Public Domain"
    assert status["metadata"]["easton_sha256"] == (
        "f6dd054554764e2e97d5d189a697eb26039054578a9ccf98ce668ab810341c6e"
    )


def test_context_search_understands_portuguese_books_passages_and_aliases():
    passage = context.context_search("Isaías 6", limit=10)
    assert passage["total"] == 1
    assert passage["parsed_reference"]["book_code"] == "ISA"
    assert passage["items"][0]["title"] == "Isaías"
    assert passage["items"][0]["requested_chapter"] == 6

    corinth = context.context_search("Corinto", limit=10)
    assert {row["book_code"] for row in corinth["items"] if row["kind"] == "book"} >= {
        "1CO",
        "2CO",
    }
    assert next(row for row in corinth["items"] if row["kind"] == "article")["title"] == "CORINTH"

    temple = context.context_search("templo", "cultural", limit=10)
    assert temple["articles_total"] > 100
    assert all("cultural" in row["types"] for row in temple["items"])


def test_book_snapshot_separates_editorial_profile_and_historical_source():
    item = context.context_book_snapshot("porbr2018", "ISA", 6, "1")

    assert item["title"] == "Isaías"
    assert "debat" in item["authorship"].lower()
    assert item["chapter"]["number"] == 6
    assert item["chapter"]["verse_count"] == 13
    assert item["chapter"]["selected_text"]
    assert item["chapter"]["previous_reference"] == "Isaías 5"
    assert item["chapter"]["next_reference"] == "Isaías 7"
    assert item["chapter"]["original_terms"]
    assert item["historical_source"]["title"] == "ISAIAH, THE BOOK OF"
    assert item["historical_source"]["language"] == "en"
    assert item["historical_source"]["license"] == "Public Domain"


def test_easton_article_keeps_original_language_source_and_warning():
    result = context.context_search("Genesis", limit=10)
    article_row = next(row for row in result["items"] if row["kind"] == "article")
    article = context.get_context_article(article_row["id"])

    assert article["title"] == "GENESIS"
    assert article["language"] == "en"
    assert article["source_license"] == "Public Domain"
    assert "1897" in article["source"]
    assert "inglês original" in article["source_note_pt"]
    assert len(article["body"]) > 1_000


def test_step5_context_api_endpoints_and_legacy_popup_route():
    client = TestClient(app)

    assert client.get("/api/bible/context/status").json()["profiles"] == 66

    search = client.get("/api/bible/context/search", params={"q": "Isaías 6"})
    assert search.status_code == 200
    assert search.json()["items"][0]["book_code"] == "ISA"

    book = client.get(
        "/api/bible/context/book",
        params={
            "book": "ISA",
            "translation": "porbr2018",
            "chapter": 6,
            "verse": "1",
        },
    )
    assert book.status_code == 200
    assert book.json()["chapter"]["topics"]
    assert book.json()["chapter"]["crossrefs"]

    legacy = client.get(
        "/api/bible/context",
        params={
            "translation": "porbr2018",
            "book": "ISA",
            "chapter": 6,
            "verse": "1",
        },
    )
    assert legacy.status_code == 200
    assert legacy.json()["profile"]["title"] == "Isaías"


def test_step5_frontend_uses_server_bank_and_keeps_personal_data_separate():
    assert "ETAPA 5 • CONCLUÍDA" in JAVASCRIPT
    assert 'id="bxContextStatus"' in JAVASCRIPT
    assert "/api/bible/context/status" in JAVASCRIPT
    assert "/api/bible/context/search" in JAVASCRIPT
    assert "/api/bible/context/book" in JAVASCRIPT
    assert "/api/bible/context/article" in JAVASCRIPT
    assert "Complementos contextuais pessoais" in JAVASCRIPT
    assert "Limpar somente seus complementos contextuais pessoais?" in JAVASCRIPT
    assert 'id="bxContextExample"' not in JAVASCRIPT
    assert "Abrir Contexto X completo" in JAVASCRIPT


def test_step5_context_layout_is_readable_on_desktop_and_mobile():
    assert ".bx-context-status{display:grid" in STYLESHEET
    assert '.bible-x-section[data-bible-panel="context"] .bx-context-layout{' in STYLESHEET
    assert ".bx-context-pager{display:grid" in STYLESHEET
    assert ".bx-context-article-body{" in STYLESHEET
    assert "@media(max-width:620px)" in STYLESHEET
    assert ".bx-context-resource>div{display:grid;grid-template-columns:1fr 1fr}" in STYLESHEET
