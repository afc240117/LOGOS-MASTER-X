/* Bíblia Viva • Ateliê de mídia IA | v5.4.235 */
(function () {
  "use strict";

  const VERSION = "5.4.235";
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
      @media(max-width:800px){.bx-ai-media-card{height:min(920px,96vh)}.bx-ai-media-grid{grid-template-columns:1fr;overflow:auto}.bx-ai-media-form{border-right:0;border-bottom:1px solid rgba(202,226,255,.12)}.bx-ai-media-output{min-height:380px}.bx-ai-media-form,.bx-ai-media-output{padding:18px}.bx-ai-media-canvas{min-height:250px}}
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

  function visualDnaPrompt(context = {}) {
    const meta = visualMetadata(context);
    const moving = context.kind === "video" ? " Para vídeo, mantenha a ficha legível nos primeiros e nos últimos dois segundos." : "";
    return `${VISUAL_DNA_MARKER}: use composição cinematográfica editorial, realista e historicamente prudente, com luz natural, paisagem, arquitetura, objetos e vestimentas coerentes com o antigo Oriente. Reserve na parte inferior uma faixa semitransparente elegante, com tipografia serifada clara e divisores verticais discretos. Escreva exatamente nesta faixa, em português brasileiro, sem inventar ou alterar palavras: ${meta.title} | ${meta.reference} | ${meta.place} | Etapa: ${meta.stage} | Reconstrução interpretativa para estudo bíblico. Não apresente a reconstrução como fotografia do século I, não invente inscrições legíveis, datas ou fatos arqueológicos, e não acrescente outros textos visíveis.${moving}`.replace(/\s+/g, " ").trim();
  }

  function buildVisualPrompt(prompt, context = {}) {
    const base = String(prompt || "").replace(/\s+/g, " ").trim();
    if (base.includes(VISUAL_DNA_MARKER)) return base;
    return `${base}\n\n${visualDnaPrompt(context)}`.trim();
  }

  function contextPrompt(context) {
    const meta = visualMetadata(context);
    const scene = context.scene || {};
    return buildVisualPrompt(`Crie uma mídia bíblica editorial para ${meta.reference}, “${meta.title}”. Local relacionado: ${meta.place}. Etapa narrativa: ${meta.stage}. ${scene.subtitle || ""} Produza uma reconstrução visual respeitosa, cinematográfica e historicamente prudente, com paisagem, arquitetura e vestimentas coerentes com o antigo Oriente. Não apresente a imagem como fotografia do século I, não invente inscrições legíveis nem fatos arqueológicos; trate como reconstrução interpretativa para estudo bíblico. Idioma dos textos visíveis: português brasileiro.`, context);
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
      setStatus(ready.length ? `API reconhecida: ${ready.join(" + ")}. ${payload.hint || ""}` : `Nenhuma chave reconhecida. ${payload.environment?.project_env_loaded ? "O .env foi carregado, mas a chave está vazia." : "Crie .env a partir de .env.example ou configure a variável no servidor."}`, ready.length ? "ok" : "warn");
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
  function mediaChanged() { document.dispatchEvent(new CustomEvent("biblex:media-changed", { detail: { source: "atelie-ia" } })); document.querySelector('[data-bible-section="media"]')?.click(); }
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
    const prompt = buildVisualPrompt(rawPrompt, generationContext);
    const meta = visualMetadata(generationContext);
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
        provider, kind, prompt,
        visual_title: meta.title,
        visual_reference: meta.reference,
        visual_place: meta.place,
        visual_stage: meta.stage,
        aspect_ratio: $("[data-ai-aspect]", layer)?.value || "16:9",
        image_size: $("[data-ai-image-size]", layer)?.value || "1K",
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
      setStatus(openProvider ? `Prompt copiado. Abra ${openProvider === "gemini" ? "o Gemini Plus" : "o ChatGPT"} e cole para gerar na sua conta.` : "Prompt copiado para a área de transferência.", "ok");
    } catch (_) {
      setStatus("Selecione e copie o prompt manualmente; o navegador bloqueou a área de transferência.", "warn");
    }
    if (openProvider) window.open(openProvider === "gemini" ? "https://gemini.google.com/app" : "https://chatgpt.com/", "_blank", "noopener");
  }

  function clearObjectUrl() {
    if (objectUrl) URL.revokeObjectURL(objectUrl);
    objectUrl = "";
  }

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
    caption.textContent = `${file.name} • ${(file.size / 1024 / 1024).toFixed(1)} MB • anexo nesta sessão da passagem`;
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

  function close() {
    if (!layer) return;
    if (keydownHandler) document.removeEventListener("keydown", keydownHandler);
    clearObjectUrl();
    layer.remove();
    layer = null;
    current = null;
  }

  function open(context = {}) {
    close();
    ensureStyle();
    current = { kind: context.kind === "video" ? "video" : "image", referenceImageDataUrl: "", context };
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
          <div><span class="bx-ai-media-kicker">BÍBLIA VIVA • ATELIÊ IA</span><h2>Dar vida à passagem</h2><p>${esc(scene.title || "Geração visual contextual")} • ${esc(ref)}</p></div>
          <button type="button" class="bx-ai-media-close" data-ai-close aria-label="Fechar ateliê IA">×</button>
        </header>
        <div class="bx-ai-media-grid">
          <form class="bx-ai-media-form" data-ai-form>
            <div class="bx-ai-media-context"><strong>Contexto conectado</strong><br>${esc(scene.place?.name || "Lugar relacionado")} • ${esc(event.label || "etapa atual")}<br><span>${esc((context.verseText || "").slice(0, 260))}</span></div>
            <label>Provedor da API<select data-ai-provider><option value="auto">Automático</option><option value="gemini">Gemini • verificando…</option><option value="openai">OpenAI • verificando…</option></select></label>
            <div class="bx-ai-media-segment" role="tablist" aria-label="Tipo de mídia"><button type="button" class="is-active" data-ai-kind="image">🖼 Imagem</button><button type="button" data-ai-kind="video">🎬 Vídeo</button></div>
            <label>Prompt de criação<textarea data-ai-prompt>${esc(contextPrompt(context))}</textarea></label>
            <label class="bx-ai-media-upload">📎 Subir imagem ou vídeo do dispositivo<input type="file" data-ai-upload accept="image/png,image/jpeg,image/webp,video/mp4,video/webm"></label>
            <div class="bx-ai-media-reference" data-ai-reference></div>
            <span class="bx-ai-media-hint">O anexo fica nesta sessão da passagem. Ele só sai do dispositivo se você clicar em “Gerar com API”.</span>
            <div class="bx-ai-media-actions">
              <select class="bx-ai-media-btn" data-ai-aspect aria-label="Proporção"><option value="16:9">16:9 paisagem</option><option value="9:16">9:16 vertical</option><option value="1:1">1:1 quadrado</option></select>
              <select class="bx-ai-media-btn" data-ai-image-size aria-label="Tamanho da imagem"><option value="1K">1K</option><option value="2K">2K</option><option value="4K">4K</option></select>
              <select class="bx-ai-media-btn" data-ai-resolution aria-label="Resolução do vídeo"><option value="720p">720p</option><option value="1080p">1080p</option></select>
              <select class="bx-ai-media-btn" data-ai-size aria-label="Tamanho do vídeo"><option value="1280x720">1280×720</option><option value="720x1280">720×1280</option></select>
              <select class="bx-ai-media-btn" data-ai-seconds aria-label="Duração do vídeo"><option value="8">8 s</option><option value="16">16 s</option><option value="20">20 s</option></select>
            </div>
            <div class="bx-ai-media-actions"><button type="button" class="bx-ai-media-btn is-primary" data-ai-generate>✨ Gerar com API</button><button type="button" class="bx-ai-media-btn" data-ai-copy>📋 Copiar prompt</button><button type="button" class="bx-ai-media-btn" data-ai-scan>🔎 Escanear e vincular mídias</button></div>
            <div class="bx-ai-media-links"><button type="button" data-ai-open-provider="gemini">Abrir Gemini Plus ↗</button><button type="button" data-ai-open-provider="openai">Abrir ChatGPT ↗</button></div>
            <span class="bx-ai-media-status" data-ai-status aria-live="polite">Consultando as APIs…</span>
            <span class="bx-ai-media-security">🔒 Segurança: a Bíblia nunca recebe sua senha. As chaves de API ficam no servidor/local e o ZIP não contém nenhum segredo.</span>
          </form>
          <section class="bx-ai-media-output"><div class="bx-ai-media-output-head"><strong>Resultado da passagem</strong><span data-ai-result-meta>Pronto para criar</span></div><div class="bx-ai-media-canvas" data-ai-canvas><span>Escolha imagem ou vídeo e gere a primeira camada visual.</span></div><div class="bx-ai-media-result-actions" data-ai-result-actions></div><div class="bx-ai-media-result-meta">Use como reconstrução editorial de estudo. Para fatos históricos, mantenha a legenda de certeza e consulte as fontes do Atlas.</div></section>
        </div>
      </section>`;
    document.body.appendChild(layer);
    $("[data-ai-close]", layer).addEventListener("click", close);
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
      layer.querySelector("[data-ai-image-size]").style.display = current.kind === "image" ? "inline-block" : "none";
      layer.querySelector("[data-ai-resolution]").style.display = current.kind === "video" ? "inline-block" : "none";
      layer.querySelector("[data-ai-size]").style.display = current.kind === "video" ? "inline-block" : "none";
      layer.querySelector("[data-ai-seconds]").style.display = current.kind === "video" ? "inline-block" : "none";
    }));
    layer.querySelector(`[data-ai-kind='${current.kind}']`)?.click();
    layer.querySelectorAll("[data-ai-open-provider]").forEach((button) => button.addEventListener("click", () => copyPrompt(button.dataset.aiOpenProvider)));
    keydownHandler = (event) => { if (event.key === "Escape") close(); };
    document.addEventListener("keydown", keydownHandler);
    $("[data-ai-close]", layer).focus();
    refreshStatus();
  }

  window.BibleXAIMedia = { version: VERSION, open, close };
})();
