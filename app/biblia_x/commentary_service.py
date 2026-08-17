
from pathlib import Path
import json, re, urllib.request, urllib.parse

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
