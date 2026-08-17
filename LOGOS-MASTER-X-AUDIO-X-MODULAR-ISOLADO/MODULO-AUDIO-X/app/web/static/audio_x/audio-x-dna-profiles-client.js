window.AudioXDNAProfiles={
 async req(url,opt={}){const r=await fetch(url,{headers:{"Content-Type":"application/json",...(opt.headers||{})},...opt});let d=null;try{d=await r.json()}catch{};if(!r.ok)throw Error(d?.detail||`HTTP ${r.status}`);return d},
 create(body){return this.req("/api/audio-x/dna-k7/profiles",{method:"POST",body:JSON.stringify(body)})},
 list(){return this.req("/api/audio-x/dna-k7/profiles",{cache:"no-store"})},
 get(id){return this.req(`/api/audio-x/dna-k7/profiles/${encodeURIComponent(id)}`,{cache:"no-store"})},
 update(id,body){return this.req(`/api/audio-x/dna-k7/profiles/${encodeURIComponent(id)}`,{method:"PATCH",body:JSON.stringify(body)})},
 remove(id){return this.req(`/api/audio-x/dna-k7/profiles/${encodeURIComponent(id)}`,{method:"DELETE"})},
 studio(id){return this.req(`/api/audio-x/dna-k7/profiles/${encodeURIComponent(id)}/studio-x`,{cache:"no-store"})}
};