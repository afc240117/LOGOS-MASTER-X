window.AudioXHistory={
 async req(url,opt={}){const r=await fetch(url,opt);let d=null;try{d=await r.json()}catch{};if(!r.ok)throw Error(d?.detail||`HTTP ${r.status}`);return d},
 list(){return this.req("/api/audio-x/history",{cache:"no-store"})},
 get(id){return this.req(`/api/audio-x/history/${encodeURIComponent(id)}`,{cache:"no-store"})},
 remove(id,removeProfile=false){return this.req(`/api/audio-x/history/${encodeURIComponent(id)}?remove_profile=${removeProfile?"true":"false"}`,{method:"DELETE"})}
};