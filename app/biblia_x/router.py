
import re

from fastapi import APIRouter, HTTPException, Query
from . import bible_service as svc
from . import study_resources as resources
from . import commentary_service
from . import media_service

router = APIRouter(prefix="/api/bible", tags=["Bíblia X"])

@router.get("/health")
def health():
    return {"ok": True, "module": "biblia-x", "engine": "0.6", "visual_media": "5.2"}


@router.get("/media/public/search")
def public_media_search(
    q: str = Query(min_length=2, max_length=120),
    kind: str = Query(default="image", max_length=16),
    limit: int = Query(default=8, ge=1, le=16),
    offset: int = Query(default=0, ge=0, le=100000),
):
    """Search public imagery while preserving source/license metadata."""
    try:
        return media_service.search_public_media(q, kind, limit, offset)
    except ValueError as exc:
        raise HTTPException(400, str(exc)) from exc
    except RuntimeError as exc:
        raise HTTPException(503, str(exc)) from exc


@router.get("/status")
def bible_status(translation: str = Query(default="porbr2018", max_length=40)):
    return svc.corpus_status(translation)

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
def strong(
    translation: str,
    book: str,
    chapter: int = Query(ge=1, le=200),
    verse: str = Query(min_length=1, max_length=12),
):
    return {
        "translation": translation,
        "strong_source_translation": svc.STRONG_WORDS_SOURCE_ID,
        "alignment_note": "Palavras do texto hebraico/grego vinculadas à mesma referência canônica; não é alegado alinhamento automático palavra-a-palavra com a tradução portuguesa.",
        "book": book.upper(),
        "chapter": chapter,
        "verse": verse,
        "words": svc.get_strong(translation, book.upper(), chapter, verse)
    }


@router.get("/strong/status")
def strong_status():
    return svc.strong_status()


@router.get("/strong/search")
def strong_search(
    q: str = Query(default="", max_length=120),
    language: str = Query(default="", max_length=12),
    limit: int = Query(default=50, ge=1, le=100),
    offset: int = Query(default=0, ge=0, le=10000),
):
    page = svc.strong_search(q=q, language=language, limit=limit, offset=offset)
    return {"q": q, "language": language, **page}


@router.get("/strong/entry")
def strong_entry(number: str = Query(min_length=2, max_length=12)):
    item=svc.get_strong_entry(number)
    if not item:
        raise HTTPException(404, "Número Strong não encontrado")
    return item


@router.get("/strong/occurrences")
def strong_occurrences(
    number: str = Query(min_length=2, max_length=12),
    translation: str = Query(default="porbr2018", max_length=40),
    limit: int = Query(default=100, ge=1, le=200),
    offset: int = Query(default=0, ge=0, le=10000),
):
    return svc.strong_occurrence_page(number, limit, offset, translation)


@router.get("/lexicon/status")
def lexicon_status():
    return svc.lexicon_status()


@router.get("/lexicon/search")
def lexicon_search(
    q: str = Query(default="", max_length=120),
    language: str = Query(default="", max_length=12),
    limit: int = Query(default=50, ge=1, le=100),
    offset: int = Query(default=0, ge=0, le=10000),
):
    page = svc.lexicon_search(q, language, limit, offset)
    return {"q": q, "language": language, **page}


@router.get("/lexicon/entry")
def lexicon_entry(
    entry_id: str = Query(default="", alias="id", max_length=40),
    number: str = Query(default="", max_length=12),
):
    item = svc.get_lexicon_entry(entry_id=entry_id, strong=number)
    if not item:
        raise HTTPException(404, "Entrada lexical não encontrada")
    return item


@router.get("/lexicon/occurrences")
def lexicon_occurrences(
    number: str = Query(min_length=2, max_length=12),
    translation: str = Query(default="porbr2018", max_length=40),
    surface: str = Query(default="", max_length=120),
    limit: int = Query(default=100, ge=1, le=200),
    offset: int = Query(default=0, ge=0, le=10000),
):
    return svc.lexicon_occurrence_page(number, limit, offset, translation, surface)

