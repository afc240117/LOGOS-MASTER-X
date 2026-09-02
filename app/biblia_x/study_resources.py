
from pathlib import Path
import sqlite3, re, zipfile, io, urllib.request, json, unicodedata

BASE = Path(__file__).resolve().parent
DB = BASE / "study_resources.sqlite3"
NAVE_TXT = BASE / "resources" / "nave_bible.txt"
OPENBIBLE_URL = "https://a.openbible.info/data/cross-references.zip"

BOOK_MAP = {
"Gen":"GEN","Ge":"GEN","Exod":"EXO","Ex":"EXO","Lev":"LEV","Le":"LEV","Num":"NUM","Nu":"NUM",
"Deut":"DEU","De":"DEU","Josh":"JOS","Jos":"JOS","Judg":"JDG","Jdg":"JDG","Jud":"JDG","Ruth":"RUT","Ru":"RUT",
"1Sam":"1SA","1Sa":"1SA","2Sam":"2SA","2Sa":"2SA","1Kgs":"1KI","1Ki":"1KI","2Kgs":"2KI","2Ki":"2KI",
"1Chr":"1CH","1Ch":"1CH","2Chr":"2CH","2Ch":"2CH","Ezra":"EZR","Ezr":"EZR","Neh":"NEH","Ne":"NEH",
"Esth":"EST","Est":"EST","Es":"EST","Job":"JOB","Ps":"PSA","Pss":"PSA","Prov":"PRO","Pr":"PRO",
"Eccl":"ECC","Ecc":"ECC","Ec":"ECC","Song":"SNG","Sng":"SNG","So":"SNG","Isa":"ISA","Jer":"JER",
"Lam":"LAM","La":"LAM","Ezek":"EZK","Eze":"EZK","Dan":"DAN","Da":"DAN","Hos":"HOS","Ho":"HOS",
"Joel":"JOL","Joe":"JOL","Amos":"AMO","Am":"AMO","Obad":"OBA","Ob":"OBA","Jonah":"JON","Jon":"JON",
"Mic":"MIC","Nah":"NAM","Na":"NAM","Hab":"HAB","Zeph":"ZEP","Zep":"ZEP","Hag":"HAG","Zech":"ZEC","Zec":"ZEC",
"Mal":"MAL","Matt":"MAT","Mt":"MAT","Mark":"MRK","Mr":"MRK","Luke":"LUK","Lu":"LUK","John":"JHN","Joh":"JHN","Jn":"JHN",
"Ac":"ACT","Acts":"ACT","Rom":"ROM","Ro":"ROM","1Cor":"1CO","1Co":"1CO","2Cor":"2CO","2Co":"2CO",
"Gal":"GAL","Ga":"GAL","Eph":"EPH","Phil":"PHP","Php":"PHP","Col":"COL","1Thess":"1TH","1Th":"1TH",
"2Thess":"2TH","2Th":"2TH","1Tim":"1TI","1Ti":"1TI","2Tim":"2TI","2Ti":"2TI","Titus":"TIT","Tit":"TIT",
"Phlm":"PHM","Phm":"PHM","Heb":"HEB","Jas":"JAS","Jam":"JAS","1Pet":"1PE","1Pe":"1PE","2Pet":"2PE","2Pe":"2PE",
"1John":"1JN","1Jo":"1JN","2John":"2JN","2Jo":"2JN","3John":"3JN","3Jo":"3JN","Jude":"JUD","Rev":"REV","Re":"REV"
}
BOOK_MAP_CI = {key.lower(): value for key, value in BOOK_MAP.items()}
CODE_TO_PT = {
"GEN":"Gênesis","EXO":"Êxodo","LEV":"Levítico","NUM":"Números","DEU":"Deuteronômio","JOS":"Josué","JDG":"Juízes","RUT":"Rute",
"1SA":"1 Samuel","2SA":"2 Samuel","1KI":"1 Reis","2KI":"2 Reis","1CH":"1 Crônicas","2CH":"2 Crônicas","EZR":"Esdras","NEH":"Neemias",
"EST":"Ester","JOB":"Jó","PSA":"Salmos","PRO":"Provérbios","ECC":"Eclesiastes","SNG":"Cânticos","ISA":"Isaías","JER":"Jeremias",
"LAM":"Lamentações","EZK":"Ezequiel","DAN":"Daniel","HOS":"Oséias","JOL":"Joel","AMO":"Amós","OBA":"Obadias","JON":"Jonas",
"MIC":"Miquéias","NAM":"Naum","HAB":"Habacuque","ZEP":"Sofonias","HAG":"Ageu","ZEC":"Zacarias","MAL":"Malaquias","MAT":"Mateus",
"MRK":"Marcos","LUK":"Lucas","JHN":"João","ACT":"Atos","ROM":"Romanos","1CO":"1 Coríntios","2CO":"2 Coríntios","GAL":"Gálatas",
"EPH":"Efésios","PHP":"Filipenses","COL":"Colossenses","1TH":"1 Tessalonicenses","2TH":"2 Tessalonicenses","1TI":"1 Timóteo",
"2TI":"2 Timóteo","TIT":"Tito","PHM":"Filemom","HEB":"Hebreus","JAS":"Tiago","1PE":"1 Pedro","2PE":"2 Pedro","1JN":"1 João",
"2JN":"2 João","3JN":"3 João","JUD":"Judas","REV":"Apocalipse"
}

