from pathlib import Path
import json


ROOT = Path(__file__).resolve().parents[1]
APP = (ROOT / "app/web/static/app-381-v133.js").read_text(encoding="utf-8")
CSS = (ROOT / "app/web/static/style-v133.css").read_text(encoding="utf-8")
INDEX = (ROOT / "app/web/static/index.html").read_text(encoding="utf-8")
MAIN = (ROOT / "app/main.py").read_text(encoding="utf-8")


def test_studio_has_two_clean_responsive_profile_views():
    assert 'data-dna-view-mode="compact"' in APP
    assert 'Cards Clean' in APP
    assert 'data-dna-view-mode="list"' in APP
    assert 'Lista Minimal' in APP
    assert 'studio-dna-view-${graphMode}' in APP
    assert 'Store.set("studioDNAViewMode",mode)' in APP
    assert ".studio-wizard.studio-dna-view-compact .dna-profile-grid" in CSS
    assert ".studio-wizard.studio-dna-view-list .dna-profile-card" in CSS
    assert ".dna-score-clean-track" in CSS


def test_all_seven_top_steps_and_bottom_ovals_are_directly_navigable():
    assert APP.count('data-studio-step="${n}" role="button" tabindex="0"') == 7
    assert 'onclick="return window.LMXStudioGoStep' not in APP
    assert 'const STUDIO_STEP_LABELS=[' in APP
    assert 'className="studio-step-dots"' in APP
    assert 'data-studio-dot-step="${n}"' in APP
    assert 'installStudioStepNavigation();' in APP
    assert '.studio-step-dots button.active' in CSS
    assert '.dna-nextbar' in APP  # os controles Anterior/Avançar existentes continuam presentes


def test_direct_step_six_is_safe_and_requires_generate_confirmation():
    assert 'req.status!=="ready"' in APP
    assert 'previewOnly:true' in APP
    assert 'A geração só começa após confirmar na Etapa 5' in APP
    assert 'requestState.status==="ready"' in APP
    assert 'logos:studio-step-leave' in APP
    assert 'Processamento pausado ao trocar de etapa' in APP


def test_classic_home_uses_invisible_editable_hotspots_and_native_live_values():
    for action_id in (
        "bible", "study", "preaching", "revival", "studio", "about",
        "dna", "context", "applications", "preparation", "aihub", "mobile",
    ):
        assert f'id:"{action_id}"' in APP
    assert 'class="home-art-hotspot home-hotspot-${escapeHtml(id)}' in APP
    assert 'data-home-action="${escapeHtml(id)}"' in APP
    assert 'data-home-system-details' in APP
    assert 'contextmenu' in APP
    assert 'pointerdown' in APP
    assert 'e.altKey||e.shiftKey' in APP
    assert 'Abrir módulo' in APP
    assert 'Abrir link' in APP
    assert 'Mostrar popup' in APP
    assert 'safeHomeActionUrl' in APP
    assert '["http:","https:"]' in APP
    assert 'homeActionButtonsV1' in APP
    assert 'data-home-status="version"' in APP
    assert 'data-home-status="quality"' in APP
    assert 'data-home-status="mode"' in APP
    assert '.home-art-interactions' in CSS
    assert '.home-art-hotspot' in CSS
    assert 'opacity:0!important' in CSS
    assert '.home-action-editor' in CSS
    assert '.home-mobile-edit-help{display:none!important}' in CSS


def test_release_metadata_and_cumulative_capabilities():
    version = json.loads((ROOT / "app/web/static/version.json").read_text(encoding="utf-8"))
    assert version["version"] == "5.3.10"
    assert 'APP_BUILD_VERSION="5.3.10"' in APP
    assert "home-summary-pill-fit-v5.3.10" in INDEX
    for capability in (
        "studio-clean-dna-views",
        "studio-direct-step-navigation",
        "home-editable-actions",
        "home-live-theme-dashboard",
        "home-original-art-hotspots",
        "home-context-editing",
        "home-native-system-values",
        "home-summary-per-theme-alignment",
        "home-tooltip-free-hotspots",
        "bible-cross-reference-popup-reader",
        "bible-panorama-360",
        "audio-x",
    ):
        assert f'"{capability}"' in MAIN
    assert (ROOT / "STUDIO-X-HOME-INTERATIVA-v5.3.6.txt").exists()
    assert (ROOT / "STUDIO-X-HOME-INTERATIVA-v5.3.6-QUALITY-GATE.json").exists()
    assert (ROOT / "HOME-ARTE-ORIGINAL-INTERATIVA-v5.3.7.txt").exists()
    assert (ROOT / "HOME-ARTE-ORIGINAL-INTERATIVA-v5.3.7-QUALITY-GATE.json").exists()
