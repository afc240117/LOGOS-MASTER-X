import { Store } from "../../core/store.js";
export const FavoritesModule={
 id:"favorites",title:"Favoritos",version:"1.0",capabilities:["favoritar","remover"],
 add(item){return Store.push("favorites",{id:Date.now(),...item});},
 render(){return `<h2>❤️ Favoritos</h2>`;}
};