def db():
    con=sqlite3.connect(DB)
    con.row_factory=sqlite3.Row
    con.executescript("""
    CREATE TABLE IF NOT EXISTS metadata(key TEXT PRIMARY KEY,value TEXT);
    CREATE TABLE IF NOT EXISTS crossrefs(
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      from_book TEXT,from_chapter INTEGER,from_verse INTEGER,
      anchor TEXT DEFAULT '',
      to_book TEXT,to_chapter INTEGER,to_verse_start INTEGER,to_verse_end INTEGER,
      votes INTEGER DEFAULT 0,source TEXT DEFAULT 'OpenBible/TSK-derived'
    );
    CREATE INDEX IF NOT EXISTS ix_cross_from ON crossrefs(from_book,from_chapter,from_verse,votes DESC);
    CREATE TABLE IF NOT EXISTS nave_topics(
      id INTEGER PRIMARY KEY AUTOINCREMENT,topic TEXT,topic_pt TEXT,section TEXT,raw TEXT
    );
    CREATE INDEX IF NOT EXISTS ix_nave_topic ON nave_topics(topic);
    CREATE TABLE IF NOT EXISTS nave_refs(
      topic_id INTEGER,book_code TEXT,chapter INTEGER,verse_start INTEGER,verse_end INTEGER,
      whole_chapter INTEGER DEFAULT 0,section TEXT DEFAULT ''
    );
    CREATE INDEX IF NOT EXISTS ix_nave_ref ON nave_refs(book_code,chapter,verse_start);
    CREATE INDEX IF NOT EXISTS ix_nave_topic_ref ON nave_refs(topic_id);
    """)
    migrations={
      "crossrefs":{"anchor":"TEXT DEFAULT ''"},
      "nave_topics":{"topic_pt":"TEXT","section":"TEXT","raw":"TEXT"},
      "nave_refs":{"whole_chapter":"INTEGER DEFAULT 0","section":"TEXT DEFAULT ''"},
    }
    for table,columns in migrations.items():
        present={row[1] for row in con.execute(f"PRAGMA table_info({table})")}
        for name,definition in columns.items():
            if name not in present:
                con.execute(f"ALTER TABLE {table} ADD COLUMN {name} {definition}")
    con.execute("CREATE INDEX IF NOT EXISTS ix_nave_topic_pt ON nave_topics(topic_pt)")
    con.execute("CREATE INDEX IF NOT EXISTS ix_nave_topic_ref ON nave_refs(topic_id)")
    return con

def _book_code(token):
    token=token.strip().replace(".","")
    return BOOK_MAP.get(token) or BOOK_MAP_CI.get(token.lower())

def parse_openbible_ref(s):
    # Gen.1.1 or John.1.1-John.1.3
    s=s.strip()
    a,b=(s.split("-",1)+[None])[:2] if "-" in s else (s,None)
    def one(x):
        p=x.strip().split(".")
        if len(p)<3:return None
        code=_book_code(p[0])
        if not code:return None
        try:return code,int(p[1]),int(re.match(r"\d+",p[2]).group())
        except:return None
    start=one(a)
    if not start:return None
    end=one(b) if b else start
    if not end:return None
    return start,end

