(function(){
  "use strict";
  const $=(s,r=document)=>r.querySelector(s), esc=v=>String(v??"").replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
  const cfg={
    cross:{title:'Cadeias bíblicas',field:'#bxCrossSource',find:'#bxCrossLoad',items:['João 3:16','Isaías 53:5','Salmos 23:1','Romanos 5:8','Efésios 2:10']},
    strong:{title:'Palavras originais',field:'#bxStrongQuery',find:'#bxStrongFind',items:['G26 • amor','G3056 • logos','G4102 • fé','H430 • elohim','H2617 • hesed']},
    lexicon:{title:'Trilhas lexicais',field:'#bxLexQuery',find:'#bxLexFind',items:['amor','logos','fé','graça','paz']},
    context:{title:'Contexto conectado',field:'#bxContextQuery',find:'#bxContextFind',items:['João 3','Êxodo','Jerusalém','Corinto','exílio']},
    comments:{title:'Leitura e aplicação',field:'#bxCommentsQuery',find:'#bxCommentsFind',items:['João 3:16','restauração','fé','oração','santidade']},
    search:{title:'Pesquisa bíblica',field:'#bxSearchXQuery',find:'#bxSearchXFind',items:['amor','presença de Deus','restauração','fé','esperança']},
    global:{title:'Busca em toda a plataforma',field:'#bxGlobalQuery',find:'#bxGlobalFind',items:['Jerusalém','Paulo','aliança','oração','reino']},
    dossier:{title:'Dossiês prontos',field:'#bxDossierRef',find:'#bxDossierBuild',items:['João 3:16','Isaías 6:8','Salmos 23','Efésios 2:10']},
    workspace:{title:'Mesa de estudo',field:'#bxWorkRef',find:'#bxWorkLoad',items:['João 3:16','Isaías 53:5','Romanos 5:8']},
    parallel:{title:'Comparação rápida',field:'#bxParA',find:'#bxParLoad',items:['João 3:16','Romanos 5:8','Salmos 23','Efésios 2:10']}
  };
  function mount(name){const c=cfg[name],panel=$(`[data-bible-panel="${name}"]`);if(!c||!panel||$(`[data-bx-global-enrichment="${name}"]`,panel))return;const anchor=panel.querySelector('.bx-adv-head,.bx-cross-head,.bx-strong-head,.bx-lex-search,.bx-context-toolbar,.bx-comments-toolbar,.bx-search-x-options,.bx-global-reader-toolbar,.bx-parallel-toolbar,.bx-dossier,.bx-adv-card');if(!anchor)return;const rail=document.createElement('section');rail.className='bx-global-enrichment';rail.dataset.bxGlobalEnrichment=name;rail.innerHTML=`<div><b>✨ ${esc(c.title)}</b><small>Atalhos conectados aos bancos locais</small></div><nav>${c.items.map(item=>{const parts=item.split(' • ');return `<button type="button" data-global-query="${esc(parts[0])}">${esc(item)}</button>`}).join('')}</nav>`;anchor.after(rail);rail.addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;const f=$(c.field),go=$(c.find);if(f)f.value=b.dataset.globalQuery;if(name==='parallel'&&$("#bxParB"))$("#bxParB").value=name==='parallel'&&b.dataset.globalQuery==='João 3:16'?'Romanos 5:8':'João 3:16';go?.click()})}
  function init(){const observer=new MutationObserver(()=>Object.keys(cfg).forEach(mount));observer.observe(document.body,{childList:true,subtree:true});Object.keys(cfg).forEach(mount);document.addEventListener('biblex:pagechange',()=>Object.keys(cfg).forEach(mount))}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
