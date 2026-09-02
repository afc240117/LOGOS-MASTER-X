
from pathlib import Path
from collections import Counter
from functools import lru_cache
import json
import re
import sqlite3
import unicodedata

DB_PATH = (Path(__file__).resolve().parent / "biblia_x.sqlite3").resolve()
STRONG_WORDS_SOURCE_ID = "engwebp"  # corpus original (fortemente alinhado) vive sob a tradução WEB
STRONG_COMMON_ALIASES = {
    "G26": "agape amor",
    "G4102": "pistis fe",
    "H430": "elohim deus",
    "H2617": "chesed hesed misericordia amor leal",
    "H7965": "shalom paz",
}
LEXICON_COMMON_ALIASES = {
    "G25": "agapao amar amor love",
    "G26": "agape amor caridade benevolencia love charity",
    "G27": "agapetos amado querida querido",
    "G40": "hagios santo santidade consagrado",
    "G1515": "eirene paz tranquilidade harmonia",
    "G1680": "elpis esperança esperanca hope",
    "G1577": "ekklesia igreja assembleia congregacao congregação",
    "G2316": "theos deus divindade",
    "G2424": "iesous jesus",
    "G3056": "logos palavra verbo mensagem",
    "G4102": "pistis fé fe confiança confianca fidelidade faith belief",
    "G4151": "pneuma espírito espirito sopro vento",
    "G4991": "soteria salvação salvacao livramento",
    "G5485": "charis graça graca favor grace",
    "G5368": "phileo amar amor amizade afeição afeiçao love friendship",
    "G5547": "christos cristo messias ungido",
    "H1": "ab pai ancestral",
    "H430": "elohim deus deuses",
    "H157": "ahab amar amor afeição afeiçao",
    "H539": "aman fé fe fidelidade confiar firme faith faithful",
    "H1285": "berit aliança alianca pacto",
    "H2580": "chen graça graca favor grace",
    "H2617": "hesed chesed misericórdia misericordia amor leal bondade fidelidade mercy kindness love",
    "H3068": "yhwh yahweh javé jave senhor",
    "H3444": "yeshuah salvação salvacao livramento",
    "H6664": "tsedaqah justiça justica retidão retidao",
    "H6944": "qodesh santo santidade sagrado",
    "H7225": "bereshit princípio principio começo comeco",
    "H7307": "ruach espírito espirito vento sopro",
    "H7965": "shalom paz bem estar integridade",
    "H8615": "tiqvah esperança esperanca expectativa",
}
LEXICON_PORTUGUESE_TERMS = {
    _search for _search in (
        "amor amar amado caridade benevolencia santo santidade consagrado "
        "esperanca igreja assembleia congregacao deus divindade palavra verbo "
        "mensagem fe confianca fidelidade espirito sopro vento salvacao "
        "livramento graca favor cristo messias ungido pai alianca pacto "
        "misericordia bondade senhor justica retidao sagrado principio comeco "
        "paz tranquilidade harmonia integridade amizade afeicao"
    ).split()
}
CONTEXT_QUERY_ALIASES = {
    "alianca": "covenant",
    "altar": "altar",
    "apostolo": "apostle",
    "assiria": "assyria assyrian",
    "babilonia": "babylon babylonia babylonian",
    "casamento": "marriage wedding",
    "cidade": "city town",
    "corinto": "corinth corinthian",
    "deserto": "wilderness desert",
    "egito": "egypt egyptian",
    "exilio": "exile captivity",
    "festa": "feast festival",
    "galileia": "galilee",
    "genealogia": "genealogy",
    "grecia": "greece greek",
    "heranca": "inheritance",
    "jerusalem": "jerusalem",
    "judá": "judah judaea judea",
    "juda": "judah judaea judea",
    "judeia": "judaea judea",
    "lei": "law",
    "moeda": "coin money",
    "pacto": "covenant",
    "pascoa": "passover",
    "persia": "persia persian",
    "profeta": "prophet",
    "rei": "king kingship",
    "reino": "kingdom",
    "roma": "rome roman",
    "sacerdote": "priest priesthood",
    "sacrificio": "sacrifice offering",
    "samaria": "samaria samaritan",
    "sinagoga": "synagogue",
    "templo": "temple sanctuary",
}
CONTEXT_STRONG_STOP = {
    "G1161", "G1473", "G1519", "G1722", "G2532", "G3588", "G3754",
    "G846", "H853", "H834", "H413", "H4480", "H5921", "H3605",
    "H1931", "H2088", "H5973",
}
LEXICON_POS_PT = {
    "v": "verbo",
    "n": "substantivo",
    "n-m": "substantivo masculino",
    "n-f": "substantivo feminino",
    "n-pr": "nome próprio",
    "n-pr-m": "nome próprio masculino",
    "n-pr-f": "nome próprio feminino",
    "n-pr-loc": "nome próprio de lugar",
    "n-loc": "substantivo de lugar",
    "n-m-loc": "substantivo masculino de lugar",
    "a": "adjetivo",
    "adj": "adjetivo",
    "a-m": "adjetivo masculino",
    "a-f": "adjetivo feminino",
    "a-gent": "adjetivo gentílico",
    "adv": "advérbio",
    "prep": "preposição",
    "conj": "conjunção",
    "pron": "pronome",
    "inj": "interjeição",
    "i": "interjeição",
    "prt": "partícula",
    "p": "partícula",
    "d": "advérbio demonstrativo",
    "r": "pronome relativo",
}


def normalize_strong_number(value: str) -> str:
    """Return the canonical compact Strong number (for example G26/H430)."""

    raw = re.sub(r"[\s._-]+", "", (value or "").strip().upper())
    match = re.fullmatch(r"([GH])0*(\d{1,5})", raw)
    if not match:
        return ""
    return f"{match.group(1)}{int(match.group(2))}"


def _search_key(value: str) -> str:
    value = unicodedata.normalize("NFKD", str(value or "")).casefold()
    value = "".join(char for char in value if not unicodedata.combining(char))
    return re.sub(r"[^0-9a-zα-ωא-ת]+", " ", value).strip()


def _language_code(value: str) -> str:
    raw = (value or "").strip().upper()
    if raw.startswith("H"):
        return "H"
    if raw.startswith("G"):
        return "G"
    return ""

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


