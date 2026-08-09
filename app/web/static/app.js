const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
const Store={
 p:"logosx:",
 get(k,d=null){try{const v=localStorage.getItem(this.p+k);return v===null?d:JSON.parse(v)}catch{return d}},
 set(k,v){localStorage.setItem(this.p+k,JSON.stringify(v));return v},
 push(k,v,lim=500){const a=this.get(k,[]);a.unshift(v);this.set(k,a.slice(0,lim));return v},
 del(k){localStorage.removeItem(this.p+k)},
 export(){const x={};for(let i=0;i<localStorage.length;i++){const k=localStorage.key(i);if(k?.startsWith(this.p))x[k]=localStorage.getItem(k)}return x},
 import(x){Object.entries(x||{}).forEach(([k,v])=>{if(k.startsWith(this.p))localStorage.setItem(k,v)})}
};
const P=window.LOGOS_PROMPTS||{};
const DEFAULT_API="https://logos-master-x-api.onrender.com";
const IS_LOCAL_HOST=location.hostname==="127.0.0.1"||location.hostname==="localhost";
const LOCAL_API=IS_LOCAL_HOST?location.origin:"";
let SAVED_API=Store.get("api","");
// Migração 3.6.7: versões anteriores podiam salvar o próprio domínio do Netlify
// como API. No site público isso aponta /api para o frontend estático e força
// o fallback local. Em produção, use sempre o backend público do Render.
if(!IS_LOCAL_HOST && (!SAVED_API || SAVED_API===location.origin || /netlify\.app\/?$/i.test(SAVED_API))){
  SAVED_API=DEFAULT_API;
  Store.set("api",DEFAULT_API);
}
const SAFE_API=IS_LOCAL_HOST?LOCAL_API:(SAVED_API||DEFAULT_API);
const ROUTER_PROFILE_VERSION="3.5.0";
let _savedProvider=Store.get("aiProvider","auto"), _savedMode=Store.get("aiMode","automatico");
if(Store.get("routerProfileVersion","")!==ROUTER_PROFILE_VERSION){_savedProvider="gemini";_savedMode="rapido";Store.set("aiProvider",_savedProvider);Store.set("aiMode",_savedMode);Store.set("routerProfileVersion",ROUTER_PROFILE_VERSION);}
const App={view:"dashboard",server:false,api:SAFE_API,provider:_savedProvider,aiMode:_savedMode,model:Store.get("aiModel",""),health:null,metrics:null,currentText:"",lastStudioText:"",timer:null,timerStart:0,timerSeconds:0};

const AUDIENCES=["Igreja local","Público misto","Pessoas sem Cristo","Novos convertidos","Jovens e adolescentes","Crianças","Casais","Culto de Varões","Círculo de Oração","Liderança e obreiros","Pastores e líderes","Missionários e evangelistas","Pessoas em luto","Pessoas em crise ou sofrimento","Pessoal / devocional individual","EBD / estudantes da Bíblia"];
const CULT_TYPES=["Avivamento","Doutrina / Ensino","Santa Ceia","Missões","Evangelístico","Oração e Intercessão","Consagração","Ação de Graças","Batismo","Culto Fúnebre / Consolo","Vigília","Conferência / Encontro","Culto ao Ar Livre","Celebração Especial"];
const MODE_ESTIMATES={rapido:"~25–45 s",economico:"~45–120 s",automatico:"~30–60 s",qualidade:"~40–90 s"};
function modeAverage(mode){const a=Store.get("modeTimes:"+mode,[]);if(!a.length)return "Sem média ainda";return `Média recente: ${Math.round(a.reduce((x,y)=>x+y,0)/a.length)} s`;}
function saveModeTime(mode,seconds){if(!Number.isFinite(seconds)||seconds<=0)return;const a=Store.get("modeTimes:"+mode,[]);a.unshift(seconds);Store.set("modeTimes:"+mode,a.slice(0,8));}
const VISUAL_DEFAULT={layout:"classico",theme:"dark",accent:"#d6b25e",mobileLayout:"auto",appIcon:"gold"};
let visualPreview=null;
function visualSettings(){const v={...VISUAL_DEFAULT,...Store.get("visual",{})};if(v.theme==="system")v.theme="dark";if(v.layout==="compacto"||v.layout==="modernox"||v.layout==="pulpito")v.layout="moderno";return v;}
function activeVisual(){const v=visualPreview?{...VISUAL_DEFAULT,...visualPreview}:visualSettings();if(v.theme==="system")v.theme="dark";if(v.layout==="compacto"||v.layout==="modernox"||v.layout==="pulpito")v.layout="moderno";return v;}
function applyVisual(v=activeVisual()){const root=document.documentElement;applyAppBranding(v.appIcon||"gold");if(v.theme==="system")v={...v,theme:"dark"};if(v.layout==="compacto")v={...v,layout:"modernox"};root.dataset.layout=v.layout;root.dataset.theme=v.theme;root.dataset.mobileLayout=v.mobileLayout||"auto";root.style.setProperty("--accent",v.accent);root.style.setProperty("--gold",v.accent);updateNavIcons(v.layout);}
const NAV_META={
 dashboard:["◈","Dashboard","grid"],studio:["🎛","Studio","sliders"],bible:["📖","Bíblia","book"],knowledge:["🧠","Biblioteca Viva","brain"],
 k7:["🔥","DNA K7","flame"],editor:["📝","Editor","edit"],pulpit:["🎙","Púlpito","mic"],library:["📚","Biblioteca","library"],projects:["📂","Projetos","folder"],
 aihub:["🤖","AI HUB","spark"],appearance:["🎨","Aparência","settings"],about:["ⓘ","Sobre o LOGOS","book"],custompages:["➕","Minhas páginas","folder"],backup:["💾","Backup","save"],settings:["⚙️","Configurações","settings"],history:["🕘","Histórico","history"]};
function modernIcon(kind){const paths={grid:'<rect x="3" y="3" width="7" height="7" rx="2"/><rect x="14" y="3" width="7" height="7" rx="2"/><rect x="3" y="14" width="7" height="7" rx="2"/><rect x="14" y="14" width="7" height="7" rx="2"/>',sliders:'<path d="M4 6h16M7 12h10M9 18h6"/><circle cx="9" cy="6" r="2"/><circle cx="14" cy="12" r="2"/><circle cx="11" cy="18" r="2"/>',book:'<path d="M4 5.5A3.5 3.5 0 0 1 7.5 2H11v18H7.5A3.5 3.5 0 0 0 4 23zM20 5.5A3.5 3.5 0 0 0 16.5 2H13v18h3.5A3.5 3.5 0 0 1 20 23z"/>',brain:'<path d="M9 4a3 3 0 0 0-5 2 3 3 0 0 0 0 5 4 4 0 0 0 3 7h2M15 4a3 3 0 0 1 5 2 3 3 0 0 1 0 5 4 4 0 0 1-3 7h-2M9 4v16M15 4v16M9 9h3M12 15h3"/>',flame:'<path d="M12 22c4 0 7-3 7-7 0-5-4-7-4-11-3 2-5 5-5 8-1-1-2-2-2-4-2 2-3 4-3 7 0 4 3 7 7 7z"/>',edit:'<path d="M4 20h4L19 9l-4-4L4 16zM13.5 6.5l4 4"/>',mic:'<rect x="9" y="3" width="6" height="12" rx="3"/><path d="M5 11a7 7 0 0 0 14 0M12 18v4M8 22h8"/>',library:'<path d="M4 4h4v16H4zM10 4h4v16h-4zM16 5l4-1 2 15-4 1z"/>',folder:'<path d="M3 6h7l2 2h9v11H3z"/>',spark:'<path d="M12 2l1.8 5.2L19 9l-5.2 1.8L12 16l-1.8-5.2L5 9l5.2-1.8zM19 15l.8 2.2L22 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-.8z"/>',save:'<path d="M4 3h14l2 2v16H4zM8 3v6h8V3M8 21v-7h8v7"/>',history:'<path d="M3 12a9 9 0 1 0 3-6.7M3 4v5h5M12 7v5l3 2"/>',settings:'<circle cx="12" cy="12" r="3"/><path d="M19 12a7 7 0 0 0-.1-1l2-1.5-2-3.5-2.4 1a8 8 0 0 0-1.7-1L14.5 3h-5L9 6a8 8 0 0 0-1.7 1L5 6 3 9.5 5.1 11a7 7 0 0 0 0 2L3 14.5 5 18l2.3-1a8 8 0 0 0 1.7 1l.5 3h5l.5-3a8 8 0 0 0 1.7-1l2.3 1 2-3.5-2.1-1.5a7 7 0 0 0 .1-1z"/>'};return `<svg class="modern-nav-icon" viewBox="0 0 24 24" aria-hidden="true">${paths[kind]||paths.spark}</svg>`;}
function updateNavIcons(layout=activeVisual().layout){$$('.nav button[data-view]').forEach(b=>{const m=NAV_META[b.dataset.view];if(!m)return;b.innerHTML=(layout==="moderno"||layout==="modernox")?`${modernIcon(m[2])}<span>${m[1]}</span>`:`<span class="classic-nav-icon">${m[0]}</span><span>${m[1]}</span>`;});}