def install_crossrefs():
    raw=urllib.request.urlopen(OPENBIBLE_URL,timeout=60).read()
    z=zipfile.ZipFile(io.BytesIO(raw))
    name=next((n for n in z.namelist() if n.lower().endswith(".txt")),z.namelist()[0])
    text=z.read(name).decode("utf-8-sig",errors="replace")
    con=db(); cur=con.cursor()
    cur.execute("DELETE FROM crossrefs")
    inserted=0
    for line in text.splitlines():
        if not line.strip() or line.lower().startswith("from verse"): continue
        parts=line.split("\t")
        if len(parts)<2: continue
        parsed_from=parse_openbible_ref(parts[0])
        parsed_to=parse_openbible_ref(parts[1])
        if not parsed_from or not parsed_to: continue
        (fb,fc,fv),_=parsed_from
        (tb,tc,tv1),(tb2,tc2,tv2)=parsed_to
        if tb2!=tb or tc2!=tc: tv2=tv1
        try:votes=int(parts[2]) if len(parts)>2 and parts[2].strip() else 0
        except:votes=0
        cur.execute("""INSERT INTO crossrefs(from_book,from_chapter,from_verse,anchor,to_book,to_chapter,to_verse_start,to_verse_end,votes)
                       VALUES(?,?,?,?,?,?,?,?,?)""",(fb,fc,fv,"",tb,tc,tv1,tv2,votes))
        inserted+=1
    cur.execute("INSERT OR REPLACE INTO metadata(key,value) VALUES('crossrefs_count',?)",(str(inserted),))
    cur.execute("INSERT OR REPLACE INTO metadata(key,value) VALUES('crossrefs_source','OpenBible.info dataset; primarily Treasury of Scripture Knowledge') ")
    cur.execute("INSERT OR REPLACE INTO metadata(key,value) VALUES('crossrefs_license','CC BY 4.0')")
    cur.execute("INSERT OR REPLACE INTO metadata(key,value) VALUES('crossrefs_delivery','preinstalled')")
    con.commit(); con.close()
    return inserted


