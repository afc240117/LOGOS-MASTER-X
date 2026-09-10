/* LOGOS MASTER X — 5.4.249 — Fontes públicas de imagem, vídeo e 360°
   ------------------------------------------------------------------
   Botão "🖼 Fontes públicas": busca foto, vídeo e panorama 360° de acervos
   públicos sobre a passagem aberta (lugares bíblicos, ruínas da época,
   cultura, geografia) e mostra o crédito de cada um.

   Fontes (todas consultadas do próprio navegador, sem servidor nosso):
   • Wikimedia Commons — sem chave, CORS liberado (origin=*). Foto e vídeo.
   • Openverse        — sem chave, acervo CC de vários museus e bancos.
   • Pexels           — opcional: exige chave própria do usuário, guardada
                        apenas neste navegador (localStorage logosx:pexelsKey).
                        Foto e vídeo.

   Regras de qualidade (pedido do usuário):
   • Só ALTA DEFINIÇÃO — piso por tipo: foto 1200×700, vídeo 1280×720,
     panorama 360° 2000×700. Se nenhum acervo tiver HD no tema, a grade mostra
     o melhor disponível e diz isso na tela.
   • Arte e papelada BLOQUEADAS — pintura, gravura, desenho, aquarela, mosaico,
     ícone, escultura, livro/mapa digitalizado, manuscrito. Olha o título E as
     categorias do Wikimedia (o título engana).
   • Miniatura conferida de verdade: a imagem é carregada no navegador antes de
     entrar na grade. O que não abre (arquivo removido, hotlink bloqueado) não
     aparece — era isso que deixava cartão só com texto.

   Ao clicar, o resultado abre no NOSSO visualizador (zoom, girar 90°, baixar,
   tela cheia, anterior/próxima) e o 360° no nosso panorama — não em aba do
   site de origem. O link do acervo fica no botão 🔗 Origem.

   Nada é enviado para servidores nossos: a consulta sai daqui direto para
   a fonte escolhida. Cada mídia mantém autor e licença visíveis, porque
   quase todas exigem crédito.
   ------------------------------------------------------------------ */