@router.get("/search")
def search(
    q: str = Query(min_length=1, max_length=200),
    translation: str = Query(default="porbr2018", max_length=40),
    limit: int = Query(default=100, ge=1, le=5000),
    offset: int = Query(default=0, ge=0, le=35000),
    mode: str = Query(default="phrase", max_length=20),
    scope: str = Query(default="all", max_length=20),
    book: str = Query(default="", max_length=20),
    chapter: int | None = Query(default=None, ge=1, le=200),
    books: str = Query(default="", max_length=500),
    sort: str = Query(default="canon", max_length=20),
):
    selected = [value.strip().upper() for value in books.split(",") if value.strip()]
    page = svc.search_text_page(
        q=q,
        translation_id=translation,
        limit=limit,
        offset=offset,
        mode=mode,
        scope=scope,
        book=book,
        chapter=chapter,
        books=selected,
        sort=sort,
    )
    return {"q": q, "translation": translation, **page}


@router.get("/concordance")
def concordance(
    q: str = Query(min_length=1, max_length=120),
    translation: str = Query(default="porbr2018", max_length=40),
    limit: int = Query(default=500, ge=1, le=2000),
    offset: int = Query(default=0, ge=0, le=35000),
):
    return svc.concordance_search(q, translation, limit, offset)


@router.get("/concordance/top")
def concordance_top(
    translation: str = Query(default="porbr2018", max_length=40),
    limit: int = Query(default=50, ge=1, le=200),
):
    return {"translation": translation, **svc.concordance_top(translation, limit)}


@router.get("/reference")
def reference(translation: str, ref: str, language: str = "pt"):
    item = svc.get_reference(translation, ref, language)
    if not item or not item["verses"]:
        raise HTTPException(404, "Referência não encontrada")
    return item


def _live_verse_number(value: str) -> int:
    match = re.match(r"\d+", str(value or "").strip())
    if not match:
        raise ValueError("Versículo inválido")
    return int(match.group())