NAVE_TOPIC_PHRASES = {
"JESUS CHRIST":"Jesus Cristo","HOLY SPIRIT":"Espírito Santo","HOLY GHOST":"Espírito Santo",
"GOD":"Deus","LORD":"Senhor","FAITH":"Fé","LOVE":"Amor","SALVATION":"Salvação","PRAYER":"Oração",
"GRACE":"Graça","MERCY":"Misericórdia","HOPE":"Esperança","REPENTANCE":"Arrependimento",
"FORGIVENESS":"Perdão","SIN":"Pecado","SINS":"Pecados","RIGHTEOUSNESS":"Justiça",
"HOLINESS":"Santidade","SANCTIFICATION":"Santificação","REDEMPTION":"Redenção",
"JUSTIFICATION":"Justificação","ATONEMENT":"Expiação","RESURRECTION":"Ressurreição",
"ETERNAL LIFE":"Vida Eterna","HEAVEN":"Céu","HELL":"Inferno","JUDGMENT":"Julgamento",
"CHURCH":"Igreja","KINGDOM OF GOD":"Reino de Deus","KINGDOM OF HEAVEN":"Reino dos Céus",
"GOSPEL":"Evangelho","EVANGELISM":"Evangelismo","MISSIONS":"Missões","MISSIONARY":"Missionário",
"BAPTISM":"Batismo","LORD'S SUPPER":"Ceia do Senhor","COMMUNION":"Comunhão",
"WORSHIP":"Adoração","PRAISE":"Louvor","THANKSGIVING":"Ações de Graças",
"OBEDIENCE":"Obediência","DISOBEDIENCE":"Desobediência","TEMPTATION":"Tentação",
"SUFFERING":"Sofrimento","AFFLICTION":"Aflição","AFFLICTIONS":"Aflições","PERSECUTION":"Perseguição",
"DISCIPLE":"Discípulo","DISCIPLES":"Discípulos","APOSTLE":"Apóstolo","APOSTLES":"Apóstolos",
"PROPHET":"Profeta","PROPHETS":"Profetas","PROPHECY":"Profecia","MIRACLE":"Milagre","MIRACLES":"Milagres",
"ANGEL":"Anjo","ANGELS":"Anjos","DEVIL":"Diabo","SATAN":"Satanás","DEMONS":"Demônios",
"COVENANT":"Aliança","LAW":"Lei","COMMANDMENTS":"Mandamentos","WISDOM":"Sabedoria",
"KNOWLEDGE":"Conhecimento","TRUTH":"Verdade","LIE":"Mentira","LIES":"Mentiras",
"PEACE":"Paz","JOY":"Alegria","FEAR":"Temor","COURAGE":"Coragem","HUMILITY":"Humildade",
"PRIDE":"Orgulho","ANGER":"Ira","PATIENCE":"Paciência","KINDNESS":"Bondade",
"CHARITY":"Caridade","COMPASSION":"Compaixão","JUSTICE":"Justiça","INJUSTICE":"Injustiça",
"MARRIAGE":"Casamento","DIVORCE":"Divórcio","FAMILY":"Família","CHILDREN":"Filhos",
"PARENTS":"Pais","FATHER":"Pai","MOTHER":"Mãe","HUSBAND":"Marido","WIFE":"Esposa",
"DEATH":"Morte","LIFE":"Vida","CREATION":"Criação","WORLD":"Mundo","EARTH":"Terra",
"ISRAEL":"Israel","JERUSALEM":"Jerusalém","SAMARIA":"Samaria","SHECHEM":"Siquém",
"TEMPLE":"Templo","TABERNACLE":"Tabernáculo","PRIEST":"Sacerdote","PRIESTS":"Sacerdotes",
"SACRIFICE":"Sacrifício","SACRIFICES":"Sacrifícios","OFFERING":"Oferta","OFFERINGS":"Ofertas",
"FASTING":"Jejum","ANOINTING":"Unção","ANOINTED":"Ungido","HEALING":"Cura","SICKNESS":"Enfermidade",
"BLINDNESS":"Cegueira","POVERTY":"Pobreza","RICHES":"Riquezas","MONEY":"Dinheiro",
"IDOLATRY":"Idolatria","IDOLS":"Ídolos","ADULTERY":"Adultério","MURDER":"Homicídio",
"THEFT":"Furto","LYING":"Mentira","DRUNKENNESS":"Embriaguez","FORNICATION":"Fornicação",
"END OF THE WORLD":"Fim do Mundo","SECOND COMING OF CHRIST":"Segunda Vinda de Cristo",
"CHRIST, SECOND COMING OF":"Cristo, Segunda Vinda de","CHRIST":"Cristo","JESUS, THE CHRIST":"Jesus, o Cristo",
"RESTORATION":"Restauração","REVIVAL":"Avivamento","CALL":"Chamado","CALLING":"Chamado",
"GIFTS":"Dons","GIFTS OF GOD":"Dons de Deus","CONDESCENSION OF GOD":"Condescendência de Deus",
"IMMORTALITY":"Imortalidade","AFFLICTIONS AND ADVERSITIES":"Aflições e adversidades",
"ADVERSITY":"Adversidade","ADVERSITIES":"Adversidades","PATRIOTISM":"Patriotismo","POETRY":"Poesia",
"WAR":"Guerra","NATION":"Nação","DILIGENCE":"Diligência","HERESY":"Heresia","HERESIES":"Heresias",
"FELLOWSHIP":"Comunhão fraternal","FEASTS":"Festas","FEET":"Pés","FAMILIAR SPIRITS":"Espíritos familiares",
"LORD'S PRAYER":"Oração do Senhor","ENTHUSIASM":"Entusiasmo","GENERAL SCRIPTURES CONCERNING":"Referências bíblicas gerais",
"DAILY, IN THE MORNING":"Diariamente, pela manhã","PRAYER TEST PROPOSED BY ELIJAH":"Prova de oração proposta por Elias",
"BLESSED":"Abençoado","SHOULD BE TAUGHT GOD'S WORD":"Deve receber ensino da Palavra de Deus",
"WORSHIP GOD TOGETHER":"Adoração a Deus em união",
"ABRAHAM":"Abraão","ISAAC":"Isaque","JACOB":"Jacó","JOSEPH":"José","MOSES":"Moisés",
"JOSHUA":"Josué","DAVID":"Davi","SOLOMON":"Salomão","ELIJAH":"Elias","ELISHA":"Eliseu",
"ISAIAH":"Isaías","JEREMIAH":"Jeremias","EZEKIEL":"Ezequiel","DANIEL":"Daniel",
"PETER":"Pedro","PAUL":"Paulo","JOHN":"João","JAMES":"Tiago","MARY":"Maria","MARTHA":"Marta"
}
NAVE_WORDS = {
"OF":"de","THE":"o","AND":"e","IN":"em","ON":"sobre","TO":"para","FROM":"de","WITH":"com","WITHOUT":"sem",
"BY":"por","FOR":"para","AGAINST":"contra","CHILD":"filho","CHILDREN":"filhos","MAN":"homem","MEN":"homens",
"WOMAN":"mulher","WOMEN":"mulheres","KING":"rei","KINGS":"reis","SERVANT":"servo","SERVANTS":"servos",
"PEOPLE":"povo","NATION":"nação","NATIONS":"nações","CITY":"cidade","CITIES":"cidades","LAND":"terra",
"SPIRIT":"espírito","SOUL":"alma","BODY":"corpo","HEART":"coração","WORD":"palavra","WORDS":"palavras",
"BOOK":"livro","BOOKS":"livros","BREAD":"pão","WATER":"água","WINE":"vinho","SHEPHERD":"pastor",
"SHEEP":"ovelhas","LAMB":"cordeiro","CROSS":"cruz","BLOOD":"sangue","FIRE":"fogo","LIGHT":"luz",
"DARKNESS":"trevas","POWER":"poder","GLORY":"glória","PROMISE":"promessa","PROMISES":"promessas",
"BLESSING":"bênção","BLESSINGS":"bênçãos","CURSE":"maldição","ENEMY":"inimigo","ENEMIES":"inimigos",
"FRIEND":"amigo","FRIENDS":"amigos","BROTHER":"irmão","BROTHERS":"irmãos","BRETHREN":"irmãos",
"OLD":"velho","NEW":"novo","GOOD":"bom","EVIL":"mal","TRUE":"verdadeiro","FALSE":"falso","HISTORY":"história","INSTANCES":"exemplos","INSTANCE":"exemplo","FIGURATIVE":"figurativo","MISCELLANY":"diversos","DELIVERANCE":"livramento","PRAYER":"oração","ANSWERED":"respondida","SAINTS":"santos","WICKED":"ímpios","PROPHECIES":"profecias","PROPHECY":"profecia"
}

