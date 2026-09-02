/* LOGOS MASTER X — HOTFIX v5.4.3.3
   Áudio X -> Studio X Bridge Loader
   Patch modular: não altera Atlas, Bíblia X, Raio X ou pipeline de upload. */
(function(){
  if(window.__LOGOS_AUDIOX_STUDIO_BRIDGE_V5433__) return;
  window.__LOGOS_AUDIOX_STUDIO_BRIDGE_V5433__ = true;

  const PREFIX = "logosx:";
  const APPLIED_KEYS = [
    "logosMasterX.studioX.appliedDNAK7",
    "logosMasterX.studioX.dnaK7Profile",
    "logosMasterX.studioX.dnaK7ProfileId"
  ];

  function safeJson(raw){
    try { return raw ? JSON.parse(raw) : null; } catch(_) { return null; }
  }
  function setStore(key, value){
    try { localStorage.setItem(PREFIX + key, JSON.stringify(value)); } catch(_) {}
  }
  function getStore(key, fallback){
    try {
      const raw = localStorage.getItem(PREFIX + key);
      return raw == null ? fallback : JSON.parse(raw);
    } catch(_) { return fallback; }
  }
  function clamp(n, min=0, max=100, fallback=50){
    n = Number(n);
    if(!Number.isFinite(n)) return fallback;
    return Math.max(min, Math.min(max, Math.round(n)));
  }
  function firstNumber(obj, names, fallback){
    for(const name of names){
      if(obj && obj[name] != null) return clamp(obj[name], 0, 100, fallback);
    }
    return fallback;
  }
  function mergePayload(base, extra){
    if(!base) return extra || null;
    if(!extra) return base;
    return Object.assign({}, base, extra, {
      config: Object.assign({}, base.config || {}, extra.config || {}),
      prompt_block: extra.prompt_block || base.prompt_block,
      promptBlock: extra.promptBlock || base.promptBlock
    });
  }
  function readStoredPayload(frameWin){
    let found = null;
    const stores = [];
    try { stores.push(window.sessionStorage); } catch(_) {}
    try { stores.push(window.localStorage); } catch(_) {}
    if(frameWin){
      try { stores.push(frameWin.sessionStorage); } catch(_) {}
      try { stores.push(frameWin.localStorage); } catch(_) {}
    }
    for(const st of stores){
      for(const key of APPLIED_KEYS){
        try {
          const raw = st.getItem(key);
          const val = safeJson(raw);
          if(val && typeof val === "object") found = mergePayload(found, val);
        } catch(_) {}
      }
    }
    return found;
  }
  function getConfig(payload){
    payload = payload || {};
    return payload.config || payload.studio_x_config || payload.studioXConfig || payload.dna_k7 || payload.dnaK7 || payload || {};
  }
  function getControls(payload){
    const cfg = getConfig(payload);
    return cfg.controls || cfg.eixos || cfg.axes || payload.controls || payload.eixos || payload.axes || {};
  }
  function getTitle(payload){
    const cfg = getConfig(payload);
    return cfg.profile_name || cfg.profileName || cfg.name || cfg.title || payload.profile_name || payload.dna_profile || payload.name || payload.title || "Perfil DNA K7 do Áudio X";
  }
  function getScore(payload){
    const cfg = getConfig(payload);
    return payload.dna_score ?? payload.dnaScore ?? cfg.dna_score ?? cfg.dnaScore ?? cfg.score ?? payload.score ?? null;
  }
  function buildCharacteristics(payload){
    const c = getControls(payload);
    const biblical = firstNumber(c, ["biblical_density","biblicalDensity","densidade_biblica","densidadeBiblica","densidade bíblica","Densidade bíblica"], 70);
    const context = firstNumber(c, ["context","contexto","Contexto"], 65);
    const structure = firstNumber(c, ["structure","estrutura","Estrutura"], 75);
    const application = firstNumber(c, ["application","aplicacao","aplicação","Aplicação"], 70);
    const progression = firstNumber(c, ["progression","progressao","progressão","Progressão"], 70);
    const climax = firstNumber(c, ["climax","clímax","Clímax"], 70);
    const appeal = firstNumber(c, ["appeal","apelo","Apelo"], 65);
    return {
      fidelidade: biblical,
      exposicao: clamp(Math.round((biblical + context + structure) / 3), 0, 100, 70),
      aplicacao: application,
      progressao: progression,
      climax: climax,
      apelo: appeal
    };
  }
  function buildNotes(payload){
    const c = getControls(payload);
    const score = getScore(payload);
    const title = getTitle(payload);
    const prompt = payload?.prompt_block || payload?.promptBlock || getConfig(payload)?.prompt_block || getConfig(payload)?.promptBlock || "";
    const axes = Object.entries(c || {}).map(([k,v]) => `- ${k}: ${v}`).join("\n");
    return [
      "Origem: Áudio X → DNA K7 → Studio X",
      `Perfil extraído: ${title}`,
      score != null ? `DNA Score: ${score}%` : "",
      axes ? `Eixos detectados:\n${axes}` : "",
      prompt ? `Bloco estrutural do Áudio X:\n${prompt}` : "",
      "Orientação: usar este perfil como estrutura de ritmo, progressão, clímax, aplicação e expressividade; não copiar texto nem voz do áudio original."
    ].filter(Boolean).join("\n\n");
  }
  function applyToStudio(payload){
    payload = payload || readStoredPayload();
    if(!payload || typeof payload !== "object") throw new Error("Nenhum perfil DNA K7 do Áudio X encontrado para enviar ao Studio X.");

    const title = getTitle(payload);
    const score = getScore(payload);
    const chars = buildCharacteristics(payload);
    const intensityRaw = firstNumber(getControls(payload), ["intensity","intensidade","Intensidade"], 60);
    const studioIntensity = Math.max(1, Math.min(5, Math.round(intensityRaw / 20) || 3));
    const existing = getStore("studioMessageConfig", {}) || {};
    const notes = buildNotes(payload);

    const cfg = Object.assign({}, existing, {
      sourceMode: "tema",
      text: title,
      theme: title,
      sermonType: existing.sermonType || "Expositiva",
      duration: Number(existing.duration || 40),
      occasion: "Áudio X / DNA K7",
      audience: existing.audience || "Igreja local",
      objective: existing.objective || "Transformar o perfil DNA K7 extraído do áudio em uma mensagem bíblica estruturada.",
      bibleVersion: existing.bibleVersion || "ARA",
      points: existing.points || "4",
      focus: "DNA K7 do Áudio X",
      notes
    });

    setStore("audioXLastStudioPayload", payload);
    setStore("studioDNASelection", ["k7"]);
    setStore("studioDNAWeights", {k7: 100});
    setStore("studioDNACharacteristics", chars);
    setStore("studioDNAIntensity", studioIntensity);
    setStore("studioMessageConfig", cfg);
    setStore("studioPrefill", [title, notes].filter(Boolean).join("\n\n"));
    setStore("studioGenerationRequest", {});
    setStore("studioProcessing", {status:"idle", progress:0, phase:0, message:"Pronto para gerar com DNA K7 do Áudio X.", started:null, finished:null, engine:"", provider:"", model:"", quality:null, error:""});
    setStore("studioStep", 3);

    try { sessionStorage.setItem("logosMasterX.studioX.appliedDNAK7", JSON.stringify(payload)); } catch(_) {}
    return {title, score, chars, studioIntensity, cfg};
  }
  function navigateToStudio(){
    let done = false;
    try {
      if(typeof window.navigateView === "function") { window.navigateView("studio"); done = true; }
    } catch(_) {}
    if(!done){
      try { document.querySelector('[data-go="studio"]')?.click(); done = true; } catch(_) {}
    }
    setTimeout(showStudioNotice, 450);
  }
  function showStudioNotice(){
    const ws = document.getElementById("workspace") || document.body;
    if(document.getElementById("audioXStudioNotice5433")) return;
    const box = document.createElement("div");
    box.id = "audioXStudioNotice5433";
    box.style.cssText = "position:fixed;right:24px;bottom:24px;z-index:99999;max-width:390px;background:linear-gradient(135deg,#102033,#07131d);border:1px solid rgba(240,198,97,.55);box-shadow:0 18px 60px rgba(0,0,0,.45);color:#eef6ff;border-radius:16px;padding:14px 16px;font:600 14px/1.45 system-ui,Segoe UI,sans-serif";
    box.innerHTML = "<b style='color:#f0c861'>✓ DNA do Áudio X carregado no Studio X</b><br><span style='color:#b8ccdd;font-weight:500'>Confira a Etapa 3. O perfil foi aplicado aos parâmetros e notas da mensagem.</span>";
    document.body.appendChild(box);
    setTimeout(()=>{ try{ box.remove(); }catch(_){} }, 6500);
  }
  async function fetchProfilePayload(profileId){
    if(!profileId) return null;
    try {
      const r = await fetch("/api/audio-x/studio-x/apply", {
        method: "POST",
        headers: {"Content-Type":"application/json"},
        body: JSON.stringify({profile_id: profileId, strength: 100})
      });
      if(!r.ok) return null;
      return await r.json();
    } catch(_) { return null; }
  }
  async function openFromAudioX(detail, sourceWin){
    detail = detail || {};
    let payload = mergePayload(readStoredPayload(sourceWin), detail);
    const profileId = detail.profile_id || detail.profileId || payload?.profile_id || payload?.profileId;
    if((!payload || !getConfig(payload).controls) && profileId){
      payload = mergePayload(payload, await fetchProfilePayload(profileId));
    }
    const applied = applyToStudio(payload);
    navigateToStudio();
    return applied;
  }

  window.LogosAudioXStudioBridgeHotfix = {open: openFromAudioX, applyToStudio, readStoredPayload};

  window.addEventListener("message", function(ev){
    const d = ev.data || {};
    if(!d || typeof d !== "object") return;
    if(d.type === "logosmasterx:open-studio-x" || d.type === "audioxcloud:open-studio-x" || d.type === "audiox:studio-x"){
      openFromAudioX(d, ev.source).catch(err => {
        console.error("[Áudio X → Studio X]", err);
        alert("Falha ao carregar no Studio X: " + (err && err.message ? err.message : err));
      });
    }
  });

  function enhanceAudioFrames(){
    document.querySelectorAll('iframe[src*="/static/audio_x/"]').forEach(frame => {
      if(frame.__audioXStudioBridge5433) return;
      frame.__audioXStudioBridge5433 = true;
      frame.addEventListener("load", () => {
        try {
          const doc = frame.contentDocument;
          if(!doc) return;
          const bind = () => {
            const btn = doc.getElementById("openStudio") || doc.getElementById("studio") || doc.querySelector("button.studio");
            if(btn && !btn.__audioXStudioBridge5433){
              btn.__audioXStudioBridge5433 = true;
              btn.addEventListener("click", () => {
                setTimeout(() => openFromAudioX({}, frame.contentWindow).catch(console.error), 60);
              }, true);
            }
          };
          bind();
          new MutationObserver(bind).observe(doc.documentElement, {childList:true, subtree:true});
        } catch(_) {}
      });
    });
  }
  const obs = new MutationObserver(enhanceAudioFrames);
  if(document.readyState === "loading") document.addEventListener("DOMContentLoaded", () => { enhanceAudioFrames(); obs.observe(document.documentElement,{childList:true,subtree:true}); });
  else { enhanceAudioFrames(); obs.observe(document.documentElement,{childList:true,subtree:true}); }
})();