@router.get("/live")
def live_explorer(
    ref: str = Query(min_length=3, max_length=120),
    translation: str = Query(default="porbr2018", max_length=40),
):
    """Return a local-first resource graph for the passage being read.

    This endpoint deliberately orchestrates only bundled/local sources. Public
    media is exposed as a user-triggered search hint so simply navigating the
    Bible never creates an unexpected network request.
    """
    parsed = svc.parse_reference(ref, "pt")
    if not parsed or not parsed.get("verse_start"):
        raise HTTPException(400, "Informe uma passagem com versículo, por exemplo: João 3:16")
    try:
        verse_number = _live_verse_number(parsed["verse_start"])
    except ValueError as exc:
        raise HTTPException(400, str(exc)) from exc

    book_code = parsed["book_code"]
    chapter = int(parsed["chapter"])
    verse = str(parsed["verse_start"])
    base = svc.passage_context(translation, book_code, chapter, verse)
    if not base or not base.get("passage", {}).get("text"):
        raise HTTPException(404, "Passagem não encontrada nesta tradução")

    try:
        profile = svc.context_book_snapshot(translation, book_code, chapter, verse) or {}
    except Exception:
        profile = {}
    try:
        topics = resources.nave_for_verse(book_code, chapter, verse_number, 12)
    except Exception:
        topics = []
    try:
        crossrefs = resources.crossrefs(book_code, chapter, verse_number, 16)
    except Exception:
        crossrefs = []
    try:
        strong_rows = svc.get_strong(translation, book_code, chapter, verse)
    except Exception:
        strong_rows = []

    words = []
    seen_strong = set()
    for row in strong_rows:
        number = str(row.get("strong") or "").strip()
        key = number or f"surface-{row.get('word_index', len(words))}"
        if key in seen_strong:
            continue
        seen_strong.add(key)
        words.append({
            "strong": number,
            "surface": row.get("surface") or "",
            "lemma": row.get("lemma") or row.get("lexicon_lemma") or "",
            "language": row.get("language") or "",
            "transliteration": row.get("transliteration") or "",
            "definition": row.get("definition") or row.get("kjv_definition") or "",
            "morph": row.get("morph") or "",
        })
        if len(words) >= 12:
            break

    try:
        comments_page = commentary_service.search_cached(
            q="", book_code=book_code, chapter=chapter, limit=20, offset=0
        )
        comments = [
            item for item in comments_page.get("items", [])
            if int(item.get("verse_start", verse_number)) <= verse_number <= int(item.get("verse_end", verse_number))
        ][:6]
    except Exception:
        comments = []

    profile_themes = profile.get("themes", []) if isinstance(profile, dict) else []
    profile_places = profile.get("places", []) if isinstance(profile, dict) else []
    profile_refs = profile.get("key_refs", []) if isinstance(profile, dict) else []
    theme_items = list(topics)
    for theme in profile_themes:
        if not any(str(item.get("topic", "")).casefold() == str(theme).casefold() for item in theme_items):
            theme_items.append({
                "topic_id": None,
                "topic": theme,
                "topic_original": theme,
                "section": "Perfil editorial do livro",
                "sections": ["Perfil editorial do livro"],
                "summary": "Tema-chave do perfil contextual do livro.",
            })

    map_items = [
        {
            "name": place,
            "query": f"{place} bíblico",
            "kind": "place",
            "source": "Perfil contextual do livro",
        }
        for place in profile_places[:10]
    ]
    media_query = ", ".join(str(item.get("name", "")) for item in map_items[:2] if item.get("name"))
    if not media_query:
        media_query = f"{base['book']['name_pt']} {chapter}"

    sources = [
        {"id": "bible-local", "label": "Bíblia X local", "kind": "texto", "network": False},
        {"id": "strong-local", "label": "Strong + léxico local", "kind": "línguas originais", "network": False},
        {"id": "nave-local", "label": "Índice Nave local", "kind": "temas", "network": False},
        {"id": "tsk-local", "label": "TSK local", "kind": "referências", "network": False},
        {"id": "context-local", "label": "Contexto editorial local", "kind": "contexto", "network": False},
        {"id": "commentary-cache", "label": "Comentários em cache", "kind": "comentário", "network": False},
        {"id": "wikimedia-commons", "label": "Wikimedia Commons", "kind": "mídia pública", "network": True, "requires_action": True},
    ]
    counts = {
        "themes": len(theme_items),
        "words": len(words),
        "crossrefs": len(crossrefs),
        "maps": len(map_items),
        "media": 0,
        "comments": len(comments),
        "sources": len(sources),
    }
    return {
        "ok": True,
        "reference": {
            "input": ref,
            "canonical": f"{parsed['book_name']} {chapter}:{verse}",
            "book_code": book_code,
            "chapter": chapter,
            "verse": verse,
            "translation": translation,
        },
        "passage": base["passage"],
        "neighbors": base.get("neighbors", {}),
        "themes": theme_items[:20],
        "words": words,
        "crossrefs": crossrefs,
        "context": {
            "book": base.get("book", {}),
            "profile": profile,
            "key_refs": profile_refs[:12],
        },
        "maps": map_items,
        "media": {
            "query": media_query,
            "provider": "Wikimedia Commons",
            "kind": "image",
            "requires_action": True,
            "note": "A busca pública só é feita quando você pedir; crédito e licença acompanham cada item.",
        },
        "comments": comments,
        "sources": sources,
        "counts": counts,
        "local_first": True,
    }


@router.get("/resources/status")
def resources_status():
    return resources.status()

@router.get("/crossrefs")
def crossrefs(
    book: str,
    chapter: int = Query(ge=1, le=200),
    verse: int = Query(ge=1, le=200),
    limit: int = Query(default=80, ge=1, le=200),
):
    return {"items":resources.crossrefs(book.upper(),chapter,verse,limit)}

@router.get("/nave")
def nave(
    book: str,
    chapter: int = Query(ge=1, le=200),
    verse: int = Query(ge=1, le=200),
    limit: int = Query(default=30, ge=1, le=100),
):
    return {"items":resources.nave_for_verse(book.upper(),chapter,verse,limit)}

@router.get("/nave/search")
def nave_search(q: str = Query(min_length=1, max_length=120), limit: int = Query(default=40, ge=1, le=100)):
    return {"q":q,"items":resources.search_nave_topics(q,limit)}

@router.get("/nave/topic")
def nave_topic(topic_id: int = Query(ge=1), limit: int = Query(default=300, ge=1, le=500)):
    item=resources.nave_topic(topic_id,limit)
    if not item:
        raise HTTPException(404,"Tópico Nave não encontrado")
    return item


@router.get("/context/status")
def context_status():
    return svc.context_status()


@router.get("/context/search")
def context_search(
    q: str = Query(default="", max_length=120),
    context_type: str = Query(default="all", alias="type", max_length=20),
    limit: int = Query(default=50, ge=1, le=100),
    offset: int = Query(default=0, ge=0, le=10000),
):
    page=svc.context_search(q,context_type,limit,offset)
    return {"q":q,"type":context_type,**page}


