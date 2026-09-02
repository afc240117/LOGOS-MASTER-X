import ast
import json
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
ROUTER = (ROOT / "app/biblia_x/router.py").read_text(encoding="utf-8")
LIVE_JS = (ROOT / "app/web/static/bible-x-live-explorer.js").read_text(encoding="utf-8")
INFINITE_JS = (ROOT / "app/web/static/bible-x-infinite-explorer.js").read_text(encoding="utf-8")
ENRICHMENT_JS = (ROOT / "app/web/static/bible-x-module-enrichment.js").read_text(encoding="utf-8")
GLOBAL_ENRICHMENT_JS = (ROOT / "app/web/static/bible-x-global-enrichment.js").read_text(encoding="utf-8")
MEDIA_SERVICE = (ROOT / "app/biblia_x/media_service.py").read_text(encoding="utf-8")
INDEX = (ROOT / "app/web/static/index.html").read_text(encoding="utf-8")
VERSION = json.loads((ROOT / "app/web/static/version.json").read_text(encoding="utf-8"))


def test_live_endpoint_is_declared_and_local_first():
    tree = ast.parse(ROUTER)
    functions = {node.name: node for node in tree.body if isinstance(node, (ast.FunctionDef, ast.AsyncFunctionDef))}
    assert "live_explorer" in functions
    assert '@router.get("/live")' in ROUTER
    assert "local_first" in ROUTER
    assert "Wikimedia Commons" in ROUTER
    assert "requires_action" in ROUTER
    assert 'STRONG_WORDS_SOURCE_ID = "engwebp"' in (ROOT / "app/biblia_x/bible_service.py").read_text(encoding="utf-8")


def test_live_explorer_covers_the_requested_resource_chain():
    for marker in (
        "data-live-go=\"cross\"",
        "data-live-go=\"strong\"",
        "data-live-open-ref",
        "data-live-go=\"context\"",
        "data-live-go=\"maps\"",
        "data-live-action=\"media-search\"",
        "data-live-go=\"comments\"",
        "data-live-go=\"search\"",
        "BÍBLIA VIVA • EXPLORAÇÃO CONTEXTUAL",
        "/api/bible/live?ref=",
        "MutationObserver",
        "lastTranslation",
        "translation === state.lastTranslation",
    ):
        assert marker in LIVE_JS


def test_live_assets_are_loaded_and_versioned():
    assert 'href="/static/bible-x-live-explorer.css?v=5.3.12"' in INDEX
    assert 'src="/static/bible-x-live-explorer.js?v=5.3.12"' in INDEX
    assert VERSION["version"] == "5.3.16"
    assert "pesquisa-infinita" in VERSION["channel"]


def test_maps_and_media_support_continuous_discovery():
    for marker in (
        "gsroffset",
        "next_offset",
        "has_more",
        "data-map-history",
        "Antigo Testamento",
        "Viagens missionárias",
        "IntersectionObserver",
        "offset:String(mediaState.offset)",
        "Fim dos resultados disponíveis",
    ):
        assert marker in (INFINITE_JS + ROUTER + MEDIA_SERVICE)
    app = (ROOT / "app/web/static/app-381-v133.js").read_text(encoding="utf-8")
    maps_block = app[app.index("const renderMaps="):app.index("$(\"#bxMapFind\")", app.index("const renderMaps="))]
    media_block = app[app.index("const renderMedia="):app.index("$(\"#bxMediaFind\")", app.index("const renderMedia="))]
    assert "list.innerHTML=rows.map" in maps_block
    assert "grid.innerHTML=rows.map" in media_block


def test_menu_modules_share_connected_enrichment_trails():
    for marker in (
        "Atlas vivo",
        "Biblioteca visual",
        "Rede de personagens",
        "Linha histórica",
        "Impérios",
        "Viagens de Paulo",
        "data-enrich-jump",
    ):
        assert marker in ENRICHMENT_JS
    assert 'bible-x-module-enrichment.css?v=5.3.14' in INDEX
    assert 'bible-x-module-enrichment.js?v=5.3.14' in INDEX


def test_remaining_bible_modules_have_discovery_trails():
    for marker in (
        "Cadeias bíblicas",
        "Palavras originais",
        "Trilhas lexicais",
        "Contexto conectado",
        "Leitura e aplicação",
        "Pesquisa bíblica",
        "Busca em toda a plataforma",
        "Dossiês prontos",
        "Mesa de estudo",
        "Comparação rápida",
    ):
        assert marker in GLOBAL_ENRICHMENT_JS
    assert 'bible-x-global-enrichment.css?v=5.3.16' in INDEX
    assert 'bible-x-global-enrichment.js?v=5.3.16' in INDEX


def test_bible_search_x_accumulates_results_and_loads_on_scroll():
    app = (ROOT / "app/web/static/app-381-v133.js").read_text(encoding="utf-8")
    for marker in (
        "bxSearchXRows=[]",
        "append=false",
        "data-search-x-more",
        "IntersectionObserver",
        "Copiar resultados carregados",
        "bxSearchXRun(bxSearchXOffset+BX_SEARCH_X_PAGE_SIZE,true)",
    ):
        assert marker in app
