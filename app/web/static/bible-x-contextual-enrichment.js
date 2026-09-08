/* Bíblia X — Contexto da passagem para Mídia X | v5.4.219 */
(function () {
  "use strict";

  const $ = (selector, root = document) => root.querySelector(selector);
  const clean = (value) => String(value || "").replace(/\s+/g, " ").trim();
  const key = (value) => clean(value).normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
  const BIBLE_REFERENCE_ONLY_RE = /^(?:[123]\s*)?[\p{L}]+(?:\s+[\p{L}]+){0,3}\s+\d{1,3}(?:(?:[:.]\s*\d{1,3}(?:\s*-\s*\d{1,3})?)|(?:\s*[-–]\s*\d{1,3}))?\s*$/u;
  const NON_VISUAL_QUERY_RE = /^(?:localiza(?:c|ç)[aã]o(?:\s+aproximada)?\s+a\s+investigar|passagem(?:\s+b[ií]blica)?\s+(?:selecionada|em\s+explora[cç][aã]o\s+contextual)|entrar\s+na\s+hist[oó]ria|leitura\s+guiada|etapa\s+atual|per[ií]odo\s+a\s+confirmar(?:\s+no\s+estudo)?|cena\s+editorial)$/i;
  const state = { publicManual: false, topManual: false, lastKey: "", bridge: null };

  function isBibleReferenceOnly(value) {
    const text = clean(value);
    return Boolean(text && /\d/.test(text) && BIBLE_REFERENCE_ONLY_RE.test(text));
  }

  function usableVisual(value) {
    const text = clean(value);
    return text.length >= 3 && !isBibleReferenceOnly(text) && !NON_VISUAL_QUERY_RE.test(text);
  }

  function fallbackVisualQuery(seed, kind = "image") {
    const text = key(seed);
    const rules = [
      [/sicar|siquem|shechem|sychar|samarit/, "Sicar Samaria poço de Jacó ruínas bíblicas"],
      [/jerusalem|golgota|calvario|pilatos|templo|muro ocidental/, "Jerusalém bíblica Cidade Antiga ruínas arqueológicas"],
      [/galileia|galilee|cafarnaum|capernaum|nazare|nazareth|mar da galileia/, "Galileia Cafarnaum ruínas bíblicas paisagem atual"],
      [/jordao|jordan|betania|bethany/, "Rio Jordão Betânia sítio bíblico paisagem atual"],
      [/jerico|jericho/, "Jericó Tell es-Sultan ruínas arqueológicas"],
      [/sinai|horebe|horeb|exodo|exodus/, "Sinai deserto rota bíblica paisagem atual"],
      [/damasco|damascus|paulo|paul|efeso|ephesus/, "Éfeso cidades bíblicas ruínas arqueológicas"],
      [/\bjoao\s+4(?:[:\s]|$)/, "Sicar Samaria poço de Jacó ruínas bíblicas"],
      [/\b(?:joao|mateus|marcos|lucas)\b/, "Jerusalém e Galileia cidades bíblicas ruínas arqueológicas"],
      [/\b(?:atos|romanos|corintios|galatas)\b/, "Éfeso cidades bíblicas ruínas arqueológicas"]
    ];
    let result = rules.find(([pattern]) => pattern.test(text))?.[1] || "cidades e ruínas bíblicas Israel antigo";
    if (kind === "panorama" && !/panorama|360/i.test(result)) result += " panorama 360";
    return result;
  }

  function contextualVisualQuery(scene, event, ref, verseText, kind = "image") {
    const candidates = [
      scene?.place?.name,
      scene?.place?.query,
      scene?.mediaQuery,
      scene?.panoramaQuery,
      scene?.title,
      event?.label
    ];
    const selected = candidates.map(clean).find(usableVisual);
    if (selected) return kind === "panorama" && !/panorama|360/i.test(selected) ? `${selected} panorama 360` : selected;
    const fromImmersion = window.BibleXImmersion?.getVisualQuery?.(`${ref || ""} ${verseText || ""}`, kind);
    return usableVisual(fromImmersion) ? fromImmersion : fallbackVisualQuery(`${ref || ""} ${verseText || ""}`, kind);
  }

  function verseNode() {
    return $("#bOut [data-bx-v3-verse][data-ref]") ||
      $("#bOut [data-ref]") ||
      $(".lmx-bible-v3-verse[data-ref], [data-bx-v3-verse][data-ref]");
  }

  function currentContext() {
    const liveImmersion = window.BibleXImmersion?.getContext?.() || null;
    const immersion = state.bridge || liveImmersion || null;
    const candidateIntegration = immersion?.integration || window.BibleXImmersion?.getIntegrationModel?.() || null;
    const integration = candidateIntegration?.active ? candidateIntegration : null;
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
    const place = [scene?.place?.name, scene?.place?.query].map(clean).find(usableVisual) || "";
    const label = clean(event?.label);
    const display = clean(
      integration?.queries?.media ||
      immersion?.mediaQuery ||
      [ref, label, place].filter(Boolean).join(" • ") ||
      ref ||
      place
    ).slice(0, 120);
    const search = clean(
      (usableVisual(integration?.queries?.images) && integration.queries.images) ||
      (usableVisual(immersion?.searchQuery) && immersion.searchQuery) ||
      contextualVisualQuery(scene, event, ref, verseText, "image")
    ).slice(0, 120);
    const panorama = clean(
      (usableVisual(integration?.queries?.panorama) && integration.queries.panorama) ||
      contextualVisualQuery(scene, event, ref, verseText, "panorama")
    ).slice(0, 120);
    return { ref, verseText, scene, event, place, label, display, search, panorama, integration };
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
      ? `${context.label ? `${context.label} • ` : ""}Texto conectado: ${context.verseText.slice(0, 180)}${context.verseText.length > 180 ? "…" : ""}`
      : context.place
        ? `${context.label ? `${context.label} • ` : ""}Lugar conectado: ${context.place}. Você pode editar a busca antes de pesquisar.`
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
    const key = `${context.ref}|${context.label}|${context.search}|${context.panorama}`;
    const changedContext = state.lastKey !== key;
    if (changedContext && !force) {
      state.publicManual = false;
      state.topManual = false;
    }
    const genericValues = new Set(["jerusalém bíblica", "jerusalem biblica", "jerusalém", "jerusalem"]);
    const defaultValue = !clean(publicInput?.value) || genericValues.has(clean(publicInput?.value).toLowerCase());
    const contextualSearch = context.search || context.display;
    const shouldWritePublic = force || changedContext || !state.publicManual || defaultValue;
    const shouldWriteTop = force || changedContext || !state.topManual || !clean(topInput?.value);
    if (publicInput && shouldWritePublic) writeContextValue(publicInput, contextualSearch);
    if (topInput && shouldWriteTop) writeContextValue(topInput, contextualSearch);
    state.lastKey = key;
  }

  function writeContextValue(input, value) {
    const next = clean(value);
    if (!input || !next) return;
    input.value = next;
    input.dataset.bxContextValue = next;
    input.dispatchEvent(new Event("input", { bubbles: true }));
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
          const next = usableVisual(topInput.value) ? clean(topInput.value) : contextualVisualQuery(null, null, topInput.value, "", "image");
          publicField.value = next;
          publicField.dataset.bxContextValue = next;
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
