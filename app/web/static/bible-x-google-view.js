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
      '</div>';

    document.body.appendChild(caixa);
    caixa.hidden = true;
    painel = caixa.querySelector(".bxvm-google-panel");
    campo = caixa.querySelector("[data-bxgm-campo]");
    palco = caixa.querySelector("[data-bxgm-palco]");
    pe = caixa.querySelector("[data-bxgm-pe]");

    caixa.addEventListener("click", function (evento) {
      var alvo = evento.target.closest("[data-bxgm]");
      if (alvo) {
        var acao = alvo.getAttribute("data-bxgm");
        if (acao === "fechar") { fechar(); return; }
        if (acao === "cheio") {
          /* o iframe é recriado porque a altura muda junto com a tela — mas
             volta para a MESMA vista, e não para o começo */
          painel.classList.toggle("is-cheio");
          if (ultimo) mostrar(ultimo.modo, ultimo.lat, ultimo.lon, ultimo.texto, ultimo.aviso);
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

    document.addEventListener("keydown", function (evento) {
      if (evento.key === "Escape" && caixa && !caixa.hidden && !painel.classList.contains("is-cheio")) fechar();
      else if (evento.key === "Escape" && caixa && !caixa.hidden) {
        painel.classList.remove("is-cheio");
        if (ultimo) mostrar(ultimo.modo, ultimo.lat, ultimo.lon, ultimo.texto, ultimo.aviso);
      }
    });

    return painel;
  }

  function mostrar(modo, lat, lon, texto, aviso) {
    montar();
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
  }

  /* Abre já NO LUGAR. Se o Google tem rua ali, cai na rua (é o que permite
     ANDAR); se não tem, cai no satélite e o aviso diz por quê — em vez de
     prometer uma caminhada que não existe. */
  /* De onde a vista começa quando o versículo não tem lugar nosso. É só um
     ponto de partida para a pessoa digitar — o aviso diz isso na cara. */
  var CENTRO_BIBLIA = [31.7784, 35.2354];

  function abrir(lugar, modo, semLugar) {
    montar();
    caixa.hidden = false;
    document.body.classList.add("bxvm-lock");
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
          : " — aqui o Google NÃO tem carro de rua: a vista é do satélite. Onde houver foto esférica de alguém dá para olhar em volta, mas sem seta para caminhar.")
        : (semLugar || "🗺 Este versículo não cita nenhum lugar do nosso catálogo. Digite abaixo o lugar que você quer ver (ou lat,lon) e toque Enter."));
    if (!lugar) { try { campo.focus(); } catch (e) {} }
    return true;
  }

  function fechar() {
    if (!caixa) return;
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
