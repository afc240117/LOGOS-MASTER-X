(function () {
  "use strict";

  const state = { lastRef: "", lastTranslation: "", request: 0, observer: null };
  const $ = (selector, root = document) => root.querySelector(selector);
  const esc = (value) => String(value == null ? "" : value).replace(/[&<>"']/g, (char) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;",
  }[char]));
  const text = (value, fallback = "") => String(value == null || value === "" ? fallback : value);
  const array = (value) => Array.isArray(value) ? value : [];
  const currentTranslation = () => $("#bVersion")?.value || "porbr2018";

  function currentReference() {
    const verse = $("#bOut [data-bx-v3-verse][data-ref]") || $("#bOut [data-ref]");
    return verse?.getAttribute("data-ref") || $("#bRef")?.value || "";
  }

  /* 5.4.38 — BÍBLIA VIVA abre dentro do popup do versículo (#bxVcBody), não mais
     embutida no fim da leitura. */
  function mount() {
    const body = $("#bxVcBody");
    if (!body || $("#bxLiveExplorer")) return;
    const panel = document.createElement("section");
    panel.id = "bxLiveExplorer";
    panel.className = "bx-live-explorer";
    panel.setAttribute("aria-live", "polite");
    panel.innerHTML = '<div class="bx-live-loading">Preparando a exploração contextual desta passagem…</div>';
    body.appendChild(panel);
  }

  function metric(label, value) {
    return `<span class="bx-live-metric"><b>${esc(value)}</b><small>${esc(label)}</small></span>`;
  }

  function card(title, icon, content, action = "") {
    return `<article class="bx-live-card"><header><span class="bx-live-card-icon">${icon}</span><div><h4>${esc(title)}</h4><small>${action}</small></div></header>${content}</article>`;
  }

  function button(label, attrs = "", kind = "secondary") {
    return `<button type="button" class="btn ${kind}" ${attrs}>${label}</button>`;
  }

  function render(data, ref) {
    const panel = $("#bxLiveExplorer");
    if (!panel) return;
    const counts = data.counts || {};
    const reference = data.reference || {};
    const passage = data.passage || {};
    const themes = array(data.themes);
    const words = array(data.words);
    const crossrefs = array(data.crossrefs);
    const maps = array(data.maps);
    const comments = array(data.comments);
    const profile = data.context?.profile || {};
    const mapQuery = text(data.media?.query, reference.canonical || ref);
    const themeHtml = themes.length
      ? `<div class="bx-live-chip-list">${themes.slice(0, 10).map((item) => {
        const name = text(item.topic, "Tema bíblico");
        return `<button type="button" class="bx-live-chip" data-live-go="cross" data-live-query="${esc(name)}">🏷 ${esc(name)}</button>`;
      }).join("")}</div><small class="bx-live-note">Índice Nave + perfil editorial do livro</small>`
      : '<p class="bx-live-empty">Nenhum tema indexado para este versículo ainda.</p>';
    const wordHtml = words.length
      ? `<div class="bx-live-word-list">${words.slice(0, 8).map((item) => `<button type="button" class="bx-live-word" data-live-go="strong" data-live-query="${esc(item.strong || item.lemma || item.surface)}"><b>${esc(item.strong || "—")}</b><span>${esc(item.surface || item.lemma || "forma original")}</span><small>${esc(item.transliteration || item.definition || "Abrir ficha lexical")}</small></button>`).join("")}</div>`
      : '<p class="bx-live-empty">O banco de palavras ainda não possui marcação para esta tradução.</p>';
    const refsHtml = crossrefs.length
      ? `<div class="bx-live-ref-list">${crossrefs.slice(0, 8).map((item) => `<button type="button" class="bx-live-ref" data-live-open-ref="${esc(item.reference)}"><b>${esc(item.reference)}</b><small>${esc(item.anchor || item.source || "Referência cruzada")}</small></button>`).join("")}</div>`
      : '<p class="bx-live-empty">Nenhuma referência cruzada disponível para este ponto.</p>';
    const mapHtml = maps.length
      ? `<div class="bx-live-map-list">${maps.slice(0, 6).map((item) => `<button type="button" class="bx-live-map" data-live-go="maps" data-live-query="${esc(item.name)}"><span>📍</span><b>${esc(item.name)}</b><small>Buscar no Atlas X</small></button>`).join("")}</div>`
      : `<p class="bx-live-empty">O perfil deste livro não trouxe lugares nomeados. <button type="button" class="bx-live-inline" data-live-go="maps" data-live-query="${esc(reference.canonical || ref)}">Explorar no Atlas X</button></p>`;
    const commentHtml = comments.length
      ? `<div class="bx-live-comment-list">${comments.slice(0, 3).map((item) => `<button type="button" class="bx-live-comment" data-live-go="comments" data-live-query="${esc(item.reference || reference.canonical)}"><b>${esc(item.title || "Comentário clássico")}</b><small>${esc(item.authorLabel || item.sourceLabel || "Fonte em cache")}</small><span>${esc(text(item.content, "").slice(0, 150))}${text(item.content).length > 150 ? "…" : ""}</span></button>`).join("")}</div>`
      : '<p class="bx-live-empty">Nenhum comentário em cache cobre este versículo. Consulte as fontes do módulo.</p>';

    panel.innerHTML = `
      <div class="bx-live-head">
        <div><span class="bx-live-eyebrow">BÍBLIA VIVA • EXPLORAÇÃO CONTEXTUAL</span><h3>${esc(reference.canonical || ref)}</h3><p>${esc(text(passage.text, "Texto da passagem"))}</p></div>
        <div class="bx-live-head-actions">${button("↻ Atualizar", 'data-live-retry', "secondary")}${button("× Recolher", 'data-live-collapse', "secondary")}</div>
      </div>
      <div class="bx-live-metrics">${metric("temas", counts.themes || 0)}${metric("palavras", counts.words || 0)}${metric("referências", counts.crossrefs || 0)}${metric("lugares", counts.maps || 0)}${metric("comentários", counts.comments || 0)}${metric("fontes", counts.sources || 0)}</div>
      <div class="bx-live-grid">
        ${card("Temas e cadeias", "🏷", themeHtml, "Nave • perfil editorial")}
        ${card("Palavras originais", "🔤", wordHtml, "Strong • léxico local")}
        ${card("Referências cruzadas", "🔗", refsHtml, "TSK • conexões bíblicas")}
        ${card("Contexto do livro", "🧭", `<p class="bx-live-profile">${esc(text(profile.purpose || profile.historical || profile.genre, "Perfil histórico, literário e cultural disponível no Contexto X."))}</p><div class="bx-live-actions">${button("Abrir contexto", 'data-live-go="context" data-live-query="' + esc(reference.canonical || ref) + '"', "primary")}${button("Abrir dossiê", 'data-live-go="dossier" data-live-query="' + esc(reference.canonical || ref) + '"', "secondary")}</div>`, "perfil • estrutura • fonte histórica")}
        ${card("Mapas e lugares", "🗺", mapHtml, "Atlas local • rotas futuras")}
        ${card("Mídia sob demanda", "🎥", `<p class="bx-live-profile">${esc(text(data.media?.note, "Busca pública com crédito e licença preservados."))}</p><div class="bx-live-actions">${button("Abrir Mídia X", 'data-live-go="media" data-live-query="' + esc(mapQuery) + '"', "secondary")}${button("Buscar imagem pública", 'data-live-action="media-search" data-live-query="' + esc(mapQuery) + '"', "primary")}</div>`, "Wikimedia Commons • ação consciente")}
        ${card("Comentários e leitura", "💬", commentHtml, "cache local • sem geração automática")}
        ${card("Próximos movimentos", "✨", `<div class="bx-live-next-list">${button("Pesquisa avançada", 'data-live-go="search" data-live-query="' + esc(reference.canonical || ref) + '"', "secondary")}${button("Pesquisa global", 'data-live-go="global" data-live-query="' + esc(reference.canonical || ref) + '"', "secondary")}${button("Enviar ao Studio X", 'data-live-go="dna" data-live-query="' + esc(reference.canonical || ref) + '"', "primary")}</div>`, "cada passagem vira um ponto de partida")}
      </div>
      <footer class="bx-live-foot"><span>● Local-first • ${data.local_first ? "fontes locais preservadas" : "modo integrado"}</span><span>${array(data.sources).filter((source) => source.network).length ? "Mídia pública somente quando solicitada" : "Sem consulta externa automática"}</span></footer>`;
    panel.dataset.reference = ref;
  }

  function renderError(message, ref) {
    const panel = $("#bxLiveExplorer");
    if (!panel) return;
    panel.innerHTML = `<div class="bx-live-error"><div><span>⚠️</span><h3>Exploração temporariamente indisponível</h3><p>${esc(message || "Não foi possível carregar as camadas locais.")}</p></div>${button("Tentar novamente", 'data-live-retry', "primary")}</div>`;
    panel.dataset.reference = ref || "";
  }

  async function load(ref = currentReference()) {
    mount();
    const translation = currentTranslation();
    if (!ref || ref === state.lastRef && translation === state.lastTranslation && $("#bxLiveExplorer")?.dataset.reference === ref) return;
    const panel = $("#bxLiveExplorer");
    if (!panel) return;
    state.lastRef = ref;
    state.lastTranslation = translation;
    const token = ++state.request;
    panel.dataset.reference = ref;
    panel.innerHTML = `<div class="bx-live-loading"><span class="bx-live-spinner">◌</span><div><b>Mapeando ${esc(ref)}</b><small>Temas, palavras, conexões, contexto e recursos locais…</small></div></div>`;
    try {
      const response = await fetch(`/api/bible/live?ref=${encodeURIComponent(ref)}&translation=${encodeURIComponent(translation)}`, { headers: { Accept: "application/json" } });
      const data = await response.json();
      if (!response.ok) throw new Error(data.detail || "A API da Bíblia Viva respondeu com erro.");
      if (token !== state.request) return;
      render(data, ref);
    } catch (error) {
      if (token !== state.request) return;
      renderError(error.message, ref);
    }
  }

  function openPanel(id, query) {
    const nav = document.querySelector(`.bible-x-nav [data-bible-section="${id}"]`);
    nav?.click();
    const fields = { cross: "#bxCrossSource", strong: "#bxStrongQuery", context: "#bxContextQuery", comments: "#bxCommentsQuery", maps: "#bxMapQuery", media: "#bxMediaQuery", search: "#bxSearchXQuery", global: "#bxGlobalQuery", dossier: "#bxDossierRef", dna: "#bxDnaRef" };
    const field = $(fields[id]);
    if (field && query) field.value = query;
    setTimeout(() => {
      const actions = { cross: "#bxCrossLoad", strong: "#bxStrongFind", context: "#bxContextFind", comments: "#bxCommentsFind", maps: "#bxMapFind", search: "#bxSearchXFind", global: "#bxGlobalFind", dossier: "#bxDossierBuild", dna: "#bxDnaLoad" };
      if (id !== "media") $(actions[id])?.click();
      field?.focus?.();
    }, 80);
  }

  function openReference(ref) {
    const input = $("#bRef");
    if (input) input.value = ref;
    $("#bOpen")?.click();
  }

  function onPanelClick(event) {
    const target = event.target.closest("button");
    if (!target) return;
    if (target.hasAttribute("data-live-collapse")) {
      $("#bxLiveExplorer")?.classList.toggle("is-collapsed");
      target.textContent = $("#bxLiveExplorer")?.classList.contains("is-collapsed") ? "＋ Expandir" : "× Recolher";
      return;
    }
    if (target.hasAttribute("data-live-retry")) { state.lastRef = ""; state.lastTranslation = ""; load(currentReference()); return; }
    if (target.hasAttribute("data-live-open-ref")) { openReference(target.dataset.liveOpenRef); return; }
    if (target.dataset.liveAction === "media-search") {
      openPanel("media", target.dataset.liveQuery || currentReference());
      const query = target.dataset.liveQuery || currentReference();
      if ($("#bxMediaPublicQuery")) $("#bxMediaPublicQuery").value = query;
      setTimeout(() => $("#bxMediaPublicFind")?.click(), 120);
      return;
    }
    if (target.dataset.liveGo) openPanel(target.dataset.liveGo, target.dataset.liveQuery || currentReference());
  }

  function schedule() {
    mount();
    const ref = currentReference();
    if (!ref) return;
    window.clearTimeout(state.timer);
    state.timer = window.setTimeout(() => load(ref), 100);
  }

  function init() {
    document.addEventListener("click", (event) => {
      const panel = event.target.closest("#bxLiveExplorer");
      if (panel) onPanelClick(event);
    });
    /* 5.4.38 — gatilhos automáticos removidos (biblex:pagechange, MutationObserver e
       schedule inicial): o módulo não aparece mais na expansão da leitura. Ele abre
       sob demanda pelo botão "🪩 Bíblia Viva" do versículo, no popup com tela cheia,
       zoom e sair. */
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init, { once: true });
  else init();
  window.BibleXLiveExplorer = { load, refresh: schedule };
})();
