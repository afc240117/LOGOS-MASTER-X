(function () {
  "use strict";

  /* Camada visual dos atalhos do versículo.
     Os handlers existentes continuam sendo os donos de cada recurso; este
     arquivo apenas intercepta a abertura e fornece uma janela comum. */
  const VERSE_BUTTONS = ".lmx-bible-v3-tools button, .lmx-bible-v3-extra button, .bx-live-launcher";
  /* 5.4.110 — Estudo, Viagem e Studio X também abrem DIRETO (sem a ponte de
     pré-visualização que exigia um 2º clique). O Raio-X ([data-verse-tool]) já
     era direto. O usuário pediu: "o primeiro clique deve já abrir da forma
     correta, igual os outros foram arrumados". */
  const CORE_BUTTON = "[data-verse-tool], [data-verse-atlas], [data-verse-parallel], [data-verse-rayx], [data-verse-live], [data-lmx33='study'], [data-jr-ctx], [data-verse-studio], .bx-live-launcher";
  const state = { zoom: 1, trigger: null };

  const $ = (selector, root = document) => root?.querySelector?.(selector) || null;
  const esc = value => String(value == null ? "" : value).replace(/[&<>\"']/g, char => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;"
  }[char]));

  /* 5.4.69 — "visível" agora exige opacity ≠ 0. O app fecha a Jornada com
     opacity:0 + pointer-events:none (não usa hidden). Antes, o isVisible só
     olhava display/hidden, então um modal fechado era tratado como aberto e
     ganhava a classe bx-unified-modal — que força pointer-events:auto e
     display:grid, transformando o modal invisível num escudo de cliques. */
  const isVisible = element => {
    if (!element || element.hidden) return false;
    const cs = getComputedStyle(element);
    return cs.display !== "none" && cs.visibility !== "hidden" && cs.opacity !== "0";
  };
  const syncOverlayState = () => {
    const context = $("#bxVerseContext");
    const live = $("#bxLiveExplorer");
    const open = (isVisible(context) && context.classList.contains("bx-unified-modal")) ||
      (isVisible(live) && live.classList.contains("bx-unified-live-popup"));
    document.body.classList.toggle("bx-unified-modal-open", open);
  };
  const nativeFullscreenElement = () => document.fullscreenElement || document.webkitFullscreenElement || null;
  const resetFullscreenUi = modal => {
    if (!modal) return;
    modal.classList.remove("bx-popup-fullscreen");
    modal.querySelectorAll("[data-bx-popup-full]").forEach(full => {
      full.setAttribute("aria-pressed", "false");
      full.textContent = "⛶ Tela cheia";
    });
  };
  const settleOverlayState = () => {
    const run = () => {
      if (!nativeFullscreenElement()) document.querySelectorAll(".bx-popup-fullscreen").forEach(resetFullscreenUi);
      enhanceExistingModals();
      syncOverlayState();
    };
    if (typeof requestAnimationFrame === "function") requestAnimationFrame(run);
    else setTimeout(run, 0);
  };
  const verseFor = button => {
    const ref = button.dataset.ref || button.closest("[data-bx-v3-verse][data-ref]")?.dataset.ref || "Passagem atual";
    const row = button.closest("[data-bx-v3-verse]");
    const text = row?.querySelector(".lmx-bible-v3-textrow")?.textContent?.replace(/\s+/g, " ").trim() || "";
    return { ref, text };
  };
  const labelFor = button => button.textContent?.replace(/\s+/g, " ").trim() || "Recurso da passagem";

  function toolbar(modal, card, title = "Ferramenta da Bíblia X") {
    if (!modal || !card || [...card.children].some(child => child.classList?.contains("bx-popup-toolbar"))) return;
    card.classList.add("bx-unified-modal-card");
    const tools = document.createElement("div");
    tools.className = "bx-popup-toolbar";
    tools.dataset.bxZoom = "1";
    tools.innerHTML = `<span class="bx-popup-toolbar-title">${esc(title)}</span>
      <button type="button" data-bx-popup-zoom-out aria-label="Reduzir zoom">A−</button>
      <output data-bx-popup-zoom-value>100%</output>
      <button type="button" data-bx-popup-zoom-in aria-label="Aumentar zoom">A+</button>
      <button type="button" data-bx-popup-full aria-pressed="false">⛶ Tela cheia</button>`;
    const header = [...card.children].find(child => child.tagName === "HEADER") || card.firstElementChild;
    if (header) header.insertAdjacentElement("afterend", tools);
    else card.prepend(tools);
    /* 5.4.67 — os cliques dos controles NÃO usam listeners diretos nos botões:
       alguns modais do app param a propagação descendente (stopPropagation em
       captura), o que mataria o botão injetado. Os comandos são tratados por um
       delegado de captura no document (registrado em wireGlobalControls) que
       roda antes de qualquer parada. Aqui apenas define o estado inicial. */
    applyZoomTo(modal, tools, 1);
  }

  function ensureBridge() {
    let popup = $("#bxVerseToolPopup");
    if (popup) return popup;
    popup = document.createElement("div");
    popup.id = "bxVerseToolPopup";
    popup.className = "bx-verse-tool-popup";
    popup.hidden = true;
    /* 5.4.72 — sem barra de controles no popup-ponte: o recurso final
       (ex.: o Estudo) já tem seus próprios controles (A−/A+/⛶). O popup
       vira um card limpo: pré-visualização + Continuar. */
    popup.innerHTML = `<div class="bx-verse-tool-popup-card">
      <header><div><small>BÍBLIA X • RECURSO DA PASSAGEM</small><h3 data-bx-popup-title>Ferramenta</h3><p data-bx-popup-ref></p></div>
        <button type="button" data-bx-popup-close aria-label="Fechar">×</button></header>
      <main class="bx-verse-tool-popup-body" data-bx-popup-body></main></div>`;
    document.body.appendChild(popup);
    $("[data-bx-popup-close]", popup).addEventListener("click", () => close(popup));
    popup.addEventListener("click", event => { if (event.target === popup) close(popup); });
    return popup;
  }

  /* Aplica o zoom num toolbar específico (guarda o valor por toolbar em data-bx-zoom). */
  function applyZoomTo(modal, tools, value) {
    if (!modal || !tools) return;
    const zoom = Math.max(.8, Math.min(1.6, Number(value) || 1));
    tools.dataset.bxZoom = String(zoom);
    modal.style.setProperty("--bx-popup-zoom", String(zoom));
    const out = tools.querySelector("[data-bx-popup-zoom-value]");
    if (out) out.textContent = `${Math.round(zoom * 100)}%`;
  }

  /* Delegado de captura: os comandos da toolbar (A−/A+/⛶/×) são tratados aqui,
     na fase de captura do document, que roda antes de qualquer modal do app
     parar a propagação. Sem listeners diretos nos botões → sem clique duplo. */
  const wireGlobalControls = () => {
    if (wireGlobalControls.done) return;
    wireGlobalControls.done = true;
    document.addEventListener("click", event => {
      const el = event.target?.closest?.("[data-bx-popup-zoom-in], [data-bx-popup-zoom-out], [data-bx-popup-full], [data-bx-popup-close]");
      if (!el) return;
      const tools = el.closest(".bx-popup-toolbar");
      if (el.matches("[data-bx-popup-close]")) { close($("#bxVerseToolPopup")); return; }
      if (!tools) return;
      const modal = el.closest(".bx-unified-modal, #bxVerseToolPopup") || $("#bxVerseToolPopup");
      const read = Number(tools.dataset.bxZoom || 1);
      if (el.matches("[data-bx-popup-zoom-in]")) applyZoomTo(modal, tools, read + .1);
      else if (el.matches("[data-bx-popup-zoom-out]")) applyZoomTo(modal, tools, read - .1);
      else if (el.matches("[data-bx-popup-full]")) {
        const card = tools.parentElement;
        const on = !modal.classList.contains("bx-popup-fullscreen");
        modal.classList.toggle("bx-popup-fullscreen", on);
        el.setAttribute("aria-pressed", on ? "true" : "false");
        el.textContent = on ? "▣ Sair da tela cheia" : "⛶ Tela cheia";
        if (on && card?.requestFullscreen && !nativeFullscreenElement() && !(window.matchMedia && window.matchMedia("(max-width:760px)").matches)) {
          try { Promise.resolve(card.requestFullscreen()).catch(() => {}); } catch (_) {}
        } else if (!on && nativeFullscreenElement() && document.exitFullscreen) {
          try { Promise.resolve(document.exitFullscreen()).catch(() => {}); } catch (_) {}
        }
      }
    }, true);
  };

  function close(popup) {
    if (!popup) return;
    const fullscreen = nativeFullscreenElement();
    if (fullscreen && popup.contains(fullscreen) && document.exitFullscreen) {
      try { Promise.resolve(document.exitFullscreen()).catch(() => {}); } catch (_) {}
    }
    popup.hidden = true;
    resetFullscreenUi(popup);
    syncOverlayState();
    /* 5.4.113 — devolve a ponte ao <body> fora da tela cheia (onde o position:fixed
       é garantidamente relativo à viewport). */
    if (!document.querySelector(".bible-x-shell.bx-page-full") && popup.parentNode !== document.body) {
      document.body.appendChild(popup);
    }
  }

  function invokeOriginal(button) {
    if (!button) return;
    /* 5.4.70 — adiar o re-clique para FORA do dispatch atual. A spec HTML tem a
       flag "click in progress": um el.click() sintético seta a flag, e qualquer
       .click() re-entrante disparado DENTRO desse dispatch vê a flag setada e
       retorna em silêncio (o clique é engolido, nenhum handler roda). Isso só
       acontece quando o clique disparador TAMBÉM foi sintético (el.click()); no
       clique real/trusted do usuário a flag não é setada e o re-clique funcionava.
       Com o setTimeout(0), o re-clique roda com o dispatch do primeiro clique já
       terminado (flag limpa) e alcança o handler original em ambos os caminhos. */
    setTimeout(() => {
      button.dataset.bxPopupBypass = "1";
      try { button.click(); } finally { delete button.dataset.bxPopupBypass; }
    }, 0);
  }

  function enhanceContext() {
    const panel = $("#bxVerseContext");
    if (!isVisible(panel)) return false;
    panel.classList.add("bx-unified-modal");
    toolbar(panel, panel, `${$("#bxVcKind")?.textContent || "BÍBLIA X"}`);
    syncOverlayState();
    return true;
  }

  function enhanceLive() {
    const panel = $("#bxLiveExplorer");
    if (!isVisible(panel)) return false;
    /* 5.4.107 — quando o Bíblia Viva está DENTRO do popup do versículo
       (#bxVerseContext já é o modal unificado, 1120px centralizado), NÃO aplicar
       bx-unified-live-popup no painel interno: antes ele saía do fluxo do corpo
       (position:fixed) e flutuava POR CIMA do popup vazio — era o "Bíblia Viva
       abre mais quebrado". Agora o conteúdo rola dentro do popup único. */
    const host = $("#bxVerseContext");
    if (host && isVisible(host) && host.contains(panel)) {
      syncOverlayState();
      return true;
    }
    panel.classList.add("bx-unified-live-popup");
    toolbar(panel, panel, "Raio X Vivo");
    syncOverlayState();
    return true;
  }

  function enhanceExistingModals() {
    /* 5.4.69 — REMOVER a classe de modais que fecharam. Se um modal (ex. a
       Jornada) recebeu bx-unified-modal enquanto aberto e o app o fecha com
       opacity:0 (sem hidden), a regra CSS pointer-events:auto o transformaria
       num overlay invisível de z-130000 cobrindo a tela — matando todos os
       cliques reais (o .click() sintético passa, o mouse real não). */
    document.querySelectorAll(".bx-unified-modal").forEach(modal => {
      if (modal.id === "bxVerseToolPopup" || modal.id === "bxVerseContext" || modal.id === "bxLiveExplorer" || modal.id === "bxDeepModal") return;
      if (!isVisible(modal)) modal.classList.remove("bx-unified-modal");
    });
    enhanceContext();
    enhanceLive();
    document.querySelectorAll("body > [class*='-modal'], .bible-x-shell [class*='-modal']").forEach(modal => {
      if (!isVisible(modal) || modal.id === "bxVerseToolPopup" || modal.id === "bxVerseContext" || modal.id === "bxLiveExplorer" || modal.id === "bxDeepModal") return;
      const card = [...modal.children].find(child => child.matches?.("[class*='-card'], main, article")) || modal.firstElementChild;
      if (!card) return;
      modal.classList.add("bx-unified-modal");
      toolbar(modal, card, card.querySelector("h3")?.textContent || "Recurso da Bíblia X");
    });
    /* 5.4.68 — ponte só espera pelo modal core até ele assumir. Antes, o popup
       fechava num setTimeout fixo de 40ms; se o modal demorasse mais (navegador
       real, rede), a ponte escura ficava cobrindo a tela e parecia que nada
       respondia. Agora, sempre que o enhance roda (MutationObserver rAF), se o
       recurso core já está visível, a ponte fecha na hora. */
    const popup = $("#bxVerseToolPopup");
    const trigger = state.trigger;
    if (popup && !popup.hidden && trigger?.matches(CORE_BUTTON) &&
      (isVisible($("#bxVerseContext")) || isVisible($("#bxLiveExplorer")) ||
        [...document.querySelectorAll("body > [class*='-modal']")].some(isVisible))) {
      close(popup);
    }
    syncOverlayState();
  }

  function openBridge(button) {
    if (!button) return;
    /* 5.4.107 — recurso CORE (Bíblia Viva, Raio X, Comentários, Atlas...) abre
       DIRETO no modal grande, SEM a ponte de pré-visualização. Antes a ponte
       (#bxVerseToolPopup, card pequeno com botão "Continuar em X") aparecia
       primeiro e exigia um segundo clique — o usuário a chamava de "pequena
       expressão" e pediu para eliminá-la. */
    if (button.matches(CORE_BUTTON)) {
      state.trigger = button;
      invokeOriginal(button);
      setTimeout(() => {
        enhanceExistingModals();
        if (enhanceContext() || enhanceLive() || [...document.querySelectorAll("body > [class*='-modal']")].some(isVisible)) close($("#bxVerseToolPopup"));
      }, 40);
      return;
    }
    const popup = ensureBridge();
    /* 5.4.113 — em tela cheia da Bíblia X, a ponte abre DENTRO do shell (o app
       porta overlays para o fullscreen element; sem isso ela ficava no <body>,
       ATRÁS do fullscreen nativo → invisível = "não abre sobre a bíblia full"). */
    const _fullHost = document.querySelector(".bible-x-shell.bx-page-full");
    if (_fullHost && popup.parentNode !== _fullHost) _fullHost.appendChild(popup);
    else if (!_fullHost && popup.parentNode !== document.body) document.body.appendChild(popup);
    const { ref, text } = verseFor(button);
    const label = labelFor(button);
    state.trigger = button;
    $("[data-bx-popup-title]", popup).textContent = label;
    $("[data-bx-popup-ref]", popup).textContent = ref;
    $("[data-bx-popup-body]", popup).innerHTML = `<section class="bx-popup-verse-preview"><b>${esc(ref)}</b><p>${esc(text || "Versículo selecionado para estudo.")}</p></section>
      <div class="bx-popup-message"><span>◈</span><div><b>${esc(label)}</b><p>Continue para abrir o recurso sobre esta passagem.</p></div></div>
      <footer><button type="button" class="btn primary" data-bx-popup-run>Continuar em ${esc(label)}</button></footer>`;
    popup.hidden = false;
    const run = $("[data-bx-popup-run]", popup);
    run.addEventListener("click", () => { close(popup); invokeOriginal(button); setTimeout(enhanceExistingModals, 40); });
  }

  /* 5.4.71 — toggle: clicar de novo no MESMO botão fecha o painel que ele abriu
     (sem precisar ir no X). Se o bridge ainda estiver aberto pelo mesmo trigger,
     o re-clique fecha só o bridge. */
  function panelFor(button) {
    if (!button) return null;
    if (button.matches("[data-verse-tool='context']")) return $("#bxVerseContext");
    if (button.matches("[data-verse-tool='live']")) return $("#bxLiveExplorer");
    if (button.matches("[data-lmx33='study']")) return $("#bxDeepModal");
    /* 5.4.110 — Viagem (Atlas Vivo) também alterna no re-clique do mesmo botão. */
    if (button.matches("[data-jr-ctx]")) return $("#bxJourneyModal");
    return null;
  }

  document.addEventListener("click", event => {
    const button = event.target.closest?.(VERSE_BUTTONS);
    if (!button || button.dataset.bxPopupBypass === "1" || button.matches("[data-bx-verse-more]")) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    const popup = $("#bxVerseToolPopup");
    if (popup && !popup.hidden && state.trigger === button) { close(popup); state.trigger = null; return; }
    const panel = panelFor(button);
    if (panel && isVisible(panel)) {
      if (panel.id === "bxDeepModal") window.BibleXEstudo?.close?.();
      else if (panel.id === "bxJourneyModal") { try { window.BibleXViagem?.close?.(); } catch (_) { panel.classList.remove("is-open"); document.body.classList.remove("bx-journey-lock"); } }
      else if (panel.id === "bxVerseContext") { try { bxCloseVerseContext(); } catch (_) { close(panel); } }
      else { close(panel); panel.classList.remove("bx-unified-modal"); }
      return;
    }
    openBridge(button);
  }, true);

  wireGlobalControls();

  let enhanceQueued = false;
  const scheduleEnhance = () => {
    if (enhanceQueued) return;
    enhanceQueued = true;
    const run = () => {
      enhanceQueued = false;
      enhanceExistingModals();
    };
    if (typeof requestAnimationFrame === "function") requestAnimationFrame(run);
    else setTimeout(run, 0);
  };
  const observer = new MutationObserver(records => {
    // Os próprios controles do pop-up alteram classe/atributos. Não é preciso
    // revarrer a Bíblia inteira por causa dessas alterações internas.
    if (records.length && records.every(record => {
      const target = record.target;
      return target?.closest?.("#bxVerseToolPopup, .bx-popup-toolbar") ||
        [...(record.addedNodes || [])].every(node => node.nodeType !== 1 || node.closest?.("#bxVerseToolPopup, .bx-popup-toolbar"));
    })) return;
    scheduleEnhance();
  });
  observer.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ["hidden", "class"] });
  document.addEventListener("keydown", event => { if (event.key === "Escape") close($("#bxVerseToolPopup")); });
  /* 5.4.69 — quando a transição de fechamento de um modal unificado termina
     (opacity chega a 0), remove a classe na hora, sem esperar outro mutation. */
  document.addEventListener("transitionend", event => {
    const el = event.target;
    if (el?.classList?.contains("bx-unified-modal") && !isVisible(el)) {
      el.classList.remove("bx-unified-modal");
    }
  });
  document.addEventListener("fullscreenchange", settleOverlayState);
  document.addEventListener("webkitfullscreenchange", settleOverlayState);
  document.addEventListener("biblex:fullscreenchange", event => {
    if (!event.detail?.on) {
      const backdrop = $("#bxVerseOverlayBackdrop");
      if (backdrop) backdrop.hidden = true;
      document.body.classList.remove("bx-resource-modal-open");
      if (!document.querySelector(".bible-x-shell.bx-page-full")) {
        document.body.classList.remove("bx-page-lock");
        document.documentElement.classList.remove("bx-page-lock");
      }
    }
    settleOverlayState();
  });
  document.addEventListener("biblex:pagechange", settleOverlayState);
  window.addEventListener("pageshow", settleOverlayState);
  setTimeout(scheduleEnhance, 300);
})();
