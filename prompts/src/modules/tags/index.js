import { Store } from "../../core/store.js";
export const TagsModule={
 id:"tags",title:"Tags",version:"1.0",capabilities:["criar","listar"],
 add(name){const xs=[...new Set([...Store.list("tags"),name.trim()])].filter(Boolean);Store.set("tags",xs);return xs;},
 render(){return `<h2>🏷️ Tags</h2>`;}
};