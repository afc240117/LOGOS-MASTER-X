import re
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
JAVASCRIPT = (ROOT / "app/web/static/app-381-v133.js").read_text(encoding="utf-8")
STYLESHEET = (ROOT / "app/web/static/style-v133.css").read_text(encoding="utf-8")


def _literal_ids(pattern: str) -> set[str]:
    return {
        value
        for value in re.findall(pattern, JAVASCRIPT)
        if re.fullmatch(r"[a-z][a-z0-9-]*", value)
    }


def test_every_bible_x_menu_item_has_one_exclusive_panel():
    menu_items = _literal_ids(r'<button[^>]+data-bible-section="([^"]+)"')
    panels = _literal_ids(r'data-bible-panel="([^"]+)"')

    assert len(menu_items) == 31
    assert menu_items == panels
    assert {
        "reader", "cross", "strong", "lexicon", "context", "maps", "media", "dna"
    }.issubset(menu_items)


def test_activation_hides_every_inactive_panel_semantically():
    assert 'panel.hidden=!active' in JAVASCRIPT
    assert 'panel.setAttribute("aria-hidden",active?"false":"true")' in JAVASCRIPT
    assert 'button.setAttribute("aria-current",active?"page":"false")' in JAVASCRIPT
    assert 'activate("reader",{scroll:false,smooth:false})' in JAVASCRIPT

    assert '.bible-x-shell [data-bible-panel]{' in STYLESHEET
    assert '.bible-x-shell [data-bible-panel].active:not([hidden]){' in STYLESHEET
    assert '.bible-x-shell [data-bible-panel][hidden]{' in STYLESHEET


def test_each_active_page_has_zoom_and_fullscreen_controls():
    actions = set(re.findall(r'data-bx-page-action="([^"]+)"', JAVASCRIPT))
    assert actions == {"smaller", "reset", "larger", "fullscreen", "exit"}
    assert 'Store.get("bibleXPageZoom",{})' in JAVASCRIPT
    assert 'root.classList.toggle("bx-page-full",!!on)' in JAVASCRIPT
    assert 'root.requestFullscreen' in JAVASCRIPT
    assert 'document.exitFullscreen' in JAVASCRIPT
    assert '.bible-x-shell.bx-page-full{' in STYLESHEET


def test_mobile_uses_compact_page_selector_and_primary_shortcuts():
    assert 'id="bxPageSelect"' in JAVASCRIPT
    assert 'data-bxm="reader"' in JAVASCRIPT
    assert 'data-bxm="cross"' in JAVASCRIPT
    assert 'data-bxm="strong"' in JAVASCRIPT
    assert 'data-bxm="maps"' in JAVASCRIPT
    assert 'data-bxm="pages"' in JAVASCRIPT
    assert 'body.bx-mobile-app .bible-x-sidebar{display:none!important}' in STYLESHEET
    assert 'body.bx-mobile-app .bx-page-select-wrap{' in STYLESHEET