(function () {
  "use strict";

  var VERSAO = "5.4.249";
  var LS_PEXELS = "logosx:pexelsKey";
  var LIMITE_WIKIMEDIA = 24;
  var LIMITE_OPENVERSE = 20;
  var LIMITE_PEXELS = 18;

  /* Alta definição. Foto pequena vira borrão no telão da imersão; o piso é por
     tipo de mídia porque panorama 360 é enorme e vídeo mede diferente. */
  var MIN_FOTO = { largura: 1200, altura: 700 };
  var MIN_VIDEO = { largura: 1280, altura: 720 };
  var MIN_360 = { largura: 2000, altura: 700 };

  var estado = {
    aberto: false,
    consulta: "",
    tema: "lugares",
    fontes: { wikimedia: true, openverse: true, pexels: false },
    carregando: false,
    fase: "",
    itens: [],
    /* itens já aprovados que ainda não estão na tela (o "Carregar mais" solta) */
    reserva: [],
    chaves: {},
    rodada: 0,
    extras: [],
    consultaBase: "",
    semMais: false,
    maisCarregando: false,
    avisos: [],
    salvo: {},
    pexelsKey: "",
    /* A chave do Pexels vive no SERVIDOR (PEXELS_API_KEY). Quando ela existe, o
       Pexels já vem ligado e nenhum usuário precisa da chave dele. O campo
       "minha própria chave" fica escondido e só aparece se faltar no servidor. */
    pexelsServidor: false,
    mostrarChave: false
  };

  /* Abaixo disso a grade fica pobre e a busca desce um degrau (ver
     montarTentativas). */
  var MINIMO = 8;
  /* Quantos cartões entram por vez. O resto fica na reserva e o botão "Carregar
     mais" vai soltando — a grade cresce sem fim, a cada clique. */
  var LOTE = 18;

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

  /* Termos curtos de propósito: os acervos devolvem pouca coisa quando a
     consulta tem muitas palavras (testado: 3 a 4 palavras é o limite útil). */
  /* Os temas são de escolha única, então "🔎 Tudo" é o que faz a busca larga:
     foto, panorama 360 e vídeo na MESMA passada, tudo junto. Assim ninguém
     precisa escolher um e perder o outro. */
  var TEMAS = [
    { id: "tudo", rotulo: "🔎 Tudo", termos: "biblical sites", midia: "tudo" },
    { id: "lugares", rotulo: "🗺 Lugares bíblicos", termos: "biblical sites" },
    { id: "ruinas", rotulo: "🏺 Ruínas e arqueologia", termos: "holy land ruins" },
    { id: "cultura", rotulo: "🏛 Cultura e costumes", termos: "biblical archaeology" },
    { id: "paisagem", rotulo: "🌄 Paisagem e geografia", termos: "ancient israel" },
    { id: "objetos", rotulo: "⚱ Objetos e utensílios", termos: "ancient oil lamp" },
    { id: "panorama", rotulo: "🌐 Panorama 360°", termos: "360", midia: "360" },
    { id: "videos", rotulo: "🎥 Vídeos", termos: "biblical sites", midia: "video" }
  ];

  /* "foto" (padrão), "360", "video" ou "tudo" — decide quais acervos são
     consultados e qual piso de alta definição vale. */
  function midiaAtual() { return temaAtual().midia || "foto"; }
  function minimoDaMidia(midia) {
    if (midia === "video") return MIN_VIDEO;
    if (midia === "360") return MIN_360;
    return MIN_FOTO;
  }

  /* A busca em cascata repete a mesma falha a cada degrau: o aviso entra uma
     vez só, senão a tela mostra a mesma linha três vezes. */
  function avisar(msg) {
    if (msg && estado.avisos.indexOf(msg) === -1) estado.avisos.push(msg);
  }

  /* ---------- utilidades ---------- */
  function $(sel, raiz) { return (raiz || document).querySelector(sel); }
  function $$(sel, raiz) { return Array.prototype.slice.call((raiz || document).querySelectorAll(sel)); }
  function semAcento(txt) {
    return String(txt || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
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

  /* Quando o painel é aberto pelo botão de UM versículo, a referência e o texto
     dele mandam na busca (é o que o usuário acabou de apontar). */
  var refForcada = "";
  var textoForcado = "";
  function usarVersiculo(ref) {
    refForcada = String(ref || "").trim();
    textoForcado = "";
    if (!refForcada) return;
    var el = document.querySelector('[data-bx-verse-text="' + refForcada.replace(/"/g, '\\"') + '"]');
    if (el) textoForcado = el.textContent || "";
  }

  function referenciaAtual() {
    if (refForcada) return refForcada;
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
    if (textoForcado) partes.push(textoForcado);
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
  function lugaresEmIngles() {
    var vistos = [];
    lugaresDaPassagem().forEach(function (l) {
      if (vistos.indexOf(l.en) === -1) vistos.push(l.en); /* jerusalém/jerusalem não entram duas vezes */
    });
    return vistos;
  }

  function montarConsulta() {
    var lugares = lugaresEmIngles().slice(0, 2);
    var base = lugares.length ? lugares.join(" ") : (livroEmIngles() ? livroEmIngles() + " holy land" : "holy land biblical");
    return (base + " " + temaAtual().termos).replace(/\s+/g, " ").trim();
  }

  /* Se a consulta cheia não devolver nada, tenta variantes mais largas —
     nunca deixa a tela vazia quando existe imagem no acervo.
     Ordem pensada com medição real: consulta cheia → lugar + tema → só o tema
     (o tema sozinho sempre devolve acervo) → lugar puro → "holy land". */
  function montarTentativas() {
    var lista = [];
    var juntar = function (q) {
      q = String(q || "").replace(/\s+/g, " ").trim();
      if (q && lista.indexOf(q) === -1) lista.push(q);
    };
    var lugares = lugaresEmIngles();
    var termos = temaAtual().termos;
    var midia = midiaAtual();
    var lugar = lugares.length ? lugares[0] : "";
    juntar(estado.consulta);

    /* 360: medido no Commons — "Jerusalem 360" devolve 360 de verdade do lugar
       (até 25000×1650), enquanto "360 panorama" sozinho devolve os Alpes. O
       lugar vem primeiro e o termo genérico fica para o fim, onde o portão de
       lugar (ehDoTema) já descartou o que não é da Terra Santa. */
    if (midia === "360") {
      if (lugar) { juntar(lugar + " 360"); juntar(lugar + " panorama"); }
      juntar("360 panorama");
      if (lugar) juntar(lugar);
      juntar("holy land");
      return lista;
    }

    /* Vídeo: medido — o acervo de vídeo do Commons só rende com consulta de
       LUGAR ("Jerusalem old city" = 15 em HD; "biblical sites" = zero). */
    if (midia === "video") {
      if (lugar) {
        juntar(lugar + " old city");
        juntar(lugar + " city");
        juntar(lugar + " aerial");
        juntar(lugar + " western wall");
      }
      juntar(termos);
      if (lugar) juntar(lugar);
      juntar("holy land");
      return lista;
    }

    /* "Jerusalem biblical sites" ainda é curto o bastante; já "Jerusalem holy
       land ruins" (4 palavras) os acervos devolvem vazio — então não junta. */
    if (lugares.length && !/^(holy land|ancient)\b/i.test(termos)) juntar(lugar + " " + termos);
    if (midia === "tudo") {
      /* foto + 360 + vídeo na mesma busca: os degraus de cada mídia entram aqui */
      if (lugar) { juntar(lugar + " 360"); juntar(lugar + " old city"); juntar(lugar + " aerial"); }
      juntar("360 panorama");
    }
    juntar(termos);
    if (lugares.length) juntar(lugar);
    juntar("holy land");
    return lista;
  }

  /* Acervos públicos devolvem muita coisa que não é foto do lugar: livros e
     mapas digitalizados, e reproduções (pintura, gravura, aquarela). Para a
     passagem queremos a foto — estes títulos descem na nota. */
  /* Arte e papelada. O usuário pediu bloqueio: pintura/gravura/desenho e livro
     ou mapa digitalizado não ilustram a passagem, então saem da lista de vez
     (antes só caíam de nota e voltavam quando o acervo era pobre). */
  var NAO_E_FOTO = /paint|oil on|watercolou?r|gouache|tempera|\bfresco|aquarela|\bdrawing\b|\bsketch|woodcut|etching|engraving|lithograph|aquatint|mezzotint|caricature|woodblock|\bposter\b|postcard|illuminat|\bicon\b|iconost|triptych|altarpiece|polyptych|\bsculpture|statue|statuette|\bbust\b|\brelief\b|tapestry|mosaic|stained glass|\bWGA\d|museum of art|national gallery|mus[ée]e|pinacoteca|kunsthalle|rijksmuseum|louvre|uffizi|\bprado\b|hermitage|art institute|getty museum|auction|christie|sotheby|photochrom|stereograph|stereo view|lantern slide|facsimile|reprint|manuscript|codex|papyrus|digitized|scan(ned)?\b|\(ia |internet archive|short history|history of|\bbook\b|\blivro\b|\batlas\b|\bmap\b|\bmapa\b|gravura|pintura|desenho|estampa/i;

  /* As categorias do Wikimedia denunciam arte mesmo quando o título é inocente
     ("Jerusalem" numa pintura de 1870). Vale mais que o título. */
  var CATEGORIA_ARTE = /painting|drawing|engraving|woodcut|lithograph|\bprint|etching|artwork|art of|sculpture|statue|\bicon|manuscript|\bbook|old map|\bmaps\b|illustration|portrait|postcard|photochrom|stereograph|watercolou?r|fresco|mosaic|tapestry|illuminat|museum|archive|collection of/i;

  function ehReproducao(titulo, categorias) {
    var t = String(titulo || "");
    /* título com ano de 1600 a 1949 quase sempre é publicação antiga digitalizada
       ("LASKARIS ALEXANDROS 1856 A SHORT HISTORY OF THE CHURCH"), não foto. */
    if (/\b(1[6-9]\d{2}|19[0-4]\d)\b/.test(t)) return true;
    if (NAO_E_FOTO.test(t)) return true;
    var cats = Array.isArray(categorias) ? categorias.join(" | ") : String(categorias || "");
    return !!cats && CATEGORIA_ARTE.test(cats);
  }

  /* Alta definição: sem medida confiável a imagem passa (a miniatura real decide
     depois), mas com medida pequena não entra. */
  function ehAltaDefinicao(item, midia) {
    /* em "Tudo" a grade mistura foto, 360 e vídeo: o piso é o de cada um */
    var min = minimoDaMidia(midia === "tudo" ? item.midia : midia);
    if (!item.largura || !item.altura) return true;
    return item.largura >= min.largura && item.altura >= min.altura;
  }

  /* ---------- miniatura de verdade ----------
     O acervo devolve URL que não abre (hotlink bloqueado, arquivo removido) e o
     cartão ficava só com o texto. Aqui a imagem é carregada de fato antes de
     entrar na grade; o que não carrega não aparece. */
  function miniaturaViva(url, limite) {
    return new Promise(function (resolve) {
      if (!url) { resolve(false); return; }
      var img = new Image();
      var encerrado = false;
      var fim = function (ok) {
        if (encerrado) return;
        encerrado = true;
        clearTimeout(relogio);
        img.onload = img.onerror = null;
        resolve(ok);
      };
      var relogio = setTimeout(function () { fim(false); }, limite || 8000);
      img.onload = function () { fim(img.naturalWidth > 2 && img.naturalHeight > 2); };
      img.onerror = function () { fim(false); };
      img.referrerPolicy = "no-referrer";
      img.decoding = "async";
      img.src = url;
    });
  }

  function conferirMiniaturas(lista) {
    return Promise.all(lista.map(function (item) {
      return miniaturaViva(item.thumb).then(function (ok) { return ok ? item : null; });
    })).then(function (arr) { return arr.filter(Boolean); });
  }

  /* Foto de evento moderno (político, turista, festa) não serve de ilustração
     da passagem, mesmo quando cita o lugar certo. */
  function ehEventoModerno(titulo, item) {
    var t = String(titulo || "");
    /* "walking tour" é exatamente o que se quer em vídeo: gravação de quem
       esteve lá, para entrar no lugar sem estar nele. Em foto parada "tour" só
       trazia político e comício — aí continua fora. */
    var deVideo = !!(item && (item.midia === "video" || item.midia === "360"));
    if (!deVideo && /\btourist\b|\btour\b|selfie/i.test(t)) return true;
    return /\bpresident\b|\btrump\b|\bminister\b|ambassador|\bwedding\b|festival|\bprotest\b|\bidf\b|\bsoldier|\binterview\b|co-founder|\bceo\b|conference|keynote|\blecture\b|\bpodcast\b|webinar/i.test(t);
  }

  /* O acervo de VÍDEO do Commons é pequeno e vem cheio de entrevista e palestra
     ("Adam Hochschild, Co-Founder, Mother Jones"). Vídeo só entra se o título
     falar de lugar, época ou escavação. Pexels não passa por aqui: a busca dele
     já é ordenada por relevância. */
  var LOCAL_DO_TEMA = /israel|jerusal|bible|biblical|holy land|galile|jordan|judea|judaea|samaria|ancient|archaeolog|archeolog|\bruin|temple|church|monaster|\bdesert|dead sea|sea of|nazareth|bethlehem|jericho|capernaum|masada|qumran|hebron|\bzions?\b|olive|excavation|pilgrim|synagogue|fortress|\btel\b|sepulchre|landscape|aerial|panorama|walking tour|old city|city of david|mount of olives|garden tomb|via dolorosa|sea of galilee|river jordan|western wall|golgotha|calvary|kidron|jezreel|armageddon|sodom|ur of the|babylon|nineveh|ephesus|corinth|athens|rome|antioch|patmos/i;

  /* Vídeo e 360 saem de acervos enormes e cheios de assunto alheio — o de vídeo
     do Commons é entrevista, palestra, bonde e incêndio; o de 360 é montanha
     alpina quando a consulta é só "360 panorama". Medido: vídeo do Commons só
     rende com consulta de LUGAR ("Jerusalem old city" = 15 em HD; "biblical
     sites" = zero). Então os dois passam por um portão de lugar, e o vídeo ainda
     tem um bloqueio do que claramente não é lugar nenhum. */
  var VIDEO_FORA = /\brail\b|\btram\b|\btrain\b|railway|wildfire|\bfire\b|fireworks|construction|air ?force|fly ?by|military|\bnavy\b|\barmy\b|missile|weapon|\bcar\b|\bcars\b|traffic|vehicle|motorc|driving|\bdrive\b|highway|nightlife|fashion|makeup|\bconcert\b|\bdance\b|\bsport|football|soccer|basketball|\bgaming\b|\bdog\b|\bcat\b|\bbaby\b|\bfood\b|restaurant|cooking|recipe|\bmall\b|shopping|stock market|\bwedding\b|influencer|unboxing|tutorial|review|\bfestival\b|\bprotest\b|\bidf\b|\bsoldier|\binterview\b|co-founder|\bceo\b|conference|keynote|\blecture\b|podcast|webinar/i;
  /* Um 360 de verdade se anuncia: sem isso é foto larga qualquer. */
  var PANORAMA_MESMO = /360|panoram|equirect|spherical|photosphere|wide ?angle|vista|view from|lookout|overlook/i;

  function ehDoTema(item) {
    if (item.midia !== "video" && item.midia !== "360") return true;
    var alvo = String(item.titulo || "") + " " + (item.categorias || []).join(" ");
    if (item.midia === "video" && VIDEO_FORA.test(alvo)) return false;
    if (item.midia === "360" && !PANORAMA_MESMO.test(alvo)) return false;
    return LOCAL_DO_TEMA.test(alvo);
  }

  function pontuar(item, consulta) {
    var titulo = semAcento(item.titulo);
    var termos = semAcento(consulta).split(/\s+/).filter(function (p) { return p.length > 3; });
    var pontos = 0;
    termos.forEach(function (p) { if (titulo.indexOf(p) !== -1) pontos += 2; });
    if (item.largura && item.altura) {
      var proporcao = item.largura / item.altura;
      if (proporcao >= 1) pontos += 1.5;
      else if (proporcao < 0.7) pontos -= 1;
    }
    if (ehReproducao(item.titulo, item.categorias)) pontos -= 8;
    if (ehEventoModerno(item.titulo)) pontos -= 6;
    /* quanto maior o original, melhor a imagem no telão */
    var megapixels = ((item.largura || 0) * (item.altura || 0)) / 1000000;
    if (megapixels >= 8) pontos += 3;
    else if (megapixels >= 4) pontos += 2;
    else if (megapixels >= 2) pontos += 1;
    if (item.largura >= 3840) pontos += 1.5; /* 4K */
    if (item.midia === "360") pontos += 1;
    if (item.midia === "video") pontos += 1;
    if (item.fonte.indexOf("Pexels") === 0) pontos += 0.6;
    else if (item.fonte.indexOf("Openverse") === 0) pontos += 0.4;
    return pontos;
  }

  /* ---------- fontes ---------- */
  function categoriasDe(info) {
    var bruto = info.categories || [];
    return (Array.isArray(bruto) ? bruto : []).map(function (c) {
      return String((c && c.title) || c || "");
    }).filter(Boolean);
  }

  /* filetype: "bitmap" para foto, "video" para vídeo. O Commons gera um quadro
     do vídeo como miniatura (thumburl), então o cartão mostra a imagem. */
  function buscaWikimedia(consulta, filetype, midia, salto) {
    var url = "https://commons.wikimedia.org/w/api.php?action=query&format=json&origin=*"
      + "&generator=search&gsrnamespace=6&gsrlimit=" + LIMITE_WIKIMEDIA
      + "&gsrsearch=" + encodeURIComponent("filetype:" + (filetype || "bitmap") + " " + consulta)
      /* o salto é o que permite "carregar mais" trazer resultado NOVO da mesma
         consulta em vez de repetir a primeira página */
      + (salto > 0 ? "&gsroffset=" + salto : "")
      + "&prop=imageinfo&iiprop=url|extmetadata|size|user|categories|mime&iiurlwidth=640";
    return fetch(url, { headers: { Accept: "application/json" } })
      .then(function (r) { if (!r.ok) throw new Error("HTTP " + r.status); return r.json(); })
      .then(function (json) {
        var paginas = json && json.query && json.query.pages ? Object.keys(json.query.pages).map(function (k) { return json.query.pages[k]; }) : [];
        return paginas.map(function (p) {
          var info = (p.imageinfo && p.imageinfo[0]) || {};
          var meta = info.extmetadata || {};
          var autor = limparHtml(meta.Artist && meta.Artist.value) || limparHtml(info.user) || "Autor não indicado";
          var licenca = limparHtml(meta.LicenseShortName && meta.LicenseShortName.value) || "Ver página do arquivo";
          var mime = String(info.mime || "");
          if (midia === "video" && mime.indexOf("video/") !== 0) return null;
          /* só webm e ogv abrem no navegador; o resto vira link */
          return {
            id: "wk-" + p.pageid,
            fonte: "Wikimedia Commons",
            titulo: String(p.title || "").replace(/^File:/, "").replace(/\.[a-z0-9]+$/i, ""),
            thumb: info.thumburl || "",
            original: info.url || info.descriptionurl || "",
            pagina: info.descriptionurl || "",
            autor: autor,
            licenca: licenca,
            categorias: categoriasDe(info),
            largura: info.width || 0,
            altura: info.height || 0,
            midia: midia || "foto",
            mime: mime,
            video: midia === "video" ? (info.url || "") : ""
          };
        }).filter(function (i) { return i && i.thumb; });
      });
  }

  /* Vídeo do Pexels: vem com pôster e MP4 — toca direto no cartão. */
  function buscaVideosPexels(consulta, pagina) {
    return pedirAoPexels("video", consulta, pagina)
      .then(function (json) {
        return (json && json.videos ? json.videos : []).map(function (v) {
          var arquivos = (v.video_files || []).filter(function (f) {
            return f && f.link && /mp4/i.test(f.file_type || "") && f.width;
          });
          /* o maior MP4 que ainda não passa de 1920 de largura (Full HD) */
          arquivos.sort(function (a, b) { return b.width - a.width; });
          var escolhido = null;
          for (var i = 0; i < arquivos.length; i++) {
            if (arquivos[i].width <= 1920) { escolhido = arquivos[i]; break; }
          }
          if (!escolhido && arquivos.length) escolhido = arquivos[arquivos.length - 1];
          if (!escolhido) return null;
          return {
            id: "pxv-" + v.id,
            fonte: "Pexels • vídeo",
            titulo: String(v.alt || "Vídeo de " + (v.user && v.user.name ? v.user.name : "autor Pexels")).slice(0, 120),
            thumb: v.image || "",
            original: escolhido.link,
            video: escolhido.link,
            pagina: v.url || "",
            autor: String((v.user && v.user.name) || "Pexels"),
            licenca: "Licença Pexels (uso livre; crédito apreciado)",
            largura: escolhido.width || v.width || 0,
            altura: escolhido.height || v.height || 0,
            midia: "video",
            mime: "video/mp4"
          };
        }).filter(function (i) { return i && i.thumb && i.video; });
      });
  }

  function buscaOpenverse(consulta, pagina) {
    var url = "https://api.openverse.org/v1/images/?q=" + encodeURIComponent(consulta)
      + "&page_size=" + LIMITE_OPENVERSE + "&mature=false"
      + (pagina > 1 ? "&page=" + pagina : "");
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
            altura: i.height || 0,
            midia: "foto"
          };
        }).filter(function (i) { return i.thumb; });
      });
  }

  /* A chave do Pexels é do dono do app e mora no SERVIDOR. Embuti-la no
     JavaScript entregaria ela a qualquer visitante (DevTools) e o repositório é
     público — por isso o caminho normal é pedir a este proxy. Só se o usuário
     tiver uma chave própria guardada aqui é que ele fala direto com o Pexels. */
  function pedirAoPexels(tipo, consulta, pagina) {
    var url, cabecalhos;
    var pag = Math.max(1, pagina || 1);
    if (estado.pexelsKey) {
      url = (tipo === "video" ? "https://api.pexels.com/videos/search" : "https://api.pexels.com/v1/search")
        + "?query=" + encodeURIComponent(consulta) + "&per_page=" + LIMITE_PEXELS + "&orientation=landscape"
        + (pag > 1 ? "&page=" + pag : "");
      cabecalhos = { Authorization: estado.pexelsKey, Accept: "application/json" };
    } else if (estado.pexelsServidor) {
      url = "/api/bible/public-images/pexels?tipo=" + (tipo === "video" ? "video" : "foto")
        + "&per_page=" + LIMITE_PEXELS + "&q=" + encodeURIComponent(consulta)
        + (pag > 1 ? "&pagina=" + pag : "");
      cabecalhos = { Accept: "application/json" };
    } else {
      return Promise.reject(new Error("chave ausente"));
    }
    return fetch(url, { headers: cabecalhos }).then(function (r) {
      if (r.status === 401) throw new Error("chave recusada");
      if (r.status === 429) throw new Error("cota esgotada");
      if (r.status === 503) throw new Error("chave ausente");
      if (!r.ok) throw new Error("HTTP " + r.status);
      return r.json();
    });
  }

  function buscaPexels(consulta, pagina) {
    return pedirAoPexels("foto", consulta, pagina)
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
            altura: p.height || 0,
            midia: "foto"
          };
        }).filter(function (i) { return i.thumb; });
      });
  }

  /* ---------- o que as fontes devolvem numa consulta ----------
     Usado pela busca inicial (em cascata) e pelo "carregar mais". Em "Tudo" as
     fontes de foto, vídeo e 360 são consultadas na MESMA passada: era isso que
     faltava, porque antes escolher um tema desmarcava o outro. */
  function tarefasDe(consulta, midia, pagina) {
    var pag = Math.max(1, pagina || 1);
    var salto = (pag - 1) * LIMITE_WIKIMEDIA;
    var tarefas = [];
    var erroPexels = function (e) {
      if (e.message === "chave ausente") avisar("Pexels: sem chave aqui — toque em 🔑 Pexels e cole a sua (é gratuita em pexels.com/api).");
      else if (e.message === "chave recusada") avisar("Pexels recusou a chave — confira em pexels.com/api se copiou a “API Key” inteira e salve de novo em 🔑.");
      else if (e.message === "cota esgotada") avisar("Pexels: cota esgotada por agora — as outras fontes continuam trazendo resultados.");
      else avisar("Pexels: " + e.message);
      return [];
    };
    if (estado.fontes.wikimedia) {
      if (midia === "video") {
        tarefas.push(buscaWikimedia(consulta, "video", "video", salto)
          .catch(function (e) { avisar("Wikimedia Commons: " + e.message); return []; }));
      } else {
        tarefas.push(buscaWikimedia(consulta, "bitmap", midia === "tudo" ? "foto" : midia, salto)
          .catch(function (e) { avisar("Wikimedia Commons: " + e.message); return []; }));
        /* o acervo de vídeo do Commons é outra busca: em "Tudo" ele entra junto */
        if (midia === "tudo") {
          tarefas.push(buscaWikimedia(consulta, "video", "video", salto).catch(function () { return []; }));
        }
      }
    }
    /* Openverse só tem imagem parada — fora das buscas de vídeo e de 360 */
    if ((midia === "foto" || midia === "tudo") && estado.fontes.openverse) {
      tarefas.push(buscaOpenverse(consulta, pag)
        .catch(function (e) { avisar("Openverse: " + e.message); return []; }));
    }
    if (estado.fontes.pexels) {
      var tipos = midia === "tudo" ? ["foto", "video"] : [midia === "video" ? "video" : "foto"];
      tipos.forEach(function (tp) {
        var pedido = tp === "video" ? buscaVideosPexels(consulta, pag) : buscaPexels(consulta, pag);
        tarefas.push(pedido.catch(erroPexels));
      });
    }
    return Promise.all(tarefas);
  }

  /* Uma chave curta por item: o mesmo arquivo aparece em várias fontes e com
     títulos quase iguais, e o "carregar mais" não pode repetir o que já está na
     tela. */
  function chaveDoItem(item) {
    return semAcento(item.titulo).replace(/[^a-z0-9 ]/g, "").slice(0, 34) + "|" + item.fonte.split(" • ")[0];
  }

  /* Junta as listas das fontes, tira repetidos (inclusive contra o que já foi
     mostrado em cliques anteriores) e aplica os portões de assunto e HD. */
  function limparListas(listas, midia, semHD) {
    var novos = [];
    listas.forEach(function (lista) {
      (lista || []).forEach(function (item) {
        if (!item) return;
        var chave = chaveDoItem(item);
        if (estado.chaves[chave]) return;
        estado.chaves[chave] = 1;
        novos.push(item);
      });
    });
    return novos.filter(function (item) {
      /* Arte, livro e mapa digitalizado ficam de fora DEFINITIVAMENTE; vídeo e
         360 ainda passam pelo portão de lugar (ver ehDoTema). */
      return !ehReproducao(item.titulo, item.categorias)
        && !ehEventoModerno(item.titulo, item)
        && ehDoTema(item)
        && (semHD || ehAltaDefinicao(item, midia));
    });
  }

  /* A tela não recebe tudo de uma vez: entra um lote e o resto fica na reserva,
     que o botão "Carregar mais" vai despejando. */
  function porNaReserva(itens, consulta) {
    itens.sort(function (a, b) { return pontuar(b, consulta) - pontuar(a, consulta); });
    estado.itens = estado.itens.concat(itens.slice(0, LOTE));
    estado.reserva = estado.reserva.concat(itens.slice(LOTE));
  }

  /* Consultas vizinhas para o "carregar mais": quando o mesmo acervo se esgota,
     o termo muda e a busca continua trazendo coisa nova. */
  function montarExtras(usadas) {
    var lugares = lugaresEmIngles();
    var lugar = lugares.length ? lugares[0] : "holy land";
    var tema = temaAtual();
    var base = tema.id === "videos" ? "aerial" : (tema.id === "panorama" ? "panorama" : tema.termos);
    var lista = [];
    var juntar = function (q) {
      q = String(q || "").replace(/\s+/g, " ").trim();
      if (q && usadas.indexOf(q) === -1 && lista.indexOf(q) === -1) lista.push(q);
    };
    [lugar + " " + base, lugar + " walking tour", lugar + " old city", lugar + " city",
      lugar + " aerial", lugar + " panorama", lugar + " archaeology", lugar + " ruins",
      lugar + " history", lugar + " landscape", lugar + " museum",
      "holy land " + base, "biblical sites", "ancient israel", "holy land ruins",
      "biblical archaeology", "ancient jerusalem", "israel archaeology",
      "holy land panorama", "biblical places", "ancient near east"
    ].forEach(juntar);
    return lista;
  }

  function buscar() {
    if (estado.carregando) return;
    estado.consulta = ($("[data-bxpub-busca]") || {}).value || estado.consulta || montarConsulta();
    estado.carregando = true;
    estado.avisos = [];
    estado.itens = [];
    estado.reserva = [];
    estado.chaves = {};
    estado.rodada = 0;
    estado.semMais = false;
    estado.consultaUsada = "";
    desenhar();

    var tentativas = montarTentativas();
    estado.extras = montarExtras(tentativas);
    estado.consultaBase = tentativas[0] || estado.consulta;

    var tentativas = montarTentativas();
    if (!Object.keys(estado.fontes).some(function (f) { return estado.fontes[f]; })) {
      estado.carregando = false;
      estado.avisos.push("Escolha ao menos uma fonte.");
      desenhar();
      return;
    }

    var midia = midiaAtual();
    var indice = 0;
    var melhorSemHD = [];
    var tentar = function () {
      var consulta = tentativas[indice++];
      return tarefasDe(consulta, midia, 1).then(function (listas) {
        var tudo = [];
        listas.forEach(function (lista) {
          (lista || []).forEach(function (item) {
            var chave = chaveDoItem(item);
            if (estado.chaves[chave]) return;
            estado.chaves[chave] = 1;
            tudo.push(item);
          });
        });
        /* Aqui a peneira é sem o piso de HD, para guardar o melhor conjunto sem
           alta definição visto na cascata — só no último degrau ele é aceito. */
        var naoArte = tudo.filter(function (item) {
          return !ehReproducao(item.titulo, item.categorias)
            && !ehEventoModerno(item.titulo, item)
            && ehDoTema(item);
        });
        if (!naoArte.length && tudo.length) avisar("O acervo só devolveu arte, livro, mapa digitalizado ou vídeo/360 fora do tema para «" + consulta + "» — nada disso ilustra a passagem.");
        if (naoArte.length > melhorSemHD.length) melhorSemHD = naoArte;
        var hd = naoArte.filter(function (item) { return ehAltaDefinicao(item, midia); });
        var ultimoDegrau = indice >= tentativas.length;
        /* Enquanto houver degrau, continuar caçando ALTA DEFINIÇÃO: só no último
           é que se aceita acervo sem HD (antes, o primeiro degrau — quase sempre o
           mais pobre — fechava a grade em foto pequena e nem tentava o resto). */
        if (hd.length < MINIMO && !ultimoDegrau) return tentar();
        var usouSemHD = hd.length < MINIMO;
        var grade = usouSemHD && melhorSemHD.length > hd.length ? melhorSemHD : hd;
        if (!grade.length) {
          estado.itens = [];
          estado.consultaUsada = consulta;
          estado.carregando = false;
          desenhar();
          return;
        }
        grade.sort(function (a, b) { return pontuar(b, consulta) - pontuar(a, consulta); });
        /* confere no navegador se a miniatura realmente abre: o que não abre não
           entra na grade (era o cartão "só com texto") */
        estado.fase = "Conferindo as miniaturas…";
        desenhar();
        return conferirMiniaturas(grade.slice(0, 40)).then(function (vivos) {
          var perdidos = grade.length - vivos.length;
          if (vivos.length < MINIMO && !ultimoDegrau && vivos.length < grade.length) return tentar();
          estado.consultaBase = consulta;
          estado.itens = [];
          estado.reserva = [];
          porNaReserva(vivos, consulta);
          estado.consultaUsada = consulta;
          estado.fase = "";
          if (consulta !== estado.consulta) {
            estado.avisos.push("Sem resultados para «" + estado.consulta + "» — a busca foi ampliada para «" + consulta + "».");
          }
          if (perdidos > 0) avisar(perdidos + " resultado(s) saíram: a miniatura não abria no navegador (imagem removida ou bloqueada na origem).");
          if (usouSemHD && vivos.length) avisar("Nenhuma fonte tinha alta definição para este tema — a grade mostra o melhor disponível.");
          estado.carregando = false;
          desenhar();
        });
      });
    };
    return tentar();
  }

  /* ---------- carregar mais (sem fim) ----------
     Cada clique desce um degrau: primeiro o MESMO acervo mais fundo (offset no
     Commons, página no Openverse e no Pexels), depois uma consulta vizinha, e
     depois volta a aprofundar — sempre trazendo o que ainda não apareceu. */
  function proximaLeva() {
    var midia = midiaAtual();
    var n = estado.rodada++;
    var consulta, pagina;
    if (n === 0) { consulta = estado.consultaBase; pagina = 2; }
    else if (n === 1) { consulta = estado.consultaBase; pagina = 3; }
    else {
      var i = n - 2;
      if (estado.extras.length) {
        consulta = estado.extras[i % estado.extras.length];
        pagina = Math.floor(i / estado.extras.length) + 2;
      } else {
        consulta = estado.consultaBase;
        pagina = n + 2;
      }
    }
    return tarefasDe(consulta, midia, pagina).then(function (listas) {
      /* só o que passa no portão de assunto; o piso de HD aqui é do próprio item */
      var novos = limparListas(listas, midia, true).filter(function (item) {
        return ehAltaDefinicao(item, midia);
      });
      if (!novos.length) {
        /* este degrau secou: desce o próximo na hora, mas com limite — sem isso
           um acervo esgotado viraria laço infinito de requisições */
        if (estado.rodada - n < 4 && estado.rodada < 80) return proximaLeva();
        estado.semMais = true;
        return 0;
      }
      return conferirMiniaturas(novos.slice(0, 40)).then(function (vivos) {
        porNaReserva(vivos, consulta);
        return vivos.length;
      });
    });
  }

  function carregarMais() {
    if (estado.maisCarregando || estado.carregando) return;
    if (estado.reserva.length) {
      estado.itens = estado.itens.concat(estado.reserva.splice(0, LOTE));
      desenhar();
      return;
    }
    if (estado.semMais) return;
    estado.maisCarregando = true;
    estado.fase = "Buscando mais imagens e vídeos…";
    desenhar();
    proximaLeva().then(function (quantos) {
      estado.maisCarregando = false;
      estado.fase = "";
      if (quantos) estado.itens = estado.itens.concat(estado.reserva.splice(0, LOTE));
      desenhar();
    }).catch(function (e) {
      estado.maisCarregando = false;
      estado.fase = "";
      avisar("Não deu para carregar mais agora: " + (e && e.message ? e.message : e));
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
      type: item.midia === "video" ? "video" : "image",
      mime: item.mime || "",
      reference: ref,
      relatedReferences: candidatos({ reference: ref, title: item.titulo, tags: ["fontes-publicas", "imagem"] }),
      description: "Imagem de acervo público vinculada a " + ref + ".",
      tags: ["fontes-publicas", item.midia === "video" ? "video" : "imagem", item.fonte]
        .concat(item.midia === "360" ? ["360"] : []),
      credits: item.autor + " — " + item.fonte,
      license: item.licenca || "Confira a licença na página de origem",
      sourceKind: "public",
      sourceUrl: (item.midia === "video" ? item.video : "") || item.pagina || item.original || "",
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
      ".bxpub-aviso.is-conta{border-color:rgba(120,190,255,.28);background:rgba(24,58,92,.28);color:#bcd7ef}",
      ".bxpub-grade{display:grid;grid-template-columns:repeat(auto-fill,minmax(196px,1fr));gap:12px;padding:14px 20px;overflow:auto;flex:1 1 auto}",
      ".bxpub-item{display:flex;flex-direction:column;border:1px solid rgba(134,200,255,.18);border-radius:14px;background:#061321;overflow:hidden}",
      ".bxpub-item{position:relative}",
      ".bxpub-item img,.bxpub-item video{display:block;width:100%;height:150px;object-fit:cover;background:#02070d;cursor:zoom-in}",
      ".bxpub-item video{cursor:default}",
      ".bxpub-item.is-360 img{object-fit:contain}",
      ".bxpub-selos{position:absolute;top:8px;left:8px;display:flex;flex-wrap:wrap;gap:4px;pointer-events:none}",
      ".bxpub-selo{font-style:normal;padding:3px 7px;border-radius:999px;font-size:.62rem;font-weight:900;letter-spacing:.04em;border:1px solid rgba(0,0,0,.45);background:rgba(4,14,24,.82);color:#dff1ff}",
      ".bxpub-selo.is-hd{color:#9ff0dc;border-color:rgba(64,196,174,.5)}",
      ".bxpub-selo.is-video{color:#ffdca8;border-color:rgba(244,199,107,.55)}",
      ".bxpub-selo.is-360{color:#bfe3ff;border-color:rgba(134,200,255,.55)}",
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
      ".bxpub-chave{display:none;flex-direction:column;gap:8px;padding:0 20px 10px}",
      ".bxpub-chave.is-on{display:flex}",
      ".bxpub-chave-dica{margin:0;color:#9fb5ca;font-size:.78rem;line-height:1.5}",
      ".bxpub-chave-dica b{color:#cfe6ff}",
      ".bxpub-chave-dica a{color:#8fd0ff}",
      ".bxpub-chave-linha{display:flex;gap:8px;align-items:center}",
      ".bxpub-chave-linha input{flex:1 1 auto;min-width:0;min-height:40px;border:1px solid rgba(134,200,255,.28);border-radius:12px;background:#061321;color:#eef8ff;padding:8px 12px;font-size:.82rem}",
      ".bxpub-rodape{padding:10px 20px;border-top:1px solid rgba(150,196,232,.14);color:#8fa8bd;font-size:.72rem;line-height:1.45}",
      "@media(max-width:680px){",
      ".bxpub-overlay{padding:0}",
      ".bxpub-card{width:100vw;max-width:none;height:100vh;max-height:none;border-radius:0;border:0}",
      ".bxpub-head{padding:12px 14px}",
      ".bxpub-controles{padding:10px 14px}",
      ".bxpub-fontes{padding:0 14px 8px}",
      ".bxpub-grade{grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:10px;padding:12px 14px}",
      ".bxpub-item img,.bxpub-item video{height:118px}",
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
    /* O campo da chave do Pexels NÃO fica à mostra: quem usa o app não precisa
       de chave nenhuma, porque a do dono já vem do servidor. Ele só aparece se
       o servidor estiver sem chave E o usuário pedir (🔑 Pexels) — aí sim ele
       cola a dele, que fica só neste navegador (localStorage). */
    var chave = $("[data-bxpub-chave]", overlay);
    if (chave) {
      chave.classList.toggle("is-on", !!estado.mostrarChave);
      var entradaChave = $("[data-bxpub-pexels]", overlay);
      if (entradaChave && !entradaChave.value && estado.pexelsKey) entradaChave.value = estado.pexelsKey;
    }

    if (avisos) {
      var linhas = estado.avisos.map(function (a) { return '<p class="bxpub-aviso">' + esc(a) + "</p>"; });
      if (!estado.carregando && estado.itens.length) {
        linhas.push('<p class="bxpub-aviso is-conta">' + estado.itens.length + " resultado(s) • busca: «"
          + esc(estado.consultaUsada || estado.consulta) + "»</p>");
      }
      avisos.innerHTML = linhas.join("");
    }

    if (!grade) return;
    if (estado.carregando) {
      grade.innerHTML = '<p class="bxpub-vazio">' + esc(estado.fase || ("Buscando em " + Object.keys(estado.fontes).filter(function (f) { return estado.fontes[f]; }).length + " fonte(s)…")) + "</p>";
      return;
    }
    if (!estado.itens.length) {
      grade.innerHTML = '<p class="bxpub-vazio">Nenhum resultado em alta definição para <b>' + esc(estado.consulta || montarConsulta()) + '</b>.<br>Tente outro tema, outro termo de busca ou troque as fontes.</p>';
      return;
    }
    grade.innerHTML = estado.itens.map(function (item) {
      var salvo = !!estado.salvo[item.id];
      var selos = [];
      if (item.midia === "video") selos.push('<i class="bxpub-selo is-video">▶ Vídeo</i>');
      if (item.midia === "360") selos.push('<i class="bxpub-selo is-360">🌐 360°</i>');
      if (item.largura >= 3840) selos.push('<i class="bxpub-selo is-hd">4K</i>');
      else if (item.largura >= 1920) selos.push('<i class="bxpub-selo is-hd">Full HD</i>');
      else if (item.largura >= 1200) selos.push('<i class="bxpub-selo is-hd">HD</i>');
      var visor = item.midia === "video"
        ? '<video src="' + esc(item.video) + '" poster="' + esc(item.thumb) + '" preload="none" muted loop playsinline controls data-bxpub-video="' + esc(item.id) + '"></video>'
        : '<img src="' + esc(item.thumb) + '" alt="' + esc(item.titulo) + '" loading="lazy" referrerpolicy="no-referrer" data-bxpub-img="' + esc(item.id) + '">';
      return '<article class="bxpub-item' + (item.midia === "360" ? " is-360" : "") + '">'
        + visor
        + (selos.length ? '<span class="bxpub-selos">' + selos.join("") + "</span>" : "")
        + "<div>"
        + "<strong>" + esc(item.titulo) + "</strong>"
        + "<small>" + esc(item.fonte) + (item.largura ? " • " + item.largura + "×" + item.altura : "") + "</small>"
        + "<em>" + esc(item.autor) + " • " + esc(item.licenca) + "</em>"
        + '<div class="bxpub-acoes">'
        + '<button type="button" data-bxpub-abrir="' + esc(item.id) + '">🔗 Origem</button>'
        + '<button type="button" data-bxpub-copiar="' + esc(item.id) + '">⧉ Crédito</button>'
        + '<button type="button" class="' + (salvo ? "is-salvo" : "") + '" data-bxpub-salvar="' + esc(item.id) + '">' + (salvo ? "✓ Na Mídia X" : "💾 Mídia X") + "</button>"
        + "</div></div></article>";
    }).join("");

    /* Fim da grade: o botão que vai gerando mais imagens e vídeos sem parar. */
    var temMais = estado.reserva.length > 0 || !estado.semMais;
    grade.innerHTML += '<div class="bxpub-mais">'
      + '<button type="button" class="bxpub-btn is-mais" data-bxpub-mais>'
      + (estado.maisCarregando ? "⏳ Buscando mais…" : "➕ Carregar mais imagens e vídeos")
      + "</button>"
      + "<small>" + (estado.itens.length ? estado.itens.length + " na tela" : "")
      + (estado.reserva.length ? " • " + estado.reserva.length + " já na reserva" : "")
      + (!temMais ? " • o acervo deste tema chegou ao fim: troque o tema ou o termo" : "")
      + "</small></div>";
  }

  /* Clique no vídeo: abre em tela cheia e já toca. São três caminhos porque os
     navegadores não concordam — o padrão, o prefixado do Safari e o do iOS, que
     só existe no próprio elemento de vídeo. */
  function abrirVideoCheio(video) {
    try {
      if (document.fullscreenElement || document.webkitFullscreenElement) return;
      var pedido = null;
      if (typeof video.requestFullscreen === "function") pedido = video.requestFullscreen();
      else if (typeof video.webkitRequestFullscreen === "function") pedido = video.webkitRequestFullscreen();
      else if (typeof video.webkitEnterFullscreen === "function") { video.webkitEnterFullscreen(); pedido = null; }
      if (pedido && pedido.catch) pedido.catch(function () {});
    } catch (_) {}
    try { var p = video.play(); if (p && p.catch) p.catch(function () {}); } catch (_) {}
  }

  function itemPorId(id) {
    for (var i = 0; i < estado.itens.length; i++) if (estado.itens[i].id === id) return estado.itens[i];
    return null;
  }

  /* ---------- abrir no NOSSO visualizador ----------
     Antes o clique mandava para o site de origem. Agora abre na galeria da casa
     (zoom, ↻ 90°, ⬇ baixar, ⛶ tela cheia, anterior/próxima) e o 360 abre no
     panorama. O link da origem continua no botão 🔗 Origem. */
  function paraGaleria(item) {
    return {
      title: item.titulo,
      src: item.original || item.thumb,
      thumb: item.thumb,
      credit: item.autor + " • " + item.fonte,
      license: item.licenca,
      pageUrl: item.pagina || "",
      description: item.midia === "360" ? "Panorama 360° — " + item.fonte : item.fonte,
      _reference: referenciaAtual()
    };
  }

  function abrirNoVisualizador(item) {
    var api = window.BibleXVisualMedia;
    if (!api) return false;
    try {
      if (item.midia === "360" && typeof api.openPanorama === "function") {
        api.openPanorama(paraGaleria(item), { eyebrow: "MÍDIA X • PANORAMA 360°" });
        return true;
      }
      if (typeof api.openGallery !== "function") return false;
      /* a galeria navega só entre as imagens paradas — vídeo toca no próprio cartão */
      var lista = estado.itens.filter(function (i) { return i.midia !== "video"; });
      var inicio = 0;
      for (var i = 0; i < lista.length; i++) if (lista[i].id === item.id) inicio = i;
      if (!lista.length) return false;
      api.openGallery(lista.map(paraGaleria), inicio, { eyebrow: "MÍDIA X • ACERVOS PÚBLICOS" });
      return true;
    } catch (_) {
      return false;
    }
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
      + '<div class="bxpub-chave" data-bxpub-chave>'
      + '<p class="bxpub-chave-dica">O Pexels já vem ligado no app e você <b>não precisa de chave nenhuma</b>. '
      + 'Este campo só apareceu porque o servidor está sem a chave dele: se quiser usar o Pexels agora, pegue a sua, '
      + 'que é <b>gratuita</b>, em '
      + '<a href="https://www.pexels.com/api/" target="_blank" rel="noopener noreferrer">pexels.com/api</a> '
      + '(criar conta → “Your API Key”) e cole aqui. Ela fica <b>só neste navegador</b>.</p>'
      + '<div class="bxpub-chave-linha">'
      + '<input type="password" data-bxpub-pexels placeholder="Cole aqui a chave da API Pexels" aria-label="Chave Pexels">'
      + '<button type="button" class="bxpub-btn" data-bxpub-salvarchave>Salvar chave</button>'
      + "</div></div>"
      + '<div data-bxpub-avisos></div>'
      + '<div class="bxpub-pe"><div class="bxpub-grade" data-bxpub-grade></div></div>'
      + '<footer class="bxpub-rodape">Só entram foto, vídeo e panorama <b>em alta definição</b> — pintura, gravura, desenho, livro e mapa digitalizado ficam de fora, e resultado cuja miniatura não abre no navegador não aparece. Toque na imagem para abrir na <b>nossa galeria</b> (zoom, girar 90°, baixar, tela cheia, anterior/próxima); o botão 🔗 Origem leva ao acervo. Crédito e licença de cada autor vão junto para a Mídia X.</footer>'
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
        if (nome === "pexels" && estado.fontes.pexels) {
          /* Com a chave do servidor não há nada a pedir: liga e busca. Sem ela
             (e sem chave própria guardada), o campo aparece só agora — fora do
             caminho de quem só quer usar o app. */
          var temChavePropria = !!estado.pexelsKey;
          if (!estado.pexelsServidor && !temChavePropria) {
            estado.mostrarChave = true;
            desenhar();
            var campo2 = $("[data-bxpub-pexels]", overlay);
            if (campo2) campo2.focus();
            return;
          }
        }
        buscar();
        return;
      }
      if (alvo.closest("[data-bxpub-salvarchave]")) {
        var entrada = $("[data-bxpub-pexels]", overlay);
        var valor = entrada ? entrada.value.trim() : "";
        if (!valor) {
          estado.avisos = ["Cole a chave do Pexels antes de salvar (é gratuita em pexels.com/api)."];
          desenhar();
          if (entrada) entrada.focus();
          return;
        }
        estado.pexelsKey = valor;
        try { localStorage.setItem(LS_PEXELS, valor); } catch (_) {}
        estado.fontes.pexels = true;
        estado.avisos = [];
        buscar();
        return;
      }
      if (alvo.closest("[data-bxpub-buscar]")) { buscar(); return; }
      if (alvo.closest("[data-bxpub-mais]")) { carregarMais(); return; }
      /* o vídeo toca no próprio cartão, e o clique o abre em TELA CHEIA */
      var videoEl = alvo.closest("[data-bxpub-video]");
      if (videoEl) { abrirVideoCheio(videoEl); return; }
      var img = alvo.closest("[data-bxpub-img]");
      if (img) {
        var it = itemPorId(img.getAttribute("data-bxpub-img"));
        if (!it) return;
        /* abre na nossa galeria; só cai no site de origem se ela não existir */
        if (abrirNoVisualizador(it)) return;
        if (it.pagina) window.open(it.pagina, "_blank", "noopener");
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

    /* Se a miniatura morrer depois de desenhada (origem fora do ar), o cartão
       sai da grade em vez de virar um retângulo com texto. Evento "error" não
       borbulha: só pega na fase de captura. */
    overlay.addEventListener("error", function (ev) {
      var img = ev.target;
      if (!img || !img.getAttribute) return;
      var id = img.getAttribute("data-bxpub-img");
      if (!id) return;
      var cartao = img.closest ? img.closest(".bxpub-item") : null;
      if (cartao) cartao.remove();
      estado.itens = estado.itens.filter(function (i) { return i.id !== id; });
      var conta = $(".bxpub-aviso.is-conta", overlay);
      if (conta) conta.textContent = estado.itens.length + " resultado(s) • busca: «" + (estado.consultaUsada || estado.consulta) + "»";
    }, true);

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

  /* Botão da fileira de ferramentas do versículo (a mesma do ☀️ Raio-X,
     🖼 Gerar imagem, 💬 Comentários, 🖼 Imagem da passagem): fica junto delas,
     abaixo do texto, e leva a referência e o texto DAQUELE versículo para a
     busca — assim os lugares citados no versículo entram na consulta. */
  function botaoVerso(ref) {
    var b = document.createElement("button");
    b.type = "button";
    b.setAttribute("data-bx-public-images", "1");
    b.setAttribute("data-bxpub-verso", ref);
    b.className = "bxpub-disparo-verso";
    b.textContent = "🖼 Fontes públicas";
    b.title = "Buscar imagens de acervos públicos sobre " + ref;
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

      /* uma fileira por versículo: entra antes do ＋, como as demais */
      $$(".lmx-bible-v3-tools").forEach(function (tools) {
        var ref = "";
        var linha = tools.closest("[data-ref]");
        if (linha) ref = linha.getAttribute("data-ref") || "";
        var meu = tools.querySelector("[data-bxpub-verso]");
        if (!ref) { if (meu) meu.remove(); return; }
        if (meu) {
          if (meu.getAttribute("data-bxpub-verso") !== ref) meu.setAttribute("data-bxpub-verso", ref);
          return;
        }
        var mais = tools.querySelector("[data-bx-verse-more], .lmx-bible-v3-more");
        var botao = botaoVerso(ref);
        if (mais) mais.before(botao); else tools.appendChild(botao);
      });

      var acoesImersao = document.querySelector(".bx-immersion-stage-actions");
      if (acoesImersao && !acoesImersao.querySelector("[data-bx-public-images]")) {
        var referencia = acoesImersao.querySelector('[data-imm-action="visual"]');
        var botao = botaoDock();
        if (referencia && referencia.nextSibling) acoesImersao.insertBefore(botao, referencia.nextSibling);
        else acoesImersao.appendChild(botao);
      }
    }, 60);
  }

  /* Pergunta ao NOSSO servidor se ele já tem a chave do Pexels. Se tiver, o
     Pexels entra ligado por padrão para todo mundo e ninguém vê campo de chave.
     Se o endpoint não existir (servidor antigo), segue sem Pexels — o resto do
     app funciona igual com Wikimedia e Openverse. */
  function consultarStatusPexels() {
    return fetch("/api/bible/public-images/status", { headers: { Accept: "application/json" } })
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (json) {
        estado.pexelsServidor = !!(json && json.pexels);
        if (estado.pexelsServidor) estado.fontes.pexels = true;
        if (estado.aberto) desenhar();
      })
      .catch(function () { estado.pexelsServidor = false; });
  }

  function ligar() {
    /* No WINDOW e não no document: um listener do app na fileira de ferramentas
       do versículo dá stopPropagation() em fase de captura, e o clique nunca
       chega ao document — era por isso que o botão do dock abria e o do
       versículo não. Listeners do mesmo nó continuam rodando. */
    window.addEventListener("click", function (ev) {
      var alvo = ev.target && ev.target.closest ? ev.target.closest("[data-bx-public-images]") : null;
      if (!alvo) return;
      ev.preventDefault();
      ev.stopPropagation();
      if (estado.aberto) { fechar(); return; }
      var ref = alvo.getAttribute("data-bxpub-verso") || "";
      usarVersiculo(ref);
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