@lru_cache(maxsize=16)
def corpus_status(translation_id: str = "porbr2018"):
    """Return a lightweight, truthful snapshot of the bundled Bible corpus."""
    selected = str(translation_id or "").strip()
    with connect() as con:
        translations = int(con.execute(
            "SELECT COUNT(*) FROM translations WHERE status='active'"
        ).fetchone()[0])
        params: tuple[str, ...] = ()
        where = ""
        if selected:
            where = "WHERE translation_id=?"
            params = (selected,)
        row = con.execute(
            f"""
            SELECT COUNT(*) AS verses,
                   COUNT(DISTINCT book_code) AS books,
                   COUNT(DISTINCT book_code||':'||chapter) AS chapters
            FROM verses {where}
            """,
            params,
        ).fetchone()
        return {
            "ready": bool(row["verses"]),
            "translation": selected or "all",
            "translations": translations,
            "verses": int(row["verses"] or 0),
            "books": int(row["books"] or 0),
            "chapters": int(row["chapters"] or 0),
        }

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
    source_translation = STRONG_WORDS_SOURCE_ID
    with connect() as con:
        rows = con.execute("""
            SELECT w.word_index,w.surface,w.strong,w.lemma,w.morph,
                   l.language,l.lemma AS lexicon_lemma,
                   l.transliteration AS transliteration,
                   l.transliteration AS lexicon_transliteration,
                   l.transliteration AS form_transliteration,
                   l.pronunciation AS pronunciation,
                   l.definition,l.kjv_definition,l.derivation,l.source
            FROM verse_words w
            LEFT JOIN strong_lexicon l
              ON l.strong=w.strong
            WHERE w.translation_id=? AND w.book_code=? AND w.chapter=? AND w.verse=?
            ORDER BY w.word_index
        """, (source_translation, book_code, chapter, verse)).fetchall()
        return [dict(r) for r in rows]


def _strong_occurrence_counts(con: sqlite3.Connection, numbers: list[str]) -> dict[str, int]:
    if not numbers:
        return {}
    placeholders = ",".join("?" for _ in numbers)
    rows = con.execute(f"""
        SELECT strong,COUNT(*) AS total
        FROM verse_words
        WHERE translation_id=? AND strong IN ({placeholders})
        GROUP BY strong
    """, (STRONG_WORDS_SOURCE_ID, *numbers)).fetchall()
    return {row["strong"]: int(row["total"]) for row in rows}


def get_strong_entry(strong: str):
    strong = normalize_strong_number(strong)
    if not strong:
        return None
    with connect() as con:
        row=con.execute("""
            SELECT strong,language,lemma,transliteration,pronunciation,definition,
                   kjv_definition,derivation,source
            FROM strong_lexicon WHERE strong=?
        """,(strong,)).fetchone()
        if not row:
            return None
        item = dict(row)
        item["number"] = strong
        item["language_code"] = strong[0]
        item["language_pt"] = "Hebraico" if strong.startswith("H") else "Grego"
        item["occurrence_count"] = _strong_occurrence_counts(con, [strong]).get(strong, 0)
        related = []
        for number in re.findall(
            r"\b[GH]0*\d{1,5}\b",
            " ".join(str(item.get(key) or "") for key in ("derivation", "definition", "kjv_definition")),
            flags=re.IGNORECASE,
        ):
            normalized = normalize_strong_number(number)
            if normalized and normalized != strong and normalized not in related:
                related.append(normalized)
        item["related"] = related
        item["definition_language"] = "en"
        return item


def strong_search(q: str = "", language: str = "", limit: int = 50, offset: int = 0):
    q = (q or "").strip()
    language_code = _language_code(language)
    limit = max(1, min(int(limit), 100))
    offset = max(0, min(int(offset), 10000))
    exact_number = normalize_strong_number(q)
    term = _search_key(q)

    with connect() as con:
        sql = """
            SELECT strong,language,lemma,transliteration,pronunciation,
                   definition,kjv_definition,derivation,source
            FROM strong_lexicon
        """
        params: list[object] = []
        if language_code:
            sql += " WHERE strong LIKE ?"
            params.append(language_code + "%")
        rows = [dict(row) for row in con.execute(sql, params).fetchall()]

        def score(item: dict) -> tuple[int, int, str]:
            number = item["strong"]
            lemma = _search_key(item.get("lemma"))
            transliteration = _search_key(item.get("transliteration"))
            aliases = _search_key(STRONG_COMMON_ALIASES.get(number, ""))
            searchable = _search_key(" ".join(str(item.get(key) or "") for key in (
                "strong", "lemma", "transliteration", "definition", "kjv_definition", "derivation"
            )) + " " + aliases)
            if exact_number and number == exact_number:
                rank = 0
            elif term and lemma == term:
                rank = 1
            elif term and transliteration == term:
                rank = 2
            elif term and term in aliases.split():
                rank = 2
            elif term and (lemma.startswith(term) or transliteration.startswith(term)):
                rank = 3
            elif term and term in searchable:
                rank = 4
            elif term:
                rank = 99
            else:
                rank = 5
            return rank, int(number[1:]), number[0]

        if exact_number:
            rows = [item for item in rows if item["strong"] == exact_number]
        elif term:
            rows = [item for item in rows if score(item)[0] < 99]
        rows.sort(key=score)
        total = len(rows)
        page = rows[offset:offset + limit]
        counts = _strong_occurrence_counts(con, [item["strong"] for item in page])
        for item in page:
            item["number"] = item["strong"]
            item["language_code"] = item["strong"][0]
            item["language_pt"] = "Hebraico" if item["strong"].startswith("H") else "Grego"
            item["occurrence_count"] = counts.get(item["strong"], 0)
            item["definition_language"] = "en"
        return {"items": page, "total": total, "limit": limit, "offset": offset}

def _decode_json_list(value: object) -> list[str]:
    try:
        data = json.loads(str(value or "[]"))
    except (TypeError, ValueError, json.JSONDecodeError):
        return []
    if not isinstance(data, list):
        return []
    return [str(item) for item in data if str(item or "").strip()]


def _lexicon_pos_pt(value: str) -> str:
    code = str(value or "").strip()
    if not code:
        return "Não informado na fonte"
    if code in LEXICON_POS_PT:
        return LEXICON_POS_PT[code]
    parts = [LEXICON_POS_PT.get(part, part) for part in code.split()]
    return " / ".join(parts)


def _lexicon_summary(row: sqlite3.Row | dict) -> dict:
    item = dict(row)
    strong = normalize_strong_number(str(item.get("strong") or ""))
    language_code = "H" if str(item.get("language") or "").startswith("Heb") else "G"
    senses = _decode_json_list(item.pop("senses_json", "[]"))
    item.pop("related_json", None)
    item.pop("data_json", None)
    item.update({
        "number": strong,
        "strong": strong,
        "language_code": language_code,
        "language_pt": "Hebraico" if language_code == "H" else "Grego",
        "part_of_speech_pt": _lexicon_pos_pt(str(item.get("part_of_speech") or "")),
        "sense_count": len(senses),
        "definition_language": "en",
        "source_license": "Public Domain / CC0 (BibleForgeDB)",
    })
    return item


