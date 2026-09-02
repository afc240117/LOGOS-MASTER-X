window.AudioXOneClick={
 async req(url,opt={}){const r=await fetch(url,opt);let d=null;try{d=await r.json()}catch{};if(!r.ok)throw Error(d?.detail||`HTTP ${r.status}`);return d},
 start(jobId,profileName="",strength=100){return this.req("/api/audio-x/pipeline/start",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({job_id:jobId,profile_name:profileName,strength})})},
 status(jobId){return this.req(`/api/audio-x/pipeline/${encodeURIComponent(jobId)}/status`,{cache:"no-store"})},
 watch(jobId,onUpdate,interval=1400){let stop=false;const tick=async()=>{if(stop)return;try{const d=await this.status(jobId);onUpdate(d);if(["completed","failed"].includes(d.pipeline?.status))return}catch(e){onUpdate({error:e.message})}setTimeout(tick,interval)};tick();return()=>stop=true}
};