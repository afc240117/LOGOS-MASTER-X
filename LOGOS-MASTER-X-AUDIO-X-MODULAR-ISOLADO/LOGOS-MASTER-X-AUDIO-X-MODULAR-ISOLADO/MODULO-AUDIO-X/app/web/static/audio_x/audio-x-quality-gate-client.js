window.AudioXQualityGate={
 async req(url){const r=await fetch(url,{cache:"no-store"});let d=null;try{d=await r.json()}catch{};if(!r.ok)throw Error(d?.detail||`HTTP ${r.status}`);return d},
 run(){return this.req("/api/audio-x/quality-gate")},
 pipeline(id){return this.req(`/api/audio-x/quality-gate/pipeline/${encodeURIComponent(id)}`)}
};