def _lexicon_alias_numbers(term: str) -> list[str]:
    if not term:
        return []
    return [
        number for number, aliases in LEXICON_COMMON_ALIASES.items()
        if term == _search_key(number)
        or term in _search_key(aliases).split()
        or (len(term) >= 4 and term in _search_key(aliases))
    ]


def _lexicon_match_cte(
    q: str,
    term: str,
    alias_numbers: list[str],
) -> tuple[str, list[object]]:
    original_tokens = re.findall(
        r"[\u0370-\u03ff\u1f00-\u1fff\u0590-\u05ff]+",
        unicodedata.normalize("NFC", q),
    )
    tokens = original_tokens or [token for token in term.split() if token]
    fts_query = " AND ".join(f'"{token}"*' for token in tokens)
    clauses: list[str] = []
    params: list[object] = []
    if alias_numbers:
        placeholders = ",".join("?" for _ in alias_numbers)
        clauses.append(
            f"SELECT id AS entry_id,-100.0 AS rank FROM lexicon_entries "
            f"WHERE strong IN ({placeholders})"
        )
        params.extend(alias_numbers)
    if fts_query and (not alias_numbers or term not in LEXICON_PORTUGUESE_TERMS):
        clauses.append(
            "SELECT entry_id,0.0 AS rank "
            "FROM lexicon_fts WHERE lexicon_fts MATCH ?"
        )
        params.append(fts_query)
    if not clauses:
        clauses.append("SELECT id AS entry_id,0.0 AS rank FROM lexicon_entries WHERE 0")
    return (
        "WITH ranked AS (" + " UNION ALL ".join(clauses) + "), "
        "best AS (SELECT entry_id,MIN(rank) AS rank FROM ranked GROUP BY entry_id) ",
        params,
    )


def lexicon_search(
    q: str = "",
    language: str = "",
    limit: int = 50,
    offset: int = 0,
):
    q = (q or "").strip()
    language_code = _language_code(language)
    limit = max(1, min(int(limit), 100))
    offset = max(0, min(int(offset), 10000))
    exact_number = normalize_strong_number(q)
    term = _search_key(q)

    with connect() as con:
        exists = con.execute(
            "SELECT 1 FROM sqlite_master WHERE type='table' AND name='lexicon_entries'"
        ).fetchone()
        if not exists:
            return {"items": [], "total": 0, "limit": limit, "offset": offset}

        language_sql = ""
        language_params: list[object] = []
        if language_code:
            language_sql = " AND e.language=?"
            language_params.append("Hebrew" if language_code == "H" else "Greek")

        if exact_number:
            count = con.execute(
                "SELECT COUNT(*) FROM lexicon_entries e WHERE e.strong=?" + language_sql,
                [exact_number, *language_params],
            ).fetchone()[0]
            rows = con.execute(
                """
                SELECT e.* FROM lexicon_entries e
                WHERE e.strong=?
                """ + language_sql + " ORDER BY e.source_row_id LIMIT ? OFFSET ?",
                [exact_number, *language_params, limit, offset],
            ).fetchall()
        elif term:
            aliases = _lexicon_alias_numbers(term)
            cte, cte_params = _lexicon_match_cte(q, term, aliases)
            count = con.execute(
                cte
                + "SELECT COUNT(*) FROM best JOIN lexicon_entries e ON e.id=best.entry_id "
                + "WHERE 1=1" + language_sql,
                [*cte_params, *language_params],
            ).fetchone()[0]
            rows = con.execute(
                cte
                + """
                SELECT e.*,best.rank FROM best
                JOIN lexicon_entries e ON e.id=best.entry_id
                WHERE 1=1
                """ + language_sql + """
                ORDER BY best.rank,
                         CASE WHEN e.strong LIKE 'G%' THEN 0 ELSE 1 END,
                         CAST(SUBSTR(e.strong,2) AS INTEGER),e.source_row_id
                LIMIT ? OFFSET ?
                """,
                [*cte_params, *language_params, limit, offset],
            ).fetchall()
        else:
            count = con.execute(
                "SELECT COUNT(*) FROM lexicon_entries e WHERE 1=1" + language_sql,
                language_params,
            ).fetchone()[0]
            rows = con.execute(
                """
                SELECT e.* FROM lexicon_entries e WHERE 1=1
                """ + language_sql + """
                ORDER BY CASE WHEN e.strong LIKE 'G%' THEN 0 ELSE 1 END,
                         CAST(SUBSTR(e.strong,2) AS INTEGER),e.source_row_id
                LIMIT ? OFFSET ?
                """,
                [*language_params, limit, offset],
            ).fetchall()

        items = [_lexicon_summary(row) for row in rows]
        counts = _strong_occurrence_counts(con, [item["strong"] for item in items])
        for item in items:
            item["occurrence_count"] = counts.get(item["strong"], 0)
        return {"items": items, "total": int(count), "limit": limit, "offset": offset}


