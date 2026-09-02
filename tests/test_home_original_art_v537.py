from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
APP = (ROOT / "app/web/static/app-381-v133.js").read_text(encoding="utf-8")
CSS = (ROOT / "app/web/static/style-v133.css").read_text(encoding="utf-8")


def _block(start: str, end: str) -> str:
    begin = APP.index(start)
    return APP[begin : APP.index(end, begin)]


def test_desktop_home_uses_the_original_image_without_visible_duplicate_controls():
    dashboard = _block('dashboard(){', ' quick(){')
    desktop = _block('function homeDesktopControls', 'function homeMobileControls')

    assert 'class="reference-body-img"' in dashboard
    assert '${homeDesktopControls(actions)}' in dashboard
    assert 'home-art-interactions' in desktop
    assert 'home-art-hotspot' in APP
    assert 'home-ribbon-real' not in desktop
    assert 'home-primary-real' not in desktop
    assert 'home-feature-real' not in desktop
    assert 'home-edit-actions' not in desktop
    assert 'home-system-v536' not in desktop


def test_all_art_elements_have_calibrated_click_regions():
    for action_id in (
        "bible", "study", "preaching", "revival", "studio", "about",
        "dna", "context", "applications", "preparation", "aihub", "mobile",
    ):
        assert f'.desktop-reference-home .home-hotspot-{action_id}' in CSS

    assert 'top:51.0%!important' in CSS       # menu desenhado na arte
    assert 'top:66.15%!important' in CSS      # Acessar Studio
    assert 'top:75.55%!important' in CSS      # cartões inferiores
    assert 'opacity:0!important' in CSS
    assert 'pointer-events:auto!important' in CSS


def test_editing_is_contextual_and_does_not_add_a_permanent_menu():
    binding = _block('function bindHomeDashboard', 'function themeHomeAsset')
    assert 'addEventListener("contextmenu",edit)' in binding
    assert 'addEventListener("pointerdown"' in binding
    assert 'setTimeout' in binding and '650' in binding
    assert 'e.altKey||e.shiftKey' in binding
    assert 'openHomeActionsEditor(b.dataset.homeAction)' in binding
    assert '.home-mobile-edit-help{display:none!important}' in CSS


def test_system_values_are_embedded_in_the_existing_art_panel():
    live = _block('function homeArtLiveValues', 'function homeDesktopControls')
    for key in ("online", "version", "dna", "quality", "update", "mode"):
        assert f'data-home-status="{key}"' in live
    assert '.home-art-live-desktop .home-art-value-version' in CSS
    assert '.mobile-home-info .home-art-value-version' in CSS
    assert 'data-home-system-details' in APP
    assert 'function openHomeSystemDetails' in APP


def test_mobile_uses_hotspots_on_the_existing_image_slices_only():
    dashboard = _block('dashboard(){', ' quick(){')
    assert 'mobile-home-features-a' in dashboard
    assert 'mobile-home-features-b' in dashboard
    assert 'home-mobile-hotspot' in dashboard
    assert 'home-mobile-command-center' not in dashboard
    assert '.mobile-home-hero .home-hotspot-bible' in CSS
    assert '.mobile-home-features-b .home-hotspot-mobile' in CSS
