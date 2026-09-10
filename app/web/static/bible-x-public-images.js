/* LOGOS MASTER X — 5.4.248 — Fontes públicas de imagem
   ------------------------------------------------------------------
   Botão "🖼 Fontes públicas": busca imagens de acervos públicos sobre a
   passagem aberta (cultura, lugares bíblicos, ruínas da época) e mostra o
   crédito de cada uma.

   Fontes (todas consultadas do próprio navegador, sem servidor nosso):
   • Wikimedia Commons — sem chave, CORS liberado (origin=*).
   • Openverse        — sem chave, acervo CC de vários museus e bancos.
   • Pexels           — opcional: exige chave própria do usuário, guardada
                        apenas neste navegador (localStorage logosx:pexelsKey).

   Nada é enviado para servidores nossos: a consulta sai daqui direto para
   a fonte escolhida. Cada imagem mantém autor e licença visíveis, porque
   quase todas exigem crédito.
   ------------------------------------------------------------------ */
(function () {
  "use strict";

  var VERSAO = "5.4.248";
  var LS_PEXELS = "logosx:pexelsKey";
  var LIMITE_WIKIMEDIA = 24;
  var LIMITE_OPENVERSE = 20;
  var LIMITE_PEXELS = 18;

  var estado = {
    aberto: false,
    consulta: "",
    tema: "lugares",
    fontes: { wikimedia: true, openverse: true, pexels: false },
    carregando: false,
    itens: [],
    avisos: [],
    salvo: {},
    pexelsKey: ""
  };

  /* ---------- vocabulário: português → inglês (os acervos indexam em inglês) ---------- */
  var LUGARES = {
    "jerusalém": "Jerusalem", "jerusalem": "Jerusalem", "belém": "Bethlehem",
    "nazaré": "Nazareth", "galileia": "Galilee", "jordão": "Jordan River",
    "mar da galileia": "Sea of Galilee", "mar morto": "Dead Sea",
    "mar vermelho": "Red Sea", "egito": "Egypt", "sinai": "Mount Sinai",
    "babilônia": "Babylon", "ninive": "Nineveh", "damasco": "Damascus",
    "éfeso": "Ephesus", "corinto": "Corinth", "roma": "Rome", "atenas": "Athens",
    "samaria": "Samaria", "jericó": "Jericho", "betânia": "Bethany",
    "getsêmani": "Gethsemane", "gólgota": "Golgotha", "calvário": "Calvary",
    "hebron": "Hebron", "berseba": "Beersheba", "carmelo": "Mount Carmel",
    "tabor": "Mount Tabor", "hermon": "Mount Hermon", "oliveiras": "Mount of Olives",
    "sião": "Mount Zion", "cafarnaum": "Capernaum", "caná": "Cana",
    "antioquia": "Antioch", "filipos": "Philippi", "tessalônica": "Thessaloniki",
    "creta": "Crete", "chipre": "Cyprus", "malta": "Malta", "patmos": "Patmos",
    "ur": "Ur", "canaã": "Canaan", "edom": "Edom", "moabe": "Moab",
    "filístia": "Philistia", "gaza": "Gaza", "tiro": "Tyre", "sidom": "Sidon",
    "cades": "Kadesh", "gilgal": "Gilgal", "siló": "Shiloh", "sicar": "Sychar",
    "emaus": "Emmaus", "joppe": "Jaffa", "cesareia": "Caesarea", "siquém": "Shechem",
    "haran": "Haran", "susa": "Susa", "persépolis": "Persepolis", "nilo": "Nile",
    "eufrates": "Euphrates", "tigre": "Tigris", "deserto": "Judaean desert",
    "sinagoga": "ancient synagogue", "templo": "Second Temple Jerusalem",
    "muro das lamentações": "Western Wall", "muro ocidental": "Western Wall"
  };

  var LIVROS = {
    "gênesis": "Genesis", "êxodo": "Exodus", "levítico": "Leviticus",
    "números": "Numbers", "deuteronômio": "Deuteronomy", "josué": "Joshua",
    "juízes": "Judges", "rute": "Ruth", "samuel": "Samuel", "reis": "Kings",
    "crônicas": "Chronicles", "esdras": "Ezra", "neemias": "Nehemiah",
    "ester": "Esther", "jó": "Job", "salmos": "Psalms", "salmo": "Psalms",
    "provérbios": "Proverbs", "eclesiastes": "Ecclesiastes",
    "cantares": "Song of Songs", "isaías": "Isaiah", "jeremias": "Jeremiah",
    "lamentações": "Lamentations", "ezequiel": "Ezekiel", "daniel": "Daniel",
    "oseias": "Hosea", "joel": "Joel", "amós": "Amos", "obadias": "Obadiah",
    "jonas": "Jonah", "miqueias": "Micah", "naum": "Nahum",
    "habacuque": "Habakkuk", "sofonias": "Zephaniah", "ageu": "Haggai",
    "zacarias": "Zechariah", "malaquias": "Malachi", "mateus": "Matthew",
    "marcos": "Mark", "lucas": "Luke", "joão": "John", "atos": "Acts",
    "romanos": "Romans", "coríntios": "Corinthians", "gálatas": "Galatians",
    "efésios": "Ephesians", "filipenses": "Philippians", "colossenses": "Colossians",
    "tessalonicenses": "Thessalonians", "timóteo": "Timothy", "tito": "Titus",
    "filemom": "Philemon", "hebreus": "Hebrews", "tiago": "James",
    "pedro": "Peter", "judas": "Jude", "apocalipse": "Revelation"
  };

  var TEMAS = [
    { id: "lugares", rotulo: "🗺 Lugares bíblicos", termos: "biblical site archaeology" },
    { id: "ruinas", rotulo: "🏺 Ruínas e arqueologia", termos: "ancient ruins archaeology excavation" },
    { id: "cultura", rotulo: "🏛 Cultura e costumes", termos: "ancient near east daily life" },
    { id: "paisagem", rotulo: "🌄 Paisagem e geografia", termos: "holy land landscape" },
    { id: "objetos", rotulo: "⚱ Objetos e utensílios", termos: "biblical artifacts museum" }
  ];

  /* ---------- utilidades ---------- */
  function $(sel, raiz) { return (raiz || document).querySelector(sel); }
  function $$(sel, raiz) { return Array.prototype.slice.call((raiz || document).querySelectorAll(sel)); }
  function semAcento(txt) {
    return String(txt || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
  }
  function limparHtml(txt) {
    var d = document.createElement("div");
    d.innerHTML = String(txt || "");
    return (d.textContent || "").replace(/\s+/g, " ").trim();
  }
  function esc(txt) {
    return String(txt == null ? "" : txt).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }
  function dorme(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }

  /* ---------- contexto da passagem ---------- */
  function referenciaAtual() {
    var imersao = window.BibleXImmersion;
    try {
      var ctx = imersao && imersao.getCurrentContext && imersao.getCurrentContext();
      var ref = ctx && (ctx.currentNarrativeRef || ctx.reference);
      if (ref) return String(ref).trim();
    } catch (_) {}
    var campo = document.querySelector("#bRef");
    if (campo && campo.value) return String(campo.value).trim();
    var titulo = document.querySelector("[data-imm-title]");
    if (titulo && titulo.textContent) return titulo.textContent.trim();
    return "";
  }

  function textoDaPassagem() {
    var partes = [];
    var saida = document.querySelector("#bOut");
    if (saida) partes.push(saida.textContent || "");
    var cena = document.querySelector(".bx-immersion-verse, .bx-immersion-stage-copy");
    if (cena) partes.push(cena.textContent || "");
    return partes.join(" ");
  }

  function lugaresDaPassagem() {
    var alvo = semAcento(textoDaPassagem() + " " + referenciaAtual());
    var achados = [];
    Object.keys(LUGARES).forEach(function (pt) {
      if (alvo.indexOf(semAcento(pt)) !== -1) achados.push({ pt: pt, en: LUGARES[pt] });
    });
    /* chaves mais longas primeiro ("mar da galileia" antes de "galileia") */
    achados.sort(function (a, b) { return b.pt.length - a.pt.length; });
    return achados;
  }

  function livroEmIngles() {
    var ref = referenciaAtual();
    var base = semAcento(String(ref).replace(/[\d:,\-–—].*$/, "")).trim();
    var chaves = Object.keys(LIVROS);
    for (var i = 0; i < chaves.length; i++) {
      if (base && base.indexOf(semAcento(chaves[i])) === 0) return LIVROS[chaves[i]];
    }
    return "";
  }

  function temaAtual() {
    for (var i = 0; i < TEMAS.length; i++) if (TEMAS[i].id === estado.tema) return TEMAS[i];
    return TEMAS[0];
  }

  /* Monta a consulta: lugar(es) da passagem + tema. Se não houver lugar,
     cai para o nome do livro em inglês + "holy land". */
  function montarConsulta() {
    var lugares = lugaresDaPassagem().slice(0, 2).map(function (l) { return l.en; });
    var base = lugares.length ? lugares.join(" ") : (livroEmIngles() ? livroEmIngles() + " holy land" : "holy land biblical");
    return (base + " " + temaAtual().termos).replace(/\s+/g, " ").trim();
  }

  /* ---------- fontes ---------- */
  function buscaWikimedia(consulta) {
    var url = "https://commons.wikimedia.org/w/api.php?action=query&format=json&origin=*"
      + "&generator=search&gsrnamespace=6&gsrlimit=" + LIMITE_WIKIMEDIA
      + "&gsrsearch=" + encodeURIComponent(consulta)
      + "&prop=imageinfo&iiprop=url|extmetadata|size|user&iiurlwidth=560";
    return fetch(url, { headers: { Accept: "application/json" } })
      .then(function (r) { if (!r.ok) throw new Error("HTTP " + r.status); return r.json(); })
      .then(function (json) {
        var paginas = json && json.query && json.query.pages ? Object.keys(json.query.pages).map(function (k) { return json.query.pages[k]; }) : [];
        return paginas.map(function (p) {
          var info = (p.imageinfo && p.imageinfo[0]) || {};
          var meta = info.extmetadata || {};
          var autor = limparHtml(meta.Artist && meta.Artist.value) || limparHtml(info.user) || "Autor não indicado";
          var licenca = limparHtml(meta.LicenseShortName && meta.LicenseShortName.value) || "Ver página do arquivo";
          return {
            id: "wk-" + p.pageid,
            fonte: "Wikimedia Commons",
            titulo: String(p.title || "").replace(/^File:/, "").replace(/\.[a-z0-9]+$/i, ""),
            thumb: info.thumburl || info.url || "",
            original: info.url || info.descriptionurl || "",
            pagina: info.descriptionurl || "",
            autor: autor,
            licenca: licenca,
            largura: info.width || 0,
            altura: info.height || 0
          };
        }).filter(function (i) { return i.thumb; });
      });
  }

  function buscaOpenverse(consulta) {
    var url = "https://api.openverse.org/v1/images/?q=" + encodeURIComponent(consulta)
      + "&page_size=" + LIMITE_OPENVERSE + "&mature=false";
    return fetch(url, { headers: { Accept: "application/json" } })
      .then(function (r) { if (!r.ok) throw new Error("HTTP " + r.status); return r.json(); })
      .then(function (json) {
        return (json && json.results ? json.results : []).map(function (i) {
          var lic = String(i.license || "").toUpperCase();
          var licenca = lic ? "CC " + lic + (i.license_version ? " " + i.license_version : "") : "Ver página de origem";
          return {
            id: "ov-" + (i.id || Math.random().toString(36).slice(2, 9)),
            fonte: "Openverse" + (i.source ? " • " + i.source : ""),
            titulo: String(i.title || i.creator || "Imagem").slice(0, 120),
            thumb: i.thumbnail || i.url || "",
            original: i.url || "",
            pagina: i.foreign_landing_url || i.url || "",
            autor: String(i.creator || "Autor não indicado"),
            licenca: licenca,
            largura: i.width || 0,
            altura: i.height || 0
          };
        }).filter(function (i) { return i.thumb; });
      });
  }

  function buscaPexels(consulta) {
    if (!estado.pexelsKey) return Promise.reject(new Error("chave ausente"));
    var url = "https://api.pexels.com/v1/search?query=" + encodeURIComponent(consulta)
      + "&per_page=" + LIMITE_PEXELS + "&orientation=landscape";
    return fetch(url, { headers: { Authorization: estado.pexelsKey, Accept: "application/json" } })
      .then(function (r) {
        if (r.status === 401) throw new Error("chave recusada");
        if (!r.ok) throw new Error("HTTP " + r.status);
        return r.json();
      })
      .then(function (json) {
        return (json && json.photos ? json.photos : []).map(function (p) {
          var src = p.src || {};
          return {
            id: "px-" + p.id,
            fonte: "Pexels",
            titulo: String(p.alt || "Foto de " + (p.photographer || "autor Pexels")).slice(0, 120),
            thumb: src.medium || src.small || src.tiny || "",
            original: src.original || src.large2x || src.large || "",
            pagina: p.url || "",
            autor: String(p.photographer || "Pexels"),
            licenca: "Licença Pexels (uso livre; crédito apreciado)",
            largura: p.width || 0,
            altura: p.height || 0
          };
        }).filter(function (i) { return i.thumb; });
      });
  }

  function buscar() {
    if (estado.carregando) return;
    estado.consulta = ($("[data-bxpub-busca]") || {}).value || estado.consulta || montarConsulta();
    estado.carregando = true;
    estado.avisos = [];
    estado.itens = [];
    desenhar();

    var tarefas = [];
    if (estado.fontes.wikimedia) tarefas.push(buscaWikimedia(estado.consulta).catch(function (e) { estado.avisos.push("Wikimedia Commons: " + e.message); return []; }));
    if (estado.fontes.openverse) tarefas.push(buscaOpenverse(estado.consulta).catch(function (e) { estado.avisos.push("Openverse: " + e.message); return []; }));
    if (estado.fontes.pexels) {
      tarefas.push(buscaPexels(estado.consulta).catch(function (e) {
        estado.avisos.push(e.message === "chave ausente" || e.message === "chave recusada"
          ? "Pexels: informe sua chave em 🔑 (fica só neste navegador)"
          : "Pexels: " + e.message);
        return [];
      }));
    }
    if (!tarefas.length) {
      estado.carregando = false;
      estado.avisos.push("Escolha ao menos uma fonte.");
      desenhar();
      return;
    }

    Promise.all(tarefas).then(function (listas) {
      var vistos = {};
      var tudo = [];
      listas.forEach(function (lista) {
        lista.forEach(function (item) {
          var chave = semAcento(item.titulo).slice(0, 60) + "|" + item.fonte;
          if (vistos[chave]) return;
          vistos[chave] = 1;
          tudo.push(item);
        });
      });
      estado.itens = tudo;
      estado.carregando = false;
      desenhar();
    });
  }

  /* ---------- salvar na Mídia X ---------- */
  function candidatos(seed) {
    try {
      var fn = window.BibleXImmersion && window.BibleXImmersion.getMediaPlacementCandidates;
      if (typeof fn === "function") return fn(seed) || [];
    } catch (_) {}
    return [];
  }

  function bancoMidia() {
    return new Promise(function (resolve, reject) {
      var req = indexedDB.open("logosx-bible", 15);
      req.onupgradeneeded = function () {
        if (!req.result.objectStoreNames.contains("media")) req.result.createObjectStore("media", { keyPath: "id" });
      };
      req.onsuccess = function () { resolve(req.result); };
      req.onerror = function () { reject(req.error); };
    });
  }

  function gravarMidia(linha) {
    if (typeof window.mediaPutMany === "function") return window.mediaPutMany([linha]);
    return bancoMidia().then(function (db) {
      return new Promise(function (resolve, reject) {
        var tx = db.transaction("media", "readwrite");
        tx.objectStore("media").put(linha);
        tx.oncomplete = function () { resolve(1); };
        tx.onerror = function () { reject(tx.error); };
      });
    });
  }

  function salvarNaMidiaX(item) {
    var ref = referenciaAtual() || "passagem em estudo";
    var linha = {
      id: "pub-" + Date.now() + "-" + Math.random().toString(36).slice(2, 8),
      title: item.titulo || "Imagem de acervo público",
      type: "image",
      mime: "",
      reference: ref,
      relatedReferences: candidatos({ reference: ref, title: item.titulo, tags: ["fontes-publicas", "imagem"] }),
      description: "Imagem de acervo público vinculada a " + ref + ".",
      tags: ["fontes-publicas", "imagem", item.fonte],
      credits: item.autor + " — " + item.fonte,
      license: item.licenca || "Confira a licença na página de origem",
      sourceKind: "public",
      sourceUrl: item.pagina || item.original || "",
      thumbUrl: item.thumb || "",
      blob: null,
      size: 0,
      place: "",
      createdAt: new Date().toISOString()
    };
    return gravarMidia(linha).then(function () {
      estado.salvo[item.id] = true;
      try { document.dispatchEvent(new CustomEvent("biblex:media-changed", { detail: { source: "fontes-publicas" } })); } catch (_) {}
      desenhar();
      return linha.id;
    });
  }

  /* ---------- interface ---------- */
  function css() {
    if (document.getElementById("bxPublicImagesStyle")) return;
    var style = document.createElement("style");
    style.id = "bxPublicImagesStyle";
    style.textContent = [
      ".bxpub-overlay{position:fixed;inset:0;z-index:2147483010;display:flex;align-items:center;justify-content:center;padding:18px;background:rgba(1,6,13,.86);backdrop-filter:blur(10px)}",
      ".bxpub-card{display:flex;flex-direction:column;width:min(1080px,96vw);max-height:92vh;border:1px solid rgba(244,199,107,.42);border-radius:20px;background:linear-gradient(160deg,#08192b,#04101d);color:#eef8ff;box-shadow:0 30px 90px rgba(0,0,0,.68);overflow:hidden}",
      ".bxpub-head{display:flex;align-items:flex-start;justify-content:space-between;gap:12px;padding:16px 20px;border-bottom:1px solid rgba(150,196,232,.16)}",
      ".bxpub-head small{display:block;color:#f4c76b;font-weight:900;letter-spacing:.14em;font-size:.68rem}",
      ".bxpub-head h3{margin:4px 0 0;font-size:1.16rem;color:#fff0bd}",
      ".bxpub-head p{margin:4px 0 0;font-size:.82rem;color:#9fb5ca}",
      ".bxpub-fechar{border:1px solid rgba(134,200,255,.32);border-radius:10px;background:#10243a;color:#fff;width:40px;height:40px;font-size:1.2rem;cursor:pointer;flex:0 0 auto}",
      ".bxpub-controles{display:flex;flex-wrap:wrap;gap:8px;align-items:center;padding:12px 20px;border-bottom:1px solid rgba(150,196,232,.12)}",
      ".bxpub-controles input[type=search]{flex:1 1 240px;min-width:0;min-height:42px;border:1px solid rgba(134,200,255,.28);border-radius:12px;background:#061321;color:#eef8ff;padding:8px 12px;font-size:.9rem}",
      ".bxpub-btn{min-height:40px;padding:8px 14px;border:1px solid rgba(244,199,107,.42);border-radius:12px;background:#102b42;color:#eef8ff;font-weight:800;font-size:.82rem;cursor:pointer}",
      ".bxpub-btn:hover{background:#1a5260}",
      ".bxpub-btn.is-primary{background:linear-gradient(135deg,#7f561d,#164b58);color:#fff6d8}",
      ".bxpub-fontes{display:flex;flex-wrap:wrap;gap:6px;padding:0 20px 10px}",
      ".bxpub-chip{display:inline-flex;align-items:center;gap:6px;min-height:34px;padding:5px 12px;border:1px solid rgba(128,215,211,.28);border-radius:999px;background:rgba(104,184,194,.1);color:#cbe9e7;font-size:.78rem;font-weight:700;cursor:pointer}",
      ".bxpub-chip.is-on{border-color:rgba(244,199,107,.72);background:rgba(244,199,107,.16);color:#ffe9b6}",
      ".bxpub-aviso{margin:0 20px 8px;padding:8px 12px;border:1px solid rgba(255,199,110,.36);border-radius:10px;background:rgba(120,72,20,.22);color:#ffdfa6;font-size:.78rem}",
      ".bxpub-grade{display:grid;grid-template-columns:repeat(auto-fill,minmax(196px,1fr));gap:12px;padding:14px 20px;overflow:auto;flex:1 1 auto}",
      ".bxpub-item{display:flex;flex-direction:column;border:1px solid rgba(134,200,255,.18);border-radius:14px;background:#061321;overflow:hidden}",
      ".bxpub-item img{display:block;width:100%;height:150px;object-fit:cover;background:#02070d;cursor:zoom-in}",
      ".bxpub-item div{padding:9px 10px;display:flex;flex-direction:column;gap:5px;flex:1 1 auto}",
      ".bxpub-item strong{font-size:.8rem;line-height:1.25;color:#eaf8ff;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}",
      ".bxpub-item small{font-size:.7rem;color:#9fb5ca;line-height:1.3}",
      ".bxpub-item em{font-style:normal;font-size:.68rem;color:#f4c76b}",
      ".bxpub-acoes{display:flex;flex-wrap:wrap;gap:6px;margin-top:auto}",
      ".bxpub-acoes button{flex:1 1 auto;min-height:34px;padding:6px 8px;border:1px solid rgba(134,200,255,.26);border-radius:9px;background:#10243a;color:#eef8ff;font-size:.72rem;font-weight:800;cursor:pointer}",
      ".bxpub-acoes button:hover{background:#16405a}",
      ".bxpub-acoes button.is-salvo{border-color:rgba(64,196,174,.9);background:linear-gradient(180deg,#123f3a,#0d2f2c);color:#9ff0dc}",
      ".bxpub-vazio{padding:28px 20px;text-align:center;color:#9fb5ca;font-size:.86rem}",
      ".bxpub-pe{display:flex;flex-direction:column;flex:1 1 auto;min-height:0}",
      ".bxpub-chave{display:none;gap:8px;align-items:center;padding:0 20px 10px}",
      ".bxpub-chave.is-on{display:flex}",
      ".bxpub-chave input{flex:1 1 auto;min-width:0;min-height:40px;border:1px solid rgba(134,200,255,.28);border-radius:12px;background:#061321;color:#eef8ff;padding:8px 12px;font-size:.82rem}",
      ".bxpub-rodape{padding:10px 20px;border-top:1px solid rgba(150,196,232,.14);color:#8fa8bd;font-size:.72rem;line-height:1.45}",
      "@media(max-width:680px){",
      ".bxpub-overlay{padding:0}",
      ".bxpub-card{width:100vw;max-width:none;height:100vh;max-height:none;border-radius:0;border:0}",
      ".bxpub-head{padding:12px 14px}",
      ".bxpub-controles{padding:10px 14px}",
      ".bxpub-fontes{padding:0 14px 8px}",
      ".bxpub-grade{grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:10px;padding:12px 14px}",
      ".bxpub-item img{height:118px}",
      ".bxpub-acoes button{min-height:40px;flex:1 1 46%}",
      ".bxpub-rodape{padding:8px 14px}",
      "}"
    ].join("");
    document.head.appendChild(style);
  }

  function desenhar() {
    var overlay = $(".bxpub-overlay");
    if (!overlay) return;
    var grade = $("[data-bxpub-grade]", overlay);
    var avisos = $("[data-bxpub-avisos]", overlay);
    var ref = referenciaAtual();
    var subtitulo = $("[data-bxpub-ref]", overlay);
    if (subtitulo) subtitulo.textContent = ref ? "Passagem aberta: " + ref + (lugaresDaPassagem().length ? " • " + lugaresDaPassagem().slice(0, 3).map(function (l) { return l.pt; }).join(", ") : "") : "Escolha a passagem na Bíblia para o vínculo automático";

    var campoBusca = $("[data-bxpub-busca]", overlay);
    if (campoBusca && !campoBusca.value) campoBusca.value = estado.consulta || montarConsulta();

    $$("[data-bxpub-tema]", overlay).forEach(function (b) {
      b.classList.toggle("is-on", b.getAttribute("data-bxpub-tema") === estado.tema);
    });
    $$("[data-bxpub-fonte]", overlay).forEach(function (b) {
      b.classList.toggle("is-on", !!estado.fontes[b.getAttribute("data-bxpub-fonte")]);
    });
    var chave = $("[data-bxpub-chave]", overlay);
    if (chave) chave.classList.toggle("is-on", estado.fontes.pexels);

    if (avisos) {
      avisos.innerHTML = estado.avisos.length
        ? estado.avisos.map(function (a) { return '<p class="bxpub-aviso">' + esc(a) + "</p>"; }).join("")
        : "";
    }

    if (!grade) return;
    if (estado.carregando) {
      grade.innerHTML = '<p class="bxpub-vazio">Buscando imagens em ' + Object.keys(estado.fontes).filter(function (f) { return estado.fontes[f]; }).length + ' fonte(s)…</p>';
      return;
    }
    if (!estado.itens.length) {
      grade.innerHTML = '<p class="bxpub-vazio">Nenhuma imagem encontrada para <b>' + esc(estado.consulta || montarConsulta()) + '</b>.<br>Tente outro tema, outro termo de busca ou troque as fontes.</p>';
      return;
    }
    grade.innerHTML = estado.itens.map(function (item) {
      var salvo = !!estado.salvo[item.id];
      return '<article class="bxpub-item">'
        + '<img src="' + esc(item.thumb) + '" alt="' + esc(item.titulo) + '" loading="lazy" referrerpolicy="no-referrer" data-bxpub-img="' + esc(item.id) + '">'
        + "<div>"
        + "<strong>" + esc(item.titulo) + "</strong>"
        + "<small>" + esc(item.fonte) + (item.largura ? " • " + item.largura + "×" + item.altura : "") + "</small>"
        + "<em>" + esc(item.autor) + " • " + esc(item.licenca) + "</em>"
        + '<div class="bxpub-acoes">'
        + '<button type="button" data-bxpub-abrir="' + esc(item.id) + '">🔗 Abrir</button>'
        + '<button type="button" data-bxpub-copiar="' + esc(item.id) + '">⧉ Crédito</button>'
        + '<button type="button" class="' + (salvo ? "is-salvo" : "") + '" data-bxpub-salvar="' + esc(item.id) + '">' + (salvo ? "✓ Na Mídia X" : "💾 Mídia X") + "</button>"
        + "</div></div></article>";
    }).join("");
  }

  function itemPorId(id) {
    for (var i = 0; i < estado.itens.length; i++) if (estado.itens[i].id === id) return estado.itens[i];
    return null;
  }

  function copiar(txt) {
    if (navigator.clipboard && navigator.clipboard.writeText) return navigator.clipboard.writeText(txt);
    var a = document.createElement("textarea");
    a.value = txt; document.body.appendChild(a); a.select();
    try { document.execCommand("copy"); } catch (_) {}
    document.body.removeChild(a);
    return Promise.resolve();
  }

  function abrir() {
    css();
    if ($(".bxpub-overlay")) { $(".bxpub-overlay").remove(); }
    var overlay = document.createElement("div");
    overlay.className = "bxpub-overlay";
    overlay.innerHTML = '<section class="bxpub-card" role="dialog" aria-modal="true" aria-label="Imagens de fontes públicas">'
      + '<header class="bxpub-head"><div><small>ACERVOS PÚBLICOS</small><h3>🖼 Imagens de fontes públicas</h3><p data-bxpub-ref></p></div>'
      + '<button type="button" class="bxpub-fechar" data-bxpub-fechar aria-label="Fechar">×</button></header>'
      + '<div class="bxpub-controles">'
      + '<input type="search" data-bxpub-busca placeholder="O que procurar? Ex.: Jerusalem ruins" aria-label="Termo de busca">'
      + '<button type="button" class="bxpub-btn is-primary" data-bxpub-buscar>🔎 Buscar imagens</button>'
      + "</div>"
      + '<div class="bxpub-fontes">'
      + TEMAS.map(function (t) { return '<button type="button" class="bxpub-chip" data-bxpub-tema="' + t.id + '">' + t.rotulo + "</button>"; }).join("")
      + '<button type="button" class="bxpub-chip" data-bxpub-fonte="wikimedia">Wikimedia</button>'
      + '<button type="button" class="bxpub-chip" data-bxpub-fonte="openverse">Openverse</button>'
      + '<button type="button" class="bxpub-chip" data-bxpub-fonte="pexels">🔑 Pexels</button>'
      + "</div>"
      + '<div class="bxpub-chave"><input type="password" data-bxpub-pexels placeholder="Chave da API Pexels (fica só neste navegador)" aria-label="Chave Pexels">'
      + '<button type="button" class="bxpub-btn" data-bxpub-salvarchave>Salvar chave</button></div>'
      + '<div data-bxpub-avisos></div>'
      + '<div class="bxpub-pe"><div class="bxpub-grade" data-bxpub-grade></div></div>'
      + '<footer class="bxpub-rodape">Imagens de acervos de terceiros (Wikimedia Commons, Openverse, Pexels). Cada autor e licença aparece no cartão — confira a licença na página de origem antes de reutilizar. O crédito é salvo junto quando você manda para a Mídia X.</footer>'
      + "</section>";
    document.body.appendChild(overlay);
    estado.aberto = true;

    overlay.addEventListener("click", function (ev) {
      var alvo = ev.target;
      if (alvo.classList.contains("bxpub-overlay") || alvo.closest("[data-bxpub-fechar]")) { fechar(); return; }
      var tema = alvo.closest("[data-bxpub-tema]");
      if (tema) {
        estado.tema = tema.getAttribute("data-bxpub-tema");
        var campo = $("[data-bxpub-busca]", overlay);
        if (campo) campo.value = montarConsulta();
        estado.consulta = campo ? campo.value : estado.consulta;
        buscar();
        return;
      }
      var fonte = alvo.closest("[data-bxpub-fonte]");
      if (fonte) {
        var nome = fonte.getAttribute("data-bxpub-fonte");
        estado.fontes[nome] = !estado.fontes[nome];
        if (nome === "pexels" && estado.fontes.pexels && !estado.pexelsKey) desenhar();
        else buscar();
        return;
      }
      if (alvo.closest("[data-bxpub-salvarchave]")) {
        var entrada = $("[data-bxpub-pexels]", overlay);
        var valor = entrada ? entrada.value.trim() : "";
        if (valor) {
          estado.pexelsKey = valor;
          try { localStorage.setItem(LS_PEXELS, valor); } catch (_) {}
          estado.fontes.pexels = true;
          buscar();
        }
        return;
      }
      if (alvo.closest("[data-bxpub-buscar]")) { buscar(); return; }
      var img = alvo.closest("[data-bxpub-img]");
      if (img) {
        var it = itemPorId(img.getAttribute("data-bxpub-img"));
        if (it && it.pagina) window.open(it.pagina, "_blank", "noopener");
        return;
      }
      var abrirBtn = alvo.closest("[data-bxpub-abrir]");
      if (abrirBtn) {
        var it2 = itemPorId(abrirBtn.getAttribute("data-bxpub-abrir"));
        if (it2 && it2.pagina) window.open(it2.pagina, "_blank", "noopener");
        return;
      }
      var copiarBtn = alvo.closest("[data-bxpub-copiar]");
      if (copiarBtn) {
        var it3 = itemPorId(copiarBtn.getAttribute("data-bxpub-copiar"));
        if (it3) {
          copiar(it3.titulo + " — " + it3.autor + " (" + it3.licenca + ") • " + it3.fonte + " • " + (it3.pagina || it3.original));
          copiarBtn.textContent = "✓ Copiado";
          setTimeout(function () { copiarBtn.textContent = "⧉ Crédito"; }, 1400);
        }
        return;
      }
      var salvarBtn = alvo.closest("[data-bxpub-salvar]");
      if (salvarBtn) {
        var it4 = itemPorId(salvarBtn.getAttribute("data-bxpub-salvar"));
        if (!it4) return;
        salvarBtn.disabled = true;
        salvarBtn.textContent = "Salvando…";
        salvarNaMidiaX(it4).then(function () {
          salvarBtn.disabled = false;
          salvarBtn.classList.add("is-salvo");
          salvarBtn.textContent = "✓ Na Mídia X";
        }).catch(function (e) {
          salvarBtn.disabled = false;
          salvarBtn.textContent = "💾 Mídia X";
          estado.avisos.push("Não foi possível salvar: " + (e && e.message ? e.message : e));
          desenhar();
        });
        return;
      }
    });

    overlay.addEventListener("keydown", function (ev) {
      if (ev.key === "Escape") { ev.stopPropagation(); fechar(); }
      if (ev.key === "Enter" && ev.target && ev.target.matches("[data-bxpub-busca]")) { ev.preventDefault(); buscar(); }
    });

    desenhar();
    buscar();
  }

  function fechar() {
    var overlay = $(".bxpub-overlay");
    if (overlay) overlay.remove();
    estado.aberto = false;
  }

  /* ---------- botões ---------- */
  function botaoDock() {
    var b = document.createElement("button");
    b.type = "button";
    b.setAttribute("data-bx-public-images", "1");
    b.className = "bxpub-disparo";
    b.textContent = "🖼 Fontes públicas";
    b.title = "Buscar imagens de acervos públicos sobre esta passagem";
    return b;
  }

  var pendente = false;
  function garantirBotoes() {
    if (pendente) return;
    pendente = true;
    setTimeout(function () {
      pendente = false;
      var dockNav = document.querySelector(".bx-verse-ai-dock nav");
      if (dockNav && !dockNav.querySelector("[data-bx-public-images]")) dockNav.appendChild(botaoDock());

      var acoesImersao = document.querySelector(".bx-immersion-stage-actions");
      if (acoesImersao && !acoesImersao.querySelector("[data-bx-public-images]")) {
        var referencia = acoesImersao.querySelector('[data-imm-action="visual"]');
        var botao = botaoDock();
        if (referencia && referencia.nextSibling) acoesImersao.insertBefore(botao, referencia.nextSibling);
        else acoesImersao.appendChild(botao);
      }
    }, 60);
  }

  function ligar() {
    document.addEventListener("click", function (ev) {
      var alvo = ev.target && ev.target.closest ? ev.target.closest("[data-bx-public-images]") : null;
      if (!alvo) return;
      ev.preventDefault();
      ev.stopPropagation();
      if (estado.aberto) { fechar(); return; }
      estado.consulta = "";
      abrir();
    }, true);

    try {
      var guardada = localStorage.getItem(LS_PEXELS);
      if (guardada) { estado.pexelsKey = guardada; }
    } catch (_) {}

    new MutationObserver(garantirBotoes).observe(document.body, { childList: true, subtree: true });
    garantirBotoes();
    window.addEventListener("hashchange", garantirBotoes);
  }

  window.BXPublicImages = {
    versao: VERSAO,
    abrir: abrir,
    fechar: fechar,
    buscar: buscar,
    montarConsulta: montarConsulta,
    lugaresDaPassagem: lugaresDaPassagem,
    definirChavePexels: function (chave) {
      estado.pexelsKey = String(chave || "").trim();
      try { localStorage.setItem(LS_PEXELS, estado.pexelsKey); } catch (_) {}
    }
  };

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", ligar);
  else ligar();
})();
