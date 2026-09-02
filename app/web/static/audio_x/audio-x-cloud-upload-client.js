window.AudioXCloudUpload = {
  async createJob(file, options={}) {
    const fd = new FormData();
    fd.append('file', file);
    fd.append('language', options.language || 'pt');
    fd.append('title', options.title || '');

    const r = await fetch('/api/audio-x/upload', {
      method: 'POST',
      body: fd
    });

    if(!r.ok){
      let msg = `HTTP ${r.status}`;
      try{
        const data = await r.json();
        msg = data.detail || msg;
      }catch{}
      throw new Error(msg);
    }
    return await r.json();
  },

  async getJob(jobId) {
    const r = await fetch(`/api/audio-x/jobs/${encodeURIComponent(jobId)}`, {
      cache:'no-store'
    });
    if(!r.ok) throw new Error(`HTTP ${r.status}`);
    return await r.json();
  },

  async deleteJob(jobId) {
    const r = await fetch(`/api/audio-x/jobs/${encodeURIComponent(jobId)}`, {
      method:'DELETE'
    });
    if(!r.ok) throw new Error(`HTTP ${r.status}`);
    return await r.json();
  }
};