from pathlib import Path

from fastapi.testclient import TestClient

from app.main import app


ROOT = Path(__file__).resolve().parents[1]
INDEX = (ROOT / "app/web/static/index.html").read_text(encoding="utf-8")
PLUGIN = (ROOT / "app/web/static/audio_x/audio-x-menu-plugin.js").read_text(
    encoding="utf-8"
)


def test_audio_x_module_is_integrated_without_touching_biblia_x():
    assert (ROOT / "app/audio_x/router.py").is_file()
    assert (ROOT / "app/web/static/audio_x/audio-x-cloud.html").is_file()
    assert (ROOT / "app/biblia_x/biblia_x.sqlite3").is_file()


def test_audio_x_menu_plugin_is_loaded_and_places_button_after_bible():
    assert "/static/audio_x/audio-x-menu-plugin.js?v=modular-3-v5.3.9" in INDEX
    assert 'const bible=nav.querySelector(\'[data-view="bible"]\')' in PLUGIN
    assert 'bible.insertAdjacentElement("afterend",btn)' in PLUGIN
    assert "Áudio X" in PLUGIN
    assert "/static/audio_x/audio-x-cloud.html" in PLUGIN


def test_audio_x_routes_and_static_page_are_available():
    client = TestClient(app)

    health = client.get("/api/audio-x/router/health")
    assert health.status_code == 200
    assert health.json()["architecture"] == "cloud-api-first"

    page = client.get("/static/audio_x/audio-x-cloud.html")
    assert page.status_code == 200
    assert "Áudio X" in page.text


def test_application_reports_audio_x_capability_and_hotfix_version():
    client = TestClient(app)
    health = client.get("/api/health").json()

    assert health["version"] == "LOGOS-MASTER-X-5.3.10"
    assert "audio-x" in health["capabilities"]
