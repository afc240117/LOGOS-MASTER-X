
from pathlib import Path
import sqlite3

DB_PATH = (Path(__file__).resolve().parent / "biblia_x.sqlite3").resolve()

def connect():
    con = sqlite3.connect(DB_PATH)
    con.row_factory = sqlite3.Row
    return con

def list_translations():
    with connect() as con:
        rows = con.execute("""
            SELECT id,name,short_name,language,license,status
            FROM translations ORDER BY name
        """).fetchall()
        return [dict(r) for r in rows]

def list_books(translation_id: str):
    with connect() as con:
        exists = con.execute("SELECT 1 FROM translations WHERE id=?", (translation_id,)).fetchone()
        if not exists:
            raise KeyError("translation_not_found")
        rows = con.execute("""
            SELECT b.code,b.name_pt,b.name_en,b.canonical_order,
                   COUNT(DISTINCT v.chapter) AS chapters
            FROM books b
            LEFT JOIN verses v
              ON v.book_code=b.code AND v.translation_id=?
            GROUP BY b.code,b.name_pt,b.name_en,b.canonical_order
            ORDER BY b.canonical_order
        """, (translation_id,)).fetchall()
        return [dict(r) for r in rows]

def list_chapters(translation_id: str, book_code: str):
    with connect() as con:
        rows = con.execute("""
            SELECT chapter, verse_count
            FROM navigation_cache
            WHERE translation_id=? AND book_code=?
            ORDER BY chapter
        """, (translation_id, book_code)).fetchall()
        return [dict(r) for r in rows]

def get_chapter(translation_id: str, book_code: str, chapter: int):
    with connect() as con:
        rows = con.execute("""
            SELECT verse,text
            FROM verses
            WHERE translation_id=? AND book_code=? AND chapter=?
            ORDER BY
              CASE WHEN verse GLOB '[0-9]*' THEN CAST(verse AS INTEGER) ELSE 9999 END,
              verse
        """, (translation_id, book_code, chapter)).fetchall()
        return [dict(r) for r in rows]

def get_verse(translation_id: str, book_code: str, chapter: int, verse: str):
    with connect() as con:
        row = con.execute("""
            SELECT translation_id,book_code,chapter,verse,text,source_file
            FROM verses
            WHERE translation_id=? AND book_code=? AND chapter=? AND verse=?
        """, (translation_id, book_code, chapter, verse)).fetchone()
        return dict(row) if row else None

def get_strong(translation_id: str, book_code: str, chapter: int, verse: str):
    source_translation = "engwebp"
    with connect() as con:
        rows = con.execute("""
            SELECT w.word_index,w.surface,w.strong,w.lemma,w.morph,
                   l.language,l.lemma AS lexicon_lemma,l.transliteration,
                   l.pronunciation,l.definition,l.kjv_definition,l.derivation,l.source
            FROM verse_words w
            LEFT JOIN strong_lexicon l
              ON l.strong = CASE
                  WHEN instr(COALESCE(w.strong,''),' ')>0 THEN substr(w.strong,1,instr(w.strong,' ')-1)
                  ELSE w.strong
              END
            WHERE w.translation_id=? AND w.book_code=? AND w.chapter=? AND w.verse=?
            ORDER BY w.word_index
        """, (source_translation, book_code, chapter, verse)).fetchall()
        return [dict(r) for r in rows]

def get_strong_entry(strong: str):
    strong=(strong or "").strip().upper()
    with connect() as con:
        row=con.execute("""
            SELECT strong,language,lemma,transliteration,pronunciation,definition,
                   kjv_definition,derivation,source
            FROM strong_lexicon WHERE strong=?
        """,(strong,)).fetchone()
        return dict(row) if row else None

def lexicon_search(q: str, limit: int = 50):
    q=(q or "").strip()
    if not q:
        return []
    limit=max(1,min(int(limit),100))
    with connect() as con:
        rows=con.execute("""
            SELECT strong,language,lemma,transliteration,pronunciation,
                   definition,kjv_definition,derivation,source
            FROM strong_lexicon
            WHERE strong LIKE ?
               OR lemma LIKE ?
               OR transliteration LIKE ?
               OR definition LIKE ?
               OR kjv_definition LIKE ?
            ORDER BY CASE WHEN strong=? THEN 0 ELSE 1 END,strong
            LIMIT ?
        """,(f"%{q}%",f"%{q}%",f"%{q}%",f"%{q}%",f"%{q}%",q.upper(),limit)).fetchall()
        return [dict(r) for r in rows]

