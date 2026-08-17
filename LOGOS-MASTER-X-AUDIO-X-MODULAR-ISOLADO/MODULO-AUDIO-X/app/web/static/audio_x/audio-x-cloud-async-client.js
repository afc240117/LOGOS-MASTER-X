window.AudioXAsync={
 async start(id){let r=await fetch(`/api/audio-x/jobs/${encodeURIComponent(id)}/start`,{method:"POST"});if(!r.ok)throw Error(`HTTP ${r.status}`);return r.json()},
 async status(id){let r=await fetch(`/api/audio-x/jobs/${encodeURIComponent(id)}/status`,{cache:"no-store"});if(!r.ok)throw Error(`HTTP ${r.status}`);return r.json()},
 async result(id){let r=await fetch(`/api/audio-x/jobs/${encodeURIComponent(id)}/result`,{cache:"no-store"});if(!r.ok)throw Error(`HTTP ${r.status}`);return r.json()},
 watch(id,onUpdate,interval=1500){let stopped=false;const tick=async()=>{if(stopped)return;try{const d=await this.status(id);onUpdate(d);const s=d.job?.transcription_status;if(s==="completed"||s==="failed"){if(s==="completed"){try{onUpdate({...d,result:await this.result(id)})}catch{}}return}}catch(e){onUpdate({error:e.message})}setTimeout(tick,interval)};tick();return()=>{stopped=true}}
};