def topic_pt(topic):
    raw=(topic or "").strip()
    cleaned=re.sub(r"^-\d+\.\s*","",raw).strip()
    cleaned=re.sub(r"^-+","",cleaned).strip()
    if not cleaned:return "Tema bíblico"
    if cleaned.upper() in NAVE_TOPIC_PHRASES:return NAVE_TOPIC_PHRASES[cleaned.upper()]
    # translate common comma pattern, e.g. "PRAYER, ANSWERED"
    parts=re.split(r"(\s+|,|-|/|\(|\))",cleaned)
    translated=[]
    changed=False
    for p in parts:
        key=p.strip().upper()
        if key in NAVE_TOPIC_PHRASES:
            val=NAVE_TOPIC_PHRASES[key]; changed=True
            translated.append(val)
        elif key in NAVE_WORDS:
            val=NAVE_WORDS[key]; changed=True
            translated.append(val)
        else:
            translated.append(p.title() if p.isupper() and len(p)>1 else p)
    result="".join(translated)
    result=re.sub(r"\s+"," ",result).strip()
    return result or "Tema bíblico"

_NAVE_BOOK_PATTERN="|".join(sorted((re.escape(key) for key in BOOK_MAP),key=len,reverse=True))
_NAVE_VERSE_SPEC=r"\d+:\d+(?:-\d+)?(?:,\d+(?:-\d+)?)*(?![A-Za-z])"
_NAVE_CHAPTER_SPEC=r"\d+(?:-\d+)?(?:,\d+(?:-\d+)?)*(?![A-Za-z])"
_NAVE_SERIES=rf"(?:{_NAVE_VERSE_SPEC}|{_NAVE_CHAPTER_SPEC})(?:\s*;\s*(?:{_NAVE_VERSE_SPEC}|{_NAVE_CHAPTER_SPEC}))*"
NAVE_REFERENCE_RE=re.compile(rf"(?<![A-Za-z0-9])(?P<book>{_NAVE_BOOK_PATTERN})\s+(?P<series>{_NAVE_SERIES})")
NAVE_TOPIC_RE=re.compile(r"^   ([A-Z0-9][A-Z0-9 ,.'()/:&-]{0,88})\s*$")

def _fold(value):
    value=unicodedata.normalize("NFKD",str(value or ""))
    return " ".join(re.sub(r"[^a-z0-9]+"," ",value.encode("ascii","ignore").decode().lower()).split())

