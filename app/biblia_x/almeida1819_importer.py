
from pathlib import Path
import json, sqlite3
from .bible_service import DB_PATH
TRANSLATION_ID = "almeida1819"

def import_json(path: str, replace: bool = False):
    data = json.loads(Path(path).read_text(encoding="utf-8"))
    if not isinstance(data, list):
        raise ValueError("O arquivo deve conter uma lista JSON.")
    con = sqlite3.connect(DB_PATH)
    cur = con.cursor()
    if replace:
        cur.execute("DELETE FROM verses WHERE translation_id=?", (TRANSLATION_ID,))
        cur.execute("DELETE FROM verse_search WHERE translation_id=?", (TRANSLATION_ID,))
        cur.execute("DELETE FROM navigation_cache WHERE translation_id=?", (TRANSLATION_ID,))
    inserted = 0
    for item in data:
        book = str(item["book_code"]).upper()
        chapter = int(item["chapter"])
        verse = str(item["verse"])
        text = str(item["text"]).strip()
        source = str(item.get("source","almeida1819-historical"))
        if not text:
            continue
        cur.execute("""INSERT OR REPLACE INTO verses
            (translation_id,book_code,chapter,verse,text,source_file)
            VALUES(?,?,?,?,?,?)""",(TRANSLATION_ID,book,chapter,verse,text,source))
        inserted += 1
    cur.execute("DELETE FROM verse_search WHERE translation_id=?", (TRANSLATION_ID,))
    cur.execute("""INSERT INTO verse_search(translation_id,book_code,chapter,verse,text)
                   SELECT translation_id,book_code,chapter,verse,text FROM verses WHERE translation_id=?""",(TRANSLATION_ID,))
    cur.execute("DELETE FROM navigation_cache WHERE translation_id=?", (TRANSLATION_ID,))
    cur.execute("""INSERT INTO navigation_cache(translation_id,book_code,chapter,verse_count)
                   SELECT translation_id,book_code,chapter,COUNT(*) FROM verses
                   WHERE translation_id=? GROUP BY translation_id,book_code,chapter""",(TRANSLATION_ID,))
    if inserted:
        cur.execute("UPDATE translations SET status='active' WHERE id=?", (TRANSLATION_ID,))
    con.commit()
    con.close()
    return {"inserted": inserted, "translation_id": TRANSLATION_ID}
