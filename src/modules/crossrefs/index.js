import { dbPutMany, dbGetAll } from "../bible/indexeddb.js";

export const CrossRefsModule={
 id:"crossrefs",title:"Referências Cruzadas",version:"1.0-local",
 capabilities:["importar-json","consultar","adicionar-local"],

 async load(items){
   const data=(items||[]).map(x=>({ref:String(x.ref),refs:Array.isArray(x.refs)?x.refs:[]}));
   await dbPutMany("crossrefs",data);
   return data.length;
 },

 async get(ref){
   const all=await dbGetAll("crossrefs");
   return all.find(x=>x.ref===ref)?.refs || [];
 },

 async importFile(file){
   const data=JSON.parse(await file.text());
   return this.load(Array.isArray(data)?data:(data.crossrefs||[]));
 },

 render(){return `<h2>📖 Referências Cruzadas</h2><p>Banco local importável e consultável offline.</p>`;}
};
