import { buildLocalSermon, renderSermon } from "../../core/local-generator.js";
import { Store } from "../../core/store.js";
export const SermonsModule = {
 id:"sermons", title:"Sermões", version:"1.0",
 capabilities:["gerar-local","tempo","dna-k7","salvar","enviar-editor"],
 generate(input){ const data=buildLocalSermon(input); const text=renderSermon(data); Store.push("sermons",{id:Date.now(),...input,text,created:new Date().toISOString()}); return {data,text}; },
 render(){ return `<h2>🎤 Sermões</h2><p>Motor local de estruturação e geração homilética.</p>`; }
};