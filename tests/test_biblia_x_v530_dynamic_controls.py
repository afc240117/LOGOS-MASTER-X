import json
import re
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
APP = (ROOT / "app/web/static/app-381-v133.js").read_text(encoding="utf-8")
DYNAMIC = (ROOT / "app/web/static/bible-x-dynamic-controls.js").read_text(encoding="utf-8")
STYLE = (ROOT / "app/web/static/bible-x-dynamic-controls.css").read_text(encoding="utf-8")
INDEX = (ROOT / "app/web/static/index.html").read_text(encoding="utf-8")


def test_universal_toolbar_is_available_on_every_bible_x_page():
    for control in (
        "bxPageSelect",
        "bxDynamicTopClean",
        "bxReadingOptionsBtn",
        "bxPageZoomReset",
        "bxPageFullBtn",
        "bxPageExitFullBtn",
    ):
        assert f'id="{control}"' in APP

    menu_items = set(re.findall(r'data-bible-section="([a-z0-9-]+)"', APP))
    panels = set(re.findall(r'data-bible-panel="([a-z0-9-]+)"', APP))
    assert len(menu_items) == 31
    assert menu_items == panels
    assert 'id="bxCurrentModuleBadge"' not in APP
    assert 'id="bxPrimaryReading"' not in APP
    assert 'id="bxCleanReadingToggle"' not in APP
    assert "bxDynamicModuleGrid" not in DYNAMIC
    assert 'data-bx-control-action="clean"' in APP
    assert "ensureModuleSelect" in DYNAMIC


def test_preferences_are_saved_per_module_and_reader():
    assert 'const STORAGE_KEY = "logosx:bibleXDynamicControls"' in DYNAMIC
    assert "state.modules[id]" in DYNAMIC
    assert "state.reader" in DYNAMIC
    assert "theme: \"dark\"" in DYNAMIC
    assert "width: \"comfortable\"" in DYNAMIC
    assert "spacing: \"comfortable\"" in DYNAMIC
    for theme in ("dark", "sepia", "midnight", "contrast"):
        assert f'value="{theme}"' in DYNAMIC
        if theme != "dark":
            assert f'data-bx-reading-theme="{theme}"' in STYLE


def test_reader_has_real_font_focus_progress_and_auto_reading_controls():
    actions = set(re.findall(r'data-bx-dynamic-action="([^"]+)"', DYNAMIC))
    assert {
        "font-smaller",
        "font-reset",
        "font-larger",
        "focus",
        "auto",
        "fullscreen",
        "clean",
        "reset-module",
    }.issubset(actions)
    assert 'out.style.setProperty("--bx-reader-scale"' in DYNAMIC
    assert "requestAnimationFrame(autoTick)" in DYNAMIC
    assert "SPEEDS[" in DYNAMIC
    assert "bxDynamicProgressBar" in DYNAMIC
    assert "bx-dynamic-current" in DYNAMIC
    assert "#bOut.bx-dynamic-focus" in STYLE


def test_fullscreen_zoom_mobile_and_context_suggestions_are_connected():
    assert "window.LMXBXControlRepair?.full?.(true)" in DYNAMIC
    assert "window.LMXBXControlRepair?.zoom?.(0)" in DYNAMIC
    assert 'window.LMXBXControlRepair = Object.freeze({ version: "5.3.9"' in DYNAMIC
    assert "#bxV167TourToggle" in DYNAMIC
    assert "#bxMediaSlideshow" in DYNAMIC
    assert "#bxMediaPublic360" in DYNAMIC
    assert "@media(max-width:760px)" in STYLE
    assert "overflow-x:auto!important" in STYLE
    assert "min-height:46px!important" in STYLE
    assert "Alt" in DYNAMIC and "Atalhos de teclado" in DYNAMIC


def test_dynamic_assets_load_after_the_main_app_and_audio_x_is_preserved():
    css = "/static/bible-x-dynamic-controls.css?v=5.3.9"
    script = "/static/bible-x-dynamic-controls.js?v=5.3.9"
    app = "/static/app-381-v133.js?v=home-summary-pill-fit-v5.3.10"
    audio = "/static/audio_x/audio-x-menu-plugin.js?v=modular-3-v5.3.9"
    assert css in INDEX
    assert script in INDEX
    assert app in INDEX
    assert audio in INDEX
    assert INDEX.index(app) < INDEX.index(script) < INDEX.index(audio)


def test_release_metadata_is_v539():
    version = json.loads((ROOT / "app/web/static/version.json").read_text(encoding="utf-8"))
    assert version["version"] == "5.3.10"
    assert (ROOT / "VERSION.txt").read_text(encoding="utf-8").startswith("5.3.10")
    assert 'APP_BUILD_VERSION="5.3.10"' in APP
