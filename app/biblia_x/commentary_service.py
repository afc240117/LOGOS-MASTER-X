
from pathlib import Path
import hashlib, json, re, unicodedata, urllib.request, urllib.parse

BASE = Path(__file__).resolve().parent
CACHE = BASE / "cache" / "commentary"
CACHE.mkdir(parents=True, exist_ok=True)

BOOK_SLUGS = {
"GEN":"genesis","EXO":"exodus","LEV":"leviticus","NUM":"numbers","DEU":"deuteronomy",
"JOS":"joshua","JDG":"judges","RUT":"ruth","1SA":"1-samuel","2SA":"2-samuel",
"1KI":"1-kings","2KI":"2-kings","1CH":"1-chronicles","2CH":"2-chronicles","EZR":"ezra",
"NEH":"nehemiah","EST":"esther","JOB":"job","PSA":"psalms","PRO":"proverbs",
"ECC":"ecclesiastes","SNG":"song-of-solomon","ISA":"isaiah","JER":"jeremiah",
"LAM":"lamentations","EZK":"ezekiel","DAN":"daniel","HOS":"hosea","JOL":"joel",
"AMO":"amos","OBA":"obadiah","JON":"jonah","MIC":"micah","NAM":"nahum",
"HAB":"habakkuk","ZEP":"zephaniah","HAG":"haggai","ZEC":"zechariah","MAL":"malachi",
"MAT":"matthew","MRK":"mark","LUK":"luke","JHN":"john","ACT":"acts","ROM":"romans",
"1CO":"1-corinthians","2CO":"2-corinthians","GAL":"galatians","EPH":"ephesians",
"PHP":"philippians","COL":"colossians","1TH":"1-thessalonians","2TH":"2-thessalonians",
"1TI":"1-timothy","2TI":"2-timothy","TIT":"titus","PHM":"philemon","HEB":"hebrews",
"JAS":"james","1PE":"1-peter","2PE":"2-peter","1JN":"1-john","2JN":"2-john",
"3JN":"3-john","JUD":"jude","REV":"revelation"
}

SOURCE_BASE = "https://raw.githubusercontent.com/lyteword/mhenry-concise/main"
SOURCE_NAME = "Matthew Henry's Concise Commentary"
SOURCE_LICENSE = "CC0-1.0"
TRANSLATION_CACHE = CACHE / "pt-br"
TRANSLATION_CACHE.mkdir(parents=True, exist_ok=True)


def _translate_pt(text: str) -> str:
    """Traduz EN->PT-BR no servidor e guarda cache local. Falha de rede nunca quebra o comentário."""
    text=(text or "").strip()
    if not text:
        return ""
    import hashlib
    key=hashlib.sha256(text.encode("utf-8")).hexdigest()
    cp=TRANSLATION_CACHE / f"{key}.txt"
    if cp.exists():
        return cp.read_text(encoding="utf-8",errors="replace")
    try:
        q=urllib.parse.urlencode({"client":"gtx","sl":"en","tl":"pt","dt":"t","q":text})
        url="https://translate.googleapis.com/translate_a/single?"+q
        req=urllib.request.Request(url,headers={"User-Agent":"Mozilla/5.0 LOGOS-MASTER-X/0.24"})
        with urllib.request.urlopen(req,timeout=12) as r:
            data=json.loads(r.read().decode("utf-8",errors="replace"))
        out="".join((x[0] or "") for x in (data[0] or []) if x).strip()
        if out:
            cp.write_text(out,encoding="utf-8")
            return out
    except Exception:
        pass
    return ""

def _cache_path(book_code: str, chapter: int) -> Path:
    slug=BOOK_SLUGS.get(book_code.upper())
    if not slug:
        raise KeyError(book_code)
    return CACHE / f"{slug}-chapter-{int(chapter)}.md"

def _url(book_code: str, chapter: int) -> str:
    slug=BOOK_SLUGS.get(book_code.upper())
    if not slug:
        raise KeyError(book_code)
    return f"{SOURCE_BASE}/{slug}/chapter-{int(chapter)}.md"

def fetch_chapter(book_code: str, chapter: int):
    p=_cache_path(book_code, chapter)
    if p.exists():
        return p.read_text(encoding="utf-8", errors="replace"), True, _url(book_code, chapter)
    url=_url(book_code, chapter)
    req=urllib.request.Request(url,headers={"User-Agent":"LOGOS-MASTER-X/0.24"})
    with urllib.request.urlopen(req,timeout=12) as r:
        text=r.read().decode("utf-8",errors="replace")
    p.write_text(text,encoding="utf-8")
    return text, False, url

SECTION_RE = re.compile(r"^##\s+Verses\s+(\d+)(?:[–-](\d+))?\s*$",re.M)
CHAPTER_FILE_RE = re.compile(r"^(.+)-chapter-(\d+)\.md$", re.I)
SLUG_BOOKS = {slug: code for code, slug in BOOK_SLUGS.items()}


def _search_key(value: str) -> str:
    value = unicodedata.normalize("NFKD", str(value or "")).casefold()
    value = "".join(char for char in value if not unicodedata.combining(char))
    return re.sub(r"[^0-9a-z]+", " ", value).strip()


def _cached_translation(text: str) -> str:
    """Read an existing PT-BR translation without making a network request."""

    if not text:
        return ""
    path = TRANSLATION_CACHE / f"{hashlib.sha256(text.encode('utf-8')).hexdigest()}.txt"
    if not path.exists():
        return ""
    return path.read_text(encoding="utf-8", errors="replace").strip()

