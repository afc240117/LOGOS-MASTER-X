const BOOK_ALIASES = {
  "gn":"Gênesis","gen":"Gênesis","gênesis":"Gênesis","genesis":"Gênesis",
  "ex":"Êxodo","êxodo":"Êxodo","exodo":"Êxodo",
  "sl":"Salmos","salmo":"Salmos","salmos":"Salmos",
  "mt":"Mateus","mateus":"Mateus",
  "mc":"Marcos","marcos":"Marcos",
  "lc":"Lucas","lucas":"Lucas",
  "jo":"João","joão":"João","joao":"João",
  "at":"Atos","atos":"Atos",
  "rm":"Romanos","romanos":"Romanos",
  "1co":"1 Coríntios","1 coríntios":"1 Coríntios","1 corintios":"1 Coríntios",
  "2co":"2 Coríntios","2 coríntios":"2 Coríntios","2 corintios":"2 Coríntios",
  "gl":"Gálatas","gálatas":"Gálatas","galatas":"Gálatas",
  "ef":"Efésios","efésios":"Efésios","efesios":"Efésios",
  "fp":"Filipenses","filipenses":"Filipenses",
  "cl":"Colossenses","colossenses":"Colossenses",
  "1ts":"1 Tessalonicenses","2ts":"2 Tessalonicenses",
  "1tm":"1 Timóteo","2tm":"2 Timóteo",
  "tt":"Tito","fm":"Filemom","hb":"Hebreus",
  "tg":"Tiago","1pe":"1 Pedro","2pe":"2 Pedro",
  "1jo":"1 João","2jo":"2 João","3jo":"3 João",
  "jd":"Judas","ap":"Apocalipse","apocalipse":"Apocalipse",
  "jr":"Jeremias","jeremias":"Jeremias",
  "lm":"Lamentações","lamentações":"Lamentações","lamentacoes":"Lamentações",
  "is":"Isaías","isaías":"Isaías","isaias":"Isaías",
  "dn":"Daniel","daniel":"Daniel",
  "ez":"Ezequiel","ezequiel":"Ezequiel",
  "pv":"Provérbios","provérbios":"Provérbios","proverbios":"Provérbios",
  "ec":"Eclesiastes","eclesiastes":"Eclesiastes"
};

export function normalizeBook(book){
  const raw=String(book||"").trim();
  if(!raw) return "";
  const key=raw.toLowerCase().replace(/\s+/g," ");
  return BOOK_ALIASES[key] || raw;
}

export function normalizeVerse(v){
  const book=normalizeBook(v.book || v.livro || v.book_name);
  const chapter=Number(v.chapter ?? v.capitulo ?? v.cap ?? 0);
  const verse=Number(v.verse ?? v.versiculo ?? v.ver ?? 0);
  const text=String(v.text ?? v.texto ?? "").trim();
  if(!book || !chapter || !verse || !text) return null;
  const ref=`${book} ${chapter}:${verse}`;
  return {
    id:`${book}|${chapter}|${verse}`.toLowerCase(),
    book, chapter, verse, ref, text
  };
}

export function parseReference(input){
  const s=String(input||"").trim();
  const m=s.match(/^(.+?)\s+(\d+)(?::(\d+)(?:-(\d+))?)?$/);
  if(!m) return null;
  return {
    book: normalizeBook(m[1]),
    chapter:Number(m[2]),
    verseStart:m[3]?Number(m[3]):null,
    verseEnd:m[4]?Number(m[4]):(m[3]?Number(m[3]):null)
  };
}
