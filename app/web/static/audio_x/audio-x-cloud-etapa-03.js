(() => {
  const $=id=>document.getElementById(id);
  let job=null, transcription=null;

  function readJob(){
    try{return JSON.parse(sessionStorage.getItem('logosMasterX.audioXCloud.job')||'null')}catch{return null}
  }
  const fmt=s=>{
    s=Math.max(0,Number(s)||0);
    const h=Math.floor(s/3600),m=Math.floor((s%3600)/60),sec=Math.floor(s%60);
    return h?`${h}:${String(m).padStart(2,'0')}:${String(sec).padStart(2,'0')}`:`${String(m).padStart(2,'0')}:${String(sec).padStart(2,'0')}`;
  };
  const esc=s=>String(s||'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

  function renderJob(){
    job=readJob();
    if(!job){
      $('jobTitle').textContent='Nenhum job carregado';
      $('jobMeta').textContent='Conclua a Etapa 2.';
      $('transcribeBtn').disabled=true;
      return;
    }
    $('jobTitle').textContent=job.title||job.filename||job.id;
    $('jobMeta').textContent=`${job.filename} · Job ${job.id}`;
    $('jobBadge').textContent='JOB PRONTO';
    $('jobBadge').className='badge ok';
    $('transcribeBtn').disabled=false;

    const order=job.provider_order||[];
    document.querySelectorAll('.provider').forEach(card=>{
      card.style.display=order.includes(card.dataset.provider)?'grid':'none';
    });
  }

  function resetProviderStates(){
    document.querySelectorAll('.provider').forEach(c=>{
      c.classList.remove('running','ok','fail');
      c.querySelector('strong').textContent='—';
    });
  }

  function setProvider(name,state,text){
    const card=document.querySelector(`.provider[data-provider="${name}"]`);
    if(!card)return;
    card.classList.remove('running','ok','fail');
    if(state)card.classList.add(state);
    card.querySelector('strong').textContent=text||state||'—';
  }

  function renderAttempts(attempts){
    const box=$('attempts');
    if(!attempts?.length){
      box.className='attempts empty';box.textContent='Nenhuma tentativa ainda.';return;
    }
    box.className='attempts';
    box.innerHTML=attempts.map(a=>`<div class="attempt ${a.status==='completed'?'ok':a.status==='failed'?'fail':''}">
      <b>${esc(a.provider)}</b>
      <span>${esc(a.status)}${a.status_code?' · HTTP '+a.status_code:''}${a.error?' · '+esc(a.error):''}</span>
    </div>`).join('');
  }

  async function transcribe(){
    if(!job)return;
    resetProviderStates();
    $('transcribeBtn').disabled=true;
    $('statusText').className='status-text';
    $('statusText').textContent='Audio Router iniciando transcrição...';
    const first=(job.provider_order||[])[0];
    if(first)setProvider(first,'running','tentando');

    try{
      const result=await AudioXCloudTranscription.start(job.id);
      transcription=result.transcription;
      job=result.job;
      sessionStorage.setItem('logosMasterX.audioXCloud.job',JSON.stringify(job));
      sessionStorage.setItem('logosMasterX.audioXCloud.transcription',JSON.stringify(transcription));

      (transcription.provider_attempts||[]).forEach(a=>{
        setProvider(a.provider,a.status==='completed'?'ok':'fail',a.status==='completed'?'usado':'falhou');
      });
      renderAttempts(transcription.provider_attempts);

      $('jobBadge').textContent='TRANSCRITO';
      $('providerUsed').textContent=`Provedor utilizado: ${transcription.provider}${transcription.fallback_used?' · fallback acionado':''}`;
      $('segmentCount').textContent=(transcription.segments||[]).length;
      $('wordCount').textContent=(transcription.words||[]).length;
      $('duration').textContent=transcription.duration!=null?fmt(transcription.duration):'—';
      $('resultPanel').classList.remove('hidden');
      renderSegments();
      $('statusText').className='status-text ok';
      $('statusText').textContent='Etapa 3 concluída. Transcrição e timestamps normalizados.';
      window.dispatchEvent(new CustomEvent('audioxcloud:transcription-complete',{detail:transcription}));
    }catch(e){
      $('statusText').className='status-text error';
      $('statusText').textContent='Falha na transcrição: '+e.message;
      const attempts=e.data?.detail?.attempts||[];
      attempts.forEach(a=>setProvider(a.provider,'fail','falhou'));
      renderAttempts(attempts);
      $('transcribeBtn').disabled=false;
    }
  }

  function renderSegments(){
    const q=$('search').value.trim().toLowerCase();
    const rows=(transcription?.segments||[]).filter(s=>!q||(s.text||'').toLowerCase().includes(q));
    const box=$('segments');
    if(!rows.length){
      const text=transcription?.text||'Nenhum segmento retornado.';
      box.innerHTML=`<div class="segment"><time>Texto</time><p>${esc(text)}</p></div>`;
      return;
    }
    box.innerHTML=rows.map(s=>{
      let text=esc(s.text);
      if(q){
        const re=new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g,'\\$&'),'ig');
        text=text.replace(re,m=>`<mark>${m}</mark>`);
      }
      return `<div class="segment"><time>${fmt(s.start)}–${fmt(s.end)}</time><p>${text}</p></div>`;
    }).join('');
  }

  function download(name,type,content){
    const blob=new Blob([content],{type}),a=document.createElement('a');
    a.href=URL.createObjectURL(blob);a.download=name;a.click();
    setTimeout(()=>URL.revokeObjectURL(a.href),1000);
  }

  $('transcribeBtn').onclick=transcribe;
  $('reloadJob').onclick=renderJob;
  $('search').oninput=renderSegments;
  $('exportTxt').onclick=()=>transcription&&download('audio-x-cloud-transcricao.txt','text/plain;charset=utf-8',transcription.text||'');
  $('exportJson').onclick=()=>transcription&&download('audio-x-cloud-transcricao.json','application/json;charset=utf-8',JSON.stringify(transcription,null,2));

  renderJob();
})();