def parse_comment_for_verse(markdown: str, verse: int):
    verse=int(verse)
    matches=list(SECTION_RE.finditer(markdown))
    if not matches:
        return {"range":None,"content":"","outline":[]}
    chosen=None
    for i,m in enumerate(matches):
        a=int(m.group(1)); b=int(m.group(2) or a)
        if a <= verse <= b:
            chosen=(i,m,a,b)
            break
    if chosen is None:
        # nearest prior block, useful for unusual chapter formatting
        prior=[(i,m,int(m.group(1)),int(m.group(2) or m.group(1))) for i,m in enumerate(matches) if int(m.group(1))<=verse]
        if prior: chosen=prior[-1]
    if chosen is None:
        return {"range":None,"content":"","outline":[]}
    i,m,a,b=chosen
    end=matches[i+1].start() if i+1<len(matches) else len(markdown)
    content=markdown[m.end():end].strip()
    content=re.sub(r"\n{3,}","\n\n",content)
    outline=[]
    for line in markdown.splitlines():
        if line.startswith("- ") and "(" in line and ")" in line:
            outline.append(line[2:].strip())
    return {"range":f"{a}" if a==b else f"{a}-{b}","content":content,"outline":outline[:12]}


def cached_status():
    chapters = list(sorted(CACHE.glob("*-chapter-*.md")))
    sections = 0
    books = set()
    for path in chapters:
        match = CHAPTER_FILE_RE.match(path.name)
        if match:
            books.add(SLUG_BOOKS.get(match.group(1), match.group(1)))
        sections += len(SECTION_RE.findall(path.read_text(encoding="utf-8", errors="replace")))
    return {
        "ready": bool(chapters),
        "chapters": len(chapters),
        "books": len(books),
        "sections": sections,
        "translations_pt": len(list(TRANSLATION_CACHE.glob("*.txt"))),
        "source": SOURCE_NAME,
        "license": SOURCE_LICENSE,
    }


def search_cached(
    q: str = "",
    book_code: str = "",
    chapter: int | None = None,
    limit: int = 100,
    offset: int = 0,
):
    """Search only commentary chapters already bundled with the application."""

    term = _search_key(q)
    code_filter = (book_code or "").strip().upper()
    rows = []
    for path in sorted(CACHE.glob("*-chapter-*.md")):
        file_match = CHAPTER_FILE_RE.match(path.name)
        if not file_match:
            continue
        slug, chapter_text = file_match.groups()
        code = SLUG_BOOKS.get(slug)
        chapter_number = int(chapter_text)
        if not code or (code_filter and code != code_filter) or (chapter and chapter_number != int(chapter)):
            continue
        markdown = path.read_text(encoding="utf-8", errors="replace")
        matches = list(SECTION_RE.finditer(markdown))
        outline = [
            line[2:].strip()
            for line in markdown.splitlines()
            if line.startswith("- ") and "(" in line and ")" in line
        ][:12]
        for index, section in enumerate(matches):
            start = int(section.group(1))
            end = int(section.group(2) or start)
            finish = matches[index + 1].start() if index + 1 < len(matches) else len(markdown)
            original = re.sub(r"\n{3,}", "\n\n", markdown[section.end():finish].strip())
            translated = _cached_translation(original)
            range_text = str(start) if start == end else f"{start}-{end}"
            search_text = _search_key(" ".join((slug, code, range_text, original, translated, *outline)))
            if term and term not in search_text:
                continue
            rows.append({
                "id": f"classic-{code}-{chapter_number}-{start}-{end}",
                "server": True,
                "kind": "classic",
                "book_code": code,
                "chapter": chapter_number,
                "verse_start": start,
                "verse_end": end,
                "verse_range": range_text,
                "type": "exegetico",
                "title": f"Comentário clássico • versos {range_text}",
                "content": translated or original,
                "content_original": original,
                "authorLabel": "Matthew Henry",
                "sourceLabel": f"{SOURCE_NAME} • {SOURCE_LICENSE}",
                "tags": ["comentário clássico", "exposição bíblica"],
                "refs": [],
                "language": "pt-BR" if translated else "en",
                "translation_cached": bool(translated),
                "license": SOURCE_LICENSE,
                "source_url": _url(code, chapter_number),
            })
    total = len(rows)
    limit = max(1, min(int(limit), 500))
    offset = max(0, min(int(offset), 10000))
    return {
        "items": rows[offset:offset + limit],
        "total": total,
        "limit": limit,
        "offset": offset,
    }

def get_commentary(book_code: str, chapter: int, verse: int):
    try:
        md,cached,url=fetch_chapter(book_code,chapter)
        parsed=parse_comment_for_verse(md,verse)
        original=parsed["content"]
        translated=_translate_pt(original)
        outline_pt=[_translate_pt(x) or x for x in parsed["outline"]]
        return {
            "ok":True,
            "source":SOURCE_NAME,
            "license":SOURCE_LICENSE,
            "url":url,
            "cached":cached,
            "range":parsed["range"],
            "content_original":original,
            "content_pt":translated,
            "outline":parsed["outline"],
            "outline_pt":outline_pt,
            "language":"en",
            "display_language":"pt-BR",
            "translation_cached": bool(translated),
        }
    except Exception as e:
        return {
            "ok":False,
            "source":SOURCE_NAME,
            "license":SOURCE_LICENSE,
            "error":str(e),
            "content_original":"",
            "content_pt":"",
            "outline":[],
            "outline_pt":[],
            "language":"en",
        }
