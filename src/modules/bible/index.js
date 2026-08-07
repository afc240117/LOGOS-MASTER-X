import { dbPutMany, dbClear, dbGetAll, dbPut, dbGet } from "./indexeddb.js";
import { parseBibleFile } from "./importer.js";
import { parseReference } from "./normalizer.js";

export const BibleModule={
  id:"bible",title:"Bíblia",version:"1.0-local",
  capabilities:["importar-json","importar-csv","importar-txt","referencia","capitulo","pesquisa","enviar-modulos"],

  async importFile(file){
    const verses=await parseBibleFile(file);
    await dbClear("verses");
    await dbPutMany("verses",verses);
    await dbPut("meta",{key:"bible",name:file.name,count:verses.length,importedAt:new Date().toISOString()});
    return {count:verses.length,name:file.name};
  },

  async meta(){ return await dbGet("meta","bible"); },

  async all(){ return await dbGetAll("verses"); },

  async books(){
    const all=await this.all();
    return [...new Set(all.map(v=>v.book))];
  },

  async chapters(book){
    const all=await this.all();
    return [...new Set(all.filter(v=>v.book===book).map(v=>v.chapter))].sort((a,b)=>a-b);
  },

  async chapter(book,chapter){
    const all=await this.all();
    return all.filter(v=>v.book===book && v.chapter===Number(chapter)).sort((a,b)=>a.verse-b.verse);
  },

  async reference(query){
    const p=parseReference(query);
    if(!p) return [];
    const all=await this.all();
    return all.filter(v=>{
      if(v.book!==p.book || v.chapter!==p.chapter) return false;
      if(p.verseStart==null) return true;
      return v.verse>=p.verseStart && v.verse<=p.verseEnd;
    }).sort((a,b)=>a.verse-b.verse);
  },

  async search(term,{book=null,limit=200}={}){
    const t=String(term||"").toLowerCase().trim();
    if(!t) return [];
    const all=await this.all();
    return all.filter(v=>(!book||v.book===book) && v.text.toLowerCase().includes(t)).slice(0,limit);
  },

  format(verses){ return verses.map(v=>`${v.ref} — ${v.text}`).join("\n"); },

  sendTo(moduleId,verses){
    const passage=this.format(verses);
    const payload={source:"bible",moduleId,passage,refs:verses.map(v=>v.ref)};
    localStorage.setItem("logosx:bible:last-send",JSON.stringify(payload));
    window.dispatchEvent(new CustomEvent("logos:bible-send",{detail:payload}));
    return payload;
  },

  render(){return `<h2>📖 Bíblia Local</h2><p>Importe uma tradução que você tenha permissão para usar. Depois pesquise e envie passagens aos demais módulos.</p>`;}
};
