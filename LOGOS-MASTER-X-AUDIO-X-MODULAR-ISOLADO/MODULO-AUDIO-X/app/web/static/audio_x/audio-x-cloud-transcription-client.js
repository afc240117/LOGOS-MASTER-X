window.AudioXCloudTranscription = {
  async start(jobId) {
    const r = await fetch(
      `/api/audio-x/jobs/${encodeURIComponent(jobId)}/transcribe`,
      {method:'POST'}
    );
    let data=null;
    try{ data=await r.json(); }catch{}
    if(!r.ok){
      const detail=data?.detail;
      const msg=typeof detail==='string'
        ? detail
        : detail?.message || `HTTP ${r.status}`;
      const e=new Error(msg);
      e.data=data;
      throw e;
    }
    return data;
  },

  async get(jobId) {
    const r=await fetch(
      `/api/audio-x/jobs/${encodeURIComponent(jobId)}/transcription`,
      {cache:'no-store'}
    );
    if(!r.ok) throw new Error(`HTTP ${r.status}`);
    return await r.json();
  }
};