@router.get("/context/book")
def context_book(
    book: str = Query(min_length=2, max_length=20),
    translation: str = Query(default="porbr2018", max_length=40),
    chapter: int | None = Query(default=None, ge=1, le=200),
    verse: str | None = Query(default=None, max_length=12),
):
    item=svc.context_book_snapshot(translation,book.upper(),chapter,verse)
    if not item:
        raise HTTPException(404,"Contexto do livro/capítulo não encontrado")
    selected=item.get("chapter",{}).get("number")
    if selected:
        item["chapter"]["topics"]=resources.nave_for_chapter(book.upper(),selected,16)
        item["chapter"]["crossrefs"]=resources.crossrefs_for_chapter(book.upper(),selected,20)
    item["source_note_pt"]=(
        "Perfil editorial em português separado da fonte histórica Easton (1897, "
        "domínio público, inglês). O contexto estrutural do capítulo é calculado "
        "dos bancos locais Bíblia X, Nave, TSK e Strong."
    )
    return item


@router.get("/context/article")
def context_article(entry_id: str = Query(alias="id", min_length=3, max_length=40)):
    item=svc.get_context_article(entry_id)
    if not item:
        raise HTTPException(404,"Verbete contextual não encontrado")
    return item


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
    base["profile"]=svc.context_book_snapshot(translation,book.upper(),chapter,verse)
    base["source_note"]="Contexto estrutural gerado a partir dos bancos locais Bíblia X, Nave, TSK e Strong, com perfil editorial do livro e fonte histórica Easton 1897 separada e identificada."
    return base


@router.get("/commentary/classic")
def classic_commentary(book: str, chapter: int, verse: int):
    return commentary_service.get_commentary(book.upper(), chapter, verse)


@router.get("/commentary/status")
def commentary_status():
    status = commentary_service.cached_status()
    status["editorial_guides"] = len(svc.commentary_guides())
    return status


@router.get("/commentary/search")
def commentary_search(
    q: str = Query(default="", max_length=200),
    comment_type: str = Query(default="all", alias="type", max_length=30),
    book: str = Query(default="", max_length=30),
    chapter: int | None = Query(default=None, ge=1, le=200),
    limit: int = Query(default=150, ge=1, le=300),
    offset: int = Query(default=0, ge=0, le=10000),
):
    parsed = svc.parse_reference(q, "pt") if q.strip() else None
    code = book.strip().upper()
    selected_chapter = chapter
    search_term = q.strip()
    selected_verse = None
    if parsed:
        code = parsed["book_code"]
        selected_chapter = parsed["chapter"]
        selected_verse = int(parsed["verse_start"]) if parsed.get("verse_start") else None
        search_term = ""

    classic_page = commentary_service.search_cached(
        q=search_term,
        book_code=code,
        chapter=selected_chapter,
        limit=500,
        offset=0,
    )
    classic_items = classic_page["items"]
    if selected_verse is not None:
        classic_items = [
            item for item in classic_items
            if int(item["verse_start"]) <= selected_verse <= int(item["verse_end"])
        ]
    for item in classic_items:
        resolved = svc.resolve_book(item["book_code"], "pt")
        book_name = resolved["name_pt"] if resolved else item["book_code"]
        item["reference"] = f'{book_name} {item["chapter"]}:{item["verse_range"]}'
        item["refs"] = [item["reference"]]

    guides = svc.commentary_guides(
        q=search_term,
        book_code=code,
        chapter=selected_chapter,
    )
    items = [*classic_items, *guides]
    if comment_type != "all":
        items = [item for item in items if item.get("type") == comment_type]
    items.sort(key=lambda item: (
        int(item.get("canonical_order", 999)),
        0 if item.get("kind") == "classic" else 1,
        item.get("reference", ""),
    ))
    total = len(items)
    return {
        "q": q,
        "type": comment_type,
        "items": items[offset:offset + limit],
        "total": total,
        "limit": limit,
        "offset": offset,
        "sources": {
            "classic": commentary_service.SOURCE_NAME,
            "classic_license": commentary_service.SOURCE_LICENSE,
            "guides": "Perfis contextuais editoriais Bíblia X",
        },
    }
