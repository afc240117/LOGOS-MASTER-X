window.AudioXCloudSegmentation={
 async run(jobId){
   const r=await fetch(`/api/audio-x/jobs/${encodeURIComponent(jobId)}/segment`,{method:"POST"});
   if(!r.ok){let d=null;try{d=await r.json()}catch{};throw Error(d?.detail||`HTTP ${r.status}`)}
   return r.json();
 },
 async get(jobId){
   const r=await fetch(`/api/audio-x/jobs/${encodeURIComponent(jobId)}/segmentation`,{cache:"no-store"});
   if(!r.ok)throw Error(`HTTP ${r.status}`);
   return r.json();
 }
};