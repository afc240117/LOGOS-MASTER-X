(()=>{
  const ID="lmxAudioXModularBtn";
  let openSerial=0;
  function openAudioX(){
    const ws=document.querySelector("#workspace");
    if(!ws)return false;
    if(ws.dataset.view==="audiox"&&ws.querySelector("iframe[data-audio-x-frame]"))return true;
    const serial=++openSerial;
    try{window.__LMX_BIBLE_CANCEL?.()}catch(_){ }
    try{App.view="audiox"}catch(_){ }
    document.body.classList.remove("lmx-hide-global-nav","bx-page-lock","logos-reader-lock","bx-dynamic-open");
    document.querySelectorAll(".nav button").forEach(x=>x.classList.remove("active"));
    document.getElementById(ID)?.classList.add("active");
    document.querySelectorAll(".top-nav [data-go], .bottom-nav [data-go]").forEach(x=>x.classList.remove("active"));
    ws.dataset.view="audiox";
    const frame=document.createElement("iframe");
    frame.dataset.audioXFrame="1";
    frame.title="Áudio X Cloud";
    frame.loading="eager";
    frame.style.cssText="width:100%;height:100%;border:0;border-radius:12px;background:#05080c";
    const host=document.createElement("div");
    host.style.cssText="height:calc(100vh - 112px);min-height:650px;width:100%;overflow:hidden";
    host.appendChild(frame);
    ws.replaceChildren(host);
    const load=()=>{
      if(serial!==openSerial||!frame.isConnected)return;
      frame.src="/static/audio_x/audio-x-cloud.html";
    };
    if(typeof requestAnimationFrame==="function")requestAnimationFrame(load);else setTimeout(load,0);
    if(innerWidth<=760){
      document.body.classList.remove("nav-open","mobile-nav-open");
    }
    return true;
  }
  function installButton(){
    if(document.getElementById(ID))return;
    const nav=document.querySelector(".sidebar .nav");
    if(!nav)return;
    const bible=nav.querySelector('[data-view="bible"]');
    const btn=document.createElement("button");
    btn.id=ID; btn.type="button"; btn.dataset.audioXModular="1";
    btn.className="audio-x-menu-btn";btn.setAttribute("aria-label","Áudio X");
    btn.innerHTML='<i class="side-ico" aria-hidden="true">🎧</i><span>Áudio X<small>MP3 → DNA K7 Cloud</small></span>';
    btn.addEventListener("click",e=>{e.preventDefault();e.stopPropagation();openAudioX()});
    if(bible)bible.insertAdjacentElement("afterend",btn); else nav.appendChild(btn);
  }
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",installButton);else installButton();
  new MutationObserver(installButton).observe(document.documentElement,{childList:true,subtree:true});
  window.LogosAudioX={open:openAudioX};
})();