function applyAppBranding(icon=(activeVisual().appIcon||"gold")){if(!/^(gold|blue|classic|pro)$/.test(icon))icon="gold";const src=`/static/brand/icon-${icon}-192.png`;["headerBrandIcon","sideBrandIcon"].forEach(id=>{const e=document.getElementById(id);if(e)e.src=src});let fav=document.querySelector('link[rel="icon"]');if(!fav){fav=document.createElement('link');fav.rel='icon';document.head.appendChild(fav)}fav.href=src;}
function appearancePanel(){const v=activeVisual();const colors=[["#d6b25e","Gold"],["#4f8cff","Blue"],["#9b59b6","Purple"],["#c64b5d","Crimson"],["#27b07d","Emerald"],["#c7ced8","Silver"]];return `<div class="appearance-backdrop" id="appearanceBackdrop" role="dialog" aria-modal="true"><div class="appearance-panel" id="appearancePanel"><div class="appearance-head"><h3>🎨 Aparência</h3><button class="btn secondary" id="appearanceClose">✕ Fechar</button></div><p class="muted">Clássico e Moderno são as duas identidades principais. Cor e modo mobile acompanham o tema inteiro.</p><label>Estilo</label><div class="visual-options">${[["classico","🏛️ Clássico"],["moderno","🚀 Moderno"]].map(([x,l])=>`<button class="visual-choice ${v.layout===x?"active":""}" data-layout="${x}">${l}</button>`).join("")}</div><label>Variante de cor</label><div class="theme-swatches">${colors.map(([c,n])=>`<button class="theme-swatch ${v.accent===c?"active":""}" data-accent="${c}" style="--dot:${c}"><i></i><span>${n}</span></button>`).join("")}</div><label>📱 Layout no celular</label><div class="visual-options">${[["auto","Automático"],["mobile-clean","Clean"],["mobile-pro","Pro"]].map(([x,l])=>`<button class="visual-choice ${v.mobileLayout===x?"active":""}" data-mobile-layout="${x}">${l}</button>`).join("")}</div><label>Ícone do aplicativo</label><div class="icon-picker">${["gold","blue","classic","pro"].map(x=>`<button data-app-icon="${x}" class="icon-choice ${v.appIcon===x?"active":""}"><img src="/static/brand/icon-${x}-192.png"><span>${x}</span></button>`).join("")}</div><div class="row appearance-actions"><button class="btn primary" id="visualSave">💾 Salvar tema</button><button class="btn secondary" id="visualReset">↩ Restaurar</button><button class="btn secondary" id="visualCloseBottom">✕ Fechar</button></div></div></div>`;}
function openAppearance(){
  $("#appearanceBackdrop")?.remove(); visualPreview={...visualSettings()};
  document.body.insertAdjacentHTML("beforeend",appearancePanel());
  const backdrop=$("#appearanceBackdrop"), panel=$("#appearancePanel"), saved={...visualSettings()};
  const close=(restore=true)=>{document.removeEventListener("keydown",onKey);if(restore){visualPreview=null;applyVisual(saved);}backdrop?.remove();};
  const onKey=e=>{if(e.key==="Escape")close(true);}; document.addEventListener("keydown",onKey);
  $("#appearanceClose")?.addEventListener("click",e=>{e.preventDefault();e.stopPropagation();close(true);});
  $("#visualCloseBottom")?.addEventListener("click",()=>close(true)); panel?.addEventListener("click",e=>e.stopPropagation()); backdrop?.addEventListener("click",()=>close(true));
  const refresh=()=>{applyVisual(visualPreview); $$(`[data-layout]`).forEach(x=>x.classList.toggle("active",x.dataset.layout===visualPreview.layout)); $$(`[data-theme]`).forEach(x=>x.classList.toggle("active",x.dataset.theme===visualPreview.theme)); $$(`[data-accent]`).forEach(x=>x.classList.toggle("active",x.dataset.accent===visualPreview.accent));$$(`[data-mobile-layout]`).forEach(x=>x.classList.toggle("active",x.dataset.mobileLayout===visualPreview.mobileLayout));};
  $$('[data-layout]').forEach(b=>b.addEventListener("click",()=>{visualPreview={...activeVisual(),layout:b.dataset.layout};refresh();}));
  $$('[data-theme]').forEach(b=>b.addEventListener("click",()=>{visualPreview={...activeVisual(),theme:b.dataset.theme};refresh();}));$$('[data-mobile-layout]').forEach(b=>b.addEventListener("click",()=>{visualPreview={...activeVisual(),mobileLayout:b.dataset.mobileLayout};refresh();}));
  $$('[data-app-icon]').forEach(b=>b.addEventListener('click',()=>{visualPreview={...activeVisual(),appIcon:b.dataset.appIcon};$$('[data-app-icon]').forEach(x=>x.classList.toggle('active',x===b));}));
  $$('[data-accent]').forEach(b=>b.addEventListener("click",()=>{visualPreview={...activeVisual(),accent:b.dataset.accent};refresh();}));
  $("#customAccent")?.addEventListener("input",e=>{visualPreview={...activeVisual(),accent:e.target.value};applyVisual(visualPreview);});
  $("#visualSave")?.addEventListener("click",()=>{const v={...activeVisual()};Store.set("visual",v);visualPreview=null;applyVisual(v);close(false);});
  $("#visualReset")?.addEventListener("click",()=>{Store.set("visual",VISUAL_DEFAULT);visualPreview=null;applyVisual(VISUAL_DEFAULT);close(false);});
}

const commands=["ESTUDAR","CONTEXTO","EXEGESE","HERMENÊUTICA","ESBOÇO","SERMÃO","SÉRIE","REVISAR","APLICAR","ILUSTRAR","CONCLUIR","ORAÇÃO","DEVOCIONAL","AULA"];

