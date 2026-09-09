/* Bíblia X • Gerador de IA — imagens e vídeos | v5.4.246 */
(function () {
  "use strict";

  /* Guard anti-duplicidade: se dois loaders (immersion/visual-media) injetarem o
     script ao mesmo tempo, só a 1ª avaliação vale — ela é a que liga o guard de
     tela cheia no window (abaixo). Reavaliar criaria uma 2ª instância sem o guard. */
  if (window.BibleXAIMedia) return;

  const VERSION = "5.4.244";
  let layer = null;
  let current = null;
  let objectUrl = "";
  let keydownHandler = null;

  const $ = (selector, scope) => (scope || document).querySelector(selector);
  const esc = (value) => String(value == null ? "" : value)
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;").replace(/'/g, "&#39;");

  function apiBase() {
    return String(window.LOGOS_API_BASE || window.location.origin || "").replace(/\/$/, "");
  }

  function ensureStyle() {
    if (document.getElementById("bxAiMediaStyle")) return;
    const style = document.createElement("style");
    style.id = "bxAiMediaStyle";
    style.textContent = `
      .bx-ai-media-layer{position:fixed;inset:0;z-index:2147483647;display:grid;place-items:center;padding:18px;background:rgba(1,6,13,.84);backdrop-filter:blur(12px)}
      .bx-ai-media-card{display:flex;flex-direction:column;width:min(1180px,96vw);height:min(850px,94vh);overflow:hidden;color:#edf7ff;background:linear-gradient(145deg,rgba(12,31,51,.99),rgba(4,12,23,.99));border:1px solid rgba(244,199,107,.42);border-radius:24px;box-shadow:0 30px 100px rgba(0,0,0,.68)}
      .bx-ai-media-head{display:flex;align-items:flex-start;justify-content:space-between;gap:18px;padding:22px 26px;border-bottom:1px solid rgba(202,226,255,.14)}
      .bx-ai-media-kicker{display:block;color:#f4c76b;font-size:.7rem;font-weight:900;letter-spacing:.13em;text-transform:uppercase}
      .bx-ai-media-head h2{margin:.28rem 0 .32rem;font:800 clamp(1.45rem,3vw,2.2rem)/1.08 Georgia,serif;color:#fff3d1}
      .bx-ai-media-head p{margin:0;color:#9fb5ca;max-width:760px}
      .bx-ai-media-close{border:1px solid rgba(134,200,255,.3);border-radius:12px;background:#10243a;color:#e9f6ff;padding:.55rem .78rem;font-size:1.1rem;cursor:pointer}
      /* 5.4.244 — botão de tela cheia (nativa) no cabeçalho */
      .bx-ai-media-headbtns{display:flex;align-items:center;gap:8px;flex:0 0 auto}
      .bx-ai-media-fs{display:inline-flex;align-items:center;gap:6px;border:1px solid rgba(134,200,255,.3);border-radius:12px;background:#10243a;color:#e9f6ff;padding:.55rem .7rem;font-size:1.05rem;line-height:1;cursor:pointer}
      .bx-ai-media-fs:hover{border-color:rgba(98,228,210,.7);color:#baf6ec;background:#0e2c38}
      .bx-ai-media-fs.is-active{border-color:#62e4d2;background:linear-gradient(135deg,#0e3a44,#123a52);color:#eafffb;box-shadow:inset 0 0 0 1px rgba(98,228,210,.35)}
      .bx-ai-media-fs-label{font-weight:800;font-size:.82rem;letter-spacing:.01em}
      .bx-ai-media-layer:fullscreen,.bx-ai-media-layer:-webkit-full-screen,.bx-ai-media-layer.bx-ai-media-layer-fs{background:rgba(0,2,5,.97);padding:0}
      .bx-ai-media-layer:fullscreen .bx-ai-media-card,.bx-ai-media-layer:-webkit-full-screen .bx-ai-media-card,.bx-ai-media-layer.bx-ai-media-layer-fs .bx-ai-media-card{width:100vw;height:100vh;max-width:100vw;max-height:100vh;border-radius:0;border-width:0}
      @media(max-width:620px){.bx-ai-media-fs{padding:.55rem .6rem}.bx-ai-media-fs-label{display:none}}
      .bx-ai-media-grid{display:grid;grid-template-columns:minmax(300px,420px) minmax(0,1fr);min-height:0;flex:1}
      .bx-ai-media-form,.bx-ai-media-output{min-height:0;overflow:auto;padding:22px 26px}
      .bx-ai-media-form{border-right:1px solid rgba(202,226,255,.12);background:rgba(3,13,24,.36)}
      .bx-ai-media-form label{display:grid;gap:7px;margin:0 0 14px;color:#bdd0e2;font-size:.84rem;font-weight:800}
      .bx-ai-media-form select,.bx-ai-media-form textarea{width:100%;box-sizing:border-box;border:1px solid rgba(134,200,255,.24);border-radius:12px;background:#071727;color:#eef8ff;padding:.75rem .85rem;font:inherit}
      .bx-ai-media-form textarea{min-height:190px;resize:vertical;line-height:1.45}
      .bx-ai-media-segment{display:flex;gap:8px;margin:0 0 16px}
      .bx-ai-media-segment button,.bx-ai-media-btn{border:1px solid rgba(134,200,255,.26);border-radius:11px;background:#10273c;color:#deeffe;padding:.65rem .78rem;font:inherit;font-weight:800;cursor:pointer}
      .bx-ai-media-segment button.is-active,.bx-ai-media-btn.is-primary{border-color:#f4c76b;background:linear-gradient(135deg,#7f561d,#164b58);color:#fff1c6}
      .bx-ai-media-actions{display:flex;flex-wrap:wrap;gap:8px;margin-top:14px}
      .bx-ai-media-upload{display:flex;align-items:center;gap:10px;border:1px dashed rgba(98,228,210,.42);border-radius:13px;padding:12px;background:rgba(16,73,79,.22);color:#baf6ec;cursor:pointer}
      .bx-ai-media-upload input{position:absolute;width:1px;height:1px;opacity:0;pointer-events:none}
      .bx-ai-media-hint,.bx-ai-media-status,.bx-ai-media-security{display:block;color:#91a7be;font-size:.78rem;line-height:1.45}
      .bx-ai-media-status{margin:10px 0;color:#62e4d2}
      .bx-ai-media-security{margin-top:16px;padding:10px 12px;border-left:3px solid #f4c76b;background:rgba(244,199,107,.06)}
      .bx-ai-media-output{display:flex;flex-direction:column;gap:14px;background:radial-gradient(circle at 50% 0%,rgba(31,111,129,.18),transparent 44%)}
      .bx-ai-media-output-head{display:flex;align-items:center;justify-content:space-between;gap:12px}
      .bx-ai-media-output-head strong{font-size:1rem;color:#fff0bd}
      .bx-ai-media-output-head span{color:#8fa8bf;font-size:.78rem}
      .bx-ai-media-canvas{display:grid;place-items:center;min-height:320px;flex:1;border:1px solid rgba(134,200,255,.18);border-radius:18px;background:rgba(3,13,24,.62);overflow:hidden;color:#8fa8bf;text-align:center}
      .bx-ai-media-canvas img,.bx-ai-media-canvas video{display:block;max-width:100%;max-height:100%;object-fit:contain}
      .bx-ai-media-result-meta{color:#9fb5ca;font-size:.8rem;line-height:1.45}
      .bx-ai-media-result-actions{display:flex;flex-wrap:wrap;gap:8px}
      .bx-ai-media-result-actions a{display:inline-flex;align-items:center;text-decoration:none}
      .bx-ai-media-context{margin:0 0 16px;padding:12px 14px;border:1px solid rgba(98,228,210,.2);border-radius:13px;background:rgba(10,57,66,.2);color:#b9d9e3;font-size:.8rem;line-height:1.45}
      .bx-ai-media-context strong{color:#fff0bd}
      .bx-ai-media-reference{display:none;margin:0 0 14px;border:1px solid rgba(244,199,107,.28);border-radius:14px;overflow:hidden;background:#061321}
      .bx-ai-media-reference.is-visible{display:block}
      .bx-ai-media-reference img,.bx-ai-media-reference video{display:block;width:100%;max-height:180px;object-fit:contain;background:#02070d}
      .bx-ai-media-reference small{display:block;padding:8px 10px;color:#b6cadd}
      .bx-ai-media-reference-tools{display:flex;flex-wrap:wrap;gap:8px;padding:8px 10px;border-top:1px solid rgba(202,226,255,.12)}
      .bx-ai-media-btn.is-danger{border-color:rgba(255,120,120,.5);color:#ffd4d4}
      .bx-ai-media-links{display:flex;flex-wrap:wrap;gap:7px;margin-top:12px}
      .bx-ai-media-links button{border:0;background:transparent;color:#8edfff;padding:0;font:inherit;font-size:.78rem;text-decoration:underline;cursor:pointer}
      /* 5.4.243 — coluna única rolável: a grid vira o único scroller e os
         painéis (form/resultado) deixam de rolar por conta própria. Antes, os
         filhos mantinham overflow:auto;min-height:0 da regra base e as auto-rows
         da grid colapsavam o form em ~264px, deixando as ações inatingíveis. */
      @media(max-width:800px){.bx-ai-media-card{height:min(920px,96vh)}.bx-ai-media-grid{grid-template-columns:1fr;overflow:auto;align-items:start}.bx-ai-media-form,.bx-ai-media-output{overflow:visible}.bx-ai-media-form{border-right:0;border-bottom:1px solid rgba(202,226,255,.12)}.bx-ai-media-form textarea{min-height:120px}.bx-ai-media-output{min-height:0}.bx-ai-media-form,.bx-ai-media-output{padding:18px}.bx-ai-media-canvas{min-height:250px}}
      /* 5.4.243 — gancho "Usar minha própria API" (chave do usuário, direto do navegador) */
      .bx-ai-media-own{margin:12px 0 14px;padding:12px 14px;border:1px solid rgba(134,200,255,.22);border-radius:14px;background:rgba(7,23,39,.7)}
      .bx-ai-media-own[hidden]{display:none}
      .bx-ai-media-own>strong{display:block;color:#fff0bd;font-size:.9rem;margin:0 0 10px}
      .bx-ai-media-own-row{display:grid;gap:6px;margin:0 0 10px;color:#bdd0e2;font-size:.84rem;font-weight:800}
      .bx-ai-media-own-row input[type="password"],.bx-ai-media-own-row select{width:100%;box-sizing:border-box;border:1px solid rgba(134,200,255,.24);border-radius:12px;background:#071727;color:#eef8ff;padding:.7rem .85rem;font:inherit}
      .bx-ai-media-links [data-ai-own-open]{font-weight:800;color:#62e4d2}
      .bx-ai-media-links [data-ai-own-open]:hover{color:#baf6ec}
      /* 5.4.244 — qualidade (Baixa/Média/Alta) altera o prompt em tempo real */
      .bx-ai-media-segrow{display:flex;align-items:center;gap:8px;margin:0 0 14px;flex-wrap:wrap}
      .bx-ai-media-segrow .bx-ai-media-seglabel{color:#bdd0e2;font-size:.84rem;font-weight:800}
      /* 5.4.244 — legibilidade, teclas suaves, fontes e reforço de segurança */
      .bx-ai-media-layer{font-family:"Segoe UI",system-ui,-apple-system,"Helvetica Neue",Arial,sans-serif;-webkit-font-smoothing:antialiased}
      .bx-ai-media-form label,.bx-ai-media-own-row,.bx-ai-media-segrow .bx-ai-media-seglabel{font-weight:700;letter-spacing:.01em}
      .bx-ai-media-form textarea{font-weight:400;font-size:.95rem;line-height:1.6;letter-spacing:.006em}
      .bx-ai-media-form textarea::placeholder{color:#7c95ac;font-weight:400}
      .bx-ai-media-btn.is-active,.bx-ai-media-btn.is-primary{border-color:#c9ab74;background:linear-gradient(135deg,#57421f,#1c4b55);color:#ffedc4;box-shadow:inset 0 1px 0 rgba(255,255,255,.06)}
      .bx-ai-media-btn.is-active:hover,.bx-ai-media-btn.is-primary:hover{border-color:#dfc089}
      .bx-ai-media-segment button.is-active{border-color:#c9ab74;background:linear-gradient(135deg,#57421f,#1c4b55);color:#ffedc4}
      .bx-ai-media-genrow{margin-top:12px}
      .bx-ai-media-keyrow{display:flex;align-items:center;gap:6px;flex-wrap:wrap;margin:-2px 0 14px;color:#8fa8bf;font-size:.76rem;line-height:1.5}
      .bx-ai-media-keyrow button{border:0;background:transparent;color:#8edfff;padding:0;font:inherit;font-size:.78rem;text-decoration:underline;cursor:pointer}
      .bx-ai-media-keyrow button:hover{color:#bdf0ff}
      .bx-ai-media-own-open{border-color:rgba(98,228,210,.6)!important;background:rgba(10,57,66,.4)!important;color:#8cf2de!important}
      .bx-ai-media-own-open:hover,.bx-ai-media-own-open.is-open{border-color:#62e4d2!important;background:rgba(13,72,84,.55)!important}
      .bx-ai-media-own-open.is-open{box-shadow:inset 0 0 0 1px rgba(98,228,210,.5)}
      .bx-ai-media-own-head{display:flex;align-items:center;justify-content:space-between;gap:10px;margin:0 0 10px}
      .bx-ai-media-own-head strong{display:block;color:#fff0bd;font-size:.9rem;margin:0}
      .bx-ai-media-own-x{flex:0 0 auto;border:1px solid rgba(134,200,255,.3);border-radius:10px;background:#10243a;color:#e9f6ff;padding:.15rem .5rem;font-size:.95rem;line-height:1.4;cursor:pointer}
      .bx-ai-media-own-x:hover{border-color:rgba(255,140,140,.55);color:#ffd4d4}
      .bx-ai-media-security{display:flex;align-items:flex-start;gap:10px;margin-top:16px;padding:12px 13px;border:1px solid rgba(98,228,210,.26);border-left:4px solid #62e4d2;border-radius:12px;background:linear-gradient(135deg,rgba(10,57,66,.3),rgba(7,23,39,.55));color:#cde9de;font-size:.8rem;line-height:1.6}
      .bx-ai-media-security .bx-lock{flex:0 0 auto;font-size:1.05rem;line-height:1.4;margin-top:1px}
      .bx-ai-media-security b{color:#7ff0dc}
      /* 5.4.244 — Lote de capítulos (geração em fila, salva cada item na Mídia X) */
      .bx-ai-batch-grid{display:grid;grid-template-columns:minmax(300px,420px) minmax(0,1fr);min-height:0;flex:1}
      @media(max-width:800px){.bx-ai-batch-grid{grid-template-columns:1fr;overflow:auto;align-items:start}.bx-ai-batch-cfg,.bx-ai-batch-list{overflow:visible;padding:18px}.bx-ai-batch-list{max-height:none;min-height:40vh}.bx-ai-batch-list .bx-ai-batch-empty{min-height:30vh}}
      .bx-ai-batch-cfg{padding:22px 26px;border-right:1px solid rgba(202,226,255,.12);background:rgba(3,13,24,.36);overflow:auto}
      .bx-ai-batch-cfg label{display:grid;gap:6px;margin:0 0 13px;color:#bdd0e2;font-size:.84rem;font-weight:700}
      .bx-ai-batch-cfg select,.bx-ai-batch-cfg input[type="number"]{width:100%;box-sizing:border-box;border:1px solid rgba(134,200,255,.24);border-radius:11px;background:#071727;color:#eef8ff;padding:.62rem .8rem;font:inherit}
      .bx-ai-batch-row{display:flex;gap:10px;align-items:flex-end}
      .bx-ai-batch-row label{flex:1}
      .bx-ai-batch-hint{display:block;color:#91a7be;font-size:.78rem;line-height:1.5;margin:-4px 0 12px}
      .bx-ai-batch-actions{display:flex;flex-wrap:wrap;gap:8px;margin-top:6px}
      .bx-ai-batch-progress{margin:14px 0 2px}
      .bx-ai-batch-track{height:8px;border-radius:99px;background:#0a1a2b;overflow:hidden;border:1px solid rgba(134,200,255,.16)}
      .bx-ai-batch-fill{height:100%;width:0%;background:linear-gradient(90deg,#1f7a5f,#2ecc9f);transition:width .25s ease}
      .bx-ai-batch-counter{display:flex;justify-content:space-between;gap:10px;color:#8fa8bf;font-size:.78rem;margin-top:6px}
      .bx-ai-batch-list{padding:22px 26px;overflow:auto;min-height:0;background:radial-gradient(circle at 50% 0%,rgba(31,111,129,.14),transparent 44%)}
      .bx-ai-batch-listhead{display:flex;align-items:center;justify-content:space-between;gap:10px;margin:0 0 12px}
      .bx-ai-batch-listhead strong{color:#fff0bd;font-size:1rem}
      .bx-ai-batch-listhead span{color:#8fa8bf;font-size:.78rem}
      .bx-ai-batch-items{display:flex;flex-direction:column;gap:8px}
      .bx-ai-batch-item{display:flex;align-items:center;gap:12px;padding:10px 12px;border:1px solid rgba(134,200,255,.16);border-radius:13px;background:rgba(7,23,39,.6)}
      .bx-ai-batch-item.is-ok{border-color:rgba(98,228,210,.34);background:rgba(9,54,48,.3)}
      .bx-ai-batch-item.is-fail{border-color:rgba(255,120,120,.38);background:rgba(60,14,18,.3)}
      .bx-ai-batch-ic{min-width:0;flex:1}
      .bx-ai-batch-ic b{display:block;color:#eaf6ff;font-size:.9rem}
      .bx-ai-batch-ic span{display:block;color:#8fa8bf;font-size:.76rem;line-height:1.4;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
      .bx-ai-batch-st{flex:0 0 auto;font-size:.76rem;font-weight:800;color:#8fa8bf;text-align:right;max-width:180px;word-break:break-word}
      .bx-ai-batch-item.is-run .bx-ai-batch-st{color:#62e4d2}
      .bx-ai-batch-item.is-ok .bx-ai-batch-st{color:#5fe0b0}
      .bx-ai-batch-item.is-fail .bx-ai-batch-st{color:#ff9f9f}
      .bx-ai-batch-empty{display:grid;place-items:center;min-height:280px;border:1px dashed rgba(134,200,255,.2);border-radius:16px;color:#7b8fa3;text-align:center;padding:20px;line-height:1.6}
      .bx-ai-media-batchlbl{font-size:.85rem;font-weight:800}
      @media(max-width:620px){.bx-ai-media-batchlbl{display:none}}
      /* 5.4.245 — redistribuição do gerador: contexto/mídia acima do "Resultado da
         passagem"; chaves (cadeado), "Usar minha própria API" e provedores prontos
         abaixo. Menos rolagem na coluna esquerda; Voltar do Lote → gerador. */
      .bx-ai-media-canvas{min-height:250px}
      .bx-ai-media-ctx{display:flex;flex-direction:column;gap:8px;flex:0 0 auto}
      .bx-ai-media-ctx .bx-ai-media-context{margin:0}
      .bx-ai-media-uprow{display:flex;align-items:stretch;gap:8px;flex-wrap:wrap}
      .bx-ai-media-uprow .bx-ai-media-upload{margin:0;flex:1 1 240px;justify-content:center;text-align:center}
      .bx-ai-media-keys{display:flex;flex-direction:column;gap:10px;flex:0 0 auto;border-top:1px solid rgba(202,226,255,.1);padding-top:12px;margin-top:2px}
      .bx-ai-media-provhead{display:flex;align-items:center;gap:10px}
      .bx-ai-media-provhead span{flex:0 0 auto;color:#f4c76b;font-size:.66rem;font-weight:900;letter-spacing:.14em;text-transform:uppercase}
      .bx-ai-media-provhead::after{content:"";flex:1;height:1px;background:rgba(202,226,255,.12)}
      .bx-ai-media-provrow{display:flex;align-items:flex-end;gap:8px;flex-wrap:wrap}
      .bx-ai-media-provlabel{flex:1 1 200px;min-width:0;display:grid;gap:6px;color:#bdd0e2;font-size:.82rem;font-weight:800}
      .bx-ai-media-provlabel select{width:100%;box-sizing:border-box;border:1px solid rgba(134,200,255,.24);border-radius:11px;background:#071727;color:#eef8ff;padding:.6rem .8rem;font:inherit}
      .bx-ai-media-keys .bx-ai-media-own{margin:0}
      .bx-ai-media-keys .bx-ai-media-keyrow{margin:0}
      .bx-ai-media-keys .bx-ai-media-security{margin-top:2px}
      .bx-ai-media-keys .bx-ai-media-own-open{flex:0 0 auto;align-self:flex-end;margin:0}
      @media(max-width:800px){.bx-ai-media-uprow .bx-ai-media-upload{flex-basis:100%}.bx-ai-media-provrow{flex-direction:column;align-items:stretch}.bx-ai-media-provlabel{flex:none}.bx-ai-media-keys .bx-ai-media-own-open{align-self:stretch}}
      /* 5.4.245 — miniaturas das imagens geradas no Lote, visíveis na lista */
      .bx-ai-batch-th{flex:0 0 auto;width:64px;height:64px;border-radius:10px;overflow:hidden;border:1px solid rgba(98,228,210,.22);background:#04101d;display:none;align-self:center}
      .bx-ai-batch-item.is-ok .bx-ai-batch-th{display:block}
      .bx-ai-batch-th img{width:100%;height:100%;object-fit:cover;display:block}
      @media(max-width:800px){.bx-ai-batch-th{width:52px;height:52px}}
      /* 5.4.246 — ⬇ baixar cada imagem do Lote (aparece quando a imagem fica pronta) */
      .bx-ai-batch-dl{flex:0 0 auto;display:none;align-items:center;justify-content:center;width:30px;height:30px;border-radius:9px;border:1px solid rgba(98,228,210,.3);color:#7ce9d6;font-size:.82rem;text-decoration:none;cursor:pointer;background:rgba(10,45,40,.35)}
      .bx-ai-batch-item.is-ok .bx-ai-batch-dl{display:inline-flex}
      .bx-ai-batch-dl:hover{background:#12333a;color:#b9fff2}
    `;
    document.head.appendChild(style);
  }

  const VISUAL_DNA_MARKER = "LOGOS MASTER X • DNA VISUAL FIXO";

  function visualMetadata(context = {}) {
    const scene = context.scene || {};
    const event = context.event || {};
    const reference = context.currentNarrativeRef || context.reference || event.ref || "passagem em estudo";
    const place = [scene.place?.name, scene.place?.region].filter(Boolean).join(" • ") || "local bíblico relacionado";
    const stage = event.label || "leitura da passagem";
    return { title: scene.title || "cena em estudo", reference, place, stage };
  }

  function visualDnaPrompt() {
    return `${VISUAL_DNA_MARKER}: use composição cinematográfica editorial, realista e historicamente prudente, com luz natural, paisagem, arquitetura, objetos e vestimentas coerentes com o antigo Oriente. A mídia deve sair completamente limpa: nenhum texto, título, letreiro, legenda, faixa informativa, logotipo, assinatura ou marca d'água — nenhum caractere legível em qualquer idioma, para que a cena possa ser reutilizada em vídeo. Não apresente a reconstrução como fotografia do século I, não invente inscrições legíveis, datas ou fatos arqueológicos; trate como reconstrução interpretativa para estudo bíblico.`.replace(/\s+/g, " ").trim();
  }

  function buildVisualPrompt(prompt, context = {}) {
    const base = String(prompt || "").replace(/\s+/g, " ").trim();
    if (base.includes(VISUAL_DNA_MARKER)) return base;
    return `${base}\n\n${visualDnaPrompt()}`.trim();
  }

  function contextPrompt(context) {
    const meta = visualMetadata(context);
    const scene = context.scene || {};
    return buildVisualPrompt(`Crie uma mídia bíblica editorial para ${meta.reference}, “${meta.title}”. Local relacionado: ${meta.place}. Etapa narrativa: ${meta.stage}. ${scene.subtitle || ""} Produza uma reconstrução visual respeitosa, cinematográfica e historicamente prudente, com paisagem, arquitetura e vestimentas coerentes com o antigo Oriente. Não apresente a imagem como fotografia do século I, não invente inscrições legíveis, datas nem fatos arqueológicos; trate como reconstrução interpretativa para estudo bíblico.`, context);
  }

  /* Qualidade da imagem (Baixa/Média/Alta) e proporção (16:9 paisagem / 9:16
     vertical / 1:1 quadrado): cada escolha altera o prompt em tempo real (vale
     para "Gerar com API", "Gerar pela minha chave" e "Copiar prompt"). A
     resolução de saída fica a cargo do provedor — o antigo seletor 1K/2K/4K não
     alterava nada (Gemini ignora; OpenAI não lê) e foi removido. */
  const QUALITY_PHRASES = {
    baixa: "Qualidade da renderização escolhida: BAIXA — rascunho rápido, contornos simplificados e menos detalhe.",
    media: "Qualidade da renderização escolhida: MÉDIA — detalhe equilibrado com boa nitidez para estudo.",
    alta: "Qualidade da renderização escolhida: ALTA — máximo detalhe, nitidez e acabamento profissional."
  };
  const ASPECT_PHRASES = {
    "16:9": "Proporção escolhida: PAISAGEM 16:9 — quadro largo horizontal, natural para vídeos e vistas amplas.",
    "9:16": "Proporção escolhida: VERTICAL 9:16 — quadro em pé (retrato), ideal para telas de celular.",
    "1:1": "Proporção escolhida: QUADRADO 1:1 — enquadramento quadrado, equilibrado e compacto."
  };
  let currentQuality = "media";
  let currentAspect = "16:9";
  const promptChips = { quality: "", aspect: "" };

  function chipBlocks() {
    const chips = [];
    if (current?.kind !== "video" && QUALITY_PHRASES[currentQuality]) chips.push("\n\n" + QUALITY_PHRASES[currentQuality]);
    const phrase = ASPECT_PHRASES[currentAspect] || ASPECT_PHRASES["16:9"];
    if (phrase) chips.push("\n\n" + phrase);
    return chips;
  }
  function syncPromptChips() {
    const ta = layer && $("[data-ai-prompt]", layer);
    if (!ta) return;
    let value = ta.value || "";
    for (const key of ["quality", "aspect"]) {
      const prev = promptChips[key];
      if (prev) {
        const idx = value.lastIndexOf(prev);
        if (idx !== -1) value = value.slice(0, idx) + value.slice(idx + prev.length);
        promptChips[key] = "";
      }
    }
    const chips = chipBlocks();
    value = (value.trimEnd() + chips.join(""));
    if (current?.kind !== "video" && QUALITY_PHRASES[currentQuality]) promptChips.quality = "\n\n" + QUALITY_PHRASES[currentQuality];
    const ap = ASPECT_PHRASES[currentAspect] || ASPECT_PHRASES["16:9"];
    if (ap) promptChips.aspect = "\n\n" + ap;
    ta.value = value;
  }
  function setQualityLevel(level) {
    currentQuality = Object.prototype.hasOwnProperty.call(QUALITY_PHRASES, level) ? level : "media";
    if (!layer) return;
    layer.querySelectorAll("[data-ai-quality]").forEach((b) => b.classList.toggle("is-active", b.dataset.aiQuality === currentQuality));
    syncPromptChips();
  }
  function setAspectLevel(level) {
    currentAspect = Object.prototype.hasOwnProperty.call(ASPECT_PHRASES, level) ? level : "16:9";
    if (!layer) return;
    const select = $("[data-ai-aspect]", layer);
    if (select && select.value !== currentAspect) select.value = currentAspect;
    syncPromptChips();
  }

  function setStatus(message, tone = "normal") {
    if (!layer) return;
    const target = $("[data-ai-status]", layer);
    if (!target) return;
    target.textContent = message;
    target.dataset.tone = tone;
  }

  async function fetchJson(path, options) {
    const response = await fetch(apiBase() + path, { cache: "no-store", ...options });
    let payload = {};
    try { payload = await response.json(); } catch (_) {}
    if (!response.ok) throw new Error(payload.detail || payload.message || `Falha HTTP ${response.status}`);
    return payload;
  }

  async function refreshStatus() {
    try {
      const payload = await fetchJson("/api/bible/ai/media/status");
      const select = $("[data-ai-provider]", layer);
      const providers = payload.providers || {};
      ["gemini", "openai"].forEach((provider) => {
        const option = select?.querySelector(`option[value="${provider}"]`);
        if (!option) return;
        const item = providers[provider] || {};
        option.textContent = `${provider === "gemini" ? "Gemini" : "OpenAI"} ${item.configured ? `• pronto • ${item.models?.image || "modelo"}` : `• chave ausente (${item.key?.source || "API key"})`}`;
        option.disabled = false;
      });
      const ready = Object.entries(providers).filter(([, item]) => item.configured).map(([name]) => name);
      const readyLabel = ready.map((name) => (name === "openai" ? "OpenAI" : "Gemini")).join(" + ");
      setStatus(ready.length ? `Provedores de IA prontos: ${readyLabel}.` : `Nenhuma chave de IA configurada. ${payload.environment?.project_env_loaded ? "As variáveis do servidor foram carregadas, mas a chave está vazia." : "Configure a chave no servidor (.env) para liberar a geração."}`, ready.length ? "ok" : "warn");
    } catch (error) {
      setStatus(`Não foi possível consultar as APIs: ${error.message}`, "warn");
    }
  }

  function renderCanvas(message) {
    if (!layer) return;
    const canvas = $("[data-ai-canvas]", layer);
    if (canvas) canvas.innerHTML = `<span>${esc(message)}</span>`;
  }

  function mediaDB() { return new Promise((resolve, reject) => { const r = indexedDB.open("logosx-bible", 15); r.onupgradeneeded = () => { if (!r.result.objectStoreNames.contains("media")) r.result.createObjectStore("media", { keyPath: "id" }); }; r.onsuccess = () => resolve(r.result); r.onerror = () => reject(r.error); }); }
  async function mediaAll() { const db = await mediaDB(); return new Promise((resolve, reject) => { const tx = db.transaction("media", "readonly"); const request = tx.objectStore("media").getAll(); request.onsuccess = () => resolve(request.result || []); request.onerror = () => reject(request.error); }); }
  async function mediaPut(row) { if (typeof window.mediaPutMany === "function") return window.mediaPutMany([row]); const db = await mediaDB(); return new Promise((resolve, reject) => { const tx = db.transaction("media", "readwrite"); tx.objectStore("media").put(row); tx.oncomplete = () => resolve(1); tx.onerror = () => reject(tx.error); }); }
  async function mediaRemove(id) { if (!id) return; if (typeof window.mediaDelete === "function") return window.mediaDelete(id); const db = await mediaDB(); return new Promise((resolve, reject) => { const tx = db.transaction("media", "readwrite"); tx.objectStore("media").delete(id); tx.oncomplete = () => resolve(true); tx.onerror = () => reject(tx.error); }); }
  function mediaChanged() { document.dispatchEvent(new CustomEvent("biblex:media-changed", { detail: { source: "atelie-ia" } })); }
  function placementCandidates(seed = {}) { return window.BibleXImmersion?.getMediaPlacementCandidates?.(seed) || []; }
  function mediaRow(asset, title, sourceKind) {
    const context = current.context || {};
    const ref = context.currentNarrativeRef || context.reference || "";
    const place = [context.scene?.place?.name, context.scene?.place?.region].filter(Boolean).join(" • ");
    return { id: `ai-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`, title, type: asset.kind, mime: asset.mime || "", reference: ref, relatedReferences: placementCandidates({ reference: ref, place, title, tags: ["atelie-ia", asset.kind, "passagem"] }), description: `Mídia vinculada a ${ref || "passagem em estudo"}.`, tags: ["atelie-ia", asset.kind, "passagem"], credits: sourceKind === "local" ? "Arquivo enviado pelo usuário" : `Gerado via ${asset.provider || "API"}`, license: sourceKind === "local" ? "Arquivo do usuário — confirme os direitos do original" : "Resultado gerado — consulte os termos do provedor", sourceKind, sourceUrl: asset.dataUrl || asset.url || "", thumbUrl: asset.kind === "image" ? (asset.dataUrl || asset.url || "") : "", blob: asset.blob || null, size: Number(asset.size || 0), place, createdAt: new Date().toISOString() };
  }
  async function saveAsset(asset, title, sourceKind) { const row = mediaRow(asset, title, sourceKind); await mediaPut(row); return row.id; }
  async function scanMediaLibrary() {
    const context = current?.context || {};
    const meta = visualMetadata(context);
    const seed = { reference: meta.reference, place: meta.place, title: meta.title, tags: [context.event?.label, context.scene?.theme].filter(Boolean) };
    const fallback = placementCandidates(seed);
    const rows = await mediaAll();
    let changed = 0;
    for (const row of rows) {
      const isCurrent = row.id === current.savedResultId || row.id === current.savedUploadId || normRef(row.reference) === normRef(meta.reference);
      const suggestions = placementCandidates(isCurrent ? { ...row, ...seed } : row);
      const next = Array.from(new Set([...(Array.isArray(row.relatedReferences) ? row.relatedReferences : []), ...(isCurrent ? fallback : suggestions)])).filter(Boolean).slice(0, 16);
      if (next.join("|") !== (row.relatedReferences || []).join("|")) { await mediaPut({ ...row, relatedReferences: next }); changed += 1; }
    }
    mediaChanged();
    setStatus(changed ? `✓ Escaneamento concluído: ${changed} mídia(s) receberam vínculos de passagem.` : "Nenhum vínculo novo encontrado; a biblioteca continua disponível para novas associações.", changed ? "ok" : "normal");
  }
  function normRef(value) { return String(value || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[–—]/g, "-").replace(/\s+/g, " ").trim().toLowerCase(); }
  function saveResultButton() { const button = document.createElement("button"); button.type = "button"; button.className = "bx-ai-media-btn"; button.textContent = "💾 Salvar na Mídia X"; button.onclick = async () => { try { current.savedResultId = await saveAsset({ kind: current.generatedResult.kind, mime: current.generatedResult.mime_type, dataUrl: current.generatedResult.data_url, url: current.generatedResult.content_url ? apiBase() + current.generatedResult.content_url : "", provider: current.generatedResult.provider }, `Resultado IA • ${current.context.reference || "passagem"}`, "ai"); button.textContent = "✓ Salvo na Mídia X"; button.disabled = true; mediaChanged(); setStatus("Resultado salvo na Mídia X e vinculado à passagem.", "ok"); } catch (error) { setStatus(`Falha ao salvar: ${error.message}`, "warn"); } }; return button; }

  function renderResult(result) {
    if (!layer) return;
    const canvas = $("[data-ai-canvas]", layer);
    const meta = $("[data-ai-result-meta]", layer);
    const actions = $("[data-ai-result-actions]", layer);
    if (!canvas) return;
    canvas.innerHTML = "";
    actions.innerHTML = "";
    current.generatedResult = result;
    current.savedResultId = "";
    if (result.kind === "image" && result.data_url) {
      const image = document.createElement("img");
      image.src = result.data_url;
      image.alt = "Imagem gerada para a passagem";
      canvas.appendChild(image);
      const download = document.createElement("a");
      download.className = "bx-ai-media-btn is-primary";
      download.href = result.data_url;
      download.download = "logos-master-x-cena-biblica.png";
      download.textContent = "⬇ Baixar imagem";
      actions.appendChild(download);
      actions.appendChild(saveResultButton());
    } else if (result.kind === "video" && result.data_url) {
      const video = document.createElement("video");
      video.controls = true;
      video.autoplay = false;
      video.src = result.data_url;
      canvas.appendChild(video);
      const download = document.createElement("a");
      download.className = "bx-ai-media-btn is-primary";
      download.href = result.data_url;
      download.download = "logos-master-x-cena-biblica.mp4";
      download.textContent = "⬇ Baixar vídeo";
      actions.appendChild(download);
      actions.appendChild(saveResultButton());
    } else if (result.kind === "video" && result.content_url) {
      canvas.innerHTML = `<span>Vídeo pronto. Clique em baixar ou aguarde a prévia.</span>`;
      const download = document.createElement("a");
      download.className = "bx-ai-media-btn is-primary";
      download.href = apiBase() + result.content_url;
      download.target = "_blank";
      download.rel = "noopener";
      download.textContent = "⬇ Baixar vídeo";
      actions.appendChild(download);
      actions.appendChild(saveResultButton());
    } else {
      renderCanvas("O provedor não devolveu uma mídia visualizável.");
    }
    if (meta) meta.textContent = `${result.provider || "provedor"} • ${result.model || "modelo"} • ${result.status || "concluído"}`;
  }

  async function pollVideo(result) {
    let attempt = 0;
    while (attempt < 40) {
      await new Promise((resolve) => window.setTimeout(resolve, 3000));
      if (!layer) return;
      attempt += 1;
      try {
        const payload = await fetchJson(result.poll_url);
        setStatus(`Renderizando vídeo… ${payload.progress || 0}%`, "normal");
        if (payload.status === "completed") {
          renderResult({ ...result, ...payload, content_url: payload.content_url || result.content_url });
          setStatus("Vídeo pronto.", "ok");
          return;
        }
        if (["failed", "expired", "cancelled"].includes(payload.status)) throw new Error(`Renderização terminou como ${payload.status}.`);
      } catch (error) {
        setStatus(`Falha ao acompanhar o vídeo: ${error.message}`, "warn");
        renderCanvas("O job foi criado, mas o acompanhamento falhou. Use o botão de download se estiver disponível.");
        return;
      }
    }
    setStatus("O vídeo ainda está renderizando. Você pode fechar esta janela e consultar o job depois.", "warn");
  }

  async function generate() {
    const button = $("[data-ai-generate]", layer);
    const provider = $("[data-ai-provider]", layer)?.value || "auto";
    const kind = current.kind;
    const rawPrompt = $("[data-ai-prompt]", layer)?.value.trim() || "";
    if (!rawPrompt) { setStatus("Escreva um prompt antes de gerar.", "warn"); return; }
    const generationContext = { ...(current.context || {}), kind };
    let prompt = buildVisualPrompt(rawPrompt, generationContext);
    const meta = visualMetadata(generationContext);
    let effectiveProvider = provider;
    if (current.referenceImageDataUrl) {
      if (provider === "openai") {
        setStatus("A imagem de referência só funciona com o Gemini (servidor/automático) ou com 🔑 Minha própria API. Troque o provedor para Gemini ou remova a referência.", "warn");
        return;
      }
      if (provider === "auto") effectiveProvider = "gemini";
      prompt += BX_REFERENCE_GUIDE;
    }
    if (!current.apiConfirmed) {
      const providerLabel = provider === "openai" ? "OpenAI" : provider === "gemini" ? "Gemini" : "o provedor configurado";
      const accepted = window.confirm(`Gerar ${kind === "video" ? "este vídeo" : "esta imagem"} usando ${providerLabel} pode consumir créditos da API. Deseja continuar?`);
      if (!accepted) { setStatus("Geração cancelada; nenhum crédito foi consumido.", "normal"); return; }
      current.apiConfirmed = true;
    }
    button.disabled = true;
    renderCanvas(kind === "video" ? "Enviando o pedido e iniciando o render…" : "Gerando imagem…");
    setStatus("Aguarde: a geração pode consumir créditos da API.", "normal");
    try {
      const body = {
        provider: effectiveProvider, kind, prompt,
        visual_title: meta.title,
        visual_reference: meta.reference,
        visual_place: meta.place,
        visual_stage: meta.stage,
        aspect_ratio: $("[data-ai-aspect]", layer)?.value || "16:9",
        resolution: $("[data-ai-resolution]", layer)?.value || "720p",
        size: $("[data-ai-size]", layer)?.value || "1280x720",
        seconds: Number($("[data-ai-seconds]", layer)?.value || 8),
        reference_image_data_url: current.referenceImageDataUrl || null
      };
      const result = await fetchJson("/api/bible/ai/media/generate", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      renderResult(result);
      if (result.kind === "video" && result.job_id && result.status !== "completed" && !result.data_url) pollVideo(result);
      else setStatus("Mídia gerada com sucesso.", "ok");
    } catch (error) {
      renderCanvas("Não foi possível gerar esta mídia.");
      setStatus(error.message, "warn");
    } finally {
      button.disabled = false;
    }
  }

  async function copyPrompt(openProvider) {
    const prompt = $("[data-ai-prompt]", layer)?.value || "";
    try {
      await navigator.clipboard.writeText(prompt);
      setStatus(openProvider ? `Prompt copiado. Vamos abrir o gerador de imagens ${openProvider === "gemini" ? "do Gemini" : "do ChatGPT"} — cole lá e gere na sua conta.` : "Prompt copiado para a área de transferência.", "ok");
    } catch (_) {
      setStatus("Selecione e copie o prompt manualmente; o navegador bloqueou a área de transferência.", "warn");
    }
    if (openProvider) window.open(openProvider === "gemini" ? "https://gemini.google.com/images" : "https://chatgpt.com/images", "_blank", "noopener");
  }

  /* 5.4.243 — "Usar minha própria API": o usuário cola a chave dele (Gemini) e
     o navegador chama a API diretamente, sem passar pelo servidor da Bíblia.
     Espelha app/ai/media_generation.py: mesmo endpoint /v1beta/interactions,
     header x-goog-api-key e formato de resposta (output_image/steps). */
  const GEMINI_MEDIA_ENDPOINT = "https://generativelanguage.googleapis.com/v1beta/interactions";
  const GEMINI_IMAGE_MODEL = "gemini-3.1-flash-image";

  function ownKeyCfg() {
    try {
      const raw = localStorage.getItem("logosx:aiOwnKey");
      if (!raw) return null;
      const cfg = JSON.parse(raw);
      return cfg && cfg.key ? { provider: String(cfg.provider || "gemini"), key: String(cfg.key), model: String(cfg.model || GEMINI_IMAGE_MODEL) } : null;
    } catch (_) { return null; }
  }
  function ownKeySave(key) {
    try { localStorage.setItem("logosx:aiOwnKey", JSON.stringify({ provider: "gemini", key: String(key || "").trim(), model: GEMINI_IMAGE_MODEL })); }
    catch (_) { throw new Error("O navegador bloqueou salvar a chave. Verifique o modo de navegação."); }
  }
  function ownKeyClear() {
    try { localStorage.removeItem("logosx:aiOwnKey"); } catch (_) {}
  }

  async function geminiRequestJson(endpoint, options) {
    const response = await fetch(endpoint, { cache: "no-store", ...options });
    let payload = {};
    try { payload = await response.json(); } catch (_) {}
    if (!response.ok) {
      const detail = (payload && (payload.error && payload.error.message || payload.message)) || ("Falha HTTP " + response.status);
      throw new Error(String(response.status) + ": " + String(detail).slice(0, 320));
    }
    return payload;
  }

  function geminiImageOutput(payload) {
    const convenience = payload && payload.output_image;
    if (convenience && convenience.data) return convenience;
    const steps = Array.isArray(payload && payload.steps) ? payload.steps : [];
    for (const step of steps) {
      const contents = Array.isArray(step && step.content) ? step.content : [];
      for (const content of contents) {
        if (content && content.type === "image" && content.data) return content;
      }
    }
    return null;
  }

  function friendlyOwnKeyError(error) {
    const message = String((error && error.message) || error || "");
    const status = Number((/^(\d{3}):/.exec(message) || [])[1] || 0);
    if (status === 400) return "O Gemini recusou o pedido (400): " + message.slice(5);
    if (status === 401 || status === 403) return "Sua chave foi recusada pela API (" + status + "). Confira e salve de novo em 🔑 Usar minha própria API.";
    if (status === 429) return "Limite de uso da sua chave (429). Aguarde um pouco e tente de novo.";
    if (!status && message.includes("Failed to fetch")) return "O navegador não conseguiu alcançar o Gemini (rede/CORS). Use ✨ Gerar com API (servidor) ou 📋 Copiar prompt.";
    return message || "Falha inesperada ao gerar pela sua chave.";
  }

  async function generateOwnKey() {
    if (!layer) return;
    if (current.kind === "video") { setStatus("🎬 Vídeo pela sua chave ainda não está liberado — use ✨ Gerar com API (servidor) ou 📋 Copiar prompt.", "warn"); return; }
    const rawPrompt = $("[data-ai-prompt]", layer)?.value.trim() || "";
    if (!rawPrompt) { setStatus("Escreva um prompt antes de gerar.", "warn"); return; }
    const cfg = ownKeyCfg();
    if (!cfg || !cfg.key) { setStatus("Cole e salve sua chave da API primeiro (🔑 Usar minha própria API).", "warn"); return; }
    const prompt = buildVisualPrompt(rawPrompt, { ...(current.context || {}), kind: "image" });
    let input = prompt;
    const refParts = bxImageParts(current.referenceImageDataUrl);
    if (refParts) input = refParts.concat({ type: "text", text: prompt });
    const body = { model: cfg.model, input, response_format: { type: "image", aspect_ratio: $("[data-ai-aspect]", layer)?.value || "16:9" } };
    const runButton = $("[data-ai-own-run]", layer);
    if (runButton) runButton.disabled = true;
    renderCanvas("Chamando o Gemini com a sua chave…");
    setStatus("Gerando imagem pela sua chave. Isso pode consumir créditos da sua conta.", "normal");
    try {
      const payload = await geminiRequestJson(GEMINI_MEDIA_ENDPOINT, { method: "POST", headers: { "Content-Type": "application/json", "x-goog-api-key": cfg.key }, body: JSON.stringify(body) });
      const output = geminiImageOutput(payload);
      if (!output) throw new Error("O Gemini concluiu sem devolver a imagem.");
      const mime = String(output.mime_type || "image/png");
      const data = String(output.data || "");
      if (!data) throw new Error("O Gemini devolveu a imagem vazia.");
      renderResult({ kind: "image", mime_type: mime, data_url: "data:" + mime + ";base64," + data, provider: "gemini", model: cfg.model, status: "completed", source: "own-key" });
      setStatus("Imagem gerada pela sua chave. Toque em 💾 Salvar na Mídia X (no resultado) se quiser guardar.", "ok");
    } catch (error) {
      renderCanvas("Não foi possível gerar pela sua chave.");
      setStatus(friendlyOwnKeyError(error), "warn");
    } finally {
      if (runButton) runButton.disabled = false;
    }
  }

  function clearObjectUrl() {
    if (objectUrl) URL.revokeObjectURL(objectUrl);
    objectUrl = "";
  }

  /* 5.4.246 — converte uma dataURL de imagem em "parts" do Gemini (imagem + texto).
     Retorna null se não for PNG/JPEG/WebP ou se estiver vazio. */
  function bxImageParts(dataUrl) {
    const match = /^data:(image\/(?:png|jpe?g|webp));base64,([A-Za-z0-9+/=]+)$/i.exec(String(dataUrl || ""));
    if (!match) return null;
    return [{ type: "image", data: match[2], mime_type: String(match[1]).toLowerCase() }];
  }
  const BX_REFERENCE_GUIDE = " A imagem de referência enviada deve guiar o estilo, o personagem e a cena desta geração — mantenha coerência visível com ela.";

  function handleUpload(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    clearObjectUrl();
    objectUrl = URL.createObjectURL(file);
    current.referenceImageDataUrl = "";
    current.referenceFile = { file, kind: file.type.startsWith("video/") ? "video" : "image", mime: file.type, size: file.size };
    const reference = $("[data-ai-reference]", layer);
    reference.classList.add("is-visible");
    reference.innerHTML = "";
    const preview = file.type.startsWith("video/") ? document.createElement("video") : document.createElement("img");
    preview.src = objectUrl;
    if (preview.tagName === "VIDEO") { preview.controls = true; preview.muted = true; }
    reference.appendChild(preview);
    const caption = document.createElement("small");
    caption.textContent = `${file.name} • ${(file.size / 1024 / 1024).toFixed(1)} MB`;
    reference.appendChild(caption);
    const tools = document.createElement("div"); tools.className = "bx-ai-media-reference-tools";
    const save = document.createElement("button"); save.type = "button"; save.className = "bx-ai-media-btn is-primary"; save.textContent = "💾 Salvar na Mídia X";
    save.onclick = async () => { try { current.savedUploadId = await saveAsset({ ...current.referenceFile, blob: file }, file.name, "local"); save.textContent = "✓ Salvo na Mídia X"; save.disabled = true; mediaChanged(); setStatus("Upload salvo na Mídia X e ligado à passagem.", "ok"); } catch (error) { setStatus(`Falha ao salvar upload: ${error.message}`, "warn"); } };
    const remove = document.createElement("button"); remove.type = "button"; remove.className = "bx-ai-media-btn is-danger"; remove.textContent = "🗑 Excluir";
    remove.onclick = async () => { if (current.savedUploadId) await mediaRemove(current.savedUploadId); clearObjectUrl(); current.referenceFile = null; current.referenceImageDataUrl = ""; reference.classList.remove("is-visible"); reference.innerHTML = ""; event.target.value = ""; setStatus("Mídia removida.", "ok"); mediaChanged(); };
    tools.append(save, remove); reference.appendChild(tools);
    if (file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onload = () => { current.referenceImageDataUrl = String(reader.result || ""); };
      reader.readAsDataURL(file);
      setStatus("Imagem anexada. No modo API, a referência é enviada ao Gemini; no OpenAI, use o prompt ou abra o ChatGPT Plus.", "ok");
    } else {
      setStatus("Vídeo anexado para visualização local. Nesta primeira ponte ele não é enviado automaticamente às APIs.", "ok");
    }
  }

  /* 5.4.244 — tela cheia nativa no cabeçalho (o alvo é a própria camada do gerador) */
  function isLayerFullscreen() {
    const el = document.fullscreenElement || document.webkitFullscreenElement;
    return !!(layer && el && el === layer);
  }
  function exitNativeFullscreen() {
    try {
      if (document.exitFullscreen) { const pr = document.exitFullscreen(); if (pr && typeof pr.catch === "function") pr.catch(() => {}); }
      else if (document.webkitExitFullscreen) document.webkitExitFullscreen();
    } catch (_) { /* sai da tela cheia mesmo se a API falhar aqui */ }
  }
  function syncFullscreenUi() {
    if (!layer) return;
    const button = $("[data-ai-fs]", layer);
    if (!button) return;
    const on = isLayerFullscreen();
    layer.classList.toggle("bx-ai-media-layer-fs", on);
    button.classList.toggle("is-active", on);
    button.setAttribute("aria-pressed", on ? "true" : "false");
    button.title = on ? "Sair da tela cheia" : "Tela cheia";
    const label = $(".bx-ai-media-fs-label", button);
    if (label) label.textContent = on ? "Sair da tela cheia" : "Tela cheia";
  }
  function toggleFullscreen() {
    if (!layer) return;
    if (isLayerFullscreen()) {
      exitNativeFullscreen();
      return;
    }
    const request = layer.requestFullscreen || layer.webkitRequestFullscreen;
    if (typeof request !== "function") return;
    try { request.call(layer); } catch (_) { /* fullscreen indisponível neste contexto — ignora */ }
  }
  function onFullscreenChange() {
    syncFullscreenUi();
  }
  /* 5.4.244 — guard anti-sequestro no PC: o hotfix de zoom/tela cheia do LOGOS
     (ui_x/ui-controls-zoom-fullscreen-v5434.js) registra clique em CAPTURE no
     document e leva qualquer botão cujo texto contenha "tela cheia" num contexto
     de leitura para o fullscreen do #workspace (irmão da nossa camada) — com
     stopImmediatePropagation, o handler do próprio botão nunca roda. O window vem
     ANTES do document no percurso de captura, então este guard dispara primeiro,
     corta o resto do percurso e faz o fullscreen NA PRÓPRIA camada do gerador. */
  function onFsGuardClick(event) {
    if (!layer) return;
    const target = event.target;
    if (!target || typeof target.closest !== "function") return;
    if (!target.closest(".bx-ai-media-layer [data-ai-fs]")) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    toggleFullscreen();
  }
  if (!window.__bxAiMediaFsGuard__) {
    window.__bxAiMediaFsGuard__ = true;
    window.addEventListener("click", onFsGuardClick, true);
  }

  function close() {
    if (!layer) return;
    if (batch) { batch.stopped = true; if (batch.abort) batch.abort.abort(); batch = null; }
    if (keydownHandler) document.removeEventListener("keydown", keydownHandler);
    document.removeEventListener("fullscreenchange", onFullscreenChange);
    document.removeEventListener("webkitfullscreenchange", onFullscreenChange);
    if (isLayerFullscreen()) exitNativeFullscreen();
    clearObjectUrl();
    layer.remove();
    layer = null;
    current = null;
  }

  function open(context = {}) {
    close();
    ensureStyle();
    current = { kind: context.kind === "video" ? "video" : "image", referenceImageDataUrl: "", context };
    currentQuality = "media";
    currentAspect = "16:9";
    promptChips.quality = "";
    promptChips.aspect = "";
    layer = document.createElement("div");
    layer.className = "bx-ai-media-layer";
    layer.setAttribute("role", "dialog");
    layer.setAttribute("aria-modal", "true");
    const scene = context.scene || {};
    const event = context.event || {};
    const ref = context.currentNarrativeRef || context.reference || event.ref || "passagem em estudo";
    layer.innerHTML = `
      <section class="bx-ai-media-card">
        <header class="bx-ai-media-head">
          <div><span class="bx-ai-media-kicker">GERADOR DE IA • IMAGENS E VÍDEOS</span><h2>${esc(scene.title || "Criação visual para estudo")}</h2><p>${esc(ref)}</p></div>
          <div class="bx-ai-media-headbtns">
            <button type="button" class="bx-ai-media-fs bx-ai-media-own-open" data-ai-batch aria-label="Gerar imagens em lote por capítulos" title="Lote de capítulos — gerar várias imagens em fila" aria-pressed="false"><span aria-hidden="true">⚡</span><span class="bx-ai-media-batchlbl">Lote</span></button>
            <button type="button" class="bx-ai-media-fs" data-ai-fs aria-label="Tela cheia" title="Tela cheia" aria-pressed="false"><span aria-hidden="true">⛶</span><span class="bx-ai-media-fs-label">Tela cheia</span></button>
            <button type="button" class="bx-ai-media-close" data-ai-close aria-label="Fechar gerador de IA">×</button>
          </div>
        </header>
        <div class="bx-ai-media-grid">
          <form class="bx-ai-media-form" data-ai-form>
            <div class="bx-ai-media-segment" role="tablist" aria-label="Tipo de mídia"><button type="button" class="is-active" data-ai-kind="image">🖼 Imagem</button><button type="button" data-ai-kind="video">🎬 Vídeo</button></div>
            <div class="bx-ai-media-segrow" data-ai-quality-wrap role="group" aria-label="Qualidade da imagem" title="Qualidade — altera o prompt em tempo real (gerar e copiar)"><span class="bx-ai-media-seglabel">Qualidade da imagem</span><button type="button" class="bx-ai-media-btn" data-ai-quality="baixa">Baixa</button><button type="button" class="bx-ai-media-btn is-active" data-ai-quality="media">Média</button><button type="button" class="bx-ai-media-btn" data-ai-quality="alta">Alta</button></div>
            <label>Prompt de criação<textarea data-ai-prompt>${esc(contextPrompt(context))}</textarea></label>
            <div class="bx-ai-media-actions">
              <select class="bx-ai-media-btn" data-ai-aspect aria-label="Proporção"><option value="16:9">16:9 paisagem</option><option value="9:16">9:16 vertical</option><option value="1:1">1:1 quadrado</option></select>
              <select class="bx-ai-media-btn" data-ai-resolution aria-label="Resolução do vídeo"><option value="720p">720p</option><option value="1080p">1080p</option></select>
              <select class="bx-ai-media-btn" data-ai-size aria-label="Tamanho do vídeo"><option value="1280x720">1280×720</option></select>
              <select class="bx-ai-media-btn" data-ai-seconds aria-label="Duração do vídeo"><option value="8">8 s</option><option value="16">16 s</option><option value="20">20 s</option></select>
            </div>
            <div class="bx-ai-media-actions"><button type="button" class="bx-ai-media-btn is-primary" data-ai-generate>✨ Gerar com API</button><button type="button" class="bx-ai-media-btn" data-ai-copy>📋 Copiar prompt</button></div>
            <div class="bx-ai-media-actions bx-ai-media-genrow"><button type="button" class="bx-ai-media-btn" data-ai-open-provider="gemini">🖼 Gerar imagem · Gemini ↗</button><button type="button" class="bx-ai-media-btn" data-ai-open-provider="openai">🖼 Gerar imagem · ChatGPT ↗</button></div>
            <span class="bx-ai-media-status" data-ai-status aria-live="polite">Consultando as APIs…</span>
          </form>
          <section class="bx-ai-media-output">            <div class="bx-ai-media-ctx">
              <div class="bx-ai-media-context"><strong>Contexto conectado</strong><br>${esc(scene.place?.name || "Lugar relacionado")} • ${esc(event.label || "etapa atual")}<br><span>${esc((context.verseText || "").slice(0, 260))}</span></div>
              <div class="bx-ai-media-uprow">
                <label class="bx-ai-media-upload">📎 Subir imagem ou vídeo do dispositivo<input type="file" data-ai-upload accept="image/png,image/jpeg,image/webp,video/mp4,video/webm"></label>
                <button type="button" class="bx-ai-media-btn" data-ai-scan>🔎 Escanear e vincular mídias</button>
              </div>
              <div class="bx-ai-media-reference" data-ai-reference></div>
            </div>
            <div class="bx-ai-media-output-head"><strong>Resultado da passagem</strong><span data-ai-result-meta>Pronto para criar</span></div><div class="bx-ai-media-canvas" data-ai-canvas><span>Escolha imagem ou vídeo e gere a primeira camada visual.</span></div><div class="bx-ai-media-result-actions" data-ai-result-actions></div><div class="bx-ai-media-result-meta">Use como reconstrução editorial de estudo. Para fatos históricos, mantenha a legenda de certeza e consulte as fontes do Atlas.</div>
              <div class="bx-ai-media-keys">
                <div class="bx-ai-media-provhead"><span>Provedores de IA prontos</span></div>
                <div class="bx-ai-media-provrow">
                  <label class="bx-ai-media-provlabel">Provedor da API<select data-ai-provider><option value="auto">Automático</option><option value="gemini">Gemini • verificando…</option><option value="openai">OpenAI • verificando…</option></select></label>
                  <button type="button" class="bx-ai-media-btn bx-ai-media-own-open" data-ai-own-open>🔑 Usar minha própria API</button>
                </div>
                <div class="bx-ai-media-keyrow">🔑 Sem chave de API ainda? Crie e copie a sua: <button type="button" data-ai-key-open="google">Google AI Studio ↗</button><button type="button" data-ai-key-open="openai">OpenAI ↗</button></div>
                <div class="bx-ai-media-own" data-ai-own hidden><div class="bx-ai-media-own-head"><strong>Gerar pela sua própria conta (sem o servidor)</strong><button type="button" class="bx-ai-media-own-x" data-ai-own-close aria-label="Fechar caixa da própria API" title="Fechar">×</button></div><label class="bx-ai-media-own-row">Provedor<select data-ai-own-provider><option value="gemini">Gemini — funciona direto no navegador</option><option value="openai" disabled>OpenAI — bloqueado no navegador (CORS)</option></select></label><label class="bx-ai-media-own-row">Chave da API<input type="password" data-ai-own-key placeholder="Cole sua chave Gemini (começa com AIza…)" autocomplete="off"></label><span class="bx-ai-media-hint">A chave fica só neste navegador e chama o Gemini daqui. Ela não vai para o servidor da Bíblia.</span><div class="bx-ai-media-actions"><button type="button" class="bx-ai-media-btn" data-ai-own-save>💾 Salvar minha chave</button><button type="button" class="bx-ai-media-btn is-primary" data-ai-own-run>✨ Gerar pela minha chave</button><button type="button" class="bx-ai-media-btn is-danger" data-ai-own-clear>🗑 Remover</button></div></div>
                <span class="bx-ai-media-security"><span class="bx-lock" aria-hidden="true">🔒</span><span><b>Suas chaves nunca passam pela Bíblia.</b> Ela não recebe a sua senha. Quando você usa a própria chave, ela fica <b>somente neste navegador</b> e fala direto com o provedor. O ZIP do projeto também não guarda segredo.</span></span>
              </div>
              </section>
        </div>
      </section>`;
    document.body.appendChild(layer);
    $("[data-ai-close]", layer).addEventListener("click", close);
    $("[data-ai-fs]", layer).addEventListener("click", (event) => { event.stopPropagation(); toggleFullscreen(); });
    $("[data-ai-batch]", layer).addEventListener("click", () => openBatch());
    document.addEventListener("fullscreenchange", onFullscreenChange);
    document.addEventListener("webkitfullscreenchange", onFullscreenChange);
    layer.addEventListener("click", (event) => { if (event.target === layer) close(); });
    $("[data-ai-form]", layer).addEventListener("submit", (event) => event.preventDefault());
    $("[data-ai-generate]", layer).addEventListener("click", generate);
    $("[data-ai-copy]", layer).addEventListener("click", () => copyPrompt());
    $("[data-ai-scan]", layer).addEventListener("click", () => scanMediaLibrary().catch((error) => setStatus(`Falha ao escanear a biblioteca: ${error.message}`, "warn")));
    $("[data-ai-upload]", layer).addEventListener("change", handleUpload);
    $("[data-ai-provider]", layer).addEventListener("change", () => {
      if (current.referenceImageDataUrl && $("[data-ai-provider]", layer).value === "openai") setStatus("A imagem de referência será usada pelo Gemini; no OpenAI use o prompt ou abra o ChatGPT Plus.", "warn");
    });
    layer.querySelectorAll("[data-ai-kind]").forEach((button) => button.addEventListener("click", () => {
      current.kind = button.dataset.aiKind || "image";
      layer.querySelectorAll("[data-ai-kind]").forEach((item) => item.classList.toggle("is-active", item === button));
      layer.querySelector("[data-ai-resolution]").style.display = current.kind === "video" ? "inline-block" : "none";
      layer.querySelector("[data-ai-size]").style.display = current.kind === "video" ? "inline-block" : "none";
      layer.querySelector("[data-ai-seconds]").style.display = current.kind === "video" ? "inline-block" : "none";
      const qWrap = layer.querySelector("[data-ai-quality-wrap]");
      if (qWrap) qWrap.hidden = current.kind !== "image";
      syncPromptChips();
    }));
    layer.querySelector(`[data-ai-kind='${current.kind}']`)?.click();
    layer.querySelectorAll("[data-ai-quality]").forEach((button) => button.addEventListener("click", () => setQualityLevel(button.dataset.aiQuality)));
    const aspectSelect = $("[data-ai-aspect]", layer);
    if (aspectSelect) {
      aspectSelect.value = currentAspect;
      aspectSelect.addEventListener("change", () => setAspectLevel(aspectSelect.value));
    }
    layer.querySelectorAll("[data-ai-key-open]").forEach((button) => button.addEventListener("click", () => {
      const url = button.dataset.aiKeyOpen === "openai" ? "https://platform.openai.com/api-keys" : "https://aistudio.google.com/api-keys";
      window.open(url, "_blank", "noopener");
      setStatus("Abra a página, copie sua chave e cole em 🔑 Usar minha própria API.", "ok");
    }));
    layer.querySelectorAll("[data-ai-open-provider]").forEach((button) => button.addEventListener("click", () => copyPrompt(button.dataset.aiOpenProvider)));
    /* 5.4.243 — gancho "Usar minha própria API": chave do usuário, direto no navegador */
    const ownBox = $("[data-ai-own]", layer);
    const ownKeyInput = $("[data-ai-own-key]", layer);
    const ownStored = ownKeyCfg();
    if (ownStored && ownKeyInput) ownKeyInput.value = ownStored.key || "";
    const ownOpenBtn = $("[data-ai-own-open]", layer);
    const setOwnState = (open) => {
      if (ownBox) ownBox.hidden = !open;
      if (ownOpenBtn) { ownOpenBtn.classList.toggle("is-open", open); ownOpenBtn.setAttribute("aria-expanded", open ? "true" : "false"); }
    };
    ownOpenBtn?.addEventListener("click", () => {
      const opening = !ownBox || ownBox.hidden;
      setOwnState(opening);
      if (opening) ownKeyInput?.focus();
    });
    $("[data-ai-own-close]", layer)?.addEventListener("click", () => setOwnState(false));
    setOwnState(false);
    $("[data-ai-own-save]", layer)?.addEventListener("click", () => { const key = String(ownKeyInput?.value || "").trim(); if (!key) { setStatus("Cole sua chave da API antes de salvar.", "warn"); return; } try { ownKeySave(key); setStatus("Chave salva neste navegador. Agora é só tocar em ✨ Gerar pela minha chave.", "ok"); } catch (error) { setStatus(error.message, "warn"); } });
    $("[data-ai-own-clear]", layer)?.addEventListener("click", () => { try { ownKeyClear(); } catch (_) {} if (ownKeyInput) ownKeyInput.value = ""; setStatus("Chave removida deste navegador.", "ok"); });
    $("[data-ai-own-run]", layer)?.addEventListener("click", () => { generateOwnKey(); });
    keydownHandler = (event) => {
      if (event.key !== "Escape") return;
      if (isLayerFullscreen()) { /* 1º Esc sai da tela cheia; 2º fecha o gerador */ toggleFullscreen(); return; }
      close();
    };
    document.addEventListener("keydown", keydownHandler);
    $("[data-ai-close]", layer).focus();
    refreshStatus();
  }

/* ============ LOTE DE CAPÍTULOS (5.4.244 — reescrito, "livros do servidor") ============
   Escopo: Livro → do capítulo → até o capítulo → fatiar por versículos.
   Fonte dos livros/capítulos/versículos: servidor /api/bible (SQLite) primeiro,
   fallback para o IndexedDB (tradução importada/offline). Os 4 campos são
   dropdowns que ABREM PARA BAIXO e rolam (estilo "abrir do livro").
   Gera 1-a-1 (chave própria do navegador ou servidor) e salva CADA imagem na
   Mídia X com a referência. Progresso/⏸/⏹/abort. */

  /* ---- Estilos dos dropdowns roláveis (injetados uma vez) ---- */
  function ensureBatchStyle() {
    if (document.getElementById("bxAiMediaBatchStyle")) return;
    const style = document.createElement("style");
    style.id = "bxAiMediaBatchStyle";
    style.textContent = `
      .bx-ai-batch-seclabel{display:block;color:#f4c76b;font-size:.72rem;font-weight:900;letter-spacing:.12em;text-transform:uppercase;margin:0 0 10px}
      .bx-ai-batch-seclabel+.bx-dd,.bx-ai-batch-seclabel+.bx-dd-row{margin-top:0}
      .bx-dd{position:relative;margin:0 0 13px;min-width:0}
      .bx-dd-row{display:flex;gap:10px;margin:0}
      .bx-dd-row .bx-dd{flex:1;min-width:0;margin-bottom:13px}
      .bx-dd-label{display:block;color:#bdd0e2;font-size:.82rem;font-weight:800;margin:0 0 6px}
      .bx-dd-trigger{width:100%;box-sizing:border-box;display:flex;align-items:center;gap:8px;border:1px solid rgba(134,200,255,.26);border-radius:11px;background:#071727;color:#eef8ff;padding:.62rem .8rem;font:inherit;font-size:.95rem;text-align:left;cursor:pointer;min-height:44px}
      .bx-dd-trigger:hover{border-color:rgba(98,228,210,.55)}
      .bx-dd-trigger.is-open{border-color:#62e4d2}
      .bx-dd-val{flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;color:#eaf6ff;font-weight:700}
      .bx-dd-caret{flex:0 0 auto;color:#f4c76b;font-size:.8rem;line-height:1}
      .bx-dd-panel{position:absolute;top:calc(100% + 4px);left:0;right:0;z-index:60;max-height:min(320px,48vh);overflow:auto;border:1px solid rgba(134,200,255,.34);border-radius:13px;background:#0b2034;box-shadow:0 20px 50px rgba(0,0,0,.62)}
      .bx-dd-panel[hidden]{display:none}
      .bx-ai-batch-cfg.is-ddown{overflow:visible}
      .bx-dd-search{position:sticky;top:0;z-index:2;background:#0b2034;padding:8px;border-bottom:1px solid rgba(134,200,255,.16)}
      .bx-dd-search input{width:100%;box-sizing:border-box;border:1px solid rgba(134,200,255,.24);border-radius:9px;background:#071727;color:#eef8ff;padding:.5rem .62rem;font:inherit;outline:none}
      .bx-dd-search input:focus{border-color:#62e4d2}
      .bx-dd-list{padding:5px}
      .bx-dd-opt{display:flex;align-items:center;justify-content:space-between;gap:10px;width:100%;text-align:left;border:0;background:transparent;color:#d7e6f4;padding:.52rem .72rem;font:inherit;font-size:.92rem;cursor:pointer;border-radius:9px}
      .bx-dd-opt:hover{background:rgba(20,72,96,.55);color:#fff}
      .bx-dd-opt.is-sel{background:rgba(244,199,107,.18);color:#ffe9ae}
      .bx-dd-opt span{min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
      .bx-dd-opt small{flex:0 0 auto;color:#86a2b8;font-size:.72rem}
      .bx-dd-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(56px,1fr));gap:6px;padding:8px}
      .bx-dd-num{border:1px solid rgba(134,200,255,.18);border-radius:9px;background:rgba(7,23,39,.7);color:#dceaf7;padding:.4rem 0;font:inherit;font-size:.92rem;cursor:pointer;text-align:center}
      .bx-dd-num:hover{border-color:rgba(98,228,210,.6);color:#baf6ec}
      .bx-dd-num.is-sel{border-color:#f4c76b;background:rgba(244,199,107,.2);color:#ffe9ae}
      .bx-dd-empty{color:#86a2b8;font-size:.85rem;padding:14px;text-align:center}
      @media(max-width:800px){.bx-dd-panel{max-height:min(300px,42vh)}.bx-dd-grid{grid-template-columns:repeat(auto-fill,minmax(48px,1fr))}}
      .bx-ai-batch-ref{margin:2px 0 10px;padding:10px;border:1px solid rgba(98,228,210,.18);border-radius:13px;background:rgba(7,23,39,.4)}
      .bx-ai-batch-ref .bx-ai-media-upload{margin:0}
      .bx-ai-batch-refhint{display:block;color:#86a2b8;font-size:.72rem;line-height:1.35;margin:8px 2px 0}
      .bx-ai-batch-grid .bx-ai-media-reference img{max-height:150px}
    `;
    document.head.appendChild(style);
  }

  let batch = null;

  function bxBStatus(message, tone) { setStatus(message, tone); }

  function bxBK(value) {
    return String(value || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "").trim();
  }
  function versesDB() {
    return new Promise((resolve) => {
      let db = null;
      const r = indexedDB.open("logosx-bible", 15);
      r.onupgradeneeded = () => { const d = r.result; if (!d.objectStoreNames.contains("verses")) d.createObjectStore("verses", { keyPath: "id" }); };
      r.onerror = () => resolve([]);
      r.onsuccess = () => {
        db = r.result;
        try {
          const tx = db.transaction("verses", "readonly");
          const req = tx.objectStore("verses").getAll();
          req.onsuccess = () => { const rows = req.result || []; try { db.close(); } catch (_) {} resolve(rows); };
          req.onerror = () => { try { db.close(); } catch (_) {} resolve([]); };
        } catch (_) { try { db.close(); } catch (_2) {} resolve([]); }
      };
    });
  }

  /* ---- Fonte real: tradução que o leitor está usando ---- */
  function batchTranslation() {
    try { return String(document.querySelector("#bVersion")?.value || "porbr2018"); } catch (_) { return "porbr2018"; }
  }
  function bxApiBooks() {
    return fetchJson("/api/bible/books?translation=" + encodeURIComponent(batchTranslation()));
  }
  function bxApiChaptersOf(code) {
    return fetchJson("/api/bible/chapters?translation=" + encodeURIComponent(batchTranslation()) + "&book=" + encodeURIComponent(code));
  }
  function bxApiChapterVerses(label, chapter) {
    return fetchJson("/api/bible/reference?translation=" + encodeURIComponent(batchTranslation()) + "&ref=" + encodeURIComponent(label + " " + chapter) + "&language=" + (batchTranslation() === "engwebp" ? "en" : "pt")).then((j) => (j.verses || []).map((v) => ({ book: label, chapter: Number(chapter), verse: Number(v.verse), text: String(v.text || "") })));
  }

  /* Catálogo: servidor primeiro; se indisponível/sem itens, cai no IndexedDB. */
  async function bxBatchLoadBooks() {
    try {
      const j = await bxApiBooks();
      const items = (j && j.items) || [];
      if (items.length) {
        const tr = batchTranslation();
        return items.map((x) => ({ code: String(x.code), label: (tr === "engwebp" ? (x.name_en || x.name_pt) : (x.name_pt || x.name_en)) || String(x.code), chapters: Math.max(1, Number(x.chapters) || 1) }));
      }
    } catch (_) {}
    const rows = await versesDB();
    const grouped = new Map();
    rows.forEach((row) => {
      const book = String(row.book || "").trim();
      if (!book || row.chapter == null) return;
      const key = bxBK(book);
      if (!grouped.has(key)) grouped.set(key, { label: book, rows: [] });
      grouped.get(key).rows.push(row);
    });
    const books = [];
    Array.from(grouped.values()).forEach((g) => {
      const max = g.rows.reduce((m, r) => Math.max(m, Number(r.chapter) || 0), 0);
      books.push({ code: "idb-" + bxBK(g.label), label: g.label, chapters: Math.max(1, max), _idb: g });
    });
    if (books.length) return books;
    return [];
  }

  /* Capítulos/versículos de um livro (guarda o meta por livro). */
  async function bxBatchLoadChapters(entry) {
    if (!entry || !batch) return { list: [] };
    if (batch._chapters && batch._chapters.code === entry.code) return batch._chapters;
    if (batch._chaptersLoading) return batch._chaptersLoading;
    batch._chaptersLoading = (async () => {
      let list = [];
      if (batch.source === "server") {
        try {
          const j = await bxApiChaptersOf(entry.code);
          list = (j.items || []).map((x) => ({ chapter: Number(x.chapter), verses: Number(x.verse_count) || 0 }));
        } catch (_) {}
        if (!list.length) { for (let c = 1; c <= (entry.chapters || 1); c++) list.push({ chapter: c, verses: 0 }); }
      } else {
        const map = new Map();
        (entry._idb ? entry._idb.rows : []).forEach((r) => {
          const c = Number(r.chapter);
          if (c) { const o = map.get(c) || { chapter: c, verses: 0 }; o.verses += 1; map.set(c, o); }
        });
        list = Array.from(map.values()).sort((a, b) => a.chapter - b.chapter);
        if (!list.length) { for (let c = 1; c <= (entry.chapters || 1); c++) list.push({ chapter: c, verses: 0 }); }
      }
      batch._chapters = { code: entry.code, list };
      return batch._chapters;
    })();
    const meta = await batch._chaptersLoading;
    batch._chaptersLoading = null;
    return meta;
  }

  /* Versículos de UM capítulo: servidor → fallback IndexedDB → []. Cacheado. */
  async function bxBatchChapterRows(entry, chapter) {
    if (!batch) return [];
    const key = entry.code + "|" + chapter;
    if (batch._verseCache.has(key)) return batch._verseCache.get(key);
    if (batch._versePending.has(key)) return batch._versePending.get(key);
    const load = (async () => {
      if (batch.source === "server") {
        try {
          const rows = await bxApiChapterVerses(entry.label, chapter);
          if (rows && rows.length) { rows.sort((a, b) => Number(a.verse) - Number(b.verse)); return rows; }
        } catch (_) {}
        const all = await versesDB();
        const idbRows = all.filter((r) => bxBK(r.book) === bxBK(entry.label) && Number(r.chapter) === chapter);
        if (idbRows.length) { idbRows.sort((a, b) => Number(a.verse) - Number(b.verse)); return idbRows; }
        return [];
      }
      const all = entry._idb ? entry._idb.rows : [];
      return all.filter((r) => Number(r.chapter) === chapter).sort((a, b) => Number(a.verse) - Number(b.verse));
    })();
    batch._versePending.set(key, load);
    const rows = await load;
    batch._versePending.delete(key);
    batch._verseCache.set(key, rows);
    return rows;
  }

  /* Divisão do capítulo: por fatiamento N ou por versículo. */
  function bxBatchSplitRows(rows, density) {
    if (density === "verse") return rows.map((r) => [r]);
    const count = Math.max(1, Math.min(Number(density) || 1, rows.length));
    return bxBatchChunks(rows, count);
  }
  function bxBatchChunks(sorted, count) {
    if (!sorted.length) return [];
    const k = Math.max(1, Math.min(Number(count) || 1, sorted.length));
    if (k === 1) return [sorted];
    const groups = [];
    let start = 0;
    for (let g = 1; g <= k; g++) {
      const end = Math.round((g * sorted.length) / k);
      groups.push(sorted.slice(start, end));
      start = end;
    }
    return groups.filter((group) => group.length);
  }
  function bxBatchRef(bookLabel, chapter, group, wholeChapter) {
    if (wholeChapter) return bookLabel + " " + chapter;
    const first = Number(group[0].verse);
    const last = Number(group[group.length - 1].verse);
    return bookLabel + " " + chapter + ":" + first + (group.length > 1 ? "-" + last : "");
  }
  function bxBatchExcerpt(group, max) {
    return group.map((row) => String(row.text || "")).join(" ").replace(/\s+/g, " ").trim().slice(0, Number(max) || 900);
  }
  function bxBatchPoolMap(items, worker, size) {
    if (!items.length) return Promise.resolve([]);
    const out = new Array(items.length);
    let i = 0;
    const limit = Math.max(1, Math.min(size || 6, items.length));
    const runners = [];
    for (let r = 0; r < limit; r++) {
      runners.push((async () => {
        while (true) {
          const j = i++;
          if (j >= items.length) return;
          out[j] = await worker(items[j], j);
        }
      })());
    }
    return Promise.all(runners).then(() => out);
  }
  async function bxBatchBuildItems() {
    const out = [];
    if (!batch || !batch.bookEntry) return out;
    const entry = batch.bookEntry;
    const from = Math.max(1, Number(batch.from) || 1);
    const to = Math.max(from, Number(batch.to) || from);
    const meta = await bxBatchLoadChapters(entry);
    if (!batch) return out;
    const wanted = (meta.list || []).filter((c) => c.chapter >= from && c.chapter <= to).map((c) => c.chapter);
    await bxBatchPoolMap(wanted, (ch) => bxBatchChapterRows(entry, ch), 6);
    if (!batch) return out;
    let index = 0;
    for (const chapter of wanted) {
      const rows = batch._verseCache.get(entry.code + "|" + chapter) || [];
      if (!rows.length) continue;
      const groups = bxBatchSplitRows(rows, batch.density);
      const chapterRef = entry.label + " " + chapter;
      groups.forEach((group, gi) => {
        const many = groups.length > 1;
        const ref = many ? bxBatchRef(entry.label, chapter, group, false) : chapterRef;
        out.push({ index: index++, chapter, ref, chapterRef, seg: many ? gi + 1 + "/" + groups.length : "", excerpt: bxBatchExcerpt(group, 900), range: group.map((r) => Number(r.verse)), state: "pendente", error: "" });
      });
    }
    return out;
  }

  function bxBatchPrompt(item, useOwn, quality, aspect) {
    const q = QUALITY_PHRASES[quality] || QUALITY_PHRASES.media;
    const a = ASPECT_PHRASES[aspect] || ASPECT_PHRASES["16:9"];
    const text = item.excerpt ? " Trecho: “" + item.excerpt + "”" : "";
    const scope = item.chapterRef && item.chapterRef !== item.ref ? " (relato de " + item.chapterRef + ")" : "";
    const base = ("Ilustre para estudo bíblico a passagem " + item.ref + scope + text + " Produza uma reconstrução editorial cinematográfica, respeitosa e historicamente prudente, coerente com o antigo Oriente.").replace(/\s+/g, " ").trim();
    return buildVisualPrompt(base + "\n\n" + q + "\n\n" + a, {});
  }

  async function bxBatchRequestImage(prompt, opts) {
    const ctrl = new AbortController();
    if (batch) { batch.ctrl = ctrl; batch.abort = ctrl; }
    const signal = ctrl.signal;
    if (opts.useOwn) {
      const cfg = ownKeyCfg();
      if (!cfg || !cfg.key) throw new Error("Sua chave não está mais salva neste navegador. Salve-a em 🔑 Usar minha própria API ou gere com a API do servidor.");
      const refParts = opts.referenceImageDataUrl ? bxImageParts(opts.referenceImageDataUrl) : null;
      const input = refParts ? refParts.concat({ type: "text", text: prompt }) : prompt;
      const body = { model: cfg.model, input, response_format: { type: "image", aspect_ratio: opts.aspect } };
      const payload = await geminiRequestJson(GEMINI_MEDIA_ENDPOINT, { method: "POST", headers: { "Content-Type": "application/json", "x-goog-api-key": cfg.key }, body: JSON.stringify(body), signal });
      const output = geminiImageOutput(payload);
      if (!output) throw new Error("O Gemini concluiu sem devolver a imagem.");
      const mime = String(output.mime_type || "image/png");
      const data = String(output.data || "");
      if (!data) throw new Error("O Gemini devolveu a imagem vazia.");
      return { kind: "image", mime_type: mime, data_url: "data:" + mime + ";base64," + data, provider: "gemini", model: cfg.model };
    }
    const body = {
      provider: opts.provider || "auto", kind: "image", prompt,
      visual_title: opts.title || "Lote de capítulos",
      visual_reference: opts.ref || "",
      visual_place: opts.place || "",
      visual_stage: opts.stage || "lote de capítulos",
      aspect_ratio: opts.aspect || "16:9",
      resolution: "720p", size: "1280x720", seconds: 8,
      reference_image_data_url: opts.referenceImageDataUrl || null
    };
    const result = await fetchJson("/api/bible/ai/media/generate", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body), signal });
    if (!result || result.kind !== "image" || !result.data_url) throw new Error((result && (result.status || result.detail)) || "O provedor não devolveu a imagem pronta.");
    return { kind: "image", mime_type: result.mime_type || "image/png", data_url: result.data_url, provider: result.provider || opts.provider, model: result.model || "" };
  }
  async function bxBatchSave(asset, item) {
    const row = {
      id: "lote-" + Date.now() + "-" + item.index + "-" + Math.random().toString(36).slice(2, 7),
      title: "IA lote • " + item.ref,
      type: "image", mime: asset.mime_type,
      reference: item.ref,
      relatedReferences: [],
      description: "Gerada em lote para " + item.ref + (item.seg ? " (parte " + item.seg + ")" : "") + ".",
      tags: ["atelie-ia", "lote", "image", "passagem"],
      credits: "Gerado via " + (asset.provider || "API"),
      license: "Resultado gerado — consulte os termos do provedor",
      sourceUrl: asset.data_url, thumbUrl: asset.data_url, blob: null,
      size: Number(asset.size || 0), sourceKind: "ai", place: "", createdAt: new Date().toISOString()
    };
    if (typeof window.mediaPutMany === "function") return window.mediaPutMany([row]);
    return mediaPut(row);
  }

  /* ---- Dropdowns roláveis (abrem para baixo) ---- */
  let ddOpen = null;
  let ddRows = {};
  let ddSel = {};
  function bxDDRender(which, filter) {
    const list = $('[data-dd-list="' + which + '"]', layer);
    if (!list) return;
    const all = ddRows[which] || [];
    const f = String(filter || "").toLowerCase().trim();
    const rows = f ? all.filter((r) => String(r.label || r.value).toLowerCase().indexOf(f) !== -1 || String(r.note || "").toLowerCase().indexOf(f) !== -1) : all;
    if (!rows.length) { list.innerHTML = '<div class="bx-dd-empty">Sem opções para “' + esc(f) + '”</div>'; return; }
    const sel = ddSel[which];
    if (which === "from" || which === "to") {
      list.innerHTML = '<div class="bx-dd-grid">' + rows.map((r) => '<button type="button" class="bx-dd-num' + (sel === r.value ? " is-sel" : "") + '" data-dd-pick="' + which + '" data-dd-pickval="' + esc(r.value) + '">' + esc(r.label) + "</button>").join("") + "</div>";
    } else {
      list.innerHTML = rows.map((r) => '<button type="button" class="bx-dd-opt' + (sel === r.value ? " is-sel" : "") + '" data-dd-pick="' + which + '" data-dd-pickval="' + esc(r.value) + '"><span>' + esc(r.label) + "</span>" + (r.note ? "<small>" + esc(r.note) + "</small>" : "") + "</button>").join("");
    }
  }
  function bxDDRows(which, rows) { ddRows[which] = rows || []; }
  function bxDDSet(which, rows, value) {
    ddRows[which] = rows || [];
    if (value !== undefined && ddRows[which].some((r) => r.value === value)) ddSel[which] = value;
    else if (ddRows[which].length) ddSel[which] = ddRows[which][0].value;
    else ddSel[which] = "";
    bxDDRefreshVal(which);
  }
  function bxDDRefreshVal(which) {
    const label = (ddRows[which] || []).find((r) => r.value === ddSel[which]);
    const el = $('[data-dd-val="' + which + '"]', layer);
    if (el) el.textContent = (label && label.label) || "—";
  }
  function bxDDOpen(which) {
    bxDDClose();
    const panel = $('[data-dd-panel="' + which + '"]', layer);
    if (!panel) return;
    const cfg = $(".bx-ai-batch-cfg", layer);
    if (cfg) cfg.classList.add("is-ddown");
    const find = $('[data-dd-find="' + which + '"]', layer);
    if (find) find.value = "";
    bxDDRender(which, "");
    panel.hidden = false;
    const tr = $('[data-dd-open="' + which + '"]', layer);
    if (tr) tr.classList.add("is-open");
    ddOpen = panel;
    if (find) try { find.focus({ preventScroll: true }); } catch (_) {}
  }
  function bxDDClose() {
    if (ddOpen) {
      ddOpen.hidden = true;
      const which = ddOpen.dataset.ddPanel;
      const tr = which && $('[data-dd-open="' + which + '"]', layer);
      if (tr) tr.classList.remove("is-open");
    }
    ddOpen = null;
    const cfg = $(".bx-ai-batch-cfg", layer);
    if (cfg) cfg.classList.remove("is-ddown");
  }
  function bxDDSyncOpen() {
    /* Se o usuário abriu um dropdown antes de os capítulos/livros terminarem de carregar,
       repinta o painel aberto quando as opções chegam (senão fica "Sem opções" morto). */
    if (!ddOpen || !layer) return;
    const which = ddOpen.dataset.ddPanel;
    if (!which) return;
    const find = $('[data-dd-find="' + which + '"]', layer);
    bxDDRender(which, find ? find.value : "");
  }

  function bxBatchStatusLine() {
    if (!batch || !layer) return;
    const total = (batch.items || []).length;
    const who = batch.useOwn ? "sua chave Gemini" : batch.provider === "auto" ? "API do servidor (Automático)" : batch.provider === "gemini" ? "Gemini do servidor" : "OpenAI do servidor";
    const densityLabel = (ddRows.density || []).find((r) => r.value === String(batch.density))?.label || "";
    bxBStatus(total ? "Fila: " + total + " imagem(ns) · " + (batch.bookLabel || "") + " cap. " + (batch.from || 1) + "–" + (batch.to || 1) + " · " + densityLabel + " · via " + who + "." : "Sem versículos nesse trecho — confira o livro e os capítulos.", total ? "ok" : "warn");
  }
  async function bxBatchPreview() {
    if (!batch || !layer || batch.running) return;
    try {
      bxBStatus("Preparando a fila…", "ok");
      const items = await bxBatchBuildItems();
      if (!batch || !layer) return;
      batch.items = items;
      batch.i = 0;
      bxBatchList();
      bxBatchCounter();
      bxBatchStatusLine();
    } catch (error) {
      bxBStatus("Falha ao montar o lote: " + String(error && error.message || error).slice(0, 160), "warn");
    }
  }

  async function bxBatchFillChapters() {
    if (!batch || !batch.bookEntry || !layer) return;
    const token = (batch._scopeToken = (batch._scopeToken || 0) + 1);
    const entry = batch.bookEntry;
    bxBStatus("Carregando os capítulos de " + entry.label + "…", "ok");
    const meta = await bxBatchLoadChapters(entry);
    if (!batch || token !== batch._scopeToken || batch.bookEntry !== entry) return;
    const chs = (meta.list || []).map((c) => c.chapter);
    const last = chs.length ? Math.max.apply(null, chs) : (entry.chapters || 1);
    batch.bookMax = last;
    if (batch.from > last) batch.from = 1;
    if (batch.to > last || batch.to < 1) batch.to = Math.min(1, last);
    const noteFor = (c) => { const o = (meta.list || []).find((x) => x.chapter === c); return o && o.verses ? o.verses + " versículos" : ""; };
    const rowsFor = (c) => ({ value: String(c), label: String(c), note: noteFor(c) });
    const fromRows = chs.map(rowsFor);
    const toRows = chs.map(rowsFor);
    bxDDRows("from", fromRows);
    bxDDRows("to", toRows);
    bxDDSet("from", fromRows, String(batch.from));
    bxDDSet("to", toRows, String(batch.to));
    bxBatchFillDensity();
    bxDDSyncOpen();
    bxBatchPreview();
  }

  function bxBatchFillDensity() {
    if (!batch || !layer) return;
    const single = batch.from === batch.to;
    const opts = [
      { value: "1", label: "1 · capítulo inteiro", note: "1 imagem por capítulo" },
      { value: "2", label: "2 · ~metade", note: "imagens por capítulo" },
      { value: "3", label: "3 · ~terço", note: "imagens por capítulo" },
      { value: "4", label: "4 · ~quarto", note: "imagens por capítulo" },
      { value: "6", label: "6 · ~sexto", note: "imagens por capítulo" },
      { value: "10", label: "10 · mais fino", note: "imagens por capítulo" }
    ];
    if (single) opts.push({ value: "verse", label: "por versículo", note: "1 imagem por versículo" });
    let sel = String(batch.density);
    if ((sel === "verse" && !single) || !opts.some((o) => o.value === sel)) sel = "1";
    bxDDSet("density", opts, sel);
    batch.density = ddSel.density === "verse" ? "verse" : Number(ddSel.density) || 1;
    bxDDSyncOpen();
  }

  function bxPickChapter(which, value) {
    if (!batch) return;
    const v = Number(value) || 1;
    if (which === "from") {
      batch.from = v;
      if (batch.to < v) { batch.to = v; ddSel.to = String(v); bxDDRefreshVal("to"); }
    } else {
      batch.to = v;
      if (batch.from > v) { batch.from = v; ddSel.from = String(v); bxDDRefreshVal("from"); }
    }
    bxBatchFillDensity();
    bxBatchPreview();
  }
  function bxPickBook(code) {
    if (!batch) return;
    const entry = (batch.books || []).find((x) => x.code === code);
    if (!entry) return;
    batch.bookEntry = entry;
    batch.bookCode = entry.code;
    batch.bookLabel = entry.label;
    batch.bookMax = entry.chapters;
    batch._verseCache.clear();
    batch._chapters = null;
    batch._chaptersLoading = null;
    batch.from = 1;
    batch.to = 1;
    bxDDRefreshVal("from");
    bxDDRefreshVal("to");
    bxBatchFillChapters();
  }
  function bxBatchPick(which, value) {
    if (batch && batch.running) { bxBStatus("Lote em andamento — pare ou aguarde antes de mudar o trecho.", "warn"); return; }
    ddSel[which] = value;
    bxDDRefreshVal(which);
    bxDDClose();
    if (which === "book") bxPickBook(value);
    else if (which === "from" || which === "to") bxPickChapter(which, value);
    else if (which === "density") {
      batch.density = value === "verse" ? "verse" : Number(value) || 1;
      bxBatchPreview();
    }
  }

  /* ---- Fila / controle ---- */
  function bxBatchItemNode(index) {
    return layer && layer.querySelector('[data-it="' + index + '"]');
  }
  function bxBatchRenderItem(item) {
    const node = bxBatchItemNode(item.index);
    if (!node) return;
    node.className = "bx-ai-batch-item" + (item.state === "ok" ? " is-ok" : item.state === "fail" ? " is-fail" : item.state === "run" ? " is-run" : "");
    const th = node.querySelector("[data-it-th]");
    if (th && item.dataUrl && !th.querySelector("img")) th.innerHTML = '<img src="' + esc(item.dataUrl) + '" alt="' + esc(item.ref) + '" loading="lazy">';
    const st = node.querySelector("[data-it-st]");
    if (st) {
      if (item.state === "ok") st.textContent = "✓ salva";
      else if (item.state === "fail") st.textContent = "✗ " + (item.error || "falhou");
      else if (item.state === "run") st.textContent = "⏳ gerando…";
      else if (item.state === "cancel") st.textContent = "— parada";
      else st.textContent = "aguardando";
    }
    const dl = node.querySelector("[data-it-dl]");
    if (dl) {
      dl.textContent = "⬇";
      if (item.state === "ok" && item.dataUrl) {
        const mime = /^data:([^;,]+)/i.exec(String(item.dataUrl));
        let ext = ".png";
        if (mime) { const mt = String(mime[1]).toLowerCase(); if (mt.indexOf("jpeg") >= 0) ext = ".jpg"; else if (mt.indexOf("webp") >= 0) ext = ".webp"; else if (mt.indexOf("video") === 0) ext = ".mp4"; }
        dl.href = item.dataUrl;
        dl.download = "logos-master-x-lote-" + String(item.ref || "passagem").replace(/[^0-9A-Za-z]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 60) + ext;
      } else {
        dl.removeAttribute("href");
      }
    }
  }
  function bxBatchCounter() {
    if (!layer || !batch) return;
    const fill = $("[data-bx-progress]", layer);
    const counter = $("[data-bx-counter]", layer);
    const total = batch.items.length;
    let done = 0, okc = 0, failc = 0;
    batch.items.forEach((item) => { if (item.state === "ok" || item.state === "fail" || item.state === "cancel") { done += 1; if (item.state === "ok") okc += 1; else if (item.state === "fail") failc += 1; } });
    const pct = total ? Math.round((done / total) * 100) : 0;
    if (fill) fill.style.width = pct + "%";
    if (counter) counter.innerHTML = "<span>" + done + " de " + total + "</span><span>" + (okc ? "✓ " + okc : "") + (okc && failc ? " • " : "") + (failc ? "✗ " + failc : "") + "</span>";
  }
  function bxBatchControls() {
    if (!layer) return;
    const start = $("[data-bx-start]", layer);
    const pause = $("[data-bx-pause]", layer);
    const resume = $("[data-bx-resume]", layer);
    const stop = $("[data-bx-stop]", layer);
    if (!start) return;
    const running = !!(batch && batch.running);
    const paused = !!(batch && batch.paused);
    start.hidden = running;
    stop.hidden = !running;
    pause.hidden = !running || paused;
    resume.hidden = !running || !paused;
  }
  function bxBatchList() {
    if (!layer || !batch) return;
    const box = $("[data-bx-items]", layer);
    const head = $("[data-bx-listhead-n]", layer);
    const empty = $("[data-bx-empty]", layer);
    if (head) head.textContent = batch.items.length + " imagem(ns)";
    if (!box) return;
    if (!batch.items.length) { if (empty) empty.hidden = false; box.innerHTML = ""; return; }
    if (empty) empty.hidden = true;
    box.innerHTML = batch.items.map((item) => '<div class="bx-ai-batch-item" data-it="' + item.index + '"><span class="bx-ai-batch-th" data-it-th></span><div class="bx-ai-batch-ic"><b>' + esc(item.ref) + '</b><span>' + esc(item.seg ? "parte " + item.seg + " • " : "") + esc(item.excerpt.slice(0, 120)) + '</span></div><span class="bx-ai-batch-st" data-it-st>aguardando</span><a class="bx-ai-batch-dl" data-it-dl title="Baixar esta imagem" download></a></div>').join("");
    batch.items.forEach((item) => bxBatchRenderItem(item));
  }

  function bxBatchReadCfg() {
    if (!batch || !layer) return;
    batch.quality = String(($("[data-bx-quality]", layer) || {}).value || "media");
    batch.aspect = String(($("[data-bx-aspect]", layer) || {}).value || "16:9");
    batch.provider = String(($("[data-bx-provider]", layer) || {}).value || "auto");
    batch.useOwn = String(($("[data-bx-key]", layer) || {}).value || "server") === "own";
    if (batch.referenceImageDataUrl && !batch.useOwn) {
      batch.provider = "gemini";
      const provSel = $("[data-bx-provider]", layer);
      if (provSel) provSel.value = "gemini";
    }
  }

  async function bxBatchRun() {
    if (!batch || !layer || batch.running) return;
    if (!batch.bookEntry) { bxBStatus("Escolha um livro para gerar o lote.", "warn"); return; }
    bxBatchReadCfg();
    if (!batch.items || !batch.items.length) batch.items = await bxBatchBuildItems();
    if (!batch.items.length) { bxBStatus("Nenhuma imagem prevista — ajuste o trecho ou os capítulos.", "warn"); return; }
    if (!batch.confirmed) {
      const who = batch.useOwn ? "sua chave do Gemini (consome créditos da SUA conta)" : (batch.provider === "auto" ? "a API configurada no servidor" : batch.provider === "gemini" ? "a API Gemini do servidor" : "a API OpenAI do servidor");
      const accepted = window.confirm("Iniciar o lote vai gerar " + batch.items.length + " imagem(ns) com " + who + ". Cada uma será salva na Mídia X, ligada à passagem. Deseja continuar?");
      if (!accepted) { bxBStatus("Lote cancelado; nada foi gerado nem cobrado.", "normal"); return; }
      batch.confirmed = true;
    }
    batch.running = true;
    batch.stopped = false;
    batch.paused = false;
    bxBatchControls();
    bxBStatus("Começando o lote…", "ok");
    while (batch && !batch.stopped && batch.i < batch.items.length) {
      while (batch && batch.paused && !batch.stopped) {
        bxBStatus("⏸ Lote pausado — toque em Retomar para continuar.", "warn");
        await new Promise((resolve) => { if (batch) batch.pauseResolve = resolve; });
      }
      if (!batch || batch.stopped) break;
      const item = batch.items[batch.i];
      if (item.state === "ok" || item.state === "fail" || item.state === "cancel") { batch.i += 1; bxBatchCounter(); continue; }
      item.state = "run";
      bxBatchRenderItem(item);
      bxBatchCounter();
      bxBStatus("Gerando " + (batch.i + 1) + " de " + batch.items.length + " — " + item.ref + "…", "ok");
      try {
        let prompt = bxBatchPrompt(item, batch.useOwn, batch.quality, batch.aspect);
        if (batch.referenceImageDataUrl) prompt += BX_REFERENCE_GUIDE;
        const asset = await bxBatchRequestImage(prompt, { useOwn: batch.useOwn, provider: batch.provider, aspect: batch.aspect, ref: item.ref, title: "Lote • " + item.ref, place: "passagem bíblica", stage: item.seg ? "parte " + item.seg : "capítulo em lote", referenceImageDataUrl: batch.referenceImageDataUrl || null });
        item.dataUrl = asset.data_url;
        await bxBatchSave(asset, item);
        item.state = "ok";
      } catch (error) {
        if (batch && batch.stopped) { item.state = "cancel"; bxBatchRenderItem(item); bxBatchCounter(); break; }
        const isAbort = !!(error && (error.name === "AbortError" || /abort/i.test(String(error && error.message || ""))));
        if (isAbort) { item.state = "cancel"; }
        else { item.state = "fail"; item.error = String(error && error.message || error).slice(0, 140); }
      }
      bxBatchRenderItem(item);
      batch.i += 1;
      bxBatchCounter();
      if (batch && !batch.stopped) await new Promise((resolve) => setTimeout(resolve, 25));
    }
    const wasStopped = !!(batch && batch.stopped);
    if (batch) {
      const okc = batch.items.filter((i) => i.state === "ok").length;
      const failc = batch.items.filter((i) => i.state === "fail").length;
      const pendc = batch.items.filter((i) => i.state === "pendente" || i.state === "run").length;
      const total = batch.items.length;
      batch.running = false;
      bxBatchControls();
      bxBatchCounter();
      if (okc) mediaChanged();
      if (wasStopped) {
        bxBStatus("⏹ Lote parado: " + okc + " imagem(ns) salva(s), " + pendc + " pendente(s)" + (failc ? ", " + failc + " falha(s)" : "") + ".", "warn");
      } else if (!failc && !pendc) {
        bxBStatus("✓ Lote concluído: " + okc + " de " + total + " imagem(ns) gerada(s) e salva(s) na Mídia X, ligada(s) à passagem.", "ok");
      } else {
        bxBStatus("✓ Lote concluído: " + okc + " salva(s)" + (failc ? ", " + failc + " falha(s)" : "") + (pendc ? ", " + pendc + " pendente(s)" : "") + " de " + total + ".", failc ? "warn" : "ok");
      }
    }
  }

  /* Carrega livros do servidor/IDB e já escolhe o 1º livro (cap. 1–1). */
  async function bxBatchFill() {
    if (!layer) return;
    bxBStatus("Carregando os livros…", "ok");
    const books = await bxBatchLoadBooks();
    if (!batch || !layer) return;
    batch.books = books;
    batch.source = books.length && String(books[0].code || "").indexOf("idb-") === 0 ? "idb" : "server";
    const start = $("[data-bx-start]", layer);
    if (!books.length) {
      bxDDSet("book", [], "");
      const val = $('[data-dd-val="book"]', layer);
      if (val) val.textContent = "indisponível";
      bxDDRows("book", []);
      if (start) start.disabled = true;
      bxBStatus("Não foi possível carregar os livros agora (servidor indisponível e nenhuma tradução local). Confira a internet e abra o Lote de novo.", "warn");
      return;
    }
    if (start) start.disabled = false;
    const rows = books.map((x) => ({ value: x.code, label: x.label, note: (x.chapters === 1 ? "1 capítulo" : x.chapters + " capítulos") }));
    bxDDRows("book", rows);
    bxDDSet("book", rows, books[0].code);
    bxPickBook(books[0].code);
  }

  function bxBatchBindDDEvents() {
    if (!layer) return;
    ["book", "from", "to"].forEach((which) => {
      const find = $('[data-dd-find="' + which + '"]', layer);
      if (find) find.addEventListener("input", () => bxDDRender(which, find.value));
    });
    layer.addEventListener("click", (event) => {
      const openBtn = event.target.closest ? event.target.closest("[data-dd-open]") : null;
      if (openBtn) { bxDDOpen(openBtn.dataset.ddOpen); return; }
      const pick = event.target.closest ? event.target.closest("[data-dd-pick]") : null;
      if (pick) { bxBatchPick(pick.dataset.ddPick, pick.dataset.ddPickval); return; }
      if (event.target.closest && event.target.closest(".bx-dd-panel")) return; /* dentro do dropdown: não fecha */
      if (ddOpen) bxDDClose();
    });
  }

  function bxBatchBindControls() {
    if (!layer) return;
    const start = $("[data-bx-start]", layer);
    if (start) start.addEventListener("click", () => { bxBatchRun().catch((error) => bxBStatus("Falha no lote: " + String(error && error.message || error).slice(0, 180), "warn")); });
    $("[data-bx-pause]", layer).addEventListener("click", () => { if (batch) { batch.paused = true; bxBatchControls(); } });
    $("[data-bx-resume]", layer).addEventListener("click", () => { if (batch && batch.paused) { batch.paused = false; bxBatchControls(); const r = batch.pauseResolve; batch.pauseResolve = null; if (r) r(); } });
    $("[data-bx-stop]", layer).addEventListener("click", () => { if (batch && batch.running) { batch.stopped = true; if (batch.ctrl) batch.ctrl.abort(); } });
    const key = $("[data-bx-key]", layer);
    const provider = $("[data-bx-provider]", layer);
    if (key) key.addEventListener("change", () => {
      bxBatchReadCfg();
      if (provider) provider.disabled = batch && batch.useOwn;
      bxBatchStatusLine();
    });
    if (provider) provider.addEventListener("change", () => { bxBatchReadCfg(); bxBatchStatusLine(); });
    ["data-bx-quality", "data-bx-aspect"].forEach((attr) => {
      const el = $("[" + attr + "]", layer);
      if (el) el.addEventListener("change", () => { bxBatchReadCfg(); bxBatchStatusLine(); });
    });
  }

  /* 5.4.246 — 📎 referência visual do LOTE: espelha estilo/cena em TODAS as imagens.
     Só imagem PNG/JPEG/WebP; guarda batch.referenceImageDataUrl e mostra prévia. */
  function bxBatchHandleUpload(event) {
    const inputEl = event.target;
    const file = inputEl && inputEl.files && inputEl.files[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) { bxBStatus("A referência do lote precisa ser uma imagem (PNG/JPEG/WebP).", "warn"); inputEl.value = ""; return; }
    const box = $("[data-bx-reference]", layer);
    if (!box) return;
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = String(reader.result || "");
      if (!bxImageParts(dataUrl)) { bxBStatus("Formato não suportado; use PNG, JPEG ou WebP.", "warn"); inputEl.value = ""; return; }
      if (!batch) return;
      batch.referenceImageDataUrl = dataUrl;
      box.classList.add("is-visible");
      box.innerHTML = "";
      const img = document.createElement("img");
      img.src = dataUrl;
      img.alt = "Referência visual do lote";
      const cap = document.createElement("small");
      cap.textContent = file.name + " • aplicada em TODAS as imagens do lote";
      const tools = document.createElement("div"); tools.className = "bx-ai-media-reference-tools";
      const remove = document.createElement("button"); remove.type = "button"; remove.className = "bx-ai-media-btn is-danger"; remove.textContent = "🗑 Remover referência";
      remove.onclick = () => {
        if (batch) batch.referenceImageDataUrl = "";
        box.classList.remove("is-visible");
        box.innerHTML = "";
        if (inputEl) inputEl.value = "";
        bxBStatus("Referência removida do lote.", "ok");
      };
      tools.appendChild(remove);
      box.append(img, cap, tools);
      bxBStatus("Referência anexada ao lote — as imagens vão espelhar esse estilo/cena (Gemini).", "ok");
    };
    reader.onerror = () => { bxBStatus("Não foi possível ler a imagem do dispositivo.", "warn"); };
    reader.readAsDataURL(file);
  }

  async function openBatch() {
    const batchBackCtx = (current && current.context) || {};
    close();
    ensureStyle();
    ensureBatchStyle();
    batch = { i: 0, running: false, paused: false, stopped: false, confirmed: false, items: [], books: [], bookEntry: null, bookCode: "", bookLabel: "", bookMax: 1, from: 1, to: 1, density: 1, quality: "media", aspect: "16:9", provider: "auto", useOwn: !!ownKeyCfg(), referenceImageDataUrl: "", ctrl: null, pauseResolve: null, source: "server", _verseCache: new Map(), _versePending: new Map(), _chapters: null, _chaptersLoading: null, _scopeToken: 0 };
    ddOpen = null;
    ddRows = {};
    ddSel = {};
    current = null;
    layer = document.createElement("div");
    layer.className = "bx-ai-media-layer";
    layer.setAttribute("role", "dialog");
    layer.setAttribute("aria-modal", "true");
    layer.innerHTML =
      '<section class="bx-ai-media-card">' +
      '<header class="bx-ai-media-head"><div><span class="bx-ai-media-kicker">GERADOR DE IA • LOTE</span><h2>Gerar imagens em lote</h2><p>Escolha o livro e o trecho — cada imagem nasce ligada à passagem na Mídia X.</p></div>' +
      '<div class="bx-ai-media-headbtns"><button type="button" class="bx-ai-media-fs" data-ai-back aria-label="Voltar ao gerador" title="Voltar à criação visual (gerador)" aria-pressed="false"><span aria-hidden="true">↩</span><span class="bx-ai-media-fs-label">Voltar</span></button><button type="button" class="bx-ai-media-fs" data-ai-fs aria-label="Tela cheia" title="Tela cheia" aria-pressed="false"><span aria-hidden="true">⛶</span><span class="bx-ai-media-fs-label">Tela cheia</span></button><button type="button" class="bx-ai-media-close" data-ai-close aria-label="Fechar lote">×</button></div></header>' +
      '<div class="bx-ai-batch-grid">' +
      '<form class="bx-ai-batch-cfg" data-ai-form>' +
      '<span class="bx-ai-batch-seclabel">1 · Trecho</span>' +
      '<div class="bx-dd"><span class="bx-dd-label">Livro</span>' +
      '<button type="button" class="bx-dd-trigger" data-dd-open="book" aria-haspopup="listbox"><span class="bx-dd-val" data-dd-val="book">Carregando…</span><span class="bx-dd-caret">▾</span></button>' +
      '<div class="bx-dd-panel" data-dd-panel="book" hidden><div class="bx-dd-search"><input type="search" data-dd-find="book" placeholder="Buscar livro…" autocomplete="off"></div><div class="bx-dd-list" data-dd-list="book"></div></div></div>' +
      '<div class="bx-dd-row">' +
      '<div class="bx-dd"><span class="bx-dd-label">Do capítulo</span><button type="button" class="bx-dd-trigger" data-dd-open="from"><span class="bx-dd-val" data-dd-val="from">1</span><span class="bx-dd-caret">▾</span></button><div class="bx-dd-panel" data-dd-panel="from" hidden><div class="bx-dd-search"><input type="search" data-dd-find="from" placeholder="Ir para capítulo…" autocomplete="off"></div><div class="bx-dd-list" data-dd-list="from"></div></div></div>' +
      '<div class="bx-dd"><span class="bx-dd-label">Até o capítulo</span><button type="button" class="bx-dd-trigger" data-dd-open="to"><span class="bx-dd-val" data-dd-val="to">1</span><span class="bx-dd-caret">▾</span></button><div class="bx-dd-panel" data-dd-panel="to" hidden><div class="bx-dd-search"><input type="search" data-dd-find="to" placeholder="Ir para capítulo…" autocomplete="off"></div><div class="bx-dd-list" data-dd-list="to"></div></div></div>' +
      "</div>" +
      '<div class="bx-dd"><span class="bx-dd-label">Fatiar cada capítulo</span><button type="button" class="bx-dd-trigger" data-dd-open="density"><span class="bx-dd-val" data-dd-val="density">1 · capítulo inteiro</span><span class="bx-dd-caret">▾</span></button><div class="bx-dd-panel" data-dd-panel="density" hidden><div class="bx-dd-list" data-dd-list="density"></div></div></div>' +
      '<span class="bx-ai-batch-seclabel">2 · Geração</span>' +
      '<label>Chave usada para gerar<select data-bx-key aria-label="Chave para gerar"><option value="own">🔑 Minha chave Gemini (neste navegador)</option><option value="server" selected>✨ API do servidor (Automático)</option></select></label>' +
      '<label>Provedor do servidor<select data-bx-provider aria-label="Provedor do servidor"><option value="auto" selected>Automático</option><option value="gemini">Gemini</option><option value="openai">OpenAI</option></select></label>' +
      '<div class="bx-ai-batch-row"><label>Qualidade<select data-bx-quality aria-label="Qualidade"><option value="baixa">Baixa</option><option value="media" selected>Média</option><option value="alta">Alta</option></select></label><label>Proporção<select data-bx-aspect aria-label="Proporção"><option value="16:9" selected>16:9 paisagem</option><option value="9:16">9:16 vertical</option><option value="1:1">1:1 quadrado</option></select></label></div>' +
      '<div class="bx-ai-batch-ref"><label class="bx-ai-media-upload">📎 Referência visual (opcional)<input type="file" data-bx-ref-upload accept="image/png,image/jpeg,image/webp"></label><small class="bx-ai-batch-refhint">Espelha o estilo, o personagem ou a cena de uma imagem em TODAS as imagens do lote. Usa o Gemini (servidor ou 🔑 sua chave); o OpenAI não aceita anexo.</small></div>' +
      '<div class="bx-ai-media-reference" data-bx-reference></div>' +
      '<div class="bx-ai-batch-actions"><button type="button" class="bx-ai-media-btn is-primary" data-bx-start>▶ Iniciar lote</button><button type="button" class="bx-ai-media-btn" data-bx-pause hidden>⏸ Pausar</button><button type="button" class="bx-ai-media-btn" data-bx-resume hidden>▶ Retomar</button><button type="button" class="bx-ai-media-btn is-danger" data-bx-stop hidden>⏹ Parar</button></div>' +
      '<div class="bx-ai-batch-progress"><div class="bx-ai-batch-track"><div class="bx-ai-batch-fill" data-bx-progress></div></div><div class="bx-ai-batch-counter" data-bx-counter><span>0 de 0</span><span></span></div></div>' +
      '<span class="bx-ai-media-status" data-ai-status aria-live="polite">Carregando os livros…</span>' +
      "</form>" +
      '<section class="bx-ai-batch-list"><div class="bx-ai-batch-listhead"><strong>Fila de imagens</strong><span data-bx-listhead-n>0</span></div><div class="bx-ai-batch-empty" data-bx-empty>Escolha o livro e o trecho; a fila aparece aqui, e cada item é gerado e salvo na Mídia X ao andar.</div><div class="bx-ai-batch-items" data-bx-items></div></section>' +
      "</div>" +
      "</section>";
    const keySel = $("[data-bx-key]", layer);
    if (keySel) {
      const hasOwn = !!ownKeyCfg();
      const ownOpt = keySel.querySelector('option[value="own"]');
      if (ownOpt) { ownOpt.disabled = !hasOwn; if (hasOwn) keySel.value = "own"; else keySel.value = "server"; }
      batch.useOwn = hasOwn;
      const provSel = $("[data-bx-provider]", layer);
      if (provSel) provSel.disabled = hasOwn;
    }
    document.body.appendChild(layer);
    $("[data-ai-close]", layer).addEventListener("click", close);
    const fsBtn = $("[data-ai-fs]", layer);
    if (fsBtn) fsBtn.addEventListener("click", (event) => { event.stopPropagation(); toggleFullscreen(); });
    const backBtn = $("[data-ai-back]", layer);
    if (backBtn) backBtn.addEventListener("click", (event) => { event.stopPropagation(); try { open(batchBackCtx); } catch (_) { open({}); } });
    $("[data-ai-form]", layer).addEventListener("submit", (event) => event.preventDefault());
    layer.addEventListener("click", (event) => { if (event.target === layer) close(); });
    keydownHandler = (event) => {
      if (event.key !== "Escape") return;
      if (ddOpen) { bxDDClose(); return; }
      if (isLayerFullscreen()) { toggleFullscreen(); return; }
      close();
    };
    document.addEventListener("keydown", keydownHandler);
    document.addEventListener("fullscreenchange", onFullscreenChange);
    document.addEventListener("webkitfullscreenchange", onFullscreenChange);
    const bxBatchRefUpload = $("[data-bx-ref-upload]", layer);
    if (bxBatchRefUpload) bxBatchRefUpload.addEventListener("change", bxBatchHandleUpload);
    bxBatchBindDDEvents();
    bxBatchBindControls();
    bxBatchControls();
    bxBatchFill();
  }

  window.BibleXAIMedia = { version: VERSION, open, openBatch, close };
})();
