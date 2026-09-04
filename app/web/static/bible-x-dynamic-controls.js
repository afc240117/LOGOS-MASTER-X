/* LOGOS MASTER X 5.3.9 — controles resilientes, referências em pop-up e comando central */
(() => {
  "use strict";
  if (window.__LMX_BX_CONTROL_REPAIR_535__) return;
  window.__LMX_BX_CONTROL_REPAIR_535__ = true;

  const PAGE_ZOOM_KEY = "logosx:bibleXPageZoom";
  const DYNAMIC_KEY = "logosx:bibleXDynamicControls";
  const READER_CLEAN_KEY = "logosx:bibleXCleanReading";
  let nativeFullscreenOwned = false;
  let fullscreenBibleZoom = null;

  const $ = (selector, root = document) => root?.querySelector?.(selector) || null;
  const $$ = (selector, root = document) => [...(root?.querySelectorAll?.(selector) || [])];
  const clamp = (value, min, max) => Math.max(min, Math.min(max, Number(value) || min));
  const shell = () => $(".bible-x-shell");
  const activePanel = () => $(".bible-x-shell [data-bible-panel].active:not([hidden])");
  const currentId = () => activePanel()?.dataset?.biblePanel || "reader";
  const panelById = id => $(`.bible-x-shell [data-bible-panel="${String(id).replace(/[^a-zA-Z0-9_-]/g, "")}"]`);
  const navButton = id => $(`.bible-x-nav [data-bible-section="${String(id).replace(/[^a-zA-Z0-9_-]/g, "")}"]`);

  function readJson(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      return raw === null ? fallback : JSON.parse(raw);
    } catch (_) { return fallback; }
  }

  function writeJson(key, value) {
    try { localStorage.setItem(key, JSON.stringify(value)); } catch (_) {}
    return value;
  }

  function setText(node, value) {
    if (node && node.textContent !== value) node.textContent = value;
  }

  function pageMeta(id = currentId()) {
    const button = navButton(id);
    return {
      icon: $("i", button)?.textContent?.trim() || "📖",
      title: $("b", button)?.textContent?.trim() || "Bíblia X",
      description: $("small", button)?.textContent?.trim() || "Módulo da Bíblia X",
    };
  }

  function ensureModuleSelect() {
    const select = $("#bxPageSelect");
    if (!select) return;
    const buttons = $$(".bible-x-nav [data-bible-section]");
    const signature = buttons.map(button => button.dataset.bibleSection).join("|");
    if (select.dataset.signature !== signature) {
      select.replaceChildren(...buttons.map(button => {
        const option = document.createElement("option");
        const id = button.dataset.bibleSection;
        const meta = pageMeta(id);
        option.value = id;
        option.textContent = `${meta.icon} ${meta.title}`;
        return option;
      }));
      select.dataset.signature = signature;
      select.dataset.bxRepairOwner = "true";
    }
    if (select.dataset.bxRepairOwner === "true" && select.dataset.bxRepairBound !== "true") {
      select.dataset.bxRepairBound = "true";
      select.addEventListener("change", () => {
        const id = select.value;
        const inheritedZoom = getFullscreenZoom();
        if (inheritedZoom !== null) setZoom(id, inheritedZoom);
        const button = navButton(id);
        if (button) button.click();
        else window.__bibleXActivate?.(id, { smooth: false });
        setTimeout(() => sync(id), 0);
      });
    }
    const id = currentId();
    if ($$("option", select).some(option => option.value === id)) select.value = id;
    const host = shell();
    host?.classList?.add("bx-central-nav-ready");
    $(".bible-x-sidebar", host)?.setAttribute?.("aria-hidden", "true");
  }

  function zoomState() {
    const value = readJson(PAGE_ZOOM_KEY, {});
    return value && typeof value === "object" && !Array.isArray(value) ? value : {};
  }

  function getZoom(id = currentId()) {
    const value = Number(zoomState()[id] || 100);
    return clamp(Number.isFinite(value) ? value : 100, 70, 160);
  }

  function setZoom(id, value) {
    const next = clamp(value, 70, 160);
    const state = zoomState();
    state[id] = next;
    writeJson(PAGE_ZOOM_KEY, state);
    const panel = panelById(id);
    if (panel) {
      const ratio = next / 100;
      const nativeZoom = Boolean(window.CSS?.supports?.("zoom", "110%"));
      panel.dataset.bxPageZoom = String(next);
      panel.style.setProperty("--bx-page-zoom", String(ratio));
      panel.style.setProperty("--bx-page-zoom-percent", `${next}%`);
      panel.classList.toggle("bx-page-zoom-fallback", !nativeZoom);
      if (nativeZoom) {
        panel.style.setProperty("zoom", `${next}%`, "important");
        panel.style.removeProperty("transform");
        panel.style.removeProperty("width");
      } else {
        panel.style.removeProperty("zoom");
        panel.style.transform = `scale(${ratio})`;
        panel.style.width = `${100 / ratio}%`;
      }
    }
    setText($("#bxPageZoomReset"), `${next}%`);
    setText($("#bxDynamicPageZoom"), `${next}%`);
    $("#bxPageZoomReset")?.setAttribute?.("aria-label", `Zoom atual ${next}%. Restaurar para 100%.`);
    return next;
  }

  function isPageFullscreen() {
    return Boolean(shell()?.classList?.contains("bx-page-full"));
  }

  function getFullscreenZoom() {
    if (!isPageFullscreen()) return null;
    if (fullscreenBibleZoom === null) fullscreenBibleZoom = getZoom("reader");
    return fullscreenBibleZoom;
  }

  function setFullscreenZoom(value, id = currentId()) {
    const next = clamp(value, 70, 160);
    fullscreenBibleZoom = next;
    const root = shell();
    if (root?.dataset) root.dataset.bxFullscreenZoom = String(next);
    setZoom("reader", next);
    if (id !== "reader") setZoom(id, next);
    return next;
  }

  function zoom(delta) {
    const id = currentId();
    const shared = getFullscreenZoom();
    if (shared !== null) return setFullscreenZoom(Number(delta) === 0 ? 100 : shared + Number(delta || 0), id);
    return setZoom(id, Number(delta) === 0 ? 100 : getZoom(id) + Number(delta || 0));
  }

  function setFullUi(on) {
    const root = shell();
    if (!root) return false;
    if (on) {
      if (fullscreenBibleZoom === null) fullscreenBibleZoom = getZoom("reader");
      root.dataset.bxFullscreenZoom = String(fullscreenBibleZoom);
      setZoom(currentId(), fullscreenBibleZoom);
    }
    root.classList.toggle("bx-page-full", Boolean(on));
    root.classList.remove("bx-reading-full");
    document.body?.classList?.toggle("bx-page-lock", Boolean(on));
    document.body?.classList?.remove("logos-reader-lock");
    document.documentElement?.classList?.toggle("bx-page-lock", Boolean(on));
    $$(".bible-x-shell [data-bible-panel]").forEach(panel => panel.classList.toggle("bx-page-full-active", Boolean(on) && panel === activePanel()));
    const enter = $("#bxPageFullBtn");
    const exit = $("#bxPageExitFullBtn");
    if (enter) { enter.hidden = Boolean(on); enter.setAttribute?.("aria-pressed", on ? "true" : "false"); }
    if (exit) exit.hidden = !on;
    if (on) { root.scrollTop = 0; activePanel()?.scrollIntoView?.({ block: "start" }); }
    else {
      delete root.dataset.bxFullscreenZoom;
      fullscreenBibleZoom = null;
    }
    try { document.dispatchEvent(new CustomEvent("biblex:fullscreenchange", { detail: { on: Boolean(on) } })); } catch (_) {}
    return false;
  }

  async function full(on) {
    const root = shell();
    if (!root) return false;
    /* 5.4.163 — no celular evita o Fullscreen API nativo (mensagem "…onrender.com ·
       arraste para cima" do Chrome/Android); a emulacao CSS .bx-page-full ja cobre. */
    const fsNativeOk = typeof window.matchMedia !== "function" || !window.matchMedia("(max-width:760px)").matches;
    setFullUi(Boolean(on));
    if (on) {
      const request = root.requestFullscreen || root.webkitRequestFullscreen;
      if (request && !document.fullscreenElement && !document.webkitFullscreenElement && fsNativeOk) {
        try { await request.call(root, { navigationUI: "hide" }); nativeFullscreenOwned = true; }
        catch (_) { nativeFullscreenOwned = false; }
      }
    } else {
      const fullscreenElement = document.fullscreenElement || document.webkitFullscreenElement;
      const exit = document.exitFullscreen || document.webkitExitFullscreen;
      if (fullscreenElement && exit) { try { await exit.call(document); } catch (_) {} }
      nativeFullscreenOwned = false;
    }
    return false;
  }

  function dynamicState() {
    const value = readJson(DYNAMIC_KEY, { version: 1, modules: {}, reader: {} });
    if (!value || typeof value !== "object") return { version: 1, modules: {}, reader: {} };
    value.modules ||= {};
    value.reader ||= {};
    return value;
  }

  function readerClean() { return readJson(READER_CLEAN_KEY, true) !== false; }

  function applyClean(id = currentId()) {
    let on;
    const panel = panelById(id);
    if (id === "reader") {
      on = readerClean();
      $("#bOut")?.classList?.toggle("bx-clean-reading", on);
      shell()?.classList?.toggle("bx-clean-reading-mode", on);
    } else {
      on = Boolean(dynamicState().modules[id]?.clean);
      panel?.classList?.toggle("bx-module-clean", on);
    }
    const top = $("#bxDynamicTopClean");
    if (top) {
      top.classList.toggle("active", on);
      top.setAttribute?.("aria-pressed", on ? "true" : "false");
      setText(top, on ? "✨ Clean: ON" : "✨ Clean: OFF");
    }
    const drawer = $("#bxDynamicClean");
    if (drawer) {
      drawer.classList.toggle("active", on);
      drawer.setAttribute?.("aria-pressed", on ? "true" : "false");
      setText(drawer, on ? "✨ Clean: ON" : "✨ Modo clean");
    }
    return on;
  }

  function clean() {
    const id = currentId();
    if (id === "reader") writeJson(READER_CLEAN_KEY, !readerClean());
    else {
      const state = dynamicState();
      state.modules[id] = { theme: "dark", width: "comfortable", spacing: "comfortable", ...(state.modules[id] || {}), clean: !state.modules[id]?.clean };
      writeJson(DYNAMIC_KEY, state);
    }
    const on = applyClean(id);
    try { document.dispatchEvent(new CustomEvent("biblex:controlschange", { detail: { id, clean: on } })); } catch (_) {}
    return on;
  }

  function sync(id = currentId()) {
    const root = shell();
    if (!root) return false;
    ensureModuleSelect();
    id = panelById(id) ? id : currentId();
    root.dataset.bxPage = id;
    const meta = pageMeta(id);
    setText($("#bxPageTitle"), `${meta.icon} ${meta.title}`);
    setText($("#bxPageDescription"), meta.description);
    const select = $("#bxPageSelect");
    if (select && $$("option", select).some(option => option.value === id)) select.value = id;
    const inheritedZoom = getFullscreenZoom();
    setZoom(id, inheritedZoom === null ? getZoom(id) : inheritedZoom);
    applyClean(id);
    return true;
  }

  document.addEventListener("click", event => {
    const button = event.target?.closest?.("[data-bx-page-action]");
    if (!button) return;
    event.preventDefault?.();
    event.stopImmediatePropagation?.();
    const action = button.dataset.bxPageAction;
    if (action === "smaller") zoom(-10);
    if (action === "reset") zoom(0);
    if (action === "larger") zoom(10);
    if (action === "fullscreen") full(true);
    if (action === "exit") full(false);
  }, true);

  document.addEventListener("click", event => {
    const button = event.target?.closest?.("[data-bx-control-action]");
    if (!button) return;
    event.preventDefault?.();
    event.stopImmediatePropagation?.();
    if (button.dataset.bxControlAction === "clean") clean();
  }, true);

  document.addEventListener("biblex:pagechange", event => sync(event.detail?.id || currentId()));
  document.addEventListener("fullscreenchange", () => {
    if (nativeFullscreenOwned && !document.fullscreenElement && shell()?.classList.contains("bx-page-full")) { nativeFullscreenOwned = false; setFullUi(false); }
  });
  document.addEventListener("webkitfullscreenchange", () => {
    if (nativeFullscreenOwned && !document.webkitFullscreenElement && shell()?.classList.contains("bx-page-full")) { nativeFullscreenOwned = false; setFullUi(false); }
  });
  document.addEventListener("keydown", event => {
    if (event.key === "Escape" && shell()?.classList.contains("bx-page-full")) full(false);
    if ((event.ctrlKey || event.metaKey) && ["+", "=", "-", "0"].includes(event.key)) {
      event.preventDefault();
      if (event.key === "-") zoom(-10); else if (event.key === "0") zoom(0); else zoom(10);
    }
  });

  new MutationObserver(() => {
    if (!shell()) return;
    ensureModuleSelect();
    const id = currentId();
    const panel = panelById(id);
    if (panel && !panel.dataset.bxPageZoom) setZoom(id, getZoom(id));
    applyClean(id);
  }).observe(document.body, { childList: true, subtree: true });

  window.LMXBXControlRepair = Object.freeze({ version: "5.3.9", sync, zoom, full, clean, current: currentId, getZoom, fullscreenZoom: getFullscreenZoom });
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", () => sync(), { once: true });
  else sync();
})();

