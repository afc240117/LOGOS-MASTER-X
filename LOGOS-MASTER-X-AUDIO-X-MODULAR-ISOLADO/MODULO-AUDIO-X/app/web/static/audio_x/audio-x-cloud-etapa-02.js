(() => {
  const $=id=>document.getElementById(id);
  const input=$('fileInput'), drop=$('dropZone');
  let file=null, job=null, routerOk=false;

  const bytes=n=>n>=1048576?`${(n/1048576).toFixed(1)} MB`:`${(n/1024).toFixed(1)} KB`;

  function setFile(f){
    if(!f)return;
    if(!/\.(mp3|wav|m4a)$/i.test(f.name)){
      $('message').className='message error';
      $('message').textContent='Formato não suportado. Use MP3, WAV ou M4A.';
      return;
    }
    file=f;
    $('fileName').textContent=f.name;
    $('fileMeta').textContent=`${f.type||'áudio'} · ${bytes(f.size)}`;
    $('titleInput').value=f.name.replace(/\.[^.]+$/,'');
    $('filePanel').classList.remove('hidden');
    drop.classList.add('hidden');
    updateUploadState();
  }

  function clearFile(){
    file=null;job=null;input.value='';
    $('filePanel').classList.add('hidden');
    drop.classList.remove('hidden');
    $('jobResult').classList.add('hidden');
    $('message').className='message';
    $('message').textContent='Selecione um arquivo de áudio.';
    updateUploadState();
  }

  function updateUploadState(){
    $('uploadBtn').disabled=!(file&&routerOk);
  }

  async function checkRouter(){
    try{
      const r=await fetch('/api/audio-x/router/health',{cache:'no-store'});
      if(!r.ok)throw new Error(`HTTP ${r.status}`);
      const d=await r.json();
      routerOk=!!d.ok;
      $('routerBadge').textContent=d.ok?'ROUTER PRONTO':'SEM PROVEDOR';
      $('routerBadge').className='badge '+(d.ok?'ok':'fail');
      $('primaryProvider').textContent=d.primary_provider||'Nenhum';
      $('fallbackOrder').textContent=(d.fallback_order||[]).join(' → ')||'Nenhum';
      $('providerCount').textContent=d.usable_provider_count||0;
      updateUploadState();
    }catch(e){
      routerOk=false;
      $('routerBadge').textContent='OFFLINE';
      $('routerBadge').className='badge fail';
      updateUploadState();
    }
  }

  async function upload(){
    if(!file||!routerOk)return;
    $('uploadBtn').disabled=true;
    $('progressArea').classList.remove('hidden');
    $('progressText').textContent='Enviando ao backend LOGOS...';
    $('progressValue').textContent='25%';
    $('progressBar').style.width='25%';
    $('message').className='message';
    $('message').textContent='Criando Job Cloud...';

    try{
      const result=await AudioXCloudUpload.createJob(file,{
        language:$('language').value,
        title:$('titleInput').value
      });
      job=result.job;
      $('progressValue').textContent='100%';
      $('progressBar').style.width='100%';
      $('progressText').textContent='Upload concluído';
      $('jobSummary').textContent=`Job ${job.id} · ${job.filename} · provedor inicial: ${job.selected_provider}`;
      $('jobResult').classList.remove('hidden');
      $('message').className='message ok';
      $('message').textContent='Etapa 2 concluída. Job pronto para transcrição cloud.';
      sessionStorage.setItem('logosMasterX.audioXCloud.job',JSON.stringify(job));
      window.dispatchEvent(new CustomEvent('audioxcloud:job-created',{detail:job}));
    }catch(e){
      $('progressArea').classList.add('hidden');
      $('message').className='message error';
      $('message').textContent='Falha no upload: '+e.message;
      $('uploadBtn').disabled=false;
    }
  }

  input.onchange=e=>setFile(e.target.files[0]);
  drop.onclick=()=>input.click();
  $('changeFile').onclick=()=>input.click();
  $('removeFile').onclick=clearFile;
  $('uploadBtn').onclick=upload;
  $('checkRouter').onclick=checkRouter;
  $('copyJob').onclick=()=>job&&navigator.clipboard?.writeText(job.id);

  ['dragenter','dragover'].forEach(ev=>drop.addEventListener(ev,e=>{e.preventDefault();drop.classList.add('drag')}));
  ['dragleave','drop'].forEach(ev=>drop.addEventListener(ev,e=>{e.preventDefault();drop.classList.remove('drag')}));
  drop.addEventListener('drop',e=>setFile(e.dataTransfer.files[0]));

  checkRouter();
})();