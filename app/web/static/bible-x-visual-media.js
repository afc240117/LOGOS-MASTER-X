(function () {
  "use strict";

  const VERSION = "5.3.9";
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

  function requestFullScreen(node) {
    if (document.fullscreenElement) return document.exitFullscreen?.();
    return node.requestFullscreen?.();
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

  window.BibleXVisualMedia = {
    version: VERSION,
    openGallery,
    openPanorama,
    present(items, startIndex = 0, options = {}) {
      return openGallery(items, startIndex, { ...options, autoplay: true, eyebrow: options.eyebrow || "MÍDIA X • APRESENTAÇÃO" });
    },
    fullscreen: requestFullScreen,
  };
})();
