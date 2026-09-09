/* Bíblia Viva — Modo Imersão | v5.4.240 */
(function () {
  "use strict";

  const VERSION = "5.4.244";
  const DATA_URL = "/static/immersion-scenes.json?v=" + VERSION;
  const SCENES_CACHE_KEY = `logosx:bibleVivaScenes:${VERSION}`;
  const MEDIA_CACHE_PREFIX = `logosx:bibleVivaMedia:${VERSION}:`;
  const LAST_SCENE_KEY = `logosx:bibleVivaLastScene:${VERSION}`;
  const state = {
    scenes: [],
    catalogOffline: false,
    scene: null,
    ref: "",
    verseText: "",
    activeEvent: 0,
    activeTab: "scene",
    contextSubtab: "geography",
    selectedPerson: "",
    currentNarrativeRef: "",
    visualItems: [],
    visualIndex: 0,
    visualQuery: "",
    visualLoading: false,
    visualMessage: "",
    panoramaLoading: false,
    completedEvents: [],
    favorite: false,
    tourActive: false,
    tourTimer: null,
    presentationActive: false,
    shortcutsOpen: false,
    noteTimer: null,
    lastFocus: null,
    speechActive: false,
    stageZoom: 1,
    stagePanX: 0,
    stagePanY: 0,
    stageDrag: null,
    quadrantFocus: { mode: "", size: "full", zoom: 1 },
    quadrantFullscreenMode: "",
    miniMap3d: true
  };
  const catalogState = {
    query: "",
    filter: "all",
    place: "all",
    lastFocus: null
  };
  const INTEGRATION_LAYERS = Object.freeze([
    "text",
    "images",
    "media",
    "panorama",
    "map",
    "people",
    "timeline",
    "context"
  ]);
  let modal = null;
  let catalogModal = null;
  let catalogOpenRequest = 0;
  let scenesPromise = null;

  const $ = (selector, scope) => (scope || document).querySelector(selector);
  const $$ = (selector, scope) => Array.from((scope || document).querySelectorAll(selector));
  const norm = (value) => String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[–—]/g, "-")
    .replace(/\s+/g, " ")
    .trim();
  const esc = (value) => String(value == null ? "" : value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

  function safeClass(value) {
    return String(value || "generic").replace(/[^a-z0-9_-]/gi, "-").toLowerCase();
  }

  function safeHttpUrl(value) {
    const url = String(value || "").trim();
    return /^https?:\/\//i.test(url) ? url : "";
  }

  function responseErrorMessage(payload, status, fallback) {
    const detail = payload?.detail;
    if (status === 422) return "A consulta excedeu o limite permitido; ela foi ajustada para a busca pública.";
    if (Array.isArray(detail)) return detail.map((item) => item?.msg || item?.message || JSON.stringify(item)).join(" • ");
    if (detail && typeof detail === "object") return detail.message || detail.msg || JSON.stringify(detail);
    return String(detail || fallback || `Fonte pública indisponível (HTTP ${status || "erro"}).`);
  }

  const BIBLE_REFERENCE_ONLY_RE = /^(?:[123]\s*)?[\p{L}]+(?:\s+[\p{L}]+){0,3}\s+\d{1,3}(?:(?:[:.]\s*\d{1,3}(?:\s*-\s*\d{1,3})?)|(?:\s*[-–]\s*\d{1,3}))?\s*$/u;
  const NON_VISUAL_QUERY_RE = /^(?:localiza(?:c|ç)[aã]o(?:\s+aproximada)?\s+a\s+investigar|passagem(?:\s+b[ií]blica)?\s+(?:selecionada|em\s+explora[cç][aã]o\s+contextual)|entrar\s+na\s+hist[oó]ria|leitura\s+guiada|etapa\s+atual|per[ií]odo\s+a\s+confirmar(?:\s+no\s+estudo)?|cena\s+editorial)$/i;

  function isBibleReferenceOnly(value) {
    const clean = String(value || "").replace(/\s+/g, " ").trim();
    return Boolean(clean && /\d/.test(clean) && BIBLE_REFERENCE_ONLY_RE.test(clean));
  }

  function isUsableVisualQuery(value) {
    const clean = String(value || "").replace(/\s+/g, " ").trim();
    if (!clean || isBibleReferenceOnly(clean) || NON_VISUAL_QUERY_RE.test(clean)) return false;
    return clean.length >= 3;
  }

  function fallbackVisualQuery(seed, kind = "image") {
    const text = norm(seed);
    const rules = [
      [/sicar|siquem|shechem|sychar|samarit/, "Sicar Samaria poço de Jacó ruínas bíblicas"],
      [/jerusalem|g[óo]lgota|calvario|pilatos|templo|muro ocidental/, "Jerusalém bíblica Cidade Antiga ruínas arqueológicas"],
      [/galileia|galilee|cafarnaum|capernaum|nazare|nazareth|mar da galileia/, "Galileia Cafarnaum ruínas bíblicas paisagem atual"],
      [/jordao|jordan|betania|bethany/, "Rio Jordão Betânia sítio bíblico paisagem atual"],
      [/jerico|jericho/, "Jericó Tell es-Sultan ruínas arqueológicas"],
      [/sinai|horebe|horeb|exodo|exodus/, "Sinai deserto rota bíblica paisagem atual"],
      [/damasco|damascus|paulo|paul|efeso|ephesus/, "Éfeso cidades bíblicas ruínas arqueológicas"],
      [/\bjoao\s+4(?:[:\s]|$)/, "Sicar Samaria poço de Jacó ruínas bíblicas"],
      [/\b(?:joao|mateus|marcos|lucas)\b/, "Jerusalém e Galileia cidades bíblicas ruínas arqueológicas"],
      [/\b(?:atos|romanos|corintios|coríntios|galatas|g[aá]latas)\b/, "Éfeso cidades bíblicas ruínas arqueológicas"],
    ];
    let query = rules.find(([pattern]) => pattern.test(text))?.[1] || "cidades e ruínas bíblicas Israel antigo";
    if (kind === "panorama" && !/panorama|360/i.test(query)) query += " panorama 360";
    return query;
  }

  function mediaQueryForScene(scene, event, preferred, kind = "image") {
    const verseHint = String(state.verseText || "")
      .replace(/[.,;:!?()[\]{}]/g, " ")
      .replace(/\s+/g, " ")
      .trim()
      .split(" ")
      .slice(0, 10)
      .join(" ");
    const values = [
      preferred,
      scene?.place?.name,
      scene?.place?.query,
      scene?.mediaQuery,
      scene?.panoramaQuery,
      scene?.title,
      scene?.period,
      event?.label,
      verseHint,
      ...(scene?.people || []).slice(0, 3).map((person) => person.name)
    ];
    const unique = [];
    values.filter(Boolean).forEach((value) => {
      const clean = String(value).replace(/\s+/g, " ").trim();
      if (isUsableVisualQuery(clean) && !unique.some((item) => norm(item) === norm(clean))) unique.push(clean);
    });
    // A primeira expressão é a consulta editorial curta. A versão anterior
    // colava título, período, evento, referência e trecho bíblico numa única
    // busca; no Commons isso costuma virar zero resultados. As alternativas
    // ficam em mediaQueryVariants e só são tentadas quando necessário.
    return (unique[0] || fallbackVisualQuery([state.ref, state.verseText, event?.label].filter(Boolean).join(" "), kind)).slice(0, 120);
  }

  function simplifyMediaQuery(value) {
    return String(value || "")
      .replace(/[|/]+/g, " ")
      .replace(/\b(?:panorama|equirectangular|spherical|360(?:°|º)?|vista\s+360)\b/gi, " ")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 120);
  }

  const MEDIA_SEMANTIC_RULES = [
    [/sicar|siquem|shechem|sychar/i, ["Jacob's Well Nablus current", "Shechem Nablus archaeological site", "Sebastia Samaria ruins"]],
    [/jerusalem/i, ["Jerusalem Old City Israel", "Jerusalem archaeological ruins", "Temple Mount Jerusalem current"]],
    [/jerico|jericho/i, ["Tell es-Sultan Jericho ruins", "Jericho Jordan Valley current", "Jericho archaeological site"]],
    [/samaria/i, ["Sebastia Samaria archaeological site", "Samaria ancient city ruins", "Samarian landscape Israel"]],
    [/galileia|galilee/i, ["Capernaum ruins Israel", "Nazareth Old City Israel", "Sea of Galilee current landscape"]],
    [/mar\s+da\s+galileia|sea\s+of\s+galilee/i, ["Sea of Galilee", "Galilee lake"]],
    [/judeia|judea/i, ["Judean hills Israel", "Bethlehem Old City current", "Hebron Old City archaeological"]],
    [/jordao|jordan/i, ["Jordan River current site", "Bethany beyond Jordan archaeological site", "Jordan Valley landscape"]],
    [/sinai|horebe|horeb/i, ["Mount Sinai Egypt current", "Saint Catherine Sinai monastery", "Sinai desert landscape"]],
    [/damasco|damascus/i, ["Damascus Old City Syria", "Damascus current city ruins", "Damascus archaeological site"]],
    [/canaa|cana/i, ["Kafr Kanna Cana Galilee", "Cana Galilee archaeological site", "Cana Israel current"]],
    [/exodo|exodus/i, ["Exodus desert", "Sinai desert"]],
    [/babilonia|babylon/i, ["Babylon archaeological site Iraq", "Babylon ruins current Iraq", "Babylon ancient city"]],
    [/ninive|nineveh/i, ["Nineveh ruins Mosul Iraq", "Nineveh archaeological site", "Mosul current city"]],
    [/paulo|paul/i, ["Ephesus ruins Turkey", "Paul missionary journey sites", "ancient Ephesus current"]],
    [/templo|temple/i, ["Temple Mount Jerusalem current", "Jerusalem archaeological site", "Western Wall Jerusalem"]],
    [/ruinas|ruins|ancient\s+israel|cidades\s+e\s+ruinas|biblical\s+archaeological/i, ["Jerusalem Old City Israel", "Capernaum ruins Israel", "ancient Israel archaeological site"]]
  ];

  function semanticMediaQueries(scene, event, preferred, kind) {
    const text = [preferred, scene?.place?.name, scene?.place?.query, scene?.title, scene?.mediaQuery, scene?.panoramaQuery, event?.label].filter(Boolean).join(" ");
    const out = [];
    const add = (value) => {
      const query = simplifyMediaQuery(value);
      if (query && !out.some((item) => norm(item) === norm(query))) out.push(query);
    };
    MEDIA_SEMANTIC_RULES.forEach(([pattern, queries]) => {
      if (!pattern.test(text.normalize("NFD").replace(/[\u0300-\u036f]/g, ""))) return;
      queries.forEach((query) => {
        add(query);
        if (kind === "panorama") {
          add(`${query} panorama`);
          add(`${query} landscape`);
        }
      });
    });
    return out.slice(0, 8);
  }

  function mediaQueryVariants(scene, event, preferred, kind) {
    const primary = mediaQueryForScene(scene, event, preferred, kind);
    const semantic = semanticMediaQueries(scene, event, preferred, kind);
    const values = kind === "panorama"
      ? [primary, ...semantic, scene?.panoramaQuery, scene?.place?.name, scene?.place?.query, scene?.mediaQuery, scene?.title, event?.label]
      : [primary, ...semantic, scene?.mediaQuery, scene?.panoramaQuery, scene?.place?.name, scene?.place?.query, scene?.title, event?.label, ...(scene?.people || []).slice(0, 2).map((person) => person.name)];
    const variants = [];
    const add = (value) => {
      const clean = String(value || "").replace(/\s+/g, " ").trim().slice(0, 120);
      if (!isUsableVisualQuery(clean)) return;
      if (clean && !variants.some((item) => norm(item) === norm(clean))) variants.push(clean);
    };
    values.filter(Boolean).forEach((value) => {
      add(value);
      add(simplifyMediaQuery(value));
      const words = simplifyMediaQuery(value).split(" ").filter(Boolean);
      if (words.length > 6) add(words.slice(0, 6).join(" "));
    });
    if (kind === "panorama") {
      const place = simplifyMediaQuery(scene?.place?.name || scene?.place?.query || "");
      if (isUsableVisualQuery(place)) add(`${place} landscape`);
    }
    return variants.slice(0, 8);
  }

  const MEDIA_ALIASES = Object.freeze({
    sicar: ["sychar", "shechem", "sichem", "samaria", "samaritan", "jacob well"],
    siquem: ["shechem", "sychar", "sicar", "samaria"],
    samaria: ["samaritan", "samaritans", "sychar", "shechem"],
    samaritana: ["samaritan", "samaria"],
    jerico: ["jericho"],
    damasco: ["damascus"],
    galileia: ["galilee"],
    judeia: ["judea"],
    exodo: ["exodus"],
    poco: ["well", "wells"],
    templo: ["temple"],
    montanha: ["mountain", "mountains"],
    deserto: ["desert"],
    mar: ["sea"],
    canaa: ["canaan"],
    hara: ["haran"],
    ur: ["ur"],
    paulo: ["paul", "paulus"]
  });
  const MEDIA_STOP_WORDS = new Set([
    "a", "ao", "aos", "as", "da", "das", "de", "do", "dos", "e", "em", "entre", "na", "nas", "no", "nos", "o", "os", "para", "por", "que", "regiao", "região", "the", "and", "from", "in", "of", "on", "to", "with", "region", "biblica", "biblical"
  ]);

  function mediaTokens(value) {
    const source = norm(value).replace(/[^\p{L}\p{N}]+/gu, " ");
    return source.split(/\s+/).filter((token) => token.length >= 3 && !MEDIA_STOP_WORDS.has(token));
  }

  function expandedMediaTokens(value) {
    const tokens = new Set();
    mediaTokens(value).forEach((token) => {
      tokens.add(token);
      (MEDIA_ALIASES[token] || []).forEach((alias) => mediaTokens(alias).forEach((item) => tokens.add(item)));
    });
    return tokens;
  }

  function mediaItemText(item) {
    return [
      item?.title,
      item?.name,
      item?.description,
      item?.categories,
      item?.credit,
      item?.artist,
      item?.source,
      item?.page_url,
      item?.original_url
    ].flatMap((value) => Array.isArray(value) ? value : [value]).filter(Boolean).join(" ");
  }

  function mediaIsPanorama(item) {
    if (item?.panorama_candidate === true || item?.is_panorama === true) return true;
    return /equirectangular|panorama|spherical|(?:^|[^\d])360(?:°|º)?(?:[^\d]|$)|virtual\s*tour|street\s*view/i.test(mediaItemText(item));
  }

  function rankMediaItems(items, scene, event, kind, query = "") {
    const placeText = [scene?.place?.name, scene?.place?.query].filter(Boolean).join(" ");
    const targetText = [
      query,
      placeText,
      scene?.title,
      scene?.mediaQuery,
      scene?.panoramaQuery,
      event?.label,
      ...(scene?.people || []).slice(0, 3).map((person) => person.name)
    ].filter(Boolean).join(" ");
    const targetTokens = expandedMediaTokens(targetText);
    const placeTokens = expandedMediaTokens(placeText);
    const seen = new Set();
    const ranked = [];
    (Array.isArray(items) ? items : []).forEach((item, index) => {
      if (!item || typeof item !== "object") return;
      const identity = norm(item.page_url || item.original_url || item.id || item.title || `item-${index}`);
      if (!identity || seen.has(identity)) return;
      seen.add(identity);
      const titleTokens = expandedMediaTokens([item.title, item.name, item.categories].filter(Boolean).join(" "));
      const textTokens = expandedMediaTokens(mediaItemText(item));
      let score = 0;
      placeTokens.forEach((token) => {
        if (titleTokens.has(token)) score += 8;
        else if (textTokens.has(token)) score += 3;
      });
      targetTokens.forEach((token) => {
        if (placeTokens.has(token)) return;
        if (titleTokens.has(token)) score += 3;
        else if (textTokens.has(token)) score += 1;
      });
      if (kind === "panorama") score += mediaIsPanorama(item) ? 8 : -4;
      ranked.push({ item, score, index });
    });
    ranked.sort((left, right) => right.score - left.score || left.index - right.index);
    const relevant = ranked.filter((entry) => entry.score > 0);
    return (relevant.length ? relevant : ranked).map((entry) => entry.item).slice(0, 12);
  }

  async function fetchPublicMedia(query, kind, limit = 6) {
    const params = new URLSearchParams({ q: String(query || "").slice(0, 120), kind, limit: String(limit) });
    const response = await fetch(`/api/bible/media/public/search?${params.toString()}`, { cache: "no-store" });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(responseErrorMessage(payload, response.status, kind === "panorama" ? "Busca 360° indisponível." : "Fonte visual pública indisponível."));
    return Array.isArray(payload.items) ? payload.items : [];
  }

  async function fetchSceneMedia(scene, event, preferred, kind, allowImageFallback = false) {
    const primary = mediaQueryForScene(scene, event, preferred, kind);
    let lastError = null;
    const tryVariants = async (actualKind, variants) => {
      const batches = [];
      let firstQuery = "";
      let fromCache = true;
      for (const query of variants.slice(0, 5)) {
        try {
          const cached = readMediaCache(query, actualKind);
          const items = cached.length ? cached : await fetchPublicMedia(query, actualKind, 8);
          if (!cached.length) fromCache = false;
          if (items.length) {
            firstQuery ||= query;
            batches.push(...items);
            writeMediaCache(query, actualKind, items);
            if (batches.length >= 18) break;
          }
        } catch (error) {
          lastError = error;
        }
      }
      if (!batches.length) return null;
      const ranked = rankMediaItems(batches, scene, event, actualKind, firstQuery);
      const usable = actualKind === "panorama" ? ranked.filter(mediaIsPanorama) : ranked;
      return usable.length ? { items: usable.slice(0, 8), query: firstQuery || primary, actualKind, fromCache } : null;
    };
    const exact = await tryVariants(kind, mediaQueryVariants(scene, event, preferred, kind));
    if (exact) return exact;
    if (allowImageFallback && kind === "panorama") {
      const fallback = await tryVariants("image", mediaQueryVariants(scene, event, scene?.mediaQuery, "image"));
      if (fallback) return { ...fallback, fallbackFrom: "panorama" };
    }
    return { items: [], query: primary, actualKind: kind, error: lastError };
  }

  function mediaCacheKey(query, kind) {
    return `${MEDIA_CACHE_PREFIX}${kind}:${norm(query).slice(0, 180)}`;
  }

  function readMediaCache(query, kind) {
    try {
      const cached = JSON.parse(localStorage.getItem(mediaCacheKey(query, kind)) || "null");
      return Array.isArray(cached?.items) ? cached.items : [];
    } catch (_) {
      return [];
    }
  }

  function writeMediaCache(query, kind, items) {
    if (!Array.isArray(items) || !items.length) return;
    try {
      localStorage.setItem(mediaCacheKey(query, kind), JSON.stringify({ savedAt: new Date().toISOString(), items: items.slice(0, 12) }));
    } catch (error) {
      console.warn("Bíblia Viva: mídia não pôde ser guardada no cache", error);
    }
  }

  function resetStageView() {
    state.stageZoom = 1;
    state.stagePanX = 0;
    state.stagePanY = 0;
    state.stageDrag = null;
  }

  function stagePanLimit(axis) {
    const viewport = $(`[data-imm-stage-viewport]`, modal);
    if (!viewport || state.stageZoom <= 1) return 0;
    const size = axis === "x" ? viewport.clientWidth : viewport.clientHeight;
    return Math.max(0, size * (state.stageZoom - 1) / 2);
  }

  function applyStageTransform() {
    const art = $(`[data-imm-stage-art]`, modal);
    if (!art) return;
    const maxX = stagePanLimit("x");
    const maxY = stagePanLimit("y");
    state.stagePanX = Math.max(-maxX, Math.min(maxX, state.stagePanX));
    state.stagePanY = Math.max(-maxY, Math.min(maxY, state.stagePanY));
    art.style.transform = `translate3d(${state.stagePanX}px, ${state.stagePanY}px, 0) scale(${state.stageZoom})`;
    art.classList.toggle("is-zoomed", state.stageZoom > 1);
    const label = $(`[data-imm-stage-zoom-label]`, modal);
    if (label) label.textContent = `${Math.round(state.stageZoom * 100)}%`;
  }

  function setStageZoom(value) {
    state.stageZoom = Math.max(1, Math.min(2.8, Number(value) || 1));
    if (state.stageZoom === 1) {
      state.stagePanX = 0;
      state.stagePanY = 0;
    }
    applyStageTransform();
  }

  function bindStageGestures() {
    const viewport = $(`[data-imm-stage-viewport]`, modal);
    if (!viewport) return;
    const image = $(`[data-imm-visual-image]`, modal);
    image?.addEventListener("error", () => {
      if (!state.visualItems.length) return;
      state.visualItems.splice(state.visualIndex, 1);
      state.visualIndex = Math.max(0, Math.min(state.visualIndex, state.visualItems.length - 1));
      state.visualMessage = state.visualItems.length
        ? "Uma imagem indisponível foi removida; confira as demais fontes públicas."
        : "As imagens públicas falharam ao carregar; a reconstrução visual local continua disponível.";
      renderStage();
    }, { once: true });
    viewport.addEventListener("wheel", (event) => {
      /* Roda normal navega pelo corpo do quadrante. O zoom fica explícito
         com Ctrl/⌘/Alt, evitando que a cena "roube" o scroll da leitura. */
      if (!(event.ctrlKey || event.metaKey || event.altKey)) return;
      event.preventDefault();
      event.stopPropagation();
      setStageZoom(state.stageZoom + (event.deltaY < 0 ? 0.2 : -0.2));
    }, { passive: false });
    viewport.addEventListener("pointerdown", (event) => {
      if (state.stageZoom <= 1 || event.target.closest("button, a")) return;
      state.stageDrag = { id: event.pointerId, x: event.clientX, y: event.clientY };
      viewport.setPointerCapture?.(event.pointerId);
      viewport.classList.add("is-dragging");
    });
    viewport.addEventListener("pointermove", (event) => {
      if (!state.stageDrag || state.stageDrag.id !== event.pointerId) return;
      state.stagePanX += event.clientX - state.stageDrag.x;
      state.stagePanY += event.clientY - state.stageDrag.y;
      state.stageDrag.x = event.clientX;
      state.stageDrag.y = event.clientY;
      applyStageTransform();
    });
    const stopDrag = (event) => {
      if (!state.stageDrag || (event.pointerId != null && state.stageDrag.id !== event.pointerId)) return;
      state.stageDrag = null;
      viewport.classList.remove("is-dragging");
    };
    viewport.addEventListener("pointerup", stopDrag);
    viewport.addEventListener("pointercancel", stopDrag);
    viewport.addEventListener("pointerleave", (event) => {
      if (state.stageDrag && !viewport.hasPointerCapture?.(event.pointerId)) stopDrag(event);
    });
    viewport.addEventListener("keydown", (event) => {
      if (event.key === "+" || event.key === "=") {
        event.preventDefault();
        setStageZoom(state.stageZoom + 0.2);
      } else if (event.key === "-") {
        event.preventDefault();
        setStageZoom(state.stageZoom - 0.2);
      } else if (event.key === "0") {
        event.preventDefault();
        setStageZoom(1);
      }
    });
    applyStageTransform();
  }

  function createGenericScene(ref) {
    const cleanRef = String(ref || "Passagem selecionada").trim();
    return {
      id: "generic-" + norm(cleanRef).replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""),
      matches: [cleanRef],
      reference: cleanRef,
      title: "Entrar na história",
      subtitle: "Uma camada visual para ler, localizar e acompanhar a passagem",
      theme: "Passagem em exploração contextual",
      period: "Período a confirmar no estudo",
      timelineNote: "A referência foi organizada como ordem de leitura; não há data histórica inferida automaticamente.",
      sceneClass: "generic",
      badge: "EXPLORAÇÃO CONTEXTUAL",
      place: {
        name: "Localização a investigar",
        query: "",
        description: "Quando houver dados de lugar para esta passagem, o Atlas X Vivo poderá aprofundar a localização."
      },
      certainty: "Cena editorial • não substitui a leitura do texto",
      mediaQuery: "cidades e ruínas bíblicas Israel antigo",
      panoramaQuery: "cidades e ruínas bíblicas Israel antigo panorama 360",
      historicalContext: "Esta passagem ainda não possui uma cena editorial específica no catálogo. Use os atalhos para pesquisar o lugar, personagens, tempo e mídia sem transformar uma hipótese em fato.",
      culturalNotes: [
        { title: "Leitura responsável", text: "Separe o que o texto afirma, o que a tradição interpreta e o que uma reconstrução visual apenas imagina." }
      ],
      geography: [
        { title: "Lugar a investigar", text: `Pesquise no Atlas X Vivo os lugares relacionados a ${cleanRef}. A localização será apresentada com sua legenda de certeza.` }
      ],
      curiosities: [
        { title: "Uma pergunta para começar", text: `Que pessoas, lugares e costumes aparecem em ${cleanRef}? Use os módulos conectados para montar o contexto.` }
      ],
      questions: [
        "O que está explicitamente no texto e o que ainda precisa ser pesquisado?",
        "Qual elemento humano, geográfico ou cultural ajuda a compreender esta passagem?"
      ],
      sources: [
        { label: "Referência em foco", type: "Bíblia", value: cleanRef, certainty: "Texto selecionado" },
        { label: "Contexto complementar", type: "Atlas X Vivo", value: "Pesquisar lugar, tempo e rota", certainty: "A investigar" }
      ],
      people: [],
      hotspots: [],
      events: [{ label: "Leitura guiada", ref: cleanRef, summary: "Use os painéis para relacionar o versículo a pessoas, lugares, tempo e mídia." }],
      route: []
    };
  }

  function loadScenes() {
    if (scenesPromise) return scenesPromise;
    scenesPromise = fetch(DATA_URL, { cache: "no-store" })
      .then((response) => {
        if (!response.ok) throw new Error("Catálogo de cenas indisponível");
        return response.json();
      })
      .then((payload) => {
        state.scenes = Array.isArray(payload.scenes) ? payload.scenes : [];
        state.catalogOffline = false;
        try {
          localStorage.setItem(SCENES_CACHE_KEY, JSON.stringify({ version: VERSION, scenes: state.scenes }));
        } catch (storageError) {
          console.warn("Bíblia Viva: catálogo não pôde ser guardado offline", storageError);
        }
        return state.scenes;
      })
      .catch((error) => {
        console.warn("Bíblia Viva: catálogo local indisponível", error);
        try {
          const cached = JSON.parse(localStorage.getItem(SCENES_CACHE_KEY) || "null");
          state.scenes = Array.isArray(cached?.scenes) ? cached.scenes : [];
          state.catalogOffline = state.scenes.length > 0;
        } catch (storageError) {
          state.scenes = [];
          state.catalogOffline = false;
          console.warn("Bíblia Viva: catálogo offline inválido", storageError);
        }
        return state.scenes;
      });
    return scenesPromise;
  }

  function findScene(ref) {
    const wanted = norm(ref);
    if (!wanted) return createGenericScene("Passagem selecionada");
    const found = state.scenes.find((scene) => {
      const candidates = (scene.matches || []).concat(scene.reference || []);
      return candidates.some((candidate) => {
        const item = norm(candidate);
        return wanted === item || wanted.startsWith(item + ":") || wanted.startsWith(item + " ") || item.startsWith(wanted + ":");
      });
    });
    return found || createGenericScene(ref);
  }

  function referenceFromInput() {
    const input = $("#bRef, input[name='reference'], [data-bible-reference]");
    if (input) {
      const value = input.value || input.getAttribute("data-bible-reference") || input.textContent;
      if (String(value || "").trim()) return String(value).trim();
    }
    const active = $(".lmx-bible-v3-verse[data-ref], [data-bx-v3-verse][data-ref]");
    return active ? String(active.getAttribute("data-ref") || "").trim() : "";
  }

  function versePayload(button) {
    const verse = button && button.closest ? button.closest(".lmx-bible-v3-verse, [data-bx-v3-verse]") : null;
    const ref = String(
      button?.getAttribute("data-ref") ||
      verse?.getAttribute("data-ref") ||
      referenceFromInput() ||
      "Passagem selecionada"
    ).trim();
    const textNode = verse && $(".lmx-bible-v3-text, [data-bx-verse-text]", verse);
    const text = textNode ? textNode.innerText.trim() : "";
    return { ref, text };
  }

  function selectedEvent() {
    const events = Array.isArray(state.scene?.events) && state.scene.events.length ? state.scene.events : [{ label: "Leitura guiada", summary: "Explore os vínculos desta passagem." }];
    state.activeEvent = Math.max(0, Math.min(Number(state.activeEvent) || 0, events.length - 1));
    const event = events[state.activeEvent];
    state.currentNarrativeRef = event.ref || state.ref || state.scene?.reference || "";
    return event;
  }

  function progressKey(scene) {
    return `logosx:bibleVivaProgress:${scene?.id || "unknown"}`;
  }

  function completedKey(scene) {
    return `logosx:bibleVivaCompleted:${scene?.id || "unknown"}`;
  }

  function readCompleted(scene) {
    try {
      const value = JSON.parse(localStorage.getItem(completedKey(scene)) || "[]");
      return Array.isArray(value) ? value.map(Number).filter((item) => Number.isFinite(item) && item >= 0) : [];
    } catch (_) {
      return [];
    }
  }

  function saveCompleted() {
    if (!state.scene) return;
    try {
      localStorage.setItem(completedKey(state.scene), JSON.stringify([...new Set(state.completedEvents)].sort((a, b) => a - b)));
    } catch (error) {
      console.warn("Bíblia Viva: etapas concluídas não puderam ser salvas", error);
    }
  }

  function noteKey(scene, eventIndex) {
    return `logosx:bibleVivaNote:${scene?.id || "unknown"}:${Number(eventIndex) || 0}`;
  }

  function readNote(scene, eventIndex) {
    try {
      return String(localStorage.getItem(noteKey(scene, eventIndex)) || "");
    } catch (_) {
      return "";
    }
  }

  function saveNote(value, silent) {
    if (!state.scene) return;
    const text = String(value || "").trim();
    try {
      if (text) localStorage.setItem(noteKey(state.scene, state.activeEvent), text.slice(0, 2400));
      else localStorage.removeItem(noteKey(state.scene, state.activeEvent));
      if (!silent) {
        const note = $("[data-imm-source-note]", modal);
        if (note) note.textContent = text ? "✓ Anotação salva nesta etapa, neste dispositivo." : "Anotação removida desta etapa.";
      }
    } catch (error) {
      console.warn("Bíblia Viva: anotação não pôde ser salva", error);
    }
  }

  function scheduleNoteSave(value) {
    if (state.noteTimer) window.clearTimeout(state.noteTimer);
    state.noteTimer = window.setTimeout(() => {
      state.noteTimer = null;
      saveNote(value, true);
      const note = $("[data-imm-source-note]", modal);
      if (note) note.textContent = "✓ Rascunho salvo automaticamente neste dispositivo.";
    }, 650);
  }

  function flushNoteDraft() {
    if (state.noteTimer) window.clearTimeout(state.noteTimer);
    state.noteTimer = null;
    const input = $("[data-imm-note]", modal);
    if (input) saveNote(input.value, true);
  }

  function favoriteKey(scene) {
    return `logosx:bibleVivaFavorite:${scene?.id || "unknown"}`;
  }

  function readFavorite(scene) {
    try {
      return localStorage.getItem(favoriteKey(scene)) === "1";
    } catch (_) {
      return false;
    }
  }

  function toggleFavorite() {
    if (!state.scene) return;
    state.favorite = !state.favorite;
    try {
      if (state.favorite) localStorage.setItem(favoriteKey(state.scene), "1");
      else localStorage.removeItem(favoriteKey(state.scene));
    } catch (error) {
      console.warn("Bíblia Viva: favorito não pôde ser salvo", error);
    }
    const note = $("[data-imm-source-note]", modal);
    if (note) note.textContent = state.favorite ? "★ Cena adicionada aos favoritos neste dispositivo." : "Cena removida dos favoritos neste dispositivo.";
    syncFavoriteButton();
  }

  function toggleEventCompleted(index) {
    const value = Number(index);
    if (!Number.isFinite(value) || !state.scene) return;
    const completed = new Set(state.completedEvents);
    if (completed.has(value)) completed.delete(value);
    else completed.add(value);
    state.completedEvents = [...completed].sort((a, b) => a - b);
    saveCompleted();
    renderAll();
    focusActiveEvent();
  }

  function stopTour() {
    if (state.tourTimer) window.clearInterval(state.tourTimer);
    state.tourTimer = null;
    state.tourActive = false;
  }

  function toggleTour() {
    if (!state.scene) return;
    if (state.tourActive) {
      stopTour();
      renderAll();
      return;
    }
    const total = state.scene.events?.length || 1;
    if (total <= 1) {
      const note = $("[data-imm-source-note]", modal);
      if (note) note.textContent = "Esta cena possui uma única etapa; use os painéis para aprofundar o estudo.";
      return;
    }
    state.tourActive = true;
    state.tourTimer = window.setInterval(() => {
      if (!modal?.classList.contains("is-open") || !state.tourActive) {
        stopTour();
        return;
      }
      if (state.activeEvent >= total - 1) {
        stopTour();
        renderAll();
        return;
      }
      cycleEvent(1, "scene");
    }, 7000);
    renderAll();
  }

  function syncPresentationButton() {
    const button = $("[data-imm-action='presentation']", modal);
    if (!button) return;
    button.textContent = state.presentationActive ? "⏹ Sair da apresentação" : "🎬 Modo apresentação";
    button.setAttribute("aria-pressed", state.presentationActive ? "true" : "false");
    button.classList.toggle("is-selected", state.presentationActive);
  }

  function setPresentationMode(active) {
    if (!state.scene || !modal) return;
    state.presentationActive = Boolean(active);
    state.activeTab = "scene";
    const dialog = $(".bx-immersion-dialog", modal);
    dialog?.classList.toggle("bx-immersion-presentation", state.presentationActive);
    if (state.presentationActive) {
      renderAll();
      if (!state.tourActive && (state.scene.events?.length || 1) > 1) toggleTour();
      if (!isImmersionFullscreenActive(dialog)) toggleFullscreen();
      syncPresentationButton();
      return;
    }
    stopTour();
    renderAll();
    if (isImmersionFullscreenActive(dialog)) toggleFullscreen();
    else setImmersionFullscreenUi(false);
    syncPresentationButton();
  }

  function togglePresentation() {
    setPresentationMode(!state.presentationActive);
  }

  function syncShortcuts() {
    const button = $("[data-imm-action='shortcuts']", modal);
    const panel = $("[data-imm-shortcuts]", modal);
    if (button) button.setAttribute("aria-expanded", state.shortcutsOpen ? "true" : "false");
    if (panel) panel.hidden = !state.shortcutsOpen;
  }

  function toggleShortcuts() {
    state.shortcutsOpen = !state.shortcutsOpen;
    syncShortcuts();
  }

  function readProgress(scene) {
    try {
      const value = JSON.parse(localStorage.getItem(progressKey(scene)) || "null");
      return value && Number.isFinite(Number(value.event)) ? value : null;
    } catch (_) {
      return null;
    }
  }

  function readLastScene() {
    try {
      const value = JSON.parse(localStorage.getItem(LAST_SCENE_KEY) || "null");
      return value && value.reference ? value : null;
    } catch (_) {
      return null;
    }
  }

  function rememberLastScene() {
    if (!state.scene) return;
    try {
      localStorage.setItem(LAST_SCENE_KEY, JSON.stringify({
        reference: state.ref || state.scene.reference,
        event: state.activeEvent,
        title: state.scene.title || "Entrar na história",
        savedAt: new Date().toISOString()
      }));
    } catch (error) {
      console.warn("Bíblia Viva: última cena não pôde ser guardada", error);
    }
  }

  function saveProgress() {
    if (!state.scene) return;
    rememberLastScene();
    try {
      localStorage.setItem(progressKey(state.scene), JSON.stringify({
        event: state.activeEvent,
        ref: state.currentNarrativeRef || state.ref,
        savedAt: new Date().toISOString()
      }));
      const status = $("[data-imm-progress-status]", modal);
      if (status) status.textContent = "✓ Percurso salvo neste dispositivo";
    } catch (error) {
      console.warn("Bíblia Viva: progresso não pôde ser salvo", error);
    }
  }

  function eventForReference(ref, scene) {
    const map = scene?.verseMap || [];
    const wanted = norm(ref);
    if (!wanted || !map.length) return null;
    const hit = map.find((item) => {
      const candidate = norm(item.match);
      return wanted === candidate || wanted.startsWith(candidate) || candidate.startsWith(wanted);
    });
    return hit && Number.isFinite(Number(hit.event)) ? Number(hit.event) : null;
  }

  function cycleEvent(step, tab) {
    const total = state.scene?.events?.length || 1;
    state.activeEvent = (state.activeEvent + step + total) % total;
    state.activeTab = tab || "scene";
    saveProgress();
    renderAll();
    focusActiveEvent();
  }

  function focusActiveEvent() {
    const current = $(`[data-imm-event="${state.activeEvent}"]`, modal);
    current?.scrollIntoView?.({ block: "nearest", behavior: "smooth" });
  }

  function isolateImmersionWheel(event) {
    if (!event.currentTarget?.classList.contains("is-open")) return;
    /* O app principal pode escutar wheel no document. O modal mantém o
       comportamento nativo de rolagem, mas impede que a página de trás
       interprete o mesmo gesto como zoom, troca de painel ou navegação. */
    event.stopPropagation();
  }

  function ensureModal() {
    if (modal) return modal;
    modal = document.createElement("div");
    modal.id = "bxImmersionModal";
    modal.setAttribute("aria-hidden", "true");
    modal.innerHTML = `
      <div class="bx-immersion-backdrop" data-imm-close="1"></div>
      <section class="bx-immersion-dialog" role="dialog" aria-modal="true" aria-labelledby="bxImmersionTitle">
        <header class="bx-immersion-topbar">
          <div>
            <p class="bx-immersion-kicker">Bíblia Viva • Modo Imersão</p>
            <h2 id="bxImmersionTitle" data-imm-title>Entrar na história</h2>
            <p class="bx-immersion-subtitle" data-imm-subtitle></p>
            <div class="bx-immersion-meta" data-imm-meta></div>
          </div>
          <div class="bx-immersion-top-actions">
            <button type="button" class="bx-immersion-action-btn" data-imm-action="catalog">✦ Catálogo</button>
            <button type="button" class="bx-immersion-icon-btn" data-imm-close="1" aria-label="Fechar Modo Imersão">×</button>
          </div>
        </header>
        <nav class="bx-immersion-tabs" role="tablist" aria-label="Camadas da Bíblia Viva">
          <button type="button" class="bx-immersion-tab is-active" role="tab" aria-selected="true" aria-controls="bxImmersionContextPanel" data-imm-tab="scene">◉ Cena</button>
          <button type="button" class="bx-immersion-tab" role="tab" aria-selected="false" aria-controls="bxImmersionContextPanel" data-imm-tab="map">⌖ Mapa</button>
          <button type="button" class="bx-immersion-tab" role="tab" aria-selected="false" aria-controls="bxImmersionContextPanel" data-imm-tab="people">♙ Personagens</button>
          <button type="button" class="bx-immersion-tab" role="tab" aria-selected="false" aria-controls="bxImmersionContextPanel" data-imm-tab="timeline">◷ Linha do tempo</button>
          <button type="button" class="bx-immersion-tab" role="tab" aria-selected="false" aria-controls="bxImmersionContextPanel" data-imm-tab="context">🧭 Contexto</button>
        </nav>
        <main class="bx-immersion-grid">
          <section class="bx-immersion-scene-panel">
            <div class="bx-immersion-stage" data-imm-stage></div>
            <p class="bx-immersion-stage-caption" data-imm-caption aria-live="polite"></p>
            <div class="bx-immersion-quick-context" data-imm-quick-context aria-label="Atalhos de contexto"></div>
            <div class="bx-immersion-connection-hub" data-imm-connection-hub aria-label="Conexões da passagem"></div>
            <div class="bx-immersion-stage-actions">
              <button type="button" class="bx-immersion-action-btn is-primary" data-imm-action="speak">🔊 Ouvir a cena</button>
              <button type="button" class="bx-immersion-action-btn" data-imm-action="tour" aria-pressed="false">▶ Passeio guiado</button>
              <button type="button" class="bx-immersion-action-btn" data-imm-action="presentation" aria-pressed="false">🎬 Modo apresentação</button>
              <button type="button" class="bx-immersion-action-btn" data-imm-action="shortcuts" aria-expanded="false" aria-controls="bxImmersionShortcuts">⌨ Atalhos</button>
              <button type="button" class="bx-immersion-action-btn" data-imm-action="visual">🌄 Carregar imagens</button>
              <button type="button" class="bx-immersion-action-btn" data-imm-action="media">🖼 Mídia X</button>
              <button type="button" class="bx-immersion-action-btn" data-imm-action="generate">✨ Gerar com IA</button>
              <button type="button" class="bx-immersion-action-btn" data-imm-action="panorama">◉ Buscar 360°</button>
              <button type="button" class="bx-immersion-action-btn" data-imm-action="atlas">🗺️ Abrir Atlas</button>
            </div>
            <div class="bx-immersion-shortcuts" id="bxImmersionShortcuts" data-imm-shortcuts hidden aria-label="Atalhos do Modo Imersão">
              <span><kbd>←</kbd><kbd>→</kbd> navegar etapas</span>
              <span><kbd>Home</kbd><kbd>End</kbd> início/fim</span>
              <span><kbd>P</kbd> passeio guiado</span>
              <span><kbd>A</kbd> apresentação</span>
              <span><kbd>Espaço</kbd> ouvir/pausar</span>
              <span><kbd>Esc</kbd> fechar</span>
            </div>
          </section>
          <section class="bx-immersion-reading-panel">
            <div class="bx-immersion-reading-head">
              <div>
                <p class="bx-immersion-section-label">Texto em foco</p>
                <h3>O que acontece?</h3>
              </div>
              <span class="bx-immersion-ref" data-imm-ref></span>
            </div>
            <blockquote class="bx-immersion-verse is-empty" data-imm-verse>Selecione um versículo para manter o texto ao lado da cena.</blockquote>
            <div class="bx-immersion-verse-anchors" data-imm-verse-anchors aria-label="Âncoras do texto bíblico"></div>
            <div class="bx-immersion-progress-box">
              <div class="bx-immersion-progress-head">
                <span class="bx-immersion-section-label">Percurso da passagem</span>
                <strong data-imm-progress-text>1/1 etapa</strong>
              </div>
              <div class="bx-immersion-progress-track"><span data-imm-progress-bar></span></div>
              <div class="bx-immersion-progress-scrubber">
                <span class="bx-immersion-section-label">Navegar pelas etapas</span>
                <input type="range" class="bx-immersion-progress-range" data-imm-progress-range min="0" max="0" value="0" step="1" aria-label="Navegar pelas etapas da passagem" aria-valuetext="Etapa 1 de 1">
              </div>
              <div class="bx-immersion-progress-controls">
                <button type="button" class="bx-immersion-action-btn" data-imm-action="prev">← Anterior</button>
                <div class="bx-immersion-progress-dots" data-imm-progress-dots></div>
                <button type="button" class="bx-immersion-action-btn" data-imm-action="next">Próxima →</button>
              </div>
              <div class="bx-immersion-progress-quick">
                <button type="button" class="bx-immersion-action-btn" data-imm-action="complete-current" aria-pressed="false">○ Concluir etapa atual</button>
                <span data-imm-progress-percent>0% do percurso concluído</span>
              </div>
              <p class="bx-immersion-progress-status" data-imm-progress-status aria-live="polite">O progresso é salvo apenas neste dispositivo.</p>
            </div>
            <p class="bx-immersion-section-label">Sequência narrativa</p>
            <div class="bx-immersion-event-list" data-imm-events></div>
            <div class="bx-immersion-reading-actions">
              <button type="button" class="bx-immersion-action-btn" data-imm-action="reader">📖 Abrir esta etapa na Bíblia</button>
              <button type="button" class="bx-immersion-action-btn" data-imm-action="save">☆ Salvar percurso</button>
              <button type="button" class="bx-immersion-action-btn" data-imm-action="favorite" aria-pressed="false">☆ Favoritar cena</button>
              <button type="button" class="bx-immersion-action-btn" data-imm-action="copy">📋 Copiar ficha</button>
              <button type="button" class="bx-immersion-action-btn" data-imm-action="export">⬇ Exportar TXT</button>
            </div>
          </section>
          <aside class="bx-immersion-context-panel" id="bxImmersionContextPanel" role="tabpanel" tabindex="0">
            <p class="bx-immersion-section-label" data-imm-context-label>Contexto vivo</p>
            <div data-imm-detail></div>
          </aside>
        </main>
        <footer class="bx-immersion-footer">
          <span class="bx-immersion-source-note" data-imm-source-note aria-live="polite"></span>
          <div class="bx-immersion-footer-actions">
            <button type="button" class="bx-immersion-action-btn" data-imm-action="share">↗ Compartilhar</button>
            <button type="button" class="bx-immersion-action-btn" data-imm-action="studio">🧬 Enviar ao Studio X</button>
            <button type="button" class="bx-immersion-action-btn is-primary" data-imm-close="1">Voltar à Bíblia</button>
          </div>
        </footer>
      </section>`;
    mountQuadrantControls();
    document.body.appendChild(modal);
    modal.addEventListener("click", handleModalClick);
    modal.addEventListener("input", handleModalInput);
    modal.addEventListener("wheel", isolateImmersionWheel, { passive: false });
    return modal;
  }

  function mountQuadrantControls() {
    const definitions = [
      ["scene", ".bx-immersion-scene-panel", "Cena"],
      ["reading", ".bx-immersion-reading-panel", "Texto"],
      ["context", ".bx-immersion-context-panel", "Contexto"]
    ];
    definitions.forEach(([mode, selector, label]) => {
      const panel = $(selector, modal);
      if (!panel || panel.querySelector("[data-imm-quadrant-controls]")) return;
      panel.dataset.immQuadrant = mode;
      const controls = document.createElement("div");
      controls.className = "bx-immersion-quadrant-controls";
      controls.dataset.immQuadrantControls = mode;
      controls.setAttribute("aria-label", `Controles de foco do quadrante ${label}`);
      controls.innerHTML = `<strong>Foco: ${label}</strong><span class="bx-immersion-quadrant-zoom-label">100%</span><button type="button" data-imm-quadrant-action="zoom-out" aria-label="Reduzir zoom de ${label}" title="Reduzir zoom">−</button><button type="button" data-imm-quadrant-action="zoom-in" aria-label="Aumentar zoom de ${label}" title="Aumentar zoom">＋</button><button type="button" data-imm-quadrant-action="fullscreen" aria-label="Abrir somente ${label} em tela cheia" title="Tela cheia exclusiva">⛶ Tela</button>`;
      const body = document.createElement("div");
      body.className = "bx-immersion-quadrant-body";
      body.dataset.immQuadrantBody = mode;
      Array.from(panel.childNodes).forEach((node) => body.appendChild(node));
      panel.append(controls, body);
    });
  }

  function syncQuadrantFocusUI() {
    const dialog = $(".bx-immersion-dialog", modal);
    if (!dialog) return;
    ["scene", "reading", "context"].forEach((mode) => {
      const label = $(`[data-imm-quadrant-controls="${mode}"] .bx-immersion-quadrant-zoom-label`, modal);
      if (label) label.textContent = `${Math.round((state.quadrantFocus.zoom || 1) * 100)}%`;
      const panel = $(`[data-imm-quadrant="${mode}"]`, modal);
      if (panel) {
        panel.style.setProperty("--bx-quadrant-zoom", String(state.quadrantFocus.zoom || 1));
        panel.classList.toggle("bx-immersion-focus-visible", state.quadrantFocus.mode === mode);
      }
    });
    dialog.classList.remove("bx-immersion-focus-scene", "bx-immersion-focus-reading", "bx-immersion-focus-context", "bx-immersion-focus-half", "bx-immersion-focus-full");
    if (state.quadrantFocus.mode) dialog.classList.add(`bx-immersion-focus-${state.quadrantFocus.mode}`, `bx-immersion-focus-${state.quadrantFocus.size}`);
  }

  function setQuadrantFocus(mode, size = "full") {
    if (!["scene", "reading", "context"].includes(mode)) return;
    state.quadrantFocus.mode = mode;
    state.quadrantFocus.size = size === "half" ? "half" : "full";
    syncQuadrantFocusUI();
  }

  function resetQuadrantFocus() {
    state.quadrantFocus = { mode: "", size: "full", zoom: 1 };
    syncQuadrantFocusUI();
  }

  function catalogSearchText(scene) {
    return norm([
      scene?.title,
      scene?.reference,
      scene?.subtitle,
      scene?.theme,
      scene?.period,
      scene?.place?.name,
      scene?.place?.query,
      scene?.mediaQuery,
      ...(scene?.people || []).map((person) => `${person.name || ""} ${person.role || ""}`),
      ...(scene?.geography || []).map((item) => `${item.title || ""} ${item.text || ""}`),
      ...(scene?.culturalNotes || []).map((item) => `${item.title || ""} ${item.text || ""}`)
    ].filter(Boolean).join(" "));
  }

  function catalogNoteCount(scene) {
    return (scene?.events || []).filter((_, index) => !!readNote(scene, index)).length;
  }

  function catalogMatches(scene) {
    const tokens = norm(catalogState.query).split(" ").filter(Boolean);
    const haystack = catalogSearchText(scene);
    if (tokens.some((token) => !haystack.includes(token))) return false;
    const period = norm(scene?.period);
    if (catalogState.filter === "parabola" && !period.includes("parabola")) return false;
    if (catalogState.filter === "narrative" && period.includes("parabola")) return false;
    if (catalogState.filter === "map" && !(scene?.place || scene?.route?.length)) return false;
    if (catalogState.filter === "people" && !(scene?.people || []).length) return false;
    if (catalogState.filter === "favorite" && !readFavorite(scene)) return false;
    if (catalogState.filter === "notes" && !catalogNoteCount(scene)) return false;
    if (catalogState.place !== "all" && norm(scene?.place?.name) !== norm(catalogState.place)) return false;
    return true;
  }

  function relatedScenes(scene) {
    const current = scene || {};
    const currentPlace = norm(current.place?.name);
    const currentPeople = new Set((current.people || []).map((person) => norm(person.name)).filter(Boolean));
    const ignored = new Set(["cena", "passagem", "historia", "leitura", "biblia", "jesus", "senhor", "para", "como", "uma", "com", "dos", "das", "que"]);
    const currentTokens = norm([current.title, current.theme, current.place?.name].filter(Boolean).join(" "))
      .split(/[^a-z0-9]+/)
      .filter((token) => token.length >= 4 && !ignored.has(token));
    return (state.scenes || [])
      .filter((candidate) => candidate && candidate.id !== current.id)
      .map((candidate) => {
        let score = 0;
        const reasons = [];
        if (currentPlace && norm(candidate.place?.name) === currentPlace) {
          score += 6;
          reasons.push("Mesmo lugar");
        }
        const sharedPeople = (candidate.people || [])
          .map((person) => person.name)
          .filter((name) => currentPeople.has(norm(name)));
        if (sharedPeople.length) {
          score += Math.min(4, sharedPeople.length * 2);
          reasons.push(`Personagem: ${sharedPeople[0]}`);
        }
        const candidateText = catalogSearchText(candidate);
        const sharedTokens = currentTokens.filter((token) => candidateText.includes(token));
        if (sharedTokens.length) {
          score += Math.min(3, sharedTokens.length);
          if (!reasons.length) reasons.push("Tema relacionado");
        }
        return { scene: candidate, score, reason: reasons[0] || "Outra camada de estudo" };
      })
      .filter((item) => item.score > 0)
      .sort((a, b) => b.score - a.score || String(a.scene.title || "").localeCompare(String(b.scene.title || ""), "pt-BR"))
      .slice(0, 3);
  }

  function getMediaPlacementCandidates(media = {}) {
    const seed = norm([
      media.reference,
      media.place,
      ...(Array.isArray(media.tags) ? media.tags : []),
      media.title,
      media.description
    ].filter(Boolean).join(" "));
    const seedTokens = new Set(seed.split(/[^a-z0-9]+/).filter((token) => token.length >= 4));
    const directReference = String(media.reference || "").trim();
    const addUnique = (list, value) => {
      const clean = String(value || "").trim();
      if (clean && !list.some((item) => norm(item) === norm(clean))) list.push(clean);
    };
    const references = [];
    addUnique(references, directReference);
    const ranked = (state.scenes || []).map((scene) => {
      const sceneText = norm(catalogSearchText(scene));
      const sceneTokens = sceneText.split(/[^a-z0-9]+/).filter((token) => token.length >= 4);
      let score = 0;
      if (directReference && norm(scene.reference).includes(norm(directReference))) score += 20;
      if (directReference) {
        const directChapter = norm(directReference).match(/^(.*?\s+\d+)/)?.[1];
        if (directChapter && norm(scene.reference).startsWith(directChapter)) score += 12;
      }
      if (media.place && norm(scene.place?.name) && norm(media.place).includes(norm(scene.place.name))) score += 9;
      score += Math.min(6, sceneTokens.filter((token) => seedTokens.has(token)).length * 2);
      return { scene, score };
    }).filter((item) => item.score > 0).sort((a, b) => b.score - a.score);
    ranked.slice(0, 6).forEach(({ scene }) => {
      addUnique(references, scene.reference);
      (scene.events || []).slice(0, 6).forEach((event) => addUnique(references, event.ref));
    });
    // The related-scene index is intentionally local/offline and brings in
    // nearby Gospel narratives that share place, people or theme.
    relatedScenes(state.scene).forEach(({ scene }) => {
      addUnique(references, scene.reference);
      (scene.events || []).slice(0, 4).forEach((event) => addUnique(references, event.ref));
    });
    return references.slice(0, 16);
  }

  function ensureCatalogModal() {
    if (catalogModal) return catalogModal;
    catalogModal = document.createElement("div");
    catalogModal.id = "bxImmersionCatalogModal";
    catalogModal.setAttribute("aria-hidden", "true");
    catalogModal.innerHTML = `
      <div class="bx-immersion-backdrop" data-imm-catalog-close="1"></div>
      <section class="bx-immersion-catalog-dialog" role="dialog" aria-modal="true" aria-labelledby="bxImmersionCatalogTitle">
        <header class="bx-immersion-catalog-header">
          <div>
            <p class="bx-immersion-kicker">Bíblia Viva • Explorar</p>
            <h2 id="bxImmersionCatalogTitle">Catálogo de cenas</h2>
            <p>Escolha uma passagem e entre na história por texto, contexto, mapa, pessoas, mídia e linha do tempo.</p>
          </div>
          <div class="bx-immersion-catalog-header-actions">
            <button type="button" class="bx-immersion-action-btn" data-imm-catalog-resume hidden>↺ Retomar estudo</button>
            <button type="button" class="bx-immersion-icon-btn" data-imm-catalog-close="1" aria-label="Fechar catálogo">×</button>
          </div>
        </header>
        <div class="bx-immersion-catalog-toolbar">
          <label class="bx-immersion-catalog-search"><span>Pesquisar no catálogo</span><input type="search" data-imm-catalog-search placeholder="Ex.: João 4, estrada, água, Pedro, Jerusalém..." autocomplete="off"></label>
          <label><span>Tipo de cena</span><select data-imm-catalog-filter><option value="all">Todas as cenas</option><option value="narrative">Narrativas</option><option value="parabola">Parábolas</option><option value="map">Com lugar/mapa</option><option value="people">Com personagens</option><option value="favorite">Minhas favoritas</option><option value="notes">Com minhas notas</option></select></label>
          <label><span>Lugar</span><select data-imm-catalog-place><option value="all">Todos os lugares</option></select></label>
          <button type="button" class="bx-immersion-action-btn" data-imm-catalog-clear>Limpar filtros</button>
        </div>
        <div class="bx-immersion-catalog-summary" data-imm-catalog-summary aria-live="polite"></div>
        <div class="bx-immersion-catalog-grid" data-imm-catalog-grid></div>
      </section>`;
    document.body.appendChild(catalogModal);
    catalogModal.addEventListener("click", handleCatalogClick);
    catalogModal.addEventListener("input", handleCatalogInput);
    catalogModal.addEventListener("change", handleCatalogInput);
    catalogModal.addEventListener("wheel", isolateImmersionWheel, { passive: false });
    return catalogModal;
  }

  function renderCatalog() {
    if (!catalogModal) return;
    const scenes = Array.isArray(state.scenes) ? state.scenes : [];
    const lastScene = readLastScene();
    const resumeButton = $("[data-imm-catalog-resume]", catalogModal);
    if (resumeButton) {
      resumeButton.hidden = !lastScene;
      resumeButton.textContent = lastScene ? "↺ Retomar último estudo" : "↺ Retomar estudo";
      resumeButton.title = lastScene ? `${lastScene.title || "Última cena"} • ${lastScene.reference}` : "Nenhum estudo salvo neste dispositivo";
    }
    const placeValues = [...new Map(scenes
      .map((scene) => [norm(scene.place?.name), scene.place?.name])
      .filter(([key, value]) => key && value)).values()]
      .sort((a, b) => String(a).localeCompare(String(b), "pt-BR"));
    const placeSelect = $("[data-imm-catalog-place]", catalogModal);
    if (placeSelect) {
      placeSelect.innerHTML = `<option value="all">Todos os lugares</option>${placeValues.map((place) => `<option value="${esc(place)}">${esc(place)}</option>`).join("")}`;
      placeSelect.value = placeValues.some((place) => norm(place) === norm(catalogState.place)) ? catalogState.place : "all";
    }
    const filter = $("[data-imm-catalog-filter]", catalogModal);
    if (filter) filter.value = catalogState.filter;
    const input = $("[data-imm-catalog-search]", catalogModal);
    if (input && input.value !== catalogState.query) input.value = catalogState.query;
    const filtered = scenes.filter(catalogMatches);
    const summary = $("[data-imm-catalog-summary]", catalogModal);
    if (summary) summary.textContent = `${state.catalogOffline ? "✓ Catálogo local disponível offline • " : ""}${filtered.length} de ${scenes.length} cenas • busque por texto, tema, personagem ou lugar`;
    const grid = $("[data-imm-catalog-grid]", catalogModal);
    if (!grid) return;
    if (!filtered.length) {
      grid.innerHTML = `<div class="bx-immersion-catalog-empty"><strong>Nenhuma cena encontrada</strong><p>Tente outro termo ou limpe os filtros para explorar o catálogo completo.</p></div>`;
      return;
    }
    grid.innerHTML = filtered.map((scene) => {
      const total = (scene.events || []).length || 1;
      const completed = readCompleted(scene).filter((index) => index < total).length;
      const noteCount = catalogNoteCount(scene);
      const favorite = readFavorite(scene);
      const people = (scene.people || []).slice(0, 3).map((person) => person.name).filter(Boolean).join(" • ");
      return `<article class="bx-immersion-catalog-card">
        <div class="bx-immersion-catalog-card-top"><span class="bx-immersion-catalog-badge">${esc(scene.period || "Cena bíblica")}</span>${favorite ? `<span class="bx-immersion-catalog-favorite" title="Favorita neste dispositivo">★</span>` : ""}</div>
        <h3>${esc(scene.title || "Entrar na história")}</h3>
        <p class="bx-immersion-catalog-ref">${esc(scene.reference || "Referência em estudo")}</p>
        <p>${esc(scene.subtitle || scene.theme || "Explore esta passagem em camadas.")}</p>
        <div class="bx-immersion-catalog-place">⌖ ${esc(scene.place?.name || "Lugar em investigação")}</div>
        <div class="bx-immersion-catalog-meta"><span>◷ ${completed}/${total} etapas</span>${people ? `<span>♙ ${esc(people)}</span>` : ""}${noteCount ? `<span>📝 ${noteCount} nota${noteCount === 1 ? "" : "s"}</span>` : ""}</div>
        <button type="button" class="bx-immersion-action-btn is-primary" data-imm-catalog-open="${esc(scene.reference || scene.matches?.[0] || scene.title)}">Entrar nesta cena →</button>
      </article>`;
    }).join("");
  }

  function requestCatalogFullscreen() {
    const dialog = $(".bx-immersion-catalog-dialog", catalogModal);
    if (!dialog) return;
    const native = fullscreenElement();
    if (native === dialog || dialog.hasAttribute("data-bx-catalog-fallback")) return;
    const request = dialog.requestFullscreen || dialog.webkitRequestFullscreen;
    if (typeof request !== "function") {
      dialog.setAttribute("data-bx-catalog-fallback", "1");
      dialog.classList.add("bx-immersion-catalog-fullscreen");
      return;
    }
    try {
      const result = request.call(dialog, { navigationUI: "hide" });
      if (result?.catch) result.catch(() => {
        dialog.setAttribute("data-bx-catalog-fallback", "1");
        dialog.classList.add("bx-immersion-catalog-fullscreen");
      });
    } catch (_) {
      dialog.setAttribute("data-bx-catalog-fallback", "1");
      dialog.classList.add("bx-immersion-catalog-fullscreen");
    }
  }

  function openCatalog(trigger) {
    catalogState.lastFocus = trigger || document.activeElement;
    ensureCatalogModal();
    catalogModal.classList.add("is-open");
    catalogModal.setAttribute("aria-hidden", "false");
    document.body.classList.add("bx-immersion-lock");
    if (modal?.classList.contains("is-open")) {
      modal.classList.remove("is-open");
      modal.setAttribute("aria-hidden", "true");
      setImmersionFullscreenUi(false);
    }
    requestCatalogFullscreen();
    const requestId = ++catalogOpenRequest;
    loadScenes().then(() => {
      if (requestId !== catalogOpenRequest) return;
      renderCatalog();
      setTimeout(() => $("[data-imm-catalog-search]", catalogModal)?.focus(), 30);
    });
  }

  function closeCatalog() {
    if (!catalogModal) return;
    catalogOpenRequest += 1;
    const dialog = $(".bx-immersion-catalog-dialog", catalogModal);
    if (fullscreenElement() === dialog && typeof document.exitFullscreen === "function") {
      Promise.resolve(document.exitFullscreen()).catch(() => {});
    }
    dialog?.removeAttribute("data-bx-catalog-fallback");
    dialog?.classList.remove("bx-immersion-catalog-fullscreen");
    catalogModal.classList.remove("is-open");
    catalogModal.setAttribute("aria-hidden", "true");
    if (!modal?.classList.contains("is-open")) document.body.classList.remove("bx-immersion-lock");
    if (catalogState.lastFocus && typeof catalogState.lastFocus.focus === "function") catalogState.lastFocus.focus();
  }

  function handleCatalogInput(event) {
    const target = event.target;
    if (!target || !catalogModal?.classList.contains("is-open")) return;
    if (target.matches("[data-imm-catalog-search]")) catalogState.query = target.value || "";
    if (target.matches("[data-imm-catalog-filter]")) catalogState.filter = target.value || "all";
    if (target.matches("[data-imm-catalog-place]")) catalogState.place = target.value || "all";
    renderCatalog();
    if (target.matches("[data-imm-catalog-search]")) {
      const input = $("[data-imm-catalog-search]", catalogModal);
      input?.focus();
      input?.setSelectionRange?.(input.value.length, input.value.length);
    }
  }

  function catalogTextForReference(reference) {
    const wanted = norm(reference);
    const verse = $$(".lmx-bible-v3-verse[data-ref], [data-bx-v3-verse][data-ref]").find((node) => {
      const ref = norm(node.getAttribute("data-ref"));
      return ref === wanted || ref.startsWith(wanted) || wanted.startsWith(ref);
    });
    return verse ? $(".lmx-bible-v3-text, [data-bx-verse-text]", verse)?.innerText || "" : "";
  }

  function handleCatalogClick(event) {
    const target = event.target;
    const resume = target.closest("[data-imm-catalog-resume]");
    if (resume) {
      const lastScene = readLastScene();
      if (!lastScene?.reference) return;
      const focus = catalogState.lastFocus;
      closeCatalog();
      open(lastScene.reference, catalogTextForReference(lastScene.reference), focus);
      return;
    }
    if (target.closest("[data-imm-catalog-close]")) {
      event.preventDefault();
      closeCatalog();
      return;
    }
    const clear = target.closest("[data-imm-catalog-clear]");
    if (clear) {
      catalogState.query = "";
      catalogState.filter = "all";
      catalogState.place = "all";
      renderCatalog();
      $("[data-imm-catalog-search]", catalogModal)?.focus();
      return;
    }
    const openButton = target.closest("[data-imm-catalog-open]");
    if (!openButton) return;
    const reference = openButton.dataset.immCatalogOpen || "Passagem selecionada";
    const focus = catalogState.lastFocus;
    closeCatalog();
    open(reference, catalogTextForReference(reference), focus);
  }

  function sceneIllustration(scene) {
    const type = safeClass(scene?.sceneClass);
    const hills = `<path class="bx-scene-hill bx-scene-hill-back" d="M0 352 Q120 252 254 332 T512 305 T772 292 T1000 328 L1000 620 0 620Z"/><path class="bx-scene-hill bx-scene-hill-mid" d="M0 410 Q140 338 298 397 T574 370 T830 391 T1000 352 L1000 620 0 620Z"/>`;
    const road = `<path class="bx-scene-road" d="M-30 610 C210 542 274 475 432 424 S712 365 1035 318"/>`;
    const village = `<path class="bx-scene-village" d="M112 420v-45h32v45h13v-62h38v62h17v-31h30v31h20v-55h42v55h22v-29h29v29h27v-44h35v44Z"/>`;
    const palms = `<g class="bx-scene-palms"><path d="M792 430V286M792 300q-38-28-62-14M792 315q35-39 68-35M792 329q-4-39 20-58"/><path d="M854 442V321M854 335q-34-25-58-16M854 350q30-34 58-31"/></g>`;
    const wall = `<path class="bx-scene-wall" d="M80 426V331h48v-30h45v30h44v-44h49v44h45v-27h47v27h52v95Z"/><path class="bx-scene-wall-top" d="M80 331h48v-30h45v30h44v-44h49v44h45v-27h47v27h52"/>`;
    const sea = `<path class="bx-scene-sea-line" d="M0 332 Q160 314 320 336 T640 325 T1000 337"/><path class="bx-scene-sea-line second" d="M0 370 Q170 352 330 374 T670 364 T1000 376"/>`;
    let content = hills + road + village;
    if (type === "jerico") content = hills + wall + palms + road;
    if (type === "jerusalem") content = hills + wall + `<path class="bx-scene-temple" d="M386 420v-78h42v-38h56v38h44v78Z"/><path class="bx-scene-temple-roof" d="M400 304 456 263l58 41Z"/>` + road;
    if (type === "exodo") content = `<path class="bx-scene-hill bx-scene-hill-back" d="M0 382 Q160 284 308 354 T610 335 T1000 372 L1000 620 0 620Z"/>` + sea + `<path class="bx-scene-shore" d="M0 438 Q164 418 317 443 T618 430 T1000 446 L1000 620 0 620Z"/>`;
    if (type === "malta") content = sea + `<path class="bx-scene-shore" d="M0 458 Q210 419 370 448 T690 435 T1000 451 L1000 620 0 620Z"/>` + road;
    if (type === "carmelo") content = hills + `<path class="bx-scene-altar" d="M462 440h110l-18-21h-74Z M485 418h64l-13-36h-38Z"/>` + road;
    if (type === "damasco") content = hills + palms + village + road;
    if (type === "campo") content = hills + `<path class="bx-scene-furrows" d="M34 522 210 435M118 560 330 438M268 603 452 467M595 610 760 470M730 610 900 486"/>` + road;
    return `<svg class="bx-immersion-scene-illustration" viewBox="0 0 1000 620" preserveAspectRatio="none" aria-hidden="true"><defs><linearGradient id="bxSceneDepth" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#a9d3d0" stop-opacity=".18"/><stop offset="1" stop-color="#091722" stop-opacity=".52"/></linearGradient></defs><rect class="bx-scene-atmosphere" width="1000" height="620" fill="url(#bxSceneDepth)"/>${content}</svg>`;
  }

  const MINI_MAP_COORDS = Object.freeze({
    jerusalem: [40, 43], judeia: [40, 45], bethlehem: [38, 48], jerico: [52, 42], samaria: [46, 29], sicar: [47, 28], siquem: [47, 28], galileia: [51, 13], galilee: [51, 13], capernaum: [54, 11], nazare: [49, 17], nazareth: [49, 17], cana: [51, 18], damasco: [65, 8], damascus: [65, 8], jordao: [50, 28], jordan: [50, 28], carmelo: [43, 18], monte: [43, 18], malta: [18, 51], roma: [10, 17], rome: [10, 17], ephesus: [24, 12], egito: [35, 58], sinai: [45, 61] });
  function miniMapPoint(stop, index, total) {
    const text = norm(`${stop?.label || ""} ${stop?.query || ""}`);
    const hit = Object.keys(MINI_MAP_COORDS).find((key) => text.includes(key));
    if (hit) return MINI_MAP_COORDS[hit];
    const spread = Math.max(1, total - 1);
    return [20 + (index / spread) * 58, 22 + ((index % 2) ? 19 : 0)];
  }
  function sceneMapCanvas(mapStops) {
    const points = mapStops.map((stop, index) => miniMapPoint(stop, index, mapStops.length));
    const pointString = points.map(([x, y]) => `${x},${y}`).join(" ");
    const markers = mapStops.map((stop, index) => {
      const [x, y] = points[index];
      return `<button type="button" class="bx-immersion-mini-map-stop bx-immersion-scene-map-stop ${index === state.activeEvent % Math.max(1, mapStops.length) ? "is-active" : ""}" style="--map-x:${x}%;--map-y:${y}%" data-imm-route="${esc(stop.query || stop.label || "Lugar")}"><span>${index + 1}</span><em>${esc(stop.label || "Lugar")}</em></button>`;
    }).join("");
    return `<div class="bx-immersion-mini-map-canvas bx-immersion-real-map ${state.miniMap3d ? "is-relief" : ""}"><svg class="bx-immersion-scene-map-svg" viewBox="0 0 100 68" preserveAspectRatio="none" aria-hidden="true"><path class="scene-map-sea" d="M0 0H30C25 13 31 23 27 33S30 52 22 68H0Z"/><path class="scene-map-land" d="M30 0C40 10 35 20 42 26S36 38 48 47 39 60 47 68H100V0Z"/><path class="scene-map-ridge" d="M42 2C47 13 43 22 50 31S48 48 54 65M58 0c-6 12-1 20-6 31s3 21-2 37M68 0c-4 12 2 25-4 36s4 19 0 32"/><path class="scene-map-river" d="M57 7C54 20 57 27 53 36S55 52 52 62"/><path class="scene-map-coast" d="M30 0C25 13 31 23 27 33S30 52 22 68"/><polyline class="scene-map-route" points="${pointString}"/></svg><span class="bx-immersion-scene-map-label sea">Mediterrâneo</span><span class="bx-immersion-scene-map-label river">Jordão</span>${markers}<span class="bx-immersion-map-compass">N</span></div>`;
  }

  function artElements(scene) {
    const type = scene.sceneClass;
    const light = '<span class="bx-immersion-glow-orb"></span><span class="bx-immersion-light-ray"></span><span class="bx-immersion-dust"></span>';
    if (type === "sicar") return `${light}<span class="bx-immersion-sun"></span><span class="bx-immersion-horizon"></span><span class="bx-immersion-ground"></span><span class="bx-immersion-well"></span>`;
    if (type === "jerico") return `${light}<span class="bx-immersion-sun"></span><span class="bx-immersion-horizon"></span><span class="bx-immersion-ground"></span><span class="bx-immersion-crowd"></span>`;
    if (type === "exodo") return `${light}<span class="bx-immersion-sun"></span><span class="bx-immersion-sea"></span><span class="bx-immersion-ground"></span>`;
    if (type === "malta") return `${light}<span class="bx-immersion-sun"></span><span class="bx-immersion-sea"></span><span class="bx-immersion-ground"></span><span class="bx-immersion-boat"></span>`;
    if (type === "jerusalem") return `${light}<span class="bx-immersion-sun"></span><span class="bx-immersion-horizon"></span><span class="bx-immersion-ground"></span><span class="bx-immersion-crowd"></span>`;
    if (type === "carmelo") return `${light}<span class="bx-immersion-sun"></span><span class="bx-immersion-horizon"></span><span class="bx-immersion-ground"></span>`;
    if (type === "campo") return `${light}<span class="bx-immersion-sun"></span><span class="bx-immersion-horizon"></span><span class="bx-immersion-ground"></span>`;
    if (type === "damasco") return `${light}<span class="bx-immersion-sun"></span><span class="bx-immersion-horizon"></span><span class="bx-immersion-ground"></span><span class="bx-immersion-crowd"></span>`;
    return `${light}<span class="bx-immersion-sun"></span><span class="bx-immersion-horizon"></span><span class="bx-immersion-ground"></span>`;
  }

  function renderStage() {
    const scene = state.scene || createGenericScene(state.ref);
    const event = selectedEvent();
    const visualQuery = getIntegrationModel().queries.images;
    const visualsMatch = state.visualQuery === visualQuery;
    const visibleVisualItems = visualsMatch ? state.visualItems : [];
    const visual = visibleVisualItems[state.visualIndex] || null;
    const visualUrl = safeHttpUrl(visual?.thumb_url || visual?.original_url);
    const visualSourceUrl = safeHttpUrl(visual?.page_url || visual?.pageUrl || visual?.descriptionurl);
    const route = Array.isArray(scene.route) ? scene.route : [];
    const currentPlace = scene.place?.name || route[state.activeEvent % Math.max(1, route.length)]?.label || "Lugar em estudo";
    const mapStops = route.length ? route : [{ label: scene.place?.name || "Lugar", query: scene.place?.query || scene.place?.name }];
    const mapCanvas = sceneMapCanvas(mapStops);
    const miniMap = `<section class="bx-immersion-mini-map ${state.miniMap3d ? "is-globe" : ""}" aria-label="Mapa resumido da cena"><header><div><span>${state.miniMap3d ? "MAPA VIVO • RELEVO" : "MAPA VIVO • ROTA"}</span><strong>${esc(currentPlace)}</strong></div><div class="bx-immersion-mini-map-actions"><button type="button" data-imm-action="toggle-mini-map">${state.miniMap3d ? "⇄ Plano" : "◒ Relevo"}</button><button type="button" data-imm-action="atlas">Abrir Atlas</button><button type="button" data-imm-action="media">Mídia</button></div></header>${mapCanvas}<div class="bx-immersion-map-legend"><span><i></i> ponto da cena</span><span><i></i> rota aproximada</span><button type="button" data-imm-action="atlas">Precisão e fontes</button></div><small>${esc(scene.certainty || "Reconstrução visual aproximada; consulte o Atlas para fontes e localização histórica.")}</small></section>`;
    const hotspots = (scene.hotspots || []).map((hotspot) => `
      <button type="button" class="bx-immersion-hotspot" data-imm-hotspot="${esc(hotspot.id)}" data-kind="${esc(hotspot.kind || "place")}" data-person="${esc(hotspot.person || "")}" data-event="${esc(hotspot.event == null ? "" : hotspot.event)}">${esc(hotspot.label)}</button>`).join("");
    $("[data-imm-stage]", modal).innerHTML = `
      <div class="bx-immersion-stage-viewport" data-imm-stage-viewport tabindex="0" aria-label="Cena interativa. Use a roda do mouse para navegar, Ctrl mais roda para zoom e arraste quando ampliada.">
        <div class="bx-immersion-art bx-immersion-art-${safeClass(scene.sceneClass)} ${visualUrl ? "has-photo" : ""}" data-imm-stage-art>
        ${visualUrl ? `<button type="button" class="bx-immersion-photo-button" data-imm-visual-open="${state.visualIndex}" aria-label="Abrir imagem ampliada com crédito e licença"><img class="bx-immersion-stage-photo" data-imm-visual-image src="${esc(visualUrl)}" alt="${esc(visual?.title || scene.title)}" loading="lazy"></button><span class="bx-immersion-photo-wash"></span>` : ""}
        ${sceneIllustration(scene)}
        ${artElements(scene)}
        <span class="bx-immersion-stage-label">${esc(scene.badge || "RECONSTRUÇÃO VISUAL")}</span>
        ${hotspots}
        ${visibleVisualItems.length > 1 ? `<div class="bx-immersion-visual-nav"><button type="button" data-imm-visual="prev" aria-label="Imagem anterior">‹</button><span>${state.visualIndex + 1}/${visibleVisualItems.length}</span><button type="button" data-imm-visual="next" aria-label="Próxima imagem">›</button></div>` : ""}
        <div class="bx-immersion-stage-copy"><small>${esc(scene.place?.name || "Contexto bíblico")}</small><strong>${esc(event.label || scene.title)}</strong>${visual ? `<em class="bx-immersion-photo-credit">${esc(visual.credit || visual.source || "Wikimedia Commons")} • ${esc(visual.license || "licença na fonte")}</em>${visualSourceUrl ? `<a class="bx-immersion-photo-source" href="${esc(visualSourceUrl)}" target="_blank" rel="noopener noreferrer">Ver fonte e licença ↗</a>` : ""}` : ""}</div>
        </div>
        <div class="bx-immersion-stage-tools" aria-label="Controles da cena">
          <button type="button" data-imm-stage-control="zoom-out" aria-label="Diminuir zoom">−</button>
          <button type="button" data-imm-stage-control="reset" data-imm-stage-zoom-label aria-label="Restaurar zoom">100%</button>
          <button type="button" data-imm-stage-control="zoom-in" aria-label="Aumentar zoom">＋</button>
          <span>Roda: navegar • Ctrl+roda: zoom • arraste ampliada</span>
        </div>
      </div>${miniMap}`;
    bindStageGestures();
    $("[data-imm-caption]", modal).textContent = state.visualLoading ? "Buscando imagens atuais da cidade, sítios arqueológicos e ruínas bíblicas, sempre com crédito e licença..." : state.tourActive ? "Passeio guiado ativo: a próxima etapa será apresentada automaticamente." : state.visualMessage || event.summary || scene.subtitle || "Explore as camadas desta passagem.";
    syncActionButtons();
    syncTourButton();
    syncPresentationButton();
    syncQuadrantFocusUI();
  }

  function syncActionButtons() {
    const visual = $("[data-imm-action='visual']", modal);
    const panorama = $("[data-imm-action='panorama']", modal);
    if (visual) { visual.disabled = state.visualLoading; visual.textContent = state.visualLoading ? "⏳ Buscando imagens..." : "🌄 Carregar imagens"; }
    if (panorama) { panorama.disabled = state.panoramaLoading; panorama.textContent = state.panoramaLoading ? "⏳ Buscando 360°..." : "◉ Buscar 360°"; }
    renderConnectionHub();
  }

  function syncTourButton() {
    const button = $("[data-imm-action='tour']", modal);
    if (!button) return;
    button.textContent = state.tourActive ? "⏸ Pausar passeio" : "▶ Passeio guiado";
    button.setAttribute("aria-pressed", state.tourActive ? "true" : "false");
    button.classList.toggle("is-selected", state.tourActive);
  }

  function syncFavoriteButton() {
    const button = $("[data-imm-action='favorite']", modal);
    if (!button) return;
    button.textContent = state.favorite ? "★ Remover dos favoritos" : "☆ Favoritar cena";
    button.setAttribute("aria-pressed", state.favorite ? "true" : "false");
    button.classList.toggle("is-selected", state.favorite);
  }

  function renderEvents() {
    const events = Array.isArray(state.scene?.events) && state.scene.events.length ? state.scene.events : [{ label: "Leitura guiada", ref: state.ref, summary: "Explore os vínculos desta passagem." }];
    $("[data-imm-events]", modal).innerHTML = events.map((event, index) => {
      const done = state.completedEvents.includes(index);
      return `<div class="bx-immersion-event-row ${done ? "is-done" : ""}">
        <button type="button" class="bx-immersion-event ${index === state.activeEvent ? "is-active" : ""}" data-imm-event="${index}" aria-current="${index === state.activeEvent ? "step" : "false"}">
          <span class="bx-immersion-event-index">${index + 1}</span>
          <span><strong>${esc(event.label || "Etapa")}</strong><small>${esc(event.ref || "")} ${event.summary ? "• " + esc(event.summary) : ""}</small>${event.focus ? `<em class="bx-immersion-event-focus">Foco: ${esc(event.focus)}</em>` : ""}</span>
        </button>
        <button type="button" class="bx-immersion-complete-btn ${done ? "is-done" : ""}" data-imm-complete="${index}" aria-pressed="${done ? "true" : "false"}" aria-label="${done ? "Desmarcar" : "Marcar"} etapa ${index + 1} como concluída" title="${done ? "Desmarcar etapa" : "Marcar etapa como concluída"}">${done ? "✓" : "○"}</button>
      </div>`;
    }).join("");
  }

  function renderQuickContext() {
    const scene = state.scene || {};
    const shortcuts = [
      scene.place && { tab: "map", icon: "⌖", label: scene.place.name || "Mapa" },
      (scene.people || []).length && { tab: "people", icon: "♙", label: `${scene.people.length} personagens` },
      (scene.geography || []).length && { tab: "context", subtab: "geography", icon: "🗺", label: "Geografia" },
      (scene.culturalNotes || []).length && { tab: "context", subtab: "culture", icon: "🏺", label: "Cultura" },
      (scene.curiosities || []).length && { tab: "context", subtab: "curiosities", icon: "✦", label: "Curiosidades" },
      (scene.events || []).length && { tab: "timeline", icon: "◷", label: "Linha do tempo" }
    ].filter(Boolean);
    const target = $("[data-imm-quick-context]", modal);
    if (!target) return;
    target.innerHTML = shortcuts.map((item) => `<button type="button" class="bx-immersion-quick-chip" data-imm-tab="${esc(item.tab)}" ${item.subtab ? `data-imm-context-subtab="${esc(item.subtab)}"` : ""}><span>${item.icon}</span>${esc(item.label)}</button>`).join("");
  }

  function renderConnectionHub() {
    const target = $("[data-imm-connection-hub]", modal);
    if (!target) return;
    const scene = state.scene || createGenericScene(state.ref);
    const event = selectedEvent();
    const integration = getIntegrationModel();
    const imageQuery = integration.queries.images;
    const panoramaQuery = integration.queries.panorama;
    const imageReady = integration.readiness.images;
    const items = [
      { icon: "📖", label: "Texto", detail: event.ref || state.ref || scene.reference, status: state.verseText ? "Texto conectado" : "Referência pronta", tone: "ready", action: "reader", actionLabel: "Abrir texto" },
      { icon: "🌄", label: "Imagens", detail: imageReady ? `${state.visualItems.length} imagem(ns) com fonte` : "Busca pública com crédito e licença", status: state.visualLoading ? "Carregando" : imageReady ? "Ligado à etapa" : "Consulta pronta", tone: state.visualLoading ? "loading" : imageReady ? "ready" : "pending", action: "visual", actionLabel: imageReady ? "Ver galeria" : "Buscar imagens" },
      { icon: "🖼", label: "Mídia X", detail: `${scene.title || "Cena"} • ${event.label || "etapa atual"}`, status: "Busca contextual", tone: "ready", action: "media", actionLabel: "Abrir mídia" },
      { icon: "✨", label: "Gerador de IA · Imagens e Vídeos", detail: "Gerar imagem ou vídeo da passagem", status: "Gemini / OpenAI", tone: "ready", action: "generate", actionLabel: "Criar mídia" },
      { icon: "◉", label: "360°", detail: panoramaQuery || "Consulta de panorama", status: state.panoramaLoading ? "Buscando" : "Consulta pronta", tone: state.panoramaLoading ? "loading" : "pending", action: "panorama", actionLabel: "Buscar 360°" },
      { icon: "⌖", label: "Mapa", detail: scene.place?.name || "Lugar em investigação", status: scene.route?.length ? "Rota cadastrada" : "Lugar a investigar", tone: scene.place || scene.route?.length ? "ready" : "pending", action: "atlas", actionLabel: "Abrir mapa" },
      { icon: "♙", label: "Personagens", detail: `${(scene.people || []).length} personagem(ns) na cena`, status: scene.people?.length ? "Camada disponível" : "A investigar", tone: scene.people?.length ? "ready" : "pending", tab: "people", actionLabel: "Ver personagens" },
      { icon: "◷", label: "Linha do tempo", detail: `${(scene.events || []).length || 1} etapa(s) narrativas`, status: "Percurso conectado", tone: "ready", tab: "timeline", actionLabel: "Ver etapas" },
      { icon: "🧭", label: "Contexto", detail: scene.theme || "Geografia, cultura e curiosidades", status: scene.historicalContext ? "Contexto editorial" : "A investigar", tone: scene.historicalContext ? "ready" : "pending", tab: "context", actionLabel: "Abrir contexto" }
    ];
    target.innerHTML = `<div class="bx-immersion-connection-head"><strong>Conexões da cena</strong><span>${esc(event.label || "Etapa atual")} • ${esc(event.ref || state.ref || scene.reference || "referência")}</span></div>${items.map((item) => {
      const trigger = item.tab ? `data-imm-tab="${esc(item.tab)}"` : `data-imm-action="${esc(item.action)}"`;
      return `<article class="bx-immersion-connection-card is-${item.tone}"><div class="bx-immersion-connection-icon" aria-hidden="true">${item.icon}</div><div class="bx-immersion-connection-copy"><strong>${esc(item.label)}</strong><small>${esc(item.detail)}</small><em>${esc(item.status)}</em></div><button type="button" class="bx-immersion-connection-open" ${trigger}>${esc(item.actionLabel)} <span aria-hidden="true">↗</span></button></article>`;
    }).join("")}`;
  }

  function renderVerseAnchors() {
    const target = $("[data-imm-verse-anchors]", modal);
    if (!target) return;
    const map = Array.isArray(state.scene?.verseMap) ? state.scene.verseMap : [];
    const unique = [];
    map.forEach((item) => {
      const ref = String(item?.match || "").trim();
      if (!ref || unique.some((entry) => norm(entry.match) === norm(ref))) return;
      const eventIndex = Number(item.event);
      unique.push({ ref, event: Number.isFinite(eventIndex) ? eventIndex : 0 });
    });
    if (!unique.length) {
      target.innerHTML = "";
      return;
    }
    target.innerHTML = `<span class="bx-immersion-verse-anchors-label">Âncoras do texto</span>${unique.map((item) => {
      const active = item.event === state.activeEvent;
      const event = state.scene?.events?.[item.event];
      return `<button type="button" class="bx-immersion-verse-anchor ${active ? "is-active" : ""}" data-imm-verse-ref="${esc(item.ref)}" data-imm-verse-event="${item.event}" aria-current="${active ? "true" : "false"}" title="${esc(event?.label || "Ir para esta etapa")}">${esc(item.ref)}</button>`;
    }).join("")}`;
  }

  function renderProgress() {
    const events = Array.isArray(state.scene?.events) && state.scene.events.length ? state.scene.events : [{ label: "Leitura guiada" }];
    const total = events.length;
    const current = state.activeEvent + 1;
    const percent = total <= 1 ? 100 : Math.round((state.activeEvent / (total - 1)) * 100);
    const doneCount = state.completedEvents.filter((index) => index < total).length;
    $("[data-imm-progress-text]", modal).textContent = `${current}/${total} ${total === 1 ? "etapa" : "etapas"} • ${doneCount} concluída${doneCount === 1 ? "" : "s"}`;
    $("[data-imm-progress-bar]", modal).style.width = `${Math.max(8, percent)}%`;
    const completionPercent = Math.round((doneCount / total) * 100);
    const completionButton = $("[data-imm-action='complete-current']", modal);
    if (completionButton) {
      const completed = state.completedEvents.includes(state.activeEvent);
      completionButton.textContent = completed ? "✓ Etapa concluída" : "○ Concluir etapa atual";
      completionButton.setAttribute("aria-pressed", completed ? "true" : "false");
      completionButton.classList.toggle("is-selected", completed);
    }
    const completionLabel = $("[data-imm-progress-percent]", modal);
    if (completionLabel) completionLabel.textContent = `${completionPercent}% do percurso concluído`;
    const range = $("[data-imm-progress-range]", modal);
    if (range) {
      range.max = String(Math.max(0, total - 1));
      range.value = String(state.activeEvent);
      range.setAttribute("aria-valuetext", `Etapa ${current} de ${total}: ${events[state.activeEvent]?.label || "Leitura guiada"}`);
    }
    $("[data-imm-progress-dots]", modal).innerHTML = events.map((event, index) => `<button type="button" class="bx-immersion-progress-dot ${index === state.activeEvent ? "is-active" : ""} ${state.completedEvents.includes(index) ? "is-done" : ""}" data-imm-progress-event="${index}" aria-current="${index === state.activeEvent ? "step" : "false"}" aria-label="Ir para ${esc(event.label || `etapa ${index + 1}`)}${state.completedEvents.includes(index) ? " (concluída)" : ""}"><span>${state.completedEvents.includes(index) ? "✓" : index + 1}</span></button>`).join("");
    const saved = readProgress(state.scene);
    const status = $("[data-imm-progress-status]", modal);
    if (status) {
      if (saved && Number(saved.event) === state.activeEvent) {
        status.textContent = "✓ Você está na etapa salva neste dispositivo";
      } else if (saved) {
        const savedEvent = events[Math.max(0, Math.min(Number(saved.event) || 0, events.length - 1))];
        status.textContent = `↺ Percurso salvo: ${savedEvent?.label || `etapa ${(Number(saved.event) || 0) + 1}`}.`;
      } else {
        status.textContent = "O progresso é salvo apenas neste dispositivo.";
      }
    }
  }

  function handleModalInput(event) {
    const range = event.target.closest?.("[data-imm-progress-range]");
    if (range) {
      if (!state.scene) return;
      const total = state.scene.events?.length || 1;
      state.activeEvent = Math.max(0, Math.min(Number(range.value) || 0, total - 1));
      state.activeTab = "scene";
      saveProgress();
      renderAll();
      return;
    }
    const note = event.target.closest?.("[data-imm-note]");
    if (note) scheduleNoteSave(note.value);
  }

  function detailScene() {
    const scene = state.scene;
    const event = selectedEvent();
    const note = readNote(scene, state.activeEvent);
    const done = state.completedEvents.includes(state.activeEvent);
    return `
      <div class="bx-immersion-context-card">
        <strong>${esc(event.label || "Leitura guiada")}</strong>
        ${event.focus ? `<p class="bx-immersion-focus-line">Foco de leitura: ${esc(event.focus)}</p>` : ""}
        <p>${esc(event.summary || "Acompanhe o movimento da passagem por camadas.")}</p>
      </div>
      <div class="bx-immersion-context-card">
        <strong>⌖ ${esc(scene.place?.name || "Lugar em estudo")}</strong>
        <p>${esc(scene.place?.description || "Abra o Atlas para comparar a passagem com o mapa.")}</p>
        <div class="bx-immersion-place-chip"><span>${esc(scene.place?.query || scene.place?.name || state.ref)}</span></div>
        <div class="bx-immersion-certainty"><span>${esc(scene.certainty || "Contexto em investigação")}</span></div>
      </div>
      <div class="bx-immersion-context-card bx-immersion-note-card">
        <div class="bx-immersion-note-heading"><strong>📝 Minha anotação</strong><span>${done ? "Etapa concluída" : "Salvamento automático"}</span></div>
        <textarea data-imm-note rows="4" maxlength="2400" placeholder="Escreva uma observação, aplicação ou pergunta para esta etapa...">${esc(note)}</textarea>
        <div class="bx-immersion-stage-actions">
          <button type="button" class="bx-immersion-action-btn" data-imm-action="save-note">Salvar anotação</button>
          <button type="button" class="bx-immersion-action-btn" data-imm-action="clear-note">Limpar</button>
        </div>
      </div>`;
  }

  function detailContext() {
    const scene = state.scene || {};
    const notes = scene.culturalNotes || [];
    const geography = scene.geography || [];
    const curiosities = scene.curiosities || [];
    const objects = scene.objects || [];
    const questions = scene.questions || [];
    const sources = scene.sources || [];
    const related = relatedScenes(scene);
    const contextTab = ["geography", "culture", "curiosities"].includes(state.contextSubtab) ? state.contextSubtab : "geography";
    const focusCard = state.verseText ? `<div class="bx-immersion-context-card bx-immersion-focus-card"><strong>Texto em foco</strong><blockquote>${esc(state.verseText.slice(0, 420))}${state.verseText.length > 420 ? "…" : ""}</blockquote><small>${esc(selectedEvent().ref || state.ref || "Referência selecionada")} • compare o texto com as camadas abaixo.</small></div>` : "";
    const editorialCards = (items, title) => {
      if (!items.length) return "";
      return `<div class="bx-immersion-context-card"><strong>${esc(title)}</strong><div class="bx-immersion-info-grid">${items.map((item, index) => {
        const data = typeof item === "string" ? { title: `${title} ${index + 1}`, text: item } : (item || {});
        return `<article class="bx-immersion-info-card"><strong>${esc(data.title || data.name || "Nota editorial")}</strong><p>${esc(data.text || data.description || data.value || "")}</p></article>`;
      }).join("")}</div></div>`;
    };
    const contextTabs = [
      ["geography", "🗺", "Geografia"],
      ["culture", "🏺", "Cultura"],
      ["curiosities", "✦", "Curiosidades"]
    ].map(([id, icon, label]) => `<button type="button" class="bx-immersion-context-subtab ${contextTab === id ? "is-active" : ""}" data-imm-context-subtab="${id}" role="tab" aria-selected="${contextTab === id ? "true" : "false"}">${icon} ${label}</button>`).join("");
    const route = scene.route || [];
    const routeHtml = route.length ? `<div class="bx-immersion-context-card"><strong>Rota da cena</strong><p>Use cada parada para abrir o Atlas ou buscar imagens do lugar relacionado.</p><div class="bx-immersion-map-route">${route.map((stop, index) => `<div class="bx-immersion-route-stop"><span class="bx-immersion-route-index">${index + 1}</span><div><button type="button" class="bx-immersion-route" data-imm-route="${esc(stop.query || stop.label)}">${esc(stop.label)}</button><small>${esc(stop.type || "ponto relacionado")}</small></div><button type="button" class="bx-immersion-route-media" data-imm-route-media="${esc(stop.query || stop.label)}" aria-label="Ver mídia de ${esc(stop.label)}">🖼</button></div>`).join("")}</div></div>` : "";
    const geographyPanel = `
      <div class="bx-immersion-context-card bx-immersion-context-category">
        <div class="bx-immersion-category-heading"><div><span class="bx-immersion-category-kicker">CAMADA 01</span><strong>Geografia e deslocamento</strong></div><button type="button" class="bx-immersion-action-btn is-primary" data-imm-action="atlas">⌖ Abrir no Atlas</button></div>
        <p>${esc(scene.place?.description || "Veja onde a cena acontece, como o caminho se organiza e quais pontos ainda são aproximações editoriais.")}</p>
        <div class="bx-immersion-place-chip"><span>${esc(scene.place?.query || scene.place?.name || state.ref)}</span></div>
        <div class="bx-immersion-certainty"><span>${esc(scene.certainty || "Localização em investigação")}</span></div>
      </div>
      ${editorialCards(geography, "Geografia para visualizar")}
      ${routeHtml}`;
    const culturePanel = `
      <div class="bx-immersion-context-card bx-immersion-context-category">
        <div class="bx-immersion-category-heading"><div><span class="bx-immersion-category-kicker">CAMADA 02</span><strong>Cultura e contexto</strong></div><button type="button" class="bx-immersion-action-btn is-primary" data-imm-action="context-module">🧭 Abrir Contexto X</button></div>
        <p>${esc(scene.historicalContext || "Esta camada aproxima costumes, tensões sociais e práticas do período sem transformar reconstrução em certeza histórica.")}</p>
        ${scene.period ? `<div class="bx-immersion-place-chip"><span>${esc(scene.period)}</span></div>` : ""}
      </div>
      ${editorialCards(notes, "Cultura para compreender")}
      `;
    const curiosityPanel = `
      <div class="bx-immersion-context-card bx-immersion-context-category">
        <div class="bx-immersion-category-heading"><div><span class="bx-immersion-category-kicker">CAMADA 03</span><strong>Curiosidades para observar</strong></div><button type="button" class="bx-immersion-action-btn" data-imm-action="export">⇩ Exportar ficha</button></div>
        <p>Pequenas pistas, objetos e perguntas para voltar ao texto com mais atenção. São elementos de leitura e investigação, não afirmações independentes do contexto.</p>
      </div>
      ${editorialCards(curiosities, "Curiosidades da cena")}
      ${objects.length ? `<div class="bx-immersion-context-card"><strong>Objetos para observar</strong><div class="bx-immersion-object-list">${objects.map((item) => `<div class="bx-immersion-object"><span>${esc(item.icon || "•")}</span><div><strong>${esc(item.name)}</strong><p>${esc(item.meaning)}</p></div></div>`).join("")}</div></div>` : ""}
      ${questions.length ? `<div class="bx-immersion-context-card"><strong>Perguntas para estudo</strong><ol class="bx-immersion-question-list">${questions.map((question) => `<li>${esc(question)}</li>`).join("")}</ol></div>` : ""}`;
    const categoryPanel = contextTab === "culture" ? culturePanel : contextTab === "curiosities" ? curiosityPanel : geographyPanel;
    const sectionTitle = contextTab === "culture" ? "Cultura" : contextTab === "curiosities" ? "Curiosidades" : "Geografia";
    const sectionSubtitle = contextTab === "culture" ? "Como a sociedade, os costumes e o período iluminam a cena" : contextTab === "curiosities" ? "Pistas para observar e perguntas para continuar investigando" : "Onde a cena acontece, como o caminho se organiza e o que ainda é aproximação";
    const stat = (value, label) => `<div class="bx-immersion-context-stat"><strong>${value}</strong><span>${label}</span></div>`;
    const asideSources = sources.length ? `<div class="bx-immersion-context-card"><strong>Fontes e grau de certeza</strong><div class="bx-immersion-source-list">${sources.map((source) => `<div class="bx-immersion-source-row"><span>${esc(source.type || "Fonte")}</span><div><strong>${esc(source.label || "Registro")}</strong><small>${esc(source.value || "")}</small></div><em>${esc(source.certainty || "")}</em></div>`).join("")}</div></div>` : `<div class="bx-immersion-context-card bx-immersion-evidence-empty"><strong>Camada de evidência</strong><p>Quando uma fonte for adicionada ao catálogo, ela aparecerá aqui com origem e grau de certeza.</p></div>`;
    const relatedCard = `<div class="bx-immersion-context-card bx-immersion-related-card"><strong>Continue por uma cena relacionada</strong><p>O catálogo conecta lugares, personagens e temas para você seguir estudando sem perder o fio da narrativa.</p>${related.length ? `<div class="bx-immersion-related-list">${related.map((item) => `<button type="button" class="bx-immersion-related-item" data-imm-related-ref="${esc(item.scene.reference || item.scene.matches?.[0] || item.scene.title)}"><span class="bx-immersion-related-icon">↗</span><span><strong>${esc(item.scene.title || "Entrar na história")}</strong><small>${esc(item.scene.reference || "Referência em estudo")} • ${esc(item.reason)}</small></span></button>`).join("")}</div>` : `<button type="button" class="bx-immersion-action-btn" data-imm-action="catalog">✦ Explorar o catálogo completo</button>`}</div>`;
    return `<div class="bx-immersion-context-workspace">
      <header class="bx-immersion-context-hero"><div><span>ESTUDO INTEGRADO DA PASSAGEM</span><h3>${esc(scene.title || "Entrar na história")}</h3><p>${esc(scene.theme || "Leitura bíblica em camadas")}</p></div><div class="bx-immersion-context-hero-meta"><b>${esc(state.ref || scene.reference || "Referência selecionada")}</b><small>${esc(scene.place?.name || "Lugar em estudo")} ${scene.period ? `• ${esc(scene.period)}` : ""}</small></div></header>
      <div class="bx-immersion-context-stats">${stat(geography.length, "blocos de geografia")}${stat(notes.length, "notas de cultura")}${stat(curiosities.length, "curiosidades")}${stat(sources.length, "fontes vinculadas")}</div>
      <nav class="bx-immersion-context-subtabs bx-immersion-context-subtabs-large" role="tablist" aria-label="Camadas do contexto">${contextTabs}</nav>
      <div class="bx-immersion-context-panel-heading"><strong>${sectionTitle}</strong><span>${sectionSubtitle}</span></div>
      <div class="bx-immersion-context-layout"><main class="bx-immersion-context-main">${categoryPanel}</main><aside class="bx-immersion-context-aside">${focusCard || `<div class="bx-immersion-context-card"><strong>Texto em foco</strong><p>Abra uma referência na Bíblia para manter o versículo visível junto desta pesquisa.</p></div>`}${asideSources}</aside></div>
      ${relatedCard}
      <div class="bx-immersion-context-card bx-immersion-context-actions"><strong>Continuar o estudo</strong><p>Abra os módulos completos mantendo a referência desta cena como ponto de partida.</p><div class="bx-immersion-stage-actions"><button type="button" class="bx-immersion-action-btn" data-imm-action="context-module">🧭 Contexto X</button><button type="button" class="bx-immersion-action-btn" data-imm-action="people-module">♙ Personagens X</button><button type="button" class="bx-immersion-action-btn" data-imm-action="timeline-module">◷ Linha do Tempo X</button></div></div>
    </div>`;
  }

  function detailMap() {
    const scene = state.scene;
    const route = scene.route || [];
    return `
      <div class="bx-immersion-context-card">
        <strong>Mapa de percurso</strong>
        <p>Os pontos abaixo são atalhos para o Atlas X Vivo. A linha resume o movimento narrativo; não pretende resolver debates de localização.</p>
        <div class="bx-immersion-map-route">${route.length ? route.map((stop, index) => `<div class="bx-immersion-route-stop"><span class="bx-immersion-route-index">${index + 1}</span><div><button type="button" class="bx-immersion-route" data-imm-route="${esc(stop.query || stop.label)}">${esc(stop.label)}</button><small>${esc(stop.type || "ponto relacionado")}</small></div><button type="button" class="bx-immersion-route-media" data-imm-route-media="${esc(stop.query || stop.label)}" aria-label="Ver mídia de ${esc(stop.label)}">🖼</button></div>`).join("") : `<span class="bx-immersion-empty">Nenhuma rota editorial cadastrada para esta referência.</span>`}</div>
      </div>
      <div class="bx-immersion-context-card">
        <strong>Camada cartográfica</strong>
        <p>${esc(scene.certainty || "Verifique a legenda do Atlas X Vivo para distinguir registro, tradição e reconstrução.")}</p>
        <button type="button" class="bx-immersion-action-btn is-primary" data-imm-action="atlas">Abrir mapa completo</button>
      </div>`;
  }

  function detailPeople() {
    const people = state.scene.people || [];
    const selected = people.find((person) => person.id === state.selectedPerson);
    return `
      <div class="bx-immersion-context-card">
        <strong>Quem está em cena?</strong>
        <p>Personagens são apresentados como pontos de entrada para a leitura, sem substituir a análise do texto.</p>
        <div class="bx-immersion-stage-actions"><button type="button" class="bx-immersion-action-btn" data-imm-action="people-module">♙ Abrir Personagens X</button></div>
      </div>
      <div class="bx-immersion-person-list">${people.length ? people.map((person) => {
        const collective = person.kind === "collective" || /multid|povo|discipl|tripula|ex[eé]rcito/i.test(String(person.name || ""));
        const details = selected && selected.id === person.id ? `<p class="bx-immersion-person-detail">${esc(person.description || "")}</p>${person.period ? `<small class="bx-immersion-person-period">${esc(person.period)}</small>` : ""}${person.caution ? `<small class="bx-immersion-person-caution">${esc(person.caution)}</small>` : ""}` : "";
        return `<button type="button" class="bx-immersion-person" data-imm-person="${esc(person.id)}"><span class="bx-immersion-person-icon">${esc(person.icon || (collective ? "👥" : "♙"))}</span><span class="bx-immersion-person-copy"><strong>${esc(person.name)}</strong><small>${esc(person.role || (collective ? "Personagem coletivo" : "Personagem relacionado"))}</small>${details}</span></button>`;
      }).join("") : `<p class="bx-immersion-empty">Nenhum personagem estruturado para esta passagem ainda.</p>`}</div>`;
  }

  function detailTimeline() {
    const events = state.scene.events || [];
    return `
      <div class="bx-immersion-context-card">
        <strong>Sequência da passagem</strong>
        <p>Cada etapa é uma âncora editorial para voltar ao texto e expandir o estudo no módulo correspondente.</p>
        <div class="bx-immersion-place-chip"><span>${esc(state.scene.period || "Período não informado")}</span></div>
        <div class="bx-immersion-certainty"><span>${esc(state.scene.timelineNote || "A ordem abaixo é narrativa; datas exatas só aparecem quando o texto ou a fonte as informa.")}</span></div>
      </div>
      <div class="bx-immersion-person-list">${events.map((event, index) => {
        const done = state.completedEvents.includes(index);
        return `<div class="bx-immersion-event-row ${done ? "is-done" : ""}">
          <button type="button" class="bx-immersion-person" data-imm-event="${index}"><strong>${index + 1}. ${esc(event.label || "Etapa")}</strong><small>${esc(event.timeLabel || event.ref || "Ordem narrativa")}</small><p class="bx-immersion-person-detail">${esc(event.summary || "")}</p></button>
          <button type="button" class="bx-immersion-complete-btn ${done ? "is-done" : ""}" data-imm-complete="${index}" aria-pressed="${done ? "true" : "false"}" aria-label="${done ? "Desmarcar" : "Marcar"} etapa ${index + 1} como concluída" title="${done ? "Desmarcar etapa" : "Marcar etapa como concluída"}">${done ? "✓" : "○"}</button>
        </div>`;
      }).join("")}</div>`;
  }

  function renderContext() {
    const labels = { scene: "Contexto vivo", map: "Mapa vivo", people: "Personagens em cena", timeline: "Linha narrativa", context: "Contexto histórico e cultural" };
    const dialog = $(".bx-immersion-dialog", modal);
    if (dialog) dialog.dataset.immersionView = state.activeTab || "scene";
    $("[data-imm-context-label]", modal).textContent = labels[state.activeTab] || labels.scene;
    const content = state.activeTab === "map" ? detailMap() : state.activeTab === "people" ? detailPeople() : state.activeTab === "timeline" ? detailTimeline() : state.activeTab === "context" ? detailContext() : detailScene();
    $("[data-imm-detail]", modal).innerHTML = content;
    $$(".bx-immersion-tabs [data-imm-tab]", modal).forEach((tab) => {
      const active = tab.dataset.immTab === state.activeTab;
      tab.classList.toggle("is-active", active);
      tab.setAttribute("aria-selected", active ? "true" : "false");
      tab.setAttribute("tabindex", active ? "0" : "-1");
    });
  }

  function renderAll() {
    if (!modal || !state.scene) return;
    const event = selectedEvent();
    $("[data-imm-title]", modal).textContent = state.scene.title || "Entrar na história";
    $("[data-imm-subtitle]", modal).textContent = state.scene.subtitle || "Uma camada visual para acompanhar o texto bíblico.";
    $("[data-imm-meta]", modal).innerHTML = [state.scene.period, state.scene.place?.name, state.scene.certainty].filter(Boolean).map((value) => `<span>${esc(value)}</span>`).join("");
    $("[data-imm-ref]", modal).textContent = state.currentNarrativeRef || state.scene.reference || state.ref;
    const verse = $("[data-imm-verse]", modal);
    verse.textContent = state.verseText || `O leitor está em ${state.ref || state.scene.reference}. A cena permanece ao lado para consulta rápida.`;
    verse.classList.toggle("is-empty", !state.verseText);
    renderStage();
    renderQuickContext();
    renderConnectionHub();
    renderVerseAnchors();
    renderProgress();
    renderEvents();
    renderContext();
    $("[data-imm-source-note]", modal).textContent = `${state.catalogOffline ? "✓ Catálogo local disponível offline. " : ""}Texto em foco: ${state.ref || state.scene.reference}. Cena editorial conectada ao Atlas X Vivo; confirme no texto, nas fontes e na legenda de certeza antes de tratar uma reconstrução como fato.`;
    const speak = $("[data-imm-action='speak']", modal);
    if (speak) speak.textContent = state.speechActive ? "⏹ Parar leitura" : "🔊 Ouvir a cena";
    syncFavoriteButton();
    syncShortcuts();
  }

  function open(ref, text, trigger) {
    stopSpeech();
    stopTour();
    flushNoteDraft();
    state.presentationActive = false;
    resetQuadrantFocus();
    state.lastFocus = trigger || document.activeElement;
    const openInFullscreen = Boolean(trigger?.matches?.("[data-bx-immersion], [data-bx-immersion-nav]"));
    state.ref = String(ref || referenceFromInput() || "Passagem selecionada").trim();
    state.verseText = String(text || "").trim();
    state.scene = findScene(state.ref);
    const mappedEvent = eventForReference(state.ref, state.scene);
    const saved = readProgress(state.scene);
    const lastScene = readLastScene();
    const lastEvent = lastScene && norm(lastScene.reference) === norm(state.ref) && Number.isFinite(Number(lastScene.event)) ? Number(lastScene.event) : 0;
    state.activeEvent = mappedEvent == null ? Number.isFinite(Number(saved?.event)) ? Number(saved.event) : lastEvent : mappedEvent;
    state.activeTab = "scene";
    state.contextSubtab = "geography";
    state.selectedPerson = "";
    state.currentNarrativeRef = "";
    state.visualItems = [];
    state.visualIndex = 0;
    state.visualQuery = "";
    state.visualLoading = false;
    state.visualMessage = "";
    state.panoramaLoading = false;
    state.shortcutsOpen = false;
    state.completedEvents = readCompleted(state.scene);
    state.favorite = readFavorite(state.scene);
    rememberLastScene();
    resetStageView();
    ensureModal();
    renderAll();
    emitMediaContext();
    modal.classList.add("is-open");
    modal.setAttribute("aria-hidden", "false");
    document.body.classList.add("bx-immersion-lock");
    if (openInFullscreen) toggleFullscreen();
    setTimeout(() => $("[data-imm-close]", modal)?.focus(), 30);
  }

  function close() {
    stopSpeech();
    stopTour();
    flushNoteDraft();
    state.presentationActive = false;
    const activeFullscreen = fullscreenElement();
    const activeQuadrant = activeFullscreen?.matches?.("[data-imm-quadrant]") ? activeFullscreen : null;
    if (activeQuadrant && typeof document.exitFullscreen === "function") {
      Promise.resolve(document.exitFullscreen()).catch(() => {});
    }
    document.querySelectorAll("[data-bx-quadrant-fallback]").forEach((panel) => {
      panel.removeAttribute("data-bx-quadrant-fallback");
      panel.classList.remove("bx-immersion-quadrant-fullscreen");
    });
    state.quadrantFullscreenMode = "";
    resetQuadrantFocus();
    state.shortcutsOpen = false;
    state.stageDrag = null;
    if (!modal) return;
    const dialog = $(".bx-immersion-dialog", modal);
    if (fullscreenElement() === dialog && typeof document.exitFullscreen === "function") {
      document.exitFullscreen().catch(() => {});
    }
    setImmersionFullscreenUi(false);
    restoreSharePopupPortal();
    dialog?.classList.remove("bx-immersion-presentation");
    modal.classList.remove("is-open");
    modal.setAttribute("aria-hidden", "true");
    document.body.classList.remove("bx-immersion-lock");
    if (state.lastFocus && typeof state.lastFocus.focus === "function") state.lastFocus.focus();
  }

  function stopSpeech() {
    if (window.speechSynthesis) window.speechSynthesis.cancel();
    state.speechActive = false;
  }

  function toggleSpeech() {
    if (!window.speechSynthesis) {
      alert("A leitura em voz alta não está disponível neste navegador.");
      return;
    }
    if (state.speechActive) {
      stopSpeech();
      renderAll();
      return;
    }
    const event = selectedEvent();
    const text = [state.ref, state.verseText, event.label, event.summary].filter(Boolean).join(". ");
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "pt-BR";
    utterance.rate = .92;
    utterance.onend = () => { state.speechActive = false; renderAll(); };
    utterance.onerror = () => { state.speechActive = false; renderAll(); };
    state.speechActive = true;
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
    renderAll();
  }

  async function loadVisuals() {
    const scene = state.scene;
    if (!scene || state.visualLoading) return;
    const event = selectedEvent();
    const query = getIntegrationModel().queries.images;
    const cachedItems = rankMediaItems(readMediaCache(query, "image"), scene, event, "image", query);
    state.visualQuery = query;
    state.visualItems = [];
    state.visualIndex = 0;
    state.visualLoading = true;
    state.visualMessage = "";
    renderStage();
    try {
      const result = await fetchSceneMedia(scene, event, query, "image");
      if (result.error && !result.items.length && !cachedItems.length) throw result.error;
      state.visualItems = result.items.length ? result.items : cachedItems;
      state.visualIndex = 0;
      state.visualMessage = state.visualItems.length
        ? result.fromCache ? "Imagem recuperada do cache; confira crédito e licença na fonte." : `Imagem encontrada por busca contextual (${result.query}); confira crédito e licença na fonte.`
        : "Nenhuma imagem pública encontrada. A cena editorial continua disponível.";
    } catch (error) {
      state.visualItems = cachedItems;
      state.visualIndex = 0;
      state.visualMessage = cachedItems.length
        ? "Imagem recuperada do cache; confira crédito e licença na fonte."
        : "A galeria pública precisa de internet; a reconstrução visual local continua disponível.";
      console.warn("Bíblia Viva: mídia pública indisponível", error);
    } finally {
      state.visualLoading = false;
      renderStage();
    }
  }

  function openExternalPanorama(scene, fallbackItems = []) {
    const panoramaUrl = safeHttpUrl(scene?.externalPanoramaUrl);
    if (!panoramaUrl) return false;
    const mapUrl = safeHttpUrl(scene?.externalMapUrl);
    document.querySelector(".bx-immersion-external-pano")?.remove();
    const overlay = document.createElement("div");
    overlay.className = "bx-immersion-external-pano";
    overlay.setAttribute("role", "dialog");
    overlay.setAttribute("aria-modal", "true");
    overlay.setAttribute("aria-labelledby", "bxExternalPanoTitle");
    overlay.innerHTML = `
      <section class="bx-immersion-external-pano-card">
        <header class="bx-immersion-external-pano-head">
          <div>
            <span class="bx-immersion-external-pano-kicker">BÍBLIA VIVA • 360° EXTERNO</span>
            <h2 id="bxExternalPanoTitle">${esc(scene.externalPanoramaLabel || "Vista 360° do local")}</h2>
          </div>
          <button type="button" class="bx-immersion-icon-btn" data-ext-pano-close aria-label="Fechar vista externa">×</button>
        </header>
        <div class="bx-immersion-external-pano-body">
          <p class="bx-immersion-external-pano-note">${esc(scene.externalPanoramaNote || "Vista atual de um lugar relacionado à passagem. Não é uma reconstrução histórica.")}</p>
          <div class="bx-immersion-external-pano-actions">
            <a class="bx-immersion-action-btn is-primary" href="${esc(panoramaUrl)}" target="_blank" rel="noopener noreferrer">🚶 Abrir vista 360° ↗</a>
            ${mapUrl ? `<a class="bx-immersion-action-btn" href="${esc(mapUrl)}" target="_blank" rel="noopener noreferrer">🗺 Abrir mapa ↗</a>` : ""}
            ${fallbackItems.length && window.BibleXVisualMedia && typeof window.BibleXVisualMedia.openGallery === "function" ? `<button type="button" class="bx-immersion-action-btn" data-ext-pano-images>🖼 Ver imagens relacionadas</button>` : ""}
          </div>
          <div class="bx-immersion-external-pano-disclaimer"><strong>Como funciona:</strong> o Logos abre o serviço externo em uma nova aba; não copia, hospeda nem redistribui as imagens desse serviço.</div>
        </div>
      </section>`;
    document.body.appendChild(overlay);
    const closeExternal = () => {
      overlay.remove();
      document.removeEventListener("keydown", onKey);
    };
    const onKey = (event) => { if (event.key === "Escape") closeExternal(); };
    overlay.querySelector("[data-ext-pano-close]")?.addEventListener("click", closeExternal);
    overlay.querySelector("[data-ext-pano-images]")?.addEventListener("click", () => {
      closeExternal();
      window.BibleXVisualMedia.openGallery(fallbackItems, 0, { eyebrow: `BÍBLIA VIVA • VISTAS DE ${scene.title || "JOÃO 4"}` });
    });
    overlay.addEventListener("click", (event) => { if (event.target === overlay) closeExternal(); });
    document.addEventListener("keydown", onKey);
    overlay.querySelector("[data-ext-pano-close]")?.focus();
    return true;
  }

  async function openPanoramaExperience() {
    const scene = state.scene;
    if (!scene || state.panoramaLoading) return;
    state.panoramaLoading = true;
    syncActionButtons();
    const event = selectedEvent();
    const query = getIntegrationModel().queries.panorama;
    const cachedItems = readMediaCache(query, "panorama");
    try {
      const result = await fetchSceneMedia(scene, event, query, "panorama", true);
      if (result.error && !result.items.length && !cachedItems.length) throw result.error;
      const items = result.items.length ? result.items : cachedItems;
      const item = items.find((candidate) => candidate.panorama_candidate) || items[0];
      if (!item) {
        if (safeHttpUrl(scene.externalPanoramaUrl)) {
          close();
          openExternalPanorama(scene, items);
          return;
        }
        throw new Error("Nenhum panorama licenciado encontrado para esta cena.");
      }
      if (result.actualKind === "panorama" && window.BibleXVisualMedia && typeof window.BibleXVisualMedia.openPanorama === "function") {
        close();
        window.BibleXVisualMedia.openPanorama(item, {
          eyebrow: `BÍBLIA VIVA • 360° • ${scene.title || "PASSEIO VIRTUAL"}`,
          autoRotate: true
        });
        return;
      }
      if (result.actualKind === "image" && window.BibleXVisualMedia && typeof window.BibleXVisualMedia.openGallery === "function") {
        const fallbackItems = items.map((candidate) => ({
          ...candidate,
          description: `Vista geográfica alternativa: nenhum panorama equiretangular foi localizado para esta cena. ${candidate.description || ""}`.trim()
        }));
        if (safeHttpUrl(scene.externalPanoramaUrl)) {
          close();
          openExternalPanorama(scene, fallbackItems);
          return;
        }
        close();
        window.BibleXVisualMedia.openGallery(fallbackItems, 0, {
          eyebrow: `BÍBLIA VIVA • VISTA GEOGRÁFICA • ${scene.title || "PASSEIO VIRTUAL"}`
        });
        return;
      }
      throw new Error("Visualizador visual indisponível neste navegador.");
    } catch (error) {
      console.warn("Bíblia Viva: panorama direto indisponível", error);
      const cachedItem = cachedItems.find((candidate) => candidate.panorama_candidate) || cachedItems[0];
      if (cachedItem && window.BibleXVisualMedia && typeof window.BibleXVisualMedia.openPanorama === "function") {
        close();
        window.BibleXVisualMedia.openPanorama(cachedItem, {
          eyebrow: `BÍBLIA VIVA • 360° EM CACHE • ${scene.title || "PASSEIO VIRTUAL"}`,
          autoRotate: true
        });
      } else if (safeHttpUrl(scene.externalPanoramaUrl)) {
        close();
        openExternalPanorama(scene, cachedItems);
      } else {
        openMedia(true);
      }
    } finally {
      state.panoramaLoading = false;
      syncActionButtons();
    }
  }

  function cycleVisual(step) {
    if (!state.visualItems.length) return;
    state.visualIndex = (state.visualIndex + step + state.visualItems.length) % state.visualItems.length;
    renderStage();
  }

  function openVisualGallery(index) {
    const itemIndex = Number.isFinite(Number(index)) ? Number(index) : state.visualIndex;
    const expectedQuery = getIntegrationModel().queries.images;
    const items = state.visualQuery === expectedQuery ? (state.visualItems || []) : [];
    if (!items.length) return;
    if (window.BibleXVisualMedia && typeof window.BibleXVisualMedia.openGallery === "function") {
      window.BibleXVisualMedia.openGallery(items, itemIndex, {
        eyebrow: `BÍBLIA VIVA • ${state.scene?.title || "GALERIA DA CENA"}`
      });
      return;
    }
    const item = items[itemIndex] || items[0];
    const url = safeHttpUrl(item?.page_url || item?.pageUrl || item?.descriptionurl);
    if (url) window.open(url, "_blank", "noopener");
  }

  function openSection(section) {
    const button = document.querySelector(`[data-bible-section="${section}"]`);
    if (button) button.click();
    return !!button;
  }

  function openReader(ref) {
    const target = ref || state.currentNarrativeRef || state.ref;
    close();
    openSection("reader");
    setTimeout(() => {
      const input = $("#bRef");
      if (input) input.value = target;
      $("#bOpen")?.click();
    }, 120);
  }

  function openStudyModule(section, fields, findButtons, query) {
    const target = query || state.currentNarrativeRef || state.ref;
    close();
    openSection(section);
    setTimeout(() => {
      setValue(fields, target);
      const button = findButtons.map((selector) => $(selector)).find(Boolean);
      button?.click();
    }, 180);
  }

  function setValue(selectors, value) {
    const input = selectors.map((selector) => $(selector)).find(Boolean);
    if (!input) return null;
    input.value = value || "";
    input.dispatchEvent(new Event("input", { bubbles: true }));
    input.dispatchEvent(new Event("change", { bubbles: true }));
    return input;
  }

  function queueMediaSearch(query, panorama, attempt = 0) {
    query = String(query || "").replace(/\s+/g, " ").trim().slice(0, 120);
    if (!isUsableVisualQuery(query)) {
      query = mediaQueryForScene(state.scene || createGenericScene(state.ref), selectedEvent(), query, panorama ? "panorama" : "image");
    }
    const publicInput = $("#bxMediaPublicQuery");
    const topInput = $("#bxMediaQuery");
    const button = panorama
      ? $("#bxMediaPublic360, [data-bx-media-public-360]")
      : $("#bxMediaPublicFind, #bxMediaFind, [data-bx-media-find]");
    if ((!publicInput && !topInput) || !button) {
      if (attempt < 18) window.setTimeout(() => queueMediaSearch(query, panorama, attempt + 1), 90);
      return;
    }
    // Os dois campos coexistem em algumas versões do painel: o local (#bxMediaQuery)
    // e o público (#bxMediaPublicQuery). Sincronize ambos antes de clicar para que
    // a ação contextual nunca preencha um campo e dispare o outro com valor antigo.
    [publicInput, topInput].filter(Boolean).forEach((input) => {
      input.value = query;
      input.dispatchEvent(new Event("input", { bubbles: true }));
    });
    button.click();
  }

  function openMedia(panorama, explicitQuery) {
    const scene = state.scene;
    const model = getIntegrationModel();
    const requested = String(explicitQuery || "").replace(/\s+/g, " ").trim();
    const query = isUsableVisualQuery(requested)
      ? requested
      : (panorama ? model.queries.panorama : model.queries.media);
    emitMediaContext();
    close();
    openSection("media");
    queueMediaSearch(query, panorama);
  }

  let aiMediaModulePromise = null;
  function releaseImmersionFullscreenForOverlay() {
    const dialog = $(".bx-immersion-dialog", modal);
    const native = fullscreenElement();
    const active = Boolean(dialog && (native === dialog || dialog.classList.contains("bx-immersion-fullscreen") || modal?.classList.contains("bx-immersion-is-fullscreen")));
    if (!active) return Promise.resolve();
    setImmersionFullscreenUi(false);
    const exit = document.exitFullscreen || document.webkitExitFullscreen;
    const pending = native && typeof exit === "function"
      ? Promise.resolve(exit.call(document)).catch(() => {})
      : Promise.resolve();
    return pending.then(() => new Promise(resolve => window.requestAnimationFrame?.(resolve) || window.setTimeout(resolve, 0)));
  }

  function openAiMedia(override = {}) {
    const context = { ...(getContext() || { reference: state.ref, verseText: state.verseText, scene: state.scene, event: selectedEvent() }), ...override };
    const launch = () => {
      if (window.BibleXAIMedia && typeof window.BibleXAIMedia.open === "function") {
        window.BibleXAIMedia.open(context);
        return;
      }
      if (!aiMediaModulePromise) {
        aiMediaModulePromise = new Promise((resolve, reject) => {
          const existing = document.querySelector("script[data-bx-ai-media]");
          if (existing) {
            existing.addEventListener("load", resolve, { once: true });
            existing.addEventListener("error", reject, { once: true });
            return;
          }
          const script = document.createElement("script");
          script.src = `/static/bible-x-ai-media.js?v=5.4.247`;
          script.dataset.bxAiMedia = "1";
          script.onload = resolve;
          script.onerror = reject;
          document.head.appendChild(script);
        });
      }
      aiMediaModulePromise.then(() => window.BibleXAIMedia?.open(context)).catch(() => {
        window.alert("O Gerador de IA não pôde ser carregado. Atualize a página e tente novamente.");
      });
    };
    // Native fullscreen creates a browser top layer where body overlays cannot
    // appear. Leave it before opening o Gerador de IA, then the AI layer is
    // guaranteed to sit above the immersion dialog instead of behind it.
    releaseImmersionFullscreenForOverlay().then(launch);
  }

  function verseAiContext(button) {
    const verse = button?.closest?.("[data-bx-v3-verse]");
    const dock = button?.closest?.("[data-bx-verse-ai-dock]");
    const ref = verse?.dataset.ref || dock?.dataset.mediaRef || $("#bRef")?.value || "Passagem bíblica";
    const text = verse ? $(".lmx-bible-v3-text, [data-bx-verse-text]", verse)?.innerText || "" : $("#bOut")?.innerText || "";
    const scene = createGenericScene(ref); scene.title = `Reconstrução visual • ${ref}`; scene.reference = ref;
    return { reference: ref, currentNarrativeRef: ref, verseText: text, scene, event: { ref, label: "Passagem em foco", summary: "Geração visual contextual para estudo." } };
  }

  function dismissLegacyVerseContext() {
    const panel = $("#bxVerseContext");
    if (!panel || panel.hidden) return;
    $("#bxVcClose", panel)?.click();
    panel.hidden = true;
    $("#bxVerseOverlayBackdrop")?.click();
    document.body.classList.remove("bx-resource-modal-open");
    document.documentElement.classList.remove("bx-resource-modal-open");
  }

  let verseMediaRevision = 0;

  /* 5.4.245 — ÍNDICE LEVE da Mídia X (anti-travamento): antes, para saber se um
     versículo/capítulo tinha imagem, cada versículo (e o próprio capítulo) abria o
     IndexedDB e lia a store TODA (getAll) — com imagens de lote salvas como base64
     isso deixava o botão "🖼" demorando para "ficar azul" e estourava a memória da
     aba (a página fechava com "está com problemas"). Agora fazemos UM getAll por
     revisão da store e guardamos só metadados (refs/tipo/presença), nunca os bytes. */
  let bxMediaIdx = [];
  let bxMediaIdxRev = -1;
  let bxMediaIdxBusy = false;
  const bxMediaIdxWaiters = [];
  function bxMediaEntriesFromRows(rows) {
    return (rows || []).map(row => ({
      id: String((row && row.id) || ""),
      refs: [String((row && row.reference) || "")].concat(Array.isArray(row && row.relatedReferences) ? row.relatedReferences.map(r => String(r || "")) : []),
      video: !!(row && row.type === "video"),
      hasData: !!(row && (row.blob || row.sourceUrl || row.thumbUrl))
    }));
  }
  function bxMediaIndexScan() {
    if (bxMediaIdxBusy) return;
    bxMediaIdxBusy = true;
    const startRev = verseMediaRevision;
    const finish = (rows) => {
      bxMediaIdxBusy = false;
      if (startRev === verseMediaRevision) { bxMediaIdx = bxMediaEntriesFromRows(rows); bxMediaIdxRev = startRev; }
      const waiters = bxMediaIdxWaiters.splice(0);
      waiters.forEach(w => { try { w(); } catch (_) {} });
      if (startRev !== verseMediaRevision) bxMediaIndexScan();
    };
    try {
      const request = indexedDB.open("logosx-bible", 15);
      request.onupgradeneeded = () => { if (!request.result.objectStoreNames.contains("media")) request.result.createObjectStore("media", { keyPath: "id" }); };
      request.onerror = () => finish([]);
      request.onsuccess = () => {
        try {
          const tx = request.result.transaction("media", "readonly");
          const get = tx.objectStore("media").getAll();
          get.onerror = () => finish([]);
          tx.onerror = () => finish([]);
          get.onsuccess = () => finish(get.result || []);
        } catch (_) { finish([]); }
      };
    } catch (_) { finish([]); }
  }
  function bxMediaIdxEnsure(done) {
    if (!bxMediaIdxBusy && bxMediaIdxRev === verseMediaRevision) { done(); return; }
    bxMediaIdxWaiters.push(done);
    bxMediaIndexScan();
  }
  function bxMediaVerseOk(ref) {
    const target = String(ref || "").trim();
    const out = { img: false, vid: false };
    if (!target) return out;
    for (let i = 0; i < bxMediaIdx.length; i += 1) {
      const e = bxMediaIdx[i];
      if (!e.hasData) continue;
      for (let j = 0; j < e.refs.length; j += 1) {
        if (e.refs[j] && mediaRefMatches(e.refs[j], target)) { if (e.video) out.vid = true; else out.img = true; break; }
      }
      if (out.img && out.vid) break;
    }
    return out;
  }
  function bxMediaChapterOk(chap) {
    const target = String(chap || "").trim();
    const out = { img: false, vid: false };
    if (!target) return out;
    for (let i = 0; i < bxMediaIdx.length; i += 1) {
      const e = bxMediaIdx[i];
      if (!e.hasData) continue;
      for (let j = 0; j < e.refs.length; j += 1) {
        if (e.refs[j] && mediaRefInChapter(e.refs[j], target)) { if (e.video) out.vid = true; else out.img = true; break; }
      }
      if (out.img && out.vid) break;
    }
    return out;
  }
  function bxMediaToast(text) {
    try {
      if (!bxMediaToast._css) {
        const s = document.createElement("style");
        s.textContent = ".bxm-toast{position:fixed;left:50%;bottom:18px;transform:translateX(-50%) translateY(16px);z-index:2147483005;background:#0b1f30;border:1px solid #f4c76b;color:#eef8ff;padding:10px 16px;border-radius:12px;font-size:.85rem;max-width:86vw;text-align:center;box-shadow:0 10px 30px rgba(0,0,0,.5);opacity:0;transition:opacity .25s,transform .25s;pointer-events:none}.bxm-toast.bxm-on{opacity:1;transform:translateX(-50%) translateY(0)}";
        document.head.appendChild(s);
        bxMediaToast._css = 1;
      }
      let t = document.querySelector(".bxm-toast");
      if (!t) { t = document.createElement("div"); t.className = "bxm-toast"; document.body.appendChild(t); }
      t.textContent = text;
      t.classList.add("bxm-on");
      clearTimeout(bxMediaToast._h);
      bxMediaToast._h = setTimeout(() => t.classList.remove("bxm-on"), 2800);
    } catch (_) {}
  }

  function injectVerseAiDock() {
    if (!document.getElementById("bxVerseAiDockStyle")) { const style = document.createElement("style"); style.id = "bxVerseAiDockStyle"; style.textContent = `.bx-verse-ai-dock{display:flex;align-items:center;justify-content:space-between;gap:16px;margin:18px 0;padding:14px 16px;border:1px solid rgba(98,228,210,.3);border-radius:14px;background:linear-gradient(135deg,rgba(8,44,58,.82),rgba(8,21,36,.9));color:#eaf8ff}.bx-verse-ai-dock b{display:block;color:#fff0bd}.bx-verse-ai-dock small{display:block;color:#9fb5ca;margin-top:4px}.bx-verse-ai-dock nav{display:flex;flex-wrap:wrap;gap:8px}.bx-verse-ai-dock button,.lmx-bible-v3-tools [data-bx-verse-ai],.lmx-bible-v3-tools [data-bx-verse-media],.lmx-bible-v3-tools [data-bx-verse-images],.lmx-bible-v3-tools [data-bx-verse-videos]{border:1px solid rgba(244,199,107,.42);border-radius:10px;padding:9px 12px;background:#102b42;color:#eef8ff;font-weight:800;cursor:pointer}.bx-verse-ai-dock button:hover,.lmx-bible-v3-tools [data-bx-verse-ai]:hover,.lmx-bible-v3-tools [data-bx-verse-media]:hover,.lmx-bible-v3-tools [data-bx-verse-images]:hover,.lmx-bible-v3-tools [data-bx-verse-videos]:hover{background:#1a5260}.bx-verse-media-viewer{position:fixed;inset:0;z-index:2147483004;display:grid;place-items:center;padding:20px;background:rgba(1,6,13,.86);backdrop-filter:blur(12px)}.bx-verse-media-viewer-card{width:min(980px,94vw);max-height:90vh;overflow:auto;border:1px solid rgba(244,199,107,.45);border-radius:20px;background:#08192b;color:#eef8ff;box-shadow:0 25px 90px rgba(0,0,0,.7)}.bx-verse-media-viewer-card header{display:flex;justify-content:space-between;gap:12px;align-items:flex-start;padding:18px 22px;border-bottom:1px solid rgba(202,226,255,.14)}.bx-verse-media-viewer-card header small{color:#f4c76b;font-weight:900;letter-spacing:.12em}.bx-verse-media-viewer-card h3{margin:5px 0 0;color:#fff0bd}.bx-verse-media-viewer-card header button{border:1px solid rgba(134,200,255,.3);border-radius:10px;background:#10243a;color:#fff;padding:7px 11px;font-size:1.2rem;cursor:pointer}.bx-verse-media-viewer-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:14px;padding:18px}.bx-verse-media-viewer-grid article{padding:10px;border:1px solid rgba(134,200,255,.2);border-radius:12px;background:#061321}.bx-verse-media-viewer-grid img,.bx-verse-media-viewer-grid video{display:block;width:100%;max-height:330px;object-fit:contain;background:#02070d;border-radius:8px}.bx-verse-media-viewer-grid small{display:block;color:#b6cadd;margin-top:7px}@media(max-width:680px){.bx-verse-ai-dock{align-items:stretch;flex-direction:column}.lmx-bible-v3-tools [data-bx-verse-ai],.lmx-bible-v3-tools [data-bx-verse-media]{padding:7px 8px;font-size:.78rem}}`; document.head.appendChild(style); }
    if (!document.getElementById("bxVerseMediaAvailabilityStyle")) { const style = document.createElement("style"); style.id = "bxVerseMediaAvailabilityStyle"; style.textContent = `.bx-verse-ai-dock [data-bx-verse-media].is-available,.lmx-bible-v3-tools [data-bx-verse-media].is-available,.lmx-bible-v3-tools [data-bx-verse-images].is-available,.lmx-bible-v3-tools [data-bx-verse-videos].is-available,.bx-verse-ai-dock [data-bx-chapter-media].is-available{border-color:#f4c76b;color:#fff0bd;background:linear-gradient(135deg,#7f561d,#164b58);box-shadow:0 0 0 1px rgba(244,199,107,.35),0 0 20px rgba(244,199,107,.55);animation:bxVerseMediaGlow 2.2s ease-in-out infinite}.bx-verse-ai-media.is-available{border-color:rgba(244,199,107,.66);box-shadow:0 0 18px rgba(244,199,107,.28)}.bx-verse-ai-media img{cursor:pointer}@keyframes bxVerseMediaGlow{0%,100%{filter:brightness(1)}50%{filter:brightness(1.22)}}`; document.head.appendChild(style); }
    const out = $("#bOut"); if (!out || !out.querySelector("[data-bx-v3-verse]")) return;
        let dock = out.querySelector("[data-bx-verse-ai-dock]");
    if (!dock) {
      dock = document.createElement("section");
      dock.className = "bx-verse-ai-dock";
      dock.dataset.bxVerseAiDock = "1";
      dock.innerHTML = `<div><b>✨ Camada visual da passagem</b><small>Gere uma imagem ou vídeo com o contexto do capítulo.</small></div><nav><button type="button" data-bx-verse-ai="image">🖼 Gerar imagem IA</button><button type="button" data-bx-verse-ai="video">🎬 Gerar vídeo IA</button><button type="button" data-bx-chapter-images data-bx-chap="">🗂 Todas as imagens do capítulo</button><button type="button" data-bx-chapter-videos data-bx-chap="">🎬 Todos os vídeos do capítulo</button></nav>`;
      const dockHost = (out.querySelector("[data-bx-v3-verse]") || {}).parentElement || out;
      dockHost.appendChild(dock);
    }
    const dockRef = (($("[data-bx-v3-verse]", out) || {}).dataset || {}).ref || (($("#bRef") || {}).value || "").trim() || "";
    const dockChap = chapterBaseOf(dockRef);
    dock.dataset.mediaRef = dockRef;
    const imgButton = dock.querySelector("[data-bx-chapter-images]");
    const vidButton = dock.querySelector("[data-bx-chapter-videos]");
    const chapterScan = `${verseMediaRevision}|${dockChap}`;
    if ((imgButton || vidButton) && dock.dataset.bxChapterScan !== chapterScan) {
      dock.dataset.bxChapterScan = chapterScan;
      if (imgButton) imgButton.dataset.bxChap = dockChap;
      if (vidButton) vidButton.dataset.bxChap = dockChap;
      bxMediaIdxEnsure(() => {
        const ok = bxMediaChapterOk(dockChap);
        if (imgButton && imgButton.isConnected) imgButton.classList.toggle("is-available", ok.img);
        if (vidButton && vidButton.isConnected) vidButton.classList.toggle("is-available", ok.vid);
      });
    }
    if (imgButton && !imgButton.dataset.bxChapBound) {
      imgButton.dataset.bxChapBound = "1";
      imgButton.addEventListener("click", (ev) => { ev.preventDefault(); ev.stopImmediatePropagation(); openChapterImagesDirect(imgButton.dataset.bxChap || dockChap); });
    }
    if (vidButton && !vidButton.dataset.bxChapBound) {
      vidButton.dataset.bxChapBound = "1";
      vidButton.addEventListener("click", (ev) => { ev.preventDefault(); ev.stopImmediatePropagation(); openChapterVideosDirect(vidButton.dataset.bxChap || dockChap); });
    }
    if (!document.getElementById("bxVerse244Override")) {
      const os = document.createElement("style");
      os.id = "bxVerse244Override";
      os.textContent = `.bx-verse-ai-dock nav{flex-wrap:wrap;gap:8px}.bx-verse-ai-dock nav button{min-height:44px;display:inline-flex;align-items:center;justify-content:center;gap:6px;padding:9px 14px;border-radius:12px;font-size:.8rem;font-weight:800;line-height:1.15;border:1px solid rgba(255,199,110,.30);background:linear-gradient(180deg,#123047,#0b1e30);color:#eef8ff;cursor:pointer;box-shadow:none}.bx-verse-ai-dock nav button:hover{background:linear-gradient(180deg,#15506a,#10384d)}#bOut .lmx-bible-v3-tools button[data-bx-verse-images][data-bx-vsaved],#bOut .lmx-bible-v3-tools button[data-bx-verse-videos][data-bx-vsaved]{border:1px solid #d3e2ea!important;border-radius:10px;padding:6px 11px!important;background:#f7fafc!important;color:#0b2a3a!important;font-weight:800;font-size:.72rem;line-height:1.15;min-height:26px;display:inline-flex;align-items:center;cursor:pointer;box-shadow:none!important}#bOut .lmx-bible-v3-tools button[data-bx-verse-images][data-bx-vsaved]:hover,#bOut .lmx-bible-v3-tools button[data-bx-verse-videos][data-bx-vsaved]:hover{background:#e7f4f6!important}#bOut .lmx-bible-v3-tools button[data-bx-verse-images][data-bx-vsaved].is-available,#bOut .lmx-bible-v3-tools button[data-bx-verse-videos][data-bx-vsaved].is-available,.bx-verse-ai-dock nav button.is-available{border-color:rgba(64,196,174,.95)!important;color:#06333a!important;background:linear-gradient(180deg,#b9f3e4,#6fe0c9)!important;box-shadow:0 0 0 1px rgba(64,196,174,.4),0 0 14px rgba(88,226,199,.55);animation:bxVerse244Neon 2.4s ease-in-out infinite}.bx-verse-ai-dock nav button.is-available:hover,#bOut .lmx-bible-v3-tools button[data-bx-verse-images][data-bx-vsaved].is-available:hover,#bOut .lmx-bible-v3-tools button[data-bx-verse-videos][data-bx-vsaved].is-available:hover{background:linear-gradient(180deg,#a8efe0,#5fd6bf)!important}@keyframes bxVerse244Neon{0%,100%{box-shadow:0 0 0 1px rgba(64,196,174,.35),0 0 8px rgba(88,226,199,.35)}50%{box-shadow:0 0 0 1px rgba(64,196,174,.55),0 0 20px rgba(88,226,199,.85)}}@media(max-width:680px){.bx-verse-ai-dock nav button{padding:8px 10px;font-size:.74rem;min-height:40px}#bOut .lmx-bible-v3-tools button[data-bx-verse-images][data-bx-vsaved],#bOut .lmx-bible-v3-tools button[data-bx-verse-videos][data-bx-vsaved]{padding:5px 9px!important;font-size:.7rem}}`;
      document.head.appendChild(os);
    }
    if (!document.getElementById("bxVerse248Dock")) {
      const o8 = document.createElement("style");
      o8.id = "bxVerse248Dock";
      o8.textContent = `.bx-verse-ai-dock{box-sizing:border-box;max-width:100%!important;flex-wrap:wrap;gap:10px 14px;margin:12px auto 4px;padding:10px 13px}.bx-verse-ai-dock>div{min-width:0}.bx-verse-ai-dock nav{flex-wrap:wrap;gap:7px;justify-content:center}.bx-verse-ai-dock nav button{white-space:nowrap;height:auto;min-height:38px}.bx-verse-ai-dock b{font-size:.92rem;line-height:1.25}.bx-verse-ai-dock small{font-size:.76rem;line-height:1.3;margin-top:2px}@media(max-width:680px){.bx-verse-ai-dock{flex-direction:column;align-items:stretch}.bx-verse-ai-dock nav{justify-content:flex-start}.bx-verse-ai-dock b{font-size:.9rem}}`;
      document.head.appendChild(o8);
    }
  }

  function openAtlas(query) {
    const scene = state.scene;
    const model = getIntegrationModel();
    const target = query || model.queries.atlas || scene.place?.query || scene.place?.name || state.ref;
    close();
    if (window.AtlasXVivo && typeof window.AtlasXVivo.open === "function") {
      window.AtlasXVivo.open(target);
      return;
    }
    openSection("maps");
    setTimeout(() => {
      setValue(["#bxMapQuery", "#bxAtlasQuery"], target);
      $("#bxMapFind, #bxAtlasFind")?.click();
    }, 160);
  }

  function getContext() {
    if (!state.scene && !state.ref) return null;
    const scene = state.scene || createGenericScene(state.ref);
    const event = selectedEvent();
    const integration = getIntegrationModel();
    return {
      open: true,
      reference: state.ref || scene.reference || "",
      currentNarrativeRef: state.currentNarrativeRef || event.ref || state.ref || scene.reference || "",
      verseText: state.verseText || "",
      scene,
      event,
      display: [scene.title, scene.place?.name].filter(Boolean).join(" • "),
      integration,
      mediaQuery: integration.queries.media,
      searchQuery: integration.queries.images
    };
  }

  function getIntegrationModel() {
    const scene = state.scene || createGenericScene(state.ref);
    const event = selectedEvent();
    const imagePreferred = scene?.place?.name || scene?.place?.query || scene?.mediaQuery;
    const imageQuery = mediaQueryForScene(scene, event, imagePreferred, "image");
    const mediaQuery = mediaQueryForScene(scene, event, scene.mediaQuery, "image");
    const panoramaQuery = mediaQueryForScene(scene, event, scene.panoramaQuery, "panorama");
    return {
      version: VERSION,
      active: Boolean(state.scene || state.ref),
      reference: state.ref || scene.reference || "",
      sceneId: scene.id || "",
      event: {
        index: state.activeEvent,
        label: event.label || "Leitura guiada",
        ref: event.ref || state.ref || scene.reference || "",
        summary: event.summary || ""
      },
      layers: INTEGRATION_LAYERS.slice(),
      queries: {
        images: imageQuery,
        media: mediaQuery,
        panorama: panoramaQuery,
        atlas: scene.place?.query || scene.place?.name || state.ref || scene.reference || ""
      },
      readiness: {
        text: Boolean(state.ref || scene.reference),
        images: state.visualQuery === imageQuery && state.visualItems.length > 0,
        media: true,
        panorama: Boolean(panoramaQuery),
        map: Boolean(scene.place?.name || (scene.route || []).length),
        people: (scene.people || []).length > 0,
        timeline: (scene.events || []).length > 0,
        context: Boolean(scene.historicalContext || (scene.geography || []).length || (scene.culturalNotes || []).length || (scene.curiosities || []).length)
      }
    };
  }

  function emitMediaContext() {
    try {
      window.dispatchEvent(new CustomEvent("biblex:media-context", { detail: getContext() }));
    } catch (error) {
      console.warn("Bíblia Viva: contexto de mídia não pôde ser atualizado", error);
    }
  }

  function sendToStudio() {
    const scene = state.scene;
    const payload = {
      source: "biblia-viva-modo-imersao",
      createdAt: new Date().toISOString(),
      reference: state.ref || scene.reference,
      verseText: state.verseText,
      context: {
        sceneId: scene.id,
        title: scene.title,
        subtitle: scene.subtitle,
        place: scene.place,
        certainty: scene.certainty,
        people: scene.people || [],
        events: scene.events || [],
        route: scene.route || [],
        visual: state.visualItems[state.visualIndex] || null,
        selectedEvent: selectedEvent(),
        completedEvents: state.completedEvents,
        favorite: state.favorite,
        note: readNote(scene, state.activeEvent)
      }
    };
    try {
      localStorage.setItem("logos-master-x:studio:from-biblia-x", JSON.stringify(payload));
      localStorage.setItem("logosx:immersionPayload", JSON.stringify(payload));
      localStorage.setItem("logosx:studioPrefill", state.verseText || state.ref || scene.reference);
      const previous = JSON.parse(localStorage.getItem("logosx:studioMessageConfig") || "{}");
      localStorage.setItem("logosx:studioMessageConfig", JSON.stringify(Object.assign({}, previous, {
        sourceMode: "passagem",
        text: state.verseText || state.ref,
        theme: scene.title,
        notes: `Bíblia Viva — Modo Imersão\n${scene.title}\n${scene.place?.name || ""}\n\n${selectedEvent().summary || ""}\n\nAnotação: ${readNote(scene, state.activeEvent) || "(nenhuma)"}`
      })));
      localStorage.setItem("logosx:studioStep", "3");
    } catch (error) {
      console.warn("Bíblia Viva: não foi possível preparar o Studio X", error);
    }
    close();
    const studioButton = $("[data-go='studio'], [data-view='studio'], [data-bible-section='dna']");
    if (studioButton) studioButton.click();
    else if (typeof window.render === "function") window.render("studio");
  }

  function fullscreenElement() {
    return document.fullscreenElement || document.webkitFullscreenElement || null;
  }

  function syncQuadrantFullscreenUI() {
    const native = fullscreenElement();
    let activeMode = "";
    $$("[data-imm-quadrant]", modal).forEach((panel) => {
      const mode = panel.dataset.immQuadrant || "";
      const active = native === panel || panel.hasAttribute("data-bx-quadrant-fallback");
      const button = $(`[data-imm-quadrant-controls="${mode}"] [data-imm-quadrant-action="fullscreen"]`, modal);
      if (active) {
        activeMode = mode;
        button?.classList.add("is-active");
        button?.setAttribute("aria-pressed", "true");
        if (button) button.textContent = "✕ Sair";
      } else {
        button?.classList.remove("is-active");
        button?.setAttribute("aria-pressed", "false");
        if (button) button.textContent = "⛶ Tela";
      }
    });
    if (!activeMode && state.quadrantFullscreenMode) {
      state.quadrantFullscreenMode = "";
      state.quadrantFocus = { mode: "", size: "full", zoom: state.quadrantFocus.zoom || 1 };
      syncQuadrantFocusUI();
    } else if (activeMode) {
      state.quadrantFullscreenMode = activeMode;
    }
  }

  function toggleQuadrantFullscreen(panel, mode) {
    if (!panel || !mode) return;
    const native = fullscreenElement();
    const isActive = native === panel || panel.hasAttribute("data-bx-quadrant-fallback");
    if (isActive) {
      panel.removeAttribute("data-bx-quadrant-fallback");
      panel.classList.remove("bx-immersion-quadrant-fullscreen");
      state.quadrantFullscreenMode = "";
      state.quadrantFocus = { mode: "", size: "full", zoom: state.quadrantFocus.zoom || 1 };
      syncQuadrantFocusUI();
      const exit = document.exitFullscreen || document.webkitExitFullscreen;
      if (native === panel && typeof exit === "function") Promise.resolve(exit.call(document)).catch(() => {});
      syncQuadrantFullscreenUI();
      return;
    }
    setQuadrantFocus(mode, "full");
    state.quadrantFullscreenMode = mode;
    const request = panel.requestFullscreen || panel.webkitRequestFullscreen;
    if (typeof request !== "function") {
      panel.setAttribute("data-bx-quadrant-fallback", "1");
      panel.classList.add("bx-immersion-quadrant-fullscreen");
      syncQuadrantFullscreenUI();
      return;
    }
    try {
      const result = request.call(panel, { navigationUI: "hide" });
      if (result?.catch) result.catch(() => {
        panel.setAttribute("data-bx-quadrant-fallback", "1");
        panel.classList.add("bx-immersion-quadrant-fullscreen");
        syncQuadrantFullscreenUI();
      });
    } catch (_) {
      panel.setAttribute("data-bx-quadrant-fallback", "1");
      panel.classList.add("bx-immersion-quadrant-fullscreen");
    }
    syncQuadrantFullscreenUI();
  }

  function isImmersionFullscreenActive(dialog = $(".bx-immersion-dialog", modal)) {
    return Boolean(dialog && (fullscreenElement() === dialog || dialog.classList.contains("bx-immersion-fullscreen")));
  }

  function setImmersionFullscreenUi(active) {
    const dialog = $(".bx-immersion-dialog", modal);
    const button = $("[data-imm-action='fullscreen']", modal);
    if (!dialog) return;
    dialog.classList.toggle("bx-immersion-fullscreen", Boolean(active));
    modal?.classList.toggle("bx-immersion-is-fullscreen", Boolean(active));
    if (button) {
      button.textContent = active ? "✕ Sair da tela cheia" : "⛶ Tela cheia";
      button.setAttribute("aria-pressed", active ? "true" : "false");
      button.setAttribute("aria-label", active ? "Sair da tela cheia da Bíblia Viva" : "Abrir Bíblia Viva em tela cheia");
    }
  }

  function toggleFullscreen() {
    const dialog = $(".bx-immersion-dialog", modal);
    if (!dialog) return;
    if (isImmersionFullscreenActive(dialog)) {
      setImmersionFullscreenUi(false);
      const exit = document.exitFullscreen || document.webkitExitFullscreen;
      if (fullscreenElement() && typeof exit === "function") Promise.resolve(exit.call(document)).catch(() => {});
      return;
    }
    setImmersionFullscreenUi(true);
    const request = dialog.requestFullscreen || dialog.webkitRequestFullscreen;
    if (typeof request !== "function") return;
    try {
      const result = request.call(dialog, { navigationUI: "hide" });
      if (result?.catch) result.catch(() => setImmersionFullscreenUi(true));
    } catch (_) {
      setImmersionFullscreenUi(true);
    }
  }

  function restoreSharePopupPortal() {
    const popup = document.getElementById("bxSharePop");
    const origin = popup?.__bxImmersionPortalOrigin;
    if (!popup || !origin?.parent) return;
    if (origin.next && origin.next.parentNode === origin.parent) origin.parent.insertBefore(popup, origin.next);
    else origin.parent.appendChild(popup);
    delete popup.__bxImmersionPortalOrigin;
  }

  function portalSharePopupIfNeeded() {
    const dialog = $(".bx-immersion-dialog", modal);
    const popup = document.getElementById("bxSharePop");
    if (!dialog || !popup || !isImmersionFullscreenActive(dialog) || popup.parentNode === dialog) return;
    popup.__bxImmersionPortalOrigin = { parent: popup.parentNode, next: popup.nextSibling };
    dialog.appendChild(popup);
  }

  function openBibleShareFunction() {
    const selectors = [
      '.bible-x-shell .lmx-bible-v3-top-main [data-reader-action="share"]',
      '.bible-x-shell [data-v157-share]',
      '[data-reader-action="share"]',
      '[data-v157-share]'
    ];
    const candidates = selectors.flatMap((selector) => Array.from(document.querySelectorAll(selector)));
    const source = candidates.find((element) => !modal?.contains(element) && element.getClientRects?.().length) || candidates.find((element) => !modal?.contains(element));
    if (!source) return false;
    source.click();
    portalSharePopupIfNeeded();
    window.setTimeout(portalSharePopupIfNeeded, 0);
    return true;
  }

  async function shareStory() {
    if (openBibleShareFunction()) return;
    const scene = state.scene || createGenericScene(state.ref);
    const reference = state.ref || scene.reference || "Passagem bíblica";
    const event = selectedEvent();
    const text = `${scene.title || "Bíblia Viva"} — ${reference}\n${event.label ? `${event.label}: ` : ""}${scene.subtitle || "Explore esta passagem em camadas."}`;
    const url = `${window.location.origin}${window.location.pathname}#biblia-viva=${encodeURIComponent(reference)}&etapa=${state.activeEvent}`;
    const data = { title: `${scene.title || "Bíblia Viva"} | Logos Master X`, text, url };
    try {
      if (typeof navigator.share === "function") {
        await navigator.share(data);
        return;
      }
      if (navigator.clipboard && typeof navigator.clipboard.writeText === "function") {
        await navigator.clipboard.writeText(`${text}\n${url}`);
        const note = $("[data-imm-source-note]", modal);
        if (note) note.textContent = "✓ Link da cena copiado. Compartilhe com quem vai estudar esta passagem.";
        return;
      }
    } catch (error) {
      if (error?.name === "AbortError") return;
      console.warn("Bíblia Viva: compartilhamento indisponível", error);
    }
    window.prompt("Copie o link desta cena para compartilhar:", `${text}\n${url}`);
  }

  function studySheetText() {
    const scene = state.scene || createGenericScene(state.ref);
    const event = selectedEvent();
    const list = (items) => (items || []).map((item) => {
      if (typeof item === "string") return item;
      const label = item.title || item.name || item.label || "Nota";
      const value = item.text || item.description || item.meaning || item.value || item.query || "";
      return value ? `${label}: ${value}` : label;
    }).join("\n");
    const sources = (scene.sources || []).map((source) => `${source.type || "Fonte"} — ${source.label || "Registro"}: ${source.value || ""} (${source.certainty || "verificar"})`).join("\n");
    const related = relatedScenes(scene).map((item) => `${item.scene.title || "Cena"} — ${item.scene.reference || "referência"} (${item.reason})`).join("\n");
    const visual = state.visualItems[state.visualIndex] || null;
    const visualSource = safeHttpUrl(visual?.page_url || visual?.pageUrl || visual?.descriptionurl);
    const totalEvents = (scene.events || []).length || 1;
    const completed = state.completedEvents.filter((index) => index < totalEvents).length;
    const percent = Math.round((completed / totalEvents) * 100);
    return [
      `BÍBLIA VIVA — ${scene.title || "Entrar na história"}`,
      `Referência: ${state.ref || scene.reference || "Passagem bíblica"}`,
      `Etapa: ${event.label || "Leitura guiada"} (${event.ref || "ordem narrativa"})`,
      "",
      "TEXTO EM FOCO",
      state.verseText || "Texto não disponível no momento.",
      "",
      "LUGAR E CERTEZA",
      `${scene.place?.name || "Lugar em estudo"} — ${scene.certainty || "Contexto em investigação"}`,
      "",
      "RESUMO DA ETAPA",
      event.summary || scene.subtitle || "",
      "",
      "CONTEXTO HISTÓRICO",
      scene.historicalContext || "Contexto a investigar no módulo Contexto X.",
      "",
      "ROTA E GEOGRAFIA",
      [list(scene.route), list(scene.geography)].filter(Boolean).join("\n") || "A investigar no Atlas X Vivo.",
      "",
      "CULTURA E CURIOSIDADES",
      [list(scene.culturalNotes), list(scene.curiosities)].filter(Boolean).join("\n") || "A investigar no Contexto X.",
      "",
      "OBJETOS PARA OBSERVAR",
      list(scene.objects) || "Nenhum objeto editorial cadastrado.",
      "",
      "PERGUNTAS PARA ESTUDO",
      (scene.questions || []).map((question, index) => `${index + 1}. ${question}`).join("\n") || "Nenhuma pergunta cadastrada.",
      "",
      "FONTES E GRAU DE CERTEZA",
      sources || "Confirme o texto bíblico, o Atlas e a legenda editorial.",
      "",
      "ANOTAÇÃO DO ESTUDO",
      readNote(scene, state.activeEvent) || "Nenhuma anotação registrada para esta etapa.",
      "",
      "ETAPAS CONCLUÍDAS",
      `${completed} de ${totalEvents} (${percent}%)`,
      "",
      "MÍDIA EM FOCO",
      visual ? `${visual.title || "Imagem pública"} — ${visual.credit || visual.source || "crédito na fonte"}${visual.license ? ` — ${visual.license}` : ""}${visualSource ? `\nFonte: ${visualSource}` : ""}` : "Nenhuma imagem pública carregada.",
      "",
      "CENAS RELACIONADAS",
      related || "Explore o catálogo para encontrar outras camadas.",
      "",
      "NOTA EDITORIAL",
      scene.timelineNote || "Reconstrução visual editorial; confirme o texto e as fontes."
    ].join("\n");
  }

  async function copyStudySheet() {
    const text = studySheetText();
    try {
      if (navigator.clipboard?.writeText) await navigator.clipboard.writeText(text);
      else throw new Error("clipboard unavailable");
      const note = $("[data-imm-source-note]", modal);
      if (note) note.textContent = "✓ Ficha da cena copiada para a área de transferência.";
    } catch (_) {
      window.prompt("Copie a ficha da cena:", text);
    }
  }

  function exportStudySheet() {
    const scene = state.scene || createGenericScene(state.ref);
    const filename = `${norm(scene.title || "biblia-viva").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "biblia-viva"}.txt`;
    const blob = new Blob([studySheetText()], { type: "text/plain;charset=utf-8" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    link.click();
    setTimeout(() => URL.revokeObjectURL(link.href), 1000);
  }

  function openFromHash() {
    const hash = String(window.location.hash || "");
    const match = hash.match(/(?:^#|&)biblia-viva=([^&]+)/i);
    if (!match) return;
    const eventMatch = hash.match(/(?:^#|&)etapa=(\d+)/i);
    let reference = "";
    try {
      reference = decodeURIComponent(match[1].replace(/\+/g, " ")).trim();
    } catch (_) {
      reference = match[1].trim();
    }
    if (!reference) return;
    const verse = $$(".lmx-bible-v3-verse[data-ref], [data-bx-v3-verse][data-ref]")
      .find((node) => String(node.getAttribute("data-ref") || "").trim() === reference);
    const text = verse ? $(".lmx-bible-v3-text, [data-bx-verse-text]", verse)?.innerText || "" : "";
    open(reference, text, null);
    if (eventMatch && state.scene?.events?.length) {
      state.activeEvent = Math.max(0, Math.min(Number(eventMatch[1]) || 0, state.scene.events.length - 1));
      state.activeTab = "scene";
      renderAll();
    }
  }

  function handleModalClick(event) {
    const target = event.target;
    if (target.closest("[data-imm-close]")) {
      event.preventDefault();
      close();
      return;
    }
    const stageControl = target.closest("[data-imm-stage-control]");
    if (stageControl) {
      const control = stageControl.dataset.immStageControl;
      if (control === "zoom-in") setStageZoom(state.stageZoom + 0.2);
      else if (control === "zoom-out") setStageZoom(state.stageZoom - 0.2);
      else if (control === "reset") setStageZoom(1);
      return;
    }
    const quadrant = target.closest("[data-imm-quadrant-action]");
    if (quadrant) {
      const panel = quadrant.closest("[data-imm-quadrant]");
      const mode = panel?.dataset.immQuadrant;
      const action = quadrant.dataset.immQuadrantAction;
      if (!mode) return;
      if (action === "zoom-in") state.quadrantFocus.zoom = Math.min(1.35, (state.quadrantFocus.zoom || 1) + .1);
      else if (action === "zoom-out") state.quadrantFocus.zoom = Math.max(.85, (state.quadrantFocus.zoom || 1) - .1);
      else if (action === "fullscreen") {
        toggleQuadrantFullscreen(panel, mode);
        return;
      }
      else if (action === "half" || action === "full") setQuadrantFocus(mode, action);
      else if (action === "reset") resetQuadrantFocus();
      syncQuadrantFocusUI();
      return;
    }
    const contextSubtab = target.closest("[data-imm-context-subtab]");
    if (contextSubtab) {
      state.contextSubtab = contextSubtab.dataset.immContextSubtab || "geography";
      state.activeTab = "context";
      renderContext();
      return;
    }
    const tab = target.closest("[data-imm-tab]");
    if (tab) {
      state.activeTab = tab.dataset.immTab || "scene";
      renderContext();
      return;
    }
    const progressDot = target.closest("[data-imm-progress-event]");
    if (progressDot) {
      state.activeEvent = Number(progressDot.dataset.immProgressEvent) || 0;
      state.activeTab = "scene";
      saveProgress();
      renderAll();
      focusActiveEvent();
      return;
    }
    const verseAnchor = target.closest("[data-imm-verse-ref]");
    if (verseAnchor) {
      state.activeEvent = Number(verseAnchor.dataset.immVerseEvent) || 0;
      state.currentNarrativeRef = verseAnchor.dataset.immVerseRef || state.currentNarrativeRef;
      state.activeTab = "scene";
      saveProgress();
      renderAll();
      focusActiveEvent();
      return;
    }
    const related = target.closest("[data-imm-related-ref]");
    if (related) {
      const reference = related.dataset.immRelatedRef || "";
      open(reference, catalogTextForReference(reference), related);
      return;
    }
    const eventButton = target.closest("[data-imm-event]");
    const completeButton = target.closest("[data-imm-complete]");
    if (completeButton) {
      event.stopPropagation();
      toggleEventCompleted(completeButton.dataset.immComplete);
      return;
    }
    if (eventButton) {
      state.activeEvent = Number(eventButton.dataset.immEvent) || 0;
      state.activeTab = "timeline";
      saveProgress();
      renderAll();
      focusActiveEvent();
      return;
    }
    const hotspot = target.closest("[data-imm-hotspot]");
    if (hotspot) {
      if (hotspot.dataset.person) {
        state.selectedPerson = hotspot.dataset.person;
        state.activeTab = "people";
      } else if (hotspot.dataset.event !== "") {
        state.activeEvent = Number(hotspot.dataset.event) || 0;
        state.activeTab = "scene";
      }
      renderAll();
      return;
    }
    const person = target.closest("[data-imm-person]");
    if (person) {
      state.selectedPerson = person.dataset.immPerson || "";
      renderContext();
      return;
    }
    const route = target.closest("[data-imm-route]");
    if (route) {
      openAtlas(route.dataset.immRoute);
      return;
    }
    const routeMedia = target.closest("[data-imm-route-media]");
    if (routeMedia) {
      openMedia(false, routeMedia.dataset.immRouteMedia);
      return;
    }
    const visualOpen = target.closest("[data-imm-visual-open]");
    if (visualOpen) {
      openVisualGallery(visualOpen.dataset.immVisualOpen);
      return;
    }
    const visualNav = target.closest("[data-imm-visual]");
    if (visualNav) {
      cycleVisual(visualNav.dataset.immVisual === "next" ? 1 : -1);
      return;
    }
    const action = target.closest("[data-imm-action]");
    if (!action) return;
    const name = action.dataset.immAction;
    if (name === "speak") toggleSpeech();
    else if (name === "tour") toggleTour();
    else if (name === "presentation") togglePresentation();
    else if (name === "shortcuts") toggleShortcuts();
    else if (name === "prev") cycleEvent(-1, "scene");
    else if (name === "next") cycleEvent(1, "scene");
    else if (name === "complete-current") toggleEventCompleted(state.activeEvent);
    else if (name === "save") { saveProgress(); renderProgress(); }
    else if (name === "favorite") toggleFavorite();
    else if (name === "save-note") { flushNoteDraft(); saveNote($("[data-imm-note]", modal)?.value || ""); }
    else if (name === "clear-note") { flushNoteDraft(); saveNote(""); renderContext(); }
    else if (name === "reader") openReader();
    else if (name === "context-module") openStudyModule("context", ["#bxContextQuery"], ["#bxContextFind"]);
    else if (name === "people-module") openStudyModule("people", ["#bxPeopleQuery"], ["#bxPeopleFind"]);
    else if (name === "timeline-module") openStudyModule("timeline", ["#bxTimelineQuery"], ["#bxTimelineFind"]);
    else if (name === "visual") loadVisuals();
    else if (name === "media") openMedia(false);
    else if (name === "generate") openAiMedia();
    else if (name === "panorama") openPanoramaExperience();
    else if (name === "atlas") openAtlas();
    else if (name === "toggle-mini-map") { state.miniMap3d = !state.miniMap3d; renderStage(); }
    else if (name === "share") shareStory();
    else if (name === "copy") copyStudySheet();
    else if (name === "export") exportStudySheet();
    else if (name === "catalog") { const focus = state.lastFocus; openCatalog(focus); }
    else if (name === "studio") sendToStudio();
    else if (name === "fullscreen") toggleFullscreen();
  }

  function mediaRefMatches(rowRef, targetRef) {
    const clean = (value) => norm(value).replace(/[–—]/g, "-");
    const a = clean(rowRef), b = clean(targetRef);
    if (!a || !b) return false;
    if (a === b) return true;
    const parse = (value) => {
      const m = value.match(/^(.*?)\s+(\d+)(?::(\d+)(?:-(\d+))?)?$/);
      if (!m) return null;
      const hasVerse = m[3] !== undefined;
      return { book: m[1], chapter: Number(m[2]), start: hasVerse ? Number(m[3]) : 0, end: hasVerse ? Number(m[4] || m[3]) : 0, chapterOnly: !hasVerse };
    };
    const left = parse(a), right = parse(b);
    if (!left || !right || left.book !== right.book || left.chapter !== right.chapter) return false;
    /* 5.4.245 — mídia do capítulo inteiro (ex.: "Apocalipse 1", que é como o Lote
       grava a densidade "capítulo inteiro") é relacionada a QUALQUER versículo do
       capítulo: passa a aparecer no rodapé da Bíblia em "ver imagens geradas". */
    if (left.chapterOnly || right.chapterOnly) return true;
    return (right.start >= left.start && right.start <= left.end) || (left.start >= right.start && left.start <= right.end);
  }

  function readPassageMedia(ref, callback) {
    /* 5.4.242 — o try antigo só cobria o open; o transaction rodava no onsuccess,
       fora do try, e estourava "object store was not found" quando nenhuma mídia
       tinha sido salva ainda (a store só nasce no onupgradeneeded do módulo de IA).
       Espelhamos o mediaDB() do ai-media e garantimos callback([]) em qualquer falha. */
    try {
      const request = indexedDB.open("logosx-bible", 15);
      request.onupgradeneeded = () => { if (!request.result.objectStoreNames.contains("media")) request.result.createObjectStore("media", { keyPath: "id" }); };
      request.onerror = () => callback([]);
      request.onsuccess = () => {
        try {
          const tx = request.result.transaction("media", "readonly");
          const get = tx.objectStore("media").getAll();
          get.onerror = () => callback([]);
          tx.onerror = () => callback([]);
          get.onsuccess = () => callback((get.result || []).filter(row => [row.reference, ...(Array.isArray(row.relatedReferences) ? row.relatedReferences : [])].some(value => mediaRefMatches(value || "", ref))));
        } catch (_) { callback([]); }
      };
    } catch (_) { callback([]); }
  }

  /* ---- 5.4.244 — abertura DIRETA (sem tela intermediária):
         • IMAGENS do versículo/capítulo usam o MESMO visualizador da biblioteca
           (window.BibleXVisualMedia.openGallery → barra de cima com girar 90°,
           zoom, Ajustar, tela cheia, navegar ‹/› pelas mídias da passagem);
         • VÍDEOS abrem em player de tela cheia próprio (sem tela intermediária). ---- */

  function chapterBaseOf(ref) {
    return String(ref || "").replace(/:.*$/, "").trim() || String(ref || "").trim();
  }

  function mediaRefInChapter(value, chap) {
    if (!value || !chap) return false;
    const s = String(value || "").trim();
    return s === chap || s.startsWith(chap + ":");
  }

  function readChapterMedia(chap, callback) {
    /* Espelha readPassageMedia, mas aceita QUALQUER versículo do capítulo
       (João 4:7 pertence a "João 4"). Garante callback([]) em qualquer falha. */
    try {
      const request = indexedDB.open("logosx-bible", 15);
      request.onupgradeneeded = () => { if (!request.result.objectStoreNames.contains("media")) request.result.createObjectStore("media", { keyPath: "id" }); };
      request.onerror = () => callback([]);
      request.onsuccess = () => {
        try {
          const tx = request.result.transaction("media", "readonly");
          const get = tx.objectStore("media").getAll();
          get.onerror = () => callback([]);
          tx.onerror = () => callback([]);
          get.onsuccess = () => callback((get.result || []).filter(row => row && [row.reference, ...(Array.isArray(row.relatedReferences) ? row.relatedReferences : [])].some(value => mediaRefInChapter(value || "", chap))));
        } catch (_) { callback([]); }
      };
    } catch (_) { callback([]); }
  }

  function isVerseMediaSource(row) {
    return Boolean(row && (row.blob || row.sourceUrl || row.thumbUrl));
  }

  function passageRowsToImages(rows) {
    return (rows || []).filter(row => row && row.type !== "video" && isVerseMediaSource(row));
  }

  function passageRowsToVideos(rows) {
    return (rows || []).filter(row => row && row.type === "video" && isVerseMediaSource(row));
  }

  function passageImageItems(rows, revokeList) {
    /* mesmos campos que a Mídia X usa no openGallery (visualizador da biblioteca). */
    return rows.map((row) => {
      const src = row.blob ? URL.createObjectURL(row.blob) : row.sourceUrl || row.thumbUrl || "";
      if (row.blob && src) revokeList.push(src);
      if (!src) return null;
      return {
        key: row.id || row.key || "",
        src,
        original_url: src,
        thumb_url: src,
        title: row.title || "Imagem da passagem",
        description: row.description || "",
        credit: row.credits || row.credit || (row.sourceKind === "local" ? "Arquivo local" : ""),
        license: row.license || "",
        page_url: /^https?:\/\//i.test(String(row.pageUrl || row.page_url || "")) ? (row.pageUrl || row.page_url) : "",
        license_url: row.licenseUrl || row.license_url || "",
        _dbId: row.id || row.key || "",
        _reference: String(row.reference || row.ref || "").trim()
      };
    }).filter(Boolean);
  }

  function passageStartIndex(rows, items, preferredSrc, preferredKey) {
    if (preferredKey) {
      const byKey = items.findIndex(item => item && item.key && item.key === preferredKey);
      if (byKey >= 0) return byKey;
    }
    if (preferredSrc) {
      for (let i = 0; i < rows.length; i += 1) {
        const s = rows[i] ? (rows[i].sourceUrl || rows[i].thumbUrl || "") : "";
        if (s && s === preferredSrc) return i;
      }
    }
    return 0;
  }

  function openPassageGallery(rows, preferredSrc, eyebrow, preferredKey) {
    const revoke = [];
    const items = passageImageItems(rows, revoke);
    if (!items.length) return;
    const visual = window.BibleXVisualMedia;
    if (typeof visual?.openGallery === "function") {
      visual.openGallery(items, passageStartIndex(rows, items, preferredSrc, preferredKey), {
        eyebrow,
        onClose: () => revoke.forEach((url) => URL.revokeObjectURL(url))
      });
      return;
    }
    revoke.forEach((url) => URL.revokeObjectURL(url));
  }

  function passageVideoSrc(row) {
    return row.blob ? URL.createObjectURL(row.blob) : row.sourceUrl || row.thumbUrl || "";
  }

  function openPassageVideosDirect(videos, preferredSrc, eyebrow, preferredKey) {
    if (!videos.length) return;
    const revoke = [];
    const list = videos.map((row) => ({ row, src: passageVideoSrc(row) })).filter(item => item.src);
    list.filter(item => item.row.blob).forEach(item => revoke.push(item.src));
    if (!list.length) return;
    let index = 0;
    let idx = preferredKey ? list.findIndex(item => (item.row.id || item.row.key || "") === preferredKey) : -1;
    if (idx < 0 && preferredSrc) idx = list.findIndex(item => item.src === preferredSrc);
    if (idx >= 0) index = idx;
    const overlay = document.createElement("div");
    overlay.className = "bxvm-overlay bxpm-overlay";
    const dialog = document.createElement("div");
    dialog.className = "bxvm-dialog bxpm-dialog";
    dialog.innerHTML = `
      <header class="bxvm-header">
        <div class="bxvm-heading"><small></small><h2></h2></div>
        <div class="bxvm-tools"><button type="button" data-bxpm-download aria-label="Baixar este vídeo">⬇</button><button type="button" data-bxpm-close aria-label="Fechar">×</button></div>
      </header>
      <main class="bxvm-stage"></main>
      <footer class="bxvm-footer"><div class="bxvm-caption"><strong></strong><span></span></div></footer>`;
    dialog.querySelector(".bxvm-heading small").textContent = eyebrow || "MÍDIA X • VÍDEO DA PASSAGEM";
    const stage = dialog.querySelector(".bxvm-stage");
    const prev = document.createElement("button");
    prev.type = "button"; prev.className = "bxvm-nav bxvm-previous"; prev.innerHTML = "‹"; prev.setAttribute("aria-label", "Vídeo anterior");
    const next = document.createElement("button");
    next.type = "button"; next.className = "bxvm-nav bxvm-next"; next.innerHTML = "›"; next.setAttribute("aria-label", "Próximo vídeo");
    const capCount = dialog.querySelector(".bxvm-caption strong");
    const capDetail = dialog.querySelector(".bxvm-caption span");
    overlay.appendChild(dialog);
    stage.append(prev, next);
    document.body.appendChild(overlay);
    document.body.classList.add("bxvm-lock");
    let current = null;
    const play = (n) => {
      index = (n + list.length) % list.length;
      if (current) current.remove();
      const video = document.createElement("video");
      video.className = "bxvm-video";
      video.controls = true;
      video.autoplay = true;
      video.playsInline = true;
      video.src = list[index].src;
      video.title = list[index].row.title || "";
      current = video;
      stage.appendChild(current);
      capCount.textContent = `${index + 1} / ${list.length}`;
      const row = list[index].row;
      capDetail.textContent = [row.title, row.reference && `Passagem: ${row.reference}`, row.description].filter(Boolean).join(" • ");
      prev.hidden = next.hidden = list.length < 2;
    };
    const close = () => {
      document.removeEventListener("keydown", onKey);
      overlay.remove();
      if (!document.querySelector(".bxvm-overlay,.bx-route-visual-modal,.bxpm-overlay")) document.body.classList.remove("bxvm-lock");
      revoke.forEach((url) => URL.revokeObjectURL(url));
    };
    const onKey = (event) => {
      if (event.key === "Escape") close();
      else if (event.key === "ArrowLeft") play(index - 1);
      else if (event.key === "ArrowRight") play(index + 1);
    };
    prev.addEventListener("click", () => play(index - 1));
    next.addEventListener("click", () => play(index + 1));
    const triggerVideoDownload = (url, name) => { const a = document.createElement("a"); a.href = url; a.download = name; document.body.appendChild(a); a.click(); a.remove(); };
    dialog.querySelector("[data-bxpm-download]")?.addEventListener("click", async () => {
      const it = list[index]; if (!it) return;
      const name = String(it.row.title || it.row.reference || "video-midia-x").replace(/[^\p{L}\p{N}]+/gu, "-").replace(/^-+|-+$/g, "") || "video-midia-x";
      const src = it.src;
      if (/^(blob|data):/i.test(src)) { triggerVideoDownload(src, name + ".mp4"); return; }
      try {
        const resp = await fetch(src, { mode: "cors" });
        if (!resp.ok) throw new Error("http " + resp.status);
        const blob = await resp.blob();
        const u = URL.createObjectURL(blob);
        triggerVideoDownload(u, name + ".mp4");
        setTimeout(() => URL.revokeObjectURL(u), 10000);
      } catch (_) { const w = window.open(src, "_blank"); if (w) w.opener = null; }
    });
    dialog.querySelector("[data-bxpm-close]").addEventListener("click", close);
    overlay.addEventListener("click", (event) => { if (event.target === overlay) close(); });
    document.addEventListener("keydown", onKey);
    play(index);
  }

  function openPassageMediaDirect(rows, preferredSrc, eyebrow, preferredKey) {
    const images = passageRowsToImages(rows);
    const videos = passageRowsToVideos(rows);
    if (preferredKey || preferredSrc) {
      const isVideo = preferredKey
        ? videos.some((row) => (row.id || row.key || "") === preferredKey)
        : videos.some((row) => { const s = row.sourceUrl || row.thumbUrl || ""; return Boolean(s && s === preferredSrc); });
      if (isVideo || !images.length) {
        openPassageVideosDirect(videos, preferredSrc, eyebrow, preferredKey);
        return;
      }
    }
    if (images.length) {
      openPassageGallery(images, preferredSrc, eyebrow, preferredKey);
      return;
    }
    if (videos.length) openPassageVideosDirect(videos, preferredSrc, eyebrow, preferredKey);
  }

  /* 5.4.245 — abertura RÁPIDA (segunda rodada): antes, o clique ainda relia a store
     INTEIRA (getAll clonando TODAS as mídias em base64) para abrir a imagem de um
     versículo = 3–4s de espera. Agora cruza o índice leve (que guarda id+refs) e
     lê SOMENTE os registros que casam com a passagem — na pratica 1 imagem. */
  function bxMediaMatchIds(kind, target, videoOnly) {
    const out = [];
    const seen = {};
    for (let i = 0; i < bxMediaIdx.length; i += 1) {
      const en = bxMediaIdx[i];
      if (!en.hasData || !en.id) continue;
      if (videoOnly === true && !en.video) continue;
      if (videoOnly === false && en.video) continue;
      for (let j = 0; j < en.refs.length; j += 1) {
        const hit = kind === "verse" ? (en.refs[j] && mediaRefMatches(en.refs[j], target)) : (en.refs[j] && mediaRefInChapter(en.refs[j], target));
        if (hit) { if (!seen[en.id]) { seen[en.id] = 1; out.push(en.id); } break; }
      }
    }
    return out;
  }
  function bxReadMediaByIds(ids, cb) {
    if (!ids || !ids.length) { cb([]); return; }
    try {
      const request = indexedDB.open("logosx-bible", 15);
      request.onupgradeneeded = () => { if (!request.result.objectStoreNames.contains("media")) request.result.createObjectStore("media", { keyPath: "id" }); };
      request.onerror = () => cb([]);
      request.onsuccess = () => {
        try {
          const tx = request.result.transaction("media", "readonly");
          const store = tx.objectStore("media");
          const rows = [];
          let back = 0;
          let fin = false;
          const finalize = () => { if (!fin) { fin = true; cb(rows); } };
          ids.forEach((id) => {
            const g = store.get(id);
            g.onsuccess = () => { if (g.result) rows.push(g.result); back += 1; if (back >= ids.length) finalize(); };
            g.onerror = () => { back += 1; if (back >= ids.length) finalize(); };
          });
          tx.onerror = () => finalize();
          tx.onabort = () => finalize();
        } catch (_) { cb([]); }
      };
    } catch (_) { cb([]); }
  }
  function bxOpenVerseMedia(ref, videoOnly, onRows, emptyMsg) {
    if (!ref) return;
    bxMediaIdxEnsure(() => {
      bxReadMediaByIds(bxMediaMatchIds("verse", ref, videoOnly), (rows) => {
        if (onRows(rows)) return;
        bxMediaToast(emptyMsg || `Nenhuma mídia salva para ${ref} ainda.`);
      });
    });
  }
  function bxOpenChapterMedia(chap, videoOnly, onRows, emptyMsg) {
    if (!chap) return;
    bxMediaIdxEnsure(() => {
      bxReadMediaByIds(bxMediaMatchIds("chapter", chap, videoOnly), (rows) => {
        if (onRows(rows)) return;
        bxMediaToast(emptyMsg || `Nenhuma mídia salva para o capítulo ${chap} ainda.`);
      });
    });
  }

  function openVerseSavedMedia(ref, preferredSrc, preferredKey) {
    bxOpenVerseMedia(ref, null, (rows) => {
      const imgs = passageRowsToImages(rows);
      const vids = passageRowsToVideos(rows);
      if (!imgs.length && !vids.length) return false;
      openPassageMediaDirect(rows, preferredSrc || "", `MÍDIA X • PASSAGEM • ${ref}`, preferredKey || "");
      return true;
    }, `Nenhuma mídia salva para ${ref} ainda. Gere no Gerador de IA.`);
  }

  function openVerseImagesDirect(ref) {
    bxOpenVerseMedia(ref, false, (rows) => {
      const imgs = passageRowsToImages(rows);
      if (!imgs.length) return false;
      openPassageGallery(imgs, "", `MÍDIA X • IMAGENS DA PASSAGEM • ${ref}`, "");
      return true;
    }, `Nenhuma imagem salva para ${ref} ainda. Gere uma no Gerador de IA.`);
  }

  function openVerseVideosDirect(ref) {
    bxOpenVerseMedia(ref, true, (rows) => {
      const vids = passageRowsToVideos(rows);
      if (!vids.length) return false;
      openPassageVideosDirect(vids, "", `MÍDIA X • VÍDEOS DA PASSAGEM • ${ref}`, "");
      return true;
    }, `Nenhum vídeo salvo para ${ref} ainda. Gere um no Gerador de IA.`);
  }

  function openChapterSavedMedia(chap) {
    bxOpenChapterMedia(chap, null, (rows) => {
      const imgs = passageRowsToImages(rows);
      const vids = passageRowsToVideos(rows);
      if (!imgs.length && !vids.length) return false;
      openPassageMediaDirect(rows, "", `MÍDIA X • CAPÍTULO • ${chap}`);
      return true;
    }, `Nenhuma mídia salva para o capítulo ${chap} ainda.`);
  }

  function openChapterImagesDirect(chap) {
    bxOpenChapterMedia(chap, false, (rows) => {
      const imgs = passageRowsToImages(rows);
      if (!imgs.length) return false;
      openPassageGallery(imgs, "", `MÍDIA X • IMAGENS DO CAPÍTULO • ${chap}`, "");
      return true;
    }, `Nenhuma imagem salva para o capítulo ${chap} ainda.`);
  }

  function openChapterVideosDirect(chap) {
    bxOpenChapterMedia(chap, true, (rows) => {
      const vids = passageRowsToVideos(rows);
      if (!vids.length) return false;
      openPassageVideosDirect(vids, "", `MÍDIA X • VÍDEOS DO CAPÍTULO • ${chap}`, "");
      return true;
    }, `Nenhum vídeo salvo para o capítulo ${chap} ainda.`);
  }

  function ensureVerseAiButtons(tools, verse) {
    if (!verse) return;
    const ref = verse.getAttribute("data-ref") || "";
    const insertBefore = tools.querySelector("[data-bx-verse-more], .lmx-bible-v3-more");
    const place = (btn) => { if (insertBefore) insertBefore.before(btn); else tools.appendChild(btn); return btn; };
    const ai = (kind, label) => { let btn = tools.querySelector(`[data-bx-verse-ai="${kind}"]`); if (!btn) { btn = document.createElement("button"); btn.type = "button"; btn.setAttribute("data-bx-verse-ai", kind); place(btn); } btn.textContent = label; return btn; };
    ai("image", "🖼 Gerar imagem"); ai("video", "🎬 Gerar vídeo");
    /* 5.4.244 — dois botoes salvos ABAIXO do versiculo; cada um abre DIRETO o seu tipo
       (imagem -> galeria com a barra da biblioteca; video -> player de tela cheia). */
    const saved = (attr, label, titleText) => { let btn = tools.querySelector(`[${attr}]`); if (!btn) { btn = document.createElement("button"); btn.type = "button"; btn.setAttribute(attr, ref); place(btn); } else btn.setAttribute(attr, ref); btn.dataset.bxVsaved = "1"; btn.textContent = label; btn.title = titleText; btn.hidden = false; return btn; };
    const imgBtn = saved("data-bx-verse-images", "🖼 Imagem da passagem", `Ver imagens salvas de ${ref}`);
    const vidBtn = saved("data-bx-verse-videos", "🎬 Vídeo da passagem", `Ver vídeos salvos de ${ref}`);
    /* 5.4.244 — handler DIRETO no botao (fase target roda antes de qualquer
       delegado do app em bubble; evita abrir a tela intermediaria da Midia X). */
    if (!imgBtn.dataset.bxVerseSavedBound) {
      imgBtn.dataset.bxVerseSavedBound = "1";
      imgBtn.addEventListener("click", (ev) => { ev.preventDefault(); ev.stopImmediatePropagation(); openVerseImagesDirect(imgBtn.getAttribute("data-bx-verse-images") || ref); });
    }
    if (!vidBtn.dataset.bxVerseSavedBound) {
      vidBtn.dataset.bxVerseSavedBound = "1";
      vidBtn.addEventListener("click", (ev) => { ev.preventDefault(); ev.stopImmediatePropagation(); openVerseVideosDirect(vidBtn.getAttribute("data-bx-verse-videos") || ref); });
    }
    const scanKey = `${verseMediaRevision}|${ref}`;
    if (imgBtn.dataset.bxVerseSavedScan === scanKey) return;
    imgBtn.dataset.bxVerseSavedScan = scanKey;
    bxMediaIdxEnsure(() => {
      const ok = bxMediaVerseOk(ref);
      if (imgBtn && imgBtn.isConnected) imgBtn.classList.toggle("is-available", ok.img);
      if (vidBtn && vidBtn.isConnected) vidBtn.classList.toggle("is-available", ok.vid);
    });
  }

  function injectVerseTriggers() {
    $$(".lmx-bible-v3-tools").forEach((tools) => {
      const verse = tools.closest(".lmx-bible-v3-verse, [data-bx-v3-verse]");
      if (!verse) return;
      let button = tools.querySelector("[data-bx-immersion]");
      if (!button) { button = document.createElement("button"); button.type = "button"; button.className = "bx-immersion-trigger"; button.dataset.bxImmersion = "1"; button.dataset.ref = verse.getAttribute("data-ref") || ""; button.textContent = "🕶 Entrar na história"; button.setAttribute("aria-label", `Entrar na história de ${button.dataset.ref || "este versículo"}`); const plus = tools.querySelector("[data-bx-verse-more], .lmx-bible-v3-more"); if (plus) plus.before(button); else tools.appendChild(button); }
      ensureVerseAiButtons(tools, verse);
    });
  }

  /* 5.4.247 — barra de miniaturas INLINE por versículo REMOVIDA (desempenho:
     injetava imagem em resolução cheia para o capítulo inteiro de uma vez e
     travava o fio principal). O botão "🖼 Imagem da passagem" ([data-bx-verse-images],
     no .lmx-bible-v3-tools) mantém o acesso à galeria. */

  function injectNavTrigger() {
    const nav = $(".bible-x-nav");
    if (!nav || nav.querySelector("[data-bx-immersion-nav]")) return;
    const reader = nav.querySelector("[data-bible-section='reader']");
    const button = document.createElement("button");
    button.type = "button";
    button.className = "bx-immersion-nav-link";
    button.dataset.bxImmersionNav = "1";
    button.innerHTML = "<i>🕶</i><span><b>Bíblia Viva</b><small>Entrar na história</small></span>";
    button.addEventListener("click", () => {
      const payload = versePayload($(".lmx-bible-v3-verse[data-ref], [data-bx-v3-verse][data-ref]") || button);
      open(payload.ref, payload.text, button);
    });
    if (reader && reader.parentNode) reader.parentNode.insertBefore(button, reader.nextSibling);
    else nav.appendChild(button);
  }

  function injectCatalogTrigger() {
    const nav = $(".bible-x-nav");
    if (!nav || nav.querySelector("[data-bx-immersion-catalog]")) return;
    const button = document.createElement("button");
    button.type = "button";
    button.className = "bx-immersion-catalog-nav-link";
    button.dataset.bxImmersionCatalog = "1";
    button.innerHTML = "<i>✦</i><span><b>Explorar cenas</b><small>Catálogo Bíblia Viva</small></span>";
    const immersion = nav.querySelector("[data-bx-immersion-nav]");
    if (immersion && immersion.parentNode) immersion.parentNode.insertBefore(button, immersion.nextSibling);
    else nav.appendChild(button);
  }

  function injectAll() {
    injectVerseTriggers();
    injectVerseAiDock();
    injectNavTrigger();
    injectCatalogTrigger();
  }

  /* O controlador global da Bíblia X também observa o texto “Tela cheia”.
     A prioridade no window garante que os botões do modal Bíblia Viva não sejam
     redirecionados para a tela cheia da página da Bíblia. */
  function onImmersionPriorityClick(event) {
    if (!modal?.classList.contains("is-open")) return;
    const action = event.target.closest?.("#bxImmersionModal .bx-immersion-dialog [data-imm-action]");
    if (!action) return;
    const name = action.dataset.immAction;
    if (name !== "fullscreen" && name !== "share") return;
    event.preventDefault();
    event.stopImmediatePropagation();
    if (name === "fullscreen") toggleFullscreen();
    else shareStory();
  }

  function onVerseAiPriorityClick(event) {
    const ai = event.target.closest?.("[data-bx-verse-ai]");
    if (!ai) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    dismissLegacyVerseContext();
    openAiMedia({ ...verseAiContext(ai), kind: ai.dataset.bxVerseAi || "image" });
  }
  /* 5.4.244 — Os botoes salvos por verso ([data-bx-verse-images] /
     [data-bx-verse-videos]) vivem DENTRO de .lmx-bible-v3-tools, regiao onde um
     interceptor antigo no window (stopPropagation em captura) impede o evento de
     descer ate document/target. Este listener no MESMO node (window) roda depois
     do interceptor (stopPropagation nao bloqueia o mesmo node) e abre o viewer
     direto, como pedido: imagem -> galeria da biblioteca, video -> player. */
  function onVerseSavedDirectClick(event) {
    const imgHit = event.target.closest?.("[data-bx-verse-images]");
    if (imgHit) { event.preventDefault(); event.stopImmediatePropagation(); openVerseImagesDirect(imgHit.dataset.bxVerseImages || ""); return; }
    const vidHit = event.target.closest?.("[data-bx-verse-videos]");
    if (vidHit) { event.preventDefault(); event.stopImmediatePropagation(); openVerseVideosDirect(vidHit.dataset.bxVerseVideos || ""); return; }
  }


  function closeQuickGuideSafely(overlay) {
    if (!overlay) return false;
    /* 5.4.240 — o fallback do módulo também usa o fechador de emergência
       instalado no HTML. Assim, X/Entendi/Esc continuam funcionando mesmo
       se uma cascata antiga interromper os listeners do documento. */
    if (typeof window.__logosDismissQuickGuide === "function") {
      try {
        return !!window.__logosDismissQuickGuide(overlay);
      } catch (_) {}
    }
    try {
      const checkbox = overlay.querySelector(".bxq-never input");
      if (checkbox?.checked) {
        const area = overlay.__area;
        if (area) localStorage.setItem(`logosx:tip:${area}`, JSON.stringify("1"));
        if (area === "bible" || !area) localStorage.setItem("logosx:bxQuickGuideNever", JSON.stringify("1"));
      }
    } catch (_) {}
    if (window.__bxTipOpen && (!overlay.__area || window.__bxTipOpen === overlay.__area)) window.__bxTipOpen = null;
    overlay.setAttribute("aria-hidden", "true");
    overlay.hidden = true;
    overlay.style.pointerEvents = "none";
    if (overlay.parentNode) overlay.parentNode.removeChild(overlay);
    return true;
  }

  function onQuickGuidePriorityClick(event) {
    const overlay = event.target.closest?.(".bx-guide-overlay");
    if (!overlay) return;
    const closeButton = event.target.closest?.(".bxq-close, .bxq-ok");
    if (!closeButton && event.target !== overlay) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    closeQuickGuideSafely(overlay);
  }

  function onQuickGuidePriorityKeydown(event) {
    if (event.key !== "Escape") return;
    const overlay = $(".bx-guide-overlay:not([hidden])");
    if (!overlay) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    closeQuickGuideSafely(overlay);
  }

  function onDocumentClick(event) {
    const chapImgHit = event.target.closest?.("[data-bx-chapter-images]");
    if (chapImgHit) { event.preventDefault(); event.stopImmediatePropagation(); openChapterImagesDirect(chapImgHit.dataset.bxChap || chapterBaseOf($("#bRef")?.value || "")); return; }
    const chapVidHit = event.target.closest?.("[data-bx-chapter-videos]");
    if (chapVidHit) { event.preventDefault(); event.stopImmediatePropagation(); openChapterVideosDirect(chapVidHit.dataset.bxChap || chapterBaseOf($("#bRef")?.value || "")); return; }
    const imgHit = event.target.closest?.("[data-bx-verse-images]");
    if (imgHit) { event.preventDefault(); event.stopImmediatePropagation(); openVerseImagesDirect(imgHit.dataset.bxVerseImages || ""); return; }
    const vidHit = event.target.closest?.("[data-bx-verse-videos]");
    if (vidHit) { event.preventDefault(); event.stopImmediatePropagation(); openVerseVideosDirect(vidHit.dataset.bxVerseVideos || ""); return; }
    const savedMedia = event.target.closest?.("[data-bx-verse-media]");
    if (savedMedia) { event.preventDefault(); event.stopImmediatePropagation(); openVerseSavedMedia(savedMedia.dataset.bxVerseMedia || ""); return; }
    const ai = event.target.closest?.("[data-bx-verse-ai]");
    if (ai) { event.preventDefault(); event.stopImmediatePropagation(); dismissLegacyVerseContext(); openAiMedia({ ...verseAiContext(ai), kind: ai.dataset.bxVerseAi || "image" }); return; }
    const button = event.target.closest?.("[data-bx-immersion], [data-bx-immersion-nav], [data-bx-immersion-catalog]");
    if (!button) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    if (button.dataset.bxImmersionCatalog) {
      openCatalog(button);
      return;
    }
    if (button.dataset.bxImmersionNav) {
      const payload = versePayload($(".lmx-bible-v3-verse[data-ref], [data-bx-v3-verse][data-ref]") || button);
      open(payload.ref, payload.text, button);
      return;
    }
    const payload = versePayload(button);
    open(payload.ref, payload.text, button);
  }

  function onKeydown(event) {
    const immersionOpen = !!modal?.classList.contains("is-open");
    const catalogOpen = !!catalogModal?.classList.contains("is-open");
    if (!immersionOpen && !catalogOpen) return;
    if (catalogOpen && !immersionOpen) {
      if (event.key === "Escape") {
        event.preventDefault();
        closeCatalog();
        return;
      }
      if (event.key === "/") {
        event.preventDefault();
        $("[data-imm-catalog-search]", catalogModal)?.focus();
      }
      if (event.key === "Tab") {
        const focusables = $$(`button:not([disabled]), a[href], input:not([disabled]), textarea:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])`, catalogModal)
          .filter((element) => element.getClientRects().length > 0 && element.getAttribute("aria-hidden") !== "true");
        if (!focusables.length) return;
        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
      }
      return;
    }
    if (event.key === "Escape") {
      event.preventDefault();
      close();
      return;
    }
    if (event.key === "Tab") {
      const focusables = $$(`button:not([disabled]), a[href], input:not([disabled]), textarea:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])`, modal)
        .filter((element) => element.getClientRects().length > 0 && element.getAttribute("aria-hidden") !== "true");
      if (!focusables.length) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
      return;
    }
    if (event.target && /input|textarea|select/i.test(event.target.tagName)) return;
    if (event.key === "?") {
      event.preventDefault();
      toggleShortcuts();
      return;
    }
    if (event.key.toLowerCase() === "p") {
      event.preventDefault();
      toggleTour();
      return;
    }
    if (event.key.toLowerCase() === "a") {
      event.preventDefault();
      togglePresentation();
      return;
    }
    if (event.key === "ArrowRight" || event.key === "ArrowLeft") {
      cycleEvent(event.key === "ArrowRight" ? 1 : -1, "scene");
    }
    if (event.key === "Home" || event.key === "End") {
      event.preventDefault();
      state.activeEvent = event.key === "Home" ? 0 : Math.max(0, (state.scene?.events?.length || 1) - 1);
      state.activeTab = "scene";
      saveProgress();
      renderAll();
      focusActiveEvent();
    }
    if (event.key === " ") {
      event.preventDefault();
      toggleSpeech();
    }
  }

  function init() {
    loadScenes().then(() => setTimeout(openFromHash, 120));
    injectAll();
    /* 5.4.240 — agenda uma única injeção por janela de eventos. Isso evita
       várias leituras simultâneas do IndexedDB durante a remontagem do leitor
       e não observa o body inteiro (o que podia travar a aba). */
    let injectTimer = 0;
    const scheduleInjectAll = (delay = 40) => {
      if (injectTimer) return;
      injectTimer = window.setTimeout(() => {
        injectTimer = 0;
        try { injectAll(); } catch (_) { }
      }, delay);
    };
    document.addEventListener("click", onDocumentClick, true);
    document.addEventListener("keydown", onKeydown);
    document.addEventListener("biblex:pagechange", () => scheduleInjectAll(30));
    document.addEventListener("biblex:media-changed", () => { verseMediaRevision += 1; scheduleInjectAll(80); });
    /* 5.4.242 — rede de segurança para a remontagem do leitor. O app dispara
       biblex:pagechange antes de os versos existirem no DOM em alguns fluxos
       (ex.: abrir capítulo por #bOpen/bRef), então a injeção per-verso nunca
       rodava depois que a lista era montada. Observamos só ADIÇÕES de
       versos/linhas de ferramentas e re-agendamos. Diferente do observador
       removido no 5.4.240, isto é seguro: (1) o filtro ignora os próprios
       botões/dock que injetamos (não são .lmx-bible-v3-tools nem versos),
       então não há ciclo; (2) injectAll é idempotente e só lê o IndexedDB
       quando ref/revisão muda (scanKey), então não há leitura repetida. */
    const verseMountSel = ".lmx-bible-v3-verse[data-ref], .lmx-bible-v3-tools, [data-bx-v3-verse][data-ref]";
    const armVerseObserver = () => {
      if (window.__bxImmersionVerseObserver) window.__bxImmersionVerseObserver.disconnect();
      const observer = new MutationObserver((records) => {
        for (const record of records) {
          for (const node of record.addedNodes) {
            if (node.nodeType !== 1) continue;
            if (node.matches?.(verseMountSel) || node.querySelector?.(verseMountSel)) { scheduleInjectAll(40); return; }
          }
        }
      });
      observer.observe(document.body, { childList: true, subtree: true });
      window.__bxImmersionVerseObserver = observer;
    };
    armVerseObserver();
    window.addEventListener("hashchange", openFromHash);
    const syncImmersionFullscreen = () => {
      const dialog = $(".bx-immersion-dialog", modal);
      const active = Boolean(dialog && fullscreenElement() === dialog);
      setImmersionFullscreenUi(active);
      syncQuadrantFullscreenUI();
      const catalogDialog = $(".bx-immersion-catalog-dialog", catalogModal);
      if (catalogDialog && fullscreenElement() !== catalogDialog) {
        catalogDialog.removeAttribute("data-bx-catalog-fallback");
        catalogDialog.classList.remove("bx-immersion-catalog-fullscreen");
      }
      if (!active) restoreSharePopupPortal();
    };
    window.addEventListener("click", onVerseAiPriorityClick, true);
    window.addEventListener("pointerup", onQuickGuidePriorityClick, true);
    window.addEventListener("click", onQuickGuidePriorityClick, true);
    window.addEventListener("keydown", onQuickGuidePriorityKeydown, true);
    window.addEventListener("click", onImmersionPriorityClick, true);
    window.addEventListener("click", onVerseSavedDirectClick, true);
    document.addEventListener("fullscreenchange", syncImmersionFullscreen);
    document.addEventListener("webkitfullscreenchange", syncImmersionFullscreen);
    window.addEventListener("beforeunload", () => { stopSpeech(); stopTour(); });
    window.addEventListener("pagehide", () => { stopSpeech(); stopTour(); });
    window.BibleXImmersion = { open, close, openCatalog, closeCatalog, toggleTour, togglePresentation, version: VERSION, loadScenes, getContext, getIntegrationModel, getMediaPlacementCandidates, isBibleReferenceOnly, getVisualQuery: fallbackVisualQuery };
    /* O leitor pode montar depois do DOMContentLoaded; faça poucas tentativas
       de aquecimento, sem deixar um observador permanente no body. */
    let warmup = 0;
    const warm = () => {
      scheduleInjectAll(0);
      warmup += 1;
      if (warmup < 6) window.setTimeout(warm, 500);
    };
    warm();
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init, { once: true });
  else init();
})();
