
from pathlib import Path
import sqlite3, re, zipfile, io, urllib.request, json, unicodedata

BASE = Path(__file__).resolve().parent
DB = BASE / "study_resources.sqlite3"
NAVE_TXT = BASE / "resources" / "nave_bible.txt"
OPENBIBLE_URL = "https://a.openbible.info/data/cross-references.zip"

BOOK_MAP = {
"Gen":"GEN","Exod":"EXO","Ex":"EXO","Lev":"LEV","Num":"NUM","Deut":"DEU","Josh":"JOS","Jos":"JOS",
"Judg":"JDG","Jud":"JDG","Ruth":"RUT","1Sam":"1SA","1Sa":"1SA","2Sam":"2SA","2Sa":"2SA",
"1Kgs":"1KI","1Ki":"1KI","2Kgs":"2KI","2Ki":"2KI","1Chr":"1CH","1Ch":"1CH","2Chr":"2CH","2Ch":"2CH",
"Ezra":"EZR","Neh":"NEH","Esth":"EST","Est":"EST","Job":"JOB","Ps":"PSA","Pss":"PSA","Prov":"PRO",
"Eccl":"ECC","Song":"SNG","Isa":"ISA","Jer":"JER","Lam":"LAM","Ezek":"EZK","Dan":"DAN","Hos":"HOS",
"Joel":"JOL","Amos":"AMO","Obad":"OBA","Jonah":"JON","Mic":"MIC","Nah":"NAM","Hab":"HAB","Zeph":"ZEP",
"Hag":"HAG","Zech":"ZEC","Mal":"MAL","Matt":"MAT","Mt":"MAT","Mark":"MRK","Mr":"MRK","Luke":"LUK","Lu":"LUK",
"John":"JHN","Joh":"JHN","Jn":"JHN","Ac":"ACT","Acts":"ACT","Rom":"ROM","Ro":"ROM",
"1Cor":"1CO","1Co":"1CO","2Cor":"2CO","2Co":"2CO","Gal":"GAL","Ga":"GAL","Eph":"EPH",
"Phil":"PHP","Php":"PHP","Col":"COL","1Thess":"1TH","1Th":"1TH","2Thess":"2TH","2Th":"2TH",
"1Tim":"1TI","1Ti":"1TI","2Tim":"2TI","2Ti":"2TI","Titus":"TIT","Tit":"TIT","Phlm":"PHM","Phm":"PHM",
"Heb":"HEB","Jas":"JAS","Jam":"JAS","1Pet":"1PE","1Pe":"1PE","2Pet":"2PE","2Pe":"2PE",
"1John":"1JN","1Jo":"1JN","2John":"2JN","2Jo":"2JN","3John":"3JN","3Jo":"3JN","Jude":"JUD","Jud":"JUD","Rev":"REV","Re":"REV"
}
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
      to_book TEXT,to_chapter INTEGER,to_verse_start INTEGER,to_verse_end INTEGER,
      votes INTEGER DEFAULT 0,source TEXT DEFAULT 'OpenBible/TSK-derived'
    );
    CREATE INDEX IF NOT EXISTS ix_cross_from ON crossrefs(from_book,from_chapter,from_verse,votes DESC);
    CREATE TABLE IF NOT EXISTS nave_topics(
      id INTEGER PRIMARY KEY AUTOINCREMENT,topic TEXT,section TEXT,raw TEXT
    );
    CREATE INDEX IF NOT EXISTS ix_nave_topic ON nave_topics(topic);
    CREATE TABLE IF NOT EXISTS nave_refs(
      topic_id INTEGER,book_code TEXT,chapter INTEGER,verse_start INTEGER,verse_end INTEGER
    );
    CREATE INDEX IF NOT EXISTS ix_nave_ref ON nave_refs(book_code,chapter,verse_start);
    """)
    return con

def _book_code(token):
    token=token.strip().replace(".","")
    if token in BOOK_MAP:return BOOK_MAP[token]
    for k,v in BOOK_MAP.items():
        if k.lower()==token.lower(): return v
    return None

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
        cur.execute("""INSERT INTO crossrefs(from_book,from_chapter,from_verse,to_book,to_chapter,to_verse_start,to_verse_end,votes)
                       VALUES(?,?,?,?,?,?,?,?)""",(fb,fc,fv,tb,tc,tv1,tv2,votes))
        inserted+=1
    cur.execute("INSERT OR REPLACE INTO metadata(key,value) VALUES('crossrefs_count',?)",(str(inserted),))
    cur.execute("INSERT OR REPLACE INTO metadata(key,value) VALUES('crossrefs_source','OpenBible.info dataset; primarily Treasury of Scripture Knowledge') ")
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
"CHRIST, SECOND COMING OF":"Cristo, Segunda Vinda de","CHRIST":"Cristo",
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
    if cleaned in NAVE_TOPIC_PHRASES:return NAVE_TOPIC_PHRASES[cleaned]
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

REF_TOKEN = re.compile(r'(?:(1|2|3)\s*)?([A-Z][a-z]{0,5})\s+(\d+)(?::(\d+)(?:-(\d+))?)?')

def install_nave():
    text=NAVE_TXT.read_text(encoding="utf-8",errors="replace")
    con=db();cur=con.cursor()
    # Migration for Portuguese topic label + section on references.
    cols=[r[1] for r in cur.execute("PRAGMA table_info(nave_topics)").fetchall()]
    if "topic_pt" not in cols:
        cur.execute("ALTER TABLE nave_topics ADD COLUMN topic_pt TEXT")
    rcols=[r[1] for r in cur.execute("PRAGMA table_info(nave_refs)").fetchall()]
    if "section" not in rcols:
        cur.execute("ALTER TABLE nave_refs ADD COLUMN section TEXT")
    cur.execute("DELETE FROM nave_refs");cur.execute("DELETE FROM nave_topics")
    topic=None; section=""; tid=None; topics=refs=0
    # Main Nave topic headings use exactly three leading spaces and uppercase text.
    main_re=re.compile(r"^   ([A-Z0-9][A-Z0-9 ,.'()/:&-]{0,88})\s*$")
    sub_re=re.compile(r"^\s{8,}[-.]([A-Z][A-Z0-9 ,.'()/:&-]{1,100})\s*$")
    for line in text.splitlines()[20:]:
        mm=main_re.match(line)
        if mm:
            candidate=mm.group(1).strip()
            if candidate.startswith("-"): continue
            topic=candidate; section=""
            cur.execute("INSERT INTO nave_topics(topic,topic_pt,section,raw) VALUES(?,?,?,?)",
                        (topic,topic_pt(topic),"",""))
            tid=cur.lastrowid;topics+=1
            continue
        if not topic or tid is None: continue
        sm=sub_re.match(line)
        if sm:
            section=sm.group(1).strip().title()
        stripped=line.strip()
        if not stripped: continue
        cur.execute("UPDATE nave_topics SET raw=substr(COALESCE(raw,'') || ? || char(10),1,12000) WHERE id=?",(stripped,tid))
        for mr in REF_TOKEN.finditer(stripped):
            prefix,abbr,ch,v1,v2=mr.groups()
            key=(prefix or "")+abbr
            code=_book_code(key) or _book_code(abbr)
            if not code: continue
            ch=int(ch); vs=int(v1) if v1 else 1; ve=int(v2) if v2 else vs
            cur.execute("INSERT INTO nave_refs(topic_id,book_code,chapter,verse_start,verse_end,section) VALUES(?,?,?,?,?,?)",
                        (tid,code,ch,vs,ve,section))
            refs+=1
    cur.execute("INSERT OR REPLACE INTO metadata(key,value) VALUES('nave_topics_count',?)",(str(topics),))
    cur.execute("INSERT OR REPLACE INTO metadata(key,value) VALUES('nave_refs_count',?)",(str(refs),))
    cur.execute("INSERT OR REPLACE INTO metadata(key,value) VALUES('nave_language','pt-BR display / original English retained internally')")
    cur.execute("INSERT OR REPLACE INTO metadata(key,value) VALUES('nave_source','Nave Topical Bible / CCEL public-domain text') ")
    con.commit();con.close()
    return topics,refs

def ensure_nave():
    con=db()
    n=con.execute("SELECT COUNT(*) FROM nave_topics").fetchone()[0]
    con.close()
    if n==0 and NAVE_TXT.exists(): return install_nave()
    return n,None

def status():
    ensure_nave()
    con=db()
    md={r["key"]:r["value"] for r in con.execute("SELECT key,value FROM metadata")}
    counts={
      "crossrefs":con.execute("SELECT COUNT(*) FROM crossrefs").fetchone()[0],
      "nave_topics":con.execute("SELECT COUNT(*) FROM nave_topics").fetchone()[0],
      "nave_refs":con.execute("SELECT COUNT(*) FROM nave_refs").fetchone()[0]
    }
    con.close()
    return {"ok":True,"counts":counts,"metadata":md}

def crossrefs(book,chapter,verse,limit=100):
    con=db()
    rows=con.execute("""SELECT anchor,to_book,to_chapter,to_verse_start,to_verse_end,source
      FROM crossrefs WHERE from_book=? AND from_chapter=? AND from_verse=?
      ORDER BY id LIMIT ?""",(book,int(chapter),int(verse),max(int(limit)*4,200))).fetchall()
    seen=set(); out=[]
    for r in rows:
        end="" if r["to_verse_end"]==r["to_verse_start"] else f'-{r["to_verse_end"]}'
        ref=f'{CODE_TO_PT.get(r["to_book"],r["to_book"])} {r["to_chapter"]}:{r["to_verse_start"]}{end}'
        key=ref.lower()
        if key in seen: continue
        seen.add(key)
        out.append({"reference":ref,"anchor":r["anchor"] or "","source":r["source"]})
        if len(out)>=int(limit): break
    con.close(); return out

def nave_for_verse(book,chapter,verse,limit=30):
    ensure_nave()
    con=db()
    rows=con.execute("""SELECT DISTINCT t.topic,t.topic_pt,COALESCE(r.section,'') section
      FROM nave_refs r JOIN nave_topics t ON t.id=r.topic_id
      WHERE r.book_code=? AND r.chapter=? AND ? BETWEEN r.verse_start AND r.verse_end
      ORDER BY COALESCE(t.topic_pt,t.topic) LIMIT ?""",(book,int(chapter),int(verse),int(limit))).fetchall()
    out=[]
    for r in rows:
        label=(r["topic_pt"] or topic_pt(r["topic"]) or "Tema bíblico").strip()
        out.append({
          "topic":label,
          "topic_original":r["topic"],
          "section":topic_pt(r["section"]) if r["section"] else "",
          "summary":f"Tema bíblico relacionado a esta passagem. Explore as referências associadas a {label}."
        })
    con.close(); return out
