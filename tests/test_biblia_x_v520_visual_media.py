import json
from pathlib import Path

from app.biblia_x import media_service


ROOT = Path(__file__).resolve().parents[1]
INDEX = (ROOT / "app/web/static/index.html").read_text(encoding="utf-8")
APP = (ROOT / "app/web/static/app-381-v133.js").read_text(encoding="utf-8")
VIEWER = (ROOT / "app/web/static/bible-x-visual-media.js").read_text(encoding="utf-8")
VIEWER_CSS = (ROOT / "app/web/static/bible-x-visual-media.css").read_text(encoding="utf-8")


class _FakeResponse:
    def __init__(self, payload):
        self.payload = json.dumps(payload).encode("utf-8")

    def __enter__(self):
        return self

    def __exit__(self, *_args):
        return False

    def read(self, *_args):
        return self.payload


def test_commons_search_preserves_attribution_and_detects_equirectangular(monkeypatch):
    payload = {
        "query": {
            "pages": [
                {
                    "pageid": 42,
                    "title": "File:Jerusalem panorama.jpg",
                    "imageinfo": [
                        {
                            "url": "https://upload.wikimedia.org/original.jpg",
                            "thumburl": "https://upload.wikimedia.org/thumb.jpg",
                            "descriptionurl": "https://commons.wikimedia.org/wiki/File:Jerusalem_panorama.jpg",
                            "mime": "image/jpeg",
                            "width": 4000,
                            "height": 2000,
                            "extmetadata": {
                                "Artist": {"value": "<b>Fotografo Exemplo</b>"},
                                "LicenseShortName": {"value": "CC BY-SA 4.0"},
                                "LicenseUrl": {"value": "https://creativecommons.org/licenses/by-sa/4.0/"},
                                "ImageDescription": {"value": "Panorama de <i>Jerusalem</i>"},
                            },
                        }
                    ],
                }
            ]
        }
    }
    monkeypatch.setattr(media_service, "urlopen", lambda *_args, **_kwargs: _FakeResponse(payload))
    media_service._search_cached.cache_clear()

    result = media_service.search_public_media("Jerusalem", "panorama", 8)

    assert result["source"] == "Wikimedia Commons"
    assert result["total"] == 1
    item = result["items"][0]
    assert item["panorama_candidate"] is True
    assert item["artist"] == "Fotografo Exemplo"
    assert item["license"] == "CC BY-SA 4.0"
    assert item["license_url"].startswith("https://creativecommons.org/")
    assert "<" not in item["description"]


def test_visual_viewer_and_dynamic_map_media_controls_are_loaded():
    visual_pos = INDEX.index("/static/bible-x-visual-media.js?v=5.3.9")
    app_pos = INDEX.index("/static/app-381-v133.js?v=home-summary-pill-fit-v5.3.10")
    dynamic_pos = INDEX.index("/static/bible-x-dynamic-controls.js?v=5.3.9")
    audio_pos = INDEX.index("/static/audio_x/audio-x-menu-plugin.js?v=modular-3-v5.3.9")
    assert visual_pos < app_pos < dynamic_pos < audio_pos
    assert "/static/bible-x-visual-media.css?v=5.3.9" in INDEX

    for marker in (
        "openGallery",
        "openPanorama",
        "uYaw",
        "requestFullscreen",
        "pointermove",
    ):
        assert marker in VIEWER
    assert ".bxvm-pano-canvas" in VIEWER_CSS
    assert ".bxvm-overlay" in VIEWER_CSS

    for marker in (
        "/api/bible/media/public/search",
        "bxMapOpenRouteVisual",
        "bxMapLoadLocalMedia",
        "bxMediaRenderPublic",
        "bxMediaImageMeta",
        "data-media-pano",
        "data-map-tab=\"panoramas\"",
    ):
        assert marker in APP


def test_audio_x_is_preserved_with_visual_media_update():
    assert "Áudio X" in APP
    assert "/static/audio_x/audio-x-menu-plugin.js" in INDEX
    assert (ROOT / "app/audio_x/router.py").is_file()