def parse_nave_references(text):
    """Extract Nave reference series, including omitted book/chapter repetitions."""
    out=[]
    for match in NAVE_REFERENCE_RE.finditer(str(text or "")):
        code=_book_code(match.group("book"))
        if not code: continue
        for piece in re.split(r"\s*;\s*",match.group("series")):
            if ":" in piece:
                chapter_text,verse_text=piece.split(":",1)
                chapter=int(chapter_text)
                if not 1<=chapter<=200: continue
                for item in verse_text.split(","):
                    start_text,end_text=(item.split("-",1)+[item])[:2] if "-" in item else (item,item)
                    start,end=int(start_text),int(end_text)
                    if 1<=start<=200 and start<=end<=200:
                        out.append((code,chapter,start,end,0))
                continue
            for item in piece.split(","):
                if "-" in item:
                    start,end=(int(x) for x in item.split("-",1))
                    if not 1<=start<=end<=200 or end-start>20: continue
                    chapters=range(start,end+1)
                else:
                    chapters=(int(item),)
                for chapter in chapters:
                    if 1<=chapter<=200:
                        out.append((code,chapter,1,999,1))
    return out

def _nave_entries(lines):
    current=[]
    for line in lines:
        stripped=line.strip()
        if not stripped:
            if current:
                yield " ".join(current)
                current=[]
            continue
        if stripped.startswith(("-",".")) and current:
            yield " ".join(current)
            current=[]
        current.append(stripped)
    if current:
        yield " ".join(current)

def _nave_topic_blocks(text):
    topic=None; lines=[]
    for line in str(text or "").splitlines()[20:]:
        if re.match(r"^\s*\d+\.\s+file:///ccel/",line):
            break
        match=NAVE_TOPIC_RE.match(line)
        if match and not match.group(1).strip().startswith("-"):
            if topic:
                yield topic,lines
            topic=match.group(1).strip(); lines=[]
        elif topic:
            lines.append(line)
    if topic:
        yield topic,lines

def _nave_section(entry):
    match=NAVE_REFERENCE_RE.search(entry)
    value=entry[:match.start()] if match else entry
    value=re.sub(r"^[\s.\-]+","",value)
    value=re.sub(r"\s+"," ",value).strip(" ;,.-")
    return value[:240]

def install_nave(text=None):
    text=NAVE_TXT.read_text(encoding="utf-8",errors="replace") if text is None else text
    con=db();cur=con.cursor()
    cur.execute("DELETE FROM nave_refs");cur.execute("DELETE FROM nave_topics")
    try:cur.execute("DELETE FROM sqlite_sequence WHERE name='nave_topics'")
    except sqlite3.OperationalError:pass
    topics=refs=sections=0; unique_topic_refs=set()
    for topic,lines in _nave_topic_blocks(text):
        entries=list(_nave_entries(lines))
        raw="\n".join(entries)[:12000]
        cur.execute("INSERT INTO nave_topics(topic,topic_pt,section,raw) VALUES(?,?,?,?)",
                    (topic,topic_pt(topic),"",raw))
        topic_id=cur.lastrowid;topics+=1
        seen=set(); rows=[]; topic_sections=set()
        for entry in entries:
            section=_nave_section(entry)
            if section: topic_sections.add(section)
            for code,chapter,start,end,whole_chapter in parse_nave_references(entry):
                key=(code,chapter,start,end,whole_chapter,section)
                if key in seen: continue
                seen.add(key)
                unique_topic_refs.add((topic_id,code,chapter,start,end,whole_chapter))
                rows.append((topic_id,code,chapter,start,end,whole_chapter,section))
        if rows:
            cur.executemany("""INSERT INTO nave_refs(topic_id,book_code,chapter,verse_start,verse_end,whole_chapter,section)
                               VALUES(?,?,?,?,?,?,?)""",rows)
        refs+=len(rows);sections+=len(topic_sections)
    metadata={
      "nave_topics_count":topics,
      "nave_sections_count":sections,
      "nave_refs_count":refs,
      "nave_unique_refs_count":len(unique_topic_refs),
      "nave_parser_version":"2",
      "nave_delivery":"preinstalled",
      "nave_language":"pt-BR display / original English retained internally",
      "nave_license":"Public Domain",
      "nave_source":"Nave Topical Bible / CCEL public-domain text",
    }
    cur.executemany("INSERT OR REPLACE INTO metadata(key,value) VALUES(?,?)",
                    ((key,str(value)) for key,value in metadata.items()))
    con.commit();con.close()
    return topics,refs

def ensure_nave():
    con=db()
    count=con.execute("SELECT COUNT(*) FROM nave_topics").fetchone()[0]
    refs=con.execute("SELECT COUNT(*) FROM nave_refs").fetchone()[0]
    row=con.execute("SELECT value FROM metadata WHERE key='nave_parser_version'").fetchone()
    parser_version=row[0] if row else ""
    con.close()
    if NAVE_TXT.exists() and (count==0 or parser_version!="2"):
        return install_nave()
    return count,refs