function escapeHtml(s=""){return String(s).replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#039;"}[m]))}
function download(name,text,type="text/plain"){const a=document.createElement("a");a.href=URL.createObjectURL(new Blob([text],{type}));a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),500)}
function closeActionModal(){document.querySelector("#logosActionBackdrop")?.remove()}
function actionModal({icon="✓",title="Pronto",message="",actions=[]}={}){closeActionModal();const html=`<div class="logos-action-backdrop" id="logosActionBackdrop"><div class="logos-action-modal" role="dialog" aria-modal="true"><div class="logos-action-icon">${icon}</div><div class="logos-action-copy"><h3>${escapeHtml(title)}</h3><p>${escapeHtml(message)}</p></div><button class="logos-action-x" id="logosActionX" aria-label="Fechar">✕</button><div class="logos-action-buttons">${actions.map((a,i)=>`<button class="btn ${a.kind||"secondary"}" data-action-index="${i}">${escapeHtml(a.label)}</button>`).join("")}</div></div></div>`;document.body.insertAdjacentHTML("beforeend",html);const bd=$("#logosActionBackdrop");$("#logosActionX")?.addEventListener("click",closeActionModal);bd?.addEventListener("click",e=>{if(e.target===bd)closeActionModal()});$$('[data-action-index]').forEach(b=>b.addEventListener('click',async()=>{const a=actions[Number(b.dataset.actionIndex)];if(a?.run)await a.run();if(a?.close!==false)closeActionModal();}));}
async function copy(text,{silent=false}={}){text=String(text??"");if(!text)return false;let ok=false;try{await navigator.clipboard.writeText(text);ok=true}catch{}if(!ok){try{const ta=document.createElement("textarea");ta.value=text;ta.setAttribute("readonly","");ta.style.position="fixed";ta.style.opacity="0";ta.style.pointerEvents="none";document.body.appendChild(ta);ta.focus();ta.select();ta.setSelectionRange(0,ta.value.length);ok=document.execCommand("copy");ta.remove()}catch{}}if(!silent)actionModal({icon:ok?"✓":"!",title:ok?"Texto copiado":"Não foi possível copiar",message:ok?`Conteúdo completo copiado: ${text.length.toLocaleString("pt-BR")} caracteres.`:"Use Ctrl+C após selecionar o texto manualmente.",actions:[{label:"Fechar",kind:"primary"}]});return ok;}
function studioOutputText(){if(App.lastStudioText)return String(App.lastStudioText).trim();const e=$("#out");return e?String(e.innerText||e.textContent||"").trim():""}
function inlineRich(s=""){let x=escapeHtml(s);x=x.replace(/\*\*([^*]+)\*\*/g,"<strong>$1</strong>").replace(/\*([^*]+)\*/g,"<em>$1</em>").replace(/`([^`]+)`/g,"<code>$1</code>");return x;}
function sectionIcon(title=""){const t=String(title).toLowerCase();if(t.includes("dna k7")||t.includes("progressão k7")||t.includes("intensifica"))return "🔥";if(t.includes("texto")||t.includes("delimita")||t.includes("leitura"))return "📖";if(t.includes("contexto"))return "🧭";if(t.includes("observa"))return "🔎";if(t.includes("interpreta")||t.includes("exeg"))return "🧠";if(t.includes("grande ideia")||t.includes("verdade central"))return "💡";if(t.includes("estrutura")||t.includes("esboço")||t.includes("movimento"))return "🧱";if(t.includes("aplica"))return "🎯";if(t.includes("pergunta")||t.includes("reflex"))return "❓";if(t.includes("clímax"))return "⚡";if(t.includes("apelo")||t.includes("oração"))return "🙏";if(t.includes("quality")||t.includes("verificar")||t.includes("revis"))return "✅";if(t.includes("conclus"))return "🏁";return "✦";}
function renderGeneratedMessage(raw="",ctx={}){const lines=String(raw).replace(/\r/g,"").split("\n");let html=`<article class="generated-message"><div class="generated-hero"><div class="generated-logo">✦</div><div><strong>LOGOS MASTER X</strong><span>${escapeHtml(ctx.command||"Material gerado")}</span></div><div class="generated-badges"><span>🔥 DNA K7 ${Number(ctx.intensity||10)}/10</span>${ctx.provider?`<span>🤖 ${escapeHtml(ctx.provider)}</span>`:""}${ctx.seconds!=null?`<span>⏱ ${escapeHtml(ctx.seconds)}s</span>`:""}${ctx.quality!=null?`<span>✅ QG ${escapeHtml(ctx.quality)}%</span>`:""}</div></div>`;let listOpen=false,sectionOpen=false;const closeList=()=>{if(listOpen){html+="</ul>";listOpen=false}},closeSection=()=>{closeList();if(sectionOpen){html+="</section>";sectionOpen=false}};for(const original of lines){const trim=original.trim();if(!trim){closeList();continue}if(trim==="---"){closeList();continue}if(/^\[LOGOS-AI-HUB\]$/i.test(trim))continue;if(/^IA:\s/i.test(trim)){html+=`<div class="generated-meta">${inlineRich(trim)}</div>`;continue}const hm=trim.match(/^#{1,6}\s+(.+)$/);if(hm){closeSection();const title=hm[1].replace(/^\*\*|\*\*$/g,"");const ico=sectionIcon(title);html+=`<section class="generated-section ${ico==="🔥"?"dna-k7-section":""}"><h3><span class="generated-section-icon">${ico}</span><span>${inlineRich(title)}</span></h3>`;sectionOpen=true;continue}if(/^\[QUALITY GATE/i.test(trim)){closeSection();html+=`<section class="generated-section quality-section"><h3><span class="generated-section-icon">✅</span><span>Quality Gate</span></h3><p class="quality-line">${inlineRich(trim.replace(/^\[|\]$/g,""))}</p>`;sectionOpen=true;continue}const bullet=trim.match(/^[-*•]\s+(.+)$/);if(bullet){if(!sectionOpen){html+='<section class="generated-section">';sectionOpen=true}if(!listOpen){html+='<ul class="generated-list">';listOpen=true}html+=`<li>${inlineRich(bullet[1])}</li>`;continue}closeList();const numbered=trim.match(/^(\d+)[.)]\s+(.+)$/);if(numbered){html+=`<div class="generated-number"><span>${numbered[1]}</span><p>${inlineRich(numbered[2])}</p></div>`;continue}const special=/DNA K7|K7|CLÍMAX|APELO|\[VERIFICAR\]|\[AUTOCORREÇÃO\]/i.test(trim);html+=`<p class="${special?"generated-emphasis":""}">${inlineRich(trim)}</p>`;}closeSection();const plain=String(raw).replace(/[#*_`>\[\]]/g,' ').replace(/\s+/g,' ').trim();const words=plain?plain.split(/\s+/).length:0;const chars=String(raw).length;const refs=(String(raw).match(/\b(?:[1-3]\s*)?[A-ZÁÉÍÓÚÂÊÔÃÕÇ][A-Za-zÁ-úç]+\s+\d{1,3}:\d{1,3}(?:[-–]\d{1,3})?/g)||[]);const uniqueRefs=[...new Set(refs)];const qn=Math.max(0,Math.min(100,Number(ctx.quality)||0));const score20=Math.round(qn/5);const stars=Math.max(1,Math.min(5,Math.round(qn/20)));const starText='★'.repeat(stars)+'☆'.repeat(5-stars);html+=`${ctx.quality!=null?`<section class="quality-score-panel"><div class="quality-score-main"><span>🎯 PRECISÃO / QUALITY GATE</span><strong>${score20}/20 • ${qn}%</strong><b>${starText} — ${qn>=95?'🟢 Excelente':qn>=85?'🟢 Muito alta':qn>=70?'🟡 Boa':qn>=50?'🟠 Revisar':'🔴 Baixa'}</b><div class="precision-track"><i style="width:${qn}%"></i></div></div><div class="quality-scale"><span><b>19–20</b> ★★★★★ — 🟢 Excelente</span><span><b>17–18</b> ★★★★☆ — 🟢 Muito alta</span><span><b>14–16</b> ★★★★☆ — 🟡 Boa</span><span><b>10–13</b> ★★★☆☆ — 🟠 Revisar</span><span><b>0–9</b> ★★☆☆☆ — 🔴 Baixa</span></div></section>`:''}<section class="material-summary"><h3>📊 Resumo do material gerado</h3><div class="summary-grid"><div><span>Palavras</span><strong>${words.toLocaleString('pt-BR')}</strong></div><div><span>Caracteres</span><strong>${chars.toLocaleString('pt-BR')}</strong></div><div><span>Referências</span><strong>${uniqueRefs.length}</strong></div><div><span>Leitura</span><strong>~${Math.max(1,Math.ceil(words/130))} min</strong></div><div><span>Pregação planejada</span><strong>${ctx.duration||'—'} min</strong></div><div><span>DNA K7</span><strong>${Number(ctx.intensity||10)}/10</strong></div></div>${ctx.quality!=null?`<div class="precision-card"><div><span>🎯 Precisão da geração</span><strong>${score20}/20 • ${qn}%</strong></div><div class="precision-stars">${starText}</div><div class="precision-track"><i style="width:${qn}%"></i></div><small>${qn>=95?'Excelente':qn>=85?'Muito alta':qn>=70?'Boa':qn>=50?'Revisar':'Baixa'}</small></div>`:''}</section></article>`;return html;}
function openShareMenu(title,text){if(!text||text==="Pronto."||text==="Processando...")return actionModal({icon:"i",title:"Nada para compartilhar",message:"Gere um conteúdo primeiro.",actions:[{label:"Fechar",kind:"primary"}]});const safeTitle=title||"LOGOS MASTER X";const actions=[{label:"📋 Copiar tudo",kind:"primary",close:false,run:async()=>{await copy(text,{silent:true});actionModal({icon:"✓",title:"Texto copiado",message:"O conteúdo completo está na área de transferência.",actions:[{label:"Fechar",kind:"primary"}]})}},{label:"✉️ E-mail",run:async()=>{await copy(text,{silent:true});location.href=`mailto:?subject=${encodeURIComponent(safeTitle)}&body=${encodeURIComponent("O texto completo do LOGOS MASTER X foi copiado para a área de transferência. Cole-o aqui no corpo do e-mail.")}`;}},{label:"💬 WhatsApp Web",run:async()=>{const w=window.open("about:blank","_blank");await copy(text,{silent:true});if(w)w.location.href="https://web.whatsapp.com/";}},{label:"📝 Abrir no Editor",run:()=>{Store.set("editor",{title:safeTitle,text});render("editor")}},{label:"⬇️ Baixar TXT",run:()=>download((safeTitle||"logos").replace(/[\/:*?"<>|]+/g,"-")+".txt",text)}];if(navigator.share)actions.unshift({label:"📤 Compartilhar pelo sistema",kind:"success",run:async()=>{try{await navigator.share({title:safeTitle,text})}catch(e){if(e?.name!=="AbortError")throw e}}});actionModal({icon:"↗",title:"Compartilhar / usar texto",message:"Escolha o que deseja fazer com a mensagem completa.",actions});}

function durationProfile(m){
 m=Number(m);
 if(m<=20)return "2 pontos; introdução curta; contexto essencial; aplicações diretas; clímax e apelo objetivos.";
 if(m<=35)return "3 pontos; contexto suficiente; aplicações maiores; transições claras.";
 if(m<=50)return "4 pontos; contexto e exposição ampliados; mais aplicações; uma ilustração quando útil.";
 return "máximo 5 pontos; exposição profunda; sínteses intermediárias; aplicações variadas; clímax construído lentamente.";
}
function k7(level){
 const map={1:"Expositivo suave",2:"Leve cadência",3:"Pentecostal moderado",4:"Pentecostal progressivo",5:"K7 equilibrado",6:"K7 acentuado",7:"K7 forte",8:"K7 intenso",9:"K7 muito intenso",10:"K7 máximo estrutural"};
 return map[level]||map[10];
}
function masterPrompt(cmd,d){
 const deep=window.LOGOS_BUILD_DEEP_PROMPT ? window.LOGOS_BUILD_DEEP_PROMPT(cmd==="SERMÃO"?"sermon":cmd==="ESTUDAR"?"study":cmd==="AULA"?"ebd":cmd==="ESBOÇO"?"outline":"assistant",{
   subject:d.text,notes:d.notes,duration:d.duration,cult:d.cult,audience:d.audience,intensity:d.intensity,objective:d.objective
 }) : "";
 return `COMANDO: LOGOS ${cmd}
TEXTO/TEMA: ${d.text}
TEMPO: ${d.duration} minutos
CULTO: ${d.cult}
PÚBLICO: ${d.audience}
INTENSIDADE K7: ${d.intensity}/10 — ${k7(d.intensity)}
OBJETIVO: ${d.objective||"Definir a partir do texto"}
OBSERVAÇÕES: ${d.notes||"Nenhuma"}

PERFIL DE TEMPO: ${durationProfile(d.duration)}

${deep}`;
}
function localPipeline(cmd,d){
 const points=Number(d.duration)<=20?2:Number(d.duration)<=35?3:Number(d.duration)<=50?4:5;
 const head=`LOGOS MASTER X — ${cmd}
Texto/Tema: ${d.text}
Tempo: ${d.duration} min
Culto: ${d.cult}
Público: ${d.audience}
DNA K7: ${d.intensity}/10 (${k7(d.intensity)})

`;
 if(cmd==="CONTEXTO") return head+`ANÁLISE DE CONTEXTO (GUIA LOCAL)
1. Autor — identificar e verificar.
2. Destinatários.
3. Contexto histórico.
4. Contexto cultural relevante.
5. Contexto imediato.
6. Gênero literário.
7. Problema ou tensão.
8. Lugar da passagem no livro.
9. Dados que precisam de confirmação.

Este motor offline estrutura a pesquisa; não inventa fatos que não estejam no banco local.`;
 if(cmd==="EXEGESE") return head+`ROTEIRO EXEGÉTICO LOCAL
1. Delimite a unidade.
2. Observe repetições, contrastes, conectivos e verbos.
3. Identifique a ideia central.
4. Relacione cada afirmação ao contexto.
5. Separe observação / interpretação / aplicação.
6. Liste termos originais somente para verificação em fonte confiável.
7. Formule uma grande ideia provisória.
8. Registre dúvidas para pesquisa.`;
 if(cmd==="HERMENÊUTICA") return head+`ROTEIRO HERMENÊUTICO LOCAL
Texto → contexto → princípio teológico → relação canônica → aplicação.
Verifique gênero, intenção, distância cultural e possíveis leituras alternativas.
Não transforme descrição em prescrição sem justificativa.`;
 if(cmd==="ESTUDAR") return head+`ESTUDO BÍBLICO — PLANO DESENVOLVIDO
Objetivo: compreender ${d.text} antes de pregar.
1. Leitura e delimitação
2. Contexto do livro
3. Contexto imediato
4. Estrutura da passagem
5. Ideia central
6. Explicação por unidades
7. Referências cruzadas a confirmar
8. Doutrinas relacionadas
9. Aplicações responsáveis
10. Perguntas para reflexão
11. Síntese final
12. Quality Gate`;
 if(cmd==="ESBOÇO") return head+`ESBOÇO
Título: [derivar da grande ideia]
Texto: ${d.text}
Objetivo: ${d.objective||"Levar o ouvinte a responder à verdade do texto"}
Grande ideia: [formular após análise]

Introdução: apresente a tensão e conduza ao texto.

${Array.from({length:Math.min(points,5)},(_,i)=>`${i+1}. Movimento ${i+1}
   Base textual:
   Verdade:
   Aplicação:
   Transição:`).join("\n\n")}

Conclusão:
Apelo:
Esboço de bolso: texto • grande ideia • movimentos • clímax • apelo.`;
 if(cmd==="SERMÃO") return head+`SERMÃO — MOTOR LOCAL ESTRUTURAL
TÍTULO: [derivar do texto]
TEXTO BASE: ${d.text}
GRANDE IDEIA: [formular a partir do contexto]
OBJETIVO: ${d.objective||"Conduzir à compreensão e resposta bíblica"}

INTRODUÇÃO
Apresente uma tensão real ligada ao texto. Evite clichê e manipulação.

CONTEXTO
Autor, destinatários, cenário, gênero e contexto imediato devem ser pesquisados/confirmados.

${Array.from({length:Math.min(points,5)},(_,i)=>`MOVIMENTO ${i+1}
Explicação: demonstre o ponto no texto.
Contexto: mostre como se encaixa na passagem.
Aplicação: transforme a verdade em resposta concreta.
Pergunta retórica: faça o ouvinte refletir.
Transição: conduza naturalmente ao próximo movimento.`).join("\n\n")}

PROGRESSÃO K7
Abertura → contexto → exposição → aplicação → intensificação → clímax → convite.
Nível: ${d.intensity}/10.

CLÍMAX
Recordação → confronto → esperança → resposta da igreja → oração.
Frases mais curtas somente aqui; não introduzir doutrina nova.

APELO
Deve nascer do texto e ser inteligível, sem glossolalia ou manipulação.

ORAÇÃO
Coerente com a mensagem.

VERSÃO DE PÚLPITO
Texto • grande ideia • ${points} movimentos • transições • clímax • apelo.

QUALITY GATE
□ texto respeitado □ contexto respeitado □ ideia central □ aplicações derivadas do texto
□ coerência □ tempo proporcional □ sem referências inventadas □ sem glossolalia`;
 if(cmd==="SÉRIE") return head+`PLANO DE SÉRIE
Objetivo geral: ${d.objective||"Aprofundar o tema em sequência coerente"}.
1. Defina unidade temática.
2. Divida o material em 4–8 mensagens sem repetir a mesma ideia.
3. Para cada mensagem: título, texto, grande ideia, objetivo, aplicação e ligação com a próxima.
4. Inclua progressão da série e revisão de equilíbrio.`;
 if(cmd==="REVISAR") return head+`REVISÃO
Avalie de 0–10:
• Fidelidade bíblica
• Contexto
• Grande ideia
• Clareza
• Estrutura
• Aplicações
• Progressão
• DNA K7
• Conclusão
• Apelo
Depois: preservar acertos → apontar problemas → sugerir correções → Quality Gate.`;
 if(cmd==="APLICAR") return head+`APLICAÇÕES
Produza aplicações que nasçam do sentido do texto para:
• indivíduo
• família
• igreja
• liderança/ministério
Para cada aplicação: verdade textual → situação → resposta concreta → cuidado contra exagero.`;
 if(cmd==="ILUSTRAR") return head+`ILUSTRAÇÕES
Sugira opções bíblicas, históricas verificáveis, cotidianas e da natureza.
Nunca inventar milagre ou testemunho pessoal.
Marcar claramente o que é analogia.`;
 if(cmd==="CONCLUIR") return head+`CONCLUSÃO
1. Retome a grande ideia.
2. Conecte com a introdução.
3. Resuma sem repetir todo o sermão.
4. Mostre a decisão.
5. Construa apelo coerente e pastoral.`;
 if(cmd==="ORAÇÃO") return head+`ORAÇÃO FINAL
Ore a partir das verdades do texto.
Inclua adoração, confissão quando pertinente, gratidão, pedido de obediência e consagração.
Não invente revelações ou promessas.`;
 if(cmd==="DEVOCIONAL") return head+`DEVOCIONAL
Título
Texto
Verdade do dia
Breve explicação
Aplicação pessoal
Pergunta de reflexão
Oração curta
Ação prática`;
 if(cmd==="AULA") return head+`AULA BÍBLICA
Título
Texto áureo: selecionar após estudo
Verdade prática
Objetivos: conhecer / compreender / praticar
Introdução
Tópico 1 + pergunta
Tópico 2 + pergunta
Tópico 3 + pergunta
Aplicações
Revisão em 5 perguntas
Conclusão
Tarefa para a semana`;
 return head+"Comando não reconhecido.";
}
async function runCommand(cmd,d){
 const prompt=masterPrompt(cmd,d); Store.set("lastPrompt",prompt);
 if(App.server){
   try{
     const generationBase=((App.provider==="9router"&&IS_LOCAL_HOST)?LOCAL_API:App.api).replace(/\/$/,"");
     const r=await fetch(generationBase+"/api/generate-ai",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({
       mode:cmd,
       text:d.text,
       theme:"",
       duration:d.duration,
       cult:d.cult,
       audience:d.audience,
       intensity:d.intensity,
       objective:d.objective||"",
       notes:d.notes||"",
       provider:App.provider||"auto",
       ai_mode:App.aiMode||"automatico",
       model:App.model||null
     })});
     const j=await r.json(); if(!r.ok) throw new Error(j.detail||"Erro");
     return {text:j.text||JSON.stringify(j,null,2),engine:j.engine||"api",prompt,provider:j.provider||"",model:j.model||"",seconds:j.seconds,quality:j.quality||null,fallback_errors:j.fallback_errors||[]};
   }catch(e){App.server=false;setStatus(); return {text:localPipeline(cmd,d)+"\n\n[API indisponível; modo local ativado.]",engine:"local",prompt};}
 }
 return {text:localPipeline(cmd,d),engine:"local",prompt};
}
function saveMaterial(type,title,text,meta={}){return Store.push("library",{id:Date.now(),type,title:title||"Sem título",text,meta,favorite:false,pinned:false,created:new Date().toISOString()})}
function wordCount(t=""){return String(t).trim()?String(t).trim().split(/\s+/).length:0}
function readingMinutes(t="",wpm=130){return Math.max(1,Math.ceil(wordCount(t)/wpm))}
function projectStats(){return {history:Store.get("history",[]).length,library:Store.get("library",[]).length,projects:Store.get("projects",[]).length}}


async function checkApi(){
 // If this interface is being served by the local LOGOS backend, always use
 // the same local origin for health, provider status, tests and generation.
 // A previously saved Render URL must not mask the local .env configuration.
 const localHost = IS_LOCAL_HOST;
 if(localHost) App.api=LOCAL_API;
 else if(!App.api || App.api===location.origin || /netlify\.app\/?$/i.test(App.api)){App.api=DEFAULT_API;Store.set("api",DEFAULT_API);}
 const url=App.api.replace(/\/$/,"")+"/api/health";
 async function attempt(timeoutMs){
   const c=new AbortController();
   const timer=setTimeout(()=>c.abort(),timeoutMs);
   try{
     const r=await fetch(url,{signal:c.signal,cache:"no-store"});
     clearTimeout(timer);
     if(!r.ok) return null;
     return await r.json();
   }catch(e){clearTimeout(timer);return null}
 }
 let data=await attempt(15000);
 if(!data) data=await attempt(15000);
 App.server=!!data;
 App.health=data;
 setStatus();
 return data;
}
function providerStatusModal(){const ps=App.health?.providers||{},ms=App.health?.models||{};const names=[["gemini","Gemini"],["groq","Groq"],["openrouter","OpenRouter"],["huggingface","Hugging Face"],["openai","OpenAI"]];const online=names.filter(([k])=>ps[k]).length;const details=names.map(([k,n])=>`<div class="provider-detail ${ps[k]?"provider-online":"provider-offline"}"><span class="provider-check">${ps[k]?"✓":"○"}</span><div><strong>${n}</strong><small>${escapeHtml(ms[k]||"—")}</small><em>${ps[k]?"Online e disponível para o Smart Router":"Indisponível neste momento"}</em></div></div>`).join("")+`<div class="provider-detail local-reserve provider-online"><span class="provider-check local-check">⌂</span><div><strong>9Router <span class="reserve-badge">RESERVA LOCAL</span></strong><small>${escapeHtml(ms["9router"]||"oc/deepseek-v4-flash-free")}</small><em>${IS_LOCAL_HOST?(ps["9router"]?"Disponível neste PC e usado somente como última reserva.":"Reserva local configurável neste PC."):"Reserva preservada no computador local; não consome a capacidade pública do Render."}</em></div></div>`;closeActionModal();document.body.insertAdjacentHTML("beforeend",`<div class="logos-action-backdrop" id="logosActionBackdrop"><div class="logos-action-modal provider-modal"><div class="logos-action-icon">AI</div><div class="logos-action-copy"><h3>Provedores do LOGOS</h3><p><strong>${online} online</strong> • <strong>1 reserva local</strong>. O 9Router fica separado da infraestrutura pública.</p></div><button class="logos-action-x" id="logosActionX">✕</button><div class="provider-detail-list">${details}</div><div class="logos-action-buttons"><button class="btn primary" id="openAIHubFromStatus">Abrir AI HUB / Monitor</button><button class="btn secondary" id="closeProviderStatus">Fechar</button></div></div></div>`);$("#logosActionX")?.addEventListener("click",closeActionModal);$("#closeProviderStatus")?.addEventListener("click",closeActionModal);$("#openAIHubFromStatus")?.addEventListener("click",()=>{closeActionModal();render("aihub")});}
function setStatus(){const e=$("#status");if(!e)return;if(App.server){const ps=App.health?.providers||{};const n=["gemini","groq","openrouter","huggingface","openai"].filter(k=>ps[k]).length;e.innerHTML=`<span class="status-dot"></span><strong>${n} ONLINE</strong><span class="status-reserve">• 1 RESERVA LOCAL</span><span class="status-chevron">⌄</span>`;e.className="status online status-clickable";e.title="${n} provedores online + 9Router como reserva local";e.onclick=providerStatusModal;}else{e.innerHTML='<span class="status-dot"></span><strong>LOCAL</strong><span>API offline</span>';e.className="status status-clickable";e.onclick=providerStatusModal;}}

function fieldHead(classic,kind,title){return `<div class="studio-section-head"><span class="studio-classic-icon">${classic}</span>${modernIcon(kind)}<strong>${title}</strong></div>`;}
function form(){
 return `<div class="studio-section studio-content">${fieldHead("📝","edit","Conteúdo da mensagem")}
 <div class="two"><div><label>Texto bíblico / tema</label><textarea id="fText" placeholder="Ex.: Lamentações 5:21-22 — restauração espiritual"></textarea></div><div><label>Objetivo</label><textarea id="fObjective" placeholder="Ex.: levar a igreja ao arrependimento e à esperança"></textarea></div></div></div>
 <div class="studio-section studio-context">${fieldHead("⛪","book","Contexto e público")}
 <div class="three"><div><label>Tempo</label><select id="fDuration">${[20,30,35,40,50,60,70].map(x=>`<option ${x===40?"selected":""}>${x}</option>`).join("")}</select></div>
 <div><label>Tipo de culto / ocasião</label><select id="fCult">${CULT_TYPES.map(x=>`<option value="${x}">${x}</option>`).join("")}<option value="__custom__">Outro / personalizado...</option></select><input id="fCultCustom" class="audience-custom" placeholder="Digite o culto / ocasião" style="display:none" autocomplete="off"></div>
 <div><label class="label-with-info">Intensidade K7 <button type="button" class="info-dot" id="k7Info" aria-label="O que é Intensidade K7?">i</button></label><select id="fK7">${[1,2,3,4,5,6,7,8,9,10].map(x=>`<option ${x===10?"selected":""}>${x}</option>`).join("")}</select></div></div>
 <label>Público-alvo</label><select id="fAudience">${AUDIENCES.map((x,i)=>`<option value="${x}" ${i===0?"selected":""}>${x}</option>`).join("")}<option value="__custom__">Outro / personalizado...</option></select><input id="fAudienceCustom" class="audience-custom" placeholder="Digite o público personalizado" style="display:none" autocomplete="off"></div>
 <div class="studio-section studio-direction">${fieldHead("🎯","spark","Direcionamento")}<label>Comando</label><select id="cmd">${commands.map(c=>`<option>${c}</option>`).join("")}</select><label>Observações</label><textarea id="fNotes" placeholder="Observações, foco, limitações..."></textarea></div>`;
}
function fd(){const av=$("#fAudience")?.value||"Igreja local",cv=$("#fCult")?.value||"Avivamento";const audience=av==="__custom__"?($("#fAudienceCustom")?.value.trim()||"Público personalizado"):av;const cult=cv==="__custom__"?($("#fCultCustom")?.value.trim()||"Ocasião personalizada"):cv;return {text:$("#fText")?.value.trim()||"",objective:$("#fObjective")?.value.trim()||"",duration:Number($("#fDuration")?.value||40),cult,intensity:Number($("#fK7")?.value||10),audience,notes:$("#fNotes")?.value.trim()||""}}

const views={
 dashboard(){const s=projectStats(),v=activeVisual(),hero=v.layout==='moderno'?'hero-modern.png':'hero-classic.png';const m=App.metrics||{};const req=m.requests_5m??m.requests??0,queue=m.queue??0,lat=m.avg_latency??m.latency??'—';return `<div class="dashboard-pro">
<section class="home-stage">
 <div class="home-hero-art"><img src="/static/brand/${hero}" alt="Fita K7, DNA em X e Bíblia aberta — LOGOS MASTER X"><div class="hero-copy"><span class="hero-kicker">LOGOS MASTER X</span><h1>Da Palavra ao Púlpito.</h1><p>DNA K7 • Bíblia • Estudo • Pregação</p><div class="hero-symbols"><button data-go="bible">📖 <span>BÍBLIA</span></button><button data-go="studio">🧬 <span>ESTUDO</span></button><button data-go="pulpit">🎙️ <span>PREGAÇÃO</span></button><button data-go="k7">🔥 <span>AVIVAMENTO</span></button></div><button class="hero-cta" data-go="studio">▶ <span><b>ACESSAR STUDIO</b><small>Comece seu próximo estudo ou mensagem</small></span></button></div></div>
 <aside class="home-rail">
  <div class="rail-card purpose"><div class="rail-title">O PROPÓSITO <span>ⓘ</span></div><p>Equipar pregadores, professores e estudantes da Bíblia com uma ferramenta poderosa para estudar, preparar e pregar mensagens com profundidade, clareza e fidelidade à Palavra de Deus.</p><blockquote>“A minha palavra e a minha pregação não consistiram em palavras persuasivas de sabedoria humana, mas em demonstração do Espírito e de poder.”<cite>1 Coríntios 2:4</cite></blockquote><button data-go="about">Saiba mais →</button></div>
  <div class="rail-card system"><div class="rail-title">RESUMO DO SISTEMA <span class="online-dot">● Online</span></div><div class="sys-row"><span>Versão</span><b>3.7.6</b></div><div class="sys-row"><span>DNA K7</span><b>1–10</b></div><div class="sys-row"><span>Precisão</span><b>Quality Gate</b></div><div class="sys-row"><span>Requests (5 min)</span><b>${req}</b></div><div class="sys-row"><span>Fila</span><b>${queue}</b></div><div class="sys-row"><span>Latência média</span><b>${lat}</b></div><button data-go="aihub">Ver detalhes</button></div>
 </aside>
</section>
<section class="home-section"><div class="section-heading"><span>COMECE AQUI</span><button data-go="custompages">＋ Personalizar atalhos</button></div><div class="start-grid"><button data-go="studio">＋<b>Nova mensagem</b><small>Comece com texto bíblico ou tema.</small><em>Criar agora</em></button><button data-go="projects">▢<b>Meus projetos</b><small>Organize todos os seus projetos.</small><em>Abrir projetos</em></button><button data-go="library">▥<b>Biblioteca</b><small>${s.library} materiais guardados.</small><em>Abrir biblioteca</em></button><button data-go="history">↶<b>Histórico</b><small>Veja suas conversas e materiais.</small><em>Ver histórico</em></button><button data-go="pulpit">🎙<b>Modo Púlpito</b><small>Finalize e prepare sua mensagem.</small><em>Preparar agora</em></button></div></section>
<section class="home-lower"><div class="home-box"><h3>▱ Escolha seu ícone</h3><p>O ícone escolhido identifica o LOGOS na tela inicial do seu dispositivo.</p><div class="home-icon-picker">${['gold','blue','classic','pro'].map(x=>`<button class="home-icon-choice ${v.appIcon===x?'active':''}" data-home-icon="${x}"><img src="/static/brand/icon-${x}-192.png"><span>${x}</span></button>`).join('')}</div><button class="btn primary" data-go="appearance">Ver todos / alterar tema</button></div><div class="home-box"><h3>➕ Criar páginas personalizadas</h3><p>Adicione páginas próprias para organizar conteúdos, recursos e atalhos do seu jeito.</p><b>${Store.get('customPages',[]).length} página(s) criada(s)</b><button class="btn primary" data-go="custompages">＋ Criar nova página</button></div><div class="home-box"><h3>📲 Instalar aplicativo</h3><p>Instale o LOGOS MASTER X como PWA no celular ou computador e use uma experiência mais próxima de um aplicativo.</p><button class="btn primary" id="installPwaHome">📲 Instalar agora</button><button class="btn secondary" data-go="appearance">🎨 Aparência</button></div></section>
<section class="home-bottom"><div><h3>ATALHOS RÁPIDOS</h3><div class="shortcut-row"><button data-go="studio" data-preset-home="EXEGESE">Exegese</button><button data-go="studio">Esboço</button><button data-go="studio">Aplicações</button><button data-go="studio">Ilustrações</button><button data-go="knowledge">Pesquisa</button></div></div><div><h3>DICA DO DIA</h3><blockquote>“Se estiver embotado o ferro, e não se afiar o corte, então se deve pôr mais força.”<cite>Eclesiastes 10:10</cite></blockquote></div><div><h3>VERSÃO</h3><b class="version-big">3.7.6</b><small>Interface profissional unificada</small><button data-go="about">Ver novidades</button></div></section>
<footer class="home-signature">LOGOS MASTER X — DA PALAVRA AO PÚLPITO. DA INSPIRAÇÃO À PREPARAÇÃO.</footer>
</div>`},
 history(){const a=Store.get("history",[]);return `<h2>🕘 Histórico</h2><div class="hero"><h1>Histórico de gerações</h1><p>Revise, fixe, favorite, copie ou abra materiais recentes sem perder a identidade visual do LOGOS.</p></div><div class="history-toolbar row"><label class="history-select-all"><input type="checkbox" id="histSelectAll"> Selecionar tudo</label><button class="btn secondary" id="histPinSelected">📌 Fixar</button><button class="btn secondary" id="histFavSelected">❤️ Favoritar</button><button class="btn danger" id="histDeleteSelected">Excluir selecionados</button><button class="btn danger" id="histClear">Excluir tudo</button></div><div class="list">${a.length?a.map(x=>`<div class="item history-item ${x.pinned?'is-pinned':''} ${x.favorite?'is-favorite':''}"><label><input type="checkbox" data-hsel="${x.id}"> ${x.pinned?'📌 ':''}${x.favorite?'❤️ ':''}<strong>${escapeHtml(x.input?.text||x.cmd||'Material')}</strong></label><br><small>${x.created?new Date(x.created).toLocaleString():''} • ${escapeHtml(x.provider||x.engine||'')}</small><div class="row"><button class="btn secondary" data-hopen="${x.id}">Abrir</button><button class="btn secondary" data-hcopy="${x.id}">Copiar</button><button class="btn secondary" data-hpin="${x.id}">${x.pinned?'Desafixar':'📌 Fixar'}</button><button class="btn secondary" data-hfav="${x.id}">${x.favorite?'♡ Remover favorito':'❤️ Favoritar'}</button></div></div>`).join(''):'<div class="card"><p class="muted">Nenhuma geração no histórico ainda.</p></div>'}</div>`},
 appearance(){return `<h2>🎨 Aparência</h2><p class="muted">Escolha Clássico ou Moderno, cor, modo mobile e ícone do aplicativo.</p><button class="btn primary" id="openAppearanceInside">Abrir personalização</button>`},
 about(){return `<div class="about-page"><h2>ⓘ Sobre o LOGOS MASTER X • DNA K7</h2><h1>Da Palavra ao Púlpito. Da inspiração à preparação.</h1><p>Tudo começou com uma antiga fita K7: uma mensagem bíblica preservada, digitalizada e, anos depois, estudada em sua estrutura, progressão, transições, aplicações e crescimento de intensidade. Dessa investigação nasceu o nome <b>DNA K7</b>.</p><h3>O propósito</h3><p>O LOGOS MASTER X foi criado como ambiente de preparação bíblica e homilética para pregadores, professores e estudantes da Bíblia. Ele auxilia a pesquisar, organizar, estruturar, desenvolver e revisar materiais.</p><blockquote>“A minha palavra e a minha pregação não consistiram em palavras persuasivas de sabedoria humana, mas em demonstração do Espírito e de poder.” — 1 Coríntios 2:4</blockquote><div class="about-dual"><div><h3>🟢 O LOGOS ajuda a</h3><p>Estudar • organizar • estruturar • desenvolver • revisar • preparar para o púlpito.</p></div><div><h3>🔴 O LOGOS não substitui</h3><p>Oração • consagração • leitura bíblica • comunhão com Deus • discernimento espiritual • dependência do Espírito Santo.</p></div></div><h3>O machado e o sopro</h3><p>Eclesiastes 10:10 lembra a sabedoria de afiar o ferro. E Ezequiel 37 mostra que uma estrutura completa ainda precisava do sopro de Deus. Esta é a filosofia do projeto: <b>o LOGOS pode ajudar a organizar os ossos. Somente Deus pode soprar vida sobre eles.</b></p><div class="about-final">LOGOS MASTER X<br><small>DNA K7 • Bíblia • Estudo • Pregação</small></div></div>`},
 custompages(){const a=Store.get('customPages',[]);return `<h2>➕ Minhas páginas</h2><p class="muted">Crie páginas locais para notas, séries, roteiros ou recursos próprios.</p><div class="two"><input id="customPageTitle" placeholder="Nome da página"><input id="customPageIcon" placeholder="Ícone, ex.: ⭐" value="⭐"></div><textarea id="customPageContent" rows="8" placeholder="Conteúdo da página..."></textarea><button class="btn primary" id="customPageSave">➕ Criar página</button><div class="list">${a.map((x,i)=>`<div class="item"><b>${escapeHtml(x.icon||'⭐')} ${escapeHtml(x.title)}</b><p>${escapeHtml(x.content||'')}</p><button class="btn danger" data-page-delete="${i}">Excluir</button></div>`).join('')||'<p class="muted">Nenhuma página criada.</p>'}</div>`},
 settings(){const p=App.health?.providers||{},m=App.health?.models||{};return `<h2>⚙️ Configurações</h2>
<label>URL da API</label><input id="api" value="${escapeHtml(App.api)}" placeholder="https://seu-backend.onrender.com">
<div class="row"><button class="btn primary" id="apiSave">Salvar/Testar</button><button class="btn secondary" id="apiOff">Usar somente local</button><button class="btn secondary" data-go="aihub">Abrir AI HUB</button></div>
<div class="output">Modo: ${App.server?"ONLINE/API":"LOCAL/OFFLINE"}
Versão: ${App.health?.version||"—"}
Prompt Engine: ${App.health?.prompt_engine||"—"}
Think Engine: ${App.health?.think_engine||"—"}
DNA K7: ${App.health?.dna_k7||"—"}

${Object.entries(p).map(([k,v])=>`${v?"🟢":"⚪"} ${k}: ${m[k]||"—"}`).join("\\n")}

As chaves secretas ficam somente no servidor.</div>`}
};

async function render(view){
 App.view=view; $$(`[data-view]`).forEach(b=>b.classList.toggle("active",b.dataset.view===view)); $("#workspace").innerHTML=views[view]?views[view]():"<h2>Módulo</h2>";
 $$("[data-go]").forEach(b=>b.onclick=()=>render(b.dataset.go));
 if(view==="dashboard"){$("#installPwaHome")?.addEventListener("click",installPwa);$$('[data-home-icon]').forEach(b=>b.addEventListener('click',()=>{const v={...visualSettings(),appIcon:b.dataset.homeIcon};Store.set('visual',v);applyVisual(v);applyAppBranding(v.appIcon);render('dashboard')}));}
 if(view==="appearance"){$("#openAppearanceInside")?.addEventListener("click",openAppearance);}
 if(view==="custompages"){$("#customPageSave")?.addEventListener("click",()=>{const title=$("#customPageTitle").value.trim();if(!title)return;const a=Store.get("customPages",[]);a.push({title,icon:$("#customPageIcon").value||"⭐",content:$("#customPageContent").value});Store.set("customPages",a);render("custompages")});$$('[data-page-delete]').forEach(b=>b.onclick=()=>{const a=Store.get("customPages",[]);a.splice(Number(b.dataset.pageDelete),1);Store.set("customPages",a);render("custompages")});}
 if(view==="studio"){let last="";
   const audienceSelect=$("#fAudience"), audienceCustom=$("#fAudienceCustom");
   const syncAudience=()=>{if(!audienceSelect||!audienceCustom)return;const custom=audienceSelect.value==="__custom__";audienceCustom.style.display=custom?"block":"none";if(custom)audienceCustom.focus();};
   audienceSelect?.addEventListener("change",syncAudience);syncAudience();
   const cultSelect=$("#fCult"),cultCustom=$("#fCultCustom");const syncCult=()=>{if(!cultSelect||!cultCustom)return;const custom=cultSelect.value==="__custom__";cultCustom.style.display=custom?"block":"none";if(custom)cultCustom.focus();};cultSelect?.addEventListener("change",syncCult);syncCult();
   $("#k7Info")?.addEventListener("click",()=>actionModal({icon:"K7",title:"Intensidade DNA K7",message:"Controla o grau de intensidade homilética pentecostal sem alterar a fidelidade bíblica: 1 = expositivo suave; 5 = equilibrado; 8 = intenso; 10 = intensidade máxima estrutural do DNA K7, preservando fidelidade bíblica. Não altera o tamanho do estudo.",actions:[{label:"Entendi",kind:"primary"}]}));
   $$('[data-studio-mode]').forEach(b=>b.onclick=()=>{
     App.aiMode=b.dataset.studioMode;
     App.provider="auto";
     App.model="";
     Store.set("aiMode",App.aiMode);
     Store.set("aiProvider",App.provider);
     Store.set("aiModel",App.model);
     $$('[data-studio-mode]').forEach(x=>x.classList.toggle("active",x===b));
     const labels={rapido:"⚡ Rápido — Gemini primeiro",economico:"💰 Econômico — 9Router primeiro",automatico:"🧠 Automático — Gemini + fallback",qualidade:"💎 Qualidade — Gemini + revisão independente"};
     $("#studioModeStatus").textContent=`Perfil ativo: ${labels[App.aiMode]||App.aiMode}. Provedor: Automático.`;
   });
   $$("[data-preset]").forEach(b=>b.onclick=()=>{$("#cmd").value=b.dataset.preset});

   $("#run").onclick=async()=>{const d=fd();if(!d.text)return actionModal({icon:"i",title:"Informe o texto ou tema",message:"Preencha o campo Texto bíblico / tema antes de gerar.",actions:[{label:"Entendi",kind:"primary"}]});App.lastStudioText="";$("#out").textContent="Processando...";const selectedMode=App.aiMode||"automatico",startedAt=performance.now();const r=await runCommand($("#cmd").value,d);saveModeTime(selectedMode,(performance.now()-startedAt)/1000);last=r.text;const meta=[r.provider&&`IA: ${r.provider}`,r.model&&`Modelo: ${r.model}`,r.seconds!=null&&`Tempo: ${r.seconds}s`,r.quality&&`Quality Gate: ${r.quality.score}%`].filter(Boolean).join(" • ");
   const q=r.quality||null;const qDetails=q&&q.source==="revisor-ia-independente"?`

## ✅ QUALITY GATE INDEPENDENTE
Origem: ${q.source} • Revisor: ${q.review_provider||"—"} / ${q.review_model||"—"} • Revisão: ${q.review_seconds??"—"}s
Critérios: ${Object.entries(q.scores||{}).map(([k,v])=>`${k}=${v}/20`).join(" • ")}
${(q.observacoes||[]).map(x=>`[${x.tipo}] ${x.trecho}${x.motivo?` — ${x.motivo}`:""}`).join("\n")}${q.autocorrection_count?`
[AUTOCORREÇÃO] ${q.autocorrection_count} correção(ões) segura(s) aplicada(s) automaticamente.`:""}${(q.autocorrections||[]).map(x=>`
✓ ${x.original} → ${x.substituicao}`).join("")}${q.resumo?`
Resumo: ${q.resumo}`:""}`:q&&q.source?`

## ✅ QUALITY GATE
Origem: ${q.source}${q.review_error?` • ${q.review_error}`:""}`:"";
   const fullText=`[LOGOS-AI-HUB]${meta?"\n"+meta:""}\n\n${r.text}${qDetails}`;App.lastStudioText=fullText;$("#out").innerHTML=renderGeneratedMessage(fullText,{command:$("#cmd").value,intensity:d.intensity,provider:r.provider,seconds:r.seconds,quality:q?.score,duration:d.duration});
   Store.push("history",{id:Date.now(),cmd:$("#cmd").value,input:d,engine:r.engine,provider:r.provider,model:r.model,seconds:r.seconds,quality:r.quality,result:fullText,favorite:false,pinned:false,created:new Date().toISOString()});};
   $("#copyResult").onclick=()=>{const t=studioOutputText();if(!t||t==="Pronto."||t==="Processando...")return actionModal({icon:"i",title:"Nada para copiar",message:"Gere um conteúdo primeiro.",actions:[{label:"Fechar",kind:"primary"}]});copy(t);};
   $("#shareResult").onclick=()=>openShareMenu(fd().text||"LOGOS MASTER X",studioOutputText());
   $("#save").onclick=()=>{const t=studioOutputText();if(!t||t==="Pronto.")return actionModal({icon:"i",title:"Nada para salvar",message:"Gere um conteúdo primeiro.",actions:[{label:"Fechar",kind:"primary"}]});saveMaterial($("#cmd").value,fd().text,t,fd());actionModal({icon:"✓",title:"Material salvo",message:"A mensagem completa foi salva na Biblioteca do LOGOS.",actions:[{label:"Abrir Biblioteca",kind:"primary",run:()=>render("library")},{label:"Continuar aqui"}]});};$("#toEditor").onclick=()=>{const t=studioOutputText();if(!t||t==="Pronto."||t==="Processando...")return actionModal({icon:"i",title:"Nada para abrir",message:"Gere um conteúdo primeiro.",actions:[{label:"Fechar",kind:"primary"}]});Store.set("editor",{title:fd().text||$("#cmd").value,text:t});render("editor");};
   $("#project").onclick=()=>{const d=fd();Store.push("projects",{id:Date.now(),name:d.text||"Projeto",command:$("#cmd").value,data:d,result:studioOutputText(),created:new Date().toISOString()});actionModal({icon:"✓",title:"Projeto salvo",message:"O projeto foi salvo neste dispositivo.",actions:[{label:"Abrir Projetos",kind:"primary",run:()=>render("projects")},{label:"Continuar aqui"}]});};
 }
 if(view==="bible") initBibleUI();
 if(view==="k7"){ $("#kAnalyze").onclick=()=>{const t=$("#kText").value;const words=["restaura","altar","oração","igreja","espírito","voltemos","olhe","perceba","clamor","renova"];const hits=words.map(w=>[w,(t.toLowerCase().match(new RegExp(w,"g"))||[]).length]).filter(x=>x[1]);const r=`ANÁLISE K7 LOCAL
Caracteres: ${t.length}
Ocorrências estruturais:
${hits.map(x=>`• ${x[0]}: ${x[1]}`).join("\n")||"Nenhum marcador principal encontrado."}

Progressão de referência:
abertura → contexto → exposição → aplicação → intensificação → clímax → convite

Leitura: esta análise identifica sinais lexicais simples; a interpretação homilética deve considerar a transcrição inteira.`;$("#kOut").textContent=r;Store.push("k7analyses",{id:Date.now(),hits,textLength:t.length,created:new Date().toISOString()});}; $("#kPrompt").onclick=()=>$("#kOut").textContent=P.dna||"DNA K7 está em prompts/dna-k7-MASTER.txt"; }
 if(view==="library"){let filter="all";function show(q=""){let a=Store.get("library",[]).filter(x=>JSON.stringify(x).toLowerCase().includes(q.toLowerCase()));if(filter==="favorites")a=a.filter(x=>x.favorite);if(filter==="pinned")a=a.filter(x=>x.pinned);a.sort((x,y)=>(Number(!!y.pinned)-Number(!!x.pinned))||(Number(!!y.favorite)-Number(!!x.favorite))||String(y.created||"").localeCompare(String(x.created||"")));$("#libList").innerHTML=a.length?a.map(x=>`<div class="item library-item ${x.pinned?"is-pinned":""} ${x.favorite?"is-favorite":""}"><div class="library-item-head"><div><strong>${x.pinned?"📌 ":""}${x.favorite?"❤️ ":""}${escapeHtml(x.title)}</strong><br><small>${escapeHtml(x.type)} • ${new Date(x.created).toLocaleString()}</small></div></div><div class="row"><button class="btn secondary" data-lib-open="${x.id}">Abrir</button><button class="btn secondary" data-lib-copy="${x.id}">Copiar</button><button class="btn secondary" data-lib-fav="${x.id}">${x.favorite?"♡ Remover favorito":"❤️ Favoritar"}</button><button class="btn secondary" data-lib-pin="${x.id}">${x.pinned?"Desafixar":"📌 Fixar"}</button><button class="btn danger" data-lib-del="${x.id}">Excluir</button></div></div>`).join(""):"<div class='item'>Nenhum resultado.</div>";const find=id=>Store.get("library",[]).find(x=>String(x.id)===String(id));const update=(id,fn)=>{Store.set("library",Store.get("library",[]).map(x=>String(x.id)===String(id)?fn({...x}):x));show($("#libQ").value)};$$('[data-lib-open]').forEach(b=>b.onclick=()=>{const x=find(b.dataset.libOpen);if(!x)return;Store.set("editor",{title:x.title||"Material",text:x.text||""});render("editor")});$$('[data-lib-copy]').forEach(b=>b.onclick=()=>{const x=find(b.dataset.libCopy);if(x)copy(x.text||"")});$$('[data-lib-fav]').forEach(b=>b.onclick=()=>update(b.dataset.libFav,x=>({...x,favorite:!x.favorite})));$$('[data-lib-pin]').forEach(b=>b.onclick=()=>update(b.dataset.libPin,x=>({...x,pinned:!x.pinned})));$$('[data-lib-del]').forEach(b=>b.onclick=()=>{const x=find(b.dataset.libDel);if(!x)return;actionModal({icon:"🗑",title:"Excluir material?",message:`${x.title||"Este material"} será removido da Biblioteca.`,actions:[{label:"Excluir",kind:"danger",run:()=>{Store.set("library",Store.get("library",[]).filter(i=>String(i.id)!==String(x.id)));show($("#libQ").value)}},{label:"Cancelar"}]})});}show();$("#libSearch").onclick=()=>show($("#libQ").value);$("#libExport").onclick=()=>download("logos-biblioteca.json",JSON.stringify(Store.get("library",[]),null,2),"application/json");$$('[data-lib-filter]').forEach(b=>b.onclick=()=>{filter=b.dataset.libFilter;$$('[data-lib-filter]').forEach(x=>x.classList.toggle('active',x===b));show($("#libQ").value)});}
 if(view==="history"){const all=()=>Store.get("history",[]),find=id=>all().find(x=>String(x.id)===String(id)),update=(id,fn)=>Store.set("history",all().map(x=>String(x.id)===String(id)?fn({...x}):x)),selected=()=>$$('[data-hsel]:checked').map(x=>String(x.dataset.hsel));$$("[data-hopen]").forEach(b=>b.onclick=()=>{const x=find(b.dataset.hopen);if(!x)return;Store.set("editor",{title:(x.input?.text||x.cmd||"Material"),text:x.result||x.text||""});render("editor")});$$("[data-hcopy]").forEach(b=>b.onclick=()=>{const x=find(b.dataset.hcopy);if(x)copy(x.result||x.text||JSON.stringify(x,null,2))});$$('[data-hpin]').forEach(b=>b.onclick=()=>{update(b.dataset.hpin,x=>({...x,pinned:!x.pinned}));render("history")});$$('[data-hfav]').forEach(b=>b.onclick=()=>{update(b.dataset.hfav,x=>({...x,favorite:!x.favorite}));render("history")});$("#histSelectAll")?.addEventListener("change",e=>$$('[data-hsel]').forEach(x=>x.checked=e.target.checked));$("#histPinSelected")?.addEventListener("click",()=>{const ids=selected();if(!ids.length)return actionModal({icon:"i",title:"Nada selecionado",message:"Marque uma ou mais gerações do histórico.",actions:[{label:"Fechar",kind:"primary"}]});Store.set("history",all().map(x=>ids.includes(String(x.id))?{...x,pinned:true}:x));render("history")});$("#histFavSelected")?.addEventListener("click",()=>{const ids=selected();if(!ids.length)return actionModal({icon:"i",title:"Nada selecionado",message:"Marque uma ou mais gerações do histórico.",actions:[{label:"Fechar",kind:"primary"}]});Store.set("history",all().map(x=>ids.includes(String(x.id))?{...x,favorite:true}:x));render("history")});$("#histDeleteSelected")?.addEventListener("click",()=>{const ids=selected();if(!ids.length)return actionModal({icon:"i",title:"Nada selecionado",message:"Marque uma ou mais gerações para excluir.",actions:[{label:"Fechar",kind:"primary"}]});actionModal({icon:"🗑",title:"Excluir selecionados?",message:`${ids.length} item(ns) serão removidos do histórico.`,actions:[{label:"Excluir",kind:"danger",run:()=>{Store.set("history",all().filter(x=>!ids.includes(String(x.id))));render("history")}},{label:"Cancelar"}]})});$("#histClear")?.addEventListener("click",()=>actionModal({icon:"🗑",title:"Excluir todo o histórico?",message:"Todas as gerações do Histórico serão removidas deste dispositivo. Biblioteca e Projetos não serão apagados.",actions:[{label:"Excluir tudo",kind:"danger",run:()=>{Store.set("history",[]);render("history")}},{label:"Cancelar"}]}));}
 if(view==="projects"){const a=Store.get("projects",[]);$$("[data-popen]").forEach(b=>b.onclick=()=>{const x=a[Number(b.dataset.popen)];Store.set("editor",{title:x.name||"Projeto",text:x.result||""});render("editor")});$$("[data-pdel]").forEach(b=>b.onclick=()=>{const i=Number(b.dataset.pdel);const n=[...a];n.splice(i,1);Store.set("projects",n);render("projects")});}
 if(view==="knowledge"){ $("#knowSearch").onclick=async()=>{const q=$("#knowQ").value.toLowerCase().trim();const urls=["data/themes/themes.json","data/doctrine/doctrine.json","data/characters/characters.json","data/history/history.json","data/geography/geography.json","data/chronology/chronology.json","data/illustrations/illustrations.json","data/applications/applications.json"];let all=[];for(const u of urls){try{const j=await fetch("../../"+u);all=all.concat(j.map(x=>({...x,_source:u})))}catch{}}const hits=all.filter(x=>JSON.stringify(x).toLowerCase().includes(q));$("#knowOut").textContent=hits.length?hits.slice(0,50).map(x=>`${x.name||x.title||x.scope||x.label} — ${x.summary||x.text||x.notes||JSON.stringify(x)}`).join("\n\n"):"Nenhum resultado. Se abriu por file://, o navegador pode bloquear leitura dos JSON; use a versão servida/PWA.";};}
 if(view==="editor"){const saveEd=()=>{Store.set("editor",{title:$("#edTitle").value,text:$("#edText").value});$("#edWords").textContent=`${wordCount($("#edText").value)} palavras`;$("#edTime").textContent=`~${readingMinutes($("#edText").value)} min de leitura`;};let timer;["input","change"].forEach(ev=>{$("#edTitle").addEventListener(ev,()=>{clearTimeout(timer);timer=setTimeout(saveEd,350)});$("#edText").addEventListener(ev,()=>{clearTimeout(timer);timer=setTimeout(saveEd,350)})});$("#edSave").onclick=()=>{saveEd();alert("Salvo localmente.");};$("#edLib").onclick=()=>{saveMaterial("editor",$("#edTitle").value,$("#edText").value);alert("Enviado.");};$("#edTxt").onclick=()=>download(($("#edTitle").value||"sermao")+".txt",$("#edText").value);$("#edMd").onclick=()=>download(($("#edTitle").value||"sermao")+".md",`# ${$("#edTitle").value}\n\n${$("#edText").value}`,"text/markdown");$("#edDoc").onclick=()=>{const html=`<html><meta charset="utf-8"><body><h1>${escapeHtml($("#edTitle").value)}</h1><div style="white-space:pre-wrap">${escapeHtml($("#edText").value)}</div></body></html>`;download(($("#edTitle").value||"sermao")+".doc",html,"application/msword");};$("#edPdf").onclick=()=>{const w=window.open("","_blank");w.document.write(`<html><head><title>${escapeHtml($("#edTitle").value)}</title><style>body{font-family:Arial;padding:40px;white-space:pre-wrap}</style></head><body><h1>${escapeHtml($("#edTitle").value)}</h1>${escapeHtml($("#edText").value)}</body></html>`);w.document.close();w.print();};}
 if(view==="pulpit"){let fs=18,scrollTimer=null;const update=()=>{const s=App.timerSeconds+(App.timerStart?Math.floor((Date.now()-App.timerStart)/1000):0);$("#timer").textContent=`${String(Math.floor(s/60)).padStart(2,"0")}:${String(s%60).padStart(2,"0")}`};$("#tStart").onclick=()=>{if(!App.timerStart)App.timerStart=Date.now();clearInterval(App.timer);App.timer=setInterval(update,500)};$("#tPause").onclick=()=>{if(App.timerStart){App.timerSeconds+=Math.floor((Date.now()-App.timerStart)/1000);App.timerStart=0}clearInterval(App.timer);update()};$("#tReset").onclick=()=>{clearInterval(App.timer);App.timerStart=0;App.timerSeconds=0;update()};$("#pFontUp").onclick=()=>{$("#pText").style.fontSize=(fs=Math.min(40,fs+2))+"px"};$("#pFontDown").onclick=()=>{$("#pText").style.fontSize=(fs=Math.max(14,fs-2))+"px"};$("#pScroll").onclick=()=>{if(scrollTimer){clearInterval(scrollTimer);scrollTimer=null;$("#pScroll").textContent="Rolagem automática"}else{scrollTimer=setInterval(()=>{$("#pText").scrollTop+=1},80);$("#pScroll").textContent="Parar rolagem"}};}
 if(view==="backup"){$("#bkExport").onclick=()=>download("logos-master-x-backup.json",JSON.stringify({version:1,created:new Date().toISOString(),data:Store.export()},null,2),"application/json");$("#bkImport").onclick=async()=>{const f=$("#bkFile").files[0];if(!f)return alert("Escolha o backup.");try{const j=JSON.parse(await f.text());Store.import(j.data||j);$("#bkOut").textContent="Backup restaurado. Recarregue o aplicativo."; }catch(e){$("#bkOut").textContent="Erro: "+e.message}};}
 if(view==="aihub"){
   try{const rb=await fetch(App.api.replace(/\/$/,"")+"/api/ai-metrics");if(rb.ok){App.metrics=await rb.json(); if(!window.__logosMetricsRendered){window.__logosMetricsRendered=true;setTimeout(()=>render("aihub"),0);return}}}catch{}
   $("#hubSave").onclick=()=>{App.aiMode=$("#hubMode").value;App.provider=$("#hubProvider").value;App.model=$("#hubModel").value.trim();Store.set("aiMode",App.aiMode);Store.set("aiProvider",App.provider);Store.set("aiModel",App.model);$("#hubOut").textContent="Configuração salva neste dispositivo. Próximas gerações usarão esta preferência.";};
   $("#hubRefresh").onclick=async()=>{window.__logosMetricsRendered=false;await checkApi();render("aihub")};$("#hubRefreshTop")?.addEventListener("click",async()=>{window.__logosMetricsRendered=false;await checkApi();render("aihub")});
   $$("[data-provider-test]").forEach(b=>b.onclick=async()=>{const p=b.dataset.providerTest;b.disabled=true;const old=b.textContent;b.textContent="Testando...";try{const localHost = location.hostname === "127.0.0.1" || location.hostname === "localhost"; const testBase=((LOCAL_API && localHost)?LOCAL_API:App.api).replace(/\/$/,"");const r=await fetch(testBase+"/api/provider-test/"+p,{method:"POST"});const j=await r.json();$("#hubOut").textContent=r.ok?`✅ ${p}: ${j.model} • ${j.seconds}s\\n${j.preview||""}`:`❌ ${p}: ${j.detail||"falha"}`;}catch(e){$("#hubOut").textContent=`❌ ${p}: ${e.message}`;}finally{b.disabled=false;b.textContent=old;}});
 }
 if(view==="settings"){ $("#apiSave").onclick=async()=>{App.api=$("#api").value.trim().replace(/\/$/,"");Store.set("api",App.api);await checkApi();render("settings")};$("#apiOff").onclick=()=>{App.api="";App.server=false;App.health=null;Store.set("api","");setStatus();render("settings")};}
}

async function openDB(){return new Promise((res,rej)=>{const r=indexedDB.open("logosx-bible",1);r.onupgradeneeded=()=>{const db=r.result;if(!db.objectStoreNames.contains("verses")){const s=db.createObjectStore("verses",{keyPath:"id"});s.createIndex("ref","ref");}if(!db.objectStoreNames.contains("meta"))db.createObjectStore("meta",{keyPath:"key"});};r.onsuccess=()=>res(r.result);r.onerror=()=>rej(r.error)})}
async function dbAll(store){const db=await openDB();return new Promise((res,rej)=>{const r=db.transaction(store).objectStore(store).getAll();r.onsuccess=()=>res(r.result||[]);r.onerror=()=>rej(r.error)})}
async function importBible(file){
 const text=await file.text();let raw=[];
 if(file.name.toLowerCase().endsWith(".json")){const j=JSON.parse(text);raw=Array.isArray(j)?j:(j.verses||j.versiculos||[])}
 else if(file.name.toLowerCase().endsWith(".csv")){const lines=text.split(/\r?\n/).filter(Boolean),h=lines.shift().split(",").map(x=>x.trim().toLowerCase());raw=lines.map(line=>{const c=line.split(",");const o={};h.forEach((x,i)=>o[x]=c[i]);return o})}
 else raw=text.split(/\r?\n/).map(x=>{const m=x.match(/^(.+?)\s+(\d+):(\d+)\s+(.+)$/);return m?{book:m[1],chapter:m[2],verse:m[3],text:m[4]}:null}).filter(Boolean);
 const v=raw.map(x=>{const book=String(x.book||x.livro||"").trim(),chapter=Number(x.chapter||x.capitulo),verse=Number(x.verse||x.versiculo),tx=String(x.text||x.texto||"").trim();return book&&chapter&&verse&&tx?{id:`${book}|${chapter}|${verse}`.toLowerCase(),book,chapter,verse,ref:`${book} ${chapter}:${verse}`,text:tx}:null}).filter(Boolean);
 const db=await openDB();await new Promise((res,rej)=>{const t=db.transaction(["verses","meta"],"readwrite");t.objectStore("verses").clear();v.forEach(x=>t.objectStore("verses").put(x));t.objectStore("meta").put({key:"bible",file:file.name,count:v.length,at:new Date().toISOString()});t.oncomplete=res;t.onerror=()=>rej(t.error)});return v.length;
}
function parseRef(q){const m=String(q).trim().match(/^(.+?)\s+(\d+)(?::(\d+)(?:-(\d+))?)?$/);return m?{book:m[1].toLowerCase(),chapter:+m[2],a:m[3]?+m[3]:null,b:m[4]?+m[4]:(m[3]?+m[3]:null)}:null}
async function bibleRef(q){const p=parseRef(q),a=await dbAll("verses");if(!p)return[];return a.filter(v=>v.book.toLowerCase()===p.book&&v.chapter===p.chapter&&(p.a==null||(v.verse>=p.a&&v.verse<=p.b))).sort((x,y)=>x.verse-y.verse)}
async function bibleSearch(q){const t=q.toLowerCase(),a=await dbAll("verses");return a.filter(v=>v.text.toLowerCase().includes(t)).slice(0,200)}
function formatVerses(a){return a.map(v=>`${v.ref} — ${v.text}`).join("\n")}
async function initBibleUI(){let current=[];$("#bImport").onclick=async()=>{const f=$("#bFile").files[0];if(!f)return alert("Escolha um arquivo.");try{$("#bOut").textContent=`Importados ${await importBible(f)} versículos.`}catch(e){$("#bOut").textContent=e.message}};$("#bMeta").onclick=async()=>{const a=await dbAll("verses");$("#bOut").textContent=`Versículos locais: ${a.length}`};$("#bOpen").onclick=async()=>{current=await bibleRef($("#bRef").value);$("#bOut").textContent=formatVerses(current)||"Nada encontrado."};$("#bFind").onclick=async()=>{current=await bibleSearch($("#bSearch").value);$("#bOut").textContent=formatVerses(current)||"Nada encontrado."};$("#bSend").onclick=()=>{if(!current.length)return alert("Abra uma passagem.");Store.set("bibleSelection",current);Store.set("studioPrefill",formatVerses(current));render("studio").then(()=>$("#fText").value=formatVerses(current))};$("#bConcordance").onclick=async()=>{const q=$("#bSearch").value.trim();current=await bibleSearch(q);$("#bOut").textContent=`CONCORDÂNCIA: ${q}\nOcorrências: ${current.length}\n\n${formatVerses(current)}`};}

function bindNav(){
 $$('[data-view]').forEach(b=>b.onclick=()=>render(b.dataset.view));
}
async function clearOldFrontendCache(){
 try{
   if("serviceWorker" in navigator){
     const regs=await navigator.serviceWorker.getRegistrations();
     await Promise.all(regs.map(r=>r.unregister()));
   }
   if("caches" in window){
     const keys=await caches.keys();
     await Promise.all(keys.filter(k=>k.startsWith("logos-master-x")).map(k=>caches.delete(k)));
   }
 }catch(e){}
}

const APP_BUILD_VERSION="3.7.6";
function publicAsset(path){return "/"+String(path).replace(/^\/+/,"");}
const PRODUCTION_VERSION_URL="https://logos-master-x.netlify.app/version.json";
function showUpdateBanner(remoteVersion){
 if(document.getElementById("logosUpdateBanner")) return;
 const bar=document.createElement("div");
 bar.id="logosUpdateBanner";
 bar.style.cssText="position:fixed;left:50%;bottom:18px;transform:translateX(-50%);z-index:99999;background:#111827;color:#fff;border:1px solid rgba(255,255,255,.18);box-shadow:0 16px 40px rgba(0,0,0,.35);border-radius:16px;padding:12px 14px;display:flex;gap:12px;align-items:center;max-width:calc(100vw - 24px);font:600 14px system-ui";
 bar.innerHTML='<span>🚀 Nova versão '+escapeHtml(remoteVersion)+' disponível</span><button id="logosUpdateNow" style="border:0;border-radius:10px;padding:9px 12px;font-weight:800;cursor:pointer">Atualizar agora</button>';
 document.body.appendChild(bar);
 document.getElementById("logosUpdateNow").onclick=async()=>{await forceFrontendRefresh(remoteVersion)};
}
async function forceFrontendRefresh(remoteVersion){
 try{
   if("serviceWorker" in navigator){const regs=await navigator.serviceWorker.getRegistrations();await Promise.all(regs.map(r=>r.unregister()));}
   if("caches" in window){const keys=await caches.keys();await Promise.all(keys.map(k=>caches.delete(k)));}
 }catch(e){}
 try{localStorage.setItem("logosLastBuild",remoteVersion||APP_BUILD_VERSION)}catch(e){}
 const u=new URL(location.href);u.searchParams.set("build",remoteVersion||Date.now());location.replace(u.toString());
}
async function checkFrontendVersion(showResult=false){
 try{
   const source=(IS_LOCAL_HOST?PRODUCTION_VERSION_URL:publicAsset("version.json"))+"?t="+Date.now();
   const r=await fetch(source,{cache:"no-store",headers:{"Cache-Control":"no-cache"}});
   if(!r.ok)throw new Error("HTTP "+r.status);
   const j=await r.json();const remote=String(j.version||"").trim();
   if(!remote)throw new Error("versão não informada");
   if(remote!==APP_BUILD_VERSION){showUpdateBanner(remote);if(showResult)actionModal({icon:'🚀',title:'Nova versão '+remote+' disponível',message:'Você está usando '+APP_BUILD_VERSION+'. Deseja instalar a versão publicada agora?',actions:[{label:'⬆️ Atualizar agora',kind:'primary',run:()=>forceFrontendRefresh(remote)},{label:'Depois'}]});return {update:true,remote};}
   if(showResult)actionModal({icon:'✓',title:'LOGOS atualizado',message:'Você já está usando a versão mais recente — '+APP_BUILD_VERSION+'.',actions:[{label:'Fechar',kind:'primary'}]});
   try{localStorage.setItem("logosCurrentBuild",APP_BUILD_VERSION)}catch(e){}
   return {update:false,remote};
 }catch(e){if(showResult)actionModal({icon:'!',title:'Não foi possível verificar',message:'A versão publicada não pôde ser consultada agora. '+e.message,actions:[{label:'Tentar novamente',kind:'primary',run:()=>checkFrontendVersion(true)},{label:'Fechar'}]});return {error:true};}
}


let deferredInstallPrompt=null;window.addEventListener('beforeinstallprompt',e=>{e.preventDefault();deferredInstallPrompt=e;});async function installPwa(){if(deferredInstallPrompt){deferredInstallPrompt.prompt();await deferredInstallPrompt.userChoice;deferredInstallPrompt=null;return}actionModal({icon:'📲',title:'Instalar LOGOS MASTER X',message:'No Android/Chrome ou Edge, abra o menu do navegador e escolha “Instalar aplicativo” ou “Adicionar à tela inicial”. Se já estiver instalado, nenhuma nova instalação é necessária.',actions:[{label:'Entendi',kind:'primary'}]});}
let autoPublishTimer=null;
async function devApi(path,opts={}){const r=await fetch(location.origin+path,{cache:"no-store",...opts});const j=await r.json().catch(()=>({}));if(!r.ok)throw new Error(j.detail||j.message||"Falha");return j;}
async function getProductionVersion(){try{const r=await fetch(PRODUCTION_VERSION_URL+"?t="+Date.now(),{cache:"no-store"});if(!r.ok)return "—";return String((await r.json()).version||"—")}catch{return "—"}}
async function openUpdateCenter(){let prod=await getProductionVersion(),dev=null;if(IS_LOCAL_HOST){try{dev=await devApi('/api/dev/status')}catch{}}const auto=Store.get('autoPublish',false);actionModal({icon:'🚀',title:'Update Center • LOGOS '+APP_BUILD_VERSION,message:IS_LOCAL_HOST?`Local ${APP_BUILD_VERSION} • Produção ${prod} • Git ${dev?.dirty?'com alterações':'limpo'} • Auto-publicar ${auto?'ON':'OFF'}`:`Instalada ${APP_BUILD_VERSION} • Disponível ${prod}`,actions:IS_LOCAL_HOST?[{label:'📋 Git status',close:false,run:async()=>{const x=await devApi('/api/dev/status');actionModal({icon:'Git',title:'Status local',message:(x.branch||'main')+' • '+(x.dirty?'Há alterações para publicar':'Tudo publicado')+(x.files?.length?' • '+x.files.length+' arquivo(s)':''),actions:[{label:'Fechar',kind:'primary'}]})}},{label:'🚀 Publicar agora',kind:'primary',close:false,run:async()=>{actionModal({icon:'↥',title:'Publicando '+APP_BUILD_VERSION,message:'Enviando alterações para GitHub. O Netlify publicará o commit automaticamente.',actions:[]});try{const x=await devApi('/api/dev/publish',{method:'POST'});actionModal({icon:'✓',title:'Enviado ao GitHub',message:(x.message||'Publicação concluída')+' • commit '+(x.commit||'—')+'. Aguarde o Netlify e use Verificar atualização.',actions:[{label:'Verificar produção',kind:'primary',run:openUpdateCenter},{label:'Fechar'}]})}catch(e){actionModal({icon:'!',title:'Falha ao publicar',message:e.message,actions:[{label:'Fechar',kind:'primary'}]})}}},{label:`⚙ Auto-publicar ${auto?'ON':'OFF'}`,run:()=>toggleAutoPublish(!auto)}]:[{label:'🔄 Verificar atualização',kind:'primary',close:false,run:()=>checkFrontendVersion(true)},{label:'⬆️ Atualizar agora',run:()=>forceFrontendRefresh(prod)}]});}
function toggleAutoPublish(on){Store.set('autoPublish',!!on);if(autoPublishTimer){clearInterval(autoPublishTimer);autoPublishTimer=null}if(on&&IS_LOCAL_HOST){autoPublishTimer=setInterval(async()=>{try{const s=await devApi('/api/dev/status');if(s.dirty)await devApi('/api/dev/publish',{method:'POST'})}catch(e){console.warn('Auto-publicar:',e.message)}},15000)}actionModal({icon:on?'✓':'○',title:'Auto-publicar '+(on?'ativado':'desativado'),message:on?'Enquanto esta página local estiver aberta, o LOGOS verificará alterações a cada 15 segundos e publicará no GitHub. Use somente quando quiser enviar mudanças automaticamente.':'As alterações só serão enviadas pelo botão Publicar agora.',actions:[{label:'Fechar',kind:'primary'}]});}
function installUpdateControls(){const tools=document.querySelector('.header-tools');if(tools&&!$('#updateCenterBtn')){const b=document.createElement('button');b.id='updateCenterBtn';b.className='top-tool update-center-top';b.textContent=IS_LOCAL_HOST?'↥ Atualizar':'↻ Atualizações';b.onclick=openUpdateCenter;tools.insertBefore(b,$('#status'));}if(!$('#updateDock')){const d=document.createElement('div');d.id='updateDock';d.className='update-dock';d.innerHTML=`<span>LOGOS ${APP_BUILD_VERSION}</span><button id="updateDockCheck">🔄 Verificar</button>${IS_LOCAL_HOST?'<button id="updateDockPublish">🚀 Publicar</button><button id="updateDockAuto">⚙ Auto</button>':'<button id="updateDockNow">⬆ Atualizar</button>'}`;document.body.appendChild(d);$('#updateDockCheck').onclick=()=>checkFrontendVersion(true);$('#updateDockPublish')&&($('#updateDockPublish').onclick=openUpdateCenter);$('#updateDockAuto')&&($('#updateDockAuto').onclick=()=>toggleAutoPublish(!Store.get('autoPublish',false)));$('#updateDockNow')&&($('#updateDockNow').onclick=openUpdateCenter);}if(IS_LOCAL_HOST&&Store.get('autoPublish',false))toggleAutoPublish(true);}

window.addEventListener("DOMContentLoaded",async()=>{
 try{
   bindNav();
   $("#workspace").innerHTML='<div class="hero"><h1>LOGOS MASTER X</h1><p>Carregando sistema...</p></div>';
   await clearOldFrontendCache();
   await checkFrontendVersion();
   applyVisual();
$("#headerAppearance")?.addEventListener("click",openAppearance);$("#sideInstall")?.addEventListener("click",installPwa);
function closeMobileNav(){document.body.classList.remove("mobile-nav-open");$("#mobileNavBackdrop")?.remove();}
function toggleMobileNav(){if(document.body.classList.contains("mobile-nav-open")){closeMobileNav();return}document.body.classList.add("mobile-nav-open");if(!$("#mobileNavBackdrop")){const d=document.createElement("div");d.id="mobileNavBackdrop";d.className="mobile-nav-backdrop";d.addEventListener("click",closeMobileNav);document.body.appendChild(d)}}
function installMobileNav(){const staticBtn=$("#mobileNavToggleStatic");if(staticBtn)staticBtn.addEventListener("click",toggleMobileNav);const top=document.querySelector(".top");if(false&&top&&!$("#mobileNavToggle")){const b=document.createElement("button");b.id="mobileNavToggle";b.className="mobile-nav-toggle";b.setAttribute("aria-label","Abrir menu");b.innerHTML='<span>☰</span><small>Menu</small>';b.addEventListener("click",toggleMobileNav);top.insertBefore(b,top.firstChild)}document.querySelectorAll(".nav button[data-view]").forEach(b=>b.addEventListener("click",()=>{if(innerWidth<=760)closeMobileNav()}));window.addEventListener("resize",()=>{if(innerWidth>760)closeMobileNav()});}
installMobileNav();installUpdateControls();
const top=document.querySelector('.top');if(false&&top&&!document.querySelector('#aboutTopBtn')){const x=document.createElement('button');x.id='aboutTopBtn';x.className='top-mini';x.textContent='ⓘ Sobre';x.onclick=()=>render('about');top.insertBefore(x,document.querySelector('#status'));const i=document.createElement('button');i.id='installTopBtn';i.className='top-mini';i.textContent='📲 Instalar';i.onclick=installPwa;top.insertBefore(i,document.querySelector('#status'));}
const top2=document.querySelector(".top");if(false&&top2&&!document.querySelector("#appearanceBtn")){const b=document.createElement("button");b.id="appearanceBtn";b.className="btn secondary appearance-trigger";b.textContent="🎨 Aparência";b.onclick=openAppearance;top2.insertBefore(b,document.querySelector("#status"));}
render("dashboard");
   await checkApi();
 }catch(e){
   console.error("LOGOS startup error",e);
   const w=$("#workspace");
   if(w) w.innerHTML=`<h2>⚠️ Diagnóstico do LOGOS</h2><div class="output">Erro ao iniciar a interface:\n${escapeHtml(e?.stack||e?.message||String(e))}\n\nRecarregue com Ctrl+F5.</div>`;
 }
});