def get_lexicon_entry(entry_id: str = "", strong: str = ""):
    entry_id = str(entry_id or "").strip()
    strong = normalize_strong_number(strong or entry_id)
    with connect() as con:
        if entry_id and ":" in entry_id:
            row = con.execute(
                "SELECT * FROM lexicon_entries WHERE id=?", (entry_id,)
            ).fetchone()
        elif strong:
            row = con.execute(
                """
                SELECT * FROM lexicon_entries WHERE strong=?
                ORDER BY source_row_id LIMIT 1
                """,
                (strong,),
            ).fetchone()
        else:
            row = None
        if not row:
            return None

        raw = dict(row)
        item = _lexicon_summary(raw)
        item["senses"] = _decode_json_list(raw.get("senses_json"))
        related: list[str] = []
        for value in _decode_json_list(raw.get("related_json")) + re.findall(
            r"\b[GH]0*\d{1,5}\b", str(raw.get("derivation") or ""), re.IGNORECASE
        ):
            number = normalize_strong_number(value)
            if number and number != item["strong"] and number not in related:
                related.append(number)
        item["related"] = related

        occurrence_count = con.execute(
            """
            SELECT COUNT(*) FROM verse_words
            WHERE translation_id=? AND strong=?
            """,
            (STRONG_WORDS_SOURCE_ID, item["strong"]),
        ).fetchone()[0]
        forms_total = con.execute(
            """
            SELECT COUNT(DISTINCT surface) FROM verse_words
            WHERE translation_id=? AND strong=?
            """,
            (STRONG_WORDS_SOURCE_ID, item["strong"]),
        ).fetchone()[0]
        form_rows = con.execute(
            """
            SELECT surface,
                   MAX(NULLIF(transliteration,'')) AS transliteration,
                   MAX(NULLIF(pronunciation,'')) AS pronunciation,
                   COUNT(*) AS count
            FROM verse_words
            WHERE translation_id=? AND strong=?
            GROUP BY surface
            ORDER BY count DESC,surface
            LIMIT 40
            """,
            (STRONG_WORDS_SOURCE_ID, item["strong"]),
        ).fetchall()
        morphology_rows = con.execute(
            """
            SELECT morph,COUNT(*) AS count
            FROM verse_words
            WHERE translation_id=? AND strong=? AND morph IS NOT NULL AND morph<>''
            GROUP BY morph ORDER BY count DESC,morph LIMIT 30
            """,
            (STRONG_WORDS_SOURCE_ID, item["strong"]),
        ).fetchall()
        variant_rows = con.execute(
            """
            SELECT id,strong,language,lemma,transliteration,pronunciation,
                   part_of_speech,definition_short,senses_json,literal,usage,
                   derivation,comment,aramaic,source
            FROM lexicon_entries WHERE strong=? ORDER BY source_row_id
            """,
            (item["strong"],),
        ).fetchall()

        related_entries = []
        for number in related[:24]:
            related_row = con.execute(
                """
                SELECT * FROM lexicon_entries WHERE strong=?
                ORDER BY source_row_id LIMIT 1
                """,
                (number,),
            ).fetchone()
            if related_row:
                related_entries.append(_lexicon_summary(related_row))

        item.update({
            "occurrence_count": int(occurrence_count),
            "forms_total": int(forms_total),
            "forms": [dict(row) for row in form_rows],
            "morphologies": [dict(row) for row in morphology_rows],
            "variants": [_lexicon_summary(row) for row in variant_rows],
            "variant_count": len(variant_rows),
            "related_entries": related_entries,
            "source_repository": "https://github.com/bibleforge/BibleForgeDB",
            "source_note_pt": (
                "Definições, sentidos e glosas de uso são preservados em inglês, "
                "como na fonte pública original; a interface permanece em português."
            ),
        })
        return item


def lexicon_status():
    with connect() as con:
        exists = con.execute(
            "SELECT 1 FROM sqlite_master WHERE type='table' AND name='lexicon_entries'"
        ).fetchone()
        if not exists:
            return {
                "ready": False,
                "entries": {"total": 0, "hebrew": 0, "greek": 0, "unique_strong": 0},
                "corpus": {"words": 0, "forms": 0, "morphologies": 0},
                "metadata": {},
            }
        entries = con.execute(
            """
            SELECT COUNT(*) AS total,
                   SUM(language='Hebrew') AS hebrew,
                   SUM(language='Greek') AS greek,
                   COUNT(DISTINCT strong) AS unique_strong
            FROM lexicon_entries
            """
        ).fetchone()
        corpus = con.execute(
            """
            SELECT COUNT(*) AS words,
                   COUNT(DISTINCT CASE WHEN strong IS NOT NULL AND strong<>''
                     THEN strong||char(31)||surface END) AS forms,
                   COUNT(DISTINCT CASE WHEN morph IS NOT NULL AND morph<>''
                     THEN morph END) AS morphologies
            FROM verse_words WHERE translation_id=?
            """,
            (STRONG_WORDS_SOURCE_ID,),
        ).fetchone()
        metadata = {
            row["key"]: row["value"]
            for row in con.execute("SELECT key,value FROM lexicon_metadata").fetchall()
        }
        return {
            "ready": bool(entries["total"]),
            "entries": {
                "total": int(entries["total"] or 0),
                "hebrew": int(entries["hebrew"] or 0),
                "greek": int(entries["greek"] or 0),
                "unique_strong": int(entries["unique_strong"] or 0),
                "long_senses": int(metadata.get("long_senses", 0)),
            },
            "corpus": {
                "words": int(corpus["words"] or 0),
                "forms": int(corpus["forms"] or 0),
                "morphologies": int(corpus["morphologies"] or 0),
            },
            "metadata": metadata,
        }

def strong_occurrence_page(
    strong: str,
    limit: int = 100,
    offset: int = 0,
    translation_id: str = "porbr2018",
    surface: str = "",
):
    strong = normalize_strong_number(strong)
    if not strong:
        return {"number": "", "items": [], "total": 0, "limit": 0, "offset": 0}
    limit=max(1,min(int(limit),200))
    offset=max(0,min(int(offset),10000))
    surface = str(surface or "").strip()
    surface_sql = " AND surface=?" if surface else ""
    surface_params: list[object] = [surface] if surface else []
    with connect() as con:
        total = con.execute("""
            SELECT COUNT(*) FROM verse_words
            WHERE translation_id=? AND strong=?
        """ + surface_sql, (STRONG_WORDS_SOURCE_ID, strong, *surface_params)).fetchone()[0]
        rows=con.execute("""
            SELECT w.book_code,w.chapter,w.verse,w.word_index,w.surface,w.strong,
                   w.morph,l.transliteration AS transliteration,l.pronunciation,
                   l.lemma AS lemma_transliteration,
                   b.name_pt,b.name_en,v.text AS verse_text
            FROM verse_words w
            JOIN books b ON b.code=w.book_code
            LEFT JOIN strong_lexicon l ON l.strong=w.strong
            LEFT JOIN verses v
             ON v.translation_id=? AND v.book_code=w.book_code
             AND v.chapter=w.chapter AND v.verse=w.verse
            WHERE w.translation_id=? AND w.strong=?
        """ + (" AND w.surface=?" if surface else "") + """
            ORDER BY b.canonical_order,w.chapter,
                     CASE WHEN w.verse GLOB '[0-9]*' THEN CAST(w.verse AS INTEGER) ELSE 9999 END,
                     w.word_index
            LIMIT ? OFFSET ?
        """,(translation_id,STRONG_WORDS_SOURCE_ID,strong,*surface_params,limit,offset)).fetchall()
        out=[]
        for r in rows:
            d=dict(r)
            d["reference_pt"]=f'{d["name_pt"]} {d["chapter"]}:{d["verse"]}'
            out.append(d)
        return {
            "number": strong,
            "items": out,
            "total": int(total),
            "limit": limit,
            "offset": offset,
            "translation": translation_id,
            "surface": surface,
        }


