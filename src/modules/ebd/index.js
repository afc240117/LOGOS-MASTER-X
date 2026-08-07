import { Store } from "../../core/store.js";
export const EbdModule = {
 id:"ebd",title:"EBD",version:"1.0",capabilities:["aula-local","objetivos","revisao"],
 generate({theme="",text=""}={}){
  const out=`AULA EBD
Título: ${theme||"Lição bíblica"}
Texto: ${text}
Texto áureo: [selecionar do texto estudado]
Verdade prática: [formular após estudo]
Objetivos:
• Conhecer
• Compreender
• Praticar

INTRODUÇÃO
TÓPICO 1
TÓPICO 2
TÓPICO 3
PERGUNTAS PARA CLASSE
REVISÃO
APLICAÇÃO
CONCLUSÃO`;
  Store.push("ebd",{id:Date.now(),title:theme||text,text:out,created:new Date().toISOString()}); return out;
 },render(){return `<h2>🏫 EBD</h2><p>Planejador local de aulas.</p>`;}
};