def status():
    ensure_nave()
    con=db()
    md={r["key"]:r["value"] for r in con.execute("SELECT key,value FROM metadata")}
    counts={
      "crossrefs":con.execute("SELECT COUNT(*) FROM crossrefs").fetchone()[0],
      "crossref_verses":con.execute("SELECT COUNT(*) FROM (SELECT 1 FROM crossrefs GROUP BY from_book,from_chapter,from_verse)").fetchone()[0],
      "nave_topics":con.execute("SELECT COUNT(*) FROM nave_topics").fetchone()[0],
      "nave_refs":con.execute("SELECT COUNT(*) FROM nave_refs").fetchone()[0]
    }
    con.close()
    return {"ok":True,"counts":counts,"metadata":md}

def _format_reference(book,chapter,start,end,whole_chapter=False):
    name=CODE_TO_PT.get(book,book)
    if whole_chapter:return f"{name} {chapter}"
    suffix="" if end==start else f"-{end}"
    return f"{name} {chapter}:{start}{suffix}"

def crossrefs(book,chapter,verse,limit=100):
    limit=max(1,min(int(limit),200))
    con=db()
    rows=con.execute("""SELECT anchor,to_book,to_chapter,to_verse_start,to_verse_end,votes,source
      FROM crossrefs WHERE from_book=? AND from_chapter=? AND from_verse=?
      ORDER BY votes DESC,id LIMIT ?""",(book,int(chapter),int(verse),max(limit*4,200))).fetchall()
    seen=set(); out=[]
    for row in rows:
        ref=_format_reference(row["to_book"],row["to_chapter"],row["to_verse_start"],row["to_verse_end"])
        key=ref.lower()
        if key in seen: continue
        seen.add(key)
        out.append({"reference":ref,"anchor":row["anchor"] or "","votes":row["votes"] or 0,"source":row["source"]})
        if len(out)>=limit: break
    con.close(); return out

def crossrefs_for_chapter(book,chapter,limit=20):
    """Return the strongest distinct outgoing references for a whole chapter."""
    limit=max(1,min(int(limit),80));con=db()
    rows=con.execute("""SELECT to_book,to_chapter,to_verse_start,to_verse_end,
        MAX(votes) votes,COUNT(*) source_anchors,MIN(source) source
      FROM crossrefs WHERE from_book=? AND from_chapter=?
      GROUP BY to_book,to_chapter,to_verse_start,to_verse_end
      ORDER BY votes DESC,source_anchors DESC,to_book,to_chapter,to_verse_start
      LIMIT ?""",(book,int(chapter),max(limit*4,120))).fetchall()
    seen=set();out=[]
    for row in rows:
        ref=_format_reference(row["to_book"],row["to_chapter"],row["to_verse_start"],row["to_verse_end"])
        key=ref.lower()
        if key in seen:continue
        seen.add(key);out.append({
          "reference":ref,"votes":int(row["votes"] or 0),
          "source_anchors":int(row["source_anchors"] or 0),"source":row["source"]
        })
        if len(out)>=limit:break
    con.close();return out

def nave_for_verse(book,chapter,verse,limit=30):
    ensure_nave();limit=max(1,min(int(limit),100))
    con=db()
    rows=con.execute("""SELECT t.id,t.topic,t.topic_pt,COALESCE(r.section,'') section
      FROM nave_refs r JOIN nave_topics t ON t.id=r.topic_id
      WHERE r.book_code=? AND r.chapter=?
        AND (r.whole_chapter=1 OR ? BETWEEN r.verse_start AND r.verse_end)
      ORDER BY COALESCE(t.topic_pt,t.topic),t.id LIMIT ?""",
      (book,int(chapter),int(verse),max(limit*12,240))).fetchall()
    grouped={}
    for row in rows:
        item=grouped.setdefault(row["id"],{
          "topic_id":row["id"],"topic":(row["topic_pt"] or topic_pt(row["topic"]) or "Tema bíblico").strip(),
          "topic_original":row["topic"],"sections":[]
        })
        section=(row["section"] or "").strip()
        if section and section not in item["sections"]:
            item["sections"].append(section)
    out=[]
    for item in grouped.values():
        sections=[topic_pt(section) for section in item.pop("sections")[:3]]
        item["section"]=sections[0] if sections else ""
        item["sections"]=sections
        item["summary"]=f"Tema bíblico relacionado a esta passagem. Abra para consultar suas referências."
        out.append(item)
        if len(out)>=limit: break
    con.close(); return out

