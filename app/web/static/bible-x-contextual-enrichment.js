/* Bíblia X — Contexto da passagem para Mídia X | v5.4.208 */
(function () {
  "use strict";

  const $ = (selector, root = document) => root.querySelector(selector);
  const clean = (value) => String(value || "").replace(/\s+/g, " ").trim();
  const state = { publicManual: false, topManual: false, lastKey: "", bridge: null };

  function verseNode() {
    return $("#bOut [data-bx-v3-verse][data-ref]") ||
      $("#bOut [data-ref]") ||
      $(".lmx-bible-v3-verse[data-ref], [data-bx-v3-verse][data-ref]");
  }

  function currentContext() {
    const liveImmersion = window.BibleXImmersion?.getContext?.() || null;
    const immersion = state.bridge || (liveImmersion?.open ? liveImmersion : null);
    const verse = verseNode();
    const ref = clean(
      immersion?.currentNarrativeRef ||
      verse?.getAttribute("data-ref") ||
      $("#bRef")?.value ||
      immersion?.reference
    );
    const verseText = clean(
      immersion?.verseText ||
      $(".lmx-bible-v3-text, [data-bx-verse-text]", verse)?.innerText ||
      verse?.innerText
    );
    const scene = immersion?.scene || null;
    const event = immersion?.event || null;
    const place = clean(scene?.place?.name || scene?.place?.query);
    const label = clean(event?.label);
    const display = clean(
      immersion?.mediaQuery ||
      [ref, label, place].filter(Boolean).join(" • ") ||
      ref ||
      place
    ).slice(0, 120);
    const search = clean(
      immersion?.searchQuery ||
      [scene?.mediaQuery || place, label, ref].filter(Boolean).join(" ") ||
      ref ||
      verseText.slice(0, 90)
    ).slice(0, 120);
    return { ref, verseText, scene, event, place, label, display, search };
  }

  function ensureContextRibbon() {
    const discovery = $(".bx-media-discovery");
    if (!discovery) return null;
    let ribbon = $("[data-bx-media-context]", discovery);
    if (ribbon) return ribbon;
    ribbon = document.createElement("div");
    ribbon.className = "bx-media-context-ribbon";
    ribbon.dataset.bxMediaContext = "1";
    ribbon.innerHTML = `
      <div class="bx-media-context-copy">
        <span>📖 PASSAGEM EM ESTUDO</span>
        <strong data-bx-media-context-title>Aguardando uma passagem</strong>
        <small data-bx-media-context-detail>Abra um versículo para conectar imagens, cultura, geografia e curiosidades.</small>
      </div>
      <button type="button" class="btn secondary" data-bx-media-use-context>Usar texto em foco</button>`;
    const search = $(".bx-media-public-search", discovery);
    if (search) search.before(ribbon);
    else discovery.appendChild(ribbon);
    ribbon.addEventListener("click", (event) => {
      if (!event.target.closest("[data-bx-media-use-context]")) return;
      state.publicManual = false;
      const input = $("#bxMediaPublicQuery");
      if (input) input.dataset.bxUserEdited = "";
      sync(true);
    });
    return ribbon;
  }

  function updateRibbon(context) {
    const ribbon = ensureContextRibbon();
    if (!ribbon) return;
    const title = $("[data-bx-media-context-title]", ribbon);
    const detail = $("[data-bx-media-context-detail]", ribbon);
    title.textContent = context.display || "Aguardando uma passagem";
    detail.textContent = context.verseText
      ? `Texto conectado: ${context.verseText.slice(0, 180)}${context.verseText.length > 180 ? "…" : ""}`
      : context.place
        ? `Lugar conectado: ${context.place}. Você pode editar a busca antes de pesquisar.`
        : "Abra um versículo para conectar imagens, cultura, geografia e curiosidades.";
    ribbon.classList.toggle("is-ready", !!context.display);
  }

  function sync(force = false) {
    if (force) {
      state.publicManual = false;
      state.topManual = false;
    }
    const context = currentContext();
    updateRibbon(context);
    const publicInput = $("#bxMediaPublicQuery");
    const topInput = $("#bxMediaQuery");
    if (!context.display) return;
    const key = `${context.display}|${context.search}`;
    const defaultValue = !clean(publicInput?.value) || clean(publicInput?.value).toLowerCase() === "jerusalém bíblica";
    const shouldWrite = force || !state.publicManual || defaultValue || state.lastKey !== key;
    if (publicInput && shouldWrite) {
      publicInput.value = context.display;
      publicInput.dataset.bxContextValue = context.display;
    }
    if (topInput && (force || !state.topManual || !clean(topInput.value))) {
      topInput.value = context.display;
      topInput.dataset.bxContextValue = context.display;
    }
    state.lastKey = key;
  }

  function bindInputs() {
    const publicInput = $("#bxMediaPublicQuery");
    if (publicInput && !publicInput.dataset.bxContextBound) {
      publicInput.dataset.bxContextBound = "1";
      publicInput.addEventListener("input", () => {
        if (publicInput.value !== publicInput.dataset.bxContextValue) state.publicManual = true;
      });
    }
    const topInput = $("#bxMediaQuery");
    if (topInput && !topInput.dataset.bxContextBound) {
      topInput.dataset.bxContextBound = "1";
      topInput.addEventListener("input", () => {
        if (topInput.value !== topInput.dataset.bxContextValue) state.topManual = true;
        const publicField = $("#bxMediaPublicQuery");
        if (publicField && !state.publicManual && clean(topInput.value)) {
          publicField.value = topInput.value;
          publicField.dataset.bxContextValue = topInput.value;
        }
      });
    }
  }

  function schedule(force = false) {
    window.setTimeout(() => { bindInputs(); sync(force); }, 80);
  }

  function init() {
    schedule(true);
    document.addEventListener("biblex:pagechange", () => { state.bridge = null; schedule(true); });
    window.addEventListener("biblex:media-context", (event) => {
      state.bridge = event.detail || null;
      schedule(true);
    });
    document.addEventListener("click", (event) => {
      const target = event.target.closest?.("[data-bible-section='media'], [data-imm-action='media'], [data-live-action='media-search']");
      if (target) {
        if (!target.matches("[data-imm-action='media']")) state.bridge = null;
        schedule(true);
      }
    }, true);
    const observer = new MutationObserver(() => {
      bindInputs();
      if ($(".bx-media-discovery")) sync(false);
    });
    observer.observe(document.body, { childList: true, subtree: true });
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init, { once: true });
  else init();
  window.BibleXContextualEnrichment = { sync };
})();