def strong_occurrences(strong: str, limit: int = 100):
    return strong_occurrence_page(strong, limit)["items"]


def lexicon_occurrence_page(
    strong: str,
    limit: int = 100,
    offset: int = 0,
    translation_id: str = "porbr2018",
    surface: str = "",
):
    return strong_occurrence_page(strong, limit, offset, translation_id, surface)


def strong_status():
    with connect() as con:
        lexical = con.execute("""
            SELECT COUNT(*) AS total,
                   SUM(language='Hebrew') AS hebrew,
                   SUM(language='Greek') AS greek
            FROM strong_lexicon
        """).fetchone()
        corpus = con.execute("""
            SELECT COUNT(*) AS words,
                   COUNT(DISTINCT book_code) AS books,
                   COUNT(DISTINCT book_code||':'||chapter||':'||verse) AS verses,
                   COUNT(DISTINCT strong) AS unique_strong,
                   SUM(strong IS NULL OR strong='') AS untagged
            FROM verse_words WHERE translation_id=?
        """, (STRONG_WORDS_SOURCE_ID,)).fetchone()
        metadata = {
            row["key"]: row["value"]
            for row in con.execute("SELECT key,value FROM strong_metadata").fetchall()
        } if con.execute(
            "SELECT 1 FROM sqlite_master WHERE type='table' AND name='strong_metadata'"
        ).fetchone() else {}
        return {
            "ready": bool(corpus["words"] and lexical["total"]),
            "lexicon": {
                "total": int(lexical["total"] or 0),
                "hebrew": int(lexical["hebrew"] or 0),
                "greek": int(lexical["greek"] or 0),
            },
            "corpus": {
                "words": int(corpus["words"] or 0),
                "books": int(corpus["books"] or 0),
                "verses": int(corpus["verses"] or 0),
                "unique_strong": int(corpus["unique_strong"] or 0),
                "untagged": int(corpus["untagged"] or 0),
            },
            "metadata": metadata,
        }


def _context_ready(connection: sqlite3.Connection) -> bool:
    return bool(connection.execute(
        """SELECT 1 FROM sqlite_master
           WHERE type='table' AND name='context_book_profiles'"""
    ).fetchone())


def context_status():
    with connect() as con:
        if not _context_ready(con):
            return {
                "ready": False,
                "profiles": 0,
                "chapters": 0,
                "articles": 0,
                "types": {},
                "metadata": {},
            }
        metadata = {
            row["key"]: row["value"]
            for row in con.execute("SELECT key,value FROM context_metadata")
        }
        return {
            "ready": True,
            "profiles": int(con.execute(
                "SELECT COUNT(*) FROM context_book_profiles"
            ).fetchone()[0]),
            "chapters": int(con.execute(
                """SELECT COUNT(*) FROM navigation_cache
                   WHERE translation_id='porbr2018'"""
            ).fetchone()[0]),
            "articles": int(con.execute(
                "SELECT COUNT(*) FROM context_articles"
            ).fetchone()[0]),
            "types": {
                kind: int(metadata.get(f"articles_{kind}", "0") or 0)
                for kind in ("historical", "cultural", "literary", "geographic")
            },
            "metadata": metadata,
        }


def _context_profile(row: sqlite3.Row | dict) -> dict:
    item = dict(row)
    item.update({
        "kind": "book",
        "id": f"book:{item['book_code']}",
        "title": item.get("name_pt") or item["book_code"],
        "name_en": item.get("name_en") or "",
        "testament": (
            "Antigo Testamento"
            if int(item.get("canonical_order") or 0) <= 39
            else "Novo Testamento"
        ),
        "types": ["historical", "cultural", "literary", "geographic"],
        "themes": _decode_json_list(item.pop("themes_json", "[]")),
        "places": _decode_json_list(item.pop("places_json", "[]")),
        "outline": _decode_json_list(item.pop("outline_json", "[]")),
        "key_refs": _decode_json_list(item.pop("key_refs_json", "[]")),
        "summary": item.get("purpose") or "",
    })
    return item


def get_context_book_profile(book_code: str):
    with connect() as con:
        if not _context_ready(con):
            return None
        row = con.execute(
            """SELECT p.*,b.name_pt,b.name_en,b.canonical_order
               FROM context_book_profiles p
               JOIN books b ON b.code=p.book_code
               WHERE p.book_code=?""",
            ((book_code or "").upper(),),
        ).fetchone()
        return _context_profile(row) if row else None


def get_context_article(article_id: str):
    with connect() as con:
        if not _context_ready(con):
            return None
        row = con.execute(
            """SELECT id,title,body,types_json,language,source,source_license,
                      source_url,source_order
               FROM context_articles WHERE id=?""",
            (article_id,),
        ).fetchone()
        if not row:
            return None
        item = dict(row)
        item.update({
            "kind": "article",
            "types": _decode_json_list(item.pop("types_json", "[]")),
            "source_note_pt": (
                "Verbete histórico preservado no inglês original da edição de "
                "1897. Consulte criticamente: nomenclatura, cronologias e algumas "
                "conclusões refletem a época da obra."
            ),
        })
        return item


def _context_alias_terms(term: str) -> list[str]:
    aliases: list[str] = []
    if term in CONTEXT_QUERY_ALIASES:
        aliases.extend(CONTEXT_QUERY_ALIASES[term].split())
    for token in term.split():
        aliases.extend(CONTEXT_QUERY_ALIASES.get(token, "").split())
    return list(dict.fromkeys(item for item in aliases if item))


def _context_fts_expression(term: str) -> str:
    tokens = [token for token in term.split() if len(token) >= 2]
    tokens.extend(_context_alias_terms(term))
    tokens = list(dict.fromkeys(tokens))
    return " OR ".join(f'"{token}"*' for token in tokens[:16])