def strong_occurrences(strong: str, limit: int = 100):
    strong=(strong or "").strip().upper()
    if not strong:
        return []
    limit=max(1,min(int(limit),200))
    with connect() as con:
        rows=con.execute("""
            SELECT w.book_code,w.chapter,w.verse,w.surface,w.lemma,w.morph,
                   b.name_pt,b.name_en
            FROM verse_words w
            JOIN books b ON b.code=w.book_code
            WHERE w.translation_id='engwebp'
              AND (w.strong=? OR w.strong LIKE ?)
            ORDER BY b.canonical_order,w.chapter,
                     CASE WHEN w.verse GLOB '[0-9]*' THEN CAST(w.verse AS INTEGER) ELSE 9999 END,
                     w.word_index
            LIMIT ?
        """,(strong,strong+" %",limit)).fetchall()
        out=[]
        for r in rows:
            d=dict(r)
            d["reference_pt"]=f'{d["name_pt"]} {d["chapter"]}:{d["verse"]}'
            out.append(d)
        return out


def passage_context(translation_id: str, book_code: str, chapter: int, verse: str):
    book_code=book_code.upper()
    chapter=int(chapter)
    verse=str(verse)
    with connect() as con:
        book=con.execute("""
            SELECT code,name_pt,name_en,canonical_order
            FROM books WHERE code=?
        """,(book_code,)).fetchone()
        if not book:
            return None
        chapter_count=con.execute("""
            SELECT COUNT(DISTINCT chapter) FROM verses
            WHERE translation_id=? AND book_code=?
        """,(translation_id,book_code)).fetchone()[0]
        verse_count=con.execute("""
            SELECT COUNT(*) FROM verses
            WHERE translation_id=? AND book_code=? AND chapter=?
        """,(translation_id,book_code,chapter)).fetchone()[0]
        current=con.execute("""
            SELECT text FROM verses
            WHERE translation_id=? AND book_code=? AND chapter=? AND verse=?
            LIMIT 1
        """,(translation_id,book_code,chapter,verse)).fetchone()
        prevv=con.execute("""
            SELECT verse,text FROM verses
            WHERE translation_id=? AND book_code=? AND chapter=?
              AND CAST(verse AS INTEGER) < CAST(? AS INTEGER)
            ORDER BY CAST(verse AS INTEGER) DESC LIMIT 1
        """,(translation_id,book_code,chapter,verse)).fetchone()
        nextv=con.execute("""
            SELECT verse,text FROM verses
            WHERE translation_id=? AND book_code=? AND chapter=?
              AND CAST(verse AS INTEGER) > CAST(? AS INTEGER)
            ORDER BY CAST(verse AS INTEGER) ASC LIMIT 1
        """,(translation_id,book_code,chapter,verse)).fetchone()
        strong_count=con.execute("""
            SELECT COUNT(*) FROM verse_words
            WHERE translation_id='engwebp' AND book_code=? AND chapter=? AND verse=?
              AND strong IS NOT NULL AND strong<>''
        """,(book_code,chapter,verse)).fetchone()[0]
        unique_strong=con.execute("""
            SELECT COUNT(DISTINCT CASE
                WHEN instr(strong,' ')>0 THEN substr(strong,1,instr(strong,' ')-1)
                ELSE strong END)
            FROM verse_words
            WHERE translation_id='engwebp' AND book_code=? AND chapter=? AND verse=?
              AND strong IS NOT NULL AND strong<>''
        """,(book_code,chapter,verse)).fetchone()[0]
    testament="Antigo Testamento" if int(book["canonical_order"])<=39 else "Novo Testamento"
    return {
        "book":{
            "code":book["code"],"name_pt":book["name_pt"],"name_en":book["name_en"],
            "canonical_order":book["canonical_order"],"testament":testament,
            "chapters":chapter_count
        },
        "passage":{
            "chapter":chapter,"verse":verse,
            "text":current["text"] if current else "",
            "chapter_verse_count":verse_count
        },
        "neighbors":{
            "previous":dict(prevv) if prevv else None,
            "next":dict(nextv) if nextv else None
        },
        "strong":{
            "word_markers":strong_count,
            "unique_entries":unique_strong
        }
    }