def nave_for_chapter(book,chapter,limit=16):
    """Aggregate Nave topics related to any part of a chapter."""
    ensure_nave();limit=max(1,min(int(limit),60));con=db()
    rows=con.execute("""SELECT t.id,t.topic,t.topic_pt,COALESCE(r.section,'') section,
        COUNT(*) OVER(PARTITION BY t.id) hits
      FROM nave_refs r JOIN nave_topics t ON t.id=r.topic_id
      WHERE r.book_code=? AND r.chapter=?
      ORDER BY hits DESC,COALESCE(t.topic_pt,t.topic),t.id""",
      (book,int(chapter))).fetchall()
    grouped={}
    for row in rows:
        item=grouped.setdefault(row["id"],{
          "topic_id":row["id"],
          "topic":(row["topic_pt"] or topic_pt(row["topic"]) or "Tema bíblico").strip(),
          "topic_original":row["topic"],"hits":int(row["hits"] or 0),"sections":[]
        })
        section=(row["section"] or "").strip()
        if section and section not in item["sections"]:item["sections"].append(section)
    out=[]
    for item in sorted(grouped.values(),key=lambda x:(-x["hits"],_fold(x["topic"]))):
        sections=[topic_pt(section) for section in item.pop("sections")[:3]]
        item["section"]=sections[0] if sections else "";item["sections"]=sections
        item["summary"]="Tema Nave relacionado ao capítulo no índice bíblico local."
        out.append(item)
        if len(out)>=limit:break
    con.close();return out

def search_nave_topics(query,limit=40):
    ensure_nave();limit=max(1,min(int(limit),100));needle=_fold(query)
    if not needle:return []
    con=db()
    rows=con.execute("""SELECT t.id,t.topic,t.topic_pt,COUNT(r.topic_id) reference_count
      FROM nave_topics t LEFT JOIN nave_refs r ON r.topic_id=t.id
      GROUP BY t.id,t.topic,t.topic_pt""").fetchall()
    con.close(); ranked=[]
    for row in rows:
        label=(row["topic_pt"] or topic_pt(row["topic"]) or "Tema bíblico").strip()
        label_fold,original_fold=_fold(label),_fold(row["topic"])
        if needle not in label_fold and needle not in original_fold: continue
        rank=0 if needle in (label_fold,original_fold) else 1 if label_fold.startswith(needle) or original_fold.startswith(needle) else 2
        ranked.append((rank,label_fold,{
          "topic_id":row["id"],"topic":label,"topic_original":row["topic"],
          "reference_count":row["reference_count"],
          "summary":"Abra o tópico para navegar por suas referências bíblicas."
        }))
    ranked.sort(key=lambda item:(item[0],item[1]))
    if ranked and ranked[0][0]==0:
        ranked=[item for item in ranked if item[0]==0]
    return [item[2] for item in ranked[:limit]]

def nave_topic(topic_id,limit=300):
    ensure_nave();limit=max(1,min(int(limit),500))
    con=db()
    topic=con.execute("SELECT id,topic,topic_pt FROM nave_topics WHERE id=?",(int(topic_id),)).fetchone()
    if not topic:
        con.close();return None
    rows=con.execute("""SELECT book_code,chapter,verse_start,verse_end,whole_chapter,COALESCE(section,'') section
      FROM nave_refs WHERE topic_id=? ORDER BY rowid""",(int(topic_id),)).fetchall()
    con.close();seen=set();items=[]
    for row in rows:
        ref=_format_reference(row["book_code"],row["chapter"],row["verse_start"],row["verse_end"],bool(row["whole_chapter"]))
        section_original=(row["section"] or "").strip()
        key=(ref.lower(),section_original.lower())
        if key in seen:continue
        seen.add(key)
        if len(items)<limit:
            items.append({"reference":ref,"section":topic_pt(section_original) if section_original else "","section_original":section_original})
    label=(topic["topic_pt"] or topic_pt(topic["topic"]) or "Tema bíblico").strip()
    return {
      "topic_id":topic["id"],"topic":label,"topic_original":topic["topic"],
      "total":len(seen),"items":items,"source":"Nave's Topical Bible / CCEL","license":"Public Domain"
    }
