import json
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
APP = (ROOT / "app/web/static/app-381-v133.js").read_text(encoding="utf-8")
STYLE = (ROOT / "app/web/static/bible-x-dynamic-controls.css").read_text(encoding="utf-8")
INDEX = (ROOT / "app/web/static/index.html").read_text(encoding="utf-8")
MAIN = (ROOT / "app/main.py").read_text(encoding="utf-8")


def _block(start: str, end: str) -> str:
    begin = APP.index(start)
    return APP[begin : APP.index(end, begin)]


def test_cross_reference_rows_offer_a_guided_popup_instead_of_replacing_bible():
    panel = _block("const bxRenderCrossPanel", "const verseTools")
    assert "Clique em “Ler em pop-up”" in panel
    assert "Leia a referência" in panel
    assert "Feche e volte à Bíblia" in panel
    assert 'data-cross-index="${index}"' in panel
    assert "Ler em pop-up sem trocar o versículo principal" in panel
    assert "bxOpenCrossReferenceReader(v,rows" in panel
    assert "current=rr" not in panel


def test_popup_reads_complete_reference_and_preserves_the_original_until_requested():
    reader = _block("const bxOpenCrossReferenceReader", "const bxPreviewReference")
    before_explicit_open = reader[: reader.index("const openInBible")]
    assert "smartBibleRef(entry.target)" in reader
    assert "loadedRows.map(verse=>" in reader
    assert "VERSÍCULO ORIGINAL" in reader
    assert "REFERÊNCIA CRUZADA" in reader
    assert "A Bíblia original continuará no mesmo lugar" in reader
    assert "current=loadedRows" not in before_explicit_open
    assert 'activate("reader")' in reader
    assert "current=loadedRows" in reader


def test_popup_navigation_copy_and_return_paths_are_explicit():
    reader = _block("const bxOpenCrossReferenceReader", "const bxPreviewReference")
    for marker in (
        "data-cross-reader-prev",
        "data-cross-reader-next",
        "ArrowLeft",
        "ArrowRight",
        "formatVerses(loadedRows)",
        "Continuar vendo referências",
        "Fechar e voltar a",
    ):
        assert marker in reader
    assert "modal.hidden=true;cleanup();bxCloseVerseContext()" in reader
    assert "bxFocusVerse(sourceVerse.ref)" in reader
    assert 'document.querySelector(`[data-cross-index="${index}"]`)' in reader
    assert "requestToken+=1" in reader


def test_popup_remains_above_native_fullscreen_and_uses_bible_zoom():
    reader = _block("const bxOpenCrossReferenceReader", "const bxPreviewReference")
    assert "bxPortalFullscreenOverlay(modal)" in reader
    assert 'getZoom?.("reader")' in reader
    assert 'modal.dataset.bxSharedZoom=String(safePercent)' in reader
    assert '--bx-cross-reader-scale' in reader
    assert ".bible-x-shell.bx-page-full>.bx-cross-reader-modal" in STYLE
    assert "z-index:100295!important" in STYLE
    assert '--bx-cross-reader-font-size' in reader
    assert "font-size:var(--bx-cross-reader-font-size,16px)" in STYLE


def test_popup_is_readable_and_responsive_on_pc_and_mobile():
    for marker in (
        ".bx-cross-reader-card",
        ".bx-cross-reader-route",
        ".bx-cross-reader-stage",
        ".bx-cross-reader-text",
        ".bx-cross-reader-nav",
        ".bx-cross-reader-card>footer",
        ".bx-cross-reading-guide",
    ):
        assert marker in STYLE
    assert "width:min(1040px,calc(100vw - 36px))" in STYLE
    assert "max-height:calc(100dvh - 36px)" in STYLE
    assert "@media(max-width:760px)" in STYLE
    assert ".bx-cross-reader-modal{place-items:stretch!important;padding:5px!important}" in STYLE
    assert "grid-template-columns:1fr!important" in STYLE


def test_v539_metadata_and_cache_are_cumulative():
    version = json.loads((ROOT / "app/web/static/version.json").read_text(encoding="utf-8"))
    assert version["version"] == "5.3.10"
    assert "leitor-referencias-cruzadas-popup" in version["channel"]
    assert "home-summary-pill-fit-v5.3.10" in INDEX
    assert 'APP_BUILD_VERSION="5.3.10"' in APP
    assert '"bible-cross-reference-popup-reader"' in MAIN
    assert (ROOT / "VERSION.txt").read_text(encoding="utf-8").startswith("5.3.10")