/* LOGOS MASTER X 5.3.9 — painel universal e leitura dinâmica da Bíblia X */
(() => {
  "use strict";
  if (window.__LMX_BX_DYNAMIC_CONTROLS__) return;
  window.__LMX_BX_DYNAMIC_CONTROLS__ = true;

  const VERSION = "5.3.9";
  const STORAGE_KEY = "logosx:bibleXDynamicControls";
  const DEFAULT_MODULE = Object.freeze({ theme: "dark", width: "comfortable", spacing: "comfortable", clean: false });
  const DEFAULT_READER = Object.freeze({ font: 100, speed: 2, focus: false });
  const SPEEDS = [12, 22, 36, 54, 78];
  let drawerOpen = false;
  let autoReading = false;
  let autoFrame = 0;
  let autoLast = 0;
  let progressFrame = 0;

  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
  const clamp = (value, min, max) => Math.max(min, Math.min(max, Number(value) || min));
  const currentId = () => $(".bible-x-shell [data-bible-panel].active:not([hidden])")?.dataset.biblePanel || "reader";
  const activePanel = () => $(".bible-x-shell [data-bible-panel].active:not([hidden])");

  function readState() {
    try {
      const value = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
      return value && typeof value === "object" ? value : { version: 1, modules: {}, reader: {} };
    } catch (_) {
      return { version: 1, modules: {}, reader: {} };
    }
  }

  function writeState(state) {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch (_) {}
    return state;
  }

  function modulePrefs(id = currentId()) {
    const state = readState();
    return { ...DEFAULT_MODULE, ...(state.modules?.[id] || {}) };
  }

  function readerPrefs() {
    const state = readState();
    return { ...DEFAULT_READER, ...(state.reader || {}) };
  }

  function saveModule(patch, id = currentId()) {
    const state = readState();
    state.modules ||= {};
    state.modules[id] = { ...DEFAULT_MODULE, ...(state.modules[id] || {}), ...patch };
    writeState(state);
    apply(id);
    return state.modules[id];
  }

  function saveReader(patch) {
    const state = readState();
    state.reader = { ...DEFAULT_READER, ...(state.reader || {}), ...patch };
    writeState(state);
    apply("reader");
    return state.reader;
  }

  function storeLegacy(key, value) {
    try {
      if (typeof Store !== "undefined" && Store?.set) Store.set(key, value);
      else localStorage.setItem("logosx:" + key, JSON.stringify(value));
    } catch (_) {}
  }

  function readerClean() {
    try {
      if (typeof Store !== "undefined" && Store?.get) return Store.get("bibleXCleanReading", true) !== false;
      const value = localStorage.getItem("logosx:bibleXCleanReading");
      return value === null ? true : JSON.parse(value) !== false;
    } catch (_) { return true; }
  }

  function panelMeta(id = currentId()) {
    const nav = $(`.bible-x-nav [data-bible-section="${id}"]`);
    return {
      icon: $("i", nav)?.textContent?.trim() || "📖",
      title: $("b", nav)?.textContent?.trim() || "Bíblia X",
      description: $("small", nav)?.textContent?.trim() || "Módulo da Bíblia X",
    };
  }

  function ensureDrawer() {
    const shell = $(".bible-x-shell");
    if (!shell || $("#bxDynamicPanel")) return Boolean(shell);
    shell.insertAdjacentHTML("beforeend", `
      <div class="bx-dynamic-backdrop" id="bxDynamicBackdrop" data-bx-dynamic-action="close" hidden></div>
      <aside class="bx-dynamic-panel" id="bxDynamicPanel" role="dialog" aria-modal="true" aria-labelledby="bxDynamicTitle" hidden>
        <header class="bx-dynamic-head">
          <div><small>PAINEL UNIVERSAL • BÍBLIA X</small><h3 id="bxDynamicTitle">Opções de leitura</h3><p id="bxDynamicSubtitle">Preferências exclusivas deste módulo.</p></div>
          <button type="button" data-bx-dynamic-action="close" aria-label="Fechar opções">×</button>
        </header>
        <div class="bx-dynamic-scroll">
          <section class="bx-dynamic-card">
            <div class="bx-dynamic-card-title"><span>◫</span><div><h4>Conteúdo do módulo</h4><p>Zoom, largura, tema e espaçamento são salvos separadamente em cada página.</p></div></div>
            <div class="bx-dynamic-control">
              <label>Zoom da página</label>
              <div class="bx-dynamic-stepper" role="group" aria-label="Zoom do módulo">
                <button type="button" data-bx-page-action="smaller" aria-label="Diminuir zoom">A−</button>
                <button type="button" data-bx-page-action="reset" id="bxDynamicPageZoom">100%</button>
                <button type="button" data-bx-page-action="larger" aria-label="Aumentar zoom">A+</button>
              </div>
            </div>
            <div class="bx-dynamic-fields">
              <label>Tema<select id="bxDynamicTheme"><option value="dark">Escuro</option><option value="sepia">Sépia</option><option value="midnight">Azul noturno</option><option value="contrast">Alto contraste</option></select></label>
              <label>Largura<select id="bxDynamicWidth"><option value="narrow">Estreita</option><option value="comfortable">Confortável</option><option value="wide">Ampla</option></select></label>
              <label>Espaçamento<select id="bxDynamicSpacing"><option value="compact">Compacto</option><option value="comfortable">Confortável</option><option value="relaxed">Arejado</option></select></label>
            </div>
            <div class="bx-dynamic-actions">
              <button type="button" data-bx-dynamic-action="clean" id="bxDynamicClean">✨ Modo clean</button>
              <button type="button" data-bx-dynamic-action="fullscreen">⛶ Tela cheia</button>
              <button type="button" data-bx-dynamic-action="reset-module">↺ Restaurar módulo</button>
            </div>
          </section>

          <section class="bx-dynamic-card bx-dynamic-reader-only" data-bx-reader-only>
            <div class="bx-dynamic-card-title"><span>📖</span><div><h4>Leitura dinâmica da Bíblia</h4><p>Aumente somente o texto, acompanhe o progresso e use rolagem automática.</p></div></div>
            <div class="bx-dynamic-control">
              <label>Fonte do texto bíblico</label>
              <div class="bx-dynamic-stepper" role="group" aria-label="Tamanho da fonte bíblica">
                <button type="button" data-bx-dynamic-action="font-smaller" aria-label="Diminuir fonte">A−</button>
                <button type="button" data-bx-dynamic-action="font-reset" id="bxDynamicReaderFont">100%</button>
                <button type="button" data-bx-dynamic-action="font-larger" aria-label="Aumentar fonte">A+</button>
              </div>
            </div>
            <div class="bx-dynamic-reader-buttons">
              <button type="button" data-bx-dynamic-action="focus" id="bxDynamicFocus" aria-pressed="false">◎ Modo foco</button>
              <button type="button" data-bx-dynamic-action="auto" id="bxDynamicAuto" aria-pressed="false">▶ Leitura automática</button>
            </div>
            <label class="bx-dynamic-speed">Velocidade <input id="bxDynamicSpeed" type="range" min="1" max="5" step="1" value="2"><output id="bxDynamicSpeedOut">2/5</output></label>
            <div class="bx-dynamic-progress" aria-label="Progresso da leitura"><i id="bxDynamicProgressBar"></i><span id="bxDynamicProgressText">0%</span></div>
            <small class="bx-dynamic-auto-hint">A rolagem pausa no fim do texto. Toque em “Pausar” a qualquer momento.</small>
          </section>

          <section class="bx-dynamic-card">
            <div class="bx-dynamic-card-title"><span>✨</span><div><h4>Sugestões rápidas</h4><p id="bxDynamicSuggestionText">Ações recomendadas para a página atual.</p></div></div>
            <div class="bx-dynamic-suggestions" id="bxDynamicSuggestions"></div>
          </section>

          <details class="bx-dynamic-shortcuts">
            <summary>⌨ Atalhos de teclado</summary>
            <div><kbd>Alt</kbd> + <kbd>O</kbd><span>Abrir opções</span><kbd>Alt</kbd> + <kbd>F</kbd><span>Tela cheia</span><kbd>Alt</kbd> + <kbd>C</kbd><span>Modo clean</span><kbd>Alt</kbd> + <kbd>↑ / ↓</kbd><span>Aumentar / diminuir</span><kbd>Alt</kbd> + <kbd>A</kbd><span>Leitura automática</span><kbd>Esc</kbd><span>Fechar / sair</span></div>
          </details>

        </div>
      </aside>
      <button type="button" class="bx-dynamic-auto-float" id="bxDynamicAutoFloat" data-bx-dynamic-action="auto" aria-label="Pausar leitura automática" hidden>❚❚ Pausar leitura</button>`);
    return true;
  }

  function setDrawer(on) {
    if (!ensureDrawer()) return false;
    drawerOpen = Boolean(on);
    const drawer = $("#bxDynamicPanel");
    const backdrop = $("#bxDynamicBackdrop");
    drawer.hidden = !drawerOpen;
    backdrop.hidden = !drawerOpen;
    document.body.classList.toggle("bx-dynamic-open", drawerOpen);
    const trigger = $("#bxReadingOptionsBtn");
    trigger?.setAttribute("aria-expanded", drawerOpen ? "true" : "false");
    if (drawerOpen) {
      sync();
      setTimeout(() => $("[data-bx-dynamic-action='close']", drawer)?.focus(), 20);
    }
    return false;
  }

  function apply(id = currentId(), refreshUi = true) {
    const panel = $(`.bible-x-shell [data-bible-panel="${id}"]`);
    if (!panel) return;
    const prefs = modulePrefs(id);
    panel.dataset.bxReadingTheme = prefs.theme;
    panel.dataset.bxReadingWidth = prefs.width;
    panel.dataset.bxReadingSpacing = prefs.spacing;
    panel.classList.toggle("bx-module-clean", Boolean(prefs.clean));
    panel.style.setProperty("--bx-dynamic-line", prefs.spacing === "compact" ? "1.35" : prefs.spacing === "relaxed" ? "1.85" : "1.58");

    if (id === "reader") {
      const reader = readerPrefs();
      const out = $("#bOut");
      /* 5.4.102 — Zoom: fonte ÚNICA de verdade = Store bibleXZoom (comandado pelos
         botões novos A+/A−/Zoom 100 — V8.15 no app-381). Antes este apply() reescrevia
         bibleXZoom = reader.font (100) a cada mutação do DOM (MutationObserver na
         linha ~782), ZERRANDO o zoom recém-ajustado pelo usuário. Agora apenas
         ESPELHA o bibleXZoom corrente. */
      const z = Math.max(70, Math.min(190, Number(Store.get("bibleXZoom", 100)) || 100));
      if (out) {
        out.style.setProperty("--bx-reader-scale", String(z / 100));
        out.dataset.bxZoom = String(z);
        out.classList.toggle("bx-dynamic-focus", Boolean(reader.focus));
        if (!reader.focus) clearFocusedVerse();
        else updateFocusedVerse();
      }
    }
    if (refreshUi) updateUi(id);
  }

  function updateUi(id = currentId()) {
    const meta = panelMeta(id);
    const prefs = modulePrefs(id);
    const reader = readerPrefs();
    const title = $("#bxDynamicTitle");
    const subtitle = $("#bxDynamicSubtitle");
    if (title) title.textContent = `${meta.icon} Opções de ${meta.title}`;
    if (subtitle) subtitle.textContent = `Preferências exclusivas de ${meta.title}.`;
    if ($("#bxDynamicTheme")) $("#bxDynamicTheme").value = prefs.theme;
    if ($("#bxDynamicWidth")) $("#bxDynamicWidth").value = prefs.width;
    if ($("#bxDynamicSpacing")) $("#bxDynamicSpacing").value = prefs.spacing;
    const cleanOn = id === "reader" ? readerClean() : prefs.clean;
    const clean = $("#bxDynamicClean");
    if (clean) { clean.classList.toggle("active", cleanOn); clean.setAttribute("aria-pressed", cleanOn ? "true" : "false"); clean.textContent = cleanOn ? "✨ Clean: ON" : "✨ Modo clean"; }
    const topClean = $("#bxDynamicTopClean");
    if (topClean) { topClean.classList.toggle("active", cleanOn); topClean.setAttribute("aria-pressed", cleanOn ? "true" : "false"); topClean.textContent = cleanOn ? "✨ Clean: ON" : "✨ Clean: OFF"; }
    $$('[data-bx-reader-only]').forEach(node => node.hidden = id !== "reader");
    if ($("#bxDynamicReaderFont")) $("#bxDynamicReaderFont").textContent = `${clamp(reader.font, 70, 190)}%`;
    if ($("#bxDynamicSpeed")) $("#bxDynamicSpeed").value = String(clamp(reader.speed, 1, 5));
    if ($("#bxDynamicSpeedOut")) $("#bxDynamicSpeedOut").textContent = `${clamp(reader.speed, 1, 5)}/5`;
    const focus = $("#bxDynamicFocus");
    if (focus) { focus.classList.toggle("active", reader.focus); focus.setAttribute("aria-pressed", reader.focus ? "true" : "false"); focus.textContent = reader.focus ? "◎ Foco: ON" : "◎ Modo foco"; }
    const auto = $("#bxDynamicAuto");
    if (auto) { auto.classList.toggle("active", autoReading); auto.setAttribute("aria-pressed", autoReading ? "true" : "false"); auto.textContent = autoReading ? "❚❚ Pausar leitura" : "▶ Leitura automática"; }
    const autoFloat = $("#bxDynamicAutoFloat");
    if (autoFloat) { autoFloat.hidden = !autoReading; autoFloat.textContent = `❚❚ Pausar • ${clamp(reader.speed, 1, 5)}/5`; }
    const zoom = activePanel()?.dataset.bxPageZoom || "100";
    if ($("#bxDynamicPageZoom")) $("#bxDynamicPageZoom").textContent = `${zoom}%`;
    renderSuggestions(id);
    updateProgress();
  }

  function renderSuggestions(id) {
    const host = $("#bxDynamicSuggestions");
    const text = $("#bxDynamicSuggestionText");
    if (!host || !text) return;
    let description = "Use modo confortável e tela cheia para reduzir distrações.";
    let rows = [
      ["☕ Leitura confortável", "comfortable"],
      ["⛶ Tela cheia", "fullscreen"],
      ["↺ 100%", "page-reset"],
    ];
    if (id === "reader") {
      description = "Para capítulos longos: fonte 120%, largura estreita, sépia e rolagem automática.";
      rows = [["☕ Preset confortável", "reader-comfort"], ["▶ Leitura automática", "auto"], ["◎ Foco no versículo", "focus"], ["⛶ Tela cheia", "fullscreen"]];
    } else if (id === "maps") {
      description = "Mapa amplo, tela cheia e destinos visuais deixam rotas e imagens mais fáceis de explorar.";
      rows = [["🕶 Destinos 360°", "map-tours"], ["↔ Largura ampla", "wide"], ["⛶ Tela cheia", "fullscreen"], ["↺ 100%", "page-reset"]];
    } else if (id === "media") {
      description = "Use apresentação para imagens salvas ou procure panoramas 360° por tema e lugar.";
      rows = [["▶ Apresentação", "media-slideshow"], ["🕶 Buscar 360°", "media-360"], ["↔ Largura ampla", "wide"], ["⛶ Tela cheia", "fullscreen"]];
    } else if (["comments", "context", "lexicon", "strong", "cross", "dossier", "interlinear"].includes(id)) {
      description = "Espaçamento arejado e largura confortável favorecem comentários, léxico e estudo detalhado.";
      rows = [["☕ Modo estudo", "study-comfort"], ["✨ Clean", "clean"], ["⛶ Tela cheia", "fullscreen"], ["↺ 100%", "page-reset"]];
    } else if (["search", "global", "concordance"].includes(id)) {
      description = "Mantenha o zoom em 100% para ver mais resultados e use tela cheia em pesquisas extensas.";
      rows = [["🔎 Ir à pesquisa", "focus-search"], ["↺ 100%", "page-reset"], ["↔ Largura ampla", "wide"], ["⛶ Tela cheia", "fullscreen"]];
    }
    if (host.dataset.module === id) return;
    text.textContent = description;
    host.replaceChildren(...rows.map(([label, action]) => {
      const button = document.createElement("button");
      button.type = "button";
      button.dataset.bxSuggestion = action;
      button.textContent = label;
      return button;
    }));
    host.dataset.module = id;
  }

  function setReaderFont(delta) {
    /* 5.4.102 — Sincronizado com bibleXZoom (fonte única). O drawer legado agora
       também escreve bibleXZoom, mesmo lugar que os botões novos A+/A−/Zoom 100. */
    const z = Math.max(70, Math.min(190, Number(delta) === 0 ? 100 : (Number(Store.get("bibleXZoom", 100)) || 100) + Number(delta || 0)));
    Store.set("bibleXZoom", z);
    saveReader({ font: z });
  }

  function toggleClean() {
    window.LMXBXControlRepair?.clean?.();
    setTimeout(() => updateUi(currentId()), 0);
  }

  function toggleFocus() {
    if (currentId() !== "reader") return;
    saveReader({ focus: !readerPrefs().focus });
  }

  function verseNodes() {
    const out = $("#bOut");
    return out ? $$(".lmx-bible-v3-verse, .bx-v2-verse, .bx-reader-verse", out) : [];
  }

  function clearFocusedVerse() {
    verseNodes().forEach(node => node.classList.remove("bx-dynamic-current"));
  }

  function updateFocusedVerse() {
    if (!$("#bOut")?.classList.contains("bx-dynamic-focus") && !autoReading) return;
    const rows = verseNodes();
    if (!rows.length) return;
    const guide = (window.innerHeight || document.documentElement.clientHeight || 800) * 0.42;
    let best = rows[0];
    let distance = Infinity;
    rows.forEach(row => {
      const rect = row.getBoundingClientRect();
      const center = rect.top + rect.height / 2;
      const next = Math.abs(center - guide);
      if (next < distance) { distance = next; best = row; }
    });
    rows.forEach(row => row.classList.toggle("bx-dynamic-current", row === best));
  }

  function updateProgress() {
    const out = $("#bOut");
    const bar = $("#bxDynamicProgressBar");
    const label = $("#bxDynamicProgressText");
    if (!out || !bar || !label) return 0;
    const rect = out.getBoundingClientRect();
    const viewport = window.innerHeight || document.documentElement.clientHeight || 800;
    const travelled = Math.max(0, viewport * 0.35 - rect.top);
    const total = Math.max(1, rect.height - viewport * 0.45);
    const percent = Math.round(clamp(travelled / total * 100, 0, 100));
    bar.style.width = `${percent}%`;
    label.textContent = `${percent}%`;
    updateFocusedVerse();
    return percent;
  }

  function scheduleProgress() {
    if (progressFrame) return;
    progressFrame = requestAnimationFrame(() => { progressFrame = 0; updateProgress(); });
  }

  function scrollReading(pixels) {
    const shell = $(".bible-x-shell");
    if (shell?.classList.contains("bx-page-full") || shell?.classList.contains("bx-reading-full")) shell.scrollTop += pixels;
    else window.scrollBy(0, pixels);
  }

  function autoTick(time) {
    if (!autoReading) return;
    if (!autoLast) autoLast = time;
    const elapsed = Math.min(64, time - autoLast);
    autoLast = time;
    const speed = clamp($("#bxDynamicSpeed")?.value || readerPrefs().speed, 1, 5);
    if (!document.hidden) scrollReading(SPEEDS[speed - 1] * elapsed / 1000);
    const progress = updateProgress();
    const out = $("#bOut");
    const atEnd = out ? out.getBoundingClientRect().bottom <= (window.innerHeight || 800) * 0.92 : true;
    if (progress >= 100 || atEnd) { stopAuto(); return; }
    autoFrame = requestAnimationFrame(autoTick);
  }

  function startAuto() {
    if (currentId() !== "reader" || !$("#bOut")) return;
    autoReading = true;
    autoLast = 0;
    cancelAnimationFrame(autoFrame);
    autoFrame = requestAnimationFrame(autoTick);
    updateUi("reader");
    setDrawer(false);
  }

  function stopAuto() {
    autoReading = false;
    autoLast = 0;
    cancelAnimationFrame(autoFrame);
    autoFrame = 0;
    updateUi(currentId());
  }

  function toggleAuto() { autoReading ? stopAuto() : startAuto(); }

  function resetModule() {
    const id = currentId();
    const state = readState();
    if (state.modules) delete state.modules[id];
    if (id === "reader") state.reader = { ...DEFAULT_READER };
    writeState(state);
    window.LMXBXControlRepair?.zoom?.(0);
    if (id === "reader") { storeLegacy("bibleXZoom", 100); storeLegacy("bibleXCleanReading", true); }
    window.LMXBXControlRepair?.sync?.(id);
    apply(id);
  }

  function runSuggestion(action) {
    const id = currentId();
    if (action === "fullscreen") return window.LMXBXControlRepair?.full?.(true);
    if (action === "page-reset") return window.LMXBXControlRepair?.zoom?.(0);
    if (action === "clean") return toggleClean();
    if (action === "focus") return toggleFocus();
    if (action === "auto") return toggleAuto();
    if (action === "wide") return saveModule({ width: "wide" }, id);
    if (action === "comfortable") return saveModule({ width: "comfortable", spacing: "comfortable" }, id);
    if (action === "reader-comfort") {
      saveModule({ theme: "sepia", width: "narrow", spacing: "relaxed" }, "reader");
      saveReader({ font: 120 });
      return;
    }
    if (action === "study-comfort") return saveModule({ theme: "midnight", width: "comfortable", spacing: "relaxed" }, id);
    if (action === "map-tours") { setDrawer(false); $("#bxV167TourToggle")?.click(); return; }
    if (action === "media-slideshow") { setDrawer(false); $("#bxMediaSlideshow")?.click(); return; }
    if (action === "media-360") { setDrawer(false); $("#bxMediaPublic360")?.click(); return; }
    if (action === "focus-search") {
      setDrawer(false);
      const panel = activePanel();
      const input = $("input[type='search'], input[id*='Query'], input[id*='Search'], input", panel);
      input?.focus();
      input?.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }

  function sync(id = currentId()) {
    if (!ensureDrawer()) return;
    if (id !== "reader" && autoReading) stopAuto();
    window.LMXBXControlRepair?.sync?.(id);
    apply(id);
  }

  document.addEventListener("click", event => {
    const suggestion = event.target.closest?.("[data-bx-suggestion]");
    if (suggestion) { event.preventDefault(); runSuggestion(suggestion.dataset.bxSuggestion); return; }

    const button = event.target.closest?.("[data-bx-dynamic-action]");
    if (!button) return;
    const action = button.dataset.bxDynamicAction;
    event.preventDefault();
    if (action === "options") setDrawer(!drawerOpen);
    else if (action === "close") setDrawer(false);
    else if (action === "clean") toggleClean();
    else if (action === "fullscreen") window.LMXBXControlRepair?.full?.(true);
    else if (action === "reset-module") resetModule();
    else if (action === "font-smaller") setReaderFont(-10);
    else if (action === "font-reset") setReaderFont(0);
    else if (action === "font-larger") setReaderFont(10);
    else if (action === "focus") toggleFocus();
    else if (action === "auto") toggleAuto();
  });

  document.addEventListener("change", event => {
    if (event.target.id === "bxDynamicTheme") saveModule({ theme: event.target.value });
    if (event.target.id === "bxDynamicWidth") saveModule({ width: event.target.value });
    if (event.target.id === "bxDynamicSpacing") saveModule({ spacing: event.target.value });
  });

  document.addEventListener("input", event => {
    if (event.target.id === "bxDynamicSpeed") saveReader({ speed: clamp(event.target.value, 1, 5) });
  });

  document.addEventListener("click", event => {
    const verse = event.target.closest?.("#bOut .lmx-bible-v3-verse, #bOut .bx-v2-verse, #bOut .bx-reader-verse");
    if (!verse || !readerPrefs().focus) return;
    clearFocusedVerse();
    verse.classList.add("bx-dynamic-current");
  });

  document.addEventListener("biblex:pagechange", event => sync(event.detail?.id || currentId()));
  document.addEventListener("biblex:controlschange", () => updateUi(currentId()));
  document.addEventListener("scroll", scheduleProgress, { passive: true, capture: true });
  window.addEventListener("resize", scheduleProgress, { passive: true });
  document.addEventListener("keydown", event => {
    const editing = event.target?.matches?.("input, textarea, select, [contenteditable='true']");
    if (event.key === "Escape" && drawerOpen) { event.preventDefault(); setDrawer(false); return; }
    if (!event.altKey || editing) return;
    const key = event.key.toLowerCase();
    if (["o", "f", "c", "a", "arrowup", "arrowdown"].includes(key)) event.preventDefault();
    if (key === "o") setDrawer(!drawerOpen);
    if (key === "f") window.LMXBXControlRepair?.full?.(!$(".bible-x-shell")?.classList.contains("bx-page-full"));
    if (key === "c") toggleClean();
    if (key === "a" && currentId() === "reader") toggleAuto();
    if (key === "arrowup") currentId() === "reader" ? setReaderFont(10) : window.LMXBXControlRepair?.zoom?.(10);
    if (key === "arrowdown") currentId() === "reader" ? setReaderFont(-10) : window.LMXBXControlRepair?.zoom?.(-10);
  });

  const observer = new MutationObserver(() => {
    if (!$(".bible-x-shell")) return;
    ensureDrawer();
    apply(currentId(), false);
  });
  observer.observe(document.body, { childList: true, subtree: true });

  window.LMXBXDynamic = Object.freeze({
    version: VERSION,
    sync,
    open: () => setDrawer(true),
    close: () => setDrawer(false),
    font: setReaderFont,
    focus: toggleFocus,
    auto: toggleAuto,
    stop: stopAuto,
    reset: resetModule,
    preferences: () => ({ module: modulePrefs(), reader: readerPrefs() }),
  });

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", () => sync(), { once: true });
  else sync();
})();
