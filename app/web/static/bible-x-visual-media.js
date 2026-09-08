(function () {
  "use strict";

  const VERSION = "5.4.243";
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
        script.src = "/static/bible-x-ai-media.js?v=5.4.243";
        script.dataset.bxAiMedia = "1";
        script.onload = () => window.BibleXAIMedia?.open ? resolve(window.BibleXAIMedia) : reject(new Error("Ateliê IA não ficou disponível."));
        script.onerror = () => reject(new Error("Não foi possível carregar o Ateliê IA."));
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
    nav.appendChild(sourceAction("✨ Ateliê IA", "ai", "Gerar imagem ou vídeo para esta passagem"));
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
      button("▶", "play", "Iniciar apresentação"),
      button("⛶", "fullscreen", "Tela cheia"),
      button("×", "close", "Fechar"),
    ].forEach(node => tools.appendChild(node));

    const applyTransform = () => {
      image.style.transform = `translate3d(${offsetX}px,${offsetY}px,0) scale(${scale})`;
      viewport.classList.toggle("zoomed", scale > 1.01);
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
      applyTransform();
      loading.hidden = false;
      image.classList.remove("loaded");
      image.alt = item.title;
      image.src = item.src;
      renderInfo(item);
      previous.hidden = next.hidden = items.length < 2;
    };
    const close = () => {
      stopSlides();
      document.removeEventListener("keydown", onKey);
      overlay.remove();
      if (!document.querySelector(".bxvm-overlay,.bx-route-visual-modal")) document.body.classList.remove("bxvm-lock");
      if (typeof options.onClose === "function") options.onClose();
    };
    const onKey = event => {
      if (event.key === "Escape") close();
      else if (event.key === "ArrowLeft") show(index - 1);
      else if (event.key === "ArrowRight") show(index + 1);
      else if (event.key === "+" || event.key === "=") setScale(scale + 0.25);
      else if (event.key === "-") setScale(scale - 0.25);
      else if (event.key.toLowerCase() === "f") requestFullScreen(dialog);
      else if (event.key === " ") { event.preventDefault(); toggleSlides(); }
    };

    image.addEventListener("load", () => { loading.hidden = true; image.classList.add("loaded"); });
    image.addEventListener("error", () => { loading.textContent = "Não foi possível carregar esta imagem."; });
    viewport.addEventListener("wheel", event => { event.preventDefault(); setScale(scale + (event.deltaY < 0 ? .25 : -.25)); }, { passive: false });
    viewport.addEventListener("pointerdown", event => {
      viewport.setPointerCapture?.(event.pointerId);
      if (scale > 1.01) {
        dragging = true;
        dragStart = { x: event.clientX, y: event.clientY, ox: offsetX, oy: offsetY };
      } else swipeStart = { x: event.clientX, y: event.clientY };
    });
    viewport.addEventListener("pointermove", event => {
      if (!dragging || !dragStart) return;
      offsetX = dragStart.ox + event.clientX - dragStart.x;
      offsetY = dragStart.oy + event.clientY - dragStart.y;
      applyTransform();
    });
    viewport.addEventListener("pointerup", event => {
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
      if (action === "play") toggleSlides();
      if (action === "fullscreen") requestFullScreen(dialog);
      if (action === "immersion") {
        close();
        openImmersionFromVisual(item);
      }
      if (action === "close") close();
    });
    previous.addEventListener("click", () => show(index - 1));
    next.addEventListener("click", () => show(index + 1));
    overlay.addEventListener("click", event => { if (event.target === overlay) close(); });
    document.addEventListener("keydown", onKey);
    show(index);
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
      if (action === "zoom-in") setFov(fov - 7);
      if (action === "zoom-out") setFov(fov + 7);
      if (action === "reset") { yaw = pitch = 0; fov = 72; }
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

    try {
      gl = canvas.getContext("webgl", { antialias: true, alpha: false });
      if (!gl) throw new Error("WebGL não disponível");
      program = createProgram(gl,
        `attribute vec2 aPosition; varying vec2 vUv; void main(){vUv=aPosition*.5+.5;gl_Position=vec4(aPosition,0.,1.);}`,
        `precision highp float; varying vec2 vUv; uniform sampler2D uTex; uniform float uYaw; uniform float uPitch; uniform float uFov; uniform float uAspect;
         void main(){vec2 p=vUv*2.-1.;p.x*=uAspect;vec3 d=normalize(vec3(p.x,-p.y,-1./tan(uFov*.5)));
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
