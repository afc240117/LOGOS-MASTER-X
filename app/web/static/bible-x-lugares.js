/* =====================================================================
   LOGOS MASTER X — CATÁLOGO DE LUGARES BÍBLICOS  (build 5.4.249)
   ---------------------------------------------------------------------
   Cada lugar tem DUAS coordenadas, e a diferença entre elas é o que faz o
   botão funcionar de verdade:

     • SÍTIO (lat/lon) — onde a cidade/monumento fica. É o que se vê de cima,
       no mapa e no satélite.
     • RUA (ruaLat/ruaLon) — o ponto da VIA mais próxima. O Street View só tem
       as SETAS BRANCAS NO CHÃO (que é como se anda) onde o carro do Google
       passou; e ele passa na rua, não no meio do monumento. Sem esta segunda
       coordenada a pessoa cai numa pracinha ou num terraço de foto esférica,
       sem seta nenhuma e sem para onde caminhar.

   `ruaLat` nulo quer dizer: aqui o Google NÃO tem carro de rua (Síria, Iraque,
   Irã, ou um lugar no meio do deserto). O lugar continua no mapa e no satélite,
   e o app avisa isso em vez de fingir que dá para andar.

   Estas coordenadas não saíram de busca automática: busca livre erra feio
   (Ramá de Benjamim vinha como uma Ramá da Galileia, Gaza vinha perto de
   Jericó, o Nilo vinha na fronteira com o Sudão). Cada lugar foi ancorado na
   identificação aceita — Tell en-Nasbeh para Mispá, et-Tell para Ai, Tulul
   adh-Dhahab para Penuel — e o geocodificador só refinou dentro de 12 km.

   Funções que o resto do app usa:
     BibleXLugaresAchar(texto)   → o lugar citado num versículo (ou null)
     BibleXLugaresTemRua(lugar)  → dá para entrar e ANDAR ali?
     BibleXLugaresPasseios()     → só os que dão para andar
   ===================================================================== */
