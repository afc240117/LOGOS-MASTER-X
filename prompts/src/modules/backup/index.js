import { Store } from "../../core/store.js";
export const BackupModule={
 id:"backup",title:"Backup",version:"1.0",capabilities:["exportar-json","importar-json"],
 export(){return JSON.stringify(Store.exportAll(),null,2);},
 import(text){Store.importAll(JSON.parse(text));return true;},
 render(){return `<h2>💾 Backup</h2><p>Exportação e restauração local em JSON.</p>`;}
};