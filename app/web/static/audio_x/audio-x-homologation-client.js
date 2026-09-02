window.AudioXHomologation={
 async req(url){const r=await fetch(url,{cache:"no-store"});let d=null;try{d=await r.json()}catch{};if(!r.ok)throw Error(d?.detail||`HTTP ${r.status}`);return d},
 providers(){return this.req("/api/audio-x/homologation/providers")},
 ready(){return this.req("/api/audio-x/homologation/ready")},
 job(id){return this.req(`/api/audio-x/homologation/job/${encodeURIComponent(id)}`)}
};