(function () {
  "use strict";

  /* emoji, nome, sítio (lat,lon), rua (lat,lon), apelidos de busca (o nome já
     entra como apelido; estes são extras, em português e em inglês) */
  var LUGARES = [
    ["🧱", "Muro das Lamentações", 31.776747, 35.234448, 31.775556, 35.233903,
     "Muro das Lamentações; muro ocidental; western wall; kotel"],
    ["✝️", "Santo Sepulcro", 31.778446, 35.229772, 31.778286, 35.229785,
     "Santo Sepulcro; igreja do santo sepulcro; holy sepulchre; calvario; golgota"],
    ["🚶", "Via Dolorosa", 31.779525, 35.23271, 31.77953, 35.232686,
     "Via Dolorosa; caminho da cruz"],
    ["🕊", "Getsêmani", 31.779416, 35.239733, 31.779358, 35.239859,
     "Getsêmani; horto; getsemane; gethsemane"],
    ["🏔", "Monte das Oliveiras", 31.7784, 35.2437, 31.77853, 35.242777,
     "Monte das Oliveiras; oliveiras; mount of olives; olivet"],
    ["🌊", "Mar da Galileia", 32.8808, 35.575, 32.879985, 35.575093,
     "Mar da Galileia; lago de genesare; genesare; tiberiades; sea of galilee; galileia"],
    ["💧", "Rio Jordão", 31.8375, 35.535, 31.837936, 35.535004,
     "Rio Jordão; jordao; jordan river; qasr al yahud"],
    ["⭐", "Belém", 31.7042, 35.2075, 31.704087, 35.207381,
     "Belém; natividade; basilica da natividade; manjedoura; bethlehem"],
    ["🏠", "Nazaré", 32.6996, 35.3035, 32.699437, 35.303357,
     "Nazaré; nazareth; anunciacao"],
    ["🎺", "Jericó", 31.87, 35.444, 31.870459, 35.443963,
     "Jericó; jericho; muralhas de jerico"],
    ["🏜", "Massada", 31.3156, 35.3537, 31.315595, 35.35379,
     "Massada; masada; fortaleza de herodes"],
    ["⛰", "Monte Sinai", 28.5392, 33.9755, 28.539477, 33.975475,
     "Monte Sinai; sinai; horebe; mount sinai; jebel musa"],
    ["🐪", "Pirâmides de Gizé", 29.9792, 31.1342, 29.976402, 31.132102,
     "Pirâmides de Gizé; gize; piramides; pyramids; giza"],
    ["🏛", "Areópago", 37.9715, 23.7267, 37.971528, 23.726644,
     "Areópago; atenas; areopagus; areopago de atenas"],
    ["🏟", "Coliseu", 41.8902, 12.4922, 41.890035, 12.492309,
     "Coliseu; colosseum; roma; coliseu de roma"],
    ["🏺", "Éfeso", 37.9397, 27.3417, 37.939533, 27.341765,
     "Éfeso; ephesus; artemis"],
    ["🏝", "Patmos", 37.3094, 26.547, 37.308855, 26.54686,
     "Patmos; ilha de patmos; apocalipse"],
    ["⛪", "Corinto", 37.906, 22.879, 37.905964, 22.879143,
     "Corinto; corinth; corinto antiga"],
    ["🕌", "Monte do Templo", 31.77795, 35.235748, 31.777909, 35.237952,
     "Monte do Templo; esplanada das mesquitas; templo de herodes; temple mount; haram esh sharif; monte moria"],
    ["👑", "Cidade de Davi", 31.772348, 35.235581, 31.772372, 35.235122,
     "Cidade de Davi; city of david; sião de davi"],
    ["💦", "Tanque de Siloé", 31.770401, 35.235123, 31.770388, 35.235372,
     "Tanque de Siloé; siloe; siloam; piscina de siloe"],
    ["🛁", "Tanque de Betesda", 31.781478, 35.235978, 31.780755, 35.236378,
     "Tanque de Betesda; betesda; bethesda; piscina de betesda"],
    ["🪦", "Jardim do Túmulo", 31.784021, 35.230204, 31.784205, 35.23052,
     "Jardim do Túmulo; garden tomb; tumulo de jesus"],
    ["🏯", "Torre de Davi", 31.776039, 35.228302, 31.775871, 35.228653,
     "Torre de Davi; citadela; david tower; jaffa gate"],
    ["🏘", "Monte Sião", 31.770582, 35.229143, 31.770718, 35.229082,
     "Monte Sião; siao; mount zion; cenaculo; cenaculo"],
    ["🌉", "Vale do Cedrom", 31.7762, 35.2362, 31.775452, 35.237257,
     "Vale do Cedrom; cedrom; kidron; vale de josafa; ribeiro de cedron"],
    ["🚪", "Portão de Jafa", 31.776562, 35.227271, 31.776544, 35.227232,
     "Portão de Jafa; portao de jaffa; jaffa gate"],
    ["🏡", "Betânia", 31.776266, 35.265739, 31.776245, 35.265821,
     "Betânia; bethany; betania de jerusalem"],
    ["🌿", "Bete-Fagé", 31.777399, 35.251126, 31.777164, 35.250666,
     "Bete-Fagé; bethphage; bete fage"],
    ["🛣", "Emaús", 31.831146, 34.982375, 31.830899, 34.98224,
     "Emaús; emmaus; nicopolis"],
    ["🕯", "Ein Karem", 31.767637, 35.163902, 31.7675, 35.164627,
     "Ein Karem; ain karem; visitacao"],
    ["🏞", "Vale de Elá", 31.69, 34.96, 31.690117, 34.959997,
     "Vale de Elá; ela; elah; vale de elah"],
    ["🧱", "Laquis", 31.565521, 34.84919, 31.564971, 34.851165,
     "Laquis; lachish; tel laquis"],
    ["⛩", "Siquém", 32.213557, 35.281522, 32.214453, 35.281277,
     "Siquém; shechem; nablus; siquem"],
    ["🏔", "Monte Gerizim", 32.200865, 35.273528, 32.202034, 35.270116,
     "Monte Gerizim; gerizim; monte da bencao"],
    ["🏛", "Samaria", 32.275813, 35.195211, 32.276027, 35.195225,
     "Samaria; sebaste; samaria sebaste"],
    ["⚰️", "Hebrom", 31.524786, 35.110778, 31.5237, 35.110555,
     "Hebrom; hebron; macpela; caverna de macpela; quiriate-arba"],
    ["🐑", "Berseba", 31.2444, 34.8406, 31.24301, 34.840633,
     "Berseba; beer sheva; beersheba"],
    ["🏜", "Deserto da Judeia", 31.55, 35.35, 31.551536, 35.343474,
     "Deserto da Judeia; deserto de juda; judean desert"],
    ["🌄", "En Gedi", 31.452396, 35.384824, 31.452094, 35.385068,
     "En Gedi; ein gedi; engadi"],
    ["📜", "Qumran", 31.741929, 35.45931, 31.742072, 35.459311,
     "Qumran; quiriate; manuscritos do mar morto"],
    ["🧂", "Mar Morto", 31.541946, 35.481201, null, null,
     "Mar Morto; dead sea; mar salgado"],
    ["🏕", "Sodoma", 31.0724, 35.3983, 31.072557, 35.397143,
     "Sodoma; gomorra; sodom; gomorrah"],
    ["🥇", "Heródio", 31.666183, 35.242155, 31.666567, 35.242014,
     "Heródio; herodium; herodio"],
    ["🪨", "Mispá", 31.8861, 35.2156, 31.887631, 35.214555,
     "Mispá; mispa; mizpah; mispah"],
    ["🍇", "Gibeão", 31.851029, 35.182335, 31.851302, 35.182215,
     "Gibeão; gibeon; gabaon"],
    ["🏚", "Gibeá", 31.82348, 35.231201, 31.823661, 35.231996,
     "Gibeá; gibeah; gibea de benjamim"],
    ["⛺", "Adulão", 31.671323, 34.949207, 31.671129, 34.949115,
     "Adulão; adulam; caverna de adulao"],
    ["👑", "Ramá", 31.8994, 35.2014, 31.899574, 35.201017,
     "Ramá; ramah; rama de benjamim"],
    ["🌾", "Silo", 32.0553, 35.2897, 32.055033, 35.28964,
     "Silo; shiloh; tabernaculo de silo"],
    ["🪜", "Betel", 31.9306, 35.2214, 31.930315, 35.220601,
     "Betel; bethel; casa de deus; luz"],
    ["🏙", "Ai", 31.9167, 35.2667, 31.916578, 35.266604,
     "Ai; haai; et tell"],
    ["🛶", "Cafarnaum", 32.880452, 35.575453, 32.880659, 35.574384,
     "Cafarnaum; capernaum; casa de pedro"],
    ["🎣", "Bete-Saída", 32.91039, 35.630583, 32.911789, 35.630655,
     "Bete-Saída; bethsaida; bete saida"],
    ["🪨", "Corazim", 31.782087, 35.209214, 31.78251, 35.209536,
     "Corazim; chorazin; corazin"],
    ["⛰", "Monte das Bem-aventuranças", 32.881813, 35.55652, 32.881947, 35.556745,
     "Monte das Bem-aventuranças; bem aventurancas; beatitudes; monte das bem aventurancas"],
    ["🍞", "Tabga", 32.873249, 35.549925, 32.873195, 35.549998,
     "Tabga; tabgha; multiplicacao dos paes"],
    ["🐟", "Magdala", 32.828443, 35.512921, 32.828485, 35.512619,
     "Magdala; magdalena; taricheae"],
    ["⛵", "Tiberíades", 32.793852, 35.532857, 32.793907, 35.533511,
     "Tiberíades; tiberias; tiberiade"],
    ["🍷", "Caná", 32.746955, 35.338668, 32.746117, 35.337579,
     "Caná; cana da galileia; casamento de cana"],
    ["🌸", "Genesaré", 32.847466, 35.52334, 32.847072, 35.524116,
     "Genesaré; gennesaret; ginosar"],
    ["⚔️", "Megido", 32.585431, 35.184186, 32.5868, 35.183303,
     "Megido; armagedom; megiddo; har megiddo"],
    ["🌻", "Vale de Jezreel", 32.62334, 35.220917, 32.625431, 35.223093,
     "Vale de Jezreel; jezreel; esdrelon"],
    ["🔥", "Monte Carmelo", 32.723267, 35.040143, 32.723242, 35.040657,
     "Monte Carmelo; carmelo; elias no carmelo"],
    ["✨", "Monte Tabor", 32.68711, 35.389618, 32.686846, 35.389538,
     "Monte Tabor; tabor; transfiguracao"],
    ["❄️", "Monte Hermom", 33.308429, 35.772021, 33.30829, 35.772107,
     "Monte Hermom; hermom; hermon"],
    ["🏔", "Monte Ebal", 32.23958, 35.287642, 32.239054, 35.287963,
     "Monte Ebal; ebal; monte da maldicao"],
    ["🏞", "Dotã", 32.412342, 35.238234, 32.410506, 35.238689,
     "Dotã; dotan; dothan"],
    ["🌾", "Suném", 32.606186, 35.333889, 32.605879, 35.332108,
     "Suném; shunem; sunem"],
    ["🎺", "Jezreel", 32.562351, 35.32134, 32.562328, 35.321135,
     "Jezreel; izreel; cidade de jezreel"],
    ["⛲", "En-Harode", 32.147132, 34.847794, 32.146289, 34.848511,
     "En-Harode; harod; fonte de harode; gideao"],
    ["🏛", "Hazor", 33.017878, 35.568775, 33.017911, 35.568839,
     "Hazor; hasor; tel hazor"],
    ["🏰", "Dã", 33.2489, 35.6525, 33.249757, 35.652678,
     "Dã; tel dan; lais; lesem"],
    ["🌊", "Cesareia de Filipe", 33.223787, 35.58531, 33.223991, 35.586056,
     "Cesareia de Filipe; banias; paneias; cesareia de filipos"],
    ["⛵", "Cesareia Marítima", 32.501839, 34.892447, 32.501528, 34.892305,
     "Cesareia Marítima; cesareia; caesarea; torre de estratão"],
    ["🌅", "Jope", 32.044339, 34.750991, 32.044151, 34.751922,
     "Jope; jafa; joppa; yafo"],
    ["🏖", "Ascalom", 31.665319, 34.565044, 31.665095, 34.564985,
     "Ascalom; ashkelon; ascalon"],
    ["🏜", "Gaza", 31.511725, 34.482126, 31.512148, 34.481773,
     "Gaza; cidade de gaza; filisteus"],
    ["🐝", "Zorá", 31.762739, 34.968624, 31.762569, 34.968569,
     "Zorá; zorah; tzora; sansao"],
    ["🍇", "Timna de Judá", 31.7833, 34.9167, 31.783638, 34.917578,
     "Timna de Judá; timnah; timna"],
    ["🐄", "Bete-Semes", 31.750633, 34.97492, 31.750618, 34.974915,
     "Bete-Semes; beth shemesh; bete semes"],
    ["🏰", "Gezer", 31.85972, 34.922497, 31.858425, 34.92273,
     "Gezer; tel gezer"],
    ["🌊", "Soreque", 31.793953, 34.812087, 31.793607, 34.812243,
     "Soreque; vale de soreque; dalila"],
    ["⛰", "Monte Nebo", 31.768168, 35.725269, 31.767509, 35.72521,
     "Monte Nebo; nebo; pisga; moises no nebo"],
    ["🏜", "Petra", 30.325836, 35.474567, 30.326059, 35.474787,
     "Petra; sela; edom; nabateus"],
    ["🏞", "Vale do Jaboque", 32.196026, 35.850385, 32.193169, 35.847336,
     "Vale do Jaboque; jaboque; jabbok; peniel"],
    ["🏛", "Rabá", 31.954483, 35.936707, 31.954537, 35.936808,
     "Rabá; amom; aman; amman; filadelfia da arabia"],
    ["🧭", "Cades-Barneia", 30.644032, 34.41389, 30.644137, 34.414421,
     "Cades-Barneia; cades; kadesh barnea; cades barneia"],
    ["🏜", "Deserto do Sinai", 28.567508, 33.953561, 28.567155, 33.95278,
     "Deserto do Sinai; deserto de sinai; peninsula do sinai"],
    ["🐄", "Gósen", 30.972605, 31.884603, 30.970795, 31.880741,
     "Gósen; tanis; pirameses; ramesses; gosen"],
    ["🏛", "Mênfis", 29.854458, 31.261519, 29.853825, 31.264068,
     "Mênfis; memphis; nofe"],
    ["🌴", "Zoar", 31.0461, 35.5019, 31.047009, 35.501651,
     "Zoar; segor; zoara"],
    ["🏰", "Maqueronte", 31.567418, 35.624107, 31.567477, 35.62399,
     "Maqueronte; machaerus; maquerus"],
    ["🏺", "Hesbom", 31.800839, 35.809136, 31.799969, 35.811416,
     "Hesbom; heshbon; esbom"],
    ["🏕", "Sucote", 32.197778, 35.621111, 32.197886, 35.621416,
     "Sucote; succoth; sucot"],
    ["🛁", "Banhos de Calirroe", 31.618333, 35.565, 31.617847, 35.567156,
     "Banhos de Calirroe; calirroe; callirrhoe"],
    ["🌄", "Penuel", 32.1833, 35.6333, 32.183329, 35.633291,
     "Penuel; peniel; peniel de jaco"],
    ["⚓", "Tiro", 33.272121, 35.196402, 33.271251, 35.197271,
     "Tiro; tyre; tiro e sidom"],
    ["⛵", "Sidom", 33.564733, 35.374978, 33.564702, 35.374929,
     "Sidom; sidon; sidon"],
    ["🏠", "Sarepta", 33.449222, 35.297694, 33.448785, 35.297853,
     "Sarepta; zarefate; elias e a viúva"],
    ["🌹", "Damasco", 33.51307, 36.309581, null, null,
     "Damasco; damascus; damasceno"],
    ["🐫", "Harã", 36.871006, 39.025136, 36.869931, 39.02541,
     "Harã; haran; charan"],
    ["🏛", "Ur dos Caldeus", 30.961335, 46.105388, null, null,
     "Ur dos Caldeus; caldeia; abraao em ur; ur dos caldeus"],
    ["🏯", "Babilônia", 32.544713, 44.431814, null, null,
     "Babilônia; babylon; babel; babilonia"],
    ["🐟", "Nínive", 36.356434, 43.162165, null, null,
     "Nínive; nineveh; jonas; mosul"],
    ["👑", "Susã", 32.200369, 48.248984, null, null,
     "Susã; susa; shushan; persia; ester"],
    ["🏛", "Persépolis", 29.935167, 52.890404, null, null,
     "Persépolis; persepolis; persia"],
    ["🔥", "Fornalha de Babilônia", 34.747701, 40.730462, null, null,
     "Fornalha de Babilônia; dura; fornalha ardente"],
    ["⛪", "Antioquia", 36.202557, 36.164099, 36.202017, 36.16373,
     "Antioquia; antakya; antioquia da siria; discipulos"],
    ["🏛", "Tarso", 36.916483, 34.895149, 36.916446, 34.895114,
     "Tarso; tarsus; paulo em tarso"],
    ["🌾", "Antioquia da Pisídia", 38.300287, 31.174346, 38.300228, 31.174302,
     "Antioquia da Pisídia; pisidia; yalvac"],
    ["🏜", "Listra", 37.588987, 32.346808, 37.58899, 32.346769,
     "Listra; lystra; listra de licaonia"],
    ["⛰", "Derbe", 37.349255, 33.361894, 37.345114, 33.361705,
     "Derbe; derbe de licaonia"],
    ["🏛", "Icônio", 37.872734, 32.492438, 37.872456, 32.49199,
     "Icônio; iconium; konya"],
    ["⚓", "Mileto", 37.531831, 27.279825, 37.530289, 27.283068,
     "Mileto; miletus; paulo em mileto"],
    ["🏺", "Hierápolis", 37.176627, 36.189251, 37.176183, 36.189579,
     "Hierápolis; hierapolis; pamukkale"],
    ["🧵", "Colossos", 37.786556, 29.260077, 37.786389, 29.261538,
     "Colossos; colossae; colossenses"],
    ["⚓", "Troas", 39.751855, 26.158281, 39.752069, 26.158855,
     "Troas; alexandria troas; troade"],
    ["🏛", "Pérgamo", 39.130623, 27.184482, 39.131334, 27.185971,
     "Pérgamo; pergamon; pergamo"],
    ["🏛", "Esmirna", 38.419254, 27.128469, 38.419353, 27.127998,
     "Esmirna; smyrna; izmir"],
    ["🏛", "Tiatira", 38.924053, 27.84019, 38.924087, 27.839996,
     "Tiatira; thyatira; lidia"],
    ["🏛", "Sardes", 38.48845, 28.040168, 38.487848, 28.039655,
     "Sardes; sardis; sardes"],
    ["🏛", "Filadélfia", 38.350747, 28.516575, 38.350505, 28.516391,
     "Filadélfia; philadelphia; alasehir"],
    ["🏛", "Laodiceia", 37.836679, 29.107163, 37.835329, 29.110254,
     "Laodiceia; laodicea; laodiceia do lico"],
    ["🌿", "Assos", 39.488942, 26.336134, 39.487596, 26.337904,
     "Assos; assos"],
    ["⚓", "Filipos", 41.013284, 24.283974, 41.012767, 24.287558,
     "Filipos; philippi; paulo em filipos"],
    ["⛪", "Tessalônica", 40.640317, 22.935272, 40.640396, 22.935338,
     "Tessalônica; thessalonica; salonica"],
    ["📖", "Bereia", 40.521534, 22.203683, 40.522046, 22.203004,
     "Bereia; berea; veria"],
    ["🏛", "Cencreia", 38.81228, 23.368835, 38.812202, 23.368822,
     "Cencreia; cenchreae; porto de corinto"],
    ["🌊", "Creta", 35.33908, 25.133284, 35.33908, 25.133284,
     "Creta; crete; ilha de creta"],
    ["🏝", "Cós", 36.793693, 27.084827, 36.793755, 27.084404,
     "Cós; kos; ilha de cos"],
    ["🏝", "Rodes", 36.17253, 27.919402, 36.173636, 27.918684,
     "Rodes; rhodes; ilha de rodes"],
    ["⛪", "Chipre", 34.774399, 32.423159, 34.774439, 32.423199,
     "Chipre; cyprus; barnabe em chipre"],
    ["⚖️", "Pafos", 34.759611, 32.407501, 34.75949, 32.408714,
     "Pafos; paphos; paulo e o procônsul"],
    ["🌋", "Malta", 35.885892, 14.402529, 35.886234, 14.401428,
     "Malta; naufragio de paulo; melita"],
    ["🏛", "Siracusa", 37.031575, 15.212428, 37.031851, 15.209478,
     "Siracusa; syracuse; siracusa da sicilia"],
    ["⚓", "Pozzuoli", 40.822643, 14.121911, 40.82272, 14.121569,
     "Pozzuoli; puteoli; porto de roma"],
    ["🛤", "Via Ápia", 41.855119, 12.517249, 41.855119, 12.517248,
     "Via Ápia; appian way; via apia"],
    ["🏛", "Ágora de Atenas", 37.97471, 23.722493, 37.974574, 23.719777,
     "Ágora de Atenas; agora; atenas antiga"],
    ["⛰", "Acrópole", 37.971689, 23.72632, 37.971718, 23.726314,
     "Acrópole; acropolis; partenon"],
    ["🏛", "Delfos", 38.481154, 22.500549, 38.480724, 22.501098,
     "Delfos; delphi; oraculo de delfos"],
    ["🏛", "Olímpia", 37.63825, 21.630566, 37.639487, 21.62891,
     "Olímpia; olympia; jogos olimpicos"],
    ["🏛", "Esparta", 37.081111, 22.424847, 37.081945, 22.426147,
     "Esparta; sparta; lacedemonia"],
    ["🏛", "Fórum Romano", 41.891641, 12.48673, 41.892133, 12.486964,
     "Fórum Romano; forum romano; roman forum; foro"],
    ["⛪", "Basílica de São Paulo", 41.858697, 12.476783, 41.858056, 12.476486,
     "Basílica de São Paulo; sao paulo fora dos muros; ostiense"],
    ["🕳", "Catacumbas de Roma", 41.858901, 12.510753, 41.85925, 12.51087,
     "Catacumbas de Roma; catacumbas; catacombs"],
    ["🏝", "Alexandria", 31.199181, 29.895172, 31.199651, 29.895149,
     "Alexandria; alexandria do egito; farol de alexandria"],
    ["🌊", "Rio Nilo", 30.0459, 31.2336, 30.045906, 31.233667,
     "Rio Nilo; nilo; niloticas"],
    ["🏔", "Monte Ararat", 39.701935, 44.298396, 39.701956, 44.298357,
     "Monte Ararat; ararat; arca de noe"],
  ];

  /* ---------------------------------------------------------------- busca
     Compara sem acento e em minúsculas dos dois lados. */
  function semAcento(t) {
    return String(t == null ? "" : t).normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
  }

  /* Nome CURTO (até 4 letras, como "Ur" ou "Ai") casa com a inicial maiúscula e
     na fronteira da palavra: sem isso "ur" acharia "urubu" e "ai" acharia o
     "ai" de todo versículo. */
  var CURTO = 5;

  /* "Ai" é cidade (Josué 7) E interjeição — "Ai de vós, escribas!" enche os
     Evangelhos. Sem esta regra, quase todo versículo de repreensão ganharia um
     botão verde de lugar nenhum. */
  var NAO_SEGUIDO_DE = { "ai": ["de"] };

  function escapa(t) {
    return String(t).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  }

  var INDICE = null;
  function indice() {
    if (INDICE) return INDICE;
    INDICE = [];
    for (var i = 0; i < LUGARES.length; i++) {
      var l = LUGARES[i];
      var frases = String(l[6] || "").split(";");
      for (var f = 0; f < frases.length; f++) {
        var bruto = frases[f].trim();
        if (!bruto) continue;
        INDICE.push({ lugar: l, bruto: bruto, alvo: semAcento(bruto), curto: bruto.length < CURTO });
      }
    }
    /* o apelido MAIS LONGO primeiro: "mar da galileia" ganha de "galileia" */
    INDICE.sort(function (a, b) { return b.alvo.length - a.alvo.length; });
    return INDICE;
  }

  function BibleXLugaresAchar(texto) {
    var cru = String(texto == null ? "" : texto);
    if (!cru) return null;
    var alvo = semAcento(cru);
    var lista = indice();
    for (var i = 0; i < lista.length; i++) {
      var it = lista[i];
      if (!it.alvo) continue;

      if (it.curto) {
        /* a fronteira vem em lookahead para o texto logo depois da palavra
           continuar disponível (é ele que diz se vem um "de" proibido) */
        var re = new RegExp("(^|[^A-Za-z\u00c0-\u00ff])" + escapa(it.bruto)
                            + "(?=$|[^A-Za-z\u00c0-\u00ff])", "g");
        var m;
        while ((m = re.exec(cru)) !== null) {
          var depois = cru.slice(m.index + m[0].length);
          var proibidos = NAO_SEGUIDO_DE[it.alvo];
          var barrado = false;
          if (proibidos) {
            for (var k = 0; k < proibidos.length; k++) {
              if (new RegExp("^\\s+" + proibidos[k] + "\\b", "i").test(depois)) { barrado = true; break; }
            }
          }
          if (!barrado) return it.lugar;
          re.lastIndex = m.index + 1;   /* este não vale; segue procurando */
        }
        continue;
      }

      var pos = alvo.indexOf(it.alvo);
      while (pos >= 0) {
        var antes = pos === 0 ? " " : alvo.charAt(pos - 1);
        var fim = pos + it.alvo.length;
        var depoisC = fim >= alvo.length ? " " : alvo.charAt(fim);
        if (!/[a-z0-9]/.test(antes) && !/[a-z0-9]/.test(depoisC)) return it.lugar;
        pos = alvo.indexOf(it.alvo, pos + 1);
      }
    }
    return null;
  }

  function BibleXLugaresTemRua(l) {
    return !!(l && l[4] !== null && l[4] !== undefined && isFinite(Number(l[4])));
  }

  /* Os que dão para ANDAR — é o que alimenta os passeios prontos e a biblioteca */
  function BibleXLugaresPasseios() {
    var saida = [];
    for (var i = 0; i < LUGARES.length; i++) if (BibleXLugaresTemRua(LUGARES[i])) saida.push(LUGARES[i]);
    return saida;
  }

  window.BibleXLugares = LUGARES;
  window.BibleXLugaresAchar = BibleXLugaresAchar;
  window.BibleXLugaresTemRua = BibleXLugaresTemRua;
  window.BibleXLugaresPasseios = BibleXLugaresPasseios;
  window.BibleXLugaresSemAcento = semAcento;
})();
