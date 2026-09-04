/* LOGOS MASTER X — HOTFIX v5.4.3.4
   UI Controls Bridge: Zoom A-/A+/100% + Tela cheia/Sair
   Patch modular: não altera Bíblia X, Atlas X, Áudio X ou Studio X.
*/
(function(){
  if(window.__LOGOS_UI_CONTROLS_V5434__) return;
  window.__LOGOS_UI_CONTROLS_V5434__ = true;

  const VERSION = "5.4.3.4";
  const ZOOM_KEY = "logosx:ui:readingZoomPercent";
  const MIN_ZOOM = 70;
  const MAX_ZOOM = 180;
  const STEP = 10;

  function readZoom(){
    try {
      const n = Number(localStorage.getItem(ZOOM_KEY) || "100");
      return Number.isFinite(n) ? clamp(n, MIN_ZOOM, MAX_ZOOM) : 100;
    } catch(_) { return 100; }
  }
  function saveZoom(z){ try { localStorage.setItem(ZOOM_KEY, String(z)); } catch(_) {} }
  function clamp(n,min,max){ return Math.max(min, Math.min(max, Math.round(n))); }
  function norm(s){ return String(s||"").replace(/\s+/g," ").trim(); }
  function textOf(el){ return norm(el && (el.innerText || el.textContent || el.getAttribute("aria-label") || el.title || "")); }
  function lowerText(el){ return textOf(el).toLowerCase(); }

  function installStyles(){
    if(document.getElementById("logosUiControls5434Styles")) return;
    const style = document.createElement("style");
    style.id = "logosUiControls5434Styles";
    style.textContent = `
      :root{ --logosx-reading-zoom: 100%; --logosx-reading-scale: 1; }
      body.logosx-ui-controls-ready .logosx-zoom-target,
      body.logosx-ui-controls-ready .verse-text,
      body.logosx-ui-controls-ready .bible-verse,
      body.logosx-ui-controls-ready .verse,
      body.logosx-ui-controls-ready .sermon-section,
      body.logosx-ui-controls-ready .studio-section,
      body.logosx-ui-controls-ready .reader-section,
      body.logosx-ui-controls-ready .message-section,
      body.logosx-ui-controls-ready .generated-output,
      body.logosx-ui-controls-ready .output-content,
      body.logosx-ui-controls-ready .reading-content,
      body.logosx-ui-controls-ready .logos-reading-content,
      body.logosx-ui-controls-ready .bible-content{
        font-size: var(--logosx-reading-zoom) !important;
      }
      body.logosx-ui-controls-ready [data-logos-readable="true"]{
        font-size: var(--logosx-reading-zoom) !important;
      }
      body.logosx-immersive-mode{ overflow:hidden !important; }
      body.logosx-immersive-mode #workspace,
      body.logosx-immersive-mode main,
      body.logosx-immersive-mode .workspace,
      body.logosx-immersive-mode .app-main{
        position:fixed !important;
        inset:0 !important;
        z-index:99990 !important;
        background:#050b12 !important;
        overflow:auto !important;
        padding:20px !important;
      }
      body.logosx-immersive-mode .sidebar,
      body.logosx-immersive-mode aside,
      body.logosx-immersive-mode nav.side,
      body.logosx-immersive-mode .left-sidebar,
      body.logosx-immersive-mode .app-sidebar,
      body.logosx-immersive-mode header,
      body.logosx-immersive-mode .topbar,
      body.logosx-immersive-mode .app-topbar{
        opacity:0 !important;
        pointer-events:none !important;
      }
      .logos-ui-fullscreen-toast{
        position:fixed; right:22px; bottom:22px; z-index:100000;
        background:linear-gradient(135deg,#102033,#07131d); color:#eef6ff;
        border:1px solid rgba(240,198,97,.55); border-radius:14px; padding:12px 14px;
        box-shadow:0 18px 60px rgba(0,0,0,.45); font:600 13px/1.35 system-ui,Segoe UI,sans-serif;
      }
    `;
    document.head.appendChild(style);
  }

  function markReadableAreas(){
    const selectors = [
      "#workspace article", "#workspace .content-card", "#workspace .card", "#workspace .verse-card",
      "#workspace .sermon-section", "#workspace .studio-section", "#workspace .reader-section",
      "#workspace .message-section", "#workspace .generated-output", "#workspace .output-content",
      "#workspace .reading-content", "#workspace .bible-content", "#workspace .bible-verse",
      "main article", "main .verse", "main .bible-verse"
    ];
    try {
      document.querySelectorAll(selectors.join(",")).forEach(el => {
        if(el && !el.closest(".toolbar") && !el.closest("nav") && !el.closest("aside")){
          el.setAttribute("data-logos-readable", "true");
        }
      });
    } catch(_) {}
  }

  function applyZoom(z){
    z = clamp(z, MIN_ZOOM, MAX_ZOOM);
    saveZoom(z);
    document.documentElement.style.setProperty("--logosx-reading-zoom", z + "%");
    document.documentElement.style.setProperty("--logosx-reading-scale", String(z / 100));
    document.body.classList.add("logosx-ui-controls-ready");
    markReadableAreas();
    updateZoomButtons(z);
    showToast(`Zoom de leitura: ${z}%`);
    return z;
  }
  function updateZoomButtons(z){
    const buttons = getClickableCandidates();
    buttons.forEach(btn => {
      /* 5.4.102-fix — PING-PONG INFINITO DE ZOOM (renderer trava):
         os botões [data-bx-read] da Bíblia X são mantidos pelo controlador
         V8.15 (app-381), que grava o rótulo a partir do Store bibleXZoom.
         Se este módulo também grava o rótulo com o valor próprio
         (logosx:ui:readingZoomPercent), cada gravação vira uma mutação
         childList que dispara o MutationObserver do outro → guerra de
         escritas interminável (110% ↔ 100%) → thread do renderer congela.
         Correção: DELEGA esses botões ao V8.15 (não toca, não reescreve). */
      if(btn.hasAttribute?.("data-bx-read")) return;
      const t = lowerText(btn);
      if(isZoomResetText(t) || /^\d{2,3}%$/.test(textOf(btn))){
        if(isToolbarContext(btn)){
          btn.setAttribute("data-logos-zoom-reset", "true");
          const icon = btn.querySelector("svg,img,i");
          const label = `${z}%`;
          if(btn.childNodes.length === 1 || !icon){
            // Guarda anti-loop (hotfix v5.4.3.4-fix): reescrever textContent
            // dispara o MutationObserver deste próprio script e vira loop infinito
            // quando o botão já mostra "N%" (ex.: o "100%" da Bíblia X). Só grava se mudou.
            if(btn.textContent !== label) btn.textContent = label;
          } else {
            btn.setAttribute("aria-label", `Zoom ${z}%`);
            btn.title = `Zoom ${z}%`;
          }
        }
      }
    });
  }
  function getClickableCandidates(){
    try { return Array.from(document.querySelectorAll("button,a,[role='button'],.btn,.pill,.chip")); } catch(_) { return []; }
  }
  function isZoomMinusText(t){ return t === "a-" || t === "a−" || t === "a –" || t.includes("zoom -") || t.includes("diminuir fonte") || t.includes("fonte menor"); }
  function isZoomPlusText(t){ return t === "a+" || t.includes("zoom +") || t.includes("a +") || t.includes("aumentar fonte") || t.includes("fonte maior"); }
  function isZoomResetText(t){ return t === "100%" || t.includes("zoom 100") || t.includes("restaurar zoom") || t.includes("tamanho normal"); }
  function isFullscreenText(t){ return t.includes("tela cheia") || t.includes("fullscreen") || t.includes("full screen"); }
  function isExitText(t){ return t === "sair" || t === "x sair" || t.includes("sair da tela cheia") || t.includes("fechar tela cheia"); }

  function isToolbarContext(el){
    let node = el;
    for(let i=0; node && i<5; i++, node=node.parentElement){
      const tx = lowerText(node);
      if(tx.includes("tela cheia") || tx.includes("a-") || tx.includes("a+") || tx.includes("100%") || tx.includes("leitura")) return true;
      if(node.matches && (node.matches(".toolbar,.reader-toolbar,.reading-toolbar,.controls,.actions,.top-actions,.quick-actions") || node.getAttribute("role") === "toolbar")) return true;
    }
    return false;
  }

  function findFullscreenTarget(fromEl){
    const preferred = ["#workspace", ".workspace", "main", ".app-main", ".page", ".view", "body"];
    let node = fromEl;
    for(let i=0; node && i<8; i++, node=node.parentElement){
      if(node.matches && node.matches(".reading-shell,.reader-shell,.studio-shell,.bible-shell,.content-shell,.workspace,#workspace,main")) return node;
    }
    for(const sel of preferred){
      const el = document.querySelector(sel);
      if(el) return el;
    }
    return document.documentElement;
  }
  async function enterFullscreen(fromEl){
    const target = findFullscreenTarget(fromEl);
    try {
      /* 5.4.163 — no celular evita o Fullscreen API nativo (mensagem do Chrome/Android);
         a classe .logosx-immersive-mode aplicada abaixo ja cobre a tela. */
      if(!document.fullscreenElement && target.requestFullscreen && !(window.matchMedia && window.matchMedia("(max-width:760px)").matches)){
        await target.requestFullscreen();
      }
    } catch(_) {}
    document.body.classList.add("logosx-immersive-mode");
    showToast("Tela cheia ativada — pressione Esc ou clique em Sair");
  }
  async function exitFullscreen(){
    try { if(document.fullscreenElement && document.exitFullscreen) await document.exitFullscreen(); } catch(_) {}
    document.body.classList.remove("logosx-immersive-mode");
    showToast("Tela cheia encerrada");
  }

  let toastTimer = null;
  function showToast(msg){
    let box = document.getElementById("logosUiControls5434Toast");
    if(!box){
      box = document.createElement("div");
      box.id = "logosUiControls5434Toast";
      box.className = "logos-ui-fullscreen-toast";
      document.body.appendChild(box);
    }
    box.textContent = msg;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(()=>{ try{ box.remove(); }catch(_){} }, 2200);
  }

  function handleClick(ev){
    const el = ev.target && ev.target.closest ? ev.target.closest("button,a,[role='button'],.btn,.pill,.chip") : null;
    if(!el) return;
    /* 5.4.102-fix — botões [data-bx-read] da Bíblia X pertencem ao V8.15.
       Não interceptar: evita aplicar zoom DUPLO (V8.15 + este módulo) e
       evita divergir os valores que alimentam o ping-pong de observers. */
    if(el.hasAttribute?.("data-bx-read")) return;
    const t = lowerText(el);
    if(!isToolbarContext(el)) return;

    if(isZoomMinusText(t)){
      ev.preventDefault(); ev.stopPropagation();
      applyZoom(readZoom() - STEP);
      return;
    }
    if(isZoomPlusText(t)){
      ev.preventDefault(); ev.stopPropagation();
      applyZoom(readZoom() + STEP);
      return;
    }
    if(isZoomResetText(t) || el.getAttribute("data-logos-zoom-reset") === "true"){
      ev.preventDefault(); ev.stopPropagation();
      applyZoom(100);
      return;
    }
    if(isFullscreenText(t)){
      ev.preventDefault(); ev.stopPropagation();
      enterFullscreen(el);
      return;
    }
    if(isExitText(t)){
      // Só intercepta Sair quando o botão estiver no mesmo contexto de leitura/tela cheia.
      ev.preventDefault(); ev.stopPropagation();
      exitFullscreen();
      return;
    }
  }

  function handleKeys(ev){
    if(ev.ctrlKey && (ev.key === "+" || ev.key === "=")){
      ev.preventDefault(); applyZoom(readZoom() + STEP);
    } else if(ev.ctrlKey && ev.key === "-"){
      ev.preventDefault(); applyZoom(readZoom() - STEP);
    } else if(ev.ctrlKey && ev.key === "0"){
      ev.preventDefault(); applyZoom(100);
    } else if(ev.key === "Escape"){
      document.body.classList.remove("logosx-immersive-mode");
    }
  }

  function boot(){
    installStyles();
    document.body.classList.add("logosx-ui-controls-ready");
    applyZoom(readZoom());
    document.addEventListener("click", handleClick, true);
    document.addEventListener("keydown", handleKeys, true);
    document.addEventListener("fullscreenchange", () => {
      if(!document.fullscreenElement) document.body.classList.remove("logosx-immersive-mode");
    });
    const mo = new MutationObserver(() => { markReadableAreas(); updateZoomButtons(readZoom()); });
    mo.observe(document.documentElement, {childList:true, subtree:true});
    console.log(`[LOGOS] UI Controls Zoom/Fullscreen Hotfix ${VERSION} ativo`);
  }

  if(document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();
