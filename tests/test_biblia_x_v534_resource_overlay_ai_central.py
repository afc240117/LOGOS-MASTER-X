import re
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
APP = (ROOT / "app/web/static/app-381-v133.js").read_text(encoding="utf-8")
DYNAMIC = (ROOT / "app/web/static/bible-x-dynamic-controls.js").read_text(encoding="utf-8")
STYLE = (ROOT / "app/web/static/bible-x-dynamic-controls.css").read_text(encoding="utf-8")


def test_central_module_command_is_a_prominent_independent_topbar_column():
    topbar = APP[APP.index('<section class="bible-x-topbar"'):APP.index('</section>', APP.index('<section class="bible-x-topbar"'))]
    assert 'class="bx-page-select-wrap bx-module-command"' in topbar
    assert 'class="bx-module-emblem"' in topbar
    assert "CENTRAL BÍBLIA X" in topbar
    assert "Navegação dos módulos" in topbar
    assert "31 ambientes integrados" in topbar
    assert topbar.index("bx-page-heading") < topbar.index("bx-module-command") < topbar.index("bible-x-top-actions")
    assert "grid-template-columns:minmax(220px,1fr) minmax(430px,560px) minmax(360px,1fr)" in STYLE
    assert ".bx-module-emblem>b" in STYLE


def test_verse_resources_use_a_fullscreen_overlay_inside_the_bible_shell():
    for marker in (
        "bxVerseContextState",
        "bxMountVerseContext",
        "bxRestoreVerseContext",
        "bxCloseVerseContext",
        "bxVerseOverlayBackdrop",
        'panel.classList.add("bx-fullscreen-resource-modal")',
    ):
        assert marker in APP
    assert 'new CustomEvent("biblex:fullscreenchange"' in DYNAMIC
    assert ".bible-x-shell.bx-page-full>#bxVerseOverlayBackdrop" in STYLE
    assert ".bible-x-shell.bx-page-full>#bxVerseContext.bx-fullscreen-resource-modal:not([hidden])" in STYLE
    assert "z-index:100250!important" in STYLE


def test_all_primary_verse_links_stay_above_native_fullscreen():
    assert 'openVerseContext("atlas",v)' in APP
    assert 'else if(key==="media")bxRenderMediaVersePanel(v)' in APP
    assert 'else if(key==="atlas")bxRenderAtlasPanel(v)' in APP
    assert "bxPortalFullscreenOverlay(modal)" in APP
    assert "bxPortalFullscreenOverlay(panel)" in APP
    assert "BX_FULLSCREEN_OVERLAY_SELECTOR" in APP
    assert "bxPortalExistingFullscreenOverlays" in APP
    assert "new MutationObserver(records=>" in APP
    assert ".bible-x-shell.bx-page-full>.bx-entity-quick-panel" in STYLE
    assert ".bible-x-shell.bx-page-full>:is(.bx-ref-preview,.bx-compare-modal,.bx-parallel-modal,.bx-personal-links-modal)" in STYLE


def test_fifteen_ai_comment_experts_are_visible_first_and_fault_tolerant():
    experts_block = APP[APP.index("const BX_AI_COMMENT_EXPERTS"):APP.index("]);", APP.index("const BX_AI_COMMENT_EXPERTS"))]
    experts = re.findall(r'^\s+\["[^"]+","[^"]+","[^"]+","[^"]+"\],?$', experts_block, re.MULTILINE)
    assert len(experts) == 15
    comments = APP[APP.index("const bxRenderCommentsPanel"):APP.index("const bxRenderContextPanel")]
    assert comments.index("bx-ai-commentaries-first") < comments.index("bx-comments-live-tabs")
    assert '<b class="bx-ai-count">15</b>' in comments
    assert comments.count("bxSafeResponseJson(response") == 3
    assert "Os 15 especialistas continuam disponíveis" in comments
    assert ".bx-ai-commentaries-first .bx-ai-expert-grid" in STYLE


def test_atlas_and_media_offer_context_cards_before_full_module_navigation():
    assert "const bxRenderAtlasPanel" in APP
    assert "ATLAS SOBRE A LEITURA" in APP
    assert "const bxRenderMediaVersePanel" in APP
    assert "MÍDIA X SOBRE A LEITURA" in APP
    assert "Panoramas 360°" in APP
    assert "data-bx-atlas-full" in APP
    assert "data-bx-media-full" in APP


def test_mobile_overlay_and_command_center_are_responsive():
    assert "top:6px!important;right:6px!important;bottom:6px!important;left:6px!important" in STYLE
    assert ".bx-ai-commentaries-first .bx-ai-expert-grid{grid-template-columns:repeat(2,minmax(0,1fr))" in STYLE
    assert ".bible-x-topbar>.bx-module-command{grid-template-columns:52px minmax(0,1fr)" in STYLE
