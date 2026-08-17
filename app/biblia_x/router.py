
from fastapi import APIRouter, HTTPException, Query
from . import bible_service as svc
from . import study_resources as resources
from . import commentary_service

router = APIRouter(prefix="/api/bible", tags=["Bíblia X"])

@router.get("/health")
def health():
    return {"ok": True, "module": "biblia-x", "engine": "0.3"}

@router.get("/translations")
def translations():
    return {"items": svc.list_translations()}

@router.get("/books")
def books(translation: str):
    try:
        return {"translation": translation, "items": svc.list_books(translation)}
    except KeyError:
        raise HTTPException(404, "Tradução não encontrada")

@router.get("/chapters")
def chapters(translation: str, book: str):
    items = svc.list_chapters(translation, book.upper())
    if not items:
        raise HTTPException(404, "Livro/tradução sem capítulos importados")
    return {"translation": translation, "book": book.upper(), "items": items}

@router.get("/chapter")
def chapter(translation: str, book: str, chapter: int = Query(ge=1, le=200)):
    items = svc.get_chapter(translation, book.upper(), chapter)
    if not items:
        raise HTTPException(404, "Capítulo não encontrado")
    return {"translation": translation, "book": book.upper(), "chapter": chapter, "verses": items}

@router.get("/verse")
def verse(translation: str, book: str, chapter: int, verse: str):
    item = svc.get_verse(translation, book.upper(), chapter, verse)
    if not item:
        raise HTTPException(404, "Versículo não encontrado")
    return item

@router.get("/strong")
def strong(translation: str, book: str, chapter: int, verse: str):
    return {
        "translation": translation,
        "strong_source_translation": "engwebp",
        "alignment_note": "Dados Strong vinculados à mesma referência canônica via WEBP; sem afirmar alinhamento automático palavra-a-palavra com o português.",
        "book": book.upper(),
        "chapter": chapter,
        "verse": verse,
        "words": svc.get_strong(translation, book.upper(), chapter, verse)
    }

@router.get("/strong/entry")
def strong_entry(number: str):
    item=svc.get_strong_entry(number)
    if not item:
        raise HTTPException(404, "Número Strong não encontrado")
    return item


@router.get("/lexicon/search")
def lexicon_search(q: str, limit: int = 50):
    return {"q":q,"items":svc.lexicon_search(q,limit)}

@router.get("/lexicon/occurrences")
def lexicon_occurrences(number: str, limit: int = 100):
    return {"number":number.upper(),"items":svc.strong_occurrences(number,limit)}

@router.get("/search")
def search(
    q: str,
    translation: str,
    limit: int = Query(default=50, ge=1, le=100)
):
    return {"q": q, "translation": translation, "items": svc.search_text(q, translation, limit)}


@router.get("/reference")
def reference(translation: str, ref: str, language: str = "pt"):
    item = svc.get_reference(translation, ref, language)
    if not item or not item["verses"]:
        raise HTTPException(404, "Referência não encontrada")
    return item


@router.get("/resources/status")
def resources_status():
    return resources.status()

@router.get("/crossrefs")
def crossrefs(book: str, chapter: int, verse: int, limit: int = 80):
    return {"items":resources.crossrefs(book.upper(),chapter,verse,limit)}

@router.get("/nave")
def nave(book: str, chapter: int, verse: int, limit: int = 30):
    return {"items":resources.nave_for_verse(book.upper(),chapter,verse,limit)}


@router.get("/context")
def context(translation: str, book: str, chapter: int, verse: str):
    base=svc.passage_context(translation,book.upper(),chapter,verse)
    if not base:
        raise HTTPException(404,"Contexto não encontrado")
    try:
        topics=resources.nave_for_verse(book.upper(),chapter,int(verse),12)
    except Exception:
        topics=[]
    try:
        refs=resources.crossrefs(book.upper(),chapter,int(verse),12)
    except Exception:
        refs=[]
    base["topics"]=topics
    base["crossrefs"]=refs
    base["source_note"]="Contexto estrutural gerado a partir dos bancos locais Bíblia X, Nave, TSK e Strong. Dados históricos autorais/culturais serão adicionados somente de fontes verificadas."
    return base


@router.get("/commentary/classic")
def classic_commentary(book: str, chapter: int, verse: int):
    return commentary_service.get_commentary(book.upper(), chapter, verse)
