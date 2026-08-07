import { Store } from "../../core/store.js";
export const K7Module = {
 id:"k7",title:"DNA K7",version:"1.0",
 capabilities:["perfil","analisar-transcricao","intensidade","aplicar"],
 analyze(text=""){
   const low=text.toLowerCase();
   const keys=["restaura","altar","oração","igreja","espírito","voltemos","olhe","perceba"];
   const hits=keys.map(k=>[k,(low.match(new RegExp(k,"g"))||[]).length]).filter(x=>x[1]);
   const result={length:text.length,hits,profile:"abertura → contexto → exposição → aplicação → intensificação → clímax → convite"};
   Store.push("k7:analyses",{id:Date.now(),...result,created:new Date().toISOString()}); return result;
 },
 render(){return `<h2>🔥 DNA K7</h2><p>Analisa e aplica o perfil estrutural K7 sem copiar identidade vocal.</p>`;}
};