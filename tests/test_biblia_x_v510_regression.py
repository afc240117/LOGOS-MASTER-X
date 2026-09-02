from pathlib import Path

from app.biblia_x import bible_service as bible
from app.biblia_x import commentary_service as commentary


ROOT = Path(__file__).resolve().parents[1]
JAVASCRIPT = (ROOT / "app/web/static/app-381-v133.js").read_text(encoding="utf-8")
STYLESHEET = (ROOT / "app/web/static/style-v133.css").read_text(encoding="utf-8")
ROUTER = (ROOT / "app/biblia_x/router.py").read_text(encoding="utf-8")


def test_whole_bible_search_accepts_large_pages_and_reports_real_total():
    page = bible.search_text_page(
        "amor",
        "porbr2018",
        limit=1000,
        mode="word",
        scope="all",
    )

    assert page["total"] > 100
    assert len(page["items"]) == page["total"]
    assert {item["book_code"] for item in page["items"]}
    assert all(item["name_pt"] for item in page["items"])


def test_advanced_search_filters_testament_book_chapter_and_selected_books():
    nt = bible.search_text_page("fé", "porbr2018", limit=5000, mode="word", scope="nt")
    assert nt["items"]
    assert all(int(item["canonical_order"]) >= 40 for item in nt["items"])

    john = bible.search_text_page(
        "amor", "porbr2018", limit=5000, mode="word", scope="book", book="JHN"
    )
    assert john["items"]
    assert {item["book_code"] for item in john["items"]} == {"JHN"}

    selected = bible.search_text_page(
        "amor",
        "porbr2018",
        limit=5000,
        mode="word",
        scope="selected",
        books=["JHN", "ROM"],
    )
    assert selected["items"]
    assert {item["book_code"] for item in selected["items"]} <= {"JHN", "ROM"}


def test_concordance_uses_the_bundled_31102_verse_corpus():
    status = bible.corpus_status("porbr2018")
    page = bible.concordance_search("amor", "porbr2018", limit=20)
    top = bible.concordance_top("porbr2018", 10)

    assert status == {
        "ready": True,
        "translation": "porbr2018",
        "translations": 2,
        "verses": 31102,
        "books": 66,
        "chapters": 1189,
    }
    assert page["corpus_verses"] == 31102
    assert page["total"] > 100
    assert page["occurrences"] >= page["total"]
    assert top["verses"] == 31102
    assert top["books"] == 66
    assert len(top["items"]) == 10


def test_comments_have_66_installed_guides_and_cached_classic_sections():
    guides = bible.commentary_guides()
    status = commentary.cached_status()
    cached = commentary.search_cached(book_code="JHN", chapter=4, limit=100)

    assert len(guides) == 66
    assert all(item["server"] and item["content"] for item in guides)
    assert status["ready"] is True
    assert status["sections"] >= 50
    assert cached["total"] >= 4
    assert all(item["license"] == "CC0-1.0" for item in cached["items"])


def test_search_comments_maps_media_zoom_and_fullscreen_are_wired_in_frontend():
    for control in (
        "bxSearchXQuery",
        "bxSearchXFind",
        "bxSearchXResults",
        "bxCommentsFind",
        "bxMapFind",
        "bxMediaAdd",
        "bxPageZoomReset",
        "bxPageFullBtn",
        "bxPageExitFullBtn",
    ):
        assert f'id="{control}"' in JAVASCRIPT

    assert "const bxSearchXRun=async" in JAVASCRIPT
    assert "/api/bible/commentary/search" in JAVASCRIPT
    assert "const bxBuiltinMapRows=[" in JAVASCRIPT
    assert "bxMediaStorageRefresh" in JAVASCRIPT
    assert 'panel.style.setProperty("zoom",`${next}%`,"important")' in JAVASCRIPT
    assert "root.requestFullscreen||root.webkitRequestFullscreen" in JAVASCRIPT
    assert "setFullUi(!!on)" in JAVASCRIPT
    assert "const button=pageButton(id);" in JAVASCRIPT
    assert "if(button)button.click();" in JAVASCRIPT
    assert "/api/bible/status?translation=" in JAVASCRIPT
    assert "const bxInstalledChecks=async" in JAVASCRIPT
    assert "Áudio X" in JAVASCRIPT
    assert ".bx-search-x-result{" in STYLESHEET
    assert ".bible-x-shell.bx-page-full .bx-page-full-active{" in STYLESHEET
    assert "le=5000" in ROUTER
