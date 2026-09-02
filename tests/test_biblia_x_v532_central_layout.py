import re
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
APP = (ROOT / "app/web/static/app-381-v133.js").read_text(encoding="utf-8")
DYNAMIC = (ROOT / "app/web/static/bible-x-dynamic-controls.js").read_text(encoding="utf-8")
STYLE = (ROOT / "app/web/static/bible-x-dynamic-controls.css").read_text(encoding="utf-8")
INDEX = (ROOT / "app/web/static/index.html").read_text(encoding="utf-8")
AUDIO_PLUGIN = (ROOT / "app/web/static/audio_x/audio-x-menu-plugin.js").read_text(encoding="utf-8")


def test_internal_sidebar_is_hidden_only_after_central_selector_is_ready():
    assert 'id="bxPageSelect"' in APP
    assert 'classList?.add("bx-central-nav-ready")' in DYNAMIC
    assert '.bible-x-shell.bx-central-nav-ready' in STYLE
    assert 'body .bible-x-shell.bx-central-nav-ready>.bible-x-sidebar{' in STYLE
    assert 'display:none!important' in STYLE
    assert '.app-sidebar' not in STYLE.split(
        'body .bible-x-shell.bx-central-nav-ready>.bible-x-sidebar{', 1
    )[1].split('}', 1)[0]


def test_central_panel_uses_remaining_width_on_desktop_and_mobile():
    assert 'grid-template-columns:minmax(0,1fr)!important' in STYLE
    assert '.bible-x-shell.bx-central-nav-ready>.bible-x-main{' in STYLE
    assert 'max-width:none!important' in STYLE
    assert 'max-width:1440px!important' in STYLE
    assert 'body.bx-mobile-app .bible-x-shell.bx-central-nav-ready' in STYLE
    assert 'width:100%!important' in STYLE


def test_all_modules_stay_available_through_the_single_selector():
    menu_items = set(re.findall(r'data-bible-section="([a-z0-9-]+)"', APP))
    panels = set(re.findall(r'data-bible-panel="([a-z0-9-]+)"', APP))
    assert len(menu_items) == 31
    assert set(menu_items) == set(panels)
    assert 'ensureModuleSelect' in DYNAMIC
    assert 'button.click()' in DYNAMIC


def test_primary_logos_menu_and_audio_x_are_not_removed():
    assert 'data-view="studio"' in INDEX
    assert 'data-view="bible"' in INDEX
    assert 'Áudio X' in AUDIO_PLUGIN
    assert 'bible.insertAdjacentElement("afterend",btn)' in AUDIO_PLUGIN
    assert '.sidebar{display:none' not in STYLE
