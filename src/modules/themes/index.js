import { Store } from "../../core/store.js";
export const ThemesModule={
 id:"themes",title:"Banco de Temas",version:"1.0",capabilities:["criar","buscar","tags"],
 add(theme){return Store.push("themes",{id:Date.now(),...theme,created:new Date().toISOString()});},
 render(){return `<h2>📌 Temas</h2><p>Banco local de temas e ideias.</p>`;}
};