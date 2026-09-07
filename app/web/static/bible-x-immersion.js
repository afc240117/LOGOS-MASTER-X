/* Bíblia Viva — Modo Imersão | v5.4.207 */
(function () {
  "use strict";

  const VERSION = "5.4.207";
  const DATA_URL = "/static/immersion-scenes.json?v=" + VERSION;
  const state = {
    scenes: [],
    scene: null,
    ref: "",
    verseText: "",
    activeEvent: 0,
    activeTab: "scene",
    selectedPerson: "",
    currentNarrativeRef: "",
    visualItems: [],
    visualIndex: 0,
    visualLoading: false,
    visualMessage: "",
    lastFocus: null,
    speechActive: false
  };
  let modal = null;
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

  function createGenericScene(ref) {
    const cleanRef = String(ref || "Passagem selecionada").trim();
    return {
      id: "generic-" + norm(cleanRef).replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""),
      matches: [cleanRef],
      reference: cleanRef,
      title: "Entrar na história",
      subtitle: "Uma camada visual para ler, localizar e acompanhar a passagem",
      sceneClass: "generic",
      badge: "EXPLORAÇÃO CONTEXTUAL",
      place: {
        name: "Localização a investigar",
        query: cleanRef,
        description: "Quando houver dados de lugar para esta passagem, o Atlas X Vivo poderá aprofundar a localização."
      },
      certainty: "Cena editorial • não substitui a leitura do texto",
      mediaQuery: cleanRef,
      panoramaQuery: cleanRef,
      people: [],
      hotspots: [],
      events: [{ label: "Leitura guiada", ref: cleanRef, summary: "Use os painéis para relacionar o versículo a pessoas, lugares, tempo e mídia." }],
      route: []
    };
  }

  function loadScenes() {
    if (scenesPromise) return scenesPromise;
    scenesPromise = fetch(DATA_URL, { cache: "force-cache" })
      .then((response) => {
        if (!response.ok) throw new Error("Catálogo de cenas indisponível");
        return response.json();
      })
      .then((payload) => {
        state.scenes = Array.isArray(payload.scenes) ? payload.scenes : [];
        return state.scenes;
      })
      .catch((error) => {
        console.warn("Bíblia Viva: catálogo local indisponível", error);
        state.scenes = [];
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

  function readProgress(scene) {
    try {
      const value = JSON.parse(localStorage.getItem(progressKey(scene)) || "null");
      return value && Number.isFinite(Number(value.event)) ? value : null;
    } catch (_) {
      return null;
    }
  }

  function saveProgress() {
    if (!state.scene) return;
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
            <button type="button" class="bx-immersion-action-btn" data-imm-action="fullscreen">⛶ Tela cheia</button>
            <button type="button" class="bx-immersion-icon-btn" data-imm-close="1" aria-label="Fechar Modo Imersão">×</button>
          </div>
        </header>
        <nav class="bx-immersion-tabs" aria-label="Camadas da Bíblia Viva">
          <button type="button" class="bx-immersion-tab is-active" data-imm-tab="scene">◉ Cena</button>
          <button type="button" class="bx-immersion-tab" data-imm-tab="map">⌖ Mapa</button>
          <button type="button" class="bx-immersion-tab" data-imm-tab="people">♙ Personagens</button>
          <button type="button" class="bx-immersion-tab" data-imm-tab="timeline">◷ Linha do tempo</button>
          <button type="button" class="bx-immersion-tab" data-imm-tab="context">🧭 Contexto</button>
        </nav>
        <main class="bx-immersion-grid">
          <section class="bx-immersion-scene-panel">
            <div class="bx-immersion-stage" data-imm-stage></div>
            <p class="bx-immersion-stage-caption" data-imm-caption></p>
            <div class="bx-immersion-stage-actions">
              <button type="button" class="bx-immersion-action-btn is-primary" data-imm-action="speak">🔊 Ouvir a cena</button>
              <button type="button" class="bx-immersion-action-btn" data-imm-action="visual">🌄 Carregar imagens</button>
              <button type="button" class="bx-immersion-action-btn" data-imm-action="media">🖼 Mídia X</button>
              <button type="button" class="bx-immersion-action-btn" data-imm-action="panorama">◉ Buscar 360°</button>
              <button type="button" class="bx-immersion-action-btn" data-imm-action="atlas">🗺️ Abrir Atlas</button>
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
            <div class="bx-immersion-progress-box">
              <div class="bx-immersion-progress-head">
                <span class="bx-immersion-section-label">Percurso da passagem</span>
                <strong data-imm-progress-text>1/1 etapa</strong>
              </div>
              <div class="bx-immersion-progress-track"><span data-imm-progress-bar></span></div>
              <div class="bx-immersion-progress-controls">
                <button type="button" class="bx-immersion-action-btn" data-imm-action="prev">← Anterior</button>
                <div class="bx-immersion-progress-dots" data-imm-progress-dots></div>
                <button type="button" class="bx-immersion-action-btn" data-imm-action="next">Próxima →</button>
              </div>
              <p class="bx-immersion-progress-status" data-imm-progress-status>O progresso é salvo apenas neste dispositivo.</p>
            </div>
            <p class="bx-immersion-section-label">Sequência narrativa</p>
            <div class="bx-immersion-event-list" data-imm-events></div>
            <div class="bx-immersion-reading-actions">
              <button type="button" class="bx-immersion-action-btn" data-imm-action="reader">📖 Abrir esta etapa na Bíblia</button>
              <button type="button" class="bx-immersion-action-btn" data-imm-action="save">☆ Salvar percurso</button>
            </div>
          </section>
          <aside class="bx-immersion-context-panel">
            <p class="bx-immersion-section-label" data-imm-context-label>Contexto vivo</p>
            <div data-imm-detail></div>
          </aside>
        </main>
        <footer class="bx-immersion-footer">
          <span class="bx-immersion-source-note" data-imm-source-note></span>
          <div class="bx-immersion-footer-actions">
            <button type="button" class="bx-immersion-action-btn" data-imm-action="studio">🧬 Enviar ao Studio X</button>
            <button type="button" class="bx-immersion-action-btn is-primary" data-imm-close="1">Voltar à Bíblia</button>
          </div>
        </footer>
      </section>`;
    document.body.appendChild(modal);
    modal.addEventListener("click", handleModalClick);
    return modal;
  }

  function artElements(scene) {
    const type = scene.sceneClass;
    const light = '<span class="bx-immersion-glow-orb"></span><span class="bx-immersion-light-ray"></span><span class="bx-immersion-dust"></span>';
    if (type === "sicar") return `${light}<span class="bx-immersion-sun"></span><span class="bx-immersion-horizon"></span><span class="bx-immersion-ground"></span><span class="bx-immersion-well"></span>`;
    if (type === "jerico") return `${light}<span class="bx-immersion-sun"></span><span class="bx-immersion-horizon"></span><span class="bx-immersion-ground"></span><span class="bx-immersion-crowd"></span>`;
    if (type === "exodo") return `${light}<span class="bx-immersion-sun"></span><span class="bx-immersion-sea"></span><span class="bx-immersion-ground"></span>`;
    if (type === "malta") return `${light}<span class="bx-immersion-sun"></span><span class="bx-immersion-sea"></span><span class="bx-immersion-ground"></span><span class="bx-immersion-boat"></span>`;
    return `${light}<span class="bx-immersion-sun"></span><span class="bx-immersion-horizon"></span><span class="bx-immersion-ground"></span>`;
  }

  function renderStage() {
    const scene = state.scene || createGenericScene(state.ref);
    const event = selectedEvent();
    const visual = state.visualItems[state.visualIndex] || null;
    const visualUrl = visual?.thumb_url || visual?.original_url || "";
    const hotspots = (scene.hotspots || []).map((hotspot) => `
      <button type="button" class="bx-immersion-hotspot" data-imm-hotspot="${esc(hotspot.id)}" data-kind="${esc(hotspot.kind || "place")}" data-person="${esc(hotspot.person || "")}" data-event="${esc(hotspot.event == null ? "" : hotspot.event)}">${esc(hotspot.label)}</button>`).join("");
    $("[data-imm-stage]", modal).innerHTML = `
      <div class="bx-immersion-art bx-immersion-art-${safeClass(scene.sceneClass)} ${visualUrl ? "has-photo" : ""}">
        ${visualUrl ? `<img class="bx-immersion-stage-photo" src="${esc(visualUrl)}" alt="${esc(visual?.title || scene.title)}" loading="lazy"><span class="bx-immersion-photo-wash"></span>` : ""}
        ${artElements(scene)}
        <span class="bx-immersion-stage-label">${esc(scene.badge || "RECONSTRUÇÃO VISUAL")}</span>
        ${hotspots}
        ${state.visualItems.length > 1 ? `<div class="bx-immersion-visual-nav"><button type="button" data-imm-visual="prev" aria-label="Imagem anterior">‹</button><span>${state.visualIndex + 1}/${state.visualItems.length}</span><button type="button" data-imm-visual="next" aria-label="Próxima imagem">›</button></div>` : ""}
        <div class="bx-immersion-stage-copy"><small>${esc(scene.place?.name || "Contexto bíblico")}</small><strong>${esc(event.label || scene.title)}</strong>${visual ? `<em class="bx-immersion-photo-credit">${esc(visual.credit || visual.source || "Wikimedia Commons")} • ${esc(visual.license || "licença na fonte")}</em>` : ""}</div>
      </div>`;
    $("[data-imm-caption]", modal).textContent = state.visualLoading ? "Buscando imagens públicas com crédito e licença..." : state.visualMessage || event.summary || scene.subtitle || "Explore as camadas desta passagem.";
  }

  function renderEvents() {
    const events = Array.isArray(state.scene?.events) && state.scene.events.length ? state.scene.events : [{ label: "Leitura guiada", ref: state.ref, summary: "Explore os vínculos desta passagem." }];
    $("[data-imm-events]", modal).innerHTML = events.map((event, index) => `
      <button type="button" class="bx-immersion-event ${index === state.activeEvent ? "is-active" : ""}" data-imm-event="${index}">
        <span class="bx-immersion-event-index">${index + 1}</span>
        <span><strong>${esc(event.label || "Etapa")}</strong><small>${esc(event.ref || "")} ${event.summary ? "• " + esc(event.summary) : ""}</small>${event.focus ? `<em class="bx-immersion-event-focus">Foco: ${esc(event.focus)}</em>` : ""}</span>
      </button>`).join("");
  }

  function renderProgress() {
    const events = Array.isArray(state.scene?.events) && state.scene.events.length ? state.scene.events : [{ label: "Leitura guiada" }];
    const total = events.length;
    const current = state.activeEvent + 1;
    const percent = total <= 1 ? 100 : Math.round((state.activeEvent / (total - 1)) * 100);
    $("[data-imm-progress-text]", modal).textContent = `${current}/${total} ${total === 1 ? "etapa" : "etapas"}`;
    $("[data-imm-progress-bar]", modal).style.width = `${Math.max(8, percent)}%`;
    $("[data-imm-progress-dots]", modal).innerHTML = events.map((event, index) => `<button type="button" class="bx-immersion-progress-dot ${index === state.activeEvent ? "is-active" : ""}" data-imm-progress-event="${index}" aria-label="Ir para ${esc(event.label || `etapa ${index + 1}`)}"><span>${index + 1}</span></button>`).join("");
    const saved = readProgress(state.scene);
    const status = $("[data-imm-progress-status]", modal);
    if (status && saved && Number(saved.event) === state.activeEvent) status.textContent = "✓ Esta é a etapa salva neste dispositivo";
  }

  function detailScene() {
    const scene = state.scene;
    const event = selectedEvent();
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
      </div>`;
  }

  function detailContext() {
    const scene = state.scene || {};
    const notes = scene.culturalNotes || [];
    const objects = scene.objects || [];
    const questions = scene.questions || [];
    const sources = scene.sources || [];
    return `
      <div class="bx-immersion-context-card bx-immersion-context-intro">
        <strong>${esc(scene.theme || "Leitura em camadas")}</strong>
        <p>${esc(scene.historicalContext || "Este painel reúne informações editoriais para ampliar a leitura sem misturar reconstrução com certeza histórica.")}</p>
        ${scene.period ? `<div class="bx-immersion-place-chip"><span>${esc(scene.period)}</span></div>` : ""}
      </div>
      ${notes.length ? `<div class="bx-immersion-info-grid">${notes.map((note) => `<article class="bx-immersion-info-card"><strong>${esc(note.title)}</strong><p>${esc(note.text)}</p></article>`).join("")}</div>` : ""}
      ${objects.length ? `<div class="bx-immersion-context-card"><strong>Objetos para observar</strong><div class="bx-immersion-object-list">${objects.map((item) => `<div class="bx-immersion-object"><span>${esc(item.icon || "•")}</span><div><strong>${esc(item.name)}</strong><p>${esc(item.meaning)}</p></div></div>`).join("")}</div></div>` : ""}
      ${questions.length ? `<div class="bx-immersion-context-card"><strong>Perguntas para estudo</strong><ol class="bx-immersion-question-list">${questions.map((question) => `<li>${esc(question)}</li>`).join("")}</ol></div>` : ""}
      ${sources.length ? `<div class="bx-immersion-context-card"><strong>Camadas e fontes</strong><div class="bx-immersion-source-list">${sources.map((source) => `<div class="bx-immersion-source-row"><span>${esc(source.type || "Fonte")}</span><div><strong>${esc(source.label || "Registro")}</strong><small>${esc(source.value || "")}</small></div><em>${esc(source.certainty || "")}</em></div>`).join("")}</div></div>` : ""}
      <div class="bx-immersion-context-card bx-immersion-context-actions">
        <strong>Continuar o estudo</strong>
        <p>Abra os módulos completos mantendo a referência desta cena como ponto de partida.</p>
        <div class="bx-immersion-stage-actions">
          <button type="button" class="bx-immersion-action-btn" data-imm-action="context-module">🧭 Contexto X</button>
          <button type="button" class="bx-immersion-action-btn" data-imm-action="people-module">♙ Personagens X</button>
          <button type="button" class="bx-immersion-action-btn" data-imm-action="timeline-module">◷ Linha do Tempo X</button>
        </div>
      </div>`;
  }

  function detailMap() {
    const scene = state.scene;
    const route = scene.route || [];
    return `
      <div class="bx-immersion-context-card">
        <strong>Mapa de percurso</strong>
        <p>Os pontos abaixo são atalhos para o Atlas X Vivo. A linha resume o movimento narrativo; não pretende resolver debates de localização.</p>
        <div class="bx-immersion-map-route">${route.length ? route.map((stop) => `<button type="button" class="bx-immersion-route" data-imm-route="${esc(stop.query || stop.label)}">${esc(stop.label)}</button>`).join("") : `<span class="bx-immersion-empty">Nenhuma rota editorial cadastrada para esta referência.</span>`}</div>
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
      </div>
      <div class="bx-immersion-person-list">${people.length ? people.map((person) => `<button type="button" class="bx-immersion-person" data-imm-person="${esc(person.id)}"><strong>${esc(person.name)}</strong><small>${esc(person.role || "Personagem relacionado")}</small>${selected && selected.id === person.id ? `<p class="bx-immersion-person-detail">${esc(person.description || "")}</p>` : ""}</button>`).join("") : `<p class="bx-immersion-empty">Nenhum personagem estruturado para esta passagem ainda.</p>`}</div>`;
  }

  function detailTimeline() {
    const events = state.scene.events || [];
    return `
      <div class="bx-immersion-context-card">
        <strong>Sequência da passagem</strong>
        <p>Cada etapa é uma âncora editorial para voltar ao texto e expandir o estudo no módulo correspondente.</p>
      </div>
      <div class="bx-immersion-person-list">${events.map((event, index) => `<button type="button" class="bx-immersion-person" data-imm-event="${index}"><strong>${index + 1}. ${esc(event.label || "Etapa")}</strong><small>${esc(event.ref || "")}</small><p class="bx-immersion-person-detail">${esc(event.summary || "")}</p></button>`).join("")}</div>`;
  }

  function renderContext() {
    const labels = { scene: "Contexto vivo", map: "Mapa vivo", people: "Personagens em cena", timeline: "Linha narrativa", context: "Contexto histórico e cultural" };
    $("[data-imm-context-label]", modal).textContent = labels[state.activeTab] || labels.scene;
    const content = state.activeTab === "map" ? detailMap() : state.activeTab === "people" ? detailPeople() : state.activeTab === "timeline" ? detailTimeline() : state.activeTab === "context" ? detailContext() : detailScene();
    $("[data-imm-detail]", modal).innerHTML = content;
    $$("[data-imm-tab]", modal).forEach((tab) => tab.classList.toggle("is-active", tab.dataset.immTab === state.activeTab));
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
    renderProgress();
    renderEvents();
    renderContext();
    $("[data-imm-source-note]", modal).textContent = `Texto em foco: ${state.ref || state.scene.reference}. Cena editorial conectada ao Atlas X Vivo; confirme no texto, nas fontes e na legenda de certeza antes de tratar uma reconstrução como fato.`;
    const speak = $("[data-imm-action='speak']", modal);
    if (speak) speak.textContent = state.speechActive ? "⏹ Parar leitura" : "🔊 Ouvir a cena";
  }

  function open(ref, text, trigger) {
    state.lastFocus = trigger || document.activeElement;
    state.ref = String(ref || referenceFromInput() || "Passagem selecionada").trim();
    state.verseText = String(text || "").trim();
    state.scene = findScene(state.ref);
    const mappedEvent = eventForReference(state.ref, state.scene);
    const saved = readProgress(state.scene);
    state.activeEvent = mappedEvent == null ? Number(saved?.event || 0) : mappedEvent;
    state.activeTab = "scene";
    state.selectedPerson = "";
    state.currentNarrativeRef = "";
    state.visualItems = [];
    state.visualIndex = 0;
    state.visualLoading = false;
    state.visualMessage = "";
    ensureModal();
    renderAll();
    modal.classList.add("is-open");
    modal.setAttribute("aria-hidden", "false");
    document.body.classList.add("bx-immersion-lock");
    setTimeout(() => $("[data-imm-close]", modal)?.focus(), 30);
  }

  function close() {
    stopSpeech();
    if (!modal) return;
    if (document.fullscreenElement === $(".bx-immersion-dialog", modal)) document.exitFullscreen?.().catch(() => {});
    $(".bx-immersion-dialog", modal)?.classList.remove("bx-immersion-fullscreen");
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
    const query = scene.mediaQuery || scene.place?.name || state.ref;
    state.visualLoading = true;
    state.visualMessage = "";
    renderStage();
    try {
      const params = new URLSearchParams({ q: query, kind: "image", limit: "6" });
      const response = await fetch(`/api/bible/media/public/search?${params.toString()}`, { cache: "no-store" });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload.detail || "Fonte visual pública indisponível.");
      state.visualItems = Array.isArray(payload.items) ? payload.items : [];
      state.visualIndex = 0;
      state.visualMessage = state.visualItems.length
        ? "Imagem pública carregada; confira crédito e licença na fonte."
        : "Nenhuma imagem pública encontrada. A cena editorial continua disponível.";
    } catch (error) {
      state.visualItems = [];
      state.visualIndex = 0;
      state.visualMessage = "A galeria pública precisa de internet; a reconstrução visual local continua disponível.";
      console.warn("Bíblia Viva: mídia pública indisponível", error);
    } finally {
      state.visualLoading = false;
      renderStage();
    }
  }

  function cycleVisual(step) {
    if (!state.visualItems.length) return;
    state.visualIndex = (state.visualIndex + step + state.visualItems.length) % state.visualItems.length;
    renderStage();
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

  function openMedia(panorama) {
    const scene = state.scene;
    close();
    openSection("media");
    setTimeout(() => {
      if (panorama) {
        setValue(["#bxMediaPublicQuery", "#bxMediaQuery"], scene.panoramaQuery || scene.mediaQuery || state.ref);
        $("#bxMediaPublic360, [data-bx-media-public-360]")?.click();
      } else {
        setValue(["#bxMediaQuery", "#bxMediaPublicQuery"], scene.mediaQuery || state.ref);
        $("#bxMediaFind, #bxMediaPublicFind, [data-bx-media-find]")?.click();
      }
    }, 160);
  }

  function openAtlas(query) {
    const scene = state.scene;
    close();
    if (window.AtlasXVivo && typeof window.AtlasXVivo.open === "function") {
      window.AtlasXVivo.open(query || scene.place?.query || scene.place?.name || state.ref);
      return;
    }
    openSection("maps");
    setTimeout(() => {
      setValue(["#bxMapQuery", "#bxAtlasQuery"], query || scene.place?.query || state.ref);
      $("#bxMapFind, #bxAtlasFind")?.click();
    }, 160);
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
        selectedEvent: selectedEvent()
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
        notes: `Bíblia Viva — Modo Imersão\n${scene.title}\n${scene.place?.name || ""}\n\n${selectedEvent().summary || ""}`
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

  function toggleFullscreen() {
    const dialog = $(".bx-immersion-dialog", modal);
    if (!dialog) return;
    if (document.fullscreenElement === dialog) {
      document.exitFullscreen?.().catch(() => {});
      return;
    }
    if (typeof dialog.requestFullscreen === "function") {
      dialog.requestFullscreen().catch(() => dialog.classList.toggle("bx-immersion-fullscreen"));
    } else {
      dialog.classList.toggle("bx-immersion-fullscreen");
    }
  }

  function handleModalClick(event) {
    const target = event.target;
    if (target.closest("[data-imm-close]")) {
      event.preventDefault();
      close();
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
      return;
    }
    const eventButton = target.closest("[data-imm-event]");
    if (eventButton) {
      state.activeEvent = Number(eventButton.dataset.immEvent) || 0;
      state.activeTab = "timeline";
      saveProgress();
      renderAll();
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
    const visualNav = target.closest("[data-imm-visual]");
    if (visualNav) {
      cycleVisual(visualNav.dataset.immVisual === "next" ? 1 : -1);
      return;
    }
    const action = target.closest("[data-imm-action]");
    if (!action) return;
    const name = action.dataset.immAction;
    if (name === "speak") toggleSpeech();
    else if (name === "prev") cycleEvent(-1, "scene");
    else if (name === "next") cycleEvent(1, "scene");
    else if (name === "save") { saveProgress(); renderProgress(); }
    else if (name === "reader") openReader();
    else if (name === "context-module") openStudyModule("context", ["#bxContextQuery"], ["#bxContextFind"]);
    else if (name === "people-module") openStudyModule("people", ["#bxPeopleQuery"], ["#bxPeopleFind"]);
    else if (name === "timeline-module") openStudyModule("timeline", ["#bxTimelineQuery"], ["#bxTimelineFind"]);
    else if (name === "visual") loadVisuals();
    else if (name === "media") openMedia(false);
    else if (name === "panorama") openMedia(true);
    else if (name === "atlas") openAtlas();
    else if (name === "studio") sendToStudio();
    else if (name === "fullscreen") toggleFullscreen();
  }

  function injectVerseTriggers() {
    $$(".lmx-bible-v3-tools").forEach((tools) => {
      if (tools.querySelector("[data-bx-immersion]")) return;
      const verse = tools.closest(".lmx-bible-v3-verse, [data-bx-v3-verse]");
      if (!verse) return;
      const button = document.createElement("button");
      button.type = "button";
      button.className = "bx-immersion-trigger";
      button.dataset.bxImmersion = "1";
      button.dataset.ref = verse.getAttribute("data-ref") || "";
      button.textContent = "🕶 Entrar na história";
      button.setAttribute("aria-label", `Entrar na história de ${button.dataset.ref || "este versículo"}`);
      const plus = tools.querySelector("[data-bx-verse-more], .lmx-bible-v3-more");
      if (plus) plus.before(button); else tools.appendChild(button);
    });
  }

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

  function injectAll() {
    injectVerseTriggers();
    injectNavTrigger();
  }

  function onDocumentClick(event) {
    const button = event.target.closest?.("[data-bx-immersion], [data-bx-immersion-nav]");
    if (!button) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    if (button.dataset.bxImmersionNav) {
      const payload = versePayload($(".lmx-bible-v3-verse[data-ref], [data-bx-v3-verse][data-ref]") || button);
      open(payload.ref, payload.text, button);
      return;
    }
    const payload = versePayload(button);
    open(payload.ref, payload.text, button);
  }

  function onKeydown(event) {
    if (!modal || !modal.classList.contains("is-open")) return;
    if (event.key === "Escape") {
      event.preventDefault();
      close();
      return;
    }
    if (event.target && /input|textarea|select/i.test(event.target.tagName)) return;
    if (event.key === "ArrowRight" || event.key === "ArrowLeft") {
      cycleEvent(event.key === "ArrowRight" ? 1 : -1, "scene");
    }
    if (event.key === " ") {
      event.preventDefault();
      toggleSpeech();
    }
  }

  function init() {
    loadScenes();
    injectAll();
    document.addEventListener("click", onDocumentClick, true);
    document.addEventListener("keydown", onKeydown);
    document.addEventListener("biblex:pagechange", () => setTimeout(injectAll, 30));
    const observer = new MutationObserver(() => injectAll());
    observer.observe(document.body, { childList: true, subtree: true });
    window.addEventListener("beforeunload", stopSpeech);
    window.BibleXImmersion = { open, close, version: VERSION, loadScenes };
    setTimeout(injectAll, 500);
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init, { once: true });
  else init();
})();
