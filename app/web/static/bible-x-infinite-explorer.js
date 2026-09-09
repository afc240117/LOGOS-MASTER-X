(function(){
  "use strict";
  const $=(s,r=document)=>r.querySelector(s), esc=v=>String(v??"").replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
  const MAX_PUBLIC_QUERY=120;
  const cleanQuery=value=>String(value??"").replace(/\s+/g," ").trim().slice(0,MAX_PUBLIC_QUERY);
  const queryKey=value=>cleanQuery(value).normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase();
  const BIBLE_REFERENCE_ONLY_RE=/^(?:[123]\s*)?[\p{L}]+(?:\s+[\p{L}]+){0,3}\s+\d{1,3}(?:(?:[:.]\s*\d{1,3}(?:\s*-\s*\d{1,3})?)|(?:\s*[-–]\s*\d{1,3}))?\s*$/u;
  const NON_VISUAL_QUERY_RE=/^(?:localiza(?:c|ç)[aã]o(?:\s+aproximada)?\s+a\s+investigar|passagem(?:\s+b[ií]blica)?\s+(?:selecionada|em\s+explora[cç][aã]o\s+contextual)|entrar\s+na\s+hist[oó]ria|leitura\s+guiada|etapa\s+atual|per[ií]odo\s+a\s+confirmar(?:\s+no\s+estudo)?|cena\s+editorial)$/i;
  const isBibleReferenceOnly=value=>{const q=cleanQuery(value);return Boolean(q&&/\d/.test(q)&&BIBLE_REFERENCE_ONLY_RE.test(q))};
  const isUsableVisual=value=>{const q=cleanQuery(value);return q.length>=3&&!isBibleReferenceOnly(q)&&!NON_VISUAL_QUERY_RE.test(q)};
  function fallbackVisualQuery(seed,kind="image"){
    const text=queryKey(seed);
    const rules=[
      [/sicar|siquem|shechem|sychar|samarit/,"Sicar Samaria poço de Jacó ruínas bíblicas"],
      [/jerusalem|golgota|calvario|pilatos|templo|muro ocidental/,"Jerusalém bíblica Cidade Antiga ruínas arqueológicas"],
      [/galileia|galilee|cafarnaum|capernaum|nazare|nazareth|mar da galileia/,"Galileia Cafarnaum ruínas bíblicas paisagem atual"],
      [/jordao|jordan|betania|bethany/,"Rio Jordão Betânia sítio bíblico paisagem atual"],
      [/jerico|jericho/,"Jericó Tell es-Sultan ruínas arqueológicas"],
      [/sinai|horebe|horeb|exodo|exodus/,"Sinai deserto rota bíblica paisagem atual"],
      [/damasco|damascus|paulo|paul|efeso|ephesus/,"Éfeso cidades bíblicas ruínas arqueológicas"],
      [/\bjoao\s+4(?:[:\s]|$)/,"Sicar Samaria poço de Jacó ruínas bíblicas"],
      [/\b(?:joao|mateus|marcos|lucas)\b/,"Jerusalém e Galileia cidades bíblicas ruínas arqueológicas"],
      [/\b(?:atos|romanos|corintios|galatas)\b/,"Éfeso cidades bíblicas ruínas arqueológicas"]
    ];
    let q=rules.find(([pattern])=>pattern.test(text))?.[1]||"cidades e ruínas bíblicas Israel antigo";
    if(kind==="panorama"&&!/panorama|360/i.test(q))q+=" panorama 360";
    return q;
  }
  function contextualVisualQuery(raw,kind="image"){
    const {scene,model,context}=immersionMediaContext();
    if(isUsableVisual(raw))return cleanQuery(raw);
    const candidates=kind==="panorama"
      ? [model?.queries?.panorama,scene?.place?.name,scene?.place?.query,scene?.panoramaQuery,scene?.mediaQuery,scene?.title]
      : [model?.queries?.images,scene?.place?.name,scene?.place?.query,scene?.mediaQuery,scene?.panoramaQuery,scene?.title];
    const selected=candidates.map(cleanQuery).find(isUsableVisual);
    if(selected)return kind==="panorama"&&!/panorama|360/i.test(selected)?`${selected} panorama 360`:selected;
    const fromImmersion=window.BibleXImmersion?.getVisualQuery?.(`${context?.reference||raw||""} ${context?.verseText||""}`,kind);
    return isUsableVisual(fromImmersion)?fromImmersion:fallbackVisualQuery(`${context?.reference||raw||""} ${context?.verseText||""}`,kind);
  }
  const errorText=(payload,status)=>{
    const detail=payload?.detail;
    if(status===422)return "A consulta foi ajustada ao limite de 120 caracteres. Tente pesquisar novamente.";
    if(Array.isArray(detail))return detail.map(item=>item?.msg||item?.message||JSON.stringify(item)).join(" • ");
    if(detail&&typeof detail==="object")return detail.message||detail.msg||JSON.stringify(detail);
    return String(detail||`Fonte pública indisponível (HTTP ${status||"erro"}).`);
  };
  const mediaState={query:"",sourceQuery:"",kind:"image",requestedKind:"image",provider:"all",offset:0,loading:false,done:false,observer:null,items:[]};
  const openImmersion=(item={})=>{
    const api=window.BibleXImmersion;
    if(!api||typeof api.open!=="function")return false;
    const context=typeof api.getContext==="function"?(api.getContext()||{}):{};
    const input=$("#bRef, input[name='reference'], [data-bible-reference]");
    const reference=String(item.reference||context.currentNarrativeRef||context.reference||input?.value||"Passagem selecionada").trim();
    const text=String(item.verseText||context.verseText||"").trim();
    const fullscreenTrigger={matches:selector=>/data-bx-immersion/.test(String(selector||""))};
    api.open(reference,text,fullscreenTrigger);
    return true;
  };
  const openInternalFallback=(item={})=>{
    const source=String(item.original_url||item.thumb_url||"").trim();
    if(!source)return;
    const overlay=document.createElement("div");
    overlay.className="bx-infinite-internal-viewer";
    overlay.setAttribute("role","dialog");
    overlay.setAttribute("aria-modal","true");
    overlay.innerHTML=`<section><header><strong>${esc(item.title||"Imagem pública")}</strong><button type="button" aria-label="Fechar">×</button></header><div class="bx-infinite-internal-viewer-stage"><img alt="${esc(item.title||"Imagem pública")}" src="${esc(source)}"></div><footer><span>${esc([item.credit||item.artist||item.source,item.license].filter(Boolean).join(" • "))}</span><a href="${esc(item.page_url||"https://commons.wikimedia.org/")}" target="_blank" rel="noopener">Fonte ↗</a></footer></section>`;
    const close=()=>{overlay.remove();document.body.classList.remove("bx-infinite-viewer-lock")};
    overlay.querySelector("header button")?.addEventListener("click",close);
    overlay.addEventListener("click",event=>{if(event.target===overlay)close()});
    document.body.appendChild(overlay);document.body.classList.add("bx-infinite-viewer-lock");
  };
  const openGallery=(index)=>{
    const item=mediaState.items[index];
    if(!item)return;
    if((mediaState.kind==="panorama"||publicIsPanorama(item))&&window.BibleXVisualMedia?.openPanorama){
      window.BibleXVisualMedia.openPanorama(item,{eyebrow:`MÍDIA X • 360° • ${item.title||mediaState.query}`,autoRotate:true});
      return;
    }
    const visual=window.BibleXVisualMedia;
    if(typeof visual?.openGallery==="function"){
      try{visual.openGallery(mediaState.items,index,{eyebrow:`MÍDIA X • ${mediaState.query}`});return}catch(e){}
    }
    const gallery=window.bxOpenVisualGallery;
    if(typeof gallery==="function"){
      try{gallery(mediaState.items,index,{eyebrow:`MÍDIA X • ${mediaState.query}`});return}catch(e){}
    }
    openInternalFallback(item);
  };
  const mediaCard=(item,index)=>`<article class="bx-infinite-media-card"><button type="button" class="bx-infinite-open" data-infinite-open="${index}" aria-label="Abrir ${esc(item.title||'Imagem pública')}"><img loading="lazy" src="${esc(item.thumb_url||item.original_url)}" alt="${esc(item.title||'Imagem pública')}"></button><div><b>${esc(item.title||'Imagem pública')}</b><small>${esc(item.credit||item.artist||item.source||'Wikimedia Commons')}</small><em>${esc(item.license||'Licença na fonte')}</em></div><nav><button type="button" data-infinite-open="${index}">${publicIsPanorama(item)?'🕶 Abrir 360°':'⛶ Abrir'}</button><button type="button" data-infinite-immersion="${index}">🕶 Entrar na história</button><a href="${esc(item.page_url||'https://commons.wikimedia.org/') }" target="_blank" rel="noopener">Fonte ↗</a></nav></article>`;
  function immersionMediaContext(){
    const context=window.BibleXImmersion?.getContext?.();
    const model=context?.integration?.active?context.integration:window.BibleXImmersion?.getIntegrationModel?.();
    return {context,scene:context?.scene||{},model:model?.active?model:null};
  }
  const PUBLIC_SEMANTIC_RULES=[
    [/sicar|siquem|shechem|sychar/i,["Jacob's Well Nablus current","Shechem Nablus archaeological site","Sebastia Samaria ruins"]],
    [/jerusalem/i,["Jerusalem Old City Israel","Jerusalem archaeological ruins","Temple Mount Jerusalem current"]],
    [/jerico|jericho/i,["Tell es-Sultan Jericho ruins","Jericho Jordan Valley current","Jericho archaeological site"]],
    [/samaria/i,["Sebastia Samaria archaeological site","Samaria ancient city ruins","Samarian landscape Israel"]],
    [/galileia|galilee/i,["Capernaum ruins Israel","Nazareth Old City Israel","Sea of Galilee current landscape"]],
    [/mar\s+da\s+galileia|sea\s+of\s+galilee/i,["Sea of Galilee","Galilee lake"]],
    [/judeia|judea/i,["Judean hills Israel","Bethlehem Old City current","Hebron Old City archaeological"]],
    [/jordao|jordan/i,["Jordan River current site","Bethany beyond Jordan archaeological site","Jordan Valley landscape"]],
    [/sinai|horebe|horeb/i,["Mount Sinai Egypt current","Saint Catherine Sinai monastery","Sinai desert landscape"]],
    [/damasco|damascus/i,["Damascus Old City Syria","Damascus current city ruins","Damascus archaeological site"]],
    [/canaa|cana/i,["Kafr Kanna Cana Galilee","Cana Galilee archaeological site","Cana Israel current"]],
    [/exodo|exodus/i,["Exodus desert","Sinai desert"]],
    [/babilonia|babylon/i,["Babylon archaeological site Iraq","Babylon ruins current Iraq","Babylon ancient city"]],
    [/ninive|nineveh/i,["Nineveh ruins Mosul Iraq","Nineveh archaeological site","Mosul current city"]],
    [/paulo|paul/i,["Ephesus ruins Turkey","Paul missionary journey sites","ancient Ephesus current"]],
    [/templo|temple/i,["Temple Mount Jerusalem current","Jerusalem archaeological site","Western Wall Jerusalem"]],
    [/ruinas|ruins|ancient\s+israel|cidades\s+e\s+ruinas|biblical\s+archaeological/i,["Jerusalem Old City Israel","Capernaum ruins Israel","ancient Israel archaeological site"]]
  ];
  function publicSemanticQueries(scene,raw,kind){
    const text=[raw,scene?.place?.name,scene?.place?.query,scene?.title,scene?.mediaQuery,scene?.panoramaQuery].filter(Boolean).join(" ").normalize("NFD").replace(/[\u0300-\u036f]/g,"");
    const out=[];const add=value=>{const q=cleanQuery(value);if(q&&!out.some(item=>item.toLowerCase()===q.toLowerCase()))out.push(q)};
    PUBLIC_SEMANTIC_RULES.forEach(([pattern,queries])=>{if(pattern.test(text))queries.forEach(query=>{add(query);if(kind==="panorama"){add(`${query} panorama`);add(`${query} landscape`)}})});
    return out.slice(0,8);
  }
  function publicQueryVariants(raw,kind){
    const {scene,model}=immersionMediaContext();
    const visualRaw=contextualVisualQuery(raw,kind);
    const contextualPlace=scene?.place?.name||scene?.place?.query;
    const semantic=publicSemanticQueries(scene,visualRaw,kind);
    const values=kind==="panorama"
      ? [visualRaw,...semantic,model?.queries?.panorama,contextualPlace,scene?.panoramaQuery,scene?.place?.query,scene?.mediaQuery,scene?.title]
      : [visualRaw,...semantic,model?.queries?.images,contextualPlace,scene?.mediaQuery,scene?.panoramaQuery,scene?.place?.query,scene?.title];
    const result=[];
    const add=value=>{const q=cleanQuery(value);if(!isUsableVisual(q)||result.some(item=>item.toLowerCase()===q.toLowerCase()))return;result.push(q)};
    values.filter(Boolean).forEach(value=>{
      add(value);
      const simple=String(value).replace(/[|/]+/g," ").replace(/\b(?:panorama|equirectangular|spherical|360(?:°|º)?|vista\s+360)\b/gi," ").replace(/\s+/g," ").trim();
      add(simple);
      const words=simple.split(" ").filter(Boolean);if(words.length>6)add(words.slice(0,6).join(" "));
    });
    if(kind==="panorama"){
      const place=String(scene?.place?.name||scene?.place?.query||"").replace(/[|/]+/g," ").replace(/\s+/g," ").trim();
      if(place)add(`${place} landscape`);
    }
    return result.slice(0,8);
  }

  const PUBLIC_ALIASES=Object.freeze({
    sicar:["sychar","shechem","sichem","samaria","samaritan","jacob well"],
    siquem:["shechem","sychar","sicar","samaria"],
    samaria:["samarian","samaritan","samaritans","sychar","shechem"],
    samaritana:["samaritan","samaria"],
    jerico:["jericho"],
    damasco:["damascus"],
    galileia:["galilee"],
    judeia:["judea"],
    exodo:["exodus"],
    poco:["well","wells"],
    templo:["temple"],
    montanha:["mountain","mountains"],
    deserto:["desert"],
    mar:["sea"],
    canaa:["canaan"],
    hara:["haran"],
    paulo:["paul","paulus"]
  });
  const PUBLIC_STOP_WORDS=new Set(["a","ao","aos","as","da","das","de","do","dos","e","em","entre","na","nas","no","nos","o","os","para","por","que","regiao","região","the","and","from","in","of","on","to","with","region","biblica","biblical"]);
  const publicTokens=value=>String(value??"").normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase().replace(/[^\p{L}\p{N}]+/gu," ").split(/\s+/).filter(token=>token.length>=3&&!PUBLIC_STOP_WORDS.has(token));
  function expandedPublicTokens(value){
    const tokens=new Set();
    publicTokens(value).forEach(token=>{tokens.add(token);(PUBLIC_ALIASES[token]||[]).forEach(alias=>publicTokens(alias).forEach(item=>tokens.add(item)))});
    return tokens;
  }
  const publicItemText=item=>[item?.title,item?.name,item?.description,item?.categories,item?.credit,item?.artist,item?.source,item?.page_url,item?.original_url].flatMap(value=>Array.isArray(value)?value:[value]).filter(Boolean).join(" ");
  const publicIsPanorama=item=>item?.panorama_candidate===true||item?.is_panorama===true||/equirectangular|panorama|spherical|(?:^|[^\d])360(?:°|º)?(?:[^\d]|$)|virtual\s*tour|street\s*view/i.test(publicItemText(item));
  function rankPublicItems(items,raw,kind){
    const {scene,model}=immersionMediaContext();
    const placeText=[scene?.place?.name,scene?.place?.query].filter(Boolean).join(" ");
    const targetText=[contextualVisualQuery(raw,kind),placeText,model?.queries?.images,model?.queries?.panorama,scene?.title,scene?.mediaQuery,scene?.panoramaQuery].filter(Boolean).join(" ");
    const targetTokens=expandedPublicTokens(targetText);
    const placeTokens=expandedPublicTokens(placeText);
    const seen=new Set();
    const ranked=[];
    (Array.isArray(items)?items:[]).forEach((item,index)=>{
      if(!item||typeof item!=="object")return;
      const identity=String(item.page_url||item.original_url||item.id||item.title||`item-${index}`).toLowerCase();
      if(seen.has(identity))return;
      seen.add(identity);
      const titleTokens=expandedPublicTokens([item.title,item.name,item.categories].filter(Boolean).join(" "));
      const textTokens=expandedPublicTokens(publicItemText(item));
      let score=0;
      placeTokens.forEach(token=>{if(titleTokens.has(token))score+=8;else if(textTokens.has(token))score+=3});
      targetTokens.forEach(token=>{if(placeTokens.has(token))return;if(titleTokens.has(token))score+=3;else if(textTokens.has(token))score+=1});
      if(kind==="panorama")score+=publicIsPanorama(item)?8:-4;
      ranked.push({item,score,index});
    });
    ranked.sort((left,right)=>right.score-left.score||left.index-right.index);
    const relevant=ranked.filter(entry=>entry.score>0);
    if(placeTokens.size&&!relevant.length)return [];
    return (relevant.length?relevant:ranked).map(entry=>entry.item).slice(0,12);
  }
  async function publicSearch(query,kind,limit=8){
    const provider=String($("#bxMediaPublicQuery")?.dataset.bxMediaProvider||"all").trim().toLowerCase()||"all";
    const p=new URLSearchParams({q:cleanQuery(query),kind,provider,limit:String(limit),offset:"0"});
    const response=await fetch(`/api/bible/media/public/search?${p}`,{headers:{Accept:"application/json"},cache:"no-store"});
    const data=await response.json().catch(()=>({}));
    if(!response.ok)throw Error(errorText(data,response.status));
    return {items:Array.isArray(data.items)?data.items:[],next_offset:Number(data.next_offset||data.items?.length||0),has_more:Boolean(data.has_more),query:cleanQuery(query),provider};
  }
  async function searchWithFallback(raw,kind){
    let lastError=null;
    const collect=async(actualKind,variants)=>{
      const batches=[];
      for(const query of variants.slice(0,5)){
        try{
          const result=await publicSearch(query,actualKind);
          if(result.items.length){batches.push(result);if(batches.length>=3)break}
        }catch(error){lastError=error}
      }
      if(!batches.length)return null;
      const items=rankPublicItems(batches.flatMap(batch=>batch.items),raw,actualKind);
      const usable=actualKind==="panorama"?items.filter(publicIsPanorama):items;
      return usable.length?{...batches[0],items:usable.slice(0,12),actualKind}:null;
    };
    const exact=await collect(kind,publicQueryVariants(raw,kind));
    if(exact)return exact;
    if(kind==="panorama"){
      const fallback=await collect("image",publicQueryVariants(raw,"image"));
      if(fallback)return {...fallback,actualKind:"image",fallbackFrom:"panorama"};
    }
    return {items:[],next_offset:0,has_more:false,query:cleanQuery(raw),actualKind:kind,error:lastError};
  }
  function renderPublicEmpty(grid,kind,error,query=""){
    const title=kind==="panorama"?"Nenhuma vista panorâmica foi localizada.":"Nenhuma imagem foi localizada.";
    const hint=kind==="panorama"?"Tentamos consultas alternativas do lugar. Se não houver equiretangular, use o Atlas ou uma vista geográfica relacionada.":"Tentamos o nome da cena, o lugar, o título e a referência. Experimente também o nome histórico ou atual do lugar.";
    const suggestions=publicQueryVariants(query||mediaState.query,kind).slice(0,4).map(value=>`<button type="button" class="bx-infinite-suggestion" data-bx-infinite-suggestion="${esc(value)}" data-bx-infinite-kind="${kind}">${esc(value)}</button>`).join("");
    grid.innerHTML=`<div class="bx-infinite-empty"><strong>${esc(title)}</strong><p>${esc(error?.message||hint)}</p>${suggestions?`<div class="bx-infinite-suggestions"><small>Tente uma consulta internacional:</small><nav>${suggestions}</nav></div>`:""}<small>As imagens públicas dependem da internet e mostram crédito e licença quando disponíveis. A biblioteca local continua funcionando offline.</small><button type="button" class="bx-infinite-retry" data-bx-infinite-retry="${kind}">↻ Tentar novamente</button></div>`;
    grid.__bxItems=[];grid.__bxKind=kind;
  }
  async function runPublicSearch(requestedKind){
    const grid=$("#bxMediaPublicGrid"),input=$("#bxMediaPublicQuery");if(!grid||!input)return;
    // Token anti-corrida: cada busca nova invalida a anterior ainda em voo,
    // então o resultado de uma busca antiga nunca pinta por cima da nova.
    const requestId=(mediaState.requestId=(mediaState.requestId||0)+1);
    const typed=String(input.value||"").trim();
    if(!cleanQuery(typed)){
      // Campo apagado + Buscar/Enter: não ressuscita a busca de contexto nem
      // roda fallback — mostra o estado neutro e limpo (sem quebra de busca).
      mediaState.observer?.disconnect();
      mediaState.loading=false;mediaState.query="";mediaState.sourceQuery="";mediaState.requestedKind=requestedKind;mediaState.kind=requestedKind;mediaState.offset=0;mediaState.items=[];mediaState.done=true;
      grid.__bxItems=[];grid.__bxKind=requestedKind;
      // Na área com hub de fontes o grid fica vazio e limpo (a orientação vem do
      // hub acima); fora dela mostra uma mensagem curta.
      grid.innerHTML=grid.closest?.(".bx-media-discovery")?"":`<div class="bx-media-public-empty">Escolha uma fonte acima ou digite um tema e toque em Buscar imagens.</div>`;
      input.dataset.bxUserCleared="1";
      return;
    }
    const {model}=immersionMediaContext();
    const fallbackQuery=requestedKind==="panorama"?model?.queries?.panorama:model?.queries?.images;
    const query=contextualVisualQuery(typed,requestedKind);if(!query)return;
    input.value=query;input.dataset.bxImmersionQuery=query;
    mediaState.loading=true;mediaState.query=query;mediaState.sourceQuery=query;mediaState.requestedKind=requestedKind;mediaState.kind=requestedKind;mediaState.provider=String(input.dataset.bxMediaProvider||"all").toLowerCase()||"all";mediaState.offset=0;mediaState.items=[];mediaState.done=false;
    mediaState.observer?.disconnect();
    grid.innerHTML=`<div class="bx-infinite-loading">Buscando ${requestedKind==="panorama"?"vistas 360°, cidades e paisagens relacionadas":"imagens atuais de cidades, sítios arqueológicos e ruínas bíblicas"} com consultas alternativas…</div>`;
    try{
      const result=await searchWithFallback(query,requestedKind);
      if(requestId!==mediaState.requestId)return;
      if(!result.items.length){renderPublicEmpty(grid,requestedKind,result.error,query);mediaState.done=true;return}
      const notice=result.fallbackFrom==="panorama"?`<div class="bx-infinite-notice"><strong>Vista geográfica alternativa</strong><span>Nenhum panorama equiretangular foi localizado; exibimos imagens relacionadas do lugar para a exploração não ficar vazia.</span></div>`:"";
      grid.__bxItems=result.items.slice();grid.__bxKind=result.actualKind;grid.innerHTML=notice+result.items.map((item,index)=>mediaCard(item,index)).join("");
      mediaState.kind=result.actualKind;mediaState.sourceQuery=result.query;mediaState.items=result.items.slice();mediaState.offset=result.next_offset;mediaState.done=!result.has_more;
    }catch(error){
      if(requestId!==mediaState.requestId)return;
      renderPublicEmpty(grid,requestedKind,error,query);mediaState.done=true
    }finally{
      if(requestId===mediaState.requestId){mediaState.loading=false;watchMedia()}
    }
  }
  async function moreMedia(){
    const grid=$("#bxMediaPublicGrid"); if(!grid||mediaState.loading||mediaState.done)return;
    mediaState.loading=true; const marker=document.createElement("div"); marker.className="bx-infinite-loading"; marker.textContent="Carregando mais resultados públicos…"; grid.appendChild(marker);
    try{
      const p=new URLSearchParams({q:cleanQuery(mediaState.sourceQuery||mediaState.query),kind:mediaState.kind,provider:mediaState.provider||"all",limit:"8",offset:String(mediaState.offset)});
      const r=await fetch(`/api/bible/media/public/search?${p}`,{headers:{Accept:"application/json"}});
      const data=await r.json().catch(()=>({}));
      if(!r.ok)throw Error(errorText(data,r.status));
      marker.remove();
      const items=Array.isArray(data.items)?data.items:[];
      if(!items.length){mediaState.done=true;const end=document.createElement("small");end.className="bx-infinite-end";end.textContent="Fim dos resultados disponíveis para esta busca.";grid.appendChild(end);return}
      const frag=document.createElement("div");frag.innerHTML=items.map((item,i)=>mediaCard(item,mediaState.items.length+i)).join("");while(frag.firstChild)grid.appendChild(frag.firstChild);
      mediaState.items=mediaState.items.concat(items);mediaState.offset=Number(data.next_offset??(mediaState.offset+items.length));mediaState.done=!data.has_more
    }catch(e){
      marker.textContent=`Não foi possível carregar mais resultados: ${e?.message||String(e)}`;
      mediaState.done=true
    }finally{mediaState.loading=false}
  }
  function syncImmersionContext(attempt=0){
    const input=$("#bxMediaPublicQuery");
    if(!input){if(attempt<12)window.setTimeout(()=>syncImmersionContext(attempt+1),100);return}
    // O usuário apagou o campo de propósito: não re-preencha com o contexto
    // (só quando ele voltar a digitar). Evita a "busca anterior" voltar sozinha.
    if(input.dataset.bxUserCleared==="1")return;
    const context=window.BibleXImmersion?.getContext?.();
    const candidate=context?.integration?.active?context.integration:window.BibleXImmersion?.getIntegrationModel?.();
    const model=candidate?.active?candidate:null;
    const hasContext=Boolean(model?.active||context?.reference||context?.currentNarrativeRef||context?.scene);
    if(!hasContext){if(attempt<12)window.setTimeout(()=>syncImmersionContext(attempt+1),100);return}
    const query=contextualVisualQuery(model?.queries?.images||context?.searchQuery||context?.mediaQuery||context?.reference||"","image");
    if(!query){if(attempt<12)window.setTimeout(()=>syncImmersionContext(attempt+1),100);return}
    const previous=input.dataset.bxImmersionQuery||"";
    const current=input.value.trim().toLowerCase();
    const generic=!current||["jerusalém bíblica","jerusalem biblica","jerusalém","jerusalem"].includes(current);
    if(generic||!previous||input.value===previous){input.value=query;input.dataset.bxImmersionQuery=query;input.dispatchEvent(new Event("input",{bubbles:true}))}
    watchMedia();
  }
  function bindPublicInput(){
    const input=$("#bxMediaPublicQuery");if(!input||input.dataset.bxInfiniteBound)return;
    input.dataset.bxInfiniteBound="1";
    input.addEventListener("input",()=>{const clipped=cleanQuery(input.value);if(input.value!==clipped)input.value=clipped;if(input.dataset.bxUserCleared==="1"&&clipped)input.dataset.bxUserCleared=""});
  }
  function bindPublicKindButtons(){
    if(document.documentElement.dataset.bxInfiniteKindBound)return;
    document.documentElement.dataset.bxInfiniteKindBound="1";
    window.addEventListener("click",event=>{
      const target=event.target.closest?.("#bxMediaPublicFind, #bxMediaPublic360");
      if(!target)return;
      event.preventDefault();event.stopImmediatePropagation();
      const kind=target.id==="bxMediaPublic360"?"panorama":"image";
      mediaState.requestedKind=kind;mediaState.done=false;runPublicSearch(kind);
    },true);
    window.addEventListener("keydown",event=>{
      if(event.key!=="Enter"||event.target?.id!=="bxMediaPublicQuery")return;
      event.preventDefault();event.stopImmediatePropagation();
      runPublicSearch(mediaState.requestedKind||"image");
    },true);
  }
  function watchMedia(){
    const grid=$("#bxMediaPublicGrid"),input=$("#bxMediaPublicQuery");if(!grid||!input)return;
    const query=cleanQuery(input.value);if(!query)return;
    if(input.value!==query)input.value=query;
    const kind=grid.__bxKind||mediaState.kind||mediaState.requestedKind||"image";
    if(mediaState.query!==query||mediaState.kind!==kind){mediaState.query=query;mediaState.items=Array.isArray(grid.__bxItems)?grid.__bxItems.slice():[];mediaState.offset=mediaState.items.length;mediaState.kind=kind;mediaState.done=false}
    let sentinel=$(".bx-infinite-sentinel",grid);if(!sentinel){mediaState.observer?.disconnect();sentinel=document.createElement("div");sentinel.className="bx-infinite-sentinel";grid.appendChild(sentinel);mediaState.observer=new IntersectionObserver(es=>{if(es.some(e=>e.isIntersecting))moreMedia()},{rootMargin:"700px"});mediaState.observer.observe(sentinel)}
  }
  function mountHistory(){
    /* 5.4.241 — guarda a raiz ANTES de $() com ela: sem o painel de mapas no
       DOM, `panel` é null e $(".bx-map-toolbar", null) explodia aqui dentro do
       MutationObserver global (spam de exceções e o resto do callback —
       bindPublicInput/syncImmersionContext/watchMedia — nunca rodava). */
    const panel=$("[data-bible-panel=\"maps\"]");if(!panel)return;
    const toolbar=$(".bx-map-toolbar",panel);if(!toolbar||$("#bxMapHistory",panel))return;
    const box=document.createElement("section");box.id="bxMapHistory";box.className="bx-map-history";
    box.innerHTML='<div><b>🧭 Camadas históricas</b><small>Explore mapas por tempo bíblico, reinos, lugares e viagens</small></div><nav>'+[['Antigo Testamento','Antigo Testamento'],['Patriarcas','Patriarcas'],['Êxodo','Êxodo'],['Reinos','monarquia'],['Exílio','exílio'],['Evangelhos','jesus'],['Viagens missionárias','paulo'],['Rotas','rota']].map(x=>`<button type="button" data-map-history="${esc(x[1])}">${esc(x[0])}</button>`).join('')+'<button type="button" data-map-open-timeline>🕰 Linha do Tempo</button></nav>';
    toolbar.after(box);
    box.addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;if(b.dataset.mapOpenTimeline!==undefined){document.querySelector('[data-bible-section="timeline"]')?.click();setTimeout(()=>{$("#bxTimelineQuery")?.focus()},100);return}const q=b.dataset.mapHistory;if($("#bxMapQuery"))$("#bxMapQuery").value=q;$("#bxMapFind")?.click()})
  }
  function init(){
    bindPublicInput();
    bindPublicKindButtons();
    syncImmersionContext();
    window.addEventListener('biblex:media-context',()=>{bindPublicInput();bindPublicKindButtons();syncImmersionContext()});
    document.addEventListener('biblex:pagechange',()=>{mountHistory();setTimeout(()=>{bindPublicInput();bindPublicKindButtons();syncImmersionContext();watchMedia()},150)});
    const ob=new MutationObserver(()=>{mountHistory();bindPublicInput();bindPublicKindButtons();syncImmersionContext();const g=$("#bxMediaPublicGrid");if(g&&g.querySelector('article'))watchMedia()});
    ob.observe(document.body,{childList:true,subtree:true});
    document.addEventListener("click",(event)=>{const suggestion=event.target.closest("[data-bx-infinite-suggestion]");if(suggestion){const input=$("#bxMediaPublicQuery");if(input){input.value=suggestion.dataset.bxInfiniteSuggestion||"";input.dataset.bxImmersionQuery=input.value}runPublicSearch(suggestion.dataset.bxInfiniteKind||"image");return}const retry=event.target.closest("[data-bx-infinite-retry]");if(retry){runPublicSearch(retry.dataset.bxInfiniteRetry||"image");return}const immersion=event.target.closest("[data-infinite-immersion]");if(immersion){const index=Number(immersion.dataset.infiniteImmersion);if(!Number.isNaN(index))openImmersion(mediaState.items[index]||{});return}const open=event.target.closest("[data-infinite-open]");if(open){const index=Number(open.dataset.infiniteOpen);if(!Number.isNaN(index))openGallery(index)}});
    mountHistory();setTimeout(()=>{bindPublicInput();bindPublicKindButtons();syncImmersionContext();watchMedia()},300);
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
  window.BibleXInfiniteExplorer={watch:watchMedia,loadMore:()=>moreMedia()};
})();
