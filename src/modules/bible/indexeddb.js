const DB_NAME="logos-master-x";
const DB_VERSION=2;

export function openBibleDB(){
  return new Promise((resolve,reject)=>{
    const req=indexedDB.open(DB_NAME,DB_VERSION);
    req.onupgradeneeded=()=>{
      const db=req.result;
      if(!db.objectStoreNames.contains("verses")){
        const s=db.createObjectStore("verses",{keyPath:"id"});
        s.createIndex("book","book",{unique:false});
        s.createIndex("bookChapter",["book","chapter"],{unique:false});
        s.createIndex("ref","ref",{unique:false});
      }
      if(!db.objectStoreNames.contains("crossrefs")){
        db.createObjectStore("crossrefs",{keyPath:"ref"});
      }
      if(!db.objectStoreNames.contains("meta")){
        db.createObjectStore("meta",{keyPath:"key"});
      }
    };
    req.onsuccess=()=>resolve(req.result);
    req.onerror=()=>reject(req.error);
  });
}

export async function dbPutMany(storeName, items){
  const db=await openBibleDB();
  return new Promise((resolve,reject)=>{
    const tx=db.transaction(storeName,"readwrite");
    const store=tx.objectStore(storeName);
    for(const item of items) store.put(item);
    tx.oncomplete=()=>resolve(items.length);
    tx.onerror=()=>reject(tx.error);
  });
}

export async function dbClear(storeName){
  const db=await openBibleDB();
  return new Promise((resolve,reject)=>{
    const tx=db.transaction(storeName,"readwrite");
    tx.objectStore(storeName).clear();
    tx.oncomplete=()=>resolve(true);
    tx.onerror=()=>reject(tx.error);
  });
}

export async function dbGetAll(storeName){
  const db=await openBibleDB();
  return new Promise((resolve,reject)=>{
    const tx=db.transaction(storeName,"readonly");
    const req=tx.objectStore(storeName).getAll();
    req.onsuccess=()=>resolve(req.result||[]);
    req.onerror=()=>reject(req.error);
  });
}

export async function dbGet(storeName,key){
  const db=await openBibleDB();
  return new Promise((resolve,reject)=>{
    const tx=db.transaction(storeName,"readonly");
    const req=tx.objectStore(storeName).get(key);
    req.onsuccess=()=>resolve(req.result||null);
    req.onerror=()=>reject(req.error);
  });
}

export async function dbPut(storeName,item){
  const db=await openBibleDB();
  return new Promise((resolve,reject)=>{
    const tx=db.transaction(storeName,"readwrite");
    tx.objectStore(storeName).put(item);
    tx.oncomplete=()=>resolve(item);
    tx.onerror=()=>reject(tx.error);
  });
}
