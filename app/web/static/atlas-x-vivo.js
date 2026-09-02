/* LOGOS MASTER X — Atlas X Vivo v5.4.3 | Mapa Real / Atlas Bíblico + Color System + JourneyPlayer, offline */
(()=>{
'use strict';
if(window.__ATLAS_X_VIVO_543__) return;
window.__ATLAS_X_VIVO_543__=true;

const VERSION='5.4.3';
const DEBUG=localStorage.getItem('logosx:atlasDebug')==='1';
const reduceMotion=window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches===true;
const storedColorMode=localStorage.getItem('logosx:atlasColorMode');
const DEFAULT_COLOR_MODE=['classic','vivid','atlas'].includes(storedColorMode)?storedColorMode:'atlas';
const $=(s,r=document)=>r.querySelector(s);
const $$=(s,r=document)=>[...r.querySelectorAll(s)];
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const clamp=(n,min,max)=>Math.min(max,Math.max(min,n));
const lerp=(a,b,t)=>a+(b-a)*t;
const easeInOutCubic=t=>t<.5?4*t*t*t:1-Math.pow(-2*t+2,3)/2;
const easeOutQuart=t=>1-Math.pow(1-t,4);
const log=(...args)=>{if(DEBUG)console.log('[AtlasX]',...args)};
const emit=(name,detail={})=>window.dispatchEvent(new CustomEvent(`atlasx:${name}`,{detail}));
const api=async path=>{const r=await fetch(path,{headers:{Accept:'application/json'}});if(!r.ok)throw new Error(`Atlas X: HTTP ${r.status}`);return r.json()};
const yearLabel=y=>y==null?'—':y<0?`${Math.abs(y)} a.C.`:`${y} d.C.`;
const certaintyLabel=x=>({high:'localização bem estabelecida',medium:'localização aproximada',traditional:'localização tradicional',schematic:'rota esquemática',debated:'rota/localização debatida'}[x]||x||'contexto aproximado');
const shell=()=>$('.atx-shell');

const S={
  data:null,basemap:null,cartography:null,results:[],selected:null,route:null,period:'all',year:null,
  view:{minLng:10,maxLng:47,minLat:27,maxLat:43},drag:null,colorMode:DEFAULT_COLOR_MODE,themeKey:'atlas',
  camera:null,raf:null,lastTs:0,
  player:{
    status:'idle',phase:'dwell',journeyId:null,currentStop:0,totalStops:0,
    speed:1,segmentProgress:0,phaseElapsed:0,visitedStops:[],
    dwellMs:900,segmentMs:2600
  }
};

const ATLAS_THEMES={
  atlas:{primary:'#D4A63A',active:'#F0C861',secondary:'#72C6D9',pale:'#FFF0B7',rgb:'212,166,58',label:'Atlas'},
  abraham:{primary:'#4C8A77',active:'#E3BE73',secondary:'#79B9A5',pale:'#E8D2A1',rgb:'76,138,119',label:'Patriarcas'},
  exodus:{primary:'#C98942',active:'#F0D2A1',secondary:'#E6B36A',pale:'#FFE1B4',rgb:'201,137,66',label:'Êxodo'},
  david:{primary:'#B89A3A',active:'#E7D07A',secondary:'#7D8FC7',pale:'#F3E4A8',rgb:'184,154,58',label:'Davi e Reino'},
  jesus:{primary:'#E5B94F',active:'#FFE19A',secondary:'#F0C861',pale:'#FFF4D0',rgb:'229,185,79',label:'Jesus'},
  'last-week':{primary:'#A85757',active:'#E8D4A0',secondary:'#D8A34A',pale:'#F3DFC0',rgb:'168,87,87',label:'Última Semana'},
  paul:{primary:'#5CA9E6',active:'#FFD77A',secondary:'#8ACAF3',pale:'#D7ECFA',rgb:'92,169,230',label:'Paulo'},
  exile:{primary:'#9B5A48',active:'#D1B48C',secondary:'#687F96',pale:'#E1C7A5',rgb:'155,90,72',label:'Exílio e retorno'}
};
const PERIOD_THEME={patriarchs:'abraham',exodus:'exodus',monarchy:'david',exile:'exile','second-temple':'atlas',jesus:'jesus',apostolic:'paul',all:'atlas'};
function journeyThemeKey(j){
  const id=String(j?.id||'');
  if(id==='abraham')return 'abraham';if(id==='exodus')return 'exodus';if(id==='david')return 'david';
  if(id==='jesus-final-week')return 'last-week';if(id.startsWith('jesus'))return 'jesus';if(id.startsWith('paul'))return 'paul';
  if(id==='exile-return')return 'exile';return PERIOD_THEME[S.period]||'atlas';
}
function applyTheme(key='atlas'){
  const root=shell(),t=ATLAS_THEMES[key]||ATLAS_THEMES.atlas;if(!root)return;
  S.themeKey=key;root.dataset.atxTheme=key;
  root.style.setProperty('--atx-theme-primary',t.primary);root.style.setProperty('--atx-theme-active',t.active);
  root.style.setProperty('--atx-theme-secondary',t.secondary);root.style.setProperty('--atx-theme-pale',t.pale);
  root.style.setProperty('--atx-theme-rgb',t.rgb);root.style.setProperty('--atx-theme-label',`"${t.label}"`);
  const themeLabel=$('#atxThemeLabel');if(themeLabel)themeLabel.textContent=t.label;
  $$('[data-journey]',root).forEach(b=>b.classList.toggle('active',S.route?.id===b.dataset.journey));
}
function applyJourneyTheme(j){applyTheme(journeyThemeKey(j))}
function applyPeriodTheme(periodId){if(!S.route)applyTheme(PERIOD_THEME[periodId]||'atlas')}
function setColorMode(mode,persist=true){
  if(!['classic','vivid','atlas'].includes(mode))mode='atlas';S.colorMode=mode;const root=shell();if(root)root.dataset.colorMode=mode;
  if(persist)localStorage.setItem('logosx:atlasColorMode',mode);
  const b=$('#atxColorMode');if(b){
    const labels={atlas:'🗺 Atlas',vivid:'🎨 Vivo',classic:'◐ Clássico'};b.textContent=labels[mode]||labels.atlas;
    b.classList.toggle('active',mode!=='classic');b.setAttribute('aria-pressed',mode==='atlas'?'true':'false');
    b.title='Visual do mapa: Atlas Bíblico → Vivo Premium → Clássico';
  }
  drawMap();
}
function toggleColorMode(){const order=['atlas','vivid','classic'];setColorMode(order[(order.indexOf(S.colorMode)+1)%order.length])}
function toneForName(name=''){let h=0;for(const ch of String(name))h=(h*33+ch.charCodeAt(0))>>>0;return h%5}

function html(){return `<section class="atx-shell" data-color-mode="atlas" data-atx-theme="atlas" aria-label="Atlas X Vivo">
 <header class="atx-head"><div class="atx-brand"><small>LOGOS MASTER X • v${VERSION}</small><h3>🗺️ Atlas X Vivo</h3><p>História bíblica em movimento: Bíblia, tempo, lugares e jornadas.</p></div><span class="atx-badge">● OFFLINE FIRST</span></header>
 <div class="atx-toolbar"><div class="atx-search"><input id="atxQuery" aria-label="Pesquisar no Atlas X" placeholder="Jericó, Bartimeu, Paulo, última semana, Êxodo..."><button id="atxSearch">Pesquisar</button></div><select class="atx-period" id="atxPeriod" aria-label="Período bíblico"><option>Carregando períodos...</option></select><div class="atx-timeline"><input id="atxYear" aria-label="Ano aproximado" type="range" min="-2100" max="100" step="25" value="30"><span class="atx-year" id="atxYearLabel">30 d.C.</span><button class="atx-ctl" id="atxYearOff" title="Desligar filtro anual" aria-label="Desligar filtro anual">∞</button></div></div>
 <div class="atx-chips" id="atxChips"></div>
 <div class="atx-main"><aside class="atx-results"><div class="atx-results-head"><b>Resultados</b><small id="atxCount">—</small></div><div id="atxResults" class="atx-loading">Preparando o atlas...</div></aside>
 <section class="atx-stage"><div class="atx-mapbar"><div><button class="atx-ctl" id="atxFit">⌖ Ajustar</button><button class="atx-ctl" id="atxZoomIn" aria-label="Aumentar zoom">＋</button><button class="atx-ctl" id="atxZoomOut" aria-label="Diminuir zoom">−</button></div><div><button class="atx-ctl active" data-layer="places">📍 Lugares</button><button class="atx-ctl active" data-layer="route">➜ Rota</button><button class="atx-ctl atx-color-toggle active" id="atxColorMode" aria-pressed="true" title="Visual do mapa: Atlas Bíblico → Vivo Premium → Clássico">🗺 Atlas</button><button class="atx-ctl atx-mobile-toggle" id="atxOpenDetail">☰ Ficha</button></div></div>
 <svg class="atx-map" id="atxMap" viewBox="0 0 1000 620" role="img" aria-label="Mapa bíblico interativo"><defs><linearGradient id="atxOceanGradient" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" style="stop-color:var(--atx-sea-a)"/><stop offset="55%" style="stop-color:var(--atx-sea-b)"/><stop offset="100%" style="stop-color:var(--atx-sea-c)"/></linearGradient><radialGradient id="atxReliefGradient"><stop offset="0%" stop-color="var(--atx-relief-strong)" stop-opacity=".42"/><stop offset="58%" stop-color="var(--atx-relief)" stop-opacity=".20"/><stop offset="100%" stop-color="var(--atx-relief)" stop-opacity="0"/></radialGradient><filter id="atxPaperNoise" x="-10%" y="-10%" width="120%" height="120%"><feTurbulence type="fractalNoise" baseFrequency=".72" numOctaves="2" seed="17" result="noise"/><feColorMatrix in="noise" type="saturate" values="0"/><feComponentTransfer><feFuncA type="table" tableValues="0 .055"/></feComponentTransfer></filter><filter id="atxGlow"><feGaussianBlur stdDeviation="2" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter><filter id="atxGlowStrong"><feGaussianBlur stdDeviation="4" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter></defs><rect class="atx-ocean-bg" x="0" y="0" width="1000" height="620"/><rect class="atx-paper-noise" x="0" y="0" width="1000" height="620"/><g id="atxGrid"></g><g id="atxWorld"><g id="atxLand"></g><g id="atxRegions"></g><g id="atxTerrain"></g><g id="atxHydro"></g><g id="atxRoute"></g><g id="atxMarkers"></g><g id="atxLabels"></g></g><g id="atxDecor"></g></svg>
 <div class="atx-legend"><span class="atx-legend-live">●</span><b id="atxThemeLabel">Atlas</b><span class="atx-legend-sep">•</span><span class="atx-legend-key"><i class="visited"></i>visitado</span><span class="atx-legend-key"><i class="active"></i>agora</span><span class="atx-legend-key"><i class="future"></i>adiante</span></div></section>
 <aside class="atx-detail" id="atxDetail"><div class="atx-detail-empty"><div style="font-size:2rem">🧭</div><b>Escolha um lugar ou jornada</b><p>O Atlas conectará passagem, personagens, eventos e Studio X.</p></div></aside></div>
 <footer class="atx-note">Nota acadêmica: rotas, cronologias e alguns sítios bíblicos possuem graus diferentes de certeza. O Atlas identifica registros tradicionais, aproximados, esquemáticos ou debatidos.</footer></section>`}

async function init(){
  const panel=$('[data-bible-panel="maps"]');
  if(!panel||panel.querySelector('.atx-shell'))return;
  panel.insertAdjacentHTML('afterbegin',html());
  setColorMode(S.colorMode,false);applyTheme('atlas');
  bind();
  try{
    const [periods,journeys,cartography]=await Promise.all([api('/api/atlas/periods'),api('/api/atlas/journeys'),api('/api/atlas/cartography')]);
    S.data={periods:periods.items,journeys:journeys.items};S.cartography=cartography;
    renderPeriods();renderChips();
    await Promise.all([loadBasemap(),search('')]);
  }catch(e){
    $('#atxResults').innerHTML=`<div class="atx-loading"><b>Atlas X Vivo ainda não conectado ao backend.</b><br>${esc(e.message)}<br><small>Execute o instalador v${VERSION} e reinicie o servidor.</small></div>`;
  }
}
function renderPeriods(){const s=$('#atxPeriod');if(!s)return;s.innerHTML=S.data.periods.map(x=>`<option value="${esc(x.id)}">${esc(x.name)}</option>`).join('');s.value='all'}
function renderChips(){
  const box=$('#atxChips');if(!box)return;
  const featured=['exodus','jesus-galilee','jesus-final-week','paul-1','paul-2','paul-3','paul-rome','david'];
  box.innerHTML=S.data.journeys.filter(x=>featured.includes(x.id)).map(x=>`<button class="atx-chip" data-journey="${x.id}">${x.id.startsWith('paul')?'➜':x.id.startsWith('jesus')?'✝':x.id==='exodus'?'🏜':'🧭'} ${esc(x.name.replace(/^[^•]+•\s*/,''))}</button>`).join('');
  $$('[data-journey]',box).forEach(b=>b.onclick=()=>openJourney(b.dataset.journey));
}
async function loadBasemap(){S.basemap=await api('/api/atlas/basemap');drawMap()}
function periodBounds(){if(S.year!=null)return {from:S.year-30,to:S.year+30};const p=S.data?.periods?.find(x=>x.id===S.period);return !p||p.id==='all'?{}:{from:p.from_year,to:p.to_year}}
async function search(q){
  const bounds=periodBounds(),params=new URLSearchParams({q:q||'',kind:'all',limit:'120'});
  if(bounds.from!=null)params.set('from_year',bounds.from);if(bounds.to!=null)params.set('to_year',bounds.to);
  const d=await api('/api/atlas/search?'+params);S.results=d.items;renderResults();drawMap();
  if(q&&d.items[0])select(d.items[0],true);
}
function renderResults(){
  const box=$('#atxResults'),count=$('#atxCount');if(count)count.textContent=`${S.results.length} exibidos`;
  if(!S.results.length){box.innerHTML='<div class="atx-loading">Nenhum resultado neste período.</div>';return}
  box.innerHTML=S.results.map((x,i)=>`<button class="atx-result kind-${x.kind} ${S.selected?.id===x.id?'active':''}" data-atx-result="${i}"><span class="atx-kind">${x.kind==='journey'?'Jornada':x.kind==='event'?'Evento':'Lugar'}</span><b>${esc(x.name||x.title)}</b><small>${esc(x.region||x.category||'')} ${x.period?'• '+esc(x.period):''}</small><em>${esc((x.summary||'').slice(0,145))}</em></button>`).join('');
  $$('[data-atx-result]',box).forEach(b=>b.onclick=()=>select(S.results[+b.dataset.atxResult],true));
}
function select(x,fit=false){
  resetPlayer(false);S.selected=x;renderResults();
  if(x.kind==='journey')return openJourney(x.id);
  if(x.kind==='event'){const p=S.results.find(r=>r.kind==='place'&&r.id===x.place_id);if(p)return select(p,fit)}
  S.route=null;applyPeriodTheme(S.period);showDetail(x);if(fit&&Number.isFinite(+x.lat))fitPoints([x]);drawMap();shell()?.classList.add('detail-open');
}
async function openJourney(id){
  resetPlayer(false);
  const j=await api('/api/atlas/journeys/'+encodeURIComponent(id));
  S.route=j;S.selected={kind:'journey',...j};applyJourneyTheme(j);
  resetPlayer(false,j);
  showDetail(S.selected);fitPoints(j.stop_rows);drawMap();renderPlayerUI();shell()?.classList.add('detail-open');
  log('Journey loaded:',id,j.stop_rows.length,'stops');
}

function journeyPlayerHtml(x){return `<div class="atx-route-player" aria-label="Reprodutor da jornada">
 <div class="atx-player-top"><b>Rota • ${x.stop_rows.length} paradas</b><span class="atx-player-state" id="atxPlayerState">PRONTO</span></div>
 <div class="atx-player-progressline"><div class="atx-progress"><i id="atxProgress"></i></div><span id="atxPercent">0%</span></div>
 <div class="atx-player-controls">
   <button class="atx-player-btn" id="atxPrev" aria-label="Parada anterior" title="Parada anterior (←)">◀</button>
   <button class="atx-player-btn atx-player-main" id="atxPlay" aria-label="Reproduzir jornada" title="Play/Pause (Espaço)">▶</button>
   <button class="atx-player-btn" id="atxNext" aria-label="Próxima parada" title="Próxima parada (→)">▶</button>
   <button class="atx-player-btn" id="atxRestart" aria-label="Reiniciar jornada" title="Reiniciar">↻</button>
 </div>
 <div class="atx-speed" aria-label="Velocidade da jornada"><span>Velocidade</span>${[.5,1,1.5,2].map(v=>`<button data-speed="${v}" class="${v===1?'active':''}">${v}x</button>`).join('')}</div>
 <div class="atx-stop-card" id="atxStopCard"><div class="atx-stop-kicker">PRONTO PARA REPRODUZIR</div><strong>${esc(x.stop_rows[0]?.name||'Jornada')}</strong><p>${esc(x.summary||'')}</p></div>
 </div>`}
function showDetail(x){
  const box=$('#atxDetail');if(!box)return;
  if(x.kind==='journey'){
    box.innerHTML=`<article class="atx-detail-card"><header><small>JORNADA BÍBLICA • <span class="atx-theme-name">${esc((ATLAS_THEMES[journeyThemeKey(x)]||ATLAS_THEMES.atlas).label)}</span></small><h4>${esc(x.name)}</h4><p>${yearLabel(x.from_year)} → ${yearLabel(x.to_year)}</p></header><div class="atx-detail-body"><span class="atx-cert">⚑ ${esc(certaintyLabel(x.certainty))}</span><p class="atx-summary">${esc(x.summary)}</p>${block('Referências',x.refs,'ref')}${block('Personagens',x.people)}<div class="atx-actions"><button class="atx-action primary" id="atxPlayHero">▶ Reproduzir história</button><button class="atx-action" id="atxStudio">🧬 Enviar ao Studio X</button></div></div>${journeyPlayerHtml(x)}</article>`;
    $('#atxPlayHero').onclick=togglePlay;$('#atxPlay').onclick=togglePlay;$('#atxPrev').onclick=previousStop;$('#atxNext').onclick=nextStop;$('#atxRestart').onclick=restartPlayer;$('#atxStudio').onclick=()=>sendStudio(x);
    $$('[data-speed]',box).forEach(b=>b.onclick=()=>setSpeed(+b.dataset.speed));
    bindRefs(box);return;
  }
  box.innerHTML=`<article class="atx-detail-card"><header><small>${esc((x.type||'LUGAR').toUpperCase())} • ${esc(x.region||'')}</small><h4>${esc(x.name||x.title)}</h4><p>${esc(x.period||'')} ${x.from_year!=null?'• '+yearLabel(x.from_year)+' → '+yearLabel(x.to_year):''}</p></header><div class="atx-detail-body"><span class="atx-cert">⌖ ${esc(certaintyLabel(x.certainty))}</span><p class="atx-summary">${esc(x.summary||x.description||'')}</p>${block('Referências',x.refs,'ref')}${block('Personagens',x.people)}${block('Acontecimentos',x.events)}<div class="atx-actions"><button class="atx-action primary" id="atxBible">📖 Abrir na Bíblia X</button><button class="atx-action" id="atxMedia">🎥 Mídia X</button><button class="atx-action" id="atxStudio">🧬 Enviar ao Studio X</button><button class="atx-action" id="atxLegacy">🗺️ Atlas clássico</button></div></div></article>`;
  $('#atxBible').onclick=()=>openBible(x.refs?.[0]);$('#atxMedia').onclick=()=>openLegacy('media',x.name);$('#atxStudio').onclick=()=>sendStudio(x);$('#atxLegacy').onclick=()=>{shell()?.scrollIntoView({behavior:reduceMotion?'auto':'smooth',block:'end'});setTimeout(()=>$('#bxMapQuery')?.focus(),300)};bindRefs(box);
}
function block(title,items,kind='tag'){if(!items?.length)return'';return `<section class="atx-block"><h5>${esc(title)}</h5><div class="atx-tags">${items.map(v=>kind==='ref'?`<button data-atx-ref="${esc(v)}">${esc(v)}</button>`:`<span>${esc(v)}</span>`).join('')}</div></section>`}
function bindRefs(box){$$('[data-atx-ref]',box).forEach(b=>b.onclick=()=>openBible(b.dataset.atxRef))}
function openBible(ref){if(!ref)return;const btn=$('[data-bible-section="reader"]');btn?.click();setTimeout(()=>{const input=$('#bRef');if(input){input.value=ref;input.dispatchEvent(new Event('input',{bubbles:true}));const go=$('#bSearch')||$('#bGo')||$('#bibleSearch');go?.click()}},80)}
function openLegacy(panel,q){$(`[data-bible-section="${panel}"]`)?.click();setTimeout(()=>{const i=panel==='media'?$('#bxMediaQuery'):$('#bxMapQuery');if(i){i.value=q;i.dispatchEvent(new Event('input',{bubbles:true}))}},80)}
function sendStudio(x){const payload={source:'atlas-x-vivo',reference:(x.refs||[])[0]||'',context:{atlas:{id:x.id,name:x.name||x.title,kind:x.kind,summary:x.summary,region:x.region,period:x.period,refs:x.refs||[],people:x.people||[],events:x.events||[],certainty:x.certainty,route:x.stop_rows?.map(p=>({id:p.id,name:p.name,lat:p.lat,lng:p.lng}))||[]}},createdAt:new Date().toISOString()};localStorage.setItem('logos-master-x:studio:from-biblia-x',JSON.stringify(payload));localStorage.setItem('logosx:atlasStudioPayload',JSON.stringify(payload));const b=$('[data-view="studio"],[data-go="studio"]');b?.click();if(!b)alert('Contexto do Atlas salvo para o Studio X.')}

function fitPoints(points){
  const good=(points||[]).filter(p=>Number.isFinite(+p.lat)&&Number.isFinite(+p.lng));if(!good.length)return;
  let minLng=Math.min(...good.map(p=>+p.lng)),maxLng=Math.max(...good.map(p=>+p.lng)),minLat=Math.min(...good.map(p=>+p.lat)),maxLat=Math.max(...good.map(p=>+p.lat));
  const padLng=Math.max(2,(maxLng-minLng)*.18),padLat=Math.max(1.6,(maxLat-minLat)*.22);
  S.view={minLng:minLng-padLng,maxLng:maxLng+padLng,minLat:minLat-padLat,maxLat:maxLat+padLat};
}
function viewForStop(stop){
  if(!stop||!Number.isFinite(+stop.lat)||!Number.isFinite(+stop.lng))return S.view;
  const rows=S.route?.stop_rows||[stop],lngs=rows.map(p=>+p.lng).filter(Number.isFinite),lats=rows.map(p=>+p.lat).filter(Number.isFinite);
  const rw=lngs.length?Math.max(...lngs)-Math.min(...lngs):8,rh=lats.length?Math.max(...lats)-Math.min(...lats):6;
  const w=clamp(Math.max(rw*.58,7),7,17),h=clamp(Math.max(rh*.62,5.3),5.3,12.5),cx=+stop.lng,cy=+stop.lat;
  return {minLng:cx-w/2,maxLng:cx+w/2,minLat:cy-h/2,maxLat:cy+h/2};
}
function animateCameraTo(target,duration=900){
  if(reduceMotion){S.view={...target};S.camera=null;drawMap();return}
  cancelCamera();S.camera={start:{...S.view},target:{...target},elapsed:0,duration};ensureLoop();
}
function focusOnStop(stop){if(!stop)return;animateCameraTo(viewForStop(stop),820)}
function applyWorldTransform(base,view){
  const world=$('#atxWorld');if(!world)return;
  const bw=base.maxLng-base.minLng,bh=base.maxLat-base.minLat,vw=view.maxLng-view.minLng,vh=view.maxLat-view.minLat;
  const sx=bw/vw,sy=bh/vh,tx=(base.minLng-view.minLng)/vw*1000,ty=(view.maxLat-base.maxLat)/vh*620;
  world.setAttribute('transform',`matrix(${sx.toFixed(6)} 0 0 ${sy.toFixed(6)} ${tx.toFixed(3)} ${ty.toFixed(3)})`);
}
function projection(lng,lat){const v=S.view;return {x:(+lng-v.minLng)/(v.maxLng-v.minLng)*1000,y:(v.maxLat-(+lat))/(v.maxLat-v.minLat)*620}}
function pathFromCoords(coords){return coords.map((c,i)=>{const p=projection(c[0],c[1]);return `${i?'L':'M'}${p.x.toFixed(1)},${p.y.toFixed(1)}`}).join(' ')}
function geomPath(g){if(!g)return'';if(g.type==='Polygon')return g.coordinates.map(r=>pathFromCoords(r)+' Z').join(' ');if(g.type==='MultiPolygon')return g.coordinates.map(poly=>poly.map(r=>pathFromCoords(r)+' Z').join(' ')).join(' ');return''}

function mapDetailLevel(){const w=S.view.maxLng-S.view.minLng;return w>28?0:w>13?1:2}
function projectedEllipse(row){
  const c=projection(row.lng,row.lat),px=projection(+row.lng+(+row.rx_deg||.5),row.lat),py=projection(row.lng,+row.lat+(+row.ry_deg||.5));
  return {cx:c.x,cy:c.y,rx:Math.abs(px.x-c.x),ry:Math.abs(py.y-c.y)};
}
function renderCartography(){
  const regions=$('#atxRegions'),terrain=$('#atxTerrain'),hydro=$('#atxHydro'),labels=$('#atxLabels'),decor=$('#atxDecor');
  if(!regions||!terrain||!hydro||!labels||!decor)return;
  const C=S.cartography||{},level=mapDetailLevel(),atlas=S.colorMode==='atlas';
  regions.innerHTML=(C.regions||[]).filter(r=>(r.level||0)<=level).map(r=>{const e=projectedEllipse(r);return `<ellipse class="atx-region-wash" data-region="${esc(r.id)}" cx="${e.cx.toFixed(1)}" cy="${e.cy.toFixed(1)}" rx="${e.rx.toFixed(1)}" ry="${e.ry.toFixed(1)}"><title>${esc(r.name)} • zona geográfica didática</title></ellipse>`}).join('');
  terrain.innerHTML=(C.relief_zones||[]).filter(r=>(r.level||0)<=level).map(r=>{const e=projectedEllipse(r),cls=r.valley?' valley':r.desert?' desert':'';return `<g class="atx-relief${cls}" transform="rotate(${+(r.angle||0)} ${e.cx.toFixed(1)} ${e.cy.toFixed(1)})"><ellipse cx="${e.cx.toFixed(1)}" cy="${e.cy.toFixed(1)}" rx="${e.rx.toFixed(1)}" ry="${e.ry.toFixed(1)}"/><ellipse class="inner" cx="${e.cx.toFixed(1)}" cy="${e.cy.toFixed(1)}" rx="${(e.rx*.68).toFixed(1)}" ry="${(e.ry*.68).toFixed(1)}"/><title>${esc(r.name)} • relevo estilizado</title></g>`}).join('');
  const water=(C.waterbodies||[]).filter(r=>(r.label_level||0)<=level).map(r=>{const e=projectedEllipse(r);return `<ellipse class="atx-waterbody" cx="${e.cx.toFixed(1)}" cy="${e.cy.toFixed(1)}" rx="${Math.max(2,e.rx).toFixed(1)}" ry="${Math.max(3,e.ry).toFixed(1)}"><title>${esc(r.name)}</title></ellipse>`}).join('');
  const rivers=(C.rivers||[]).filter(r=>(r.label_level||0)<=level).map(r=>`<path class="atx-river" d="${pathFromCoords(r.points)}"><title>${esc(r.name)} • curso estilizado</title></path>`).join('');
  hydro.innerHTML=water+rivers;
  const regionLabels=(C.regions||[]).filter(r=>(r.level||0)<=level).map(r=>{const z=projection(r.lng,r.lat);return `<text class="atx-carto-label region" x="${z.x.toFixed(1)}" y="${z.y.toFixed(1)}">${esc(r.name)}</text>`});
  const mapLabels=(C.labels||[]).filter(r=>(r.level||0)<=level).map(r=>{const z=projection(r.lng,r.lat);return `<text class="atx-carto-label ${esc(r.kind||'region')}" x="${z.x.toFixed(1)}" y="${z.y.toFixed(1)}">${esc(r.name)}</text>`});
  labels.innerHTML=regionLabels.concat(mapLabels).join('');
  decor.innerHTML=`<g class="atx-compass" transform="translate(930 535)"><circle r="28"/><path d="M0 -22 L5 -4 L0 0 L-5 -4 Z"/><path class="south" d="M0 22 L5 4 L0 0 L-5 4 Z"/><text x="0" y="-33">N</text></g><g class="atx-scale" transform="translate(35 566)"><text x="0" y="-9">ESCALA VISUAL</text><path d="M0 0 H110 M0 -4 V4 M55 -4 V4 M110 -4 V4"/><text x="0" y="18">regional</text></g><g class="atx-map-cartouche" transform="translate(790 40)"><text class="title" x="0" y="0">ATLAS BÍBLICO</text><text x="0" y="15">base vetorial • offline</text></g>`;
  shell()?.classList.toggle('atlas-cartographic',atlas);
}

function routeSegmentState(i){
  const p=S.player;
  if(p.status==='completed'||i<p.currentStop)return 'visited';
  if(i===p.currentStop&&p.phase==='segment'&&p.status!=='idle'&&p.status!=='stopped')return 'active';
  return 'future';
}
function markerState(i){
  const p=S.player;
  if(p.status==='completed')return 'visited';
  if(i<p.currentStop)return 'visited';
  if(i===p.currentStop)return 'active';
  return 'future';
}
function drawMap(){
  const land=$('#atxLand'),grid=$('#atxGrid'),markers=$('#atxMarkers'),route=$('#atxRoute');if(!land||!grid||!markers||!route)return;
  const level=mapDetailLevel(),major=new Set(S.cartography?.major_places||[]),routeIds=new Set(S.route?.stop_rows?.map(x=>x.id)||[]);
  grid.innerHTML=Array.from({length:9},(_,i)=>`<line class="gridline" x1="${i*125}" y1="0" x2="${i*125}" y2="620"/>`).join('')+Array.from({length:6},(_,i)=>`<line class="gridline" x1="0" y1="${i*124}" x2="1000" y2="${i*124}"/>`).join('');
  if(S.basemap)land.innerHTML=S.basemap.features.map(f=>{const n=f.properties?.name||f.properties?.NAME||'';return `<path class="country land-tone-${toneForName(n)}" d="${geomPath(f.geometry)}"><title>${esc(n)}</title></path>`}).join('');
  renderCartography();
  const pts=S.results.filter(x=>x.kind==='place'&&Number.isFinite(+x.lat)&&Number.isFinite(+x.lng));
  markers.innerHTML=pts.map(p=>{const z=projection(p.lng,p.lat),active=S.selected?.id===p.id,showLabel=active||routeIds.has(p.id)||level>=2||major.has(p.id);return `<g class="marker base-marker ${active?'active':''} ${showLabel?'show-label':'dot-only'}" data-marker="${esc(p.id)}" transform="translate(${z.x.toFixed(1)} ${z.y.toFixed(1)})"><circle r="${showLabel?6.5:4.2}"/><text x="10" y="4">${esc(p.name)}</text></g>`}).join('');
  $$('[data-marker]',markers).forEach(g=>g.addEventListener('click',()=>{const p=S.results.find(x=>x.kind==='place'&&x.id===g.dataset.marker);if(p)select(p,false)}));
  $('#atxWorld')?.removeAttribute('transform');
  if(S.route?.stop_rows?.length){
    const rows=S.route.stop_rows,parts=[];
    for(let i=0;i<rows.length-1;i++){
      const d=pathFromCoords([[rows[i].lng,rows[i].lat],[rows[i+1].lng,rows[i+1].lat]]),state=routeSegmentState(i);
      parts.push(`<path class="route-shadow" d="${d}"/>`);
      parts.push(`<path class="route-segment future" d="${d}"/>`);
      if(state==='visited')parts.push(`<path class="route-segment visited" d="${d}"/>`);
      if(state==='active')parts.push(`<path class="route-segment active" pathLength="1" style="stroke-dasharray:1;stroke-dashoffset:${(1-S.player.segmentProgress).toFixed(4)}" d="${d}"/>`);
    }
    parts.push(...rows.map((p,i)=>{const z=projection(p.lng,p.lat),state=markerState(i),dy=i%2?16:-11;return `<g class="marker route-marker ${state}" data-route-stop="${i}" transform="translate(${z.x.toFixed(1)} ${z.y.toFixed(1)})">${state==='active'?'<circle class="pulse-ring" r="17"/>':''}<circle class="marker-core" r="10"/><text class="num" text-anchor="middle" x="0" y="3">${i+1}</text><text class="route-label" x="14" y="${dy}">${esc(p.name)}</text></g>`}));
    route.innerHTML=parts.join('');
    $$('[data-route-stop]',route).forEach(g=>g.addEventListener('click',()=>seekToStop(+g.dataset.routeStop,true)));
  }else route.innerHTML='';
}
function zoom(f){cancelCamera();const v=S.view,cx=(v.minLng+v.maxLng)/2,cy=(v.minLat+v.maxLat)/2,w=(v.maxLng-v.minLng)*f,h=(v.maxLat-v.minLat)*f;S.view={minLng:cx-w/2,maxLng:cx+w/2,minLat:cy-h/2,maxLat:cy+h/2};drawMap()}
function pan(dx,dy){cancelCamera();const v=S.view,w=v.maxLng-v.minLng,h=v.maxLat-v.minLat,a=dx/1000*w,b=dy/620*h;S.view={minLng:v.minLng-a,maxLng:v.maxLng-a,minLat:v.minLat+b,maxLat:v.maxLat+b};drawMap()}
function cancelCamera(){S.camera=null;$('#atxWorld')?.removeAttribute('transform')}

function resetPlayer(render=true,journey=null){
  const p=S.player;
  p.status='idle';p.phase='dwell';p.journeyId=journey?.id||null;p.currentStop=0;p.totalStops=journey?.stop_rows?.length||0;p.speed=1;p.segmentProgress=0;p.phaseElapsed=0;p.visitedStops=[];
  S.lastTs=0;if(render){drawMap();renderPlayerUI()}
}
function currentStop(){return S.route?.stop_rows?.[S.player.currentStop]||null}
function overallProgress(){
  const p=S.player,n=p.totalStops;if(!n)return 0;if(n===1)return p.status==='completed'?1:0;
  const seg=p.phase==='segment'?p.segmentProgress:0;
  return clamp((p.currentStop+seg)/(n-1),0,1);
}
function setStatus(status){S.player.status=status;renderPlayerUI();log('Player state:',status)}
function play(){
  if(!S.route?.stop_rows?.length)return;
  const p=S.player;
  if(p.status==='completed')return restartPlayer();
  if(p.status==='idle'||p.status==='stopped'){
    p.currentStop=clamp(p.currentStop,0,p.totalStops-1);p.phase='dwell';p.phaseElapsed=0;p.segmentProgress=0;p.visitedStops=Array.from({length:p.currentStop},(_,i)=>i);
    focusOnStop(currentStop());emit('journey-start',{journey:S.route,stop:currentStop(),index:p.currentStop});
  }else if(p.status==='paused'){emit('journey-resume',{journey:S.route,index:p.currentStop})}
  p.status='playing';S.lastTs=0;renderPlayerUI();ensureLoop();
}
function pause(){if(S.player.status!=='playing')return;S.player.status='paused';S.lastTs=0;renderPlayerUI();emit('journey-pause',{journey:S.route,index:S.player.currentStop})}
function togglePlay(){S.player.status==='playing'?pause():play()}
function stopPlayer(){
  if(!S.route)return;const p=S.player;p.status='stopped';p.phase='dwell';p.currentStop=0;p.phaseElapsed=0;p.segmentProgress=0;p.visitedStops=[];S.lastTs=0;cancelCamera();fitPoints(S.route.stop_rows);drawMap();renderPlayerUI();emit('journey-stop',{journey:S.route});
}
function restartPlayer(){
  if(!S.route)return;const p=S.player;p.status='idle';p.phase='dwell';p.currentStop=0;p.phaseElapsed=0;p.segmentProgress=0;p.visitedStops=[];S.lastTs=0;drawMap();renderPlayerUI();play();
}
function nextStop(){if(!S.route)return;seekToStop(Math.min(S.player.totalStops-1,S.player.currentStop+1),true)}
function previousStop(){if(!S.route)return;seekToStop(Math.max(0,S.player.currentStop-1),true)}
function seekToStop(index,focus=false){
  if(!S.route?.stop_rows?.length)return;const p=S.player,wasPlaying=p.status==='playing';
  index=clamp(index,0,p.totalStops-1);p.currentStop=index;p.phase='dwell';p.phaseElapsed=0;p.segmentProgress=0;p.visitedStops=Array.from({length:index},(_,i)=>i);if(p.status==='completed')p.status='paused';
  if(focus)focusOnStop(currentStop());drawMap();renderPlayerUI();emit('stop-enter',{journey:S.route,stop:currentStop(),index,manual:true});if(wasPlaying)ensureLoop();
}
function setSpeed(speed){
  if(![.5,1,1.5,2].includes(speed))return;S.player.speed=speed;renderPlayerUI();log('Speed:',speed+'x');
}
function enterStop(index){
  const p=S.player;p.currentStop=index;p.phase='dwell';p.phaseElapsed=0;p.segmentProgress=0;p.visitedStops=Array.from({length:index},(_,i)=>i);
  const stop=currentStop();drawMap();focusOnStop(stop);renderPlayerUI();emit('stop-enter',{journey:S.route,stop,index});log(`Stop ${index+1}/${p.totalStops}:`,stop?.name);
}
function completeJourney(){
  const p=S.player;p.status='completed';p.phase='completed';p.phaseElapsed=0;p.segmentProgress=1;p.currentStop=Math.max(0,p.totalStops-1);p.visitedStops=Array.from({length:p.totalStops},(_,i)=>i);S.lastTs=0;drawMap();renderPlayerUI();emit('journey-complete',{journey:S.route});log('Journey completed:',S.route?.id);
}
function updatePlayer(delta){
  const p=S.player;if(p.status!=='playing'||!S.route)return false;
  const scaled=delta*p.speed;p.phaseElapsed+=scaled;
  if(p.phase==='dwell'){
    const isLast=p.currentStop>=p.totalStops-1;
    if(p.phaseElapsed>=p.dwellMs){
      if(isLast){completeJourney();return false}
      p.phase='segment';p.phaseElapsed=0;p.segmentProgress=0;drawMap();emit('stop-leave',{journey:S.route,stop:currentStop(),index:p.currentStop});
    }
  }else if(p.phase==='segment'){
    p.segmentProgress=clamp(p.phaseElapsed/p.segmentMs,0,1);updateActiveSegmentVisual();renderPlayerProgressOnly();
    if(p.segmentProgress>=1){enterStop(Math.min(p.totalStops-1,p.currentStop+1))}
  }
  return p.status==='playing';
}
function updateCamera(delta){
  if(!S.camera)return false;const c=S.camera;c.elapsed+=delta;const t=clamp(c.elapsed/c.duration,0,1),e=easeInOutCubic(t),a=c.start,b=c.target;
  const view={minLng:lerp(a.minLng,b.minLng,e),maxLng:lerp(a.maxLng,b.maxLng,e),minLat:lerp(a.minLat,b.minLat,e),maxLat:lerp(a.maxLat,b.maxLat,e)};
  applyWorldTransform(a,view);
  if(t>=1){S.view={...b};S.camera=null;drawMap();return false}return true;
}
function updateActiveSegmentVisual(){const path=$('.route-segment.active');if(path)path.style.strokeDashoffset=(1-S.player.segmentProgress).toFixed(4)}
function ensureLoop(){if(S.raf)return;S.lastTs=0;S.raf=requestAnimationFrame(loop)}
function loop(ts){
  const delta=S.lastTs?Math.min(64,ts-S.lastTs):16;S.lastTs=ts;
  const playerActive=updatePlayer(delta),cameraActive=updateCamera(delta);
  if(playerActive||cameraActive){S.raf=requestAnimationFrame(loop)}else{S.raf=null;S.lastTs=0}
}
function renderPlayerProgressOnly(){const bar=$('#atxProgress'),pct=$('#atxPercent');const n=overallProgress();if(bar)bar.style.width=`${Math.round(n*1000)/10}%`;if(pct)pct.textContent=`${Math.round(n*100)}%`}
function renderPlayerUI(){
  if(!S.route)return;const p=S.player,stop=currentStop(),idx=p.currentStop,n=p.totalStops,progress=overallProgress();
  renderPlayerProgressOnly();
  const state=$('#atxPlayerState');if(state)state.textContent=({idle:'PRONTO',playing:'EM MOVIMENTO',paused:'PAUSADO',stopped:'PARADO',completed:'CONCLUÍDA'}[p.status]||p.status).toUpperCase();
  const main=$('#atxPlay');if(main){main.textContent=p.status==='playing'?'Ⅱ':'▶';main.setAttribute('aria-label',p.status==='playing'?'Pausar jornada':'Reproduzir jornada')}
  const hero=$('#atxPlayHero');if(hero)hero.textContent=p.status==='playing'?'Ⅱ Pausar história':p.status==='completed'?'↻ Reproduzir novamente':'▶ Reproduzir história';
  const prev=$('#atxPrev'),next=$('#atxNext');if(prev)prev.disabled=idx<=0;if(next)next.disabled=idx>=n-1;
  $$('[data-speed]',$('#atxDetail')||document).forEach(b=>b.classList.toggle('active',+b.dataset.speed===p.speed));
  const card=$('#atxStopCard');if(card&&stop){
    if(p.status==='completed')card.innerHTML=`<div class="atx-stop-kicker success">✓ JORNADA CONCLUÍDA</div><strong>${esc(S.route.name)}</strong><p>Você percorreu ${n} paradas. Abra as passagens ou envie o contexto completo ao Studio X.</p><div class="atx-stop-actions"><button data-player-action="restart">↻ Reproduzir novamente</button><button data-player-action="refs">📖 Abrir passagens</button></div>`;
    else card.innerHTML=`<div class="atx-stop-kicker">PARADA ${idx+1} DE ${n}${p.status==='playing'&&p.phase==='segment'?' • EM VIAGEM':''}</div><strong>${esc(stop.name)}</strong><p>${esc(stop.summary||S.route.summary||'')}</p>${stop.refs?.length?`<div class="atx-stop-refs">${stop.refs.slice(0,4).map(r=>`<button data-atx-ref="${esc(r)}">${esc(r)}</button>`).join('')}</div>`:''}`;
    bindRefs(card);$$('[data-player-action="restart"]',card).forEach(b=>b.onclick=restartPlayer);$$('[data-player-action="refs"]',card).forEach(b=>b.onclick=()=>openBible((S.route.refs||[])[0]));
  }
  if(p.status==='playing'&&p.phase==='segment')shell()?.classList.add('is-journey-moving');else shell()?.classList.remove('is-journey-moving');
  if(progress>=1)shell()?.classList.add('journey-complete');else shell()?.classList.remove('journey-complete');
}

function bind(){
  const root=shell();
  $('#atxSearch').onclick=()=>search($('#atxQuery').value.trim());$('#atxQuery').addEventListener('keydown',e=>{if(e.key==='Enter')search(e.currentTarget.value.trim())});
  $('#atxPeriod').onchange=e=>{S.period=e.target.value;S.year=null;S.route=null;applyPeriodTheme(S.period);$('#atxYearLabel').textContent='Período';search($('#atxQuery').value.trim())};
  $('#atxYear').oninput=e=>{S.year=+e.target.value;$('#atxYearLabel').textContent=yearLabel(S.year)};$('#atxYear').onchange=()=>search($('#atxQuery').value.trim());
  $('#atxYearOff').onclick=()=>{S.year=null;$('#atxYearLabel').textContent='∞';search($('#atxQuery').value.trim())};
  $('#atxColorMode').onclick=toggleColorMode;
  $('#atxFit').onclick=()=>{cancelCamera();if(S.route?.stop_rows)fitPoints(S.route.stop_rows);else if(S.selected?.lat)fitPoints([S.selected]);else S.view={minLng:10,maxLng:47,minLat:27,maxLat:43};drawMap()};
  $('#atxZoomIn').onclick=()=>zoom(.72);$('#atxZoomOut').onclick=()=>zoom(1.38);$('#atxOpenDetail').onclick=()=>root.classList.toggle('detail-open');
  $$('[data-layer]',root).forEach(b=>b.onclick=()=>{b.classList.toggle('active');const layer=b.dataset.layer==='places'?$('#atxMarkers'):$('#atxRoute');if(layer)layer.style.display=b.classList.contains('active')?'':'none'});
  const svg=$('#atxMap');svg.addEventListener('wheel',e=>{e.preventDefault();zoom(e.deltaY>0?1.16:.86)},{passive:false});
  svg.addEventListener('pointerdown',e=>{S.drag={x:e.clientX,y:e.clientY};svg.classList.add('dragging');svg.setPointerCapture(e.pointerId)});
  svg.addEventListener('pointermove',e=>{if(!S.drag)return;const dx=e.clientX-S.drag.x,dy=e.clientY-S.drag.y;S.drag={x:e.clientX,y:e.clientY};pan(dx,dy)});
  svg.addEventListener('pointerup',e=>{S.drag=null;svg.classList.remove('dragging');try{svg.releasePointerCapture(e.pointerId)}catch(_){}});
  document.addEventListener('keydown',e=>{
    if(!shell()||!S.route)return;const tag=(e.target?.tagName||'').toLowerCase();if(['input','textarea','select'].includes(tag)||e.target?.isContentEditable)return;
    if(e.code==='Space'){e.preventDefault();togglePlay()}else if(e.key==='ArrowLeft'){e.preventDefault();previousStop()}else if(e.key==='ArrowRight'){e.preventDefault();nextStop()}else if(e.key==='Escape'){e.preventDefault();stopPlayer()}
  });
}

const observer=new MutationObserver(()=>{if($('[data-bible-panel="maps"]')&&!$('.atx-shell'))init()});observer.observe(document.body,{childList:true,subtree:true});
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(init,400));else setTimeout(init,400);

window.AtlasXVivo={
  version:VERSION,
  open:q=>{const mapBtn=$('[data-bible-section="maps"]');mapBtn?.click();setTimeout(()=>{Promise.resolve(init()).then(()=>{if(q){$('#atxQuery').value=q;search(q)}})},120)},
  search,
  player:{play,pause,toggle:togglePlay,stop:stopPlayer,restart:restartPlayer,next:nextStop,previous:previousStop,setSpeed,seekToStop,getState:()=>({...S.player})},
  color:{setMode:setColorMode,toggle:toggleColorMode,getMode:()=>S.colorMode,getTheme:()=>S.themeKey},
  debug:on=>{localStorage.setItem('logosx:atlasDebug',on?'1':'0');return `Atlas X debug ${on?'ativado':'desativado'} após recarregar.`}
};
})();
