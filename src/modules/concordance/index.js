import { dbGetAll, dbPut, dbGet } from "../bible/indexeddb.js";

function words(text){
  return String(text||"").toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g,"")
    .match(/[a-z0-9]+/g)||[];
}

export const ConcordanceModule={
  id:"concordance",title:"Concordância",version:"1.0-local",
  capabilities:["indexar-biblia","buscar-palavra","frequencia"],

  async build(){
    const verses=await dbGetAll("verses");
    const idx={};
    for(const v of verses){
      const unique=[...new Set(words(v.text))];
      for(const w of unique){
        if(w.length<3) continue;
        (idx[w]??=[]).push(v.id);
      }
    }
    await dbPut("meta",{key:"concordance",index:idx,builtAt:new Date().toISOString(),words:Object.keys(idx).length});
    return {words:Object.keys(idx).length,verses:verses.length};
  },

  async search(word){
    const meta=await dbGet("meta","concordance");
    if(!meta?.index) return [];
    const key=words(word)[0]||"";
    const ids=meta.index[key]||[];
    const verses=await dbGetAll("verses");
    const map=new Map(verses.map(v=>[v.id,v]));
    return ids.map(id=>map.get(id)).filter(Boolean);
  },

  render(){return `<h2>🔎 Concordância</h2><p>Índice local criado a partir da Bíblia importada.</p>`;}
};
