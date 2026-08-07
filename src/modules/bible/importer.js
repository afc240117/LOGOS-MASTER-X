import { normalizeVerse } from "./normalizer.js";

function parseCSV(text){
  const lines=text.split(/\r?\n/).filter(Boolean);
  if(!lines.length) return [];
  const sep=(lines[0].includes(";") && !lines[0].includes(","))?";":",";
  const headers=lines[0].split(sep).map(x=>x.trim().toLowerCase());
  const out=[];
  for(const line of lines.slice(1)){
    const cols=line.split(sep);
    const obj={};
    headers.forEach((h,i)=>obj[h]=(cols[i]??"").trim());
    out.push(obj);
  }
  return out;
}

function parseTXT(text){
  const out=[];
  for(const raw of text.split(/\r?\n/)){
    const line=raw.trim();
    if(!line) continue;
    const m=line.match(/^(.+?)\s+(\d+):(\d+)\s+(.+)$/);
    if(m) out.push({book:m[1],chapter:m[2],verse:m[3],text:m[4]});
  }
  return out;
}

export async function parseBibleFile(file){
  const text=await file.text();
  let raw=[];
  const name=(file.name||"").toLowerCase();
  if(name.endsWith(".json")){
    const data=JSON.parse(text);
    raw=Array.isArray(data)?data:(data.verses||data.versiculos||[]);
  } else if(name.endsWith(".csv")) raw=parseCSV(text);
  else raw=parseTXT(text);

  const normalized=raw.map(normalizeVerse).filter(Boolean);
  if(!normalized.length) throw new Error("Nenhum versículo reconhecido. Veja data/bible/FORMATO-IMPORTACAO.md");
  return normalized;
}