def search_text(q: str, translation_id: str, limit: int = 50):
    q = (q or "").strip()
    if not q:
        return []
    limit = max(1, min(int(limit), 100))
    # FTS5 MATCH may reject punctuation-heavy input. Fall back to LIKE.
    with connect() as con:
        try:
            rows = con.execute("""
                SELECT translation_id,book_code,chapter,verse,text
                FROM verse_search
                WHERE verse_search MATCH ? AND translation_id=?
                LIMIT ?
            """, (q, translation_id, limit)).fetchall()
        except sqlite3.OperationalError:
            rows = []
        if not rows:
            rows = con.execute("""
                SELECT translation_id,book_code,chapter,verse,text
                FROM verses
                WHERE translation_id=? AND text LIKE ?
                LIMIT ?
            """, (translation_id, f"%{q}%", limit)).fetchall()
        return [dict(r) for r in rows]


def normalize_alias(value: str) -> str:
    import unicodedata, re
    value = unicodedata.normalize("NFD", (value or "").lower())
    value = "".join(c for c in value if unicodedata.category(c) != "Mn")
    return re.sub(r"[^a-z0-9]+", " ", value).strip()

def resolve_book(name_or_code: str, language: str = "pt"):
    value = (name_or_code or "").strip()
    if not value:
        return None
    code = value.upper()
    with connect() as con:
        row = con.execute("SELECT code,name_pt,name_en,canonical_order FROM books WHERE code=?", (code,)).fetchone()
        if row:
            return dict(row)
        n = normalize_alias(value)
        row = con.execute("""
            SELECT b.code,b.name_pt,b.name_en,b.canonical_order
            FROM book_aliases a JOIN books b ON b.code=a.book_code
            WHERE a.normalized_alias=?
            ORDER BY CASE WHEN a.language=? THEN 0 ELSE 1 END
            LIMIT 1
        """, (n, language)).fetchone()
        return dict(row) if row else None

def parse_reference(reference: str, language: str = "pt"):
    import re
    raw = (reference or "").strip()
    m = re.match(r"^\s*(.+?)\s+(\d+)(?:\s*[:.,]\s*(\d+[a-z]?)(?:\s*[-–]\s*(\d+[a-z]?))?)?\s*$", raw, re.I)
    if not m:
        return None
    book = resolve_book(m.group(1), language)
    if not book:
        return None
    return {
        "raw": raw,
        "book_code": book["code"],
        "book_name": book["name_pt"] if language == "pt" else book["name_en"],
        "chapter": int(m.group(2)),
        "verse_start": m.group(3),
        "verse_end": m.group(4)
    }

def get_reference(translation_id: str, reference: str, language: str = "pt"):
    parsed = parse_reference(reference, language)
    if not parsed:
        return None
    if not parsed["verse_start"]:
        return {"reference": parsed, "verses": get_chapter(translation_id, parsed["book_code"], parsed["chapter"])}
    if not parsed["verse_end"]:
        item = get_verse(translation_id, parsed["book_code"], parsed["chapter"], parsed["verse_start"])
        return {"reference": parsed, "verses": [item] if item else []}
    import re
    start = int(re.match(r"\d+", parsed["verse_start"]).group())
    end = int(re.match(r"\d+", parsed["verse_end"]).group())
    with connect() as con:
        rows = con.execute("""
            SELECT translation_id,book_code,chapter,verse,text,source_file
            FROM verses
            WHERE translation_id=? AND book_code=? AND chapter=?
              AND CAST(verse AS INTEGER) BETWEEN ? AND ?
            ORDER BY CAST(verse AS INTEGER), verse
        """, (translation_id, parsed["book_code"], parsed["chapter"], start, end)).fetchall()
        return {"reference": parsed, "verses": [dict(r) for r in rows]}