def context_search(
    q: str = "",
    context_type: str = "all",
    limit: int = 50,
    offset: int = 0,
):
    q = (q or "").strip()
    context_type = (context_type or "all").strip().lower()
    if context_type not in {"all", "historical", "cultural", "literary", "geographic"}:
        context_type = "all"
    limit = max(1, min(int(limit), 100))
    offset = max(0, min(int(offset), 10000))
    term = _search_key(q)
    parsed = parse_reference(q, "pt") if q else None
    exact_book = None if parsed else resolve_book(q, "pt") if q else None

    with connect() as con:
        if not _context_ready(con):
            return {"items": [], "total": 0, "limit": limit, "offset": offset}
        rows = con.execute(
            """SELECT p.*,b.name_pt,b.name_en,b.canonical_order
               FROM context_book_profiles p JOIN books b ON b.code=p.book_code
               ORDER BY b.canonical_order"""
        ).fetchall()
        profiles = [_context_profile(row) for row in rows]
        requested_chapter = None
        requested_verse = None
        if parsed:
            profiles = [item for item in profiles if item["book_code"] == parsed["book_code"]]
            requested_chapter = parsed["chapter"]
            requested_verse = parsed["verse_start"]
        elif exact_book:
            profiles = [item for item in profiles if item["book_code"] == exact_book["code"]]
        elif term:
            matched = []
            for item in profiles:
                fields = [
                    item.get("book_code"), item.get("title"), item.get("name_en"),
                    item.get("genre"), item.get("period"), item.get("authorship"),
                    item.get("audience"), item.get("purpose"), item.get("historical"),
                    item.get("cultural"), item.get("literary"), item.get("geographic"),
                    *item.get("themes", []), *item.get("places", []),
                    *item.get("outline", []), *item.get("key_refs", []),
                ]
                searchable = _search_key(" ".join(str(value or "") for value in fields))
                if term not in searchable:
                    continue
                title_key = _search_key(item["title"])
                theme_keys = [_search_key(value) for value in item.get("themes", [])]
                rank = (
                    0 if title_key == term
                    else 1 if title_key.startswith(term)
                    else 2 if term in theme_keys
                    else 3
                )
                matched.append((rank, int(item.get("canonical_order") or 0), item))
            matched.sort(key=lambda value: (value[0], value[1]))
            profiles = [value[2] for value in matched]

        for item in profiles:
            if requested_chapter:
                item["requested_chapter"] = requested_chapter
                item["requested_verse"] = requested_verse
                item["reference"] = (
                    f"{item['title']} {requested_chapter}"
                    + (f":{requested_verse}" if requested_verse else "")
                )
            else:
                item["reference"] = item["title"]

        article_total = 0
        fts_expression = _context_fts_expression(term) if term and not parsed else ""
        type_sql = ""
        type_params: list[object] = []
        if context_type != "all":
            type_sql = " AND a.types_json LIKE ?"
            type_params.append(f'%"{context_type}"%')
        if fts_expression:
            try:
                article_total = int(con.execute(
                    """SELECT COUNT(*)
                       FROM context_article_fts f
                       JOIN context_articles a ON a.id=f.article_id
                       WHERE context_article_fts MATCH ?""" + type_sql,
                    [fts_expression, *type_params],
                ).fetchone()[0])
            except sqlite3.OperationalError:
                fts_expression = ""

        profile_total = len(profiles)
        items = profiles[offset : offset + limit]
        remaining = limit - len(items)
        article_offset = max(0, offset - profile_total) if offset >= profile_total else 0
        if remaining and fts_expression:
            exact_keys = list(dict.fromkeys([term, *_context_alias_terms(term)]))[:12]
            exact_placeholders = ",".join("?" for _ in exact_keys)
            article_rows = con.execute(
                """SELECT a.id,a.title,a.body,a.types_json,a.language,a.source,
                          a.source_license,a.source_order,
                          CASE WHEN a.title_key IN (""" + exact_placeholders +
                ") THEN -1000.0 ELSE bm25(context_article_fts) END rank " +
                """FROM context_article_fts f
                   JOIN context_articles a ON a.id=f.article_id
                   WHERE context_article_fts MATCH ?""" + type_sql +
                " ORDER BY rank,a.source_order LIMIT ? OFFSET ?",
                [*exact_keys, fts_expression, *type_params, remaining, article_offset],
            ).fetchall()
            for row in article_rows:
                article = dict(row)
                body = re.sub(r"\s+", " ", article.pop("body", "")).strip()
                article.update({
                    "kind": "article",
                    "reference": "Enciclopédia histórica",
                    "types": _decode_json_list(article.pop("types_json", "[]")),
                    "summary": body[:260] + ("…" if len(body) > 260 else ""),
                    "period": "Edição histórica de 1897",
                })
                items.append(article)
        return {
            "items": items,
            "total": profile_total + article_total,
            "profiles_total": profile_total,
            "articles_total": article_total,
            "limit": limit,
            "offset": offset,
            "parsed_reference": parsed,
        }


def _context_original_terms(
    connection: sqlite3.Connection,
    book_code: str,
    chapter: int,
    limit: int = 10,
) -> list[dict]:
    rows = connection.execute(
        """SELECT w.strong,MAX(l.language) language,MAX(l.lemma) lemma,
                  MAX(l.transliteration) transliteration,
                  MAX(l.definition) definition,COUNT(*) occurrences
           FROM verse_words w
           LEFT JOIN strong_lexicon l ON l.strong=w.strong
           WHERE w.translation_id=? AND w.book_code=? AND w.chapter=?
             AND w.strong IS NOT NULL AND w.strong<>''
           GROUP BY w.strong
           ORDER BY occurrences DESC,w.strong
           LIMIT 80""",
        (STRONG_WORDS_SOURCE_ID, book_code, int(chapter)),
    ).fetchall()
    items = []
    for row in rows:
        if row["strong"] in CONTEXT_STRONG_STOP:
            continue
        item = dict(row)
        item["language_pt"] = (
            "Hebraico" if str(item.get("strong") or "").startswith("H") else "Grego"
        )
        item["definition"] = str(item.get("definition") or "")[:260]
        items.append(item)
        if len(items) >= limit:
            break
    return items


