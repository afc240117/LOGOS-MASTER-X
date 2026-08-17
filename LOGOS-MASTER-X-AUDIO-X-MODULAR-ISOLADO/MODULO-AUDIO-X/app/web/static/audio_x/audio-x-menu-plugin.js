(()=>{
  const ID="lmxAudioXModularBtn";
  function openAudioX(){
    const ws=document.querySelector("#workspace");
    if(!ws)return;
    document.querySelectorAll(".nav button[data-view]").forEach(x=>x.classList.remove("active"));
    document.getElementById(ID)?.classList.add("active");
    ws.innerHTML=`<div style="height:calc(100vh - 112px);min-height:650px;width:100%;overflow:hidden">
      <iframe src="/static/audio_x/audio-x-cloud.html" title="Áudio X Cloud" style="width:100%;height:100%;border:0;border-radius:12px;background:#05080c"></iframe>
    </div>`;
    if(innerWidth<=760){
      document.body.classList.remove("nav-open","mobile-nav-open");
    }
  }
  function installButton(){
    if(document.getElementById(ID))return;
    const nav=document.querySelector(".sidebar .nav");
    if(!nav)return;
    const bible=nav.querySelector('[data-view="bible"]');
    const btn=document.createElement("button");
    btn.id=ID; btn.type="button"; btn.dataset.audioXModular="1";
    btn.innerHTML='<i class="side-ico" aria-hidden="true">🎧</i><span>Áudio X<small>MP3 → DNA K7 Cloud</small></span>';
    btn.addEventListener("click",e=>{e.preventDefault();e.stopPropagation();openAudioX()});
    if(bible)bible.insertAdjacentElement("afterend",btn); else nav.appendChild(btn);
  }
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",installButton);else installButton();
  new MutationObserver(installButton).observe(document.documentElement,{childList:true,subtree:true});
  window.LogosAudioX={open:openAudioX};
})();