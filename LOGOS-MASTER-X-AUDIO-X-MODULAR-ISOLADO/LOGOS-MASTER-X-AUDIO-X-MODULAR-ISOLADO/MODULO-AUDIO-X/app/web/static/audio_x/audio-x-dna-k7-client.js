window.AudioXDNAK7={
 async extract(id){const r=await fetch(`/api/audio-x/jobs/${encodeURIComponent(id)}/dna-k7`,{method:"POST"});if(!r.ok){let d={};try{d=await r.json()}catch{};throw Error(d.detail||`HTTP ${r.status}`)}return r.json()},
 async get(id){const r=await fetch(`/api/audio-x/jobs/${encodeURIComponent(id)}/dna-k7`,{cache:"no-store"});if(!r.ok)throw Error(`HTTP ${r.status}`);return r.json()}
};