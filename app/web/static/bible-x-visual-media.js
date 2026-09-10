(function () {
  "use strict";

  const VERSION = "5.4.244";
  const $ = (selector, root = document) => root.querySelector(selector);
  const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
  const isRemote = value => /^https?:\/\//i.test(String(value || ""));

  function normalizeItem(item = {}) {
    return {
      ...item,
      title: String(item.title || item.name || "Imagem"),
      src: String(item.src || item.original_url || item.sourceUrl || item.url || item.thumb_url || item.thumbUrl || ""),
      thumb: String(item.thumb || item.thumb_url || item.thumbUrl || item.src || item.original_url || item.sourceUrl || ""),
      credit: String(item.credit || item.credits || item.artist || item.source || ""),
      license: String(item.license || ""),
      pageUrl: String(item.pageUrl || item.page_url || ""),
      licenseUrl: String(item.licenseUrl || item.license_url || ""),
      description: String(item.description || ""),
    };
  }

  /* ---- 5.4.244 — ✏️ Editar no visualizador: helpers da store media ----
     (IndexedDB logosx-bible v15, store 'media' keyPath id). Abre a cada
     operacao como os modulos originais (evita trava de versao). ---- */
  function currentReaderReference(item) {
    const ctx = (window.BibleXImmersion && typeof window.BibleXImmersion.getContext === "function") ? (window.BibleXImmersion.getContext() || {}) : {};
    return String(item._reference || ctx.currentNarrativeRef || ctx.reference || "").trim();
  }
  function mediaStoreOpen() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open("logosx-bible", 15);
      request.onupgradeneeded = () => { if (!request.result.objectStoreNames.contains("media")) request.result.createObjectStore("media", { keyPath: "id" }); };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }
  async function mediaRowById(id) {
    if (!id) return null;
    const db = await mediaStoreOpen();
    return new Promise((resolve, reject) => {
      const request = db.transaction("media", "readonly").objectStore("media").get(id);
      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
    });
  }
  async function mediaRowPut(row) {
    const db = await mediaStoreOpen();
    return new Promise((resolve, reject) => {
      const tx = db.transaction("media", "readwrite");
      tx.objectStore("media").put(row);
      tx.oncomplete = () => resolve(true);
      tx.onerror = () => reject(tx.error);
    });
  }
  async function mediaRowDelete(id) {
    if (!id) return true;
    const db = await mediaStoreOpen();
    return new Promise((resolve, reject) => {
      const tx = db.transaction("media", "readwrite");
      tx.objectStore("media").delete(id);
      tx.oncomplete = () => resolve(true);
      tx.onerror = () => reject(tx.error);
    });
  }
  function mediaChanged() {
    document.dispatchEvent(new CustomEvent("biblex:media-changed", { detail: { source: "editor" } }));
  }

  function button(label, action, title) {
    const node = document.createElement("button");
    node.type = "button";
    node.dataset.bxvmAction = action;
    node.textContent = label;
    node.title = title || label;
    node.setAttribute("aria-label", title || label);
    return node;
  }

  function externalLink(label, href) {
    if (!href) return null;
    const link = document.createElement("a");
    link.href = href;
    link.target = "_blank";
    link.rel = "noopener";
    link.textContent = label;
    return link;
  }

  function publicSourceUrl(provider, kind, query) {
    const q = encodeURIComponent(String(query || "").replace(/\s+/g, " ").trim());
    if (!q) return "";
    if (provider === "pexels") {
      return `https://www.pexels.com/pt-br/procurar/${kind === "video" ? "videos/" : ""}?q=${q}`;
    }
    return `https://commons.wikimedia.org/w/index.php?search=${q}&title=Special%3AMediaSearch&type=${kind === "video" ? "video" : "image"}`;
  }

  function sourceAction(label, action, title) {
    const node = document.createElement("button");
    node.type = "button";
    node.className = "bxvm-public-source-link";
    node.dataset.bxvmSourceAction = action;
    node.textContent = label;
    node.title = title || label;
    return node;
  }

  function currentWorldContext(query = "") {
    const context = window.BibleXImmersion?.getContext?.() || {};
    const scene = context.scene || {};
    const place = scene.place || {};
    const lat = Number(place.lat ?? scene.lat ?? context.lat);
    const lng = Number(place.lng ?? scene.lng ?? context.lng);
    return {
      label: String(place.name || scene.title || context.currentNarrativeRef || query || "Lugar bíblico").trim(),
      query: String(query || place.query || scene.mediaQuery || scene.panoramaQuery || place.name || scene.title || "").trim(),
      lat: Number.isFinite(lat) ? lat : null,
      lng: Number.isFinite(lng) ? lng : null,
      reference: String(context.currentNarrativeRef || context.reference || "").trim(),
      currentNarrativeRef: String(context.currentNarrativeRef || context.reference || "").trim(),
      scene,
      event: context.event || {},
    };
  }

  function runInternalMediaSearch(kind, query, provider = "all") {
    const input = $("#bxMediaPublicQuery");
    if (!input) return false;
    const value = String(query || input.value || "").trim();
    if (!value) return false;
    input.value = value;
    input.dataset.bxImmersionQuery = value;
    input.dispatchEvent(new Event("input", { bubbles: true }));
    input.dataset.bxMediaProvider = provider;
    const button = kind === "panorama" ? $("#bxMediaPublic360") : $("#bxMediaPublicFind");
    if (button) {
      button.click();
      input.scrollIntoView?.({ behavior: "smooth", block: "center" });
      return true;
    }
    return false;
  }

  let aiMediaLoader = null;
  function openAiMedia(context = {}) {
    if (window.BibleXAIMedia?.open) {
      window.BibleXAIMedia.open(context);
      return true;
    }
    if (!aiMediaLoader) {
      aiMediaLoader = new Promise((resolve, reject) => {
        const script = document.createElement("script");
        script.src = "/static/bible-x-ai-media.js?v=5.4.247";
        script.dataset.bxAiMedia = "1";
        script.onload = () => window.BibleXAIMedia?.open ? resolve(window.BibleXAIMedia) : reject(new Error("O Gerador de IA não ficou disponível."));
        script.onerror = () => reject(new Error("Não foi possível carregar o Gerador de IA."));
        document.head.appendChild(script);
      }).catch(error => { aiMediaLoader = null; throw error; });
    }
    aiMediaLoader.then(api => api.open(context)).catch(error => window.alert(error.message));
    return true;
  }

  function mountPublicSourceHub() {
    const grid = $("#bxMediaPublicGrid");
    const discovery = grid?.closest(".bx-media-discovery");
    if (!grid || !discovery) return null;
    const legacyEmpty = grid.querySelector(".bx-media-public-empty");
    if (legacyEmpty && /Abra uma passagem|ðŸ|\uFFFD/.test(legacyEmpty.textContent || "")) legacyEmpty.remove();
    let hub = $("[data-bxvm-source-hub]", discovery);
    if (!hub) {
      hub = document.createElement("section");
      hub.className = "bxvm-public-source-hub";
      hub.dataset.bxvmSourceHub = "1";
      grid.before(hub);
    }
    const input = $("#bxMediaPublicQuery");
    const query = String(input?.value || "").replace(/\s+/g, " ").trim().slice(0, 120);
    if (hub.dataset.bxvmQuery === query && hub.childNodes.length) {
      hub.hidden = !query;
      return hub;
    }
    hub.dataset.bxvmQuery = query;
    hub.replaceChildren();
    const copy = document.createElement("div");
    copy.className = "bxvm-public-source-copy";
    const label = document.createElement("span");
    label.textContent = "FONTES PÚBLICAS COMPLEMENTARES";
    const title = document.createElement("strong");
    title.textContent = query ? `Continue pesquisando “${query}” em outras bibliotecas` : "Pesquise o tema da passagem em outras bibliotecas";
    const note = document.createElement("small");
    note.textContent = "Wikimedia e Pexels entram na galeria quando disponíveis; crédito e licença permanecem visíveis em cada arquivo.";
    copy.append(label, title, note);
    const nav = document.createElement("nav");
    nav.className = "bxvm-public-source-links";
    nav.appendChild(sourceAction("Wikimedia • imagens aqui", "commons-image", "Pesquisar Wikimedia dentro da Mídia X"));
    nav.appendChild(sourceAction("Wikimedia • 360° aqui", "commons-panorama", "Pesquisar panoramas dentro da Mídia X"));
    nav.appendChild(sourceAction("Pexels • fotos aqui", "pexels-image", "Pesquisar fotos do Pexels dentro da Mídia X (requer PEXELS_API_KEY)"));
    nav.appendChild(sourceAction("✨ Gerador de IA · Imagens e Vídeos", "ai", "Gerar imagem ou vídeo para esta passagem"));
    [
      ["Pexels • vídeos ↗", publicSourceUrl("pexels", "video", query)]
    ].forEach(([text, href]) => {
      const link = externalLink(text, href || "#");
      link.className = "bxvm-public-source-link";
      if (!href) {
        link.setAttribute("aria-disabled", "true");
        link.addEventListener("click", event => event.preventDefault());
      }
      nav.appendChild(link);
    });
    nav.appendChild(sourceAction("🌍 Mundo atual / Mapbox", "world", "Abrir Google Earth, Street View e Mapbox"));
    const licenses = document.createElement("div");
    licenses.className = "bxvm-public-source-licenses";
    const pexelsLicense = externalLink("Licença Pexels ↗", "https://www.pexels.com/pt-br/licenca/");
    const commonsLicense = externalLink("Política do Commons ↗", "https://commons.wikimedia.org/wiki/Main_Page");
    if (pexelsLicense) licenses.appendChild(pexelsLicense);
    if (commonsLicense) licenses.appendChild(commonsLicense);
    hub.append(copy, nav, licenses);
    nav.addEventListener("click", event => {
      const action = event.target.closest("[data-bxvm-source-action]")?.dataset.bxvmSourceAction;
      if (!action) return;
      event.preventDefault();
      if (action === "commons-image") runInternalMediaSearch("image", query, "commons");
      else if (action === "commons-panorama") runInternalMediaSearch("panorama", query, "commons");
      else if (action === "pexels-image") runInternalMediaSearch("image", query, "pexels");
      else if (action === "world") window.BibleXVisualMedia?.openWorldExplorer?.(currentWorldContext(query));
      else if (action === "ai") openAiMedia(currentWorldContext(query));
    });
    hub.hidden = !query;
    if (input && !input.dataset.bxvmSourceBound) {
      input.dataset.bxvmSourceBound = "1";
      input.addEventListener("input", () => {
        // A manually typed query returns to the combined catalog. Source
        // buttons set the provider immediately after this event is dispatched.
        input.dataset.bxMediaProvider = "all";
        mountPublicSourceHub();
      });
    }
    return hub;
  }

  function initPublicSourceHub() {
    const mount = () => mountPublicSourceHub();
    mount();
    document.addEventListener("input", event => {
      if (event.target?.id === "bxMediaPublicQuery") mount();
    });
    window.addEventListener("biblex:media-context", mount);
    const observer = new MutationObserver(mount);
    observer.observe(document.body, { childList: true, subtree: true });
  }

  function requestFullScreen(node) {
    if (document.fullscreenElement) return document.exitFullscreen?.();
    return node.requestFullscreen?.();
  }

  function openImmersionFromVisual(item = {}) {
    const api = window.BibleXImmersion;
    if (!api || typeof api.open !== "function") return false;
    const context = typeof api.getContext === "function" ? (api.getContext() || {}) : {};
    const input = document.querySelector("#bRef, input[name='reference'], [data-bible-reference]");
    const reference = String(
      item.reference ||
      context.currentNarrativeRef ||
      context.reference ||
      input?.value ||
      "Passagem selecionada"
    ).trim();
    const text = String(item.verseText || context.verseText || "").trim();
    const fullscreenTrigger = { matches: selector => /data-bx-immersion/.test(String(selector || "")) };
    api.open(reference, text, fullscreenTrigger);
    return true;
  }

  function shell(kind, eyebrow) {
    const overlay = document.createElement("div");
    overlay.className = `bxvm-overlay bxvm-${kind}`;
    overlay.setAttribute("role", "dialog");
    overlay.setAttribute("aria-modal", "true");
    overlay.innerHTML = `
      <div class="bxvm-dialog">
        <header class="bxvm-header">
          <div class="bxvm-heading"><small></small><h2></h2></div>
          <nav class="bxvm-tools" aria-label="Controles de visualização"></nav>
        </header>
        <main class="bxvm-stage"></main>
        <footer class="bxvm-footer"><div class="bxvm-caption"></div><nav class="bxvm-links"></nav></footer>
      </div>`;
    $(".bxvm-heading small", overlay).textContent = eyebrow;
    document.body.appendChild(overlay);
    document.body.classList.add("bxvm-lock");
    return overlay;
  }

  function openGallery(rawItems, startIndex = 0, options = {}) {
    const items = (Array.isArray(rawItems) ? rawItems : [rawItems]).map(normalizeItem).filter(item => item.src);
    if (!items.length) return null;
    let index = clamp(Number(startIndex) || 0, 0, items.length - 1);
    let scale = 1;
    let offsetX = 0;
    let offsetY = 0;
    let angle = 0;          /* 5.4.244 — rotação da imagem (0/90/180/270) */
    let orientK = 1;        /* fator de ajuste p/ a imagem rotacionada caber */
    let laidW = 0, laidH = 0;
    let slideTimer = 0;
    let dragging = false;
    let dragStart = null;
    let swipeStart = null;
    const overlay = shell("gallery", options.eyebrow || "MÍDIA X • GALERIA VISUAL");
    const dialog = $(".bxvm-dialog", overlay);
    const stage = $(".bxvm-stage", overlay);
    const tools = $(".bxvm-tools", overlay);
    const heading = $(".bxvm-heading h2", overlay);
    const caption = $(".bxvm-caption", overlay);
    const links = $(".bxvm-links", overlay);
    const viewport = document.createElement("div");
    viewport.className = "bxvm-image-viewport";
    const image = document.createElement("img");
    image.className = "bxvm-image";
    image.draggable = false;
    const loading = document.createElement("div");
    loading.className = "bxvm-loading";
    loading.textContent = "Carregando imagem...";
    viewport.append(image, loading);
    const previous = button("‹", "previous", "Imagem anterior");
    previous.className = "bxvm-nav bxvm-previous";
    const next = button("›", "next", "Próxima imagem");
    next.className = "bxvm-nav bxvm-next";
    stage.append(previous, viewport, next);
    [
      button("🕶 História", "immersion", "Entrar na história"),
      button("−", "zoom-out", "Diminuir zoom"),
      button("+", "zoom-in", "Aumentar zoom"),
      button("Ajustar", "fit", "Ajustar à tela"),
      button("↻ 90°", "rotate", "Girar imagem 90°"),
      button("🗺 Google", "google", "Ver no Google: mapa, satélite e Street View"),
      button("▶", "play", "Iniciar apresentação"),
      button("✏️", "edit", "Editar imagem"),
      button("🏷", "legend", "Legenda da imagem (texto do app)"),
      button("⬇", "download", "Baixar esta imagem"),
      button("⛶", "fullscreen", "Tela cheia"),
      /* ---- 5.4.249 — AS OPÇÕES DE VER NO GOOGLE, logo depois da tela cheia.
         Uma por botão, para não esconder nada atrás de menu: a RUA (é onde se
         ANDA — arraste para olhar, setas brancas no chão para caminhar), o
         SATÉLITE e o MAPA. O ⛶ de dentro do painel põe o Google em tela cheia,
         que é como as setas ficam grandes no celular. */
      button("🚶", "google-rua", "Ver da RUA (Street View) — arraste para olhar em volta e toque nas setas brancas do chão para ANDAR"),
      button("🛰", "google-sat", "Ver do SATÉLITE"),
      button("🌍", "google-mapa", "Ver no MAPA"),
      button("🧍", "google-fora", "Abrir o Google Maps inteiro (com o bonequinho para arrastar até a rua), em outra aba"),
      button("×", "close", "Fechar"),
    ].forEach(node => tools.appendChild(node));
    /* ---- 5.4.244 — ✏️ Editar no visualizador -------------------------------
       Painel flutuante com Recortar / Salvar / Copiar / Excluir + modo recorte.
       Só opera em imagens LOCAIS (id presente na store media); o lápis fica
       oculto quando o item não é editável (ex.: fonte pública da web). ----- */
    let cropActive = false;
    let cropFrom = null;
    let cropBox = null;
    const editorUrls = [];
    const isEditableItem = item => Boolean(item && !/^video/i.test(String(item.type || "")) && String(item._dbId || item.id || item.key || "").trim());
    const editToast = text => {
      const old = $(".bxvm-toast", overlay); if (old) old.remove();
      const t = document.createElement("div");
      t.className = "bxvm-toast";
      t.textContent = text;
      overlay.appendChild(t);
      setTimeout(() => t.remove(), 2600);
    };
    const editPanel = document.createElement("div");
    editPanel.className = "bxvm-edit-panel";
    editPanel.hidden = true;
    editPanel.innerHTML =
      '<div class="bxvm-edit-head"><b>✏️ Editar</b><small>Imagem da Mídia X</small><button type="button" class="bxvm-edit-x" data-bxvm-edit-close="1" aria-label="Fechar">×</button></div>' +
      '<div class="bxvm-edit-body" data-bxvm-edit-view="main">' +
      '<button type="button" data-bxvm-edit="crop">✂️ Recortar</button>' +
      '<button type="button" data-bxvm-edit="save">💾 Salvar</button>' +
      '<button type="button" data-bxvm-edit="copy">⧉ Copiar</button>' +
      '<button type="button" class="bxvm-edit-danger" data-bxvm-edit="delete">🗑 Excluir</button>' +
      '</div>' +
      '<div class="bxvm-edit-body" data-bxvm-edit-view="savedest" hidden>' +
      '<b class="bxvm-edit-q">Salvar imagem em:</b>' +
      '<button type="button" data-bxvm-edit="saveBible">📖 Na Bíblia</button>' +
      '<button type="button" data-bxvm-edit="saveDisk">💾 No dispositivo</button>' +
      '<button type="button" data-bxvm-edit="saveBoth">📖💾 Ambos</button>' +
      '<button type="button" class="bxvm-edit-back" data-bxvm-edit="back">↩ Voltar</button>' +
      '</div>' +
      '<div class="bxvm-edit-body" data-bxvm-edit-view="del" hidden>' +
      '<b class="bxvm-edit-q">Excluir esta imagem da Bíblia?</b>' +
      '<button type="button" class="bxvm-edit-danger" data-bxvm-edit="delYes">Sim, excluir</button>' +
      '<button type="button" class="bxvm-edit-back" data-bxvm-edit="back">Cancelar</button>' +
      '</div>';
    stage.appendChild(editPanel);
    const showEditView = name => {
      [...editPanel.querySelectorAll("[data-bxvm-edit-view]")].forEach(node => { node.hidden = node.dataset.bxvmEditView !== name; });
    };
    const closeEditPanel = () => { if (editPanel) editPanel.hidden = true; };
    const toggleEditPanel = () => { if (cropActive) return; editPanel.hidden = !editPanel.hidden; };
    editPanel.addEventListener("click", event => {
      if (event.target.closest("[data-bxvm-edit-close]")) { closeEditPanel(); return; }
      const btn = event.target.closest("[data-bxvm-edit]");
      if (!btn) return;
      event.preventDefault(); event.stopPropagation();
      const act = btn.dataset.bxvmEdit;
      if (act === "back") showEditView("main");
      else if (act === "crop") { closeEditPanel(); startCrop(); }
      else if (act === "copy") copyCurrent();
      else if (act === "delete") showEditView("del");
      else if (act === "delYes") removeCurrent();
      else if (act === "save") showEditView("savedest");
      else if (act === "saveBible") saveCurrent("bible");
      else if (act === "saveDisk") saveCurrent("disk");
      else if (act === "saveBoth") saveCurrent("both");
    });
    /* ---- Legenda de reconstrução visual (camada do app) --------------------
       Placa "impressa" sobre a imagem + painel de 3 blocos (Geografia / Cultura
       / Curiosidade). A imagem gerada continua limpa: o texto é desenhado pelo
       app. A IA preenche sozinha (uma chamada leve de texto) e o usuário pode
       revisar, refazer e aplicar. --------------------------------------------- */
    const legendKeys = [["geo", "Geografia"], ["cul", "Cultura"], ["cur", "Curiosidade"]];
    const legendTrim = value => String(value == null ? "" : value).replace(/\s+/g, " ").trim();
    const legendOf = item => {
      const raw = (item && item.legend) || {};
      return {
        geo: legendTrim(raw.geo),
        cul: legendTrim(raw.cul),
        cur: legendTrim(raw.cur),
        ref: legendTrim(item && (item.legendRef || item._reference || currentReaderReference(item)))
      };
    };
    const legendFilled = item => { const l = legendOf(item); return Boolean(l.geo || l.cul || l.cur); };
    const legendPlate = document.createElement("div");
    legendPlate.className = "bxvm-legend-plate";
    legendPlate.hidden = true;
    const legendHead = document.createElement("div");
    legendHead.className = "bxvm-legend-head";
    legendPlate.appendChild(legendHead);
    const legendBody = document.createElement("div");
    legendBody.className = "bxvm-legend-body";
    legendPlate.appendChild(legendBody);
    viewport.appendChild(legendPlate);
    const renderLegendPlate = () => {
      /* 5.4.245 — placa "LEGENDA DA IMAGEM" NÃO é mais desenhada sobre NENHUMA
         imagem. Pedido do usuário: remover o "retângulo oval" de todas as imagens
         e impedir que novas gerações recebam a marcação. A legenda continua
         editável/exportável pelo painel 🏷 (ver CSS: .bxvm-legend-plate {display:none}). */
      legendPlate.hidden = true;
    };
    const syncLegendPlateView = () => {
      if (!legendPlate || legendPlate.hidden) return;
      const away = Boolean(cropActive) || scale > 1.01 || (angle % 180) !== 0;
      legendPlate.classList.toggle("bxvm-legend-away", away);
    };
    const togglePlateCollapse = () => {
      legendPlate.classList.toggle("bxvm-legend-collapsed");
      const hint = legendPlate.querySelector(".bxvm-legend-hint");
      if (hint) hint.textContent = legendPlate.classList.contains("bxvm-legend-collapsed") ? "ver" : "ocultar";
    };
    legendPlate.addEventListener("click", event => {
      event.preventDefault(); event.stopPropagation();
      togglePlateCollapse();
    });
    legendPlate.addEventListener("pointerdown", event => event.stopPropagation());
    legendPlate.addEventListener("dblclick", event => event.stopPropagation());
    const legendPanel = document.createElement("div");
    legendPanel.className = "bxvm-legend-panel";
    legendPanel.hidden = true;
    legendPanel.innerHTML =
      '<div class="bxvm-legend-panel-head"><b>🏷 Legenda da imagem</b><small>texto do app — a imagem continua limpa</small>' +
      '<button type="button" class="bxvm-legend-panel-x" data-legend="close" aria-label="Fechar legenda">×</button></div>' +
      '<div class="bxvm-legend-panel-ref" data-legend-ref></div>' +
      '<div class="bxvm-legend-fields">' +
      legendKeys.map(([k, t]) => `<label class="bxvm-legend-field"><b>${t}</b><textarea rows="2" data-legend-field="${k}" placeholder="${t} da cena (1 a 2 frases)"></textarea></label>`).join("") +
      '</div>' +
      '<div class="bxvm-legend-actions">' +
      '<button type="button" class="bxvm-legend-btn" data-legend="gen">✨ Gerar com IA</button>' +
      '<button type="button" class="bxvm-legend-btn is-primary" data-legend="save">💾 Salvar legenda</button>' +
      '<button type="button" class="bxvm-legend-btn" data-legend="export">⬇ Salvar com legenda</button>' +
      '<button type="button" class="bxvm-legend-btn bxvm-legend-ghost" data-legend="close">Fechar</button>' +
      '</div>' +
      '<div class="bxvm-legend-status" data-legend-status hidden></div>';
    stage.appendChild(legendPanel);
    let legendRefValue = "";
    const legendInput = key => legendPanel.querySelector(`[data-legend-field="${key}"]`);
    const legendStatus = () => legendPanel.querySelector("[data-legend-status]");
    const setLegendStatus = (text, kind) => {
      const node = legendStatus();
      if (!node) return;
      node.hidden = !text;
      node.textContent = text || "";
      node.dataset.kind = kind || "ok";
    };
    const setLegendFields = item => {
      const l = legendOf(item);
      legendRefValue = l.ref;
      const refBox = legendPanel.querySelector("[data-legend-ref]");
      if (refBox) refBox.textContent = "Reconstrução visual · " + (legendRefValue || "passagem em estudo");
      legendKeys.forEach(([k]) => { const ta = legendInput(k); if (ta) ta.value = l[k]; });
      const gen = legendPanel.querySelector('[data-legend="gen"]');
      if (gen) gen.textContent = legendFilled(item) ? "↻ Refazer com IA" : "✨ Gerar com IA";
      setLegendStatus("");
    };
    const collectLegend = () => {
      const l = { geo: "", cul: "", cur: "" };
      legendKeys.forEach(([k]) => { const ta = legendInput(k); if (ta) l[k] = legendTrim(ta.value); });
      return { ...l, ref: legendRefValue };
    };
    const hasPanelLegend = () => { const l = collectLegend(); return Boolean(l.geo || l.cul || l.cur); };
    let legendBusy = false;
    const generateLegend = async (mode = "manual") => {
      if (legendBusy) return;
      const item = items[index] || {};
      const ctx = (window.BibleXImmersion && typeof window.BibleXImmersion.getContext === "function") ? (window.BibleXImmersion.getContext() || {}) : {};
      const scene = ctx.scene || {};
      const place = scene.place || {};
      const ref = legendTrim(item.legendRef || item._reference || item.reference || currentReaderReference(item) || ctx.currentNarrativeRef || ctx.reference);
      const body = { reference: ref || "passagem em estudo" };
      const verseText = legendTrim(item.verseText || ctx.verseText);
      if (verseText) body.verse_text = verseText.slice(0, 900);
      const placeName = legendTrim(place.name);
      const placeRegion = legendTrim(place.region);
      const location = [placeName, placeRegion].filter(Boolean).join(" • ");
      const sceneTitle = legendTrim(scene.title);
      if (location) body.place = location;
      if (sceneTitle) body.scene = sceneTitle;
      legendRefValue = ref;
      legendBusy = true;
      setLegendStatus(mode === "auto" ? "Escrevendo a legenda com IA…" : "Refazendo a legenda com IA…", "ok");
      try {
        const resp = await window.fetch("/api/bible/ai/legend", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
        if (!resp.ok) {
          let detail = "";
          try { detail = ((await resp.json()).detail || "").toString(); } catch (_) {}
          throw new Error(detail || ("HTTP " + resp.status));
        }
        const data = await resp.json();
        const lg = (data && data.legend) || {};
        legendKeys.forEach(([k]) => { const ta = legendInput(k); if (ta) ta.value = legendTrim(lg[k]); });
        if (!hasPanelLegend()) throw new Error("A IA não retornou blocos legíveis.");
        setLegendStatus("✔ Pronto — revise e salve com 💾.", "ok");
      } catch (error) {
        setLegendStatus("A geração automática falhou agora. Escreva os três campos ou tente de novo.", "err");
        editToast("Legenda IA indisponível no momento.");
      } finally {
        legendBusy = false;
      }
    };
    const openLegendPanel = item => {
      closeEditPanel();
      setLegendFields(item);
      legendPanel.hidden = false;
      if (!legendFilled(item)) generateLegend("auto");
    };
    const closeLegendPanel = () => { legendPanel.hidden = true; setLegendStatus(""); };
    const toggleLegendPanel = () => {
      if (cropActive) return;
      const item = items[index] || {};
      if (!isEditableItem(item)) { editToast("Salve a imagem na Bíblia primeiro para criar a legenda."); return; }
      if (!legendPanel.hidden) { closeLegendPanel(); return; }
      openLegendPanel(item);
    };
    const saveLegend = async () => {
      const item = items[index] || {};
      const id = String(item._dbId || item.id || item.key || "").trim();
      const l = collectLegend();
      if (!hasPanelLegend()) { setLegendStatus("Escreva ao menos um dos três campos antes de aplicar.", "warn"); return; }
      if (!id) { setLegendStatus("Esta imagem não está salva na Bíblia.", "warn"); return; }
      try {
        const row = (await mediaRowById(id)) || {};
        await mediaRowPut({ ...row, id, legend: { geo: l.geo, cul: l.cul, cur: l.cur }, legendRef: legendTrim(l.ref || row.reference || "") });
        items[index] = { ...item, legend: { geo: l.geo, cul: l.cul, cur: l.cur }, legendRef: legendTrim(l.ref || row.reference || "") };
        mediaChanged();
        closeLegendPanel();
        renderLegendPlate(items[index]);
        editToast("🏷 Legenda salva nesta mídia ✔");
      } catch (_) { setLegendStatus("Não foi possível salvar a legenda.", "err"); }
    };
    const exportLegend = () => {
      const l = collectLegend();
      if (!(l.geo || l.cul || l.cur)) { setLegendStatus("Escreva ou gere a legenda antes de salvar o arquivo.", "warn"); return; }
      if (!image.naturalWidth) { setLegendStatus("Aguarde a imagem carregar para exportar.", "warn"); return; }
      try {
        const w = image.naturalWidth;
        const h = image.naturalHeight;
        const canvas = document.createElement("canvas");
        const g2 = canvas.getContext("2d");
        const face = '"Segoe UI", system-ui, sans-serif';
        const kickerPx = Math.max(10, Math.round(w * 0.016));
        const titlePx = Math.max(13, Math.round(w * 0.026));
        const segPx = Math.max(11, Math.round(w * 0.02));
        const pad = Math.max(12, Math.round(w * 0.035));
        const wrap = (text, px, bold) => {
          g2.font = `800 ${px}px ${face}`;
          const maxW = w - pad * 2;
          const words = String(text).split(/\s+/).filter(Boolean);
          const lines = [];
          let line = "";
          words.forEach(word => {
            const test = line ? line + " " + word : word;
            if (g2.measureText(test).width > maxW && line) { lines.push(line); line = word; } else line = test;
          });
          if (line) lines.push(line);
          return lines;
        };
        const kickerLH = Math.round(kickerPx * 1.25);
        const titleLH = Math.round(titlePx * 1.28);
        const segLH = Math.round(segPx * 1.28);
        const bodyLH = Math.round(segPx * 1.38);
        const titleLines = wrap("Reconstrução visual · " + (l.ref || "passagem em estudo"), titlePx);
        const segs = legendKeys.map(([k, label]) => { const body = l[k]; return body ? { label, lines: wrap(body, segPx) } : null; }).filter(Boolean);
        const rule = Math.max(2, Math.round(w * 0.002));
        const bandH = pad + kickerLH + 4 + titleLines.length * titleLH + 10 + rule + 10 + segs.reduce((sum, s) => sum + segLH + 3 + s.lines.length * bodyLH + 8, 0) + pad;
        canvas.width = w;
        canvas.height = h + bandH;
        g2.fillStyle = "#f5eeda";
        g2.fillRect(0, h, w, bandH);
        g2.drawImage(image, 0, 0, w, h);
        g2.fillStyle = "#a07c3f";
        g2.fillRect(0, h, w, rule);
        g2.textBaseline = "top";
        let y = h + pad;
        g2.fillStyle = "#7a2e1d";
        g2.font = `900 ${kickerPx}px ${face}`;
        g2.fillText("LEGENDA DA IMAGEM", pad, y);
        y += kickerLH + 4;
        g2.fillStyle = "#35291a";
        g2.font = `800 ${titlePx}px ${face}`;
        titleLines.forEach(line => { g2.fillText(line, pad, y); y += titleLH; });
        y += 10 + rule;
        segs.forEach(s => {
          y += 8;
          g2.fillStyle = "#a05a22";
          g2.font = `900 ${segPx}px ${face}`;
          g2.fillText(s.label, pad, y);
          y += segLH + 3;
          g2.fillStyle = "#3a2e1c";
          g2.font = `400 ${segPx}px ${face}`;
          s.lines.forEach(line => { g2.fillText(line, pad, y); y += bodyLH; });
        });
        canvas.toBlob(blob => {
          if (!blob) { editToast("Não foi possível gerar o arquivo."); return; }
          const url = URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url;
          a.download = editorName(item).replace(/\.(png|jpe?g)$/i, "") + "-com-legenda.png";
          document.body.appendChild(a); a.click(); a.remove();
          setTimeout(() => URL.revokeObjectURL(url), 5000);
          editToast("⬇ Arquivo com legenda baixado.");
        }, "image/png");
      } catch (_) { setLegendStatus("Não foi possível exportar a imagem com legenda.", "err"); }
    };
    legendPanel.addEventListener("click", event => {
      const btn = event.target.closest("[data-legend]");
      if (!btn) return;
      event.preventDefault(); event.stopPropagation();
      const act = btn.dataset.legend;
      if (act === "close") closeLegendPanel();
      else if (act === "gen") generateLegend("manual");
      else if (act === "save") saveLegend();
      else if (act === "export") exportLegend();
    });
    legendPanel.addEventListener("pointerdown", event => event.stopPropagation());
    const fetchItemBlob = async item => {
      try { const resp = await fetch(item.src); if (!resp.ok) return null; return await resp.blob(); } catch (_) { return null; }
    };
    const downloadBlob = (blob, name) => {
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url; a.download = name || "imagem-midia-x.jpg";
      document.body.appendChild(a); a.click(); a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 5000);
    };
    const editorName = item => {
      const base = String(currentReaderReference(item) || item.title || "imagem").replace(/[^\p{L}\p{N}]+/gu, "-").replace(/^-+|-+$/g, "") || "imagem";
      return base + (/.png$/i.test(item.src || "") ? ".png" : ".jpg");
    };
    const copyCurrent = async () => {
      const blob = await fetchItemBlob(items[index] || {});
      if (!blob) { editToast("Não foi possível copiar."); return; }
      try {
        await navigator.clipboard.write([new ClipboardItem({ [(blob.type || "image/png")]: blob })]);
        editToast("⧉ Imagem copiada.");
      } catch (_) { editToast("Seu navegador não permite copiar imagem."); }
    };
    const removeCurrent = async () => {
      const item = items[index] || {};
      const id = String(item._dbId || item.id || item.key || "").trim();
      try { if (id) await mediaRowDelete(id); }
      catch (_) { editToast("Não foi possível excluir."); return; }
      items.splice(index, 1);
      if (!items.length) { close(); return; }
      if (index >= items.length) index = items.length - 1;
      closeEditPanel();
      show(index);
      mediaChanged();
      editToast("🗑 Imagem excluída da Bíblia.");
    };
    const saveCurrent = async target => {
      const item = items[index] || {};
      const id = String(item._dbId || item.id || item.key || "").trim();
      const saveBible = async () => {
        if (id) {
          const row = (await mediaRowById(id)) || { ...item, id };
          row.blob = row.blob || null;
          await mediaRowPut(row);
          editToast("📖 Já está salva na Bíblia ✔");
          return;
        }
        const blob = await fetchItemBlob(item);
        if (!blob) { editToast("Não foi possível salvar na Bíblia."); return; }
        const nid = "mx-" + Date.now() + "-" + Math.round(Math.random() * 1e6);
        await mediaRowPut({ id: nid, type: "image", blob, sourceKind: "local", title: item.title || "Imagem da passagem", reference: currentReaderReference(item), createdAt: new Date().toISOString() });
        items[index] = { ...item, _dbId: nid };
        mediaChanged();
        editToast("📖 Salva na Bíblia ✔");
      };
      const saveDisk = async () => {
        const blob = await fetchItemBlob(item);
        if (!blob) { editToast("Não foi possível baixar."); return; }
        downloadBlob(blob, editorName(item));
        editToast("💾 Baixada para o dispositivo.");
      };
      if (target === "bible") await saveBible();
      else if (target === "disk") await saveDisk();
      else if (target === "both") { await saveBible(); await saveDisk(); }
      closeEditPanel();
    };
    /* ---- camada de recorte (por cima da imagem, alinhada ao retângulo real) ---- */
    const cropLayer = document.createElement("div");
    cropLayer.className = "bxvm-crop-layer";
    cropLayer.hidden = true;
    cropLayer.innerHTML =
      '<div class="bxvm-crop-sel" style="display:none"></div>' +
      '<div class="bxvm-crop-tip">🖐 Arraste para escolher o recorte</div>' +
      '<div class="bxvm-crop-actions"><button type="button" class="bxvm-crop-cancel" data-crop="cancel">Cancelar</button><button type="button" class="bxvm-crop-ok" data-crop="ok">✂️ Recortar</button></div>';
    viewport.appendChild(cropLayer);
    const cropSel = cropLayer.querySelector(".bxvm-crop-sel");
    const placeCropLayer = () => {
      const ivr = viewport.getBoundingClientRect();
      const ir = image.getBoundingClientRect();
      cropLayer.style.left = Math.max(0, Math.round(ir.left - ivr.left)) + "px";
      cropLayer.style.top = Math.max(0, Math.round(ir.top - ivr.top)) + "px";
      cropLayer.style.width = Math.round(ir.width) + "px";
      cropLayer.style.height = Math.round(ir.height) + "px";
    };
    const paintCrop = () => {
      if (!cropBox || cropBox.w < 2 || cropBox.h < 2) { cropSel.style.display = "none"; return; }
      cropSel.style.display = "block";
      cropSel.style.left = cropBox.x + "px";
      cropSel.style.top = cropBox.y + "px";
      cropSel.style.width = cropBox.w + "px";
      cropSel.style.height = cropBox.h + "px";
    };
    const exitCrop = () => {
      cropActive = false;
      cropFrom = null;
      cropBox = null;
      if (cropLayer) cropLayer.hidden = true;
      if (cropSel) cropSel.style.display = "none";
    };
    const startCrop = () => {
      if (!image.classList.contains("loaded") || !image.complete) { editToast("Aguarde a imagem carregar para recortar."); return; }
      setAngle(0);
      setScale(1);
      requestAnimationFrame(() => {
        placeCropLayer();
        cropActive = true;
        cropLayer.hidden = false;
      });
    };
    const cropPoint = event => {
      const r = cropLayer.getBoundingClientRect();
      return { x: event.clientX - r.left, y: event.clientY - r.top };
    };
    cropLayer.addEventListener("pointerdown", event => {
      if (event.target.closest(".bxvm-crop-actions,.bxvm-crop-tip")) return;
      if (!cropActive) return;
      event.stopPropagation(); /* isola o recorte: sem isso o drag horizontal vira "próxima imagem" (swipe do viewport) e sai do recorte */
      cropLayer.setPointerCapture?.(event.pointerId);
      const p = cropPoint(event);
      cropFrom = p;
      cropBox = { x: p.x, y: p.y, w: 0, h: 0 };
      paintCrop();
    });
    cropLayer.addEventListener("pointermove", event => {
      if (!cropActive || !cropFrom) return;
      event.stopPropagation();
      const p = cropPoint(event);
      cropBox = { x: Math.min(cropFrom.x, p.x), y: Math.min(cropFrom.y, p.y), w: Math.abs(p.x - cropFrom.x), h: Math.abs(p.y - cropFrom.y) };
      paintCrop();
    });
    cropLayer.addEventListener("pointerup", event => {
      event.stopPropagation();
      cropFrom = null;
    });
    cropLayer.addEventListener("click", event => {
      const act = event.target.closest("[data-crop]")?.dataset.crop;
      if (!act) return;
      event.preventDefault(); event.stopPropagation();
      if (act === "cancel") { exitCrop(); return; }
      if (act !== "ok") return;
      const r = cropLayer.getBoundingClientRect();
      if (!cropBox || cropBox.w < 10 || cropBox.h < 10) { editToast("Escolha um recorte maior."); return; }
      const sx = image.naturalWidth / Math.max(1, r.width);
      const sy = image.naturalHeight / Math.max(1, r.height);
      const nr = {
        x: clamp(Math.round(cropBox.x * sx), 0, image.naturalWidth),
        y: clamp(Math.round(cropBox.y * sy), 0, image.naturalHeight),
        w: clamp(Math.round(cropBox.w * sx), 1, image.naturalWidth),
        h: clamp(Math.round(cropBox.h * sy), 1, image.naturalHeight)
      };
      nr.w = Math.max(1, Math.min(nr.w, image.naturalWidth - nr.x));
      nr.h = Math.max(1, Math.min(nr.h, image.naturalHeight - nr.y));
      exitCrop();
      applyCrop(nr);
    });
    const applyCrop = rect => {
      if (rect.w < 2 || rect.h < 2) { editToast("Recorte muito pequeno."); return; }
      const canvas = document.createElement("canvas");
      canvas.width = rect.w;
      canvas.height = rect.h;
      const ctx = canvas.getContext("2d");
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";
      ctx.drawImage(image, rect.x, rect.y, rect.w, rect.h, 0, 0, rect.w, rect.h);
      const kind = /\.png$/i.test(items[index] && items[index].src || "") ? "image/png" : "image/jpeg";
      canvas.toBlob(async blob => {
        if (!blob) { editToast("Não foi possível recortar."); return; }
        const item = items[index] || {};
        const id = String(item._dbId || item.id || item.key || "").trim();
        try {
          const row = (await mediaRowById(id)) || {};
          const fresh = URL.createObjectURL(blob);
          editorUrls.push(fresh);
          const next = {
            ...row,
            id: row.id || id || ("mx-" + Date.now() + "-" + Math.round(Math.random() * 1e6)),
            type: "image",
            blob,
            sourceKind: "local",
            title: row.title || item.title || "Imagem da passagem",
            reference: String(row.reference || item._reference || currentReaderReference(item)).trim(),
            createdAt: row.createdAt || new Date().toISOString()
          };
          await mediaRowPut(next);
          items[index] = { ...item, src: fresh, _dbId: next.id, _reference: next.reference };
          show(index);
          mediaChanged();
          editToast("✂️ Recortado e salvo na Bíblia ✔");
        } catch (_) { editToast("Não foi possível salvar o recorte."); }
      }, kind, 0.92);
    };

    const applyTransform = () => {
      const s = (scale * orientK).toFixed(4);
      image.style.transform = `translate3d(${offsetX}px,${offsetY}px,0) rotate(${angle}deg) scale(${s})`;
      viewport.classList.toggle("zoomed", scale > 1.01);
      syncLegendPlateView();
    };
    /* medidas "deitadas" da imagem (offset ignora transform) e fator que faz a
       imagem ROTACIONADA (90/270 = largura vira altura) caber no palco */
    const updateFit = () => {
      const w = viewport.clientWidth || stage.clientWidth || 1;
      const h = viewport.clientHeight || stage.clientHeight || 1;
      const iw = image.offsetWidth || image.naturalWidth || laidW || 1;
      const ih = image.offsetHeight || image.naturalHeight || laidH || 1;
      laidW = iw; laidH = ih;
      orientK = (angle % 180 === 0)
        ? 1
        : Math.min(1, w / ih, h / iw);
      applyTransform();
    };
    const setAngle = value => {
      angle = ((value % 360) + 360) % 360;
      scale = 1;
      offsetX = offsetY = 0;
      updateFit();
      const rb = tools.querySelector('[data-bxvm-action="rotate"]');
      if (rb) rb.classList.toggle("is-active", angle % 180 !== 0);
    };
    const setScale = value => {
      scale = clamp(value, 1, 5);
      if (scale === 1) offsetX = offsetY = 0;
      applyTransform();
    };
    const stopSlides = () => {
      if (slideTimer) clearInterval(slideTimer);
      slideTimer = 0;
      const play = $('[data-bxvm-action="play"]', tools);
      if (play) {
        play.textContent = "▶";
        play.title = "Iniciar apresentação";
      }
    };
    const toggleSlides = () => {
      if (slideTimer) return stopSlides();
      slideTimer = window.setInterval(() => show(index + 1), Number(options.interval) || 4500);
      const play = $('[data-bxvm-action="play"]', tools);
      if (play) {
        play.textContent = "❚❚";
        play.title = "Pausar apresentação";
      }
    };
    const renderInfo = item => {
      heading.textContent = item.title;
      caption.replaceChildren();
      const count = document.createElement("strong");
      count.textContent = `${index + 1} / ${items.length}`;
      const detail = document.createElement("span");
      detail.textContent = [item.credit && `Crédito: ${item.credit}`, item.license && `Licença: ${item.license}`, item.description].filter(Boolean).join(" • ");
      caption.append(count, detail);
      links.replaceChildren();
      const page = externalLink("Fonte ↗", item.pageUrl);
      const license = externalLink("Licença ↗", item.licenseUrl);
      if (page) links.appendChild(page);
      if (license) links.appendChild(license);
    };
    const show = nextIndex => {
      index = (nextIndex + items.length) % items.length;
      const item = items[index];
      scale = 1;
      offsetX = offsetY = 0;
      angle = 0;
      orientK = 1;
      const rotateBtn = $('[data-bxvm-action="rotate"]', tools);
      if (rotateBtn) rotateBtn.classList.remove("is-active");
      applyTransform();
      loading.hidden = false;
      image.classList.remove("loaded");
      image.alt = item.title;
      image.src = item.src;
      closeEditPanel();
      if (legendPanel) legendPanel.hidden = true;
      if (cropLayer) { cropActive = false; cropLayer.hidden = true; const cs = cropLayer.querySelector(".bxvm-crop-sel"); if (cs) cs.style.display = "none"; cropFrom = null; cropBox = null; }
      const editBtnNode = $('[data-bxvm-action="edit"]', tools);
      if (editBtnNode) editBtnNode.hidden = !isEditableItem(item);
      const legendBtnNode = $('[data-bxvm-action="legend"]', tools);
      if (legendBtnNode) legendBtnNode.hidden = !isEditableItem(item);
      renderInfo(item);
      legendPlate.classList.remove("bxvm-legend-collapsed");
      renderLegendPlate(item);
      previous.hidden = next.hidden = items.length < 2;
      /* O ‹ › passeia pela galeria — e o painel 🗺 Google View VAI JUNTO, indo
         para a rua do próximo lugar. É assim que a pessoa percorre os cenários
         sem digitar nada: chega pelo cartão, arrasta para olhar, toca em ›. */
      if (!googlePanel.hidden) {
        const alvo = googlePos(item, googleModo);
        const g = item.gmap || null;
        if (g && alvo) {
          googleCampo.value = alvo[0].toFixed(5) + "," + alvo[1].toFixed(5);
          googleMostrar(googleModo, alvo[0], alvo[1], item.title || "",
            (g.emoji ? g.emoji + " " : "🚶 ") + (item.title || "Street View")
              + " — você está na rua. Arraste para olhar em volta; as setas brancas no chão andam.");
        } else if (alvo) {
          googleCampo.value = alvo[0].toFixed(5) + "," + alvo[1].toFixed(5);
          googleMostrar(googleModo, alvo[0], alvo[1], "");
        }
      }
    };
    const close = () => {
      if (googlePanel) googlePanel.classList.remove("is-cheio");
      stopSlides();
      document.removeEventListener("keydown", onKey);
      window.removeEventListener("resize", onResize);
      editorUrls.forEach((url) => { try { URL.revokeObjectURL(url); } catch (_) {} });
      overlay.remove();
      if (!document.querySelector(".bxvm-overlay,.bx-route-visual-modal")) document.body.classList.remove("bxvm-lock");
      if (typeof options.onClose === "function") options.onClose();
    };
    const onKey = event => {
      if (event.key === "Escape") {
        if (cropActive) { exitCrop(); return; }
        if (editPanel && !editPanel.hidden) { closeEditPanel(); return; }
        if (legendPanel && !legendPanel.hidden) { closeLegendPanel(); return; }
        close();
      } else if (event.key === "ArrowLeft") show(index - 1);
      else if (event.key === "ArrowRight") show(index + 1);
      else if (event.key === "+" || event.key === "=") setScale(scale + 0.25);
      else if (event.key === "-") setScale(scale - 0.25);
      else if (event.key.toLowerCase() === "f") requestFullScreen(dialog);
      else if (event.key === " ") { event.preventDefault(); toggleSlides(); }
    };

    /* ---- 5.4.249 — 🗺 Google View DENTRO da biblioteca --------------------
       Mapa, satélite e Street View numa janela nossa (iframe), sem sair do app
       e SEM chave de API: são os endereços de embed do próprio Google. O Street
       View aceita posição (lat,lon), não nome de lugar — então: se a foto já
       trouxer a coordenada (as do Wikimedia Commons trazem, é a posição do
       arquivo), o botão abre direto nela; se não, o lugar digitado é convertido
       em coordenadas pelo NOSSO servidor (/api/bible/public-images/geo) e, sem
       coordenada nenhuma, cai no mapa com o nome digitado mesmo. */
    const googlePanel = document.createElement("div");
    googlePanel.className = "bxvm-google-panel";
    googlePanel.hidden = true;
    googlePanel.innerHTML =
      '<div class="bxvm-google-head"><b>🗺 Google View</b><small>Mapa e Street View aqui dentro</small>' +
      '<button type="button" class="bxvm-google-cheio" data-bxvm-google="cheio" title="Tela cheia do Google — no celular as setas do chão ficam grandes para ANDAR" aria-label="Tela cheia do Google">⛶</button>' +
      '<button type="button" class="bxvm-google-x" data-bxvm-google="fechar" aria-label="Fechar">×</button></div>' +
      '<div class="bxvm-google-linha"><input type="text" data-bxvm-google-campo placeholder="Lugar ou coordenadas (ex.: Muro das Lamentações, Jerusalém / 31.7767,35.2345)"></div>' +
      '<div class="bxvm-google-acoes">' +
      '<button type="button" data-bxvm-google="sv">🚶 Street View</button>' +
      '<button type="button" data-bxvm-google="mapa">🗺 Mapa</button>' +
      '<button type="button" data-bxvm-google="sat">🛰 Satélite</button>' +
      /* o 🧍 bonequinho e as setas de andar só existem no Google Maps inteiro —
         nenhum endereço de embed os mostra (conferido). Por isso este atalho. */
      '<a class="bxvm-google-fora" data-bxvm-google-fora target="_blank" rel="noopener" title="Abre o Google Maps em outra aba, com o bonequinho para arrastar até a rua">🧍 Navegar no Google ↗</a>' +
      "</div>" +
      '<div class="bxvm-google-passeios">' +
      '<b>🧭 Passeios prontos — toque e você já cai na rua:</b>' +
      '<div class="bxvm-google-chips" data-bxvm-google-chips></div>' +
      "</div>" +
      /* 5.4.249 — na TELA CHEIA os botões do topo somem e o comando vira
         este trenzinho flutuante no rodapé: a tela toda é do mapa, e ainda
         dá para trocar de vista e sair sem ficar procurando botão. */
      '<div class="bxvm-google-mini">' +
      '<button type="button" data-bxvm-google="sv" title="Street View — andar na rua" aria-label="Street View">🚶</button>' +
      '<button type="button" data-bxvm-google="mapa" title="Mapa" aria-label="Mapa">🗺</button>' +
      '<button type="button" data-bxvm-google="sat" title="Satélite" aria-label="Satélite">🛰</button>' +
      '<button type="button" data-bxvm-google="cheio" title="Sair da tela cheia" aria-label="Sair da tela cheia">⤡</button>' +
      '<button type="button" data-bxvm-google="fechar" title="Fechar o Google View" aria-label="Fechar o Google View">×</button>' +
      "</div>" +
      '<div class="bxvm-google-stage" data-bxvm-google-stage></div>' +
      '<p class="bxvm-google-pe" data-bxvm-google-pe></p>';
    overlay.appendChild(googlePanel);
    const googleCampo = $("[data-bxvm-google-campo]", googlePanel);
    const googleStage = $("[data-bxvm-google-stage]", googlePanel);
    const googlePe = $("[data-bxvm-google-pe]", googlePanel);
    const googleFora = $("[data-bxvm-google-fora]", googlePanel);
    let googleModo = "sv";

    /* ---- 5.4.249 — Passeios prontos -------------------------------------
       A pessoa não precisa saber procurar: toca no lugar e o Google View já
       abre a RUA ali dentro (360°, arrastando para olhar em volta). São
       coordenadas de lugares bíblicos com imagem de rua/foto esférica do
       Google, escolhidas para dar variedade de cenário. */
    const PASSEIOS = [
      ["🧱", "Muro das Lamentações", 31.7767469, 35.2344484],
      ["✝️", "Santo Sepulcro", 31.7784463, 35.2297723],
      ["🚶", "Via Dolorosa", 31.7795250, 35.2327100],
      ["🕊", "Getsêmani", 31.7794160, 35.2397330],
      ["🏔", "Monte das Oliveiras", 31.7784000, 35.2437000],
      ["🌊", "Mar da Galileia", 32.8808000, 35.5750000],
      ["💧", "Rio Jordão (Qasr al-Yahud)", 31.8375000, 35.5350000],
      ["⭐", "Belém — Natividade", 31.7042000, 35.2075000],
      ["🏠", "Nazaré", 32.6996000, 35.3035000],
      ["🎺", "Jericó", 31.8700000, 35.4440000],
      ["🏜", "Massada", 31.3156000, 35.3537000],
      ["⛰", "Monte Sinai", 28.5392000, 33.9755000],
      ["🐪", "Pirâmides de Gizé", 29.9792000, 31.1342000],
      ["🏛", "Areópago (Atenas)", 37.9715000, 23.7267000],
      ["🏟", "Coliseu (Roma)", 41.8902000, 12.4922000],
      ["🏺", "Éfeso", 37.9397000, 27.3417000],
      ["🏝", "Patmos", 37.3094000, 26.5470000],
      ["⛪", "Corinto", 37.9060000, 22.8790000],
    ];
    const chipsPasseio = $("[data-bxvm-google-chips]", googlePanel);
    if (chipsPasseio) {
      chipsPasseio.innerHTML = PASSEIOS.map((p, i) =>
        '<button type="button" data-bxvm-passeio="' + i + '" title="Ir para ' + p[1] + '">' + p[0] + " " + p[1] + "</button>"
      ).join("") +
        '<button type="button" class="is-sorte" data-bxvm-passeio="sorte" title="Escolher um lugar para mim">🎲 Surpreenda-me</button>';
      chipsPasseio.addEventListener("click", event => {
        const alvo = event.target.closest("[data-bxvm-passeio]");
        if (!alvo) return;
        const valor = alvo.getAttribute("data-bxvm-passeio");
        const passeio = valor === "sorte"
          ? PASSEIOS[Math.floor(Math.random() * PASSEIOS.length)]
          : PASSEIOS[Number(valor)];
        if (!passeio) return;
        googleCampo.value = passeio[1];
        googleMostrar("sv", passeio[2], passeio[3], passeio[1],
          passeio[0] + " " + passeio[1] + " — você está na rua. Arraste para olhar em volta; as setas brancas no chão andam. Sem seta = o Google só tem foto esférica aqui.");
      });
    }

    const googleUrl = (modo, lat, lon, texto) => {
      const temPos = lat !== null && lat !== undefined && lon !== null && lon !== undefined;
      if (temPos) {
        const pos = lat + "," + lon;
        if (modo === "sv") return "https://maps.google.com/maps?layer=c&cbll=" + pos + "&cbp=11,0,0,0,0&output=svembed";
        if (modo === "sat") return "https://www.google.com/maps?q=" + pos + "&t=k&z=18&output=embed";
        return "https://www.google.com/maps?q=" + pos + "&z=17&output=embed";
      }
      return "https://www.google.com/maps?q=" + encodeURIComponent(texto || "") + "&z=14&output=embed";
    };
    /* guarda a ÚLTIMA vista mostrada: ao entrar/sair da tela cheia o iframe é
       recriado, e sem isto o mapa voltava para o lugar da imagem — perdendo o
       que a pessoa tinha digitado na busca ou escolhido num passeio. */
    let googleUltimo = null;
    const googleMostrar = (modo, lat, lon, texto, aviso) => {
      googleModo = modo;
      googleUltimo = { modo: modo, lat: lat, lon: lon, texto: texto || "", aviso: aviso || "" };
      const temPos = lat !== null && lat !== undefined && lon !== null && lon !== undefined;
      googleStage.innerHTML = "";
      const frame = document.createElement("iframe");
      frame.className = "bxvm-google-frame";
      frame.src = googleUrl(modo, lat, lon, texto);
      frame.loading = "lazy";
      frame.referrerPolicy = "no-referrer";
      frame.allowFullscreen = true;
      frame.setAttribute("allow", "fullscreen; geolocation");
      frame.title = "Google Maps dentro do LOGOS MASTER X";
      googleStage.appendChild(frame);
      googlePe.textContent = aviso || (temPos
        ? (modo === "sv"
          ? "🚶 Street View em " + Number(lat).toFixed(4) + ", " + Number(lon).toFixed(4)
            + " — arraste para olhar em volta. As setas brancas no chão andam pela rua; onde elas não aparecem, o Google só tem foto esférica ali (sem rua para andar). Para andar com o 🧍 bonequinho, use «🧍 Navegar no Google»."
          : (modo === "sat" ? "🛰 Satélite" : "🗺 Mapa") + " em " + Number(lat).toFixed(4) + ", " + Number(lon).toFixed(4) + ".")
        : "🗺 Mapa de «" + texto + "». Digite o lugar e toque em 🚶 Street View para ver da rua.");
      /* qual vista está no ar: acende o botão dela aqui dentro E na barra */
      var nomeAcao = modo === "sv" ? "google-rua" : (modo === "sat" ? "google-sat" : "google-mapa");
      googlePanel.querySelectorAll("[data-bxvm-google]").forEach(function (b) {
        b.classList.toggle("is-on", b.getAttribute("data-bxvm-google") === modo);
      });
      overlay.querySelectorAll('.bxvm-tools [data-bxvm-action^="google"]').forEach(function (b) {
        b.classList.toggle("is-on", b.getAttribute("data-bxvm-action") === nomeAcao);
      });
      googleFora.href = modo === "sv" && temPos
        ? "https://www.google.com/maps/@?api=1&map_action=pano&viewpoint=" + lat + "," + lon
        : "https://www.google.com/maps/search/?api=1&query=" + encodeURIComponent(temPos ? lat + "," + lon : texto);
    };
    /* Qual coordenada usar: para ANDAR é a RUA (onde o carro do Google passou
       e as setas do chão existem); para olhar de cima (mapa/satélite) é o SÍTIO,
       que mostra o monumento inteiro. Publicações da web trazem só uma. */
    const googlePos = (item, modo) => {
      const g = item && item.gmap;
      if (g && Number.isFinite(Number(g.ruaLat))) {
        return modo === "sv" ? [Number(g.ruaLat), Number(g.ruaLon)] : [Number(g.lat), Number(g.lon)];
      }
      const c = item && item.coords;
      if (c && c.lat !== null && c.lat !== undefined && Number.isFinite(Number(c.lon))) return [Number(c.lat), Number(c.lon)];
      return null;
    };
    /* Abre o painel do Google já num modo (é o que os botões da barra fazem). */
    const googleAbrirModo = modo => {
      if (googlePanel.hidden) {
        googleAlternar();
        if (googlePanel.hidden) return;
      }
      googleModo = modo;
      const alvo = googlePos(items[index] || {}, modo);
      if (alvo) {
        googleCampo.value = alvo[0].toFixed(5) + "," + alvo[1].toFixed(5);
        googleMostrar(modo, alvo[0], alvo[1], "");
        return;
      }
      googleIr(modo);
    };
    const googleIr = modo => {
      const item = items[index] || {};
      const texto = (googleCampo.value || "").trim();
      /* "31.7767,35.2345" digitado à mão também vale */
      const par = texto.match(/^(-?\d{1,3}(?:[.,]\d+)?)\s*[,;\s]\s*(-?\d{1,3}(?:[.,]\d+)?)$/);
      if (par) { googleMostrar(modo, Number(par[1].replace(",", ".")), Number(par[2].replace(",", ".")), texto); return; }
      if (!texto) {
        const alvo = googlePos(item, modo);
        if (alvo) { googleCampo.value = alvo[0].toFixed(5) + "," + alvo[1].toFixed(5); googleMostrar(modo, alvo[0], alvo[1], ""); return; }
      }
      if (!texto) { googlePe.textContent = "Digite o lugar (ou as coordenadas) para eu abrir o mapa aqui dentro."; googleCampo.focus(); return; }
      googleStage.innerHTML = '<p class="bxvm-google-vazio">Procurando «' + texto + '» no mapa…</p>';
      fetch("/api/bible/public-images/geo?q=" + encodeURIComponent(texto), { headers: { Accept: "application/json" } })
        .then(r => (r.ok ? r.json() : null))
        .then(d => {
          if (d && d.lat !== null && d.lat !== undefined) googleMostrar(modo, Number(d.lat), Number(d.lon), texto, "📍 " + (d.nome || texto));
          else googleMostrar("mapa", null, null, texto, "Não achei as coordenadas de «" + texto + "» — mostrei o mapa da busca.");
        })
        .catch(() => googleMostrar("mapa", null, null, texto, "Sem resposta do servidor do mapa — mostrei o mapa da busca."));
    };
    const googleAlternar = () => {
      const abrir = googlePanel.hidden;
      if (abrir) {
        if (editPanel && !editPanel.hidden) closeEditPanel();
        if (legendPanel && !legendPanel.hidden) closeLegendPanel();
        const item = items[index] || {};
        const alvo = googlePos(item, googleModo);
        googleCampo.value = alvo
          ? alvo[0].toFixed(5) + "," + alvo[1].toFixed(5)
          : String(item.title || "").replace(/\.[a-z0-9]{2,5}$/i, "").slice(0, 80);
      }
      googlePanel.hidden = !abrir;
      if (abrir) googleIr(googleModo);
      else googleStage.innerHTML = "";
    };
    googlePanel.addEventListener("click", event => {
      const acao = event.target.closest("[data-bxvm-google]")?.dataset.bxvmGoogle;
      if (!acao) return;
      if (acao === "fechar") { googlePanel.classList.remove("is-cheio"); googlePanel.hidden = true; googleStage.innerHTML = ""; return; }
      if (acao === "cheio") {
        googlePanel.classList.toggle("is-cheio");
        /* o iframe é recriado porque a altura muda junto com a tela — mas
           volta para a MESMA vista que estava no ar, e não para o lugar da
           imagem aberta. */
        const u = googleUltimo;
        const alvo = u ? [u.lat, u.lon] : googlePos(items[index] || {}, googleModo);
        if (u) googleMostrar(u.modo, u.lat, u.lon, u.texto, u.aviso);
        else if (alvo) googleMostrar(googleModo, alvo[0], alvo[1], "");
        return;
      }
      googleIr(acao);
    });

    image.addEventListener("load", () => { loading.hidden = true; image.classList.add("loaded"); updateFit(); });
    image.addEventListener("error", () => { loading.textContent = "Não foi possível carregar esta imagem."; });
    const onResize = () => updateFit();
    window.addEventListener("resize", onResize);
    viewport.addEventListener("wheel", event => { event.preventDefault(); setScale(scale + (event.deltaY < 0 ? .25 : -.25)); }, { passive: false });
    viewport.addEventListener("pointerdown", event => {
      if (cropActive) return; /* em recorte o gesto é do crop, nunca swipe/pan */
      viewport.setPointerCapture?.(event.pointerId);
      if (scale > 1.01) {
        dragging = true;
        dragStart = { x: event.clientX, y: event.clientY, ox: offsetX, oy: offsetY };
      } else swipeStart = { x: event.clientX, y: event.clientY };
    });
    viewport.addEventListener("pointermove", event => {
      if (cropActive || !dragging || !dragStart) return;
      offsetX = dragStart.ox + event.clientX - dragStart.x;
      offsetY = dragStart.oy + event.clientY - dragStart.y;
      applyTransform();
    });
    viewport.addEventListener("pointerup", event => {
      if (cropActive) { dragging = false; dragStart = swipeStart = null; return; }
      if (!dragging && swipeStart && Math.abs(event.clientX - swipeStart.x) > 55) show(index + (event.clientX < swipeStart.x ? 1 : -1));
      dragging = false;
      dragStart = swipeStart = null;
    });
    viewport.addEventListener("dblclick", () => setScale(scale > 1 ? 1 : 2));
    tools.addEventListener("click", event => {
      const action = event.target.closest("[data-bxvm-action]")?.dataset.bxvmAction;
      if (action === "zoom-in") setScale(scale + .25);
      if (action === "zoom-out") setScale(scale - .25);
      if (action === "fit") setScale(1);
      if (action === "rotate") setAngle(angle + 90);
      /* 5.4.249 — "ver uma imagem normal em 360°": reabre a imagem que está na
         tela no visualizador de panorama (esfera girável, arrastar para olhar
         ao redor). Abre POR CIMA da galeria, então fechar o 360° volta para a
         mesma imagem, sem perder o lugar. Serve para qualquer imagem: foto
         panorâmica de verdade fica certa; foto comum vira uma vista imersiva. */
      /* 5.4.249 — o botao 🌐 360 saiu: girar uma foto comum na esfera nao
         ajudava ninguem. A imersao de verdade agora e o 🗺 Google View, que
         leva a pessoa para dentro da rua. O trecho abaixo fica inerte caso
         algum modulo antigo ainda peca a acao. */
      if (action === "panorama" && false) {
        const it = items[index] || {};
        if (!it.src) { editToast("Esta imagem não tem endereço para abrir em 360°."); return; }
        try {
          openPanorama({ ...it, description: it.description || "Vista 360° da imagem" }, {
            eyebrow: (options.eyebrow || "MÍDIA X") + " • 360°",
            autoRotate: true,
          });
          editToast("🌐 Modo 360°: arraste para olhar ao redor • × volta para a galeria");
        } catch (_) {
          editToast("Não foi possível abrir em 360° nesta tela.");
        }
      }
      if (action === "play") toggleSlides();
      if (action === "fullscreen") requestFullScreen(dialog);
      if (action === "edit") { if (legendPanel && !legendPanel.hidden) closeLegendPanel(); toggleEditPanel(); }
      if (action === "legend") toggleLegendPanel();
      if (action === "download") {
        const it = items[index] || {};
        (async () => {
          const blob = await fetchItemBlob(it);
          if (!blob) {
            if (/^https?:/i.test(String(it.src || ""))) { const w = window.open(it.src, "_blank"); if (w) w.opener = null; editToast("Abrindo a fonte original no navegador…"); }
            else editToast("Não foi possível baixar.");
            return;
          }
          let ext = ".jpg";
          const t = String(blob.type || "").toLowerCase();
          if (t.includes("png")) ext = ".png"; else if (t.includes("webp")) ext = ".webp"; else if (t.includes("gif")) ext = ".gif";
          downloadBlob(blob, String(editorName(it)).replace(/\.(png|jpe?g|webp|gif)$/i, "") + ext);
          editToast("⬇ Download iniciado.");
        })();
      }
      if (action === "immersion") {
        close();
        openImmersionFromVisual(item);
      }
      if (action === "google") googleAlternar();
      if (action === "google-rua") googleAbrirModo("sv");
      if (action === "google-sat") googleAbrirModo("sat");
      if (action === "google-mapa") googleAbrirModo("mapa");
      /* O bonequinho do Street View (arrastar até a rua) só existe no Google
         Maps inteiro — nenhum endereço de embed o mostra. Este botão leva a
         pessoa direto para lá, já na posição do lugar. */
      if (action === "google-fora") {
        const alvo = googlePos(items[index] || {}, "sv");
        const alvoUrl = alvo
          ? "https://www.google.com/maps/@?api=1&map_action=pano&viewpoint=" + alvo[0] + "," + alvo[1]
          : "https://www.google.com/maps/search/?api=1&query=" + encodeURIComponent(String((items[index] || {}).title || ""));
        window.open(alvoUrl, "_blank", "noopener");
      }
      if (action === "close") close();
    });
    previous.addEventListener("click", () => show(index - 1));
    next.addEventListener("click", () => show(index + 1));
    overlay.addEventListener("click", event => { if (event.target === overlay) close(); });
    document.addEventListener("keydown", onKey);
    show(index);
    /* ---- 5.4.249 — cheguei aqui pelo cartão 🗺 Google dos ACERVOS PÚBLICOS:
       a janela já abre NA RUA daquele lugar (Street View), para arrastar e
       olhar em volta — sem digitar nada, sem saber o endereço. */
    if (options.rua && Number.isFinite(Number(options.rua.lat)) && Number.isFinite(Number(options.rua.lon))) {
      googlePanel.hidden = false;
      googleCampo.value = Number(options.rua.lat).toFixed(5) + "," + Number(options.rua.lon).toFixed(5);
      googleMostrar("sv", Number(options.rua.lat), Number(options.rua.lon), options.rua.nome || "",
        (options.rua.emoji ? options.rua.emoji + " " : "🚶 ") + (options.rua.nome || "Street View")
          + " — você está na rua. Arraste para olhar em volta; as setas brancas no chão andam pela rua.");
    }
    if (options.autoplay) toggleSlides();
    return { close, show, play: toggleSlides };
  }

  function createProgram(gl, vertexSource, fragmentSource) {
    const compile = (type, source) => {
      const shader = gl.createShader(type);
      gl.shaderSource(shader, source);
      gl.compileShader(shader);
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(shader) || "Shader inválido");
      return shader;
    };
    const program = gl.createProgram();
    gl.attachShader(program, compile(gl.VERTEX_SHADER, vertexSource));
    gl.attachShader(program, compile(gl.FRAGMENT_SHADER, fragmentSource));
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(program) || "WebGL indisponível");
    return program;
  }

  function openPanorama(rawItem, options = {}) {
    const item = normalizeItem(rawItem);
    if (!item.src) return null;
    let yaw = Number(options.yaw) || 0;
    let pitch = Number(options.pitch) || 0;
    let fov = Number(options.fov) || 72;
    let autoRotate = options.autoRotate !== false;
    let animation = 0;
    let lastFrame = performance.now();
    let dragging = false;
    let dragPoint = null;
    let pinchDistance = 0;
    const pointers = new Map();
    const overlay = shell("panorama", options.eyebrow || "MÍDIA X • PANORAMA 360°");
    const dialog = $(".bxvm-dialog", overlay);
    const stage = $(".bxvm-stage", overlay);
    const tools = $(".bxvm-tools", overlay);
    const heading = $(".bxvm-heading h2", overlay);
    const caption = $(".bxvm-caption", overlay);
    const links = $(".bxvm-links", overlay);
    const canvas = document.createElement("canvas");
    canvas.className = "bxvm-pano-canvas";
    const loading = document.createElement("div");
    loading.className = "bxvm-loading";
    loading.innerHTML = "Preparando panorama 360°...<small>Arraste para olhar ao redor • use a roda ou ± para aproximar</small>";
    stage.append(canvas, loading);
    [
      button("🕶 História", "immersion", "Entrar na história"),
      button("−", "zoom-out", "Afastar"),
      button("+", "zoom-in", "Aproximar"),
      button("↺", "reset", "Centralizar visão"),
      button("❚❚", "rotate", "Pausar rotação"),
      button("⛶", "fullscreen", "Tela cheia"),
      button("×", "close", "Fechar"),
    ].forEach(node => tools.appendChild(node));
    heading.textContent = item.title;
    const credit = document.createElement("span");
    credit.textContent = [item.credit && `Crédito: ${item.credit}`, item.license && `Licença: ${item.license}`].filter(Boolean).join(" • ") || "Panorama local do usuário";
    caption.appendChild(credit);
    const page = externalLink("Fonte ↗", item.pageUrl);
    const license = externalLink("Licença ↗", item.licenseUrl);
    if (page) links.appendChild(page);
    if (license) links.appendChild(license);

    let gl;
    let program;
    let texture;
    let resizeObserver;
    let plano = null;   /* preenchido quando a imagem NAO e um 360 de verdade */
    const close = () => {
      cancelAnimationFrame(animation);
      resizeObserver?.disconnect();
      document.removeEventListener("keydown", onKey);
      overlay.remove();
      if (!document.querySelector(".bxvm-overlay,.bx-route-visual-modal")) document.body.classList.remove("bxvm-lock");
      if (typeof options.onClose === "function") options.onClose();
    };
    const fallback = message => {
      cancelAnimationFrame(animation);
      canvas.hidden = true;
      loading.hidden = true;
      const wrap = document.createElement("div");
      wrap.className = "bxvm-pano-fallback";
      const image = document.createElement("img");
      image.src = item.src;
      image.alt = item.title;
      const note = document.createElement("p");
      note.textContent = message || "O navegador abriu a imagem em modo ampliado porque o modo 360° não pôde ser iniciado.";
      wrap.append(image, note);
      stage.appendChild(wrap);
    };
    const resize = () => {
      if (!gl) return;
      const ratio = Math.min(2, window.devicePixelRatio || 1);
      const width = Math.max(1, Math.round(canvas.clientWidth * ratio));
      const height = Math.max(1, Math.round(canvas.clientHeight * ratio));
      if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width;
        canvas.height = height;
      }
      gl.viewport(0, 0, width, height);
    };
    const render = now => {
      resize();
      const elapsed = Math.min(50, now - lastFrame);
      lastFrame = now;
      if (autoRotate && !dragging) yaw += elapsed * .000035;
      gl.useProgram(program);
      gl.uniform1f(gl.getUniformLocation(program, "uYaw"), yaw);
      gl.uniform1f(gl.getUniformLocation(program, "uPitch"), pitch);
      gl.uniform1f(gl.getUniformLocation(program, "uFov"), fov * Math.PI / 180);
      gl.uniform1f(gl.getUniformLocation(program, "uAspect"), canvas.width / Math.max(1, canvas.height));
      gl.drawArrays(gl.TRIANGLES, 0, 6);
      animation = requestAnimationFrame(render);
    };
    const setFov = value => { fov = clamp(value, 28, 105); };
    const toggleRotate = () => {
      autoRotate = !autoRotate;
      const node = $('[data-bxvm-action="rotate"]', tools);
      node.textContent = autoRotate ? "❚❚" : "▶";
      node.title = autoRotate ? "Pausar rotação" : "Continuar rotação";
    };
    const onKey = event => {
      if (event.key === "Escape") close();
      else if (event.key === "ArrowLeft") yaw -= .08;
      else if (event.key === "ArrowRight") yaw += .08;
      else if (event.key === "ArrowUp") pitch = clamp(pitch + .06, -1.35, 1.35);
      else if (event.key === "ArrowDown") pitch = clamp(pitch - .06, -1.35, 1.35);
      else if (event.key === "+" || event.key === "=") setFov(fov - 6);
      else if (event.key === "-") setFov(fov + 6);
    };
    tools.addEventListener("click", event => {
      const action = event.target.closest("[data-bxvm-action]")?.dataset.bxvmAction;
      if (action === "zoom-in") { if (plano) plano.zoom(1.28); else setFov(fov - 7); }
      if (action === "zoom-out") { if (plano) plano.zoom(1 / 1.28); else setFov(fov + 7); }
      if (action === "reset") { if (plano) plano.reset(); else { yaw = pitch = 0; fov = 72; } }
      if (action === "rotate") toggleRotate();
      if (action === "fullscreen") requestFullScreen(dialog);
      if (action === "immersion") {
        close();
        openImmersionFromVisual(item);
      }
      if (action === "close") close();
    });
    canvas.addEventListener("wheel", event => { event.preventDefault(); setFov(fov + event.deltaY * .035); }, { passive: false });
    canvas.addEventListener("pointerdown", event => {
      canvas.setPointerCapture?.(event.pointerId);
      pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
      dragging = true;
      dragPoint = { x: event.clientX, y: event.clientY };
    });
    canvas.addEventListener("pointermove", event => {
      if (!pointers.has(event.pointerId)) return;
      pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
      const values = [...pointers.values()];
      if (values.length > 1) {
        const distance = Math.hypot(values[0].x - values[1].x, values[0].y - values[1].y);
        if (pinchDistance) setFov(fov - (distance - pinchDistance) * .08);
        pinchDistance = distance;
        return;
      }
      if (!dragPoint) return;
      yaw -= (event.clientX - dragPoint.x) * .0045;
      pitch = clamp(pitch + (event.clientY - dragPoint.y) * .004, -1.35, 1.35);
      dragPoint = { x: event.clientX, y: event.clientY };
    });
    const releasePointer = event => {
      pointers.delete(event.pointerId);
      pinchDistance = 0;
      if (!pointers.size) { dragging = false; dragPoint = null; }
    };
    canvas.addEventListener("pointerup", releasePointer);
    canvas.addEventListener("pointercancel", releasePointer);
    overlay.addEventListener("click", event => { if (event.target === overlay) close(); });
    document.addEventListener("keydown", onKey);

    /* ---- Panoramica deslizante --------------------------------------------
       Uma foto 360° de verdade e EQUIRRETANGULAR: 360° na largura por 180° na
       altura — sempre 2:1. Foto comum (4:3) ou panoramica larga (3:1) esticada
       numa esfera fica toda deformada. Nestas, em vez de mentir um 360°, a
       imagem inteira aparece sem deformacao nenhuma e corre para os lados:
       arraste para ir e vir, roda/± para aproximar, ❚❚ para parar. */
    const abrirPlano = () => {
      canvas.hidden = true;
      loading.hidden = true;
      const wrap = document.createElement("div");
      wrap.className = "bxvm-pano-plano";
      const img = document.createElement("img");
      img.src = item.src;
      img.alt = item.title;
      img.draggable = false;
      wrap.appendChild(img);
      const aviso = document.createElement("p");
      aviso.className = "bxvm-pano-nota";
      aviso.textContent = "Esta imagem não é uma foto 360° (esférica). Mostrando em panorâmica deslizante, sem deformação.";
      stage.append(wrap, aviso);
      const eyebrow = $(".bxvm-heading small", overlay);
      if (eyebrow) eyebrow.textContent = "MÍDIA X • PANORÂMICA DESLIZANTE";
      let escala = 1, dx = 0, dy = 0, sentido = 1, arrastando = false, ponto = null, ultimo = performance.now();
      const ajustar = () => {
        const ra = img.naturalWidth / Math.max(1, img.naturalHeight);
        const rc = wrap.clientWidth / Math.max(1, wrap.clientHeight);
        if (ra > rc) { img.style.height = "100%"; img.style.width = "auto"; }
        else { img.style.width = "100%"; img.style.height = "auto"; }
      };
      const sobras = () => ({
        x: Math.max(0, (img.offsetWidth * escala - wrap.clientWidth) / 2),
        y: Math.max(0, (img.offsetHeight * escala - wrap.clientHeight) / 2)
      });
      const pintar = () => {
        img.style.transform = "translate(" + dx.toFixed(1) + "px," + dy.toFixed(1) + "px) scale(" + escala.toFixed(3) + ")";
      };
      const passo = now => {
        const dt = Math.min(50, now - ultimo);
        ultimo = now;
        const s2 = sobras();
        /* o passeio automático vai no eixo que TEM sobra: panorâmica larga corre
           para os lados; foto em pé corre para cima e para baixo. */
        if (autoRotate && !arrastando) {
          if (s2.x > 2) {
            dx += sentido * dt * .028;
            if (dx > s2.x) { dx = s2.x; sentido = -1; }
            if (dx < -s2.x) { dx = -s2.x; sentido = 1; }
          } else if (s2.y > 2) {
            dy += sentido * dt * .028;
            if (dy > s2.y) { dy = s2.y; sentido = -1; }
            if (dy < -s2.y) { dy = -s2.y; sentido = 1; }
          }
        }
        pintar();
        animation = requestAnimationFrame(passo);
      };
      const limitar = () => {
        const s2 = sobras();
        dx = clamp(dx, -s2.x, s2.x);
        dy = clamp(dy, -s2.y, s2.y);
      };
      wrap.addEventListener("pointerdown", event => {
        wrap.setPointerCapture?.(event.pointerId);
        arrastando = true;
        ponto = { x: event.clientX, y: event.clientY };
      });
      wrap.addEventListener("pointermove", event => {
        if (!arrastando || !ponto) return;
        dx += event.clientX - ponto.x;
        dy += event.clientY - ponto.y;
        ponto = { x: event.clientX, y: event.clientY };
        limitar();
        pintar();
      });
      const soltar = () => { arrastando = false; ponto = null; };
      wrap.addEventListener("pointerup", soltar);
      wrap.addEventListener("pointercancel", soltar);
      wrap.addEventListener("wheel", event => {
        event.preventDefault();
        escala = clamp(escala * (event.deltaY < 0 ? 1.12 : 1 / 1.12), 1, 4);
        limitar();
        pintar();
      }, { passive: false });
      const pronto = () => { ajustar(); limitar(); pintar(); animation = requestAnimationFrame(passo); };
      if (img.complete && img.naturalWidth) pronto();
      else { img.onload = pronto; img.onerror = () => fallback("Não foi possível carregar esta imagem panorâmica."); }
      plano = {
        zoom: fator => { escala = clamp(escala * fator, 1, 4); limitar(); pintar(); },
        reset: () => { escala = 1; dx = 0; dy = 0; ajustar(); limitar(); pintar(); }
      };
    };

    try {
      gl = canvas.getContext("webgl", { antialias: true, alpha: false });
      if (!gl) throw new Error("WebGL não disponível");
      program = createProgram(gl,
        `attribute vec2 aPosition; varying vec2 vUv; void main(){vUv=aPosition*.5+.5;gl_Position=vec4(aPosition,0.,1.);}`,
        `precision highp float; varying vec2 vUv; uniform sampler2D uTex; uniform float uYaw; uniform float uPitch; uniform float uFov; uniform float uAspect;
         void main(){vec2 p=vUv*2.-1.;p.x*=uAspect;vec3 d=normalize(vec3(p.x,p.y,-1./tan(uFov*.5)));
         float cp=cos(uPitch),sp=sin(uPitch);d=vec3(d.x,cp*d.y-sp*d.z,sp*d.y+cp*d.z);
         float cy=cos(uYaw),sy=sin(uYaw);d=vec3(cy*d.x-sy*d.z,d.y,sy*d.x+cy*d.z);
         float lon=atan(d.x,-d.z);float lat=asin(clamp(d.y,-1.,1.));vec2 uv=vec2(fract(.5+lon/6.2831853),.5-lat/3.14159265);gl_FragColor=texture2D(uTex,uv);}`
      );
      const buffer = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1,1,-1,-1,1,-1,1,1,-1,1,1]), gl.STATIC_DRAW);
      const position = gl.getAttribLocation(program, "aPosition");
      gl.enableVertexAttribArray(position);
      gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);
      texture = gl.createTexture();
      gl.bindTexture(gl.TEXTURE_2D, texture);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      const image = new Image();
      if (isRemote(item.src)) image.crossOrigin = "anonymous";
      image.onload = () => {
        /* 2:1 (com folga) = equirretangular, o unico caso em que a esfera mostra
           a foto do jeito certo. Qualquer outra proporcao vai para o deslizante. */
        const proporcao = image.width / Math.max(1, image.height);
        if (proporcao < 1.82 || proporcao > 2.24) { abrirPlano(); return; }
        try {
          gl.bindTexture(gl.TEXTURE_2D, texture);
          gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
          const textureLimit = Math.min(8192, gl.getParameter(gl.MAX_TEXTURE_SIZE) || 4096);
          let textureSource = image;
          if (image.width > textureLimit || image.height > textureLimit) {
            const factor = Math.min(textureLimit / image.width, textureLimit / image.height);
            const resized = document.createElement("canvas");
            resized.width = Math.max(1, Math.round(image.width * factor));
            resized.height = Math.max(1, Math.round(image.height * factor));
            resized.getContext("2d", { alpha: false }).drawImage(image, 0, 0, resized.width, resized.height);
            textureSource = resized;
          }
          gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, textureSource);
          loading.hidden = true;
          resizeObserver = window.ResizeObserver ? new ResizeObserver(resize) : null;
          resizeObserver?.observe(stage);
          animation = requestAnimationFrame(render);
        } catch (_) { fallback("A fonte bloqueou a textura 360°; a imagem foi aberta no modo ampliado."); }
      };
      image.onerror = () => fallback("Não foi possível carregar esta imagem panorâmica.");
      image.src = item.src;
    } catch (_) {
      fallback("Este navegador não oferece WebGL para o panorama; a imagem foi aberta no modo ampliado.");
    }
    return { close, reset: () => { yaw = pitch = 0; fov = 72; } };
  }

  let mapboxLoader = null;
  let mapboxConfigPromise = null;

  function loadMapbox() {
    if (window.mapboxgl) return Promise.resolve(window.mapboxgl);
    if (mapboxLoader) return mapboxLoader;
    mapboxLoader = new Promise((resolve, reject) => {
      if (!document.querySelector("link[data-bx-mapbox-css]")) {
        const css = document.createElement("link");
        css.rel = "stylesheet";
        css.href = "https://api.mapbox.com/mapbox-gl-js/v3.15.0/mapbox-gl.css";
        css.dataset.bxMapboxCss = "1";
        document.head.appendChild(css);
      }
      const script = document.createElement("script");
      script.src = "https://api.mapbox.com/mapbox-gl-js/v3.15.0/mapbox-gl.js";
      script.async = true;
      script.onload = () => window.mapboxgl ? resolve(window.mapboxgl) : reject(new Error("Mapbox GL JS não ficou disponível."));
      script.onerror = () => reject(new Error("Não foi possível carregar o Mapbox GL JS. Verifique a internet."));
      document.head.appendChild(script);
    }).catch(error => {
      mapboxLoader = null;
      throw error;
    });
    return mapboxLoader;
  }

  async function mapboxConfig() {
    if (mapboxConfigPromise) return mapboxConfigPromise;
    mapboxConfigPromise = (async () => {
      const inline = String(window.LOGOS_MAPBOX_TOKEN || "").trim();
      if (inline.startsWith("pk.")) return { configured: true, token: inline, web_url: "https://www.mapbox.com/maps" };
      try {
        const response = await fetch("/api/bible/geo/mapbox-config", { headers: { Accept: "application/json" }, cache: "no-store" });
        if (!response.ok) throw new Error(`Mapbox: HTTP ${response.status}`);
        return await response.json();
      } catch (_) {
        return { configured: false, token: "", web_url: "https://www.mapbox.com/maps" };
      }
    })();
    return mapboxConfigPromise;
  }

  function worldUrls(context = {}) {
    const label = String(context.label || context.name || context.query || "Lugar bíblico").trim();
    const lat = Number(context.lat), lng = Number(context.lng);
    const hasCoords = Number.isFinite(lat) && Number.isFinite(lng);
    const location = hasCoords ? `${lat.toFixed(5)},${lng.toFixed(5)}` : label;
    return {
      label,
      hasCoords,
      earth: `https://earth.google.com/web/search/${encodeURIComponent(location)}`,
      maps: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(location)}`,
      street: hasCoords
        ? `https://www.google.com/maps/@?api=1&map_action=pano&viewpoint=${encodeURIComponent(location)}`
        : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(location)}`,
      mapbox: "https://www.mapbox.com/maps",
      openBible: "https://www.openbible.info/geo/atlas/all",
    };
  }

  async function findMapboxCenter(context, token) {
    const lat = Number(context.lat), lng = Number(context.lng);
    if (Number.isFinite(lat) && Number.isFinite(lng)) return [lng, lat];
    const query = String(context.query || context.label || "").trim();
    if (!query) return null;
    const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?access_token=${encodeURIComponent(token)}&limit=1&language=pt-BR`;
    const response = await fetch(url, { headers: { Accept: "application/json" } });
    if (!response.ok) throw new Error(`Mapbox geocoding: HTTP ${response.status}`);
    const data = await response.json();
    const center = data?.features?.[0]?.center;
    return Array.isArray(center) && center.length >= 2 ? [Number(center[0]), Number(center[1])] : null;
  }

  function openWorldExplorer(rawContext = {}) {
    const context = { ...rawContext };
    const urls = worldUrls(context);
    const overlay = shell("world", "MAPAS X • EXPLORAÇÃO ATUAL");
    const dialog = $(".bxvm-dialog", overlay);
    const stage = $(".bxvm-stage", overlay);
    const tools = $(".bxvm-tools", overlay);
    const heading = $(".bxvm-heading h2", overlay);
    const caption = $(".bxvm-caption", overlay);
    const links = $(".bxvm-links", overlay);
    heading.textContent = urls.label;
    tools.append(button("⛶", "fullscreen", "Tela cheia"), button("×", "close", "Fechar"));
    stage.innerHTML = `
      <div class="bxvm-world-layout">
        <section class="bxvm-world-map-panel">
          <div class="bxvm-world-map" data-bx-world-map>
            <div class="bxvm-world-loading"><strong>Preparando exploração geográfica…</strong><small>Mapbox 3D, quando configurado, aparece aqui dentro.</small></div>
          </div>
          <div class="bxvm-world-disclosure">Camada atual para orientação. Google Earth, Street View e relevo não são reconstruções do primeiro século.</div>
        </section>
        <aside class="bxvm-world-side">
          <span class="bxvm-world-kicker">ESCOLHA A CAMADA</span>
          <h3>Conheça o lugar hoje</h3>
          <p>Compare a geografia atual com a leitura bíblica sem misturar evidência moderna e ambientação histórica.</p>
          <nav class="bxvm-world-actions">
            <a class="bxvm-world-link is-primary" href="${urls.earth}" target="_blank" rel="noopener noreferrer">🌍 <b>Google Earth</b><small>satélite, relevo e cidades 3D</small></a>
            <a class="bxvm-world-link" href="${urls.street}" target="_blank" rel="noopener noreferrer">🚶 <b>Google Street View</b><small>panorama atual quando disponível</small></a>
            <a class="bxvm-world-link" href="${urls.maps}" target="_blank" rel="noopener noreferrer">📍 <b>Google Maps</b><small>localização e pesquisa do lugar</small></a>
            <button type="button" class="bxvm-world-link" data-bx-world-retry>🗺️ <b>Mapbox 3D</b><small>mapa interno com token público</small></button>
            <a class="bxvm-world-link" href="${urls.openBible}" target="_blank" rel="noopener noreferrer">📚 <b>OpenBible Atlas</b><small>atlas e geocodificação bíblica</small></a>
          </nav>
          <div class="bxvm-world-status" data-bx-world-status>Verificando se o Mapbox interno está configurado…</div>
        </aside>
      </div>`;
    caption.textContent = "Fontes atuais abertas por link; Mapbox interno é opcional e usa somente token público restrito.";
    [
      ["Google Earth ↗", urls.earth],
      ["Street View ↗", urls.street],
      ["Mapbox ↗", urls.mapbox],
      ["OpenBible ↗", urls.openBible],
    ].forEach(([label, href]) => {
      const link = externalLink(label, href);
      if (link) links.appendChild(link);
    });
    let map = null;
    let closed = false;
    const mapContainer = $("[data-bx-world-map]", stage);
    const status = $("[data-bx-world-status]", stage);
    const close = () => {
      closed = true;
      try { map?.remove?.(); } catch (_) {}
      document.removeEventListener("keydown", onKey);
      overlay.remove();
      if (!document.querySelector(".bxvm-overlay,.bx-route-visual-modal")) document.body.classList.remove("bxvm-lock");
    };
    const onKey = event => { if (event.key === "Escape") close(); };
    const setStatus = (message, tone = "") => {
      if (!status || closed) return;
      status.className = `bxvm-world-status ${tone}`.trim();
      status.textContent = message;
    };
    const renderMapbox = async () => {
      if (closed || !mapContainer) return;
      setStatus("Verificando token público do Mapbox…");
      const config = await mapboxConfig();
      const token = String(config?.token || "").trim();
      if (!config?.configured || !token.startsWith("pk.")) {
        mapContainer.innerHTML = `<div class="bxvm-world-no-map"><span>🗺️</span><strong>Mapbox interno está opcional</strong><p>Para mostrar o mapa dentro do Logos, configure <code>MAPBOX_PUBLIC_TOKEN=pk.*</code> no servidor. Sem isso, os botões Google Earth, Street View e Mapbox continuam funcionando por link.</p><a href="${urls.mapbox}" target="_blank" rel="noopener noreferrer">Abrir Mapbox ↗</a></div>`;
        setStatus("Mapbox não configurado • links externos disponíveis", "warn");
        return;
      }
      try {
        const center = await findMapboxCenter(context, token);
        if (closed) return;
        if (!center) throw new Error("Não encontrei coordenadas para este lugar.");
        const mapboxgl = await loadMapbox();
        if (closed) return;
        mapboxgl.accessToken = token;
        mapContainer.replaceChildren();
        map = new mapboxgl.Map({
          container: mapContainer,
          style: "mapbox://styles/mapbox/satellite-streets-v12",
          center,
          zoom: urls.hasCoords ? 8.2 : 6.5,
          pitch: 48,
          bearing: -12,
          antialias: true,
        });
        map.addControl(new mapboxgl.NavigationControl({ visualizePitch: true }), "top-right");
        map.addControl(new mapboxgl.FullscreenControl(), "top-right");
        new mapboxgl.Marker({ color: "#d4a63a" }).setLngLat(center).setPopup(new mapboxgl.Popup({ offset: 18 }).setText(urls.label)).addTo(map);
        map.once("load", () => {
          if (closed || !map) return;
          try {
            map.addSource("bx-terrain", { type: "raster-dem", url: "mapbox://mapbox.mapbox-terrain-dem-v1", tileSize: 512, maxzoom: 14 });
            map.setTerrain({ source: "bx-terrain", exaggeration: 1.12 });
          } catch (_) {}
          setStatus("Mapbox 3D ativo • relevo atual", "ok");
        });
        map.on("error", event => { if (event?.error?.message) setStatus(`Mapbox: ${event.error.message}`, "warn"); });
      } catch (error) {
        mapContainer.innerHTML = `<div class="bxvm-world-no-map"><span>⚠️</span><strong>Mapbox não pôde ser carregado</strong><p>${String(error?.message || error)}</p><a href="${urls.mapbox}" target="_blank" rel="noopener noreferrer">Abrir Mapbox ↗</a></div>`;
        setStatus("Falha no Mapbox • usando links externos", "warn");
      }
    };
    tools.addEventListener("click", event => {
      const action = event.target.closest("[data-bxvm-action]")?.dataset.bxvmAction;
      if (action === "fullscreen") requestFullScreen(dialog);
      if (action === "close") close();
    });
    $("[data-bx-world-retry]", stage)?.addEventListener("click", renderMapbox);
    overlay.addEventListener("click", event => { if (event.target === overlay) close(); });
    document.addEventListener("keydown", onKey);
    renderMapbox();
    return { close, reload: renderMapbox };
  }

  window.BibleXVisualMedia = {
    version: VERSION,
    openGallery,
    openPanorama,
    openWorldExplorer,
    mountPublicSourceHub,
    present(items, startIndex = 0, options = {}) {
      return openGallery(items, startIndex, { ...options, autoplay: true, eyebrow: options.eyebrow || "MÍDIA X • APRESENTAÇÃO" });
    },
    fullscreen: requestFullScreen,
  };
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", initPublicSourceHub, { once: true });
  else initPublicSourceHub();
})();
