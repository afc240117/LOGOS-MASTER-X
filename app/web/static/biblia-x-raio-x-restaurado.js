/* LOGOS MASTER X — Bíblia X Raio X Restaurado v5.4.2.1 */
(()=>{
  'use strict';
  const VERSION='5.4.2.1';
  const TOOL_SELECTORS={
    bible:'[data-verse-bible]', parallel:'[data-verse-parallel]', cross:'[data-verse-tool="cross"]',
    strong:'[data-verse-tool="strong"]', lexicon:'[data-verse-tool="lexicon"]', comments:'[data-verse-tool="comments"]',
    context:'[data-verse-tool="context"]', atlas:'[data-verse-atlas]', media:'[data-verse-tool="media"]',
    dna:'[data-verse-tool="dna"]', studio:'[data-verse-studio]'
  };
  const escapeHtml=s=>String(s??'').replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
  const verseOf=tools=>tools.closest('[data-bx-v3-verse],.lmx-bible-v3-verse');
  const verseRef=verse=>verse?.dataset?.ref||verse?.querySelector('[data-ref]')?.dataset?.ref||'';
  const verseText=verse=>verse?.querySelector('.lmx-bible-v3-text,[data-bx-verse-text]')?.innerText?.trim()||'';
  const triggerTool=(verse,key)=>{
    const sel=TOOL_SELECTORS[key]; if(!sel)return false;
    const btn=verse?.querySelector(sel); if(!btn)return false;
    btn.click(); return true;
  };
  const closeModal=m=>{if(m)m.hidden=true};
  const openRaioX=verse=>{
    if(!verse)return;
    const ref=verseRef(verse),text=verseText(verse);
    let m=document.getElementById('bxRaioXVerseModal');
    if(!m){m=document.createElement('div');m.id='bxRaioXVerseModal';m.className='bx-raiox-modal';m.hidden=true;document.body.appendChild(m)}
    const actions=[
      ['cross','🔗 Referências'],['strong','🇬🇷🇮🇱 Strong'],['lexicon','📚 Léxico'],['comments','💬 Comentários'],
      ['context','🔎 Contexto'],['atlas','🗺️ Atlas'],['media','🎞 Mídia'],['dna','🧬 DNA K7'],['studio','⚡ Studio X']
    ];
    m.innerHTML=`<div class="bx-raiox-card" role="dialog" aria-modal="true" aria-label="Raio X do versículo">
      <header><div><small>BÍBLIA X • RAIO-X LOCAL</small><h3>🔭 Raio X • ${escapeHtml(ref||'Versículo')}</h3><p>Acesso rápido às ferramentas que aprofundam este versículo, sem alterar o texto bíblico.</p></div><button type="button" data-raiox-close aria-label="Fechar">×</button></header>
      <div class="bx-raiox-verse-text">${escapeHtml(text||'Texto do versículo')}</div>
      <div class="bx-raiox-actions">${actions.map(([k,l])=>`<button type="button" data-raiox-tool="${k}">${l}</button>`).join('')}</div>
      <footer><button type="button" data-raiox-discover>🔭 Descobertas da passagem</button><button type="button" data-raiox-close>Fechar</button></footer>
    </div>`;
    m.hidden=false;
    m.querySelectorAll('[data-raiox-close]').forEach(b=>b.onclick=()=>closeModal(m));
    m.onclick=e=>{if(e.target===m)closeModal(m)};
    m.querySelectorAll('[data-raiox-tool]').forEach(b=>b.onclick=()=>{const ok=triggerTool(verse,b.dataset.raioxTool);if(ok)closeModal(m)});
    m.querySelector('[data-raiox-discover]')?.addEventListener('click',()=>{
      const discover=document.querySelector('#bOut [data-v168-discover]');
      closeModal(m);
      if(discover)discover.click();
    });
  };
  const installInTools=tools=>{
    if(!tools||tools.querySelector('.bx-raiox-verse,[data-verse-raiox],[data-raio-x]'))return;
    const plus=tools.querySelector('[data-bx-verse-more],.lmx-bible-v3-more');
    if(!plus)return;
    const btn=document.createElement('button');
    btn.type='button';btn.className='bx-raiox-verse';btn.setAttribute('data-raiox-verse','');btn.title='Raio X do versículo';btn.innerHTML='🔭 Raio X';
    btn.addEventListener('click',e=>{e.preventDefault();e.stopPropagation();openRaioX(verseOf(tools))});
    plus.before(btn);
  };
  const scan=()=>document.querySelectorAll('#bOut .lmx-bible-v3-tools').forEach(installInTools);
  const start=()=>{
    scan();
    const host=document.getElementById('bOut')||document.body;
    const obs=new MutationObserver(muts=>{
      let rescan=false;
      for(const mu of muts){
        if(mu.type==='childList'&&mu.addedNodes.length){rescan=true;break}
        if(mu.type==='attributes'&&mu.target?.classList?.contains('bx-raiox-verse'))mu.target.hidden=false;
      }
      if(rescan)queueMicrotask(scan);
    });
    obs.observe(host,{childList:true,subtree:true,attributes:true,attributeFilter:['hidden']});
    window.__LOGOS_BIBLIA_RAIO_X__={version:VERSION,rescan:scan,open:openRaioX};
  };
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();
