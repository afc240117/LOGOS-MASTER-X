import { Store } from "../../core/store.js";
export const LibraryModule={
 id:"library",title:"Biblioteca",version:"1.0",capabilities:["listar","buscar","backup"],
 search(q=""){const keys=["sermons","studies","ebd","themes","favorites"];return keys.flatMap(k=>Store.list(k).map(x=>({...x,_type:k}))).filter(x=>JSON.stringify(x).toLowerCase().includes(q.toLowerCase()));},
 render(){return `<h2>📚 Biblioteca</h2><p>Conteúdo salvo no aparelho.</p>`;}
};