window.AudioXUsage={
 async req(url,opt={}){const r=await fetch(url,opt);let d=null;try{d=await r.json()}catch{};if(!r.ok)throw Error(d?.detail||`HTTP ${r.status}`);return d},
 get(){return this.req("/api/audio-x/usage",{cache:"no-store"})},
 route(minutes){return this.req(`/api/audio-x/usage/route?minutes=${encodeURIComponent(minutes)}`,{cache:"no-store"})},
 save(provider,body){return this.req("/api/audio-x/usage/limits",{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({provider,...body})})}
};