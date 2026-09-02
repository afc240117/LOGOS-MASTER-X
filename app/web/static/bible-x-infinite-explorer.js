(function(){
  "use strict";
  const $=(s,r=document)=>r.querySelector(s), esc=v=>String(v??"").replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
  const mediaState={query:"",kind:"image",offset:0,loading:false,done:false,observer:null,items:[]};
  const openGallery=(index)=>{
    const item=mediaState.items[index];
    if(!item)return;
    const gallery=window.bxOpenVisualGallery;
    if(typeof gallery==="function"){
      try{gallery(mediaState.items,index,{eyebrow:`MÍDIA X • ${mediaState.query}`});return}catch(e){}
    }
    window.open(item.original_url||item.thumb_url,"_blank","noopener");
  };
  const mediaCard=(item,index)=>`<article class="bx-infinite-media-card"><button type="button" class="bx-infinite-open" data-infinite-open="${index}" aria-label="Abrir ${esc(item.title||'Imagem pública')}"><img loading="lazy" src="${esc(item.thumb_url||item.original_url)}" alt="${esc(item.title||'Imagem pública')}"></button><div><b>${esc(item.title||'Imagem pública')}</b><small>${esc(item.credit||item.artist||item.source||'Wikimedia Commons')}</small><em>${esc(item.license||'Licença na fonte')}</em></div><nav><button type="button" data-infinite-open="${index}">⛶ Abrir</button><a href="${esc(item.page_url||'https://commons.wikimedia.org/') }" target="_blank" rel="noopener">Fonte ↗</a></nav></article>`;
  async function moreMedia(){
    const grid=$("#bxMediaPublicGrid"); if(!grid||mediaState.loading||mediaState.done)return;
    mediaState.loading=true; const marker=document.createElement("div"); marker.className="bx-infinite-loading"; marker.textContent="Carregando mais resultados públicos…"; grid.appendChild(marker);
    try{const p=new URLSearchParams({q:mediaState.query,kind:mediaState.kind,limit:"12",offset:String(mediaState.offset)});const r=await fetch(`/api/bible/media/public/search?${p}`,{headers:{Accept:"application/json"}});const data=await r.json();if(!r.ok)throw Error(data.detail||"Fonte pública indisponível.");marker.remove();const items=Array.isArray(data.items)?data.items:[];if(!items.length){mediaState.done=true;const end=document.createElement("small");end.className="bx-infinite-end";end.textContent="Fim dos resultados disponíveis para esta busca.";grid.appendChild(end);return}const frag=document.createElement("div");frag.innerHTML=items.map((item,i)=>mediaCard(item,mediaState.items.length+i)).join("");while(frag.firstChild)grid.appendChild(frag.firstChild);mediaState.items=mediaState.items.concat(items);mediaState.offset=Number(data.next_offset??(mediaState.offset+items.length));mediaState.done=!data.has_more}catch(e){marker.textContent=`Não foi possível carregar mais resultados: ${e.message}`;mediaState.done=true}finally{mediaState.loading=false}}
  function watchMedia(){
    const grid=$("#bxMediaPublicGrid"),input=$("#bxMediaPublicQuery");if(!grid||!input)return;
    const query=input.value.trim();if(!query)return;
    if(mediaState.query!==query){mediaState.query=query;mediaState.items=Array.isArray(grid.__bxItems)?grid.__bxItems.slice():[];mediaState.offset=mediaState.items.length;mediaState.kind="image";mediaState.done=false}
    let sentinel=$(".bx-infinite-sentinel",grid);if(!sentinel){mediaState.observer?.disconnect();sentinel=document.createElement("div");sentinel.className="bx-infinite-sentinel";grid.appendChild(sentinel);mediaState.observer=new IntersectionObserver(es=>{if(es.some(e=>e.isIntersecting))moreMedia()},{rootMargin:"700px"});mediaState.observer.observe(sentinel)}
  }
  function mountHistory(){
    const panel=$("[data-bible-panel=\"maps\"]"),toolbar=$(".bx-map-toolbar",panel);if(!panel||!toolbar||$("#bxMapHistory",panel))return;
    const box=document.createElement("section");box.id="bxMapHistory";box.className="bx-map-history";
    box.innerHTML='<div><b>🧭 Camadas históricas</b><small>Explore mapas por tempo bíblico, reinos, lugares e viagens</small></div><nav>'+[['Antigo Testamento','Antigo Testamento'],['Patriarcas','Patriarcas'],['Êxodo','Êxodo'],['Reinos','monarquia'],['Exílio','exílio'],['Evangelhos','jesus'],['Viagens missionárias','paulo'],['Rotas','rota']].map(x=>`<button type="button" data-map-history="${esc(x[1])}">${esc(x[0])}</button>`).join('')+'<button type="button" data-map-open-timeline>🕰 Linha do Tempo</button></nav>';
    toolbar.after(box);
    box.addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;if(b.dataset.mapOpenTimeline!==undefined){document.querySelector('[data-bible-section="timeline"]')?.click();setTimeout(()=>{$("#bxTimelineQuery")?.focus()},100);return}const q=b.dataset.mapHistory;if($("#bxMapQuery"))$("#bxMapQuery").value=q;$("#bxMapFind")?.click()})
  }
  function init(){
    document.addEventListener('biblex:pagechange',()=>{mountHistory();setTimeout(watchMedia,150)});
    const ob=new MutationObserver(()=>{mountHistory();const g=$("#bxMediaPublicGrid");if(g&&g.querySelector('article'))watchMedia()});
    ob.observe(document.body,{childList:true,subtree:true});
    document.addEventListener("click",(event)=>{const open=event.target.closest("[data-infinite-open]");if(open){const index=Number(open.dataset.infiniteOpen);if(!Number.isNaN(index))openGallery(index)}});
    mountHistory();setTimeout(watchMedia,300);
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
  window.BibleXInfiniteExplorer={watch:watchMedia,loadMore:()=>moreMedia()};
})();
