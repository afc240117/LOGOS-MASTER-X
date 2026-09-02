from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
DYNAMIC = (ROOT / "app/web/static/bible-x-dynamic-controls.js").read_text(encoding="utf-8")
INDEX = (ROOT / "app/web/static/index.html").read_text(encoding="utf-8")


def test_fullscreen_session_uses_the_bible_zoom_as_its_anchor():
    assert "let fullscreenBibleZoom = null" in DYNAMIC
    assert 'fullscreenBibleZoom = getZoom("reader")' in DYNAMIC
    assert 'root.dataset.bxFullscreenZoom = String(fullscreenBibleZoom)' in DYNAMIC


def test_every_selected_module_inherits_the_shared_fullscreen_zoom():
    assert "const inheritedZoom = getFullscreenZoom()" in DYNAMIC
    assert "if (inheritedZoom !== null) setZoom(id, inheritedZoom)" in DYNAMIC
    assert "setZoom(id, inheritedZoom === null ? getZoom(id) : inheritedZoom)" in DYNAMIC


def test_zoom_buttons_keep_reader_and_current_module_synchronized():
    assert 'setZoom("reader", next)' in DYNAMIC
    assert 'if (id !== "reader") setZoom(id, next)' in DYNAMIC
    assert "return setFullscreenZoom" in DYNAMIC
    assert "fullscreenZoom: getFullscreenZoom" in DYNAMIC


def test_v539_assets_force_a_fresh_browser_cache():
    assert "/static/bible-x-dynamic-controls.js?v=5.3.9" in INDEX
    assert "home-summary-pill-fit-v5.3.10" in INDEX
