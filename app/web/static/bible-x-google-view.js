/* =====================================================================
   LOGOS MASTER X — GOOGLE VIEW  (build 5.4.249)
   ---------------------------------------------------------------------
   Uma janela NOSSA (iframe) com Mapa, Satélite e Street View, sem chave de
   API: são os endereços de embed do próprio Google.

   Por que existe, se a Mídia X já tem uma janela Google: aquela nasce dentro
   da galeria, e só existe enquanto a galeria está aberta. O botão abaixo do
   versículo e a biblioteca de lugares precisam abrir o Google sem galeria
   nenhuma — é este módulo. Ele usa as MESMAS classes de CSS da outra
   (.bxvm-google-*), então as duas se parecem e se comportam igual, inclusive
   na tela cheia, onde os botões do topo somem e sobra só o trenzinho no
   rodapé.

   A diferença que faz ANDAR: cada lugar tem DUAS coordenadas (ver
   bible-x-lugares.js). O Street View só tem as setas brancas no chão onde o
   carro do Google passou, e o carro passa na VIA — por isso a vista 🚶 usa a
   coordenada da RUA, e o mapa/satélite usam a do SÍTIO.
   ===================================================================== */
(function () {
  "use strict";

  var VERSION = "5.4.249";

  var caixa = null, painel = null, campo = null, palco = null, pe = null;
  var modoAtual = "sv";
  var ultimo = null;
  var cheioNativo = false; /* a tela cheia NATIVA está valendo para ESTE painel */

  /* ----------------------------------------------------------- tela cheia
     O `.is-cheio` sozinho só esticava o painel DENTRO da página: as barras do
     navegador continuavam à vista. Agora o ⛶ pede a tela cheia NATIVA do
     próprio painel (Fullscreen API) e aí as barras somem de fato, como o F11.
     O `.is-cheio` continua entrando — como layout da tela cheia e como REDE:
     navegador sem a API (Safari do iPhone) fica com o comportamento antigo,
     que é melhor que nada, e o Esc/botão do sistema sempre desmonta tudo. */
  function telaCheiaNativa() {
    return document.fullscreenElement || document.webkitFullscreenElement || null;
  }
  function sairTelaCheia() {
    var sair = document.exitFullscreen || document.webkitExitFullscreen;
    if (!telaCheiaNativa() || typeof sair !== "function") return;
    /* Se a saída falhar, o Esc continua valendo: o sincronizaCheio desmonta o
       painel do mesmo jeito quando a tela cheia acabar. */
    try { Promise.resolve(sair.call(document)).catch(function () {}); } catch (e) {}
  }
  /* Volta para a MESMA vista que estava no ar — nunca para o lugar da imagem
     aberta. O iframe é recriado porque a altura muda junto com a tela. */
  function redesenhaVista() {
    if (!ultimo) return;
    mostrar(ultimo.modo, ultimo.lat, ultimo.lon, ultimo.texto, ultimo.aviso);
  }
  /* Quem sai da tela cheia por fora (Esc, botão do sistema, ⤡) também precisa
     desmontar o `.is-cheio` — senão o painel fica pendurado cobrindo a página.
     Sem a API, cheioNativo nunca liga e o `.is-cheio` é o único modo: aí ele
     fica como está. */
  function sincronizaCheio() {
    if (telaCheiaNativa() === painel) { cheioNativo = true; return; }
    if (!cheioNativo) return;
    cheioNativo = false;
    /* Se quem pediu a saída já desmontou o painel, não redesenha duas vezes. */
    if (!painel.classList.contains("is-cheio")) return;
    painel.classList.remove("is-cheio");
    if (caixa.hidden) return;
    redesenhaVista();
  }

  /* ------------------------------------------------------- leque de ruas
     5.4.249 — O LEQUE DE PASSEIOS TAMBÉM AQUI. Esta janela é aberta pelo botão
     abaixo do versículo e pelo 360°, e não tinha leque nenhum: a pessoa só via
     o lugar onde já estava e não tinha como descobrir os outros. Agora as
     MESMAS opções de rua da galeria aparecem aqui — é o pedido de deixar todas
     as opções acessíveis em vários lugares, e não só dentro da Mídia X.
     A lista é o catálogo inteiro filtrado por quem TEM RUA (o carro do Google
     passou): a coordenada da rua é a única que tem as setas brancas do chão.
     Se o catálogo ainda não carregou, fica a lista curta daqui de baixo. */
  var PASSEIOS_BASE = [
    ["🧱", "Muro das Lamentações", 31.7767469, 35.2344484],
    ["✝️", "Santo Sepulcro", 31.7784463, 35.2297723],
    ["🚶", "Via Dolorosa", 31.7795250, 35.2327100],
    ["🕊", "Getsêmani", 31.7794160, 35.2397330],
    ["🏔", "Monte das Oliveiras", 31.7784000, 35.2437000],
    ["🌊", "Mar da Galileia", 32.8808000, 35.5750000],
    ["⭐", "Belém — Natividade", 31.7042000, 35.2075000],
    ["🏠", "Nazaré", 32.6996000, 35.3035000],
    ["🏛", "Areópago (Atenas)", 37.9715000, 23.7267000],
    ["🏟", "Coliseu (Roma)", 41.8902000, 12.4922000],
    ["🏺", "Éfeso", 37.9397000, 27.3417000],
    ["🏝", "Patmos", 37.3094000, 26.5470000],
    ["⛪", "Corinto", 37.9060000, 22.8790000],
  ];
  function listaPasseios() {
    var tem = window.BibleXLugaresTemRua;
    var todos = (window.BibleXLugares || []).filter(function (l) { return tem ? tem(l) : false; });
    if (!todos.length) return PASSEIOS_BASE;
    return todos.map(function (l) { return [l[0] || "📍", l[1], l[4], l[5]]; });
  }
  /* Monta os chips UMA vez por tamanho de lista: o catálogo chega depois do
     primeiro montar() em algumas telas, e sem esta checagem a lista ficaria
     congelada na versão curta. */
  function montarPasseios() {
    if (!caixa) return;
    var alvo = caixa.querySelector("[data-bxgm-chips]");
    if (!alvo) return;
    var lista = listaPasseios();
    if (alvo.getAttribute("data-n") === String(lista.length)) return;
    alvo.setAttribute("data-n", String(lista.length));
    alvo.innerHTML = lista.map(function (p, i) {
      return '<button type="button" data-bxgm-passeio="' + i + '" title="Ir para ' + p[1] + '">' + p[0] + " " + p[1] + "</button>";
    }).join("") +
      '<button type="button" class="is-sorte" data-bxgm-passeio="sorte" title="Escolher um lugar para mim">🎲 Surpreenda-me</button>';
  }

  /* ---------------------------------------------------------------- dados */
  function num(v) {
    return v === null || v === undefined || v === "" || !isFinite(Number(v)) ? null : Number(v);
  }

  /* Dá para ANDAR aqui? Só se o Google tem rua — e nem todo país tem carro de
     rua passando (Síria, Iraque, Irã), nem todo lugar (mar aberto). */
  function temRua(lugar) {
    return !!(lugar && num(lugar[4]) !== null && num(lugar[5]) !== null);
  }

  function posicao(lugar, modo) {
    if (!lugar) return null;
    if (modo === "sv" && temRua(lugar)) return [num(lugar[4]), num(lugar[5])];
    var lat = num(lugar[2]), lon = num(lugar[3]);
    return lat === null || lon === null ? null : [lat, lon];
  }

  function endereco(modo, lat, lon, texto) {
    var tem = lat !== null && lat !== undefined && lon !== null && lon !== undefined;
    if (tem) {
      var pos = Number(lat) + "," + Number(lon);
      if (modo === "sv") return "https://maps.google.com/maps?layer=c&cbll=" + pos + "&cbp=11,0,0,0,0&output=svembed";
      if (modo === "sat") return "https://www.google.com/maps?q=" + pos + "&t=k&z=18&output=embed";
      return "https://www.google.com/maps?q=" + pos + "&z=17&output=embed";
    }
    return "https://www.google.com/maps?q=" + encodeURIComponent(texto || "") + "&z=14&output=embed";
  }

  /* ---------------------------------------------------------------- tela */
  function montar() {
    if (painel) return painel;

    caixa = document.createElement("div");
    caixa.className = "bxvm-overlay bxvm-google-solto";
    caixa.setAttribute("role", "dialog");
    caixa.setAttribute("aria-modal", "true");
    caixa.setAttribute("aria-label", "Google View");
    caixa.innerHTML =
      '<div class="bxvm-google-panel">' +
        '<div class="bxvm-google-head"><b>🗺 Google View</b><small>Mapa e Street View aqui dentro</small>' +
          '<button type="button" class="bxvm-google-cheio" data-bxgm="cheio" title="Tela cheia do Google — no celular as setas do chão ficam grandes para ANDAR" aria-label="Tela cheia do Google">⛶</button>' +
          '<button type="button" class="bxvm-google-x" data-bxgm="fechar" aria-label="Fechar">×</button></div>' +
        '<div class="bxvm-google-linha"><input type="text" data-bxgm-campo placeholder="Lugar ou coordenadas (ex.: Muro das Lamentações, Jerusalém / 31.7767,35.2345)"></div>' +
        '<div class="bxvm-google-acoes">' +
          '<button type="button" data-bxgm="sv">🚶 Street View</button>' +
          '<button type="button" data-bxgm="mapa">🗺 Mapa</button>' +
          '<button type="button" data-bxgm="sat">🛰 Satélite</button>' +
          '<a class="bxvm-google-fora" data-bxgm-fora target="_blank" rel="noopener" title="Abre o Google Maps em outra aba, com o bonequinho para arrastar até a rua">🧍 Navegar no Google ↗</a>' +
        '</div>' +
        /* o leque de ruas: toque e você já cai na rua, sem digitar nada */
        '<div class="bxvm-google-passeios">' +
          '<b>🧭 Passeios prontos — toque e você já cai na rua:</b>' +
          '<div class="bxvm-google-chips" data-bxgm-chips></div>' +
        '</div>' +
        /* na TELA CHEIA os botões do topo somem e sobra este trenzinho flutuante
           no rodapé — a tela toda é do mapa, sem perder como sair nem trocar */
        '<div class="bxvm-google-mini">' +
          '<button type="button" data-bxgm="sv" title="Street View — andar na rua" aria-label="Street View">🚶</button>' +
          '<button type="button" data-bxgm="mapa" title="Mapa" aria-label="Mapa">🗺</button>' +
          '<button type="button" data-bxgm="sat" title="Satélite" aria-label="Satélite">🛰</button>' +
          '<button type="button" data-bxgm="cheio" title="Sair da tela cheia" aria-label="Sair da tela cheia">⤡</button>' +
          '<button type="button" data-bxgm="fechar" title="Fechar o Google View" aria-label="Fechar o Google View">×</button>' +
        '</div>' +
        '<div class="bxvm-google-stage" data-bxgm-palco></div>' +
        '<p class="bxvm-google-pe" data-bxgm-pe></p>' +
        /* 5.4.250 — A LEGENDA DO LUGAR. Pedido do usuário: ao cair numa rua (por
           um passeio pronto ou pelo 🎲 Surpreenda-me) ver a referência da
           passagem, o lugar e o que se sabe da região — geografia, cultura e
           curiosidade. Os três blocos saem do MESMO endpoint da legenda da
           imagem (/api/bible/ai/legend), que já recebe a passagem e o lugar. */
        '<div class="bxvm-google-legenda" data-bxgm-legenda hidden>' +
          '<button type="button" class="bxvm-google-legenda-top" data-bxgm-leg="recolher">' +
            '<b data-bxgm-leg-titulo>🏷 Legenda do lugar</b>' +
            '<span class="bxvm-google-legenda-seta" data-bxgm-leg-seta>ocultar</span>' +
          '</button>' +
          '<div class="bxvm-google-legenda-corpo" data-bxgm-leg-corpo></div>' +
        '</div>' +
      '</div>';

    document.body.appendChild(caixa);
    caixa.hidden = true;
    painel = caixa.querySelector(".bxvm-google-panel");
    campo = caixa.querySelector("[data-bxgm-campo]");
    palco = caixa.querySelector("[data-bxgm-palco]");
    pe = caixa.querySelector("[data-bxgm-pe]");

    caixa.addEventListener("click", function (evento) {
      /* ---- o LEQUE DE RUAS: toque no lugar e você já cai na rua dele ---- */
      var chip = evento.target.closest("[data-bxgm-passeio]");
      if (chip) {
        var lista = listaPasseios();
        var valor = chip.getAttribute("data-bxgm-passeio");
        var passeio = valor === "sorte"
          ? lista[Math.floor(Math.random() * lista.length)]
          : lista[Number(valor)];
        if (passeio) {
          campo.value = passeio[1];
          mostrar("sv", passeio[2], passeio[3], passeio[1],
            passeio[0] + " " + passeio[1] + " — você está na rua. Arraste para olhar em volta; as setas brancas no chão andam.");
        }
        return;
      }
      /* a legenda do lugar recolhe/expande — no celular ela come meia tela */
      var leg = evento.target.closest("[data-bxgm-leg]");
      if (leg) {
        var cxLeg = caixa.querySelector("[data-bxgm-legenda]");
        if (cxLeg) {
          var recolhida = cxLeg.classList.toggle("is-recolhida");
          var setaLeg = cxLeg.querySelector("[data-bxgm-leg-seta]");
          if (setaLeg) setaLeg.textContent = recolhida ? "ver" : "ocultar";
        }
        return;
      }
      var alvo = evento.target.closest("[data-bxgm]");
      if (alvo) {
        var acao = alvo.getAttribute("data-bxgm");
        if (acao === "fechar") { fechar(); return; }
        if (acao === "cheio") {
          if (painel.classList.contains("is-cheio")) {
            /* Na tela cheia nativa quem desmonta o `.is-cheio` é o
               sincronizaCheio, quando a saída se consumar — assim o painel não
               fica sem layout no meio do caminho. */
            if (cheioNativo) { sairTelaCheia(); return; }
            painel.classList.remove("is-cheio"); /* rede: navegador sem a API */
            redesenhaVista();
            return;
          }
          painel.classList.add("is-cheio");
          var pedir = painel.requestFullscreen || painel.webkitRequestFullscreen;
          if (typeof pedir === "function") {
            /* a promessa pode ser recusada (outro elemento em tela cheia, gesto
               não reconhecido) — aí o `.is-cheio` segue valendo sozinho */
            try { Promise.resolve(pedir.call(painel)).catch(function () {}); } catch (e) {}
          }
          /* o iframe é recriado porque a altura muda junto com a tela — mas
             volta para a MESMA vista, e não para o começo */
          redesenhaVista();
          return;
        }
        var l = ultimo && ultimo.lugar;
        var p = posicao(l, acao);
        if (p) mostrar(acao, p[0], p[1], l ? l[1] : (ultimo ? ultimo.texto : ""));
        /* sem lugar no catálogo, troca de vista MANTENDO o que está na tela —
           senão o 🚶 num versículo sem lugar caía num mapa em branco */
        else if (ultimo && ultimo.lat !== null && ultimo.lat !== undefined) mostrar(acao, ultimo.lat, ultimo.lon, ultimo.texto || "");
        else mostrar(acao, null, null, ultimo ? ultimo.texto : "");
        return;
      }
      /* clicar fora do painel fecha; clicar dentro, não */
      if (evento.target === caixa) fechar();
    });

    campo.addEventListener("keydown", function (evento) {
      if (evento.key !== "Enter") return;
      var texto = campo.value.trim();
      if (!texto) return;
      var partes = texto.split(",");
      var lat = num(partes[0]), lon = num(partes[1]);
      if (lat !== null && lon !== null && partes.length === 2) mostrar("sv", lat, lon, texto);
      else mostrar("mapa", null, null, texto);
    });

    caixa.querySelector("[data-bxgm-fora]").addEventListener("click", function (evento) {
      evento.preventDefault();
      var p = ultimo && ultimo.lat !== null ? [ultimo.lat, ultimo.lon] : null;
      var url = p
        ? "https://www.google.com/maps/@?api=1&map_action=pano&viewpoint=" + p[0] + "," + p[1]
        : "https://www.google.com/maps/search/" + encodeURIComponent((ultimo && ultimo.texto) || "");
      window.open(url, "_blank", "noopener");
    });

    /* Na tela cheia NATIVA o Esc é do navegador: ele sai da tela cheia e o
       evento nem chega aqui — quem desmonta o `.is-cheio` é o sincronizaCheio.
       Este atalho cobre o resto: a tela cheia de CSS (sem a API) e a janela
       normal. */
    document.addEventListener("keydown", function (evento) {
      if (evento.key !== "Escape" || !caixa || caixa.hidden) return;
      if (cheioNativo) { sairTelaCheia(); return; }
      if (!painel.classList.contains("is-cheio")) { fechar(); return; }
      painel.classList.remove("is-cheio");
      redesenhaVista();
    });

    document.addEventListener("fullscreenchange", sincronizaCheio);
    document.addEventListener("webkitfullscreenchange", sincronizaCheio);

    return painel;
  }

  /* ---- A LEGENDA DO LUGAR (5.4.250) --------------------------------------
     Referência da passagem + lugar + os três blocos (Geografia/Cultura/
     Curiosidade) escritos pelo mesmo endpoint da legenda da imagem. O que já
     foi escrito fica guardado por lugar, então voltar ao mesmo ponto não gasta
     outra chamada de IA. */
  var legendaCache = {};
  var legendaChave = "";
  var ultimoRef = "";

  function referenciaDaLeitura() {
    try {
      var c = window.BibleXImmersion && window.BibleXImmersion.getContext && window.BibleXImmersion.getContext();
      if (c) { var r = c.currentNarrativeRef || c.reference; if (r) return String(r); }
    } catch (e) {}
    try { if (window.__bxCurrentReference) return String(window.__bxCurrentReference); } catch (e) {}
    return "";
  }

  function legendaDoLugar(nome, lat, lon) {
    var cx = caixa.querySelector("[data-bxgm-legenda]");
    if (!cx) return;
    var corpo = cx.querySelector("[data-bxgm-leg-corpo]");
    var titulo = cx.querySelector("[data-bxgm-leg-titulo]");
    var seta = cx.querySelector("[data-bxgm-leg-seta]");
    var referencia = ultimoRef || referenciaDaLeitura();
    var chave = nome + "|" + Number(lat).toFixed(3) + "," + Number(lon).toFixed(3);
    legendaChave = chave;
    cx.hidden = false;
    cx.classList.remove("is-recolhida");
    if (seta) seta.textContent = "ocultar";
    titulo.textContent = "🏷 " + nome + (referencia ? " · " + referencia : "");
    if (legendaCache[chave]) { pintarLegenda(corpo, legendaCache[chave]); return; }
    corpo.innerHTML = '<p class="bxvm-google-legenda-nota">Escrevendo a legenda deste lugar…</p>';
    fetch("/api/bible/ai/legend", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reference: referencia || "passagem em estudo", place: nome, scene: "vista do lugar" }),
    }).then(function (r) {
      if (!r.ok) throw new Error("HTTP " + r.status);
      return r.json();
    }).then(function (d) {
      var lg = (d && d.legend) || {};
      legendaCache[chave] = lg;
      if (chave !== legendaChave) return; /* a pessoa já trocou de lugar */
      pintarLegenda(corpo, lg);
    }).catch(function () {
      if (chave !== legendaChave) return;
      corpo.innerHTML = '<p class="bxvm-google-legenda-nota">Não deu para escrever a legenda deste lugar agora. Toque no lugar de novo para tentar.</p>';
    });
  }

  function pintarLegenda(corpo, lg) {
    var blocos = [["Geografia", lg.geo], ["Cultura", lg.cul], ["Curiosidade", lg.cur]]
      .filter(function (b) { return String(b[1] || "").trim(); });
    if (!blocos.length) { corpo.innerHTML = '<p class="bxvm-google-legenda-nota">Sem legenda para este lugar.</p>'; return; }
    corpo.innerHTML = blocos.map(function (b) {
      return '<div class="bxvm-google-legenda-seg"><b>' + b[0] + '</b><span>' + escapar(b[1]) + "</span></div>";
    }).join("");
  }

  function escapar(v) {
    return String(v == null ? "" : v).replace(/[&<>"]/g, function (ch) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[ch];
    });
  }

  function mostrar(modo, lat, lon, texto, aviso) {
    montar();
    montarPasseios(); /* o leque acompanha o catálogo, que pode chegar depois */
    caixa.hidden = false;
    document.body.classList.add("bxvm-lock");
    modoAtual = modo;
    ultimo = { modo: modo, lat: lat, lon: lon, texto: texto || "", aviso: aviso || "", lugar: ultimo ? ultimo.lugar : null };
    var tem = lat !== null && lat !== undefined && lon !== null && lon !== undefined;

    palco.innerHTML = "";
    var quadro = document.createElement("iframe");
    quadro.className = "bxvm-google-frame";
    quadro.src = endereco(modo, lat, lon, texto);
    quadro.loading = "lazy";
    quadro.referrerPolicy = "no-referrer";
    quadro.allowFullscreen = true;
    quadro.setAttribute("allow", "fullscreen; geolocation");
    quadro.title = "Google Maps dentro do LOGOS MASTER X";
    palco.appendChild(quadro);

    var lugar = ultimo.lugar;
    pe.textContent = aviso || (tem
      ? (modo === "sv"
        ? "🚶 Street View em " + Number(lat).toFixed(4) + ", " + Number(lon).toFixed(4) +
          " — arraste para olhar em volta. As setas brancas no chão andam pela rua; onde elas não aparecem, o Google só tem foto esférica ali (sem rua para andar)."
        : (modo === "sat" ? "🛰 Satélite" : "🗺 Mapa") + " em " + Number(lat).toFixed(4) + ", " + Number(lon).toFixed(4) + ".")
      : "🗺 Mapa de «" + texto + "». Digite o lugar e toque em 🚶 Street View para ver da rua.");

    /* acende o botão da vista que está no ar — no topo e no trenzinho */
    caixa.querySelectorAll("[data-bxgm]").forEach(function (b) {
      b.classList.toggle("is-on", b.getAttribute("data-bxgm") === modo);
    });

    /* a legenda acompanha a vista: é o lugar que está no ar que ela descreve */
    legendaDoLugar(String(texto || "").trim() || (tem ? Number(lat).toFixed(4) + ", " + Number(lon).toFixed(4) : "o lugar"), lat, lon);
  }

  /* Abre já NO LUGAR. Se o Google tem rua ali, cai na rua (é o que permite
     ANDAR); se não tem, cai no satélite e o aviso diz por quê — em vez de
     prometer uma caminhada que não existe. */
  /* De onde a vista começa quando o versículo não tem lugar nosso. É só um
     ponto de partida para a pessoa digitar — o aviso diz isso na cara. */
  var CENTRO_BIBLIA = [31.7784, 35.2354];

  function abrir(lugar, modo, semLugar, referencia) {
    montar();
    /* quem chama pode dizer de que passagem se trata (o botão do versículo tem
       a referência na mão); sem isso, a legenda tenta ler a leitura atual */
    ultimoRef = String(referencia || "").trim();
    caixa.hidden = false;
    document.body.classList.add("bxvm-lock");
    /* 5.4.249 — 🚶 SEM LUGAR NÃO DEIXA NINGUÉM NA TELA VAZIA. Quando quem
       chamou pediu a RUA (modo "sv") e não trouxe lugar nenhum — é o caso do
       🚶 na foto sem coordenada da galeria e do 🚶 no 360° —, o app sorteia um
       lugar de verdade do leque, mostra a rua dele e diz na linha do pé que
       ESTA referência não temos, mas que há outras nos passeios logo abaixo.
       Antes disso a janela abria no mapa do centro da Bíblia pedindo para
       digitar: uma tela parada, que é exatamente a queixa do usuário.
       Para mapa/satélite nada muda: procurar por nome continua sendo o útil. */
    var emprestado = false;
    if (!lugar && modo === "sv") {
      var leque = listaPasseios();
      if (leque.length) {
        var p2 = leque[Math.floor(Math.random() * leque.length)];
        /* CUIDADO com as DUAS FORMAS: o leque é [emoji, nome, ruaLat, ruaLon]
           (é o que os chips desenham), mas temRua()/posicao() aqui falam a
           língua do CATÁLOGO — [emoji, nome, sitioLat, sitioLon, ruaLat,
           ruaLon]. Sem remontar, o lugar emprestado nascia "sem rua" e o 🚶
           caía no satélite em vez da rua. */
        lugar = [p2[0], p2[1], null, null, p2[2], p2[3]];
        emprestado = true;
      }
    }
    var rua = temRua(lugar);
    var m = modo || (rua ? "sv" : "sat");
    if (m === "sv" && !rua) m = "sat";
    var p = posicao(lugar, m);
    if (!lugar) { m = "mapa"; p = CENTRO_BIBLIA.slice(); }
    if (!p) p = [null, null];
    campo.value = lugar && lugar[1] ? lugar[1] : "";
    ultimo = { lugar: lugar || null };
    mostrar(m, p[0], p[1], lugar ? lugar[1] : "",
      lugar
        ? (lugar[0] || "📍") + " " + lugar[1] + (rua
          ? " — você está na rua. Arraste para olhar em volta; as setas brancas no chão andam."
            + (emprestado
              ? (semLugar ? " " + semLugar + " " : " ")
                + "Mostrei " + lugar[1] + " para você agora; toque em qualquer passeio aqui embaixo para trocar de lugar."
              : "")
          : " — aqui o Google NÃO tem carro de rua: a vista é do satélite. Onde houver foto esférica de alguém dá para olhar em volta, mas sem seta para caminhar.")
        : (semLugar || "🗺 Este versículo não cita nenhum lugar do nosso catálogo. Digite abaixo o lugar que você quer ver (ou lat,lon) e toque Enter.")
          + " Ou toque em qualquer passeio pronto aqui embaixo — um toque e você já está na rua.");
    if (!lugar) { try { campo.focus(); } catch (e) {} }
    return true;
  }

  function fechar() {
    if (!caixa) return;
    /* Sai da tela cheia nativa ANTES de desmontar: o navegador não sai sozinho
       só porque o painel virou display:none, e aí a página ficaria presa em
       tela cheia com a janela já fora do ar. */
    sairTelaCheia();
    painel.classList.remove("is-cheio");
    caixa.hidden = true;
    palco.innerHTML = "";
    document.body.classList.remove("bxvm-lock");
  }

  window.BibleXGoogleView = {
    version: VERSION,
    abrir: abrir,
    fechar: fechar,
    temRua: temRua,
    aberto: function () { return !!(caixa && !caixa.hidden); }
  };
})();