def context_book_snapshot(
    translation_id: str,
    book_code: str,
    chapter: int | None = None,
    verse: str | None = None,
):
    book_code = (book_code or "").upper()
    with connect() as con:
        if not _context_ready(con):
            return None
        row = con.execute(
            """SELECT p.*,b.name_pt,b.name_en,b.canonical_order
               FROM context_book_profiles p JOIN books b ON b.code=p.book_code
               WHERE p.book_code=?""",
            (book_code,),
        ).fetchone()
        if not row:
            return None
        profile = _context_profile(row)
        chapter_rows = con.execute(
            """SELECT chapter,verse_count FROM navigation_cache
               WHERE translation_id=? AND book_code=? ORDER BY chapter""",
            (translation_id, book_code),
        ).fetchall()
        if not chapter_rows:
            chapter_rows = con.execute(
                """SELECT chapter,COUNT(*) verse_count FROM verses
                   WHERE translation_id=? AND book_code=? GROUP BY chapter
                   ORDER BY chapter""",
                (translation_id, book_code),
            ).fetchall()
        chapters = [dict(item) for item in chapter_rows]
        selected = int(chapter or (chapters[0]["chapter"] if chapters else 1))
        chapter_item = next((item for item in chapters if int(item["chapter"]) == selected), None)
        if not chapter_item:
            return None
        chapter_numbers = [int(item["chapter"]) for item in chapters]
        position = chapter_numbers.index(selected)
        previous_chapter = chapter_numbers[position - 1] if position > 0 else None
        next_chapter = chapter_numbers[position + 1] if position + 1 < len(chapter_numbers) else None
        selected_text = None
        if verse:
            selected_text = con.execute(
                """SELECT text FROM verses WHERE translation_id=? AND book_code=?
                   AND chapter=? AND verse=?""",
                (translation_id, book_code, selected, str(verse)),
            ).fetchone()
        profile["chapter"] = {
            "number": selected,
            "verse_count": int(chapter_item["verse_count"] or 0),
            "book_chapters": len(chapters),
            "previous_reference": (
                f"{profile['title']} {previous_chapter}" if previous_chapter else None
            ),
            "next_reference": (
                f"{profile['title']} {next_chapter}" if next_chapter else None
            ),
            "selected_verse": str(verse) if verse else None,
            "selected_text": selected_text["text"] if selected_text else "",
            "original_terms": _context_original_terms(con, book_code, selected, 10),
        }
        profile["reference"] = (
            f"{profile['title']} {selected}" + (f":{verse}" if verse else "")
        )
        if profile.get("source_article_id"):
            source_row = con.execute(
                "SELECT title,body FROM context_articles WHERE id=?",
                (profile["source_article_id"],),
            ).fetchone()
            if source_row:
                body = str(source_row["body"] or "")
                profile["historical_source"] = {
                    "article_id": profile["source_article_id"],
                    "title": source_row["title"],
                    "excerpt": body[:900] + ("…" if len(body) > 900 else ""),
                    "language": "en",
                    "source": "Easton's Bible Dictionary, 3rd ed. (1897)",
                    "license": "Public Domain",
                }
        return profile


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
            WHERE translation_id=? AND book_code=? AND chapter=? AND verse=?
              AND strong IS NOT NULL AND strong<>''
        """,(STRONG_WORDS_SOURCE_ID,book_code,chapter,verse)).fetchone()[0]
        unique_strong=con.execute("""
            SELECT COUNT(DISTINCT strong)
            FROM verse_words
            WHERE translation_id=? AND book_code=? AND chapter=? AND verse=?
              AND strong IS NOT NULL AND strong<>''
        """,(STRONG_WORDS_SOURCE_ID,book_code,chapter,verse)).fetchone()[0]
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


def _verse_search_expression(q: str, mode: str) -> str:
    """Build a safe FTS5 expression from user text."""

    words = _search_key(q).split()
    if not words:
        return ""
    quoted = [f'"{word.replace(chr(34), chr(34) * 2)}"' for word in words]
    mode = (mode or "phrase").strip().lower()
    if mode == "any":
        return " OR ".join(quoted)
    if mode == "all":
        return " AND ".join(quoted)
    if mode == "word":
        return quoted[0] if len(quoted) == 1 else " AND ".join(quoted)
    return f'"{" ".join(words)}"'


def _search_scope_sql(
    scope: str,
    book: str = "",
    chapter: int | None = None,
    books: list[str] | None = None,
) -> tuple[list[str], list[object]]:
    clauses: list[str] = []
    params: list[object] = []
    scope = (scope or "all").strip().lower()
    ranges = {
        "ot": (1, 39),
        "nt": (40, 66),
        "pentateuch": (1, 5),
        "history": (6, 17),
        "wisdom": (18, 22),
        "prophets": (23, 39),
        "gospels": (40, 43),
        "pauline": (45, 57),
        "general": (58, 65),
    }
    if scope in ranges:
        start, end = ranges[scope]
        clauses.append("b.canonical_order BETWEEN ? AND ?")
        params.extend((start, end))
    if scope in {"book", "chapter"} and book:
        clauses.append("verse_search.book_code=?")
        params.append(book.upper())
    if scope == "chapter" and chapter:
        clauses.append("CAST(verse_search.chapter AS INTEGER)=?")
        params.append(int(chapter))
    if scope == "selected":
        selected = [str(code or "").strip().upper() for code in (books or []) if str(code or "").strip()]
        if not selected:
            clauses.append("1=0")
        else:
            clauses.append(f"verse_search.book_code IN ({','.join('?' for _ in selected)})")
            params.extend(selected)
    return clauses, params


def search_text_page(
    q: str,
    translation_id: str,
    limit: int = 50,
    offset: int = 0,
    mode: str = "phrase",
    scope: str = "all",
    book: str = "",
    chapter: int | None = None,
    books: list[str] | None = None,
    sort: str = "canon",
):
    """Search the complete installed translation with filters and a real total.

    The previous endpoint silently capped the corpus at 100 rows while the web
    client requested 1,000. FastAPI rejected that request with HTTP 422, which
    made whole-Bible searches look empty. This paged implementation keeps the
    FTS index, accepts the advanced UI filters and reports whether results were
    truncated by the caller's page size.
    """

    q = (q or "").strip()
    if not q:
        return {"items": [], "total": 0, "limit": 0, "offset": 0, "truncated": False}
    limit = max(1, min(int(limit), 35000))
    offset = max(0, min(int(offset), 35000))
    expression = _verse_search_expression(q, mode)
    scope_clauses, scope_params = _search_scope_sql(scope, book, chapter, books)
    base_clauses = ["verse_search.translation_id=?", *scope_clauses]
    base_params: list[object] = [translation_id, *scope_params]

    if expression:
        base_clauses.insert(0, "verse_search MATCH ?")
        base_params.insert(0, expression)
    else:
        base_clauses.append("verse_search.text LIKE ?")
        base_params.append(f"%{q}%")

    where = " AND ".join(base_clauses)
    order = (
        "bm25(verse_search),b.canonical_order,CAST(verse_search.chapter AS INTEGER),"
        "CAST(verse_search.verse AS INTEGER)"
        if (sort or "").lower() == "relevance" and expression
        else "b.name_pt,CAST(verse_search.chapter AS INTEGER),CAST(verse_search.verse AS INTEGER)"
        if (sort or "").lower() == "book"
        else "b.canonical_order,CAST(verse_search.chapter AS INTEGER),CAST(verse_search.verse AS INTEGER)"
    )
    with connect() as con:
        try:
            total = int(con.execute(
                f"""SELECT COUNT(*) FROM verse_search
                    JOIN books b ON b.code=verse_search.book_code
                    WHERE {where}""",
                base_params,
            ).fetchone()[0])
            rows = con.execute(
                f"""SELECT verse_search.translation_id,verse_search.book_code,
                           CAST(verse_search.chapter AS INTEGER) AS chapter,
                           verse_search.verse,verse_search.text,
                           b.name_pt,b.name_en,b.canonical_order
                    FROM verse_search
                    JOIN books b ON b.code=verse_search.book_code
                    WHERE {where}
                    ORDER BY {order}
                    LIMIT ? OFFSET ?""",
                (*base_params, limit, offset),
            ).fetchall()
        except sqlite3.OperationalError:
            # Defensive fallback for unusual punctuation/older SQLite builds.
            clauses = ["v.translation_id=?"]
            params: list[object] = [translation_id]
            fallback_scope, fallback_params = _search_scope_sql(scope, book, chapter, books)
            clauses.extend(item.replace("verse_search.", "v.") for item in fallback_scope)
            params.extend(fallback_params)
            clauses.append("v.text LIKE ?")
            params.append(f"%{q}%")
            fallback_where = " AND ".join(clauses)
            total = int(con.execute(
                f"SELECT COUNT(*) FROM verses v JOIN books b ON b.code=v.book_code WHERE {fallback_where}",
                params,
            ).fetchone()[0])
            rows = con.execute(
                f"""SELECT v.translation_id,v.book_code,v.chapter,v.verse,v.text,
                           b.name_pt,b.name_en,b.canonical_order
                    FROM verses v JOIN books b ON b.code=v.book_code
                    WHERE {fallback_where}
                    ORDER BY b.canonical_order,v.chapter,CAST(v.verse AS INTEGER)
                    LIMIT ? OFFSET ?""",
                (*params, limit, offset),
            ).fetchall()
    items = [dict(row) for row in rows]
    return {
        "items": items,
        "total": total,
        "limit": limit,
        "offset": offset,
        "truncated": offset + len(items) < total,
        "mode": mode,
        "scope": scope,
    }


def search_text(q: str, translation_id: str, limit: int = 50):
    return search_text_page(q, translation_id, limit=limit)["items"]


@lru_cache(maxsize=12)
def concordance_top(translation_id: str = "porbr2018", limit: int = 50):
    limit = max(1, min(int(limit), 200))
    frequency: Counter[str] = Counter()
    books: set[str] = set()
    verses = 0
    with connect() as con:
        for row in con.execute(
            "SELECT book_code,text FROM verses WHERE translation_id=?",
            (translation_id,),
        ):
            verses += 1
            books.add(row["book_code"])
            frequency.update(word for word in _search_key(row["text"]).split() if len(word) >= 3)
    items = [
        {"word": word, "count": count}
        for word, count in frequency.most_common(limit)
    ]
    return {
        "items": items,
        "verses": verses,
        "books": len(books),
        "terms": sum(frequency.values()),
    }


def concordance_search(
    q: str,
    translation_id: str = "porbr2018",
    limit: int = 500,
    offset: int = 0,
):
    complete = search_text_page(
        q,
        translation_id,
        limit=35000,
        mode="word",
        scope="all",
        sort="canon",
    )
    normalized = _search_key(q)
    terms = normalized.split()
    occurrences = 0
    for item in complete["items"]:
        text_words = _search_key(item.get("text", "")).split()
        if len(terms) == 1:
            occurrences += text_words.count(terms[0])
        elif normalized:
            occurrences += _search_key(item.get("text", "")).count(normalized)
    limit = max(1, min(int(limit), 2000))
    offset = max(0, min(int(offset), 35000))
    page_items = complete["items"][offset:offset + limit]
    with connect() as con:
        corpus_verses = int(con.execute(
            "SELECT COUNT(*) FROM verses WHERE translation_id=?",
            (translation_id,),
        ).fetchone()[0])
    return {
        "q": q,
        "translation": translation_id,
        "items": page_items,
        "total": complete["total"],
        "occurrences": occurrences,
        "books": len({item["book_code"] for item in complete["items"]}),
        "corpus_verses": corpus_verses,
        "limit": limit,
        "offset": offset,
        "truncated": offset + len(page_items) < complete["total"],
    }


def commentary_guides(q: str = "", book_code: str = "", chapter: int | None = None):
    """Return honest, pre-installed editorial study guides for all 66 books."""

    term = _search_key(q)
    code = (book_code or "").strip().upper()
    with connect() as con:
        if not _context_ready(con):
            return []
        rows = con.execute(
            """SELECT p.*,b.name_pt,b.name_en,b.canonical_order
               FROM context_book_profiles p
               JOIN books b ON b.code=p.book_code
               ORDER BY b.canonical_order"""
        ).fetchall()
    items = []
    for raw_row in rows:
        row = dict(raw_row)
        if code and row["book_code"] != code:
            continue
        themes = _decode_json_list(row.get("themes_json"))
        places = _decode_json_list(row.get("places_json"))
        refs = _decode_json_list(row.get("key_refs_json"))
        searchable = _search_key(" ".join(str(row.get(key) or "") for key in (
            "book_code", "name_pt", "name_en", "genre", "period", "authorship",
            "audience", "purpose", "historical", "cultural", "literary", "geographic",
        )) + " " + " ".join(themes + places + refs))
        if term and term not in searchable:
            continue
        reference = row["name_pt"] + (f" {int(chapter)}" if chapter else "")
        content = "\n\n".join(filter(None, (
            f"Propósito: {row.get('purpose', '')}",
            f"Contexto histórico: {row.get('historical', '')}",
            f"Contexto cultural: {row.get('cultural', '')}",
            f"Estrutura literária: {row.get('literary', '')}",
            f"Contexto geográfico: {row.get('geographic', '')}",
        )))
        items.append({
            "id": f"guide-{row['book_code']}",
            "server": True,
            "kind": "guide",
            "book_code": row["book_code"],
            "canonical_order": int(row["canonical_order"]),
            "reference": reference,
            "type": "historico-cultural",
            "title": f"Guia contextual de {row['name_pt']}",
            "content": content,
            "authorLabel": "Síntese editorial Bíblia X",
            "sourceLabel": "Perfis contextuais pré-instalados",
            "tags": themes + places,
            "refs": refs,
            "license": "Conteúdo editorial do pacote Bíblia X",
            "language": "pt-BR",
        })
    return items


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
