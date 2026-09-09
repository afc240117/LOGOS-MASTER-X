/* Bíblia X · ☁ Nuvem de mídia (celular ⇄ PC) — v5.4.247.
   Sincroniza a Mídia X entre os aparelhos do DONO através do servidor:
     • mesmo CÓDIGO de espaço digitado nos dois aparelhos (a credencial);
     • ENVIAR sobe as mídias locais que ainda não estão na nuvem (chave = sha256
       do conteúdo no servidor → enviar o mesmo arquivo de dois aparelhos não
       duplica);
     • RECEBER baixa tudo que está na nuvem e falta neste aparelho (id fixo
       derivado do sha → baixar de novo não duplica);
   No CELULAR envia/recebe SÓ imagens e vídeos; no PC envia/recebe TODOS os
   tipos (image/video/audio/document). No fim os dois convergem para o mesmo
   catálogo (ex.: 10 no celular + 10 no PC → 20 nos dois).
   Persistência fica em data/mediacloud (disco do servidor). Os dois aparelhos
   precisam estar no MESMO endereço publicado (ex.: os dois no Render). */
(function () {
  "use strict";
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var WS_KEY = "logosx:mediaCloudWs";
  var API = "/api/bible/mediacloud/";
  var IDB_NAME = "logosx-bible", IDB_VER = 15, STORE = "media";
  var dbp = null;
  var ALLOW_ALL = typeof window.matchMedia === "function" && !window.matchMedia("(max-width:760px)").matches;
  var ALLOWED = ALLOW_ALL ? ["image", "video", "audio", "document"] : ["image", "video"];
  var uid = 0;

  function db() {
    if (!dbp) dbp = new Promise(function (res, rej) {
      var q = indexedDB.open(IDB_NAME, IDB_VER);
      q.onsuccess = function () { res(q.result); };
      q.onerror = function () { rej(q.error); };
      q.onupgradeneeded = function () {
        var d = q.result;
        if (!d.objectStoreNames.contains(STORE)) d.createObjectStore(STORE, { keyPath: "id" });
      };
    });
    return dbp;
  }
  function mediaRows() {
    return db().then(function (d) {
      return new Promise(function (res, rej) {
        var t = d.transaction(STORE, "readonly"), st = t.objectStore(STORE);
        var rq = st.getAll();
        rq.onsuccess = function () { res(rq.result || []); };
        rq.onerror = function () { rej(rq.error); };
      });
    });
  }
  function mediaPut(row) {
    return db().then(function (d) {
      return new Promise(function (res, rej) {
        var t = d.transaction(STORE, "readwrite"), st = t.objectStore(STORE);
        var rq = st.put(row);
        rq.onsuccess = function () { res(row); };
        rq.onerror = function () { rej(rq.error); };
      });
    });
  }
  function changed() {
    try { window.dispatchEvent(new Event("biblex:media-changed")); } catch (_) {}
    try { document.dispatchEvent(new Event("biblex:media-changed")); } catch (_) {}
  }

  function wsGet() { try { return String(localStorage.getItem(WS_KEY) || "").trim().toUpperCase().replace(/[^A-Z0-9]/g, ""); } catch (_) { return ""; } }
  function wsSet(v) { try { localStorage.setItem(WS_KEY, String(v || "").trim().toUpperCase().replace(/[^A-Z0-9]/g, "")); } catch (_) {} }

  function rowType(row) {
    var t = String(row && row.type || "").toLowerCase();
    if (t) return t;
    var m = String(row && row.mime || "").toLowerCase();
    if (m.indexOf("video") === 0) return "video";
    if (m.indexOf("audio") === 0) return "audio";
    if (m === "application/pdf") return "document";
    return "image";
  }
  function extOf(mime) {
    mime = String(mime || "").toLowerCase();
    if (mime.indexOf("png") >= 0) return ".png";
    if (mime.indexOf("webp") >= 0) return ".webp";
    if (mime.indexOf("gif") >= 0) return ".gif";
    if (mime.indexOf("webm") >= 0) return ".webm";
    if (mime.indexOf("mp4") >= 0 || mime.indexOf("quicktime") >= 0) return ".mp4";
    if (mime.indexOf("mpeg") >= 0 || mime.indexOf("audio") === 0) return ".mp3";
    if (mime.indexOf("pdf") >= 0) return ".pdf";
    if (mime.indexOf("text") === 0) return ".txt";
    return ".jpg";
  }
  function rowBlob(row) {
    if (row && row.blob) return Promise.resolve(row.blob);
    var s = String(row && row.sourceUrl || "");
    if (/^data:/i.test(s)) {
      try { return fetch(s).then(function (r) { return r.blob(); }); } catch (_) {}
    }
    return Promise.resolve(null);
  }

  function toast(msg) {
    var bar = $("[data-bxmcloud-status]");
    if (bar) { bar.textContent = msg; bar.classList.add("flash"); setTimeout(function () { bar.classList.remove("flash"); }, 2500); }
  }

  async function push(ws, ctx) {
    var rows = await mediaRows();
    var allowed = [], skipped = 0;
    rows.forEach(function (r) {
      if (ALLOWED.indexOf(rowType(r)) < 0) return;
      if (r.cloudKey) { skipped++; return; }
      allowed.push(r);
    });
    if (!allowed.length) {
      toast(ctx && "✔ Tudo em dia — " + (skipped ? skipped + " já estavam na nuvem." : "não há mídia local nova para enviar."));
      return { sent: 0, skipped: skipped };
    }
    var sent = 0, fail = 0;
    for (var i = 0; i < allowed.length; i++) {
      var row = allowed[i];
      toast("☁ Enviando " + (i + 1) + " de " + allowed.length + "…");
      try {
        var blob = await rowBlob(row);
        if (!blob) { fail++; continue; }
        var mime = String(row.mime || blob.type || "image/jpeg");
        var meta = {
          title: String(row.title || "mídia"),
          type: rowType(row), mime: mime,
          reference: String(row.reference || ""),
          relatedReferences: Array.isArray(row.relatedReferences) ? row.relatedReferences.slice(0, 16) : [],
          description: String(row.description || ""),
          tags: Array.isArray(row.tags) ? row.tags : [],
          credits: String(row.credits || ""),
          license: String(row.license || ""),
          createdAt: row.createdAt || new Date().toISOString(),
          width: row.width || 0, height: row.height || 0,
          panorama: !!row.panorama
        };
        var fd = new FormData();
        var file = blob instanceof File ? blob : new File([blob], "m" + (row.id || String(i)).replace(/[^A-Za-z0-9._-]+/g, "_") + extOf(mime), { type: mime });
        fd.append("file", file);
        fd.append("meta", JSON.stringify(meta));
        var resp = await fetch(API + encodeURIComponent(ws) + "/items", { method: "POST", body: fd });
        if (!resp.ok) throw new Error("HTTP " + resp.status);
        var j = await resp.json();
        row.cloudKey = j.sha; row.cloudWs = ws;
        await mediaPut(row);
        sent++;
      } catch (_) { fail++; }
    }
    changed();
    toast("✔ Enviadas " + sent + " para a nuvem" + (fail ? " · " + fail + " com falha" : "") + (skipped ? " · " + skipped + " já estavam." : "") + ".");
    return { sent: sent, skipped: skipped, fail: fail };
  }

  async function pull(ws, ctx) {
    var resp;
    try {
      resp = await fetch(API + encodeURIComponent(ws) + "/items");
    } catch (_) { throw new Error("Sem conexão com o servidor. Use a versão publicada (Render) nos dois aparelhos."); }
    if (!resp.ok) throw new Error("Código não encontrado na nuvem (HTTP " + resp.status + "). Confira e tente de novo.");
    var j = await resp.json();
    var remote = (j && j.items) || [];
    var local = await mediaRows();
    var have = {};
    local.forEach(function (r) { if (r.cloudKey) have["s:" + r.cloudKey] = 1; have["i:" + r.id] = 1; });
    var need = remote.filter(function (it) {
      if (ALLOWED.indexOf(String(it.type || rowType(it)).toLowerCase()) < 0) return false;
      if (have["s:" + it.sha]) return false;
      if (have["i:cl-" + it.sha]) return false;
      return true;
    });
    if (!need.length) {
      toast(ctx && "✔ Recebidas — você já tem as " + remote.length + " da nuvem.");
      return { got: 0, total: remote.length };
    }
    var got = 0, fail = 0;
    for (var i = 0; i < need.length; i++) {
      var it = need[i];
      toast("☁ Recebendo " + (i + 1) + " de " + need.length + "…");
      try {
        var rr = await fetch(it.url);
        if (!rr.ok) throw 0;
        var blob = await rr.blob();
        var mime = String(it.mime || blob.type || "image/jpeg");
        var file = blob instanceof File ? blob : new File([blob], "cloud-" + it.sha.slice(0, 10) + extOf(mime), { type: mime });
        await mediaPut({
          id: "cl-" + it.sha, cloudKey: it.sha, cloudWs: ws,
          title: String(it.title || "mídia da nuvem"), type: String(it.type || rowType(it)),
          mime: mime, reference: String(it.reference || ""),
          relatedReferences: Array.isArray(it.relatedReferences) ? it.relatedReferences.slice(0, 16) : [],
          description: String(it.description || ""), tags: Array.isArray(it.tags) ? it.tags : [],
          credits: String(it.credits || ""), license: String(it.license || ""),
          createdAt: it.createdAt || new Date().toISOString(),
          width: it.width || 0, height: it.height || 0, panorama: !!it.panorama,
          sourceKind: "local", blob: file, size: file.size
        });
        got++;
      } catch (_) { fail++; }
    }
    changed();
    toast("✔ Recebidas " + got + " da nuvem" + (fail ? " · " + fail + " com falha" : "") + ".");
    return { got: got, total: remote.length, fail: fail };
  }

  function busy(el, on, label) {
    if (el) { el.disabled = on; if (label) el.textContent = label; }
  }
  async function run(btn, wsInput, which) {
    var ws = String(wsInput && wsInput.value || "").trim().toUpperCase().replace(/[^A-Z0-9]/g, "");
    if (ws.length < 4) { toast("Digite (ou gere) um código de espaço com 4 a 32 letras/números."); return; }
    wsSet(ws);
    busy(btn, true, which === "push" ? "Enviando…" : "Recebendo…");
    try {
      if (which === "push") await push(ws, true);
      else await pull(ws, true);
    } catch (e) {
      toast(e && e.message ? e.message : "Falha na nuvem.");
    } finally {
      busy(btn, false);
      try { if (typeof bxMediaStorageRefresh === "function") bxMediaStorageRefresh(); } catch (_) {}
    }
  }

  function genCode() {
    var set = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789", out = "";
    for (var i = 0; i < 6; i++) out += set[Math.floor(Math.random() * set.length)];
    return out;
  }

  function mount() {
    var toolbar = $(".bx-media-toolbar");
    var panel = $('[data-bible-panel="media"]');
    if (!toolbar || !panel || panel.querySelector("[data-bxmcloud-ui]")) return;
    var sec = document.createElement("section");
    sec.className = "bxmcloud";
    sec.dataset.bxmcloudUi = "1";
    sec.innerHTML =
      '<div class="bxmcloud-head"><span>☁ Nuvem de mídia</span><small>celular ⇄ PC · mesmo código nos dois aparelhos' +
      (ALLOW_ALL ? " · envia tudo" : " · imagens e vídeos") + "</small></div>" +
      '<div class="bxmcloud-row"><input data-bxmcloud-ws class="bxmcloud-input" maxlength="32" spellcheck="false" autocomplete="off" placeholder="código do espaço (4–32)" value="' + (window.escapeHtml ? window.escapeHtml(wsGet()) : (wsGet() || "").replace(/[&<>"']/g, "")) + '">' +
      '<button type="button" class="btn secondary bxmcloud-mini" data-bxmcloud-gen title="Gerar um código novo e copiar">🔑 Novo</button>' +
      '<button type="button" class="btn primary" data-bxmcloud-push>📤 Enviar</button>' +
      '<button type="button" class="btn primary" data-bxmcloud-pull>📥 Receber</button>' +
      '<button type="button" class="btn" data-bxmcloud-sync>⇅ Sincronizar</button></div>' +
      '<div class="bxmcloud-status" data-bxmcloud-status>Pronto. Toque em ⇅ para enviar as suas e receber as do outro aparelho.</div>';
    toolbar.parentNode.insertBefore(sec, toolbar.nextSibling);
    var input = sec.querySelector("[data-bxmcloud-ws]");
    var pushBtn = sec.querySelector("[data-bxmcloud-push]");
    var pullBtn = sec.querySelector("[data-bxmcloud-pull]");
    var syncBtn = sec.querySelector("[data-bxmcloud-sync]");
    input.addEventListener("change", function () { wsSet(input.value); });
    input.addEventListener("keydown", function (e) { if (e.key === "Enter") run(syncBtn, input, "push").then(function () { return run(pullBtn, input, "pull"); }); });
    sec.querySelector("[data-bxmcloud-gen]").addEventListener("click", function () {
      var code = genCode();
      input.value = code; wsSet(code);
      var full = String(location.origin) + "/";
      try {
        if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(code).then(function () {}, function () {});
      } catch (_) {}
      toast("🔑 Código novo: " + code + " (copiado). Digite o mesmo no outro aparelho.");
    });
    pushBtn.addEventListener("click", function () { run(pushBtn, input, "push"); });
    pullBtn.addEventListener("click", function () { run(pullBtn, input, "pull"); });
    syncBtn.addEventListener("click", async function () {
      var ws = String(input && input.value || "").trim().toUpperCase().replace(/[^A-Z0-9]/g, "");
      if (ws.length < 4) { toast("Digite (ou gere) um código de espaço primeiro."); return; }
      wsSet(ws);
      busy(syncBtn, true, "Sincronizando…");
      try {
        var a = await push(ws, false);
        var b = await pull(ws, false);
        toast("✔ Sincronizado: enviadas " + (a.sent || 0) + " · recebidas " + (b.got || 0) + (b.total ? " · já tinha " + (b.total - (b.got || 0)) + " da nuvem." : "."));
      } catch (e) {
        toast(e && e.message ? e.message : "Falha na sincronização.");
      } finally {
        busy(syncBtn, false);
        try { if (typeof bxMediaStorageRefresh === "function") bxMediaStorageRefresh(); } catch (_) {}
      }
    });
    if (document.getElementById("bxmcloudCss")) return;
    var st = document.createElement("style");
    st.id = "bxmcloudCss";
    st.textContent = ".bxmcloud{margin:0;padding:8px 10px;border:1px solid rgba(46,204,159,.35);border-top:0;background:rgba(2,16,22,.35);display:flex;flex-direction:column;gap:6px}.bxmcloud-head{display:flex;align-items:baseline;gap:8px;flex-wrap:wrap}.bxmcloud-head>span{font-weight:700;color:#2ecc9f}.bxmcloud-head small{opacity:.75}.bxmcloud-row{display:flex;gap:6px;flex-wrap:wrap;align-items:center}.bxmcloud-input{flex:1 1 150px;min-width:120px;background:#04141b;color:#e8f4ef;border:1px solid rgba(46,204,159,.4);border-radius:8px;padding:5px 8px;font-size:.82rem;text-transform:uppercase}.bxmcloud-mini{white-space:nowrap}.bxmcloud-status{font-size:.72rem;opacity:.85;line-height:1.35}.bxmcloud-status.flash{opacity:1;color:#8ff5d4;transition:opacity .3s}@media(max-width:680px){.bxmcloud-row{flex-direction:column;align-items:stretch}.bxmcloud-row .btn{justify-content:center}}";
    document.head.appendChild(st);
  }

  function init() {
    var raf = 0;
    var obs = new MutationObserver(function () {
      if (!raf) raf = requestAnimationFrame(function () { raf = 0; try { mount(); } catch (_) {} });
    });
    obs.observe(document.body, { childList: true, subtree: true });
    try { mount(); } catch (_) {}
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init, { once: true });
  else init();
})();
