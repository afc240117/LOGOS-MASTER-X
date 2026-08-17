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


/* V8.15 — padrões persistentes da Bíblia X */
(function(){
  try{
    if(localStorage.getItem("logosx:bibleXCleanReading")===null) Store.set("bibleXCleanReading",true);
    if(localStorage.getItem("logosx:bibleXZoom")===null) Store.set("bibleXZoom",100);
    if(localStorage.getItem("logosx:bibleXLastSection")===null) Store.set("bibleXLastSection","reader");
  }catch(_){}
})();
// Anti-travamento global do Studio X: recupera apenas estados temporários órfãos.
(function recoverStudioOnBoot(){
 try{
  const p=Store.get("studioProcessing",null);
  if(p&&p.status==="running"){
   const age=p.started?Date.now()-Date.parse(p.started):Infinity;
   if(!Number.isFinite(age)||age>120000){
    Store.set("studioProcessing",{status:"error",progress:0,phase:0,message:"Processamento anterior recuperado automaticamente.",started:null,finished:new Date().toISOString(),engine:"",provider:"",model:"",quality:null,error:"Sessão anterior interrompida.",generationId:""});
    if(Number(Store.get("studioStep",1))===6)Store.set("studioStep",5);
   }
  }
 }catch(e){}
})();
window.addEventListener("unhandledrejection",e=>{try{const p=Store.get("studioProcessing",null);if(p?.status==="running"&&Number(Store.get("studioStep",1))===6)Store.set("studioProcessing",Object.assign({},p,{status:"error",progress:0,phase:0,message:"Falha recuperada sem bloquear a interface.",finished:new Date().toISOString(),error:String(e.reason?.message||e.reason||"Erro assíncrono"),generationId:""}))}catch(_){} });
function logosPercentColor(v){
 v=Math.max(0,Math.min(100,Number(v)||0));
 // 0 vermelho -> 50 amarelo -> 100 verde
 const hue=Math.round(v*1.2);
 return `hsl(${hue} 92% 50%)`;
}
let mobileLoadingProgress=8;let mobileLoadingTimer=null;const mobileLoadingStartedAt=performance.now();
let __journeyAudioCtx=null;
function playApprovedHomeJourneySound(){
  try{
    const AC=window.AudioContext||window.webkitAudioContext;if(!AC)return false;
    const c=__journeyAudioCtx||(__journeyAudioCtx=new AC());
    if(c.state==='suspended'){window.__logosJourneyAudioPending=true;return false;}
    window.__logosJourneyAudioPending=false;
    const n=c.currentTime;
    const out=c.createGain();out.gain.setValueAtTime(.0001,n);out.gain.exponentialRampToValueAtTime(.18,n+.06);out.gain.setValueAtTime(.16,n+3.55);out.gain.exponentialRampToValueAtTime(.0001,n+4.08);out.connect(c.destination);
    const connectPan=(node,from,to,start,dur)=>{if(typeof c.createStereoPanner!=='function'){node.connect(out);return;}const p=c.createStereoPanner();p.pan.setValueAtTime(from,n+start);p.pan.linearRampToValueAtTime(to,n+start+dur);node.connect(p);p.connect(out)};
    // fluxo principal: DNA -> fitas/K7 -> retorno -> DNA -> Bíblia
    const sweep=c.createOscillator();sweep.type='sine';sweep.frequency.setValueAtTime(180,n);sweep.frequency.exponentialRampToValueAtTime(620,n+.72);sweep.frequency.exponentialRampToValueAtTime(360,n+1.60);sweep.frequency.exponentialRampToValueAtTime(250,n+2.55);sweep.frequency.exponentialRampToValueAtTime(880,n+3.55);sweep.frequency.exponentialRampToValueAtTime(1320,n+3.98);const sg=c.createGain();sg.gain.setValueAtTime(.035,n);sg.gain.linearRampToValueAtTime(.075,n+.7);sg.gain.linearRampToValueAtTime(.045,n+2.45);sg.gain.linearRampToValueAtTime(.10,n+3.88);sweep.connect(sg);connectPan(sg,-.15,.58,0,3.95);sweep.start(n);sweep.stop(n+4.04);
    // sopro de luz contínuo, filtrado, seguindo o percurso
    const src=c.createBufferSource(),buf=c.createBuffer(1,Math.floor(c.sampleRate*4.15),c.sampleRate),d=buf.getChannelData(0);for(let i=0;i<d.length;i++)d[i]=(Math.random()*2-1)*.20;src.buffer=buf;const bp=c.createBiquadFilter();bp.type='bandpass';bp.frequency.setValueAtTime(320,n);bp.frequency.exponentialRampToValueAtTime(1250,n+1.2);bp.frequency.exponentialRampToValueAtTime(620,n+2.4);bp.frequency.exponentialRampToValueAtTime(2400,n+3.95);bp.Q.value=.8;const ng=c.createGain();ng.gain.setValueAtTime(.0001,n);ng.gain.exponentialRampToValueAtTime(.07,n+.08);ng.gain.setValueAtTime(.05,n+3.45);ng.gain.exponentialRampToValueAtTime(.0001,n+4.08);src.connect(bp);bp.connect(ng);connectPan(ng,-.75,.72,0,4.0);src.start(n);src.stop(n+4.1);
    // três fitas douradas, em sequência
    [0.82,1.02,1.22].forEach((dt,j)=>{const o=c.createOscillator(),g=c.createGain();o.type='triangle';o.frequency.setValueAtTime(480+j*120,n+dt);o.frequency.exponentialRampToValueAtTime(760+j*150,n+dt+.16);g.gain.setValueAtTime(.0001,n+dt);g.gain.exponentialRampToValueAtTime(.11,n+dt+.018);g.gain.exponentialRampToValueAtTime(.0001,n+dt+.20);o.connect(g);connectPan(g,.25-j*.25,-.55+j*.18,dt,.2);o.start(n+dt);o.stop(n+dt+.22)});
    // duas bobinas K7 + breve pausa viva
    [1.48,1.66].forEach((dt,j)=>{const o=c.createOscillator(),g=c.createGain();o.type='sine';o.frequency.setValueAtTime(j?720:610,n+dt);o.frequency.exponentialRampToValueAtTime(j?980:840,n+dt+.08);g.gain.setValueAtTime(.0001,n+dt);g.gain.exponentialRampToValueAtTime(.14,n+dt+.012);g.gain.exponentialRampToValueAtTime(.0001,n+dt+.18);o.connect(g);connectPan(g,j?.15:-.45,j?.35:-.25,dt,.18);o.start(n+dt);o.stop(n+dt+.20)});
    // retorno pelas fitas
    [2.18,2.38,2.58].forEach((dt,j)=>{const o=c.createOscillator(),g=c.createGain();o.type='triangle';o.frequency.setValueAtTime(760-j*95,n+dt);o.frequency.exponentialRampToValueAtTime(430-j*55,n+dt+.16);g.gain.setValueAtTime(.0001,n+dt);g.gain.exponentialRampToValueAtTime(.085,n+dt+.015);g.gain.exponentialRampToValueAtTime(.0001,n+dt+.18);o.connect(g);connectPan(g,-.55+j*.18,.20+j*.16,dt,.18);o.start(n+dt);o.stop(n+dt+.20)});
    // brilho final da Bíblia: clarão + impacto curto
    const bell=c.createOscillator(),bg=c.createGain();bell.type='sine';bell.frequency.setValueAtTime(760,n+3.55);bell.frequency.exponentialRampToValueAtTime(1900,n+3.94);bg.gain.setValueAtTime(.0001,n+3.52);bg.gain.exponentialRampToValueAtTime(.16,n+3.66);bg.gain.exponentialRampToValueAtTime(.0001,n+4.14);bell.connect(bg);bg.connect(out);bell.start(n+3.52);bell.stop(n+4.15);
    const hit=c.createOscillator(),hg=c.createGain();hit.type='sine';hit.frequency.setValueAtTime(145,n+3.78);hit.frequency.exponentialRampToValueAtTime(62,n+4.06);hg.gain.setValueAtTime(.0001,n+3.76);hg.gain.exponentialRampToValueAtTime(.23,n+3.80);hg.gain.exponentialRampToValueAtTime(.0001,n+4.13);hit.connect(hg);hg.connect(out);hit.start(n+3.76);hit.stop(n+4.15);
    return true;
  }catch(e){return false}
}

function startMobileLoading(){const el=document.getElementById('mobileLoadingBar');if(!el)return;mobileLoadingTimer=setInterval(()=>{mobileLoadingProgress=Math.min(92,mobileLoadingProgress+Math.max(1,(92-mobileLoadingProgress)*.08));el.style.width=mobileLoadingProgress+'%';},120);}
function finishMobileLoading(){
 if(mobileLoadingTimer){clearInterval(mobileLoadingTimer);mobileLoadingTimer=null}
 const el=document.getElementById('mobileLoadingBar');
 if(el)el.style.width='100%';
 const minVisible=120;
 const wait=Math.max(180,minVisible-(performance.now()-mobileLoadingStartedAt));
 setTimeout(()=>{
   const splash=document.getElementById('mobileLoading');
   const startHomeFx=()=>{
     const host=window.matchMedia('(max-width:760px)').matches
       ? document.querySelector('.mobile-home-piece.mobile-home-hero')
       : document.querySelector('.reference-body-wrap.desktop-reference-home');
     if(!host || host.querySelector('.dna-canvas-fx-427')) return;
     window.__logosHomeFxStartedAt=performance.now();
     playApprovedHomeJourneySound();
     window.__logosReplayHomeJourney=()=>{try{document.querySelector('.dna-canvas-fx-427')?.remove();requestAnimationFrame(startHomeFx)}catch(e){}};

     const canvas=document.createElement('canvas');
     canvas.className='dna-canvas-fx-427';
     canvas.width=1313;
     canvas.height=946;
     canvas.setAttribute('aria-hidden','true');
     host.appendChild(canvas);

     const ctx=canvas.getContext('2d');
     const css=getComputedStyle(document.documentElement);
     const parseRgb=(name,fallback)=>{
       const raw=(css.getPropertyValue(name)||'').trim();
       const parts=raw.split(',').map(v=>parseFloat(v));
       return parts.length>=3&&parts.every(Number.isFinite)?parts:fallback;
     };
     const p=parseRgb('--theme-primary-rgb',[32,225,223]);
     const s=parseRgb('--theme-secondary-rgb',[226,171,54]);
     const rgba=(rgb,a)=>`rgba(${rgb[0]},${rgb[1]},${rgb[2]},${a})`;

     const W=1313,H=946;
     const start=performance.now();
     const duration=4000; /* fluxo aprovado sincronizado em ~4 segundos */

     const bez=(a,b,c,d,t)=>{
       const u=1-t;
       return {
         x:u*u*u*a.x+3*u*u*t*b.x+3*u*t*t*c.x+t*t*t*d.x,
         y:u*u*u*a.y+3*u*u*t*b.y+3*u*t*t*c.y+t*t*t*d.y
       };
     };

     /* Trajetórias calibradas sobre o DNA REAL da arte 1313x946.
        Não desenhamos uma nova hélice: só usamos estas curvas como guia de luz. */
     const green=[
       [{x:313,y:46},{x:332,y:82},{x:365,y:118},{x:417,y:165}],
       [{x:417,y:165},{x:457,y:200},{x:430,y:240},{x:367,y:284}],
       [{x:367,y:284},{x:340,y:306},{x:348,y:339},{x:425,y:373}]
     ];
     const gold=[
       [{x:548,y:45},{x:534,y:84},{x:500,y:122},{x:446,y:166}],
       [{x:446,y:166},{x:406,y:201},{x:431,y:240},{x:496,y:282}],
       [{x:496,y:282},{x:524,y:307},{x:514,y:340},{x:430,y:373}]
     ];

     const pointOn=(segments,t)=>{
       t=Math.max(0,Math.min(0.9999,t));
       const q=t*segments.length, i=Math.floor(q), lt=q-i;
       const seg=segments[Math.min(i,segments.length-1)];
       return bez(seg[0],seg[1],seg[2],seg[3],lt);
     };

     const glowDot=(x,y,r,rgb,a)=>{
       const g=ctx.createRadialGradient(x,y,0,x,y,r);
       g.addColorStop(0,`rgba(255,255,255,${Math.min(1,a*1.3)})`);
       g.addColorStop(.12,rgba(rgb,a));
       g.addColorStop(.42,rgba(rgb,a*.42));
       g.addColorStop(1,rgba(rgb,0));
       ctx.fillStyle=g;
       ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.fill();
     };

     const softEllipse=(x,y,rx,ry,rgb,a)=>{
       ctx.save();
       ctx.translate(x,y);ctx.scale(rx,ry);
       const g=ctx.createRadialGradient(0,0,0,0,0,1);
       g.addColorStop(0,rgba(rgb,a));
       g.addColorStop(.38,rgba(rgb,a*.38));
       g.addColorStop(1,rgba(rgb,0));
       ctx.fillStyle=g;ctx.beginPath();ctx.arc(0,0,1,0,Math.PI*2);ctx.fill();
       ctx.restore();
     };

     const drawTravel=(segments,progress,rgb,intensity)=>{
       const head=pointOn(segments,progress);
       for(let k=0;k<11;k++){
         const tt=Math.max(0,progress-k*.018);
         const q=pointOn(segments,tt);
         glowDot(q.x,q.y,18-k*.9,rgb,intensity*(1-k/13));
       }
       glowDot(head.x,head.y,34,rgb,intensity);
     };

     const drawRibbonTrail=(segments,progress,rgb,intensity,reverse=false)=>{
       if(reverse)segments=segments.slice().reverse();
       const head=pointOn(segments,progress);
       ctx.save();
       ctx.globalCompositeOperation='lighter';
       for(let k=0;k<15;k++){
         const tt=Math.max(0,progress-k*.016);
         const q=pointOn(segments,tt);
         glowDot(q.x,q.y,14-k*.45,rgb,intensity*(1-k/17));
       }
       glowDot(head.x,head.y,25,rgb,intensity);
       ctx.restore();
     };

     /* As três fitas douradas reais que saem do conjunto DNA/K7.
        Os pontos foram calibrados na arte 1313x946. */
     const ribbon1=[
       [{x:435,y:314},{x:400,y:292},{x:355,y:286},{x:318,y:272}],
       [{x:318,y:272},{x:287,y:258},{x:275,y:244},{x:252,y:250}]
     ];
     const ribbon2=[
       [{x:430,y:332},{x:389,y:352},{x:350,y:323},{x:315,y:311}],
       [{x:315,y:311},{x:281,y:300},{x:264,y:336},{x:230,y:322}],
       [{x:230,y:322},{x:205,y:312},{x:205,y:286},{x:237,y:273}]
     ];
     const ribbon3=[
       [{x:422,y:347},{x:378,y:326},{x:347,y:352},{x:305,y:340}],
       [{x:305,y:340},{x:267,y:328},{x:250,y:350},{x:215,y:338}],
       [{x:215,y:338},{x:176,y:326},{x:170,y:301},{x:198,y:286}],
       [{x:198,y:286},{x:218,y:272},{x:232,y:266},{x:248,y:260}]
     ];

     const drawK7=(u)=>{
       if(u<=0||u>=1)return;
       const e=Math.sin(Math.PI*u);
       softEllipse(170,194,150,105,s,e*.34);
       softEllipse(170,194,120,80,p,e*.18);
       glowDot(138,185,38,s,e*.85);
       glowDot(221,196,38,s,e*.85);
       // HOTFIX 4.2.9: removido o reflexo vertical branco esquerda -> direita.
       // Mantém somente a intensificação localizada da K7 e das bobinas.
     };

     const drawTitleGlow=(u,finalPass=false)=>{
       if(u<=0||u>=1)return;

       const orbit=(cx,cy,rx,ry,q,reverse,rgb)=>{
         const ang=(reverse?-1:1)*q*Math.PI*2;
         // um único ponto principal + cauda curta alinhada
         for(let k=7;k>=0;k--){
           const aa=ang-(reverse?-1:1)*k*.12;
           const fade=(1-k/9);
           glowDot(cx+Math.cos(aa)*rx,cy+Math.sin(aa)*ry,
                   10+k*.25,rgb,fade*.68);
         }
         glowDot(cx+Math.cos(ang)*rx,cy+Math.sin(ang)*ry,17,rgb,.98);
       };

       // 360° sobre o X — ~0,50 s.
       if(u<.25){
         const q=u/.25;
         orbit(1015,185,42,54,q,false,s);
         return;
       }

       // LOGOS — primeiro movimento 360° — ~0,50 s.
       if(u<.50){
         const q=(u-.25)/.25;
         orbit(845,190,150,34,q,true,p);
         return;
       }

       // LOGOS — segundo movimento 360° — ~0,50 s, sentido contrário.
       if(u<.75){
         const q=(u-.50)/.25;
         orbit(845,190,150,34,q,false,s);
         return;
       }

       // Vai diretamente ao topo do DNA.
       const q=(u-.75)/.25;
       const p0={x:695,y:190},p1={x:650,y:145},p2={x:590,y:78},p3={x:525,y:55};
       const z=bez(p0,p1,p2,p3,q);
       for(let k=7;k>=0;k--){
         const qq=Math.max(0,q-k*.035);
         const zz=bez(p0,p1,p2,p3,qq);
         glowDot(zz.x,zz.y,11,s,(1-k/9)*.66);
       }
       glowDot(z.x,z.y,17,s,.96);
     };

     const drawMenuFlow=(u)=>{
       if(u<=0||u>=1)return;
       const e=Math.sin(Math.PI*u);

       // Somente a faixa inferior mostrada na imagem:
       // BÍBLIA -> ESTUDO -> PREGAÇÃO -> AVIVAMENTO.
       const p0={x:260,y:760},p1={x:465,y:760},p2={x:710,y:760},p3={x:950,y:760};
       for(let k=0;k<13;k++){
         const tt=Math.max(0,u-k*.024);
         const q=bez(p0,p1,p2,p3,tt);
         glowDot(q.x,q.y,15-k*.55,k%2?s:p,e*(1-k/15)*.70);
       }
       const q=bez(p0,p1,p2,p3,Math.min(1,u));
       glowDot(q.x,q.y,26,s,e*.84);

       const centers=[
         {x:285,y:760},{x:505,y:760},{x:720,y:760},{x:930,y:760}
       ];
       centers.forEach((pt,i)=>{
         const target=.06+i*.30;
         const hit=Math.max(0,1-Math.abs(u-target)/.10);
         if(hit>0)glowDot(pt.x,pt.y,30,s,hit*.68);
       });
     };

     const drawConnector=(u,a,b,c,d,rgb,intensity)=>{
       if(u<=0||u>=1)return;
       const e=Math.sin(Math.PI*u);
       for(let k=0;k<10;k++){
         const tt=Math.max(0,u-k*.024);
         const q=bez(a,b,c,d,tt);
         glowDot(q.x,q.y,16-k*.6,rgb,e*(1-k/12)*intensity);
       }
     };

     const drawBible=(u)=>{
       if(u<=0||u>=1)return;
       const e=Math.sin(Math.PI*Math.min(1,u));
       softEllipse(430,404,180,90,s,e*.55);
       softEllipse(430,404,135,65,p,e*.28);
       glowDot(430,386,55,s,e*.95);
       // raios que nascem no centro das páginas
       ctx.save();ctx.translate(430,396);
       ctx.globalCompositeOperation='lighter';
       for(let i=-4;i<=4;i++){
         const ang=-Math.PI/2+i*.13;
         const len=110+Math.abs(i)*18;
         const g=ctx.createLinearGradient(0,0,Math.cos(ang)*len,Math.sin(ang)*len);
         g.addColorStop(0,`rgba(255,255,255,${e*.72})`);
         g.addColorStop(.25,rgba(s,e*.42));
         g.addColorStop(1,rgba(s,0));
         ctx.strokeStyle=g;ctx.lineWidth=3.5-Math.abs(i)*.22;
         ctx.beginPath();ctx.moveTo(0,0);ctx.lineTo(Math.cos(ang)*len,Math.sin(ang)*len);ctx.stroke();
       }
       ctx.restore();
       if(u>.58){
         const c=(u-.58)/.42;
         glowDot(430,395,105+110*c,s,Math.min(1,c*1.25));
         glowDot(430,395,72+70*c,p,Math.min(.8,c));
       }
     };

     const frame=(now)=>{
       const t=(now-start)/duration;
       ctx.clearRect(0,0,W,H);
       ctx.globalCompositeOperation='lighter';

       // 1 — INÍCIO NO TOPO DO DNA / primeira descida completa.
       const dnaT=Math.min(1,Math.max(0,t/.16));
       if(t<.18){
         const pulse=.24+.46*Math.sin(Math.PI*Math.min(1,dnaT));
         softEllipse(430,205,190,190,p,pulse*.24);
         softEllipse(430,205,180,185,s,pulse*.18);
         drawTravel(green,Math.min(1,dnaT*1.02),p,1.0);
         drawTravel(gold,Math.min(1,Math.max(0,dnaT-.05)*1.08),s,1.0);
       }
       if(t>.035 && t<.18){
         const u=(t-.035)/.145;
         drawTravel(green,Math.min(1,u),p,.62);
         drawTravel(gold,Math.min(1,u),s,.62);
       }

       // DNA -> entrada das fitas douradas.
       if(t>.155 && t<.215){
         const u=(t-.155)/.06;
         drawConnector(u,{x:430,y:370},{x:425,y:430},{x:360,y:365},{x:315,y:325},s,.88);
       }

       // 2 — IDA pelas três fitas douradas, suave.
       if(t>.195 && t<.365){
         const u=(t-.195)/.17;
         const sm=u*u*(3-2*u);
         drawRibbonTrail(ribbon1,Math.min(1,sm*1.06),s,.94);
         drawRibbonTrail(ribbon2,Math.min(1,Math.max(0,sm-.07)*1.12),s,.92);
         drawRibbonTrail(ribbon3,Math.min(1,Math.max(0,sm-.14)*1.18),s,.90);
       }

       // 3 — entra por baixo da K7.
       if(t>.34 && t<.395){
         const u=(t-.34)/.055;
         drawConnector(u,{x:238,y:292},{x:210,y:278},{x:185,y:250},{x:180,y:225},s,.98);
       }

       // 4 — duas bobinas acendem.
       drawK7((t-.37)/.07);
       if(t>.385 && t<.47){
         const u=(t-.385)/.085;
         const e=.78+.22*Math.sin(Math.PI*5*u);
         glowDot(138,185,42,s,e);
         glowDot(221,196,42,s,e);
         softEllipse(180,205,122,69,s,.30+.09*Math.sin(Math.PI*3*u));
       }

       // 5 — breve pausa / comunicação dentro da fita.
       if(t>=.445 && t<.525){
         const u=(t-.445)/.08;
         const breathe=.84+.16*Math.sin(Math.PI*2*u);
         glowDot(138,185,45,s,breathe);
         glowDot(221,196,45,s,breathe);
         softEllipse(180,205,130,73,s,.35*breathe);
       }

       // 6 — sai por baixo para iniciar a volta.
       if(t>.505 && t<.555){
         const u=(t-.505)/.05;
         drawConnector(u,{x:180,y:225},{x:180,y:250},{x:205,y:276},{x:238,y:292},s,1.0);
       }

       // 7 — retorna pelas mesmas três fitas em sentido inverso.
       if(t>.535 && t<.705){
         const u=(t-.535)/.17;
         const sm=u*u*(3-2*u);
         if(sm<.34){
           drawRibbonTrail(ribbon3,Math.min(1,sm/.34),s,1.0,true);
         }else if(sm<.67){
           drawRibbonTrail(ribbon2,Math.min(1,(sm-.34)/.33),s,1.0,true);
         }else{
           drawRibbonTrail(ribbon1,Math.min(1,(sm-.67)/.33),s,1.0,true);
         }
       }

       // 8 — energia volta ao TOPO do DNA.
       if(t>.68 && t<.755){
         const u=(t-.68)/.075;
         drawConnector(u,{x:315,y:325},{x:355,y:270},{x:410,y:125},{x:430,y:52},s,.98);
       }

       // 9 — SEGUNDA DESCIDA pelo DNA, agora em direção à Bíblia.
       if(t>.735 && t<.89){
         const u=(t-.735)/.155;
         const sm=u*u*(3-2*u);
         softEllipse(430,205,176,184,s,.10+.12*Math.sin(Math.PI*sm));
         drawTravel(green,Math.min(1,sm*1.02),p,1.0);
         drawTravel(gold,Math.min(1,Math.max(0,sm-.04)*1.08),s,1.0);
       }

       // DNA -> centro da Bíblia aberta.
       if(t>.865 && t<.925){
         const u=(t-.865)/.06;
         drawConnector(u,{x:430,y:370},{x:432,y:378},{x:432,y:387},{x:430,y:395},s,1.0);
       }

       // Áudio sincronizado ao percurso aprovado (só toca após a primeira interação do usuário).
       if(typeof homeFlashSound === "function"){
         const audioStage=t<.27?0:t<.46?1:t<.67?2:t<.88?3:4;
         if(frame._audioStage!==audioStage){frame._audioStage=audioStage;homeFlashSound(audioStage===4?.96:Math.min(.84,t));}
       }

       // 10 — Bíblia: clímax final forte, com ênfase sustentada.
       drawBible((t-.90)/.10);
       if(t>.915 && t<.995){
         const u=(t-.915)/.08;
         const rise=Math.min(1,u/.30);
         const fall=u<.72?1:Math.max(0,(1-u)/.28);
         const e=rise*fall;
         softEllipse(430,395,180,100,s,e*.38);
         softEllipse(430,395,140,78,p,e*.22);
         glowDot(430,390,64,s,e);
       }

       if(t<1){
         requestAnimationFrame(frame);
       }else{
         canvas.classList.add('is-ending');
         setTimeout(()=>canvas.remove(),500);
       }
     };
     requestAnimationFrame(frame);
   };
   if(splash){
     splash.classList.add('is-done');
     setTimeout(()=>{splash.remove();requestAnimationFrame(()=>requestAnimationFrame(startHomeFx));},620);
   }else{
     requestAnimationFrame(()=>requestAnimationFrame(startHomeFx));
   }
 },wait);
}
// Loading visual desativado na V9.5.

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
const ROUTER_PROFILE_VERSION="3.5.1-fallback";
let _savedProvider=Store.get("aiProvider","auto"), _savedMode=Store.get("aiMode","automatico");
if(Store.get("routerProfileVersion","")!==ROUTER_PROFILE_VERSION){_savedProvider="auto";_savedMode="automatico";Store.set("aiProvider",_savedProvider);Store.set("aiMode",_savedMode);Store.set("routerProfileVersion",ROUTER_PROFILE_VERSION);}
const App={view:"dashboard",server:false,api:SAFE_API,provider:_savedProvider,aiMode:_savedMode,model:Store.get("aiModel",""),health:null,metrics:null,currentText:"",lastStudioText:"",timer:null,timerStart:0,timerSeconds:0};

const AUDIENCES=["Igreja local","Público misto","Pessoas sem Cristo","Novos convertidos","Jovens e adolescentes","Crianças","Casais","Culto de Varões","Círculo de Oração","Liderança e obreiros","Pastores e líderes","Missionários e evangelistas","Pessoas em luto","Pessoas em crise ou sofrimento","Pessoal / devocional individual","EBD / estudantes da Bíblia"];
const CULT_TYPES=["Avivamento","Doutrina / Ensino","Santa Ceia","Missões","Evangelístico","Oração e Intercessão","Consagração","Ação de Graças","Batismo","Culto Fúnebre / Consolo","Vigília","Conferência / Encontro","Culto ao Ar Livre","Celebração Especial"];
const MODE_ESTIMATES={rapido:"~25–45 s",economico:"~45–120 s",automatico:"~30–60 s",qualidade:"~40–90 s"};
function modeAverage(mode){const a=Store.get("modeTimes:"+mode,[]);if(!a.length)return "Sem média ainda";return `Média recente: ${Math.round(a.reduce((x,y)=>x+y,0)/a.length)} s`;}
function saveModeTime(mode,seconds){if(!Number.isFinite(seconds)||seconds<=0)return;const a=Store.get("modeTimes:"+mode,[]);a.unshift(seconds);Store.set("modeTimes:"+mode,a.slice(0,8));}
const VISUAL_DEFAULT={layout:"classico",theme:"dark",accent:"#d6b25e",mobileLayout:"mobile-pro",appIcon:"fixed",palette:"bluegold"};
const COLOR_THEMES={
  bluegold:{id:"bluegold",name:"Azul + Dourado",category:"degrade",thumb:"/static/brand/themes/bluegold-thumb.jpg",home:"/static/brand/themes/bluegold-body.jpg",mobile:"/static/brand/mobile-themes/bluegold",accent:"#2896ff",secondary:"#f0b632"},
  cyan:{id:"cyan",name:"Ciano Neon",category:"unica",thumb:"/static/brand/themes/cyan-thumb.jpg",home:"/static/brand/themes/cyan-body.jpg",mobile:"/static/brand/mobile-themes/cyan",accent:"#17e5e2",secondary:"#66bfff"},
  greengold:{id:"greengold",name:"Verde + Dourado",category:"degrade",thumb:"/static/brand/themes/greengold-thumb.jpg",home:"/static/brand/themes/greengold-body.jpg",mobile:"/static/brand/mobile-themes/greengold",accent:"#70ee22",secondary:"#efbd32"},
  purplegold:{id:"purplegold",name:"Roxo + Dourado",category:"degrade",thumb:"/static/brand/themes/purplegold-thumb.jpg",home:"/static/brand/themes/purplegold-body.jpg",mobile:"/static/brand/mobile-themes/purplegold",accent:"#bb58ff",secondary:"#efb742"},
  goldblue:{id:"goldblue",name:"Dourado + Azul",category:"degrade",thumb:"/static/brand/themes/goldblue-thumb.jpg",home:"/static/brand/themes/goldblue-body.jpg",mobile:"/static/brand/mobile-themes/goldblue",accent:"#eeb62c",secondary:"#299cff"},
  purplecyan:{id:"purplecyan",name:"Roxo + Ciano",category:"degrade",thumb:"/static/brand/themes/purplecyan-thumb.jpg",home:"/static/brand/themes/purplecyan-body.jpg",mobile:"/static/brand/mobile-themes/purplecyan",accent:"#d832ff",secondary:"#23dfff"},
  pinkcyan:{id:"pinkcyan",name:"Rosa + Ciano",category:"degrade",thumb:"/static/brand/themes/pinkcyan-thumb.jpg",home:"/static/brand/themes/pinkcyan-body.jpg",mobile:"/static/brand/mobile-themes/pinkcyan",accent:"#ff3c9d",secondary:"#23dfff"},
  redsilver:{id:"redsilver",name:"Vermelho + Prata",category:"degrade",thumb:"/static/brand/themes/redsilver-thumb.jpg",home:"/static/brand/themes/redsilver-body.jpg",mobile:"/static/brand/mobile-themes/redsilver",accent:"#ff5050",secondary:"#e9edf1"},
  copperblue:{id:"copperblue",name:"Cobre + Azul",category:"degrade",thumb:"/static/brand/themes/copperblue-thumb.jpg",home:"/static/brand/themes/copperblue-body.jpg",mobile:"/static/brand/mobile-themes/copperblue",accent:"#f18c42",secondary:"#47bfff"},
  orangepink:{id:"orangepink",name:"Laranja + Rosa",category:"degrade",thumb:"/static/brand/themes/orangepink-thumb.jpg",home:"/static/brand/themes/orangepink-body.jpg",mobile:"/static/brand/mobile-themes/orangepink",accent:"#ff7a18",secondary:"#ff318f"},
  royalblue:{id:"royalblue",name:"Azul Real + Dourado",category:"degrade",thumb:"/static/brand/themes/royalblue-thumb.jpg",home:"/static/brand/themes/royalblue-body.jpg",mobile:"/static/brand/mobile-themes/royalblue",accent:"#328bff",secondary:"#efb83c"},
  aqua:{id:"aqua",name:"Aqua Ciano",category:"unica",thumb:"/static/brand/themes/aqua-thumb.jpg",home:"/static/brand/themes/aqua-body.jpg",mobile:"/static/brand/mobile-themes/aqua",accent:"#20e6ef",secondary:"#7ff4ff"},
  silver:{id:"silver",name:"Prata + Gelo",category:"claro",thumb:"/static/brand/themes/silver-thumb.jpg",home:"/static/brand/themes/silver-body.jpg",mobile:"/static/brand/mobile-themes/silver",accent:"#dcecff",secondary:"#8acfff"},
  cyangold:{id:"cyangold",name:"Ciano + Dourado",category:"degrade",thumb:"/static/brand/themes/cyangold-thumb.jpg",home:"/static/brand/themes/cyangold-body.jpg",mobile:"/static/brand/mobile-themes/cyangold",accent:"#1eeaff",secondary:"#ffb52c"},
  greenblue:{id:"greenblue",name:"Verde + Azul",category:"degrade",thumb:"/static/brand/themes/greenblue-thumb.jpg",home:"/static/brand/themes/greenblue-body.jpg",mobile:"/static/brand/mobile-themes/greenblue",accent:"#4dff2d",secondary:"#318fff"},
  iceblue:{id:"iceblue",name:"Gelo Azul",category:"claro",thumb:"/static/brand/themes/iceblue-thumb.jpg",home:"/static/brand/themes/iceblue-body.jpg",mobile:"/static/brand/mobile-themes/iceblue",accent:"#a9e3ff",secondary:"#e9f5ff"},
  electricblue:{id:"electricblue",name:"Azul Elétrico",category:"unica",thumb:"/static/brand/themes/electricblue-thumb.jpg",home:"/static/brand/themes/electricblue-body.jpg",mobile:"/static/brand/mobile-themes/electricblue",accent:"#279fff",secondary:"#72caff"},
};
function syncManifestIcon(){let link=document.querySelector('link[rel="manifest"]');if(!link){link=document.createElement('link');link.rel="manifest";document.head.appendChild(link)}link.href="/static/manifest.webmanifest?v=378";}

let visualPreview=null;
function visualSettings(){const v={...VISUAL_DEFAULT,...Store.get("visual",{})};if(v.theme==="system")v.theme="dark";if(v.layout==="compacto"||v.layout==="modernox"||v.layout==="moderno"||v.layout==="pulpito")v.layout="clean";if(v.mobileLayout==="auto")v.mobileLayout="mobile-pro";return v;}
function activeVisual(){const v=visualPreview?{...VISUAL_DEFAULT,...visualPreview}:visualSettings();if(v.theme==="system")v.theme="dark";if(v.layout==="compacto"||v.layout==="modernox"||v.layout==="moderno"||v.layout==="pulpito")v.layout="clean";if(v.mobileLayout==="auto")v.mobileLayout="mobile-pro";return v;}
function applyVisual(v=activeVisual()){const root=document.documentElement;if(v.theme==="system")v={...v,theme:"dark"};if(v.layout==="compacto"||v.layout==="modernox"||v.layout==="moderno")v={...v,layout:"clean"};const palette=COLOR_THEMES[v.palette]||COLOR_THEMES.bluegold;const accent=v.layout==="clean"?"#08c6c9":palette.accent;root.dataset.layout=v.layout;root.dataset.theme="dark";root.dataset.mobileLayout=v.mobileLayout||"mobile-pro";root.dataset.palette=palette.id;root.style.setProperty("--accent",accent);root.style.setProperty("--gold",accent);root.style.setProperty("--theme-primary",palette.accent);root.style.setProperty("--theme-secondary",palette.secondary||palette.accent);const hexRgb=h=>{h=h.replace("#","");return `${parseInt(h.slice(0,2),16)},${parseInt(h.slice(2,4),16)},${parseInt(h.slice(4,6),16)}`};root.style.setProperty("--theme-primary-rgb",hexRgb(palette.accent));root.style.setProperty("--theme-secondary-rgb",hexRgb(palette.secondary||palette.accent));syncManifestIcon();updateNavIcons(v.layout);const headerLogo=document.querySelector('.classic-header-logo');if(headerLogo)headerLogo.src=`/static/brand/header-logos/${palette.id}.png?v=theme-nav-1`;const homeImg=document.querySelector('.reference-body-img');if(homeImg&&v.layout==="classico")homeImg.src=palette.home+"?v=themes4";document.querySelectorAll(".mobile-home-piece img[data-piece]").forEach(img=>{img.src=palette.mobile+"/"+img.dataset.piece+".jpg?v=themes4"});const loadingImg=null; /* loading sem imagens */root.dataset.startupPalette=palette.id;}
const NAV_META={
 dashboard:["◈","Dashboard","grid"],studio:["🎛","Studio","sliders"],quick:["⚡","Gerador Rápido","spark"],bible:["📖","Bíblia","book"],knowledge:["🧠","Biblioteca Viva","brain"],
 k7:["🔥","DNA K7","flame"],editor:["📝","Editor","edit"],pulpit:["🎙","Púlpito","mic"],library:["📚","Biblioteca","library"],projects:["📂","Projetos","folder"],
 aihub:["🤖","AI HUB","spark"],appearance:["🎨","Aparência","settings"],about:["ⓘ","Sobre o LOGOS","book"],custompages:["➕","Minhas páginas","folder"],backup:["💾","Backup","save"],settings:["⚙️","Configurações","settings"]};
function modernIcon(kind){const paths={grid:'<rect x="3" y="3" width="7" height="7" rx="2"/><rect x="14" y="3" width="7" height="7" rx="2"/><rect x="3" y="14" width="7" height="7" rx="2"/><rect x="14" y="14" width="7" height="7" rx="2"/>',sliders:'<path d="M4 6h16M7 12h10M9 18h6"/><circle cx="9" cy="6" r="2"/><circle cx="14" cy="12" r="2"/><circle cx="11" cy="18" r="2"/>',book:'<path d="M4 5.5A3.5 3.5 0 0 1 7.5 2H11v18H7.5A3.5 3.5 0 0 0 4 23zM20 5.5A3.5 3.5 0 0 0 16.5 2H13v18h3.5A3.5 3.5 0 0 1 20 23z"/>',brain:'<path d="M9 4a3 3 0 0 0-5 2 3 3 0 0 0 0 5 4 4 0 0 0 3 7h2M15 4a3 3 0 0 1 5 2 3 3 0 0 1 0 5 4 4 0 0 1-3 7h-2M9 4v16M15 4v16M9 9h3M12 15h3"/>',flame:'<path d="M12 22c4 0 7-3 7-7 0-5-4-7-4-11-3 2-5 5-5 8-1-1-2-2-2-4-2 2-3 4-3 7 0 4 3 7 7 7z"/>',edit:'<path d="M4 20h4L19 9l-4-4L4 16zM13.5 6.5l4 4"/>',mic:'<rect x="9" y="3" width="6" height="12" rx="3"/><path d="M5 11a7 7 0 0 0 14 0M12 18v4M8 22h8"/>',library:'<path d="M4 4h4v16H4zM10 4h4v16h-4zM16 5l4-1 2 15-4 1z"/>',folder:'<path d="M3 6h7l2 2h9v11H3z"/>',spark:'<path d="M12 2l1.8 5.2L19 9l-5.2 1.8L12 16l-1.8-5.2L5 9l5.2-1.8zM19 15l.8 2.2L22 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-.8z"/>',save:'<path d="M4 3h14l2 2v16H4zM8 3v6h8V3M8 21v-7h8v7"/>',settings:'<circle cx="12" cy="12" r="3"/><path d="M19 12a7 7 0 0 0-.1-1l2-1.5-2-3.5-2.4 1a8 8 0 0 0-1.7-1L14.5 3h-5L9 6a8 8 0 0 0-1.7 1L5 6 3 9.5 5.1 11a7 7 0 0 0 0 2L3 14.5 5 18l2.3-1a8 8 0 0 0 1.7 1l.5 3h5l.5-3a8 8 0 0 0 1.7-1l2.3 1 2-3.5-2.1-1.5a7 7 0 0 0 .1-1z"/>'};return `<svg class="modern-nav-icon" viewBox="0 0 24 24" aria-hidden="true">${paths[kind]||paths.spark}</svg>`;}
function updateNavIcons(layout=activeVisual().layout){
 if(layout!=="clean")return;
 $$('.nav button[data-view]').forEach(b=>{
   const m=NAV_META[b.dataset.view];if(!m)return;
   b.innerHTML=`<i class="clean-retro-ico" aria-hidden="true">${m[0]}</i><span>${m[1]}</span>`;
 });
}
function appearancePanel(){const v=activeVisual();const groups=[["degrade","🌈 Degradês / Duas cores"],["unica","💎 Cor única / Neon"],["claro","❄️ Claros / Metálicos"]];const themeGroups=groups.map(([cat,title])=>{const cards=Object.values(COLOR_THEMES).filter(t=>t.category===cat).map(t=>`<button class="theme-card ${v.palette===t.id?"active":""}" data-palette="${t.id}"><img src="${t.thumb}?v=themes4" alt="${t.name}"><span><strong>${t.name}</strong><small>${cat==="degrade"?"Degradê luminoso":"Identidade cromática"}</small></span></button>`).join("");return `<section class="theme-category"><h4>${title}</h4><div class="theme-card-grid">${cards}</div></section>`}).join("");return `<div class="appearance-backdrop" id="appearanceBackdrop" role="dialog" aria-modal="true"><div class="appearance-panel" id="appearancePanel"><div class="appearance-head"><h3>🎨 Aparência</h3><button class="btn secondary" id="appearanceClose">✕ Fechar</button></div><p class="muted">Temas separados por categoria. A Home do computador e do celular acompanha o tema selecionado.</p>${themeGroups}<label>🖥️ Estrutura no PC</label><div class="visual-options">${[["classico","🏛️ Clássico — imagem completa"],["clean","✦ Clean"]].map(([x,l])=>`<button class="visual-choice ${v.layout===x?"active":""}" data-layout="${x}">${l}</button>`).join("")}</div><label>📱 Estrutura no celular / Android</label><div class="visual-options">${[["mobile-pro","⚡ Pro — padrão"],["mobile-clean","✦ Clean"]].map(([x,l])=>`<button class="visual-choice ${v.mobileLayout===x?"active":""}" data-mobile-layout="${x}">${l}</button>`).join("")}</div><div class="fixed-icon-card theme-icon-preview"><img src="${(COLOR_THEMES[v.palette]||COLOR_THEMES.bluegold).thumb}?v=themes4" alt="Miniatura do tema"><div><strong>Miniatura seletiva do tema</strong><small>O ícone oficial do APP continua preservado.</small></div></div><div class="row appearance-actions"><button class="btn primary" id="visualSave">💾 Salvar tema</button><button class="btn secondary" id="visualReset">↩ Restaurar padrões</button><button class="btn secondary" id="visualCloseBottom">✕ Fechar</button></div></div></div>`;}
function openAppearance(){
  $("#appearanceBackdrop")?.remove(); visualPreview={...visualSettings()};
  document.body.insertAdjacentHTML("beforeend",appearancePanel());
  const backdrop=$("#appearanceBackdrop"), panel=$("#appearancePanel"), saved={...visualSettings()};
  const close=(restore=true)=>{document.removeEventListener("keydown",onKey);if(restore){visualPreview=null;applyVisual(saved);}backdrop?.remove();};
  const onKey=e=>{if(e.key==="Escape")close(true);}; document.addEventListener("keydown",onKey);
  $("#appearanceClose")?.addEventListener("click",e=>{e.preventDefault();e.stopPropagation();close(true);});
  $("#visualCloseBottom")?.addEventListener("click",()=>close(true)); panel?.addEventListener("click",e=>e.stopPropagation()); backdrop?.addEventListener("click",()=>close(true));
  const refresh=()=>{applyVisual(visualPreview); $$(`[data-layout]`).forEach(x=>x.classList.toggle("active",x.dataset.layout===visualPreview.layout)); $$(`[data-theme]`).forEach(x=>x.classList.toggle("active",x.dataset.theme===visualPreview.theme)); $$(`[data-accent]`).forEach(x=>x.classList.toggle("active",x.dataset.accent===visualPreview.accent));$$(`[data-mobile-layout]`).forEach(x=>x.classList.toggle("active",x.dataset.mobileLayout===visualPreview.mobileLayout));$$(`[data-palette]`).forEach(x=>x.classList.toggle("active",x.dataset.palette===visualPreview.palette));const mini=document.querySelector(".theme-icon-preview img");if(mini)mini.src=(COLOR_THEMES[visualPreview.palette]||COLOR_THEMES.bluegold).thumb+"?v=theme3";};
  $$('[data-layout]').forEach(b=>b.addEventListener("click",()=>{visualPreview={...activeVisual(),layout:b.dataset.layout};refresh();}));
  $$('[data-theme]').forEach(b=>b.addEventListener("click",()=>{visualPreview={...activeVisual(),theme:b.dataset.theme};refresh();}));$$('[data-mobile-layout]').forEach(b=>b.addEventListener("click",()=>{visualPreview={...activeVisual(),mobileLayout:b.dataset.mobileLayout};refresh();}));$$('[data-palette]').forEach(b=>b.addEventListener("click",()=>{visualPreview={...activeVisual(),palette:b.dataset.palette};refresh();}));
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
function renderGeneratedMessage(raw="",ctx={}){const lines=String(raw).replace(/\r/g,"").split("\n");let html=`<article class="generated-message"><div class="generated-hero"><div class="generated-logo">✦</div><div><strong>LOGOS MASTER X</strong><span>${escapeHtml(ctx.command||"Material gerado")}</span></div><div class="generated-badges"><span>🔥 DNA K7 ${Number(ctx.intensity||10)}/10</span>${ctx.provider?`<span>🤖 ${escapeHtml(ctx.provider)}</span>`:""}${ctx.seconds!=null?`<span>⏱ ${escapeHtml(ctx.seconds)}s</span>`:""}${ctx.quality!=null?`<span>✅ QG ${escapeHtml(ctx.quality)}%</span>`:""}</div></div><div class="generated-reader-toolbar" role="toolbar" aria-label="Controles de leitura"><span class="reader-toolbar-label">Leitura</span><button type="button" data-lmx-reader="smaller" title="Diminuir fonte">A−</button><button type="button" data-lmx-reader="reset" title="Tamanho normal"><span data-reader-zoom>100%</span></button><button type="button" data-lmx-reader="larger" title="Aumentar fonte">A+</button><button type="button" data-lmx-reader="fullscreen" title="Tela cheia">⛶ Tela cheia</button><button type="button" class="reader-exit-full" data-lmx-reader="exitfullscreen" title="Sair da tela cheia">✕ Sair</button></div><div class="reader-nav-rail" aria-label="Navegação rápida"><button type="button" data-lmx-reader="top" title="Subir rapidamente">↑</button><button type="button" data-lmx-reader="autoscroll" title="Iniciar/parar rolagem">●</button><button type="button" data-lmx-reader="bottom" title="Descer rapidamente">↓</button></div>`;let listOpen=false,sectionOpen=false;const closeList=()=>{if(listOpen){html+="</ul>";listOpen=false}},closeSection=()=>{closeList();if(sectionOpen){html+="</section>";sectionOpen=false}};for(const original of lines){const trim=original.trim();if(!trim){closeList();continue}if(trim==="---"){closeList();continue}if(/^\[LOGOS-AI-HUB\]$/i.test(trim))continue;if(/^IA:\s/i.test(trim)){html+=`<div class="generated-meta">${inlineRich(trim)}</div>`;continue}const hm=trim.match(/^#{1,6}\s+(.+)$/);if(hm){closeSection();const title=hm[1].replace(/^\*\*|\*\*$/g,"");const ico=sectionIcon(title);html+=`<section class="generated-section ${ico==="🔥"?"dna-k7-section":""}"><h3><span class="generated-section-icon">${ico}</span><span>${inlineRich(title)}</span></h3>`;sectionOpen=true;continue}if(/^\[QUALITY GATE/i.test(trim)){closeSection();html+=`<section class="generated-section quality-section"><h3><span class="generated-section-icon">✅</span><span>Quality Gate</span></h3><p class="quality-line">${inlineRich(trim.replace(/^\[|\]$/g,""))}</p>`;sectionOpen=true;continue}const bullet=trim.match(/^[-*•]\s+(.+)$/);if(bullet){if(!sectionOpen){html+='<section class="generated-section">';sectionOpen=true}if(!listOpen){html+='<ul class="generated-list">';listOpen=true}html+=`<li>${inlineRich(bullet[1])}</li>`;continue}closeList();const numbered=trim.match(/^(\d+)[.)]\s+(.+)$/);if(numbered){html+=`<div class="generated-number"><span>${numbered[1]}</span><p>${inlineRich(numbered[2])}</p></div>`;continue}const special=/DNA K7|K7|CLÍMAX|APELO|\[VERIFICAR\]|\[AUTOCORREÇÃO\]/i.test(trim);html+=`<p class="${special?"generated-emphasis":""}">${inlineRich(trim)}</p>`;}closeSection();const plain=String(raw).replace(/[#*_`>\[\]]/g,' ').replace(/\s+/g,' ').trim();const words=plain?plain.split(/\s+/).length:0;const chars=String(raw).length;const refs=(String(raw).match(/\b(?:[1-3]\s*)?[A-ZÁÉÍÓÚÂÊÔÃÕÇ][A-Za-zÁ-úç]+\s+\d{1,3}:\d{1,3}(?:[-–]\d{1,3})?/g)||[]);const uniqueRefs=[...new Set(refs)];const qn=Math.max(0,Math.min(100,Number(ctx.quality)||0));const qd=ctx.qualityDetail||{};const durationCoverage=Number(qd.duration_coverage_percent);const durationPassed=qd.duration_passed;const score20=Math.round(qn/5);const stars=Math.max(1,Math.min(5,Math.round(qn/20)));const starText='★'.repeat(stars)+'☆'.repeat(5-stars);html+=`${ctx.quality!=null?`<section class="quality-score-panel"><div class="quality-score-main"><span>🎯 PRECISÃO / QUALITY GATE</span><strong>${score20}/20 • ${qn}%</strong><b>${starText} — ${qn>=95?'🟢 Excelente':qn>=85?'🟢 Muito alta':qn>=70?'🟡 Boa':qn>=50?'🟠 Revisar':'🔴 Baixa'}</b><div class="precision-track"><i style="width:${qn}%"></i></div></div><div class="quality-scale"><span><b>19–20</b> ★★★★★ — 🟢 Excelente</span><span><b>17–18</b> ★★★★☆ — 🟢 Muito alta</span><span><b>14–16</b> ★★★★☆ — 🟡 Boa</span><span><b>10–13</b> ★★★☆☆ — 🟠 Revisar</span><span><b>0–9</b> ★★☆☆☆ — 🔴 Baixa</span></div></section>`:''}<section class="material-summary"><h3>📊 Resumo do material gerado</h3><div class="summary-grid"><div><span>Palavras</span><strong>${words.toLocaleString('pt-BR')}</strong></div><div><span>Caracteres</span><strong>${chars.toLocaleString('pt-BR')}</strong></div><div><span>Referências</span><strong>${uniqueRefs.length}</strong></div><div><span>Leitura</span><strong>~${Math.max(1,Math.ceil(words/130))} min</strong></div><div><span>Pregação planejada</span><strong>${ctx.duration||'—'} min</strong></div><div><span>DNA K7</span><strong>${Number(ctx.intensity||10)}/10</strong></div></div>${ctx.quality!=null?`<div class="precision-card"><div><span>🎯 Precisão da geração</span><strong>${score20}/20 • ${qn}%</strong></div><div class="precision-stars">${starText}</div><div class="precision-track"><i style="width:${qn}%"></i></div><small>${qn>=95?'Excelente':qn>=85?'Muito alta':qn>=70?'Boa':qn>=50?'Revisar':'Baixa'}</small>${Number.isFinite(durationCoverage)?`<div class="duration-gate ${durationPassed===false?'duration-fail':'duration-ok'}"><strong>⏱ Cobertura de duração: ${durationCoverage}%</strong><span>${durationPassed===false?'REPROVADO POR DURAÇÃO':'Duração compatível'}</span>${qd.duration_warning?`<small>${escapeHtml(qd.duration_warning)}</small>`:''}</div>`:''}</div>`:''}</section></article>`;return html;}
function openShareMenu(title,text){if(!text||text==="Pronto."||text==="Processando...")return actionModal({icon:"i",title:"Nada para compartilhar",message:"Gere um conteúdo primeiro.",actions:[{label:"Fechar",kind:"primary"}]});const safeTitle=title||"LOGOS MASTER X";const actions=[{label:"📋 Copiar tudo",kind:"primary",close:false,run:async()=>{await copy(text,{silent:true});actionModal({icon:"✓",title:"Texto copiado",message:"O conteúdo completo está na área de transferência.",actions:[{label:"Fechar",kind:"primary"}]})}},{label:"✉️ E-mail",run:async()=>{await copy(text,{silent:true});location.href=`mailto:?subject=${encodeURIComponent(safeTitle)}&body=${encodeURIComponent("O texto completo do LOGOS MASTER X foi copiado para a área de transferência. Cole-o aqui no corpo do e-mail.")}`;}},{label:"💬 WhatsApp Web",run:async()=>{const w=window.open("about:blank","_blank");await copy(text,{silent:true});if(w)w.location.href="https://web.whatsapp.com/";}},{label:"📝 Abrir no Editor",run:()=>{Store.set("editor",{title:safeTitle,text});render("editor")}},{label:"⬇️ Baixar TXT",run:()=>download((safeTitle||"logos").replace(/[\/:*?"<>|]+/g,"-")+".txt",text)}];if(navigator.share)actions.unshift({label:"📤 Compartilhar pelo sistema",kind:"success",run:async()=>{try{await navigator.share({title:safeTitle,text})}catch(e){if(e?.name!=="AbortError")throw e}}});actionModal({icon:"↗",title:"Compartilhar / usar texto",message:"Escolha o que deseja fazer com a mensagem completa.",actions});}

function durationProfile(m){
 m=Number(m);
 if(m<=20)return "MENSAGEM COMPLETA: ~1.800–2.400 palavras; 2–3 movimentos desenvolvidos; não resumir.";
 if(m<=30)return "MENSAGEM COMPLETA: ~2.600–3.400 palavras; 3 movimentos desenvolvidos; não resumir.";
 if(m<=35)return "MENSAGEM COMPLETA: ~3.000–3.900 palavras; 3–4 movimentos desenvolvidos; não resumir.";
 if(m<=40)return "MENSAGEM COMPLETA: ~3.800–5.000 palavras; 4 movimentos amplamente desenvolvidos; não resumir.";
 if(m<=50)return "MENSAGEM COMPLETA: ~4.500–5.800 palavras; 4 movimentos profundos; não resumir.";
 if(m<=60)return "MENSAGEM COMPLETA: ~5.400–7.000 palavras; 4–5 movimentos profundos; não resumir.";
 return "MENSAGEM COMPLETA: ~6.200–8.000 palavras; 5 movimentos profundos; não resumir.";
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
async function runCommand(cmd,d,options={}){
 const prompt=masterPrompt(cmd,d); Store.set("lastPrompt",prompt);
 const timeoutMs=Math.max(10000,Number(options.timeoutMs)||300000);
 // HOTFIX: no servidor local, tente sempre a API real mesmo se o health-check transitório marcou App.server=false.
 if(App.server || IS_LOCAL_HOST){
   const controller=new AbortController();
   const outerSignal=options.signal;
   const onOuterAbort=()=>controller.abort("cancelled");
   if(outerSignal){if(outerSignal.aborted)controller.abort("cancelled");else outerSignal.addEventListener("abort",onOuterAbort,{once:true});}
   const timeoutId=setTimeout(()=>controller.abort("timeout"),timeoutMs);
   try{
     const generationBase=((App.provider==="9router"&&IS_LOCAL_HOST)?LOCAL_API:App.api).replace(/\/$/,"");
     const r=await fetch(generationBase+"/api/generate-ai",{method:"POST",headers:{"Content-Type":"application/json"},signal:controller.signal,cache:"no-store",body:JSON.stringify({
       mode:cmd,text:d.text,theme:"",duration:d.duration,cult:d.cult,audience:d.audience,intensity:d.intensity,objective:d.objective||"",notes:d.notes||"",provider:App.provider||"auto",ai_mode:App.aiMode||"automatico",model:App.model||null
     })});
     let j={}; try{j=await r.json()}catch(_){throw new Error("Resposta inválida da API")}
     if(!r.ok) throw new Error(j.detail||("Erro HTTP "+r.status));
     const qualityValue=(j.quality && typeof j.quality==="object") ? (j.quality.score ?? j.quality.percent ?? j.quality.percentage ?? null) : (j.quality ?? null);
     return {text:j.text||JSON.stringify(j,null,2),engine:j.engine||"api",prompt,provider:j.provider||"",model:j.model||"",seconds:j.seconds,quality:qualityValue,quality_detail:(j.quality&&typeof j.quality==="object")?j.quality:null,fallback_errors:j.fallback_errors||[],segmented:!!j.segmented,segments:j.segments||0,target_words:j.target_words||null,actual_words:j.actual_words||0,expansion_rounds:j.expansion_rounds||0};
   }catch(e){
     const aborted=controller.signal.aborted||e?.name==="AbortError";
     const reason=controller.signal.reason;
     if(reason==="cancelled") throw new Error("Geração cancelada pelo usuário.");
     if(!aborted && !IS_LOCAL_HOST){App.server=false;setStatus();}
     // Em localhost não aceite um esqueleto local como se fosse uma geração concluída.
     // Mostre a falha e mantenha o Gerador liberado para nova tentativa/fallback do backend.
     if(IS_LOCAL_HOST) throw new Error(`Falha na geração por IA: ${e?.message||String(e)}`);
     const why=aborted?"tempo limite excedido":"API indisponível";
     return {text:localPipeline(cmd,d)+`\n\n[${why}; modo local ativado automaticamente.]`,engine:"local",prompt,quality:0,quality_detail:{passed:false,duration_passed:false,duration_coverage_percent:0,duration_warning:"Geração de IA incompleta; modo local estrutural ativado."},fallback_error:e?.message||String(e)};
   }finally{
     clearTimeout(timeoutId);
     if(outerSignal)outerSignal.removeEventListener("abort",onOuterAbort);
   }
 }
 return {text:localPipeline(cmd,d),engine:"local",prompt,quality:0,quality_detail:{passed:false,duration_passed:false,duration_coverage_percent:0,duration_warning:"Geração de IA incompleta; modo local estrutural ativado."}};
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
 const __healthStarted=performance.now();
 let data=await attempt(15000);
 if(!data) data=await attempt(15000);
 App.server=!!data;
 App.health=data;
 window.__logosLastHealthCheck=Date.now();
 window.__logosHealthLatency=Math.max(0,Math.round(performance.now()-__healthStarted));
 setStatus();
 refreshSystemSummary();
 return data;
}
function providerStatusModal(){const ps=App.health?.providers||{},ms=App.health?.models||{};const names=[["gemini","Gemini"],["groq","Groq"],["openrouter","OpenRouter"],["huggingface","Hugging Face"],["openai","OpenAI"]];const online=names.filter(([k])=>ps[k]).length;const details=names.map(([k,n])=>`<div class="provider-detail ${ps[k]?"provider-online":"provider-offline"}"><span class="provider-check">${ps[k]?"✓":"○"}</span><div><strong>${n}</strong><small>${escapeHtml(ms[k]||"—")}</small><em>${ps[k]?"Online e disponível para o Smart Router":"Indisponível neste momento"}</em></div></div>`).join("")+`<div class="provider-detail local-reserve provider-online"><span class="provider-check local-check">⌂</span><div><strong>9Router <span class="reserve-badge">RESERVA LOCAL</span></strong><small>${escapeHtml(ms["9router"]||"oc/deepseek-v4-flash-free")}</small><em>${IS_LOCAL_HOST?(ps["9router"]?"Disponível neste PC e usado somente como última reserva.":"Reserva local configurável neste PC."):"Reserva preservada no computador local; não consome a capacidade pública do Render."}</em></div></div>`;closeActionModal();document.body.insertAdjacentHTML("beforeend",`<div class="logos-action-backdrop" id="logosActionBackdrop"><div class="logos-action-modal provider-modal"><div class="logos-action-icon">AI</div><div class="logos-action-copy"><h3>Provedores do LOGOS</h3><p><strong>${online} online</strong> • <strong>1 reserva local</strong>. O 9Router fica separado da infraestrutura pública.</p></div><button class="logos-action-x" id="logosActionX">✕</button><div class="provider-detail-list">${details}</div><div class="logos-action-buttons"><button class="btn primary" id="openAIHubFromStatus">Abrir AI HUB / Monitor</button><button class="btn secondary" id="closeProviderStatus">Fechar</button></div></div></div>`);$("#logosActionX")?.addEventListener("click",closeActionModal);$("#closeProviderStatus")?.addEventListener("click",closeActionModal);$("#openAIHubFromStatus")?.addEventListener("click",()=>{closeActionModal();render("aihub")});}
function setStatus(){const e=$("#status");if(!e)return;if(App.server){const ps=App.health?.providers||{};const n=["gemini","groq","openrouter","huggingface","openai"].filter(k=>ps[k]).length;e.innerHTML=`<span class="status-dot"></span><strong>${n} ONLINE</strong><span class="status-reserve">• 1 RESERVA LOCAL</span><span class="status-chevron">⌄</span>`;e.className="status top-provider-status online status-clickable";e.title="${n} provedores online + 9Router como reserva local";e.onclick=providerStatusModal;}else{e.innerHTML='<span class="status-dot"></span><strong>LOCAL</strong><span>API offline</span>';e.className="status top-provider-status status-clickable";e.onclick=providerStatusModal;}}

function fieldHead(classic,kind,title){return `<div class="studio-section-head"><span class="studio-classic-icon">${classic}</span>${modernIcon(kind)}<strong>${title}</strong></div>`;}
function form(){
 return `<div class="studio-section studio-content">${fieldHead("📝","edit","Conteúdo da mensagem")}
 <div class="two"><div><label>Texto bíblico / tema</label><textarea id="fText" placeholder="Ex.: Lamentações 5:21-22 — restauração espiritual"></textarea></div><div><label>Objetivo</label><textarea id="fObjective" placeholder="Ex.: levar a igreja ao arrependimento e à esperança"></textarea></div></div></div>
 <div class="studio-section studio-context">${fieldHead("⛪","book","Contexto e público")}
 <div class="three"><div><label>Tempo</label><select id="fDuration">${[20,30,35,40,50,60,70].map(x=>`<option ${x===40?"selected":""}>${x}</option>`).join("")}</select></div>
 <div><label>Tipo de culto / ocasião</label><select id="fCult">${CULT_TYPES.map(x=>`<option value="${x}">${x}</option>`).join("")}<option value="__custom__">Outro / personalizado...</option></select><input id="fCultCustom" class="audience-custom" placeholder="Digite o culto / ocasião" style="display:none" autocomplete="off"></div>
 <div class="quick-k7-control"><label class="label-with-info">Intensidade DNA K7 <button type="button" class="info-dot" id="k7Info" aria-label="O que é Intensidade K7?">i</button></label><select id="fK7">${[1,2,3,4,5,6,7,8,9,10].map(x=>`<option ${x===10?"selected":""}>${x}</option>`).join("")}</select><div class="quick-k7-slider-wrap"><input id="fK7Range" class="quick-k7-range" type="range" min="1" max="10" step="1" value="10" aria-label="Ajustar intensidade DNA K7"><div class="quick-k7-ticks" aria-hidden="true"><span class="major">1</span><span class="minor">2</span><span class="minor">3</span><span class="minor">4</span><span class="major">5</span><span class="minor">6</span><span class="minor">7</span><span class="minor">8</span><span class="minor">9</span><span class="major">10</span></div><output id="quickK7Value" class="quick-k7-value">10 / 10</output></div></div></div>
 <label>Público-alvo</label><select id="fAudience">${AUDIENCES.map((x,i)=>`<option value="${x}" ${i===0?"selected":""}>${x}</option>`).join("")}<option value="__custom__">Outro / personalizado...</option></select><input id="fAudienceCustom" class="audience-custom" placeholder="Digite o público personalizado" style="display:none" autocomplete="off"></div>
 <div class="studio-section studio-direction">${fieldHead("🎯","spark","Direcionamento")}<label>Comando</label><select id="cmd">${commands.map(c=>`<option>${c}</option>`).join("")}</select><label>Observações</label><textarea id="fNotes" placeholder="Observações, foco, limitações..."></textarea></div>`;
}
function fd(){const av=$("#fAudience")?.value||"Igreja local",cv=$("#fCult")?.value||"Avivamento";const audience=av==="__custom__"?($("#fAudienceCustom")?.value.trim()||"Público personalizado"):av;const cult=cv==="__custom__"?($("#fCultCustom")?.value.trim()||"Ocasião personalizada"):cv;return {text:$("#fText")?.value.trim()||"",objective:$("#fObjective")?.value.trim()||"",duration:Number($("#fDuration")?.value||40),cult,intensity:Number($("#fK7Range")?.value||$("#fK7")?.value||10),audience,notes:$("#fNotes")?.value.trim()||""}}


function cleanDashboard(){
 const s=projectStats();
 return `<div class="clean-home">
   <section class="clean-hero">
     <div class="clean-hero-copy">
       <span class="clean-eyebrow">✦ LOGOS MASTER X • DNA K7</span>
       <h1>Da Palavra ao Púlpito.</h1>
       <p>Estudo bíblico, preparação, organização e pregação em uma interface leve e direta.</p>
       <div class="clean-hero-actions">
         <button class="btn primary" data-go="studio">▶ Acessar Studio</button>
         <button class="btn secondary" data-go="about">ⓘ Conhecer o propósito</button>
       </div>
     </div>
     <div class="clean-hero-mark" aria-hidden="true"><span>📼</span><b>✕</b><span>🧬</span></div>
   </section>
   <div class="clean-section-title"><span>COMECE AQUI</span><small>atalhos principais</small></div>
   <section class="clean-quick-grid">
     <button data-go="studio"><i>📝</i><strong>Nova mensagem</strong><small>Comece com texto bíblico ou tema</small></button>
     <button data-go="projects"><i>📁</i><strong>Meus projetos</strong><small>${s.projects||0} projeto(s) salvo(s)</small></button>
     <button data-go="library"><i>📚</i><strong>Biblioteca</strong><small>${s.library||0} material(is)</small></button>
     <button data-go="history"><i>🕘</i><strong>Histórico</strong><small>Reveja conversas e materiais</small></button>
     <button data-go="pulpit"><i>🎙️</i><strong>Modo Púlpito</strong><small>Preparação final</small></button>
   </section>
   <section class="clean-panels">
     <div class="clean-panel"><div class="clean-panel-head"><span>🔥</span><div><strong>DNA K7</strong><small>Estrutura • intensidade • aplicação</small></div></div><p>O motor organiza o material sem substituir oração, Bíblia, consagração e discernimento.</p><button class="clean-link" data-go="k7">Abrir DNA K7 →</button></div>
     <div class="clean-panel"><div class="clean-panel-head"><span>🤖</span><div><strong>AI HUB</strong><small>provedores e modelos</small></div></div><p>Acompanhe provedores, roteamento e disponibilidade em um só lugar.</p><button class="clean-link" data-go="aihub">Abrir AI HUB →</button></div>
     <div class="clean-panel"><div class="clean-panel-head"><span>📖</span><div><strong>Bíblia + Estudo</strong><small>conteúdo organizado</small></div></div><p>Pesquise, prepare e transforme estudo em material de púlpito com clareza.</p><button class="clean-link" data-go="bible">Abrir Bíblia →</button></div>
   </section>
 </div>`;
}

function themeHomeAsset(){const p=COLOR_THEMES[activeVisual().palette]||COLOR_THEMES.bluegold;return p.home+"?v=theme3";}

const views={
 dashboard(){const s=projectStats();if(activeVisual().layout==="clean")return cleanDashboard();return `<div class="classic-home exact-reference-home">
<div class="reference-body-wrap desktop-reference-home">
<img class="reference-body-img" src="${themeHomeAsset()}" alt="LOGOS MASTER X DNA K7 — Home temática">
<button class="reference-hit reference-hit-studio" data-go="studio" aria-label="Acessar Studio"></button>
<button class="reference-hit reference-hit-about" data-go="about" aria-label="Saiba mais sobre o LOGOS"></button>
</div>
<div class="mobile-reference-home" aria-label="LOGOS MASTER X — Home adaptada para celular">
  <div class="mobile-home-piece mobile-home-hero"><img data-piece="hero" src="${(COLOR_THEMES[activeVisual().palette]||COLOR_THEMES.bluegold).mobile}/hero.jpg?v=themes4" alt="LOGOS MASTER X DNA K7"><button data-go="studio" aria-label="Acessar Studio"></button></div>
  <div class="mobile-home-piece mobile-home-info"><img data-piece="info" src="${(COLOR_THEMES[activeVisual().palette]||COLOR_THEMES.bluegold).mobile}/info.jpg?v=themes4" alt="Propósito e resumo do sistema"><button data-go="about" aria-label="Saiba mais sobre o LOGOS"></button></div>
  <div class="mobile-home-piece"><img data-piece="features-a" src="${(COLOR_THEMES[activeVisual().palette]||COLOR_THEMES.bluegold).mobile}/features-a.jpg?v=themes4" alt="DNA K7, Contexto e Exposição, Aplicações Reais"></div>
  <div class="mobile-home-piece"><img data-piece="features-b" src="${(COLOR_THEMES[activeVisual().palette]||COLOR_THEMES.bluegold).mobile}/features-b.jpg?v=themes4" alt="Preparação para o Púlpito, AI HUB, Mobile First"></div>
</div></div>`},
 quick(){
 const savedMode=Store.get("quickGenMode",App.aiMode||"rapido");
 const modes=[
  ["rapido","⚡","Rápido",MODE_ESTIMATES.rapido,"Velocidade com bom equilíbrio"],
  ["economico","💰","Econômico",MODE_ESTIMATES.economico,"Menor consumo e resposta objetiva"],
  ["automatico","🧠","Automático",MODE_ESTIMATES.automatico,"Smart Router e fallback"],
  ["qualidade","✨","Qualidade",MODE_ESTIMATES.qualidade,"Prioriza revisão e acabamento"]
 ];
 const pre=Store.get("quickPrefill",{});
 return `<div class="quick-generator-pro quick-studio-layout">
  <section class="quick-hero quick-dna-banner">
   <div class="quick-hero-copy"><span>⚡ STUDIO X — GERAÇÃO RÁPIDA</span><h2>Gerador Rápido</h2><p>Preparação • Estudo • Pregação • Ensino</p><small>Gere em poucos passos sem perder o padrão DNA K7.</small></div>
   <div class="quick-hero-dna" aria-hidden="true"><i></i><i></i><i></i><i></i><i></i><i></i><i></i></div>
   <button class="btn secondary" data-go="studio">Studio X completo →</button>
  </section>
  <div class="quick-tabs"><button class="active" data-quick-tab="message">⚡ Mensagem rápida</button><button data-quick-tab="tips">💡 Dica rápida</button></div>
  <div class="quick-layout quick-layout-reference">
   <main>
    <div id="quickMessagePane">
     ${form()}
     <div class="studio-section quick-router"><div class="studio-section-head"><span class="studio-classic-icon">🚀</span><strong>Perfil de geração</strong></div>
      <div class="quick-mode-grid">${modes.map(([id,ico,name,est,desc])=>`<button type="button" class="quick-mode ${savedMode===id?'active':''}" data-quick-mode="${id}"><b>${ico} ${name}</b><strong>${est}</strong><small>${desc}</small></button>`).join('')}</div>
     </div>
    </div>
    <div id="quickTipsPane" hidden>
     <div class="studio-section"><div class="studio-section-head"><span class="studio-classic-icon">💡</span><strong>Dica rápida</strong></div>
      <label>Tema, pergunta ou passagem</label><textarea id="quickTipText" rows="6" placeholder="Ex.: Isaías 6 — chamado missionário">${escapeHtml(pre.tip||'')}</textarea>
      <div class="quick-chip-row"><label><input type="checkbox" data-tip-kind value="titulos" checked> Títulos</label><label><input type="checkbox" data-tip-kind value="pontos" checked> Pontos</label><label><input type="checkbox" data-tip-kind value="aplicacoes" checked> Aplicações</label><label><input type="checkbox" data-tip-kind value="ilustracoes" checked> Ilustrações</label><label><input type="checkbox" data-tip-kind value="referencias" checked> Referências</label></div>
     </div>
    </div>
   </main>
   <aside class="quick-review-panel" id="quickReviewPanel">
    <section class="quick-summary-card">
     <div class="quick-summary-head"><span>☆</span><strong>RESUMO DA GERAÇÃO RÁPIDA</strong><button type="button" class="quick-edit-summary" id="quickEditSummary">Editar</button></div>
     <div class="quick-summary-grid">
      <div class="quick-summary-bible"><small>📖 Passagem bíblica</small><b id="qSumText">—</b></div>
      <div><small>👥 Público-alvo</small><b id="qSumAudience">Igreja local</b></div>
      <div class="quick-summary-theme"><small>🏷 Tema da mensagem</small><b id="qSumTheme">—</b></div>
      <div><small>📅 Culto / Ocasião</small><b id="qSumCult">Avivamento</b></div>
      <div><small>✓ Objetivo</small><b id="qSumObjective">—</b></div>
      <div><small>🧬 Intensidade K7</small><b id="qSumK7">10 / 10</b><div class="quick-k7-mini" id="qSumK7Bar"><i></i></div></div>
      <div><small>◷ Duração</small><b id="qSumDuration">40 minutos</b></div>
      <div><small>✎ Estilo</small><b id="qSumStyle">${escapeHtml(savedMode)}</b></div>
     </div>
     <div class="quick-ready"><strong>Pronto para gerar!</strong><span>Confira os dados ao lado e escolha como deseja gerar o conteúdo.</span><em class="quick-dna-art">🧬</em></div>
    </section>
    <section class="quick-choice-card">
     <div class="studio-section-head"><span class="studio-classic-icon">⚡</span><strong>ESCOLHA COMO DESEJA GERAR</strong></div>
     <div class="quick-run-grid" id="quickRunGrid">
      <button class="quick-choice quick-choice-full quick-choice-purple" id="quickRunFull" type="button">
       <div class="quick-choice-title-row"><span class="quick-choice-icon">✨</span><div><b>Gerar Mensagem Completa</b><mark>Recomendado</mark></div></div>
       <p class="quick-choice-description">Gera a mensagem completa com todos os elementos selecionados e uma estrutura detalhada, pronta para estudo, edição ou pregação.</p>
       <ul class="quick-choice-list"><li>Introdução e contexto</li><li>Desenvolvimento completo</li><li>Aplicações e referências bíblicas</li><li>Ilustrações quando cabíveis</li><li>Conclusão, clímax, apelo e oração</li><li>Todos os recursos selecionados</li></ul>
       <span class="quick-choice-action">✨ Gerar Mensagem Completa</span>
       <small class="quick-choice-time">◷ Tempo estimado: 1–2 minutos</small>
      </button>
      <button class="quick-choice quick-choice-outline quick-choice-green" id="quickRunOutline" type="button">
       <div class="quick-choice-title-row"><span class="quick-choice-icon">📄</span><div><b>Gerar Somente Esboço</b><mark>Rápido e Enxuto</mark></div></div>
       <p class="quick-choice-description">Gera apenas o esboço da mesma mensagem, preservando o tema, o direcionamento e a estrutura central para você desenvolver depois.</p>
       <ul class="quick-choice-list"><li>Grande ideia</li><li>Divisões principais</li><li>Pontos-chave de cada divisão</li><li>Versículos principais</li><li>Aplicações resumidas</li><li>Conclusão / Apelo</li></ul>
       <span class="quick-choice-action">📄 Gerar Somente Esboço</span>
       <small class="quick-choice-time">◷ Tempo estimado: 20–40 segundos</small>
      </button>
     </div>
    </section>
   </aside>
  </div>
  <section class="quick-generation-visual-panel"><div class="quick-visual-head"><div><strong>🎬 Visual da geração</strong><small>Escolha uma animação. Apenas uma é exibida por vez.</small></div><div class="gen-visual-switch gen-visual-master" role="group" aria-label="Visual da geração"><button type="button" data-gen-visual="cinematic">✦ DNA → K7 → Bíblia <small>Padrão</small></button><button type="button" data-open-gen-gallery>◉ Escolher entre 12 visuais</button></div></div><div id="quickGenVisual" class="shared-gen-visual" hidden></div></section>
  <div class="quick-actions"><button class="btn secondary" id="quickCopy">📋 COPIAR TEXTO</button><button class="btn secondary" id="quickEditor">✏️ ABRIR NO EDITOR</button><button class="btn secondary" id="quickLibrary">📚 SALVAR NA BIBLIOTECA</button><button class="btn secondary" id="quickProject">📁 SALVAR PROJETO</button></div>
  <div class="output quick-output" id="quickOut">✓ Pronto para gerar!\nPreencha os campos acima e escolha o tipo de geração.</div>
 </div>`;
 },
 studio(){
 const dnaProfiles=[
  {id:"k7",code:"K7-003",icon:"🧬",name:"Clássico K7",tag:"Expositivo • Progressivo",desc:"Progressão bíblica com ritmo, aplicação e clímax no DNA K7.",score:91,tags:["Pentecostal","Progressivo","Aplicativo"]},
  {id:"pentecostal",code:"K7-001",icon:"🔥",name:"Pentecostal",tag:"Pentecostal • Aplicativo",desc:"Ênfase espiritual, aplicações e progressão crescente com equilíbrio bíblico.",score:89,tags:["Pentecostal","Aplicação","Clímax"]},
  {id:"pastoral",code:"K7-007",icon:"💚",name:"Pastoral Forte",tag:"Pastoral • Cuidado",desc:"Edificação, cuidado, encorajamento e aplicação prática à igreja.",score:86,tags:["Pastoral","Aplicação","Igreja"]},
  {id:"biblico",code:"K7-002",icon:"📖",name:"Bíblico Clássico",tag:"Bíblico • Expositivo",desc:"Exposição do texto com contexto, fidelidade e aplicações claras.",score:90,tags:["Bíblico","Contextual","Expositivo"]},
  {id:"textual",code:"K7-004",icon:"🎯",name:"Textual",tag:"Texto curto • Estruturado",desc:"Parte de um texto curto e desenvolve suas divisões principais com clareza.",score:88,tags:["Textual","Objetivo","Estruturado"]},
  {id:"tematica",code:"K7-005",icon:"💡",name:"Temática",tag:"Tema central • Referências",desc:"Desenvolve um tema central usando passagens bíblicas relacionadas.",score:87,tags:["Tema","Referências","Didático"]},
  {id:"doutrinaria",code:"K7-006",icon:"📚",name:"Doutrinária",tag:"Doutrina • Ensino",desc:"Desenvolve uma doutrina usando o conjunto das Escrituras com equilíbrio.",score:92,tags:["Doutrina","Ensino","Teologia"]},
  {id:"exegetica",code:"K7-008",icon:"🔎",name:"Exegética",tag:"Análise • Profundidade",desc:"Aprofunda texto, contexto, termos, argumentos e conexões bíblicas.",score:94,tags:["Exegese","Contexto","Profundo"]}
 ];
 let selected=Store.get("studioDNASelection",["k7"]);if(!Array.isArray(selected)||!selected.length)selected=["k7"];
 const storedWeights=Store.get("studioDNAWeights",null)||{};
 const defaults=selected.length===1?[100]:selected.length===2?[60,40]:[50,30,20];
 const weights={};selected.forEach((id,i)=>weights[id]=Number(storedWeights[id]??defaults[i]??0));
 const total=Object.values(weights).reduce((a,b)=>a+b,0);if(total!==100){selected.forEach((id,i)=>weights[id]=defaults[i]??0)}
 const chars=Object.assign({fidelidade:90,exposicao:85,aplicacao:80,progressao:90,climax:95,apelo:85},Store.get("studioDNACharacteristics",{}));
 const savedProfileScores=Store.get("studioDNAScores",{});
 dnaProfiles.forEach(x=>{if(savedProfileScores && savedProfileScores[x.id]!=null)x.score=Math.max(0,Math.min(100,Number(savedProfileScores[x.id])||0))});
 const graphMode=Store.get("studioDNAGraphMode","gauge");
 const studioStep=Number(Store.get("studioStep",1))||1;
 if(studioStep===2){
  const comm=Object.assign({linguagem:55,ritmo:60,emocao:65,ilustracoes:50,referencias:75},Store.get("studioDNACommunication",{}));
  const intensity=Math.max(1,Math.min(5,Number(Store.get("studioDNAIntensity",3))||3));
  const primary=dnaProfiles.find(p=>p.id===selected[0])||dnaProfiles[0];
  const score=Math.round(Object.values(chars).reduce((a,b)=>a+Number(b),0)/6);
  const steps=[[1,"Selecionar DNA","Escolha um perfil ou crie"],[2,"Personalizar","Ajuste características"],[3,"Configurar Mensagem","Texto, tempo, público e foco"],[4,"Visualizar Estrutura","Veja o esboço gerado"],[5,"Gerar Mensagem","IA cria sua pregação"],[6,"Processando","Acompanhe a geração"],[7,"Mensagem","Resultado completo"]];
  const sliders=[["fidelidade","✦","Fidelidade Bíblica","Uso e exposição das Escrituras"],["exposicao","📖","Exposição bíblica","Profundidade da explicação do texto"],["aplicacao","💡","Aplicação prática","Conexão do texto com a vida"],["progressao","↗","Progressão","Crescimento e intensidade"],["climax","🔥","Clímax","Força do ponto culminante"],["apelo","🎯","Apelo","Convocação e desafio final"]];
  const comms=[["linguagem","Linguagem","Simples","Elaborada"],["ritmo","Ritmo","Reflexivo","Dinâmico"],["emocao","Emoção","Sóbrio","Intenso"],["ilustracoes","Ilustrações","Poucas","Frequentes"],["referencias","Referências bíblicas","Essenciais","Abundantes"]];
  return `<div class="studio-wizard studio-refined studio-step2">
   <section class="dna-studio-title"><div class="dna-title-mark">🧬</div><div><h2>DNA K7 Studio X</h2><p>Oficina de Padrões e Criação de Mensagens</p></div><div class="dna-title-actions"><button class="btn secondary">▶ Tutoriais</button><button class="btn secondary">📖 Biblioteca DNA</button><button class="btn secondary">♟ Meus Perfis</button><button class="btn secondary" data-go="dashboard">← Voltar ao Studio</button></div></section>
   <div class="studio-steps">${steps.map(([n,t,sub])=>`<div data-studio-step="${n}" onclick="return window.LMXStudioGoStep&&window.LMXStudioGoStep(${n})" role="button" tabindex="0" class="studio-step ${n===2?'active':''} ${n<2?'done':''}"><b>${n<2?'✓':n}</b><span><strong>${t}</strong><small>${sub}</small></span></div>`).join('')}</div>
   <div class="dna2-layout"><main>
    <section class="dna-ref-panel dna2-identity"><div class="dna-panel-head"><div><h3>Personalize o DNA selecionado</h3><p>Ajuste o comportamento da mensagem sem perder a identidade do perfil escolhido.</p></div><span class="dna2-badge">ETAPA 2 DE 7</span></div><div class="dna2-profile"><i>${primary.icon}</i><div><strong>${primary.name.replace(' K7','')}</strong><small>${primary.tag}</small></div><div class="dna2-score"><b id="dna2Score">${score}</b><small>DNA Score</small></div></div></section>
    <section class="dna-ref-panel"><div class="dna-panel-head"><div><h3>Características da mensagem</h3><p>Arraste cada barra para definir o peso de cada característica.</p></div></div><div class="dna-characteristics dna2-chars">${sliders.map(([k,ico,n,d])=>`<div class="dna-char-row"><div class="dna-char-info"><i>${ico}</i><div><strong>${n}</strong><small>${d}</small></div></div><input type="range" min="0" max="100" value="${chars[k]}" data-dna2-char="${k}" style="--range-fill:${chars[k]}%;--range-color:${logosPercentColor(chars[k])}"><output data-dna2-char-out="${k}">${chars[k]}%</output></div>`).join('')}</div></section>
    <section class="dna-ref-panel dna2-intensity"><div class="dna-panel-head"><div><h3>🔥 Intensidade DNA K7</h3><p>Controle quanto da progressão e energia K7 será aplicada à mensagem.</p></div><output id="dna2IntensityOut">${intensity}/5</output></div><input id="dna2Intensity" type="range" min="1" max="5" step="1" value="${intensity}" style="--range-fill:${(intensity-1)*25}%"><div class="dna2-scale"><span>1<br><small>Suave</small></span><span>2</span><span>3<br><small>Equilibrado</small></span><span>4</span><span>5<br><small>Intenso</small></span></div></section>
    <section class="dna-ref-panel"><div class="dna-panel-head"><div><h3>Características de comunicação</h3><p>Defina linguagem, ritmo, emoção e densidade dos recursos.</p></div></div><div class="dna2-communication">${comms.map(([k,n,l,r])=>`<div class="dna2-comm"><strong>${n}</strong><div><small>${l}</small><input type="range" min="0" max="100" value="${comm[k]}" data-dna2-comm="${k}" style="--range-fill:${comm[k]}%"><small>${r}</small></div><output data-dna2-comm-out="${k}">${comm[k]}%</output></div>`).join('')}</div></section>
    <section class="dna-ref-panel dna2-flow"><div class="dna-panel-head"><div><h3>Progressão da mensagem</h3><p>Fluxo estrutural que será entregue à próxima etapa.</p></div></div><div class="dna2-flowline"><span>Introdução</span><b>→</b><span>Contexto</span><b>→</b><span>Desenvolvimento</span><b>→</b><span>Aplicação</span><b>→</b><span>Clímax</span><b>→</b><span>Apelo</span></div></section>
   </main><aside class="dna-summary-col"><section class="dna-ref-panel dna-summary"><h3>Resumo do DNA Personalizado</h3><div class="dna-summary-top"><div class="dna-orbit"><div><b id="dnaScore">${score}</b><small>DNA Score</small></div></div><div class="dna-summary-bars">${sliders.map(([k,,n])=>`<label>${n}<i><b data-summary-bar="${k}" style="width:${chars[k]}%"></b></i><span data-summary-value="${k}">${chars[k]}</span></label>`).join('')}</div></div><div class="dna-style-box"><span>💡</span><div><strong>Estilo predominante</strong><p id="dna2Style">${primary.tag}. Intensidade K7 ${intensity}/5.</p></div></div></section><section class="dna-ref-panel dna2-changes"><h3>Alterações realizadas</h3><p>🧬 Base: <b>${primary.name}</b></p><p>🔥 Intensidade K7: <b id="dna2ChangeIntensity">${intensity}/5</b></p><p>⚙ Características personalizadas: <b>6</b></p><p>🎙 Comunicação personalizada: <b>5</b></p></section><section class="dna-ref-panel dna-tip"><b>💡 Dica</b><p>Os ajustes desta tela serão usados na configuração e na geração da mensagem.</p></section></aside></div>
   <section class="dna-nextbar dna2-actions"><button class="btn secondary" id="dna2Back">← Voltar: Selecionar DNA</button><button class="btn secondary" id="dna2Reset">↺ Restaurar padrão</button><button class="btn secondary" id="dna2Save">💾 Salvar como novo DNA</button><button class="dna-next-btn" id="dna2Next">Continuar <small>Configurar Mensagem</small> →</button></section>
  </div>`;
 }
 if(studioStep===3){
  const cfg=Object.assign({sourceMode:"passagem",text:"",theme:"",sermonType:"Expositiva",duration:40,occasion:"Culto de Ensino",audience:"Igreja local",objective:"",bibleVersion:"ARA",points:"4",focus:"Equilibrado",notes:""},Store.get("studioMessageConfig",{}));
  const primary=dnaProfiles.find(p=>p.id===selected[0])||dnaProfiles[0];
  const intensity=Math.max(1,Math.min(5,Number(Store.get("studioDNAIntensity",3))||3));
  const score=Math.round(Object.values(chars).reduce((a,b)=>a+Number(b),0)/6);
  const steps=[[1,"Selecionar DNA","Escolha um perfil ou crie"],[2,"Personalizar","Ajuste características"],[3,"Configurar Mensagem","Texto, tempo, público e foco"],[4,"Visualizar Estrutura","Veja o esboço gerado"],[5,"Gerar Mensagem","IA cria sua pregação"],[6,"Processando","Acompanhe a geração"],[7,"Mensagem","Resultado completo"]];
  const sermonTypes=["Expositiva","Textual","Temática","Doutrinária","Narrativa","Biográfica","Exegética","Evangelística","Pastoral","Missionária","Pentecostal","DNA K7","Apologética","Problema–Solução","Pergunta–Resposta","Cadeia Bíblica","Histórico-Contextual","Ilustrativa","Indutiva","Dedutiva"];
  const occasions=["Culto de Ensino","Culto de Domingo","Culto de Oração","Culto de Missões","Culto Evangelístico","Santa Ceia","Congresso","Conferência","EBD / Aula","Jovens","Círculo de Oração","Casamento","Velório","Outro"];
  const audiences=["Igreja local","Público geral","Novos convertidos","Jovens","Adolescentes","Crianças","Líderes","Obreiros","Famílias","Mulheres","Homens","Não cristãos / visitantes"];
  return `<div class="studio-wizard studio-refined studio-step3">
   <section class="dna-studio-title"><div class="dna-title-mark">🧬</div><div><h2>DNA K7 Studio X</h2><p>Oficina de Padrões e Criação de Mensagens</p></div><div class="dna-title-actions"><button class="btn secondary">▶ Tutoriais</button><button class="btn secondary">📖 Biblioteca DNA</button><button class="btn secondary">♟ Meus Perfis</button><button class="btn secondary" data-go="dashboard">← Voltar ao Studio</button></div></section>
   <div class="studio-steps">${steps.map(([n,t,sub])=>`<div data-studio-step="${n}" onclick="return window.LMXStudioGoStep&&window.LMXStudioGoStep(${n})" role="button" tabindex="0" class="studio-step ${n===3?'active':''} ${n<3?'done':''}"><b>${n<3?'✓':n}</b><span><strong>${t}</strong><small>${sub}</small></span></div>`).join('')}</div>
   <div class="dna3-layout"><main>
    <section class="dna-ref-panel dna3-head"><div class="dna-panel-head"><div><h3>Configure a mensagem</h3><p>Defina o texto, o formato, o tempo, o público e o objetivo. O DNA escolhido será preservado.</p></div><span class="dna2-badge">ETAPA 3 DE 7</span></div><div class="dna3-dna-strip"><span>${primary.icon}</span><div><strong>${primary.name}</strong><small>${primary.tag} • Intensidade K7 ${intensity}/5</small></div><b>${score}<small>DNA Score</small></b></div></section>
    <section class="dna-ref-panel"><div class="dna-panel-head"><div><h3>📖 Base da mensagem</h3><p>Escolha se a geração parte principalmente de uma passagem ou de um tema.</p></div></div><div class="dna3-mode"><button type="button" data-dna3-mode="passagem" class="${cfg.sourceMode==='passagem'?'active':''}">📖 Passagem bíblica</button><button type="button" data-dna3-mode="tema" class="${cfg.sourceMode==='tema'?'active':''}">💡 Tema</button><button type="button" data-dna3-mode="ambos" class="${cfg.sourceMode==='ambos'?'active':''}">🔗 Texto + Tema</button></div><div class="dna3-fields two"><label><span>Texto bíblico / referência</span><input id="dna3Text" value="${escapeHtml(cfg.text)}" placeholder="Ex.: Isaías 6:1-8"></label><label><span>Tema / título provisório</span><input id="dna3Theme" value="${escapeHtml(cfg.theme)}" placeholder="Ex.: Eis-me aqui — chamado à missão"></label></div><label class="dna3-full"><span>Objetivo central da mensagem</span><textarea id="dna3Objective" rows="3" placeholder="O que você deseja que a igreja compreenda, sinta ou faça ao final?">${escapeHtml(cfg.objective)}</textarea></label></section>
    <section class="dna-ref-panel"><div class="dna-panel-head"><div><h3>🎯 Formato homilético</h3><p>Defina a forma de desenvolvimento da mensagem.</p></div></div><div class="dna3-fields three"><label><span>Tipo de mensagem</span><select id="dna3SermonType">${sermonTypes.map(x=>`<option ${x===cfg.sermonType?'selected':''}>${x}</option>`).join('')}</select></label><label><span>Versão bíblica</span><select id="dna3BibleVersion">${["ARA","ARC","NAA","NVI","ACF","KJV","Outra"].map(x=>`<option ${x===cfg.bibleVersion?'selected':''}>${x}</option>`).join('')}</select></label><label><span>Pontos principais</span><select id="dna3Points">${[["auto","Automático"],["3","3 pontos"],["4","4 pontos"],["5","5 pontos"],["6","6 pontos"]].map(([v,n])=>`<option value="${v}" ${String(cfg.points)===v?'selected':''}>${n}</option>`).join('')}</select></label></div><div class="dna3-focus"><span>Foco predominante</span>${["Bíblico","Aplicativo","Pastoral","Evangelístico","Doutrinário","Equilibrado"].map(x=>`<button type="button" data-dna3-focus="${x}" class="${cfg.focus===x?'active':''}">${x}</button>`).join('')}</div></section>
    <section class="dna-ref-panel"><div class="dna-panel-head"><div><h3>⏱ Tempo, ocasião e público</h3><p>Esses dados controlam extensão, ritmo, exemplos e profundidade.</p></div></div><div class="dna3-duration"><span>Duração estimada</span><div>${[20,35,40,50,70].map(x=>`<button type="button" data-dna3-duration="${x}" class="${Number(cfg.duration)===x?'active':''}"><b>${x}</b><small>min</small></button>`).join('')}</div></div><div class="dna3-fields two"><label><span>Ocasião / culto</span><select id="dna3Occasion">${occasions.map(x=>`<option ${x===cfg.occasion?'selected':''}>${x}</option>`).join('')}</select></label><label><span>Público</span><select id="dna3Audience">${audiences.map(x=>`<option ${x===cfg.audience?'selected':''}>${x}</option>`).join('')}</select></label></div></section>
    <section class="dna-ref-panel"><div class="dna-panel-head"><div><h3>📝 Direcionamento adicional</h3><p>Opcional. Use somente para informações que realmente precisam entrar na estrutura.</p></div></div><textarea id="dna3Notes" rows="4" placeholder="Ex.: enfatizar contexto histórico, incluir chamada missionária, evitar linguagem excessivamente técnica...">${escapeHtml(cfg.notes)}</textarea></section>
   </main><aside class="dna-summary-col"><section class="dna-ref-panel dna3-summary"><h3>Resumo da Configuração</h3><div class="dna3-summary-hero"><span>${primary.icon}</span><div><strong id="dna3SummaryTitle">${escapeHtml(cfg.theme||cfg.text||'Mensagem ainda sem título')}</strong><small>${primary.name} • K7 ${intensity}/5</small></div></div><dl><div><dt>Base</dt><dd id="dna3SummaryBase">${escapeHtml(cfg.text||'Não definida')}</dd></div><div><dt>Formato</dt><dd id="dna3SummaryType">${escapeHtml(cfg.sermonType)}</dd></div><div><dt>Duração</dt><dd id="dna3SummaryDuration">${cfg.duration} min</dd></div><div><dt>Ocasião</dt><dd id="dna3SummaryOccasion">${escapeHtml(cfg.occasion)}</dd></div><div><dt>Público</dt><dd id="dna3SummaryAudience">${escapeHtml(cfg.audience)}</dd></div><div><dt>Foco</dt><dd id="dna3SummaryFocus">${escapeHtml(cfg.focus)}</dd></div></dl><div class="dna-style-box"><span>✓</span><div><strong>DNA preservado</strong><p>As características personalizadas da Etapa 2 serão combinadas com esta configuração.</p></div></div></section><section class="dna-ref-panel dna-tip"><b>💡 Como funciona</b><p>A Etapa 4 usará estes dados para montar a estrutura completa antes de qualquer geração por IA.</p></section></aside></div>
   <section class="dna-nextbar dna3-actions"><button class="btn secondary" id="dna3Back">← Voltar: Personalizar</button><button class="btn secondary" id="dna3Save">💾 Salvar configuração</button><button class="dna-next-btn" id="dna3Next">Continuar <small>Visualizar Estrutura</small> →</button></section>
  </div>`;
 }

 if(studioStep===4){
  const cfg=Object.assign({sourceMode:"passagem",text:"",theme:"",sermonType:"Expositiva",duration:40,occasion:"Culto de Ensino",audience:"Igreja local",objective:"",bibleVersion:"ARA",points:"4",focus:"Equilibrado",notes:""},Store.get("studioMessageConfig",{}));
  const primary=dnaProfiles.find(p=>p.id===selected[0])||dnaProfiles[0];
  const intensity=Math.max(1,Math.min(5,Number(Store.get("studioDNAIntensity",3))||3));
  const score=Math.round(Object.values(chars).reduce((a,b)=>a+Number(b),0)/6);
  const steps=[[1,"Selecionar DNA","Escolha um perfil ou crie"],[2,"Personalizar","Ajuste características"],[3,"Configurar Mensagem","Texto, tempo, público e foco"],[4,"Visualizar Estrutura","Veja o esboço gerado"],[5,"Gerar Mensagem","IA cria sua pregação"],[6,"Processando","Acompanhe a geração"],[7,"Mensagem","Resultado completo"]];
  const requested=cfg.points==='auto'?4:Math.max(3,Math.min(6,Number(cfg.points)||4));
  const defaultTitles=["Abertura do texto e tensão principal","Contexto e verdade central","Desenvolvimento bíblico e argumento","Aplicação à vida e à igreja","Progressão para o clímax","Resposta, apelo e direção final"];
  const saved=Store.get("studioMessageStructure",null)||{};
  const structure={title:saved.title||cfg.theme||cfg.text||"Estrutura da mensagem",bigIdea:saved.bigIdea||cfg.objective||`Expor ${cfg.text||cfg.theme||'a verdade bíblica'} com clareza, progressão e aplicação.`,intro:saved.intro!==false,context:saved.context!==false,applications:saved.applications!==false,climax:saved.climax!==false,appeal:saved.appeal!==false,prayer:saved.prayer!==false,points:Array.isArray(saved.points)&&saved.points.length?saved.points.slice(0,requested):[]};
  while(structure.points.length<requested) structure.points.push({title:defaultTitles[structure.points.length]||`Ponto ${structure.points.length+1}`,note:"",weight:Math.round(100/requested)});
  const totalWeight=structure.points.reduce((a,p)=>a+(Number(p.weight)||0),0)||100;
  const mins=Math.max(20,Number(cfg.duration)||40);
  const segmentMins=structure.points.map(p=>Math.max(2,Math.round(mins*(Number(p.weight)||0)/totalWeight)));
  return `<div class="studio-wizard studio-refined studio-step4">
   <section class="dna-studio-title"><div class="dna-title-mark">🧬</div><div><h2>DNA K7 Studio X</h2><p>Oficina de Padrões e Criação de Mensagens</p></div><div class="dna-title-actions"><button class="btn secondary">▶ Tutoriais</button><button class="btn secondary">📖 Biblioteca DNA</button><button class="btn secondary">♟ Meus Perfis</button><button class="btn secondary" data-go="dashboard">← Voltar ao Studio</button></div></section>
   <div class="studio-steps">${steps.map(([n,t,sub])=>`<div data-studio-step="${n}" onclick="return window.LMXStudioGoStep&&window.LMXStudioGoStep(${n})" role="button" tabindex="0" class="studio-step ${n===4?'active':''} ${n<4?'done':''}"><b>${n<4?'✓':n}</b><span><strong>${t}</strong><small>${sub}</small></span></div>`).join('')}</div>
   <div class="dna4-layout"><main>
    <section class="dna-ref-panel dna4-head"><div class="dna-panel-head"><div><h3>Visualize e ajuste a estrutura</h3><p>Revise o esqueleto da mensagem antes da geração. Tudo aqui pode ser ajustado sem alterar o DNA das etapas anteriores.</p></div><span class="dna2-badge">ETAPA 4 DE 7</span></div><div class="dna4-source"><span>📖 <b>${escapeHtml(cfg.text||'Tema livre')}</b></span><span>🏷 ${escapeHtml(cfg.theme||'Sem título definido')}</span><span>⏱ ${cfg.duration} min</span><span>🎯 ${escapeHtml(cfg.sermonType)}</span></div></section>
    <section class="dna-ref-panel dna4-idea"><div class="dna-panel-head"><div><h3>💡 Grande ideia</h3><p>A frase central que deve unir toda a mensagem.</p></div><span class="dna4-live">EDIÇÃO AO VIVO</span></div><input id="dna4Title" value="${escapeHtml(structure.title)}" aria-label="Título da estrutura"><textarea id="dna4BigIdea" rows="3" aria-label="Grande ideia">${escapeHtml(structure.bigIdea)}</textarea></section>
    <section class="dna-ref-panel dna4-outline"><div class="dna-panel-head"><div><h3>🧱 Estrutura principal</h3><p>Reordene mentalmente, renomeie os pontos e ajuste o peso de cada divisão.</p></div><b id="dna4PointCount">${requested} pontos</b></div><div id="dna4Points">${structure.points.map((p,i)=>`<article class="dna4-point" data-dna4-point="${i}"><div class="dna4-number">${i+1}</div><div class="dna4-point-body"><div class="dna4-point-top"><input data-dna4-title="${i}" value="${escapeHtml(p.title)}"><span><b data-dna4-min="${i}">${segmentMins[i]}</b> min</span></div><textarea data-dna4-note="${i}" rows="2" placeholder="Observação, texto de apoio ou direção deste ponto...">${escapeHtml(p.note||'')}</textarea><div class="dna4-weight"><small>Peso na mensagem</small><input type="range" min="10" max="50" value="${Number(p.weight)||Math.round(100/requested)}" data-dna4-weight="${i}" style="--range-fill:${Math.min(100,(Number(p.weight)||25)*2)}%"><output data-dna4-weight-out="${i}">${Number(p.weight)||Math.round(100/requested)}%</output></div></div></article>`).join('')}</div></section>
    <section class="dna-ref-panel dna4-elements"><div class="dna-panel-head"><div><h3>🧩 Elementos da mensagem</h3><p>Ative ou desative elementos que devem aparecer na geração final.</p></div></div><div class="dna4-toggle-grid">${[["intro","🎬","Introdução","Abertura e conexão inicial"],["context","🗺","Contexto","Ambiente histórico e literário"],["applications","💡","Aplicações","Aplicações práticas por seção"],["climax","🔥","Clímax","Ponto culminante da progressão"],["appeal","🎯","Apelo","Convite e resposta final"],["prayer","🙏","Oração","Oração coerente com a mensagem"]].map(([k,ico,n,d])=>`<button type="button" data-dna4-toggle="${k}" class="${structure[k]?'active':''}"><i>${ico}</i><span><b>${n}</b><small>${d}</small></span><em>${structure[k]?'ON':'OFF'}</em></button>`).join('')}</div></section>
    <section class="dna-ref-panel dna4-flow"><div class="dna-panel-head"><div><h3>↗ Fluxo previsto</h3><p>A progressão abaixo será usada como mapa da etapa de geração.</p></div></div><div class="dna4-flowline"><span>Abertura</span><b>→</b>${structure.points.map((_,i)=>`<span>P${i+1}</span><b>→</b>`).join('')}<span>Clímax</span><b>→</b><span>Apelo</span></div></section>
   </main><aside class="dna-summary-col"><section class="dna-ref-panel dna4-summary"><h3>Resumo da Estrutura</h3><div class="dna4-score"><div><b>${score}</b><small>DNA Score</small></div><span>${primary.icon}<strong>${primary.name}</strong><small>K7 ${intensity}/5</small></span></div><dl><div><dt>Passagem</dt><dd>${escapeHtml(cfg.text||'Não definida')}</dd></div><div><dt>Tema</dt><dd>${escapeHtml(cfg.theme||'Não definido')}</dd></div><div><dt>Pontos</dt><dd id="dna4SidePoints">${requested}</dd></div><div><dt>Duração</dt><dd>${cfg.duration} min</dd></div><div><dt>Público</dt><dd>${escapeHtml(cfg.audience)}</dd></div><div><dt>Foco</dt><dd>${escapeHtml(cfg.focus)}</dd></div></dl><div class="dna4-readiness"><span>✓</span><div><strong>Estrutura pronta para revisão</strong><p>As alterações ficam salvas localmente em tempo real.</p></div></div></section><section class="dna-ref-panel dna4-map"><h3>Mapa da mensagem</h3><ol>${structure.points.map((p,i)=>`<li><b>${i+1}</b><span data-dna4-map="${i}">${escapeHtml(p.title)}</span></li>`).join('')}</ol></section><section class="dna-ref-panel dna-tip"><b>💡 Dica</b><p>Na Etapa 5 você confirma esta estrutura e escolhe a geração completa ou somente o esboço.</p></section></aside></div>
   <section class="dna-nextbar dna4-actions"><button class="btn secondary" id="dna4Back">← Voltar: Configurar Mensagem</button><button class="btn secondary" id="dna4Reset">↺ Recriar estrutura</button><button class="btn secondary" id="dna4Save">💾 Salvar estrutura</button><button class="dna-next-btn" id="dna4Next">Continuar <small>Gerar Mensagem</small> →</button></section>
  </div>`;
 }
 if(studioStep===7){
  const generated=Object.assign({text:"",mode:Store.get("studioGenerationMode","completa"),cmd:"SERMÃO",created:null,provider:"",model:"",engine:"local",quality:null,seconds:0,config:{},structure:{}},Store.get("studioGeneratedMessage",{}));
  const cfg=Object.assign({text:"",theme:"",sermonType:"Expositiva",duration:40,occasion:"Culto de Ensino",audience:"Igreja local",objective:"",bibleVersion:"ARA",focus:"Equilibrado",notes:""},Store.get("studioMessageConfig",{}),generated.config||{});
  const st=Object.assign({title:cfg.theme||cfg.text||"Mensagem gerada",bigIdea:cfg.objective||"",intro:true,context:true,applications:true,climax:true,appeal:true,prayer:true,points:[]},Store.get("studioMessageStructure",{}),generated.structure||{});
  const intensity=Math.max(1,Math.min(5,Number(Store.get("studioDNAIntensity",3))||3));
  const primary=dnaProfiles.find(p=>p.id===selected[0])||dnaProfiles[0];
  const score=Math.round(Object.values(chars).reduce((a,b)=>a+Number(b),0)/6);
  const steps=[[1,"Selecionar DNA","Escolha um perfil ou crie"],[2,"Personalizar","Ajuste características"],[3,"Configurar Mensagem","Texto, tempo, público e foco"],[4,"Visualizar Estrutura","Veja o esboço gerado"],[5,"Gerar Mensagem","Revise e confirme a geração"],[6,"Processando","Acompanhe a geração"],[7,"Mensagem","Resultado completo"]];
  const tab=Store.get("studioResultTab","mensagem");
  const title=String(st.title||cfg.theme||cfg.text||"Mensagem gerada").trim();
  const points=Array.isArray(st.points)?st.points:[];
  const created=generated.created?new Date(generated.created):null;
  const words=String(generated.text||"").trim()?String(generated.text).trim().split(/\s+/).length:0;
  const readingMinutes=Math.max(1,Math.ceil(words/130));
  const generationStatus=(generated.provider||generated.engine||"local")==="local"?"Fallback local":"IA concluída";
  const outline=`${title}\n\n${st.bigIdea?`GRANDE IDEIA\n${st.bigIdea}\n\n`:""}${points.map((p,i)=>`${i+1}. ${p.title||`Ponto ${i+1}`}${p.note?`\n   ${p.note}`:""}`).join("\n\n")}${st.applications?"\n\nAPLICAÇÕES\n• Aplicações práticas conforme o desenvolvimento gerado.":""}${st.climax?"\n\nCLÍMAX\n• Progressão para o ponto culminante da mensagem.":""}${st.appeal?"\n\nAPELO\n• Convite coerente com a verdade central.":""}${st.prayer?"\n\nORAÇÃO\n• Encerramento em oração.":""}`;
  let resultBody="";
  if(!generated.text){
    resultBody=`<section class="dna-ref-panel dna7-empty"><span>!</span><div><h3>Nenhuma mensagem concluída foi encontrada</h3><p>Volte à Etapa 6 e conclua o processamento. As configurações anteriores continuam salvas localmente.</p></div></section>`;
  }else if(tab==="esboco"){
    resultBody=`<section class="dna-ref-panel dna7-outline"><div class="dna-panel-head"><div><h3>🧱 Esboço final</h3><p>Estrutura aprovada antes da geração, preservada junto com a mensagem.</p></div><span class="dna7-mode">${generated.mode==='esboco'?'SAÍDA PRINCIPAL':'VISÃO ESTRUTURAL'}</span></div>${st.bigIdea?`<div class="dna7-bigidea"><span>Grande ideia</span><strong>${escapeHtml(st.bigIdea)}</strong></div>`:""}<div class="dna7-point-list">${points.length?points.map((p,i)=>`<article><b>${i+1}</b><div><h4>${escapeHtml(p.title||`Ponto ${i+1}`)}</h4>${p.note?`<p>${escapeHtml(p.note)}</p>`:""}</div><em>${Number(p.weight)||0}%</em></article>`).join(""):`<p class="muted">A estrutura não possui pontos registrados.</p>`}</div><div class="dna7-elements">${[["intro","Introdução"],["context","Contexto"],["applications","Aplicações"],["climax","Clímax"],["appeal","Apelo"],["prayer","Oração"]].filter(([k])=>st[k]!==false).map(([,n])=>`<span>✓ ${n}</span>`).join("")}</div></section>`;
  }else if(tab==="ficha"){
    resultBody=`<section class="dna-ref-panel dna7-sheet"><div class="dna-panel-head"><div><h3>📋 Ficha técnica da geração</h3><p>Parâmetros usados pelo DNA K7 Studio X nesta mensagem.</p></div><span class="dna7-mode">REGISTRO LOCAL</span></div><div class="dna7-sheet-grid">${[["Passagem / Base",cfg.text||cfg.theme||"—"],["Tema",cfg.theme||"—"],["Formato",cfg.sermonType||"—"],["Duração",`${Number(cfg.duration)||40} min`],["Ocasião",cfg.occasion||"—"],["Público",cfg.audience||"—"],["Versão bíblica",cfg.bibleVersion||"—"],["Foco",cfg.focus||"—"],["DNA",primary.name],["DNA Score",`${score}/100`],["Intensidade K7",`${intensity}/5`],["Saída",generated.mode==='esboco'?"Somente esboço":"Mensagem completa"],["Motor",generated.provider||generated.engine||"local"],["Modelo",generated.model||"—"],["Quality Gate",generated.quality!=null?`${generated.quality}%`:"—"],["Tempo de geração",`${Number(generated.seconds)||0}s`]].map(([a,b])=>`<div><span>${escapeHtml(a)}</span><strong>${escapeHtml(b)}</strong></div>`).join("")}</div>${cfg.objective?`<div class="dna7-note"><span>Objetivo</span><p>${escapeHtml(cfg.objective)}</p></div>`:""}${cfg.notes?`<div class="dna7-note"><span>Orientações adicionais</span><p>${escapeHtml(cfg.notes)}</p></div>`:""}</section>`;
  }else{
    resultBody=`<section class="dna7-message-wrap">${renderGeneratedMessage(generated.text,{command:generated.mode==='esboco'?"ESBOÇO • STUDIO X":"SERMÃO • STUDIO X",intensity:intensity*2,provider:generated.provider||generated.engine||"local",seconds:generated.seconds,quality:generated.quality,duration:Number(cfg.duration)||40})}</section>`;
  }
  return `<div class="studio-wizard studio-refined studio-step7">
   <section class="dna-studio-title"><div class="dna-title-mark">🧬</div><div><h2>DNA K7 Studio X</h2><p>Oficina de Padrões e Criação de Mensagens</p></div><div class="dna-title-actions"><button class="btn secondary">▶ Tutoriais</button><button class="btn secondary">📖 Biblioteca DNA</button><button class="btn secondary">♟ Meus Perfis</button><button class="btn secondary" data-go="dashboard">← Voltar ao Studio</button></div></section>
   <div class="studio-steps">${steps.map(([n,t,sub])=>`<div data-studio-step="${n}" onclick="return window.LMXStudioGoStep&&window.LMXStudioGoStep(${n})" role="button" tabindex="0" class="studio-step ${n===7?'active':''} ${n<7?'done':''}"><b>${n<7?'✓':n}</b><span><strong>${t}</strong><small>${sub}</small></span></div>`).join('')}</div>
   <div class="dna7-layout"><main>
    <section class="dna-ref-panel dna7-header"><div class="dna7-success">✓</div><div><span class="dna7-kicker">ETAPA 7 DE 7 • CONCLUÍDA</span><h2>${escapeHtml(title)}</h2><p>${escapeHtml(cfg.text||cfg.theme||'Mensagem criada pelo DNA K7 Studio X')} • ${escapeHtml(cfg.sermonType)} • ${Number(cfg.duration)||40} min</p></div><div class="dna7-qg"><span>Quality Gate</span><strong>${generated.quality!=null?escapeHtml(generated.quality)+'%':'✓'}</strong></div></section>
    <nav class="dna7-tabs" aria-label="Resultado"><button class="${tab==='mensagem'?'active':''}" data-dna7-tab="mensagem">📖 Mensagem completa</button><button class="${tab==='esboco'?'active':''}" data-dna7-tab="esboco">🧱 Esboço</button><button class="${tab==='ficha'?'active':''}" data-dna7-tab="ficha">📋 Ficha técnica</button></nav>
    <section class="dna-ref-panel dna7-visual-replay"><div class="quick-visual-head"><div><strong>🎬 Visual da geração</strong><small>Alterne entre os três visuais sem alterar a mensagem gerada.</small></div><div class="gen-visual-switch gen-visual-master"><button type="button" data-gen-visual="cinematic">✦ DNA → K7 → Bíblia <small>Padrão</small></button><button type="button" data-open-gen-gallery>◉ Escolher entre 12 visuais</button></div></div><div id="studioResultVisual" class="shared-gen-visual replay"></div></section>
    <div id="dna7Result">${resultBody}</div>
   </main><aside class="dna-summary-col">
    <section class="dna-ref-panel dna7-summary"><h3>Resumo final</h3><div class="dna5-profile"><span>${primary.icon}</span><div><strong>${primary.name}</strong><small>${primary.tag}</small></div></div><dl><div><dt>DNA Score</dt><dd>${score}/100</dd></div><div><dt>K7</dt><dd>${intensity}/5</dd></div><div><dt>Formato</dt><dd>${escapeHtml(cfg.sermonType)}</dd></div><div><dt>Duração</dt><dd>${Number(cfg.duration)||40} min</dd></div><div><dt>Palavras</dt><dd>${words.toLocaleString('pt-BR')}</dd></div><div><dt>Pontos</dt><dd>${points.length||'—'}</dd></div><div><dt>Saída</dt><dd>${generated.mode==='esboco'?'Esboço':'Completa'}</dd></div></dl></section>
    <section class="dna-ref-panel dna7-engine"><div class="dna7-side-head"><h3>Geração</h3><span class="dna7-status-pill">${escapeHtml(generationStatus)}</span></div><div class="dna7-engine-main"><span class="dna5-provider-dot online"></span><strong>${escapeHtml(generated.provider||generated.engine||'local')}</strong></div><div class="dna7-mini-grid"><div><span>Modelo</span><b>${escapeHtml(generated.model||'Automático')}</b></div><div><span>Tempo</span><b>${Number(generated.seconds)||0}s</b></div><div><span>Leitura</span><b>~${readingMinutes} min</b></div><div><span>QG</span><b>${generated.quality!=null?escapeHtml(generated.quality)+'%':'—'}</b></div></div><p class="dna7-engine-date">${created?`Concluída em ${created.toLocaleString('pt-BR')}.`:"Resultado preservado localmente."}</p></section>
    <section class="dna-ref-panel dna7-context-mini"><h3>Contexto</h3><div class="dna7-context-grid"><div><span>📖 Texto</span><strong>${escapeHtml(cfg.text||cfg.theme||'—')}</strong></div><div><span>⛪ Ocasião</span><strong>${escapeHtml(cfg.occasion||'—')}</strong></div><div><span>👥 Público</span><strong>${escapeHtml(cfg.audience||'—')}</strong></div><div><span>🎯 Foco</span><strong>${escapeHtml(cfg.focus||'Equilibrado')}</strong></div></div></section>
    <section class="dna-ref-panel dna7-shortcuts"><h3>Ações rápidas</h3><button id="dna7Copy"><span>📋 Copiar</span><small>Mensagem</small></button><button id="dna7Editor"><span>📝 Editor</span><small>Continuar</small></button><button id="dna7Library"><span>💾 Biblioteca</span><small>Salvar</small></button><button id="dna7Download"><span>⬇ TXT</span><small>Baixar</small></button><button id="dna7Share"><span>↗ Compartilhar</span><small>Enviar / usar</small></button></section>
    <section class="dna-ref-panel dna-tip"><b>✓ Fluxo concluído</b><p>As 7 etapas ficaram registradas localmente. Você pode editar a mensagem, salvar na Biblioteca ou iniciar uma nova geração.</p></section>
   </aside></div>
   <section class="dna-nextbar dna7-actions"><button class="btn secondary" id="dna7Back">← Voltar: Processamento</button><button class="btn secondary" id="dna7EditStructure">🧱 Editar estrutura</button><button class="btn secondary" id="dna7New">＋ Nova mensagem</button><button class="dna-next-btn" id="dna7EditorBottom">Abrir no Editor <small>Continuar trabalhando</small> →</button></section>
  </div>`;
 }
 if(studioStep===6){
  const cfg=Object.assign({text:"",theme:"",sermonType:"Expositiva",duration:40,occasion:"Culto de Ensino",audience:"Igreja local",objective:"",notes:""},Store.get("studioMessageConfig",{}));
  const st=Object.assign({title:cfg.theme||cfg.text||"Estrutura da mensagem",bigIdea:cfg.objective||"",intro:true,context:true,applications:true,climax:true,appeal:true,prayer:true,points:[]},Store.get("studioMessageStructure",{}));
  const req=Object.assign({mode:Store.get("studioGenerationMode","completa"),status:"ready"},Store.get("studioGenerationRequest",{}));
  const intensity=Math.max(1,Math.min(5,Number(Store.get("studioDNAIntensity",3))||3));
  const primary=dnaProfiles.find(p=>p.id===selected[0])||dnaProfiles[0];
  const score=Math.round(Object.values(chars).reduce((a,b)=>a+Number(b),0)/6);
  const proc=Object.assign({status:"idle",progress:0,phase:0,message:"Preparando geração...",started:null,finished:null,engine:"",provider:"",model:"",quality:null,error:""},Store.get("studioProcessing",{}));
  const steps=[[1,"Selecionar DNA","Escolha um perfil ou crie"],[2,"Personalizar","Ajuste características"],[3,"Configurar Mensagem","Texto, tempo, público e foco"],[4,"Visualizar Estrutura","Veja o esboço gerado"],[5,"Gerar Mensagem","Revise e confirme a geração"],[6,"Processando","Acompanhe a geração"],[7,"Mensagem","Resultado completo"]];
  const phases=[["Preparando","Consolidando DNA, texto e estrutura"],["Roteando IA","Selecionando o melhor motor disponível"],["Gerando","Desenvolvendo a mensagem por blocos"],["Quality Gate","Verificando coerência e fidelidade"],["Finalizando","Organizando o resultado para a Etapa 7"]];
  const elapsed=proc.started?Math.max(0,Math.round(((proc.finished?new Date(proc.finished):new Date())-new Date(proc.started))/1000)):0;
  const isDone=proc.status==="done";
  const isError=proc.status==="error";
  return `<div class="studio-wizard studio-refined studio-step6">
   <section class="dna-studio-title"><div class="dna-title-mark">🧬</div><div><h2>DNA K7 Studio X</h2><p>Oficina de Padrões e Criação de Mensagens</p></div><div class="dna-title-actions"><button class="btn secondary">▶ Tutoriais</button><button class="btn secondary">📖 Biblioteca DNA</button><button class="btn secondary">♟ Meus Perfis</button><button class="btn secondary" data-go="dashboard">← Voltar ao Studio</button></div></section>
   <div class="studio-steps">${steps.map(([n,t,sub])=>`<div data-studio-step="${n}" onclick="return window.LMXStudioGoStep&&window.LMXStudioGoStep(${n})" role="button" tabindex="0" class="studio-step ${n===6?'active':''} ${n<6?'done':''}"><b>${n<6?'✓':n}</b><span><strong>${t}</strong><small>${sub}</small></span></div>`).join('')}</div>
   <div class="dna6-layout"><main>
    <section class="dna-ref-panel dna6-main"><div class="dna-panel-head"><div><h3>${isDone?'Geração concluída':isError?'A geração encontrou um problema':'Gerando sua mensagem'}</h3><p id="dna6StatusText">${escapeHtml(proc.message||'Preparando geração...')}</p></div><div class="dna6-head-tools"><button type="button" id="dna6EmergencyUnlock" class="dna6-emergency-unlock" onclick="return window.LOGOS_STEP6_UNLOCK && window.LOGOS_STEP6_UNLOCK()" title="Cancela apenas o processamento da Etapa 6 e volta para revisar a geração">⚠ Travou? <b>↻ DESTRAVAR</b></button><span class="dna6-badge ${isDone?'done':isError?'error':''}">${isDone?'CONCLUÍDO':isError?'ATENÇÃO':'ETAPA 6 DE 7'}</span></div></div>
     <div class="studio-visual-switch-wrap"><span>Visual da geração</span><div class="gen-visual-switch gen-visual-master"><button type="button" data-gen-visual="cinematic">✦ DNA → K7 → Bíblia <small>Padrão</small></button><button type="button" data-open-gen-gallery>◉ Escolher entre 12 visuais</button></div></div>
     <div id="studioGenVisual" class="shared-gen-visual"></div>
     <div class="dna6-percent"><strong id="dna6Percent">${isDone?100:Math.max(0,Math.min(99,Number(proc.progress)||0))}%</strong><span id="dna6Phase">${isDone?'Finalizado':isError?'Interrompido':phases[Math.max(0,Math.min(phases.length-1,Number(proc.phase)||0))][0]}</span></div>
     <div class="dna6-track"><i id="dna6Track" style="width:${isDone?100:Math.max(0,Math.min(99,Number(proc.progress)||0))}%"></i></div>
     <div class="dna6-phases">${phases.map((x,i)=>`<div class="${isDone||i<(Number(proc.phase)||0)?'done':i===(Number(proc.phase)||0)&&!isError?'active':isError&&i===(Number(proc.phase)||0)?'error':''}" data-dna6-phase="${i}"><b>${isDone||i<(Number(proc.phase)||0)?'✓':i+1}</b><span><strong>${x[0]}</strong><small>${x[1]}</small></span></div>`).join('')}</div>
     ${isError?`<div class="dna6-error"><strong>⚠ ${escapeHtml(proc.error||'Não foi possível concluir a geração.')}</strong><p>Você pode tentar novamente. A configuração das Etapas 1–5 continua salva.</p></div>`:''}
     ${isDone?`<div class="dna6-complete"><span>✓</span><div><strong>Material pronto para a Etapa 7</strong><p>${proc.provider?`Gerado por ${escapeHtml(proc.provider)}${proc.model?' • '+escapeHtml(proc.model):''}.`:proc.engine==='local'?'Gerado pelo pipeline local.':'Geração concluída.'} ${proc.quality!=null?`Quality Gate: ${escapeHtml(proc.quality)}%.`:''}</p></div></div>`:''}
    </section>
    <section class="dna-ref-panel dna6-live"><div class="dna-panel-head"><div><h3>Monitor da geração</h3><p>Acompanhe o que o Studio X está executando sem sair desta tela.</p></div><span id="dna6Elapsed">${elapsed}s</span></div><div id="dna6Log" class="dna6-log"><p><time>•</time> Solicitação recebida da Etapa 5.</p><p><time>•</time> DNA ${escapeHtml(primary.name)} • Score ${score} • K7 ${intensity}/5.</p><p><time>•</time> Saída: ${req.mode==='esboco'?'Somente esboço':'Mensagem completa'} • ${Number(cfg.duration)||40} min.</p>${proc.engine?`<p><time>•</time> Motor: ${escapeHtml(proc.engine)} ${proc.provider?'• '+escapeHtml(proc.provider):''}.</p>`:''}${isDone?'<p><time>✓</time> Resultado armazenado localmente.</p>':''}</div></section>
   </main><aside class="dna-summary-col">
    <section class="dna-ref-panel dna6-summary"><h3>Resumo em processamento</h3><div class="dna5-profile"><span>${primary.icon}</span><div><strong>${primary.name}</strong><small>${primary.tag}</small></div></div><dl><div><dt>Base</dt><dd>${escapeHtml(cfg.text||cfg.theme||'—')}</dd></div><div><dt>Formato</dt><dd>${escapeHtml(cfg.sermonType)}</dd></div><div><dt>Saída</dt><dd>${req.mode==='esboco'?'Esboço':'Completa'}</dd></div><div><dt>Duração</dt><dd>${Number(cfg.duration)||40} min</dd></div><div><dt>DNA Score</dt><dd>${score}/100</dd></div><div><dt>K7</dt><dd>${intensity}/5</dd></div></dl></section>
    <section class="dna-ref-panel dna6-engine"><h3>Motor</h3><div><span class="dna5-provider-dot ${App.server?'online':'local'}"></span><strong>${proc.provider?escapeHtml(proc.provider):App.server?'Smart Router / AI HUB':'Pipeline local'}</strong></div><p>${App.server?'O Studio usa o AI HUB e pode aplicar fallback automaticamente se um provedor falhar.':'Se a API estiver indisponível, o Studio preserva a geração pelo pipeline local.'}</p>${proc.quality!=null?`<div class="dna6-quality"><span>Quality Gate</span><strong>${escapeHtml(proc.quality)}%</strong></div>`:''}</section>
    <section class="dna-ref-panel dna-tip"><b>🔒 Seus dados continuam preservados</b><p>As configurações das cinco etapas anteriores ficam salvas localmente durante o processamento.</p></section>
   </aside></div>
   <section class="dna-nextbar dna6-actions"><button class="btn secondary" id="dna6Back">← Voltar: Gerar Mensagem</button>${isError?'<button class="btn secondary" id="dna6Retry">↻ Tentar novamente</button>':''}${isDone?'<button class="btn secondary" id="dna6Copy">📋 Copiar resultado</button>':''}<button class="dna-next-btn" id="dna6Next" ${isDone?'':'disabled'}>Continuar <small>Mensagem</small> →</button></section>
  </div>`;
 }
 const profileGraph=(x)=>{
   if(graphMode==="line"){
     const base=[28,44,35,55,43,62,49,68,58,76,65,84];
     const pts=base.map((v,i)=>`${8+i*10},${58-Math.min(52,Math.max(5,(v*x.score/100)*.62))}`).join(" ");
     return `<div class="dna-score-viz dna-score-line" style="color:${logosPercentColor(x.score)}"><svg viewBox="0 0 120 64" aria-hidden="true"><polyline points="${pts}" fill="none" stroke="currentColor" stroke-width="2.7" stroke-linecap="round" stroke-linejoin="round"/><g>${pts.split(' ').map(pt=>{const [cx,cy]=pt.split(',');return `<circle cx="${cx}" cy="${cy}" r="2.2" fill="currentColor"/>`}).join('')}</g></svg></div>`;
   }
   const pct=Math.max(0,Math.min(100,Number(x.score)||0));
   return `<div class="dna-score-viz dna-score-bar-viz" style="--score-pct:${pct}%;--score-color:${logosPercentColor(pct)}" aria-label="DNA Score ${pct}%"><div class="dna-score-bar-track"><i></i></div><div class="dna-score-bar-scale"><span>0</span><span>50</span><span>100</span></div></div>`;
 };
 const charRows=[
  ["fidelidade","✦","Fidelidade Bíblica","Uso e exposição das Escrituras"],
  ["exposicao","📖","Exposição","Profundidade da explicação do texto"],
  ["aplicacao","💡","Aplicação","Aplicações práticas à vida"],
  ["progressao","↗","Progressão","Crescimento e intensidade da mensagem"],
  ["climax","🔥","Clímax","Força do clímax e impacto"],
  ["apelo","🎯","Apelo","Convocação e desafio final"]
 ];
 if(studioStep===5){
  const cfg=Object.assign({sourceMode:"passagem",text:"",theme:"",sermonType:"Expositiva",duration:40,occasion:"Culto de Ensino",audience:"Igreja local",objective:"",bibleVersion:"ARA",points:"4",focus:"Equilibrado",notes:""},Store.get("studioMessageConfig",{}));
  const st=Object.assign({title:cfg.theme||cfg.text||"Estrutura da mensagem",bigIdea:cfg.objective||"",intro:true,context:true,applications:true,climax:true,appeal:true,prayer:true,points:[]},Store.get("studioMessageStructure",{}));
  const intensity=Math.max(1,Math.min(5,Number(Store.get("studioDNAIntensity",3))||3));
  const primary=dnaProfiles.find(p=>p.id===selected[0])||dnaProfiles[0];
  const score=Math.round(Object.values(chars).reduce((a,b)=>a+Number(b),0)/6);
  const steps=[[1,"Selecionar DNA","Escolha um perfil ou crie"],[2,"Personalizar","Ajuste características"],[3,"Configurar Mensagem","Texto, tempo, público e foco"],[4,"Visualizar Estrutura","Veja o esboço gerado"],[5,"Gerar Mensagem","Revise e confirme a geração"],[6,"Processando","Acompanhe a geração"],[7,"Mensagem","Resultado completo"]];
  const activeBlocks=[["intro","🎙","Introdução"],["context","🧭","Contexto"],["applications","💡","Aplicações"],["climax","🔥","Clímax"],["appeal","🎯","Apelo"],["prayer","🙏","Oração"]].filter(([k])=>st[k]!==false);
  const pointList=Array.isArray(st.points)?st.points:[];
  const generationMode=Store.get("studioGenerationMode","completa");
  return `<div class="studio-wizard studio-refined studio-step5">
   <section class="dna-studio-title"><div class="dna-title-mark">🧬</div><div><h2>DNA K7 Studio X</h2><p>Oficina de Padrões e Criação de Mensagens</p></div><div class="dna-title-actions"><button class="btn secondary">▶ Tutoriais</button><button class="btn secondary">📖 Biblioteca DNA</button><button class="btn secondary">♟ Meus Perfis</button><button class="btn secondary" data-go="dashboard">← Voltar ao Studio</button></div></section>
   <div class="studio-steps">${steps.map(([n,t,sub])=>`<div data-studio-step="${n}" onclick="return window.LMXStudioGoStep&&window.LMXStudioGoStep(${n})" role="button" tabindex="0" class="studio-step ${n===5?'active':''} ${n<5?'done':''}"><b>${n<5?'✓':n}</b><span><strong>${t}</strong><small>${sub}</small></span></div>`).join('')}</div>
   <div class="dna5-layout"><main>
    <section class="dna-ref-panel dna5-ready"><div class="dna-panel-head"><div><h3>Revisão final antes da geração</h3><p>Confira DNA, conteúdo, estrutura e modo de saída. Nada será enviado até você clicar em gerar.</p></div><span class="dna5-badge">ETAPA 5 DE 7</span></div><div class="dna5-ready-row"><div class="dna5-ready-icon">✓</div><div><strong>Configuração pronta</strong><small>As Etapas 1–4 foram preservadas e serão combinadas em uma única geração.</small></div><b>${score}<small>DNA Score</small></b></div></section>
    <section class="dna-ref-panel"><div class="dna-panel-head"><div><h3>Escolha o resultado</h3><p>Você pode gerar a mensagem completa ou somente o esboço aprovado.</p></div></div><div class="dna5-modes"><button type="button" class="dna5-mode ${generationMode==='completa'?'active':''}" data-dna5-mode="completa"><i>✨</i><span><strong>Mensagem Completa</strong><small>Desenvolvimento integral, aplicações, clímax, apelo e oração conforme a estrutura.</small></span><em>RECOMENDADO</em></button><button type="button" class="dna5-mode ${generationMode==='esboco'?'active':''}" data-dna5-mode="esboco"><i>📄</i><span><strong>Somente Esboço</strong><small>Grande ideia, divisões, textos-chave, aplicações resumidas e conclusão.</small></span><em>RÁPIDO</em></button></div></section>
    <section class="dna-ref-panel dna5-source"><div class="dna-panel-head"><div><h3>Base da mensagem</h3><p>Dados recebidos da configuração.</p></div><button type="button" class="dna5-edit" id="dna5EditConfig">✎ Editar Etapa 3</button></div><div class="dna5-source-grid"><div><span>Passagem / Base</span><strong>${escapeHtml(cfg.text||'Não definida')}</strong></div><div><span>Tema</span><strong>${escapeHtml(cfg.theme||st.title||'Não definido')}</strong></div><div><span>Formato</span><strong>${escapeHtml(cfg.sermonType)}</strong></div><div><span>Duração</span><strong>${Number(cfg.duration)||40} min</strong></div><div><span>Ocasião</span><strong>${escapeHtml(cfg.occasion)}</strong></div><div><span>Público</span><strong>${escapeHtml(cfg.audience)}</strong></div></div>${cfg.objective?`<div class="dna5-objective"><span>🎯 Objetivo</span><p>${escapeHtml(cfg.objective)}</p></div>`:''}</section>
    <section class="dna-ref-panel dna5-structure"><div class="dna-panel-head"><div><h3>Estrutura aprovada</h3><p>A IA deverá respeitar esta ordem e os pesos definidos.</p></div><button type="button" class="dna5-edit" id="dna5EditStructure">✎ Editar Etapa 4</button></div><div class="dna5-bigidea"><span>Grande ideia</span><strong>${escapeHtml(st.bigIdea||'Não definida')}</strong></div><div class="dna5-points">${pointList.length?pointList.map((p,i)=>`<article><b>${i+1}</b><div><strong>${escapeHtml(p.title||`Ponto ${i+1}`)}</strong><small>${escapeHtml(p.note||'Desenvolvimento orientado pela estrutura aprovada.')}</small></div><em>${Number(p.weight)||0}%</em></article>`).join(''):'<p class="muted">Nenhum ponto estrutural salvo.</p>'}</div><div class="dna5-blocks">${activeBlocks.map(([,ico,n])=>`<span>${ico} ${n}</span>`).join('')}</div></section>
    <section class="dna-ref-panel dna5-quality"><div class="dna-panel-head"><div><h3>Quality Gate antes de gerar</h3><p>Critérios obrigatórios aplicados à saída.</p></div><span class="dna5-quality-status">● ATIVO</span></div><div class="dna5-checks"><label><span>✓</span><div><strong>Fidelidade bíblica</strong><small>Não criar fatos, textos ou referências inexistentes.</small></div></label><label><span>✓</span><div><strong>Estrutura preservada</strong><small>Respeitar a ordem e a progressão aprovadas.</small></div></label><label><span>✓</span><div><strong>DNA K7 controlado</strong><small>Intensidade ${intensity}/5 sem copiar pregadores ou mensagens.</small></div></label><label><span>✓</span><div><strong>Aplicação coerente</strong><small>Conectar texto, público, ocasião e objetivo.</small></div></label></div></section>
   </main><aside class="dna-summary-col"><section class="dna-ref-panel dna5-summary"><h3>Resumo da geração</h3><div class="dna5-profile"><span>${primary.icon}</span><div><strong>${primary.name}</strong><small>${primary.tag}</small></div></div><dl><div><dt>DNA Score</dt><dd>${score}/100</dd></div><div><dt>Intensidade K7</dt><dd>${intensity}/5</dd></div><div><dt>Formato</dt><dd>${escapeHtml(cfg.sermonType)}</dd></div><div><dt>Duração</dt><dd>${Number(cfg.duration)||40} min</dd></div><div><dt>Pontos</dt><dd>${pointList.length||'—'}</dd></div><div><dt>Blocos</dt><dd>${activeBlocks.length}</dd></div><div><dt>Saída</dt><dd id="dna5ModeSummary">${generationMode==='esboco'?'Somente esboço':'Mensagem completa'}</dd></div></dl><div class="dna-style-box"><span>🧬</span><div><strong>DNA combinado</strong><p>${selected.length} perfil(is), personalização da Etapa 2 e estrutura da Etapa 4.</p></div></div></section><section class="dna-ref-panel dna5-provider"><h3>Motor de geração</h3><div><span class="dna5-provider-dot ${App.server?'online':'local'}"></span><strong>${App.server?'AI HUB disponível':'Modo local'}</strong></div><p>${App.server?'A Etapa 6 acompanhará o processamento da IA selecionada.':'A interface continuará funcional localmente; a geração poderá usar o pipeline local quando a API estiver indisponível.'}</p><small>Provedor atual: <b>${escapeHtml(App.provider||'auto')}</b></small></section><section class="dna-ref-panel dna-tip"><b>💡 Última conferência</b><p>Use “Editar Etapa 3” ou “Editar Etapa 4” caso queira alterar algum dado antes de gerar.</p></section></aside></div>
   <section class="dna-nextbar dna5-actions"><button class="btn secondary" id="dna5Back">← Voltar: Visualizar Estrutura</button><button class="btn secondary" id="dna5Save">💾 Salvar projeto</button><button class="dna5-generate" id="dna5Generate"><span>✨ GERAR AGORA</span><small id="dna5GenerateSub">${generationMode==='esboco'?'Somente Esboço':'Mensagem Completa'} • ${Number(cfg.duration)||40} min</small></button></section>
  </div>`;
 }
 return `<div class="studio-wizard studio-refined">
  <section class="dna-studio-title"><div class="dna-title-mark">🧬</div><div><h2>DNA K7 Studio X</h2><p>Oficina de Padrões e Criação de Mensagens</p></div><div class="dna-title-actions"><button class="btn secondary">▶ Tutoriais</button><button class="btn secondary">📖 Biblioteca DNA</button><button class="btn secondary">♟ Meus Perfis</button><button class="btn secondary" data-go="dashboard">← Voltar ao Studio</button></div></section>
  <div class="studio-steps">${[[1,"Selecionar DNA","Escolha um perfil ou crie"],[2,"Personalizar","Ajuste características"],[3,"Configurar Mensagem","Texto, tempo, público e foco"],[4,"Visualizar Estrutura","Veja o esboço gerado"],[5,"Gerar Mensagem","IA cria sua pregação"],[6,"Processando","Acompanhe a geração"],[7,"Mensagem","Resultado completo"]].map(([n,t,sub])=>`<div data-studio-step="${n}" onclick="return window.LMXStudioGoStep&&window.LMXStudioGoStep(${n})" role="button" tabindex="0" class="studio-step ${n===1?"active":""}"><b>${n}</b><span><strong>${t}</strong><small>${sub}</small></span></div>`).join("")}</div>
  <div class="dna-main-layout"><main>
   <section class="dna-ref-panel dna-profile-panel"><div class="dna-panel-head"><div><h3>Escolha o DNA de referência</h3><p>Use um perfil pronto, combine perfis ou crie um novo do zero.</p></div><div class="dna-panel-tools"><div class="dna-graph-switch" role="group" aria-label="Modelo do gráfico"><button type="button" data-graph-mode="gauge" class="${graphMode==='gauge'?'active':''}">▰ Barra</button><button type="button" data-graph-mode="line" class="${graphMode==='line'?'active':''}">⌁ Linha</button></div><button class="btn secondary" id="dnaFilterToggle">⚱ Filtros</button><div class="dna-mini-search">⌕ <input id="dnaSearch" placeholder="Buscar DNA..."></div></div></div>
    <div class="dna-filter-row" id="dnaFilterRow"><button class="active" data-dna-filter="all">Todos</button><button data-dna-filter="Pentecostal">Pentecostal</button><button data-dna-filter="Bíblico">Bíblico</button><button data-dna-filter="Pastoral">Pastoral</button><button data-dna-filter="Profundo">Profundo</button></div>
    <div class="dna-profile-grid" id="dnaGrid">${dnaProfiles.map(x=>`<article class="dna-profile-card ${selected.includes(x.id)?"selected":""}" data-dna-card="${x.id}" data-name="${(x.code+' '+x.name+' '+x.tag+' '+x.tags.join(' ')).toLowerCase()}"><button class="dna-fav ${selected.includes(x.id)?'active':''}" title="DNA de referência" aria-label="DNA de referência">🧬</button><div class="dna-profile-top"><i>${x.icon}</i><div><h4>${x.name.replace(' K7','').replace(' Forte','').replace(' Clássico','')}</h4><small>${x.tag}</small></div></div>${profileGraph(x)}<div class="dna-score"><strong data-profile-score-value="${x.id}">${x.score}%</strong><small>DNA Score</small></div><div class="dna-score-adjust"><button type="button" data-score-step="-1" data-score-id="${x.id}">−</button><input type="range" min="0" max="100" step="1" value="${x.score}" data-profile-score="${x.id}" style="--range-fill:${x.score}%;--range-color:${logosPercentColor(x.score)}"><button type="button" data-score-step="1" data-score-id="${x.id}">+</button></div><button class="dna-select-btn" data-dna-select="${x.id}">${selected.includes(x.id)?'✓ Selecionado ✓':'Selecionar'}</button></article>`).join('')}<article class="dna-profile-card dna-create-card"><div class="dna-create-plus">＋</div><h4>Criar novo DNA</h4><small>Comece do zero</small><button class="dna-select-btn" id="dnaCreate">Criar</button></article></div>
   </section>
   <section class="dna-ref-panel dna-mixer"><div class="dna-panel-head"><div><h3>Misturador de DNA <small>(opcional)</small></h3><p>Combine até 3 perfis para gerar um DNA único e personalizado.</p></div><div class="dna-total"><small>Total</small><strong id="dnaMixTotal">100%</strong></div></div><div id="dnaMixerRows" class="dna-mixer-rows">${selected.map((id,i)=>{const x=dnaProfiles.find(p=>p.id===id);return `<div class="dna-mix-row" data-mix-id="${id}"><div class="dna-mix-label"><span>${x?.icon||'🧬'}</span><div><strong>${(x?.name||id).replace(' K7','').replace(' Forte','').replace(' Clássico','')}</strong><small>${i===0?'Perfil principal':'Perfil complementar'}</small></div></div><input class="dna-mix-range" data-mix-range="${id}" type="range" min="0" max="100" step="1" value="${weights[id]||0}" style="--range-fill:${weights[id]||0}%;--range-color:${logosPercentColor(weights[id]||0)}"><output data-mix-output="${id}">${weights[id]||0}%</output><button data-mix-remove="${id}" title="Remover">×</button></div>`}).join('')}</div><button class="dna-add-profile" id="dnaAddProfile">＋ Adicionar perfil</button></section>
   <section class="dna-adjust-grid"><div class="dna-ref-panel dna-adjust"><div class="dna-panel-head"><div><h3>Ajuste fino das características do DNA</h3><p>Personalize os níveis de cada característica do perfil selecionado ou combinado.</p></div></div><div class="dna-characteristics">${charRows.map(([key,ico,name,desc])=>`<div class="dna-char-row"><div class="dna-char-info"><i>${ico}</i><div><strong>${name}</strong><small>${desc}</small></div></div><input type="range" min="0" max="100" step="1" value="${chars[key]}" data-char-range="${key}" style="--range-fill:${chars[key]}%;--range-color:${logosPercentColor(chars[key])}"><output data-char-output="${key}">${chars[key]}%</output></div>`).join('')}</div><button class="dna-reset" id="dnaResetChars">Restaurar padrões</button></div>
    <div class="dna-ref-panel dna-radar-panel"><h3>Visualização do DNA</h3><svg id="dnaRadar" class="dna-radar" viewBox="0 0 360 300" role="img" aria-label="Gráfico radar do DNA"></svg><div class="dna-radar-legend"><span><i></i> Seu perfil</span><span><i class="avg"></i> Média geral</span></div></div></section>
  </main><aside class="dna-summary-col"><section class="dna-ref-panel dna-summary"><h3>Resumo do DNA Atual</h3><div class="dna-summary-top"><div class="dna-orbit"><div><b id="dnaScore">${Math.round(Object.values(chars).reduce((a,b)=>a+b,0)/6)}</b><small>DNA Score</small></div></div><div class="dna-summary-bars">${charRows.map(([key,,name])=>`<label>${name}<i><b data-summary-bar="${key}" style="width:${chars[key]}%"></b></i><span data-summary-value="${key}">${chars[key]}</span></label>`).join('')}</div></div><div class="dna-style-box"><span>💡</span><div><strong>Estilo predominante</strong><p id="dnaStyleText">Expositivo progressivo com forte clímax e aplicações práticas.</p></div></div><button class="btn secondary dna-full-btn">Ver detalhes completos</button></section>
   <section class="dna-ref-panel dna-system-summary live-system-summary" id="liveSystemSummary"><h3>Resumo do Sistema <em id="sysOverall">${App.server?'● Online':'● Local'}</em></h3><div><span>Versão do Sistema<small>Versão atual instalada</small></span><b id="sysVersion">3.8.1</b></div><div><span>Status do Sistema<small>Estado atual da aplicação</small></span><b id="sysStatus">${App.server?'Online':'Local'}</b></div><div><span>Backend / API<small id="sysApiDetail">${escapeHtml(App.api||'API local')}</small></span><b id="sysBackend">${App.server?'Online':'Offline'}</b></div><div><span>Provedores de IA<small>Disponibilidade informada pela API</small></span><b id="sysProviders">${Object.values(App.health?.providers||{}).filter(Boolean).length} online</b></div><div><span>Última Sincronização<small id="sysSyncDate">Aguardando verificação</small></span><b id="sysSync">—</b></div><div><span>Update Center<small id="sysUpdateDetail">Verificação sem recarregar a interface</small></span><b id="sysUpdate">Ativo</b></div><div><span>PWA / Aplicativo<small id="sysPwaDetail">Verificando instalação</small></span><b id="sysPwa">—</b></div><div><span>Modo de Execução<small id="sysBrowser">Navegador</small></span><b id="sysMode">—</b></div><div><span>Tema Atual<small>Sincronizado com Aparência</small></span><b id="sysTheme">—</b></div><div><span>Service Worker<small id="sysSwDetail">Verificando cache</small></span><b id="sysSw">—</b></div><div><span>Última verificação<small>Atualização automática do painel</small></span><b id="sysNextCheck">agora</b></div></section>
   <section class="dna-ref-panel dna-apps"><h3>Aplicações características</h3><label>✓ Conecta o texto com a vida do ouvinte</label><label>✓ Usa ilustrações e exemplos marcantes</label><label>✓ Progressão crescente até o clímax</label><label>✓ Apelo claro e desafiador ao final</label></section>
   <section class="dna-ref-panel dna-origin"><h3>DNA foi gerado de</h3><div id="dnaOriginList"></div></section>
   <section class="dna-ref-panel dna-tip"><b>💡 Dica</b><p>Quanto mais perfis você combina, mais único e equilibrado ficará o resultado.</p></section>
  </aside></div>
  <section class="dna-nextbar"><div><strong>A próxima etapa</strong><p>Após ajustar e combinar seu DNA, você poderá configurar o texto e os detalhes da mensagem.</p></div><div class="dna-next-stats"><span>🧬 <b id="dnaSelectedCount">${selected.length}</b> DNA(s)</span><span>📖 Mistura <b id="dnaMixCount">${selected.length}</b> perfil(is)</span><span>⚙ <b>6</b> características</span><span>🏅 Score <b id="dnaBottomScore">${Math.round(Object.values(chars).reduce((a,b)=>a+b,0)/6)}/100</b></span></div><button class="dna-next-btn" id="dnaNext">Próximo passo <small>Personalizar</small> →</button></section>
 </div>`},
 bible(){return `<div class="bible-x-shell">
 <aside class="bible-x-sidebar" aria-label="Menu Bíblia X">
  <div class="bible-x-brand"><span>📖</span><div><strong>Bíblia X</strong><small>Leitura • Estudo • Mídia</small></div></div>
  <nav class="bible-x-nav">
   <button data-bible-section="hub"><i>✨</i><span><b>Central Bíblia X</b><small>Painel dos módulos</small></span></button>
   <button class="active" data-bible-section="reader"><i>📖</i><span><b>Bíblia X</b><small>Leitura principal</small></span></button>
   <button data-bible-section="search"><i>🔎</i><span><b>Pesquisa X</b><small>Palavra, frase e referência</small></span></button>
   <button data-bible-section="cross"><i>🔗</i><span><b>Referências Cruzadas</b><small>Textos e cadeias bíblicas</small></span></button>
   <button data-bible-section="strong"><i>🇬🇷🇮🇱</i><span><b>Strong</b><small>Hebraico e grego</small></span></button>
   <button data-bible-section="lexicon"><i>📚</i><span><b>Léxico</b><small>Raiz, significado e usos</small></span></button>
   <button data-bible-section="context"><i>🧭</i><span><b>Contexto</b><small>Histórico, cultural e literário</small></span></button>
   <button data-bible-section="comments"><i>💬</i><span><b>Comentários</b><small>Exegético, pastoral e aplicação</small></span></button>
   <button data-bible-section="maps"><i>🗺️</i><span><b>Mapas X</b><small>Lugares, rotas e eventos</small></span></button>
   <button data-bible-section="people"><i>👤</i><span><b>Personagens</b><small>Biografias e conexões</small></span></button>
   <button data-bible-section="timeline"><i>🕰️</i><span><b>Linha do Tempo</b><small>Períodos e acontecimentos</small></span></button>
   <button data-bible-section="media"><i>🎥</i><span><b>Mídia X</b><small>Imagens, vídeos e áudios</small></span></button>
   <button data-bible-section="dna"><i>🧬</i><span><b>DNA K7</b><small>Analisar e enviar ao Studio X</small></span></button>
   <button data-bible-section="explore"><i>🌍</i><span><b>Explorar Bíblia</b><small>Cenários e hotspots</small></span></button>
   <button data-bible-section="favorites"><i>⭐</i><span><b>Favoritos</b><small>Versículos e estudos salvos</small></span></button>
   <button data-bible-section="notes"><i>📝</i><span><b>Notas</b><small>Pessoais e comentários</small></span></button>
   <button data-bible-section="collections"><i>📂</i><span><b>Coleções</b><small>Temas e listas próprias</small></span></button>
   <button data-bible-section="global"><i>🔍</i><span><b>Pesquisa Global X</b><small>Buscar em todos os módulos</small></span></button>   <button data-bible-section="concordance"><i>📊</i><span><b>Concordância X</b><small>Ocorrências e frequência</small></span></button>   <button data-bible-section="plans"><i>🗓️</i><span><b>Planos de Estudo X</b><small>Rotinas e progresso</small></span></button>   <button data-bible-section="backup"><i>💾</i><span><b>Backup & Restauração</b><small>Proteger bancos locais</small></span></button>



   <button data-bible-section="workspace"><i>🧪</i><span><b>Mesa de Estudo X</b><small>Passagem + recursos reunidos</small></span></button>
   <button data-bible-section="parallel"><i>↔️</i><span><b>Leitura Paralela X</b><small>Compare duas passagens</small></span></button>
   <button data-bible-section="export"><i>📤</i><span><b>Exportar X</b><small>TXT, Markdown e impressão</small></span></button>
   <button data-bible-section="diagnostic"><i>🛡️</i><span><b>Diagnóstico X</b><small>Integridade do módulo</small></span></button>
   <button data-bible-section="topics"><i>🏷️</i><span><b>Tópicos X</b><small>Temas bíblicos e cadeias de passagens</small></span></button>
   <button data-bible-section="dossier"><i>🗂️</i><span><b>Dossiê de Passagem X</b><small>Reúna recursos da passagem atual</small></span></button>
   <button data-bible-section="interlinear"><i>🔤</i><span><b>Interlinear X</b><small>Camada local para texto original e Strong</small></span></button>
   <button data-bible-section="offlinecenter"><i>📦</i><span><b>Central Offline X</b><small>Estado dos bancos e dados locais</small></span></button>
   <button data-bible-section="finalcheck"><i>✅</i><span><b>Validação Final X</b><small>Checklist final do módulo Bíblia X</small></span></button>
   <button data-bible-section="settings"><i>⚙️</i><span><b>Configurações</b><small>Versão, fonte e offline</small></span></button>
  </nav>
 </aside>
 <main class="bible-x-main">
  <section class="bible-x-topbar">
   <div><span class="bible-x-stage">ETAPA 14 • NOTAS X</span><h2>📖 Bíblia X</h2><p>Leitura bíblica local, pesquisa e integração direta com o Studio X.</p></div>
   <div class="bible-x-top-actions">
    <button class="btn secondary" id="bxPrimaryReading" onclick="return window.LMXBX&&window.LMXBX.openReader()" title="Abrir leitura bíblica">📖 Leitura Bíblica</button>
    <button class="btn secondary" id="bxCleanReadingToggle" onclick="return window.LMXBX&&window.LMXBX.toggleClean()" title="Alternar leitura clean">✨ Clean: ON</button>
    <button class="btn secondary" onclick="return window.LMXBX&&window.LMXBX.zoom(-10)" title="Diminuir fonte">A−</button>
    <button class="btn secondary" id="bxZoomReset" onclick="return window.LMXBX&&window.LMXBX.zoom(0)" title="Restaurar fonte">100%</button>
    <button class="btn secondary" onclick="return window.LMXBX&&window.LMXBX.zoom(10)" title="Aumentar fonte">A+</button>
    <button class="btn secondary" id="bxFullBtn" onclick="return window.LMXBX&&window.LMXBX.full(true)" title="Tela cheia">⛶ Tela cheia</button>
    <button class="btn secondary" id="bxExitFullBtn" onclick="return window.LMXBX&&window.LMXBX.full(false)" title="Sair da tela cheia" hidden>✕ Sair</button>
   </div>
  </section>
  <section class="bible-x-panel" data-bible-panel="hub">
   <div class="bx-adv-head"><div><span class="bible-x-stage">ETAPA 21 • CONSOLIDAÇÃO</span><h3>✨ Central Bíblia X</h3><p>Atalhos para o ambiente completo de leitura, pesquisa, estudo, mídia e preparação de mensagens.</p></div><span class="bx-adv-local">● 26 etapas integradas</span></div>
   <div id="bxHubKpis" class="bx-adv-kpis"><div class="bx-adv-kpi"><b>—</b><small>carregando</small></div></div>
   <div class="bx-hub-grid">
    <button class="bx-hub-tile" data-hub="reader"><span>📖</span><b>Leitura</b><small>Bíblia principal</small></button><button class="bx-hub-tile" data-hub="global"><span>🔍</span><b>Pesquisa Global</b><small>Todos os bancos</small></button><button class="bx-hub-tile" data-hub="strong"><span>🇬🇷🇮🇱</span><b>Strong & Léxico</b><small>Idiomas bíblicos</small></button><button class="bx-hub-tile" data-hub="context"><span>🧭</span><b>Contexto</b><small>História e cultura</small></button><button class="bx-hub-tile" data-hub="maps"><span>🗺️</span><b>Atlas</b><small>Lugares e rotas</small></button><button class="bx-hub-tile" data-hub="media"><span>🎥</span><b>Mídia X</b><small>Recursos locais</small></button><button class="bx-hub-tile" data-hub="people"><span>👤</span><b>Personagens</b><small>Biografias</small></button><button class="bx-hub-tile" data-hub="timeline"><span>🕰️</span><b>Linha do Tempo</b><small>Cronologia</small></button><button class="bx-hub-tile" data-hub="dna"><span>🧬</span><b>DNA K7</b><small>Enviar ao Studio X</small></button><button class="bx-hub-tile" data-hub="plans"><span>🗓️</span><b>Planos</b><small>Rotinas de estudo</small></button><button class="bx-hub-tile" data-hub="notes"><span>📝</span><b>Notas</b><small>Anotações locais</small></button><button class="bx-hub-tile" data-hub="backup"><span>💾</span><b>Backup</b><small>Proteção dos dados</small></button>
   </div>
  </section>
  <section class="bible-x-section active" data-bible-panel="reader">
   <div class="bible-x-reader-head"><div><h3>Leitura Principal</h3><p>Abra uma passagem, pesquise e envie o texto diretamente ao Studio X.</p></div><div class="bible-x-reader-badges"><span class="bible-x-status" id="bServerStatus">● Online automático</span>
    <button class="bx-sync-mode-btn" id="bxDataMode" type="button">☁️ Online primeiro</button>
    <button class="bx-offline-manage-btn" id="bxOfflineManage" type="button">⬇ Uso offline</button><span class="bible-x-count" id="bCount">0 versículos</span></div></div>
   <div class="bible-x-toolbar bx-v158-toolbar">
    <div><label>Versão</label><select id="bVersion"><option value="porbr2018">Bíblia Livre (BLIVRE)</option><option value="engwebp">World English Bible (WEBP)</option></select></div>
    <div><label>Livro</label><select id="bBook"><option>Carregando...</option></select></div>
    <div><label>Capítulo</label><select id="bChapter"><option value="3">3</option></select></div>
    <div class="bx-v158-verse-field bx-v161-verse-field">
      <label>Versículo <small>Todos = capítulo inteiro</small></label>
      <select id="bVerse" aria-label="Versículo"><option value="">Todos</option></select>
    </div>
    <input id="bRef" type="hidden" value="João 3:16">
    <button class="btn primary bx-v158-open" id="bOpen">Abrir</button>
    <button class="btn secondary" id="bSend">⚡ Enviar ao Studio</button>
    <div class="bx-v158-mode-pill" id="bxV158Mode" aria-live="polite">📖 Capítulo inteiro</div>
   </div>
   <div class="bible-x-chapter-nav">
    <button class="btn secondary" id="bPrevChapter">← Capítulo anterior</button>
    <div id="bChapterTitle" class="bible-x-chapter-title">João 3</div>
    <button class="btn secondary" id="bNextChapter">Próximo capítulo →</button>
   </div>
   <div class="bible-x-search-row bx-v159-search">
    <div class="bx-v159-query">
      <label>Pesquisa bíblica <small>palavra, frase ou tema</small></label>
      <input id="bSearch" placeholder="Ex.: fé, Espírito Santo, não temas..." autocomplete="off">
    </div>
    <div>
      <label>Onde pesquisar</label>
      <select id="bxV159Scope">
        <option value="all">📖 Bíblia inteira</option>
        <option value="ot">📜 Antigo Testamento</option>
        <option value="nt">✝ Novo Testamento</option>
        <option value="book">📘 Livro atual</option>
        <option value="chapter">🔖 Capítulo atual</option>
        <option value="pentateuch">🪨 Pentateuco</option>
        <option value="history">🏛 Históricos</option>
        <option value="wisdom">🎵 Poéticos / Sabedoria</option>
        <option value="prophets">📣 Profetas</option>
        <option value="gospels">✝ Evangelhos</option>
        <option value="pauline">✉ Cartas Paulinas</option>
        <option value="general">📨 Cartas Gerais</option>
        <option value="selected">☑ Livros escolhidos</option>
      </select>
    </div>
    <div>
      <label>Correspondência</label>
      <select id="bxV159Mode">
        <option value="phrase">“ ” Frase exata</option>
        <option value="all">✓ Todas as palavras</option>
        <option value="any">＋ Qualquer palavra</option>
        <option value="word">Aa Palavra inteira</option>
      </select>
    </div>
    <div>
      <label>Ordenar</label>
      <select id="bxV159Sort">
        <option value="canon">Ordem bíblica</option>
        <option value="relevance">Mais relevantes</option>
        <option value="book">Por livro</option>
      </select>
    </div>
    <button class="btn secondary bx-v159-books" id="bxV159Books">☑ Livros <span id="bxV159BooksCount">0</span></button>
    <button class="btn blue" id="bFind">🔎 Pesquisar</button>
    <button class="btn secondary" id="bConcordance">Concordância</button>
    <button class="btn secondary bx-v159-clear" id="bxV159Clear">Limpar</button>
    <div class="bx-v159-quick" aria-label="Pesquisas rápidas">
      <span>Rápido:</span>
      <button type="button" data-v159-quick-scope="all">Toda Bíblia</button>
      <button type="button" data-v159-quick-scope="nt">Novo Testamento</button>
      <button type="button" data-v159-quick-scope="ot">Antigo Testamento</button>
      <button type="button" data-v159-quick-scope="book">Este livro</button>
      <button type="button" data-v159-quick-scope="chapter">Este capítulo</button>
    </div>
   </div>
   <div class="bible-x-resource-strip">
    <button data-bible-jump="cross">🔗 Referências</button><button data-bible-jump="strong">🇬🇷🇮🇱 Strong</button><button data-bible-jump="lexicon">📚 Léxico</button><button data-bible-jump="context">🧭 Contexto</button><button data-bible-jump="dna">🧬 DNA K7</button><button data-bible-studio>⚡ Enviar ao Studio X</button><button id="bxFavoriteCurrent">⭐ Favoritar</button><button data-bible-jump="comments">💬 Comentários</button><button data-bible-jump="notes">📝 Notas</button>
   </div>
   <div id="bOut" class="output bible-x-output">Carregando João 3:16...</div><section id="bxVerseContext" class="bx-verse-context" hidden>
<div class="bx-vc-head"><div><small id="bxVcKind">FERRAMENTA</small><h3 id="bxVcTitle">Detalhes</h3></div><button id="bxVcClose">×</button></div>
<div id="bxVcBody"></div>
<div class="bx-vc-local">
 <label>📝 Nota deste versículo</label>
 <textarea id="bxVcNote" rows="3" placeholder="Escreva uma anotação vinculada a este versículo..."></textarea>
 <div class="bx-vc-local-actions">
  <button id="bxVcSaveNote">Salvar nota</button>
  <button id="bxVcFavorite">☆ Favoritar</button>
  <button id="bxVcCopy">⧉ Copiar versículo</button>
  <button id="bxVcStudio">⚡ Enviar ao Studio X</button>
 </div>
 <small id="bxVcStatus"></small>
</div></section>
   <details class="bible-x-import"><summary>⚙️ Bíblia local / módulos offline</summary>
    <p class="muted">Importe uma tradução cuja licença permita seu uso. O texto permanece neste navegador.</p>
    <div class="row"><input type="file" id="bFile" accept=".json,.csv,.txt"><button class="btn primary" id="bImport">Importar Bíblia</button><button class="btn secondary" id="bMeta">Status</button></div>
   </details>
  </section>
  <section class="bible-x-section" data-bible-panel="cross">
   <div class="bx-cross-head"><div><span class="bible-x-stage">ETAPA 2</span><h3>🔗 Referências Cruzadas</h3><p>Relacione passagens e abra o texto citado sem sair da Bíblia X.</p></div><span class="bx-cross-local">● Banco local</span></div>
   <div class="bx-cross-grid">
    <section class="bx-cross-card">
     <label>Passagem principal</label>
     <div class="bx-cross-input"><input id="bxCrossSource" placeholder="João 3:16"><button class="btn primary" id="bxCrossLoad">Carregar</button></div>
     <div id="bxCrossSourcePreview" class="bx-cross-preview">Selecione uma passagem principal.</div>
    </section>
    <section class="bx-cross-card">
     <label>Adicionar referência relacionada</label>
     <div class="bx-cross-input"><input id="bxCrossTarget" placeholder="Romanos 5:8"><button class="btn blue" id="bxCrossAdd">+ Adicionar</button></div>
     <p class="muted">As relações ficam salvas somente neste navegador.</p>
    </section>
   </div>
   <section class="bx-cross-results">
    <div class="bx-cross-results-head"><div><h4>Cadeia de referências</h4><p id="bxCrossCount">0 referências relacionadas</p></div><div class="row"><button class="btn secondary" id="bxCrossSeed">Exemplo</button><button class="btn secondary" id="bxCrossExport">Exportar</button></div></div>
    <div id="bxCrossList" class="bx-cross-list"><div class="bx-cross-empty">Nenhuma referência relacionada ainda.</div></div>
   </section>
   <details class="bible-x-import"><summary>⚙️ Importar banco de referências</summary><p class="muted">Formato JSON: [{"source":"João 3:16","targets":["Romanos 5:8","1 João 4:9"]}]</p><div class="row"><input type="file" id="bxCrossFile" accept=".json"><button class="btn primary" id="bxCrossImport">Importar JSON</button></div></details>
  </section>
  <section class="bible-x-section" data-bible-panel="strong">
   <div class="bx-strong-head"><div><span class="bible-x-stage">ETAPA 3</span><h3>🇬🇷🇮🇱 Strong • Hebraico & Grego</h3><p>Consulte números Strong, lema, transliteração, morfologia, definição e ocorrências em um banco local.</p></div><span class="bx-strong-local">● Banco local / Offline</span></div>
   <div class="bx-strong-search">
    <div class="bx-strong-query"><label>Número Strong ou palavra</label><div><input id="bxStrongQuery" placeholder="G26, H430, agape, elohim..."><button class="btn primary" id="bxStrongFind">Pesquisar</button></div></div>
    <div class="bx-strong-filters"><button class="active" data-strong-lang="all">Todos</button><button data-strong-lang="G">🇬🇷 Grego</button><button data-strong-lang="H">🇮🇱 Hebraico</button></div>
   </div>
   <div class="bx-strong-layout">
    <section class="bx-strong-results"><div class="bx-strong-results-head"><div><h4>Resultados</h4><p id="bxStrongCount">0 entradas</p></div><button class="btn secondary" id="bxStrongExample">Carregar exemplos</button></div><div id="bxStrongList" class="bx-strong-list"><div class="bx-strong-empty">Importe um banco Strong ou carregue os exemplos para começar.</div></div></section>
    <aside class="bx-strong-detail" id="bxStrongDetail"><div class="bx-strong-detail-empty"><span>🇬🇷🇮🇱</span><h4>Detalhes Strong</h4><p>Selecione uma entrada para visualizar lema, transliteração, raiz e ocorrências.</p></div></aside>
   </div>
   <details class="bible-x-import"><summary>⚙️ Banco Strong local</summary><p class="muted">Formato JSON aceito: [{"number":"G26","language":"G","lemma":"ἀγάπη","transliteration":"agapē","definition":"amor","morphology":"substantivo","root":"G25","refs":["João 13:35"]}]. Dados importados ficam somente neste navegador.</p><div class="row"><input type="file" id="bxStrongFile" accept=".json"><button class="btn primary" id="bxStrongImport">Importar JSON</button><button class="btn secondary" id="bxStrongExport">Exportar banco</button><button class="btn danger" id="bxStrongClear">Limpar Strong</button></div></details>
  </section>
  <section class="bible-x-section" data-bible-panel="lexicon">
   <div class="bx-lex-head"><div><span class="bible-x-stage">ETAPA 4</span><h3>📚 Léxico Bíblico X</h3><p>Estude lema, campo semântico, sentidos, raízes, palavras relacionadas e ocorrências.</p></div><span class="bx-lex-local">● Banco local / Offline</span></div>
   <div class="bx-lex-search"><div class="bx-lex-query"><label>Palavra, lema, transliteração, Strong ou significado</label><div><input id="bxLexQuery" placeholder="amor, agapē, G26, hesed, fé..."><button class="btn primary" id="bxLexFind">Pesquisar</button></div></div><div class="bx-lex-filters"><button class="active" data-lex-lang="all">Todos</button><button data-lex-lang="G">🇬🇷 Grego</button><button data-lex-lang="H">🇮🇱 Hebraico</button></div></div>
   <div class="bx-lex-layout"><section class="bx-lex-results"><div class="bx-lex-results-head"><div><h4>Entradas lexicais</h4><p id="bxLexCount">0 entradas</p></div><button class="btn secondary" id="bxLexExample">Carregar exemplos</button></div><div id="bxLexList" class="bx-lex-list"><div class="bx-lex-empty">Importe um léxico ou carregue os exemplos para começar.</div></div></section><aside class="bx-lex-detail" id="bxLexDetail"><div class="bx-lex-detail-empty"><span>📚</span><h4>Detalhes do Léxico</h4><p>Selecione uma entrada para visualizar sentidos, campo semântico, raízes e ocorrências.</p></div></aside></div>
   <details class="bible-x-import"><summary>⚙️ Banco Léxico local</summary><p class="muted">JSON com id, language, lemma, transliteration, strong, gloss, senses, semanticField, root, related e refs.</p><div class="row"><input type="file" id="bxLexFile" accept=".json"><button class="btn primary" id="bxLexImport">Importar JSON</button><button class="btn secondary" id="bxLexExport">Exportar banco</button><button class="btn danger" id="bxLexClear">Limpar Léxico</button></div></details>
  </section>
  <section class="bible-x-section" data-bible-panel="context">
   <div class="bx-context-head"><div><span class="bible-x-stage">ETAPA 5</span><h3>🧭 Contexto Bíblico X</h3><p>Histórico, cultural, literário e geográfico para interpretar a passagem dentro do seu ambiente original.</p></div><span class="bx-context-local">● Banco local / Offline</span></div>
   <div class="bx-context-toolbar">
    <div class="bx-context-query"><label>Passagem, livro, tema ou palavra-chave</label><div><input id="bxContextQuery" placeholder="Isaías 6, Corinto, templo, exílio..."><button class="btn primary" id="bxContextFind">Pesquisar</button></div></div>
    <div class="bx-context-filters"><button class="active" data-context-type="all">Todos</button><button data-context-type="historical">🏺 Histórico</button><button data-context-type="cultural">🏛 Cultural</button><button data-context-type="literary">📜 Literário</button><button data-context-type="geographic">🗺 Geográfico</button></div>
   </div>
   <div class="bx-context-layout">
    <section class="bx-context-results"><div class="bx-context-results-head"><div><h4>Contextos disponíveis</h4><p id="bxContextCount">0 registros</p></div><button class="btn secondary" id="bxContextExample">Carregar exemplos</button></div><div id="bxContextList" class="bx-context-list"><div class="bx-context-empty">Importe um banco de contexto ou carregue os exemplos para começar.</div></div></section>
    <aside class="bx-context-detail" id="bxContextDetail"><div class="bx-context-detail-empty"><span>🧭</span><h4>Painel de Contexto</h4><p>Selecione um registro para visualizar período, ambiente, cultura, gênero literário, geografia e conexões bíblicas.</p></div></aside>
   </div>
   <details class="bible-x-import"><summary>⚙️ Banco de Contexto local</summary><p class="muted">JSON aceito com id, title, reference, book, types, period, historical, cultural, literary, geographic, audience, author, purpose, keywords e refs.</p><div class="row"><input type="file" id="bxContextFile" accept=".json"><button class="btn primary" id="bxContextImport">Importar JSON</button><button class="btn secondary" id="bxContextExport">Exportar banco</button><button class="btn danger" id="bxContextClear">Limpar Contexto</button></div></details>
  </section>
  <section class="bible-x-section" data-bible-panel="comments">
   <div class="bx-comments-head"><div><span class="bible-x-stage">ETAPA 9</span><h3>💬 Comentários Bíblicos X</h3><p>Comentários organizados por passagem, com categorias de estudo e integração com Strong, Léxico, Contexto e DNA K7.</p></div><span class="bx-comments-local">● Banco local / Offline</span></div>
   <div class="bx-comments-toolbar">
    <div class="bx-comments-query"><label>Passagem, palavra, tema ou conteúdo</label><div><input id="bxCommentsQuery" placeholder="João 3:16, graça, chamado, santidade..."><button class="btn primary" id="bxCommentsFind">Pesquisar</button></div></div>
    <div class="bx-comments-filters"><button class="active" data-comment-type="all">Todos</button><button data-comment-type="executivo">⚡ Executivo</button><button data-comment-type="exegetico">🔎 Exegético</button><button data-comment-type="hermeneutico">📐 Hermenêutico</button><button data-comment-type="historico-cultural">🏺 Histórico-cultural</button><button data-comment-type="pastoral">❤️ Pastoral</button><button data-comment-type="homiletico">🎙 Homilético</button></div>
   </div>
   <div class="bx-comments-layout">
    <section class="bx-comments-results"><div class="bx-comments-results-head"><div><h4>Comentários disponíveis</h4><p id="bxCommentsCount">0 comentários</p></div><div class="row"><button class="btn secondary" id="bxCommentsExample">Carregar exemplos</button><button class="btn secondary" id="bxCommentsNew">+ Novo comentário</button></div></div><div id="bxCommentsList" class="bx-comments-list"><div class="bx-comments-empty">Importe um banco, crie um comentário próprio ou carregue os exemplos para começar.</div></div></section>
    <aside class="bx-comments-detail" id="bxCommentsDetail"><div class="bx-comments-detail-empty"><span>💬</span><h4>Painel de Comentários</h4><p>Selecione um comentário para ler, editar, copiar ou abrir recursos relacionados.</p></div></aside>
   </div>
   <details class="bible-x-import"><summary>⚙️ Banco de Comentários local</summary><p class="muted">JSON aceito com id, reference, type, title, content, authorLabel, sourceLabel, tags e refs. Comentários de IA não recebem nomes de autores históricos.</p><div class="row"><input type="file" id="bxCommentsFile" accept=".json"><button class="btn primary" id="bxCommentsImport">Importar JSON</button><button class="btn secondary" id="bxCommentsExport">Exportar banco</button><button class="btn danger" id="bxCommentsClear">Limpar Comentários</button></div></details>
  </section>
  <section class="bible-x-section" data-bible-panel="maps">
   <div class="bx-map-head"><div><span class="bible-x-stage">ETAPA 6</span><h3>🗺️ Mapas X • Atlas Bíblico</h3><p>Lugares, cidades, regiões, rotas, viagens e eventos bíblicos em um atlas local e offline.</p></div><span class="bx-map-local">● Atlas local / Offline</span></div>
   <div class="bx-map-toolbar"><div class="bx-map-query"><label>Lugar, região, rota, passagem ou palavra-chave</label><div><input id="bxMapQuery" placeholder="Jerusalém, Galileia, Êxodo, Paulo, Isaías 6..."><button class="btn primary" id="bxMapFind">Pesquisar</button></div></div><div class="bx-map-filters"><button class="active" data-map-type="all">Todos</button><button data-map-type="place">📍 Lugares</button><button data-map-type="city">🏙 Cidades</button><button data-map-type="region">🌍 Regiões</button><button data-map-type="route">➜ Rotas</button><button data-map-type="event">✦ Eventos</button></div></div>
   <section class="bx-v165-route-presets"><div><span>🧭 ROTAS BÍBLICAS</span><small>Exploração rápida</small></div><nav><button type="button" data-v165-route="exodus">🏜 Êxodo</button><button type="button" data-v165-route="jesus-galilee">✝ Jesus • Galileia</button><button type="button" data-v165-route="paul-1">➜ Paulo • 1ª viagem</button><button type="button" data-v165-route="paul-2">➜ Paulo • 2ª viagem</button><button type="button" data-v165-route="paul-3">➜ Paulo • 3ª viagem</button><button type="button" data-v165-route="paul-rome">⚓ Paulo • Roma</button></nav></section>
   <section class="bx-v167-tour-center"><header><div><span>🕶️ PASSEIOS VIRTUAIS</span><small>Abra mapa, 360° e imagens sem sair do fluxo de estudo.</small></div><button type="button" id="bxV167TourToggle">Mostrar destinos</button></header><div class="bx-v167-tour-grid" id="bxV167TourGrid" hidden></div></section>
   <div class="bx-map-layout"><section class="bx-map-results"><div class="bx-map-results-head"><div><h4>Atlas disponível</h4><p id="bxMapCount">0 registros</p></div><button class="btn secondary" id="bxMapExample">Carregar exemplos</button></div><div id="bxMapList" class="bx-map-list"><div class="bx-map-empty">Importe um atlas local ou carregue os exemplos para começar.</div></div></section><section class="bx-map-view"><div class="bx-map-canvas" id="bxMapCanvas"><div class="bx-map-grid"></div><div class="bx-map-compass">N<br>↑</div><div class="bx-map-water">MAR<br>MEDITERRÂNEO</div><div class="bx-map-empty-view"><span>🗺️</span><h4>Atlas Bíblico X</h4><p>Selecione um lugar ou rota para visualizar sua posição aproximada e informações bíblicas.</p></div></div><aside class="bx-map-detail" id="bxMapDetail"><div class="bx-map-detail-empty">Selecione um registro do atlas.</div></aside></section></div>
   <details class="bible-x-import"><summary>⚙️ Banco de Mapas / Atlas local</summary><p class="muted">JSON com id, name, type, region, period, lat, lng, description, refs, tags e route. Coordenadas são opcionais.</p><div class="row"><input type="file" id="bxMapFile" accept=".json,.geojson"><button class="btn primary" id="bxMapImport">Importar JSON</button><button class="btn secondary" id="bxMapExport">Exportar atlas</button><button class="btn danger" id="bxMapClear">Limpar Mapas</button></div></details>
  </section>
  <section class="bible-x-section" data-bible-panel="people">
   <div class="bx-people-head"><div><span class="bible-x-stage">ETAPA 10</span><h3>👤 Personagens Bíblicos X</h3><p>Biografias, relações familiares, acontecimentos, referências, virtudes, falhas e conexões com outros módulos da Bíblia X.</p></div><span class="bx-people-local">● Banco local / Offline</span></div>
   <div class="bx-people-toolbar">
    <div class="bx-people-query"><label>Nome, significado, período, função ou palavra-chave</label><div><input id="bxPeopleQuery" placeholder="Moisés, Davi, Paulo, profeta, reis, missão..."><button class="btn primary" id="bxPeopleFind">Pesquisar</button></div></div>
    <div class="bx-people-filters"><button class="active" data-people-role="all">Todos</button><button data-people-role="patriarca">🏕 Patriarcas</button><button data-people-role="profeta">📜 Profetas</button><button data-people-role="rei">👑 Reis</button><button data-people-role="apostolo">✦ Apóstolos</button><button data-people-role="discipulo">👥 Discípulos</button><button data-people-role="mulher">🌿 Mulheres</button><button data-people-role="outro">• Outros</button></div>
   </div>
   <div class="bx-people-layout">
    <section class="bx-people-results"><div class="bx-people-results-head"><div><h4>Personagens disponíveis</h4><p id="bxPeopleCount">0 personagens</p></div><div class="row"><button class="btn secondary" id="bxPeopleExample">Carregar exemplos</button><button class="btn secondary" id="bxPeopleNew">+ Novo personagem</button></div></div><div id="bxPeopleList" class="bx-people-list"><div class="bx-people-empty">Importe um banco de personagens ou carregue os exemplos para começar.</div></div></section>
    <aside class="bx-people-detail" id="bxPeopleDetail"><div class="bx-people-detail-empty"><span>👤</span><h4>Painel do Personagem</h4><p>Selecione uma pessoa para visualizar biografia, relações, linha da vida e referências bíblicas.</p></div></aside>
   </div>
   <details class="bible-x-import"><summary>⚙️ Banco de Personagens local</summary><p class="muted">JSON aceito com id, name, meaning, role, period, family, places, events, refs, virtues, failures, lessons, related, summary e notes.</p><div class="row"><input type="file" id="bxPeopleFile" accept=".json"><button class="btn primary" id="bxPeopleImport">Importar JSON</button><button class="btn secondary" id="bxPeopleExport">Exportar banco</button><button class="btn danger" id="bxPeopleClear">Limpar Personagens</button></div></details>
  </section>
  <section class="bible-x-section" data-bible-panel="timeline">
   <div class="bx-timeline-head"><div><span class="bible-x-stage">ETAPA 11</span><h3>🕰️ Linha do Tempo Bíblica X</h3><p>Períodos, livros, reis, profetas, impérios, viagens e acontecimentos organizados em uma cronologia bíblica local.</p></div><span class="bx-timeline-local">● Cronologia local / Offline</span></div>
   <div class="bx-timeline-toolbar">
    <div class="bx-timeline-query"><label>Acontecimento, período, personagem, lugar, livro ou referência</label><div><input id="bxTimelineQuery" placeholder="Êxodo, Davi, exílio, Paulo, Jerusalém, Atos 9..."><button class="btn primary" id="bxTimelineFind">Pesquisar</button></div></div>
    <div class="bx-timeline-filters"><button class="active" data-time-type="all">Todos</button><button data-time-type="period">⌛ Períodos</button><button data-time-type="event">✦ Eventos</button><button data-time-type="king">👑 Reis</button><button data-time-type="prophet">📜 Profetas</button><button data-time-type="book">📖 Livros</button><button data-time-type="empire">🏛 Impérios</button><button data-time-type="journey">➜ Viagens</button></div>
   </div>
   <div class="bx-timeline-range"><div><label>Faixa cronológica</label><select id="bxTimelineEra"><option value="all">Toda a cronologia</option><option value="patriarchs">Patriarcas</option><option value="exodus">Êxodo e conquista</option><option value="judges">Juízes</option><option value="monarchy">Monarquia</option><option value="exile">Exílio e pós-exílio</option><option value="intertestamental">Intertestamentário</option><option value="jesus">Vida de Jesus</option><option value="church">Igreja primitiva</option></select></div><div class="bx-timeline-legend"><span><i class="old"></i> Antigo Testamento</span><span><i class="new"></i> Novo Testamento</span><span><i class="approx"></i> Datas aproximadas</span></div></div>
   <div class="bx-timeline-layout">
    <section class="bx-timeline-results"><div class="bx-timeline-results-head"><div><h4>Cronologia disponível</h4><p id="bxTimelineCount">0 registros</p></div><div class="row"><button class="btn secondary" id="bxTimelineExample">Carregar exemplos</button><button class="btn secondary" id="bxTimelineNew">+ Novo registro</button></div></div><div id="bxTimelineList" class="bx-timeline-list"><div class="bx-timeline-empty">Importe uma cronologia ou carregue os exemplos para começar.</div></div></section>
    <aside class="bx-timeline-detail" id="bxTimelineDetail"><div class="bx-timeline-detail-empty"><span>🕰️</span><h4>Painel Cronológico</h4><p>Selecione um período ou acontecimento para visualizar data, contexto, personagens, lugares e referências.</p></div></aside>
   </div>
   <details class="bible-x-import"><summary>⚙️ Banco de Linha do Tempo local</summary><p class="muted">JSON aceito com id, title, type, era, startYear, endYear, displayDate, approximate, testament, summary, people, places, books, refs, related e notes.</p><div class="row"><input type="file" id="bxTimelineFile" accept=".json"><button class="btn primary" id="bxTimelineImport">Importar JSON</button><button class="btn secondary" id="bxTimelineExport">Exportar cronologia</button><button class="btn danger" id="bxTimelineClear">Limpar Linha do Tempo</button></div></details>
  </section>
  <section class="bible-x-section" data-bible-panel="media">
   <div class="bx-media-head"><div><span class="bible-x-stage">ETAPA 7</span><h3>🎥 Mídia X • Biblioteca Bíblica</h3><p>Imagens, vídeos e áudios associados a passagens, lugares e estudos, armazenados localmente no navegador.</p></div><span class="bx-media-local">● Biblioteca local / Offline</span></div>
   <div class="bx-media-toolbar"><div class="bx-media-query"><label>Pesquisar mídia, referência ou palavra-chave</label><div><input id="bxMediaQuery" placeholder="Jerusalém, João 3:16, templo, áudio..."><button class="btn primary" id="bxMediaFind">Pesquisar</button></div></div><div class="bx-media-filters"><button class="active" data-media-type="all">Todos</button><button data-media-type="image">🖼 Imagens</button><button data-media-type="video">🎬 Vídeos</button><button data-media-type="audio">🎧 Áudios</button><button data-media-type="document">📄 Outros</button></div></div>
   <section class="bx-media-import-card"><div><h4>Adicionar arquivos locais</h4><p>Os arquivos permanecem neste dispositivo. Você pode relacioná-los a uma passagem e adicionar descrição, créditos e licença.</p></div><div class="bx-media-form"><input type="file" id="bxMediaFiles" accept="image/*,video/*,audio/*,.pdf" multiple><input id="bxMediaRef" placeholder="Referência (opcional), ex.: Isaías 6"><input id="bxMediaTags" placeholder="Tags separadas por vírgula"><input id="bxMediaCredits" placeholder="Créditos / fonte"><input id="bxMediaLicense" placeholder="Licença / permissão de uso"><textarea id="bxMediaDesc" rows="2" placeholder="Descrição da mídia"></textarea><button class="btn blue" id="bxMediaAdd">＋ Adicionar à Mídia X</button></div></section>
   <div class="bx-media-layout"><section class="bx-media-results"><div class="bx-media-results-head"><div><h4>Biblioteca</h4><p id="bxMediaCount">0 itens</p></div><div class="row"><button class="btn secondary" id="bxMediaExample">Carregar exemplos</button><button class="btn secondary" id="bxMediaExport">Exportar índice</button></div></div><div id="bxMediaGrid" class="bx-media-grid"><div class="bx-media-empty">Adicione arquivos locais ou carregue os exemplos para começar.</div></div></section><aside class="bx-media-detail" id="bxMediaDetail"><div class="bx-media-detail-empty"><span>🎥</span><h4>Visualização de mídia</h4><p>Selecione um item para visualizar, ouvir ou assistir sem sair da Bíblia X.</p></div></aside></div>
   <details class="bible-x-import"><summary>⚙️ Gerenciar Mídia X</summary><p class="muted">O índice pode ser exportado em JSON sem copiar os arquivos binários. Use apenas mídia cuja licença permita armazenamento e uso.</p><div class="row"><button class="btn danger" id="bxMediaClear">Limpar biblioteca de mídia</button></div></details>
  </section>
  <section class="bible-x-section" data-bible-panel="dna">
   <div class="bx-dna-head"><div><span class="bible-x-stage">ETAPA 8</span><h3>🧬 DNA K7 • Bíblia → Studio X</h3><p>Analise a passagem aberta, ajuste a ênfase homilética e envie o resultado diretamente para o DNA K7 Studio X.</p></div><span class="bx-dna-local">● Integração local</span></div>
   <div class="bx-dna-source">
    <div><label>Passagem bíblica</label><div class="bx-dna-refline"><input id="bxDnaRef" placeholder="Isaías 6:8"><button class="btn primary" id="bxDnaLoad">Usar passagem</button></div></div>
    <div class="bx-dna-source-actions"><button class="btn secondary" id="bxDnaUseCurrent">📖 Usar leitura atual</button><button class="btn secondary" id="bxDnaReset">↺ Restaurar padrão</button></div>
   </div>
   <div class="bx-dna-layout">
    <section class="bx-dna-work">
     <article class="bx-dna-card"><div class="bx-dna-card-head"><div><h4>Texto-base</h4><p>O texto permanece local e será transferido ao Studio somente quando você confirmar.</p></div><span id="bxDnaVerseCount">0 versículos</span></div><div id="bxDnaText" class="bx-dna-text">Abra uma passagem na Bíblia X para iniciar.</div></article>
     <article class="bx-dna-card"><div class="bx-dna-card-head"><div><h4>Características para o Studio</h4><p>Ajuste a leitura homilética antes de criar a mensagem.</p></div><strong id="bxDnaScore">75</strong></div>
      <div class="bx-dna-sliders">
       ${[["exposicao","📖","Exposição bíblica",82],["profundidade","🔎","Profundidade",76],["aplicacao","💡","Aplicação",78],["progressao","📈","Progressão",80],["climax","🔥","Clímax",72],["apelo","🎯","Apelo",62]].map(([k,ico,n,v])=>`<label><span><i>${ico}</i><b>${n}</b></span><input type="range" min="0" max="100" value="${v}" data-bxdna="${k}"><output data-bxdna-out="${k}">${v}%</output></label>`).join('')}
      </div>
      <div class="bx-dna-intensity"><div><span>🔥 Intensidade DNA K7</span><small>Define a intensidade inicial ao abrir o Studio X.</small></div><input id="bxDnaIntensity" type="range" min="1" max="5" step="1" value="3"><output id="bxDnaIntensityOut">3/5</output></div>
     </article>
     <article class="bx-dna-card"><div class="bx-dna-card-head"><div><h4>Direção da mensagem</h4><p>Essas opções seguem junto com a passagem para a configuração do Studio X.</p></div></div><div class="bx-dna-options">
       <label><span>Tipo sugerido</span><select id="bxDnaType"><option>Expositiva</option><option>Textual</option><option>Temática</option><option>Exegética</option><option>Pentecostal</option><option>Pastoral</option><option>Evangelística</option><option>DNA K7</option></select></label>
       <label><span>Duração</span><select id="bxDnaDuration"><option value="20">20 min</option><option value="35">35 min</option><option value="40" selected>40 min</option><option value="50">50 min</option><option value="70">70 min</option></select></label>
       <label class="wide"><span>Objetivo / foco</span><input id="bxDnaGoal" placeholder="Ex.: chamado, restauração, fé, missão..."></label>
       <label class="wide"><span>Observações para o Studio</span><textarea id="bxDnaNotes" rows="3" placeholder="Ênfases, contexto, aplicações ou direção desejada..."></textarea></label>
      </div></article>
    </section>
    <aside class="bx-dna-summary">
     <article class="bx-dna-score-card"><span>DNA SCORE</span><strong id="bxDnaScoreBig">75</strong><small>Perfil da passagem</small><div class="bx-dna-ring" id="bxDnaRing"></div></article>
     <article class="bx-dna-summary-card"><h4>Resumo para o Studio</h4><dl><div><dt>Passagem</dt><dd id="bxDnaSummaryRef">—</dd></div><div><dt>Tipo</dt><dd id="bxDnaSummaryType">Expositiva</dd></div><div><dt>Duração</dt><dd id="bxDnaSummaryDuration">40 min</dd></div><div><dt>Intensidade</dt><dd id="bxDnaSummaryIntensity">3/5</dd></div></dl></article>
     <button class="bx-dna-send" id="bxDnaSend">🧬 Enviar para o DNA K7 Studio X <small>Abrir na etapa Personalizar</small></button>
     <button class="btn secondary bx-dna-direct" id="bxDnaSendConfig">⚡ Ir direto para Configurar Mensagem</button>
     <p class="bx-dna-note">A Bíblia X continua separada do Studio X. A integração apenas envia a passagem e os ajustes quando você escolher.</p>
    </aside>
   </div>
  </section>
  <section class="bible-x-section" data-bible-panel="explore">
   <div class="bx-explore-head"><div><span class="bible-x-stage">ETAPA 12</span><h3>🌍 Explorar Bíblia X</h3><p>Cenários, jornadas, acontecimentos, lugares e temas conectados aos demais módulos da Bíblia X.</p></div><span class="bx-explore-local">● Exploração local / Offline</span></div>
   <div class="bx-explore-hero">
    <div><span>VISÃO CONECTADA</span><h4>Explore a narrativa bíblica por cenários e conexões</h4><p>Abra uma experiência e navegue para Bíblia, Mapas, Personagens, Linha do Tempo, Mídia e Contexto sem sair do ambiente Bíblia X.</p></div>
    <div class="bx-explore-orbit" aria-hidden="true"><i>📖</i><b>🗺️</b><em>👤</em><strong>🕰️</strong><span>🎥</span></div>
   </div>
   <div class="bx-explore-toolbar">
    <div class="bx-explore-query"><label>Cenário, lugar, personagem, passagem ou tema</label><div><input id="bxExploreQuery" placeholder="Êxodo, Jerusalém, Paulo, Isaías 6, missão..."><button class="btn primary" id="bxExploreFind">Explorar</button></div></div>
    <div class="bx-explore-filters"><button class="active" data-explore-type="all">Todos</button><button data-explore-type="scene">🏞 Cenários</button><button data-explore-type="journey">🧭 Jornadas</button><button data-explore-type="event">⚡ Eventos</button><button data-explore-type="place">📍 Lugares</button><button data-explore-type="theme">💡 Temas</button></div>
   </div>
   <div class="bx-explore-layout">
    <section class="bx-explore-results"><div class="bx-explore-results-head"><div><h4>Experiências disponíveis</h4><p id="bxExploreCount">0 experiências</p></div><div class="row"><button class="btn secondary" id="bxExploreExample">Carregar exemplos</button><button class="btn secondary" id="bxExploreNew">+ Nova experiência</button></div></div><div id="bxExploreGrid" class="bx-explore-grid"><div class="bx-explore-empty">Carregue os exemplos ou importe seu próprio banco para começar a explorar.</div></div></section>
    <aside class="bx-explore-detail" id="bxExploreDetail"><div class="bx-explore-detail-empty"><span>🌍</span><h4>Painel de Exploração</h4><p>Selecione uma experiência para visualizar conexões com passagem, lugares, personagens, cronologia, mídia e contexto.</p></div></aside>
   </div>
   <details class="bible-x-import"><summary>⚙️ Banco Explorar Bíblia local</summary><p class="muted">JSON com id, title, type, period, summary, refs, places, people, timeline, mediaTags, themes e notes.</p><div class="row"><input type="file" id="bxExploreFile" accept=".json"><button class="btn primary" id="bxExploreImport">Importar JSON</button><button class="btn secondary" id="bxExploreExport">Exportar experiências</button><button class="btn danger" id="bxExploreClear">Limpar Explorar</button></div></details>
  </section>
  <section class="bible-x-section" data-bible-panel="favorites">
   <div class="bx-fav-head"><div><span class="bible-x-stage">ETAPA 13</span><h3>⭐ Favoritos X</h3><p>Guarde passagens, comentários, mapas, personagens, mídias e estudos em uma central local.</p></div><span class="bx-fav-local">● Favoritos locais / Offline</span></div>
   <div class="bx-fav-toolbar"><div class="bx-fav-query"><label>Pesquisar favoritos</label><div><input id="bxFavQuery" placeholder="João 3:16, graça, Jerusalém, Paulo..."><button class="btn primary" id="bxFavFind">Pesquisar</button></div></div><div class="bx-fav-filters"><button class="active" data-fav-type="all">Todos</button><button data-fav-type="verse">📖 Passagens</button><button data-fav-type="comment">💬 Comentários</button><button data-fav-type="map">🗺️ Mapas</button><button data-fav-type="person">👤 Personagens</button><button data-fav-type="media">🎥 Mídia</button><button data-fav-type="study">🧠 Estudos</button></div></div>
   <div class="bx-fav-actions"><button class="btn primary" id="bxFavCurrent">⭐ Favoritar passagem atual</button><button class="btn secondary" id="bxFavNew">+ Novo favorito</button><button class="btn secondary" id="bxFavExport">Exportar JSON</button></div>
   <div class="bx-fav-layout"><section class="bx-fav-results"><div class="bx-fav-results-head"><div><h4>Itens salvos</h4><p id="bxFavCount">0 favoritos</p></div></div><div id="bxFavList" class="bx-fav-list"><div class="bx-fav-empty">Nenhum favorito salvo.</div></div></section><aside class="bx-fav-detail" id="bxFavDetail"><div class="bx-fav-detail-empty"><span>⭐</span><h4>Central de Favoritos</h4><p>Selecione um item para abrir detalhes, navegar para o módulo de origem ou enviar ao Studio X.</p></div></aside></div>
   <details class="bible-x-import"><summary>⚙️ Banco de Favoritos local</summary><p class="muted">JSON com id, type, title, reference, summary, sourceModule, tags, note e createdAt.</p><div class="row"><input type="file" id="bxFavFile" accept=".json"><button class="btn primary" id="bxFavImport">Importar JSON</button><button class="btn danger" id="bxFavClear">Limpar Favoritos</button></div></details>
  </section>
  <section class="bible-x-section" data-bible-panel="notes">
   <div class="bx-notes-head"><div><span class="bible-x-stage">ETAPA 14</span><h3>📝 Notas X</h3><p>Crie notas pessoais ligadas a passagens, estudos e módulos da Bíblia X, com salvamento local e organização por tipo.</p></div><span class="bx-notes-local">● Notas locais / Offline</span></div>
   <div class="bx-notes-toolbar"><div class="bx-notes-query"><label>Pesquisar notas</label><div><input id="bxNotesQuery" placeholder="João 3:16, restauração, sermão, oração..."><button class="btn primary" id="bxNotesFind">Pesquisar</button></div></div><div class="bx-notes-filters"><button class="active" data-note-type="all">Todas</button><button data-note-type="study">📘 Estudo</button><button data-note-type="sermon">🎙️ Mensagem</button><button data-note-type="devotional">❤️ Devocional</button><button data-note-type="question">❓ Pergunta</button><button data-note-type="personal">📝 Pessoal</button></div></div>
   <div class="bx-notes-actions"><button class="btn primary" id="bxNotesCurrent">📝 Nova nota da passagem atual</button><button class="btn secondary" id="bxNotesNew">+ Nova nota</button><button class="btn secondary" id="bxNotesExport">Exportar JSON</button></div>
   <div class="bx-notes-layout"><section class="bx-notes-results"><div class="bx-notes-results-head"><div><h4>Minhas notas</h4><p id="bxNotesCount">0 notas</p></div></div><div id="bxNotesList" class="bx-notes-list"><div class="bx-notes-empty">Nenhuma nota criada ainda.</div></div></section><aside class="bx-notes-editor" id="bxNotesEditor"><div class="bx-notes-editor-head"><div><small id="bxNoteMode">NOVA NOTA</small><h4>Editor de Nota</h4></div><button class="btn danger" id="bxNoteDelete" hidden>Excluir</button></div><input type="hidden" id="bxNoteId"><div class="bx-notes-form-grid"><div><label>Título</label><input id="bxNoteTitle" placeholder="Título da nota"></div><div><label>Tipo</label><select id="bxNoteType"><option value="study">Estudo</option><option value="sermon">Mensagem</option><option value="devotional">Devocional</option><option value="question">Pergunta</option><option value="personal">Pessoal</option></select></div></div><div class="bx-notes-form-grid"><div><label>Referência</label><input id="bxNoteRef" placeholder="João 3:16"></div><div><label>Tags</label><input id="bxNoteTags" placeholder="graça, salvação, amor"></div></div><label>Conteúdo</label><textarea id="bxNoteContent" rows="12" placeholder="Escreva sua nota, observação, ideia para mensagem, pergunta ou aplicação..."></textarea><div class="bx-notes-savebar"><span id="bxNoteSaved">Ainda não salvo</span><div class="row"><button class="btn secondary" id="bxNoteOpenRef">📖 Abrir referência</button><button class="btn secondary" id="bxNoteStudio">⚡ Enviar ao Studio X</button><button class="btn primary" id="bxNoteSave">Salvar nota</button></div></div></aside></div>
   <details class="bible-x-import"><summary>⚙️ Banco de Notas local</summary><p class="muted">JSON com id, title, type, reference, tags, content, createdAt e updatedAt.</p><div class="row"><input type="file" id="bxNotesFile" accept=".json"><button class="btn primary" id="bxNotesImport">Importar JSON</button><button class="btn danger" id="bxNotesClear">Limpar Notas</button></div></details>
  </section>
  <section class="bible-x-section" data-bible-panel="collections"><div class="bx-col-head"><div><span class="bible-x-stage">ETAPA 15</span><h3>📂 Coleções X</h3><p>Organize passagens, notas, favoritos, personagens e estudos em coleções temáticas locais.</p></div><span class="bx-col-local">● Coleções locais / Offline</span></div><div class="bx-col-toolbar"><div><label>Pesquisar coleções</label><div class="row"><input id="bxColQuery" placeholder="Missões, Isaías, graça, série de estudos..."><button class="btn primary" id="bxColFind">Pesquisar</button></div></div><div class="row"><button class="btn primary" id="bxColNew">+ Nova coleção</button><button class="btn secondary" id="bxColExport">Exportar JSON</button></div></div><div class="bx-col-layout"><section><div class="bx-col-results-head"><div><h4>Minhas coleções</h4><p id="bxColCount">0 coleções</p></div></div><div id="bxColList" class="bx-col-list"><div class="bx-col-empty">Nenhuma coleção criada.</div></div></section><aside class="bx-col-editor"><input type="hidden" id="bxColId"><div class="bx-col-editor-head"><div><small id="bxColMode">NOVA COLEÇÃO</small><h4>Editor de Coleção</h4></div><button class="btn danger" id="bxColDelete" hidden>Excluir</button></div><label>Nome</label><input id="bxColTitle" placeholder="Ex.: Série — Restauração"><label>Descrição</label><textarea id="bxColDescription" rows="3"></textarea><div class="bx-col-grid"><div><label>Tipo</label><select id="bxColType"><option value="study">Estudo</option><option value="sermon">Mensagens</option><option value="theme">Tema</option><option value="series">Série</option><option value="personal">Pessoal</option></select></div><div><label>Tags</label><input id="bxColTags" placeholder="restauração, igreja, oração"></div></div><label>Referências / itens</label><textarea id="bxColItems" rows="8" placeholder="Uma referência ou item por linha"></textarea><div class="bx-col-savebar"><span id="bxColSaved">Ainda não salvo</span><div class="row"><button class="btn secondary" id="bxColAddCurrent">+ Passagem atual</button><button class="btn secondary" id="bxColStudio">⚡ Studio X</button><button class="btn primary" id="bxColSave">Salvar coleção</button></div></div></aside></div><details class="bible-x-import"><summary>⚙️ Banco de Coleções local</summary><p class="muted">JSON com id, title, type, description, tags, items, createdAt e updatedAt.</p><div class="row"><input type="file" id="bxColFile" accept=".json"><button class="btn primary" id="bxColImport">Importar JSON</button><button class="btn danger" id="bxColClear">Limpar Coleções</button></div></details></section>
  <section class="bible-x-section" data-bible-panel="search"><div class="bible-x-empty"><span>🔎</span><h3>Pesquisa X</h3><p>Pesquisa avançada por palavra, frase, referência, tema e ocorrência.</p><small>Use também a pesquisa rápida disponível na leitura principal.</small></div></section>
  <section class="bible-x-panel" data-bible-panel="global">
   <div class="bx-adv-head"><div><span class="bible-x-stage">ETAPA 17</span><h3>🔍 Pesquisa Global X</h3><p>Pesquise em todos os bancos locais da Bíblia X sem sair do ambiente de estudo.</p></div><span class="bx-adv-local">● Índice local / Offline</span></div>
   <div class="bx-adv-toolbar"><input id="bxGlobalQuery" placeholder="Palavra, pessoa, lugar, Strong, tema ou referência"><select id="bxGlobalModule"><option value="all">Todos os módulos</option><option value="verses">Bíblia</option><option value="crossrefs">Referências</option><option value="strong">Strong</option><option value="lexicon">Léxico</option><option value="context">Contexto</option><option value="comments">Comentários</option><option value="maps">Mapas</option><option value="people">Personagens</option><option value="timeline">Linha do Tempo</option><option value="explore">Explorar</option><option value="favorites">Favoritos</option><option value="notes">Notas</option><option value="collections">Coleções</option></select><button class="btn primary" id="bxGlobalFind">Pesquisar</button></div>
   <div class="bx-adv-kpis"><div class="bx-adv-kpi"><b id="bxGlobalTotal">0</b><small>resultados</small></div><div class="bx-adv-kpi"><b id="bxGlobalSources">0</b><small>módulos</small></div><div class="bx-adv-kpi"><b>LOCAL</b><small>sem internet</small></div><div class="bx-adv-kpi"><b>17</b><small>etapa</small></div></div>
   <div id="bxGlobalResults" class="bx-adv-list"><div class="bx-adv-empty">Digite algo para pesquisar em toda a Bíblia X.</div></div>
  </section>
  <section class="bible-x-panel" data-bible-panel="concordance">
   <div class="bx-adv-head"><div><span class="bible-x-stage">ETAPA 18</span><h3>📊 Concordância X</h3><p>Conte palavras e encontre ocorrências na Bíblia local importada.</p></div><span class="bx-adv-local">● Análise local</span></div>
   <div class="bx-adv-toolbar"><input id="bxConcQuery" placeholder="Ex.: graça, fé, Jerusalém"><button class="btn primary" id="bxConcFind">Analisar</button><button class="btn secondary" id="bxConcTop">Top 50 palavras</button></div>
   <div class="bx-adv-kpis"><div class="bx-adv-kpi"><b id="bxConcHits">0</b><small>ocorrências</small></div><div class="bx-adv-kpi"><b id="bxConcVerses">0</b><small>versículos</small></div><div class="bx-adv-kpi"><b id="bxConcBooks">0</b><small>livros</small></div><div class="bx-adv-kpi"><b id="bxConcDb">0</b><small>base local</small></div></div>
   <div id="bxConcOut" class="bx-adv-card"><div class="bx-adv-empty">Importe uma Bíblia e pesquise uma palavra para montar a concordância.</div></div>
  </section>
  <section class="bible-x-panel" data-bible-panel="plans">
   <div class="bx-adv-head"><div><span class="bible-x-stage">ETAPA 19</span><h3>🗓️ Planos de Estudo X</h3><p>Organize sequências de leitura e estudo com progresso salvo offline.</p></div><span class="bx-adv-local">● Progresso local</span></div>
   <div class="bx-adv-grid"><section class="bx-adv-card"><div class="bx-adv-toolbar"><input id="bxPlanQuery" placeholder="Pesquisar planos"><button class="btn secondary" id="bxPlanNew">Novo</button></div><div id="bxPlanList" class="bx-adv-list"></div></section><section class="bx-adv-card"><div class="bx-adv-form"><input type="hidden" id="bxPlanId"><label>Título<input id="bxPlanTitle" placeholder="Ex.: Isaías em 7 dias"></label><label>Descrição<textarea id="bxPlanDesc"></textarea></label><label>Passagens / tarefas — uma por linha<textarea id="bxPlanItems" placeholder="Isaías 1
Isaías 2
Isaías 6"></textarea></label><label>Progresso (%)<input id="bxPlanProgress" type="range" min="0" max="100" value="0"><b id="bxPlanPct">0%</b></label><div class="row"><button class="btn primary" id="bxPlanSave">Salvar plano</button><button class="btn secondary" id="bxPlanOpen">Abrir próxima passagem</button><button class="btn danger" id="bxPlanDelete">Excluir</button></div></div></section></div>
  </section>
  <section class="bible-x-panel" data-bible-panel="backup">
   <div class="bx-adv-head"><div><span class="bible-x-stage">ETAPA 20</span><h3>💾 Backup & Restauração X</h3><p>Exporte e restaure os bancos locais da Bíblia X sem enviar dados para a internet.</p></div><span class="bx-adv-local">● Segurança local</span></div>
   <div class="bx-adv-grid"><section class="bx-adv-card"><h4>Backup completo</h4><p class="muted">Inclui todos os object stores existentes da Bíblia X.</p><button class="btn primary" id="bxBackupExport">Gerar backup JSON</button><div id="bxBackupStats" class="bx-adv-kpis"></div></section><section class="bx-adv-card"><h4>Restaurar</h4><div class="bx-backup-drop"><input type="file" id="bxBackupFile" accept="application/json,.json"><p>Escolha um backup gerado pela Bíblia X.</p></div><div class="row"><button class="btn secondary" id="bxBackupPreview">Verificar arquivo</button><button class="btn danger" id="bxBackupRestore">Restaurar bancos</button></div><p id="bxBackupMsg" class="muted">A restauração exige confirmação e mescla/substitui registros pela chave de cada banco.</p></section></div>
  </section>
  <section class="bible-x-panel" data-bible-panel="workspace"><div class="bx-adv-head"><div><span class="bible-x-stage">ETAPA 22</span><h3>🧪 Mesa de Estudo X</h3><p>Reúna passagem, observações e atalhos de pesquisa em uma única mesa local.</p></div><span class="bx-adv-local">● Sessão local</span></div><div class="bx-adv-grid"><section class="bx-adv-card bx-study-work"><label>Passagem<input id="bxWorkRef" placeholder="Isaías 6"></label><div class="row"><button class="btn primary" id="bxWorkLoad">Carregar texto</button><button class="btn secondary" id="bxWorkCurrent">Usar passagem atual</button></div><div id="bxWorkText" class="output">Nenhuma passagem carregada.</div></section><section class="bx-adv-card bx-adv-form"><label>Título do estudo<input id="bxWorkTitle" placeholder="Meu estudo"></label><label>Observações<textarea id="bxWorkNotes" placeholder="Anotações da sessão..."></textarea></label><div class="row"><button class="btn secondary" data-bible-jump="context">🧭 Contexto</button><button class="btn secondary" data-bible-jump="strong">🇬🇷🇮🇱 Strong</button><button class="btn secondary" data-bible-jump="comments">💬 Comentários</button><button class="btn primary" id="bxWorkStudio">🧬 Studio X</button></div></section></div></section>
  <section class="bible-x-panel" data-bible-panel="parallel"><div class="bx-adv-head"><div><span class="bible-x-stage">ETAPA 23</span><h3>↔️ Leitura Paralela X</h3><p>Compare duas passagens da Bíblia local lado a lado.</p></div><span class="bx-adv-local">● Comparação local</span></div><div class="bx-parallel-toolbar"><input id="bxParA" placeholder="João 3:16"><input id="bxParB" placeholder="Romanos 5:8"><button class="btn primary" id="bxParLoad">Comparar</button></div><div class="bx-parallel-grid"><article class="bx-adv-card"><h4 id="bxParATitle">Passagem A</h4><div id="bxParAOut" class="output">—</div></article><article class="bx-adv-card"><h4 id="bxParBTitle">Passagem B</h4><div id="bxParBOut" class="output">—</div></article></div></section>
  <section class="bible-x-panel" data-bible-panel="export"><div class="bx-adv-head"><div><span class="bible-x-stage">ETAPA 24</span><h3>📤 Central de Exportação X</h3><p>Prepare a passagem atual e suas anotações para uso fora da Bíblia X.</p></div><span class="bx-adv-local">● Exportação local</span></div><div class="bx-adv-grid"><section class="bx-adv-card bx-adv-form"><label>Título<input id="bxExpTitle" value="Estudo Bíblia X"></label><label>Conteúdo<textarea id="bxExpText" rows="16" placeholder="Use a passagem atual ou cole seu estudo"></textarea></label><button class="btn secondary" id="bxExpCurrent">Usar passagem atual</button></section><section class="bx-adv-card"><h4>Formatos</h4><p class="muted">Os arquivos são produzidos localmente no navegador.</p><div class="bx-export-actions"><button class="btn primary" id="bxExpTxt">TXT</button><button class="btn secondary" id="bxExpMd">Markdown</button><button class="btn secondary" id="bxExpPrint">Imprimir / PDF</button><button class="btn secondary" id="bxExpCopy">Copiar</button></div></section></div></section>
  <section class="bible-x-panel" data-bible-panel="topics"><div class="bx-adv-head"><div><span class="bible-x-stage">ETAPA 26</span><h3>🏷️ Tópicos X</h3><p>Monte cadeias temáticas usando referências da Bíblia local.</p></div><span class="bx-adv-local">● Local</span></div><div class="bx-adv-grid"><section class="bx-adv-card bx-adv-form"><label>Tema<input id="bxTopicName" placeholder="Graça, fé, missão..."></label><label>Referências<textarea id="bxTopicRefs" rows="10" placeholder="João 3:16
Romanos 5:8"></textarea></label><button class="btn primary" id="bxTopicBuild">Montar cadeia</button></section><section class="bx-adv-card"><h4>Resultado</h4><div id="bxTopicOut" class="output">Informe um tema e referências.</div><button class="btn secondary" id="bxTopicStudio">Enviar ao Studio X</button></section></div></section>
  <section class="bible-x-panel" data-bible-panel="dossier"><div class="bx-adv-head"><div><span class="bible-x-stage">ETAPA 27</span><h3>🗂️ Dossiê de Passagem X</h3><p>Concentre texto, contexto, notas e recursos relacionados em um único painel.</p></div><span class="bx-adv-local">● Gerado localmente</span></div><div class="bx-adv-card"><label>Referência<input id="bxDossierRef" placeholder="Isaías 6"></label><div class="row"><button class="btn primary" id="bxDossierBuild">Gerar dossiê</button><button class="btn secondary" id="bxDossierCurrent">Usar atual</button><button class="btn secondary" id="bxDossierCopy">Copiar</button></div><pre id="bxDossierOut" class="output">Nenhum dossiê gerado.</pre></div></section>
  <section class="bible-x-panel" data-bible-panel="interlinear"><div class="bx-adv-head"><div><span class="bible-x-stage">ETAPA 28</span><h3>🔤 Interlinear X</h3><p>Visualizador preparado para dados locais de lema, transliteração e Strong.</p></div><span class="bx-adv-local">● Sem conteúdo proprietário embutido</span></div><div class="bx-adv-card"><label>Referência<input id="bxIntRef" placeholder="João 1:1"></label><button class="btn primary" id="bxIntLoad">Carregar</button><div id="bxIntOut" class="bx-diag-list"><span>Importe/alimenta o banco Strong para enriquecer esta visão.</span></div></div></section>
  <section class="bible-x-panel" data-bible-panel="offlinecenter"><div class="bx-adv-head"><div><span class="bible-x-stage">ETAPA 29</span><h3>📦 Central Offline X</h3><p>Veja exatamente quais bancos estão disponíveis no computador antes de qualquer publicação.</p></div><span class="bx-adv-local">● Prioridade local</span></div><div class="bx-adv-kpis"><div class="bx-adv-kpi"><b id="bxOffStores">—</b><small>bancos</small></div><div class="bx-adv-kpi"><b id="bxOffRows">—</b><small>registros</small></div><div class="bx-adv-kpi"><b id="bxOffNet">—</b><small>rede</small></div></div><div class="bx-adv-card"><button class="btn primary" id="bxOffScan">Examinar dados locais</button><div id="bxOffList" class="bx-diag-list"></div></div></section>
  <section class="bible-x-panel" data-bible-panel="finalcheck"><div class="bx-adv-head"><div><span class="bible-x-stage">ETAPA 30 • FECHAMENTO</span><h3>✅ Validação Final X</h3><p>Checklist técnico local antes de preparar uma futura versão para GitHub/Render.</p></div><span class="bx-adv-local">● Publicação bloqueada nesta etapa</span></div><div class="bx-adv-kpis"><div class="bx-adv-kpi"><b>30</b><small>etapas</small></div><div class="bx-adv-kpi"><b id="bxFinalStatus">AGUARDANDO</b><small>status</small></div></div><div class="bx-adv-card"><button class="btn primary" id="bxFinalRun">Executar validação</button><div id="bxFinalList" class="bx-diag-list"><span>A validação não envia nenhum dado.</span></div></div></section>
  <section class="bible-x-panel" data-bible-panel="diagnostic"><div class="bx-adv-head"><div><span class="bible-x-stage">ETAPA 25 • CONSOLIDAÇÃO</span><h3>🛡️ Diagnóstico Bíblia X</h3><p>Verificação local dos bancos, módulos e integração antes da publicação.</p></div><span class="bx-adv-local">● Sem publicação automática</span></div><div class="bx-adv-kpis"><div class="bx-adv-kpi"><b>25</b><small>etapas</small></div><div class="bx-adv-kpi"><b id="bxDiagStores">—</b><small>bancos</small></div><div class="bx-adv-kpi"><b id="bxDiagRows">—</b><small>registros</small></div><div class="bx-adv-kpi"><b id="bxDiagStatus">LOCAL</b><small>modo</small></div></div><div class="bx-adv-card"><h4>Checklist</h4><div id="bxDiagList" class="bx-diag-list"><span>Execute a verificação.</span></div><div class="row"><button class="btn primary" id="bxDiagRun">Verificar agora</button><button class="btn secondary" data-bible-jump="backup">Abrir Backup</button><button class="btn secondary" data-bible-jump="hub">Central Bíblia X</button></div></div></section>
  <section class="bible-x-section" data-bible-panel="settings">
   <div class="bx-settings-head"><div><span class="bible-x-stage">ETAPA 16</span><h3>⚙️ Configurações da Bíblia X</h3><p>Preferências de leitura, diagnóstico offline e backup local do módulo bíblico.</p></div><span class="bx-settings-local">● Configuração local / Offline</span></div>
   <div class="bx-settings-grid">
    <section class="bx-settings-card"><h4>📖 Leitura</h4><label>Tamanho do texto <b id="bxSetFontOut">15px</b></label><input type="range" id="bxSetFont" min="12" max="26" step="1" value="15"><label>Espaçamento entre linhas <b id="bxSetLineOut">1.65</b></label><input type="range" id="bxSetLine" min="1.2" max="2.2" step="0.05" value="1.65"><label class="bx-settings-check"><input type="checkbox" id="bxSetCompact"> Modo compacto de leitura</label><button class="btn secondary" id="bxSetReset">Restaurar padrões de leitura</button></section>
    <section class="bx-settings-card"><h4>💾 Banco local</h4><div id="bxSetStats" class="bx-settings-stats"><span>Calculando dados locais...</span></div><div class="row"><button class="btn primary" id="bxSetRefresh">Atualizar diagnóstico</button><button class="btn secondary" id="bxSetBackup">Backup Bíblia X</button></div><p class="muted">O backup exporta os bancos locais da Bíblia X em JSON sem publicar nada na internet.</p></section>
    <section class="bx-settings-card"><h4>🔒 Operação local</h4><div class="bx-settings-status"><b>Modo recomendado agora</b><span>LOCAL / OFFLINE</span><p>Studio X e Bíblia X podem continuar sendo testados no computador antes de reativar publicação automática.</p></div><label class="bx-settings-check"><input type="checkbox" id="bxSetRemember" checked> Lembrar última passagem aberta</label></section>
    <section class="bx-settings-card"><h4>🧰 Manutenção segura</h4><p>Limpa somente preferências visuais da Bíblia X. Bíblia importada, Strong, Léxico, notas, favoritos e coleções não são apagados.</p><button class="btn danger" id="bxSetClearPrefs">Limpar preferências visuais</button><small id="bxSetSaved">Preferências salvas automaticamente neste navegador.</small></section>
   </div>
  </section>
 </main>
 </div>`},
 k7(){const analyses=Store.get("k7analyses",[]);return `<h2>🔥 Laboratório K7</h2><p class="muted">Analisa uma transcrição e extrai sinais estruturais. Não copia identidade vocal.</p>
 <label>Transcrição</label><textarea id="kText" rows="13" placeholder="Cole a transcrição K7..."></textarea>
 <div class="row"><button class="btn primary" id="kAnalyze">Analisar</button><button class="btn secondary" id="kPrompt">Ver DNA Mestre</button></div>
 <div id="kOut" class="output">Análises salvas: ${analyses.length}</div>`},
 library(){return `<h2>📚 Biblioteca</h2><label>Buscar</label><input id="libQ" placeholder="tema, texto, tipo..."><div class="row"><button class="btn primary" id="libSearch">Pesquisar</button><button class="btn secondary" id="libExport">Exportar biblioteca</button></div><div class="library-filters"><button class="chip active" data-lib-filter="all">Todos</button><button class="chip" data-lib-filter="pinned">📌 Fixados</button><button class="chip" data-lib-filter="favorites">❤️ Favoritos</button></div><div id="libList" class="list"></div>`},
 history(){const a=Store.get("history",[]).slice().sort((x,y)=>(Number(!!y.pinned)-Number(!!x.pinned))||(Number(!!y.favorite)-Number(!!x.favorite))||String(y.created||"").localeCompare(String(x.created||"")));return `<h2>🕘 Histórico</h2><div class="history-toolbar"><label class="history-select-all"><input type="checkbox" id="histSelectAll"> Selecionar tudo</label><button class="btn secondary" id="histPinSelected">📌 Fixar selecionados</button><button class="btn secondary" id="histFavSelected">❤️ Favoritar selecionados</button><button class="btn danger" id="histDeleteSelected">🗑 Excluir selecionados</button><button class="btn danger ghost-danger" id="histClear">Excluir tudo</button></div><div id="histList" class="list history-list">${a.length?a.map(x=>`<div class="item history-item ${x.pinned?"is-pinned":""} ${x.favorite?"is-favorite":""}" data-hid="${x.id}"><div class="history-item-head"><label class="history-check"><input type="checkbox" data-hsel="${x.id}"></label><div><strong>${x.pinned?"📌 ":""}${x.favorite?"❤️ ":""}${escapeHtml(x.cmd||"Geração")}</strong><br><small>${new Date(x.created).toLocaleString()} • ${escapeHtml(x.provider||x.engine||"local")} ${x.model?"• "+escapeHtml(x.model):""}</small></div></div><div class="row"><button class="btn secondary" data-hopen="${x.id}">Abrir no Editor</button><button class="btn secondary" data-hcopy="${x.id}">Copiar</button><button class="btn secondary" data-hpin="${x.id}">${x.pinned?"Desafixar":"📌 Fixar"}</button><button class="btn secondary" data-hfav="${x.id}">${x.favorite?"♡ Remover favorito":"❤️ Favoritar"}</button></div></div>`).join(""):"<div class='item'>Nenhuma geração ainda.</div>"}</div>`},
 knowledge(){return `<h2>🧠 Biblioteca Viva Local</h2><div class="chips"><span class="chip">Temas</span><span class="chip">Doutrinas</span><span class="chip">Personagens</span><span class="chip">História</span><span class="chip">Geografia</span><span class="chip">Cronologia</span><span class="chip">Ilustrações</span><span class="chip">Aplicações</span></div>
 <label>Pesquisar em dados locais</label><input id="knowQ" placeholder="Ex.: restauração, Paulo, Jerusalém"><button class="btn primary" id="knowSearch">Pesquisar</button><div id="knowOut" class="output">Digite uma pesquisa.</div>`},
 editor(){const x=Store.get("editor",{title:"",text:""});return `<h2>📝 Editor Inteligente</h2><label>Título</label><input id="edTitle" value="${escapeHtml(x.title)}"><label>Texto</label><textarea id="edText" rows="22">${escapeHtml(x.text)}</textarea>
<div class="row"><span class="chip" id="edWords">${wordCount(x.text)} palavras</span><span class="chip" id="edTime">~${readingMinutes(x.text)} min de leitura</span><span class="chip" id="edAutosave">Autosave ativo</span></div>
<div class="row"><button class="btn primary" id="edSave">Salvar</button><button class="btn secondary" id="edLib">Enviar à Biblioteca</button><button class="btn secondary" id="edTxt">TXT</button><button class="btn secondary" id="edMd">Markdown</button><button class="btn secondary" id="edDoc">Word (.doc)</button><button class="btn secondary" id="edPdf">Imprimir/PDF</button></div>`},
 pulpit(){const ed=Store.get("editor",{text:""});return `<h2>🎙️ Modo Púlpito PRO</h2><div class="timer" id="timer">00:00</div><div class="row"><button class="btn primary" id="tStart">Iniciar</button><button class="btn secondary" id="tPause">Pausar</button><button class="btn danger" id="tReset">Zerar</button><button class="btn secondary" id="pFontUp">A+</button><button class="btn secondary" id="pFontDown">A-</button><button class="btn secondary" id="pScroll">Rolagem automática</button></div><label>Texto de púlpito</label><textarea id="pText" rows="18">${escapeHtml(ed.text||"")}</textarea>`},
 backup(){return `<h2>💾 Backup</h2><p class="muted">Exporta/restaura todos os dados locais do LOGOS neste navegador.</p><div class="row"><button class="btn primary" id="bkExport">Exportar JSON</button><input type="file" id="bkFile" accept=".json"><button class="btn secondary" id="bkImport">Restaurar</button></div><div id="bkOut" class="output">Pronto.</div>`},
 aihub(){const p=App.health?.providers||{},m=App.health?.models||{},orders=App.health?.orders||{},mt=App.metrics||{};const names=[["gemini","Gemini"],["groq","Groq"],["openrouter","OpenRouter"],["huggingface","Hugging Face"],["openai","OpenAI"]];const stats=mt.providers||{};return `<h2>🤖 LOGOS AI HUB</h2>
<div class="monitor-heading"><div><span class="monitor-eyebrow">📊 MONITOR DE CAPACIDADE</span><h3>Smart Router em tempo real</h3><p class="muted">Distribuição, saúde, velocidade e falhas observadas dos provedores públicos. O 9Router permanece como reserva local separada.</p></div><button class="btn secondary" id="hubRefreshTop">↻ Atualizar monitor</button></div>
<div class="capacity-panel"><div class="capacity-kpi"><span>ROTEADOR</span><strong>🧠 Smart Router</strong><small>${mt.environment==="public"?"Produção online":"Ambiente local"}</small></div><div class="capacity-kpi"><span>PROVEDORES</span><strong>${mt.online_providers??names.filter(([k])=>p[k]).length}/5</strong><small>online públicos</small></div><div class="capacity-kpi"><span>GERAÇÕES IA</span><strong>${mt.totals?.success??0}</strong><small>desde o início do servidor</small></div><div class="capacity-kpi"><span>CARGA</span><strong class="load-${mt.load||"normal"}">${String(mt.load||"normal").toUpperCase()}</strong><small>${mt.recent?.requests||0} req. nos últimos 5 min • ${mt.recent?.errors||0} erro(s)</small></div></div>
<div class="grid provider-monitor">${names.map(([k,n])=>{const x=stats[k]||{};return `<div class="card provider-card"><div class="provider-card-head"><h3>${p[k]?"🟢":"⚪"} ${n}</h3><span>${x.share_pct||0}% carga</span></div><p class="muted">${escapeHtml(m[k]||"—")}</p><div class="provider-stats"><span>✓ ${x.success||0}</span><span>⚠ ${x.errors||0}</span><span>⏱ ${x.avg_seconds!=null?x.avg_seconds+"s":"—"}</span></div><button class="btn secondary" data-provider-test="${k}" ${p[k]?"":"disabled"}>Testar</button></div>`}).join("")}<div class="card provider-card local-reserve-card"><div class="provider-card-head"><h3>🟢 9Router</h3><span class="reserve-badge">RESERVA LOCAL</span></div><p class="muted">Fora da carga pública • última rota somente no seu PC</p><div class="provider-stats"><span>⌂ Reserva preservada</span><span>${IS_LOCAL_HOST&&p["9router"]?"✓ disponível neste PC":"não participa do Render"}</span></div>${IS_LOCAL_HOST?`<button class="btn secondary" data-provider-test="9router" ${p["9router"]?"":"disabled"}>Testar reserva local</button>`:""}</div></div>
<div class="future-providers"><strong>Expansão preparada:</strong> Cerebras • Together AI • Fireworks AI <span>— entrarão no mesmo monitor quando adicionarmos as chaves.</span></div>
<div class="two"><div><label>Modo do roteador</label><select id="hubMode"><option value="rapido" ${App.aiMode==="rapido"?"selected":""}>⚡ Rápido — menor latência saudável</option><option value="economico" ${App.aiMode==="economico"?"selected":""}>💰 Econômico — prioriza rotas econômicas</option><option value="automatico" ${App.aiMode==="automatico"?"selected":""}>🧠 Automático — carga + saúde + fallback</option><option value="qualidade" ${App.aiMode==="qualidade"?"selected":""}>💎 Qualidade — geração + revisão independente</option><option value="manual" ${App.aiMode==="manual"?"selected":""}>Manual</option></select></div><div><label>Provedor</label><select id="hubProvider"><option value="auto">Automático / Smart Router</option>${names.map(([k,n])=>`<option value="${k}" ${App.provider===k?"selected":""}>${n} ${p[k]?"✅":"—"}</option>`).join("")}${IS_LOCAL_HOST?`<option value="9router" ${App.provider==="9router"?"selected":""}>9Router • Reserva local</option>`:""}</select></div></div>
<label>Modelo manual (opcional)</label><input id="hubModel" value="${escapeHtml(App.model||"")}" placeholder="Deixe vazio para usar o modelo padrão"><div class="row"><button class="btn primary" id="hubSave">Salvar</button><button class="btn secondary" id="hubRefresh">Atualizar monitor</button></div><div class="output" id="hubOut">⚡ Rápido: ${(orders.rapido||[]).join(" → ")||"—"}
💰 Econômico: ${(orders.economico||[]).join(" → ")||"—"}
🧠 Automático: ${(orders.automatico||[]).join(" → ")||"—"}
💎 Qualidade: ${(orders.qualidade||[]).join(" → ")||"—"}

${mt.capacity_note||"O monitor aprende com uso real; cotas oficiais continuam sendo definidas por cada provedor."}</div>`},
 appearance(){return `<h2>🎨 Aparência</h2><p class="muted">PC: Clássico ou Clean. Celular/Android: Pro ou Clean. O ícone oficial é fixo.</p><button class="btn primary" id="openAppearanceInside">Abrir temas</button>`},
 about(){return `<div class="about-page"><h2>ⓘ Sobre o LOGOS MASTER X • DNA K7</h2><h1>Da Palavra ao Púlpito. Da inspiração à preparação.</h1><p>Tudo começou com uma antiga fita K7: uma mensagem bíblica preservada, digitalizada e, anos depois, estudada em sua estrutura, progressão, transições, aplicações e crescimento de intensidade. Dessa investigação nasceu o nome <b>DNA K7</b>.</p><h3>O propósito</h3><p>O LOGOS MASTER X foi criado como ambiente de preparação bíblica e homilética para pregadores, professores e estudantes da Bíblia. Ele auxilia a pesquisar, organizar, estruturar, desenvolver e revisar materiais.</p><blockquote>“A minha palavra e a minha pregação não consistiram em palavras persuasivas de sabedoria humana, mas em demonstração do Espírito e de poder.” — 1 Coríntios 2:4</blockquote><div class="about-dual"><div><h3>🟢 O LOGOS ajuda a</h3><p>Estudar • organizar • estruturar • desenvolver • revisar • preparar para o púlpito.</p></div><div><h3>🔴 O LOGOS não substitui</h3><p>Oração • consagração • leitura bíblica • comunhão com Deus • discernimento espiritual • dependência do Espírito Santo.</p></div></div><h3>O machado e o sopro</h3><p>Eclesiastes 10:10 lembra a sabedoria de afiar o ferro. E Ezequiel 37 mostra que uma estrutura completa ainda precisava do sopro de Deus. Esta é a filosofia do projeto: <b>o LOGOS pode ajudar a organizar os ossos. Somente Deus pode soprar vida sobre eles.</b></p><div class="about-final">LOGOS MASTER X<br><small>DNA K7 • Bíblia • Estudo • Pregação</small></div></div>`},
 custompages(){const a=Store.get('customPages',[]);return `<h2>➕ Minhas páginas</h2><p class="muted">Crie páginas locais para notas, séries, roteiros ou recursos próprios.</p><div class="two"><input id="customPageTitle" placeholder="Nome da página"><input id="customPageIcon" placeholder="Ícone, ex.: ⭐" value="⭐"></div><textarea id="customPageContent" rows="8" placeholder="Conteúdo da página..."></textarea><button class="btn primary" id="customPageSave">➕ Criar página</button><div class="list">${a.map((x,i)=>`<div class="item"><b>${escapeHtml(x.icon||'⭐')} ${escapeHtml(x.title)}</b><p>${escapeHtml(x.content||'')}</p><button class="btn danger" data-page-delete="${i}">Excluir</button></div>`).join('')||'<p class="muted">Nenhuma página criada.</p>'}</div>`},
 settings(){const p=App.health?.providers||{},m=App.health?.models||{};return `<h2>⚙️ Configurações</h2>
<label>URL da API</label><input id="api" value="${escapeHtml(App.api)}" placeholder="https://seu-backend.onrender.com">
<div class="row"><button class="btn primary" id="apiSave">Salvar/Testar</button><button class="btn secondary" id="apiOff">Usar somente local</button><button class="btn secondary" data-go="aihub">Abrir AI HUB</button></div>
<section class="logos-maintenance-card"><h3>🛠️ Recuperação e Reinício</h3><p class="muted">Use se alguma geração ficar presa, os botões pararem de responder ou o Studio permanecer em processamento. Seus projetos, Bíblia X, perfis DNA K7 e preferências são preservados.</p><div class="row"><button class="btn primary" id="safeRestartBtn">↻ Reiniciar LOGOS</button><button class="btn secondary" id="studioResetBtn">🧬 Resetar Studio X</button><button class="btn secondary" id="cacheRepairBtn">🧹 Corrigir cache</button></div><div class="output" id="maintenanceOut">Sistema de recuperação preventiva V132 pronto.</div></section>
<div class="output">Modo: ${App.server?"ONLINE/API":"LOCAL/OFFLINE"}
Versão: ${App.health?.version||"—"}
Prompt Engine: ${App.health?.prompt_engine||"—"}
Think Engine: ${App.health?.think_engine||"—"}
DNA K7: ${App.health?.dna_k7||"—"}

${Object.entries(p).map(([k,v])=>`${v?"🟢":"⚪"} ${k}: ${m[k]||"—"}`).join("\\n")}

As chaves secretas ficam somente no servidor.</div>`}
};

let topViewStack=[];
function isTopToggleButton(el){return !!el?.closest?.(".classic-top");}
function toggleTopView(target){
  if(!target)return;
  if(App.view===target && topViewStack.length){
    const back=topViewStack.pop()||"dashboard";
    render(back);
    return;
  }
  if(App.view!==target){topViewStack.push(App.view||"dashboard");}
  render(target);
}
function toggleAppearancePanel(){
  const existing=$("#appearanceBackdrop");
  if(existing){existing.remove();return;}
  openAppearance();
}


function closeMobileNav(){
  document.body.classList.remove("mobile-nav-open");
  $("#mobileNavBackdrop")?.remove();
}
function toggleMobileNav(){
  if(document.body.classList.contains("mobile-nav-open")){closeMobileNav();return;}
  document.body.classList.add("mobile-nav-open");
  if(!$("#mobileNavBackdrop")){
    const d=document.createElement("div");
    d.id="mobileNavBackdrop";
    d.className="mobile-nav-backdrop";
    d.addEventListener("click",closeMobileNav);
    document.body.appendChild(d);
  }
}
function installMobileNav(){
  const top=document.querySelector(".top");
  if(top&&!$("#mobileNavToggle")){
    const b=document.createElement("button");
    b.id="mobileNavToggle";
    b.className="mobile-nav-toggle";
    b.setAttribute("aria-label","Abrir menu");
    b.innerHTML='<span>☰</span><small>Menu</small>';
    b.addEventListener("click",toggleMobileNav);
    top.insertBefore(b,top.firstChild);
  }
  if(top&&!$("#mobileHomeBtn")){
    const h=document.createElement("button");
    h.id="mobileHomeBtn";
    h.className="mobile-home-button";
    h.setAttribute("aria-label","Ir para a Home");
    h.innerHTML='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3.5 10.5 12 3.8l8.5 6.7"/><path d="M5.8 9.5V20h12.4V9.5"/><path d="M9.4 20v-6.2h5.2V20"/></svg><small>Home</small>';
    h.addEventListener("click",e=>{e.preventDefault();goHome();});
    top.appendChild(h);
  }
  document.querySelectorAll(".nav button[data-view]").forEach(b=>b.addEventListener("click",()=>{if(innerWidth<=760)closeMobileNav();}));
  window.addEventListener("resize",()=>{if(innerWidth>760)closeMobileNav();});
}

let navigationHistoryReady=false;
function setupNavigationHistory(){
 if(navigationHistoryReady)return;
 try{history.replaceState({...((history.state&&typeof history.state==="object")?history.state:{}),logosView:"dashboard",logosBase:true},"",location.href);history.pushState({logosView:"dashboard",logosGuard:true},"",location.href);navigationHistoryReady=true;window.addEventListener("popstate",handleAppBack);}catch(e){console.warn("Navegação protegida indisponível",e)}
}
function navigateView(view){
 if(!view)return;if(view==="appearance"){openAppearance();return;}if(view==="updates"){openUpdateCenter();return;}if(view==="dashboard"){goHome();return;}
 if(navigationHistoryReady){const st={logosView:view,logosInternal:true};try{if(App.view==="dashboard")history.pushState(st,"",location.href);else history.replaceState(st,"",location.href);}catch{}}
 render(view);if(innerWidth<=760)closeMobileNav();
}
function goHome(){
  closeMobileNav();
  topViewStack=[];
  render("dashboard");
  try{window.scrollTo({top:0,left:0,behavior:"auto"});}catch{}
  if(navigationHistoryReady){
    try{history.replaceState({logosView:"dashboard",logosGuard:true},"",location.href);}catch{}
  }
}
function askExitApp(){actionModal({icon:"↩",title:"Deseja sair?",message:"Você quer sair do LOGOS MASTER X?",actions:[{label:"Sair",kind:"danger",run:()=>{try{history.go(-2)}catch{}setTimeout(()=>{try{window.close()}catch{}},350)}},{label:"Continuar no LOGOS",kind:"primary"}]});}
function handleAppBack(e){const st=e.state||{};closeMobileNav();if(st.logosInternal){render(st.logosView||"dashboard");return;}if(st.logosGuard){render("dashboard");return;}if(st.logosBase){render("dashboard");try{history.pushState({logosView:"dashboard",logosGuard:true},"",location.href)}catch{}setTimeout(askExitApp,0);}}


const GEN_VISUALS=[{id:"circle-dna",name:"Círculo DNA",icon:"◎"},{id:"k7-icon",name:"K7 Premium",icon:"▣"}];
function generationVisualMode(){const m=Store.get("generationVisualMode","cinematic");return ["cinematic","circle-dna","k7-icon"].includes(m)?m:"cinematic"}
function visualMarkup(progress=0,status="running"){const p=Math.max(0,Math.min(100,Number(progress)||0)),m=generationVisualMode(),done=status==="done"||p>=100,n=done?100:p,t=done?"MENSAGEM PRONTA":"GERANDO";if(m==="circle-dna")return `<div class="g3 circle"><div class="orb"><i></i><i></i><i></i><b>🧬</b><em></em></div><div class="g3stat"><strong>${n}%</strong><span>${t}</span></div><div class="g3bar"><i style="width:${n}%"></i></div></div>`;if(m==="k7-icon")return `<div class="g3 tape"><div class="tstage"><div class="tflash"></div><div class="tbody"><small>DNA K7</small><div class="reels"><i></i><i></i></div><span>HIGH QUALITY</span></div></div><div class="g3stat"><strong>${n}%</strong><span>${t}</span></div><div class="g3bar"><i style="width:${n}%"></i></div></div>`;return `<div class="g3 hybrid"><div class="href"><img src="/static/gen-cinematic-reference.png?v=hybrid3" alt="DNA K7 Bíblia"><i class="sweep"></i></div><div class="hstatus"><span>${done?"FINALIZADO":"GERANDO SUA MENSAGEM..."}</span><div><div class="g3bar"><i style="width:${n}%"></i></div><strong>${n}%</strong></div></div></div>`}
function renderSharedGenerationVisual(el,progress=0,status="running"){if(!el)return;el.innerHTML=visualMarkup(progress,status);el.dataset.progress=String(progress);el.dataset.status=status}
function generationGalleryMarkup(){const m=generationVisualMode();return `<div class="gen-gallery-backdrop" id="genGalleryBackdrop"><div class="gen-gallery"><header><div><b>🎬 Escolha o visual da geração</b><small>Os mesmos 3 visuais no Studio X e Gerador Rápido.</small></div><button data-gen-gallery-close>✕</button></header><div class="g3choices"><button class="${m==="cinematic"?"active":""}" data-gen-gallery-choice="cinematic"><b>Híbrido DNA → K7 → Bíblia</b><small>PADRÃO • flashes • cores do tema</small></button><button class="${m==="circle-dna"?"active":""}" data-gen-gallery-choice="circle-dna"><b>Círculo DNA</b><small>Órbitas animadas</small></button><button class="${m==="k7-icon"?"active":""}" data-gen-gallery-choice="k7-icon"><b>K7 Premium</b><small>Bobinas animadas</small></button></div></div></div>`}
function openGenerationGallery(){document.querySelector("#genGalleryBackdrop")?.remove();document.body.insertAdjacentHTML("beforeend",generationGalleryMarkup());const bg=$("#genGalleryBackdrop"),close=()=>bg?.remove();$("[data-gen-gallery-close]")?.addEventListener("click",close);bg?.addEventListener("click",e=>{if(e.target===bg)close()});$$("[data-gen-gallery-choice]").forEach(x=>x.addEventListener("click",()=>{Store.set("generationVisualMode",x.dataset.genGalleryChoice);close();bindGenerationVisualControls();["quickGenVisual","studioGenVisual","studioResultVisual"].forEach(id=>{const el=$("#"+id);if(el&&!el.hidden)renderSharedGenerationVisual(el,Number(el.dataset.progress)||0,el.dataset.status||"running")})}))}
function bindGenerationVisualControls(){const m=generationVisualMode(),L={cinematic:"Híbrido DNA → K7 → Bíblia","circle-dna":"Círculo DNA","k7-icon":"K7 Premium"};$$("[data-gen-visual]").forEach(x=>{x.classList.toggle("active",x.dataset.genVisual===m)});$$("[data-open-gen-gallery]").forEach(x=>{x.classList.toggle("active",m!=="cinematic");x.innerHTML=`◉ ${L[m]} <small>${m==="cinematic"?"Padrão":"Alterar"}</small>`;x.onclick=openGenerationGallery})}
function startSharedGenerationVisual(el,start=5){let p=start;renderSharedGenerationVisual(el,p,'running');clearInterval(el.__genTimer);el.__genTimer=setInterval(()=>{if(p>=92){clearInterval(el.__genTimer);return}p=Math.min(92,p+Math.max(1,Math.round((94-p)*.08)));renderSharedGenerationVisual(el,p,'running')},650)}
function finishSharedGenerationVisual(el){if(!el)return;clearInterval(el.__genTimer);renderSharedGenerationVisual(el,100,'done')}
function errorSharedGenerationVisual(el){if(!el)return;clearInterval(el.__genTimer);renderSharedGenerationVisual(el,Number(el.dataset.progress)||0,'error')}
function showK7IntensityInfo(){actionModal({icon:'ⓘ',title:'Intensidade DNA K7',message:'A intensidade não mede a qualidade da mensagem. Ela controla quanto da progressão, ritmo, ênfase, clímax, aplicação e apelo do DNA K7 será aplicado.\n\n1–2: suave • 3–4: moderada • 5–6: equilibrada • 7–8: forte • 9–10: máxima. A fidelidade bíblica permanece prioritária em todos os níveis.',actions:[{label:'Entendi',kind:'primary'}]})}

async function render(view){
 App.view=view; $$(".nav button").forEach(b=>b.classList.toggle("active",b.dataset.view===view)); const workspace=$("#workspace");if(workspace)workspace.dataset.view=view; workspace.innerHTML=views[view]?views[view]():"<h2>Módulo</h2>";
 $$("[data-go]").forEach(b=>b.onclick=()=>navigateView(b.dataset.go));
 if(view==="dashboard"){$("#installPwaHome")?.addEventListener("click",installPwa);/* fluxo visual oficial: HOTFIX 4.3.14 */} $$(".top-nav [data-go]").forEach(b=>b.classList.toggle("active",b.dataset.go===view)); if($("#installPwaSide"))$("#installPwaSide").onclick=installPwa;
 if(view==="appearance"){$("#openAppearanceInside")?.addEventListener("click",openAppearance);}
 if(view==="custompages"){$("#customPageSave")?.addEventListener("click",()=>{const title=$("#customPageTitle").value.trim();if(!title)return;const a=Store.get("customPages",[]);a.push({title,icon:$("#customPageIcon").value||"⭐",content:$("#customPageContent").value});Store.set("customPages",a);render("custompages")});$$('[data-page-delete]').forEach(b=>b.onclick=()=>{const a=Store.get("customPages",[]);a.splice(Number(b.dataset.pageDelete),1);Store.set("customPages",a);render("custompages")});}
 if(view==="quick"){
   let tab="message", mode=Store.get("quickGenMode",App.aiMode||"rapido");
   const setTab=t=>{
     tab=t;
     $$('[data-quick-tab]').forEach(b=>b.classList.toggle('active',b.dataset.quickTab===t));
     if($('#quickMessagePane'))$('#quickMessagePane').hidden=t!=="message";
     if($('#quickTipsPane'))$('#quickTipsPane').hidden=t!=="tips";
     const full=$('#quickRunFull'), outline=$('#quickRunOutline');
     // Os cards de geração permanecem completos em ambas as abas;
     // a aba Dica Rápida continua alterando somente a função executada por runQuick().
     if(full)full.hidden=false;
     if(outline)outline.hidden=false;
   };
   $$('[data-quick-tab]').forEach(b=>b.onclick=()=>setTab(b.dataset.quickTab));
   const k7Color=v=>{v=Math.max(1,Math.min(10,Number(v)||1));const hue=Math.round((v-1)/9*120);return `hsl(${hue} 92% 52%)`};
   const updateQuickSummary=()=>{
     const value=(sel,def='—')=>$(sel)?.value?.trim()||def;
     const raw=value('#fText','—'); const first=(raw.split(/\n/)[0]||raw).slice(0,48);
     const theme=(raw.includes('—')?raw.split('—').slice(1).join('—').trim():'')||first;
     const av=value('#fAudience','Igreja local'); const cv=value('#fCult','Avivamento');
     const audience=av==='__custom__'?value('#fAudienceCustom','Público personalizado'):av;
     const cult=cv==='__custom__'?value('#fCultCustom','Ocasião personalizada'):cv;
     const k7=Number($('#fK7Range')?.value||$('#fK7')?.value||10); const c=k7Color(k7); const pct=(k7/10)*100;
     if($('#qSumText'))$('#qSumText').textContent=first;if($('#qSumTheme'))$('#qSumTheme').textContent=theme||'—';
     if($('#qSumObjective'))$('#qSumObjective').textContent=value('#fObjective','—').slice(0,56);if($('#qSumAudience'))$('#qSumAudience').textContent=audience;
     if($('#qSumCult'))$('#qSumCult').textContent=cult;if($('#qSumDuration'))$('#qSumDuration').textContent=value('#fDuration','40')+' minutos';
     if($('#qSumK7'))$('#qSumK7').textContent=`${k7} / 10`;if($('#qSumStyle'))$('#qSumStyle').textContent=mode.charAt(0).toUpperCase()+mode.slice(1);
     const meter=$('#quickK7Meter'),bar=$('#qSumK7Bar');
     if(meter){meter.dataset.level=String(k7);meter.style.setProperty('--k7-color',c);meter.style.setProperty('--k7-pct',pct+'%');const s=meter.querySelector('span');if(s)s.textContent=`${k7} / 10`}
     const range=$('#fK7Range');if(range){range.style.setProperty('--k7-color',c);range.style.setProperty('--k7-pct',pct+'%');range.setAttribute('aria-valuetext',`${k7} de 10`)};const kval=$('#quickK7Value');if(kval){kval.textContent=`${k7} / 10`;kval.style.color=c}
     if(bar){bar.style.setProperty('--k7-color',c);bar.style.setProperty('--k7-pct',pct+'%')}
   };
   const syncK7Controls=()=>{
     const sel=$('#fK7'), range=$('#fK7Range');
     if(!sel||!range)return;
     const fromSelect=()=>{range.value=sel.value;updateQuickSummary()};
     const fromRange=()=>{sel.value=String(Math.round(Number(range.value)||1));updateQuickSummary()};
     sel.addEventListener('change',fromSelect);
     sel.addEventListener('input',fromSelect);
     range.addEventListener('input',fromRange);
     range.addEventListener('change',fromRange);
     range.value=sel.value;
   };
   const bindQuickSummary=()=>{['#fText','#fObjective','#fDuration','#fCult','#fCultCustom','#fAudience','#fAudienceCustom'].forEach(sel=>{$(sel)?.addEventListener('input',updateQuickSummary);$(sel)?.addEventListener('change',updateQuickSummary)});syncK7Controls();updateQuickSummary();};
   $$('[data-quick-mode]').forEach(b=>b.onclick=()=>{mode=b.dataset.quickMode;Store.set("quickGenMode",mode);$$('[data-quick-mode]').forEach(x=>x.classList.toggle('active',x===b));updateQuickSummary();});
   $('#quickEditSummary')?.addEventListener('click',()=>{$('#fText')?.focus();$('#fText')?.scrollIntoView({behavior:'smooth',block:'center'})});
   bindQuickSummary();
   const toggleCustom=(sel,input)=>{const s=$(sel),i=$(input);if(!s||!i)return;const sync=()=>i.style.display=s.value==='__custom__'?'block':'none';s.onchange=sync;sync()};
   toggleCustom('#fCult','#fCultCustom');toggleCustom('#fAudience','#fAudienceCustom');

   const runQuick=async(kind='full')=>{
     const out=$('#quickOut');
     if(!out)return;
     if(tab==='tips'){
       const q=$('#quickTipText').value.trim();if(!q){out.textContent='Digite um tema, pergunta ou passagem.';return}
       const kinds=$$('[data-tip-kind]:checked').map(x=>x.value);
       out.textContent='Gerando dica rápida...';
       const d={text:q,objective:`Crie uma resposta rápida com: ${kinds.join(', ')}. Seja bíblico, claro e prático.`,duration:10,cult:'Preparação rápida',intensity:3,audience:'Igreja local',notes:'Modo Dica Rápida. Não transforme automaticamente em sermão completo.'};
       const oldMode=App.aiMode;App.aiMode=mode;
       try{
         const r=await runCommand('ESTUDAR',d);App.lastStudioText=r.text;out.dataset.rawText=r.text||'';out.innerHTML=renderGeneratedMessage(r.text,{command:'ESTUDAR • DICA RÁPIDA',intensity:Number(d.intensity||3),provider:r.provider||r.engine||'',seconds:r.seconds,quality:r.quality,qualityDetail:r.quality_detail,duration:Number(d.duration)||10});
         Store.push('history',{id:Date.now(),cmd:'DICA RÁPIDA',input:d,result:r.text,created:new Date().toISOString()});
       }finally{App.aiMode=oldMode}
       return;
     }
     const d=fd();if(!d.text){out.textContent='Digite o texto bíblico ou tema.';return}
     const cmd=kind==='outline'?'ESBOÇO':($('#cmd').value||'SERMÃO');
     out.textContent=kind==='outline'?'Gerando somente o esboço...':'Gerando mensagem completa...';
     const qv=$('#quickGenVisual');if(qv){qv.hidden=false;startSharedGenerationVisual(qv,8);qv.scrollIntoView({behavior:'smooth',block:'center'})}
     const oldMode=App.aiMode;App.aiMode=mode;const started=performance.now();
     try{
       const r=await runCommand(cmd,d);
       const secs=Math.round((performance.now()-started)/1000);saveModeTime(mode,secs);
       App.lastStudioText=r.text;
       out.dataset.rawText=r.text||'';
       out.innerHTML=renderGeneratedMessage(r.text,{
         command:kind==='outline'?'ESBOÇO • GERADOR RÁPIDO':`${cmd} • GERADOR RÁPIDO`,
         intensity:Number(d.intensity||10),
         provider:r.provider||r.engine||'',
         seconds:r.seconds!=null?r.seconds:secs,
         quality:r.quality,
         qualityDetail:r.quality_detail,
         duration:Number(d.duration)||40
       });
       if(qv)finishSharedGenerationVisual(qv);
       Store.push('history',{id:Date.now(),cmd,input:d,result:r.text,provider:r.provider||'',quality:r.quality||null,created:new Date().toISOString()});
     }catch(e){if(qv)errorSharedGenerationVisual(qv);throw e}finally{App.aiMode=oldMode}
   };
   $('#quickRunFull').onclick=()=>runQuick('full');
   $('#quickRunOutline').onclick=()=>runQuick('outline');
   bindGenerationVisualControls();
   $('#k7Info')?.addEventListener('click',showK7IntensityInfo);
   setTab(tab);
   $('#quickCopy').onclick=()=>{const o=$('#quickOut');copy(o?.dataset?.rawText||o?.textContent||'')};
   $('#quickEditor').onclick=()=>{const o=$('#quickOut'),t=o?.dataset?.rawText||o?.textContent||'';Store.set('editor',{title:'Gerador Rápido',text:t});render('editor')};
   $('#quickLibrary').onclick=()=>{const o=$('#quickOut'),t=o?.dataset?.rawText||o?.textContent||'';if(!t||t==='Pronto.')return;saveMaterial('quick','Gerador Rápido',t,{mode});alert('Salvo na Biblioteca.')};
   $('#quickProject').onclick=()=>{const o=$('#quickOut'),t=o?.dataset?.rawText||o?.textContent||'';if(!t||t==='Pronto.')return;Store.push('projects',{name:'Gerador Rápido',result:t,created:new Date().toISOString()});alert('Projeto salvo.')};
 }
 if(view==="studio"){
   const profiles={k7:{code:"K7-003",name:"Clássico K7",icon:"🧬",score:91},pentecostal:{code:"K7-001",name:"Pentecostal",icon:"🔥",score:89},pastoral:{code:"K7-007",name:"Pastoral Forte",icon:"💚",score:86},biblico:{code:"K7-002",name:"Bíblico Clássico",icon:"📖",score:90},textual:{code:"K7-004",name:"Textual",icon:"🎯",score:88},tematica:{code:"K7-005",name:"Temática",icon:"💡",score:87},doutrinaria:{code:"K7-006",name:"Doutrinária",icon:"📚",score:92},exegetica:{code:"K7-008",name:"Exegética",icon:"🔎",score:94}};const savedScores=Store.get("studioDNAScores",{});Object.keys(profiles).forEach(id=>{if(savedScores[id]!=null)profiles[id].score=Math.max(0,Math.min(100,Number(savedScores[id])||0))});
   let selected=Store.get("studioDNASelection",["k7"]);if(!Array.isArray(selected)||!selected.length)selected=["k7"];
   let weights=Object.assign({},Store.get("studioDNAWeights",{}));
   const defaultWeights=()=>selected.length===1?[100]:selected.length===2?[60,40]:[50,30,20];
   const normalizeWeights=()=>{const d=defaultWeights();let sum=0;selected.forEach((id,i)=>{let v=Number(weights[id]);if(!Number.isFinite(v))v=d[i]||0;weights[id]=Math.max(0,Math.min(100,v));sum+=weights[id]});if(sum!==100){selected.forEach((id,i)=>weights[id]=d[i]||0)};Object.keys(weights).forEach(id=>{if(!selected.includes(id))delete weights[id]})};normalizeWeights();
   const charDefaults={fidelidade:90,exposicao:85,aplicacao:80,progressao:90,climax:95,apelo:85};let chars=Object.assign({},charDefaults,Store.get("studioDNACharacteristics",{}));
   const charNames={fidelidade:"Fidelidade Bíblica",exposicao:"Exposição",aplicacao:"Aplicação",progressao:"Progressão",climax:"Clímax",apelo:"Apelo"};
   const saveState=()=>{Store.set("studioDNASelection",selected);Store.set("studioDNAWeights",weights);Store.set("studioDNACharacteristics",chars)};
   const paintRange=(el)=>{if(el){const v=Math.max(0,Math.min(100,Number(el.value)||0));el.style.setProperty("--range-fill",`${v}%`);el.style.setProperty("--range-color",logosPercentColor(v));}};
   const paintAllRanges=()=>{$$('[data-mix-range],[data-char-range],[data-profile-score]').forEach(paintRange)};
   const rebalance=(changedId,newValue)=>{newValue=Math.max(0,Math.min(100,Number(newValue)||0));const others=selected.filter(id=>id!==changedId);if(!others.length){weights[changedId]=100;return}const remain=100-newValue;const oldTotal=others.reduce((s,id)=>s+(weights[id]||0),0);weights[changedId]=newValue;if(oldTotal<=0){const each=Math.floor(remain/others.length);let used=0;others.forEach((id,i)=>{weights[id]=i===others.length-1?remain-used:each;used+=weights[id]})}else{let used=0;others.forEach((id,i)=>{let v=i===others.length-1?remain-used:Math.round(remain*(weights[id]||0)/oldTotal);v=Math.max(0,Math.min(remain-used,v));weights[id]=v;used+=v})}};
   const renderRadar=()=>{const svg=$("#dnaRadar");if(!svg)return;const radarScore=Math.round(Object.values(chars).reduce((a,b)=>a+Number(b),0)/Math.max(1,Object.keys(chars).length));svg.style.setProperty('--dna-color',logosPercentColor(radarScore));const keys=["fidelidade","exposicao","aplicacao","progressao","climax","apelo"],labels=["Fidelidade Bíblica","Exposição","Aplicação","Progressão","Clímax","Apelo"],cx=180,cy=145,r=104,pts=(factor)=>keys.map((k,i)=>{const a=-Math.PI/2+i*Math.PI*2/6,rr=r*factor*(chars[k]/100);return [cx+Math.cos(a)*rr,cy+Math.sin(a)*rr]}),poly=a=>a.map(p=>p.map(n=>n.toFixed(1)).join(',')).join(' ');let html='';for(let ring=1;ring<=5;ring++){const rr=r*ring/5;const q=keys.map((_,i)=>{const a=-Math.PI/2+i*Math.PI*2/6;return [cx+Math.cos(a)*rr,cy+Math.sin(a)*rr]});html+=`<polygon points="${poly(q)}" class="radar-grid"/>`}keys.forEach((_,i)=>{const a=-Math.PI/2+i*Math.PI*2/6,x=cx+Math.cos(a)*r,y=cy+Math.sin(a)*r,lx=cx+Math.cos(a)*(r+25),ly=cy+Math.sin(a)*(r+25);html+=`<line x1="${cx}" y1="${cy}" x2="${x}" y2="${y}" class="radar-axis"/><text x="${lx}" y="${ly}" class="radar-label" text-anchor="middle">${labels[i]}</text>`});const avg=keys.map((_,i)=>{const a=-Math.PI/2+i*Math.PI*2/6,rr=r*.72;return [cx+Math.cos(a)*rr,cy+Math.sin(a)*rr]});const p=pts(1);html+=`<polygon points="${poly(avg)}" class="radar-average"/><polygon points="${poly(p)}" class="radar-profile"/>`;p.forEach(([x,y],i)=>html+=`<circle cx="${x}" cy="${y}" r="4" class="radar-dot" style="--dot-color:${logosPercentColor(chars[keys[i]])}"/>`);svg.innerHTML=html};
   const syncSummary=()=>{const score=Math.round(Object.values(chars).reduce((a,b)=>a+Number(b),0)/Object.keys(charDefaults).length);$("#dnaScore")&&($("#dnaScore").textContent=score);$("#dnaBottomScore")&&($("#dnaBottomScore").textContent=score+"/100");Object.keys(charDefaults).forEach(k=>{const bar=document.querySelector(`[data-summary-bar="${k}"]`),val=document.querySelector(`[data-summary-value="${k}"]`);if(bar){bar.style.width=chars[k]+"%";bar.style.background=logosPercentColor(chars[k]);bar.style.boxShadow=`0 0 8px ${logosPercentColor(chars[k])}`}if(val){val.textContent=chars[k];val.style.color=logosPercentColor(chars[k])}});const origin=$("#dnaOriginList");if(origin)origin.innerHTML=selected.map((id,i)=>`<p><b>${i===0?'Perfil principal':'Perfil complementar'}:</b> ${profiles[id]?.code||''} ${profiles[id]?.name||id} (${weights[id]||0}%)</p>`).join('')+`<small>Última atualização: ${new Date().toLocaleString()}</small>`;$("#dnaSelectedCount")&&($("#dnaSelectedCount").textContent=selected.length);$("#dnaMixCount")&&($("#dnaMixCount").textContent=selected.length);renderRadar()};
   const syncCards=()=>{$$('[data-dna-card]').forEach(c=>{const on=selected.includes(c.dataset.dnaCard);c.classList.toggle('selected',on);const b=c.querySelector('.dna-select-btn');if(b)b.textContent=on?'✓ Selecionado ✓':'Selecionar'});};
   const rerender=()=>{saveState();render('studio')};
   $$('[data-dna-select]').forEach(b=>b.onclick=e=>{e.stopPropagation();const id=b.dataset.dnaSelect;if(selected.includes(id)){if(selected.length===1)return actionModal({icon:"🧬",title:"Mantenha um DNA",message:"É necessário manter pelo menos um perfil selecionado.",actions:[{label:"Entendi",kind:"primary"}]});selected=selected.filter(x=>x!==id)}else{if(selected.length>=3)return actionModal({icon:"🧬",title:"Limite de 3 perfis",message:"Remova um perfil antes de adicionar outro.",actions:[{label:"Entendi",kind:"primary"}]});selected.push(id)}weights={};normalizeWeights();rerender()});
   $$('[data-dna-card]').forEach(c=>c.onclick=e=>{if(e.target.closest('button'))return;c.querySelector('.dna-select-btn')?.click()});
   const saveProfileScore=(id,value)=>{const x=profiles[id];if(!x)return;const v=Math.max(0,Math.min(100,Number(value)||0));x.score=v;const saved=Store.get("studioDNAScores",{});saved[id]=v;Store.set("studioDNAScores",saved);const out=document.querySelector(`[data-profile-score-value="${id}"]`);if(out)out.textContent=v+"%";const range=document.querySelector(`[data-profile-score="${id}"]`);if(range){range.value=v;paintRange(range);const card=range.closest('.dna-profile-card');const viz=card?.querySelector('.dna-score-viz');if(viz){const c=logosPercentColor(v);viz.style.color=c;viz.style.setProperty('--score-color',c);viz.style.setProperty('--score-pct',v+'%')}}};
   $$('[data-profile-score]').forEach(r=>{r.oninput=()=>saveProfileScore(r.dataset.profileScore,r.value);r.onchange=()=>render('studio')});
   $$('[data-graph-mode]').forEach(b=>b.onclick=e=>{e.stopPropagation();Store.set("studioDNAGraphMode",b.dataset.graphMode);render('studio')});
   $$('[data-score-step]').forEach(b=>b.onclick=e=>{e.stopPropagation();const id=b.dataset.scoreId,range=document.querySelector(`[data-profile-score="${id}"]`);if(range)saveProfileScore(id,Number(range.value)+Number(b.dataset.scoreStep||0))});
   $$('[data-mix-range]').forEach(r=>r.oninput=()=>{rebalance(r.dataset.mixRange,r.value);selected.forEach(id=>{const input=document.querySelector(`[data-mix-range="${id}"]`),out=document.querySelector(`[data-mix-output="${id}"]`);if(input){input.value=weights[id];paintRange(input)}if(out)out.textContent=weights[id]+"%"});$("#dnaMixTotal")&&($("#dnaMixTotal").textContent="100%");saveState();syncSummary()});
   $$('[data-mix-remove]').forEach(b=>b.onclick=()=>{if(selected.length===1)return;selected=selected.filter(id=>id!==b.dataset.mixRemove);weights={};normalizeWeights();rerender()});
   $("#dnaAddProfile")?.addEventListener('click',()=>{if(selected.length>=3)return actionModal({icon:"🧬",title:"Mistura completa",message:"Você já combinou 3 perfis, que é o limite desta etapa.",actions:[{label:"Fechar",kind:"primary"}]});const next=Object.keys(profiles).find(id=>!selected.includes(id));if(next){selected.push(next);weights={};normalizeWeights();rerender()}});
   $$('[data-char-range]').forEach(r=>r.oninput=()=>{const k=r.dataset.charRange;chars[k]=Number(r.value);const o=document.querySelector(`[data-char-output="${k}"]`);if(o)o.textContent=r.value+'%';paintRange(r);saveState();syncSummary()});
   $("#dnaResetChars")?.addEventListener('click',()=>{chars={...charDefaults};Store.set("studioDNACharacteristics",chars);rerender()});
   const filterCards=()=>{const q=($("#dnaSearch")?.value||'').toLowerCase().trim(),active=document.querySelector('[data-dna-filter].active')?.dataset.dnaFilter||'all';let count=0;$$('[data-dna-card]').forEach(c=>{const hit=(!q||c.dataset.name.includes(q))&&(active==='all'||c.dataset.name.includes(active.toLowerCase()));c.style.display=hit?'':'none';if(hit)count++})};$("#dnaSearch")?.addEventListener('input',filterCards);$$('[data-dna-filter]').forEach(b=>b.onclick=()=>{$$('[data-dna-filter]').forEach(x=>x.classList.remove('active'));b.classList.add('active');filterCards()});$("#dnaFilterToggle")?.addEventListener('click',()=>$("#dnaFilterRow")?.classList.toggle('show'));$("#dnaCreate")?.addEventListener('click',()=>actionModal({icon:"＋",title:"Criar novo DNA",message:"O construtor de DNA personalizado será ligado à área Meus Perfis. Nesta etapa, os perfis prontos já podem ser combinados e ajustados.",actions:[{label:"Entendi",kind:"primary"}]}));
   $("#dnaNext")?.addEventListener('click',()=>{saveState();Store.set("studioStep",2);render("studio")});
   if(Number(Store.get("studioStep",1))===2){const paint2=el=>{if(el)el.style.setProperty("--range-fill",`${((Number(el.value)-Number(el.min||0))/(Number(el.max||100)-Number(el.min||0)))*100}%`)};$$(`[data-dna2-char]`).forEach(r=>r.oninput=()=>{chars[r.dataset.dna2Char]=Number(r.value);Store.set("studioDNACharacteristics",chars);document.querySelector(`[data-dna2-char-out="${r.dataset.dna2Char}"]`).textContent=r.value+"%";paint2(r);const score=Math.round(Object.values(chars).reduce((a,b)=>a+Number(b),0)/6);$("#dna2Score").textContent=score;$("#dnaScore").textContent=score;const bar=document.querySelector(`[data-summary-bar="${r.dataset.dna2Char}"]`),val=document.querySelector(`[data-summary-value="${r.dataset.dna2Char}"]`);if(bar)bar.style.width=r.value+"%";if(val)val.textContent=r.value});$$(`[data-dna2-comm]`).forEach(r=>r.oninput=()=>{const c=Object.assign({},Store.get("studioDNACommunication",{}));c[r.dataset.dna2Comm]=Number(r.value);Store.set("studioDNACommunication",c);document.querySelector(`[data-dna2-comm-out="${r.dataset.dna2Comm}"]`).textContent=r.value+"%";paint2(r)});$("#dna2Intensity")?.addEventListener("input",e=>{Store.set("studioDNAIntensity",Number(e.target.value));$("#dna2IntensityOut").textContent=e.target.value+"/5";$("#dna2ChangeIntensity").textContent=e.target.value+"/5";paint2(e.target)});$("#dna2Back")?.addEventListener("click",()=>{Store.set("studioStep",1);render("studio")});$("#dna2Reset")?.addEventListener("click",()=>{Store.set("studioDNACharacteristics",charDefaults);Store.set("studioDNACommunication",{linguagem:55,ritmo:60,emocao:65,ilustracoes:50,referencias:75});Store.set("studioDNAIntensity",3);render("studio")});$("#dna2Save")?.addEventListener("click",()=>actionModal({icon:"💾",title:"DNA personalizado salvo",message:"Seus ajustes foram preservados localmente e poderão ser reutilizados.",actions:[{label:"OK",kind:"primary"}]}));$("#dna2Next")?.addEventListener("click",()=>{Store.set("studioStep",3);render("studio")});$$(`[data-dna2-char],[data-dna2-comm],#dna2Intensity`).forEach(paint2)}
   if(Number(Store.get("studioStep",1))===3){
    const readCfg=()=>Object.assign({sourceMode:"passagem",text:"",theme:"",sermonType:"Expositiva",duration:40,occasion:"Culto de Ensino",audience:"Igreja local",objective:"",bibleVersion:"ARA",points:"4",focus:"Equilibrado",notes:""},Store.get("studioMessageConfig",{}));
    const saveCfg=(patch={})=>{const c=Object.assign(readCfg(),patch);Store.set("studioMessageConfig",c);return c};
    const sync=()=>{const c=readCfg();const title=$("#dna3SummaryTitle"),base=$("#dna3SummaryBase"),type=$("#dna3SummaryType"),dur=$("#dna3SummaryDuration"),occ=$("#dna3SummaryOccasion"),aud=$("#dna3SummaryAudience"),focus=$("#dna3SummaryFocus");if(title)title.textContent=c.theme||c.text||"Mensagem ainda sem título";if(base)base.textContent=c.text||"Não definida";if(type)type.textContent=c.sermonType;if(dur)dur.textContent=c.duration+" min";if(occ)occ.textContent=c.occasion;if(aud)aud.textContent=c.audience;if(focus)focus.textContent=c.focus};
    const bindValue=(id,key)=>{$(id)?.addEventListener("input",e=>{saveCfg({[key]:e.target.value});sync()});$(id)?.addEventListener("change",e=>{saveCfg({[key]:e.target.value});sync()})};
    bindValue("#dna3Text","text");bindValue("#dna3Theme","theme");bindValue("#dna3Objective","objective");bindValue("#dna3SermonType","sermonType");bindValue("#dna3BibleVersion","bibleVersion");bindValue("#dna3Points","points");bindValue("#dna3Occasion","occasion");bindValue("#dna3Audience","audience");bindValue("#dna3Notes","notes");
    $$(`[data-dna3-mode]`).forEach(b=>b.onclick=()=>{saveCfg({sourceMode:b.dataset.dna3Mode});$$(`[data-dna3-mode]`).forEach(x=>x.classList.toggle("active",x===b))});
    $$(`[data-dna3-focus]`).forEach(b=>b.onclick=()=>{saveCfg({focus:b.dataset.dna3Focus});$$(`[data-dna3-focus]`).forEach(x=>x.classList.toggle("active",x===b));sync()});
    $$(`[data-dna3-duration]`).forEach(b=>b.onclick=()=>{saveCfg({duration:Number(b.dataset.dna3Duration)});$$(`[data-dna3-duration]`).forEach(x=>x.classList.toggle("active",x===b));sync()});
    $("#dna3Back")?.addEventListener("click",()=>{Store.set("studioStep",2);render("studio")});
    $("#dna3Save")?.addEventListener("click",()=>actionModal({icon:"💾",title:"Configuração salva",message:"Texto, formato, duração, público e direcionamento foram preservados localmente.",actions:[{label:"OK",kind:"primary"}]}));
    $("#dna3Next")?.addEventListener("click",()=>{const c=readCfg();if(!String(c.text||c.theme).trim())return actionModal({icon:"📖",title:"Defina a base da mensagem",message:"Informe pelo menos uma passagem bíblica ou um tema antes de continuar.",actions:[{label:"OK",kind:"primary"}]});Store.set("studioStep",4);render("studio")});
    sync();
   }
   if(Number(Store.get("studioStep",1))===4){
    const cfg=Object.assign({duration:40,points:"4"},Store.get("studioMessageConfig",{}));
    const requested=cfg.points==='auto'?4:Math.max(3,Math.min(6,Number(cfg.points)||4));
    const defaults=["Abertura do texto e tensão principal","Contexto e verdade central","Desenvolvimento bíblico e argumento","Aplicação à vida e à igreja","Progressão para o clímax","Resposta, apelo e direção final"];
    const readStruct=()=>{const raw=Store.get("studioMessageStructure",null)||{};const st={title:raw.title||cfg.theme||cfg.text||"Estrutura da mensagem",bigIdea:raw.bigIdea||cfg.objective||`Expor ${cfg.text||cfg.theme||'a verdade bíblica'} com clareza, progressão e aplicação.`,intro:raw.intro!==false,context:raw.context!==false,applications:raw.applications!==false,climax:raw.climax!==false,appeal:raw.appeal!==false,prayer:raw.prayer!==false,points:Array.isArray(raw.points)?raw.points.slice(0,requested):[]};while(st.points.length<requested)st.points.push({title:defaults[st.points.length]||`Ponto ${st.points.length+1}`,note:"",weight:Math.round(100/requested)});return st};
    let st=readStruct();const save=()=>Store.set("studioMessageStructure",st);const refreshTimes=()=>{const total=st.points.reduce((a,p)=>a+(Number(p.weight)||0),0)||100;st.points.forEach((p,i)=>{const x=document.querySelector(`[data-dna4-min="${i}"]`);if(x)x.textContent=Math.max(2,Math.round((Number(cfg.duration)||40)*(Number(p.weight)||0)/total))})};
    $("#dna4Title")?.addEventListener("input",e=>{st.title=e.target.value;save()});$("#dna4BigIdea")?.addEventListener("input",e=>{st.bigIdea=e.target.value;save()});
    $$(`[data-dna4-title]`).forEach(el=>el.oninput=()=>{const i=Number(el.dataset.dna4Title);st.points[i].title=el.value;save();const map=document.querySelector(`[data-dna4-map="${i}"]`);if(map)map.textContent=el.value||`Ponto ${i+1}`});
    $$(`[data-dna4-note]`).forEach(el=>el.oninput=()=>{st.points[Number(el.dataset.dna4Note)].note=el.value;save()});
    $$(`[data-dna4-weight]`).forEach(el=>el.oninput=()=>{const i=Number(el.dataset.dna4Weight);st.points[i].weight=Number(el.value);save();const out=document.querySelector(`[data-dna4-weight-out="${i}"]`);if(out)out.textContent=el.value+"%";el.style.setProperty("--range-fill",Math.min(100,Number(el.value)*2)+"%");refreshTimes()});
    $$(`[data-dna4-toggle]`).forEach(b=>b.onclick=()=>{const k=b.dataset.dna4Toggle;st[k]=!st[k];save();b.classList.toggle("active",st[k]);const em=b.querySelector("em");if(em)em.textContent=st[k]?"ON":"OFF"});
    $("#dna4Back")?.addEventListener("click",()=>{Store.set("studioStep",3);render("studio")});
    $("#dna4Reset")?.addEventListener("click",()=>{Store.set("studioMessageStructure",{});render("studio")});
    $("#dna4Save")?.addEventListener("click",()=>{save();actionModal({icon:"💾",title:"Estrutura salva",message:"O esqueleto da mensagem e seus ajustes foram preservados localmente.",actions:[{label:"OK",kind:"primary"}]})});
    $("#dna4Next")?.addEventListener("click",()=>{save();Store.set("studioStep",5);render("studio")});
    $$(`[data-dna4-weight]`).forEach(el=>el.style.setProperty("--range-fill",Math.min(100,Number(el.value)*2)+"%"));refreshTimes();
   }
   if(Number(Store.get("studioStep",1))===5){
    const updateMode=(mode)=>{Store.set("studioGenerationMode",mode);$$(`[data-dna5-mode]`).forEach(b=>b.classList.toggle("active",b.dataset.dna5Mode===mode));const sum=$("#dna5ModeSummary"),sub=$("#dna5GenerateSub"),cfg=Object.assign({duration:40},Store.get("studioMessageConfig",{}));if(sum)sum.textContent=mode==="esboco"?"Somente esboço":"Mensagem completa";if(sub)sub.textContent=(mode==="esboco"?"Somente Esboço":"Mensagem Completa")+" • "+(Number(cfg.duration)||40)+" min"};
    $$(`[data-dna5-mode]`).forEach(b=>b.onclick=()=>updateMode(b.dataset.dna5Mode));
    $("#dna5Back")?.addEventListener("click",()=>{Store.set("studioStep",4);render("studio")});
    $("#dna5EditConfig")?.addEventListener("click",()=>{Store.set("studioStep",3);render("studio")});
    $("#dna5EditStructure")?.addEventListener("click",()=>{Store.set("studioStep",4);render("studio")});
    $("#dna5Save")?.addEventListener("click",()=>{Store.set("studioProjectSavedAt",new Date().toISOString());actionModal({icon:"💾",title:"Projeto salvo",message:"DNA, personalização, configuração e estrutura foram preservados localmente.",actions:[{label:"OK",kind:"primary"}]})});
    $("#dna5Generate")?.addEventListener("click",()=>{const mode=Store.get("studioGenerationMode","completa");Store.set("studioGenerationRequest",{mode,created:new Date().toISOString(),status:"ready"});Store.set("studioProcessing",{status:"idle",progress:0,phase:0,message:"Preparando geração...",started:null,finished:null,engine:"",provider:"",model:"",quality:null,error:""});Store.set("studioStep",6);render("studio")});
   }
   if(Number(Store.get("studioStep",1))===6){
    const DEFAULT_PROC={status:"idle",progress:0,phase:0,message:"Preparando geração...",started:null,finished:null,engine:"",provider:"",model:"",quality:null,error:"",generationId:""};
    const getProc=()=>Object.assign({},DEFAULT_PROC,Store.get("studioProcessing",{}));
    const setProc=(patch)=>{const p=Object.assign({},getProc(),patch);Store.set("studioProcessing",p);return p};
    const isStale=(p)=>{if(!p||p.status!=="running"||!p.started)return false;const t=Date.parse(p.started);return !Number.isFinite(t)||(Date.now()-t)>120000};
    let bootProc=getProc();
    if(isStale(bootProc)) bootProc=setProc({status:"error",progress:0,phase:0,message:"A geração anterior foi interrompida e o Studio foi destravado.",finished:new Date().toISOString(),error:"Processamento antigo/órfão recuperado automaticamente.",generationId:""});
    let activeController=null;let activeTimer=null;let activeWatchdog=null;let destroyed=false;
    const cleanup=()=>{if(activeTimer){clearInterval(activeTimer);activeTimer=null}if(activeWatchdog){clearInterval(activeWatchdog);activeWatchdog=null}if(activeController){try{activeController.abort("cancelled")}catch(_){}activeController=null}};
    const paintProc=(p)=>{const pct=Math.max(0,Math.min(100,Number(p.progress)||0));const pe=$("#dna6Percent"),tr=$("#dna6Track"),tx=$("#dna6StatusText"),ph=$("#dna6Phase");if(pe)pe.textContent=pct+"%";if(tr)tr.style.width=pct+"%";if(tx)tx.textContent=p.message||"Processando...";const names=["Preparando","Roteando IA","Gerando","Quality Gate","Finalizando"];if(ph)ph.textContent=p.status==="done"?"Finalizado":p.status==="error"?"Interrompido":names[Math.max(0,Math.min(4,Number(p.phase)||0))];$$(`[data-dna6-phase]`).forEach((el,i)=>{el.classList.toggle("done",p.status==="done"||i<(Number(p.phase)||0));el.classList.toggle("active",p.status==="running"&&i===(Number(p.phase)||0));el.classList.toggle("error",p.status==="error"&&i===(Number(p.phase)||0))})};
    const runStudioGeneration=async()=>{
      let p=getProc();if(p.status==="running"&&!isStale(p) || p.status==="done")return;
      cleanup();
      const generationId="g"+Date.now()+"-"+Math.random().toString(36).slice(2,8);activeController=new AbortController();
      const cfg=Object.assign({text:"",theme:"",sermonType:"Expositiva",duration:40,occasion:"Culto de Ensino",audience:"Igreja local",objective:"",notes:""},Store.get("studioMessageConfig",{}));
      const st=Object.assign({title:cfg.theme||cfg.text||"Estrutura da mensagem",bigIdea:cfg.objective||"",points:[]},Store.get("studioMessageStructure",{}));
      const req=Object.assign({mode:Store.get("studioGenerationMode","completa")},Store.get("studioGenerationRequest",{}));
      const intensity=Math.max(1,Math.min(5,Number(Store.get("studioDNAIntensity",3))||3));
      const structureNotes=[`FORMATO HOMILÉTICO: ${cfg.sermonType||'Expositiva'}`,st.title?`TÍTULO/ESTRUTURA: ${st.title}`:"",st.bigIdea?`GRANDE IDEIA: ${st.bigIdea}`:"",Array.isArray(st.points)&&st.points.length?"PONTOS APROVADOS:\n"+st.points.map((x,i)=>`${i+1}. ${x.title||'Ponto '+(i+1)}${x.note?' — '+x.note:''}`).join("\n"):"",cfg.notes?`ORIENTAÇÕES: ${cfg.notes}`:""].filter(Boolean).join("\n\n");
      const d={text:cfg.text||cfg.theme||st.title||"Mensagem bíblica",objective:cfg.objective||st.bigIdea||"Desenvolver a mensagem conforme a estrutura aprovada.",duration:Number(cfg.duration)||40,cult:cfg.occasion||"Culto",intensity:Math.max(1,Math.min(10,intensity*2)),audience:cfg.audience||"Igreja local",notes:structureNotes};
      p=setProc({status:"running",progress:6,phase:0,message:"Consolidando DNA e estrutura...",started:new Date().toISOString(),finished:null,error:"",generationId});paintProc(p);
      const checkpoints=[[16,0,"Validando configuração das Etapas 1–5..."],[28,1,"Selecionando o motor de geração..."],[43,2,"Gerando o desenvolvimento da mensagem..."],[58,2,"Construindo aplicações, progressão e clímax..."],[72,2,"Finalizando os blocos da mensagem..."],[84,3,"Executando Quality Gate..."],[93,4,"Organizando o resultado final..."]];
      let ci=0;activeTimer=setInterval(()=>{if(ci>=checkpoints.length)return;const cur=getProc();if(cur.status!=="running"||cur.generationId!==generationId){clearInterval(activeTimer);activeTimer=null;return}const [progress,phase,message]=checkpoints[ci++];paintProc(setProc({progress,phase,message}))},650);
      activeWatchdog=setInterval(()=>{const cur=getProc();if(cur.status!=="running"||cur.generationId!==generationId)return;const age=Date.now()-Date.parse(cur.started||0);if(age>240000){try{activeController?.abort("timeout")}catch(_){}setProc({status:"error",progress:0,phase:0,message:"A IA demorou além do limite. O Studio foi destravado automaticamente.",finished:new Date().toISOString(),error:"Timeout de segurança (240s).",generationId:""});cleanup();if(!destroyed)render("studio")}},3000);
      try{
        const cmd=req.mode==="esboco"?"ESBOÇO":"SERMÃO";const started=performance.now();const r=await runCommand(cmd,d,{signal:activeController.signal,timeoutMs:300000});
        const cur=getProc();if(cur.generationId!==generationId||cur.status!=="running")return;
        const seconds=Math.max(0,Math.round((performance.now()-started)/1000));cleanup();App.lastStudioText=r.text;Store.set("studioGeneratedMessage",{text:r.text,mode:req.mode,cmd,created:new Date().toISOString(),provider:r.provider||"",model:r.model||"",engine:r.engine||"local",quality:r.quality??null,seconds,config:cfg,structure:st});Store.push("history",{id:Date.now(),cmd:"STUDIO X • "+cmd,input:d,result:r.text,provider:r.provider||r.engine||"local",quality:r.quality||null,created:new Date().toISOString()});
        setProc({status:"done",progress:100,phase:4,message:"Mensagem gerada e verificada. Pronta para a Etapa 7.",finished:new Date().toISOString(),engine:r.engine||"local",provider:r.provider||"",model:r.model||"",quality:r.quality??null,error:"",generationId:""});if(!destroyed)render("studio");
      }catch(e){const cur=getProc();if(cur.generationId!==generationId)return;cleanup();setProc({status:"error",progress:0,phase:0,message:"A geração foi interrompida, mas o Studio continua liberado.",finished:new Date().toISOString(),error:e?.message||"Falha inesperada",generationId:""});if(!destroyed)render("studio")}
    };
    bindGenerationVisualControls();const sv=$("#studioGenVisual");if(sv){renderSharedGenerationVisual(sv,Math.max(0,Math.min(100,Number(getProc().progress)||0)),getProc().status)}
    $("#dna6EmergencyUnlock")?.addEventListener("click",e=>{e.preventDefault();e.stopPropagation();window.LOGOS_STEP6_UNLOCK?.()});
    $("#dna6Back")?.addEventListener("click",()=>{destroyed=true;cleanup();setProc({status:"idle",progress:0,phase:0,message:"Geração cancelada. Você pode ajustar e tentar novamente.",started:null,finished:new Date().toISOString(),error:"",generationId:""});Store.set("studioStep",5);render("studio")});
    $("#dna6Retry")?.addEventListener("click",()=>{cleanup();Store.set("studioProcessing",Object.assign({},DEFAULT_PROC,{message:"Preparando nova tentativa..."}));render("studio")});
    $("#dna6Copy")?.addEventListener("click",()=>copy(Store.get("studioGeneratedMessage",{}).text||""));
    $("#dna6Next")?.addEventListener("click",()=>{if(getProc().status!=="done")return;cleanup();Store.set("studioStep",7);Store.set("studioResultTab","mensagem");render("studio")});
    const cur=getProc();if(cur.started&&cur.status==="running"){const el=$("#dna6Elapsed");const tick=()=>{const q=getProc();if(!el||!q.started)return;const sec=Math.max(0,Math.round((Date.now()-Date.parse(q.started))/1000));el.textContent=Math.min(sec,999)+"s"};tick();const et=setInterval(()=>{tick();if(getProc().status!=="running")clearInterval(et)},1000)}
    if(cur.status==="idle"||cur.status==="error")setTimeout(()=>{if(Number(Store.get("studioStep",1))===6)runStudioGeneration()},150);
   }
   if(Number(Store.get("studioStep",1))===7){
    const generated=Object.assign({text:"",mode:"completa",config:{},structure:{}},Store.get("studioGeneratedMessage",{}));
    const cfg=Object.assign({text:"",theme:""},Store.get("studioMessageConfig",{}),generated.config||{});
    const st=Object.assign({title:cfg.theme||cfg.text||"Mensagem gerada",points:[]},Store.get("studioMessageStructure",{}),generated.structure||{});
    const safeTitle=String(st.title||cfg.theme||cfg.text||"Mensagem Studio X").trim();
    const outline=()=>`${safeTitle}\n\n${st.bigIdea?`GRANDE IDEIA\n${st.bigIdea}\n\n`:""}${(Array.isArray(st.points)?st.points:[]).map((p,i)=>`${i+1}. ${p.title||`Ponto ${i+1}`}${p.note?`\n   ${p.note}`:""}`).join("\n\n")}`.trim();
    $$(`[data-dna7-tab]`).forEach(b=>b.onclick=()=>{Store.set("studioResultTab",b.dataset.dna7Tab);render("studio")});
    bindGenerationVisualControls();const rv=$("#studioResultVisual");if(rv)renderSharedGenerationVisual(rv,100,"done");
    $("#dna7Back")?.addEventListener("click",()=>{Store.set("studioStep",6);render("studio")});
    $("#dna7EditStructure")?.addEventListener("click",()=>{Store.set("studioStep",4);render("studio")});
    $("#dna7Copy")?.addEventListener("click",()=>copy(generated.text||outline()));
    const openEditor=()=>{Store.set("editor",{title:safeTitle,text:generated.text||outline()});render("editor")};
    $("#dna7Editor")?.addEventListener("click",openEditor);$("#dna7EditorBottom")?.addEventListener("click",openEditor);
    $("#dna7Library")?.addEventListener("click",()=>{if(!generated.text)return;saveMaterial(generated.mode==="esboco"?"esboço":"sermão",safeTitle,generated.text,{source:"DNA K7 Studio X",config:cfg,structure:st,quality:generated.quality??null,provider:generated.provider||generated.engine||"local"});actionModal({icon:"💾",title:"Salvo na Biblioteca",message:"A mensagem completa foi adicionada à sua Biblioteca local.",actions:[{label:"OK",kind:"primary"}]})});
    $("#dna7Download")?.addEventListener("click",()=>download(safeTitle.replace(/[\\/:*?\"<>|]+/g,"-")+".txt",generated.text||outline()));
    $("#dna7Share")?.addEventListener("click",()=>openShareMenu(safeTitle,generated.text||outline()));
    $("#dna7New")?.addEventListener("click",()=>actionModal({icon:"＋",title:"Iniciar nova mensagem?",message:"O resultado atual continuará no Histórico. O Studio voltará para a seleção de DNA.",actions:[{label:"Nova mensagem",kind:"primary",run:()=>{Store.set("studioStep",1);Store.set("studioGenerationRequest",{});Store.set("studioProcessing",{});Store.set("studioGeneratedMessage",{});Store.set("studioResultTab","mensagem");render("studio")}},{label:"Cancelar"}]}));
   }
   normalizeWeights();saveState();syncCards();syncSummary();paintAllRanges();
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
 if(view==="settings"){ $("#apiSave").onclick=async()=>{App.api=$("#api").value.trim().replace(/\/$/,"");Store.set("api",App.api);await checkApi();render("settings")};$("#apiOff").onclick=()=>{App.api="";App.server=false;App.health=null;Store.set("api","");setStatus();render("settings")};
 const maintenanceMsg=t=>{const e=$("#maintenanceOut");if(e)e.textContent=t};
 $("#studioResetBtn")?.addEventListener("click",()=>{if(!confirm("Resetar somente o processamento temporário do Studio X? Etapas/configurações anteriores serão preservadas."))return;logosSafeStudioReset();maintenanceMsg("Studio X destravado. Retornando à Etapa 5...");setTimeout(()=>render("studio"),120)});
 $("#cacheRepairBtn")?.addEventListener("click",async()=>{maintenanceMsg("Limpando somente cache do aplicativo...");await logosRepairFrontendCache();maintenanceMsg("Cache corrigido. Reiniciando...");setTimeout(()=>location.reload(),250)});
 $("#safeRestartBtn")?.addEventListener("click",async()=>{if(!confirm("Reiniciar o LOGOS MASTER X com recuperação segura? Seus dados serão preservados."))return;maintenanceMsg("Preparando reinício seguro...");logosSafeStudioReset();await logosRepairFrontendCache();sessionStorage.clear();setTimeout(()=>location.reload(),250)});
}
}

async function openDB(){return new Promise((res,rej)=>{const r=indexedDB.open("logosx-bible",15);r.onupgradeneeded=()=>{const db=r.result;if(!db.objectStoreNames.contains("verses")){const s=db.createObjectStore("verses",{keyPath:"id"});s.createIndex("ref","ref");}if(!db.objectStoreNames.contains("meta"))db.createObjectStore("meta",{keyPath:"key"});if(!db.objectStoreNames.contains("crossrefs")){const c=db.createObjectStore("crossrefs",{keyPath:"id"});c.createIndex("source","source");}if(!db.objectStoreNames.contains("strong")){const st=db.createObjectStore("strong",{keyPath:"number"});st.createIndex("language","language");st.createIndex("lemma","lemma");}if(!db.objectStoreNames.contains("lexicon")){const lx=db.createObjectStore("lexicon",{keyPath:"id"});lx.createIndex("language","language");lx.createIndex("lemma","lemma");lx.createIndex("strong","strong");}if(!db.objectStoreNames.contains("context")){const cx=db.createObjectStore("context",{keyPath:"id"});cx.createIndex("book","book");cx.createIndex("reference","reference");}if(!db.objectStoreNames.contains("maps")){const mp=db.createObjectStore("maps",{keyPath:"id"});mp.createIndex("type","type");mp.createIndex("name","name");}if(!db.objectStoreNames.contains("media")){const md=db.createObjectStore("media",{keyPath:"id"});md.createIndex("type","type");md.createIndex("title","title");}if(!db.objectStoreNames.contains("comments")){const cm=db.createObjectStore("comments",{keyPath:"id"});cm.createIndex("reference","reference");cm.createIndex("type","type");cm.createIndex("title","title");}if(!db.objectStoreNames.contains("people")){const pp=db.createObjectStore("people",{keyPath:"id"});pp.createIndex("name","name");pp.createIndex("period","period");pp.createIndex("role","role");}if(!db.objectStoreNames.contains("timeline")){const tl=db.createObjectStore("timeline",{keyPath:"id"});tl.createIndex("type","type");tl.createIndex("era","era");tl.createIndex("startYear","startYear");}if(!db.objectStoreNames.contains("explore")){const ex=db.createObjectStore("explore",{keyPath:"id"});ex.createIndex("type","type");ex.createIndex("title","title");ex.createIndex("period","period");}if(!db.objectStoreNames.contains("favorites")){const fv=db.createObjectStore("favorites",{keyPath:"id"});fv.createIndex("type","type");fv.createIndex("reference","reference");fv.createIndex("title","title");fv.createIndex("createdAt","createdAt");}if(!db.objectStoreNames.contains("notes")){const nt=db.createObjectStore("notes",{keyPath:"id"});nt.createIndex("type","type");nt.createIndex("reference","reference");nt.createIndex("title","title");nt.createIndex("updatedAt","updatedAt");}if(!db.objectStoreNames.contains("collections")){const cl=db.createObjectStore("collections",{keyPath:"id"});cl.createIndex("type","type");cl.createIndex("title","title");cl.createIndex("updatedAt","updatedAt");}if(!db.objectStoreNames.contains("plans")){const pl=db.createObjectStore("plans",{keyPath:"id"});pl.createIndex("title","title");pl.createIndex("status","status");pl.createIndex("updatedAt","updatedAt");}};r.onsuccess=()=>res(r.result);r.onerror=()=>rej(r.error)})}
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
function normalizeBibleRef(ref){return String(ref||"").trim().replace(/\s+/g," ")}
async function crossAll(){return await dbAll("crossrefs")}
async function crossPut(source,target){source=normalizeBibleRef(source);target=normalizeBibleRef(target);if(!source||!target)throw new Error("Informe as duas referências.");const db=await openDB();const id=(source+"|"+target).toLowerCase();return new Promise((res,rej)=>{const t=db.transaction("crossrefs","readwrite");t.objectStore("crossrefs").put({id,source,target,at:new Date().toISOString()});t.oncomplete=()=>res(true);t.onerror=()=>rej(t.error)})}
async function crossDelete(id){const db=await openDB();return new Promise((res,rej)=>{const t=db.transaction("crossrefs","readwrite");t.objectStore("crossrefs").delete(id);t.oncomplete=()=>res(true);t.onerror=()=>rej(t.error)})}
function normalizeStrongRow(row={}){let number=String(row.number||row.strong||row.id||'').trim().toUpperCase().replace(/\s+/g,'');if(!/^[GH]\d{1,5}$/.test(number))return null;const language=(String(row.language||number[0]).toUpperCase().startsWith('H')?'H':'G');return {number,language,lemma:String(row.lemma||row.word||row.original||''),transliteration:String(row.transliteration||row.translit||''),pronunciation:String(row.pronunciation||''),morphology:String(row.morphology||row.pos||''),definition:String(row.definition||row.meaning||row.gloss||''),root:String(row.root||row.derivation||''),usage:String(row.usage||''),refs:Array.isArray(row.refs)?row.refs:(Array.isArray(row.references)?row.references:[]),notes:String(row.notes||'')}}
async function strongAll(){return await dbAll("strong")}
async function strongPutMany(rows=[]){const clean=rows.map(normalizeStrongRow).filter(Boolean);if(!clean.length)return 0;const db=await openDB();return new Promise((res,rej)=>{const t=db.transaction("strong","readwrite"),st=t.objectStore("strong");clean.forEach(x=>st.put(x));t.oncomplete=()=>res(clean.length);t.onerror=()=>rej(t.error)})}
async function strongClear(){const db=await openDB();return new Promise((res,rej)=>{const t=db.transaction("strong","readwrite");t.objectStore("strong").clear();t.oncomplete=()=>res(true);t.onerror=()=>rej(t.error)})}
function normalizeLexiconRow(row={}){const strong=String(row.strong||row.number||'').trim().toUpperCase();const language=(String(row.language||strong[0]||'G').toUpperCase().startsWith('H')?'H':'G');const lemma=String(row.lemma||row.word||row.original||'').trim();const id=String(row.id||strong||(`${language}:${lemma}:${row.transliteration||''}`)).trim();if(!id||(!lemma&&!strong))return null;const arr=v=>Array.isArray(v)?v:String(v||'').split(/[;,|]/).map(x=>x.trim()).filter(Boolean);return {id,language,lemma,transliteration:String(row.transliteration||row.translit||''),strong,gloss:String(row.gloss||row.meaning||row.definition||''),senses:arr(row.senses||row.meanings),semanticField:String(row.semanticField||row.semantic_field||row.field||''),root:String(row.root||row.derivation||''),related:arr(row.related||row.relatedWords),refs:arr(row.refs||row.references),notes:String(row.notes||row.usage||'')}}
async function lexiconAll(){return await dbAll("lexicon")}
async function lexiconPutMany(rows=[]){const clean=rows.map(normalizeLexiconRow).filter(Boolean);if(!clean.length)return 0;const db=await openDB();return new Promise((res,rej)=>{const t=db.transaction("lexicon","readwrite"),st=t.objectStore("lexicon");clean.forEach(x=>st.put(x));t.oncomplete=()=>res(clean.length);t.onerror=()=>rej(t.error)})}
async function lexiconClear(){const db=await openDB();return new Promise((res,rej)=>{const t=db.transaction("lexicon","readwrite");t.objectStore("lexicon").clear();t.oncomplete=()=>res(true);t.onerror=()=>rej(t.error)})}
function normalizeContextRow(row={}){const arr=v=>Array.isArray(v)?v:String(v||'').split(/[;,|]/).map(x=>x.trim()).filter(Boolean);const reference=normalizeBibleRef(row.reference||row.ref||row.passage||'');const title=String(row.title||row.name||reference||row.book||'Contexto').trim();const id=String(row.id||(`${reference||row.book||title}|${title}`)).trim().toLowerCase();if(!id||!title)return null;return {id,title,reference,book:String(row.book||'').trim(),types:arr(row.types||row.type).map(x=>String(x).toLowerCase()),period:String(row.period||row.date||''),author:String(row.author||''),audience:String(row.audience||row.recipients||''),purpose:String(row.purpose||''),historical:String(row.historical||row.history||''),cultural:String(row.cultural||row.culture||''),literary:String(row.literary||row.genre||''),geographic:String(row.geographic||row.geography||row.location||''),keywords:arr(row.keywords||row.tags),refs:arr(row.refs||row.references),notes:String(row.notes||'')}}
async function contextAll(){return await dbAll("context")}
async function contextPutMany(rows=[]){const clean=rows.map(normalizeContextRow).filter(Boolean);if(!clean.length)return 0;const db=await openDB();return new Promise((res,rej)=>{const t=db.transaction("context","readwrite"),st=t.objectStore("context");clean.forEach(x=>st.put(x));t.oncomplete=()=>res(clean.length);t.onerror=()=>rej(t.error)})}
async function contextClear(){const db=await openDB();return new Promise((res,rej)=>{const t=db.transaction("context","readwrite");t.objectStore("context").clear();t.oncomplete=()=>res(true);t.onerror=()=>rej(t.error)})}
function normalizeCommentRow(row={}){const arr=v=>Array.isArray(v)?v:String(v||'').split(/[;,|]/).map(x=>x.trim()).filter(Boolean);const reference=normalizeBibleRef(row.reference||row.ref||row.passage||'');const type=String(row.type||row.category||'executivo').trim().toLowerCase().replace(/[^a-záéíóúâêôãõç-]+/g,'-');const title=String(row.title||row.name||`${reference||'Comentário'} • ${type}`).trim();const content=String(row.content||row.text||row.comment||row.body||'').trim();const id=String(row.id||(`${reference}|${type}|${title}`)).trim().toLowerCase();if(!id||!title||!content)return null;return {id,reference,type,title,content,authorLabel:String(row.authorLabel||row.author||'Comentário local'),sourceLabel:String(row.sourceLabel||row.source||'Bíblia X'),tags:arr(row.tags||row.keywords),refs:arr(row.refs||row.references),createdAt:String(row.createdAt||row.created||new Date().toISOString()),updatedAt:new Date().toISOString()}}
async function commentsAll(){return await dbAll("comments")}
async function commentsPutMany(rows=[]){const clean=rows.map(normalizeCommentRow).filter(Boolean);if(!clean.length)return 0;const db=await openDB();return new Promise((res,rej)=>{const t=db.transaction("comments","readwrite"),st=t.objectStore("comments");clean.forEach(x=>st.put(x));t.oncomplete=()=>res(clean.length);t.onerror=()=>rej(t.error)})}
async function commentsDelete(id){const db=await openDB();return new Promise((res,rej)=>{const t=db.transaction("comments","readwrite");t.objectStore("comments").delete(id);t.oncomplete=()=>res(true);t.onerror=()=>rej(t.error)})}
async function commentsClear(){const db=await openDB();return new Promise((res,rej)=>{const t=db.transaction("comments","readwrite");t.objectStore("comments").clear();t.oncomplete=()=>res(true);t.onerror=()=>rej(t.error)})}
function normalizePersonRow(row={}){const arr=v=>Array.isArray(v)?v:String(v||'').split(/[;,|]/).map(x=>x.trim()).filter(Boolean);const name=String(row.name||row.nome||row.title||'').trim();if(!name)return null;const id=String(row.id||name).trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');const role=String(row.role||row.type||row.category||row.funcao||'outro').trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9-]+/g,'-');return {id,name,meaning:String(row.meaning||row.significado||''),role,period:String(row.period||row.date||row.periodo||''),summary:String(row.summary||row.biography||row.bio||row.resumo||''),family:arr(row.family||row.familia||row.relatives),places:arr(row.places||row.locations||row.lugares),events:arr(row.events||row.eventos),refs:arr(row.refs||row.references||row.referencias),virtues:arr(row.virtues||row.virtudes),failures:arr(row.failures||row.falhas),lessons:arr(row.lessons||row.licoes),related:arr(row.related||row.relatedPeople||row.relacionados),notes:String(row.notes||row.notas||'')}}
async function peopleAll(){return await dbAll('people')}
async function peoplePutMany(rows=[]){const clean=rows.map(normalizePersonRow).filter(Boolean);if(!clean.length)return 0;const db=await openDB();return new Promise((res,rej)=>{const t=db.transaction('people','readwrite'),st=t.objectStore('people');clean.forEach(x=>st.put(x));t.oncomplete=()=>res(clean.length);t.onerror=()=>rej(t.error)})}
async function peopleDelete(id){const db=await openDB();return new Promise((res,rej)=>{const t=db.transaction('people','readwrite');t.objectStore('people').delete(id);t.oncomplete=()=>res(true);t.onerror=()=>rej(t.error)})}
async function peopleClear(){const db=await openDB();return new Promise((res,rej)=>{const t=db.transaction('people','readwrite');t.objectStore('people').clear();t.oncomplete=()=>res(true);t.onerror=()=>rej(t.error)})}
function normalizeTimelineRow(row={}){const arr=v=>Array.isArray(v)?v:String(v||'').split(/[;,|]/).map(x=>x.trim()).filter(Boolean);const title=String(row.title||row.name||row.event||'').trim();if(!title)return null;const type=String(row.type||row.category||'event').trim().toLowerCase();const era=String(row.era||row.periodKey||'').trim().toLowerCase();let startYear=Number(row.startYear??row.year??row.start??0),endYear=Number(row.endYear??row.end??startYear);if(!Number.isFinite(startYear))startYear=0;if(!Number.isFinite(endYear))endYear=startYear;const id=String(row.id||`${title}|${startYear}|${type}`).trim().toLowerCase().replace(/\s+/g,'-');return {id,title,type,era,startYear,endYear,displayDate:String(row.displayDate||row.date||''),approximate:row.approximate!==false,testament:String(row.testament||((startYear>0)?'NT':'AT')).toUpperCase(),summary:String(row.summary||row.description||row.text||'').trim(),people:arr(row.people||row.characters),places:arr(row.places||row.locations),books:arr(row.books),refs:arr(row.refs||row.references),related:arr(row.related),notes:String(row.notes||'').trim(),updatedAt:new Date().toISOString()}}
async function timelineAll(){return await dbAll('timeline')}
async function timelinePutMany(rows=[]){const clean=rows.map(normalizeTimelineRow).filter(Boolean);if(!clean.length)return 0;const db=await openDB();return new Promise((res,rej)=>{const t=db.transaction('timeline','readwrite'),st=t.objectStore('timeline');clean.forEach(x=>st.put(x));t.oncomplete=()=>res(clean.length);t.onerror=()=>rej(t.error)})}
async function timelineDelete(id){const db=await openDB();return new Promise((res,rej)=>{const t=db.transaction('timeline','readwrite');t.objectStore('timeline').delete(id);t.oncomplete=()=>res(true);t.onerror=()=>rej(t.error)})}
async function timelineClear(){const db=await openDB();return new Promise((res,rej)=>{const t=db.transaction('timeline','readwrite');t.objectStore('timeline').clear();t.oncomplete=()=>res(true);t.onerror=()=>rej(t.error)})}
 // ETAPA 13 • FAVORITOS X
 const normalizeExploreRow=(row={})=>{const arr=v=>Array.isArray(v)?v:String(v||'').split(/[;,|]/).map(x=>x.trim()).filter(Boolean);const title=String(row.title||row.name||row.titulo||'').trim();if(!title)return null;const id=String(row.id||title).trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');const type=String(row.type||row.category||row.tipo||'scene').trim().toLowerCase();return {id,title,type,period:String(row.period||row.date||row.periodo||''),summary:String(row.summary||row.description||row.resumo||''),refs:arr(row.refs||row.references||row.referencias),places:arr(row.places||row.locations||row.lugares),people:arr(row.people||row.characters||row.personagens),timeline:arr(row.timeline||row.events||row.cronologia),mediaTags:arr(row.mediaTags||row.media||row.midia),themes:arr(row.themes||row.temas||row.tags),notes:String(row.notes||row.notas||'')}};
 const exploreAll=async()=>{const db=await openDB();return new Promise((res,rej)=>{const r=db.transaction("explore","readonly").objectStore("explore").getAll();r.onsuccess=()=>res(r.result||[]);r.onerror=()=>rej(r.error)})};
 const explorePutMany=async rows=>{const clean=(rows||[]).map(normalizeExploreRow).filter(Boolean);if(!clean.length)return 0;const db=await openDB();return new Promise((res,rej)=>{const tx=db.transaction("explore","readwrite"),st=tx.objectStore("explore");clean.forEach(x=>st.put(x));tx.oncomplete=()=>res(clean.length);tx.onerror=()=>rej(tx.error)})};
 const exploreDelete=async id=>{const db=await openDB();return new Promise((res,rej)=>{const tx=db.transaction("explore","readwrite");tx.objectStore("explore").delete(id);tx.oncomplete=()=>res();tx.onerror=()=>rej(tx.error)})};
 const exploreClear=async()=>{const db=await openDB();return new Promise((res,rej)=>{const tx=db.transaction("explore","readwrite");tx.objectStore("explore").clear();tx.oncomplete=()=>res();tx.onerror=()=>rej(tx.error)})};
 const normalizeFavoriteRow=(row={})=>{const arr=v=>Array.isArray(v)?v:String(v||'').split(/[;,|]/).map(x=>x.trim()).filter(Boolean);const title=String(row.title||row.name||row.reference||row.ref||'Favorito').trim();const reference=normalizeBibleRef(row.reference||row.ref||row.passage||'');const type=String(row.type||row.kind||'study').trim().toLowerCase();const id=String(row.id||`fav-${Date.now()}-${Math.random().toString(36).slice(2,8)}`);return {id,type,title,reference,summary:String(row.summary||row.description||row.text||''),sourceModule:String(row.sourceModule||row.source||'Bíblia X'),tags:arr(row.tags||row.keywords),note:String(row.note||row.notes||''),createdAt:String(row.createdAt||row.created||new Date().toISOString())}};
 const favoritesAll=async()=>await dbAll('favorites');
 const favoritesPutMany=async(rows=[])=>{const clean=rows.map(normalizeFavoriteRow).filter(Boolean);if(!clean.length)return 0;const db=await openDB();return new Promise((res,rej)=>{const t=db.transaction('favorites','readwrite'),st=t.objectStore('favorites');clean.forEach(x=>st.put(x));t.oncomplete=()=>res(clean.length);t.onerror=()=>rej(t.error)})};
 const favoriteDelete=async id=>{const db=await openDB();return new Promise((res,rej)=>{const t=db.transaction('favorites','readwrite');t.objectStore('favorites').delete(id);t.oncomplete=()=>res(true);t.onerror=()=>rej(t.error)})};
 const favoritesClear=async()=>{const db=await openDB();return new Promise((res,rej)=>{const t=db.transaction('favorites','readwrite');t.objectStore('favorites').clear();t.oncomplete=()=>res(true);t.onerror=()=>rej(t.error)})};
 const exploreTypeLabel=t=>({scene:'Cenário',journey:'Jornada',event:'Evento',place:'Lugar',theme:'Tema'}[t]||'Experiência');
 const exploreTypeIcon=t=>({scene:'🏞',journey:'🧭',event:'⚡',place:'📍',theme:'💡'}[t]||'🌍');



function normalizeMapRow(row={}){const arr=v=>Array.isArray(v)?v:String(v||'').split(/[;,|]/).map(x=>x.trim()).filter(Boolean);const name=String(row.name||row.title||row.place||'').trim();const id=String(row.id||name).trim().toLowerCase().replace(/\s+/g,'-');if(!id||!name)return null;const lat=Number(row.lat??row.latitude),lng=Number(row.lng??row.lon??row.longitude);return {id,name,type:String(row.type||row.category||'place').toLowerCase(),region:String(row.region||''),period:String(row.period||''),lat:Number.isFinite(lat)?lat:null,lng:Number.isFinite(lng)?lng:null,description:String(row.description||row.summary||''),refs:arr(row.refs||row.references),tags:arr(row.tags||row.keywords),route:arr(row.route||row.stops),notes:String(row.notes||'')}}
async function mapsAll(){return await dbAll("maps")}
async function mapsPutMany(rows=[]){const clean=rows.map(normalizeMapRow).filter(Boolean);if(!clean.length)return 0;const db=await openDB();return new Promise((res,rej)=>{const t=db.transaction("maps","readwrite"),st=t.objectStore("maps");clean.forEach(x=>st.put(x));t.oncomplete=()=>res(clean.length);t.onerror=()=>rej(t.error)})}
async function mapsClear(){const db=await openDB();return new Promise((res,rej)=>{const t=db.transaction("maps","readwrite");t.objectStore("maps").clear();t.oncomplete=()=>res(true);t.onerror=()=>rej(t.error)})}
function mediaKindFromMime(mime=''){mime=String(mime).toLowerCase();if(mime.startsWith('image/'))return 'image';if(mime.startsWith('video/'))return 'video';if(mime.startsWith('audio/'))return 'audio';return 'document'}
function normalizeMediaRow(row={}){const arr=v=>Array.isArray(v)?v:String(v||'').split(/[;,|]/).map(x=>x.trim()).filter(Boolean);const title=String(row.title||row.name||'Mídia bíblica').trim();const id=String(row.id||(`media-${Date.now()}-${Math.random().toString(36).slice(2,8)}`));const mime=String(row.mime||row.typeMime||row.blob?.type||'');const type=String(row.type||mediaKindFromMime(mime)||'document').toLowerCase();return {id,title,type,mime,reference:normalizeBibleRef(row.reference||row.ref||row.passage||''),description:String(row.description||row.summary||''),tags:arr(row.tags||row.keywords),credits:String(row.credits||row.source||''),license:String(row.license||''),createdAt:String(row.createdAt||row.created||new Date().toISOString()),blob:row.blob||null,size:Number(row.size||row.blob?.size||0)}}
async function mediaAll(){return await dbAll('media')}
async function mediaPutMany(rows=[]){const clean=rows.map(normalizeMediaRow).filter(Boolean);if(!clean.length)return 0;const db=await openDB();return new Promise((res,rej)=>{const t=db.transaction('media','readwrite'),st=t.objectStore('media');clean.forEach(x=>st.put(x));t.oncomplete=()=>res(clean.length);t.onerror=()=>rej(t.error)})}
async function mediaDelete(id){const db=await openDB();return new Promise((res,rej)=>{const t=db.transaction('media','readwrite');t.objectStore('media').delete(id);t.oncomplete=()=>res(true);t.onerror=()=>rej(t.error)})}
async function mediaClear(){const db=await openDB();return new Promise((res,rej)=>{const t=db.transaction('media','readwrite');t.objectStore('media').clear();t.oncomplete=()=>res(true);t.onerror=()=>rej(t.error)})}
function normalizePlanRow(row={}){const title=String(row.title||row.name||'Plano de estudo').trim(),items=Array.isArray(row.items)?row.items:String(row.items||row.references||'').split(/\n|[;|]/).map(x=>x.trim()).filter(Boolean);return {id:String(row.id||`plan-${Date.now()}-${Math.random().toString(36).slice(2,7)}`),title,description:String(row.description||row.desc||''),items,progress:Math.max(0,Math.min(100,Number(row.progress||0))),status:Number(row.progress||0)>=100?'concluido':'ativo',createdAt:String(row.createdAt||new Date().toISOString()),updatedAt:new Date().toISOString()}}
async function plansAll(){return await dbAll('plans')}
async function plansPut(row){const x=normalizePlanRow(row),db=await openDB();return new Promise((res,rej)=>{const t=db.transaction('plans','readwrite');t.objectStore('plans').put(x);t.oncomplete=()=>res(x);t.onerror=()=>rej(t.error)})}
async function planDelete(id){const db=await openDB();return new Promise((res,rej)=>{const t=db.transaction('plans','readwrite');t.objectStore('plans').delete(id);t.oncomplete=()=>res(true);t.onerror=()=>rej(t.error)})}
async function crossBySource(source){source=normalizeBibleRef(source).toLowerCase();const all=await crossAll();return all.filter(x=>normalizeBibleRef(x.source).toLowerCase()===source).sort((a,b)=>a.target.localeCompare(b.target,"pt-BR"))}
async function initBibleUI(){let current=[];
 const activate=(id)=>{document.querySelectorAll("[data-bible-section]").forEach(x=>x.classList.toggle("active",x.dataset.bibleSection===id));document.querySelectorAll("[data-bible-panel]").forEach(p=>p.classList.toggle("active",p.dataset.biblePanel===id));};
 const bibleApiBase=()=>"/api/bible";
 const bxNetState={online:navigator.onLine,lastOk:0};
 const bxFetch=async(url,opts={})=>{
   const cfg={cache:"no-store",...opts};
   try{
     const r=await fetch(url,cfg);
     if(!r.ok)throw new Error(`HTTP ${r.status}`);
     bxNetState.online=true;bxNetState.lastOk=Date.now();
     window.dispatchEvent(new CustomEvent("bx-net-state",{detail:{online:true}}));
     return r;
   }catch(e){
     bxNetState.online=false;
     window.dispatchEvent(new CustomEvent("bx-net-state",{detail:{online:false}}));
     throw e;
   }
 };
 const bxUpdateNetBadge=()=>{
   const s=$("#bServerStatus"),m=$("#bxDataMode");
   const online=navigator.onLine&&bxNetState.online!==false;
   if(s){s.textContent=online?"● Online / servidor":"● Offline / fallback local";s.classList.toggle("offline",!online)}
   if(m)m.textContent=online?"☁️ Online primeiro":"💾 Offline local";
 };
 window.addEventListener("online",()=>{bxNetState.online=true;bxUpdateNetBadge()});
 window.addEventListener("offline",()=>{bxNetState.online=false;bxUpdateNetBadge()});
 window.addEventListener("bx-net-state",bxUpdateNetBadge);
 const bxOfflineManifest=()=>Store.get("bibleOfflineManifest",{
   bible:false,crossrefs:false,strong:false,lexicon:false,context:false,comments:false,media:false
 });
 const bxSaveOfflineManifest=(m)=>Store.set("bibleOfflineManifest",m);
 const bxOfflinePanel=()=>{
   const m=bxOfflineManifest();
   return `<div class="bx-offline-modal-inner">
    <div class="bx-offline-title"><div><b>Uso offline opcional</b><small>Conectado à internet, nada precisa ser instalado para usar a Bíblia X.</small></div><button id="bxOfflineClose">×</button></div>
    <div class="bx-offline-info">☁️ <b>Modo padrão:</b> usar servidor automaticamente. Downloads locais servem apenas para quem quiser trabalhar sem internet.</div>
    <div class="bx-offline-grid">
      ${[
        ["bible","📖 Bíblia"],["crossrefs","🔗 Referências"],["strong","🇬🇷🇮🇱 Strong"],
        ["lexicon","📚 Léxico"],["context","🧭 Contexto"],["comments","💬 Comentários"],["media","🎥 Mídia"]
      ].map(([k,label])=>`<button data-offline-module="${k}" class="${m[k]?"downloaded":""}">
        <b>${label}</b><small>${m[k]?"✅ Marcado para offline":"⬇ Disponível para offline"}</small>
      </button>`).join("")}
    </div>
    <p class="bx-offline-note">Nesta versão, Bíblia, referências, Strong e Léxico já podem funcionar pelo servidor sem qualquer download manual. O gerenciamento acima prepara a experiência de módulos offline opcionais.</p>
   </div>`;
 };
 let bibleBookMap={};
 const selectedTranslation=()=>$("#bVersion")?.value||"porbr2018";
 const loadBookMap=async(translation=selectedTranslation())=>{try{const r=await bxFetch(`${bibleApiBase()}/books?translation=${encodeURIComponent(translation)}`);if(!r.ok)throw new Error("books");const j=await r.json();bibleBookMap={};(j.items||[]).forEach(x=>{bibleBookMap[x.code]=translation==="engwebp"?(x.name_en||x.code):(x.name_pt||x.code)});return true}catch{return false}};
 const apiToVerse=(x,bookName,bookCodeFallback="",chapterFallback=null)=>{const code=x.book_code||bookCodeFallback||"";const book=bookName||bibleBookMap[code]||code||"";const chapter=Number(x.chapter??chapterFallback),verse=String(x.verse);const safeChapter=Number.isFinite(chapter)?chapter:Number(chapterFallback)||1;return {id:`${selectedTranslation()}|${code||book}|${safeChapter}|${verse}`.toLowerCase(),book,bookCode:code,chapter:safeChapter,verse:Number.parseInt(verse,10)||verse,ref:`${book} ${safeChapter}:${verse}`,text:String(x.text||"")}};
 const apiBibleRef=async(q)=>{const translation=selectedTranslation();const url=`${bibleApiBase()}/reference?translation=${encodeURIComponent(translation)}&ref=${encodeURIComponent(q)}&language=${translation==="engwebp"?"en":"pt"}`;const r=await bxFetch(url);if(!r.ok)throw new Error(r.status===404?"Referência não encontrada.":"Motor Bíblia X indisponível.");const j=await r.json();const code=j.reference?.book_code||"";const chapter=j.reference?.chapter||null;const name=j.reference?.book_name||bibleBookMap[code]||code;return (j.verses||[]).filter(Boolean).map(x=>apiToVerse(x,name,code,chapter))};
 const apiBibleSearch=async(q)=>{const translation=selectedTranslation();if(!Object.keys(bibleBookMap).length)await loadBookMap(translation);const r=await bxFetch(`${bibleApiBase()}/search?q=${encodeURIComponent(q)}&translation=${encodeURIComponent(translation)}&limit=100`);if(!r.ok)throw new Error("Pesquisa bíblica indisponível.");const j=await r.json();return (j.items||[]).map(x=>apiToVerse(x,bibleBookMap[x.book_code]))};
 
 const bxV158VerseRaw=()=>String($("#bVerse")?.value||"").trim().replace(/\s+/g,"");
 const bxV158NormalizeVerseInput=(raw)=>{
   raw=String(raw||"").trim().replace(/\s+/g,"");
   if(!raw)return "";
   const m=raw.match(/^(\d{1,3})(?:-(\d{1,3}))?$/);
   if(!m)return null;
   const a=Number(m[1]),b=m[2]?Number(m[2]):null;
   if(a<1||a>176)return null;
   if(b!==null&&(b<a||b>176))return null;
   return b!==null?`${a}-${b}`:String(a);
 };
 const bxV158BuildRef=()=>{
   const book=selectedBookName();
   const chapter=Number($("#bChapter")?.value)||1;
   const verse=bxV158NormalizeVerseInput(bxV158VerseRaw());
   if(verse===null)return null;
   return verse?`${book} ${chapter}:${verse}`:`${book} ${chapter}`;
 };
 const bxV158UpdateMode=()=>{
   const pill=$("#bxV158Mode"),open=$("#bOpen");
   const verse=bxV158NormalizeVerseInput(bxV158VerseRaw());
   if(!pill)return;
   if(verse===null){
     pill.textContent="⚠ Verifique o versículo";
     pill.dataset.mode="error";
     if(open)open.textContent="Abrir";
     return;
   }
   if(verse){
     pill.textContent=`🔎 Versículo ${verse}`;
     pill.dataset.mode="verse";
     if(open)open.textContent="Abrir versículo";
   }else{
     pill.textContent="📖 Capítulo inteiro";
     pill.dataset.mode="chapter";
     if(open)open.textContent="Abrir";
   }
 };
 const bxV158SyncVisibleVerse=(rows=[])=>{
   const el=$("#bVerse");if(!el||!rows?.length)return;
   const same=rows.every(v=>v.book===rows[0].book&&v.chapter===rows[0].chapter);
   if(!same){el.value="";bxV158UpdateMode();return}
   if(rows.length===1){
     el.value=String(rows[0].verse);
   }else{
     const nums=rows.map(v=>Number(v.verse)).filter(Number.isFinite).sort((a,b)=>a-b);
     const contiguous=nums.length>1&&nums.every((n,i)=>i===0||n===nums[i-1]+1);
     const isWhole=nums.length>6; // capítulo/resultado amplo: manter campo vazio
     el.value=!isWhole&&contiguous?`${nums[0]}-${nums[nums.length-1]}`:"";
   }
   bxV158UpdateMode();
 };
 const bxV158PrepareRef=()=>{
   const ref=bxV158BuildRef();
   if(!ref)return false;
   if($("#bRef"))$("#bRef").value=ref;
   bxV158UpdateMode();
   return true;
 };

 const currentRefState=()=>{const raw=String($("#bRef")?.value||"").trim();const m=raw.match(/^(.+?)\s+(\d+)(?::(\d+)(?:-(\d+))?)?$/);return m?{book:m[1],chapter:Number(m[2]),verse:m[3]?Number(m[3]):null}:null};
 const bookItems=[];
 const syncBookChapterSelectors=async(bookName=null,chapter=null)=>{const translation=selectedTranslation();const rb=await bxFetch(`${bibleApiBase()}/books?translation=${encodeURIComponent(translation)}`);if(!rb.ok)return false;const jb=await rb.json();bookItems.splice(0,bookItems.length,...(jb.items||[]));const bookSel=$("#bBook");if(bookSel){bookSel.innerHTML=bookItems.map(x=>`<option value="${escapeHtml(x.code)}">${escapeHtml(translation==="engwebp"?(x.name_en||x.code):(x.name_pt||x.code))}</option>`).join("");let target=bookItems.find(x=>[x.name_pt,x.name_en,x.code].some(v=>String(v||"").toLowerCase()===String(bookName||"").toLowerCase()));if(!target&&current.length)target=bookItems.find(x=>x.code===current[0].bookCode);if(!target)target=bookItems.find(x=>x.code==="JHN")||bookItems[0];if(target)bookSel.value=target.code}
  const code=bookSel?.value||"JHN";const rc=await bxFetch(`${bibleApiBase()}/chapters?translation=${encodeURIComponent(translation)}&book=${encodeURIComponent(code)}`);if(!rc.ok)return false;const jc=await rc.json();const chSel=$("#bChapter");if(chSel){chSel.innerHTML=(jc.items||[]).map(x=>`<option value="${x.chapter}">${x.chapter}</option>`).join("");const wanted=Number(chapter)||Number(currentRefState()?.chapter)||3;chSel.value=String((jc.items||[]).some(x=>Number(x.chapter)===wanted)?wanted:(jc.items?.[0]?.chapter||1))}return true};
 const selectedBookMeta=()=>bookItems.find(x=>x.code===$("#bBook")?.value);
 const selectedBookName=()=>{const x=selectedBookMeta();return selectedTranslation()==="engwebp"?(x?.name_en||x?.code||"John"):(x?.name_pt||x?.code||"João")};
 const bxV161SyncVerseOptions=async(book=null,chapter=null,preferred=null)=>{
   const sel=$("#bVerse");if(!sel)return [];
   const bookName=book||selectedBookName(),ch=Number(chapter)||Number($("#bChapter")?.value)||1;
   const keep=preferred!==null?String(preferred):String(sel.value||"");
   let verses=[];
   try{verses=await smartBibleRef(`${bookName} ${ch}`)}catch(_){verses=[]}
   const nums=[...new Set((verses||[]).map(v=>Number(v.verse)).filter(Number.isFinite))].sort((a,b)=>a-b);
   sel.innerHTML=`<option value="">Todos</option>${nums.map(n=>`<option value="${n}">${n}</option>`).join("")}`;
   if(keep&&nums.includes(Number(keep)))sel.value=String(Number(keep));else sel.value="";
   bxV158UpdateMode();
   return nums;
 };

 const chapterBounds=()=>{const sel=$("#bChapter");if(!sel)return{min:1,max:1};const vals=[...sel.options].map(o=>Number(o.value)).filter(Number.isFinite);return{min:Math.min(...vals),max:Math.max(...vals)}};
 const setChapterRef=(book,chapter)=>{const safe=Number.isFinite(Number(chapter))?Number(chapter):1;if($("#bRef"))$("#bRef").value=`${book} ${safe}`;if($("#bChapterTitle"))$("#bChapterTitle").textContent=`${book} ${safe}`;if($("#bChapter"))$("#bChapter").value=String(safe);if($("#bVerse"))$("#bVerse").value="";bxV158UpdateMode()};
 const bxLocalKey=(kind,ref)=>`logos-bx:${kind}:${ref}`;
 let bxActiveVerse=null;
 const bxLoadLocal=(kind,ref,fallback="")=>{try{return localStorage.getItem(bxLocalKey(kind,ref))??fallback}catch(_){return fallback}};
 const bxSaveLocal=(kind,ref,val)=>{try{localStorage.setItem(bxLocalKey(kind,ref),val);return true}catch(_){return false}};

 const bxServerResourcesStatus=async()=>{try{const r=await fetch("/api/bible/resources/status",{cache:"no-store"});return r.ok?await r.json():null}catch{return null}};
 const bxServerCrossrefs=async(v)=>{if(!v?.bookCode)return[];try{const r=await bxFetch(`/api/bible/crossrefs?book=${encodeURIComponent(v.bookCode)}&chapter=${v.chapter}&verse=${v.verse}&limit=100`);if(!r.ok)return[];const j=await r.json();return j.items||[]}catch{return[]}};
 const bxServerNave=async(v)=>{if(!v?.bookCode)return[];try{const r=await bxFetch(`/api/bible/nave?book=${encodeURIComponent(v.bookCode)}&chapter=${v.chapter}&verse=${v.verse}&limit=40`);if(!r.ok)return[];const j=await r.json();return j.items||[]}catch{return[]}};
 const bxCrossSeed={
  "João 3:16":["Romanos 5:8","1 João 4:9-10","Romanos 8:32","João 3:17","João 1:14"],
  "João 4:1":["João 3:22","João 3:26","João 4:2"],
  "João 4:2":["1 Coríntios 1:14-17","João 3:22"],
  "Romanos 8:28":["Gênesis 50:20","Efésios 1:11","Romanos 8:29-30"],
  "Isaías 6:8":["Mateus 9:37-38","Atos 13:2-3","Romanos 10:14-15"],
  "Salmos 23:1":["João 10:11","Ezequiel 34:11-12","Filipenses 4:19"],
  "Gênesis 1:1":["João 1:1-3","Colossenses 1:16-17","Hebreus 11:3"],
  "Mateus 28:19":["Marcos 16:15","Atos 1:8","Lucas 24:47-48"],
  "Atos 2:4":["Atos 1:8","Atos 2:17-18","1 Coríntios 12:7-11"]
 };
 const bxCrossListFor=async(ref)=>{
  const norm=normalizeBibleRef(ref);
  const saved=await crossBySource(norm);
  const seed=(bxCrossSeed[norm]||[]).map((target,i)=>({id:`seed:${norm}:${i}`,source:norm,target,seed:true}));
  const merged=[...saved];
  seed.forEach(x=>{if(!merged.some(y=>normalizeBibleRef(y.target).toLowerCase()===normalizeBibleRef(x.target).toLowerCase()))merged.push(x)});
  return merged;
 };
 const bxRenderCrossPanel=async(v)=>{
  if(!v)return;
  const server=await bxServerCrossrefs(v),local=await bxCrossListFor(v.ref),nave=await bxServerNave(v),status=await bxServerResourcesStatus();
  const serverRefs=server.map((x,i)=>({id:`tsk:${i}`,source:v.ref,target:x.reference,anchor:x.anchor||"",seed:false,tsk:true}));
  const rows=[...serverRefs];
  local.forEach(x=>{if(!rows.some(y=>normalizeBibleRef(y.target).toLowerCase()===normalizeBibleRef(x.target).toLowerCase()))rows.push(x)});
  const body=$("#bxVcBody");if(!body)return;
  const hasFull=(status?.counts?.crossrefs||0)>100000;
  body.innerHTML=`<div class="bx-vc-verse"><b>${escapeHtml(v.ref)}</b><span>${escapeHtml(v.text)}</span></div>
  <div class="bx-ref-tabs"><button class="active" data-ref-tab="direct">Diretas <b>${rows.length}</b></button><button data-ref-tab="topics">Temáticas <b>${nave.length}</b></button><button data-ref-tab="all">Ver todas</button></div>
  <div data-ref-pane="direct">
    
    <div class="bx-cross-functional-list">${rows.length?rows.slice(0,hasFull?100:20).map(x=>`<article><button class="bx-cross-functional-open" data-cross-ref="${escapeHtml(x.target)}"><span>↗</span><b>${escapeHtml(x.target)}</b></button><small>${x.tsk?`TSK${x.anchor?` • ${escapeHtml(x.anchor)}`:""}`:(x.seed?"base inicial":"adicionada por você")}</small></article>`).join(""):'<p class="muted">Nenhuma referência cadastrada.</p>'}</div>
    <div class="bx-cross-add-row"><input id="bxVcCrossAdd" placeholder="Ex.: Romanos 5:8"><button id="bxVcCrossSave">+ Adicionar</button></div>
  </div>
  <div data-ref-pane="topics" hidden><div class="bx-nave-list">${nave.length?nave.map(x=>`<article><b>🏷️ ${escapeHtml(x.topic)}</b>${x.section?`<em>${escapeHtml(x.section)}</em>`:""}<small>${escapeHtml(x.summary||"Tema bíblico relacionado a esta passagem.")}</small></article>`).join(""):'<p class="muted">Nenhum tema relacionado encontrado para este versículo.</p>'}</div></div>
  <div data-ref-pane="all" hidden><div class="bx-ref-summary"><b>Base de estudo</b><p>Referências diretas: ${rows.length} • Tópicos Nave: ${nave.length}</p><p>${hasFull?"TSK: pré-instalado e offline.":"TSK: pré-instalado no sistema."} Nave: incorporado ao pacote.</p></div></div>`;
  body.querySelectorAll("[data-ref-tab]").forEach(b=>b.onclick=()=>{body.querySelectorAll("[data-ref-tab]").forEach(x=>x.classList.toggle("active",x===b));body.querySelectorAll("[data-ref-pane]").forEach(p=>p.hidden=p.dataset.refPane!==b.dataset.refTab)});
  body.querySelectorAll("[data-cross-ref]").forEach(b=>b.onclick=async()=>{const ref=b.dataset.crossRef;try{const rr=await smartBibleRef(ref);if(!rr.length)return;current=rr;if($("#bRef"))$("#bRef").value=ref;renderBibleVerses(rr);$("#bxVerseContext").hidden=true;$("#bOut")?.scrollIntoView({behavior:"smooth",block:"start"})}catch(e){$("#bxVcStatus").textContent="Não foi possível abrir "+ref}});
  $("#bxVcCrossSave")?.addEventListener("click",async()=>{const target=normalizeBibleRef($("#bxVcCrossAdd")?.value);if(!target)return;await crossPut(v.ref,target);$("#bxVcStatus").textContent="✓ Referência adicionada";await bxRenderCrossPanel(v)});
 };
 const verseTools={
 cross:["🔗","Referências Cruzadas",["Referências diretas","Paralelos bíblicos","Cadeia bíblica"]],
 strong:["🇬🇷🇮🇱","Strong",["Hebraico / Grego","Número Strong","Morfologia"]],
 lexicon:["📚","Léxico",["Definição","Raiz e transliteração","Ocorrências"]],
 context:["🧭","Contexto",["Histórico","Literário","Cultural / geográfico"]],
 comments:["💬","Comentários",["Exegético","Hermenêutico","Apologético","Temático","Pastoral"]],
 media:["🎥","Mídia X",["Imagens","Vídeos","Mapas / vista virtual","Áudio"]],
 dna:["🧬","DNA K7",["Estrutura","Progressão","Aplicações","Studio X"]]
 };
 const bxTokenizeVerse=(text)=>String(text||"").split(/(\s+|[.,;:!?()[\]“”"'—–-]+)/).filter(x=>x&&x.trim()&&!/^[\s.,;:!?()[\]“”"'—–-]+$/.test(x));
 const bxNaveTopicPt=(raw)=>{
  const s=String(raw||"").trim();
  const key=s.toLowerCase().replace(/[’']/g,"'").replace(/\s+/g," ");
  const map={
    "bethany":"Betânia","hospitality":"Hospitalidade","lazarus":"Lázaro",
    "catholicity":"Universalidade da Igreja","peace":"Paz","faith":"Fé","prayer":"Oração",
    "salvation":"Salvação","grace":"Graça","love":"Amor","hope":"Esperança",
    "repentance":"Arrependimento","forgiveness":"Perdão","resurrection":"Ressurreição",
    "holy spirit":"Espírito Santo","spirit, holy":"Espírito Santo",
    "jesus, the christ":"Jesus, o Cristo","jesus christ":"Jesus Cristo","christ":"Cristo",
    "god":"Deus","kingdom of god":"Reino de Deus","kingdom":"Reino","church":"Igreja",
    "gospel":"Evangelho","sin":"Pecado","righteousness":"Justiça","eternal life":"Vida eterna",
    "disciples":"Discípulos","disciple":"Discípulo","baptism":"Batismo","worship":"Adoração",
    "obedience":"Obediência","wisdom":"Sabedoria","holiness":"Santidade","mercy":"Misericórdia",
    "judgment":"Juízo","covenant":"Aliança","prophecy":"Profecia","mission":"Missão",
    "missions":"Missões","apostles":"Apóstolos","apostle":"Apóstolo","angel":"Anjo",
    "angels":"Anjos","heaven":"Céu","hell":"Inferno","death":"Morte","life":"Vida",
    "truth":"Verdade","light":"Luz","darkness":"Trevas","miracles":"Milagres",
    "miracle":"Milagre","healing":"Cura","sickness":"Enfermidade","suffering":"Sofrimento",
    "temptation":"Tentação","satan":"Satanás","devil":"Diabo","demons":"Demônios",
    "creation":"Criação","creator":"Criador","law":"Lei","commandments":"Mandamentos",
    "sabbath":"Sábado","passover":"Páscoa","temple":"Templo","priest":"Sacerdote",
    "priests":"Sacerdotes","prophet":"Profeta","prophets":"Profetas","king":"Rei",
    "kings":"Reis","israel":"Israel","jerusalem":"Jerusalém","bethlehem":"Belém",
    "nazareth":"Nazaré","galilee":"Galileia","jordan":"Jordão","egypt":"Egito",
    "moses":"Moisés","abraham":"Abraão","isaac":"Isaque","jacob":"Jacó","joseph":"José",
    "david":"Davi","solomon":"Salomão","elijah":"Elias","elisha":"Eliseu","isaiah":"Isaías",
    "jeremiah":"Jeremias","daniel":"Daniel","peter":"Pedro","paul":"Paulo","john":"João",
    "mary":"Maria","martha":"Marta","nicodemus":"Nicodemos","zacchaeus":"Zaqueu",
    "pharisees":"Fariseus","sadducees":"Saduceus","gentiles":"Gentios","jews":"Judeus",
    "children":"Crianças","family":"Família","marriage":"Casamento","husband":"Marido",
    "wife":"Esposa","father":"Pai","mother":"Mãe","brother":"Irmão","brethren":"Irmãos",
    "neighbor":"Próximo","poor":"Pobres","rich":"Ricos","money":"Dinheiro",
    "giving":"Contribuição","charity":"Caridade","compassion":"Compaixão","humility":"Humildade",
    "pride":"Orgulho","anger":"Ira","fear":"Temor","courage":"Coragem","joy":"Alegria",
    "patience":"Paciência","perseverance":"Perseverança","thanksgiving":"Ação de graças",
    "praise":"Louvor","fasting":"Jejum","word of god":"Palavra de Deus","scriptures":"Escrituras",
    "bible":"Bíblia","parable":"Parábola","parables":"Parábolas","cross":"Cruz",
    "crucifixion":"Crucificação","atonement":"Expiação","redemption":"Redenção",
    "justification":"Justificação","sanctification":"Santificação","new birth":"Novo nascimento",
    "regeneration":"Regeneração","second coming":"Segunda vinda","ascension":"Ascensão",
    "pentecost":"Pentecostes","communion":"Comunhão","lord's supper":"Ceia do Senhor",
    "evangelism":"Evangelização","ministry":"Ministério","service":"Serviço",
    "servant":"Servo","shepherd":"Pastor","sheep":"Ovelhas","vine":"Videira",
    "bread":"Pão","water":"Água","blood":"Sangue","spirit":"Espírito","soul":"Alma",
    "body":"Corpo","flesh":"Carne","world":"Mundo","enemy":"Inimigo","enemies":"Inimigos",
    "friend":"Amigo","friends":"Amigos","unity":"Unidade","fellowship":"Comunhão",
    "promise":"Promessa","promises":"Promessas","blessing":"Bênção","blessings":"Bênçãos"
  };
  return map[key]||s;
};
 const bxRenderCommentaryPanel=async(v)=>{
  const ref=String(v?.ref||v?.reference||"").trim();
  if(!ref) return;
  const host=document.querySelector("#bxVerseToolPanel")||document.querySelector(".bx-verse-tool-panel");
  if(!host) return;
  host.innerHTML=`<div class="bx-tool-loading">Carregando comentário bíblico…</div>`;
  try{
    const verse=await bxGetVerseByRef(ref);
    const refs=await bxGetCrossRefs(ref).catch(()=>[]);
    const topics=await bxGetNaveTopics(ref).catch(()=>[]);
    const strong=await bxGetStrongVerse(ref).catch(()=>[]);
    const neighbors=await bxGetVerseNeighbors(ref).catch(()=>({}));
    const refchips=(refs||[]).slice(0,12).map(x=>`<span>${escapeHtml(x.ref||x.reference||String(x))}</span>`).join("");
    const topicchips=(topics||[]).slice(0,10).map(x=>`<span>${escapeHtml(bxNaveTopicPt(x.topic||x.name||String(x)))}</span>`).join("");
    const strongCount=Array.isArray(strong)?strong.length:0;
    host.innerHTML=`
      <section class="bx-commentary">
        <header><div><small>💬 COMENTÁRIOS</small><h3>Comentário • ${escapeHtml(ref)}</h3></div><button type="button" onclick="this.closest('.bx-commentary').parentElement.innerHTML=''">×</button></header>
        <div class="bx-commentary-verse"><b>${escapeHtml(ref)}</b><p>${escapeHtml(verse?.text||v?.text||"")}</p></div>
        <div class="bx-commentary-card">
          <h4>📖 Leitura contextual</h4>
          <p>Leia o versículo dentro do fluxo imediato do capítulo. Os textos vizinhos abaixo ajudam a observar continuidade, contraste e progressão sem retirar a passagem do contexto.</p>
          <div class="bx-commentary-neighbors">
            ${neighbors?.previous?`<div><small>Anterior</small><b>${escapeHtml(neighbors.previous.ref||"")}</b><p>${escapeHtml(neighbors.previous.text||"")}</p></div>`:""}
            ${neighbors?.next?`<div><small>Próximo</small><b>${escapeHtml(neighbors.next.ref||"")}</b><p>${escapeHtml(neighbors.next.text||"")}</p></div>`:""}
          </div>
        </div>
        <div class="bx-commentary-grid">
          <div class="bx-commentary-card"><h4>🔗 Escritura relacionada</h4><p>${(refs||[]).length} relações TSK disponíveis.</p><div class="bx-commentary-chips">${refchips||"<em>Nenhuma referência carregada.</em>"}</div></div>
          <div class="bx-commentary-card"><h4>🏷️ Temas bíblicos</h4><p>Tópicos Nave associados à passagem.</p><div class="bx-commentary-chips">${topicchips||"<em>Nenhum tópico carregado.</em>"}</div></div>
          <div class="bx-commentary-card"><h4>🔤 Camada lexical</h4><p>${strongCount} marcações Strong vinculadas à referência. Use o botão Strong para examinar lema, transliteração e definição.</p></div>
          <div class="bx-commentary-card"><h4>🛡️ Critério editorial</h4><p>Esta camada não inventa autoria, data, arqueologia ou interpretação. Comentários históricos/exegéticos completos serão adicionados somente a partir de fontes livres ou devidamente licenciadas e identificadas.</p></div>
        </div>
        <footer>Comentário estrutural gerado exclusivamente a partir das bases integradas Bíblia X + TSK + Nave + Strong.</footer>
      </section>`;
  }catch(e){
    host.innerHTML=`<div class="bx-tool-error">Não foi possível carregar o comentário desta passagem.</div>`;
  }
 };
 const bxRenderCommentsPanel=async(v)=>{
  const body=$("#bxVcBody");if(!body||!v)return;
  body.innerHTML=`<div class="bx-vc-verse"><b>${escapeHtml(v.ref)}</b><span>${escapeHtml(v.text)}</span></div>
   <div class="bx-comments-live-head"><div><b>💬 Comentários Bíblicos</b><small>Carregando fontes e bancos integrados...</small></div></div>
   <div class="bx-strong-result"><b>Carregando...</b></div>`;
  try{
    const [classicR,contextR,strongR]=await Promise.all([
      bxFetch(`/api/bible/commentary/classic?book=${encodeURIComponent(v.bookCode)}&chapter=${v.chapter}&verse=${v.verse}`).catch(()=>null),
      bxFetch(`/api/bible/context?translation=${encodeURIComponent(selectedTranslation())}&book=${encodeURIComponent(v.bookCode)}&chapter=${v.chapter}&verse=${v.verse}`).catch(()=>null),
      bxFetch(`/api/bible/strong?translation=${encodeURIComponent(selectedTranslation())}&book=${encodeURIComponent(v.bookCode)}&chapter=${v.chapter}&verse=${v.verse}`).catch(()=>null)
    ]);
    const classic=classicR&&classicR.ok?await classicR.json():{ok:false,content_original:"",outline:[]};
    const ctx=contextR&&contextR.ok?await contextR.json():{};
    const strong=strongR&&strongR.ok?await strongR.json():{words:[]};
    const refs=ctx.crossrefs||[],topics=ctx.topics||[],words=(strong.words||[]).filter(x=>x.strong);
    const sourceOriginal=String(classic.content_original||"").trim();
    const sourceText=String(classic.content_pt||classic.content_original||"").trim();
    const sourcePreview=sourceText?sourceText.split(/\n+/).slice(0,4).join("\n\n"):"";
    const outlineDisplay=(classic.outline_pt&&classic.outline_pt.length)?classic.outline_pt:(classic.outline||[]);
    const cards=[
      ["exegetico","🔎","Exegético","Texto + Strong + referências TSK"],
      ["hermeneutico","📐","Hermenêutico","Contexto imediato + fonte clássica"],
      ["apologetico","🛡️","Apologético","Relações bíblicas e coerência textual"],
      ["tematico","🏷️","Temático","Tópicos Nave associados à passagem"],
      ["pastoral","❤️","Pastoral","Aplicação devocional da fonte clássica"]
    ];
    const aiExperts=[
      ["textual","📖","Textual","Explica exatamente o sentido e a construção do texto, observando o que a passagem afirma antes de aplicar."],
      ["exegetico-ai","🔎","Exegético IA","Analisa originais, gramática, Strong, léxico e relações sintáticas com prudência."],
      ["teologico","🧭","Teológico","Identifica doutrinas e implicações teológicas que realmente nascem da passagem."],
      ["historico-cultural","🏺","Histórico-Cultural","Examina época, costumes, sociedade, cultura e ambiente histórico relevantes."],
      ["apologetico-ai","🛡️","Apologético IA","Examina dificuldades, objeções e respostas responsáveis sem inventar evidências."],
      ["biblico-comparativo","🔗","Bíblico-Comparativo","Compara Escritura com Escritura, paralelos e referências relacionadas."],
      ["aplicacao","💡","Aplicação","Transforma princípios do texto em aplicações práticas responsáveis para hoje."],
      ["homiletico","🎙️","Homilético","Organiza material para pregação, movimentos, transições, clímax e esboço."],
      ["pentecostal","🔥","Pentecostal","Interpreta e aplica a passagem em perspectiva pentecostal com base bíblica e sem exageros."],
      ["dna-k7","🧬","DNA K7","Analisa a passagem segundo a estrutura e progressão exclusiva do LOGOS MASTER X."],
      ["hermeneutico-ai","📐","Hermenêutico IA","Aplica princípios corretos de interpretação, gênero, contexto e distância cultural."],
      ["cristocentrico","✝️","Cristocêntrico","Mostra relações responsáveis com Cristo e o plano redentor sem forçar alegorias."],
      ["geo-arqueologico","🗺️","Geográfico-Arqueológico","Examina lugares, rotas, território e arqueologia apenas quando pertinentes e verificáveis."],
      ["doutrinario","📚","Doutrinário","Organiza as doutrinas relacionadas ao texto e distingue afirmações centrais de secundárias."],
      ["didatico","🎓","Didático","Explica a passagem de modo pedagógico, progressivo e adequado para ensino/EBD."]
    ];
    body.innerHTML=`<div class="bx-vc-verse"><b>${escapeHtml(v.ref)}</b><span>${escapeHtml(v.text)}</span></div>
      <div class="bx-comments-live-head"><div><b>💬 Comentários Bíblicos</b><small>5 leituras vinculadas à passagem</small></div><span>${classic.ok?"Fonte clássica online":"Fonte clássica indisponível"}</span></div>
      <div class="bx-comments-live-tabs">${cards.map((c,i)=>`<button class="${i===0?"active":""}" data-comment-view="${c[0]}"><b>${c[1]} ${c[2]}</b><small>${c[3]}</small></button>`).join("")}</div>
      <div id="bxCommentsLiveDetail" class="bx-comments-live-detail"></div>
      <section class="bx-ai-commentaries">
        <div class="bx-ai-comment-head">
          <div><span>🤖 COMENTÁRIOS IA</span><h4>15 especialistas da Bíblia X</h4><p>Escolha uma perspectiva. A análise só consome IA quando você clicar em <b>Gerar análise IA</b>.</p></div>
        </div>
        <div class="bx-ai-expert-grid">${aiExperts.map((x,i)=>`<button class="${i===1?"active":""}" data-ai-comment="${x[0]}"><span>${x[1]}</span><b>${x[2]}</b><small>${x[3]}</small></button>`).join("")}</div>
        <div id="bxAiExpertPanel" class="bx-ai-expert-panel"></div>
      </section>
      <details class="bx-comment-source"${sourceText?"":" hidden"}><summary>📚 Fonte clássica original</summary><div><b>${escapeHtml(classic.source||"Matthew Henry")}</b><small>${escapeHtml(classic.range?`Versos ${classic.range}`:"")} • ${escapeHtml(classic.license||"")}</small><p>${escapeHtml(sourceOriginal||sourcePreview)}</p></div></details>`;
    const detail=$("#bxCommentsLiveDetail");
    const render=(mode)=>{
      body.querySelectorAll("[data-comment-view]").forEach(x=>x.classList.toggle("active",x.dataset.commentView===mode));
      if(mode==="exegetico"){
        const uniq=[];const seen=new Set();words.forEach(x=>{const n=String(x.strong||"").split(/\s+/)[0];if(n&&!seen.has(n)){seen.add(n);uniq.push(x)}});
        detail.innerHTML=`<section><h4>🔎 Comentário Exegético</h4><p>Esta leitura parte dos dados objetivos já ligados ao versículo.</p>
          <div class="bx-comment-facts"><span><b>${uniq.length}</b> entradas Strong</span><span><b>${refs.length}</b> referências TSK</span><span><b>${topics.length}</b> temas Nave</span></div>
          ${uniq.length?`<div class="bx-comment-lex">${uniq.slice(0,10).map(x=>`<span><b>${escapeHtml(String(x.strong).split(/\s+/)[0])}</b> ${escapeHtml(x.lexicon_lemma||x.lemma||"")} ${x.transliteration?`<small>${escapeHtml(x.transliteration)}</small>`:""}</span>`).join("")}</div>`:""}
          ${sourceText?`<blockquote><b>Fonte clássica:</b> ${escapeHtml(sourcePreview)}</blockquote>`:""}
          <small class="bx-comment-method">Sem inventar gramática, autoria ou história além das fontes carregadas.</small></section>`;
      }else if(mode==="hermeneutico"){
        const prev=ctx.neighbors?.previous,next=ctx.neighbors?.next;
        detail.innerHTML=`<section><h4>📐 Comentário Hermenêutico</h4><p>Leia a unidade do texto no fluxo do capítulo e compare a passagem com a seção clássica correspondente.</p>
          <div class="bx-comment-neighbor">${prev?`<div><small>Anterior</small><b>${escapeHtml(`${v.book} ${v.chapter}:${prev.verse}`)}</b><p>${escapeHtml(prev.text)}</p></div>`:""}${next?`<div><small>Próximo</small><b>${escapeHtml(`${v.book} ${v.chapter}:${next.verse}`)}</b><p>${escapeHtml(next.text)}</p></div>`:""}</div>
          ${outlineDisplay.length?`<div class="bx-comment-outline"><b>Estrutura do capítulo na fonte clássica</b>${outlineDisplay.map(x=>`<span>${escapeHtml(x)}</span>`).join("")}</div>`:""}
          ${sourceText?`<blockquote>${escapeHtml(sourcePreview)}</blockquote>`:"<p>Fonte clássica não disponível neste momento.</p>"}</section>`;
      }else if(mode==="apologetico"){
        detail.innerHTML=`<section><h4>🛡️ Comentário Apologético</h4><p>Este painel reúne textos bíblicos relacionados para examinar a passagem por comparação interna das Escrituras.</p>
          <div class="bx-comment-refchips">${refs.length?refs.slice(0,16).map(x=>`<button data-comment-ref="${escapeHtml(x.reference)}">${escapeHtml(x.reference)}</button>`).join(""):"<span>Nenhuma referência carregada.</span>"}</div>
          <small class="bx-comment-method">A Bíblia X não transforma ausência de evidência em afirmação apologética. O painel mostra as relações disponíveis para estudo.</small></section>`;
      }else if(mode==="tematico"){
        detail.innerHTML=`<section><h4>🏷️ Comentário Temático</h4><p>Temas relacionados à passagem segundo a base Nave.</p>
          <div class="bx-comment-topicchips">${topics.length?topics.map(x=>`<span>${escapeHtml(bxNaveTopicPt(x.topic))}</span>`).join(""):"<span>Nenhum tema localizado.</span>"}</div>
          ${refs.length?`<div class="bx-comment-refchips">${refs.slice(0,10).map(x=>`<button data-comment-ref="${escapeHtml(x.reference)}">${escapeHtml(x.reference)}</button>`).join("")}</div>`:""}</section>`;
      }else{
        detail.innerHTML=`<section><h4>❤️ Comentário Pastoral</h4>${sourceText?`<p>Fonte clássica vinculada à seção que contém este versículo:</p><blockquote>${escapeHtml(sourcePreview)}</blockquote>`:"<p>Fonte clássica indisponível no momento.</p>"}
          <p class="bx-comment-pastoral-note">A aplicação pastoral deve nascer do texto, do contexto e das relações bíblicas exibidas acima; o sistema não atribui frases a autores que não estejam na fonte.</p>
          <button class="btn secondary" data-comment-studio>⚡ Levar passagem ao Studio X</button></section>`;
      }
      detail.querySelectorAll("[data-comment-ref]").forEach(btn=>btn.onclick=async()=>{const ref=btn.dataset.commentRef;try{const rr=await smartBibleRef(ref);if(!rr.length)return;current=rr;if($("#bRef"))$("#bRef").value=ref;renderBibleVerses(rr);$("#bxVerseContext").hidden=true;$("#bOut")?.scrollIntoView({behavior:"smooth",block:"start"})}catch(_){}});
      detail.querySelector("[data-comment-studio]")?.addEventListener("click",()=>{current=[v];if($("#bRef"))$("#bRef").value=v.ref;sendStudio()});
    };
    body.querySelectorAll("[data-comment-view]").forEach(btn=>btn.onclick=()=>render(btn.dataset.commentView));

    const aiPanel=$("#bxAiExpertPanel");
    const aiCommentStoreKey="bibleXAiCommentsV1";
    const aiCommentAll=()=>Store.get(aiCommentStoreKey,{})||{};
    const aiCommentId=(ref,expert,mode)=>`${ref}|||${expert}|||${mode}`;
    const aiCommentGet=(ref,expert,mode)=>aiCommentAll()[aiCommentId(ref,expert,mode)]||null;
    const aiCommentSave=(ref,expert,mode,data)=>{
      const all=aiCommentAll();
      const id=aiCommentId(ref,expert,mode);
      const history=Array.isArray(all[id]?.history)?all[id].history:[];
      if(all[id]?.text)history.unshift({text:all[id].text,created:all[id].created,provider:all[id].provider,model:all[id].model});
      all[id]={...data,history:history.slice(0,5)};
      Store.set(aiCommentStoreKey,all);
      return all[id];
    };
    const aiCommentRenderSaved=(expert,mode,item)=>{
      if(!item)return "";
      const when=item.created?new Date(item.created).toLocaleString("pt-BR"):"";
      return `<div class="bx-ai-saved-head"><span>💾 Salvo automaticamente${when?` • ${escapeHtml(when)}`:""}</span><div><button class="btn secondary" data-ai-reread="${mode}">👁 Reler salvo</button><button class="btn primary" data-ai-regenerate="${mode}">✨ Gerar outro</button></div></div><div class="bx-ai-saved-body">${item.html||`<p>${escapeHtml(item.text||"")}</p>`}</div>`;
    };
    const selectAiExpert=(key)=>{
      const expert=aiExperts.find(x=>x[0]===key)||aiExperts[1];
      body.querySelectorAll("[data-ai-comment]").forEach(x=>x.classList.toggle("active",x.dataset.aiComment===expert[0]));
      const savedBrief=aiCommentGet(v.ref,expert[0],"brief"),savedTopics=aiCommentGet(v.ref,expert[0],"topics");
      aiPanel.innerHTML=`<div class="bx-ai-expert-intro"><div><span>${expert[1]}</span><div><b>${escapeHtml(expert[2])}</b><p>${escapeHtml(expert[3])}</p></div></div><div class="bx-ai-fast-actions"><button class="btn primary" id="bxGenerateAiCommentBrief">${savedBrief?"👁 Resumo salvo":"⚡ Resumo curto"}</button><button class="btn secondary" id="bxGenerateAiCommentTopics">${savedTopics?"👁 Tópicos salvos":"• Tópicos rápidos"}</button></div></div><div id="bxAiExpertOutput" class="bx-ai-expert-output">${savedBrief?aiCommentRenderSaved(expert,"brief",savedBrief):savedTopics?aiCommentRenderSaved(expert,"topics",savedTopics):'<small>Escolha <b>Resumo curto</b> ou <b>Tópicos rápidos</b>. O resultado será salvo automaticamente por versículo.</small>'}</div>`;
      const runAiExpert=async(mode)=>{
        const brief=mode==="brief";
        const btn=brief?$("#bxGenerateAiCommentBrief"):$("#bxGenerateAiCommentTopics");
        const other=brief?$("#bxGenerateAiCommentTopics"):$("#bxGenerateAiCommentBrief");
        const out=$("#bxAiExpertOutput");
        if(!btn||!out)return;
        btn.disabled=true;if(other)other.disabled=true;
        btn.textContent=brief?"⏳ Resumindo...":"⏳ Criando tópicos...";
        out.innerHTML='<div class="bx-tool-loading">Gerando complemento bíblico curto...</div>';
        try{
          const formatRule=brief
            ? `FORMATO OBRIGATÓRIO: 4 a 6 linhas curtas, em no máximo 2 pequenos parágrafos. Máximo absoluto: 120 palavras.`
            : `FORMATO OBRIGATÓRIO: 4 a 6 tópicos curtos. Cada tópico com no máximo 1 ou 2 linhas. Máximo absoluto: 140 palavras.`;
          const notes=`BÍBLIA X — COMPLEMENTO IA CURTO
Especialista: ${expert[2]}
Objetivo: ${expert[3]}
Passagem: ${v.ref}
Texto: ${v.text}

${formatRule}

REGRAS:
- complemente apenas o versículo que o leitor já está vendo;
- NÃO gere sermão, introdução, conclusão, clímax, apelo ou oração;
- NÃO repita o texto inteiro;
- NÃO use estrutura de Studio X;
- texto bíblico é o eixo;
- não invente história, arqueologia, hebraico/grego ou citações;
- quando algo exigir confirmação, escreva “confirmar em fonte”;
- português brasileiro direto e claro.`;

          const controller=new AbortController();
          const timer=setTimeout(()=>controller.abort(),36000);
          const rr=await fetch("/api/bible-comment-ai",{
            method:"POST",
            headers:{"Content-Type":"application/json"},
            cache:"no-store",
            signal:controller.signal,
            body:JSON.stringify({
              reference:v.ref,
              verse_text:v.text,
              expert:expert[2],
              objective:expert[3],
              format:brief?"brief":"topics"
            })
          });
          clearTimeout(timer);
          const r=await rr.json().catch(()=>({}));
          if(!rr.ok)throw new Error(r.detail||"Falha no comentário IA curto");
          const rendered=renderGeneratedMessage(r.text,{
            command:`${expert[1]} ${expert[2].toUpperCase()} — ${brief?"RESUMO CURTO":"TÓPICOS RÁPIDOS"}`,
            intensity:2,
            provider:r.provider||"",
            seconds:r.seconds,
            quality:null,
            duration:1
          });
          out.innerHTML=rendered;
          aiCommentSave(v.ref,expert[0],brief?"brief":"topics",{
            text:r.text,
            html:rendered,
            created:new Date().toISOString(),
            provider:r.provider||r.engine||"",
            model:r.model||""
          });
        }catch(e){
          out.innerHTML=`<div class="bx-tool-error">Falha ao gerar complemento: ${escapeHtml(e.message||String(e))}</div>`;
        }finally{
          if(btn)btn.disabled=false;if(other)other.disabled=false;
          const b1=$("#bxGenerateAiCommentBrief"),b2=$("#bxGenerateAiCommentTopics");
          if(b1)b1.textContent="⚡ Resumo curto";
          if(b2)b2.textContent="• Tópicos rápidos";
        }
      };
      const showSaved=(mode)=>{
        const item=aiCommentGet(v.ref,expert[0],mode);
        if(!item)return false;
        const out=$("#bxAiExpertOutput");
        if(out)out.innerHTML=aiCommentRenderSaved(expert,mode,item);
        return true;
      };
      $("#bxGenerateAiCommentBrief")?.addEventListener("click",()=>{if(!showSaved("brief"))runAiExpert("brief")});
      $("#bxGenerateAiCommentTopics")?.addEventListener("click",()=>{if(!showSaved("topics"))runAiExpert("topics")});
      aiPanel.addEventListener("click",e=>{
        const reread=e.target.closest?.("[data-ai-reread]");
        if(reread){showSaved(reread.dataset.aiReread);return}
        const regen=e.target.closest?.("[data-ai-regenerate]");
        if(regen){runAiExpert(regen.dataset.aiRegenerate);return}
      });
    };
    body.querySelectorAll("[data-ai-comment]").forEach(btn=>btn.onclick=()=>selectAiExpert(btn.dataset.aiComment));
    selectAiExpert("exegetico-ai");
    render("exegetico");
  }catch(e){
    body.querySelector(".bx-strong-result").innerHTML=`<b>Falha ao carregar comentários.</b><p>${escapeHtml(e.message||"")}</p>`;
  }
 };
 const bxRenderContextPanel=async(v)=>{
  const body=$("#bxVcBody");if(!body||!v)return;
  body.innerHTML=`<div class="bx-vc-verse"><b>${escapeHtml(v.ref)}</b><span>${escapeHtml(v.text)}</span></div>
   <div class="bx-context-head"><div><b>🧭 Contexto da passagem</b><small>Carregando contexto estrutural...</small></div></div>
   <div class="bx-strong-result"><b>Carregando...</b></div>`;
  try{
    const r=await bxFetch(`/api/bible/context?translation=${encodeURIComponent(selectedTranslation())}&book=${encodeURIComponent(v.bookCode)}&chapter=${v.chapter}&verse=${v.verse}`);
    const j=await r.json();
    const topics=j.topics||[],refs=j.crossrefs||[],prev=j.neighbors?.previous,next=j.neighbors?.next;
    body.innerHTML=`<div class="bx-vc-verse"><b>${escapeHtml(v.ref)}</b><span>${escapeHtml(v.text)}</span></div>
      <div class="bx-context-head"><div><b>🧭 Contexto da passagem</b><small>${escapeHtml(j.book?.testament||"")} • livro ${escapeHtml(String(j.book?.canonical_order||""))} da ordem canônica</small></div></div>
      <div class="bx-context-grid">
        <div><small>Livro</small><b>${escapeHtml(j.book?.name_pt||v.book)}</b><span>${escapeHtml(String(j.book?.chapters||0))} capítulos</span></div>
        <div><small>Capítulo</small><b>${escapeHtml(String(j.passage?.chapter||v.chapter))}</b><span>${escapeHtml(String(j.passage?.chapter_verse_count||0))} versículos</span></div>
        <div><small>Strong</small><b>${escapeHtml(String(j.strong?.unique_entries||0))} entradas</b><span>${escapeHtml(String(j.strong?.word_markers||0))} marcações</span></div>
        <div><small>Referências</small><b>${refs.length}</b><span>relações principais carregadas</span></div>
      </div>
      <div class="bx-context-section">
        <div class="bx-context-section-title"><b>📖 Contexto imediato</b><small>Versículos vizinhos</small></div>
        <div class="bx-context-neighbors">
          ${prev?`<button data-context-ref="${escapeHtml(`${v.book} ${v.chapter}:${prev.verse}`)}"><small>Anterior</small><b>${escapeHtml(`${v.book} ${v.chapter}:${prev.verse}`)}</b><span>${escapeHtml(prev.text)}</span></button>`:""}
          ${next?`<button data-context-ref="${escapeHtml(`${v.book} ${v.chapter}:${next.verse}`)}"><small>Próximo</small><b>${escapeHtml(`${v.book} ${v.chapter}:${next.verse}`)}</b><span>${escapeHtml(next.text)}</span></button>`:""}
        </div>
      </div>
      <div class="bx-context-section">
        <div class="bx-context-section-title"><b>🏷️ Temas relacionados</b><small>Nave</small></div>
        <div class="bx-context-tags">${topics.length?topics.map(x=>`<span title="${escapeHtml(x.topic||"")}">${escapeHtml(bxNaveTopicPt(x.topic))}</span>`).join(""):'<span>Nenhum tema localizado</span>'}</div>
      </div>
      <div class="bx-context-section">
        <div class="bx-context-section-title"><b>🔗 Referências principais</b><small>TSK</small></div>
        <div class="bx-context-refs">${refs.length?refs.map(x=>`<button data-context-ref="${escapeHtml(x.reference)}">${escapeHtml(x.reference)}</button>`).join(""):"<span>Nenhuma referência localizada</span>"}</div>
      </div>
      <div class="bx-context-source">${escapeHtml(j.source_note||"")}</div>`;
    body.querySelectorAll("[data-context-ref]").forEach(btn=>btn.onclick=async()=>{
      const ref=btn.dataset.contextRef;
      try{
        const rr=await smartBibleRef(ref);
        if(!rr.length)return;
        current=rr;if($("#bRef"))$("#bRef").value=ref;
        renderBibleVerses(rr);$("#bxVerseContext").hidden=true;
        $("#bOut")?.scrollIntoView({behavior:"smooth",block:"start"});
      }catch(_){}
    });
  }catch(e){
    body.querySelector(".bx-strong-result").innerHTML=`<b>Falha ao carregar contexto.</b><p>${escapeHtml(e.message||"")}</p>`;
  }
 };
 const bxRenderLexiconPanel=async(v)=>{
  const body=$("#bxVcBody");if(!body||!v)return;
  body.innerHTML=`<div class="bx-vc-verse"><b>${escapeHtml(v.ref)}</b><span>${escapeHtml(v.text)}</span></div>
   <div class="bx-lex-head"><div><b>📚 Léxico bíblico</b><small>Selecione uma entrada Strong ligada a esta referência</small></div></div>
   <div class="bx-strong-result"><b>Carregando entradas...</b></div>`;
  try{
    const r=await bxFetch(`/api/bible/strong?translation=${encodeURIComponent(selectedTranslation())}&book=${encodeURIComponent(v.bookCode)}&chapter=${v.chapter}&verse=${v.verse}`);
    if(!r.ok)throw new Error("Léxico indisponível");
    const j=await r.json(),words=(j.words||[]).filter(x=>x.strong);
    const uniq=[];const seen=new Set();
    words.forEach(x=>{const n=String(x.strong||"").split(/\s+/)[0];if(n&&!seen.has(n)){seen.add(n);uniq.push({...x,strongNumber:n})}});
    if(!uniq.length){body.querySelector(".bx-strong-result").innerHTML="<b>Nenhuma entrada lexical disponível para esta referência.</b>";return}
    body.innerHTML=`<div class="bx-vc-verse"><b>${escapeHtml(v.ref)}</b><span>${escapeHtml(v.text)}</span></div>
     <div class="bx-lex-head"><div><b>📚 Léxico bíblico</b><small>${uniq.length} entrada(s) lexical(is) nesta referência</small></div></div>
     <div class="bx-lex-entry-list">${uniq.map((x,i)=>`<button data-lex-index="${i}"><b>${escapeHtml(x.strongNumber)}</b><span class="bx-original-script">${escapeHtml(x.lexicon_lemma||x.lemma||x.surface||"")}</span><small>${escapeHtml(x.transliteration||"")}</small></button>`).join("")}</div>
     <div id="bxLexDetail" class="bx-lex-detail"><b>Selecione uma entrada lexical.</b></div>`;
    body.querySelectorAll("[data-lex-index]").forEach(b=>b.onclick=async()=>{
      body.querySelectorAll("[data-lex-index]").forEach(x=>x.classList.toggle("active",x===b));
      const x=uniq[Number(b.dataset.lexIndex)]||{},num=x.strongNumber;
      $("#bxLexDetail").innerHTML=`<div class="bx-lex-loading">Carregando ${escapeHtml(num)}...</div>`;
      let occ=[];
      try{
        const ro=await bxFetch(`/api/bible/lexicon/occurrences?number=${encodeURIComponent(num)}&limit=60`);
        if(ro.ok)occ=(await ro.json()).items||[];
      }catch(_){}
      $("#bxLexDetail").innerHTML=`<div class="bx-strong-selected"><small>ENTRADA LEXICAL</small><h4>${escapeHtml(num)} • <span class="bx-original-script">${escapeHtml(x.lexicon_lemma||x.lemma||"—")}</span></h4></div>
       <div class="bx-strong-fields">
        <div><small>Idioma</small><b>${escapeHtml(x.language==="Hebrew"?"Hebraico":"Grego")}</b></div>
        <div><small>Transliteração</small><b>${escapeHtml(x.transliteration||"—")}</b></div>
        <div><small>Pronúncia</small><b>${escapeHtml(x.pronunciation||"—")}</b></div>
        <div><small>Morfologia nesta ocorrência</small><b>${escapeHtml(x.morph||"—")}</b></div>
       </div>
       <div class="bx-strong-definition"><small>DEFINIÇÃO ORIGINAL</small><p>${escapeHtml((x.definition||"Sem definição nesta entrada.").trim())}</p>${x.kjv_definition?`<p><b>Uso KJV:</b> ${escapeHtml(x.kjv_definition)}</p>`:""}${x.derivation?`<small>Derivação: ${escapeHtml(x.derivation.trim())}</small>`:""}</div>
       <div class="bx-lex-occ"><div class="bx-lex-occ-head"><b>Ocorrências bíblicas</b><span>${occ.length}${occ.length===60?"+":""}</span></div>
       ${occ.length?`<div class="bx-lex-occ-list">${occ.map(o=>`<button data-lex-ref="${escapeHtml(o.reference_pt)}"><b>${escapeHtml(o.reference_pt)}</b><span>${escapeHtml(o.surface||"")}</span></button>`).join("")}</div>`:"<p>Nenhuma ocorrência localizada.</p>"}</div>
       <p class="bx-strong-note">As definições lexicográficas são preservadas da fonte original. A interface e a navegação permanecem em português.</p>`;
      $("#bxLexDetail").querySelectorAll("[data-lex-ref]").forEach(btn=>btn.onclick=async()=>{const ref=btn.dataset.lexRef;try{const rr=await smartBibleRef(ref);if(!rr.length)return;current=rr;if($("#bRef"))$("#bRef").value=ref;renderBibleVerses(rr);$("#bxVerseContext").hidden=true;$("#bOut")?.scrollIntoView({behavior:"smooth",block:"start"})}catch(_){}});
    });
  }catch(e){
    body.querySelector(".bx-strong-result").innerHTML=`<b>Falha ao carregar o léxico.</b><p>${escapeHtml(e.message||"")}</p>`;
  }
 };
 const bxRenderStrongPanel=async(v)=>{
  const body=$("#bxVcBody");if(!body||!v)return;
  body.innerHTML=`<div class="bx-vc-verse"><b>${escapeHtml(v.ref)}</b><span>${escapeHtml(v.text)}</span></div>
   <div class="bx-strong-head"><div><b>🇬🇷🇮🇱 Strong real / offline</b><small>Carregando dados do idioma original...</small></div><span>Strong</span></div>
   <div class="bx-strong-result"><b>Carregando...</b></div>`;
  if(!v.bookCode){body.querySelector(".bx-strong-result").innerHTML="<b>Referência sem código de livro.</b>";return}
  try{
    const r=await bxFetch(`/api/bible/strong?translation=${encodeURIComponent(selectedTranslation())}&book=${encodeURIComponent(v.bookCode)}&chapter=${v.chapter}&verse=${v.verse}`);
    if(!r.ok)throw new Error("Strong indisponível");
    const j=await r.json(),words=(j.words||[]).filter(x=>x.strong||x.lemma||x.surface);
    if(!words.length){body.querySelector(".bx-strong-result").innerHTML="<b>Nenhum marcador Strong disponível para este versículo.</b>";return}
    body.innerHTML=`<div class="bx-vc-verse"><b>${escapeHtml(v.ref)}</b><span>${escapeHtml(v.text)}</span></div>
     <div class="bx-strong-head"><div><b>🇬🇷🇮🇱 Strong real / offline</b><small>Camada original vinculada à mesma referência bíblica</small></div><span>${words.length} palavras</span></div>
     <div class="bx-strong-source-note">O texto bíblico acima permanece em português. Abaixo mostramos diretamente os lemas gregos/hebraicos da camada Strong vinculada à mesma referência; o texto inglês da WEBP fica oculto para não confundir a leitura.</div>
     <div class="bx-strong-words">${words.map((x,i)=>`<button data-strong-index="${i}" class="${x.strong?"has-strong":""}"><span class="bx-original-script">${escapeHtml(x.lexicon_lemma||x.lemma||"?")}</span>${x.transliteration?`<em>${escapeHtml(x.transliteration)}</em>`:""}${x.strong?`<small>${escapeHtml(x.strong)}</small>`:""}</button>`).join("")}</div>
     <div class="bx-strong-result" id="bxStrongResult"><b>Selecione uma palavra acima.</b><p>Serão exibidos número Strong, lema, transliteração, pronúncia, morfologia e definição do dicionário Strong.</p></div>`;
    body.querySelectorAll("[data-strong-index]").forEach(b=>b.onclick=()=>{
      body.querySelectorAll("[data-strong-index]").forEach(x=>x.classList.toggle("active",x===b));
      const x=words[Number(b.dataset.strongIndex)]||{};
      const number=String(x.strong||"").split(/\s+/)[0]||"—";
      $("#bxStrongResult").innerHTML=`<div class="bx-strong-selected"><small>ENTRADA STRONG</small><h4><span class="bx-original-script">${escapeHtml(x.lexicon_lemma||x.lemma||"Palavra")}</span>${x.transliteration?` <span class="bx-strong-translit">(${escapeHtml(x.transliteration)})</span>`:""}${number!=="—"?` <em>${escapeHtml(number)}</em>`:""}</h4></div>
       <div class="bx-strong-fields">
        <div><small>Número Strong</small><b>${escapeHtml(number)}</b></div>
        <div><small>Idioma</small><b>${escapeHtml(x.language==="Hebrew"?"Hebraico":x.language==="Greek"?"Grego":(number.startsWith("H")?"Hebraico":"Grego"))}</b></div>
        <div><small>Lema original</small><b class="bx-original-script">${escapeHtml(x.lexicon_lemma||x.lemma||"—")}</b></div>
        <div><small>Transliteração</small><b>${escapeHtml(x.transliteration||"—")}</b></div>
        <div><small>Pronúncia</small><b>${escapeHtml(x.pronunciation||"—")}</b></div>
        <div><small>Morfologia</small><b>${escapeHtml(x.morph||"—")}</b></div>
        <div><small>Uso KJV</small><b>${escapeHtml(x.kjv_definition||"—")}</b></div>
       </div>
       <div class="bx-strong-definition"><small>DEFINIÇÃO STRONG — FONTE ORIGINAL</small><p>${escapeHtml((x.definition||"Sem definição nesta entrada.").trim())}</p>${x.derivation?`<small>Derivação: ${escapeHtml(x.derivation.trim())}</small>`:""}</div>
       <p class="bx-strong-note">Fonte lexical: ${escapeHtml(x.source||"Strong's Dictionary")}. A interface está em português; o texto lexicográfico original é preservado sem tradução automática para evitar alterar o sentido.</p>`;
    });
  }catch(e){
    body.querySelector(".bx-strong-result").innerHTML=`<b>Falha ao carregar Strong.</b><p>${escapeHtml(e.message||"")}</p>`;
  }
 };

 const bxHistoryKey="logos-bx:history";
 const bxHistoryGet=()=>{try{return JSON.parse(localStorage.getItem(bxHistoryKey)||"[]")}catch(_){return[]}};
 const bxHistoryPush=(rows=[])=>{
   if(!rows.length)return;
   const first=rows[0],last=rows[rows.length-1];
   const ref=rows.length===1?first.ref:(first.book===last.book&&first.chapter===last.chapter?`${first.book} ${first.chapter}:${first.verse}-${last.verse}`:`${first.ref} – ${last.ref}`);
   const entry={ref,text:rows.slice(0,4).map(x=>x.text).join(" "),translation:selectedTranslation(),at:new Date().toISOString()};
   const list=[entry,...bxHistoryGet().filter(x=>x.ref!==ref)].slice(0,40);
   try{localStorage.setItem(bxHistoryKey,JSON.stringify(list))}catch(_){}
 };
 const bxPersonalItems=()=>{
   const notes=[],favorites=[];
   try{
     for(let i=0;i<localStorage.length;i++){
       const k=localStorage.key(i)||"";
       if(k.startsWith("logos-bx:note:")){
         const ref=k.slice("logos-bx:note:".length),value=localStorage.getItem(k)||"";
         if(value.trim())notes.push({ref,value});
       }
       if(k.startsWith("logos-bx:fav:")&&localStorage.getItem(k)==="1"){
         favorites.push({ref:k.slice("logos-bx:fav:".length)});
       }
     }
   }catch(_){}
   notes.sort((a,b)=>a.ref.localeCompare(b.ref,"pt-BR"));
   favorites.sort((a,b)=>a.ref.localeCompare(b.ref,"pt-BR"));
   return {notes,favorites};
 };
 const bxPassageText=(rows=[])=>rows.map(v=>`${v.ref} — ${v.text}`).join("\n");
 const bxCopyText=async(txt)=>{try{await navigator.clipboard.writeText(txt);return true}catch(_){return false}};
 const bxDownloadText=(name,text,type="text/plain")=>{
   try{
     const blob=new Blob([text],{type:`${type};charset=utf-8`}),url=URL.createObjectURL(blob),a=document.createElement("a");
     a.href=url;a.download=name;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);return true;
   }catch(_){return false}
 };
 const bxRenderArchiveModal=()=>{
   const hist=bxHistoryGet(),pers=bxPersonalItems();
   let modal=document.getElementById("bxArchiveModal");
   if(!modal){modal=document.createElement("div");modal.id="bxArchiveModal";modal.className="bx-archive-modal";document.body.appendChild(modal)}
   modal.innerHTML=`<div class="bx-archive-card">
    <header><div><small>BÍBLIA X</small><h3>Meu Estudo</h3></div><button id="bxArchiveClose">×</button></header><div class="bx-archive-tools"><button id="bxArchiveExport">⬇ Backup JSON</button><button id="bxArchiveClear">🧹 Limpar histórico</button></div>
    <div class="bx-archive-tabs"><button class="active" data-archive-tab="history">🕘 Histórico <b>${hist.length}</b></button><button data-archive-tab="favorites">⭐ Favoritos <b>${pers.favorites.length}</b></button><button data-archive-tab="notes">📝 Notas <b>${pers.notes.length}</b></button></div>
    <div data-archive-pane="history" class="bx-archive-list">${hist.length?hist.map(x=>`<button data-archive-ref="${escapeHtml(x.ref)}"><b>${escapeHtml(x.ref)}</b><span>${escapeHtml((x.text||"").slice(0,160))}</span><small>${new Date(x.at).toLocaleString("pt-BR")}</small></button>`).join(""):"<p>Nenhuma passagem visitada ainda.</p>"}</div>
    <div data-archive-pane="favorites" class="bx-archive-list" hidden>${pers.favorites.length?pers.favorites.map(x=>`<button data-archive-ref="${escapeHtml(x.ref)}"><b>⭐ ${escapeHtml(x.ref)}</b></button>`).join(""):"<p>Nenhum favorito ainda.</p>"}</div>
    <div data-archive-pane="notes" class="bx-archive-list" hidden>${pers.notes.length?pers.notes.map(x=>`<button data-archive-ref="${escapeHtml(x.ref)}"><b>${escapeHtml(x.ref)}</b><span>${escapeHtml(x.value)}</span></button>`).join(""):"<p>Nenhuma nota salva ainda.</p>"}</div>
   </div>`;
   modal.hidden=false;
   modal.querySelector("#bxArchiveClose")?.addEventListener("click",()=>modal.hidden=true);
   modal.querySelector("#bxArchiveExport")?.addEventListener("click",bxExportPersonal);
   modal.querySelector("#bxArchiveClear")?.addEventListener("click",bxClearHistory);
   modal.querySelectorAll("[data-archive-tab]").forEach(b=>b.onclick=()=>{
     modal.querySelectorAll("[data-archive-tab]").forEach(x=>x.classList.toggle("active",x===b));
     modal.querySelectorAll("[data-archive-pane]").forEach(p=>p.hidden=p.dataset.archivePane!==b.dataset.archiveTab);
   });
   modal.querySelectorAll("[data-archive-ref]").forEach(b=>b.onclick=async()=>{
     const ref=b.dataset.archiveRef;
     try{
       const rr=await smartBibleRef(ref);
       if(!rr.length)return;
       current=rr;if($("#bRef"))$("#bRef").value=ref;renderBibleVerses(rr);modal.hidden=true;
       $("#bOut")?.scrollIntoView({behavior:"smooth",block:"start"});
     }catch(_){}
   });
 };

 const bxPreviewReference=async(ref)=>{
   let modal=document.getElementById("bxRefPreview");
   if(!modal){modal=document.createElement("div");modal.id="bxRefPreview";modal.className="bx-ref-preview";document.body.appendChild(modal)}
   modal.hidden=false;modal.innerHTML=`<div class="bx-ref-preview-card"><div class="bx-ref-preview-head"><b>${escapeHtml(ref)}</b><button data-ref-preview-close>×</button></div><div class="bx-ref-preview-body">Carregando...</div></div>`;
   modal.querySelector("[data-ref-preview-close]")?.addEventListener("click",()=>modal.hidden=true);
   try{
     const rows=await smartBibleRef(ref),body=modal.querySelector(".bx-ref-preview-body");
     body.innerHTML=rows.length?`<div class="bx-ref-preview-verses">${rows.map(v=>`<p><b>${escapeHtml(v.ref)}</b> ${escapeHtml(v.text)}</p>`).join("")}</div><div class="bx-ref-preview-actions"><button data-ref-open>Abrir na Bíblia</button><button data-ref-copy>Copiar</button></div>`:"<p>Referência não encontrada.</p>";
     body.querySelector("[data-ref-open]")?.addEventListener("click",()=>{current=rows;if($("#bRef"))$("#bRef").value=ref;renderBibleVerses(rows);modal.hidden=true;$("#bOut")?.scrollIntoView({behavior:"smooth",block:"start"})});
     body.querySelector("[data-ref-copy]")?.addEventListener("click",async()=>{await bxCopyText(bxPassageText(rows))});
   }catch(e){modal.querySelector(".bx-ref-preview-body").textContent="Falha ao abrir a prévia."}
 };

 const bxCompareTranslations=async(rows=[])=>{
   if(!rows.length)return;
   const first=rows[0],last=rows[rows.length-1];
   const ref=rows.length===1?first.ref:(first.book===last.book&&first.chapter===last.chapter?`${first.book} ${first.chapter}:${first.verse}-${last.verse}`:first.ref);
   let modal=document.getElementById("bxCompareModal");
   if(!modal){modal=document.createElement("div");modal.id="bxCompareModal";modal.className="bx-compare-modal";document.body.appendChild(modal)}
   modal.hidden=false;modal.innerHTML=`<div class="bx-compare-card"><header><div><small>COMPARAR TRADUÇÕES</small><h3>${escapeHtml(ref)}</h3></div><button data-compare-close>×</button></header><div class="bx-compare-grid"><section><h4>BLIVRE</h4><div data-compare-a>Carregando...</div></section><section><h4>WEBP</h4><div data-compare-b>Carregando...</div></section></div></div>`;
   modal.querySelector("[data-compare-close]")?.addEventListener("click",()=>modal.hidden=true);
   try{
     const a=await apiBibleRef(ref);
     const old=$("#bVersion")?.value;
     if($("#bVersion"))$("#bVersion").value="engwebp";
     const b=await apiBibleRef(ref);
     if($("#bVersion"))$("#bVersion").value=old||"porbr2018";
     modal.querySelector("[data-compare-a]").innerHTML=a.map(v=>`<p><b>${escapeHtml(v.ref)}</b> ${escapeHtml(v.text)}</p>`).join("");
     modal.querySelector("[data-compare-b]").innerHTML=b.map(v=>`<p><b>${escapeHtml(v.ref)}</b> ${escapeHtml(v.text)}</p>`).join("");
   }catch(_){modal.querySelector(".bx-compare-grid").innerHTML="<p>Não foi possível comparar as traduções.</p>"}
 };

 const bxReadingModeToggle=()=>{
   document.body.classList.toggle("bx-reading-mode");
   try{localStorage.setItem("logos-bx:reading-mode",document.body.classList.contains("bx-reading-mode")?"1":"0")}catch(_){}
 };
 try{if(localStorage.getItem("logos-bx:reading-mode")==="1")document.body.classList.add("bx-reading-mode")}catch(_){}

 const bxFontKey="logos-bx:font-scale";
 const bxGetFontScale=()=>{try{return Math.max(.85,Math.min(1.45,Number(localStorage.getItem(bxFontKey)||1)))}catch(_){return 1}};
 const bxApplyFontScale=(v)=>{v=Math.max(.85,Math.min(1.45,v));document.documentElement.style.setProperty("--bx-font-scale",String(v));try{localStorage.setItem(bxFontKey,String(v))}catch(_){}};
 bxApplyFontScale(bxGetFontScale());

 const bxAdjustFont=(delta)=>bxApplyFontScale(bxGetFontScale()+delta);

 const bxCopyCitation=async(rows=[])=>{
   if(!rows.length)return false;
   const first=rows[0],last=rows[rows.length-1];
   const ref=rows.length===1?first.ref:(first.book===last.book&&first.chapter===last.chapter?`${first.book} ${first.chapter}:${first.verse}-${last.verse}`:first.ref);
   const label=$("#bVersion")?.selectedOptions?.[0]?.textContent?.trim()||selectedTranslation();
   return bxCopyText(`${bxPassageText(rows)}\n\n${ref} • ${label}`);
 };

 const bxSharePassage=async(rows=[])=>{
   if(!rows.length)return;
   const text=bxPassageText(rows);
   try{
     if(navigator.share){await navigator.share({title:"Bíblia X",text});return}
   }catch(_){}
   await bxCopyText(text);
 };

 const bxPrintPassage=(rows=[])=>{
   if(!rows.length)return;
   const w=window.open("","_blank","width=900,height=700");
   if(!w)return;
   const title=escapeHtml(rows.length===1?rows[0].ref:`${rows[0].ref} – ${rows[rows.length-1].ref}`);
   w.document.write(`<!doctype html><html><head><meta charset="utf-8"><title>${title}</title><style>body{font-family:Georgia,serif;max-width:820px;margin:40px auto;padding:0 24px;color:#111}h1{font-size:24px}p{font-size:17px;line-height:1.7}b{font-size:14px}footer{margin-top:30px;border-top:1px solid #bbb;padding-top:12px;font-size:12px;color:#555}</style></head><body><h1>${title}</h1>${rows.map(v=>`<p><b>${escapeHtml(v.ref)}</b> ${escapeHtml(v.text)}</p>`).join("")}<footer>LOGOS MASTER X • Bíblia X</footer></body></html>`);
   w.document.close();w.focus();setTimeout(()=>w.print(),250);
 };

 const bxFocusVerse=(ref)=>{
   const el=[...document.querySelectorAll("[data-bx-v3-verse]")].find(x=>x.dataset.ref===ref);
   if(!el)return;
   document.querySelectorAll("[data-bx-v3-verse].bx-focus-verse").forEach(x=>x.classList.remove("bx-focus-verse"));
   el.classList.add("bx-focus-verse");el.scrollIntoView({behavior:"smooth",block:"center"});
 };

 const bxChapterNavigator=(rows=[])=>{
   if(!rows.length)return "";
   const v=rows[0],ch=Number(v.chapter)||1;
   return `<div class="bx-chapter-nav"><button data-chapter-nav="${Math.max(1,ch-1)}" ${ch<=1?"disabled":""}>← Cap. ${Math.max(1,ch-1)}</button><b>${escapeHtml(v.book)} • capítulo ${ch}</b><button data-chapter-nav="${ch+1}">Cap. ${ch+1} →</button></div>`;
 };

 const bxBookmarksKey="logos-bx:bookmarks";
 const bxBookmarksGet=()=>{try{return JSON.parse(localStorage.getItem(bxBookmarksKey)||"[]")}catch(_){return[]}};
 const bxBookmarkToggle=(v)=>{
   if(!v)return false;let list=bxBookmarksGet(),exists=list.some(x=>x.ref===v.ref);
   list=exists?list.filter(x=>x.ref!==v.ref):[{ref:v.ref,text:v.text,at:new Date().toISOString()},...list].slice(0,100);
   try{localStorage.setItem(bxBookmarksKey,JSON.stringify(list))}catch(_){}
   return !exists;
 };
 const bxReadingProgressKey="logos-bx:reading-progress";
 const bxSaveReadingProgress=(rows=[])=>{
   if(!rows.length)return;try{localStorage.setItem(bxReadingProgressKey,JSON.stringify({ref:rows[0].ref,book:rows[0].book,chapter:rows[0].chapter,at:new Date().toISOString()}))}catch(_){}
 };
 const bxGetReadingProgress=()=>{try{return JSON.parse(localStorage.getItem(bxReadingProgressKey)||"null")}catch(_){return null}};
 const bxResumeReading=async()=>{
   const p=bxGetReadingProgress();if(!p)return;
   try{const rr=await smartBibleRef(`${p.book} ${p.chapter}`);if(!rr.length)return;current=rr;if($("#bRef"))$("#bRef").value=`${p.book} ${p.chapter}`;renderBibleVerses(rr);bxFocusVerse(p.ref)}catch(_){}
 };
 const bxExportPersonal=()=>{
   const data={exported_at:new Date().toISOString(),history:bxHistoryGet(),personal:bxPersonalItems(),bookmarks:bxBookmarksGet(),reading_progress:bxGetReadingProgress()};
   bxDownloadText(`biblia-x-meu-estudo-${new Date().toISOString().slice(0,10)}.json`,JSON.stringify(data,null,2),"application/json");
 };
 const bxClearHistory=()=>{
   if(!confirm("Limpar somente o histórico de passagens da Bíblia X? Notas e favoritos serão preservados."))return;
   try{localStorage.removeItem(bxHistoryKey)}catch(_){}
   bxRenderArchiveModal();
 };
 const bxRenderBookmarks=()=>{
   const list=bxBookmarksGet();
   let modal=document.getElementById("bxBookmarksModal");
   if(!modal){modal=document.createElement("div");modal.id="bxBookmarksModal";modal.className="bx-bookmarks-modal";document.body.appendChild(modal)}
   modal.hidden=false;modal.innerHTML=`<div class="bx-bookmarks-card"><header><div><small>BÍBLIA X</small><h3>🔖 Marcadores</h3></div><button data-bm-close>×</button></header>
    <div class="bx-bookmarks-list">${list.length?list.map(x=>`<article><button data-bm-ref="${escapeHtml(x.ref)}"><b>${escapeHtml(x.ref)}</b><span>${escapeHtml((x.text||"").slice(0,170))}</span></button><button class="bx-bm-remove" data-bm-remove="${escapeHtml(x.ref)}">Remover</button></article>`).join(""):"<p>Nenhum marcador salvo.</p>"}</div></div>`;
   modal.querySelector("[data-bm-close]")?.addEventListener("click",()=>modal.hidden=true);
   modal.querySelectorAll("[data-bm-ref]").forEach(b=>b.onclick=async()=>{const rr=await smartBibleRef(b.dataset.bmRef);if(!rr.length)return;current=rr;if($("#bRef"))$("#bRef").value=b.dataset.bmRef;renderBibleVerses(rr);modal.hidden=true});
   modal.querySelectorAll("[data-bm-remove]").forEach(b=>b.onclick=()=>{let a=bxBookmarksGet().filter(x=>x.ref!==b.dataset.bmRemove);localStorage.setItem(bxBookmarksKey,JSON.stringify(a));bxRenderBookmarks()});
 };

 const bxSessionKey="logos-bx:session";
 const bxSaveSession=(rows=[])=>{
   if(!rows.length)return;
   try{
     localStorage.setItem(bxSessionKey,JSON.stringify({
       ref:rows.length===1?rows[0].ref:`${rows[0].book} ${rows[0].chapter}`,
       translation:selectedTranslation(),
       at:new Date().toISOString()
     }));
   }catch(_){}
 };
 const bxGetSession=()=>{try{return JSON.parse(localStorage.getItem(bxSessionKey)||"null")}catch(_){return null}};
 const bxRestoreSession=async()=>{
   const s=bxGetSession();if(!s)return false;
   try{
     if($("#bVersion")&&s.translation)$("#bVersion").value=s.translation;
     const rr=await smartBibleRef(s.ref);
     if(!rr.length)return false;
     current=rr;if($("#bRef"))$("#bRef").value=s.ref;renderBibleVerses(rr);return true;
   }catch(_){return false}
 };

 const bxQuickRefsKey="logos-bx:quickrefs";
 const bxQuickRefsGet=()=>{try{return JSON.parse(localStorage.getItem(bxQuickRefsKey)||"[]")}catch(_){return[]}};
 const bxQuickRefsSave=(ref,label="")=>{
   ref=String(ref||"").trim();if(!ref)return;
   let list=bxQuickRefsGet().filter(x=>x.ref!==ref);
   list=[{ref,label:label||ref,at:new Date().toISOString()},...list].slice(0,24);
   try{localStorage.setItem(bxQuickRefsKey,JSON.stringify(list))}catch(_){}
 };
 const bxQuickRefsRemove=(ref)=>{try{localStorage.setItem(bxQuickRefsKey,JSON.stringify(bxQuickRefsGet().filter(x=>x.ref!==ref)))}catch(_){}};

 const bxRenderQuickRefs=()=>{
   const list=bxQuickRefsGet();
   let modal=document.getElementById("bxQuickRefsModal");
   if(!modal){modal=document.createElement("div");modal.id="bxQuickRefsModal";modal.className="bx-quickrefs-modal";document.body.appendChild(modal)}
   modal.hidden=false;
   modal.innerHTML=`<div class="bx-quickrefs-card">
     <header><div><small>BÍBLIA X</small><h3>⚡ Acesso Rápido</h3></div><button data-qr-close>×</button></header>
     <div class="bx-quickrefs-add"><input id="bxQuickRefInput" placeholder="Ex.: João 3:16"><input id="bxQuickRefLabel" placeholder="Nome opcional"><button id="bxQuickRefSave">+ Salvar</button></div>
     <div class="bx-quickrefs-list">${list.length?list.map(x=>`<article><button data-qr-open="${escapeHtml(x.ref)}"><b>${escapeHtml(x.label||x.ref)}</b><small>${escapeHtml(x.ref)}</small></button><button data-qr-remove="${escapeHtml(x.ref)}">Remover</button></article>`).join(""):"<p>Nenhum acesso rápido salvo.</p>"}</div>
   </div>`;
   modal.querySelector("[data-qr-close]")?.addEventListener("click",()=>modal.hidden=true);
   modal.querySelector("#bxQuickRefSave")?.addEventListener("click",()=>{
     bxQuickRefsSave(modal.querySelector("#bxQuickRefInput")?.value,modal.querySelector("#bxQuickRefLabel")?.value);bxRenderQuickRefs();
   });
   modal.querySelectorAll("[data-qr-open]").forEach(b=>b.onclick=async()=>{
     const ref=b.dataset.qrOpen;try{const rr=await smartBibleRef(ref);if(!rr.length)return;current=rr;if($("#bRef"))$("#bRef").value=ref;renderBibleVerses(rr);modal.hidden=true}catch(_){}
   });
   modal.querySelectorAll("[data-qr-remove]").forEach(b=>b.onclick=()=>{bxQuickRefsRemove(b.dataset.qrRemove);bxRenderQuickRefs()});
 };

 const bxSearchHistoryKey="logos-bx:search-history";
 const bxSearchHistoryGet=()=>{try{return JSON.parse(localStorage.getItem(bxSearchHistoryKey)||"[]")}catch(_){return[]}};
 const bxSearchHistoryPush=(q)=>{
   q=String(q||"").trim();if(!q)return;
   const list=[q,...bxSearchHistoryGet().filter(x=>x.toLowerCase()!==q.toLowerCase())].slice(0,30);
   try{localStorage.setItem(bxSearchHistoryKey,JSON.stringify(list))}catch(_){}
 };
 const bxRenderSearchHistory=()=>{
   const list=bxSearchHistoryGet();
   let modal=document.getElementById("bxSearchHistoryModal");
   if(!modal){modal=document.createElement("div");modal.id="bxSearchHistoryModal";modal.className="bx-search-history-modal";document.body.appendChild(modal)}
   modal.hidden=false;
   modal.innerHTML=`<div class="bx-search-history-card"><header><div><small>BÍBLIA X</small><h3>🔎 Pesquisas recentes</h3></div><button data-sh-close>×</button></header>
    <div class="bx-search-history-list">${list.length?list.map(x=>`<button data-sh-query="${escapeHtml(x)}">${escapeHtml(x)}</button>`).join(""):"<p>Nenhuma pesquisa recente.</p>"}</div>
    <button class="bx-search-history-clear" data-sh-clear>Limpar pesquisas</button></div>`;
   modal.querySelector("[data-sh-close]")?.addEventListener("click",()=>modal.hidden=true);
   modal.querySelectorAll("[data-sh-query]").forEach(b=>b.onclick=()=>{if($("#bSearch"))$("#bSearch").value=b.dataset.shQuery;modal.hidden=true;$("#bFind")?.click()});
   modal.querySelector("[data-sh-clear]")?.addEventListener("click",()=>{try{localStorage.removeItem(bxSearchHistoryKey)}catch(_){};bxRenderSearchHistory()});
 };

 const bxWordLookup=(word)=>{
   word=String(word||"").trim();if(!word)return;
   if($("#bSearch"))$("#bSearch").value=word;
   $("#bFind")?.click();
 };

 const bxTagsKey="logos-bx:tags";
 const bxTagsGet=()=>{try{return JSON.parse(localStorage.getItem(bxTagsKey)||"{}")}catch(_){return{}}};
 const bxTagsSave=(data)=>{try{localStorage.setItem(bxTagsKey,JSON.stringify(data))}catch(_){}};
 const bxTagsFor=(ref)=>bxTagsGet()[ref]||[];
 const bxTagAdd=(ref,tag)=>{
   tag=String(tag||"").trim();if(!ref||!tag)return;
   const all=bxTagsGet(),list=all[ref]||[];
   if(!list.some(x=>x.toLowerCase()===tag.toLowerCase()))list.push(tag);
   all[ref]=list.slice(0,20);bxTagsSave(all);
 };
 const bxTagRemove=(ref,tag)=>{
   const all=bxTagsGet();all[ref]=(all[ref]||[]).filter(x=>x!==tag);
   if(!all[ref].length)delete all[ref];bxTagsSave(all);
 };

 const bxCollectionsKey="logos-bx:collections";
 const bxCollectionsGet=()=>{try{return JSON.parse(localStorage.getItem(bxCollectionsKey)||"{}")}catch(_){return{}}};
 const bxCollectionsSave=(d)=>{try{localStorage.setItem(bxCollectionsKey,JSON.stringify(d))}catch(_){}};
 const bxCollectionAdd=(name,v)=>{
   name=String(name||"").trim();if(!name||!v)return;
   const all=bxCollectionsGet(),list=all[name]||[];
   if(!list.some(x=>x.ref===v.ref))list.unshift({ref:v.ref,text:v.text,at:new Date().toISOString()});
   all[name]=list.slice(0,200);bxCollectionsSave(all);
 };
 const bxCollectionRemove=(name,ref)=>{
   const all=bxCollectionsGet();all[name]=(all[name]||[]).filter(x=>x.ref!==ref);
   if(!all[name].length)delete all[name];bxCollectionsSave(all);
 };

 const bxRenderVerseOrganizer=(v)=>{
   if(!v)return;
   let modal=document.getElementById("bxOrganizerModal");
   if(!modal){modal=document.createElement("div");modal.id="bxOrganizerModal";modal.className="bx-organizer-modal";document.body.appendChild(modal)}
   const tags=bxTagsFor(v.ref),cols=bxCollectionsGet(),names=Object.keys(cols).sort((a,b)=>a.localeCompare(b,"pt-BR"));
   modal.hidden=false;
   modal.innerHTML=`<div class="bx-organizer-card">
    <header><div><small>BÍBLIA X</small><h3>Organizar • ${escapeHtml(v.ref)}</h3></div><button data-org-close>×</button></header>
    <div class="bx-organizer-verse">${escapeHtml(v.text)}</div>
    <section><h4>🏷️ Etiquetas</h4><div class="bx-organizer-tags">${tags.length?tags.map(t=>`<span>${escapeHtml(t)} <button data-tag-remove="${escapeHtml(t)}">×</button></span>`).join(""):"<em>Nenhuma etiqueta.</em>"}</div>
      <div class="bx-organizer-add"><input id="bxTagInput" placeholder="Ex.: fé, missão, oração"><button id="bxTagAdd">+ Etiqueta</button></div>
    </section>
    <section><h4>📚 Coleções de estudo</h4>
      <div class="bx-organizer-collections">${names.length?names.map(n=>`<button data-col-add="${escapeHtml(n)}">${escapeHtml(n)} <small>${(cols[n]||[]).length}</small></button>`).join(""):"<em>Nenhuma coleção criada.</em>"}</div>
      <div class="bx-organizer-add"><input id="bxCollectionInput" placeholder="Nova coleção"><button id="bxCollectionAdd">+ Criar/adicionar</button></div>
    </section>
   </div>`;
   modal.querySelector("[data-org-close]")?.addEventListener("click",()=>modal.hidden=true);
   modal.querySelector("#bxTagAdd")?.addEventListener("click",()=>{bxTagAdd(v.ref,modal.querySelector("#bxTagInput")?.value);bxRenderVerseOrganizer(v)});
   modal.querySelectorAll("[data-tag-remove]").forEach(b=>b.onclick=()=>{bxTagRemove(v.ref,b.dataset.tagRemove);bxRenderVerseOrganizer(v)});
   modal.querySelectorAll("[data-col-add]").forEach(b=>b.onclick=()=>{bxCollectionAdd(b.dataset.colAdd,v);b.classList.add("added")});
   modal.querySelector("#bxCollectionAdd")?.addEventListener("click",()=>{const n=modal.querySelector("#bxCollectionInput")?.value;bxCollectionAdd(n,v);bxRenderVerseOrganizer(v)});
 };

 const bxRenderCollections=()=>{
   const cols=bxCollectionsGet(),names=Object.keys(cols).sort((a,b)=>a.localeCompare(b,"pt-BR"));
   let modal=document.getElementById("bxCollectionsModal");
   if(!modal){modal=document.createElement("div");modal.id="bxCollectionsModal";modal.className="bx-collections-modal";document.body.appendChild(modal)}
   modal.hidden=false;
   modal.innerHTML=`<div class="bx-collections-card"><header><div><small>BÍBLIA X</small><h3>📚 Coleções</h3></div><button data-cols-close>×</button></header>
     <div class="bx-collections-grid">${names.length?names.map(n=>`<section><h4>${escapeHtml(n)} <small>${cols[n].length}</small></h4>${cols[n].map(x=>`<article><button data-col-ref="${escapeHtml(x.ref)}"><b>${escapeHtml(x.ref)}</b><span>${escapeHtml((x.text||"").slice(0,150))}</span></button><button data-col-remove="${escapeHtml(n)}|||${escapeHtml(x.ref)}">×</button></article>`).join("")}</section>`).join(""):"<p>Nenhuma coleção criada.</p>"}</div>
   </div>`;
   modal.querySelector("[data-cols-close]")?.addEventListener("click",()=>modal.hidden=true);
   modal.querySelectorAll("[data-col-ref]").forEach(b=>b.onclick=async()=>{const rr=await smartBibleRef(b.dataset.colRef);if(!rr.length)return;current=rr;if($("#bRef"))$("#bRef").value=b.dataset.colRef;renderBibleVerses(rr);modal.hidden=true});
   modal.querySelectorAll("[data-col-remove]").forEach(b=>b.onclick=()=>{const [n,ref]=b.dataset.colRemove.split("|||");bxCollectionRemove(n,ref);bxRenderCollections()});
 };

 const bxRenderStudyDashboard=()=>{
   const hist=bxHistoryGet(),pers=bxPersonalItems(),bookmarks=bxBookmarksGet(),cols=bxCollectionsGet(),tags=bxTagsGet();
   const tagCount=Object.values(tags).reduce((n,a)=>n+(a?.length||0),0);
   let modal=document.getElementById("bxDashboardModal");
   if(!modal){modal=document.createElement("div");modal.id="bxDashboardModal";modal.className="bx-dashboard-modal";document.body.appendChild(modal)}
   modal.hidden=false;
   modal.innerHTML=`<div class="bx-dashboard-card"><header><div><small>BÍBLIA X</small><h3>📊 Painel do Estudo</h3></div><button data-dash-close>×</button></header>
    <div class="bx-dashboard-metrics">
      <div><b>${hist.length}</b><span>passagens recentes</span></div>
      <div><b>${pers.favorites.length}</b><span>favoritos</span></div>
      <div><b>${pers.notes.length}</b><span>notas</span></div>
      <div><b>${bookmarks.length}</b><span>marcadores</span></div>
      <div><b>${Object.keys(cols).length}</b><span>coleções</span></div>
      <div><b>${tagCount}</b><span>etiquetas</span></div>
    </div>
    <div class="bx-dashboard-actions"><button data-dash-action="archive">🕘 Meu Estudo</button><button data-dash-action="collections">📚 Coleções</button><button data-dash-action="bookmarks">🔖 Marcadores</button><button data-dash-action="quick">⚡ Acesso Rápido</button></div>
   </div>`;
   modal.querySelector("[data-dash-close]")?.addEventListener("click",()=>modal.hidden=true);
   modal.querySelector('[data-dash-action="archive"]')?.addEventListener("click",()=>{modal.hidden=true;bxRenderArchiveModal()});
   modal.querySelector('[data-dash-action="collections"]')?.addEventListener("click",()=>{modal.hidden=true;bxRenderCollections()});
   modal.querySelector('[data-dash-action="bookmarks"]')?.addEventListener("click",()=>{modal.hidden=true;bxRenderBookmarks()});
   modal.querySelector('[data-dash-action="quick"]')?.addEventListener("click",()=>{modal.hidden=true;bxRenderQuickRefs()});
 };

 const bxPlansKey="logos-bx:reading-plans";
 const bxPlansGet=()=>{try{return JSON.parse(localStorage.getItem(bxPlansKey)||"{}")}catch(_){return{}}};
 const bxPlansSave=(d)=>{try{localStorage.setItem(bxPlansKey,JSON.stringify(d))}catch(_){}};
 const bxPlanTemplates={
  "Evangelhos 14 dias":["Mateus 1","Mateus 5","Mateus 13","Mateus 24","Marcos 1","Marcos 5","Marcos 10","Lucas 1","Lucas 10","Lucas 15","João 1","João 3","João 10","João 20"],
  "Salmos 10 dias":["Salmos 1","Salmos 8","Salmos 19","Salmos 23","Salmos 27","Salmos 46","Salmos 51","Salmos 91","Salmos 103","Salmos 121"],
  "Missões 7 dias":["Gênesis 12:1-3","Isaías 6:1-8","Mateus 28:18-20","Atos 1:8","Atos 13:1-4","Romanos 10:8-15","Apocalipse 7:9-10"]
 };
 const bxPlanCreate=(name,refs)=>{
   name=String(name||"").trim();refs=(refs||[]).map(x=>String(x).trim()).filter(Boolean);if(!name||!refs.length)return;
   const all=bxPlansGet();all[name]={name,refs,done:[],created_at:new Date().toISOString()};bxPlansSave(all);
 };
 const bxPlanToggleDone=(name,ref)=>{
   const all=bxPlansGet(),p=all[name];if(!p)return;
   p.done=p.done||[];p.done=p.done.includes(ref)?p.done.filter(x=>x!==ref):[...p.done,ref];bxPlansSave(all);
 };
 const bxPlanDelete=(name)=>{const all=bxPlansGet();delete all[name];bxPlansSave(all)};
 const bxRenderReadingPlans=()=>{
   const all=bxPlansGet(),names=Object.keys(all);
   let modal=document.getElementById("bxPlansModal");
   if(!modal){modal=document.createElement("div");modal.id="bxPlansModal";modal.className="bx-plans-modal";document.body.appendChild(modal)}
   modal.hidden=false;
   modal.innerHTML=`<div class="bx-plans-card"><header><div><small>BÍBLIA X</small><h3>📅 Planos de Leitura</h3></div><button data-plan-close>×</button></header>
    <div class="bx-plan-templates">${Object.entries(bxPlanTemplates).map(([n,refs])=>`<button data-plan-template="${escapeHtml(n)}"><b>${escapeHtml(n)}</b><small>${refs.length} leituras</small></button>`).join("")}</div>
    <div class="bx-plan-custom"><input id="bxPlanName" placeholder="Nome do plano"><textarea id="bxPlanRefs" placeholder="Uma referência por linha"></textarea><button id="bxPlanCreate">+ Criar plano</button></div>
    <div class="bx-plans-list">${names.length?names.map(n=>{const p=all[n],done=p.done||[],pct=Math.round(done.length/Math.max(1,p.refs.length)*100);return `<section><div class="bx-plan-head"><div><b>${escapeHtml(n)}</b><small>${done.length}/${p.refs.length} • ${pct}%</small></div><button data-plan-delete="${escapeHtml(n)}">Excluir</button></div><div class="bx-plan-progress"><i style="width:${pct}%"></i></div>${p.refs.map(ref=>`<article class="${done.includes(ref)?"done":""}"><button data-plan-open="${escapeHtml(n)}|||${escapeHtml(ref)}"><span>${done.includes(ref)?"✓":"○"}</span><b>${escapeHtml(ref)}</b></button><button data-plan-done="${escapeHtml(n)}|||${escapeHtml(ref)}">${done.includes(ref)?"Reabrir":"Concluir"}</button></article>`).join("")}</section>`}).join(""):"<p>Nenhum plano criado.</p>"}</div>
   </div>`;
   modal.querySelector("[data-plan-close]")?.addEventListener("click",()=>modal.hidden=true);
   modal.querySelectorAll("[data-plan-template]").forEach(b=>b.onclick=()=>{const n=b.dataset.planTemplate;bxPlanCreate(n,bxPlanTemplates[n]);bxRenderReadingPlans()});
   modal.querySelector("#bxPlanCreate")?.addEventListener("click",()=>{bxPlanCreate(modal.querySelector("#bxPlanName")?.value,(modal.querySelector("#bxPlanRefs")?.value||"").split(/\n+/));bxRenderReadingPlans()});
   modal.querySelectorAll("[data-plan-delete]").forEach(b=>b.onclick=()=>{bxPlanDelete(b.dataset.planDelete);bxRenderReadingPlans()});
   modal.querySelectorAll("[data-plan-done]").forEach(b=>b.onclick=()=>{const [n,ref]=b.dataset.planDone.split("|||");bxPlanToggleDone(n,ref);bxRenderReadingPlans()});
   modal.querySelectorAll("[data-plan-open]").forEach(b=>b.onclick=async()=>{const [n,ref]=b.dataset.planOpen.split("|||");try{const rr=await smartBibleRef(ref);if(!rr.length)return;current=rr;if($("#bRef"))$("#bRef").value=ref;renderBibleVerses(rr);modal.hidden=true}catch(_){}});
 };

 const bxHighlightsKey="logos-bx:highlights";
 const bxHighlightsGet=()=>{try{return JSON.parse(localStorage.getItem(bxHighlightsKey)||"{}")}catch(_){return{}}};
 const bxHighlightSet=(ref,tone)=>{
   const all=bxHighlightsGet();if(!tone)delete all[ref];else all[ref]=tone;
   try{localStorage.setItem(bxHighlightsKey,JSON.stringify(all))}catch(_){}
 };
 const bxHighlightFor=(ref)=>bxHighlightsGet()[ref]||"";
 const bxRenderHighlightMenu=(v,button)=>{
   let pop=document.getElementById("bxHighlightMenu");if(pop)pop.remove();
   pop=document.createElement("div");pop.id="bxHighlightMenu";pop.className="bx-highlight-menu";
   pop.innerHTML=`<button data-hl="gold">Dourado</button><button data-hl="green">Verde</button><button data-hl="blue">Azul</button><button data-hl="rose">Rosa</button><button data-hl="">Remover</button>`;
   document.body.appendChild(pop);const r=button.getBoundingClientRect();pop.style.left=Math.min(r.left,window.innerWidth-280)+"px";pop.style.top=(r.bottom+5)+"px";
   pop.querySelectorAll("[data-hl]").forEach(b=>b.onclick=()=>{bxHighlightSet(v.ref,b.dataset.hl);const el=[...document.querySelectorAll("[data-bx-v3-verse]")].find(x=>x.dataset.ref===v.ref);if(el){el.dataset.highlight=b.dataset.hl||""}pop.remove()});
   setTimeout(()=>document.addEventListener("click",e=>{if(!pop.contains(e.target)&&e.target!==button)pop.remove()},{once:true}),0);
 };

 const bxParallelKey="logos-bx:parallel-prefs";
 const bxParallelGet=()=>{try{return JSON.parse(localStorage.getItem(bxParallelKey)||'{"enabled":false,"secondary":"engwebp"}')}catch(_){return{enabled:false,secondary:"engwebp"}}};
 const bxParallelSave=(d)=>{try{localStorage.setItem(bxParallelKey,JSON.stringify(d))}catch(_){}};

 const bxRenderParallel=async(rows=[])=>{
   if(!rows.length)return;
   const prefs=bxParallelGet();
   let modal=document.getElementById("bxParallelModal");
   if(!modal){modal=document.createElement("div");modal.id="bxParallelModal";modal.className="bx-parallel-modal";document.body.appendChild(modal)}
   const first=rows[0],last=rows[rows.length-1],ref=rows.length===1?first.ref:(first.book===last.book&&first.chapter===last.chapter?`${first.book} ${first.chapter}:${first.verse}-${last.verse}`:first.ref);
   modal.hidden=false;
   modal.innerHTML=`<div class="bx-parallel-card"><header><div><small>BÍBLIA X</small><h3>⇄ Leitura Paralela</h3><p>${escapeHtml(ref)}</p></div><button data-par-close>×</button></header>
    <div class="bx-parallel-controls"><label>Versão secundária <select id="bxParallelVersion"><option value="engwebp"${prefs.secondary==="engwebp"?" selected":""}>WEBP</option><option value="porbr2018"${prefs.secondary==="porbr2018"?" selected":""}>BLIVRE</option></select></label><button id="bxParallelReload">Atualizar</button></div>
    <div class="bx-parallel-grid"><section><h4>${escapeHtml($("#bVersion")?.selectedOptions?.[0]?.textContent||selectedTranslation())}</h4><div>${rows.map(v=>`<p><b>${escapeHtml(v.ref)}</b> ${escapeHtml(v.text)}</p>`).join("")}</div></section><section><h4 data-par-title>Secundária</h4><div data-par-body>Carregando...</div></section></div>
   </div>`;
   modal.querySelector("[data-par-close]")?.addEventListener("click",()=>modal.hidden=true);
   const load=async()=>{
     const sec=modal.querySelector("#bxParallelVersion")?.value||"engwebp";bxParallelSave({enabled:true,secondary:sec});
     const old=$("#bVersion")?.value;try{if($("#bVersion"))$("#bVersion").value=sec;const rr=await apiBibleRef(ref);modal.querySelector("[data-par-title]").textContent=modal.querySelector("#bxParallelVersion")?.selectedOptions?.[0]?.textContent||sec;modal.querySelector("[data-par-body]").innerHTML=rr.length?rr.map(v=>`<p><b>${escapeHtml(v.ref)}</b> ${escapeHtml(v.text)}</p>`).join(""):"<p>Texto indisponível.</p>"}catch(_){modal.querySelector("[data-par-body]").innerHTML="<p>Falha ao carregar versão secundária.</p>"}finally{if($("#bVersion"))$("#bVersion").value=old}};
   modal.querySelector("#bxParallelReload")?.addEventListener("click",load);load();
 };

 const bxVerseLinks=(v)=>{
   if(!v)return [];
   const out=[];
   try{
     const refs=JSON.parse(localStorage.getItem(`logos-bx:verse-links:${v.ref}`)||"[]");
     return Array.isArray(refs)?refs:[];
   }catch(_){return out}
 };
 const bxVerseLinkAdd=(v,ref)=>{
   ref=String(ref||"").trim();if(!v||!ref)return;
   const k=`logos-bx:verse-links:${v.ref}`,a=bxVerseLinks(v);
   if(!a.includes(ref))a.push(ref);
   try{localStorage.setItem(k,JSON.stringify(a.slice(0,30)))}catch(_){}
 };
 const bxVerseLinkRemove=(v,ref)=>{
   try{localStorage.setItem(`logos-bx:verse-links:${v.ref}`,JSON.stringify(bxVerseLinks(v).filter(x=>x!==ref)))}catch(_){}
 };
 const bxRenderPersonalLinks=(v)=>{
   if(!v)return;let modal=document.getElementById("bxPersonalLinksModal");
   if(!modal){modal=document.createElement("div");modal.id="bxPersonalLinksModal";modal.className="bx-personal-links-modal";document.body.appendChild(modal)}
   const refs=bxVerseLinks(v);modal.hidden=false;
   modal.innerHTML=`<div class="bx-personal-links-card"><header><div><small>BÍBLIA X</small><h3>🔗 Minhas Referências • ${escapeHtml(v.ref)}</h3></div><button data-pl-close>×</button></header>
    <div class="bx-personal-link-add"><input id="bxPersonalLinkInput" placeholder="Ex.: Romanos 5:8"><button id="bxPersonalLinkAdd">+ Vincular</button></div>
    <div class="bx-personal-links-list">${refs.length?refs.map(r=>`<article><button data-pl-open="${escapeHtml(r)}">${escapeHtml(r)}</button><button data-pl-remove="${escapeHtml(r)}">×</button></article>`).join(""):"<p>Nenhuma referência pessoal vinculada.</p>"}</div></div>`;
   modal.querySelector("[data-pl-close]")?.addEventListener("click",()=>modal.hidden=true);
   modal.querySelector("#bxPersonalLinkAdd")?.addEventListener("click",()=>{bxVerseLinkAdd(v,modal.querySelector("#bxPersonalLinkInput")?.value);bxRenderPersonalLinks(v)});
   modal.querySelectorAll("[data-pl-remove]").forEach(b=>b.onclick=()=>{bxVerseLinkRemove(v,b.dataset.plRemove);bxRenderPersonalLinks(v)});
   modal.querySelectorAll("[data-pl-open]").forEach(b=>b.onclick=()=>bxPreviewReference(b.dataset.plOpen));
 };

 const bxCopyStudyCard=async(v)=>{
   if(!v)return;const tags=bxTagsFor(v.ref),links=bxVerseLinks(v);
   const note=(()=>{try{return localStorage.getItem(`logos-bx:note:${v.ref}`)||""}catch(_){return""}})();
   const text=`${v.ref}\n${v.text}\n\n${tags.length?"Etiquetas: "+tags.join(", ")+"\n":""}${links.length?"Referências pessoais: "+links.join(", ")+"\n":""}${note?"Nota: "+note+"\n":""}\nLOGOS MASTER X • Bíblia X`;
   await bxCopyText(text);
 };

 const bxWorkspaceKey="logos-bx:workspace";
 const bxWorkspaceGet=()=>{try{return JSON.parse(localStorage.getItem(bxWorkspaceKey)||"{}")}catch(_){return{}}};
 const bxWorkspaceSave=(d)=>{try{localStorage.setItem(bxWorkspaceKey,JSON.stringify(d))}catch(_){}};
 const bxWorkspaceCapture=(rows=[])=>{
   if(!rows.length)return;const first=rows[0],last=rows[rows.length-1];
   const ref=rows.length===1?first.ref:(first.book===last.book&&first.chapter===last.chapter?`${first.book} ${first.chapter}:${first.verse}-${last.verse}`:first.ref);
   const d=bxWorkspaceGet();d.last={ref,translation:selectedTranslation(),font:bxGetFontScale(),reading:document.body.classList.contains("bx-reading-mode"),at:new Date().toISOString()};bxWorkspaceSave(d);
 };
 const bxWorkspaceRestore=async()=>{
   const s=bxWorkspaceGet().last;if(!s)return false;
   try{if($("#bVersion")&&s.translation)$("#bVersion").value=s.translation;if(s.font)bxApplyFontScale(Number(s.font));document.body.classList.toggle("bx-reading-mode",!!s.reading);
   const rr=await smartBibleRef(s.ref);if(!rr.length)return false;current=rr;if($("#bRef"))$("#bRef").value=s.ref;renderBibleVerses(rr);return true}catch(_){return false}
 };
 const bxExportWorkspace=()=>{
   const payload={schema:"logos-master-x-biblia-x-workspace-v1",exported_at:new Date().toISOString(),workspace:bxWorkspaceGet(),history:bxHistoryGet(),personal:bxPersonalItems(),bookmarks:bxBookmarksGet(),quickrefs:bxQuickRefsGet(),search_history:bxSearchHistoryGet(),collections:bxCollectionsGet(),tags:bxTagsGet(),plans:bxPlansGet(),highlights:bxHighlightsGet(),reading_progress:bxGetReadingProgress()};
   bxDownloadText(`biblia-x-workspace-${new Date().toISOString().slice(0,10)}.json`,JSON.stringify(payload,null,2),"application/json");
 };
 const bxStudySummary=()=>{
   const h=bxHistoryGet(),p=bxPersonalItems(),bm=bxBookmarksGet(),cols=bxCollectionsGet(),tags=bxTagsGet(),plans=bxPlansGet(),hl=bxHighlightsGet();
   return {passages:h.length,favorites:p.favorites.length,notes:p.notes.length,bookmarks:bm.length,collections:Object.keys(cols).length,tags:Object.values(tags).reduce((n,a)=>n+(a?.length||0),0),plans:Object.keys(plans).length,highlights:Object.keys(hl).length};
 };
 const bxRenderStudySummary=()=>{
   const s=bxStudySummary();let modal=document.getElementById("bxStudySummaryModal");
   if(!modal){modal=document.createElement("div");modal.id="bxStudySummaryModal";modal.className="bx-study-summary-modal";document.body.appendChild(modal)}
   modal.hidden=false;modal.innerHTML=`<div class="bx-study-summary-card"><header><div><small>BÍBLIA X</small><h3>📈 Resumo do Estudo</h3></div><button data-summary-close>×</button></header>
   <div class="bx-study-summary-grid">${[["📖",s.passages,"Passagens"],["⭐",s.favorites,"Favoritos"],["📝",s.notes,"Notas"],["🔖",s.bookmarks,"Marcadores"],["📚",s.collections,"Coleções"],["🏷️",s.tags,"Etiquetas"],["📅",s.plans,"Planos"],["🖍️",s.highlights,"Marca-textos"]].map(x=>`<div><span>${x[0]}</span><b>${x[1]}</b><small>${x[2]}</small></div>`).join("")}</div>
   <div class="bx-study-summary-actions"><button id="bxWorkspaceExport">⬇ Exportar Workspace</button><button id="bxWorkspaceRestore">↺ Restaurar sessão</button></div></div>`;
   modal.querySelector("[data-summary-close]")?.addEventListener("click",()=>modal.hidden=true);
   modal.querySelector("#bxWorkspaceExport")?.addEventListener("click",bxExportWorkspace);
   modal.querySelector("#bxWorkspaceRestore")?.addEventListener("click",async()=>{modal.hidden=true;await bxWorkspaceRestore()});
 };
 const bxReadingTimerKey="logos-bx:reading-minutes";let bxReadingStartedAt=Date.now();
 const bxReadingMinutesGet=()=>{try{return Number(localStorage.getItem(bxReadingTimerKey)||0)}catch(_){return 0}};
 const bxReadingMinutesCommit=()=>{const mins=Math.floor((Date.now()-bxReadingStartedAt)/60000);if(mins<1)return;try{localStorage.setItem(bxReadingTimerKey,String(bxReadingMinutesGet()+mins))}catch(_){}bxReadingStartedAt=Date.now()};
 window.addEventListener("beforeunload",bxReadingMinutesCommit);
 document.addEventListener("visibilitychange",()=>{if(document.hidden)bxReadingMinutesCommit();else bxReadingStartedAt=Date.now()});

 const bxActivityKey="logos-bx:activity-days";
 const bxActivityGet=()=>{try{return JSON.parse(localStorage.getItem(bxActivityKey)||"{}")}catch(_){return{}}};
 const bxActivityTouch=()=>{
   const d=bxActivityGet(),day=new Date().toISOString().slice(0,10);d[day]=(d[day]||0)+1;
   const keys=Object.keys(d).sort().slice(-90),out={};keys.forEach(k=>out[k]=d[k]);
   try{localStorage.setItem(bxActivityKey,JSON.stringify(out))}catch(_){}
 };
 const bxActivityStats=()=>{
   const d=bxActivityGet(),days=Object.keys(d).sort(),today=new Date(),fmt=x=>x.toISOString().slice(0,10);
   let streak=0,cursor=new Date(today);
   while(d[fmt(cursor)]){streak++;cursor.setDate(cursor.getDate()-1)}
   return {days:days.length,streak,total:Object.values(d).reduce((a,b)=>a+Number(b||0),0),recent:days.slice(-14).map(k=>({day:k,count:d[k]}))};
 };

 const bxMergeUnique=(a=[],b=[],keyFn=x=>JSON.stringify(x))=>{
   const out=[],seen=new Set();[...(a||[]),...(b||[])].forEach(x=>{const k=keyFn(x);if(!seen.has(k)){seen.add(k);out.push(x)}});return out;
 };
 const bxImportWorkspaceObject=(payload)=>{
   if(!payload||payload.schema!=="logos-master-x-biblia-x-workspace-v1")throw new Error("Arquivo de workspace incompatível.");
   try{
     if(payload.workspace)localStorage.setItem(bxWorkspaceKey,JSON.stringify(payload.workspace));
     if(payload.history)localStorage.setItem(bxHistoryKey,JSON.stringify(bxMergeUnique(bxHistoryGet(),payload.history,x=>x.ref)));
     if(payload.bookmarks)localStorage.setItem(bxBookmarksKey,JSON.stringify(bxMergeUnique(bxBookmarksGet(),payload.bookmarks,x=>x.ref).slice(0,100)));
     if(payload.quickrefs)localStorage.setItem(bxQuickRefsKey,JSON.stringify(bxMergeUnique(bxQuickRefsGet(),payload.quickrefs,x=>x.ref).slice(0,24)));
     if(payload.search_history)localStorage.setItem(bxSearchHistoryKey,JSON.stringify(bxMergeUnique(bxSearchHistoryGet(),payload.search_history,x=>String(x).toLowerCase()).slice(0,30)));
     if(payload.collections){const cur=bxCollectionsGet(),inc=payload.collections||{};Object.entries(inc).forEach(([n,items])=>cur[n]=bxMergeUnique(cur[n]||[],items||[],x=>x.ref).slice(0,200));bxCollectionsSave(cur)}
     if(payload.tags){const cur=bxTagsGet(),inc=payload.tags||{};Object.entries(inc).forEach(([ref,tags])=>cur[ref]=bxMergeUnique(cur[ref]||[],tags||[],x=>String(x).toLowerCase()).slice(0,20));bxTagsSave(cur)}
     if(payload.plans){const cur=bxPlansGet();Object.entries(payload.plans||{}).forEach(([n,p])=>{if(!cur[n])cur[n]=p;else{cur[n].refs=bxMergeUnique(cur[n].refs||[],p.refs||[],x=>x);cur[n].done=bxMergeUnique(cur[n].done||[],p.done||[],x=>x)}});bxPlansSave(cur)}
     if(payload.highlights){const cur=bxHighlightsGet();Object.assign(cur,payload.highlights||{});localStorage.setItem(bxHighlightsKey,JSON.stringify(cur))}
     if(payload.reading_progress)localStorage.setItem(bxReadingProgressKey,JSON.stringify(payload.reading_progress));
     if(payload.personal?.notes)payload.personal.notes.forEach(x=>localStorage.setItem(`logos-bx:note:${x.ref}`,x.value||""));
     if(payload.personal?.favorites)payload.personal.favorites.forEach(x=>localStorage.setItem(`logos-bx:fav:${x.ref}`,"1"));
     return true;
   }catch(e){throw e}
 };

 const bxImportWorkspaceFile=(file)=>{
   if(!file)return;
   const r=new FileReader();
   r.onload=()=>{
     try{
       const data=JSON.parse(String(r.result||"{}"));bxImportWorkspaceObject(data);
       alert("Workspace importado com sucesso. Os dados foram mesclados com os atuais.");
     }catch(e){alert("Não foi possível importar: "+(e.message||e))}
   };
   r.readAsText(file,"utf-8");
 };

 const bxRenderBackupCenter=()=>{
   let modal=document.getElementById("bxBackupCenter");
   if(!modal){modal=document.createElement("div");modal.id="bxBackupCenter";modal.className="bx-backup-center";document.body.appendChild(modal)}
   const a=bxActivityStats(),mins=bxReadingMinutesGet();
   modal.hidden=false;modal.innerHTML=`<div class="bx-backup-card"><header><div><small>BÍBLIA X</small><h3>🛡️ Backup & Continuidade</h3></div><button data-backup-close>×</button></header>
     <div class="bx-backup-actions"><button id="bxBackupExport">⬇ Exportar Workspace</button><label class="bx-backup-import">⬆ Importar Workspace<input id="bxBackupFile" type="file" accept=".json,application/json"></label><button id="bxBackupRestore">↺ Restaurar última sessão</button></div>
     <div class="bx-activity-summary"><div><b>${a.streak}</b><span>dias seguidos</span></div><div><b>${a.days}</b><span>dias ativos</span></div><div><b>${a.total}</b><span>aberturas registradas</span></div><div><b>${mins}</b><span>minutos locais</span></div></div>
     <div class="bx-activity-days">${a.recent.length?a.recent.map(x=>`<span title="${x.day} • ${x.count}"><i style="height:${Math.min(28,6+x.count*4)}px"></i><small>${x.day.slice(5)}</small></span>`).join(""):"<p>A atividade começará a aparecer conforme você usar a Bíblia X.</p>"}</div>
     <p class="bx-backup-note">A importação faz mesclagem: notas, favoritos, marcadores, coleções, etiquetas e planos atuais são preservados sempre que possível.</p>
   </div>`;
   modal.querySelector("[data-backup-close]")?.addEventListener("click",()=>modal.hidden=true);
   modal.querySelector("#bxBackupExport")?.addEventListener("click",bxExportWorkspace);
   modal.querySelector("#bxBackupRestore")?.addEventListener("click",async()=>{modal.hidden=true;await bxWorkspaceRestore()});
   modal.querySelector("#bxBackupFile")?.addEventListener("change",e=>bxImportWorkspaceFile(e.target.files?.[0]));
 };

 const bxStudyQueueKey="logos-bx:study-queue";
 const bxStudyQueueGet=()=>{try{return JSON.parse(localStorage.getItem(bxStudyQueueKey)||"[]")}catch(_){return[]}};
 const bxStudyQueueSave=a=>{try{localStorage.setItem(bxStudyQueueKey,JSON.stringify(a))}catch(_){}};
 const bxStudyQueueAdd=v=>{
   if(!v)return;let a=bxStudyQueueGet().filter(x=>x.ref!==v.ref);
   a=[{ref:v.ref,text:v.text,done:false,at:new Date().toISOString()},...a].slice(0,100);bxStudyQueueSave(a);
 };
 const bxStudyQueueToggle=ref=>{const a=bxStudyQueueGet();const x=a.find(v=>v.ref===ref);if(x)x.done=!x.done;bxStudyQueueSave(a)};
 const bxStudyQueueRemove=ref=>bxStudyQueueSave(bxStudyQueueGet().filter(x=>x.ref!==ref));
 const bxRenderStudyQueue=()=>{
   const a=bxStudyQueueGet();let modal=document.getElementById("bxStudyQueueModal");
   if(!modal){modal=document.createElement("div");modal.id="bxStudyQueueModal";modal.className="bx-study-queue-modal";document.body.appendChild(modal)}
   modal.hidden=false;modal.innerHTML=`<div class="bx-study-queue-card"><header><div><small>BÍBLIA X</small><h3>☑ Fila de Estudo</h3></div><button data-sq-close>×</button></header>
    <div class="bx-study-queue-list">${a.length?a.map(x=>`<article class="${x.done?"done":""}"><button data-sq-open="${escapeHtml(x.ref)}"><b>${escapeHtml(x.ref)}</b><span>${escapeHtml((x.text||"").slice(0,160))}</span></button><button data-sq-toggle="${escapeHtml(x.ref)}">${x.done?"↺":"✓"}</button><button data-sq-remove="${escapeHtml(x.ref)}">×</button></article>`).join(""):"<p>A fila está vazia.</p>"}</div></div>`;
   modal.querySelector("[data-sq-close]")?.addEventListener("click",()=>modal.hidden=true);
   modal.querySelectorAll("[data-sq-open]").forEach(b=>b.onclick=async()=>{const rr=await smartBibleRef(b.dataset.sqOpen);if(!rr.length)return;current=rr;if($("#bRef"))$("#bRef").value=b.dataset.sqOpen;renderBibleVerses(rr);modal.hidden=true});
   modal.querySelectorAll("[data-sq-toggle]").forEach(b=>b.onclick=()=>{bxStudyQueueToggle(b.dataset.sqToggle);bxRenderStudyQueue()});
   modal.querySelectorAll("[data-sq-remove]").forEach(b=>b.onclick=()=>{bxStudyQueueRemove(b.dataset.sqRemove);bxRenderStudyQueue()});
 };

 const bxGoalsKey="logos-bx:study-goals";
 const bxGoalsGet=()=>{try{return JSON.parse(localStorage.getItem(bxGoalsKey)||'{"daily":3}')}catch(_){return{daily:3}}};
 const bxGoalsSave=d=>{try{localStorage.setItem(bxGoalsKey,JSON.stringify(d))}catch(_){}};
 const bxTodayCount=()=>bxActivityGet()[new Date().toISOString().slice(0,10)]||0;
 const bxRenderGoal=()=>{
   const g=bxGoalsGet(),today=bxTodayCount(),pct=Math.min(100,Math.round(today/Math.max(1,g.daily)*100));
   let modal=document.getElementById("bxGoalModal");
   if(!modal){modal=document.createElement("div");modal.id="bxGoalModal";modal.className="bx-goal-modal";document.body.appendChild(modal)}
   modal.hidden=false;modal.innerHTML=`<div class="bx-goal-card"><header><div><small>BÍBLIA X</small><h3>🎯 Meta diária</h3></div><button data-goal-close>×</button></header>
    <div class="bx-goal-ring"><b>${pct}%</b><span>${today} de ${g.daily} leituras hoje</span></div><div class="bx-goal-progress"><i style="width:${pct}%"></i></div>
    <div class="bx-goal-set"><label>Meta de leituras por dia <input id="bxGoalDaily" type="number" min="1" max="50" value="${g.daily}"></label><button id="bxGoalSave">Salvar</button></div></div>`;
   modal.querySelector("[data-goal-close]")?.addEventListener("click",()=>modal.hidden=true);
   modal.querySelector("#bxGoalSave")?.addEventListener("click",()=>{bxGoalsSave({daily:Math.max(1,Math.min(50,Number(modal.querySelector("#bxGoalDaily")?.value||3)))});bxRenderGoal()});
 };

 const bxSessionNotesKey="logos-bx:session-note";
 const bxSessionNoteGet=()=>{try{return localStorage.getItem(bxSessionNotesKey)||""}catch(_){return""}};
 const bxRenderSessionNote=()=>{
   let modal=document.getElementById("bxSessionNoteModal");
   if(!modal){modal=document.createElement("div");modal.id="bxSessionNoteModal";modal.className="bx-session-note-modal";document.body.appendChild(modal)}
   modal.hidden=false;modal.innerHTML=`<div class="bx-session-note-card"><header><div><small>BÍBLIA X</small><h3>✍️ Bloco de Estudo</h3></div><button data-sn-close>×</button></header><textarea id="bxSessionNoteText" placeholder="Anotações gerais desta sessão...">${escapeHtml(bxSessionNoteGet())}</textarea><div><button id="bxSessionNoteSave">Salvar</button><button id="bxSessionNoteCopy">Copiar</button></div></div>`;
   modal.querySelector("[data-sn-close]")?.addEventListener("click",()=>modal.hidden=true);
   modal.querySelector("#bxSessionNoteSave")?.addEventListener("click",()=>{try{localStorage.setItem(bxSessionNotesKey,modal.querySelector("#bxSessionNoteText")?.value||"")}catch(_){};modal.hidden=true});
   modal.querySelector("#bxSessionNoteCopy")?.addEventListener("click",()=>bxCopyText(modal.querySelector("#bxSessionNoteText")?.value||""));
 };

 const bxSessionLogKey="logos-bx:session-log";
 const bxSessionLogGet=()=>{try{return JSON.parse(localStorage.getItem(bxSessionLogKey)||"[]")}catch(_){return[]}};
 const bxSessionLogPush=(ref)=>{
   ref=String(ref||"").trim();if(!ref)return;
   const now=new Date().toISOString(),list=bxSessionLogGet();
   list.unshift({ref,at:now});
   try{localStorage.setItem(bxSessionLogKey,JSON.stringify(list.slice(0,300)))}catch(_){}
 };
 const bxSearchPersonal=(q)=>{
   q=String(q||"").trim().toLowerCase();if(!q)return[];
   const p=bxPersonalItems(),bm=bxBookmarksGet(),cols=bxCollectionsGet(),tags=bxTagsGet(),queue=bxStudyQueueGet();
   const out=[];
   p.notes.forEach(x=>{if((x.ref+" "+x.value).toLowerCase().includes(q))out.push({type:"Nota",ref:x.ref,text:x.value})});
   p.favorites.forEach(x=>{if(x.ref.toLowerCase().includes(q))out.push({type:"Favorito",ref:x.ref,text:""})});
   bm.forEach(x=>{if((x.ref+" "+(x.text||"")).toLowerCase().includes(q))out.push({type:"Marcador",ref:x.ref,text:x.text||""})});
   Object.entries(tags).forEach(([ref,a])=>{if((ref+" "+(a||[]).join(" ")).toLowerCase().includes(q))out.push({type:"Etiqueta",ref,text:(a||[]).join(", ")})});
   Object.entries(cols).forEach(([name,a])=>(a||[]).forEach(x=>{if((name+" "+x.ref+" "+(x.text||"")).toLowerCase().includes(q))out.push({type:`Coleção: ${name}`,ref:x.ref,text:x.text||""})}));
   queue.forEach(x=>{if((x.ref+" "+(x.text||"")).toLowerCase().includes(q))out.push({type:"Fila",ref:x.ref,text:x.text||""})});
   return out.slice(0,120);
 };
 const bxRenderPersonalSearch=()=>{
   let modal=document.getElementById("bxPersonalSearchModal");
   if(!modal){modal=document.createElement("div");modal.id="bxPersonalSearchModal";modal.className="bx-personal-search-modal";document.body.appendChild(modal)}
   modal.hidden=false;modal.innerHTML=`<div class="bx-personal-search-card"><header><div><small>BÍBLIA X</small><h3>🔎 Buscar no Meu Estudo</h3></div><button data-ps-close>×</button></header>
    <div class="bx-personal-search-bar"><input id="bxPersonalSearchInput" placeholder="Nota, etiqueta, coleção, referência..."><button id="bxPersonalSearchGo">Buscar</button></div>
    <div id="bxPersonalSearchResults" class="bx-personal-search-results"><p>Digite um termo para pesquisar seus dados locais.</p></div></div>`;
   modal.querySelector("[data-ps-close]")?.addEventListener("click",()=>modal.hidden=true);
   const run=()=>{
     const q=modal.querySelector("#bxPersonalSearchInput")?.value||"",r=bxSearchPersonal(q),box=modal.querySelector("#bxPersonalSearchResults");
     box.innerHTML=r.length?r.map(x=>`<button data-ps-ref="${escapeHtml(x.ref)}"><small>${escapeHtml(x.type)}</small><b>${escapeHtml(x.ref)}</b><span>${escapeHtml((x.text||"").slice(0,180))}</span></button>`).join(""):"<p>Nenhum resultado.</p>";
     box.querySelectorAll("[data-ps-ref]").forEach(b=>b.onclick=async()=>{const rr=await smartBibleRef(b.dataset.psRef);if(!rr.length)return;current=rr;if($("#bRef"))$("#bRef").value=b.dataset.psRef;renderBibleVerses(rr);modal.hidden=true});
   };
   modal.querySelector("#bxPersonalSearchGo")?.addEventListener("click",run);
   modal.querySelector("#bxPersonalSearchInput")?.addEventListener("keydown",e=>{if(e.key==="Enter")run()});
 };

 const bxBacklinksFor=(ref)=>{
   const out=[];
   try{
     for(let i=0;i<localStorage.length;i++){
       const k=localStorage.key(i)||"";
       if(!k.startsWith("logos-bx:verse-links:"))continue;
       const from=k.slice("logos-bx:verse-links:".length),refs=JSON.parse(localStorage.getItem(k)||"[]");
       if(Array.isArray(refs)&&refs.includes(ref))out.push(from);
     }
   }catch(_){}
   return out;
 };
 const bxRenderBacklinks=(v)=>{
   if(!v)return;const refs=bxBacklinksFor(v.ref);
   let modal=document.getElementById("bxBacklinksModal");
   if(!modal){modal=document.createElement("div");modal.id="bxBacklinksModal";modal.className="bx-backlinks-modal";document.body.appendChild(modal)}
   modal.hidden=false;modal.innerHTML=`<div class="bx-backlinks-card"><header><div><small>BÍBLIA X</small><h3>↩ Referências de volta • ${escapeHtml(v.ref)}</h3></div><button data-bl-close>×</button></header>
    <div class="bx-backlinks-list">${refs.length?refs.map(r=>`<button data-bl-open="${escapeHtml(r)}">${escapeHtml(r)}</button>`).join(""):"<p>Nenhuma referência pessoal aponta para este versículo.</p>"}</div></div>`;
   modal.querySelector("[data-bl-close]")?.addEventListener("click",()=>modal.hidden=true);
   modal.querySelectorAll("[data-bl-open]").forEach(b=>b.onclick=()=>bxPreviewReference(b.dataset.blOpen));
 };

 const bxStudyReport=()=>{
   const s=bxStudySummary(),a=bxActivityStats(),mins=bxReadingMinutesGet(),queue=bxStudyQueueGet();
   const text=`# Relatório de Estudo — Bíblia X

## Resumo
- Passagens recentes: ${s.passages}
- Favoritos: ${s.favorites}
- Notas: ${s.notes}
- Marcadores: ${s.bookmarks}
- Coleções: ${s.collections}
- Etiquetas: ${s.tags}
- Planos: ${s.plans}
- Marca-textos: ${s.highlights}
- Fila de estudo: ${queue.length}
- Dias ativos: ${a.days}
- Sequência atual: ${a.streak} dias
- Minutos locais acumulados: ${mins}

Gerado em ${new Date().toLocaleString("pt-BR")}
`;
   bxDownloadText(`biblia-x-relatorio-${new Date().toISOString().slice(0,10)}.md`,text,"text/markdown");
 };

 const bxSelectionKey="logos-bx:selected-verses";
 const bxSelectionGet=()=>{try{return JSON.parse(localStorage.getItem(bxSelectionKey)||"[]")}catch(_){return[]}};
 const bxSelectionSave=a=>{try{localStorage.setItem(bxSelectionKey,JSON.stringify((a||[]).slice(0,120)))}catch(_){}};
 const bxSelectionHas=ref=>bxSelectionGet().some(x=>x.ref===ref);
 const bxSelectionToggle=v=>{
   if(!v)return false;let a=bxSelectionGet(),exists=a.some(x=>x.ref===v.ref);
   a=exists?a.filter(x=>x.ref!==v.ref):[...a,{ref:v.ref,text:v.text,book:v.book,bookCode:v.bookCode,chapter:v.chapter,verse:v.verse}];
   bxSelectionSave(a);return !exists;
 };
 const bxSelectionClear=()=>bxSelectionSave([]);
 const bxSelectionRows=()=>bxSelectionGet();

 const bxRenderSelectionBasket=()=>{
   const a=bxSelectionGet();let modal=document.getElementById("bxSelectionModal");
   if(!modal){modal=document.createElement("div");modal.id="bxSelectionModal";modal.className="bx-selection-modal";document.body.appendChild(modal)}
   modal.hidden=false;modal.innerHTML=`<div class="bx-selection-card"><header><div><small>BÍBLIA X</small><h3>☑ Versículos Selecionados</h3></div><button data-sel-close>×</button></header>
    <div class="bx-selection-actions"><button id="bxSelCopy">⧉ Copiar</button><button id="bxSelStudio">⚡ Studio X</button><button id="bxSelQueue">☑ Fila</button><button id="bxSelMarkdown">📦 Markdown</button><button id="bxSelClear">Limpar</button></div>
    <div class="bx-selection-list">${a.length?a.map(x=>`<article><button data-sel-open="${escapeHtml(x.ref)}"><b>${escapeHtml(x.ref)}</b><span>${escapeHtml(x.text||"")}</span></button><button data-sel-remove="${escapeHtml(x.ref)}">×</button></article>`).join(""):"<p>Nenhum versículo selecionado.</p>"}</div></div>`;
   modal.querySelector("[data-sel-close]")?.addEventListener("click",()=>modal.hidden=true);
   modal.querySelectorAll("[data-sel-open]").forEach(b=>b.onclick=async()=>{const rr=await smartBibleRef(b.dataset.selOpen);if(!rr.length)return;current=rr;if($("#bRef"))$("#bRef").value=b.dataset.selOpen;renderBibleVerses(rr);modal.hidden=true});
   modal.querySelectorAll("[data-sel-remove]").forEach(b=>b.onclick=()=>{bxSelectionSave(bxSelectionGet().filter(x=>x.ref!==b.dataset.selRemove));bxRenderSelectionBasket()});
   modal.querySelector("#bxSelCopy")?.addEventListener("click",()=>bxCopyText(bxPassageText(a)));
   modal.querySelector("#bxSelStudio")?.addEventListener("click",()=>{if(!a.length)return;current=a;sendStudio();modal.hidden=true});
   modal.querySelector("#bxSelQueue")?.addEventListener("click",()=>{a.forEach(x=>bxStudyQueueAdd(x));modal.querySelector("#bxSelQueue").textContent="✓ Adicionados"});
   modal.querySelector("#bxSelMarkdown")?.addEventListener("click",async()=>{if(!a.length)return;const snap=await bxBuildStudySnapshot(a),md=bxSnapshotMarkdown(snap);bxDownloadText("biblia-x-selecao.md",md,"text/markdown")});
   modal.querySelector("#bxSelClear")?.addEventListener("click",()=>{bxSelectionClear();bxRenderSelectionBasket()});
 };

 const bxAccessKey="logos-bx:accessibility";
 const bxAccessGet=()=>{try{return JSON.parse(localStorage.getItem(bxAccessKey)||'{"contrast":false,"reducedMotion":false,"compactTools":false}')}catch(_){return{contrast:false,reducedMotion:false,compactTools:false}}};
 const bxAccessSave=d=>{try{localStorage.setItem(bxAccessKey,JSON.stringify(d))}catch(_){}};
 const bxAccessApply=()=>{
   const d=bxAccessGet();
   document.body.classList.toggle("bx-high-contrast",!!d.contrast);
   document.body.classList.toggle("bx-reduced-motion",!!d.reducedMotion);
   document.body.classList.toggle("bx-compact-tools",!!d.compactTools);
 };
 const bxRenderAccessibility=()=>{
   const d=bxAccessGet();let modal=document.getElementById("bxAccessModal");
   if(!modal){modal=document.createElement("div");modal.id="bxAccessModal";modal.className="bx-access-modal";document.body.appendChild(modal)}
   modal.hidden=false;modal.innerHTML=`<div class="bx-access-card"><header><div><small>BÍBLIA X</small><h3>♿ Acessibilidade</h3></div><button data-access-close>×</button></header>
    <label><span>Alto contraste</span><input type="checkbox" data-access="contrast"${d.contrast?" checked":""}></label>
    <label><span>Reduzir animações</span><input type="checkbox" data-access="reducedMotion"${d.reducedMotion?" checked":""}></label>
    <label><span>Ferramentas compactas</span><input type="checkbox" data-access="compactTools"${d.compactTools?" checked":""}></label>
    <p>Atalhos: <b>Ctrl+K</b> pesquisa • <b>Alt+←/→</b> capítulo • <b>Esc</b> fecha painéis.</p></div>`;
   modal.querySelector("[data-access-close]")?.addEventListener("click",()=>modal.hidden=true);
   modal.querySelectorAll("[data-access]").forEach(x=>x.onchange=()=>{const n=bxAccessGet();n[x.dataset.access]=x.checked;bxAccessSave(n);bxAccessApply()});
 };
 bxAccessApply();

 const bxCloseOverlays=()=>{
   document.querySelectorAll(".bx-selection-modal,.bx-access-modal,.bx-personal-search-modal,.bx-backlinks-modal,.bx-study-queue-modal,.bx-goal-modal,.bx-session-note-modal,.bx-backup-center,.bx-study-summary-modal,.bx-parallel-modal,.bx-personal-links-modal,.bx-plans-modal,.bx-organizer-modal,.bx-collections-modal,.bx-dashboard-modal,.bx-quickrefs-modal,.bx-search-history-modal,.bx-bookmarks-modal,.bx-archive-modal,.bx-ref-preview,.bx-compare-modal").forEach(x=>x.hidden=true);
 };
 document.addEventListener("keydown",e=>{
   if((e.ctrlKey||e.metaKey)&&e.shiftKey&&e.key.toLowerCase()==="p"){e.preventDefault();bxRenderCommandPalette();return}
   if(e.key==="Escape"){bxCloseOverlays();return}
   if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==="k"){e.preventDefault();$("#bSearch")?.focus();$("#bSearch")?.select();return}
   if(e.altKey&&(e.key==="ArrowLeft"||e.key==="ArrowRight")){
     const btn=e.key==="ArrowLeft"?document.querySelector('[data-chapter-nav]:first-of-type'):document.querySelector('[data-chapter-nav]:last-of-type');
     if(btn&&!btn.disabled){e.preventDefault();btn.click()}
   }
 });

 const bxVerseCompareKey="logos-bx:verse-compare";
 const bxVerseCompareGet=()=>{try{return JSON.parse(localStorage.getItem(bxVerseCompareKey)||"[]")}catch(_){return[]}};
 const bxVerseCompareSave=a=>{try{localStorage.setItem(bxVerseCompareKey,JSON.stringify((a||[]).slice(0,12)))}catch(_){}};
 const bxVerseCompareToggle=v=>{
   if(!v)return false;let a=bxVerseCompareGet(),exists=a.some(x=>x.ref===v.ref);
   a=exists?a.filter(x=>x.ref!==v.ref):[...a,{ref:v.ref,text:v.text,book:v.book,bookCode:v.bookCode,chapter:v.chapter,verse:v.verse}];
   bxVerseCompareSave(a);return !exists;
 };
 const bxRenderVerseCompare=()=>{
   const a=bxVerseCompareGet();let modal=document.getElementById("bxVerseCompareModal");
   if(!modal){modal=document.createElement("div");modal.id="bxVerseCompareModal";modal.className="bx-verse-compare-modal";document.body.appendChild(modal)}
   modal.hidden=false;modal.innerHTML=`<div class="bx-verse-compare-card"><header><div><small>BÍBLIA X</small><h3>▦ Comparador de Versículos</h3></div><button data-vc-close>×</button></header>
    <div class="bx-verse-compare-actions"><button id="bxVcCopy">⧉ Copiar todos</button><button id="bxVcClear">Limpar</button></div>
    <div class="bx-verse-compare-grid">${a.length?a.map(x=>`<article><b>${escapeHtml(x.ref)}</b><p>${escapeHtml(x.text||"")}</p><button data-vc-open="${escapeHtml(x.ref)}">Abrir</button><button data-vc-remove="${escapeHtml(x.ref)}">Remover</button></article>`).join(""):"<p>Nenhum versículo adicionado.</p>"}</div></div>`;
   modal.querySelector("[data-vc-close]")?.addEventListener("click",()=>modal.hidden=true);
   modal.querySelector("#bxVcCopy")?.addEventListener("click",()=>bxCopyText(bxPassageText(a)));
   modal.querySelector("#bxVcClear")?.addEventListener("click",()=>{bxVerseCompareSave([]);bxRenderVerseCompare()});
   modal.querySelectorAll("[data-vc-remove]").forEach(b=>b.onclick=()=>{bxVerseCompareSave(bxVerseCompareGet().filter(x=>x.ref!==b.dataset.vcRemove));bxRenderVerseCompare()});
   modal.querySelectorAll("[data-vc-open]").forEach(b=>b.onclick=async()=>{const rr=await smartBibleRef(b.dataset.vcOpen);if(!rr.length)return;current=rr;if($("#bRef"))$("#bRef").value=b.dataset.vcOpen;renderBibleVerses(rr);modal.hidden=true});
 };

 const bxInsightsKey="logos-bx:insights";
 const bxInsightsGet=()=>{try{return JSON.parse(localStorage.getItem(bxInsightsKey)||"{}")}catch(_){return{}}};
 const bxInsightsSave=d=>{try{localStorage.setItem(bxInsightsKey,JSON.stringify(d))}catch(_){}};
 const bxInsightFor=ref=>bxInsightsGet()[ref]||"";
 const bxRenderInsight=(v)=>{
   if(!v)return;let modal=document.getElementById("bxInsightModal");
   if(!modal){modal=document.createElement("div");modal.id="bxInsightModal";modal.className="bx-insight-modal";document.body.appendChild(modal)}
   modal.hidden=false;modal.innerHTML=`<div class="bx-insight-card"><header><div><small>BÍBLIA X</small><h3>💡 Insight pessoal • ${escapeHtml(v.ref)}</h3></div><button data-insight-close>×</button></header>
   <textarea id="bxInsightText" placeholder="O que você percebeu neste versículo?">${escapeHtml(bxInsightFor(v.ref))}</textarea>
   <div class="bx-insight-actions"><button id="bxInsightSave">Salvar</button><button id="bxInsightCopy">Copiar</button><button id="bxInsightDelete">Excluir</button></div></div>`;
   modal.querySelector("[data-insight-close]")?.addEventListener("click",()=>modal.hidden=true);
   modal.querySelector("#bxInsightSave")?.addEventListener("click",()=>{const d=bxInsightsGet(),t=modal.querySelector("#bxInsightText")?.value||"";if(t.trim())d[v.ref]=t;else delete d[v.ref];bxInsightsSave(d);modal.hidden=true});
   modal.querySelector("#bxInsightCopy")?.addEventListener("click",()=>bxCopyText(modal.querySelector("#bxInsightText")?.value||""));
   modal.querySelector("#bxInsightDelete")?.addEventListener("click",()=>{const d=bxInsightsGet();delete d[v.ref];bxInsightsSave(d);modal.hidden=true});
 };

 const bxRenderRecentChapters=()=>{
   const hist=bxHistoryGet(),seen=new Set(),items=[];
   hist.forEach(x=>{
     const m=String(x.ref||"").match(/^(.+?)\s+(\d+)/);if(!m)return;
     const key=`${m[1]} ${m[2]}`;if(seen.has(key))return;seen.add(key);items.push(key);
   });
   let modal=document.getElementById("bxRecentChaptersModal");
   if(!modal){modal=document.createElement("div");modal.id="bxRecentChaptersModal";modal.className="bx-recent-chapters-modal";document.body.appendChild(modal)}
   modal.hidden=false;modal.innerHTML=`<div class="bx-recent-chapters-card"><header><div><small>BÍBLIA X</small><h3>🕘 Capítulos recentes</h3></div><button data-rc-close>×</button></header>
   <div class="bx-recent-chapters-list">${items.length?items.slice(0,30).map(x=>`<button data-rc-open="${escapeHtml(x)}">${escapeHtml(x)}</button>`).join(""):"<p>Nenhum capítulo recente.</p>"}</div></div>`;
   modal.querySelector("[data-rc-close]")?.addEventListener("click",()=>modal.hidden=true);
   modal.querySelectorAll("[data-rc-open]").forEach(b=>b.onclick=async()=>{const rr=await smartBibleRef(b.dataset.rcOpen);if(!rr.length)return;current=rr;if($("#bRef"))$("#bRef").value=b.dataset.rcOpen;renderBibleVerses(rr);modal.hidden=true});
 };

 const bxPinsKey="logos-bx:pinned-passages";
 const bxPinsGet=()=>{try{return JSON.parse(localStorage.getItem(bxPinsKey)||"[]")}catch(_){return[]}};
 const bxPinsSave=a=>{try{localStorage.setItem(bxPinsKey,JSON.stringify((a||[]).slice(0,40)))}catch(_){}};
 const bxPinToggle=v=>{
   if(!v)return false;let a=bxPinsGet(),on=a.some(x=>x.ref===v.ref);
   a=on?a.filter(x=>x.ref!==v.ref):[{ref:v.ref,text:v.text,at:new Date().toISOString()},...a];
   bxPinsSave(a);return !on;
 };
 const bxRenderPins=()=>{
   const a=bxPinsGet();let modal=document.getElementById("bxPinsModal");
   if(!modal){modal=document.createElement("div");modal.id="bxPinsModal";modal.className="bx-pins-modal";document.body.appendChild(modal)}
   modal.hidden=false;modal.innerHTML=`<div class="bx-pins-card"><header><div><small>BÍBLIA X</small><h3>📌 Passagens Fixadas</h3></div><button data-pins-close>×</button></header>
   <div class="bx-pins-list">${a.length?a.map(x=>`<article><button data-pin-open="${escapeHtml(x.ref)}"><b>${escapeHtml(x.ref)}</b><span>${escapeHtml((x.text||"").slice(0,180))}</span></button><button data-pin-remove="${escapeHtml(x.ref)}">×</button></article>`).join(""):"<p>Nenhuma passagem fixada.</p>"}</div></div>`;
   modal.querySelector("[data-pins-close]")?.addEventListener("click",()=>modal.hidden=true);
   modal.querySelectorAll("[data-pin-open]").forEach(b=>b.onclick=async()=>{const rr=await smartBibleRef(b.dataset.pinOpen);if(!rr.length)return;current=rr;if($("#bRef"))$("#bRef").value=b.dataset.pinOpen;renderBibleVerses(rr);modal.hidden=true});
   modal.querySelectorAll("[data-pin-remove]").forEach(b=>b.onclick=()=>{bxPinsSave(bxPinsGet().filter(x=>x.ref!==b.dataset.pinRemove));bxRenderPins()});
 };

 const bxFocusKey="logos-bx:focus-passage";
 const bxFocusGet=()=>{try{return JSON.parse(localStorage.getItem(bxFocusKey)||"null")}catch(_){return null}};
 const bxFocusSet=v=>{try{if(v)localStorage.setItem(bxFocusKey,JSON.stringify({ref:v.ref,text:v.text,at:new Date().toISOString()}));else localStorage.removeItem(bxFocusKey)}catch(_){}};
 const bxRenderFocus=()=>{
   const f=bxFocusGet();let modal=document.getElementById("bxFocusModal");
   if(!modal){modal=document.createElement("div");modal.id="bxFocusModal";modal.className="bx-focus-modal";document.body.appendChild(modal)}
   modal.hidden=false;modal.innerHTML=`<div class="bx-focus-card"><header><div><small>BÍBLIA X</small><h3>🎯 Versículo em Foco</h3></div><button data-focus-close>×</button></header>
   ${f?`<div class="bx-focus-content"><b>${escapeHtml(f.ref)}</b><p>${escapeHtml(f.text||"")}</p><button id="bxFocusOpen">Abrir</button><button id="bxFocusCopy">Copiar</button><button id="bxFocusClear">Remover foco</button></div>`:"<p>Nenhum versículo definido como foco.</p>"}</div>`;
   modal.querySelector("[data-focus-close]")?.addEventListener("click",()=>modal.hidden=true);
   modal.querySelector("#bxFocusOpen")?.addEventListener("click",async()=>{const rr=await smartBibleRef(f.ref);if(!rr.length)return;current=rr;if($("#bRef"))$("#bRef").value=f.ref;renderBibleVerses(rr);modal.hidden=true});
   modal.querySelector("#bxFocusCopy")?.addEventListener("click",()=>bxCopyText(`${f.ref}\n${f.text||""}`));
   modal.querySelector("#bxFocusClear")?.addEventListener("click",()=>{bxFocusSet(null);bxRenderFocus()});
 };

 const bxQuickExport=async(rows=[])=>{
   if(!rows.length)return;
   const snap=await bxBuildStudySnapshot(rows);
   const txt=`${bxPassageText(rows)}\n\n${snap.notes?.length?"NOTAS\n"+snap.notes.map(x=>`${x.ref}: ${x.value}`).join("\n")+"\n\n":""}${snap.tags&&Object.keys(snap.tags).length?"ETIQUETAS\n"+Object.entries(snap.tags).map(([r,a])=>`${r}: ${(a||[]).join(", ")}`).join("\n"):""}`;
   bxDownloadText(`biblia-x-${String(rows[0].ref||"estudo").replace(/[^\w-]+/g,"-")}.txt`,txt,"text/plain");
 };

 const bxRenderCommandPalette=()=>{
   let modal=document.getElementById("bxCommandModal");
   if(!modal){modal=document.createElement("div");modal.id="bxCommandModal";modal.className="bx-command-modal";document.body.appendChild(modal)}
   const actions=[
    ["🔎","Buscar no Meu Estudo",()=>bxRenderPersonalSearch()],
    ["☑","Versículos selecionados",()=>bxRenderSelectionBasket()],
    ["▦","Comparador",()=>bxRenderVerseCompare()],
    ["📌","Passagens fixadas",()=>bxRenderPins()],
    ["🎯","Versículo em foco",()=>bxRenderFocus()],
    ["📅","Planos de leitura",()=>bxRenderReadingPlans()],
    ["🛡️","Backup",()=>bxRenderBackupCenter()],
    ["♿","Acessibilidade",()=>bxRenderAccessibility()]
   ];
   modal.hidden=false;modal.innerHTML=`<div class="bx-command-card"><header><div><small>BÍBLIA X</small><h3>⌘ Central Rápida</h3></div><button data-cmd-close>×</button></header><div class="bx-command-list">${actions.map((x,i)=>`<button data-cmd="${i}"><span>${x[0]}</span><b>${x[1]}</b></button>`).join("")}</div></div>`;
   modal.querySelector("[data-cmd-close]")?.addEventListener("click",()=>modal.hidden=true);
   modal.querySelectorAll("[data-cmd]").forEach(b=>b.onclick=()=>{modal.hidden=true;actions[Number(b.dataset.cmd)]?.[2]?.()});
 };

 const bxTopicsKey="logos-bx:study-topics";
 const bxTopicsGet=()=>{try{return JSON.parse(localStorage.getItem(bxTopicsKey)||"{}")}catch(_){return{}}};
 const bxTopicsSave=d=>{try{localStorage.setItem(bxTopicsKey,JSON.stringify(d))}catch(_){}};
 const bxTopicAdd=(name,v)=>{
   name=String(name||"").trim();if(!name||!v)return;
   const d=bxTopicsGet();d[name]=d[name]||[];
   if(!d[name].some(x=>x.ref===v.ref))d[name].unshift({ref:v.ref,text:v.text});
   d[name]=d[name].slice(0,100);bxTopicsSave(d);
 };
 const bxRenderTopics=(v=null)=>{
   const d=bxTopicsGet(),names=Object.keys(d).sort((a,b)=>a.localeCompare(b,"pt-BR"));
   let modal=document.getElementById("bxTopicsModal");
   if(!modal){modal=document.createElement("div");modal.id="bxTopicsModal";modal.className="bx-topics-modal";document.body.appendChild(modal)}
   modal.hidden=false;modal.innerHTML=`<div class="bx-topics-card"><header><div><small>BÍBLIA X</small><h3>🗂️ Tópicos de Estudo</h3></div><button data-topic-close>×</button></header>
   ${v?`<div class="bx-topic-add"><input id="bxTopicName" placeholder="Ex.: Graça, Missões, Fé"><button id="bxTopicAdd">+ Vincular ${escapeHtml(v.ref)}</button></div>`:""}
   <div class="bx-topics-list">${names.length?names.map(n=>`<section><h4>${escapeHtml(n)} <small>${d[n].length}</small></h4><div>${d[n].map(x=>`<button data-topic-open="${escapeHtml(x.ref)}">${escapeHtml(x.ref)}</button>`).join("")}</div><button data-topic-delete="${escapeHtml(n)}">Excluir tópico</button></section>`).join(""):"<p>Nenhum tópico pessoal criado.</p>"}</div></div>`;
   modal.querySelector("[data-topic-close]")?.addEventListener("click",()=>modal.hidden=true);
   modal.querySelector("#bxTopicAdd")?.addEventListener("click",()=>{bxTopicAdd(modal.querySelector("#bxTopicName")?.value,v);bxRenderTopics(v)});
   modal.querySelectorAll("[data-topic-open]").forEach(b=>b.onclick=()=>bxPreviewReference(b.dataset.topicOpen));
   modal.querySelectorAll("[data-topic-delete]").forEach(b=>b.onclick=()=>{const x=bxTopicsGet();delete x[b.dataset.topicDelete];bxTopicsSave(x);bxRenderTopics(v)});
 };

 const bxPresentationKey="logos-bx:presentation";
 const bxPresentationGet=()=>{try{return JSON.parse(localStorage.getItem(bxPresentationKey)||'{"font":38,"showRef":true}')}catch(_){return{font:38,showRef:true}}};
 const bxPresentationSave=d=>{try{localStorage.setItem(bxPresentationKey,JSON.stringify(d))}catch(_){}};
 const bxRenderPresentation=(rows=[])=>{
   if(!rows.length)return;const p=bxPresentationGet();
   let modal=document.getElementById("bxPresentationModal");
   if(!modal){modal=document.createElement("div");modal.id="bxPresentationModal";modal.className="bx-presentation-modal";document.body.appendChild(modal)}
   modal.hidden=false;modal.innerHTML=`<div class="bx-presentation-stage" style="--bx-present-font:${p.font}px"><button data-present-close>×</button><div class="bx-presentation-text">${rows.map(v=>`<p>${p.showRef?`<b>${escapeHtml(v.ref)}</b>`:""} ${escapeHtml(v.text)}</p>`).join("")}</div><footer><button data-present-smaller>A−</button><button data-present-bigger>A+</button><button data-present-ref>${p.showRef?"Ocultar":"Mostrar"} referência</button></footer></div>`;
   modal.querySelector("[data-present-close]")?.addEventListener("click",()=>modal.hidden=true);
   modal.querySelector("[data-present-smaller]")?.addEventListener("click",()=>{const n=bxPresentationGet();n.font=Math.max(22,n.font-4);bxPresentationSave(n);bxRenderPresentation(rows)});
   modal.querySelector("[data-present-bigger]")?.addEventListener("click",()=>{const n=bxPresentationGet();n.font=Math.min(72,n.font+4);bxPresentationSave(n);bxRenderPresentation(rows)});
   modal.querySelector("[data-present-ref]")?.addEventListener("click",()=>{const n=bxPresentationGet();n.showRef=!n.showRef;bxPresentationSave(n);bxRenderPresentation(rows)});
 };

 const bxReadingListKey="logos-bx:reading-list";
 const bxReadingListGet=()=>{try{return JSON.parse(localStorage.getItem(bxReadingListKey)||"[]")}catch(_){return[]}};
 const bxReadingListSave=a=>{try{localStorage.setItem(bxReadingListKey,JSON.stringify((a||[]).slice(0,100)))}catch(_){}};
 const bxReadingListAdd=v=>{if(!v)return;let a=bxReadingListGet().filter(x=>x.ref!==v.ref);a.unshift({ref:v.ref,text:v.text,at:new Date().toISOString()});bxReadingListSave(a)};
 const bxRenderReadingList=()=>{
   const a=bxReadingListGet();let modal=document.getElementById("bxReadingListModal");
   if(!modal){modal=document.createElement("div");modal.id="bxReadingListModal";modal.className="bx-reading-list-modal";document.body.appendChild(modal)}
   modal.hidden=false;modal.innerHTML=`<div class="bx-reading-list-card"><header><div><small>BÍBLIA X</small><h3>📚 Ler Depois</h3></div><button data-rl-close>×</button></header><div class="bx-reading-list-items">${a.length?a.map(x=>`<article><button data-rl-open="${escapeHtml(x.ref)}"><b>${escapeHtml(x.ref)}</b><span>${escapeHtml((x.text||"").slice(0,160))}</span></button><button data-rl-remove="${escapeHtml(x.ref)}">×</button></article>`).join(""):"<p>Nenhuma passagem na lista.</p>"}</div></div>`;
   modal.querySelector("[data-rl-close]")?.addEventListener("click",()=>modal.hidden=true);
   modal.querySelectorAll("[data-rl-open]").forEach(b=>b.onclick=async()=>{const rr=await smartBibleRef(b.dataset.rlOpen);if(!rr.length)return;current=rr;if($("#bRef"))$("#bRef").value=b.dataset.rlOpen;renderBibleVerses(rr);modal.hidden=true});
   modal.querySelectorAll("[data-rl-remove]").forEach(b=>b.onclick=()=>{bxReadingListSave(bxReadingListGet().filter(x=>x.ref!==b.dataset.rlRemove));bxRenderReadingList()});
 };

 const bxReadingSessionsKey="logos-bx:reading-sessions";
 const bxReadingSessionsGet=()=>{try{return JSON.parse(localStorage.getItem(bxReadingSessionsKey)||"[]")}catch(_){return[]}};
 const bxReadingSessionsSave=a=>{try{localStorage.setItem(bxReadingSessionsKey,JSON.stringify((a||[]).slice(0,100)))}catch(_){}};
 const bxReadingSessionAdd=(rows=[])=>{
   if(!rows.length)return;const first=rows[0],last=rows[rows.length-1],ref=rows.length===1?first.ref:(first.book===last.book&&first.chapter===last.chapter?`${first.book} ${first.chapter}:${first.verse}-${last.verse}`:first.ref);
   let a=bxReadingSessionsGet();a.unshift({ref,translation:selectedTranslation(),at:new Date().toISOString(),count:rows.length});bxReadingSessionsSave(a);
 };
 const bxRenderReadingSessions=()=>{
   const a=bxReadingSessionsGet();let modal=document.getElementById("bxReadingSessionsModal");
   if(!modal){modal=document.createElement("div");modal.id="bxReadingSessionsModal";modal.className="bx-reading-sessions-modal";document.body.appendChild(modal)}
   modal.hidden=false;modal.innerHTML=`<div class="bx-reading-sessions-card"><header><div><small>BÍBLIA X</small><h3>🧭 Sessões de Leitura</h3></div><button data-rs-close>×</button></header><div class="bx-reading-sessions-list">${a.length?a.slice(0,50).map(x=>`<button data-rs-open="${escapeHtml(x.ref)}"><b>${escapeHtml(x.ref)}</b><span>${new Date(x.at).toLocaleString("pt-BR")} • ${x.count} versículo(s)</span></button>`).join(""):"<p>Nenhuma sessão registrada.</p>"}</div></div>`;
   modal.querySelector("[data-rs-close]")?.addEventListener("click",()=>modal.hidden=true);
   modal.querySelectorAll("[data-rs-open]").forEach(b=>b.onclick=async()=>{const rr=await smartBibleRef(b.dataset.rsOpen);if(!rr.length)return;current=rr;if($("#bRef"))$("#bRef").value=b.dataset.rsOpen;renderBibleVerses(rr);modal.hidden=true});
 };
 const bxWordListKey="logos-bx:word-list";
 const bxWordListGet=()=>{try{return JSON.parse(localStorage.getItem(bxWordListKey)||"[]")}catch(_){return[]}};
 const bxWordListSave=a=>{try{localStorage.setItem(bxWordListKey,JSON.stringify((a||[]).slice(0,100)))}catch(_){}};
 const bxWordListAdd=(word,ref)=>{word=String(word||"").trim();if(!word)return;let a=bxWordListGet().filter(x=>x.word.toLowerCase()!==word.toLowerCase());a.unshift({word,ref:ref||"",at:new Date().toISOString()});bxWordListSave(a)};
 const bxRenderWordList=(v=null)=>{
   const a=bxWordListGet();let modal=document.getElementById("bxWordListModal");
   if(!modal){modal=document.createElement("div");modal.id="bxWordListModal";modal.className="bx-word-list-modal";document.body.appendChild(modal)}
   modal.hidden=false;modal.innerHTML=`<div class="bx-word-list-card"><header><div><small>BÍBLIA X</small><h3>🔤 Palavras de Estudo</h3></div><button data-wl-close>×</button></header>${v?`<div class="bx-word-add"><input id="bxWordInput" placeholder="Palavra importante em ${escapeHtml(v.ref)}"><button id="bxWordAdd">+ Adicionar</button></div>`:""}<div class="bx-word-list">${a.length?a.map(x=>`<article><div><b>${escapeHtml(x.word)}</b><small>${escapeHtml(x.ref||"")}</small></div><button data-wl-search="${escapeHtml(x.word)}">Pesquisar</button><button data-wl-remove="${escapeHtml(x.word)}">×</button></article>`).join(""):"<p>Nenhuma palavra salva.</p>"}</div></div>`;
   modal.querySelector("[data-wl-close]")?.addEventListener("click",()=>modal.hidden=true);
   modal.querySelector("#bxWordAdd")?.addEventListener("click",()=>{bxWordListAdd(modal.querySelector("#bxWordInput")?.value,v?.ref);bxRenderWordList(v)});
   modal.querySelectorAll("[data-wl-search]").forEach(b=>b.onclick=()=>{if($("#bSearch"))$("#bSearch").value=b.dataset.wlSearch;modal.hidden=true;$("#bSearch")?.focus()});
   modal.querySelectorAll("[data-wl-remove]").forEach(b=>b.onclick=()=>{bxWordListSave(bxWordListGet().filter(x=>x.word!==b.dataset.wlRemove));bxRenderWordList(v)});
 };

 const bxSnapshotsKey="logos-bx:passage-snapshots";
 const bxSnapshotsGet=()=>{try{return JSON.parse(localStorage.getItem(bxSnapshotsKey)||"[]")}catch(_){return[]}};
 const bxSnapshotsSave=a=>{try{localStorage.setItem(bxSnapshotsKey,JSON.stringify((a||[]).slice(0,60)))}catch(_){}};
 const bxSnapshotCreate=(rows=[])=>{
   if(!rows.length)return;
   const first=rows[0],last=rows[rows.length-1];
   const ref=rows.length===1?first.ref:(first.book===last.book&&first.chapter===last.chapter?`${first.book} ${first.chapter}:${first.verse}-${last.verse}`:first.ref);
   const snap={
     id:`snap-${Date.now()}`,ref,translation:selectedTranslation(),font:bxGetFontScale(),
     reading:document.body.classList.contains("bx-reading-mode"),
     selected:bxSelectionGet(),at:new Date().toISOString()
   };
   const a=bxSnapshotsGet();a.unshift(snap);bxSnapshotsSave(a);
 };
 const bxSnapshotRestore=async(snap)=>{
   if(!snap)return false;
   try{
     if($("#bVersion")&&snap.translation)$("#bVersion").value=snap.translation;
     if(snap.font)bxApplyFontScale(Number(snap.font));
     document.body.classList.toggle("bx-reading-mode",!!snap.reading);
     if(Array.isArray(snap.selected))bxSelectionSave(snap.selected);
     const rr=await smartBibleRef(snap.ref);if(!rr.length)return false;
     current=rr;if($("#bRef"))$("#bRef").value=snap.ref;renderBibleVerses(rr);return true;
   }catch(_){return false}
 };
 const bxRenderSnapshots=()=>{
   const a=bxSnapshotsGet();let modal=document.getElementById("bxSnapshotsModal");
   if(!modal){modal=document.createElement("div");modal.id="bxSnapshotsModal";modal.className="bx-snapshots-modal";document.body.appendChild(modal)}
   modal.hidden=false;modal.innerHTML=`<div class="bx-snapshots-card"><header><div><small>BÍBLIA X</small><h3>📸 Snapshots de Estudo</h3></div><button data-snap-close>×</button></header>
   <div class="bx-snapshots-list">${a.length?a.map(x=>`<article><button data-snap-open="${escapeHtml(x.id)}"><b>${escapeHtml(x.ref)}</b><span>${new Date(x.at).toLocaleString("pt-BR")} • ${escapeHtml(x.translation||"")}</span></button><button data-snap-remove="${escapeHtml(x.id)}">×</button></article>`).join(""):"<p>Nenhum snapshot salvo.</p>"}</div></div>`;
   modal.querySelector("[data-snap-close]")?.addEventListener("click",()=>modal.hidden=true);
   modal.querySelectorAll("[data-snap-open]").forEach(b=>b.onclick=async()=>{const s=bxSnapshotsGet().find(x=>x.id===b.dataset.snapOpen);const ok=await bxSnapshotRestore(s);if(ok)modal.hidden=true});
   modal.querySelectorAll("[data-snap-remove]").forEach(b=>b.onclick=()=>{bxSnapshotsSave(bxSnapshotsGet().filter(x=>x.id!==b.dataset.snapRemove));bxRenderSnapshots()});
 };

 const bxTrailKey="logos-bx:navigation-trail";
 const bxTrailGet=()=>{try{return JSON.parse(localStorage.getItem(bxTrailKey)||"[]")}catch(_){return[]}};
 const bxTrailPush=(rows=[])=>{
   if(!rows.length)return;const ref=rows[0].ref;
   const a=[{ref,at:new Date().toISOString()},...bxTrailGet().filter(x=>x.ref!==ref)].slice(0,25);
   try{localStorage.setItem(bxTrailKey,JSON.stringify(a))}catch(_){}
 };
 const bxRenderTrail=()=>{
   const a=bxTrailGet();let modal=document.getElementById("bxTrailModal");
   if(!modal){modal=document.createElement("div");modal.id="bxTrailModal";modal.className="bx-trail-modal";document.body.appendChild(modal)}
   modal.hidden=false;modal.innerHTML=`<div class="bx-trail-card"><header><div><small>BÍBLIA X</small><h3>🧭 Trilha de Navegação</h3></div><button data-trail-close>×</button></header>
   <div class="bx-trail-list">${a.length?a.map((x,i)=>`<button data-trail-open="${escapeHtml(x.ref)}"><span>${i+1}</span><b>${escapeHtml(x.ref)}</b><small>${new Date(x.at).toLocaleTimeString("pt-BR",{hour:"2-digit",minute:"2-digit"})}</small></button>`).join(""):"<p>Nenhuma navegação registrada.</p>"}</div></div>`;
   modal.querySelector("[data-trail-close]")?.addEventListener("click",()=>modal.hidden=true);
   modal.querySelectorAll("[data-trail-open]").forEach(b=>b.onclick=async()=>{const rr=await smartBibleRef(b.dataset.trailOpen);if(!rr.length)return;current=rr;if($("#bRef"))$("#bRef").value=b.dataset.trailOpen;renderBibleVerses(rr);modal.hidden=true});
 };

 const bxReviewKey="logos-bx:review-status";
 const bxReviewGet=()=>{try{return JSON.parse(localStorage.getItem(bxReviewKey)||"{}")}catch(_){return{}}};
 const bxReviewSave=d=>{try{localStorage.setItem(bxReviewKey,JSON.stringify(d))}catch(_){}};
 const bxReviewSet=(ref,status)=>{
   const d=bxReviewGet();if(!status)delete d[ref];else d[ref]={status,at:new Date().toISOString()};bxReviewSave(d);
 };
 const bxReviewFor=ref=>bxReviewGet()[ref]?.status||"";
 const bxRenderReviewQueue=()=>{
   const d=bxReviewGet(),items=Object.entries(d).map(([ref,v])=>({ref,...v})).sort((a,b)=>String(b.at).localeCompare(String(a.at)));
   let modal=document.getElementById("bxReviewModal");
   if(!modal){modal=document.createElement("div");modal.id="bxReviewModal";modal.className="bx-review-modal";document.body.appendChild(modal)}
   modal.hidden=false;modal.innerHTML=`<div class="bx-review-card"><header><div><small>BÍBLIA X</small><h3>✅ Revisão de Versículos</h3></div><button data-review-close>×</button></header>
   <div class="bx-review-list">${items.length?items.map(x=>`<article class="${escapeHtml(x.status)}"><button data-review-open="${escapeHtml(x.ref)}"><b>${escapeHtml(x.ref)}</b><small>${x.status==="review"?"Revisar novamente":"Estudado"}</small></button><button data-review-clear="${escapeHtml(x.ref)}">×</button></article>`).join(""):"<p>Nenhum status de revisão salvo.</p>"}</div></div>`;
   modal.querySelector("[data-review-close]")?.addEventListener("click",()=>modal.hidden=true);
   modal.querySelectorAll("[data-review-open]").forEach(b=>b.onclick=async()=>{const rr=await smartBibleRef(b.dataset.reviewOpen);if(!rr.length)return;current=rr;if($("#bRef"))$("#bRef").value=b.dataset.reviewOpen;renderBibleVerses(rr);modal.hidden=true});
   modal.querySelectorAll("[data-review-clear]").forEach(b=>b.onclick=()=>{bxReviewSet(b.dataset.reviewClear,"");bxRenderReviewQueue()});
 };

 const bxRenderReviewPicker=(v,button)=>{
   let pop=document.getElementById("bxReviewPicker");if(pop)pop.remove();
   pop=document.createElement("div");pop.id="bxReviewPicker";pop.className="bx-review-picker";
   pop.innerHTML=`<button data-rv="studied">✓ Estudado</button><button data-rv="review">↺ Revisar depois</button><button data-rv="">Remover status</button>`;
   document.body.appendChild(pop);const r=button.getBoundingClientRect();pop.style.left=Math.min(r.left,window.innerWidth-230)+"px";pop.style.top=(r.bottom+5)+"px";
   pop.querySelectorAll("[data-rv]").forEach(b=>b.onclick=()=>{bxReviewSet(v.ref,b.dataset.rv);button.textContent=b.dataset.rv==="studied"?"✓ Estudado":b.dataset.rv==="review"?"↺ Revisar":"✅ Revisão";pop.remove()});
 };

 const bxQuestionsKey="logos-bx:verse-questions";
 const bxQuestionsGet=()=>{try{return JSON.parse(localStorage.getItem(bxQuestionsKey)||"{}")}catch(_){return{}}};
 const bxQuestionsSave=d=>{try{localStorage.setItem(bxQuestionsKey,JSON.stringify(d))}catch(_){}};
 const bxRenderQuestions=(v)=>{
   if(!v)return;const d=bxQuestionsGet(),a=d[v.ref]||[];
   let modal=document.getElementById("bxQuestionsModal");
   if(!modal){modal=document.createElement("div");modal.id="bxQuestionsModal";modal.className="bx-questions-modal";document.body.appendChild(modal)}
   modal.hidden=false;modal.innerHTML=`<div class="bx-questions-card"><header><div><small>BÍBLIA X</small><h3>❓ Perguntas • ${escapeHtml(v.ref)}</h3></div><button data-q-close>×</button></header>
   <div class="bx-question-add"><input id="bxQuestionInput" placeholder="Pergunta para estudar depois..."><button id="bxQuestionAdd">Adicionar</button></div>
   <div class="bx-question-list">${a.length?a.map((x,i)=>`<article><span>${escapeHtml(x.text)}</span><button data-q-done="${i}">${x.done?"↺":"✓"}</button><button data-q-remove="${i}">×</button></article>`).join(""):"<p>Nenhuma pergunta vinculada.</p>"}</div></div>`;
   modal.querySelector("[data-q-close]")?.addEventListener("click",()=>modal.hidden=true);
   modal.querySelector("#bxQuestionAdd")?.addEventListener("click",()=>{const t=modal.querySelector("#bxQuestionInput")?.value?.trim();if(!t)return;const x=bxQuestionsGet();x[v.ref]=x[v.ref]||[];x[v.ref].push({text:t,done:false,at:new Date().toISOString()});bxQuestionsSave(x);bxRenderQuestions(v)});
   modal.querySelectorAll("[data-q-done]").forEach(b=>b.onclick=()=>{const x=bxQuestionsGet();x[v.ref][Number(b.dataset.qDone)].done=!x[v.ref][Number(b.dataset.qDone)].done;bxQuestionsSave(x);bxRenderQuestions(v)});
   modal.querySelectorAll("[data-q-remove]").forEach(b=>b.onclick=()=>{const x=bxQuestionsGet();x[v.ref].splice(Number(b.dataset.qRemove),1);bxQuestionsSave(x);bxRenderQuestions(v)});
 };

 const bxLinksMapKey="logos-bx:study-links-map";
 const bxLinksMapGet=()=>{try{return JSON.parse(localStorage.getItem(bxLinksMapKey)||"{}")}catch(_){return{}}};
 const bxLinksMapSave=d=>{try{localStorage.setItem(bxLinksMapKey,JSON.stringify(d))}catch(_){}};
 const bxRenderStudyLinks=(v)=>{
   if(!v)return;const d=bxLinksMapGet(),a=d[v.ref]||[];
   let modal=document.getElementById("bxStudyLinksModal");
   if(!modal){modal=document.createElement("div");modal.id="bxStudyLinksModal";modal.className="bx-study-links-modal";document.body.appendChild(modal)}
   modal.hidden=false;modal.innerHTML=`<div class="bx-study-links-card"><header><div><small>BÍBLIA X</small><h3>🔗 Ligações pessoais • ${escapeHtml(v.ref)}</h3></div><button data-sl-close>×</button></header>
   <div class="bx-study-link-add"><input id="bxStudyLinkInput" placeholder="Ex.: Romanos 8:1"><button id="bxStudyLinkAdd">Vincular</button></div>
   <div class="bx-study-links-list">${a.length?a.map((r,i)=>`<article><button data-sl-open="${escapeHtml(r)}">${escapeHtml(r)}</button><button data-sl-remove="${i}">×</button></article>`).join(""):"<p>Nenhuma ligação pessoal.</p>"}</div></div>`;
   modal.querySelector("[data-sl-close]")?.addEventListener("click",()=>modal.hidden=true);
   modal.querySelector("#bxStudyLinkAdd")?.addEventListener("click",()=>{const r=modal.querySelector("#bxStudyLinkInput")?.value?.trim();if(!r)return;const x=bxLinksMapGet();x[v.ref]=x[v.ref]||[];if(!x[v.ref].includes(r))x[v.ref].push(r);bxLinksMapSave(x);bxRenderStudyLinks(v)});
   modal.querySelectorAll("[data-sl-open]").forEach(b=>b.onclick=()=>bxPreviewReference(b.dataset.slOpen));
   modal.querySelectorAll("[data-sl-remove]").forEach(b=>b.onclick=()=>{const x=bxLinksMapGet();x[v.ref].splice(Number(b.dataset.slRemove),1);bxLinksMapSave(x);bxRenderStudyLinks(v)});
 };

 const bxReviewStats=()=>{
   const d=bxReviewGet(),vals=Object.values(d),studied=vals.filter(x=>x.status==="studied").length,review=vals.filter(x=>x.status==="review").length;
   const q=bxQuestionsGet(),questions=Object.values(q).flat(),openQ=questions.filter(x=>!x.done).length;
   return {studied,review,questions:questions.length,openQ};
 };
 const bxRenderProgress=()=>{
   const s=bxReviewStats(),a=bxActivityStats(),queue=bxStudyQueueGet(),sel=bxSelectionGet();
   let modal=document.getElementById("bxProgressModal");
   if(!modal){modal=document.createElement("div");modal.id="bxProgressModal";modal.className="bx-progress-modal";document.body.appendChild(modal)}
   modal.hidden=false;modal.innerHTML=`<div class="bx-progress-card"><header><div><small>BÍBLIA X</small><h3>📊 Progresso de Estudo</h3></div><button data-pg-close>×</button></header>
   <div class="bx-progress-grid"><div><b>${s.studied}</b><span>Estudados</span></div><div><b>${s.review}</b><span>Para revisar</span></div><div><b>${s.openQ}</b><span>Perguntas abertas</span></div><div><b>${a.streak}</b><span>Dias em sequência</span></div><div><b>${queue.length}</b><span>Na fila</span></div><div><b>${sel.length}</b><span>Selecionados</span></div></div></div>`;
   modal.querySelector("[data-pg-close]")?.addEventListener("click",()=>modal.hidden=true);
 };

 const bxExportPersonalStudy=()=>{
   const data={version:"biblia-x-personal-study-1",exportedAt:new Date().toISOString(),questions:bxQuestionsGet(),links:bxLinksMapGet(),review:bxReviewGet(),topics:bxTopicsGet(),words:bxWordListGet(),insights:bxInsightsGet(),pins:bxPinsGet(),readingList:bxReadingListGet()};
   bxDownloadText(`biblia-x-estudo-pessoal-${new Date().toISOString().slice(0,10)}.json`,JSON.stringify(data,null,2),"application/json");
 };

 const bxV144SetsKey="logos-bx:v144-sets";
 const bxV144SetsGet=()=>{try{return JSON.parse(localStorage.getItem(bxV144SetsKey)||"{}")}catch(_){return{}}};
 const bxV144SetsSave=d=>{try{localStorage.setItem(bxV144SetsKey,JSON.stringify(d))}catch(_){}};
 const bxV144SetAdd=(name,v)=>{name=String(name||"").trim();if(!name||!v)return;const d=bxV144SetsGet();d[name]=d[name]||[];if(!d[name].some(x=>x.ref===v.ref))d[name].unshift({ref:v.ref,text:v.text});bxV144SetsSave(d)};
 const bxV144RenderSets=(v=null)=>{
   const d=bxV144SetsGet(),names=Object.keys(d);let m=document.getElementById("bxV144SetsModal");
   if(!m){m=document.createElement("div");m.id="bxV144SetsModal";m.className="bx-v144-modal";document.body.appendChild(m)}
   m.hidden=false;m.innerHTML=`<div class="bx-v144-card"><header><div><small>BÍBLIA X</small><h3>🗃️ Coleções de Estudo</h3></div><button data-x>×</button></header>${v?`<div class="bx-v144-add"><input id="bxV144SetName" placeholder="Nome da coleção"><button id="bxV144SetAdd">Adicionar ${escapeHtml(v.ref)}</button></div>`:""}<div class="bx-v144-list">${names.length?names.map(n=>`<section><h4>${escapeHtml(n)} <small>${d[n].length}</small></h4>${d[n].map(x=>`<button data-open="${escapeHtml(x.ref)}">${escapeHtml(x.ref)}</button>`).join("")}<button data-export="${escapeHtml(n)}">Exportar</button></section>`).join(""):"<p>Nenhuma coleção criada.</p>"}</div></div>`;
   m.querySelector("[data-x]")?.addEventListener("click",()=>m.hidden=true);
   m.querySelector("#bxV144SetAdd")?.addEventListener("click",()=>{bxV144SetAdd(m.querySelector("#bxV144SetName")?.value,v);bxV144RenderSets(v)});
   m.querySelectorAll("[data-open]").forEach(b=>b.onclick=()=>bxPreviewReference(b.dataset.open));
   m.querySelectorAll("[data-export]").forEach(b=>b.onclick=()=>bxDownloadText(`biblia-x-colecao-${b.dataset.export.replace(/[^\w-]+/g,"-")}.txt`,bxPassageText(bxV144SetsGet()[b.dataset.export]||[]),"text/plain"));
 };
 const bxV144DailyKey="logos-bx:v144-daily";
 const bxV144DailyGet=()=>{try{return JSON.parse(localStorage.getItem(bxV144DailyKey)||"{}")}catch(_){return{}}};
 const bxV144DailySave=d=>{try{localStorage.setItem(bxV144DailyKey,JSON.stringify(d))}catch(_){}};
 const bxV144Today=()=>new Date().toISOString().slice(0,10);
 const bxV144SetDaily=v=>{if(!v)return;const d=bxV144DailyGet();d[bxV144Today()]={ref:v.ref,text:v.text,done:false};bxV144DailySave(d)};
 const bxV144RenderDaily=()=>{
   const d=bxV144DailyGet(),k=bxV144Today(),x=d[k];let m=document.getElementById("bxV144DailyModal");
   if(!m){m=document.createElement("div");m.id="bxV144DailyModal";m.className="bx-v144-modal";document.body.appendChild(m)}
   m.hidden=false;m.innerHTML=`<div class="bx-v144-card"><header><div><small>BÍBLIA X</small><h3>☀️ Estudo do Dia</h3></div><button data-x>×</button></header>${x?`<article class="bx-v144-daily"><b>${escapeHtml(x.ref)}</b><p>${escapeHtml(x.text||"")}</p><button id="bxV144DailyOpen">Abrir</button><button id="bxV144DailyDone">${x.done?"↺ Reabrir":"✓ Concluir"}</button></article>`:"<p>Defina um versículo como estudo do dia.</p>"}</div>`;
   m.querySelector("[data-x]")?.addEventListener("click",()=>m.hidden=true);
   m.querySelector("#bxV144DailyOpen")?.addEventListener("click",async()=>{const rr=await smartBibleRef(x.ref);if(rr.length){current=rr;if($("#bRef"))$("#bRef").value=x.ref;renderBibleVerses(rr);m.hidden=true}});
   m.querySelector("#bxV144DailyDone")?.addEventListener("click",()=>{const z=bxV144DailyGet();z[k].done=!z[k].done;bxV144DailySave(z);bxV144RenderDaily()});
 };
 const bxV144RenderDashboard=()=>{
   const sets=bxV144SetsGet(),review=bxReviewStats(),daily=bxV144DailyGet()[bxV144Today()];let m=document.getElementById("bxV144DashboardModal");
   if(!m){m=document.createElement("div");m.id="bxV144DashboardModal";m.className="bx-v144-modal";document.body.appendChild(m)}
   const total=Object.values(sets).reduce((n,a)=>n+(a?.length||0),0);
   m.hidden=false;m.innerHTML=`<div class="bx-v144-card"><header><div><small>BÍBLIA X</small><h3>🏛️ Painel do Estudo</h3></div><button data-x>×</button></header><div class="bx-v144-grid"><div><b>${review.studied}</b><span>Estudados</span></div><div><b>${review.review}</b><span>Revisar</span></div><div><b>${review.openQ}</b><span>Perguntas</span></div><div><b>${Object.keys(sets).length}</b><span>Coleções</span></div><div><b>${total}</b><span>Nas coleções</span></div><div><b>${daily?.done?"✓":"—"}</b><span>Estudo do dia</span></div></div></div>`;
   m.querySelector("[data-x]")?.addEventListener("click",()=>m.hidden=true);
 };
 const bxV144ExportMarkdown=(rows=[])=>{
   if(!rows.length)return;const notes=bxNotesGet(),ins=bxInsightsGet(),q=bxQuestionsGet();let md=`# ${rows[0].ref}\n\n`;
   rows.forEach(v=>{md+=`## ${v.ref}\n\n${v.text}\n\n`;if(notes[v.ref])md+=`**Nota:** ${notes[v.ref]}\n\n`;if(ins[v.ref])md+=`**Insight:** ${ins[v.ref]}\n\n`;if(q[v.ref]?.length)md+=`**Perguntas:**\n${q[v.ref].map(x=>`- [${x.done?"x":" "}] ${x.text}`).join("\n")}\n\n`});
   bxDownloadText(`biblia-x-estudo-${String(rows[0].ref).replace(/[^\w-]+/g,"-")}.md`,md,"text/markdown");
 };

 const bxV171ResearchKey="logos-bx:v171-research-index";
 const bxV171ResearchGet=()=>{try{return JSON.parse(localStorage.getItem(bxV171ResearchKey)||"{}")}catch(_){return{}}};
 const bxV171ResearchSave=d=>{try{localStorage.setItem(bxV171ResearchKey,JSON.stringify(d||{}))}catch(_){}};
 const bxV171ResearchAdd=(v)=>{
   if(!v)return;
   const tag=prompt("Etiqueta para "+v.ref+" (ex.: graça, fé, missões, Espírito Santo):");
   if(!tag?.trim())return;
   const d=bxV171ResearchGet(),ref=v.ref;
   d[ref]=d[ref]||{text:v.text||"",tags:[],createdAt:new Date().toISOString()};
   if(!d[ref].tags.includes(tag.trim()))d[ref].tags.push(tag.trim());
   bxV171ResearchSave(d);
 };
 const bxV171ResearchRemove=(ref)=>{
   const d=bxV171ResearchGet();delete d[ref];bxV171ResearchSave(d);bxV171RenderResearch();
 };
 const bxV171RenderResearch=()=>{
   const d=bxV171ResearchGet(),entries=Object.entries(d);
   let m=document.getElementById("bxV171ResearchModal");
   if(!m){m=document.createElement("div");m.id="bxV171ResearchModal";m.className="bx-v171-modal";document.body.appendChild(m)}
   const tagCount=entries.reduce((n,[,x])=>n+(x.tags?.length||0),0);
   m.hidden=false;
   m.innerHTML=`<div class="bx-v171-card">
     <header><div><small>LOGOS MASTER X • BÍBLIA X</small><h3>🧠 Central de Pesquisa</h3></div><button data-v171-close>×</button></header>
     <div class="bx-v171-stats"><div><b>${entries.length}</b><span>Passagens</span></div><div><b>${tagCount}</b><span>Etiquetas</span></div><div><b>${new Set(entries.flatMap(([,x])=>x.tags||[])).size}</b><span>Temas</span></div></div>
     <div class="bx-v171-list">${entries.length?entries.map(([ref,x])=>`<article><div><b>${escapeHtml(ref)}</b><span>${(x.tags||[]).map(t=>`#${escapeHtml(t)}`).join(" ")}</span><small>${escapeHtml((x.text||"").slice(0,150))}</small></div><button data-v171-open="${escapeHtml(ref)}">Abrir</button><button data-v171-remove="${escapeHtml(ref)}">×</button></article>`).join(""):"<p>Nenhuma passagem indexada ainda. Use “🏷️ Indexar” em um versículo.</p>"}</div>
   </div>`;
   m.querySelector("[data-v171-close]")?.addEventListener("click",()=>m.hidden=true);
   m.querySelectorAll("[data-v171-open]").forEach(b=>b.onclick=async()=>{const rr=await smartBibleRef(b.dataset.v171Open);if(rr.length){current=rr;if($("#bRef"))$("#bRef").value=b.dataset.v171Open;renderBibleVerses(rr);m.hidden=true}});
   m.querySelectorAll("[data-v171-remove]").forEach(b=>b.onclick=()=>bxV171ResearchRemove(b.dataset.v171Remove));
 };
 const bxV171ExportResearch=()=>{
   const d={format:"LOGOS-BIBLIA-X-RESEARCH",version:"1.71",exportedAt:new Date().toISOString(),index:bxV171ResearchGet()};
   bxDownloadText(`biblia-x-indice-pesquisa-${new Date().toISOString().slice(0,10)}.json`,JSON.stringify(d,null,2),"application/json");
 };
 const bxV171RenderThemes=()=>{
   const d=bxV171ResearchGet(),map={};
   Object.entries(d).forEach(([ref,x])=>(x.tags||[]).forEach(t=>{map[t]=map[t]||[];map[t].push(ref)}));
   let m=document.getElementById("bxV171ThemesModal");
   if(!m){m=document.createElement("div");m.id="bxV171ThemesModal";m.className="bx-v171-modal";document.body.appendChild(m)}
   const themes=Object.entries(map).sort((a,b)=>a[0].localeCompare(b[0],"pt-BR"));
   m.hidden=false;m.innerHTML=`<div class="bx-v171-card"><header><div><small>BÍBLIA X</small><h3>🏷️ Índice Temático Pessoal</h3></div><button data-v171-close>×</button></header><div class="bx-v171-themes">${themes.length?themes.map(([t,refs])=>`<section><h4>${escapeHtml(t)} <small>${refs.length}</small></h4><div>${refs.map(r=>`<button data-v171-open="${escapeHtml(r)}">${escapeHtml(r)}</button>`).join("")}</div></section>`).join(""):"<p>Nenhum tema indexado.</p>"}</div></div>`;
   {const x=m.querySelector("[data-v171-close]");if(x)x.onclick=()=>m.hidden=true;}
   m.querySelectorAll("[data-v171-open]").forEach(b=>b.onclick=async()=>{const rr=await smartBibleRef(b.dataset.v171Open);if(rr.length){current=rr;if($("#bRef"))$("#bRef").value=b.dataset.v171Open;renderBibleVerses(rr);m.hidden=true}});
 };
 const bxBuildStudySnapshot=async(rows=[])=>{
   if(!rows.length)return null;
   const v=rows[0];
   let ctx={},refs=[],topics=[],strong=[];
   try{const r=await bxFetch(`/api/bible/context?translation=${encodeURIComponent(selectedTranslation())}&book=${encodeURIComponent(v.bookCode)}&chapter=${v.chapter}&verse=${v.verse}`);ctx=await r.json()}catch(_){}
   try{refs=await bxServerCrossrefs(v)}catch(_){}
   try{topics=await bxServerNave(v)}catch(_){}
   try{const r=await bxFetch(`/api/bible/strong?translation=${encodeURIComponent(selectedTranslation())}&book=${encodeURIComponent(v.bookCode)}&chapter=${v.chapter}&verse=${v.verse}`);strong=(await r.json()).words||[]}catch(_){}
   return {
     generated_at:new Date().toISOString(),
     translation:selectedTranslation(),
     passage:rows.map(x=>({reference:x.ref,text:x.text})),
     context:ctx,
     crossrefs:refs.slice(0,30),
     topics:topics.slice(0,30).map(x=>({...x,topic_pt:bxNaveTopicPt(x.topic)})),
     strong:strong.slice(0,80).map(x=>({strong:x.strong,lemma:x.lexicon_lemma||x.lemma,transliteration:x.transliteration,morph:x.morph}))
   };
 };
 const bxSnapshotMarkdown=(s)=>{
   if(!s)return"";
   const refs=(s.crossrefs||[]).map(x=>`- ${x.reference}`).join("\n");
   const topics=(s.topics||[]).map(x=>`- ${x.topic_pt||x.topic}`).join("\n");
   const strong=(s.strong||[]).filter(x=>x.strong).slice(0,30).map(x=>`- ${x.strong} — ${x.lemma||""}${x.transliteration?` (${x.transliteration})`:""}`).join("\n");
   return `# Bíblia X — Pacote de Estudo\n\n## Passagem\n${s.passage.map(x=>`**${x.reference}** — ${x.text}`).join("\n\n")}\n\n## Contexto\n- Testamento: ${s.context?.book?.testament||"—"}\n- Livro: ${s.context?.book?.name_pt||"—"}\n- Capítulo: ${s.context?.passage?.chapter||"—"}\n\n## Temas\n${topics||"- Nenhum tema carregado"}\n\n## Referências Cruzadas\n${refs||"- Nenhuma referência carregada"}\n\n## Strong\n${strong||"- Nenhuma entrada carregada"}\n\n---\nGerado pelo LOGOS MASTER X — Bíblia X`;
 };
 const bxRenderDnaPanel=async(v)=>{
   const body=$("#bxVcBody");if(!body||!v)return;
   body.innerHTML=`<div class="bx-vc-verse"><b>${escapeHtml(v.ref)}</b><span>${escapeHtml(v.text)}</span></div><div class="bx-dna-loading">🧬 Preparando DNA K7 da passagem...</div>`;
   const snap=await bxBuildStudySnapshot([v]);
   const refs=snap?.crossrefs||[],topics=snap?.topics||[],strong=snap?.strong||[];
   const score=Math.min(100,35+Math.min(25,refs.length*2)+Math.min(20,topics.length*3)+Math.min(20,strong.filter(x=>x.strong).length));
   const stages=[
     ["Texto","Passagem bíblica preservada como centro do estudo."],
     ["Contexto",`${snap?.context?.book?.name_pt||v.book} • ${snap?.context?.book?.testament||""}`],
     ["Conexões",`${refs.length} referências cruzadas principais disponíveis.`],
     ["Temas",`${topics.length} temas relacionados disponíveis.`],
     ["Palavras",`${strong.filter(x=>x.strong).length} marcações Strong carregadas.`],
     ["Aplicação","Enviar a passagem e seus dados ao Studio X para desenvolvimento."]
   ];
   body.innerHTML=`<div class="bx-vc-verse"><b>${escapeHtml(v.ref)}</b><span>${escapeHtml(v.text)}</span></div>
    <div class="bx-dna-head"><div><b>🧬 DNA K7 da Passagem</b><small>Análise estrutural baseada nos bancos integrados</small></div><strong>${score}%</strong></div>
    <div class="bx-dna-track"><i style="width:${score}%"></i></div>
    <div class="bx-dna-stages">${stages.map((x,i)=>`<article><span>${i+1}</span><div><b>${escapeHtml(x[0])}</b><small>${escapeHtml(x[1])}</small></div></article>`).join("")}</div>
    <div class="bx-dna-actions"><button id="bxDnaStudio">⚡ Enviar ao Studio X</button><button id="bxDnaPack">📦 Gerar pacote de estudo</button></div>
    <p class="bx-dna-note">O DNA K7 organiza dados bíblicos já disponíveis; não substitui exegese, oração ou discernimento ministerial.</p>`;
   $("#bxDnaStudio")?.addEventListener("click",()=>{current=[v];if($("#bRef"))$("#bRef").value=v.ref;sendStudio()});
   $("#bxDnaPack")?.addEventListener("click",async()=>{
     const md=bxSnapshotMarkdown(snap),safe=v.ref.replace(/[^\wÀ-ÿ]+/g,"-");
     bxDownloadText(`biblia-x-estudo-${safe}.md`,md,"text/markdown");
     $("#bxVcStatus").textContent="✓ Pacote de estudo gerado";
   });
 };
 const openVerseContext=(key,v)=>{const m=verseTools[key];if(!m||!v)return;bxActiveVerse=v;const p=$("#bxVerseContext");$("#bxVcKind").textContent=`${m[0]} ${key.toUpperCase()}`;$("#bxVcTitle").textContent=`${m[1]} • ${v.ref}`;$("#bxVcNote").value=bxLoadLocal("note",v.ref,"");const fav=bxLoadLocal("fav",v.ref,"0")==="1";$("#bxVcFavorite").textContent=fav?"★ Favoritado":"☆ Favoritar";$("#bxVcStatus").textContent="";p.hidden=false;if(key==="cross"){bxRenderCrossPanel(v)}else if(key==="strong"){bxRenderStrongPanel(v)}else if(key==="lexicon"){bxRenderLexiconPanel(v)}else if(key==="context"){bxRenderContextPanel(v)}else if(key==="comments"){bxRenderCommentsPanel(v)}else if(key==="dna"){bxRenderDnaPanel(v)}else{$("#bxVcBody").innerHTML=`<div class="bx-vc-verse"><b>${escapeHtml(v.ref)}</b><span>${escapeHtml(v.text)}</span></div><div class="bx-vc-grid">${m[2].map(x=>`<button data-bx-resource="${escapeHtml(x)}"><b>${escapeHtml(x)}</b><small>Recurso vinculado a esta passagem</small></button>`).join("")}</div>`;$("#bxVcBody").querySelectorAll("[data-bx-resource]").forEach(b=>b.onclick=()=>b.classList.toggle("selected"))}p.scrollIntoView({behavior:"smooth",block:"nearest"})};

 const bxEntityPeople=new Set(["Jesus","Cristo","Pedro","Paulo","João","Tiago","André","Filipe","Tomé","Mateus","Moisés","Abraão","Abrão","Sara","Sarai","Ló","Isaque","Rebeca","Jacó","Israel","José","Judá","Davi","Salomão","Samuel","Saul","Elias","Eliseu","Isaías","Jeremias","Ezequiel","Daniel","Maria","Marta","Lázaro","Nicodemos","Pilatos","Pôncio Pilatos","Herodes","Caifás","Barnabé","Timóteo","Tito","Rute","Noemi","Ester","Mardoqueu","Josué","Calebe","Arão","Débora","Gideão","Sansão","Neemias","Esdras","Jó"]);
 const bxEntityPlaces=new Set(["Jerusalém","Belém","Galileia","Nazaré","Cafarnaum","Samaria","Judeia","Egito","Israel","Roma","Corinto","Éfeso","Antioquia","Damasco","Betânia","Jericó","Caná","Sinai","Sião","Babilônia","Nínive","Társis","Jordão","Canaã","Ur dos Caldeus","Ur","Harã","Hebrom","Betel","Ai","Berseba","Sodoma","Gomorra","Moriá","Edom","Moabe","Amom","Filístia","Mar da Galileia","Mar Morto","Getsêmani","Gólgota","Patmos","Creta","Chipre","Macedônia","Acaia"]);
 const bxLinkifyEntities=(text)=>{
   // V1.60.2 — renderização segura de entidades.
   // Não reutiliza o HTML já gerado e não usa <button> dentro do texto do verso.
   // Isso evita DOM quebrado quando um nome existe em mais de uma categoria
   // (ex.: Israel = pessoa/nome e lugar/nação).
   const html=escapeHtml(String(text||""));
   const typeByKey=new Map();
   const names=[];
   const add=(name,type)=>{
     const key=String(name).toLocaleLowerCase("pt-BR");
     if(!typeByKey.has(key)){ names.push(name); typeByKey.set(key,type); }
     else if(typeByKey.get(key)!==type){
       // Em nomes ambíguos, prioriza mapa/região para não criar dois links sobrepostos.
       typeByKey.set(key,"maps");
     }
   };
   bxEntityPeople.forEach(name=>add(name,"people"));
   bxEntityPlaces.forEach(name=>add(name,"maps"));
   names.sort((a,b)=>b.length-a.length);
   if(!html||!names.length)return html;
   const pattern=names.map(name=>name.replace(/[.*+?^${}()|[\]\\]/g,"\\$&")).join("|");
   const re=new RegExp(`(^|[^A-Za-zÀ-ÿ])(${pattern})(?=$|[^A-Za-zÀ-ÿ])`,"gi");
   return html.replace(re,(m,p,n)=>{
     const type=typeByKey.get(String(n).toLocaleLowerCase("pt-BR"))||"maps";
     const safeName=escapeHtml(n);
     return `${p}<span class="bx-entity-link" role="button" tabindex="0" data-bx-entity="${type}" data-bx-entity-name="${safeName}" title="Abrir conteúdo contextual de ${safeName}">${safeName}</span>`;
   });
 };
 const bxHighlightQuery=(text,q)=>{
   if(!q)return escapeHtml(text||"");
   const raw=String(text||""),safe=String(q).replace(/[.*+?^${}()|[\]\\]/g,"\\$&");
   return escapeHtml(raw).replace(new RegExp(`(${safe})`,"gi"),'<mark>$1</mark>');
 };
 const bxOpenEntityModule=(type,name)=>{
   if(type==="people"){
     activate("people");document.querySelector('[data-bible-section="people"]')?.click();
     setTimeout(()=>{const q=document.querySelector("#bxPeopleQuery,#bxPersonQuery");if(q){q.value=name;q.dispatchEvent(new Event("input",{bubbles:true}))}},30);
   }else if(type==="maps"){
     activate("maps");document.querySelector('[data-bible-section="maps"]')?.click();
     setTimeout(()=>{const q=document.querySelector("#bxMapQuery");if(q){q.value=name;q.dispatchEvent(new Event("input",{bubbles:true}))}},30);
   }else{
     activate("global");document.querySelector('[data-bible-section="global"]')?.click();
     setTimeout(()=>{const q=document.querySelector("#bxGlobalQuery");if(q){q.value=name;document.querySelector("#bxGlobalFind")?.click()}},30);
   }
 };
 
 const BX_ENTITY_TRAIL_KEY="bibleXEntityTrailV156";
 const bxEntityTrailGet=()=>Store.get(BX_ENTITY_TRAIL_KEY,[])||[];
 const bxEntityTrailPush=(type,name)=>{
   let trail=bxEntityTrailGet().filter(x=>!(x.type===type&&x.name===name));
   trail.unshift({type,name,at:Date.now()});
   trail=trail.slice(0,8);
   Store.set(BX_ENTITY_TRAIL_KEY,trail);
   return trail;
 };
 const bxEntityTrailHtml=()=>{
   const trail=bxEntityTrailGet();
   if(!trail.length)return "";
   return `<div class="bx-eq-trail"><span>Explorados:</span>${trail.map(x=>`<button type="button" data-eq-trail-type="${x.type}" data-eq-trail-name="${escapeHtml(x.name)}">${x.type==="people"?"👤":"🗺️"} ${escapeHtml(x.name)}</button>`).join("")}</div>`;
 };
 const bxEntityOverview=(type,name)=>{
   if(type==="people"){
     return `<div class="bx-eq-overview">
       <div class="bx-eq-card"><span>👤 Tipo</span><b>Personagem bíblico</b></div>
       <div class="bx-eq-card"><span>🔎 Ação rápida</span><b>Ver passagens relacionadas</b></div>
       <div class="bx-eq-card"><span>🔗 Cadeia</span><b>Personagem → lugares → passagens → mapas</b></div>
     </div>`;
   }
   return `<div class="bx-eq-overview">
     <div class="bx-eq-card"><span>🗺️ Tipo</span><b>Lugar / região bíblica</b></div>
     <div class="bx-eq-card"><span>🔎 Ação rápida</span><b>Ver passagens relacionadas</b></div>
     <div class="bx-eq-card"><span>🔗 Cadeia</span><b>Lugar → pessoas → passagens → contexto</b></div>
   </div>`;
 };
 const bxExtractRelatedEntities=(rows,currentName)=>{
   const names=[];
   const all=[...bxEntityPeople].map(x=>[x,"people"]).concat([...bxEntityPlaces].map(x=>[x,"maps"]));
   const joined=(rows||[]).map(x=>x.text||"").join(" ");
   for(const [name,type] of all){
     if(name===currentName)continue;
     const re=new RegExp(`(^|[^A-Za-zÀ-ÿ])${name.replace(/[.*+?^${}()|[\]\\]/g,"\\$&")}(?=$|[^A-Za-zÀ-ÿ])`,"i");
     if(re.test(joined))names.push({name,type});
     if(names.length>=10)break;
   }
   return names;
 };

 const bxOpenEntity=async(type,name)=>{
   bxEntityTrailPush(type,name);
   let panel=document.getElementById("bxEntityQuickPanel");
   if(!panel){
     panel=document.createElement("aside");
     panel.id="bxEntityQuickPanel";
     panel.className="bx-entity-quick-panel";
     document.body.appendChild(panel);
   }
   panel.hidden=false;
   panel.innerHTML=`<div class="bx-eq-head">
      <div><span class="bx-eq-icon">${type==="people"?"👤":"🗺️"}</span><div><b>${escapeHtml(name)}</b><small>${type==="people"?"Pessoa / personagem bíblico":"Lugar / região bíblica"}</small></div></div>
      <button type="button" data-eq-close>✕</button>
    </div>
    ${bxEntityTrailHtml()}
    <div class="bx-eq-tabs">
      <button type="button" class="active" data-eq-tab="overview">Visão geral</button>
      <button type="button" data-eq-tab="passages">Passagens</button>
      <button type="button" data-eq-tab="related">Relacionados</button>
      <button type="button" data-eq-tab="actions">Abrir módulo</button>
    </div>
    <div class="bx-eq-body">${bxEntityOverview(type,name)}</div>`;

   const body=panel.querySelector(".bx-eq-body");
   const selectTab=async(tab)=>{
     panel.querySelectorAll("[data-eq-tab]").forEach(b=>b.classList.toggle("active",b.dataset.eqTab===tab));
     if(tab==="overview"){body.innerHTML=bxEntityOverview(type,name);return}
     if(tab==="actions"){
       body.innerHTML=`<div class="bx-eq-action-grid">
         <button type="button" data-eq-full>${type==="people"?"👤 Abrir Personagens":"🗺️ Abrir Mapas"}</button>
         <button type="button" data-eq-global>🔎 Pesquisa X</button>
         <button type="button" data-eq-copy>⧉ Copiar nome</button>
       </div>`;
       body.querySelector("[data-eq-full]").onclick=()=>{panel.hidden=true;bxOpenEntityModule(type,name)};
       body.querySelector("[data-eq-global]").onclick=()=>{panel.hidden=true;bxOpenEntityModule("global",name)};
       body.querySelector("[data-eq-copy]").onclick=async()=>{await bxCopyText(name);body.querySelector("[data-eq-copy]").textContent="✓ Copiado"};
       return;
     }

     body.innerHTML='<div class="bx-eq-loading">Pesquisando na Bíblia X...</div>';
     try{
       const rr=await smartBibleSearch(name);
       const hits=(rr||[]).slice(0,24);
       if(tab==="passages"){
         body.innerHTML=hits.length?`<div class="bx-eq-results">${hits.map(v=>`<button type="button" data-eq-ref="${escapeHtml(v.ref)}"><b>${escapeHtml(v.ref)}</b><span>${escapeHtml(v.text)}</span></button>`).join("")}</div>`:'<div class="bx-eq-hint">Nenhuma ocorrência encontrada nesta base.</div>';
         body.querySelectorAll("[data-eq-ref]").forEach(b=>b.onclick=async()=>{
           const ref=b.dataset.eqRef;
           const rows=await smartBibleRef(ref);
           if(!rows.length)return;
           current=rows;
           if($("#bRef"))$("#bRef").value=ref;
           renderBibleVerses(rows);
           panel.hidden=true;
           setTimeout(()=>document.querySelector(`[data-ref="${CSS.escape(ref)}"]`)?.scrollIntoView({behavior:"smooth",block:"center"}),50);
         });
       }else{
         const rel=bxExtractRelatedEntities(hits,name);
         body.innerHTML=rel.length?`<div class="bx-eq-related">${rel.map(x=>`<button type="button" data-eq-related-type="${x.type}" data-eq-related-name="${escapeHtml(x.name)}"><span>${x.type==="people"?"👤":"🗺️"}</span><b>${escapeHtml(x.name)}</b><small>Abrir relação em cadeia</small></button>`).join("")}</div>`:'<div class="bx-eq-hint">Nenhuma relação automática encontrada nas primeiras ocorrências.</div>';
         body.querySelectorAll("[data-eq-related-name]").forEach(b=>b.onclick=()=>bxOpenEntity(b.dataset.eqRelatedType,b.dataset.eqRelatedName));
       }
     }catch(e){
       body.innerHTML=`<div class="bx-eq-hint">Falha na pesquisa: ${escapeHtml(e.message||String(e))}</div>`;
     }
   };

   panel.querySelector("[data-eq-close]").onclick=()=>panel.hidden=true;
   panel.querySelectorAll("[data-eq-tab]").forEach(b=>b.onclick=()=>selectTab(b.dataset.eqTab));
   panel.querySelectorAll("[data-eq-trail-name]").forEach(b=>b.onclick=()=>bxOpenEntity(b.dataset.eqTrailType,b.dataset.eqTrailName));
 };
 
 const BX_V157_NAV_KEY="logos-bx:v157-nav";
 const bxV157NavGet=()=>{
   try{
     const d=JSON.parse(sessionStorage.getItem(BX_V157_NAV_KEY)||'{"items":[],"index":-1}');
     return d&&Array.isArray(d.items)?d:{items:[],index:-1};
   }catch(_){return {items:[],index:-1}}
 };
 const bxV157NavSave=(d)=>{try{sessionStorage.setItem(BX_V157_NAV_KEY,JSON.stringify(d))}catch(_){}};
 let bxV157NavMuted=false;
 const bxV157NavRef=(rows=[])=>{
   if(!rows.length)return "";
   const f=rows[0],same=rows.every(v=>v.book===f.book&&v.chapter===f.chapter);
   return same?`${f.book} ${f.chapter}`:f.ref;
 };
 const bxV157NavPush=(rows=[])=>{
   if(bxV157NavMuted||!rows.length)return bxV157NavGet();
   const ref=bxV157NavRef(rows); if(!ref)return bxV157NavGet();
   let d=bxV157NavGet();
   if(d.items[d.index]===ref)return d;
   d.items=d.items.slice(0,d.index+1);
   d.items.push(ref);
   if(d.items.length>60)d.items=d.items.slice(-60);
   d.index=d.items.length-1;
   bxV157NavSave(d);
   return d;
 };
 const bxV157NavGo=async(delta)=>{
   let d=bxV157NavGet(),next=d.index+delta;
   if(next<0||next>=d.items.length)return false;
   const ref=d.items[next];
   try{
     bxV157NavMuted=true;
     const rr=await smartBibleRef(ref);
     if(!rr.length)return false;
     d.index=next;bxV157NavSave(d);
     current=rr;
     if($("#bRef"))$("#bRef").value=ref;
     renderBibleVerses(rr);
     $("#bOut")?.scrollIntoView({behavior:"smooth",block:"start"});
     return true;
   }catch(_){return false}
   finally{bxV157NavMuted=false}
 };
 const bxV157Toast=(msg)=>{
   let t=document.getElementById("bxV157Toast");
   if(!t){t=document.createElement("div");t.id="bxV157Toast";t.className="bx-v157-toast";document.body.appendChild(t)}
   t.textContent=msg;t.classList.add("show");
   clearTimeout(window.__bxV157ToastTimer);
   window.__bxV157ToastTimer=setTimeout(()=>t.classList.remove("show"),1400);
 };
 const bxV157VerseByIndex=(rows,index)=>rows[Math.max(0,Math.min(rows.length-1,index))]||null;
 const bxV157IsEditable=()=>{
   const a=document.activeElement;
   return !!a&&(a.matches?.("input,textarea,select,[contenteditable=true]"));
 };
 const bxV157ReaderVisible=()=>{
   const out=$("#bOut");if(!out)return false;
   const r=out.getBoundingClientRect(),cs=getComputedStyle(out);
   return cs.display!=="none"&&cs.visibility!=="hidden"&&r.width>0&&r.height>0;
 };

 const renderBibleVerses=(rows=[])=>{const out=$("#bOut");if(!out)return;if(!rows.length){out.innerHTML='<div class="bx-reader-empty">Passagem não encontrada.</div>';return}
  bxHistoryPush(rows);
  bxSaveReadingProgress(rows);
  bxSaveSession(rows);
  bxWorkspaceCapture(rows);
  bxActivityTouch();
  bxSessionLogPush(rows[0]?.ref||"");
  bxReadingSessionAdd(rows);
  bxTrailPush(rows);
  const first=rows[0],sameChapter=rows.every(v=>v.book===first.book&&v.chapter===first.chapter);bxV157NavPush(rows);
  if(sameChapter){if($("#bChapterTitle"))$("#bChapterTitle").textContent=`${first.book} ${first.chapter}`;if($("#bChapter"))$("#bChapter").value=String(first.chapter);if($("#bBook")&&first.bookCode)$("#bBook").value=first.bookCode;setTimeout(()=>bxV161SyncVerseOptions(first.book,first.chapter,rows.length===1?rows[0].verse:null).catch(()=>{}),0);}
  out.innerHTML=`${bxChapterNavigator(rows)}
  <div class="bx-v157-smartnav">
    <div class="bx-v157-smartnav-left">
      <button type="button" data-v157-back title="Voltar à passagem anterior">← Voltar</button>
      <button type="button" data-v157-forward title="Avançar no histórico">Avançar →</button>
      <span class="bx-v157-current">${escapeHtml(bxV157NavRef(rows))}</span>
    </div>
    <div class="bx-v157-smartnav-right">
      <button type="button" data-v157-resume title="Retomar a última leitura">▶ Continuar</button>
      <button type="button" data-v157-bookmarks title="Abrir marcadores">🔖 Marcadores</button>
      <button type="button" data-v157-help title="Atalhos do leitor">⌨ Atalhos</button>
    </div>
  </div>
  <div class="lmx-bible-v3-top">
    <div class="lmx-bible-v3-top-main">
      <button data-reader-action="copy">⧉ Copiar</button>
      <button data-reader-action="citation">❞ Citação</button>
      <button data-reader-action="share">↗ Compartilhar</button>
      <button data-reader-action="print">🖨 Imprimir</button>
      <button data-reader-action="studio">⚡ Studio X</button>
      <button type="button" data-v168-discover>🔭 Descobertas</button>
      <button type="button" data-v169-trail>🧭 Trilha</button>
      <button type="button" data-v171-comparex>▥ Comparador X</button>
      <button type="button" data-v172-audio>🔊 Ouvir</button>
      <button type="button" data-v173-desk>▦ Mesa X</button>
      <button type="button" data-v174-network>🕸 Rede X</button>
      <button type="button" data-v175-timeline>🕰 Tempo X</button>
      <button type="button" data-v176-journey>🧭 Jornada X</button>
      <button type="button" data-v177-words>🔤 Palavra X</button>
      <button type="button" data-v178-notebook>📓 Caderno X</button>
      <button type="button" data-v179-cite>❞ Citar X</button>
      <button type="button" data-v180-questions>❓ Perguntas X</button>
      <button type="button" data-v181-pulpit>🎤 Púlpito Bíblia</button>
      <button type="button" data-v182-dashboard>◉ Painel 360</button>
      <button type="button" data-v183-center>✦ Central X</button>
      <button type="button" data-v184-memory>🧠 Memória X</button>
      <button type="button" data-v185-context7>7×7 Contexto</button>
      <button type="button" data-v186-chain>⛓ Cadeia X</button>
      <button type="button" data-v187-two>Ⅱ Duas Passagens</button>
      <button type="button" data-v188-library>🏛 Biblioteca Pessoal</button>
      <button type="button" data-v189-atlas>🗺 Atlas Instantâneo</button>
      <button type="button" data-v190-place>📍 Lugar X</button>
      <button type="button" data-v191-route>➜ Rota X</button>
      <button type="button" data-v192-passage-route>🧭 Rota da Passagem</button>
      <button type="button" data-v193-gallery>🖼 Galeria X</button>
      <button type="button" data-v194-tour>🕶 Passeio 360 X</button>
      <button type="button" data-bx-passage-more>＋ Mais</button>
    </div>
    <div class="lmx-bible-v3-top-more" hidden>
      <button data-reader-action="compare">⇄ Comparar</button>
      <button data-reader-action="parallel">▥ Paralela</button>
      <button data-reader-action="selected">☑ Selecionados</button>
      <button data-reader-action="topics">🗂 Tópicos</button>
      <button data-reader-action="readinglist">📚 Ler depois</button>
   <button data-reader-action="v171research">🧠 Pesquisa X</button>
   <button data-reader-action="v171themes">🏷️ Temas X</button>
   <button data-reader-action="v171export">⬇️ Índice</button>
      <button data-reader-action="searchhistory">🔎 Pesquisas</button>
      <button data-reader-action="bookmarks">🔖 Marcadores</button>
      <button data-reader-action="collections">📚 Coleções</button>
      <button data-reader-action="json">{} JSON</button>
    </div>
  </div>

  <div class="bx-v170-layers" data-v170-layers>
    <span>Modo:</span>
    <button type="button" data-v170-mode="reading">📖 Leitura</button>
    <button type="button" data-v170-mode="study">🔎 Estudo</button>
    <button type="button" data-v170-mode="originals">🇬🇷 Originais</button>
    <button type="button" data-v170-mode="geography">🗺️ Geografia</button>
    <button type="button" data-v170-mode="sermon">🔥 Pregação</button>
  </div>
  <div class="lmx-bible-v3-note">Duplo clique em uma palavra para pesquisar na Concordância. Nomes dourados abrem conteúdo relacionado.</div>
  <div class="bx-v155-selection-bar" data-v155-selection-bar hidden>
    <strong data-v155-selection-count>0 selecionados</strong>
    <div>
      <button type="button" data-v155-copy>⧉ Copiar</button>
      <button type="button" data-v155-studio>⚡ Studio X</button>
      <button type="button" data-v155-compare>⇄ Comparar</button>
      <button type="button" data-v155-clear>✕ Limpar</button>
    </div>
  </div>

  <div class="bx-v157-rail" data-v157-rail>
    <button type="button" data-v157-prev title="Versículo anterior">↑</button>
    <span data-v157-position>1 / ${rows.length}</span>
    <button type="button" data-v157-next title="Próximo versículo">↓</button>
    <i></i>
    <button type="button" data-v157-bookmark-current title="Marcar versículo atual">☆</button>
    <button type="button" data-v157-copy-current title="Copiar versículo atual">⧉</button>
    <button type="button" data-v157-focus-current title="Focar versículo atual">◎</button>
  </div>

  <div class="lmx-bible-v3-list">
    ${rows.map((v,idx)=>`<div class="lmx-bible-v3-verse ${bxSelectionHas(v.ref)?"bx-selected-verse":""}" data-bx-v3-verse data-v157-index="${idx}" data-ref="${escapeHtml(v.ref)}" data-highlight="${escapeHtml(bxHighlightFor(v.ref))}">
      <div class="lmx-bible-v3-textrow">
        <button type="button" class="bx-v155-select ${bxSelectionHas(v.ref)?"selected":""}" data-v155-select="${escapeHtml(v.ref)}" title="Selecionar ${escapeHtml(v.ref)}">${bxSelectionHas(v.ref)?"✓":"○"}</button>
        <button class="lmx-bible-v3-num" data-open-ref="${escapeHtml(v.ref)}" title="${escapeHtml(v.ref)}">${escapeHtml(String(v.verse))}</button>
        <div class="lmx-bible-v3-text" data-bx-verse-text="${escapeHtml(v.ref)}">${bxLinkifyEntities(v.text)}</div>
      </div>

      <div class="lmx-bible-v3-tools">
        <button data-verse-bible data-ref="${escapeHtml(v.ref)}">📖 Bíblia</button>
        <button data-verse-parallel data-ref="${escapeHtml(v.ref)}">⇄ Paralelas</button>
        <button data-verse-tool="cross" data-ref="${escapeHtml(v.ref)}">🔗 Referências</button>
        <button data-verse-tool="strong" data-ref="${escapeHtml(v.ref)}">🇬🇷🇮🇱 Strong</button>
        <button data-verse-tool="lexicon" data-ref="${escapeHtml(v.ref)}">📚 Léxico</button>
        <button data-verse-tool="comments" data-ref="${escapeHtml(v.ref)}">💬 Comentários</button>
        <button data-verse-tool="context" data-ref="${escapeHtml(v.ref)}">🔎 Contexto</button>
        <button data-verse-atlas data-ref="${escapeHtml(v.ref)}">🗺️ Atlas</button>
        <button data-verse-tool="media" data-ref="${escapeHtml(v.ref)}">🎞 Mídia</button>
        <button data-verse-tool="dna" data-ref="${escapeHtml(v.ref)}">🧬 DNA K7</button>
        <button data-verse-studio data-ref="${escapeHtml(v.ref)}">⚡ Studio X</button>
        <button type="button" class="lmx-bible-v3-more" data-bx-verse-more="${escapeHtml(v.ref)}">＋</button>
      </div>

      <div class="lmx-bible-v3-extra" data-bx-alltools="${escapeHtml(v.ref)}" hidden>
        <button data-verse-organize data-ref="${escapeHtml(v.ref)}">🏷 Organizar</button>
        <button data-verse-highlight data-ref="${escapeHtml(v.ref)}">🖍 Marcar</button>
        <button data-verse-personal-links data-ref="${escapeHtml(v.ref)}">🔗 Minhas refs</button>
        <button data-verse-card data-ref="${escapeHtml(v.ref)}">▣ Ficha</button>
        <button data-verse-queue data-ref="${escapeHtml(v.ref)}">☑ Fila</button>
        <button data-verse-backlinks data-ref="${escapeHtml(v.ref)}">↩ Voltas</button>
        <button data-verse-select data-ref="${escapeHtml(v.ref)}" class="${bxSelectionHas(v.ref)?"selected":""}">${bxSelectionHas(v.ref)?"✓ Selecionado":"☑ Selecionar"}</button>
        <button data-verse-compare data-ref="${escapeHtml(v.ref)}">▦ Comparar</button>
        <button data-verse-insight data-ref="${escapeHtml(v.ref)}">💡 Insight</button>
        <button data-verse-pin data-ref="${escapeHtml(v.ref)}">📌 Fixar</button>
        <button data-verse-focus data-ref="${escapeHtml(v.ref)}">🎯 Foco</button>
        <button data-verse-topic data-ref="${escapeHtml(v.ref)}">📁 Tópico</button>
        <button data-verse-readlater data-ref="${escapeHtml(v.ref)}">🔖 Depois</button>
        <button data-verse-word data-ref="${escapeHtml(v.ref)}">🔤 Palavra</button>
        <button data-verse-review data-ref="${escapeHtml(v.ref)}">${bxReviewFor(v.ref)==="studied"?"✓ Estudado":bxReviewFor(v.ref)==="review"?"↺ Revisar":"✅ Revisão"}</button><button data-verse-v171index data-ref="${escapeHtml(v.ref)}">🏷️ Indexar</button>
        <button data-verse-question data-ref="${escapeHtml(v.ref)}">❓ Pergunta</button>
        <button data-verse-studylink data-ref="${escapeHtml(v.ref)}">🔗 Ligar</button>
        <button data-verse-v144set data-ref="${escapeHtml(v.ref)}">🗃 Coleção</button>
        <button data-verse-v144daily data-ref="${escapeHtml(v.ref)}">☀ Hoje</button>
        <button data-verse-visual data-ref="${escapeHtml(v.ref)}">🌍 Explorar visual</button>
      </div>
    </div>`).join("")}
  </div>`;


  // V1.68 — Descobertas locais, sem IA e sem custo de API
  const bxV168Stop=new Set("a o e de da do das dos em no na nos nas por para com sem um uma uns umas que se ao aos à às é são foi foram ser como mas ou já não sim sua seu seus suas ele ela eles elas lhe lhes isto isso aquilo este esta estes estas meu minha teu tua nós vós eu tu".split(/\s+/));
  const bxV168Freq=()=>{
    const map=new Map;
    rows.forEach(v=>String(v.text||"").toLocaleLowerCase("pt-BR").normalize("NFD").replace(/[\u0300-\u036f]/g,"").match(/[a-z0-9]+/g)?.forEach(w=>{if(w.length<4||bxV168Stop.has(w))return;map.set(w,(map.get(w)||0)+1)}));
    return [...map.entries()].sort((a,b)=>b[1]-a[1]||a[0].localeCompare(b[0],'pt-BR')).slice(0,14);
  };
  const bxV168Entities=()=>{
    const text=rows.map(v=>v.text||"").join(" ").toLocaleLowerCase("pt-BR");
    const people=[...bxEntityPeople].filter(n=>text.includes(String(n).toLocaleLowerCase("pt-BR"))).slice(0,12);
    const places=[...bxEntityPlaces].filter(n=>text.includes(String(n).toLocaleLowerCase("pt-BR"))).slice(0,12);
    return {people,places};
  };
  const bxV168Open=()=>{
    const {people,places}=bxV168Entities(),freq=bxV168Freq(),selected=bxSelectionGet().filter(x=>rows.some(v=>v.ref===x.ref));
    let m=document.getElementById("bxV168Discover");if(!m){m=document.createElement("div");m.id="bxV168Discover";m.className="bx-v168-modal";document.body.appendChild(m)}
    const ref=bxV157NavRef(rows);
    m.hidden=false;m.innerHTML=`<div class="bx-v168-card"><header><div><small>BÍBLIA X • RAIO-X LOCAL</small><h3>🔭 Descobertas • ${escapeHtml(ref)}</h3><p>Leitura assistida sem gastar IA: pessoas, lugares, palavras e atalhos da própria passagem.</p></div><button type="button" data-v168-close>×</button></header>
      <div class="bx-v168-kpis"><div><b>${rows.length}</b><span>versículos</span></div><div><b>${people.length}</b><span>pessoas</span></div><div><b>${places.length}</b><span>lugares</span></div><div><b>${selected.length}</b><span>selecionados</span></div></div>
      <section><h4>👤 Pessoas reconhecidas</h4><div class="bx-v168-chips">${people.length?people.map(x=>`<button type="button" data-v168-entity="people" data-v168-name="${escapeHtml(x)}">${escapeHtml(x)}</button>`).join(""):'<span>Nenhuma pessoa reconhecida automaticamente.</span>'}</div></section>
      <section><h4>🗺️ Lugares reconhecidos</h4><div class="bx-v168-chips">${places.length?places.map(x=>`<button type="button" data-v168-entity="maps" data-v168-name="${escapeHtml(x)}">${escapeHtml(x)}</button>`).join(""):'<span>Nenhum lugar reconhecido automaticamente.</span>'}</div></section>
      <section><h4>🔤 Palavras recorrentes</h4><div class="bx-v168-words">${freq.length?freq.map(([w,n])=>`<button type="button" data-v168-word="${escapeHtml(w)}"><b>${escapeHtml(w)}</b><span>${n}×</span></button>`).join(""):'<span>Sem recorrências suficientes.</span>'}</div></section>
      <footer><button type="button" data-v168-copy>⧉ Copiar resumo</button><button type="button" data-v168-save>📌 Salvar descoberta</button><button type="button" data-v168-studio>⚡ Studio X</button></footer></div>`;
    const close=()=>m.hidden=true;m.querySelector('[data-v168-close]').onclick=close;m.onclick=e=>{if(e.target===m)close()};
    m.querySelectorAll('[data-v168-entity]').forEach(b=>b.onclick=()=>{close();bxOpenEntity(b.dataset.v168Entity,b.dataset.v168Name)});
    m.querySelectorAll('[data-v168-word]').forEach(b=>b.onclick=()=>{close();if($("#bSearch"))$("#bSearch").value=b.dataset.v168Word;$("#bFind")?.click()});
    m.querySelector('[data-v168-copy]').onclick=async()=>{const txt=[`Descobertas — ${ref}`,people.length?`Pessoas: ${people.join(', ')}`:'',places.length?`Lugares: ${places.join(', ')}`:'',freq.length?`Palavras: ${freq.map(([w,n])=>`${w} (${n}x)`).join(', ')}`:''].filter(Boolean).join('\n');await bxCopyText(txt);bxV157Toast('Resumo copiado')};
    m.querySelector('[data-v168-save]').onclick=()=>{const key='logos-bx:v168-discoveries',arr=Store.get(key,[])||[];arr.unshift({ref,people,places,freq,at:Date.now()});Store.set(key,arr.slice(0,40));bxV157Toast('Descoberta salva localmente')};
    m.querySelector('[data-v168-studio]').onclick=()=>{close();current=rows;sendStudio()};
  };
  out.querySelector('[data-v168-discover]')?.addEventListener('click',bxV168Open);


  // V1.69 — Trilha de exploração contextual
  const bxV169Build=()=>{
    const text=rows.map(v=>v.text||"").join(" ").toLocaleLowerCase("pt-BR");
    const people=[...bxEntityPeople].filter(n=>text.includes(String(n).toLocaleLowerCase("pt-BR"))).slice(0,8);
    const places=[...bxEntityPlaces].filter(n=>text.includes(String(n).toLocaleLowerCase("pt-BR"))).slice(0,8);
    const nodes=[{kind:'passage',name:bxV157NavRef(rows),icon:'📖'}];
    people.forEach(x=>nodes.push({kind:'people',name:x,icon:'👤'}));places.forEach(x=>nodes.push({kind:'maps',name:x,icon:'🗺️'}));
    return nodes;
  };
  const bxV169Open=()=>{
    const nodes=bxV169Build();let m=document.getElementById('bxV169Trail');if(!m){m=document.createElement('div');m.id='bxV169Trail';m.className='bx-v169-modal';document.body.appendChild(m)}
    m.hidden=false;m.innerHTML=`<div class="bx-v169-card"><header><div><small>NAVEGAÇÃO CONTEXTUAL</small><h3>🧭 Trilha da passagem</h3><p>Explore a passagem sem se perder: texto → pessoas → lugares → pesquisa → mapa → volta.</p></div><button type="button" data-v169-close>×</button></header>
      <div class="bx-v169-flow">${nodes.map((n,i)=>`<button type="button" data-v169-kind="${n.kind}" data-v169-name="${escapeHtml(n.name)}"><span>${n.icon}</span><b>${escapeHtml(n.name)}</b><small>${n.kind==='passage'?'Passagem atual':n.kind==='people'?'Personagem':'Lugar'}</small></button>${i<nodes.length-1?'<i>→</i>':''}`).join('')}</div>
      <section class="bx-v169-actions"><button type="button" data-v169-search>🔎 Pesquisar tudo</button><button type="button" data-v169-maps>🗺️ Abrir Atlas</button><button type="button" data-v169-history>🕘 Histórico da leitura</button><button type="button" data-v169-back>← Voltar à passagem</button></section></div>`;
    const close=()=>m.hidden=true;m.querySelector('[data-v169-close]').onclick=close;m.onclick=e=>{if(e.target===m)close()};
    m.querySelectorAll('[data-v169-kind]').forEach(b=>b.onclick=()=>{const kind=b.dataset.v169Kind,name=b.dataset.v169Name;if(kind==='passage'){close();return}close();bxOpenEntity(kind,name)});
    m.querySelector('[data-v169-search]').onclick=()=>{close();activate('global');if($('#bxGlobalQuery'))$('#bxGlobalQuery').value=bxV157NavRef(rows);$('#bxGlobalFind')?.click()};
    m.querySelector('[data-v169-maps]').onclick=()=>{close();activate('maps');if($('#bxMapQuery'))$('#bxMapQuery').value=nodes.find(x=>x.kind==='maps')?.name||bxV157NavRef(rows);setTimeout(()=>renderMaps($('#bxMapQuery')?.value||''),0)};
    m.querySelector('[data-v169-history]').onclick=()=>{close();bxRenderTrail?.()};
    m.querySelector('[data-v169-back]').onclick=close;
  };
  out.querySelector('[data-v169-trail]')?.addEventListener('click',bxV169Open);


  // V1.70 — Modo de leitura/estudo por camadas
  const BX_V170_MODE_KEY='logos-bx:v170-mode';
  const bxV170Apply=mode=>{
    mode=['reading','study','originals','geography','sermon'].includes(mode)?mode:'study';
    out.dataset.v170Mode=mode;Store.set(BX_V170_MODE_KEY,mode);
    out.querySelectorAll('[data-v170-mode]').forEach(b=>b.classList.toggle('active',b.dataset.v170Mode===mode));
    const allowed={
      reading:[],
      study:['cross','strong','lexicon','context','comments','media','dna','studio','atlas'],
      originals:['cross','strong','lexicon'],
      geography:['context','media','atlas','visual'],
      sermon:['comments','context','dna','studio']
    }[mode]||[];
    out.querySelectorAll('.lmx-bible-v3-tools button').forEach(b=>{
      let key=b.dataset.verseTool||'';
      if(b.hasAttribute('data-verse-studio'))key='studio';
      if(b.hasAttribute('data-verse-atlas'))key='atlas';
      if(b.hasAttribute('data-bx-verse-more'))key='more';
      b.hidden=mode==='reading'?key!=='more':(key==='more'?false:!allowed.includes(key));
    });
    if(mode==='reading')out.querySelectorAll('.lmx-bible-v3-extra:not([hidden])').forEach(x=>x.setAttribute('hidden',''));
    bxV157Toast({reading:'Modo leitura limpa',study:'Modo estudo completo',originals:'Modo originais',geography:'Modo geografia',sermon:'Modo pregação'}[mode]);
  };
  out.querySelectorAll('[data-v170-mode]').forEach(b=>b.addEventListener('click',()=>bxV170Apply(b.dataset.v170Mode)));
  bxV170Apply(Store.get(BX_V170_MODE_KEY,'study'));


  // V1.71 — Comparador X: duas versões lado a lado sem abandonar a leitura
  const bxV171PassageRef=(tr)=>{
    if(!rows.length)return "";
    const f=rows[0],same=rows.every(v=>v.bookCode===f.bookCode&&v.chapter===f.chapter);
    const meta=bookItems.find(x=>x.code===f.bookCode)||selectedBookMeta();
    const book=tr==="engwebp"?(meta?.name_en||f.book):(meta?.name_pt||f.book);
    if(!same)return `${book} ${f.chapter}:${f.verse}`;
    if(rows.length===1)return `${book} ${f.chapter}:${f.verse}`;
    const nums=rows.map(v=>Number(v.verse)).filter(Number.isFinite).sort((a,b)=>a-b);
    const contiguous=nums.length>1&&nums.every((n,i)=>i===0||n===nums[i-1]+1);
    if(contiguous&&nums.length<=12)return `${book} ${f.chapter}:${nums[0]}-${nums[nums.length-1]}`;
    return `${book} ${f.chapter}`;
  };
  const bxV171Fetch=async(tr)=>{
    const ref=bxV171PassageRef(tr);
    const r=await bxFetch(`${bibleApiBase()}/reference?translation=${encodeURIComponent(tr)}&ref=${encodeURIComponent(ref)}&language=${tr==="engwebp"?"en":"pt"}`);
    if(!r.ok)throw new Error("Versão indisponível");
    const j=await r.json(),name=j.reference?.book_name||rows[0]?.book||"",chapter=j.reference?.chapter||rows[0]?.chapter||1;
    return (j.verses||[]).map(x=>({book:name,chapter:Number(x.chapter??chapter),verse:Number(x.verse),ref:`${name} ${Number(x.chapter??chapter)}:${x.verse}`,text:String(x.text||"")}));
  };
  const bxV171Open=async()=>{
    let m=document.getElementById("bxV171Compare");
    if(!m){m=document.createElement("div");m.id="bxV171Compare";m.className="bx-v171-modal";document.body.appendChild(m)}
    const leftTr=selectedTranslation(),rightTr=leftTr==="porbr2018"?"engwebp":"porbr2018";
    m.hidden=false;
    m.innerHTML=`<div class="bx-v171-card"><header><div><small>BÍBLIA X • COMPARAÇÃO SINCRONIZADA</small><h3>▥ Comparador X • ${escapeHtml(bxV157NavRef(rows))}</h3><p>Duas versões lado a lado, verso por verso, sem perder a passagem atual.</p></div><button type="button" data-v171-close>×</button></header>
      <div class="bx-v171-loading">Carregando a segunda versão...</div></div>`;
    const close=()=>m.hidden=true;
    m.querySelector("[data-v171-close]").onclick=close;m.onclick=e=>{if(e.target===m)close()};
    try{
      const right=await bxV171Fetch(rightTr);
      const left=rows,byL=new Map(left.map(v=>[Number(v.verse),v])),byR=new Map(right.map(v=>[Number(v.verse),v]));
      const nums=[...new Set([...byL.keys(),...byR.keys()])].sort((a,b)=>a-b);
      const label=t=>t==="porbr2018"?"BLIVRE":"WEBP";
      m.querySelector(".bx-v171-card").innerHTML=`<header><div><small>BÍBLIA X • COMPARAÇÃO SINCRONIZADA</small><h3>▥ Comparador X • ${escapeHtml(bxV157NavRef(rows))}</h3><p>Leia duas versões juntas e copie somente o que precisar.</p></div><button type="button" data-v171-close>×</button></header>
        <div class="bx-v171-head"><b>${label(leftTr)}</b><span>↔</span><b>${label(rightTr)}</b></div>
        <div class="bx-v171-grid">${nums.map(n=>{const a=byL.get(n),b=byR.get(n);return `<article><section><button data-v171-ref="${escapeHtml(a?.ref||"")}">${n}</button><p>${escapeHtml(a?.text||"—")}</p></section><section><button>${n}</button><p>${escapeHtml(b?.text||"—")}</p></section></article>`}).join("")}</div>
        <footer><button type="button" data-v171-copy-left>⧉ Copiar ${label(leftTr)}</button><button type="button" data-v171-copy-both>▥ Copiar comparação</button><button type="button" data-v171-close>Fechar</button></footer>`;
      m.querySelectorAll("[data-v171-close]").forEach(b=>b.onclick=close);
      m.querySelectorAll("[data-v171-ref]").forEach(b=>b.onclick=()=>{const ref=b.dataset.v171Ref;if(ref){close();document.querySelector(`[data-ref="${CSS.escape(ref)}"]`)?.scrollIntoView({behavior:"smooth",block:"center"})}});
      m.querySelector("[data-v171-copy-left]").onclick=async()=>{await bxCopyText(formatVerses(left));bxV157Toast("Versão copiada")};
      m.querySelector("[data-v171-copy-both]").onclick=async()=>{const txt=nums.map(n=>`${byL.get(n)?.ref||n}\n${label(leftTr)}: ${byL.get(n)?.text||"—"}\n${label(rightTr)}: ${byR.get(n)?.text||"—"}`).join("\n\n");await bxCopyText(txt);bxV157Toast("Comparação copiada")};
    }catch(e){
      m.querySelector(".bx-v171-loading").innerHTML=`Não foi possível carregar a segunda versão.<br><small>${escapeHtml(e.message||String(e))}</small>`;
    }
  };
  out.querySelector("[data-v171-comparex]")?.addEventListener("click",bxV171Open);


  // V1.72 — Audio Reader X: leitura em voz alta pelo navegador, sem API paga
  const bxV172Stop=()=>{try{speechSynthesis.cancel()}catch(_){};document.querySelectorAll("[data-bx-v3-verse].bx-v172-speaking").forEach(x=>x.classList.remove("bx-v172-speaking"));window.__bxV172Playing=false};
  const bxV172Open=()=>{
    let m=document.getElementById("bxV172Audio");
    if(!m){m=document.createElement("div");m.id="bxV172Audio";m.className="bx-v172-modal";document.body.appendChild(m)}
    if(!("speechSynthesis" in window)){m.hidden=false;m.innerHTML='<div class="bx-v172-card"><p>Este navegador não oferece leitura em voz alta.</p></div>';return}
    const voices=()=>speechSynthesis.getVoices().filter(v=>/^pt|Portugu/i.test(v.lang)||/portugu/i.test(v.name));
    const chosenRows=scope=>{
      const selected=bxSelectionGet().filter(x=>rows.some(v=>v.ref===x.ref));
      if(scope==="selected"&&selected.length)return selected;
      if(scope==="current"){const i=window.__bxV157Ctx?.index||0;return [rows[Math.max(0,Math.min(rows.length-1,i))]].filter(Boolean)}
      return rows;
    };
    const draw=()=>{
      const vs=voices();
      m.hidden=false;m.innerHTML=`<div class="bx-v172-card"><header><div><small>ÁUDIO READER X • LOCAL</small><h3>🔊 Ouvir a Bíblia</h3><p>Leitura em voz alta usando as vozes do próprio dispositivo, sem consumir créditos de IA.</p></div><button type="button" data-v172-close>×</button></header>
        <div class="bx-v172-controls">
          <label>Trecho<select data-v172-scope><option value="passage">Passagem aberta</option><option value="current">Versículo atual</option><option value="selected">Versículos selecionados</option></select></label>
          <label>Voz<select data-v172-voice>${vs.map((v,i)=>`<option value="${i}">${escapeHtml(v.name)} • ${escapeHtml(v.lang)}</option>`).join("")||'<option value="-1">Voz padrão do navegador</option>'}</select></label>
          <label>Velocidade<input type="range" min=".65" max="1.6" step=".05" value="1" data-v172-rate><span data-v172-rate-label>1.00×</span></label>
        </div>
        <div class="bx-v172-player"><button type="button" data-v172-play>▶ Ouvir</button><button type="button" data-v172-pause>⏸ Pausar</button><button type="button" data-v172-resume>⏵ Continuar</button><button type="button" data-v172-stop>■ Parar</button></div>
        <div class="bx-v172-now" data-v172-now>Pronto para iniciar.</div></div>`;
      const close=()=>{bxV172Stop();m.hidden=true};
      m.querySelector("[data-v172-close]").onclick=close;m.onclick=e=>{if(e.target===m)close()};
      const rate=m.querySelector("[data-v172-rate]"),rateLabel=m.querySelector("[data-v172-rate-label]");
      rate.oninput=()=>rateLabel.textContent=`${Number(rate.value).toFixed(2)}×`;
      m.querySelector("[data-v172-stop]").onclick=bxV172Stop;
      m.querySelector("[data-v172-pause]").onclick=()=>{try{speechSynthesis.pause()}catch(_){}};
      m.querySelector("[data-v172-resume]").onclick=()=>{try{speechSynthesis.resume()}catch(_){}};
      m.querySelector("[data-v172-play]").onclick=()=>{
        bxV172Stop();
        const list=chosenRows(m.querySelector("[data-v172-scope]").value);if(!list.length){m.querySelector("[data-v172-now]").textContent="Nenhum versículo selecionado.";return}
        const voiceList=voices(),voice=voiceList[Number(m.querySelector("[data-v172-voice]").value)]||null;
        let i=0;window.__bxV172Playing=true;
        const next=()=>{
          if(!window.__bxV172Playing||i>=list.length){bxV172Stop();m.querySelector("[data-v172-now]").textContent="Leitura concluída.";return}
          const v=list[i++];document.querySelectorAll("[data-bx-v3-verse].bx-v172-speaking").forEach(x=>x.classList.remove("bx-v172-speaking"));
          const el=document.querySelector(`[data-ref="${CSS.escape(v.ref)}"]`);el?.classList.add("bx-v172-speaking");el?.scrollIntoView({behavior:"smooth",block:"center"});
          m.querySelector("[data-v172-now]").innerHTML=`<b>${escapeHtml(v.ref)}</b><span>${escapeHtml(v.text)}</span>`;
          const u=new SpeechSynthesisUtterance(v.text);u.lang="pt-BR";u.rate=Number(rate.value)||1;if(voice)u.voice=voice;u.onend=next;u.onerror=()=>next();speechSynthesis.speak(u);
        };next();
      };
    };
    draw();
    if(!voices().length)speechSynthesis.onvoiceschanged=()=>{if(!m.hidden)draw()};
  };
  out.querySelector("[data-v172-audio]")?.addEventListener("click",bxV172Open);


  // V1.73 — Mesa X: dock persistente para estudo sem abandonar a leitura
  const BX_V173_KEY="logos-bx:v173-desk";
  const bxV173Open=()=>{
    let p=document.getElementById("bxV173Desk");
    if(!p){p=document.createElement("aside");p.id="bxV173Desk";p.className="bx-v173-desk";document.body.appendChild(p)}
    const selected=bxSelectionGet().filter(x=>rows.some(v=>v.ref===x.ref));
    const currentIndex=window.__bxV157Ctx?.index||0;
    const initial=selected[0]||rows[Math.max(0,Math.min(rows.length-1,currentIndex))]||rows[0];
    const draw=v=>{
      if(!v)return;
      const basket=bxSelectionGet().filter(x=>rows.some(r=>r.ref===x.ref));
      p.hidden=false;p.dataset.ref=v.ref;
      p.innerHTML=`<header><div><small>MESA DE ESTUDO</small><h3>▦ Mesa X</h3></div><button type="button" data-v173-close>×</button></header>
        <div class="bx-v173-ref"><b>${escapeHtml(v.ref)}</b><p>${escapeHtml(v.text)}</p></div>
        <div class="bx-v173-quick">
          <button type="button" data-v173-tool="cross">🔗 Referências</button><button type="button" data-v173-tool="strong">🇬🇷 Strong</button><button type="button" data-v173-tool="lexicon">📚 Léxico</button><button type="button" data-v173-tool="comments">💬 Comentários</button><button type="button" data-v173-tool="context">🔎 Contexto</button><button type="button" data-v173-tool="dna">🧬 DNA K7</button>
        </div>
        <section><div class="bx-v173-title"><b>📝 Nota deste versículo</b><span>salva automaticamente</span></div><textarea data-v173-note placeholder="Anote uma descoberta, pergunta, aplicação ou conexão...">${escapeHtml(bxLoadLocal("note",v.ref,""))}</textarea></section>
        <section><div class="bx-v173-title"><b>☑ Cesta de estudo</b><span>${basket.length} selecionado(s)</span></div><div class="bx-v173-basket">${basket.length?basket.map(x=>`<button type="button" data-v173-ref="${escapeHtml(x.ref)}"><b>${escapeHtml(x.ref)}</b><span>${escapeHtml(String(x.text||"").slice(0,90))}</span></button>`).join(""):'<p>Selecione versículos pelo círculo ao lado do número para montar sua cesta.</p>'}</div></section>
        <footer><button type="button" data-v173-select>${bxSelectionHas(v.ref)?"✓ Selecionado":"＋ Selecionar verso"}</button><button type="button" data-v173-copy>⧉ Copiar cesta</button><button type="button" data-v173-studio>⚡ Studio X</button></footer>`;
      p.querySelector("[data-v173-close]").onclick=()=>p.hidden=true;
      p.querySelector("[data-v173-note]").oninput=e=>bxSaveLocal("note",v.ref,e.target.value);
      p.querySelectorAll("[data-v173-tool]").forEach(b=>b.onclick=()=>openVerseContext(b.dataset.v173Tool,v));
      p.querySelectorAll("[data-v173-ref]").forEach(b=>b.onclick=()=>{const x=rows.find(r=>r.ref===b.dataset.v173Ref)||bxSelectionGet().find(r=>r.ref===b.dataset.v173Ref);if(x){draw(x);document.querySelector(`[data-ref="${CSS.escape(x.ref)}"]`)?.scrollIntoView({behavior:"smooth",block:"center"})}});
      p.querySelector("[data-v173-select]").onclick=()=>{bxSelectionToggle(v);draw(v)};
      p.querySelector("[data-v173-copy]").onclick=async()=>{const s=bxSelectionGet().filter(x=>rows.some(r=>r.ref===x.ref));if(s.length){await bxCopyText(formatVerses(s));bxV157Toast("Cesta copiada")}else bxV157Toast("Selecione versículos primeiro")};
      p.querySelector("[data-v173-studio]").onclick=()=>{const s=bxSelectionGet().filter(x=>rows.some(r=>r.ref===x.ref));current=s.length?s:[v];sendStudio()};
      try{Store.set(BX_V173_KEY,{ref:v.ref,open:true})}catch(_){}
    };
    draw(initial);
  };
  out.querySelector("[data-v173-desk]")?.addEventListener("click",bxV173Open);


  // V1.74 — Rede X: mapa relacional da passagem sem biblioteca externa
  const bxV174Open=()=>{
    let m=document.getElementById("bxV174Network");
    if(!m){m=document.createElement("div");m.id="bxV174Network";m.className="bx-v174-modal";document.body.appendChild(m)}
    const text=rows.map(v=>v.text||"").join(" ");
    const people=[...bxEntityPeople].filter(n=>new RegExp(`(^|[^A-Za-zÀ-ÿ])${n.replace(/[.*+?^${}()|[\]\\]/g,"\\$&")}(?=$|[^A-Za-zÀ-ÿ])`,"i").test(text)).slice(0,14);
    const places=[...bxEntityPlaces].filter(n=>new RegExp(`(^|[^A-Za-zÀ-ÿ])${n.replace(/[.*+?^${}()|[\]\\]/g,"\\$&")}(?=$|[^A-Za-zÀ-ÿ])`,"i").test(text)).slice(0,14);
    const refs=rows.slice(0,18);
    const node=(kind,name,icon)=>`<button type="button" class="bx-v174-node ${kind}" data-v174-kind="${kind}" data-v174-name="${escapeHtml(name)}"><span>${icon}</span><b>${escapeHtml(name)}</b></button>`;
    m.hidden=false;
    m.innerHTML=`<div class="bx-v174-card"><header><div><small>REDE BÍBLICA CONTEXTUAL</small><h3>🕸 Rede X • ${escapeHtml(bxV157NavRef(rows))}</h3><p>Veja a passagem como uma rede de pessoas, lugares e versículos conectados.</p></div><button type="button" data-v174-close>×</button></header>
      <div class="bx-v174-legend"><span>👤 Pessoas ${people.length}</span><span>🗺 Lugares ${places.length}</span><span>📖 Versos ${rows.length}</span></div>
      <div class="bx-v174-stage">
        <div class="bx-v174-col"><h4>👤 Pessoas</h4>${people.length?people.map(n=>node("people",n,"👤")).join(""):'<p>Nenhuma pessoa reconhecida.</p>'}</div>
        <div class="bx-v174-center"><div class="bx-v174-core"><span>📖</span><b>${escapeHtml(bxV157NavRef(rows))}</b><small>${rows.length} versículo(s)</small></div>${refs.map(v=>`<button type="button" data-v174-ref="${escapeHtml(v.ref)}">${escapeHtml(v.ref)}</button>`).join("")}</div>
        <div class="bx-v174-col"><h4>🗺 Lugares</h4>${places.length?places.map(n=>node("maps",n,"🗺")).join(""):'<p>Nenhum lugar reconhecido.</p>'}</div>
      </div>
      <footer><button type="button" data-v174-copy>⧉ Copiar resumo</button><button type="button" data-v174-studio>⚡ Enviar passagem ao Studio X</button></footer>
    </div>`;
    const close=()=>m.hidden=true;
    m.querySelector("[data-v174-close]").onclick=close;m.onclick=e=>{if(e.target===m)close()};
    m.querySelectorAll("[data-v174-kind]").forEach(b=>b.onclick=()=>{close();bxOpenEntity(b.dataset.v174Kind,b.dataset.v174Name)});
    m.querySelectorAll("[data-v174-ref]").forEach(b=>b.onclick=()=>{close();document.querySelector(`[data-ref="${CSS.escape(b.dataset.v174Ref)}"]`)?.scrollIntoView({behavior:"smooth",block:"center"})});
    m.querySelector("[data-v174-copy]").onclick=async()=>{await bxCopyText(`Rede X — ${bxV157NavRef(rows)}\nPessoas: ${people.join(", ")||"—"}\nLugares: ${places.join(", ")||"—"}\nVersículos: ${refs.map(v=>v.ref).join(", ")}`);bxV157Toast("Resumo da Rede X copiado")};
    m.querySelector("[data-v174-studio]").onclick=()=>{current=rows;sendStudio()};
  };
  out.querySelector("[data-v174-network]")?.addEventListener("click",bxV174Open);


  // V1.75 — Tempo X: contexto cronológico orientativo ligado à passagem
  const bxV175Era=(book)=>{
    const k=bxV159BookKey(book);
    const groups=[
      {name:"Origens e Patriarcas",books:["genesis","gênesis","job","jó"],icon:"🌄",hint:"Criação, patriarcas e formação das primeiras alianças."},
      {name:"Êxodo e Lei",books:["exodus","êxodo","leviticus","levítico","numbers","números","deuteronomy","deuteronômio"],icon:"🪨",hint:"Libertação do Egito, deserto e organização da aliança mosaica."},
      {name:"Conquista e Juízes",books:["joshua","josué","judges","juízes","ruth","rute"],icon:"⚔️",hint:"Entrada em Canaã e período dos juízes."},
      {name:"Monarquia",books:["1 samuel","2 samuel","1 kings","2 kings","1 reis","2 reis","1 chronicles","2 chronicles","1 crônicas","2 crônicas"],icon:"👑",hint:"Reis de Israel e Judá, templo e divisão do reino."},
      {name:"Poesia e Sabedoria",books:["psalms","salmos","proverbs","provérbios","ecclesiastes","eclesiastes","song of solomon","cantares"],icon:"🎵",hint:"Literatura poética, oração, sabedoria e reflexão."},
      {name:"Profetas",books:["isaiah","isaías","jeremiah","jeremias","lamentations","lamentações","ezekiel","ezequiel","daniel","oseias","hosea","joel","amós","amos","obadias","obadiah","jonas","jonah","miqueias","micah","naum","nahum","habacuque","habakkuk","sofonias","zephaniah","ageu","haggai","zacarias","zechariah","malaquias","malachi"],icon:"📣",hint:"Advertência, esperança, juízo, restauração e promessa."},
      {name:"Pós-exílio",books:["ezra","esdras","nehemiah","neemias","esther","ester"],icon:"🏛️",hint:"Retorno, reconstrução e reorganização do povo."},
      {name:"Vida e ministério de Jesus",books:["matthew","mateus","mark","marcos","luke","lucas","john","joão"],icon:"✝️",hint:"Evangelhos: vida, ensino, morte e ressurreição de Jesus."},
      {name:"Igreja Primitiva",books:["acts","atos"],icon:"🔥",hint:"Pentecostes, expansão missionária e formação da igreja."},
      {name:"Cartas Apostólicas",books:["romans","romanos","1 corinthians","1 coríntios","2 corinthians","2 coríntios","galatians","gálatas","ephesians","efésios","philippians","filipenses","colossians","colossenses","1 thessalonians","1 tessalonicenses","2 thessalonians","2 tessalonicenses","1 timothy","1 timóteo","2 timothy","2 timóteo","titus","tito","philemon","filemom","hebrews","hebreus","james","tiago","1 peter","1 pedro","2 peter","2 pedro","1 john","1 joão","2 john","2 joão","3 john","3 joão","jude","judas"],icon:"✉️",hint:"Ensino, doutrina, vida cristã e organização das comunidades."},
      {name:"Apocalíptico",books:["revelation","apocalipse"],icon:"🌌",hint:"Visões, perseverança, juízo e esperança final."}
    ];
    return groups.find(g=>g.books.includes(k))||{name:"Contexto bíblico",icon:"📖",hint:"Localize esta passagem no panorama geral das Escrituras."};
  };
  const bxV175Open=()=>{
    let m=document.getElementById("bxV175Timeline");
    if(!m){m=document.createElement("div");m.id="bxV175Timeline";m.className="bx-v175-modal";document.body.appendChild(m)}
    const era=bxV175Era(rows[0]?.book||"");
    const people=[...bxEntityPeople].filter(n=>new RegExp(`(^|[^A-Za-zÀ-ÿ])${n.replace(/[.*+?^${}()|[\]\\]/g,"\\$&")}(?=$|[^A-Za-zÀ-ÿ])`,"i").test(rows.map(v=>v.text).join(" "))).slice(0,8);
    const places=[...bxEntityPlaces].filter(n=>new RegExp(`(^|[^A-Za-zÀ-ÿ])${n.replace(/[.*+?^${}()|[\]\\]/g,"\\$&")}(?=$|[^A-Za-zÀ-ÿ])`,"i").test(rows.map(v=>v.text).join(" "))).slice(0,8);
    const stages=["Origens","Êxodo","Conquista","Monarquia","Profetas","Pós-exílio","Jesus","Igreja","Cartas","Apocalíptico"];
    const idx=Math.max(0,stages.findIndex(s=>era.name.toLowerCase().includes(s.toLowerCase().split(" ")[0])));
    m.hidden=false;
    m.innerHTML=`<div class="bx-v175-card"><header><div><small>CONTEXTO CRONOLÓGICO ORIENTATIVO</small><h3>🕰 Tempo X • ${escapeHtml(bxV157NavRef(rows))}</h3><p>Posicione a passagem dentro da grande narrativa bíblica.</p></div><button type="button" data-v175-close>×</button></header>
      <div class="bx-v175-era"><span>${era.icon}</span><div><small>PERÍODO</small><h4>${escapeHtml(era.name)}</h4><p>${escapeHtml(era.hint)}</p></div></div>
      <div class="bx-v175-track">${stages.map((s,i)=>`<div class="${i===idx?"active":i<idx?"done":""}"><i></i><b>${escapeHtml(s)}</b></div>`).join("")}</div>
      <div class="bx-v175-context">
        <section><h4>👤 Pessoas na passagem</h4>${people.length?people.map(x=>`<button data-v175-entity="people" data-v175-name="${escapeHtml(x)}">${escapeHtml(x)}</button>`).join(""):"<p>Nenhuma pessoa reconhecida automaticamente.</p>"}</section>
        <section><h4>🗺 Lugares na passagem</h4>${places.length?places.map(x=>`<button data-v175-entity="maps" data-v175-name="${escapeHtml(x)}">${escapeHtml(x)}</button>`).join(""):"<p>Nenhum lugar reconhecido automaticamente.</p>"}</section>
      </div>
      <div class="bx-v175-note">A linha do tempo é um guia de navegação por blocos literário-históricos; não substitui uma cronologia acadêmica detalhada.</div>
      <footer><button data-v175-copy>⧉ Copiar contexto</button><button data-v175-trail>🧭 Abrir Trilha</button><button data-v175-studio>⚡ Studio X</button></footer>
    </div>`;
    const close=()=>m.hidden=true;
    m.querySelector("[data-v175-close]").onclick=close;m.onclick=e=>{if(e.target===m)close()};
    m.querySelectorAll("[data-v175-entity]").forEach(b=>b.onclick=()=>{close();bxOpenEntity(b.dataset.v175Entity,b.dataset.v175Name)});
    m.querySelector("[data-v175-copy]").onclick=async()=>{await bxCopyText(`${bxV157NavRef(rows)} — ${era.name}\n${era.hint}\nPessoas: ${people.join(", ")||"—"}\nLugares: ${places.join(", ")||"—"}`);bxV157Toast("Contexto temporal copiado")};
    m.querySelector("[data-v175-trail]").onclick=()=>{close();out.querySelector("[data-v169-trail]")?.click()};
    m.querySelector("[data-v175-studio]").onclick=()=>{current=rows;sendStudio()};
  };
  out.querySelector("[data-v175-timeline]")?.addEventListener("click",bxV175Open);


  // V1.76 — Jornada X: estudo guiado em etapas com progresso local
  const BX_V176_KEY="logos-bx:v176-journey";
  const bxV176Open=()=>{
    let m=document.getElementById("bxV176Journey");
    if(!m){m=document.createElement("div");m.id="bxV176Journey";m.className="bx-v176-modal";document.body.appendChild(m)}
    const ref=bxV157NavRef(rows),key=`${BX_V176_KEY}:${ref}`;
    const state=Store.get(key,{done:[],notes:{}})||{done:[],notes:{}};
    const steps=[
      ["read","📖","Ler","Leia a passagem inteira sem abrir ferramentas."],
      ["observe","👁","Observar","Anote palavras repetidas, contrastes, perguntas e movimentos do texto."],
      ["refs","🔗","Conectar","Abra referências cruzadas e compare Escritura com Escritura."],
      ["words","🇬🇷","Palavras","Consulte Strong e Léxico quando uma palavra for importante."],
      ["context","🧭","Contexto","Observe história, cultura, lugar, pessoas e momento bíblico."],
      ["comments","💬","Comentários","Consulte especialistas somente depois da sua observação inicial."],
      ["apply","❤️","Aplicar","Registre o princípio que nasce do texto e uma aplicação responsável."],
      ["studio","⚡","Preparar","Envie a passagem e suas descobertas ao Studio X."]
    ];
    const save=()=>Store.set(key,state);
    const draw=()=>{
      const pct=Math.round(state.done.length/steps.length*100);
      m.hidden=false;
      m.innerHTML=`<div class="bx-v176-card"><header><div><small>ESTUDO GUIADO • PROGRESSO LOCAL</small><h3>🧭 Jornada X • ${escapeHtml(ref)}</h3><p>Um caminho simples para estudar com profundidade sem se perder nas ferramentas.</p></div><button data-v176-close>×</button></header>
        <div class="bx-v176-progress"><div><b>${pct}%</b><span>${state.done.length}/${steps.length} etapas</span></div><i><span style="width:${pct}%"></span></i></div>
        <div class="bx-v176-steps">${steps.map(([id,ico,title,desc],i)=>`<article class="${state.done.includes(id)?"done":""}">
          <button class="bx-v176-check" data-v176-check="${id}">${state.done.includes(id)?"✓":i+1}</button>
          <div><h4>${ico} ${title}</h4><p>${desc}</p><textarea data-v176-note="${id}" placeholder="Minha anotação nesta etapa...">${escapeHtml(state.notes[id]||"")}</textarea></div>
          <button class="bx-v176-action" data-v176-action="${id}">Abrir</button>
        </article>`).join("")}</div>
        <footer><button data-v176-copy>⧉ Copiar jornada</button><button data-v176-reset>↺ Reiniciar</button><button data-v176-studio>⚡ Studio X</button></footer>
      </div>`;
      const close=()=>m.hidden=true;
      m.querySelector("[data-v176-close]").onclick=close;m.onclick=e=>{if(e.target===m)close()};
      m.querySelectorAll("[data-v176-check]").forEach(b=>b.onclick=()=>{const id=b.dataset.v176Check;state.done=state.done.includes(id)?state.done.filter(x=>x!==id):[...state.done,id];save();draw()});
      m.querySelectorAll("[data-v176-note]").forEach(t=>t.oninput=e=>{state.notes[t.dataset.v176Note]=e.target.value;save()});
      m.querySelectorAll("[data-v176-action]").forEach(b=>b.onclick=()=>{
        const id=b.dataset.v176Action;
        if(id==="read"){close();out.querySelector("[data-v170-mode='reading']")?.click?.();return}
        if(id==="refs"){close();openVerseContext("cross",rows[0]);return}
        if(id==="words"){close();openVerseContext("strong",rows[0]);return}
        if(id==="context"){close();openVerseContext("context",rows[0]);return}
        if(id==="comments"){close();openVerseContext("comments",rows[0]);return}
        if(id==="studio"){current=rows;sendStudio();return}
        const note=m.querySelector(`[data-v176-note="${id}"]`);note?.focus();
      });
      m.querySelector("[data-v176-copy]").onclick=async()=>{
        const txt=`Jornada X — ${ref}\n\n${steps.map(([id,ico,title])=>`${state.done.includes(id)?"✓":"○"} ${ico} ${title}\n${state.notes[id]||""}`).join("\n\n")}`;
        await bxCopyText(txt);bxV157Toast("Jornada copiada");
      };
      m.querySelector("[data-v176-reset]").onclick=()=>{state.done=[];state.notes={};save();draw()};
      m.querySelector("[data-v176-studio]").onclick=()=>{
        const notes=steps.map(([id,ico,title])=>state.notes[id]?`${ico} ${title}: ${state.notes[id]}`:"").filter(Boolean).join("\n");
        Store.set("studioPrefill",`${formatVerses(rows)}\n\nJORNADA X\n${notes}`);
        current=rows;sendStudio();
      };
    };
    draw();
  };
  out.querySelector("[data-v176-journey]")?.addEventListener("click",bxV176Open);


  // V1.77 — Palavra X: análise de palavras dentro da passagem
  const bxV177Stop=new Set(["a","o","e","de","da","do","das","dos","em","na","no","nas","nos","um","uma","uns","umas","para","por","com","que","se","ao","aos","à","às","como","mais","mas","não","sim","foi","era","ser","são","sua","seu","suas","seus","ele","ela","eles","elas","lhe","lhes","me","te","nos","vos"]);
  const bxV177Words=()=>{
    const list=[];
    rows.forEach(v=>{
      String(v.text||"").match(/[A-Za-zÀ-ÿ]{3,}/g)?.forEach(raw=>{
        const key=raw.toLocaleLowerCase("pt-BR").normalize("NFD").replace(/[\u0300-\u036f]/g,"");
        if(!bxV177Stop.has(key))list.push({key,label:raw,ref:v.ref});
      });
    });
    const map=new Map();
    for(const x of list){
      if(!map.has(x.key))map.set(x.key,{key:x.key,label:x.label,count:0,refs:new Set()});
      const a=map.get(x.key);a.count++;a.refs.add(x.ref);
    }
    return [...map.values()].sort((a,b)=>b.count-a.count||a.label.localeCompare(b.label,"pt-BR"));
  };
  const bxV177Open=()=>{
    let m=document.getElementById("bxV177Words");
    if(!m){m=document.createElement("div");m.id="bxV177Words";m.className="bx-v177-modal";document.body.appendChild(m)}
    const all=bxV177Words().slice(0,80);
    const draw=(filter="")=>{
      const q=filter.toLocaleLowerCase("pt-BR");
      const list=all.filter(x=>!q||x.label.toLocaleLowerCase("pt-BR").includes(q));
      m.hidden=false;
      m.innerHTML=`<div class="bx-v177-card"><header><div><small>ANÁLISE LOCAL DA PASSAGEM</small><h3>🔤 Palavra X • ${escapeHtml(bxV157NavRef(rows))}</h3><p>Descubra palavras recorrentes e abra rapidamente pesquisa, concordância e Strong.</p></div><button data-v177-close>×</button></header>
        <div class="bx-v177-search"><input data-v177-filter placeholder="Filtrar palavras..." value="${escapeHtml(filter)}"><span>${list.length} termos</span></div>
        <div class="bx-v177-list">${list.length?list.map(x=>`<article><div><b>${escapeHtml(x.label)}</b><small>${x.count} ocorrência(s) • ${x.refs.size} verso(s)</small></div><div><button data-v177-find="${escapeHtml(x.label)}">🔎 Bíblia</button><button data-v177-conc="${escapeHtml(x.label)}">☷ Concordância</button><button data-v177-strong="${escapeHtml(x.label)}">🇬🇷 Strong</button></div></article>`).join(""):'<p class="bx-v177-empty">Nenhum termo encontrado.</p>'}</div>
        <footer><button data-v177-copy>⧉ Copiar palavras principais</button><button data-v177-close>Fechar</button></footer></div>`;
      const close=()=>m.hidden=true;
      m.querySelectorAll("[data-v177-close]").forEach(b=>b.onclick=close);
      m.onclick=e=>{if(e.target===m)close()};
      const f=m.querySelector("[data-v177-filter]");
      f.oninput=()=>draw(f.value);
      f.focus();f.setSelectionRange(f.value.length,f.value.length);
      m.querySelectorAll("[data-v177-find]").forEach(b=>b.onclick=()=>{close();if($("#bSearch"))$("#bSearch").value=b.dataset.v177Find;$("#bFind")?.click()});
      m.querySelectorAll("[data-v177-conc]").forEach(b=>b.onclick=()=>{close();if($("#bSearch"))$("#bSearch").value=b.dataset.v177Conc;$("#bConcordance")?.click()});
      m.querySelectorAll("[data-v177-strong]").forEach(b=>b.onclick=()=>{close();bxWordLookup(b.dataset.v177Strong)});
      m.querySelector("[data-v177-copy]").onclick=async()=>{await bxCopyText(all.slice(0,25).map(x=>`${x.label} (${x.count})`).join(", "));bxV157Toast("Palavras principais copiadas")};
    };
    draw("");
  };
  out.querySelector("[data-v177-words]")?.addEventListener("click",bxV177Open);



  // V1.78 — Caderno X: notas organizadas por passagem com exportação
  const BX_V178_KEY="logos-bx:v178-notebook";
  const bxV178Open=()=>{
    let m=document.getElementById("bxV178Notebook");
    if(!m){m=document.createElement("div");m.id="bxV178Notebook";m.className="bx-v178-modal";document.body.appendChild(m)}
    const ref=bxV157NavRef(rows),all=Store.get(BX_V178_KEY,{})||{};
    const note=all[ref]||{title:"",observation:"",questions:"",application:"",prayer:"",tags:"",updated:0};
    const save=()=>{
      all[ref]=note;note.updated=Date.now();Store.set(BX_V178_KEY,all);
      const s=m.querySelector("[data-v178-status]");if(s)s.textContent="✓ salvo agora";
    };
    m.hidden=false;
    m.innerHTML=`<div class="bx-v178-card"><header><div><small>CADERNO DE ESTUDO LOCAL</small><h3>📓 Caderno X • ${escapeHtml(ref)}</h3><p>Organize suas próprias descobertas sem misturar com o texto bíblico.</p></div><button data-v178-close>×</button></header>
      <div class="bx-v178-status" data-v178-status>${note.updated?`Última alteração: ${new Date(note.updated).toLocaleString("pt-BR")}`:"Novo caderno"}</div>
      <label>Título do estudo<input data-v178-field="title" value="${escapeHtml(note.title)}" placeholder="Ex.: O novo nascimento"></label>
      <div class="bx-v178-grid">
        <label>👁 Observações<textarea data-v178-field="observation" placeholder="O que o texto realmente diz?">${escapeHtml(note.observation)}</textarea></label>
        <label>❓ Perguntas<textarea data-v178-field="questions" placeholder="O que ainda preciso investigar?">${escapeHtml(note.questions)}</textarea></label>
        <label>❤️ Aplicações<textarea data-v178-field="application" placeholder="Que princípio posso aplicar com responsabilidade?">${escapeHtml(note.application)}</textarea></label>
        <label>🙏 Oração<textarea data-v178-field="prayer" placeholder="Transforme a reflexão em oração.">${escapeHtml(note.prayer)}</textarea></label>
      </div>
      <label>🏷 Tags<input data-v178-field="tags" value="${escapeHtml(note.tags)}" placeholder="fé, missão, Espírito Santo..."></label>
      <footer><button data-v178-copy>⧉ Copiar caderno</button><button data-v178-clear>🗑 Limpar</button><button data-v178-studio>⚡ Studio X</button><button data-v178-close>Fechar</button></footer></div>`;
    const close=()=>m.hidden=true;
    m.querySelectorAll("[data-v178-close]").forEach(b=>b.onclick=close);m.onclick=e=>{if(e.target===m)close()};
    let timer=null;
    m.querySelectorAll("[data-v178-field]").forEach(el=>el.oninput=()=>{note[el.dataset.v178Field]=el.value;clearTimeout(timer);timer=setTimeout(save,250)});
    const text=()=>`Caderno X — ${ref}\n${note.title?`\n${note.title}\n`:""}\nOBSERVAÇÕES\n${note.observation||"—"}\n\nPERGUNTAS\n${note.questions||"—"}\n\nAPLICAÇÕES\n${note.application||"—"}\n\nORAÇÃO\n${note.prayer||"—"}\n\nTAGS\n${note.tags||"—"}`;
    m.querySelector("[data-v178-copy]").onclick=async()=>{save();await bxCopyText(text());bxV157Toast("Caderno copiado")};
    m.querySelector("[data-v178-clear]").onclick=()=>{if(confirm("Limpar este caderno?")){delete all[ref];Store.set(BX_V178_KEY,all);bxV178Open()}};
    m.querySelector("[data-v178-studio]").onclick=()=>{save();Store.set("studioPrefill",`${formatVerses(rows)}\n\n${text()}`);current=rows;sendStudio()};
  };
  out.querySelector("[data-v178-notebook]")?.addEventListener("click",bxV178Open);



  // V1.79 — Citar X: formatos rápidos para copiar e compartilhar
  const bxV179Open=()=>{
    let m=document.getElementById("bxV179Cite");
    if(!m){m=document.createElement("div");m.id="bxV179Cite";m.className="bx-v179-modal";document.body.appendChild(m)}
    const ref=bxV157NavRef(rows),text=rows.map(v=>v.text).join(" ");
    const version=selectedTranslation()==="porbr2018"?"BLIVRE":"WEBP";
    const formats=[
      ["compact","Compacta",`${ref} — ${text} (${version})`],
      ["classic","Clássica",`“${text}” — ${ref} (${version})`],
      ["study","Estudo",`${ref} (${version})\n${text}`],
      ["sermon","Pregação",`📖 ${ref}\n${text}`],
      ["social","Compartilhar",`📖 ${ref}\n\n${text}\n\n— ${version}`]
    ];
    m.hidden=false;
    m.innerHTML=`<div class="bx-v179-card"><header><div><small>CITAÇÃO E COMPARTILHAMENTO</small><h3>❞ Citar X • ${escapeHtml(ref)}</h3><p>Copie a passagem no formato ideal sem editar manualmente.</p></div><button data-v179-close>×</button></header>
      <div class="bx-v179-list">${formats.map(([id,title,val])=>`<article><div><b>${escapeHtml(title)}</b><pre>${escapeHtml(val)}</pre></div><button data-v179-copy="${id}">⧉ Copiar</button></article>`).join("")}</div>
      <footer><button data-v179-close>Fechar</button></footer></div>`;
    const close=()=>m.hidden=true;
    m.querySelectorAll("[data-v179-close]").forEach(b=>b.onclick=close);m.onclick=e=>{if(e.target===m)close()};
    m.querySelectorAll("[data-v179-copy]").forEach(b=>b.onclick=async()=>{const x=formats.find(f=>f[0]===b.dataset.v179Copy);if(x){await bxCopyText(x[2]);b.textContent="✓ Copiado";bxV157Toast("Citação copiada")}});
  };
  out.querySelector("[data-v179-cite]")?.addEventListener("click",bxV179Open);



  // V1.80 — Perguntas X: gera perguntas de observação sem chamada de IA
  const bxV180Open=()=>{
    let m=document.getElementById("bxV180Questions");
    if(!m){m=document.createElement("div");m.id="bxV180Questions";m.className="bx-v180-modal";document.body.appendChild(m)}
    const ref=bxV157NavRef(rows);
    const people=[...bxEntityPeople].filter(n=>rows.some(v=>String(v.text).includes(n))).slice(0,5);
    const places=[...bxEntityPlaces].filter(n=>rows.some(v=>String(v.text).includes(n))).slice(0,5);
    const q=[
      `Qual é a ideia central de ${ref}?`,
      "Que afirmação do texto é mais importante e por quê?",
      "Existe uma ordem, promessa, contraste, causa ou consequência no texto?",
      "O que acontece antes e depois desta passagem no capítulo?",
      people.length?`Qual é o papel de ${people.join(", ")} nesta passagem?`:"Quem age, fala ou recebe a ação nesta passagem?",
      places.length?`O que ${places.join(", ")} acrescenta ao contexto geográfico?`:"Existe algum elemento geográfico que ajude a entender o texto?",
      "Quais palavras merecem consulta no Strong ou Léxico?",
      "Que outras passagens ajudam a interpretar esta passagem?",
      "Que doutrina ou princípio bíblico aparece sem precisar forçar o texto?",
      "Que aplicação nasce do sentido original da passagem?",
      "Que erro de interpretação devo evitar aqui?",
      "Como explicar esta passagem de forma simples para outra pessoa?"
    ];
    m.hidden=false;
    m.innerHTML=`<div class="bx-v180-card"><header><div><small>PERGUNTAS DE OBSERVAÇÃO • SEM API</small><h3>❓ Perguntas X • ${escapeHtml(ref)}</h3><p>Use perguntas para investigar o texto antes de pedir respostas prontas.</p></div><button data-v180-close>×</button></header>
      <div class="bx-v180-list">${q.map((x,i)=>`<label><input type="checkbox" data-v180-q="${i}"><span>${i+1}</span><b>${escapeHtml(x)}</b></label>`).join("")}</div>
      <footer><button data-v180-copy>⧉ Copiar selecionadas</button><button data-v180-note>📓 Enviar ao Caderno</button><button data-v180-close>Fechar</button></footer></div>`;
    const close=()=>m.hidden=true;
    m.querySelectorAll("[data-v180-close]").forEach(b=>b.onclick=close);m.onclick=e=>{if(e.target===m)close()};
    const selected=()=>[...m.querySelectorAll("[data-v180-q]:checked")].map(c=>q[Number(c.dataset.v180Q)]);
    m.querySelector("[data-v180-copy]").onclick=async()=>{const s=selected();await bxCopyText((s.length?s:q).map((x,i)=>`${i+1}. ${x}`).join("\n"));bxV157Toast("Perguntas copiadas")};
    m.querySelector("[data-v180-note]").onclick=()=>{const s=selected();const all=Store.get("logos-bx:v178-notebook",{})||{},n=all[ref]||{title:"",observation:"",questions:"",application:"",prayer:"",tags:"",updated:0};n.questions=[n.questions,(s.length?s:q).map((x,i)=>`${i+1}. ${x}`).join("\n")].filter(Boolean).join("\n\n");n.updated=Date.now();all[ref]=n;Store.set("logos-bx:v178-notebook",all);close();out.querySelector("[data-v178-notebook]")?.click();bxV157Toast("Perguntas enviadas ao Caderno X")};
  };
  out.querySelector("[data-v180-questions]")?.addEventListener("click",bxV180Open);



  // V1.81 — Púlpito Bíblia: visualização limpa da passagem para leitura pública
  const bxV181Open=()=>{
    let m=document.getElementById("bxV181Pulpit");
    if(!m){m=document.createElement("div");m.id="bxV181Pulpit";m.className="bx-v181-pulpit";document.body.appendChild(m)}
    const ref=bxV157NavRef(rows);
    let scale=1,auto=null;
    const draw=()=>{
      m.hidden=false;
      m.style.setProperty("--bx181-scale",scale);
      m.innerHTML=`<header><div><small>LEITURA PÚBLICA</small><b>${escapeHtml(ref)}</b></div><div><button data-v181-smaller>A−</button><button data-v181-reset>${Math.round(scale*100)}%</button><button data-v181-larger>A+</button><button data-v181-auto>▶ Rolagem</button><button data-v181-close>✕ Sair</button></div></header>
        <main>${rows.map(v=>`<article data-v181-ref="${escapeHtml(v.ref)}"><span>${escapeHtml(String(v.verse))}</span><p>${escapeHtml(v.text)}</p></article>`).join("")}</main>`;
      const stop=()=>{if(auto){clearInterval(auto);auto=null}};
      m.querySelector("[data-v181-close]").onclick=()=>{stop();m.hidden=true};
      m.querySelector("[data-v181-smaller]").onclick=()=>{scale=Math.max(.75,scale-.1);draw()};
      m.querySelector("[data-v181-reset]").onclick=()=>{scale=1;draw()};
      m.querySelector("[data-v181-larger]").onclick=()=>{scale=Math.min(1.8,scale+.1);draw()};
      m.querySelector("[data-v181-auto]").onclick=e=>{if(auto){stop();e.currentTarget.textContent="▶ Rolagem"}else{auto=setInterval(()=>{m.scrollTop+=1},45);e.currentTarget.textContent="■ Parar"}};
    };
    draw();
  };
  out.querySelector("[data-v181-pulpit]")?.addEventListener("click",bxV181Open);



  // V1.82 — Painel 360: resumo operacional da passagem
  const bxV182Open=()=>{
    let m=document.getElementById("bxV182Dashboard");
    if(!m){m=document.createElement("div");m.id="bxV182Dashboard";m.className="bx-v182-modal";document.body.appendChild(m)}
    const ref=bxV157NavRef(rows),text=rows.map(v=>v.text||"").join(" ");
    const people=[...bxEntityPeople].filter(n=>text.includes(n)).slice(0,10);
    const places=[...bxEntityPlaces].filter(n=>text.includes(n)).slice(0,10);
    const words=bxV177Words().slice(0,10);
    const selected=bxSelectionGet().filter(x=>rows.some(v=>v.ref===x.ref));
    const notes=rows.filter(v=>bxLoadLocal("note",v.ref,"").trim()).length;
    const bookmarks=rows.filter(v=>bxBookmarksGet().some(x=>x.ref===v.ref)).length;
    m.hidden=false;
    m.innerHTML=`<div class="bx-v182-card"><header><div><small>VISÃO OPERACIONAL DA PASSAGEM</small><h3>◉ Painel 360 • ${escapeHtml(ref)}</h3><p>Todos os principais caminhos de estudo reunidos em um único painel.</p></div><button data-v182-close>×</button></header>
      <div class="bx-v182-kpis"><div><b>${rows.length}</b><span>versículos</span></div><div><b>${people.length}</b><span>pessoas</span></div><div><b>${places.length}</b><span>lugares</span></div><div><b>${selected.length}</b><span>selecionados</span></div><div><b>${notes}</b><span>com notas</span></div><div><b>${bookmarks}</b><span>marcados</span></div></div>
      <div class="bx-v182-grid">
        <section><h4>👤 Pessoas</h4>${people.map(x=>`<button data-v182-entity="people" data-v182-name="${escapeHtml(x)}">${escapeHtml(x)}</button>`).join("")||"<p>—</p>"}</section>
        <section><h4>🗺 Lugares</h4>${places.map(x=>`<button data-v182-entity="maps" data-v182-name="${escapeHtml(x)}">${escapeHtml(x)}</button>`).join("")||"<p>—</p>"}</section>
        <section><h4>🔤 Palavras recorrentes</h4>${words.map(x=>`<button data-v182-word="${escapeHtml(x.label)}">${escapeHtml(x.label)} <b>${x.count}</b></button>`).join("")||"<p>—</p>"}</section>
        <section class="bx-v182-actions"><h4>⚡ Ações</h4>
          <button data-v182-open="journey">🧭 Jornada X</button><button data-v182-open="desk">▦ Mesa X</button><button data-v182-open="notebook">📓 Caderno X</button><button data-v182-open="network">🕸 Rede X</button><button data-v182-open="timeline">🕰 Tempo X</button><button data-v182-open="compare">▥ Comparador X</button><button data-v182-open="audio">🔊 Ouvir</button><button data-v182-open="pulpit">🎤 Púlpito</button>
        </section>
      </div>
      <footer><button data-v182-copy>⧉ Copiar resumo</button><button data-v182-studio>⚡ Studio X</button><button data-v182-close>Fechar</button></footer></div>`;
    const close=()=>m.hidden=true;
    m.querySelectorAll("[data-v182-close]").forEach(b=>b.onclick=close);m.onclick=e=>{if(e.target===m)close()};
    m.querySelectorAll("[data-v182-entity]").forEach(b=>b.onclick=()=>{close();bxOpenEntity(b.dataset.v182Entity,b.dataset.v182Name)});
    m.querySelectorAll("[data-v182-word]").forEach(b=>b.onclick=()=>{close();bxWordLookup(b.dataset.v182Word)});
    const map={journey:"[data-v176-journey]",desk:"[data-v173-desk]",notebook:"[data-v178-notebook]",network:"[data-v174-network]",timeline:"[data-v175-timeline]",compare:"[data-v171-comparex]",audio:"[data-v172-audio]",pulpit:"[data-v181-pulpit]"};
    m.querySelectorAll("[data-v182-open]").forEach(b=>b.onclick=()=>{close();out.querySelector(map[b.dataset.v182Open])?.click()});
    m.querySelector("[data-v182-copy]").onclick=async()=>{await bxCopyText(`Painel 360 — ${ref}\nVersículos: ${rows.length}\nPessoas: ${people.join(", ")||"—"}\nLugares: ${places.join(", ")||"—"}\nPalavras: ${words.map(x=>`${x.label}(${x.count})`).join(", ")||"—"}\nSelecionados: ${selected.length}\nNotas: ${notes}\nMarcadores: ${bookmarks}`);bxV157Toast("Resumo 360 copiado")};
    m.querySelector("[data-v182-studio]").onclick=()=>{current=selected.length?selected:rows;sendStudio()};
  };
  out.querySelector("[data-v182-dashboard]")?.addEventListener("click",bxV182Open);



  // V1.83 — Central X: launcher pesquisável das ferramentas avançadas
  window.__bxV183Catalog=window.__bxV183Catalog||[];
  const bxV183Register=(x)=>{
    if(!x?.id)return;
    window.__bxV183Catalog=window.__bxV183Catalog.filter(a=>a.id!==x.id);
    window.__bxV183Catalog.push(x);
  };
  [
    ["discover","🔭","Descobertas","Raio-X local da passagem","[data-v168-discover]"],
    ["trail","🧭","Trilha Contextual","Texto → pessoas → lugares → recursos","[data-v169-trail]"],
    ["layers","◫","Camadas","Leitura, estudo, originais, geografia e pregação","[data-v170-layers]"],
    ["compare","▥","Comparador X","Duas versões lado a lado","[data-v171-comparex]"],
    ["audio","🔊","Audio Reader X","Ouvir a passagem sem API paga","[data-v172-audio]"],
    ["desk","▦","Mesa X","Dock lateral de estudo","[data-v173-desk]"],
    ["network","🕸","Rede X","Pessoas, lugares e versos conectados","[data-v174-network]"],
    ["time","🕰","Tempo X","Panorama cronológico orientativo","[data-v175-timeline]"],
    ["journey","🧭","Jornada X","Estudo guiado em etapas","[data-v176-journey]"],
    ["words","🔤","Palavra X","Frequência, concordância e Strong","[data-v177-words]"],
    ["notebook","📓","Caderno X","Anotações organizadas por passagem","[data-v178-notebook]"],
    ["cite","❞","Citar X","Formatos de citação prontos","[data-v179-cite]"],
    ["questions","❓","Perguntas X","Perguntas de observação sem IA","[data-v180-questions]"],
    ["pulpit","🎤","Púlpito Bíblia","Leitura pública em tela cheia","[data-v181-pulpit]"],
    ["dashboard","◉","Painel 360","Visão operacional da passagem","[data-v182-dashboard]"]
  ].forEach(([id,icon,title,desc,selector])=>bxV183Register({id,icon,title,desc,selector}));
  const bxV183Open=()=>{
    let m=document.getElementById("bxV183Center");
    if(!m){m=document.createElement("div");m.id="bxV183Center";m.className="bx-v183-modal";document.body.appendChild(m)}
    const draw=(q="")=>{
      const term=String(q||"").toLocaleLowerCase("pt-BR");
      const tools=[...window.__bxV183Catalog].filter(x=>!term||`${x.title} ${x.desc}`.toLocaleLowerCase("pt-BR").includes(term));
      m.hidden=false;
      m.innerHTML=`<div class="bx-v183-card"><header><div><small>FERRAMENTAS AVANÇADAS</small><h3>✦ Central X • ${escapeHtml(bxV157NavRef(rows))}</h3><p>Uma única porta para todo o ecossistema avançado da Bíblia X.</p></div><button data-v183-close>×</button></header>
        <div class="bx-v183-search"><input data-v183-search placeholder="Pesquisar ferramenta..." value="${escapeHtml(q)}"><span>${tools.length} ferramentas</span></div>
        <div class="bx-v183-grid">${tools.map(x=>`<button type="button" data-v183-tool="${escapeHtml(x.id)}"><span>${x.icon}</span><div><b>${escapeHtml(x.title)}</b><small>${escapeHtml(x.desc)}</small></div></button>`).join("")||'<p class="bx-v183-empty">Nenhuma ferramenta encontrada.</p>'}</div>
        <footer><span>Atalho: abra a Central X e digite o nome da ferramenta.</span><button data-v183-close>Fechar</button></footer></div>`;
      const close=()=>m.hidden=true;
      m.querySelectorAll("[data-v183-close]").forEach(b=>b.onclick=close);m.onclick=e=>{if(e.target===m)close()};
      const inp=m.querySelector("[data-v183-search]");inp.oninput=()=>draw(inp.value);setTimeout(()=>{inp.focus();inp.setSelectionRange(inp.value.length,inp.value.length)},0);
      m.querySelectorAll("[data-v183-tool]").forEach(b=>b.onclick=()=>{
        const x=window.__bxV183Catalog.find(t=>t.id===b.dataset.v183Tool);if(!x)return;
        close();out.querySelector(x.selector)?.click();
      });
    };
    draw("");
  };
  out.querySelector("[data-v183-center]")?.addEventListener("click",bxV183Open);



  // V1.84 — Memória X: memorização bíblica com revisão espaçada local
  bxV183Register?.({id:"memory",icon:"🧠",title:"Memória X",desc:"Memorize versículos com revisão espaçada local",selector:"[data-v184-memory]"});
  const BX_V184_KEY="logos-bx:v184-memory";
  const bxV184Get=()=>Store.get(BX_V184_KEY,[])||[];
  const bxV184Save=a=>Store.set(BX_V184_KEY,a);
  const bxV184Open=()=>{
    let m=document.getElementById("bxV184Memory");
    if(!m){m=document.createElement("div");m.id="bxV184Memory";m.className="bx-v184-modal";document.body.appendChild(m)}
    const addRows=(list)=>{
      let deck=bxV184Get(),map=new Map(deck.map(x=>[x.ref,x]));
      list.forEach(v=>{if(!map.has(v.ref))map.set(v.ref,{ref:v.ref,text:v.text,level:0,due:Date.now(),reviews:0,last:0})});
      deck=[...map.values()];bxV184Save(deck);return deck;
    };
    const draw=()=>{
      const deck=bxV184Get(),due=deck.filter(x=>(x.due||0)<=Date.now()).sort((a,b)=>(a.due||0)-(b.due||0));
      const card=due[0];
      m.hidden=false;
      m.innerHTML=`<div class="bx-v184-card"><header><div><small>MEMORIZAÇÃO • 100% LOCAL</small><h3>🧠 Memória X</h3><p>Crie um baralho bíblico e revise no ritmo certo, sem depender de IA.</p></div><button data-v184-close>×</button></header>
        <div class="bx-v184-kpis"><div><b>${deck.length}</b><span>no baralho</span></div><div><b>${due.length}</b><span>para revisar</span></div><div><b>${deck.filter(x=>(x.level||0)>=4).length}</b><span>firmes</span></div></div>
        <div class="bx-v184-add"><button data-v184-add-current>＋ Versículo atual</button><button data-v184-add-selected>☑ Selecionados</button><button data-v184-add-passage>📖 Passagem aberta</button></div>
        ${card?`<section class="bx-v184-review" data-v184-review>
          <small>REVISÃO AGORA</small><b>${escapeHtml(card.ref)}</b><div class="bx-v184-mask" data-v184-mask>Toque para revelar o texto</div><p data-v184-text hidden>${escapeHtml(card.text)}</p>
          <div class="bx-v184-rate" hidden><button data-v184-rate="0">Errei</button><button data-v184-rate="1">Difícil</button><button data-v184-rate="2">Bom</button><button data-v184-rate="3">Fácil</button></div>
        </section>`:'<div class="bx-v184-empty">✓ Nenhuma revisão pendente agora.</div>'}
        <div class="bx-v184-list"><h4>Meu baralho</h4>${deck.slice(0,60).map(x=>`<article><div><b>${escapeHtml(x.ref)}</b><small>Nível ${x.level||0} • ${x.reviews||0} revisão(ões)</small></div><button data-v184-remove="${escapeHtml(x.ref)}">×</button></article>`).join("")||"<p>Nenhum versículo adicionado ainda.</p>"}</div>
        <footer><button data-v184-close>Fechar</button></footer></div>`;
      const close=()=>m.hidden=true;
      m.querySelectorAll("[data-v184-close]").forEach(b=>b.onclick=close);m.onclick=e=>{if(e.target===m)close()};
      const currentIndex=window.__bxV157Ctx?.index||0,currentVerse=rows[Math.max(0,Math.min(rows.length-1,currentIndex))]||rows[0];
      m.querySelector("[data-v184-add-current]")?.addEventListener("click",()=>{if(currentVerse)addRows([currentVerse]);draw()});
      m.querySelector("[data-v184-add-selected]")?.addEventListener("click",()=>{const s=bxSelectionGet().filter(x=>rows.some(v=>v.ref===x.ref));addRows(s);draw()});
      m.querySelector("[data-v184-add-passage]")?.addEventListener("click",()=>{addRows(rows);draw()});
      m.querySelectorAll("[data-v184-remove]").forEach(b=>b.onclick=()=>{bxV184Save(bxV184Get().filter(x=>x.ref!==b.dataset.v184Remove));draw()});
      if(card){
        const mask=m.querySelector("[data-v184-mask]"),txt=m.querySelector("[data-v184-text]"),rate=m.querySelector(".bx-v184-rate");
        mask.onclick=()=>{mask.hidden=true;txt.hidden=false;rate.hidden=false};
        m.querySelectorAll("[data-v184-rate]").forEach(b=>b.onclick=()=>{
          const score=Number(b.dataset.v184Rate),deck2=bxV184Get(),x=deck2.find(a=>a.ref===card.ref);if(!x)return;
          const intervals=[0,1,3,7,15,30,60,120,240];
          x.level=score===0?0:Math.min(8,(x.level||0)+(score===3?2:1));
          x.reviews=(x.reviews||0)+1;x.last=Date.now();
          const days=score===0?0:intervals[x.level]||240;
          x.due=Date.now()+Math.max(5/1440,days)*86400000;
          bxV184Save(deck2);draw();
        });
      }
    };
    draw();
  };
  out.querySelector("[data-v184-memory]")?.addEventListener("click",bxV184Open);



  // V1.85 — Contexto 7x7: janela de leitura ao redor do verso atual
  bxV183Register?.({id:"context7",icon:"7×7",title:"Contexto 7×7",desc:"Veja versos antes e depois sem perder o foco",selector:"[data-v185-context7]"});
  const bxV185Open=async()=>{
    let m=document.getElementById("bxV185Context");
    if(!m){m=document.createElement("div");m.id="bxV185Context";m.className="bx-v185-modal";document.body.appendChild(m)}
    const i=window.__bxV157Ctx?.index||0,active=rows[Math.max(0,Math.min(rows.length-1,i))]||rows[0];if(!active)return;
    m.hidden=false;m.innerHTML='<div class="bx-v185-card"><div class="bx-v185-loading">Carregando contexto do capítulo...</div></div>';
    try{
      const chapterRows=await smartBibleRef(`${active.book} ${active.chapter}`);
      const pos=chapterRows.findIndex(v=>Number(v.verse)===Number(active.verse));
      const lo=Math.max(0,pos-7),hi=Math.min(chapterRows.length,pos+8),slice=chapterRows.slice(lo,hi);
      m.querySelector(".bx-v185-card").innerHTML=`<header><div><small>JANELA DE CONTEXTO</small><h3>7×7 • ${escapeHtml(active.ref)}</h3><p>Até sete versos antes e sete depois do versículo em foco.</p></div><button data-v185-close>×</button></header>
        <div class="bx-v185-list">${slice.map(v=>`<article class="${v.ref===active.ref?"active":""}"><button data-v185-open="${escapeHtml(v.ref)}">${escapeHtml(String(v.verse))}</button><p>${escapeHtml(v.text)}</p></article>`).join("")}</div>
        <footer><button data-v185-chapter>📖 Abrir capítulo inteiro</button><button data-v185-close>Fechar</button></footer>`;
      const close=()=>m.hidden=true;
      m.querySelectorAll("[data-v185-close]").forEach(b=>b.onclick=close);m.onclick=e=>{if(e.target===m)close()};
      m.querySelectorAll("[data-v185-open]").forEach(b=>b.onclick=async()=>{const ref=b.dataset.v185Open;close();const rr=await smartBibleRef(ref);if(rr.length){current=rr;if($("#bRef"))$("#bRef").value=ref;renderBibleVerses(rr)}});
      m.querySelector("[data-v185-chapter]").onclick=()=>{close();current=chapterRows;if($("#bRef"))$("#bRef").value=`${active.book} ${active.chapter}`;renderBibleVerses(chapterRows)};
    }catch(e){m.querySelector(".bx-v185-loading").textContent="Não foi possível carregar o contexto."}
  };
  out.querySelector("[data-v185-context7]")?.addEventListener("click",bxV185Open);



  // V1.86 — Cadeia X: exploração encadeada de referências cruzadas
  bxV183Register?.({id:"chain",icon:"⛓",title:"Cadeia X",desc:"Siga referências cruzadas em sequência",selector:"[data-v186-chain]"});
  const bxV186Open=()=>{
    let m=document.getElementById("bxV186Chain");
    if(!m){m=document.createElement("div");m.id="bxV186Chain";m.className="bx-v186-modal";document.body.appendChild(m)}
    const start=rows[Math.max(0,Math.min(rows.length-1,window.__bxV157Ctx?.index||0))]||rows[0];if(!start)return;
    const trail=[start];
    const draw=async(v)=>{
      m.hidden=false;m.innerHTML=`<div class="bx-v186-card"><header><div><small>REFERÊNCIAS EM CADEIA</small><h3>⛓ Cadeia X • ${escapeHtml(v.ref)}</h3><p>Abra uma referência e continue seguindo a conexão sem perder o caminho percorrido.</p></div><button data-v186-close>×</button></header>
        <div class="bx-v186-trail">${trail.map((x,i)=>`<button data-v186-trail="${i}">${escapeHtml(x.ref)}</button>${i<trail.length-1?"<span>→</span>":""}`).join("")}</div>
        <div class="bx-v186-current"><b>${escapeHtml(v.ref)}</b><p>${escapeHtml(v.text)}</p></div>
        <div class="bx-v186-links"><div class="bx-v186-loading">Buscando referências...</div></div>
        <footer><button data-v186-open-reading>📖 Abrir na leitura</button><button data-v186-close>Fechar</button></footer></div>`;
      const close=()=>m.hidden=true;m.querySelectorAll("[data-v186-close]").forEach(b=>b.onclick=close);m.onclick=e=>{if(e.target===m)close()};
      m.querySelectorAll("[data-v186-trail]").forEach(b=>b.onclick=()=>{trail.splice(Number(b.dataset.v186Trail)+1);draw(trail[trail.length-1])});
      m.querySelector("[data-v186-open-reading]").onclick=async()=>{close();const rr=await smartBibleRef(v.ref);if(rr.length){current=rr;if($("#bRef"))$("#bRef").value=v.ref;renderBibleVerses(rr)}};
      let refs=[];
      try{refs=await bxServerCrossrefs(v)}catch(_){}
      if(!refs?.length)refs=(bxCrossSeed[v.ref]||[]).map(ref=>({ref}));
      const box=m.querySelector(".bx-v186-links");
      if(!refs.length){box.innerHTML='<p>Nenhuma referência cruzada disponível para este versículo.</p>';return}
      box.innerHTML=refs.slice(0,24).map((x,i)=>`<button data-v186-ref="${escapeHtml(x.ref||x.reference||String(x))}"><span>${i+1}</span><b>${escapeHtml(x.ref||x.reference||String(x))}</b></button>`).join("");
      box.querySelectorAll("[data-v186-ref]").forEach(b=>b.onclick=async()=>{
        try{
          const rr=await smartBibleRef(b.dataset.v186Ref);if(!rr.length)return;
          const next=rr[0];trail.push(next);draw(next);
        }catch(_){bxV157Toast("Referência indisponível")}
      });
    };
    draw(start);
  };
  out.querySelector("[data-v186-chain]")?.addEventListener("click",bxV186Open);



  // V1.87 — Duas Passagens X: estudo lado a lado de referências diferentes
  bxV183Register?.({id:"two",icon:"Ⅱ",title:"Duas Passagens X",desc:"Compare referências diferentes lado a lado",selector:"[data-v187-two]"});
  const BX_V187_KEY="logos-bx:v187-second-ref";
  const bxV187Open=()=>{
    let m=document.getElementById("bxV187Two");
    if(!m){m=document.createElement("div");m.id="bxV187Two";m.className="bx-v187-modal";document.body.appendChild(m)}
    const left=rows,defaultRef=Store.get(BX_V187_KEY,"Romanos 8:28")||"Romanos 8:28";
    const drawShell=()=>{
      m.hidden=false;m.innerHTML=`<div class="bx-v187-card"><header><div><small>ESTUDO LADO A LADO</small><h3>Ⅱ Duas Passagens X</h3><p>Fixe a passagem atual e carregue outra referência para comparar contexto, vocabulário ou tema.</p></div><button data-v187-close>×</button></header>
        <div class="bx-v187-control"><label>Segunda referência<input data-v187-input value="${escapeHtml(defaultRef)}" placeholder="Ex.: Romanos 8:28"></label><button data-v187-load>Carregar</button></div>
        <div class="bx-v187-cols"><section><h4>${escapeHtml(bxV157NavRef(left))}</h4><div>${left.map(v=>`<article><b>${escapeHtml(v.ref)}</b><p>${escapeHtml(v.text)}</p></article>`).join("")}</div></section><section data-v187-right><div class="bx-v187-loading">Digite uma referência e carregue.</div></section></div>
        <footer><button data-v187-copy>▥ Copiar comparação</button><button data-v187-close>Fechar</button></footer></div>`;
      const close=()=>m.hidden=true;m.querySelectorAll("[data-v187-close]").forEach(b=>b.onclick=close);m.onclick=e=>{if(e.target===m)close()};
      const load=async()=>{
        const ref=m.querySelector("[data-v187-input]").value.trim();if(!ref)return;Store.set(BX_V187_KEY,ref);
        const rightBox=m.querySelector("[data-v187-right]");rightBox.innerHTML='<div class="bx-v187-loading">Carregando...</div>';
        try{
          const right=await smartBibleRef(ref);window.__bxV187Right=right;
          rightBox.innerHTML=`<h4>${escapeHtml(right.length?bxV157NavRef(right):ref)}</h4><div>${right.map(v=>`<article><b>${escapeHtml(v.ref)}</b><p>${escapeHtml(v.text)}</p></article>`).join("")||"<p>Passagem não encontrada.</p>"}</div>`;
        }catch(_){rightBox.innerHTML='<p>Não foi possível abrir a segunda referência.</p>'}
      };
      m.querySelector("[data-v187-load]").onclick=load;m.querySelector("[data-v187-input]").onkeydown=e=>{if(e.key==="Enter")load()};
      m.querySelector("[data-v187-copy]").onclick=async()=>{const right=window.__bxV187Right||[];await bxCopyText(`PASSAGEM A\n${formatVerses(left)}\n\nPASSAGEM B\n${right.length?formatVerses(right):"—"}`);bxV157Toast("Comparação copiada")};
      load();
    };
    drawShell();
  };
  out.querySelector("[data-v187-two]")?.addEventListener("click",bxV187Open);



  // V1.88 — Biblioteca Pessoal X: centraliza dados locais do usuário
  bxV183Register?.({id:"library",icon:"🏛",title:"Biblioteca Pessoal X",desc:"Notas, memorização, marcadores e estudos em um só lugar",selector:"[data-v188-library]"});
  const bxV188Open=()=>{
    let m=document.getElementById("bxV188Library");
    if(!m){m=document.createElement("div");m.id="bxV188Library";m.className="bx-v188-modal";document.body.appendChild(m)}
    const notesBook=Store.get("logos-bx:v178-notebook",{})||{};
    const noteEntries=Object.entries(notesBook).sort((a,b)=>(b[1]?.updated||0)-(a[1]?.updated||0));
    const memory=bxV184Get?.()||[];
    const due=memory.filter(x=>(x.due||0)<=Date.now());
    const bookmarks=bxBookmarksGet?.()||[];
    const selected=bxSelectionGet?.()||[];
    const recent=bxV157NavGet?.().items?.slice().reverse().slice(0,12)||[];
    m.hidden=false;
    m.innerHTML=`<div class="bx-v188-card"><header><div><small>MEU ACERVO LOCAL</small><h3>🏛 Biblioteca Pessoal X</h3><p>Tudo o que você produziu e salvou na Bíblia X, reunido sem depender de nuvem.</p></div><button data-v188-close>×</button></header>
      <div class="bx-v188-kpis"><div><b>${noteEntries.length}</b><span>cadernos</span></div><div><b>${memory.length}</b><span>memorização</span></div><div><b>${due.length}</b><span>revisões hoje</span></div><div><b>${bookmarks.length}</b><span>marcadores</span></div><div><b>${selected.length}</b><span>selecionados</span></div><div><b>${recent.length}</b><span>recentes</span></div></div>
      <div class="bx-v188-grid">
        <section><h4>📓 Cadernos recentes</h4>${noteEntries.slice(0,10).map(([ref,n])=>`<button data-v188-open-ref="${escapeHtml(ref)}"><b>${escapeHtml(ref)}</b><span>${escapeHtml(n.title||n.observation||"Caderno salvo").slice(0,80)}</span></button>`).join("")||"<p>Nenhum caderno salvo.</p>"}</section>
        <section><h4>🧠 Memória X</h4>${memory.slice(0,10).map(x=>`<button data-v188-open-ref="${escapeHtml(x.ref)}"><b>${escapeHtml(x.ref)}</b><span>Nível ${x.level||0} • ${((x.due||0)<=Date.now())?"revisar agora":"agendado"}</span></button>`).join("")||"<p>Baralho vazio.</p>"}</section>
        <section><h4>🔖 Marcadores</h4>${bookmarks.slice(0,10).map(x=>`<button data-v188-open-ref="${escapeHtml(x.ref)}"><b>${escapeHtml(x.ref)}</b><span>${escapeHtml(String(x.text||"").slice(0,80))}</span></button>`).join("")||"<p>Nenhum marcador.</p>"}</section>
        <section><h4>🕘 Passagens recentes</h4>${recent.map(ref=>`<button data-v188-open-ref="${escapeHtml(ref)}"><b>${escapeHtml(ref)}</b><span>Abrir novamente</span></button>`).join("")||"<p>Sem histórico recente.</p>"}</section>
      </div>
      <footer><button data-v188-memory>🧠 Revisar Memória X</button><button data-v188-center>✦ Central X</button><button data-v188-close>Fechar</button></footer></div>`;
    const close=()=>m.hidden=true;
    m.querySelectorAll("[data-v188-close]").forEach(b=>b.onclick=close);m.onclick=e=>{if(e.target===m)close()};
    m.querySelectorAll("[data-v188-open-ref]").forEach(b=>b.onclick=async()=>{try{const rr=await smartBibleRef(b.dataset.v188OpenRef);if(rr.length){close();current=rr;if($("#bRef"))$("#bRef").value=b.dataset.v188OpenRef;renderBibleVerses(rr)}}catch(_){}});
    m.querySelector("[data-v188-memory]").onclick=()=>{close();out.querySelector("[data-v184-memory]")?.click()};
    m.querySelector("[data-v188-center]").onclick=()=>{close();out.querySelector("[data-v183-center]")?.click()};
  };
  out.querySelector("[data-v188-library]")?.addEventListener("click",bxV188Open);



  // V1.89 — Atlas Instantâneo X
  bxV183Register?.({id:"atlasinstant",icon:"🗺",title:"Atlas Instantâneo X",desc:"Lugares da passagem, mapa, 360° e imagens",selector:"[data-v189-atlas]"});
  const bxV189CoordSeed={
    "Jerusalém":[31.778,35.235],"Belém":[31.7054,35.2024],"Nazaré":[32.6996,35.3035],"Cafarnaum":[32.8803,35.575],"Jericó":[31.871,35.444],
    "Betânia":[31.771,35.261],"Caná":[32.747,35.339],"Galileia":[32.75,35.35],"Mar da Galileia":[32.82,35.59],"Samaria":[32.276,35.197],
    "Judeia":[31.7,35.2],"Damasco":[33.5138,36.2765],"Antioquia":[36.2021,36.1605],"Éfeso":[37.939,27.341],"Corinto":[37.9386,22.9322],
    "Roma":[41.9028,12.4964],"Patmos":[37.309,26.547],"Chipre":[35.1264,33.4299],"Creta":[35.2401,24.8093],"Sinai":[28.539,33.975],
    "Hebrom":[31.5326,35.0998],"Betel":[31.93,35.22],"Berseba":[31.252,34.7915],"Jordão":[31.8,35.55],"Egito":[30.0444,31.2357],"Babilônia":[32.542,44.421],
    "Nínive":[36.36,43.15],"Canaã":[31.8,35.2],"Ur":[30.962,46.103],"Ur dos Caldeus":[30.962,46.103]
  };
  const bxV189DetectedPlaces=()=>{
    const text=rows.map(v=>String(v.text||"")).join(" ");
    return [...bxEntityPlaces].filter(n=>new RegExp(`(^|[^A-Za-zÀ-ÿ])${n.replace(/[.*+?^${}()|[\]\\]/g,"\\$&")}(?=$|[^A-Za-zÀ-ÿ])`,"i").test(text)).slice(0,20);
  };
  const bxV189ResolvePlace=async(name)=>{
    const all=await mapsAll();
    const found=all.find(x=>String(x.name||"").toLocaleLowerCase("pt-BR")===String(name).toLocaleLowerCase("pt-BR"));
    if(found)return found;
    const c=bxV189CoordSeed[name];
    return {id:`instant-${name}`,name,type:"place",region:"Atlas bíblico",period:"",lat:c?.[0],lng:c?.[1],description:"Lugar reconhecido automaticamente no texto bíblico.",refs:rows.map(v=>v.ref).slice(0,8),tags:["passagem atual"]};
  };
  const bxV189Open=async()=>{
    let m=document.getElementById("bxV189Atlas");
    if(!m){m=document.createElement("div");m.id="bxV189Atlas";m.className="bx-v189-modal";document.body.appendChild(m)}
    const places=bxV189DetectedPlaces();
    const all=await mapsAll();
    const fallback=places.length?places:(all.slice(0,12).map(x=>x.name));
    m.hidden=false;
    m.innerHTML=`<div class="bx-v189-card"><header><div><small>ATLAS CONTEXTUAL DA PASSAGEM</small><h3>🗺 Atlas Instantâneo • ${escapeHtml(bxV157NavRef(rows))}</h3><p>Abra um lugar reconhecido no texto e salte para mapa, imagens, 360° ou ficha completa.</p></div><button data-v189-close>×</button></header>
      <div class="bx-v189-grid">${fallback.length?fallback.map(name=>`<button data-v189-place="${escapeHtml(name)}"><span>📍</span><div><b>${escapeHtml(name)}</b><small>${places.includes(name)?"Encontrado nesta passagem":"Disponível no atlas local"}</small></div><i>›</i></button>`).join(""):'<div class="bx-v189-empty">Carregue registros no Mapas X para ampliar o Atlas Instantâneo.</div>'}</div>
      <footer><button data-v189-maps>🗺 Abrir Mapas X</button><button data-v189-close>Fechar</button></footer></div>`;
    const close=()=>m.hidden=true;
    m.querySelectorAll("[data-v189-close]").forEach(b=>b.onclick=close);m.onclick=e=>{if(e.target===m)close()};
    m.querySelectorAll("[data-v189-place]").forEach(b=>b.onclick=async()=>{const row=await bxV189ResolvePlace(b.dataset.v189Place);close();activate("maps");setTimeout(()=>{mapDetail(row);$("#bxMapDetail")?.scrollIntoView({behavior:"smooth",block:"start"})},50)});
    m.querySelector("[data-v189-maps]").onclick=()=>{close();activate("maps")};
  };
  out.querySelector("[data-v189-atlas]")?.addEventListener("click",bxV189Open);



  // V1.90 — Lugar X: ficha geográfica contextual
  bxV183Register?.({id:"placex",icon:"📍",title:"Lugar X",desc:"Ficha geográfica completa de um lugar bíblico",selector:"[data-v190-place]"});
  const bxV190Open=async(name=null)=>{
    let m=document.getElementById("bxV190Place");
    if(!m){m=document.createElement("div");m.id="bxV190Place";m.className="bx-v190-modal";document.body.appendChild(m)}
    const detected=bxV189DetectedPlaces(),all=await mapsAll(),pick=name||detected[0]||all[0]?.name;
    if(!pick){bxV157Toast("Nenhum lugar disponível no Atlas");return}
    const row=await bxV189ResolvePlace(pick),near=bxV166Nearby(row);
    const urls=bxMapExternalUrls(row),embed=bxMapEmbedUrl(row);
    m.hidden=false;
    m.innerHTML=`<div class="bx-v190-card"><header><div><small>FICHA GEOGRÁFICA CONTEXTUAL</small><h3>📍 ${escapeHtml(row.name)}</h3><p>${escapeHtml([row.region,row.period].filter(Boolean).join(" • ")||"Lugar bíblico")}</p></div><button data-v190-close>×</button></header>
      <div class="bx-v190-hero">${embed?`<iframe title="Mapa de ${escapeHtml(row.name)}" src="${escapeHtml(embed)}" loading="lazy"></iframe>`:'<div><span>🗺</span><b>Sem coordenadas no atlas local</b></div>'}</div>
      <div class="bx-v190-actions"><button data-v190-explore>🗺 Explorar</button><a href="${escapeHtml(urls.pano)}" target="_blank" rel="noopener">🕶 360°</a><a href="${escapeHtml(urls.commons)}" target="_blank" rel="noopener">🖼 Imagens</a><a href="${escapeHtml(urls.google)}" target="_blank" rel="noopener">📍 Google</a></div>
      <div class="bx-v190-body"><section><h4>Resumo</h4><p>${escapeHtml(row.description||"Lugar reconhecido no contexto da passagem atual.")}</p></section>
        <section><h4>Referências bíblicas</h4><div>${(row.refs||rows.map(v=>v.ref).slice(0,8)).map(r=>`<button data-v190-ref="${escapeHtml(r)}">${escapeHtml(r)}</button>`).join("")||"—"}</div></section>
        <section><h4>Lugares próximos</h4><div>${near.map(x=>`<button data-v190-near="${escapeHtml(x.name)}">${escapeHtml(x.name)} <small>~${Math.round(x._km)} km</small></button>`).join("")||"—"}</div></section>
        <section><h4>Conexões</h4><div><button data-v190-module="people">👤 Personagens</button><button data-v190-module="timeline">🕰 Linha do Tempo</button><button data-v190-module="context">🧭 Contexto</button><button data-v190-module="media">🎥 Mídia</button></div></section>
      </div><footer><button data-v190-copy>⧉ Copiar ficha</button><button data-v190-close>Fechar</button></footer></div>`;
    const close=()=>m.hidden=true;m.querySelectorAll("[data-v190-close]").forEach(b=>b.onclick=close);m.onclick=e=>{if(e.target===m)close()};
    m.querySelector("[data-v190-explore]")?.addEventListener("click",()=>bxMapExplore(row));
    m.querySelectorAll("[data-v190-near]").forEach(b=>b.onclick=()=>bxV190Open(b.dataset.v190Near));
    m.querySelectorAll("[data-v190-module]").forEach(b=>b.onclick=()=>{close();bxV166ModuleOpen(b.dataset.v190Module,row.name)});
    m.querySelectorAll("[data-v190-ref]").forEach(b=>b.onclick=async()=>{close();const rr=await smartBibleRef(b.dataset.v190Ref);if(rr.length){current=rr;if($("#bRef"))$("#bRef").value=b.dataset.v190Ref;renderBibleVerses(rr)}});
    m.querySelector("[data-v190-copy]").onclick=async()=>{await bxCopyText([row.name,row.region,row.period,row.description,(row.refs||[]).join(", ")].filter(Boolean).join("\n"));bxV157Toast("Ficha copiada")};
  };
  out.querySelector("[data-v190-place]")?.addEventListener("click",()=>bxV190Open());


  // V1.91 — Rota X: construtor pessoal de rotas bíblicas
  bxV183Register?.({id:"routex",icon:"➜",title:"Rota X",desc:"Monte e salve rotas personalizadas por lugares bíblicos",selector:"[data-v191-route]"});
  const BX_V191_KEY="logos-bx:v191-routes";
  const bxV191Open=async()=>{
    let m=document.getElementById("bxV191Route");if(!m){m=document.createElement("div");m.id="bxV191Route";m.className="bx-v191-modal";document.body.appendChild(m)}
    const all=await mapsAll(),basePlaces=[...new Set([...bxV189DetectedPlaces(),...all.map(x=>x.name),...Object.keys(bxV189CoordSeed)])].slice(0,120);
    let saved=Store.get(BX_V191_KEY,[])||[],draft=[];
    const draw=()=>{
      m.hidden=false;m.innerHTML=`<div class="bx-v191-card"><header><div><small>LABORATÓRIO DE ROTAS</small><h3>➜ Rota X</h3><p>Monte uma sequência de lugares e salve como uma rota pessoal de estudo.</p></div><button data-v191-close>×</button></header>
        <div class="bx-v191-builder"><label>Adicionar lugar<select data-v191-select><option value="">Escolha...</option>${basePlaces.map(x=>`<option>${escapeHtml(x)}</option>`).join("")}</select></label><button data-v191-add>＋ Adicionar</button><input data-v191-name placeholder="Nome da rota, ex.: Viagem missionária"><button data-v191-save>💾 Salvar rota</button></div>
        <div class="bx-v191-draft"><h4>Rota atual</h4><div>${draft.map((x,i)=>`<span><b>${i+1}</b>${escapeHtml(x)}<button data-v191-remove="${i}">×</button></span>`).join("<i>→</i>")||"<p>Adicione lugares para começar.</p>"}</div></div>
        <section class="bx-v191-saved"><h4>Minhas rotas</h4>${saved.map((r,i)=>`<article><div><b>${escapeHtml(r.name)}</b><small>${r.places.length} parada(s) • ${r.places.join(" → ")}</small></div><div><button data-v191-open="${i}">Abrir</button><button data-v191-delete="${i}">×</button></div></article>`).join("")||"<p>Nenhuma rota pessoal salva.</p>"}</section>
        <footer><button data-v191-close>Fechar</button></footer></div>`;
      const close=()=>m.hidden=true;m.querySelectorAll("[data-v191-close]").forEach(b=>b.onclick=close);m.onclick=e=>{if(e.target===m)close()};
      m.querySelector("[data-v191-add]").onclick=()=>{const v=m.querySelector("[data-v191-select]").value;if(v&&!draft.includes(v)){draft.push(v);draw()}};
      m.querySelectorAll("[data-v191-remove]").forEach(b=>b.onclick=()=>{draft.splice(Number(b.dataset.v191Remove),1);draw()});
      m.querySelector("[data-v191-save]").onclick=()=>{const name=m.querySelector("[data-v191-name]").value.trim()||`Rota ${saved.length+1}`;if(draft.length<2){bxV157Toast("Adicione pelo menos 2 lugares");return}saved=[...saved,{name,places:[...draft],created:Date.now()}];Store.set(BX_V191_KEY,saved);draft=[];draw()};
      m.querySelectorAll("[data-v191-delete]").forEach(b=>b.onclick=()=>{saved.splice(Number(b.dataset.v191Delete),1);Store.set(BX_V191_KEY,saved);draw()});
      m.querySelectorAll("[data-v191-open]").forEach(b=>b.onclick=async()=>{const r=saved[Number(b.dataset.v191Open)];if(!r)return;close();activate("maps");const rows2=[];for(const name of r.places)rows2.push(await bxV189ResolvePlace(name));const valid=rows2.filter(x=>x);if(valid.length){mapDetail({...valid[0],id:`route-${Date.now()}`,name:r.name,type:"route",route:r.places,description:`Rota pessoal com ${r.places.length} paradas.`,refs:[]})}});
    };draw();
  };
  out.querySelector("[data-v191-route]")?.addEventListener("click",bxV191Open);


  // V1.92 — Rota da Passagem X
  bxV183Register?.({id:"passageroute",icon:"🧭",title:"Rota da Passagem X",desc:"Transforma lugares citados no texto em percurso de estudo",selector:"[data-v192-passage-route]"});
  const bxV192Open=async()=>{
    let m=document.getElementById("bxV192Route");if(!m){m=document.createElement("div");m.id="bxV192Route";m.className="bx-v192-modal";document.body.appendChild(m)}
    const ordered=[];for(const v of rows){for(const n of bxEntityPlaces){if(String(v.text||"").includes(n)&&!ordered.some(x=>x.name===n))ordered.push({name:n,ref:v.ref})}}
    m.hidden=false;m.innerHTML=`<div class="bx-v192-card"><header><div><small>GEOGRAFIA EXTRAÍDA DO TEXTO</small><h3>🧭 Rota da Passagem • ${escapeHtml(bxV157NavRef(rows))}</h3><p>Acompanhe os lugares na ordem em que aparecem na passagem.</p></div><button data-v192-close>×</button></header>
      <div class="bx-v192-route">${ordered.length?ordered.map((x,i)=>`<article><span>${i+1}</span><div><b>${escapeHtml(x.name)}</b><small>${escapeHtml(x.ref)}</small></div><button data-v192-place="${escapeHtml(x.name)}">Explorar</button></article>`).join(""):'<div class="bx-v192-empty">Nenhum lugar reconhecido automaticamente nesta passagem.</div>'}</div>
      <footer><button data-v192-save>💾 Salvar como Rota X</button><button data-v192-atlas>🗺 Atlas Instantâneo</button><button data-v192-close>Fechar</button></footer></div>`;
    const close=()=>m.hidden=true;m.querySelectorAll("[data-v192-close]").forEach(b=>b.onclick=close);m.onclick=e=>{if(e.target===m)close()};
    m.querySelectorAll("[data-v192-place]").forEach(b=>b.onclick=()=>{close();bxV190Open(b.dataset.v192Place)});
    m.querySelector("[data-v192-save]").onclick=()=>{if(ordered.length<2){bxV157Toast("A passagem precisa conter pelo menos 2 lugares");return}const saved=Store.get(BX_V191_KEY,[])||[];saved.push({name:`${bxV157NavRef(rows)} • rota`,places:ordered.map(x=>x.name),created:Date.now()});Store.set(BX_V191_KEY,saved);bxV157Toast("Rota da passagem salva")};
    m.querySelector("[data-v192-atlas]").onclick=()=>{close();bxV189Open()};
  };
  out.querySelector("[data-v192-passage-route]")?.addEventListener("click",bxV192Open);


  // V1.93 — Galeria Bíblica X: imagens públicas vinculadas ao lugar
  bxV183Register?.({id:"galleryx",icon:"🖼",title:"Galeria Bíblica X",desc:"Imagens públicas relacionadas aos lugares da passagem",selector:"[data-v193-gallery]"});
  const bxV193Open=async(name=null)=>{
    let m=document.getElementById("bxV193Gallery");if(!m){m=document.createElement("div");m.id="bxV193Gallery";m.className="bx-v193-modal";document.body.appendChild(m)}
    const places=bxV189DetectedPlaces(),all=await mapsAll(),pick=name||places[0]||all[0]?.name||"Jerusalem";
    m.hidden=false;m.innerHTML=`<div class="bx-v193-card"><header><div><small>GALERIA VISUAL • FONTES PÚBLICAS</small><h3>🖼 Galeria X • ${escapeHtml(pick)}</h3><p>Miniaturas públicas para apoiar o estudo visual. Confira a licença individual na página do arquivo.</p></div><button data-v193-close>×</button></header>
      <div class="bx-v193-tabs">${[...new Set([pick,...places,...all.slice(0,6).map(x=>x.name)])].slice(0,10).map(x=>`<button data-v193-place="${escapeHtml(x)}" class="${x===pick?"active":""}">${escapeHtml(x)}</button>`).join("")}</div>
      <div class="bx-map-media-grid bx-v193-grid" data-v193-grid></div>
      <footer><a href="${escapeHtml(`https://commons.wikimedia.org/wiki/Special:MediaSearch?type=image&search=${encodeURIComponent(pick)}`)}" target="_blank" rel="noopener">Abrir busca completa ↗</a><button data-v193-close>Fechar</button></footer></div>`;
    const close=()=>m.hidden=true;m.querySelectorAll("[data-v193-close]").forEach(b=>b.onclick=close);m.onclick=e=>{if(e.target===m)close()};
    m.querySelectorAll("[data-v193-place]").forEach(b=>b.onclick=()=>bxV193Open(b.dataset.v193Place));
    bxMapLoadCommonsImages(pick,m.querySelector("[data-v193-grid]"));
  };
  out.querySelector("[data-v193-gallery]")?.addEventListener("click",()=>bxV193Open());


  // V1.94 — Passeio 360 X: central de destinos com mapa + abertura 360°
  bxV183Register?.({id:"tour360",icon:"🕶",title:"Passeio 360 X",desc:"Mapa e acesso rápido a panoramas de lugares bíblicos",selector:"[data-v194-tour]"});
  const bxV194Open=async()=>{
    let m=document.getElementById("bxV194Tour");if(!m){m=document.createElement("div");m.id="bxV194Tour";m.className="bx-v194-modal";document.body.appendChild(m)}
    const detected=bxV189DetectedPlaces(),all=await mapsAll(),names=[...new Set([...detected,...bxV167Tours.map(x=>x.name),...all.map(x=>x.name)])].slice(0,24);
    const rows2=[];for(const name of names){const r=await bxV189ResolvePlace(name);if(Number.isFinite(Number(r.lat))&&Number.isFinite(Number(r.lng)))rows2.push(r)}
    const first=rows2[0];
    const draw=(row)=>{
      const urls=bxMapExternalUrls(row),embed=bxMapEmbedUrl(row);
      m.hidden=false;m.innerHTML=`<div class="bx-v194-card"><header><div><small>EXPLORAÇÃO GEOGRÁFICA</small><h3>🕶 Passeio 360 X</h3><p>Escolha um destino, veja o mapa e abra o panorama disponível no serviço externo.</p></div><button data-v194-close>×</button></header>
        <div class="bx-v194-layout"><aside>${rows2.map(x=>`<button data-v194-place="${escapeHtml(x.name)}" class="${x.name===row.name?"active":""}"><span>📍</span><div><b>${escapeHtml(x.name)}</b><small>${escapeHtml(x.region||"Lugar bíblico")}</small></div></button>`).join("")}</aside>
        <main><div class="bx-v194-map">${embed?`<iframe src="${escapeHtml(embed)}" title="Mapa de ${escapeHtml(row.name)}" loading="lazy"></iframe>`:"<p>Sem mapa para este destino.</p>"}</div><div class="bx-v194-info"><div><small>DESTINO</small><h4>${escapeHtml(row.name)}</h4><p>${escapeHtml(row.description||"Explore este lugar no contexto bíblico.")}</p></div><nav><a href="${escapeHtml(urls.pano)}" target="_blank" rel="noopener">🕶 Abrir 360°</a><button data-v194-images>🖼 Imagens</button><button data-v194-place-card>📍 Ficha Lugar X</button></nav></div></main></div></div>`;
      const close=()=>m.hidden=true;m.querySelector("[data-v194-close]").onclick=close;m.onclick=e=>{if(e.target===m)close()};
      m.querySelectorAll("[data-v194-place]").forEach(b=>b.onclick=()=>{const r=rows2.find(x=>x.name===b.dataset.v194Place);if(r)draw(r)});
      m.querySelector("[data-v194-images]").onclick=()=>bxV193Open(row.name);
      m.querySelector("[data-v194-place-card]").onclick=()=>bxV190Open(row.name);
    };
    if(first)draw(first);else bxV157Toast("Nenhum destino com coordenadas disponível");
  };
  out.querySelector("[data-v194-tour]")?.addEventListener("click",bxV194Open);

  // V1.57 — barra inteligente / histórico
  const bxV157NavState=bxV157NavGet();
  const bxV157Back=out.querySelector("[data-v157-back]"),bxV157Forward=out.querySelector("[data-v157-forward]");
  if(bxV157Back)bxV157Back.disabled=bxV157NavState.index<=0;
  if(bxV157Forward)bxV157Forward.disabled=bxV157NavState.index<0||bxV157NavState.index>=bxV157NavState.items.length-1;
  bxV157Back?.addEventListener("click",()=>bxV157NavGo(-1));
  bxV157Forward?.addEventListener("click",()=>bxV157NavGo(1));
  out.querySelector("[data-v157-resume]")?.addEventListener("click",()=>{bxResumeReading();bxV157Toast("Retomando última leitura")});
  out.querySelector("[data-v157-bookmarks]")?.addEventListener("click",bxRenderBookmarks);
  out.querySelector("[data-v157-help]")?.addEventListener("click",()=>{
    let m=document.getElementById("bxV157Help");
    if(!m){m=document.createElement("div");m.id="bxV157Help";m.className="bx-v157-help";document.body.appendChild(m)}
    m.hidden=false;
    m.innerHTML=`<div class="bx-v157-help-card"><header><div><small>BÍBLIA X</small><h3>⌨ Navegação rápida</h3></div><button type="button" data-v157-help-close>×</button></header>
      <div class="bx-v157-help-grid">
        <div><kbd>Alt</kbd> + <kbd>←</kbd><span>Voltar passagem</span></div>
        <div><kbd>Alt</kbd> + <kbd>→</kbd><span>Avançar passagem</span></div>
        <div><kbd>J</kbd><span>Próximo versículo</span></div>
        <div><kbd>K</kbd><span>Versículo anterior</span></div>
        <div><kbd>B</kbd><span>Marcar versículo atual</span></div>
        <div><kbd>C</kbd><span>Copiar versículo atual</span></div>
        <div><kbd>F</kbd><span>Foco no versículo atual</span></div>
        <div><kbd>Esc</kbd><span>Sair do foco</span></div>
      </div>
      <p>Os atalhos são ignorados enquanto você estiver digitando em campos de texto.</p>
    </div>`;
    m.querySelector("[data-v157-help-close]")?.addEventListener("click",()=>m.hidden=true);
    m.addEventListener("click",e=>{if(e.target===m)m.hidden=true},{once:true});
  });

  // V1.57 — trilho flutuante de leitura
  let bxV157CurrentIndex=0;
  const bxV157Els=[...out.querySelectorAll("[data-bx-v3-verse]")];
  const bxV157Pos=out.querySelector("[data-v157-position]");
  const bxV157Bm=out.querySelector("[data-v157-bookmark-current]");
  const bxV157SetCurrent=(index,scroll=false)=>{
    bxV157CurrentIndex=Math.max(0,Math.min(rows.length-1,index));
    const v=bxV157VerseByIndex(rows,bxV157CurrentIndex);
    if(!v)return;
    if(bxV157Pos)bxV157Pos.textContent=`${bxV157CurrentIndex+1} / ${rows.length}`;
    const marked=bxBookmarksGet().some(x=>x.ref===v.ref);
    if(bxV157Bm){bxV157Bm.textContent=marked?"★":"☆";bxV157Bm.classList.toggle("active",marked);bxV157Bm.title=marked?`Remover marcador de ${v.ref}`:`Marcar ${v.ref}`}
    bxV157Els.forEach((el,i)=>el.classList.toggle("bx-v157-current",i===bxV157CurrentIndex));
    if(scroll)bxV157Els[bxV157CurrentIndex]?.scrollIntoView({behavior:"smooth",block:"center"});
    window.__bxV157Ctx={rows,index:bxV157CurrentIndex,setCurrent:bxV157SetCurrent};
  };
  out.querySelector("[data-v157-prev]")?.addEventListener("click",()=>bxV157SetCurrent(bxV157CurrentIndex-1,true));
  out.querySelector("[data-v157-next]")?.addEventListener("click",()=>bxV157SetCurrent(bxV157CurrentIndex+1,true));
  bxV157Bm?.addEventListener("click",()=>{
    const v=bxV157VerseByIndex(rows,bxV157CurrentIndex);if(!v)return;
    const on=bxBookmarkToggle(v);bxV157SetCurrent(bxV157CurrentIndex,false);bxV157Toast(on?`★ ${v.ref} marcado`:`☆ ${v.ref} removido`);
  });
  out.querySelector("[data-v157-copy-current]")?.addEventListener("click",async()=>{
    const v=bxV157VerseByIndex(rows,bxV157CurrentIndex);if(!v)return;
    await bxCopyText(`${v.ref} — ${v.text}`);bxV157Toast(`Copiado: ${v.ref}`);
  });
  out.querySelector("[data-v157-focus-current]")?.addEventListener("click",()=>{
    const v=bxV157VerseByIndex(rows,bxV157CurrentIndex);if(!v)return;
    bxFocusVerse(v.ref);bxV157Toast(`Foco: ${v.ref}`);
  });
  bxV157Els.forEach((el,i)=>el.addEventListener("click",e=>{
    if(e.target.closest("button"))return;
    bxV157SetCurrent(i,false);
  }));
  if("IntersectionObserver" in window){
    try{window.__bxV157Observer?.disconnect?.()}catch(_){}
    window.__bxV157Observer=new IntersectionObserver(entries=>{
      const visible=entries.filter(e=>e.isIntersecting).sort((a,b)=>Math.abs(a.boundingClientRect.top-innerHeight*.38)-Math.abs(b.boundingClientRect.top-innerHeight*.38))[0];
      if(!visible)return;
      const i=Number(visible.target.dataset.v157Index);
      if(Number.isFinite(i))bxV157SetCurrent(i,false);
    },{root:null,rootMargin:"-22% 0px -54% 0px",threshold:[0,.1,.35]});
    bxV157Els.forEach(el=>window.__bxV157Observer.observe(el));
  }
  bxV157SetCurrent(0,false);

  // V1.57 — atalhos do leitor; um único listener global
  if(!window.__bxV157KeysInstalled){
    window.__bxV157KeysInstalled=true;
    document.addEventListener("keydown",async e=>{
      if(!bxV157ReaderVisible()||bxV157IsEditable())return;
      if(e.altKey&&e.key==="ArrowLeft"){e.preventDefault();bxV157NavGo(-1);return}
      if(e.altKey&&e.key==="ArrowRight"){e.preventDefault();bxV157NavGo(1);return}
      const ctx=window.__bxV157Ctx;if(!ctx?.rows?.length)return;
      if(e.key==="j"||e.key==="J"){e.preventDefault();ctx.setCurrent(ctx.index+1,true);return}
      if(e.key==="k"||e.key==="K"){e.preventDefault();ctx.setCurrent(ctx.index-1,true);return}
      const v=ctx.rows[Math.max(0,Math.min(ctx.rows.length-1,ctx.index))];if(!v)return;
      if(e.key==="b"||e.key==="B"){e.preventDefault();const on=bxBookmarkToggle(v);ctx.setCurrent(ctx.index,false);bxV157Toast(on?`★ ${v.ref} marcado`:`☆ ${v.ref} removido`);return}
      if(e.key==="c"||e.key==="C"){e.preventDefault();await bxCopyText(`${v.ref} — ${v.text}`);bxV157Toast(`Copiado: ${v.ref}`);return}
      if(e.key==="f"||e.key==="F"){e.preventDefault();bxFocusVerse(v.ref);bxV157Toast(`Foco: ${v.ref}`);return}
      if(e.key==="Escape"){document.querySelectorAll("[data-bx-v3-verse].bx-focus-verse").forEach(x=>x.classList.remove("bx-focus-verse"));return}
    });
  }

  out.querySelector("[data-bx-passage-more]")?.addEventListener("click",e=>{
    const box=out.querySelector(".lmx-bible-v3-top-more"),on=box?.hasAttribute("hidden");
    if(!box)return;box.toggleAttribute("hidden",!on);e.currentTarget.textContent=on?"− Menos":"＋ Mais";
  });
  out.querySelectorAll("[data-bx-verse-more]").forEach(b=>b.onclick=()=>{
    const ref=b.dataset.bxVerseMore,box=out.querySelector(`[data-bx-alltools="${CSS.escape(ref)}"]`),on=box?.hasAttribute("hidden");
    if(!box)return;box.toggleAttribute("hidden",!on);b.textContent=on?"−":"＋";
  });

  let bxV155LastSelectedRef="";
  const bxV155RefreshSelection=()=>{
    const selected=bxSelectionGet();
    const bar=out.querySelector("[data-v155-selection-bar]");
    const count=out.querySelector("[data-v155-selection-count]");
    if(bar)bar.hidden=!selected.length;
    if(count)count.textContent=`${selected.length} selecionado${selected.length===1?"":"s"}`;
    out.querySelectorAll("[data-v155-select]").forEach(btn=>{
      const on=selected.some(x=>x.ref===btn.dataset.v155Select);
      btn.classList.toggle("selected",on);
      btn.textContent=on?"✓":"○";
      btn.closest("[data-bx-v3-verse]")?.classList.toggle("bx-selected-verse",on);
    });
  };
  const bxV155SetSelected=(v,on)=>{
    let a=bxSelectionGet().filter(x=>x.ref!==v.ref);
    if(on)a.push(v);
    bxSelectionSave(a);
  };
  out.querySelectorAll("[data-v155-select]").forEach(btn=>btn.onclick=e=>{
    e.stopPropagation();
    const ref=btn.dataset.v155Select,v=rows.find(x=>x.ref===ref);
    if(!v)return;
    const currently=bxSelectionHas(ref);
    if(e.shiftKey && bxV155LastSelectedRef){
      const a=rows.findIndex(x=>x.ref===bxV155LastSelectedRef),b=rows.findIndex(x=>x.ref===ref);
      if(a>=0&&b>=0){
        const [lo,hi]=a<b?[a,b]:[b,a];
        rows.slice(lo,hi+1).forEach(x=>bxV155SetSelected(x,true));
      }else bxV155SetSelected(v,!currently);
    }else bxV155SetSelected(v,!currently);
    bxV155LastSelectedRef=ref;
    bxV155RefreshSelection();
  });
  out.querySelector("[data-v155-clear]")?.addEventListener("click",()=>{bxSelectionClear();bxV155RefreshSelection()});
  out.querySelector("[data-v155-copy]")?.addEventListener("click",async()=>{
    const s=bxSelectionGet();if(!s.length)return;
    await bxCopyText(formatVerses(s));
    const b=out.querySelector("[data-v155-copy]");if(b){const old=b.textContent;b.textContent="✓ Copiado";setTimeout(()=>b.textContent=old,1200)}
  });
  out.querySelector("[data-v155-studio]")?.addEventListener("click",()=>{
    const s=bxSelectionGet();if(!s.length)return;current=s;sendStudio();
  });
  out.querySelector("[data-v155-compare]")?.addEventListener("click",()=>{
    const s=bxSelectionGet();if(!s.length)return;bxCompareTranslations(s);
  });
  bxV155RefreshSelection();

  out.querySelectorAll("[data-bx-entity]").forEach(b=>{const open=e=>{e.preventDefault?.();e.stopPropagation();bxOpenEntity(b.dataset.bxEntity,b.dataset.bxEntityName)};b.onclick=open;b.onkeydown=e=>{if(e.key==="Enter"||e.key===" ")open(e)}});
  out.querySelectorAll("[data-bx-verse-text]").forEach(el=>el.addEventListener("dblclick",()=>{
    const word=String(window.getSelection()?.toString()||"").trim().replace(/^[^\p{L}\p{N}]+|[^\p{L}\p{N}]+$/gu,"");
    if(word.length<2)return;
    activate("concordance");document.querySelector('[data-bible-section="concordance"]')?.click();
    setTimeout(()=>{const q=document.querySelector("#bxConcQuery");if(q){q.value=word;document.querySelector("#bxConcFind")?.click()}},20);
  }));
  out.querySelectorAll("[data-open-ref]").forEach(b=>b.onclick=async()=>{const ref=b.dataset.openRef,v=rows.find(x=>x.ref===ref);if(v){try{await syncBookChapterSelectors(v.book,v.chapter);await bxV161SyncVerseOptions(v.book,v.chapter,v.verse)}catch(_){}if($("#bChapter"))$("#bChapter").value=String(v.chapter);if($("#bVerse"))$("#bVerse").value=String(v.verse);if($("#bRef"))$("#bRef").value=ref;if($("#bChapterTitle"))$("#bChapterTitle").textContent=ref;bxV158UpdateMode();}else if($("#bRef"))$("#bRef").value=ref;$("#bOpen")?.click()});

  out.querySelectorAll("[data-verse-bible]").forEach(b=>b.onclick=async()=>{const v=rows.find(x=>x.ref===b.dataset.ref);if(!v)return;try{await syncBookChapterSelectors(v.book,v.chapter);await bxV161SyncVerseOptions(v.book,v.chapter,v.verse)}catch(_){}if($("#bVerse"))$("#bVerse").value=String(v.verse);if($("#bRef"))$("#bRef").value=v.ref;bxV158UpdateMode();bxFocusVerse(v.ref)});
  out.querySelectorAll("[data-verse-parallel]").forEach(b=>b.onclick=()=>{const v=rows.find(x=>x.ref===b.dataset.ref);if(v)bxRenderParallel([v])});
  out.querySelectorAll("[data-verse-atlas]").forEach(b=>b.onclick=()=>{const v=rows.find(x=>x.ref===b.dataset.ref);if(!v)return;const text=String(v.text||"").toLocaleLowerCase("pt-BR"),place=[...bxEntityPlaces].find(n=>text.includes(String(n).toLocaleLowerCase("pt-BR")));activate("maps");if($("#bxMapQuery"))$("#bxMapQuery").value=place||v.ref;setTimeout(()=>renderMaps(place||v.ref),0)});
  out.querySelectorAll("[data-verse-tool]").forEach(b=>b.onclick=()=>{const ref=b.dataset.ref,v=rows.find(x=>x.ref===ref);if($("#bRef"))$("#bRef").value=ref;current=v?[v]:[];openVerseContext(b.dataset.verseTool,v)});
  out.querySelectorAll("[data-verse-studio]").forEach(b=>b.onclick=()=>{const ref=b.dataset.ref;current=rows.filter(v=>v.ref===ref);if($("#bRef"))$("#bRef").value=ref;sendStudio()});
  out.querySelectorAll("[data-verse-organize]").forEach(b=>b.onclick=()=>{const v=rows.find(x=>x.ref===b.dataset.ref);bxRenderVerseOrganizer(v)});
  out.querySelectorAll("[data-verse-highlight]").forEach(b=>b.onclick=e=>{e.stopPropagation();const v=rows.find(x=>x.ref===b.dataset.ref);bxRenderHighlightMenu(v,b)});
  out.querySelectorAll("[data-verse-personal-links]").forEach(b=>b.onclick=()=>{const v=rows.find(x=>x.ref===b.dataset.ref);bxRenderPersonalLinks(v)});
  out.querySelectorAll("[data-verse-card]").forEach(b=>b.onclick=async()=>{const v=rows.find(x=>x.ref===b.dataset.ref);await bxCopyStudyCard(v);b.textContent="✓ Ficha copiada"});
  out.querySelectorAll("[data-verse-queue]").forEach(b=>b.onclick=()=>{const v=rows.find(x=>x.ref===b.dataset.ref);bxStudyQueueAdd(v);b.textContent="✓ Na fila"});
  out.querySelectorAll("[data-verse-backlinks]").forEach(b=>b.onclick=()=>{const v=rows.find(x=>x.ref===b.dataset.ref);bxRenderBacklinks(v)});
  const cleanOn=!!Store.get("bibleXCleanReading",true);
  const storedZoom=Number(Store.get("bibleXZoom",100))||100;
  out.dataset.bxZoom=String(storedZoom);
  out.style.setProperty("--bx-reader-scale",String(storedZoom/100));
  out.classList.toggle("bx-clean-reading",cleanOn);
  document.querySelector(".bible-x-shell")?.classList.toggle("bx-clean-reading-mode",cleanOn);
  const cleanBtn=$("#bxCleanReadingToggle");
  if(cleanBtn){cleanBtn.classList.toggle("active",cleanOn);cleanBtn.textContent=cleanOn?"📖 Clean: ON":"📖 Leitura Clean";}
  out.querySelectorAll("[data-verse-select]").forEach(b=>b.onclick=()=>{const v=rows.find(x=>x.ref===b.dataset.ref),on=bxSelectionToggle(v);b.classList.toggle("selected",on);b.closest("[data-bx-v3-verse]")?.classList.toggle("bx-selected-verse",on);b.textContent=on?"✓ Selecionado":"☑ Selecionar";bxV155RefreshSelection()});
  out.querySelectorAll("[data-verse-compare]").forEach(b=>b.onclick=()=>{const v=rows.find(x=>x.ref===b.dataset.ref),on=bxVerseCompareToggle(v);b.textContent=on?"✓ Comparando":"▦ Comparar"});
  out.querySelectorAll("[data-verse-insight]").forEach(b=>b.onclick=()=>{const v=rows.find(x=>x.ref===b.dataset.ref);bxRenderInsight(v)});
  out.querySelectorAll("[data-verse-pin]").forEach(b=>b.onclick=()=>{const v=rows.find(x=>x.ref===b.dataset.ref),on=bxPinToggle(v);b.textContent=on?"✓ Fixado":"📌 Fixar"});
  out.querySelectorAll("[data-verse-focus]").forEach(b=>b.onclick=()=>{const v=rows.find(x=>x.ref===b.dataset.ref);bxFocusSet(v);b.textContent="✓ Em foco"});
  out.querySelectorAll("[data-verse-topic]").forEach(b=>b.onclick=()=>{const v=rows.find(x=>x.ref===b.dataset.ref);bxRenderTopics(v)});
  out.querySelectorAll("[data-verse-readlater]").forEach(b=>b.onclick=()=>{const v=rows.find(x=>x.ref===b.dataset.ref);bxReadingListAdd(v);b.textContent="✓ Salvo"});
  out.querySelectorAll("[data-verse-word]").forEach(b=>b.onclick=()=>{const v=rows.find(x=>x.ref===b.dataset.ref);bxRenderWordList(v)});
  out.querySelectorAll("[data-verse-review]").forEach(b=>b.onclick=e=>{e.stopPropagation();const v=rows.find(x=>x.ref===b.dataset.ref);bxRenderReviewPicker(v,b)});
  out.querySelectorAll("[data-verse-v171index]").forEach(b=>b.onclick=()=>{const v=rows.find(x=>x.ref===b.dataset.ref);bxV171ResearchAdd(v);b.textContent="✓ Indexado"});
  out.querySelectorAll("[data-verse-question]").forEach(b=>b.onclick=()=>{const v=rows.find(x=>x.ref===b.dataset.ref);bxRenderQuestions(v)});
  out.querySelectorAll("[data-verse-studylink]").forEach(b=>b.onclick=()=>{const v=rows.find(x=>x.ref===b.dataset.ref);bxRenderStudyLinks(v)});
  out.querySelectorAll("[data-verse-v144set]").forEach(b=>b.onclick=()=>{const v=rows.find(x=>x.ref===b.dataset.ref);bxV144RenderSets(v)});
  out.querySelectorAll("[data-verse-v144daily]").forEach(b=>b.onclick=()=>{const v=rows.find(x=>x.ref===b.dataset.ref);bxV144SetDaily(v);b.textContent="✓ Hoje"});

  const bxV164VisualExplore=v=>{if(!v)return;const txt=String(v.text||"").toLocaleLowerCase("pt-BR"),places=[...bxEntityPlaces].filter(name=>txt.includes(String(name).toLocaleLowerCase("pt-BR"))).slice(0,8);let m=document.getElementById("bxV164VisualModal");if(!m){m=document.createElement("div");m.id="bxV164VisualModal";m.className="bx-v164-visual-modal";document.body.appendChild(m)}m.hidden=false;m.innerHTML=`<div class="bx-v164-visual-card"><header><div><small>CONEXÕES VISUAIS • ${escapeHtml(v.ref)}</small><h3>🌍 Explorar a passagem</h3><p>Mapas, imagens e lugares reconhecidos no texto.</p></div><button type="button" data-v164-close>×</button></header>${places.length?`<div class="bx-v164-place-list">${places.map(name=>`<article><div><span>📍</span><b>${escapeHtml(name)}</b></div><button type="button" data-v164-map="${escapeHtml(name)}">🗺️ Atlas</button><a href="https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(name)}" target="_blank" rel="noopener">📍 Mapa</a><a href="https://commons.wikimedia.org/wiki/Special:MediaSearch?type=image&search=${encodeURIComponent(name)}" target="_blank" rel="noopener">🖼️ Imagens</a></article>`).join("")}</div>`:`<div class="bx-v164-empty"><span>🔎</span><b>Nenhum lugar reconhecido automaticamente.</b><p>Pesquise a referência no Atlas.</p><button type="button" data-v164-map="${escapeHtml(v.ref)}">🗺️ Pesquisar no Atlas</button></div>`}</div>`;const close=()=>m.hidden=true;m.querySelector("[data-v164-close]").onclick=close;m.onclick=e=>{if(e.target===m)close()};m.querySelectorAll("[data-v164-map]").forEach(b=>b.onclick=()=>{close();activate("maps");if($("#bxMapQuery"))$("#bxMapQuery").value=b.dataset.v164Map;setTimeout(()=>renderMaps(b.dataset.v164Map),0)})};
  out.querySelectorAll("[data-verse-visual]").forEach(b=>b.onclick=()=>bxV164VisualExplore(rows.find(x=>x.ref===b.dataset.ref)));

  out.querySelector('[data-reader-action="copy"]')?.addEventListener("click",async()=>{const ok=await bxCopyText(bxPassageText(rows));if(ok)out.querySelector('[data-reader-action="copy"]').textContent="✓ Copiado"});
  out.querySelector('[data-reader-action="citation"]')?.addEventListener("click",async()=>{const ok=await bxCopyCitation(rows);if(ok)out.querySelector('[data-reader-action="citation"]').textContent="✓ Citação copiada"});
  out.querySelector('[data-reader-action="share"]')?.addEventListener("click",()=>bxSharePassage(rows));
  out.querySelector('[data-reader-action="print"]')?.addEventListener("click",()=>bxPrintPassage(rows));
  out.querySelector('[data-reader-action="fontdown"]')?.addEventListener("click",()=>bxAdjustFont(-.1));
  out.querySelector('[data-reader-action="fontup"]')?.addEventListener("click",()=>bxAdjustFont(.1));
  out.querySelector('[data-reader-action="compare"]')?.addEventListener("click",()=>bxCompareTranslations(rows));
  out.querySelector('[data-reader-action="parallel"]')?.addEventListener("click",()=>bxRenderParallel(rows));
  out.querySelector('[data-reader-action="resume"]')?.addEventListener("click",bxResumeReading);
  out.querySelector('[data-reader-action="dashboard"]')?.addEventListener("click",bxRenderStudyDashboard);
  out.querySelector('[data-reader-action="summary"]')?.addEventListener("click",bxRenderStudySummary);
  out.querySelector('[data-reader-action="workspace"]')?.addEventListener("click",bxExportWorkspace);
  out.querySelector('[data-reader-action="backup"]')?.addEventListener("click",bxRenderBackupCenter);
  out.querySelector('[data-reader-action="queue"]')?.addEventListener("click",bxRenderStudyQueue);
  out.querySelector('[data-reader-action="goal"]')?.addEventListener("click",bxRenderGoal);
  out.querySelector('[data-reader-action="selected"]')?.addEventListener("click",bxRenderSelectionBasket);
  out.querySelector('[data-reader-action="versecompare"]')?.addEventListener("click",bxRenderVerseCompare);
  out.querySelector('[data-reader-action="pins"]')?.addEventListener("click",bxRenderPins);
  out.querySelector('[data-reader-action="topics"]')?.addEventListener("click",()=>bxRenderTopics());
  out.querySelector('[data-reader-action="readinglist"]')?.addEventListener("click",bxRenderReadingList);
  out.querySelector('[data-reader-action="sessions"]')?.addEventListener("click",bxRenderReadingSessions);
  out.querySelector('[data-reader-action="snapshots"]')?.addEventListener("click",()=>{bxSnapshotCreate(rows);bxRenderSnapshots()});
  out.querySelector('[data-reader-action="trail"]')?.addEventListener("click",bxRenderTrail);
  out.querySelector('[data-reader-action="reviewqueue"]')?.addEventListener("click",bxRenderReviewQueue);
  out.querySelector('[data-reader-action="progress"]')?.addEventListener("click",bxRenderProgress);
  out.querySelector('[data-reader-action="v171research"]')?.addEventListener("click",bxV171RenderResearch);
  out.querySelector('[data-reader-action="v171themes"]')?.addEventListener("click",bxV171RenderThemes);
  out.querySelector('[data-reader-action="v171export"]')?.addEventListener("click",bxV171ExportResearch);
  out.querySelector('[data-reader-action="v144dashboard"]')?.addEventListener("click",bxV144RenderDashboard);
  out.querySelector('[data-reader-action="v144sets"]')?.addEventListener("click",()=>bxV144RenderSets());
  out.querySelector('[data-reader-action="v144daily"]')?.addEventListener("click",bxV144RenderDaily);
  out.querySelector('[data-reader-action="v144markdown"]')?.addEventListener("click",()=>bxV144ExportMarkdown(rows));
  out.querySelector('[data-reader-action="personalexport"]')?.addEventListener("click",bxExportPersonalStudy);
  out.querySelector('[data-reader-action="words"]')?.addEventListener("click",()=>bxRenderWordList());
  out.querySelector('[data-reader-action="print"]')?.addEventListener("click",()=>bxPrintPassage(rows));
  out.querySelector('[data-reader-action="presentation"]')?.addEventListener("click",()=>bxRenderPresentation(rows));
  out.querySelector('[data-reader-action="focus"]')?.addEventListener("click",bxRenderFocus);
  out.querySelector('[data-reader-action="commands"]')?.addEventListener("click",bxRenderCommandPalette);
  out.querySelector('[data-reader-action="recentchapters"]')?.addEventListener("click",bxRenderRecentChapters);
  out.querySelector('[data-reader-action="accessibility"]')?.addEventListener("click",bxRenderAccessibility);
  out.querySelector('[data-reader-action="personalsearch"]')?.addEventListener("click",bxRenderPersonalSearch);
  out.querySelector('[data-reader-action="report"]')?.addEventListener("click",bxStudyReport);
  out.querySelector('[data-reader-action="sessionnote"]')?.addEventListener("click",bxRenderSessionNote);
  out.querySelector('[data-reader-action="plans"]')?.addEventListener("click",bxRenderReadingPlans);
  out.querySelector('[data-reader-action="quickrefs"]')?.addEventListener("click",bxRenderQuickRefs);
  out.querySelector('[data-reader-action="collections"]')?.addEventListener("click",bxRenderCollections);
  out.querySelector('[data-reader-action="bookmarks"]')?.addEventListener("click",bxRenderBookmarks);
  out.querySelector('[data-reader-action="searchhistory"]')?.addEventListener("click",bxRenderSearchHistory);
  out.querySelector('[data-reader-action="archive"]')?.addEventListener("click",bxRenderArchiveModal);
  out.querySelector('[data-reader-action="studio"]')?.addEventListener("click",()=>{current=rows;sendStudio()});
  out.querySelector('[data-reader-action="reading"]')?.addEventListener("click",bxReadingModeToggle);
  out.querySelector('[data-reader-action="pack"]')?.addEventListener("click",async()=>{const snap=await bxBuildStudySnapshot(rows),md=bxSnapshotMarkdown(snap),safe=(rows[0]?.ref||"passagem").replace(/[^\wÀ-ÿ]+/g,"-");bxDownloadText(`biblia-x-estudo-${safe}.md`,md,"text/markdown")});
  out.querySelector('[data-reader-action="json"]')?.addEventListener("click",async()=>{const snap=await bxBuildStudySnapshot(rows),safe=(rows[0]?.ref||"passagem").replace(/[^\wÀ-ÿ]+/g,"-");bxDownloadText(`biblia-x-estudo-${safe}.json`,JSON.stringify(snap,null,2),"application/json")});
  out.querySelectorAll("[data-verse-bookmark]").forEach(b=>b.onclick=()=>{
    const ref=b.dataset.verseBookmark,v=rows.find(x=>x.ref===ref);const on=bxBookmarkToggle(v);b.textContent=on?"✓":"🔖";b.title=on?"Marcador salvo":"Marcador";
  });
  out.querySelectorAll("[data-chapter-nav]").forEach(btn=>btn.onclick=async()=>{
    if(btn.disabled)return;
    const ref=`${rows[0].book} ${btn.dataset.chapterNav}`;
    try{const rr=await smartBibleRef(ref);if(!rr.length)return;current=rr;if($("#bRef"))$("#bRef").value=ref;renderBibleVerses(rr);$("#bOut")?.scrollIntoView({behavior:"smooth",block:"start"})}catch(_){}
  });
  out.querySelectorAll("[data-bx-v3-verse]").forEach(el=>el.addEventListener("dblclick",()=>{
    const sel=String(window.getSelection?.()||"").trim();
    if(sel&&sel.split(/\s+/).length<=3){bxWordLookup(sel)}else{bxFocusVerse(el.dataset.ref)}
  }));
 };
 const smartBibleRef=async(q)=>{try{return await apiBibleRef(q)}catch(e){const local=await bibleRef(q);if(local.length)return local;throw e}};
 const smartBibleSearch=async(q)=>{try{return await apiBibleSearch(q)}catch(e){const local=await bibleSearch(q);if(local.length)return local;throw e}};
 const refreshCount=async()=>{const el=$("#bCount"),status=$("#bServerStatus");try{const ok=await loadBookMap();const r=await bxFetch(`${bibleApiBase()}/translations`);if(!ok||!r.ok)throw new Error();const j=await r.json();const t=(j.items||[]).find(x=>x.id===selectedTranslation());if(el)el.textContent=`${Object.keys(bibleBookMap).length} livros • ${t?.short_name||"Bíblia X"}`;if(status)status.textContent="● Online / servidor";return 66}catch{const a=await dbAll("verses");if(el)el.textContent=`${a.length.toLocaleString("pt-BR")} versículos locais`;if(status)status.textContent="● Offline / fallback local";return a.length}};
 const sendStudio=()=>{if(!current.length)return alert("Abra uma passagem primeiro.");const text=formatVerses(current),ref=current.length?`${current[0].book} ${current[0].chapter}${current.length===1?':'+current[0].verse:''}`:"";Store.set("bibleSelection",current);Store.set("studioPrefill",text);const cfg=Object.assign({},Store.get("studioMessageConfig",{}),{sourceMode:"passagem",text:ref||text,notes:`Texto selecionado na Bíblia X:\n${text}`});Store.set("studioMessageConfig",cfg);Store.set("studioStep",3);render("studio")};
 document.querySelectorAll("[data-bible-section]").forEach(btn=>btn.onclick=()=>activate(btn.dataset.bibleSection));
 document.querySelectorAll("[data-bible-jump]").forEach(btn=>btn.onclick=()=>activate(btn.dataset.bibleJump));
 document.querySelectorAll("[data-bible-studio]").forEach(btn=>btn.onclick=sendStudio);
 await refreshCount();
 await syncBookChapterSelectors("João",3);await bxV161SyncVerseOptions("João",3);
 $("#bVersion")?.addEventListener("change",async()=>{await refreshCount();await syncBookChapterSelectors(selectedTranslation()==="engwebp"?"John":"João",3);const name=selectedBookName();setChapterRef(name,Number($("#bChapter")?.value)||3);await bxV161SyncVerseOptions(name,Number($("#bChapter")?.value)||3);$("#bOpen")?.click()});
 $("#bBook")?.addEventListener("change",async()=>{await syncBookChapterSelectors(selectedBookName(),1);setChapterRef(selectedBookName(),Number($("#bChapter")?.value)||1);await bxV161SyncVerseOptions(selectedBookName(),Number($("#bChapter")?.value)||1);$("#bOpen")?.click()});
 $("#bChapter")?.addEventListener("change",async()=>{setChapterRef(selectedBookName(),Number($("#bChapter")?.value)||1);await bxV161SyncVerseOptions(selectedBookName(),Number($("#bChapter")?.value)||1);$("#bOpen")?.click()});
 $("#bVerse")?.addEventListener("input",()=>{bxV158UpdateMode();const ref=bxV158BuildRef();if(ref&&$("#bRef"))$("#bRef").value=ref});
 $("#bVerse")?.addEventListener("change",()=>{$("#bOpen")?.click()});
 bxV158UpdateMode();
 $("#bImport").onclick=async()=>{const f=$("#bFile").files[0];if(!f)return alert("Escolha um arquivo.");try{const n=await importBible(f);$("#bOut").textContent=`Bíblia local importada com sucesso.\n${n.toLocaleString("pt-BR")} versículos disponíveis offline.`;await refreshCount()}catch(e){$("#bOut").textContent=`Falha ao importar: ${e.message}`}};
 $("#bMeta").onclick=async()=>{try{const r=await bxFetch(`${bibleApiBase()}/translations`);const j=await r.json();$("#bOut").textContent=`BÍBLIA X • MOTOR INTEGRADO\n${(j.items||[]).map(x=>`${x.short_name}: ${x.status}`).join("\n")}\n\nBanco SQLite interno + fallback IndexedDB.`}catch{const a=await dbAll("verses");$("#bOut").textContent=`BÍBLIA X • BASE LOCAL\nVersículos: ${a.length.toLocaleString("pt-BR")}\nModo: IndexedDB`}};
 $("#bOpen").onclick=async()=>{
   const out=$("#bOut");
   // Se o bRef oculto acabou de ser preenchido por outra ferramenta interna,
   // respeitamos essa referência; caso contrário, construímos pelos seletores.
   const visibleRef=bxV158BuildRef();
   const hidden=String($("#bRef")?.value||"").trim();
   const hiddenState=currentRefState();
   const selectedBook=selectedBookName(),selectedChapter=Number($("#bChapter")?.value)||1;
   const hiddenMatchesSelectors=hiddenState&&String(hiddenState.book).toLowerCase()===String(selectedBook).toLowerCase()&&Number(hiddenState.chapter)===selectedChapter;
   if(!hiddenMatchesSelectors || document.activeElement===$("#bVerse") || !hidden){
     if(!bxV158PrepareRef()){
       out.innerHTML='<div class="bx-v158-error">⚠ Versículo inválido. Use, por exemplo, <b>16</b> ou <b>16-18</b>.</div>';
       bxV158UpdateMode();
       return;
     }
   }else if($("#bVerse") && bxV158VerseRaw()){
     // Campo visível sempre prevalece quando preenchido.
     if(!bxV158PrepareRef())return;
   }
   out.textContent="Carregando passagem...";
   try{
     current=await smartBibleRef($("#bRef").value);
     if(current.length){
       await syncBookChapterSelectors(current[0].book,current[0].chapter);
       bxV158SyncVisibleVerse(current);if($("#bChapterTitle"))$("#bChapterTitle").textContent=current.length===1?current[0].ref:`${current[0].book} ${current[0].chapter}`;
     }
     renderBibleVerses(current);
   }catch(e){
     current=[];
     out.textContent=`Não foi possível abrir a passagem. ${e.message||""}`;
   }
 };
 $("#bOpenChapter")?.addEventListener("click",async()=>{const book=selectedBookName(),chapter=Number($("#bChapter")?.value)||1;setChapterRef(book,chapter);$("#bOpen")?.click()});
 $("#bPrevChapter")?.addEventListener("click",async()=>{const bounds=chapterBounds();let ch=Number($("#bChapter")?.value)||currentRefState()?.chapter||1;if(ch>bounds.min){ch--;setChapterRef(selectedBookName(),ch);$("#bOpen")?.click();return}const idx=bookItems.findIndex(x=>x.code===$("#bBook")?.value);if(idx>0){$("#bBook").value=bookItems[idx-1].code;await syncBookChapterSelectors(selectedBookName(),999);const b=chapterBounds();ch=b.max;setChapterRef(selectedBookName(),ch);$("#bOpen")?.click()}});
 $("#bNextChapter")?.addEventListener("click",async()=>{const bounds=chapterBounds();let ch=Number($("#bChapter")?.value)||currentRefState()?.chapter||1;if(ch<bounds.max){ch++;setChapterRef(selectedBookName(),ch);$("#bOpen")?.click();return}const idx=bookItems.findIndex(x=>x.code===$("#bBook")?.value);if(idx>=0&&idx<bookItems.length-1){$("#bBook").value=bookItems[idx+1].code;await syncBookChapterSelectors(selectedBookName(),1);ch=1;setChapterRef(selectedBookName(),ch);$("#bOpen")?.click()}});
 $("#bRef")?.addEventListener("keydown",e=>{if(e.key==="Enter")$("#bOpen")?.click()});
 
 const BX_V159_SELECTED_BOOKS_KEY="logos-bx:v159-selected-books";
 const BX_V159_PREFS_KEY="logos-bx:v159-search-prefs";
 const bxV159Norm=s=>String(s||"").toLocaleLowerCase("pt-BR").normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/[“”"']/g,"").replace(/\s+/g," ").trim();
 const bxV159Words=s=>bxV159Norm(s).match(/[a-z0-9]+/g)||[];
 const bxV159BookKey=s=>bxV159Norm(s).replace(/\s+/g," ");
 const bxV159CanonPT=[
  "Gênesis","Êxodo","Levítico","Números","Deuteronômio","Josué","Juízes","Rute","1 Samuel","2 Samuel","1 Reis","2 Reis","1 Crônicas","2 Crônicas","Esdras","Neemias","Ester","Jó","Salmos","Provérbios","Eclesiastes","Cantares","Isaías","Jeremias","Lamentações","Ezequiel","Daniel","Oseias","Joel","Amós","Obadias","Jonas","Miqueias","Naum","Habacuque","Sofonias","Ageu","Zacarias","Malaquias",
  "Mateus","Marcos","Lucas","João","Atos","Romanos","1 Coríntios","2 Coríntios","Gálatas","Efésios","Filipenses","Colossenses","1 Tessalonicenses","2 Tessalonicenses","1 Timóteo","2 Timóteo","Tito","Filemom","Hebreus","Tiago","1 Pedro","2 Pedro","1 João","2 João","3 João","Judas","Apocalipse"
 ];
 const bxV159CanonEN=[
  "Genesis","Exodus","Leviticus","Numbers","Deuteronomy","Joshua","Judges","Ruth","1 Samuel","2 Samuel","1 Kings","2 Kings","1 Chronicles","2 Chronicles","Ezra","Nehemiah","Esther","Job","Psalms","Proverbs","Ecclesiastes","Song of Solomon","Isaiah","Jeremiah","Lamentations","Ezekiel","Daniel","Hosea","Joel","Amos","Obadiah","Jonah","Micah","Nahum","Habakkuk","Zephaniah","Haggai","Zechariah","Malachi",
  "Matthew","Mark","Luke","John","Acts","Romans","1 Corinthians","2 Corinthians","Galatians","Ephesians","Philippians","Colossians","1 Thessalonians","2 Thessalonians","1 Timothy","2 Timothy","Titus","Philemon","Hebrews","James","1 Peter","2 Peter","1 John","2 John","3 John","Jude","Revelation"
 ];
 const bxV159Canon=[...bxV159CanonPT,...bxV159CanonEN];
 const bxV159CanonIndex=book=>{
   const k=bxV159BookKey(book),i=bxV159Canon.findIndex(x=>bxV159BookKey(x)===k);
   return i<0?999:i%66;
 };
 const bxV159Sets={
   ot:[...bxV159CanonPT.slice(0,39),...bxV159CanonEN.slice(0,39)],
   nt:[...bxV159CanonPT.slice(39),...bxV159CanonEN.slice(39)],
   pentateuch:[...bxV159CanonPT.slice(0,5),...bxV159CanonEN.slice(0,5)],
   history:[
    "Josué","Juízes","Rute","1 Samuel","2 Samuel","1 Reis","2 Reis","1 Crônicas","2 Crônicas","Esdras","Neemias","Ester",
    "Joshua","Judges","Ruth","1 Samuel","2 Samuel","1 Kings","2 Kings","1 Chronicles","2 Chronicles","Ezra","Nehemiah","Esther"
   ],
   wisdom:["Jó","Salmos","Provérbios","Eclesiastes","Cantares","Job","Psalms","Proverbs","Ecclesiastes","Song of Solomon"],
   prophets:[
    "Isaías","Jeremias","Lamentações","Ezequiel","Daniel","Oseias","Joel","Amós","Obadias","Jonas","Miqueias","Naum","Habacuque","Sofonias","Ageu","Zacarias","Malaquias",
    "Isaiah","Jeremiah","Lamentations","Ezekiel","Daniel","Hosea","Joel","Amos","Obadiah","Jonah","Micah","Nahum","Habakkuk","Zephaniah","Haggai","Zechariah","Malachi"
   ],
   gospels:["Mateus","Marcos","Lucas","João","Matthew","Mark","Luke","John"],
   pauline:[
    "Romanos","1 Coríntios","2 Coríntios","Gálatas","Efésios","Filipenses","Colossenses","1 Tessalonicenses","2 Tessalonicenses","1 Timóteo","2 Timóteo","Tito","Filemom",
    "Romans","1 Corinthians","2 Corinthians","Galatians","Ephesians","Philippians","Colossians","1 Thessalonians","2 Thessalonians","1 Timothy","2 Timothy","Titus","Philemon"
   ],
   general:["Hebreus","Tiago","1 Pedro","2 Pedro","1 João","2 João","3 João","Judas","Hebrews","James","1 Peter","2 Peter","1 John","2 John","3 John","Jude"]
 };
 const bxV159SelectedBooks=()=>Store.get(BX_V159_SELECTED_BOOKS_KEY,[])||[];
 const bxV159SaveSelectedBooks=a=>{Store.set(BX_V159_SELECTED_BOOKS_KEY,[...new Set(a)]);bxV159UpdateBooksCount()};
 const bxV159UpdateBooksCount=()=>{const n=bxV159SelectedBooks().length,el=$("#bxV159BooksCount");if(el)el.textContent=String(n)};
 const bxV159ScopeBooks=scope=>{
   if(scope==="all")return null;
   if(scope==="book")return [selectedBookName()];
   if(scope==="chapter")return [selectedBookName()];
   if(scope==="selected")return bxV159SelectedBooks();
   return bxV159Sets[scope]||null;
 };
 const bxV159Matches=(v,q,mode)=>{
   const text=bxV159Norm(v.text),query=bxV159Norm(q),words=bxV159Words(q);
   if(!query)return false;
   if(mode==="phrase")return text.includes(query);
   if(mode==="all")return words.length>0&&words.every(w=>text.includes(w));
   if(mode==="any")return words.length>0&&words.some(w=>text.includes(w));
   if(mode==="word"){
     if(words.length!==1)return text.includes(query);
     return (` ${text.replace(/[^a-z0-9]+/g," ")} `).includes(` ${words[0]} `);
   }
   return text.includes(query);
 };
 const bxV159Score=(v,q,mode)=>{
   const text=bxV159Norm(v.text),query=bxV159Norm(q),words=bxV159Words(q);
   let s=0;
   if(text===query)s+=100;
   if(text.startsWith(query))s+=25;
   if(text.includes(query))s+=18;
   for(const w of words){
     const parts=text.split(w);s+=(parts.length-1)*4;
     if(text.startsWith(w))s+=2;
   }
   if(mode==="phrase")s+=10;
   return s;
 };
 const bxV159Highlight=(text,q,mode)=>{
   let html=escapeHtml(text),terms=mode==="phrase"?[String(q||"").trim()]:bxV159Words(q);
   terms=terms.filter(Boolean).sort((a,b)=>b.length-a.length).slice(0,8);
   for(const term of terms){
     const safe=term.replace(/[.*+?^${}()|[\]\\]/g,"\\$&");
     try{html=html.replace(new RegExp(`(${safe})`,"gi"),"<mark>$1</mark>")}catch(_){}
   }
   return html;
 };
 const bxV159GetCorpus=async(q,mode)=>{
   try{
     const local=await dbAll("verses");
     if(local?.length>5000)return {rows:local,source:"offline",limited:false};
   }catch(_){}
   const words=bxV159Words(q),queries=mode==="any"?words.slice(0,5):[String(q||"").trim()];
   const map=new Map;let limited=false;
   for(const term of queries){
     if(!term)continue;
     try{
       const translation=selectedTranslation();
       if(!Object.keys(bibleBookMap).length)await loadBookMap(translation);
       const r=await bxFetch(`${bibleApiBase()}/search?q=${encodeURIComponent(term)}&translation=${encodeURIComponent(translation)}&limit=1000`);
       if(!r.ok)continue;
       const j=await r.json(),items=(j.items||[]).map(x=>apiToVerse(x,bibleBookMap[x.book_code]));
       if(items.length>=1000)limited=true;
       for(const v of items)map.set(v.id||v.ref,v);
     }catch(_){}
   }
   return {rows:[...map.values()],source:"servidor",limited};
 };
 const bxV159FilterScope=(rows,scope)=>{
   const set=bxV159ScopeBooks(scope);
   const chapter=Number($("#bChapter")?.value)||1;
   const keys=set?new Set(set.map(bxV159BookKey)):null;
   return rows.filter(v=>{
     if(scope==="chapter"&&(bxV159BookKey(v.book)!==bxV159BookKey(selectedBookName())||Number(v.chapter)!==chapter))return false;
     if(!keys)return true;
     return keys.has(bxV159BookKey(v.book));
   });
 };
 const bxV159SortRows=(rows,q,mode,sort)=>{
   const a=[...rows];
   if(sort==="relevance")return a.sort((x,y)=>bxV159Score(y,q,mode)-bxV159Score(x,q,mode)||bxV159CanonIndex(x.book)-bxV159CanonIndex(y.book)||x.chapter-y.chapter||Number(x.verse)-Number(y.verse));
   if(sort==="book")return a.sort((x,y)=>String(x.book).localeCompare(String(y.book),"pt-BR")||x.chapter-y.chapter||Number(x.verse)-Number(y.verse));
   return a.sort((x,y)=>bxV159CanonIndex(x.book)-bxV159CanonIndex(y.book)||x.chapter-y.chapter||Number(x.verse)-Number(y.verse));
 };
 const bxV159OpenBooks=()=>{
   let m=document.getElementById("bxV159BooksModal");
   if(!m){m=document.createElement("div");m.id="bxV159BooksModal";m.className="bx-v159-modal";document.body.appendChild(m)}
   const books=[...($("#bBook")?.options||[])].map(o=>o.textContent.trim()).filter(x=>x&&!/carregando/i.test(x));
   const selected=new Set(bxV159SelectedBooks().map(bxV159BookKey));
   m.hidden=false;
   m.innerHTML=`<div class="bx-v159-modal-card">
     <header><div><small>PESQUISA PRO</small><h3>☑ Escolher livros</h3><p>Pesquise somente nos livros que você selecionar.</p></div><button type="button" data-v159-modal-close>×</button></header>
     <div class="bx-v159-modal-tools">
       <button type="button" data-v159-preset="all">Todos</button>
       <button type="button" data-v159-preset="ot">Antigo Testamento</button>
       <button type="button" data-v159-preset="nt">Novo Testamento</button>
       <button type="button" data-v159-preset="none">Limpar</button>
     </div>
     <div class="bx-v159-book-grid">${books.map((b,i)=>`<label><input type="checkbox" value="${escapeHtml(b)}" ${selected.has(bxV159BookKey(b))?"checked":""}><span>${i+1}</span><b>${escapeHtml(b)}</b></label>`).join("")}</div>
     <footer><span data-v159-modal-count>0 livros</span><button type="button" class="btn secondary" data-v159-modal-cancel>Cancelar</button><button type="button" class="btn primary" data-v159-modal-save>Aplicar seleção</button></footer>
   </div>`;
   const checks=[...m.querySelectorAll('input[type="checkbox"]')];
   const refresh=()=>{const n=checks.filter(c=>c.checked).length;m.querySelector("[data-v159-modal-count]").textContent=`${n} livro${n===1?"":"s"}`};
   const close=()=>m.hidden=true;
   m.querySelector("[data-v159-modal-close]").onclick=close;
   m.querySelector("[data-v159-modal-cancel]").onclick=close;
   m.querySelectorAll("[data-v159-preset]").forEach(b=>b.onclick=()=>{
     const p=b.dataset.v159Preset,keys=p==="all"?null:new Set((bxV159Sets[p]||[]).map(bxV159BookKey));
     checks.forEach(c=>c.checked=p==="all"?true:p==="none"?false:keys.has(bxV159BookKey(c.value)));refresh();
   });
   m.querySelector("[data-v159-modal-save]").onclick=()=>{
     bxV159SaveSelectedBooks(checks.filter(c=>c.checked).map(c=>c.value));
     if($("#bxV159Scope"))$("#bxV159Scope").value="selected";
     close();bxV159Toast(`Seleção aplicada: ${checks.filter(c=>c.checked).length} livros`);
   };
   m.onclick=e=>{if(e.target===m)close()};refresh();
 };
 const bxV159Toast=msg=>bxV157Toast?bxV157Toast(msg):void 0;
 const bxV159OpenRef=async(ref,chapterOnly=false)=>{
   try{
     const target=chapterOnly?String(ref).replace(/:\d+(?:-\d+)?$/,""):ref;
     const rr=await smartBibleRef(target);
     if(!rr.length)return;
     current=rr;
     if($("#bRef"))$("#bRef").value=target;
     if($("#bVerse"))$("#bVerse").value=chapterOnly?"":String(ref).split(":")[1]||"";
     await syncBookChapterSelectors(rr[0].book,rr[0].chapter);
     renderBibleVerses(rr);
     $("#bOut")?.scrollIntoView({behavior:"smooth",block:"start"});
   }catch(e){bxV159Toast("Não foi possível abrir a referência")}
 };
 const bxV159SelectionToggleResult=v=>{
   const on=bxSelectionToggle(v);bxV159Toast(on?`${v.ref} selecionado`:`${v.ref} removido`);return on;
 };
 const bxV159RenderResults=(rows,meta)=>{
   const out=$("#bOut");if(!out)return;
   window.__bxV159Results=rows;
   const byBook=new Map;
   for(const v of rows)byBook.set(v.book,(byBook.get(v.book)||0)+1);
   const top=[...byBook.entries()].sort((a,b)=>b[1]-a[1]).slice(0,8);
   const selected=bxSelectionGet();
   out.innerHTML=`<section class="bx-v159-results">
     <header class="bx-v159-results-head">
       <div>
         <span class="bx-v159-eyebrow">🔎 PESQUISA PRO</span>
         <h3>${escapeHtml(meta.q)}</h3>
         <p>${rows.length.toLocaleString("pt-BR")} versículo(s) • ${byBook.size} livro(s) • ${meta.source==="offline"?"⚡ índice local/offline":"☁ servidor"}${meta.limited?" • busca muito ampla pode estar limitada":""}</p>
       </div>
       <div class="bx-v159-results-actions">
         <button type="button" data-v159-back-reading>← Voltar à leitura</button>
         <button type="button" data-v159-select-all>☑ Selecionar resultados</button>
         <button type="button" data-v159-copy-results>⧉ Copiar</button>
         <button type="button" data-v159-studio-results>⚡ Studio X</button>
       </div>
     </header>
     ${top.length?`<div class="bx-v159-stats"><span>Mais ocorrências:</span>${top.map(([book,n])=>`<button type="button" data-v159-filter-book="${escapeHtml(book)}">${escapeHtml(book)} <b>${n}</b></button>`).join("")}<button type="button" data-v159-filter-book="">Todos</button></div>`:""}
     <div class="bx-v159-result-list" data-v159-result-list>
       ${rows.length?rows.map((v,i)=>`<article class="bx-v159-result" data-v159-result data-v159-result-book="${escapeHtml(v.book)}">
          <button type="button" class="bx-v159-result-select ${selected.some(x=>x.ref===v.ref)?"selected":""}" data-v159-result-select="${escapeHtml(v.ref)}">${selected.some(x=>x.ref===v.ref)?"✓":"○"}</button>
          <button type="button" class="bx-v159-ref" data-v159-open="${escapeHtml(v.ref)}">${escapeHtml(v.ref)}</button>
          <p>${bxV159Highlight(v.text,meta.q,meta.mode)}</p>
          <div>
            <button type="button" data-v159-open="${escapeHtml(v.ref)}">Abrir verso</button>
            <button type="button" data-v159-chapter="${escapeHtml(v.ref)}">📖 Capítulo</button>
            <button type="button" data-v159-copy-one="${i}">⧉ Copiar</button>
          </div>
        </article>`).join(""):`<div class="bx-v159-empty"><span>🔎</span><b>Nenhuma ocorrência encontrada</b><p>Tente “Qualquer palavra”, outro escopo ou uma expressão menor.</p></div>`}
     </div>
   </section>`;
   out.querySelectorAll("[data-v159-open]").forEach(b=>b.onclick=()=>bxV159OpenRef(b.dataset.v159Open,false));
   out.querySelectorAll("[data-v159-chapter]").forEach(b=>b.onclick=()=>bxV159OpenRef(b.dataset.v159Chapter,true));
   out.querySelectorAll("[data-v159-copy-one]").forEach(b=>b.onclick=async()=>{const v=rows[Number(b.dataset.v159CopyOne)];if(v){await bxCopyText(`${v.ref} — ${v.text}`);bxV159Toast(`Copiado: ${v.ref}`)}});
   out.querySelectorAll("[data-v159-result-select]").forEach(b=>b.onclick=()=>{
     const v=rows.find(x=>x.ref===b.dataset.v159ResultSelect);if(!v)return;
     const on=bxV159SelectionToggleResult(v);b.classList.toggle("selected",on);b.textContent=on?"✓":"○";
   });
   out.querySelector("[data-v159-back-reading]")?.addEventListener("click",()=>{
     const rr=window.__bxV159LastReading;
     if(rr?.length){current=rr;renderBibleVerses(rr)}
     else bxV157NavGo(-1);
   });
   out.querySelector("[data-v159-select-all]")?.addEventListener("click",()=>{
     const currentSel=bxSelectionGet(),map=new Map(currentSel.map(x=>[x.ref,x]));
     rows.forEach(v=>map.set(v.ref,v));bxSelectionSave([...map.values()].slice(-500));
     bxV159Toast(`${Math.min(rows.length,500)} resultados adicionados à seleção`);
     bxV159RenderResults(rows,meta);
   });
   out.querySelector("[data-v159-copy-results]")?.addEventListener("click",async()=>{
     const take=rows.slice(0,250);await bxCopyText(formatVerses(take));bxV159Toast(`${take.length} resultados copiados`);
   });
   out.querySelector("[data-v159-studio-results]")?.addEventListener("click",()=>{
     const s=bxSelectionGet().filter(x=>rows.some(v=>v.ref===x.ref));
     current=(s.length?s:rows.slice(0,30));sendStudio();
   });
   out.querySelectorAll("[data-v159-filter-book]").forEach(b=>b.onclick=()=>{
     const book=b.dataset.v159FilterBook;
     out.querySelectorAll("[data-v159-result]").forEach(a=>a.hidden=!!book&&a.dataset.v159ResultBook!==book);
     out.querySelectorAll("[data-v159-filter-book]").forEach(x=>x.classList.toggle("active",x===b));
   });
 };
 const bxV159SyncPrefs=()=>{
   const p=Store.get(BX_V159_PREFS_KEY,{});
   if($("#bxV159Scope")&&p.scope)$("#bxV159Scope").value=p.scope;
   if($("#bxV159Mode")&&p.mode)$("#bxV159Mode").value=p.mode;
   if($("#bxV159Sort")&&p.sort)$("#bxV159Sort").value=p.sort;
   bxV159UpdateBooksCount();
 };
 const bxV159SavePrefs=()=>Store.set(BX_V159_PREFS_KEY,{
   scope:$("#bxV159Scope")?.value||"all",
   mode:$("#bxV159Mode")?.value||"phrase",
   sort:$("#bxV159Sort")?.value||"canon"
 });
 const bxV159RunSearch=async()=>{
   const q=String($("#bSearch")?.value||"").trim();if(!q)return;
   bxSearchHistoryPush(q);bxV159SavePrefs();
   const scope=$("#bxV159Scope")?.value||"all",mode=$("#bxV159Mode")?.value||"phrase",sort=$("#bxV159Sort")?.value||"canon";
   if(scope==="selected"&&!bxV159SelectedBooks().length){bxV159OpenBooks();bxV159Toast("Escolha pelo menos um livro");return}
   if(current?.length&&!window.__bxV159LastReading)window.__bxV159LastReading=current.slice();
   const out=$("#bOut");out.innerHTML='<div class="bx-v159-searching"><span>🔎</span><b>Pesquisando na Bíblia X...</b><small>Aplicando escopo, correspondência e ordem bíblica.</small></div>';
   try{
     const corpus=await bxV159GetCorpus(q,mode);
     let rows=bxV159FilterScope(corpus.rows,scope).filter(v=>bxV159Matches(v,q,mode));
     rows=bxV159SortRows(rows,q,mode,sort);
     current=rows;
     bxV159RenderResults(rows,{q,scope,mode,sort,source:corpus.source,limited:corpus.limited});
   }catch(e){
     out.innerHTML=`<div class="bx-v159-empty"><span>⚠</span><b>Pesquisa indisponível</b><p>${escapeHtml(e.message||String(e))}</p></div>`;
   }
 };

 $("#bFind").onclick=async()=>{
   const q=String($("#bSearch")?.value||"").trim();if(!q)return;
   if(/^[GH]\d{1,5}$/i.test(q)){
     bxSearchHistoryPush(q);const out=$("#bOut");out.textContent="Pesquisando Strong...";
     try{
       const r=await bxFetch(`/api/bible/lexicon/search?q=${encodeURIComponent(q.toUpperCase())}&limit=20`),j=await r.json(),items=j.items||[];
       out.innerHTML=`<div class="bx-search-special"><h3>🔤 Pesquisa Strong • ${escapeHtml(q.toUpperCase())}</h3>${items.length?items.map(x=>`<article><b>${escapeHtml(x.strong)}</b><span class="bx-original-script">${escapeHtml(x.lemma||"")}</span><small>${escapeHtml(x.transliteration||"")} • ${escapeHtml(x.language==="Hebrew"?"Hebraico":"Grego")}</small><p>${escapeHtml((x.definition||"").slice(0,360))}</p></article>`).join(""):"<p>Nenhuma entrada localizada.</p>"}</div>`;
     }catch(e){out.textContent=`Pesquisa indisponível. ${e.message||""}`}
     return;
   }
   await bxV159RunSearch();
 };
  $("#bSearch")?.addEventListener("keydown",e=>{if(e.key==="Enter"){e.preventDefault();$("#bFind")?.click()}});

 $("#bxV159Books")?.addEventListener("click",bxV159OpenBooks);
 $("#bxV159Clear")?.addEventListener("click",()=>{
   if($("#bSearch"))$("#bSearch").value="";
   if($("#bxV159Scope"))$("#bxV159Scope").value="all";
   if($("#bxV159Mode"))$("#bxV159Mode").value="phrase";
   if($("#bxV159Sort"))$("#bxV159Sort").value="canon";
   bxV159SavePrefs();$("#bSearch")?.focus();
 });
 document.querySelectorAll("[data-v159-quick-scope]").forEach(b=>b.addEventListener("click",()=>{
   if($("#bxV159Scope"))$("#bxV159Scope").value=b.dataset.v159QuickScope;
   document.querySelectorAll("[data-v159-quick-scope]").forEach(x=>x.classList.toggle("active",x===b));
   bxV159SavePrefs();
   if(String($("#bSearch")?.value||"").trim())bxV159RunSearch();
   else $("#bSearch")?.focus();
 }));
 ["bxV159Scope","bxV159Mode","bxV159Sort"].forEach(id=>$("#"+id)?.addEventListener("change",bxV159SavePrefs));
 bxV159SyncPrefs();

 $("#bSend").onclick=sendStudio;
 $("#bConcordance").onclick=async()=>{
   const q=String($("#bSearch")?.value||"").trim();if(!q)return;
   const btn=document.querySelector('[data-bible-section="concordance"]');
   if(btn){
     btn.click();
     setTimeout(()=>{if($("#bxConcQuery"))$("#bxConcQuery").value=q;$("#bxConcFind")?.click()},90);
     return;
   }
   try{current=await smartBibleSearch(q);renderBibleVerses(current)}catch(e){$("#bOut").textContent=`Falha na concordância: ${e.message||""}`}
 };
 $("#bxVcSaveNote")?.addEventListener("click",()=>{if(!bxActiveVerse)return;const ok=bxSaveLocal("note",bxActiveVerse.ref,$("#bxVcNote").value);$("#bxVcStatus").textContent=ok?"✓ Nota salva localmente":"Não foi possível salvar a nota"});
 $("#bxVcFavorite")?.addEventListener("click",()=>{if(!bxActiveVerse)return;const on=bxLoadLocal("fav",bxActiveVerse.ref,"0")!=="1";bxSaveLocal("fav",bxActiveVerse.ref,on?"1":"0");$("#bxVcFavorite").textContent=on?"★ Favoritado":"☆ Favoritar";$("#bxVcStatus").textContent=on?"✓ Versículo adicionado aos favoritos":"Favorito removido"});
 $("#bxVcCopy")?.addEventListener("click",async()=>{if(!bxActiveVerse)return;const txt=`${bxActiveVerse.ref} — ${bxActiveVerse.text}`;try{await navigator.clipboard.writeText(txt);$("#bxVcStatus").textContent="✓ Versículo copiado"}catch(_){$("#bxVcStatus").textContent="Copie manualmente: "+txt}});
 $("#bxVcStudio")?.addEventListener("click",()=>{if(!bxActiveVerse)return;if($("#bRef"))$("#bRef").value=bxActiveVerse.ref;current=[bxActiveVerse];sendStudio()});
 $("#bxDataMode")?.addEventListener("click",()=>{
   const online=navigator.onLine&&bxNetState.online!==false;
   alert(online
     ?"Modo atual: ONLINE PRIMEIRO.\nA Bíblia X usa o servidor automaticamente e não exige downloads manuais."
     :"Sem conexão no momento. A Bíblia X tenta usar apenas os recursos locais já disponíveis.");
 });
 $("#bxOfflineManage")?.addEventListener("click",()=>{
   let modal=document.getElementById("bxOfflineModal");
   if(!modal){modal=document.createElement("div");modal.id="bxOfflineModal";modal.className="bx-offline-modal";document.body.appendChild(modal)}
   modal.innerHTML=bxOfflinePanel();modal.hidden=false;
   modal.querySelector("#bxOfflineClose")?.addEventListener("click",()=>modal.hidden=true);
   modal.querySelectorAll("[data-offline-module]").forEach(btn=>btn.onclick=()=>{
      const k=btn.dataset.offlineModule,m=bxOfflineManifest();m[k]=!m[k];bxSaveOfflineManifest(m);
      btn.classList.toggle("downloaded",m[k]);btn.querySelector("small").textContent=m[k]?"✅ Marcado para offline":"⬇ Disponível para offline";
   });
 });
 bxUpdateNetBadge();
 $("#bxVcClose")?.addEventListener("click",()=>{$("#bxVerseContext").hidden=true});
 document.addEventListener("click",e=>{
   const b=e.target.closest?.("[data-cross-ref],[data-context-ref],[data-comment-ref]");
   if(!b)return;
   if(e.altKey||e.ctrlKey||e.metaKey){
     e.preventDefault();e.stopPropagation();
     const ref=b.dataset.crossRef||b.dataset.contextRef||b.dataset.commentRef;
     if(ref)bxPreviewReference(ref);
   }
 });
 setTimeout(async()=>{const s=bxGetSession();if(s&&String($("#bRef")?.value||"")==="João 3:16"){const ok=await bxRestoreSession();if(ok)return}$("#bOpen")?.click()},80);
 const crossSource=$("#bxCrossSource"),crossTarget=$("#bxCrossTarget"),crossList=$("#bxCrossList"),crossPreview=$("#bxCrossSourcePreview");
 const renderCross=async(source)=>{if(!crossList)return;source=normalizeBibleRef(source||crossSource?.value);if(crossSource&&source)crossSource.value=source;const rows=source?await crossBySource(source):[];const count=$("#bxCrossCount");if(count)count.textContent=`${rows.length} referência${rows.length===1?'':'s'} relacionada${rows.length===1?'':'s'}`;if(!rows.length){crossList.innerHTML='<div class="bx-cross-empty">Nenhuma referência relacionada ainda.</div>';return}crossList.innerHTML=rows.map(x=>`<article class="bx-cross-item"><button class="bx-cross-open" data-cross-open="${escapeHtml(x.target)}"><span>↗</span><div><strong>${escapeHtml(x.target)}</strong><small>Abrir passagem em popup</small></div></button><button class="bx-cross-remove" data-cross-remove="${escapeHtml(x.id)}" title="Remover">×</button></article>`).join('');crossList.querySelectorAll('[data-cross-open]').forEach(b=>b.onclick=async()=>{const ref=b.dataset.crossOpen,a=await smartBibleRef(ref);const old=document.getElementById('bxVersePopup');if(old)old.remove();const box=document.createElement('div');box.id='bxVersePopup';box.className='bx-verse-popup';box.innerHTML=`<div class="bx-verse-dialog"><div class="bx-verse-head"><div><span>🔗 Referência</span><h4>${escapeHtml(ref)}</h4></div><button data-close>×</button></div><div class="bx-verse-text">${a.length?escapeHtml(formatVerses(a)).replace(/\n/g,'<br>'):'Texto não encontrado na Bíblia local. Importe uma Bíblia na aba principal.'}</div><div class="row"><button class="btn primary" data-open-main>Abrir na Bíblia</button><button class="btn secondary" data-close2>Fechar</button></div></div>`;document.body.appendChild(box);box.querySelector('[data-close]').onclick=()=>box.remove();box.querySelector('[data-close2]').onclick=()=>box.remove();box.addEventListener('click',e=>{if(e.target===box)box.remove()});box.querySelector('[data-open-main]').onclick=async()=>{activate('reader');$("#bRef").value=ref;current=await smartBibleRef(ref);$("#bOut").textContent=formatVerses(current)||'Passagem não encontrada na Bíblia local.';box.remove()}});crossList.querySelectorAll('[data-cross-remove]').forEach(b=>b.onclick=async()=>{await crossDelete(b.dataset.crossRemove);await renderCross(source)});};
 if($("#bxCrossLoad"))$("#bxCrossLoad").onclick=async()=>{const source=normalizeBibleRef(crossSource.value);if(!source)return;const a=await smartBibleRef(source);crossPreview.textContent=a.length?formatVerses(a):`Passagem: ${source} — texto ainda não disponível na Bíblia local.`;await renderCross(source)};
 if(crossSource)crossSource.addEventListener('keydown',e=>{if(e.key==='Enter')$("#bxCrossLoad").click()});
 if($("#bxCrossAdd"))$("#bxCrossAdd").onclick=async()=>{const source=normalizeBibleRef(crossSource.value),target=normalizeBibleRef(crossTarget.value);if(!source||!target)return alert('Informe a passagem principal e a referência relacionada.');await crossPut(source,target);crossTarget.value='';await renderCross(source)};
 if(crossTarget)crossTarget.addEventListener('keydown',e=>{if(e.key==='Enter')$("#bxCrossAdd").click()});
 if($("#bxCrossSeed"))$("#bxCrossSeed").onclick=async()=>{const source=normalizeBibleRef(crossSource.value)||'João 3:16';crossSource.value=source;const examples={'joão 3:16':['Romanos 5:8','1 João 4:9','Romanos 8:32'],'romanos 8:28':['Gênesis 50:20','Efésios 1:11','Romanos 8:29'],'isaías 6:8':['Mateus 9:37-38','Atos 13:2-3','Romanos 10:14-15']};const list=examples[source.toLowerCase()]||['Salmos 119:105','2 Timóteo 3:16'];for(const target of list)await crossPut(source,target);await renderCross(source)};
 if($("#bxCrossExport"))$("#bxCrossExport").onclick=async()=>{const all=await crossAll(),group={};for(const x of all)(group[x.source]||(group[x.source]=[])).push(x.target);const out=Object.entries(group).map(([source,targets])=>({source,targets:[...new Set(targets)]}));download('biblia-x-referencias-cruzadas.json',JSON.stringify(out,null,2),'application/json')};
 if($("#bxCrossImport"))$("#bxCrossImport").onclick=async()=>{const f=$("#bxCrossFile")?.files?.[0];if(!f)return alert('Escolha um JSON.');try{const data=JSON.parse(await f.text());for(const row of (Array.isArray(data)?data:[])){for(const target of (row.targets||row.referencias||[]))await crossPut(row.source||row.origem,target)}alert('Referências importadas com sucesso.');await renderCross(crossSource.value)}catch(e){alert('Falha ao importar: '+e.message)}};
 document.querySelectorAll('[data-bible-jump="cross"],[data-bible-section="cross"]').forEach(btn=>btn.addEventListener('click',()=>{const ref=current.length?`${current[0].book} ${current[0].chapter}:${current[0].verse}`:normalizeBibleRef($("#bRef")?.value);if(ref&&crossSource&&!crossSource.value)crossSource.value=ref;setTimeout(()=>renderCross(crossSource?.value),0)}));
 let strongLang='all';
 const strongDetail=(row)=>{const box=$("#bxStrongDetail");if(!box||!row)return;const flag=row.language==='H'?'🇮🇱':'🇬🇷';box.innerHTML=`<div class="bx-strong-detail-head"><div><span>${flag} ${row.language==='H'?'HEBRAICO':'GREGO'}</span><h4>${escapeHtml(row.number)}</h4></div><button class="btn secondary" data-strong-copy>Copiar</button></div><div class="bx-strong-lemma">${escapeHtml(row.lemma||'—')}</div><dl class="bx-strong-dl"><div><dt>Transliteração</dt><dd>${escapeHtml(row.transliteration||'—')}</dd></div><div><dt>Pronúncia</dt><dd>${escapeHtml(row.pronunciation||'—')}</dd></div><div><dt>Morfologia</dt><dd>${escapeHtml(row.morphology||'—')}</dd></div><div><dt>Raiz / derivação</dt><dd>${escapeHtml(row.root||'—')}</dd></div></dl><section class="bx-strong-definition"><span>Definição</span><p>${escapeHtml(row.definition||'Sem definição no banco local.')}</p></section>${row.usage?`<section class="bx-strong-definition"><span>Uso</span><p>${escapeHtml(row.usage)}</p></section>`:''}<section class="bx-strong-refs"><div><span>Ocorrências / referências</span><b>${(row.refs||[]).length}</b></div>${(row.refs||[]).length?`<div class="bx-strong-refchips">${row.refs.map(r=>`<button data-strong-ref="${escapeHtml(r)}">${escapeHtml(r)}</button>`).join('')}</div>`:'<p>Nenhuma referência cadastrada.</p>'}</section>`;box.querySelector('[data-strong-copy]')?.addEventListener('click',()=>navigator.clipboard?.writeText(`${row.number} ${row.lemma} (${row.transliteration}) — ${row.definition}`));box.querySelectorAll('[data-strong-ref]').forEach(b=>b.onclick=async()=>{activate('reader');$("#bRef").value=b.dataset.strongRef;current=await smartBibleRef(b.dataset.strongRef);$("#bOut").textContent=formatVerses(current)||'Passagem não encontrada na Bíblia local.'})};
 const renderStrong=async(q='')=>{const list=$("#bxStrongList");if(!list)return;let rows=await strongAll();const term=String(q||$("#bxStrongQuery")?.value||'').trim().toLowerCase();if(strongLang!=='all')rows=rows.filter(x=>x.language===strongLang);if(term)rows=rows.filter(x=>[x.number,x.lemma,x.transliteration,x.definition,x.root,x.usage].some(v=>String(v||'').toLowerCase().includes(term)));rows.sort((a,b)=>a.number.localeCompare(b.number,undefined,{numeric:true}));const count=$("#bxStrongCount");if(count)count.textContent=`${rows.length} entrada${rows.length===1?'':'s'}`;if(!rows.length){list.innerHTML='<div class="bx-strong-empty">Nenhuma entrada encontrada no banco Strong local.</div>';return}list.innerHTML=rows.slice(0,500).map(x=>`<button class="bx-strong-item" data-strong-number="${escapeHtml(x.number)}"><span>${x.language==='H'?'🇮🇱':'🇬🇷'}</span><div><strong>${escapeHtml(x.number)} • ${escapeHtml(x.lemma||'—')}</strong><small>${escapeHtml(x.transliteration||x.definition||'')}</small></div><b>›</b></button>`).join('');list.querySelectorAll('[data-strong-number]').forEach(b=>b.onclick=()=>{const r=rows.find(x=>x.number===b.dataset.strongNumber);list.querySelectorAll('.bx-strong-item').forEach(x=>x.classList.toggle('active',x===b));strongDetail(r)});if(rows.length===1)list.querySelector('[data-strong-number]')?.click()};
 $("#bxStrongFind")?.addEventListener('click',()=>renderStrong($("#bxStrongQuery").value));$("#bxStrongQuery")?.addEventListener('keydown',e=>{if(e.key==='Enter')renderStrong(e.target.value)});document.querySelectorAll('[data-strong-lang]').forEach(b=>b.onclick=()=>{strongLang=b.dataset.strongLang;document.querySelectorAll('[data-strong-lang]').forEach(x=>x.classList.toggle('active',x===b));renderStrong()});
 $("#bxStrongExample")?.addEventListener('click',async()=>{const examples=[{number:'G26',language:'G',lemma:'ἀγάπη',transliteration:'agapē',pronunciation:'ag-ah-pay',morphology:'substantivo feminino',definition:'amor, benevolência, afeição; termo usado no Novo Testamento em vários contextos de amor.',root:'G25',refs:['João 13:35','1 Coríntios 13:1-13','1 João 4:8']},{number:'G4102',language:'G',lemma:'πίστις',transliteration:'pistis',pronunciation:'pis-tis',morphology:'substantivo feminino',definition:'fé, confiança, fidelidade; convicção ou confiança.',root:'G3982',refs:['Romanos 1:17','Hebreus 11:1']},{number:'H430',language:'H',lemma:'אֱלֹהִים',transliteration:'elohim',pronunciation:'el-o-heem',morphology:'substantivo masculino plural',definition:'Deus, deuses; forma usada amplamente no texto hebraico, dependendo do contexto.',root:'H433',refs:['Gênesis 1:1','Salmos 46:1']},{number:'H2617',language:'H',lemma:'חֶסֶד',transliteration:'chesed',pronunciation:'kheh-sed',morphology:'substantivo masculino',definition:'bondade, misericórdia, amor leal, fidelidade de aliança.',root:'H2616',refs:['Salmos 136:1','Miquéias 6:8']}];await strongPutMany(examples);await renderStrong();});
 $("#bxStrongImport")?.addEventListener('click',async()=>{const f=$("#bxStrongFile")?.files?.[0];if(!f)return alert('Escolha um JSON.');try{const data=JSON.parse(await f.text()),rows=Array.isArray(data)?data:(data.entries||data.strong||[]);const n=await strongPutMany(rows);alert(`${n} entradas Strong importadas.`);await renderStrong()}catch(e){alert('Falha ao importar Strong: '+e.message)}});
 $("#bxStrongExport")?.addEventListener('click',async()=>{const all=await strongAll();download('biblia-x-strong.json',JSON.stringify(all,null,2),'application/json')});$("#bxStrongClear")?.addEventListener('click',async()=>{if(!confirm('Limpar todo o banco Strong local?'))return;await strongClear();const detail=$("#bxStrongDetail");if(detail)detail.innerHTML='<div class="bx-strong-detail-empty"><span>🇬🇷🇮🇱</span><h4>Detalhes Strong</h4><p>Banco Strong local limpo.</p></div>';await renderStrong()});
 document.querySelectorAll('[data-bible-jump="strong"],[data-bible-section="strong"]').forEach(btn=>btn.addEventListener('click',()=>setTimeout(()=>renderStrong(),0)));
 let lexLang='all';
 const lexDetail=(row)=>{const box=$("#bxLexDetail");if(!box||!row)return;box.innerHTML=`<div class="bx-lex-detail-head"><div><span>${row.language==='H'?'🇮🇱 HEBRAICO':'🇬🇷 GREGO'}</span><h4>${escapeHtml(row.lemma||row.id)}</h4><small>${escapeHtml(row.transliteration||'')}</small></div><button class="btn secondary" data-lex-copy>Copiar</button></div>${row.strong?`<button class="bx-lex-strong-link" data-lex-strong="${escapeHtml(row.strong)}">Strong ${escapeHtml(row.strong)} →</button>`:''}<dl class="bx-lex-dl"><div><dt>Glosa</dt><dd>${escapeHtml(row.gloss||'—')}</dd></div><div><dt>Campo semântico</dt><dd>${escapeHtml(row.semanticField||'—')}</dd></div><div><dt>Raiz</dt><dd>${escapeHtml(row.root||'—')}</dd></div><div><dt>ID</dt><dd>${escapeHtml(row.id)}</dd></div></dl><section class="bx-lex-block"><span>Sentidos</span><p>${escapeHtml((row.senses||[]).join(' • ')||'—')}</p></section><section class="bx-lex-block"><span>Relacionadas</span><p>${escapeHtml((row.related||[]).join(' • ')||'—')}</p></section><section class="bx-lex-block"><span>Referências</span><div class="bx-lex-chips">${(row.refs||[]).map(x=>`<button data-lex-ref="${escapeHtml(x)}">${escapeHtml(x)}</button>`).join('')||'—'}</div></section>${row.notes?`<section class="bx-lex-block"><span>Notas / uso</span><p>${escapeHtml(row.notes)}</p></section>`:''}`;box.querySelector('[data-lex-copy]')?.addEventListener('click',()=>navigator.clipboard?.writeText(`${row.lemma} (${row.transliteration}) ${row.strong||''} — ${row.gloss}`));box.querySelector('[data-lex-strong]')?.addEventListener('click',()=>{activate('strong');const q=$("#bxStrongQuery");if(q)q.value=row.strong;setTimeout(()=>renderStrong(row.strong),0)});box.querySelectorAll('[data-lex-ref]').forEach(b=>b.onclick=async()=>{activate('reader');$("#bRef").value=b.dataset.lexRef;current=await bibleRef(b.dataset.lexRef);$("#bOut").textContent=formatVerses(current)||'Passagem não encontrada na Bíblia local.'})};
 const renderLexicon=async(q='')=>{const list=$("#bxLexList");if(!list)return;let rows=await lexiconAll();const term=String(q||$("#bxLexQuery")?.value||'').trim().toLowerCase();if(lexLang!=='all')rows=rows.filter(x=>x.language===lexLang);if(term)rows=rows.filter(x=>[x.id,x.lemma,x.transliteration,x.strong,x.gloss,x.semanticField,x.root,x.notes,...(x.senses||[]),...(x.related||[])].some(v=>String(v||'').toLowerCase().includes(term)));rows.sort((a,b)=>(a.lemma||a.id).localeCompare((b.lemma||b.id),undefined,{sensitivity:'base'}));const c=$("#bxLexCount");if(c)c.textContent=`${rows.length} entrada${rows.length===1?'':'s'}`;if(!rows.length){list.innerHTML='<div class="bx-lex-empty">Nenhuma entrada encontrada no léxico local.</div>';return}list.innerHTML=rows.slice(0,600).map(x=>`<button class="bx-lex-item" data-lex-id="${escapeHtml(x.id)}"><span>${x.language==='H'?'א':'α'}</span><div><strong>${escapeHtml(x.lemma||x.id)}</strong><small>${escapeHtml([x.transliteration,x.strong,x.gloss].filter(Boolean).join(' • '))}</small></div><b>›</b></button>`).join('');list.querySelectorAll('[data-lex-id]').forEach(b=>b.onclick=()=>{const r=rows.find(x=>x.id===b.dataset.lexId);list.querySelectorAll('.bx-lex-item').forEach(x=>x.classList.toggle('active',x===b));lexDetail(r)});if(rows.length===1)list.querySelector('[data-lex-id]')?.click()};
 $("#bxLexFind")?.addEventListener('click',()=>renderLexicon($("#bxLexQuery").value));$("#bxLexQuery")?.addEventListener('keydown',e=>{if(e.key==='Enter')renderLexicon(e.target.value)});document.querySelectorAll('[data-lex-lang]').forEach(b=>b.onclick=()=>{lexLang=b.dataset.lexLang;document.querySelectorAll('[data-lex-lang]').forEach(x=>x.classList.toggle('active',x===b));renderLexicon()});
 $("#bxLexExample")?.addEventListener('click',async()=>{await lexiconPutMany([{id:'G26',language:'G',lemma:'ἀγάπη',transliteration:'agapē',strong:'G26',gloss:'amor',senses:['amor','benevolência','afeição'],semanticField:'Relacionamentos e virtudes',root:'G25',related:['G25','G5368'],refs:['João 13:35','1 Coríntios 13:1-13','1 João 4:8']},{id:'G4102',language:'G',lemma:'πίστις',transliteration:'pistis',strong:'G4102',gloss:'fé / confiança',senses:['fé','confiança','fidelidade'],semanticField:'Fé e compromisso',root:'G3982',refs:['Romanos 1:17','Hebreus 11:1']},{id:'H2617',language:'H',lemma:'חֶסֶד',transliteration:'chesed',strong:'H2617',gloss:'amor leal / misericórdia',senses:['bondade','misericórdia','lealdade'],semanticField:'Aliança e relacionamento',root:'H2616',refs:['Salmos 136:1','Miquéias 6:8']},{id:'H7965',language:'H',lemma:'שָׁלוֹם',transliteration:'shalom',strong:'H7965',gloss:'paz / integridade',senses:['paz','bem-estar','inteireza'],semanticField:'Bem-estar e restauração',refs:['Números 6:26','Isaías 9:6']}]);await renderLexicon()});
 $("#bxLexImport")?.addEventListener('click',async()=>{const f=$("#bxLexFile")?.files?.[0];if(!f)return alert('Escolha um JSON.');try{const data=JSON.parse(await f.text()),rows=Array.isArray(data)?data:(data.entries||data.lexicon||data.lexico||[]);const n=await lexiconPutMany(rows);alert(`${n} entradas do léxico importadas.`);await renderLexicon()}catch(e){alert('Falha ao importar léxico: '+e.message)}});$("#bxLexExport")?.addEventListener('click',async()=>download('biblia-x-lexico.json',JSON.stringify(await lexiconAll(),null,2),'application/json'));$("#bxLexClear")?.addEventListener('click',async()=>{if(!confirm('Limpar todo o léxico local?'))return;await lexiconClear();await renderLexicon();const d=$("#bxLexDetail");if(d)d.innerHTML='<div class="bx-lex-detail-empty"><span>📚</span><h4>Detalhes do Léxico</h4><p>Léxico local limpo.</p></div>'});
 document.querySelectorAll('[data-bible-jump="lexicon"],[data-bible-section="lexicon"]').forEach(btn=>btn.addEventListener('click',()=>setTimeout(()=>renderLexicon(),0)));
 let contextType='all';
 const contextTypeLabel=t=>({historical:'Histórico',cultural:'Cultural',literary:'Literário',geographic:'Geográfico'}[t]||t);
 const contextDetail=(row)=>{const box=$("#bxContextDetail");if(!box||!row)return;const blocks=[['🏺','Contexto histórico',row.historical],['🏛','Contexto cultural',row.cultural],['📜','Contexto literário',row.literary],['🗺','Contexto geográfico',row.geographic]].filter(x=>x[2]);box.innerHTML=`<div class="bx-context-detail-head"><div><span>${escapeHtml(row.reference||row.book||'CONTEXTO')}</span><h4>${escapeHtml(row.title)}</h4><small>${escapeHtml([row.period,row.book].filter(Boolean).join(' • '))}</small></div><button class="btn secondary" data-context-copy>Copiar</button></div><div class="bx-context-facts">${row.author?`<div><span>Autor</span><b>${escapeHtml(row.author)}</b></div>`:''}${row.audience?`<div><span>Destinatários</span><b>${escapeHtml(row.audience)}</b></div>`:''}${row.purpose?`<div class="wide"><span>Propósito</span><b>${escapeHtml(row.purpose)}</b></div>`:''}</div><div class="bx-context-blocks">${blocks.map(([ico,t,txt])=>`<section><h5>${ico} ${t}</h5><p>${escapeHtml(txt)}</p></section>`).join('')}</div>${row.keywords?.length?`<section class="bx-context-keywords"><span>Palavras-chave</span><div>${row.keywords.map(x=>`<i>${escapeHtml(x)}</i>`).join('')}</div></section>`:''}${row.refs?.length?`<section class="bx-context-refs"><span>Conexões bíblicas</span><div>${row.refs.map(x=>`<button data-context-ref="${escapeHtml(x)}">${escapeHtml(x)}</button>`).join('')}</div></section>`:''}${row.notes?`<section class="bx-context-note"><span>Notas</span><p>${escapeHtml(row.notes)}</p></section>`:''}`;box.querySelector('[data-context-copy]')?.addEventListener('click',()=>navigator.clipboard?.writeText([row.title,row.reference,row.period,row.historical,row.cultural,row.literary,row.geographic].filter(Boolean).join('\n\n')));box.querySelectorAll('[data-context-ref]').forEach(b=>b.onclick=async()=>{activate('reader');$("#bRef").value=b.dataset.contextRef;current=await bibleRef(b.dataset.contextRef);$("#bOut").textContent=formatVerses(current)||'Passagem não encontrada na Bíblia local.'})};
 const renderContext=async(q='')=>{const list=$("#bxContextList");if(!list)return;let rows=await contextAll();const term=String(q||$("#bxContextQuery")?.value||'').trim().toLowerCase();if(contextType!=='all')rows=rows.filter(x=>(x.types||[]).includes(contextType)||String(x[contextType]||'').trim());if(term)rows=rows.filter(x=>[x.id,x.title,x.reference,x.book,x.period,x.author,x.audience,x.purpose,x.historical,x.cultural,x.literary,x.geographic,x.notes,...(x.keywords||[]),...(x.refs||[])].some(v=>String(v||'').toLowerCase().includes(term)));rows.sort((a,b)=>(a.book||a.title).localeCompare((b.book||b.title),'pt-BR',{sensitivity:'base'}));const c=$("#bxContextCount");if(c)c.textContent=`${rows.length} registro${rows.length===1?'':'s'}`;if(!rows.length){list.innerHTML='<div class="bx-context-empty">Nenhum contexto encontrado no banco local.</div>';return}list.innerHTML=rows.slice(0,500).map(x=>`<button class="bx-context-item" data-context-id="${escapeHtml(x.id)}"><span>🧭</span><div><strong>${escapeHtml(x.title)}</strong><small>${escapeHtml([x.reference||x.book,x.period,(x.types||[]).map(contextTypeLabel).join(' / ')].filter(Boolean).join(' • '))}</small></div><b>›</b></button>`).join('');list.querySelectorAll('[data-context-id]').forEach(b=>b.onclick=()=>{const r=rows.find(x=>x.id===b.dataset.contextId);list.querySelectorAll('.bx-context-item').forEach(x=>x.classList.toggle('active',x===b));contextDetail(r)});if(rows.length===1)list.querySelector('[data-context-id]')?.click()};
 $("#bxContextFind")?.addEventListener('click',()=>renderContext($("#bxContextQuery").value));$("#bxContextQuery")?.addEventListener('keydown',e=>{if(e.key==='Enter')renderContext(e.target.value)});document.querySelectorAll('[data-context-type]').forEach(b=>b.onclick=()=>{contextType=b.dataset.contextType;document.querySelectorAll('[data-context-type]').forEach(x=>x.classList.toggle('active',x===b));renderContext()});
 $("#bxContextExample")?.addEventListener('click',async()=>{await contextPutMany([{id:'isaias-6',title:'A visão e o chamado de Isaías',reference:'Isaías 6',book:'Isaías',types:['historical','cultural','literary'],period:'século VIII a.C.',author:'Isaías',audience:'Judá e Jerusalém',purpose:'Apresentar a santidade de Deus, o chamado profético e a missão em meio à crise.',historical:'O capítulo situa a visão no ano da morte do rei Uzias, período de transição política e tensão diante da expansão assíria.',cultural:'Templo, trono, serafins, carvão do altar e linguagem de pureza dialogam com o universo cultual de Israel.',literary:'Narrativa de visão e vocação profética, com movimento de revelação, consciência de pecado, purificação e envio.',geographic:'Jerusalém e o templo formam o cenário simbólico e religioso da visão.',keywords:['santidade','chamado','missão','templo'],refs:['2 Reis 15:7','Isaías 1:1','João 12:41']},{id:'1cor-13',title:'Corinto e o caminho sobremodo excelente',reference:'1 Coríntios 13',book:'1 Coríntios',types:['historical','cultural','literary'],period:'século I d.C.',author:'Paulo',audience:'Igreja em Corinto',purpose:'Corrigir o uso dos dons sem amor e mostrar o amor como princípio indispensável da vida cristã.',historical:'Corinto era uma cidade portuária estratégica do mundo romano e a comunidade cristã enfrentava divisões e disputas de status.',cultural:'A busca por honra, eloquência e posição social ajuda a compreender o contraste de Paulo entre dons impressionantes e amor.',literary:'O capítulo está entre os capítulos 12 e 14 e funciona como centro argumentativo da discussão sobre dons espirituais.',geographic:'Corinto ficava no istmo que ligava a Grécia continental ao Peloponeso.',keywords:['amor','dons','igreja','corinto'],refs:['1 Coríntios 12:31','1 Coríntios 14:1']},{id:'exodo-egito',title:'Êxodo e libertação do Egito',reference:'Êxodo 1-15',book:'Êxodo',types:['historical','cultural','geographic'],period:'Antiguidade do Oriente Próximo',author:'Tradição mosaica',audience:'Israel',purpose:'Narrar a libertação de Israel e fundamentar sua identidade de aliança.',historical:'A narrativa descreve Israel sob opressão no Egito, o confronto com Faraó e a libertação conduzida por Deus.',cultural:'Trabalho forçado, corte real, práticas religiosas e ritos da Páscoa fazem parte do ambiente da narrativa.',literary:'Narrativa de libertação que conduz ao estabelecimento da aliança no Sinai.',geographic:'Egito, região do delta, deserto e rota em direção ao Sinai compõem o movimento geográfico central.',keywords:['êxodo','páscoa','egito','libertação'],refs:['Êxodo 12:1-14','Êxodo 14:21-31']}]);await renderContext()});
 $("#bxContextImport")?.addEventListener('click',async()=>{const f=$("#bxContextFile")?.files?.[0];if(!f)return alert('Escolha um JSON.');try{const data=JSON.parse(await f.text()),rows=Array.isArray(data)?data:(data.entries||data.context||data.contexts||[]);const n=await contextPutMany(rows);alert(`${n} registros de contexto importados.`);await renderContext()}catch(e){alert('Falha ao importar contexto: '+e.message)}});$("#bxContextExport")?.addEventListener('click',async()=>download('biblia-x-contexto.json',JSON.stringify(await contextAll(),null,2),'application/json'));$("#bxContextClear")?.addEventListener('click',async()=>{if(!confirm('Limpar todo o banco de contexto local?'))return;await contextClear();await renderContext();const d=$("#bxContextDetail");if(d)d.innerHTML='<div class="bx-context-detail-empty"><span>🧭</span><h4>Painel de Contexto</h4><p>Banco de contexto local limpo.</p></div>'});
 document.querySelectorAll('[data-bible-jump="context"],[data-bible-section="context"]').forEach(btn=>btn.addEventListener('click',()=>setTimeout(()=>renderContext(),0)));
 // ETAPA 9 • COMENTÁRIOS BÍBLICOS X
 let commentType='all';
 const commentTypeLabel=t=>({executivo:'Executivo',exegetico:'Exegético',hermeneutico:'Hermenêutico','historico-cultural':'Histórico-cultural',pastoral:'Pastoral',homiletico:'Homilético'}[t]||t||'Comentário');
 const commentDetail=row=>{const box=$("#bxCommentsDetail");if(!box||!row)return;box.innerHTML=`<div class="bx-comments-detail-head"><div><span>💬 ${escapeHtml(commentTypeLabel(row.type))}</span><h4>${escapeHtml(row.title)}</h4><small>${escapeHtml([row.reference,row.authorLabel,row.sourceLabel].filter(Boolean).join(' • '))}</small></div><button class="btn danger" data-comment-delete>Excluir</button></div><article class="bx-comments-content">${escapeHtml(row.content).replace(/\n/g,'<br>')}</article>${row.tags?.length?`<section class="bx-comments-tags"><span>Palavras-chave</span><div>${row.tags.map(x=>`<i>${escapeHtml(x)}</i>`).join('')}</div></section>`:''}${row.refs?.length?`<section class="bx-comments-refs"><span>Referências relacionadas</span><div>${row.refs.map(x=>`<button data-comment-ref="${escapeHtml(x)}">${escapeHtml(x)}</button>`).join('')}</div></section>`:''}<div class="row bx-comments-actions"><button class="btn secondary" data-comment-copy>Copiar</button><button class="btn secondary" data-comment-edit>Editar</button>${row.reference?`<button class="btn primary" data-comment-open>📖 Abrir passagem</button>`:''}<button class="btn secondary" data-comment-strong>🇬🇷🇮🇱 Strong</button><button class="btn secondary" data-comment-lex>📚 Léxico</button><button class="btn secondary" data-comment-context>🧭 Contexto</button><button class="btn secondary" data-comment-dna>🧬 DNA K7</button></div>`;box.querySelector('[data-comment-delete]')?.addEventListener('click',async()=>{if(!confirm('Excluir este comentário local?'))return;await commentsDelete(row.id);box.innerHTML='<div class="bx-comments-detail-empty"><span>💬</span><h4>Comentário removido</h4></div>';await renderComments()});box.querySelector('[data-comment-copy]')?.addEventListener('click',()=>navigator.clipboard?.writeText(`${row.title}\n${row.reference?row.reference+'\n':''}\n${row.content}`));box.querySelector('[data-comment-edit]')?.addEventListener('click',async()=>{const title=prompt('Título do comentário:',row.title);if(title===null)return;const content=prompt('Conteúdo do comentário:',row.content);if(content===null)return;await commentsPutMany([{...row,title,content}]);await renderComments();const updated=(await commentsAll()).find(x=>x.id===row.id)||{...row,title,content};commentDetail(updated)});box.querySelector('[data-comment-open]')?.addEventListener('click',async()=>{activate('reader');$("#bRef").value=row.reference;current=await bibleRef(row.reference);$("#bOut").textContent=formatVerses(current)||'Passagem não encontrada na Bíblia local.'});box.querySelectorAll('[data-comment-ref]').forEach(b=>b.onclick=async()=>{activate('reader');$("#bRef").value=b.dataset.commentRef;current=await bibleRef(b.dataset.commentRef);$("#bOut").textContent=formatVerses(current)||'Passagem não encontrada na Bíblia local.'});box.querySelector('[data-comment-strong]')?.addEventListener('click',()=>{activate('strong');setTimeout(()=>renderStrong(),0)});box.querySelector('[data-comment-lex]')?.addEventListener('click',()=>{activate('lexicon');setTimeout(()=>renderLexicon(),0)});box.querySelector('[data-comment-context]')?.addEventListener('click',()=>{activate('context');if($("#bxContextQuery")&&row.reference)$("#bxContextQuery").value=row.reference;setTimeout(()=>renderContext(row.reference),0)});box.querySelector('[data-comment-dna]')?.addEventListener('click',()=>{activate('dna');if($("#bxDnaRef")&&row.reference)$("#bxDnaRef").value=row.reference;setTimeout(()=>{dnaLoadSaved();if(row.reference)dnaUseCurrent(row.reference)},0)})};
 const renderComments=async(q='')=>{const list=$("#bxCommentsList");if(!list)return;let rows=await commentsAll();const term=String(q||$("#bxCommentsQuery")?.value||'').trim().toLowerCase();if(commentType!=='all')rows=rows.filter(x=>x.type===commentType);if(term)rows=rows.filter(x=>[x.reference,x.type,x.title,x.content,x.authorLabel,x.sourceLabel,...(x.tags||[]),...(x.refs||[])].some(v=>String(v||'').toLowerCase().includes(term)));rows.sort((a,b)=>String(a.reference||'').localeCompare(String(b.reference||''),'pt-BR')||String(a.type||'').localeCompare(String(b.type||''),'pt-BR'));const c=$("#bxCommentsCount");if(c)c.textContent=`${rows.length} comentário${rows.length===1?'':'s'}`;if(!rows.length){list.innerHTML='<div class="bx-comments-empty">Nenhum comentário encontrado no banco local.</div>';return}list.innerHTML=rows.slice(0,400).map(x=>`<button class="bx-comments-item" data-comment-id="${escapeHtml(x.id)}"><span>${({executivo:'⚡',exegetico:'🔎',hermeneutico:'📐','historico-cultural':'🏺',pastoral:'❤️',homiletico:'🎙'}[x.type]||'💬')}</span><div><strong>${escapeHtml(x.title)}</strong><small>${escapeHtml([x.reference,commentTypeLabel(x.type)].filter(Boolean).join(' • '))}</small><p>${escapeHtml(x.content.slice(0,150))}${x.content.length>150?'…':''}</p></div></button>`).join('');list.querySelectorAll('[data-comment-id]').forEach(b=>b.onclick=()=>{list.querySelectorAll('.bx-comments-item').forEach(x=>x.classList.toggle('active',x===b));commentDetail(rows.find(x=>x.id===b.dataset.commentId))});if(rows.length===1)list.querySelector('[data-comment-id]')?.click()};
 $("#bxCommentsFind")?.addEventListener('click',()=>renderComments($("#bxCommentsQuery").value));$("#bxCommentsQuery")?.addEventListener('keydown',e=>{if(e.key==='Enter')renderComments(e.target.value)});document.querySelectorAll('[data-comment-type]').forEach(b=>b.onclick=()=>{commentType=b.dataset.commentType;document.querySelectorAll('[data-comment-type]').forEach(x=>x.classList.toggle('active',x===b));renderComments()});
 $("#bxCommentsNew")?.addEventListener('click',async()=>{const reference=normalizeBibleRef(prompt('Referência bíblica:',current?.length?`${current[0].book} ${current[0].chapter}:${current[0].verse}`:($("#bRef")?.value||''))||'');if(reference===null)return;const title=prompt('Título do comentário:','Novo comentário');if(title===null)return;const type=prompt('Tipo: executivo, exegetico, hermeneutico, historico-cultural, pastoral ou homiletico','executivo');if(type===null)return;const content=prompt('Conteúdo do comentário:','');if(!content)return;const n=await commentsPutMany([{id:`user-${Date.now()}`,reference,type,title,content,authorLabel:'Comentário pessoal',sourceLabel:'Bíblia X'}]);if(n)await renderComments()});
 $("#bxCommentsExample")?.addEventListener('click',async()=>{await commentsPutMany([{id:'cm-joao316-exec',reference:'João 3:16',type:'executivo',title:'O centro do anúncio',content:'A passagem concentra a iniciativa divina, o amor como origem da ação e a resposta de fé. Use este comentário como síntese de estudo, não como substituto da leitura do contexto.',authorLabel:'Comentário executivo',sourceLabel:'Bíblia X • exemplo',tags:['amor','fé','evangelho'],refs:['João 3:14-18','Romanos 5:8']},{id:'cm-isaias6-exeg',reference:'Isaías 6',type:'exegetico',title:'Santidade, purificação e envio',content:'O movimento literário passa da visão da santidade para a consciência de impureza, da purificação para a disponibilidade ao envio. A estrutura do capítulo ajuda a preservar a progressão do texto antes de qualquer aplicação homilética.',authorLabel:'Comentário exegético',sourceLabel:'Bíblia X • exemplo',tags:['santidade','chamado','missão'],refs:['Isaías 6:1-8']},{id:'cm-isaias6-hom',reference:'Isaías 6:8',type:'homiletico',title:'Da visão ao envio',content:'Possível eixo homilético: contemplação → convicção → purificação → escuta → resposta. O desenvolvimento deve nascer do texto e só então caminhar para aplicações e chamado.',authorLabel:'Comentário homilético',sourceLabel:'Bíblia X • exemplo',tags:['estrutura','pregação','chamado'],refs:['Isaías 6:1-8']}]);await renderComments()});
 $("#bxCommentsImport")?.addEventListener('click',async()=>{const f=$("#bxCommentsFile")?.files?.[0];if(!f)return alert('Escolha um JSON de comentários.');try{const j=JSON.parse(await f.text()),rows=Array.isArray(j)?j:(j.comments||j.comentarios||[]),n=await commentsPutMany(rows);alert(`${n} comentário(s) importado(s).`);await renderComments()}catch(e){alert('Falha ao importar comentários: '+e.message)}});$("#bxCommentsExport")?.addEventListener('click',async()=>download('biblia-x-comentarios.json',JSON.stringify(await commentsAll(),null,2),'application/json'));$("#bxCommentsClear")?.addEventListener('click',async()=>{if(!confirm('Limpar todos os comentários locais?'))return;await commentsClear();await renderComments();const d=$("#bxCommentsDetail");if(d)d.innerHTML='<div class="bx-comments-detail-empty"><span>💬</span><h4>Banco de comentários limpo</h4></div>'});
 document.querySelectorAll('[data-bible-jump="comments"],[data-bible-section="comments"]').forEach(btn=>btn.addEventListener('click',()=>setTimeout(()=>{const ref=current?.length?`${current[0].book} ${current[0].chapter}:${current[0].verse}`:normalizeBibleRef($("#bRef")?.value||'');if($("#bxCommentsQuery")&&ref&&!$("#bxCommentsQuery").value)$("#bxCommentsQuery").value=ref;renderComments()},0)));
 let mapType='all',mapRowsCache=[];
 const mapTypeLabel=t=>({place:'Lugar',city:'Cidade',region:'Região',route:'Rota',event:'Evento'}[t]||t||'Lugar');


 const bxV167Tours=[
  {id:'jerusalem',name:'Jerusalém • Cidade Antiga',lat:31.778,lng:35.235,ref:'Lucas 19:41',hint:'Templo, muralhas e cenário de numerosas passagens.'},
  {id:'olives',name:'Monte das Oliveiras',lat:31.7780,lng:35.2437,ref:'Mateus 24:3',hint:'Área ligada ao ministério de Jesus e à ascensão.'},
  {id:'bethlehem',name:'Belém',lat:31.7054,lng:35.2024,ref:'Mateus 2:1',hint:'Cidade associada a Davi e ao nascimento de Jesus.'},
  {id:'nazareth',name:'Nazaré',lat:32.6996,lng:35.3035,ref:'Lucas 4:16',hint:'Cidade ligada à infância e juventude de Jesus.'},
  {id:'capernaum',name:'Cafarnaum',lat:32.8810,lng:35.5750,ref:'Mateus 4:13',hint:'Centro importante do ministério de Jesus na Galileia.'},
  {id:'galilee',name:'Mar da Galileia',lat:32.82,lng:35.59,ref:'Marcos 4:35',hint:'Cenário de chamados, travessias e milagres.'}
 ];
 const bxV167Urls=x=>({pano:`https://www.google.com/maps/@?api=1&map_action=pano&viewpoint=${encodeURIComponent(x.lat+','+x.lng)}`,map:`https://www.openstreetmap.org/?mlat=${encodeURIComponent(x.lat)}&mlon=${encodeURIComponent(x.lng)}#map=16/${encodeURIComponent(x.lat)}/${encodeURIComponent(x.lng)}`,images:`https://commons.wikimedia.org/wiki/Special:MediaSearch?type=image&search=${encodeURIComponent(x.name)}`});
 const bxV167RenderTours=()=>{const grid=$('#bxV167TourGrid');if(!grid)return;grid.innerHTML=bxV167Tours.map(x=>{const u=bxV167Urls(x);return `<article><div><span>📍</span><b>${escapeHtml(x.name)}</b><small>${escapeHtml(x.hint)}</small></div><nav><a href="${escapeHtml(u.pano)}" target="_blank" rel="noopener">🕶️ 360°</a><a href="${escapeHtml(u.map)}" target="_blank" rel="noopener">🗺️ Mapa</a><a href="${escapeHtml(u.images)}" target="_blank" rel="noopener">🖼️ Imagens</a><button type="button" data-v167-ref="${escapeHtml(x.ref)}">📖 Bíblia</button></nav></article>`}).join('');grid.querySelectorAll('[data-v167-ref]').forEach(b=>b.onclick=async()=>{const ref=b.dataset.v167Ref;activate('reader');if($('#bRef'))$('#bRef').value=ref;try{const rr=await smartBibleRef(ref);if(rr.length){current=rr;renderBibleVerses(rr)}}catch(_){}})};

 const bxV165Routes={
  exodus:{id:'v165-exodus',name:'Êxodo • Egito ao Sinai',type:'route',region:'Egito • Deserto • Sinai',period:'Êxodo',lat:29.6,lng:32.4,description:'Rota didática para acompanhar as principais etapas narrativas do Êxodo. Diversas localizações antigas são debatidas e a visualização não pretende resolver essas discussões.',route:['Ramessés','Sucote','Etã','Travessia / Mar','Mara','Elim','Deserto de Sim','Refidim','Sinai'],refs:['Êxodo 12:37','Êxodo 13:20','Êxodo 14:1-31','Êxodo 15:22-27','Êxodo 17:1-7','Êxodo 19:1-2'],tags:['êxodo','moisés','sinai','deserto'],notes:'Use as referências para acompanhar a rota no próprio texto bíblico.'},
  'jesus-galilee':{id:'v165-jesus-galilee',name:'Jesus • Ministério na Galileia',type:'route',region:'Galileia',period:'século I d.C.',lat:32.82,lng:35.45,description:'Percurso de estudo reunindo cidades e áreas fortemente ligadas ao ministério de Jesus na Galileia.',route:['Nazaré','Caná','Cafarnaum','Mar da Galileia','Betsaida','região de Genesaré'],refs:['Lucas 4:16-30','João 2:1-11','Mateus 4:12-17','Marcos 1:21-39','Marcos 6:45-56'],tags:['jesus','galileia','cidades','ministério']},
  'paul-1':{id:'v165-paul1',name:'Paulo • Primeira viagem missionária',type:'route',region:'Síria • Chipre • Ásia Menor',period:'século I d.C.',lat:36.2,lng:32.0,description:'Sequência didática baseada em Atos 13–14.',route:['Antioquia da Síria','Selêucia','Salamina','Pafos','Perge','Antioquia da Pisídia','Icônio','Listra','Derbe','retorno a Antioquia'],refs:['Atos 13:1-14','Atos 13:14-52','Atos 14:1-28'],tags:['paulo','missões','atos','chipre']},
  'paul-2':{id:'v165-paul2',name:'Paulo • Segunda viagem missionária',type:'route',region:'Ásia Menor • Macedônia • Acaia',period:'século I d.C.',lat:39.0,lng:24.0,description:'Percurso de estudo da segunda viagem missionária, incluindo a entrada na Macedônia.',route:['Antioquia','Derbe','Listra','Trôade','Filipos','Tessalônica','Bereia','Atenas','Corinto','Éfeso','Cesareia','Antioquia'],refs:['Atos 15:36-41','Atos 16:1-40','Atos 17:1-34','Atos 18:1-22'],tags:['paulo','macedônia','corinto','missões']},
  'paul-3':{id:'v165-paul3',name:'Paulo • Terceira viagem missionária',type:'route',region:'Ásia Menor • Macedônia • Acaia',period:'século I d.C.',lat:38.3,lng:27.1,description:'Percurso didático com destaque para o longo ministério em Éfeso e o retorno a Jerusalém.',route:['Antioquia','Galácia / Frígia','Éfeso','Macedônia','Grécia','Trôade','Mileto','Tiro','Cesareia','Jerusalém'],refs:['Atos 18:23','Atos 19:1-41','Atos 20:1-38','Atos 21:1-17'],tags:['paulo','éfeso','mileto','missões']},
  'paul-rome':{id:'v165-paulrome',name:'Paulo • Viagem a Roma',type:'route',region:'Mediterrâneo oriental • Roma',period:'século I d.C.',lat:35.5,lng:18.0,description:'Percurso de estudo da viagem marítima de Paulo como prisioneiro até Roma.',route:['Cesareia','Sidom','Mirra','Bons Portos / Creta','tempestade no Mediterrâneo','Malta','Siracusa','Régio','Putéoli','Roma'],refs:['Atos 27:1-44','Atos 28:1-16'],tags:['paulo','roma','malta','navio','atos']}
 };
 const bxV165OpenRoute=id=>{const row=bxV165Routes[id];if(!row)return;mapType='route';document.querySelectorAll('[data-map-type]').forEach(x=>x.classList.toggle('active',x.dataset.mapType==='route'));if($('#bxMapQuery'))$('#bxMapQuery').value=row.name;mapDetail(row);$('#bxMapDetail')?.scrollIntoView({behavior:'smooth',block:'nearest'});};

 const mapIcon=t=>({place:'📍',city:'🏙',region:'🌍',route:'➜',event:'✦'}[t]||'📍');
 const bxMapExternalUrls=row=>{
   const lat=Number(row?.lat),lng=Number(row?.lng),has=Number.isFinite(lat)&&Number.isFinite(lng),q=encodeURIComponent(row?.name||"");
   return {osm:has?`https://www.openstreetmap.org/?mlat=${lat}&mlon=${lng}#map=14/${lat}/${lng}`:`https://www.openstreetmap.org/search?query=${q}`,google:has?`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${lat},${lng}`)}`:`https://www.google.com/maps/search/?api=1&query=${q}`,pano:has?`https://www.google.com/maps/@?api=1&map_action=pano&viewpoint=${encodeURIComponent(`${lat},${lng}`)}`:`https://www.google.com/maps/search/?api=1&query=${q}`,commons:`https://commons.wikimedia.org/wiki/Special:MediaSearch?type=image&search=${q}`};
 };
 const bxMapEmbedUrl=row=>{const lat=Number(row?.lat),lng=Number(row?.lng);if(!Number.isFinite(lat)||!Number.isFinite(lng))return "";const d=.055,bbox=[lng-d,lat-d,lng+d,lat+d].join("%2C");return `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${lat}%2C${lng}`};
 const bxMapLoadCommonsImages=async(name,grid)=>{if(!grid)return;grid.innerHTML='<div class="bx-map-media-loading">Buscando imagens públicas...</div>';try{const url=`https://commons.wikimedia.org/w/api.php?action=query&generator=search&gsrsearch=${encodeURIComponent(name)}&gsrnamespace=6&gsrlimit=8&prop=imageinfo&iiprop=url&iiurlwidth=360&format=json&origin=*`;const r=await fetch(url,{cache:"force-cache"});if(!r.ok)throw new Error("commons");const j=await r.json(),pages=Object.values(j?.query?.pages||{}).filter(p=>p.imageinfo?.[0]?.thumburl||p.imageinfo?.[0]?.url).slice(0,8);grid.innerHTML=pages.length?pages.map(p=>{const ii=p.imageinfo[0],src=ii.thumburl||ii.url,href=ii.descriptionurl||ii.url;return `<a href="${escapeHtml(href)}" target="_blank" rel="noopener"><img loading="lazy" src="${escapeHtml(src)}" alt="${escapeHtml(p.title.replace(/^File:/,""))}"><span>${escapeHtml(p.title.replace(/^File:/,""))}</span></a>`}).join(""):'<div class="bx-map-media-loading">Nenhuma imagem encontrada.</div>'}catch(_){grid.innerHTML='<div class="bx-map-media-loading">Falha ao carregar miniaturas. Use “Abrir Commons”.</div>'}};
 const bxMapExplore=row=>{let m=document.getElementById("bxMapExploreModal");if(!m){m=document.createElement("div");m.id="bxMapExploreModal";m.className="bx-map-explore-modal";document.body.appendChild(m)}const urls=bxMapExternalUrls(row),embed=bxMapEmbedUrl(row),has=!!embed;m.hidden=false;m.innerHTML=`<div class="bx-map-explore-card"><header><div><small>MAPAS X • EXPLORAR</small><h3>🗺️ ${escapeHtml(row.name)}</h3><p>${escapeHtml([row.region,row.period].filter(Boolean).join(" • "))}</p></div><button type="button" data-map-explore-close>×</button></header><nav><button type="button" data-map-tab="map" class="active">🗺️ Mapa</button><button type="button" data-map-tab="images">🖼️ Imagens</button><a href="${escapeHtml(urls.pano)}" target="_blank" rel="noopener">🕶️ Passeio 360°</a><a href="${escapeHtml(urls.google)}" target="_blank" rel="noopener">📍 Google Maps</a></nav><section data-map-explore-view="map" class="active">${has?`<iframe title="Mapa de ${escapeHtml(row.name)}" src="${escapeHtml(embed)}" loading="lazy" referrerpolicy="no-referrer-when-downgrade"></iframe>`:`<div class="bx-map-no-coords">Sem coordenadas para mapa interativo.</div>`}<footer><a href="${escapeHtml(urls.osm)}" target="_blank" rel="noopener">Abrir OpenStreetMap ↗</a><span>Mapa interativo externo</span></footer></section><section data-map-explore-view="images"><div class="bx-map-media-grid" data-map-media-grid></div><footer><a href="${escapeHtml(urls.commons)}" target="_blank" rel="noopener">Abrir Wikimedia Commons ↗</a><span>Confira a licença na página de cada arquivo.</span></footer></section></div>`;const close=()=>m.hidden=true;m.querySelector("[data-map-explore-close]").onclick=close;m.onclick=e=>{if(e.target===m)close()};m.querySelectorAll("[data-map-tab]").forEach(b=>b.onclick=()=>{const tab=b.dataset.mapTab;m.querySelectorAll("[data-map-tab]").forEach(x=>x.classList.toggle("active",x===b));m.querySelectorAll("[data-map-explore-view]").forEach(x=>x.classList.toggle("active",x.dataset.mapExploreView===tab));if(tab==="images")bxMapLoadCommonsImages(row.name,m.querySelector("[data-map-media-grid]"))})};
 const plotMap=row=>{const canvas=$("#bxMapCanvas");if(!canvas||!row)return;const embed=bxMapEmbedUrl(row);canvas.innerHTML=embed?`<iframe class="bx-map-osm-frame" title="Mapa interativo de ${escapeHtml(row.name)}" src="${escapeHtml(embed)}" loading="lazy" referrerpolicy="no-referrer-when-downgrade"></iframe><button type="button" class="bx-map-expand" data-map-expand>⛶ Explorar</button>`:`<div class="bx-map-grid"></div><div class="bx-map-compass">N<br>↑</div><div class="bx-map-empty-view"><span>${mapIcon(row.type)}</span><h4>${escapeHtml(row.name)}</h4><p>Sem coordenadas. Informações e referências continuam disponíveis.</p></div>`;canvas.querySelector("[data-map-expand]")?.addEventListener("click",()=>bxMapExplore(row))};

 const bxV166DistanceKm=(a,b)=>{const la=Number(a?.lat),loa=Number(a?.lng),lb=Number(b?.lat),lob=Number(b?.lng);if(![la,loa,lb,lob].every(Number.isFinite))return Infinity;const R=6371,d2r=Math.PI/180,dLat=(lb-la)*d2r,dLon=(lob-loa)*d2r,x=Math.sin(dLat/2)**2+Math.cos(la*d2r)*Math.cos(lb*d2r)*Math.sin(dLon/2)**2;return R*2*Math.atan2(Math.sqrt(x),Math.sqrt(1-x))};
 const bxV166Nearby=row=>mapRowsCache.filter(x=>x.id!==row.id&&Number.isFinite(Number(x.lat))&&Number.isFinite(Number(x.lng))).map(x=>({...x,_km:bxV166DistanceKm(row,x)})).filter(x=>Number.isFinite(x._km)&&x._km<350).sort((a,b)=>a._km-b._km).slice(0,6);
 const bxV166ModuleOpen=(module,q)=>{activate(module);setTimeout(()=>{const ids={people:'#bxPeopleQuery',timeline:'#bxTimelineQuery',context:'#bxContextQuery',media:'#bxMediaQuery'};const el=$(ids[module]);if(el)el.value=q;const btn={people:'#bxPeopleFind',timeline:'#bxTimelineFind',context:'#bxContextFind',media:'#bxMediaFind'}[module];$(btn)?.click()},60)};

 const mapDetail=row=>{const box=$("#bxMapDetail");if(!box||!row)return;const urls=bxMapExternalUrls(row),lat=Number(row.lat),lng=Number(row.lng),has=Number.isFinite(lat)&&Number.isFinite(lng);box.innerHTML=`<div class="bx-map-detail-head"><div><span>${mapIcon(row.type)} ${escapeHtml(mapTypeLabel(row.type).toUpperCase())}</span><h4>${escapeHtml(row.name)}</h4><small>${escapeHtml([row.region,row.period].filter(Boolean).join(" • "))}</small></div><button class="btn secondary" data-map-copy>Copiar</button></div>${row.description?`<p class="bx-map-description">${escapeHtml(row.description)}</p>`:""}<div class="bx-map-live-actions"><button type="button" data-map-explore>🗺️ Explorar</button><a href="${escapeHtml(urls.pano)}" target="_blank" rel="noopener">🕶️ 360°</a><a href="${escapeHtml(urls.google)}" target="_blank" rel="noopener">📍 Google</a><a href="${escapeHtml(urls.commons)}" target="_blank" rel="noopener">🖼️ Imagens</a></div><section class="bx-v166-connections"><span>Conectar este lugar</span><div><button type="button" data-v166-module="people">👤 Personagens</button><button type="button" data-v166-module="timeline">🕰️ Linha do Tempo</button><button type="button" data-v166-module="context">🧭 Contexto</button><button type="button" data-v166-module="media">🎥 Mídia</button></div></section><div class="bx-map-facts"><div><span>Região</span><b>${escapeHtml(row.region||"—")}</b></div><div><span>Coordenadas</span><b>${has?`${lat.toFixed(4)}, ${lng.toFixed(4)}`:"—"}</b></div></div>${has&&bxV166Nearby(row).length?`<section class="bx-v166-near"><span>Lugares próximos no seu atlas</span><div>${bxV166Nearby(row).map(x=>`<button type="button" data-v166-near-id="${escapeHtml(x.id)}"><b>${escapeHtml(x.name)}</b><small>~${Math.round(x._km)} km</small></button>`).join("")}</div></section>`:""}${row.route?.length?`<section class="bx-map-route"><span>Rota / paradas</span><div>${row.route.map((x,i)=>`<i><b>${i+1}</b>${escapeHtml(x)}</i>`).join("<em>→</em>")}</div></section>`:""}${row.refs?.length?`<section class="bx-map-refs"><span>Referências bíblicas</span><div>${row.refs.map(x=>`<button data-map-ref="${escapeHtml(x)}">${escapeHtml(x)}</button>`).join("")}</div></section>`:""}${row.tags?.length?`<section class="bx-map-tags"><span>Palavras-chave</span><div>${row.tags.map(x=>`<i>${escapeHtml(x)}</i>`).join("")}</div></section>`:""}${row.notes?`<section class="bx-map-note"><span>Notas</span><p>${escapeHtml(row.notes)}</p></section>`:""}`;box.querySelector("[data-map-copy]")?.addEventListener("click",()=>navigator.clipboard?.writeText([row.name,row.region,row.period,row.description,has&&`${lat}, ${lng}`,(row.refs||[]).join(", ")].filter(Boolean).join("\n")));box.querySelector("[data-map-explore]")?.addEventListener("click",()=>bxMapExplore(row));box.querySelectorAll("[data-v166-module]").forEach(b=>b.onclick=()=>bxV166ModuleOpen(b.dataset.v166Module,row.name));box.querySelectorAll("[data-v166-near-id]").forEach(b=>b.onclick=()=>{const x=mapRowsCache.find(r=>r.id===b.dataset.v166NearId);if(x)mapDetail(x)});box.querySelectorAll("[data-map-ref]").forEach(b=>b.onclick=async()=>{const ref=b.dataset.mapRef;activate("reader");if($("#bRef"))$("#bRef").value=ref;try{const rr=await smartBibleRef(ref);if(rr.length){current=rr;renderBibleVerses(rr)}}catch(_){}});plotMap(row)};
 const renderMaps=async(q='')=>{const list=$("#bxMapList");if(!list)return;let rows=await mapsAll();mapRowsCache=rows;const term=String(q||$("#bxMapQuery")?.value||'').trim().toLowerCase();if(mapType!=='all')rows=rows.filter(x=>x.type===mapType);if(term)rows=rows.filter(x=>[x.id,x.name,x.type,x.region,x.period,x.description,x.notes,...(x.refs||[]),...(x.tags||[]),...(x.route||[])].some(v=>String(v||'').toLowerCase().includes(term)));rows.sort((a,b)=>(a.name||'').localeCompare((b.name||''),'pt-BR',{sensitivity:'base'}));const c=$("#bxMapCount");if(c)c.textContent=`${rows.length} registro${rows.length===1?'':'s'}`;if(!rows.length){list.innerHTML='<div class="bx-map-empty">Nenhum lugar, rota ou evento encontrado no atlas local.</div>';return}list.innerHTML=rows.slice(0,500).map(x=>`<button class="bx-map-item" data-map-id="${escapeHtml(x.id)}"><span>${mapIcon(x.type)}</span><div><strong>${escapeHtml(x.name)}</strong><small>${escapeHtml([mapTypeLabel(x.type),x.region,x.period].filter(Boolean).join(' • '))}</small></div><b>›</b></button>`).join('');list.querySelectorAll('[data-map-id]').forEach(b=>b.onclick=()=>{const r=rows.find(x=>x.id===b.dataset.mapId);list.querySelectorAll('.bx-map-item').forEach(x=>x.classList.toggle('active',x===b));mapDetail(r)});if(rows.length===1)list.querySelector('[data-map-id]')?.click()};
 $("#bxMapFind")?.addEventListener('click',()=>renderMaps($("#bxMapQuery").value));$("#bxMapQuery")?.addEventListener('keydown',e=>{if(e.key==='Enter')renderMaps(e.target.value)});document.querySelectorAll('[data-map-type]').forEach(b=>b.onclick=()=>{mapType=b.dataset.mapType;document.querySelectorAll('[data-map-type]').forEach(x=>x.classList.toggle('active',x===b));renderMaps()});
 $("#bxMapExample")?.addEventListener('click',async()=>{await mapsPutMany([{id:'jerusalem',name:'Jerusalém',type:'city',region:'Judeia',period:'Períodos bíblicos diversos',lat:31.778,lng:35.235,description:'Cidade central na história bíblica, associada ao templo, à monarquia davídica e aos acontecimentos finais do ministério terreno de Jesus.',refs:['2 Samuel 5:6-9','Salmos 122:1-6','Lucas 19:28-44'],tags:['templo','davi','judeia']},{id:'nazare',name:'Nazaré',type:'city',region:'Galileia',period:'século I d.C.',lat:32.6996,lng:35.3035,description:'Cidade da Galileia associada à infância e juventude de Jesus.',refs:['Mateus 2:23','Lucas 4:16'],tags:['jesus','galileia']},{id:'mar-galileia',name:'Mar da Galileia',type:'place',region:'Galileia',lat:32.82,lng:35.59,description:'Lago de água doce ligado a numerosos episódios do ministério de Jesus.',refs:['Marcos 4:35-41','Mateus 14:22-33'],tags:['lago','discípulos','milagres']},{id:'rota-exodo',name:'Rota do Êxodo',type:'route',region:'Egito • Sinai',period:'Antigo Testamento',lat:29.6,lng:32.4,description:'Representação didática da saída do Egito em direção ao deserto e ao Sinai. A localização exata de diversos pontos é debatida.',refs:['Êxodo 12:37','Êxodo 14:1-31','Êxodo 19:1-2'],route:['Ramessés','Sucote','Etã','Mar / travessia','Deserto','Sinai'],tags:['êxodo','moisés','sinai'],notes:'Rota aproximada para estudo; não pretende resolver debates arqueológicos sobre cada localização.'},{id:'damasco-paulo',name:'Caminho de Damasco',type:'event',region:'Síria romana',period:'século I d.C.',lat:33.5138,lng:36.2765,description:'Área associada à experiência de Saulo a caminho de Damasco.',refs:['Atos 9:1-19','Atos 22:6-16','Atos 26:12-18'],tags:['paulo','conversão','damasco']}]);await renderMaps()});
 $("#bxMapImport")?.addEventListener('click',async()=>{const f=$("#bxMapFile")?.files?.[0];if(!f)return alert('Escolha um JSON ou GeoJSON.');try{const data=JSON.parse(await f.text());let rows=[];if(Array.isArray(data))rows=data;else if(Array.isArray(data.entries||data.maps||data.places))rows=data.entries||data.maps||data.places;else if(data.type==='FeatureCollection'&&Array.isArray(data.features))rows=data.features.map((f,i)=>{const p=f.properties||{},c=f.geometry?.coordinates||[];return {...p,id:p.id||`geo-${i}`,name:p.name||p.title||`Lugar ${i+1}`,lng:Number(c[0]),lat:Number(c[1])}});const n=await mapsPutMany(rows);alert(`${n} registros do atlas importados.`);await renderMaps()}catch(e){alert('Falha ao importar atlas: '+e.message)}});$("#bxMapExport")?.addEventListener('click',async()=>download('biblia-x-mapas-atlas.json',JSON.stringify(await mapsAll(),null,2),'application/json'));$("#bxMapClear")?.addEventListener('click',async()=>{if(!confirm('Limpar todo o atlas local?'))return;await mapsClear();await renderMaps();const d=$("#bxMapDetail");if(d)d.innerHTML='<div class="bx-map-detail-empty">Atlas local limpo.</div>';const c=$("#bxMapCanvas");if(c)c.querySelectorAll('.bx-map-marker').forEach(x=>x.remove())});
 document.querySelectorAll('[data-v165-route]').forEach(b=>b.addEventListener('click',()=>bxV165OpenRoute(b.dataset.v165Route)));
 $('#bxV167TourToggle')?.addEventListener('click',e=>{const g=$('#bxV167TourGrid');if(!g)return;const open=g.hasAttribute('hidden');g.toggleAttribute('hidden',!open);e.currentTarget.textContent=open?'Ocultar destinos':'Mostrar destinos';if(open)bxV167RenderTours()});
 document.querySelectorAll('[data-bible-section="maps"]').forEach(btn=>btn.addEventListener('click',()=>setTimeout(()=>renderMaps(),0)));
 let peopleRole='all';
 const personRoleLabel=r=>({patriarca:'Patriarca',profeta:'Profeta',rei:'Rei',apostolo:'Apóstolo',discipulo:'Discípulo',mulher:'Mulher bíblica',outro:'Outro'}[r]||String(r||'Outro'));
 const personRoleIcon=r=>({patriarca:'🏕',profeta:'📜',rei:'👑',apostolo:'✦',discipulo:'👥',mulher:'🌿',outro:'👤'}[r]||'👤');
 const personDetail=row=>{const box=$("#bxPeopleDetail");if(!box||!row)return;const block=(title,items,ico='•')=>items?.length?`<section class="bx-people-block"><h5>${title}</h5><div>${items.map(x=>`<span>${ico} ${escapeHtml(x)}</span>`).join('')}</div></section>`:'';box.innerHTML=`<div class="bx-people-detail-head"><div><span>${personRoleIcon(row.role)} ${escapeHtml(personRoleLabel(row.role))}</span><h4>${escapeHtml(row.name)}</h4><small>${escapeHtml([row.meaning&&'Significado: '+row.meaning,row.period].filter(Boolean).join(' • '))}</small></div><button class="btn danger" data-person-delete>Excluir</button></div>${row.summary?`<article class="bx-people-summary">${escapeHtml(row.summary).replace(/\n/g,'<br>')}</article>`:''}${block('Família e relações',row.family,'👪')}${block('Lugares relacionados',row.places,'📍')}${block('Acontecimentos principais',row.events,'✦')}${block('Virtudes',row.virtues,'✓')}${block('Falhas / conflitos',row.failures,'△')}${block('Lições para estudo',row.lessons,'💡')}${block('Pessoas relacionadas',row.related,'↔')}${row.refs?.length?`<section class="bx-people-refs"><h5>Referências bíblicas</h5><div>${row.refs.map(x=>`<button data-person-ref="${escapeHtml(x)}">${escapeHtml(x)}</button>`).join('')}</div></section>`:''}${row.notes?`<section class="bx-people-notes"><h5>Notas</h5><p>${escapeHtml(row.notes)}</p></section>`:''}<div class="row bx-people-actions"><button class="btn secondary" data-person-copy>Copiar ficha</button><button class="btn secondary" data-person-edit>Editar</button><button class="btn secondary" data-person-map>🗺️ Mapas</button><button class="btn secondary" data-person-context>🧭 Contexto</button><button class="btn secondary" data-person-comments>💬 Comentários</button><button class="btn secondary" data-person-dna>🧬 DNA K7</button></div>`;box.querySelector('[data-person-delete]')?.addEventListener('click',async()=>{if(!confirm(`Excluir ${row.name} do banco local?`))return;await peopleDelete(row.id);box.innerHTML='<div class="bx-people-detail-empty"><span>👤</span><h4>Personagem removido</h4></div>';await renderPeople()});box.querySelector('[data-person-copy]')?.addEventListener('click',()=>navigator.clipboard?.writeText([row.name,row.meaning&&`Significado: ${row.meaning}`,row.period,row.summary,row.refs?.length&&`Referências: ${row.refs.join(', ')}`].filter(Boolean).join('\n')));box.querySelector('[data-person-edit]')?.addEventListener('click',async()=>{const name=prompt('Nome:',row.name);if(name===null)return;const summary=prompt('Resumo biográfico:',row.summary);if(summary===null)return;await peoplePutMany([{...row,name,summary}]);await renderPeople()});box.querySelectorAll('[data-person-ref]').forEach(b=>b.onclick=async()=>{activate('reader');$("#bRef").value=b.dataset.personRef;current=await bibleRef(b.dataset.personRef);$("#bOut").textContent=formatVerses(current)||'Passagem não encontrada na Bíblia local.'});box.querySelector('[data-person-map]')?.addEventListener('click',()=>{activate('maps');if($("#bxMapQuery"))$("#bxMapQuery").value=row.places?.[0]||row.name;setTimeout(()=>renderMaps(),0)});box.querySelector('[data-person-context]')?.addEventListener('click',()=>{activate('context');if($("#bxContextQuery"))$("#bxContextQuery").value=row.refs?.[0]||row.name;setTimeout(()=>renderContext(),0)});box.querySelector('[data-person-comments]')?.addEventListener('click',()=>{activate('comments');if($("#bxCommentsQuery"))$("#bxCommentsQuery").value=row.name;setTimeout(()=>renderComments(),0)});box.querySelector('[data-person-dna]')?.addEventListener('click',()=>{activate('dna');if($("#bxDnaRef")&&row.refs?.[0])$("#bxDnaRef").value=row.refs[0];setTimeout(()=>dnaLoadSaved(),0)})};
 const renderPeople=async(q='')=>{const list=$("#bxPeopleList");if(!list)return;let rows=await peopleAll();const term=String(q||$("#bxPeopleQuery")?.value||'').trim().toLowerCase();if(peopleRole!=='all')rows=rows.filter(x=>x.role===peopleRole);if(term)rows=rows.filter(x=>[x.name,x.meaning,x.role,x.period,x.summary,x.notes,...(x.family||[]),...(x.places||[]),...(x.events||[]),...(x.refs||[]),...(x.virtues||[]),...(x.failures||[]),...(x.lessons||[]),...(x.related||[])].some(v=>String(v||'').toLowerCase().includes(term)));rows.sort((a,b)=>String(a.name).localeCompare(String(b.name),'pt-BR'));const c=$("#bxPeopleCount");if(c)c.textContent=`${rows.length} personagem${rows.length===1?'':'s'}`;if(!rows.length){list.innerHTML='<div class="bx-people-empty">Nenhum personagem encontrado no banco local.</div>';return}list.innerHTML=rows.slice(0,500).map(x=>`<button class="bx-people-item" data-person-id="${escapeHtml(x.id)}"><span>${personRoleIcon(x.role)}</span><div><strong>${escapeHtml(x.name)}</strong><small>${escapeHtml([personRoleLabel(x.role),x.period,x.meaning].filter(Boolean).join(' • '))}</small>${x.summary?`<p>${escapeHtml(x.summary.slice(0,135))}${x.summary.length>135?'…':''}</p>`:''}</div><b>›</b></button>`).join('');list.querySelectorAll('[data-person-id]').forEach(b=>b.onclick=()=>{list.querySelectorAll('.bx-people-item').forEach(x=>x.classList.toggle('active',x===b));personDetail(rows.find(x=>x.id===b.dataset.personId))});if(rows.length===1)list.querySelector('[data-person-id]')?.click()};
 $("#bxPeopleFind")?.addEventListener('click',()=>renderPeople($("#bxPeopleQuery").value));$("#bxPeopleQuery")?.addEventListener('keydown',e=>{if(e.key==='Enter')renderPeople(e.target.value)});document.querySelectorAll('[data-people-role]').forEach(b=>b.onclick=()=>{peopleRole=b.dataset.peopleRole;document.querySelectorAll('[data-people-role]').forEach(x=>x.classList.toggle('active',x===b));renderPeople()});
 $("#bxPeopleExample")?.addEventListener('click',async()=>{await peoplePutMany([{id:'moises',name:'Moisés',meaning:'Tirado das águas',role:'profeta',period:'Êxodo e peregrinação no deserto',summary:'Líder de Israel no êxodo do Egito, mediador da aliança no Sinai e figura central do Pentateuco.',family:['Anrão — pai','Joquebede — mãe','Arão — irmão','Miriã — irmã','Zípora — esposa'],places:['Egito','Midiã','Sinai','Deserto'],events:['Chamado na sarça ardente','Êxodo do Egito','Travessia do mar','Aliança no Sinai','Peregrinação no deserto'],refs:['Êxodo 3:1-15','Êxodo 14:13-31','Êxodo 19:1-20','Deuteronômio 34:1-12'],virtues:['Fidelidade ao chamado','Intercessão pelo povo','Perseverança'],failures:['Resistência inicial ao chamado','Episódio das águas de Meribá'],lessons:['Liderança dependente de Deus','Intercessão e responsabilidade','Obediência importa mesmo no fim da jornada'],related:['Arão','Miriã','Josué']},{id:'davi',name:'Davi',meaning:'Amado',role:'rei',period:'Monarquia unida de Israel',summary:'Pastor, guerreiro e rei de Israel, ligado à consolidação de Jerusalém e à esperança davídica.',family:['Jessé — pai','Salomão — filho','Jônatas — amigo e aliado'],places:['Belém','Jerusalém','Hebrom'],events:['Unção por Samuel','Vitória sobre Golias','Reinado em Hebrom','Jerusalém como capital'],refs:['1 Samuel 16:1-13','1 Samuel 17:32-51','2 Samuel 5:1-10','2 Samuel 7:8-17'],virtues:['Coragem','Adoração','Arrependimento'],failures:['Adultério com Bate-Seba','Morte de Urias'],lessons:['O coração deve permanecer dependente de Deus','Arrependimento não elimina todas as consequências'],related:['Samuel','Saul','Jônatas','Salomão']},{id:'paulo',name:'Paulo',meaning:'Pequeno',role:'apostolo',period:'Século I d.C.',summary:'Apóstolo missionário do cristianismo primitivo, autor de cartas do Novo Testamento e protagonista de grande parte de Atos.',places:['Tarso','Jerusalém','Damasco','Antioquia','Corinto','Éfeso','Roma'],events:['Encontro no caminho de Damasco','Viagens missionárias','Concílio de Jerusalém','Prisão e viagem a Roma'],refs:['Atos 9:1-22','Atos 13:1-4','Atos 17:16-34','Atos 28:16-31'],virtues:['Zelo missionário','Perseverança','Clareza doutrinária'],failures:['Perseguição inicial aos cristãos'],lessons:['A graça transforma trajetórias','Missão exige perseverança e contextualização'],related:['Barnabé','Silas','Timóteo','Lucas']},{id:'ester',name:'Ester',meaning:'Possivelmente estrela',role:'mulher',period:'Período persa',summary:'Rainha judia na Pérsia que intercedeu por seu povo diante de uma ameaça de extermínio.',family:['Mardoqueu — primo e tutor'],places:['Susã'],events:['Escolhida rainha','Jejum antes de comparecer ao rei','Intercessão pelo povo judeu'],refs:['Ester 2:5-18','Ester 4:13-17','Ester 7:1-6'],virtues:['Coragem','Sabedoria','Solidariedade com seu povo'],lessons:['Coragem pode exigir risco pessoal','Responsabilidade cresce com a posição recebida'],related:['Mardoqueu','Assuero','Hamã']}]);await renderPeople()});
 $("#bxPeopleNew")?.addEventListener('click',async()=>{const name=prompt('Nome do personagem:','');if(!name)return;const role=prompt('Função/categoria: patriarca, profeta, rei, apostolo, discipulo, mulher ou outro','outro');if(role===null)return;const summary=prompt('Resumo biográfico:','');if(summary===null)return;await peoplePutMany([{name,role,summary}]);await renderPeople()});
 $("#bxPeopleImport")?.addEventListener('click',async()=>{const f=$("#bxPeopleFile")?.files?.[0];if(!f)return alert('Escolha um JSON de personagens.');try{const j=JSON.parse(await f.text()),rows=Array.isArray(j)?j:(j.people||j.personagens||j.characters||[]),n=await peoplePutMany(rows);alert(`${n} personagem(ns) importado(s).`);await renderPeople()}catch(e){alert('Falha ao importar personagens: '+e.message)}});$("#bxPeopleExport")?.addEventListener('click',async()=>download('biblia-x-personagens.json',JSON.stringify(await peopleAll(),null,2),'application/json'));$("#bxPeopleClear")?.addEventListener('click',async()=>{if(!confirm('Limpar todos os personagens locais?'))return;await peopleClear();await renderPeople();const d=$("#bxPeopleDetail");if(d)d.innerHTML='<div class="bx-people-detail-empty"><span>👤</span><h4>Banco de personagens limpo</h4></div>'});
 // ETAPA 11 • LINHA DO TEMPO X
 let timelineType='all';
 const timeTypeIcon=t=>({period:'⌛',event:'✦',king:'👑',prophet:'📜',book:'📖',empire:'🏛',journey:'➜'}[t]||'•');
 const timeTypeLabel=t=>({period:'Período',event:'Evento',king:'Rei / reinado',prophet:'Profeta',book:'Livro',empire:'Império',journey:'Viagem'}[t]||'Registro');
 const timelineYearLabel=x=>{if(x.displayDate)return x.displayDate;const one=y=>y===0?'Data não definida':(y<0?`${Math.abs(y)} a.C.`:`${y} d.C.`);return x.endYear&&x.endYear!==x.startYear?`${one(x.startYear)} – ${one(x.endYear)}`:one(x.startYear)};
 const timelineDetail=row=>{const box=$("#bxTimelineDetail");if(!box||!row)return;const chips=(title,items,ico)=>items?.length?`<section class="bx-time-block"><h5>${title}</h5><div>${items.map(x=>`<span>${ico} ${escapeHtml(x)}</span>`).join('')}</div></section>`:'';box.innerHTML=`<div class="bx-time-detail-head"><div><span>${timeTypeIcon(row.type)} ${escapeHtml(timeTypeLabel(row.type))}</span><h4>${escapeHtml(row.title)}</h4><small>${row.approximate?'≈ ':''}${escapeHtml(timelineYearLabel(row))}${row.era?' • '+escapeHtml(row.era):''}</small></div><button class="btn danger" data-time-delete>Excluir</button></div>${row.summary?`<article class="bx-time-summary">${escapeHtml(row.summary).replace(/\n/g,'<br>')}</article>`:''}${chips('Personagens',row.people,'👤')}${chips('Lugares',row.places,'📍')}${chips('Livros relacionados',row.books,'📖')}${row.refs?.length?`<section class="bx-time-refs"><h5>Referências bíblicas</h5><div>${row.refs.map(x=>`<button data-time-ref="${escapeHtml(x)}">${escapeHtml(x)}</button>`).join('')}</div></section>`:''}${chips('Conexões cronológicas',row.related,'↔')}${row.notes?`<section class="bx-time-notes"><h5>Notas</h5><p>${escapeHtml(row.notes)}</p></section>`:''}<div class="row bx-time-actions"><button class="btn secondary" data-time-copy>Copiar ficha</button><button class="btn secondary" data-time-edit>Editar</button><button class="btn secondary" data-time-people>👤 Personagens</button><button class="btn secondary" data-time-map>🗺️ Mapas</button><button class="btn secondary" data-time-context>🧭 Contexto</button><button class="btn secondary" data-time-dna>🧬 DNA K7</button></div>`;box.querySelector('[data-time-delete]')?.addEventListener('click',async()=>{if(!confirm(`Excluir ${row.title} da cronologia local?`))return;await timelineDelete(row.id);box.innerHTML='<div class="bx-timeline-detail-empty"><span>🕰️</span><h4>Registro removido</h4></div>';await renderTimeline()});box.querySelector('[data-time-copy]')?.addEventListener('click',()=>navigator.clipboard?.writeText([row.title,timelineYearLabel(row),row.summary,row.refs?.length&&`Referências: ${row.refs.join(', ')}`].filter(Boolean).join('\n')));box.querySelector('[data-time-edit]')?.addEventListener('click',async()=>{const title=prompt('Título:',row.title);if(title===null)return;const displayDate=prompt('Data exibida:',row.displayDate||timelineYearLabel(row));if(displayDate===null)return;const summary=prompt('Resumo:',row.summary);if(summary===null)return;await timelinePutMany([{...row,title,displayDate,summary}]);await renderTimeline()});box.querySelectorAll('[data-time-ref]').forEach(b=>b.onclick=async()=>{activate('reader');if($("#bRef"))$("#bRef").value=b.dataset.timeRef;current=await bibleRef(b.dataset.timeRef);if($("#bOut"))$("#bOut").textContent=formatVerses(current)||'Passagem não encontrada na Bíblia local.'});box.querySelector('[data-time-people]')?.addEventListener('click',()=>{activate('people');if($("#bxPeopleQuery"))$("#bxPeopleQuery").value=row.people?.[0]||row.title;setTimeout(()=>renderPeople(),0)});box.querySelector('[data-time-map]')?.addEventListener('click',()=>{activate('maps');if($("#bxMapQuery"))$("#bxMapQuery").value=row.places?.[0]||row.title;setTimeout(()=>renderMaps(),0)});box.querySelector('[data-time-context]')?.addEventListener('click',()=>{activate('context');if($("#bxContextQuery"))$("#bxContextQuery").value=row.refs?.[0]||row.title;setTimeout(()=>renderContext(),0)});box.querySelector('[data-time-dna]')?.addEventListener('click',()=>{activate('dna');if($("#bxDnaRef")&&row.refs?.[0])$("#bxDnaRef").value=row.refs[0];setTimeout(()=>dnaLoadSaved(),0)})};
 const renderTimeline=async(q='')=>{const list=$("#bxTimelineList");if(!list)return;let rows=await timelineAll();const term=String(q||$("#bxTimelineQuery")?.value||'').trim().toLowerCase(),era=$("#bxTimelineEra")?.value||'all';if(timelineType!=='all')rows=rows.filter(x=>x.type===timelineType);if(era!=='all')rows=rows.filter(x=>x.era===era);if(term)rows=rows.filter(x=>[x.title,x.type,x.era,x.displayDate,x.summary,x.notes,...(x.people||[]),...(x.places||[]),...(x.books||[]),...(x.refs||[]),...(x.related||[])].some(v=>String(v||'').toLowerCase().includes(term)));rows.sort((a,b)=>Number(a.startYear||0)-Number(b.startYear||0)||String(a.title).localeCompare(String(b.title),'pt-BR'));const c=$("#bxTimelineCount");if(c)c.textContent=`${rows.length} registro${rows.length===1?'':'s'}`;if(!rows.length){list.innerHTML='<div class="bx-timeline-empty">Nenhum registro encontrado na cronologia local.</div>';return}list.innerHTML=`<div class="bx-time-axis"></div>`+rows.slice(0,600).map(x=>`<button class="bx-time-item ${String(x.testament).toUpperCase()==='NT'?'is-nt':'is-at'}" data-time-id="${escapeHtml(x.id)}"><span class="bx-time-dot"></span><div class="bx-time-date">${x.approximate?'≈ ':''}${escapeHtml(timelineYearLabel(x))}</div><div class="bx-time-card"><small>${timeTypeIcon(x.type)} ${escapeHtml(timeTypeLabel(x.type))}</small><strong>${escapeHtml(x.title)}</strong>${x.summary?`<p>${escapeHtml(x.summary.slice(0,145))}${x.summary.length>145?'…':''}</p>`:''}<em>${escapeHtml([x.era,(x.people||[]).slice(0,2).join(', ')].filter(Boolean).join(' • '))}</em></div></button>`).join('');list.querySelectorAll('[data-time-id]').forEach(b=>b.onclick=()=>{list.querySelectorAll('.bx-time-item').forEach(x=>x.classList.toggle('active',x===b));timelineDetail(rows.find(x=>x.id===b.dataset.timeId))});if(rows.length===1)list.querySelector('[data-time-id]')?.click()};
 $("#bxTimelineFind")?.addEventListener('click',()=>renderTimeline($("#bxTimelineQuery")?.value));$("#bxTimelineQuery")?.addEventListener('keydown',e=>{if(e.key==='Enter')renderTimeline(e.target.value)});$("#bxTimelineEra")?.addEventListener('change',()=>renderTimeline());document.querySelectorAll('[data-time-type]').forEach(b=>b.onclick=()=>{timelineType=b.dataset.timeType;document.querySelectorAll('[data-time-type]').forEach(x=>x.classList.toggle('active',x===b));renderTimeline()});document.querySelectorAll('[data-bible-section="timeline"]').forEach(btn=>btn.addEventListener('click',()=>setTimeout(()=>renderTimeline(),0)));
 $("#bxTimelineExample")?.addEventListener('click',async()=>{await timelinePutMany([{id:'patriarcas',title:'Era dos Patriarcas',type:'period',era:'patriarchs',startYear:-2000,endYear:-1700,displayDate:'c. 2000–1700 a.C.',approximate:true,testament:'AT',summary:'Período associado às narrativas de Abraão, Isaque, Jacó e José.',people:['Abraão','Isaque','Jacó','José'],places:['Canaã','Harã','Egito'],books:['Gênesis'],refs:['Gênesis 12:1-9','Gênesis 37:1-36']},{id:'exodo',title:'Êxodo do Egito',type:'event',era:'exodus',startYear:-1400,endYear:-1200,displayDate:'data debatida • 2º milênio a.C.',approximate:true,testament:'AT',summary:'Saída de Israel do Egito, travessia, aliança no Sinai e início da peregrinação no deserto. A datação histórica é discutida.',people:['Moisés','Arão','Miriã'],places:['Egito','Sinai','Deserto'],books:['Êxodo','Levítico','Números','Deuteronômio'],refs:['Êxodo 12:31-42','Êxodo 19:1-20']},{id:'davi-rei',title:'Reinado de Davi',type:'king',era:'monarchy',startYear:-1010,endYear:-970,displayDate:'c. 1010–970 a.C.',approximate:true,testament:'AT',summary:'Consolidação da monarquia, Jerusalém como capital e estabelecimento da dinastia davídica.',people:['Davi','Natã','Salomão'],places:['Hebrom','Jerusalém'],books:['1 Samuel','2 Samuel','1 Crônicas'],refs:['2 Samuel 5:1-10','2 Samuel 7:8-17']},{id:'exilio-babilonico',title:'Exílio Babilônico',type:'period',era:'exile',startYear:-586,endYear:-539,displayDate:'586–539 a.C.',approximate:false,testament:'AT',summary:'Período de domínio babilônico após a queda de Jerusalém, seguido pela ascensão persa e retorno de grupos judaítas.',people:['Jeremias','Ezequiel','Daniel','Ciro'],places:['Jerusalém','Babilônia'],books:['Jeremias','Ezequiel','Daniel','Esdras'],refs:['2 Reis 25:1-21','Esdras 1:1-4']},{id:'ministerio-jesus',title:'Ministério público de Jesus',type:'period',era:'jesus',startYear:27,endYear:30,displayDate:'c. 27–30 d.C.',approximate:true,testament:'NT',summary:'Pregação, ensino, sinais, formação dos discípulos, paixão, morte e ressurreição narrados nos Evangelhos.',people:['Jesus','Pedro','João','Tiago'],places:['Galileia','Jerusalém'],books:['Mateus','Marcos','Lucas','João'],refs:['Marcos 1:14-20','Lucas 4:14-21','João 20:1-18']},{id:'paulo-damasco',title:'Conversão e chamado de Paulo',type:'event',era:'church',startYear:34,endYear:36,displayDate:'c. 34–36 d.C.',approximate:true,testament:'NT',summary:'Encontro de Saulo com Cristo no caminho de Damasco e início de uma nova trajetória de testemunho e missão.',people:['Paulo','Ananias'],places:['Damasco'],books:['Atos'],refs:['Atos 9:1-22']},{id:'viagens-paulo',title:'Viagens missionárias de Paulo',type:'journey',era:'church',startYear:46,endYear:57,displayDate:'c. 46–57 d.C.',approximate:true,testament:'NT',summary:'Ciclos missionários narrados em Atos, envolvendo cidades da Ásia Menor, Macedônia e Acaia.',people:['Paulo','Barnabé','Silas','Timóteo','Lucas'],places:['Antioquia','Éfeso','Corinto','Filipos'],books:['Atos'],refs:['Atos 13:1-4','Atos 16:6-15','Atos 18:1-11','Atos 19:1-10']}]);await renderTimeline()});
 $("#bxTimelineNew")?.addEventListener('click',async()=>{const title=prompt('Título do período ou acontecimento:','');if(!title)return;const type=prompt('Tipo: period, event, king, prophet, book, empire ou journey','event');if(type===null)return;const displayDate=prompt('Data exibida (ex.: c. 1000 a.C.):','');if(displayDate===null)return;const summary=prompt('Resumo:','');if(summary===null)return;await timelinePutMany([{title,type,displayDate,summary,approximate:true}]);await renderTimeline()});
 $("#bxTimelineImport")?.addEventListener('click',async()=>{const f=$("#bxTimelineFile")?.files?.[0];if(!f)return alert('Escolha um JSON de cronologia.');try{const j=JSON.parse(await f.text()),rows=Array.isArray(j)?j:(j.timeline||j.chronology||j.cronologia||[]),n=await timelinePutMany(rows);alert(`${n} registro(s) cronológico(s) importado(s).`);await renderTimeline()}catch(e){alert('Falha ao importar linha do tempo: '+e.message)}});$("#bxTimelineExport")?.addEventListener('click',async()=>download('biblia-x-linha-do-tempo.json',JSON.stringify(await timelineAll(),null,2),'application/json'));$("#bxTimelineClear")?.addEventListener('click',async()=>{if(!confirm('Limpar toda a Linha do Tempo local?'))return;await timelineClear();await renderTimeline();const d=$("#bxTimelineDetail");if(d)d.innerHTML='<div class="bx-timeline-detail-empty"><span>🕰️</span><h4>Cronologia limpa</h4></div>'});

 document.querySelectorAll('[data-bible-section="people"]').forEach(btn=>btn.addEventListener('click',()=>setTimeout(()=>renderPeople(),0)));
 let mediaType='all',mediaObjectUrls=[];
 const mediaIcon=t=>({image:'🖼',video:'🎬',audio:'🎧',document:'📄'}[t]||'🎥');
 const revokeMediaUrls=()=>{mediaObjectUrls.forEach(u=>{try{URL.revokeObjectURL(u)}catch{}});mediaObjectUrls=[]};
 const mediaUrl=row=>{if(!row?.blob)return '';const u=URL.createObjectURL(row.blob);mediaObjectUrls.push(u);return u};
 const mediaPreview=row=>{const box=$("#bxMediaDetail");if(!box||!row)return;revokeMediaUrls();const url=mediaUrl(row);let player='';if(row.type==='image'&&url)player=`<img class="bx-media-preview-img" src="${url}" alt="${escapeHtml(row.title)}">`;else if(row.type==='video'&&url)player=`<video class="bx-media-preview-video" src="${url}" controls playsinline></video>`;else if(row.type==='audio'&&url)player=`<div class="bx-media-audio-wrap"><span>🎧</span><audio src="${url}" controls></audio></div>`;else player=`<div class="bx-media-file-wrap"><span>${mediaIcon(row.type)}</span><p>${row.blob?'Arquivo armazenado localmente.':'Registro de exemplo sem arquivo binário.'}</p>${url?`<a class="btn secondary" href="${url}" download="${escapeHtml(row.title)}">Abrir arquivo</a>`:''}</div>`;box.innerHTML=`<div class="bx-media-detail-head"><div><span>${mediaIcon(row.type)} ${escapeHtml(String(row.type||'mídia').toUpperCase())}</span><h4>${escapeHtml(row.title)}</h4><small>${escapeHtml([row.reference,row.mime,row.size?Math.round(row.size/1024)+' KB':''].filter(Boolean).join(' • '))}</small></div><button class="btn danger" data-media-delete>Excluir</button></div>${player}${row.description?`<p class="bx-media-description">${escapeHtml(row.description)}</p>`:''}<div class="bx-media-meta"><div><span>Referência</span><b>${escapeHtml(row.reference||'—')}</b></div><div><span>Créditos</span><b>${escapeHtml(row.credits||'—')}</b></div><div><span>Licença</span><b>${escapeHtml(row.license||'—')}</b></div></div>${row.tags?.length?`<section class="bx-media-tags"><span>Palavras-chave</span><div>${row.tags.map(x=>`<i>${escapeHtml(x)}</i>`).join('')}</div></section>`:''}<div class="row bx-media-actions">${row.reference?`<button class="btn primary" data-media-open-ref>📖 Abrir passagem</button>`:''}<button class="btn secondary" data-media-copy>Copiar ficha</button></div>`;box.querySelector('[data-media-delete]')?.addEventListener('click',async()=>{if(!confirm(`Excluir "${row.title}" da Mídia X?`))return;await mediaDelete(row.id);box.innerHTML='<div class="bx-media-detail-empty"><span>🎥</span><h4>Item removido</h4><p>Selecione outro item da biblioteca.</p></div>';await renderMedia()});box.querySelector('[data-media-open-ref]')?.addEventListener('click',async()=>{activate('reader');$("#bRef").value=row.reference;current=await bibleRef(row.reference);$("#bOut").textContent=formatVerses(current)||'Passagem não encontrada na Bíblia local.'});box.querySelector('[data-media-copy]')?.addEventListener('click',()=>navigator.clipboard?.writeText([row.title,row.reference,row.description,row.credits,row.license,(row.tags||[]).join(', ')].filter(Boolean).join('\n')))};
 const renderMedia=async(q='')=>{const grid=$("#bxMediaGrid");if(!grid)return;let rows=await mediaAll();const term=String(q||$("#bxMediaQuery")?.value||'').trim().toLowerCase();if(mediaType!=='all')rows=rows.filter(x=>x.type===mediaType);if(term)rows=rows.filter(x=>[x.title,x.reference,x.description,x.credits,x.license,x.mime,...(x.tags||[])].some(v=>String(v||'').toLowerCase().includes(term)));rows.sort((a,b)=>String(b.createdAt||'').localeCompare(String(a.createdAt||'')));const c=$("#bxMediaCount");if(c)c.textContent=`${rows.length} ${rows.length===1?'item':'itens'}`;if(!rows.length){grid.innerHTML='<div class="bx-media-empty">Nenhuma mídia encontrada na biblioteca local.</div>';return}grid.innerHTML=rows.slice(0,300).map(x=>`<button class="bx-media-card" data-media-id="${escapeHtml(x.id)}"><span class="bx-media-thumb">${mediaIcon(x.type)}</span><div><strong>${escapeHtml(x.title)}</strong><small>${escapeHtml([x.reference,x.mime].filter(Boolean).join(' • ')||'Mídia local')}</small>${x.description?`<p>${escapeHtml(x.description.slice(0,120))}</p>`:''}</div></button>`).join('');grid.querySelectorAll('[data-media-id]').forEach(b=>b.onclick=()=>{const r=rows.find(x=>x.id===b.dataset.mediaId);grid.querySelectorAll('.bx-media-card').forEach(x=>x.classList.toggle('active',x===b));mediaPreview(r)});if(rows.length===1)grid.querySelector('[data-media-id]')?.click()};
 $("#bxMediaFind")?.addEventListener('click',()=>renderMedia($("#bxMediaQuery").value));$("#bxMediaQuery")?.addEventListener('keydown',e=>{if(e.key==='Enter')renderMedia(e.target.value)});document.querySelectorAll('[data-media-type]').forEach(b=>b.onclick=()=>{mediaType=b.dataset.mediaType;document.querySelectorAll('[data-media-type]').forEach(x=>x.classList.toggle('active',x===b));renderMedia()});
 $("#bxMediaAdd")?.addEventListener('click',async()=>{const files=[...($("#bxMediaFiles")?.files||[])];if(!files.length)return alert('Escolha uma ou mais imagens, vídeos ou áudios.');const reference=normalizeBibleRef($("#bxMediaRef")?.value),description=$("#bxMediaDesc")?.value||'',tags=String($("#bxMediaTags")?.value||'').split(',').map(x=>x.trim()).filter(Boolean),credits=$("#bxMediaCredits")?.value||'',license=$("#bxMediaLicense")?.value||'';const rows=files.map((f,i)=>({id:`local-${Date.now()}-${i}-${Math.random().toString(36).slice(2,7)}`,title:f.name,type:mediaKindFromMime(f.type),mime:f.type,reference,description,tags,credits,license,blob:f,size:f.size,createdAt:new Date().toISOString()}));try{await mediaPutMany(rows);$("#bxMediaFiles").value='';alert(`${rows.length} arquivo(s) adicionado(s) à Mídia X.`);await renderMedia()}catch(e){alert('Falha ao armazenar mídia: '+e.message+'\nSe o arquivo for muito grande, o limite de armazenamento do navegador pode ter sido atingido.')}});
 $("#bxMediaExample")?.addEventListener('click',async()=>{await mediaPutMany([{id:'media-ex-jerusalem',title:'Jerusalém • referência visual',type:'image',mime:'image/example',reference:'Salmos 122',description:'Registro demonstrativo para organizar futuras imagens de Jerusalém. Adicione um arquivo local autorizado para ter visualização real.',tags:['jerusalém','templo','cidade'],credits:'Exemplo local',license:'Substitua por mídia com licença adequada'},{id:'media-ex-audio',title:'Áudio de estudo • Isaías 6',type:'audio',mime:'audio/example',reference:'Isaías 6',description:'Registro demonstrativo para associar gravações de estudo à passagem.',tags:['isaías','chamado','estudo'],credits:'Exemplo local',license:'Sem arquivo binário'}]);await renderMedia()});
 $("#bxMediaExport")?.addEventListener('click',async()=>{const rows=(await mediaAll()).map(({blob,...x})=>({...x,hasLocalFile:!!blob}));download('biblia-x-midia-indice.json',JSON.stringify(rows,null,2),'application/json')});$("#bxMediaClear")?.addEventListener('click',async()=>{if(!confirm('Limpar toda a biblioteca Mídia X deste navegador?'))return;revokeMediaUrls();await mediaClear();await renderMedia();const d=$("#bxMediaDetail");if(d)d.innerHTML='<div class="bx-media-detail-empty"><span>🎥</span><h4>Mídia X limpa</h4><p>Nenhum arquivo local armazenado.</p></div>'});
 document.querySelectorAll('[data-bible-section="media"]').forEach(btn=>btn.addEventListener('click',()=>setTimeout(()=>renderMedia(),0)));

 // ETAPA 13 • FAVORITOS X
 let exploreType='all';
 const exploreExamples=[
  {id:'exodus-route',title:'Do Egito ao Sinai',type:'journey',period:'Êxodo / deserto',summary:'Explore a saída do Egito, a travessia e o caminho até o Sinai conectando texto, lugares e cronologia.',refs:['Êxodo 12','Êxodo 14','Êxodo 19'],places:['Egito','Mar Vermelho','Sinai'],people:['Moisés','Arão'],timeline:['Êxodo do Egito'],mediaTags:['êxodo','sinai'],themes:['libertação','aliança']},
  {id:'jerusalem-temple',title:'Jerusalém e o Templo',type:'place',period:'Monarquia ao período do NT',summary:'Um ponto de exploração para passagens, acontecimentos e personagens relacionados a Jerusalém e ao Templo.',refs:['2 Samuel 5','1 Reis 8','Lucas 19'],places:['Jerusalém','Templo'],people:['Davi','Salomão','Jesus'],timeline:['Reinado de Davi','Ministério de Jesus'],mediaTags:['jerusalém','templo'],themes:['adoração','reino']},
  {id:'isaiah-call',title:'A visão e o chamado de Isaías',type:'scene',period:'Século VIII a.C. (aprox.)',summary:'Conecte a visão de Isaías 6 ao contexto histórico, ao profeta e à preparação homilética.',refs:['Isaías 6'],places:['Jerusalém'],people:['Isaías'],timeline:['Ministério profético de Isaías'],mediaTags:['isaías','templo'],themes:['santidade','chamado','missão']},
  {id:'paul-missions',title:'Viagens missionárias de Paulo',type:'journey',period:'Século I d.C.',summary:'Percorra cidades, acontecimentos e passagens relacionadas às viagens missionárias registradas em Atos.',refs:['Atos 13','Atos 16','Atos 19'],places:['Antioquia','Filipos','Éfeso'],people:['Paulo','Barnabé','Silas'],timeline:['Viagens missionárias de Paulo'],mediaTags:['paulo','missões'],themes:['missão','igreja','evangelização']},
  {id:'resurrection',title:'Ressurreição de Jesus',type:'event',period:'Século I d.C.',summary:'Explore as conexões bíblicas, lugares e personagens associados ao anúncio da ressurreição.',refs:['Mateus 28','Lucas 24','João 20'],places:['Jerusalém'],people:['Jesus','Maria Madalena','Pedro'],timeline:['Ressurreição de Jesus'],mediaTags:['ressurreição','jerusalém'],themes:['ressurreição','esperança','evangelho']},
  {id:'restoration-theme',title:'Restauração',type:'theme',period:'Tema bíblico',summary:'Navegue por passagens e cenários relacionados ao tema da restauração espiritual e comunitária.',refs:['Lamentações 5:21','Joel 2:25','Atos 3:19'],places:['Jerusalém'],people:['Jeremias','Pedro'],timeline:['Exílio Babilônico'],mediaTags:['restauração'],themes:['restauração','arrependimento','renovação']}
 ];
 const exploreDetail=row=>{const box=$("#bxExploreDetail");if(!box||!row)return;const chips=(title,items,attr,ico)=>items?.length?`<section class="bx-explore-block"><h5>${title}</h5><div>${items.map(x=>`<button ${attr}="${escapeHtml(x)}">${ico} ${escapeHtml(x)}</button>`).join('')}</div></section>`:'';box.innerHTML=`<div class="bx-explore-detail-head"><div><span>${exploreTypeIcon(row.type)} ${escapeHtml(exploreTypeLabel(row.type))}</span><h4>${escapeHtml(row.title)}</h4><small>${escapeHtml(row.period||'')}</small></div><button class="btn danger" data-explore-delete>Excluir</button></div>${row.summary?`<article class="bx-explore-summary">${escapeHtml(row.summary).replace(/\n/g,'<br>')}</article>`:''}${chips('Passagens',row.refs,'data-explore-ref','📖')}${chips('Lugares',row.places,'data-explore-place','📍')}${chips('Personagens',row.people,'data-explore-person','👤')}${chips('Linha do Tempo',row.timeline,'data-explore-time','🕰️')}${chips('Mídia relacionada',row.mediaTags,'data-explore-media','🎥')}${chips('Temas',row.themes,'data-explore-theme','💡')}${row.notes?`<section class="bx-explore-notes"><h5>Notas</h5><p>${escapeHtml(row.notes)}</p></section>`:''}<div class="row bx-explore-actions"><button class="btn secondary" data-explore-copy>Copiar ficha</button><button class="btn secondary" data-explore-context>🧭 Contexto</button><button class="btn secondary" data-explore-dna>🧬 DNA K7</button></div>`;
  box.querySelector('[data-explore-delete]')?.addEventListener('click',async()=>{if(!confirm(`Excluir ${row.title} do banco Explorar local?`))return;await exploreDelete(row.id);box.innerHTML='<div class="bx-explore-detail-empty"><span>🌍</span><h4>Experiência removida</h4></div>';await renderExplore()});
  box.querySelector('[data-explore-copy]')?.addEventListener('click',()=>navigator.clipboard?.writeText([row.title,row.period,row.summary,row.refs?.length&&`Passagens: ${row.refs.join(', ')}`,row.places?.length&&`Lugares: ${row.places.join(', ')}`,row.people?.length&&`Personagens: ${row.people.join(', ')}`].filter(Boolean).join('\n')));
  box.querySelectorAll('[data-explore-ref]').forEach(b=>b.onclick=async()=>{activate('reader');if($("#bRef"))$("#bRef").value=b.dataset.exploreRef;current=await bibleRef(b.dataset.exploreRef);if($("#bOut"))$("#bOut").textContent=formatVerses(current)||'Passagem não encontrada na Bíblia local.'});
  box.querySelectorAll('[data-explore-place]').forEach(b=>b.onclick=()=>{activate('maps');if($("#bxMapQuery"))$("#bxMapQuery").value=b.dataset.explorePlace;setTimeout(()=>renderMaps(),0)});
  box.querySelectorAll('[data-explore-person]').forEach(b=>b.onclick=()=>{activate('people');if($("#bxPeopleQuery"))$("#bxPeopleQuery").value=b.dataset.explorePerson;setTimeout(()=>renderPeople(),0)});
  box.querySelectorAll('[data-explore-time]').forEach(b=>b.onclick=()=>{activate('timeline');if($("#bxTimelineQuery"))$("#bxTimelineQuery").value=b.dataset.exploreTime;setTimeout(()=>renderTimeline(),0)});
  box.querySelectorAll('[data-explore-media]').forEach(b=>b.onclick=()=>{activate('media');if($("#bxMediaQuery"))$("#bxMediaQuery").value=b.dataset.exploreMedia;setTimeout(()=>renderMedia(b.dataset.exploreMedia),0)});
  box.querySelector('[data-explore-context]')?.addEventListener('click',()=>{activate('context');if($("#bxContextQuery"))$("#bxContextQuery").value=row.refs?.[0]||row.title;setTimeout(()=>renderContext(),0)});
  box.querySelector('[data-explore-dna]')?.addEventListener('click',()=>{activate('dna');if($("#bxDnaRef")&&row.refs?.[0])$("#bxDnaRef").value=row.refs[0];setTimeout(()=>dnaLoadSaved(),0)});
 };
 const renderExplore=async(q='')=>{const grid=$("#bxExploreGrid");if(!grid)return;let rows=await exploreAll();const query=String(q||$("#bxExploreQuery")?.value||'').trim().toLowerCase();if(exploreType!=='all')rows=rows.filter(x=>x.type===exploreType);if(query)rows=rows.filter(x=>JSON.stringify(x).toLowerCase().includes(query));rows.sort((a,b)=>String(a.title).localeCompare(String(b.title),'pt-BR'));if($("#bxExploreCount"))$("#bxExploreCount").textContent=`${rows.length} ${rows.length===1?'experiência':'experiências'}`;grid.innerHTML=rows.length?rows.map((r,i)=>`<button class="bx-explore-card" data-explore-id="${escapeHtml(r.id)}"><span class="bx-explore-card-no">${String(i+1).padStart(2,'0')}</span><i>${exploreTypeIcon(r.type)}</i><div><small>${escapeHtml(exploreTypeLabel(r.type))}${r.period?' • '+escapeHtml(r.period):''}</small><h5>${escapeHtml(r.title)}</h5><p>${escapeHtml(r.summary||'').slice(0,150)}</p><em>${(r.refs||[]).slice(0,2).map(x=>escapeHtml(x)).join(' • ')||'Explorar conexões'}</em></div><b>→</b></button>`).join(''):'<div class="bx-explore-empty">Nenhuma experiência encontrada.</div>';grid.querySelectorAll('[data-explore-id]').forEach(b=>b.onclick=()=>{const r=rows.find(x=>x.id===b.dataset.exploreId);grid.querySelectorAll('.bx-explore-card').forEach(x=>x.classList.toggle('active',x===b));exploreDetail(r)});if(rows.length===1)grid.querySelector('[data-explore-id]')?.click()};
 $("#bxExploreFind")?.addEventListener('click',()=>renderExplore());$("#bxExploreQuery")?.addEventListener('keydown',e=>{if(e.key==='Enter')renderExplore()});document.querySelectorAll('[data-explore-type]').forEach(b=>b.onclick=()=>{exploreType=b.dataset.exploreType;document.querySelectorAll('[data-explore-type]').forEach(x=>x.classList.toggle('active',x===b));renderExplore()});
 $("#bxExploreExample")?.addEventListener('click',async()=>{await explorePutMany(exploreExamples);await renderExplore();alert('Exemplos de exploração adicionados ao banco local.')});
 $("#bxExploreNew")?.addEventListener('click',async()=>{const title=prompt('Título da experiência:');if(!title)return;const type=prompt('Tipo: scene, journey, event, place ou theme','scene')||'scene';const summary=prompt('Resumo / objetivo da exploração:','')||'';const refs=prompt('Passagens separadas por vírgula:','')||'';const places=prompt('Lugares separados por vírgula:','')||'';const people=prompt('Personagens separados por vírgula:','')||'';await explorePutMany([{title,type,summary,refs,places,people}]);await renderExplore()});
 $("#bxExploreImport")?.addEventListener('click',async()=>{const f=$("#bxExploreFile")?.files?.[0];if(!f)return alert('Escolha um JSON de exploração.');try{const j=JSON.parse(await f.text()),rows=Array.isArray(j)?j:(j.explore||j.experiences||j.explorar||[]),n=await explorePutMany(rows);alert(`${n} experiência(s) importada(s).`);await renderExplore()}catch(e){alert('Falha ao importar Explorar Bíblia: '+e.message)}});
 $("#bxExploreExport")?.addEventListener('click',async()=>download('biblia-x-explorar.json',JSON.stringify(await exploreAll(),null,2),'application/json'));$("#bxExploreClear")?.addEventListener('click',async()=>{if(!confirm('Limpar todas as experiências do Explorar Bíblia X?'))return;await exploreClear();await renderExplore();const d=$("#bxExploreDetail");if(d)d.innerHTML='<div class="bx-explore-detail-empty"><span>🌍</span><h4>Explorar Bíblia limpo</h4></div>'});
 document.querySelectorAll('[data-bible-section="explore"]').forEach(btn=>btn.addEventListener('click',()=>setTimeout(()=>renderExplore(),0)));
 // ETAPA 13 • FAVORITOS X
 let favType='all';
 const favIcon=t=>({verse:'📖',comment:'💬',map:'🗺️',person:'👤',media:'🎥',study:'🧠'}[t]||'⭐');
 const favLabel=t=>({verse:'Passagem',comment:'Comentário',map:'Mapa',person:'Personagem',media:'Mídia',study:'Estudo'}[t]||'Favorito');
 const favCurrentRow=()=>{const ref=current?.length?`${current[0].book} ${current[0].chapter}${current.length===1?':'+current[0].verse:''}`:normalizeBibleRef($('#bRef')?.value||'');const text=current?.length?formatVerses(current):($('#bOut')?.textContent||'');if(!ref)return null;return {type:'verse',title:ref,reference:ref,summary:text,sourceModule:'Bíblia X',tags:['passagem','biblia-x']}};
 const favoriteCurrent=async()=>{const row=favCurrentRow();if(!row)return alert('Abra uma passagem antes de favoritar.');const all=await favoritesAll(),same=all.find(x=>x.type==='verse'&&normalizeBibleRef(x.reference).toLowerCase()===row.reference.toLowerCase());if(same)return alert('Esta passagem já está nos Favoritos X.');await favoritesPutMany([row]);alert('Passagem adicionada aos Favoritos X.');if(document.querySelector('[data-bible-panel="favorites"]')?.classList.contains('active'))await renderFavorites()};
 const favDetail=row=>{const box=$('#bxFavDetail');if(!box||!row)return;box.innerHTML=`<div class="bx-fav-detail-head"><div><span>${favIcon(row.type)} ${escapeHtml(favLabel(row.type))}</span><h4>${escapeHtml(row.title)}</h4><small>${escapeHtml(row.sourceModule||'Bíblia X')} • ${new Date(row.createdAt||Date.now()).toLocaleString('pt-BR')}</small></div><button class="btn danger" data-fav-delete>Excluir</button></div>${row.reference?`<button class="bx-fav-ref" data-fav-open-ref>📖 ${escapeHtml(row.reference)} ↗</button>`:''}${row.summary?`<article class="bx-fav-summary">${escapeHtml(row.summary).replace(/\n/g,'<br>')}</article>`:''}${row.tags?.length?`<div class="bx-fav-tags">${row.tags.map(x=>`<span>${escapeHtml(x)}</span>`).join('')}</div>`:''}${row.note?`<section class="bx-fav-note"><h5>Nota</h5><p>${escapeHtml(row.note)}</p></section>`:''}<div class="row bx-fav-detail-actions"><button class="btn secondary" data-fav-copy>Copiar</button>${row.reference?'<button class="btn secondary" data-fav-studio>⚡ Studio X</button>':''}<button class="btn secondary" data-fav-module>Abrir origem</button></div>`;box.querySelector('[data-fav-delete]')?.addEventListener('click',async()=>{if(!confirm('Remover este favorito?'))return;await favoriteDelete(row.id);await renderFavorites();box.innerHTML='<div class="bx-fav-detail-empty"><span>⭐</span><h4>Favorito removido</h4></div>'});box.querySelector('[data-fav-copy]')?.addEventListener('click',()=>navigator.clipboard?.writeText([row.title,row.reference,row.summary,row.note].filter(Boolean).join('\n\n')));box.querySelector('[data-fav-open-ref]')?.addEventListener('click',async()=>{activate('reader');if($('#bRef'))$('#bRef').value=row.reference;current=await bibleRef(row.reference);if($('#bOut'))$('#bOut').textContent=formatVerses(current)||'Passagem não encontrada na Bíblia local.'});box.querySelector('[data-fav-studio]')?.addEventListener('click',async()=>{if(row.reference){current=await bibleRef(row.reference);if(current.length)return sendStudio()}alert('Importe/abra essa passagem na Bíblia local antes de enviar ao Studio X.')});box.querySelector('[data-fav-module]')?.addEventListener('click',()=>{const map={verse:'reader',comment:'comments',map:'maps',person:'people',media:'media',study:'explore'},target=map[row.type]||'reader';activate(target);document.querySelector(`[data-bible-section="${target}"]`)?.click()})};
 const renderFavorites=async(q='')=>{const list=$('#bxFavList');if(!list)return;let rows=await favoritesAll();const query=String(q||$('#bxFavQuery')?.value||'').trim().toLowerCase();if(favType!=='all')rows=rows.filter(x=>x.type===favType);if(query)rows=rows.filter(x=>JSON.stringify(x).toLowerCase().includes(query));rows.sort((a,b)=>String(b.createdAt||'').localeCompare(String(a.createdAt||'')));if($('#bxFavCount'))$('#bxFavCount').textContent=`${rows.length} ${rows.length===1?'favorito':'favoritos'}`;list.innerHTML=rows.length?rows.map(r=>`<button class="bx-fav-item" data-fav-id="${escapeHtml(r.id)}"><i>${favIcon(r.type)}</i><div><small>${escapeHtml(favLabel(r.type))}${r.reference?' • '+escapeHtml(r.reference):''}</small><h5>${escapeHtml(r.title)}</h5><p>${escapeHtml(r.summary||r.note||'').slice(0,130)}</p></div><b>→</b></button>`).join(''):'<div class="bx-fav-empty">Nenhum favorito encontrado.</div>';list.querySelectorAll('[data-fav-id]').forEach(b=>b.onclick=()=>{const row=rows.find(x=>x.id===b.dataset.favId);list.querySelectorAll('.bx-fav-item').forEach(x=>x.classList.toggle('active',x===b));favDetail(row)});if(rows.length===1)list.querySelector('[data-fav-id]')?.click()};
 $('#bxFavoriteCurrent')?.addEventListener('click',favoriteCurrent);$('#bxFavCurrent')?.addEventListener('click',favoriteCurrent);$('#bxFavFind')?.addEventListener('click',()=>renderFavorites());$('#bxFavQuery')?.addEventListener('keydown',e=>{if(e.key==='Enter')renderFavorites()});document.querySelectorAll('[data-fav-type]').forEach(b=>b.onclick=()=>{favType=b.dataset.favType;document.querySelectorAll('[data-fav-type]').forEach(x=>x.classList.toggle('active',x===b));renderFavorites()});$('#bxFavNew')?.addEventListener('click',async()=>{const title=prompt('Título do favorito:');if(!title)return;const type=prompt('Tipo: verse, comment, map, person, media ou study','study')||'study';const reference=prompt('Referência bíblica (opcional):','')||'';const summary=prompt('Resumo / conteúdo:','')||'';const note=prompt('Nota pessoal (opcional):','')||'';await favoritesPutMany([{title,type,reference,summary,note,sourceModule:'Manual'}]);await renderFavorites()});$('#bxFavImport')?.addEventListener('click',async()=>{const f=$('#bxFavFile')?.files?.[0];if(!f)return alert('Escolha um JSON de favoritos.');try{const j=JSON.parse(await f.text()),rows=Array.isArray(j)?j:(j.favorites||j.favoritos||[]),n=await favoritesPutMany(rows);alert(`${n} favorito(s) importado(s).`);await renderFavorites()}catch(e){alert('Falha ao importar Favoritos X: '+e.message)}});$('#bxFavExport')?.addEventListener('click',async()=>download('biblia-x-favoritos.json',JSON.stringify(await favoritesAll(),null,2),'application/json'));$('#bxFavClear')?.addEventListener('click',async()=>{if(!confirm('Limpar todos os Favoritos X?'))return;await favoritesClear();await renderFavorites();const d=$('#bxFavDetail');if(d)d.innerHTML='<div class="bx-fav-detail-empty"><span>⭐</span><h4>Favoritos limpos</h4></div>'});document.querySelectorAll('[data-bible-section="favorites"]').forEach(btn=>btn.addEventListener('click',()=>setTimeout(()=>renderFavorites(),0)));
 // ETAPA 8 • DNA K7 / STUDIO X
 const noteTypes={study:['📘','Estudo'],sermon:['🎙️','Mensagem'],devotional:['❤️','Devocional'],question:['❓','Pergunta'],personal:['📝','Pessoal']};
 const noteIcon=t=>(noteTypes[t]||noteTypes.personal)[0], noteLabel=t=>(noteTypes[t]||noteTypes.personal)[1];
 const normalizeNote=(r={})=>{const now=new Date().toISOString(),tags=Array.isArray(r.tags)?r.tags:String(r.tags||'').split(/[;,|]/).map(x=>x.trim()).filter(Boolean);return {id:String(r.id||('note-'+Date.now()+'-'+Math.random().toString(36).slice(2,7))),title:String(r.title||'Nota sem título').trim(),type:noteTypes[r.type]?r.type:'personal',reference:normalizeBibleRef(r.reference||r.ref||''),tags,content:String(r.content||r.text||r.note||''),createdAt:String(r.createdAt||r.created||now),updatedAt:String(r.updatedAt||r.updated||now)}};
 const notesAll=async()=>dbAll('notes');
 const notesPutMany=async(rows=[])=>{const clean=rows.map(normalizeNote).filter(x=>x.title||x.content);if(!clean.length)return 0;const db=await openDB();return new Promise((res,rej)=>{const t=db.transaction('notes','readwrite'),st=t.objectStore('notes');clean.forEach(x=>st.put(x));t.oncomplete=()=>res(clean.length);t.onerror=()=>rej(t.error)})};
 const noteDelete=async id=>{const db=await openDB();return new Promise((res,rej)=>{const t=db.transaction('notes','readwrite');t.objectStore('notes').delete(id);t.oncomplete=()=>res(true);t.onerror=()=>rej(t.error)})};
 const notesClear=async()=>{const db=await openDB();return new Promise((res,rej)=>{const t=db.transaction('notes','readwrite');t.objectStore('notes').clear();t.oncomplete=()=>res(true);t.onerror=()=>rej(t.error)})};
 let noteFilter='all';
 const noteReset=(pref={})=>{if($('#bxNoteId'))$('#bxNoteId').value=pref.id||'';if($('#bxNoteMode'))$('#bxNoteMode').textContent=pref.id?'EDITANDO NOTA':'NOVA NOTA';if($('#bxNoteDelete'))$('#bxNoteDelete').hidden=!pref.id;if($('#bxNoteTitle'))$('#bxNoteTitle').value=pref.title||'';if($('#bxNoteType'))$('#bxNoteType').value=pref.type||'study';if($('#bxNoteRef'))$('#bxNoteRef').value=pref.reference||'';if($('#bxNoteTags'))$('#bxNoteTags').value=(pref.tags||[]).join(', ');if($('#bxNoteContent'))$('#bxNoteContent').value=pref.content||'';if($('#bxNoteSaved'))$('#bxNoteSaved').textContent=pref.updatedAt?('Salvo em '+new Date(pref.updatedAt).toLocaleString('pt-BR')):'Ainda não salvo'};
 const noteCurrentRef=()=>normalizeBibleRef(current?.length?`${current[0].book} ${current[0].chapter}:${current[0].verse}${current.length>1?'-'+current[current.length-1].verse:''}`:($('#bRef')?.value||''));
 const renderNotes=async(q='')=>{const list=$('#bxNotesList');if(!list)return;let rows=await notesAll(),term=String(q||$('#bxNotesQuery')?.value||'').trim().toLowerCase();if(noteFilter!=='all')rows=rows.filter(x=>x.type===noteFilter);if(term)rows=rows.filter(x=>JSON.stringify(x).toLowerCase().includes(term));rows.sort((a,b)=>String(b.updatedAt||'').localeCompare(String(a.updatedAt||'')));if($('#bxNotesCount'))$('#bxNotesCount').textContent=`${rows.length} ${rows.length===1?'nota':'notas'}`;list.innerHTML=rows.length?rows.map(r=>`<button class="bx-note-item" data-note-id="${escapeHtml(r.id)}"><i>${noteIcon(r.type)}</i><div><small>${escapeHtml(noteLabel(r.type))}${r.reference?' • '+escapeHtml(r.reference):''}</small><h5>${escapeHtml(r.title)}</h5><p>${escapeHtml(r.content||'').slice(0,140)}</p><em>${new Date(r.updatedAt||r.createdAt).toLocaleString('pt-BR')}</em></div><b>›</b></button>`).join(''):'<div class="bx-notes-empty">Nenhuma nota encontrada.</div>';list.querySelectorAll('[data-note-id]').forEach(b=>b.onclick=()=>{const row=rows.find(x=>x.id===b.dataset.noteId);list.querySelectorAll('.bx-note-item').forEach(x=>x.classList.toggle('active',x===b));noteReset(row)});};
 const saveNote=async()=>{const id=$('#bxNoteId')?.value||'',old=id?(await notesAll()).find(x=>x.id===id):null,row=normalizeNote({id:id||undefined,title:$('#bxNoteTitle')?.value||'Nota sem título',type:$('#bxNoteType')?.value||'personal',reference:$('#bxNoteRef')?.value||'',tags:$('#bxNoteTags')?.value||'',content:$('#bxNoteContent')?.value||'',createdAt:old?.createdAt,updatedAt:new Date().toISOString()});await notesPutMany([row]);noteReset(row);await renderNotes();};
 $('#bxNotesFind')?.addEventListener('click',()=>renderNotes());$('#bxNotesQuery')?.addEventListener('keydown',e=>{if(e.key==='Enter')renderNotes()});document.querySelectorAll('[data-note-type]').forEach(b=>b.onclick=()=>{noteFilter=b.dataset.noteType;document.querySelectorAll('[data-note-type]').forEach(x=>x.classList.toggle('active',x===b));renderNotes()});
 $('#bxNotesNew')?.addEventListener('click',()=>noteReset({type:'personal'}));$('#bxNotesCurrent')?.addEventListener('click',()=>{const ref=noteCurrentRef();noteReset({type:'study',reference:ref,title:ref?`Notas de ${ref}`:'Nova nota bíblica'})});document.querySelectorAll('[data-bible-jump="notes"],[data-bible-section="notes"]').forEach(btn=>btn.addEventListener('click',()=>setTimeout(()=>{if(!$('#bxNoteId')?.value&&!$('#bxNoteRef')?.value){const ref=noteCurrentRef();if(ref)noteReset({type:'study',reference:ref,title:`Notas de ${ref}`})}renderNotes()},0)));
 $('#bxNoteSave')?.addEventListener('click',saveNote);$('#bxNoteDelete')?.addEventListener('click',async()=>{const id=$('#bxNoteId')?.value;if(!id||!confirm('Excluir esta nota?'))return;await noteDelete(id);noteReset({type:'personal'});await renderNotes()});$('#bxNoteOpenRef')?.addEventListener('click',async()=>{const ref=normalizeBibleRef($('#bxNoteRef')?.value||'');if(!ref)return alert('Informe uma referência.');activate('reader');if($('#bRef'))$('#bRef').value=ref;current=await smartBibleRef(ref);if($('#bOut'))$('#bOut').textContent=formatVerses(current)||'Passagem não encontrada na Bíblia local.'});$('#bxNoteStudio')?.addEventListener('click',async()=>{const ref=normalizeBibleRef($('#bxNoteRef')?.value||''),content=$('#bxNoteContent')?.value||'',title=$('#bxNoteTitle')?.value||'Nota Bíblia X';if(ref)current=await smartBibleRef(ref);Store.set('studioPrefill',[ref,content].filter(Boolean).join('\n\n'));const cfg=Object.assign({},Store.get('studioMessageConfig',{}),{sourceMode:ref?'passagem':'tema',text:ref||title,notes:`Origem: Bíblia X • Notas X\n\n${content}`});Store.set('studioMessageConfig',cfg);Store.set('studioStep',3);render('studio')});
 $('#bxNotesImport')?.addEventListener('click',async()=>{const f=$('#bxNotesFile')?.files?.[0];if(!f)return alert('Escolha um JSON de notas.');try{const j=JSON.parse(await f.text()),rows=Array.isArray(j)?j:(j.notes||j.notas||[]),n=await notesPutMany(rows);alert(`${n} nota(s) importada(s).`);await renderNotes()}catch(e){alert('Falha ao importar Notas X: '+e.message)}});$('#bxNotesExport')?.addEventListener('click',async()=>download('biblia-x-notas.json',JSON.stringify(await notesAll(),null,2),'application/json'));$('#bxNotesClear')?.addEventListener('click',async()=>{if(!confirm('Limpar todas as Notas X?'))return;await notesClear();noteReset({type:'personal'});await renderNotes()});
 const normalizeCollection=x=>{x=x||{};return{id:String(x.id||('col-'+Date.now()+'-'+Math.random().toString(36).slice(2,7))),title:String(x.title||x.name||'Coleção sem título').trim(),type:String(x.type||'study'),description:String(x.description||x.summary||''),tags:Array.isArray(x.tags)?x.tags:String(x.tags||'').split(',').map(v=>v.trim()).filter(Boolean),items:Array.isArray(x.items)?x.items:String(x.items||x.refs||'').split(/\n|,/).map(v=>v.trim()).filter(Boolean),createdAt:x.createdAt||new Date().toISOString(),updatedAt:x.updatedAt||new Date().toISOString()}};
 const collectionsAll=async()=>dbAll('collections');
 const collectionsPutMany=async(rows=[])=>{const clean=rows.map(normalizeCollection).filter(x=>x.title);if(!clean.length)return 0;const db=await openDB();return new Promise((res,rej)=>{const t=db.transaction('collections','readwrite'),st=t.objectStore('collections');clean.forEach(x=>st.put(x));t.oncomplete=()=>res(clean.length);t.onerror=()=>rej(t.error)})};
 const collectionDelete=async id=>{const db=await openDB();return new Promise((res,rej)=>{const t=db.transaction('collections','readwrite');t.objectStore('collections').delete(id);t.oncomplete=()=>res(true);t.onerror=()=>rej(t.error)})};
 const collectionsClear=async()=>{const db=await openDB();return new Promise((res,rej)=>{const t=db.transaction('collections','readwrite');t.objectStore('collections').clear();t.oncomplete=()=>res(true);t.onerror=()=>rej(t.error)})};
 const colReset=(r={})=>{if(!$('#bxColId'))return;$('#bxColId').value=r.id||'';$('#bxColTitle').value=r.title||'';$('#bxColType').value=r.type||'study';$('#bxColDescription').value=r.description||'';$('#bxColTags').value=(r.tags||[]).join(', ');$('#bxColItems').value=(r.items||[]).join('\n');$('#bxColMode').textContent=r.id?'EDITANDO COLEÇÃO':'NOVA COLEÇÃO';$('#bxColDelete').hidden=!r.id;$('#bxColSaved').textContent=r.updatedAt?`Salvo • ${new Date(r.updatedAt).toLocaleString('pt-BR')}`:'Ainda não salvo'};
 const renderCollections=async(q='')=>{const list=$('#bxColList');if(!list)return;let rows=await collectionsAll(),term=String(q||$('#bxColQuery')?.value||'').trim().toLowerCase();if(term)rows=rows.filter(x=>JSON.stringify(x).toLowerCase().includes(term));rows.sort((a,b)=>String(b.updatedAt||'').localeCompare(String(a.updatedAt||'')));$('#bxColCount').textContent=`${rows.length} ${rows.length===1?'coleção':'coleções'}`;list.innerHTML=rows.length?rows.map(r=>`<button class="bx-col-item" data-col-id="${escapeHtml(r.id)}"><i>📂</i><div><small>${escapeHtml(r.type)} • ${(r.items||[]).length} itens</small><h5>${escapeHtml(r.title)}</h5><p>${escapeHtml(r.description||'').slice(0,120)}</p><em>${(r.tags||[]).map(t=>'#'+escapeHtml(t)).join(' ')}</em></div><b>›</b></button>`).join(''):'<div class="bx-col-empty">Nenhuma coleção encontrada.</div>';list.querySelectorAll('[data-col-id]').forEach(b=>b.onclick=()=>colReset(rows.find(x=>x.id===b.dataset.colId)))};
 const saveCollection=async()=>{const id=$('#bxColId')?.value||'',old=id?(await collectionsAll()).find(x=>x.id===id):null,row=normalizeCollection({id:id||undefined,title:$('#bxColTitle')?.value,type:$('#bxColType')?.value,description:$('#bxColDescription')?.value,tags:$('#bxColTags')?.value,items:$('#bxColItems')?.value,createdAt:old?.createdAt,updatedAt:new Date().toISOString()});await collectionsPutMany([row]);colReset(row);await renderCollections()};
 document.querySelectorAll('[data-bible-section="collections"]').forEach(btn=>btn.addEventListener('click',()=>setTimeout(()=>renderCollections(),0)));$('#bxColFind')?.addEventListener('click',()=>renderCollections($('#bxColQuery')?.value));$('#bxColQuery')?.addEventListener('keydown',e=>{if(e.key==='Enter')renderCollections(e.target.value)});$('#bxColNew')?.addEventListener('click',()=>colReset({type:'study'}));$('#bxColSave')?.addEventListener('click',saveCollection);$('#bxColAddCurrent')?.addEventListener('click',()=>{const ref=current?.length?`${current[0].book} ${current[0].chapter}:${current[0].verse}`:normalizeBibleRef($('#bRef')?.value||'');if(!ref)return alert('Abra uma passagem primeiro.');const el=$('#bxColItems'),rows=el.value.split('\n').map(x=>x.trim()).filter(Boolean);if(!rows.includes(ref))rows.push(ref);el.value=rows.join('\n')});$('#bxColDelete')?.addEventListener('click',async()=>{const id=$('#bxColId')?.value;if(!id||!confirm('Excluir esta coleção?'))return;await collectionDelete(id);colReset({type:'study'});await renderCollections()});$('#bxColStudio')?.addEventListener('click',()=>{const items=$('#bxColItems')?.value||'',title=$('#bxColTitle')?.value||'Coleção Bíblia X';Store.set('studioPrefill',items);Store.set('studioMessageConfig',Object.assign({},Store.get('studioMessageConfig',{}),{sourceMode:'tema',theme:title,notes:`Origem: Bíblia X • Coleções X\n\n${items}`}));Store.set('studioStep',3);render('studio')});$('#bxColImport')?.addEventListener('click',async()=>{const f=$('#bxColFile')?.files?.[0];if(!f)return alert('Escolha um JSON de coleções.');try{const j=JSON.parse(await f.text()),rows=Array.isArray(j)?j:(j.collections||j.colecoes||[]),n=await collectionsPutMany(rows);alert(`${n} coleção(ões) importada(s).`);await renderCollections()}catch(e){alert('Falha ao importar Coleções X: '+e.message)}});$('#bxColExport')?.addEventListener('click',async()=>download('biblia-x-colecoes.json',JSON.stringify(await collectionsAll(),null,2),'application/json'));$('#bxColClear')?.addEventListener('click',async()=>{if(!confirm('Limpar todas as Coleções X?'))return;await collectionsClear();colReset({type:'study'});await renderCollections()});

 const dnaDefaults={exposicao:82,profundidade:76,aplicacao:78,progressao:80,climax:72,apelo:62};
 const dnaReadState=()=>Object.assign({},dnaDefaults,Store.get("bibleXDnaCharacteristics",{}));
 const dnaPassageFromCurrent=()=>{if(!current?.length)return {ref:normalizeBibleRef($("#bRef")?.value||""),text:"",count:0};const first=current[0],last=current[current.length-1];const ref=`${first.book} ${first.chapter}${current.length===1?':'+first.verse:(first.chapter===last.chapter?':'+first.verse+'-'+last.verse:'')}`;return {ref,text:formatVerses(current),count:current.length}};
 const dnaUpdateSummary=()=>{const chars=dnaReadState(),vals=Object.values(chars).map(Number),score=Math.round(vals.reduce((a,b)=>a+b,0)/Math.max(1,vals.length)),intensity=Number($("#bxDnaIntensity")?.value||Store.get("bibleXDnaIntensity",3)||3),type=$("#bxDnaType")?.value||Store.get("bibleXDnaType","Expositiva"),duration=Number($("#bxDnaDuration")?.value||Store.get("bibleXDnaDuration",40)||40),ref=normalizeBibleRef($("#bxDnaRef")?.value||dnaPassageFromCurrent().ref||"");
   if($("#bxDnaScore"))$("#bxDnaScore").textContent=score;if($("#bxDnaScoreBig"))$("#bxDnaScoreBig").textContent=score;if($("#bxDnaRing"))$("#bxDnaRing").style.setProperty("--dna-score",score+"%");if($("#bxDnaIntensityOut"))$("#bxDnaIntensityOut").textContent=intensity+"/5";if($("#bxDnaSummaryRef"))$("#bxDnaSummaryRef").textContent=ref||"—";if($("#bxDnaSummaryType"))$("#bxDnaSummaryType").textContent=type;if($("#bxDnaSummaryDuration"))$("#bxDnaSummaryDuration").textContent=duration+" min";if($("#bxDnaSummaryIntensity"))$("#bxDnaSummaryIntensity").textContent=intensity+"/5";
 };
 const dnaUseCurrent=async(refOverride="")=>{let ref=normalizeBibleRef(refOverride||$("#bRef")?.value||dnaPassageFromCurrent().ref||"");if(refOverride||(!current?.length&&ref)){current=await smartBibleRef(ref)}const p=dnaPassageFromCurrent();if($("#bxDnaRef"))$("#bxDnaRef").value=ref||p.ref;if($("#bxDnaText"))$("#bxDnaText").textContent=p.text||"Passagem não encontrada na Bíblia local. Importe/abra a tradução e tente novamente.";if($("#bxDnaVerseCount"))$("#bxDnaVerseCount").textContent=`${p.count} ${p.count===1?'versículo':'versículos'}`;Store.set("bibleXDnaReference",ref||p.ref);Store.set("bibleXDnaText",p.text||"");dnaUpdateSummary()};
 const dnaLoadSaved=()=>{const chars=dnaReadState();document.querySelectorAll('[data-bxdna]').forEach(r=>{const v=Number(chars[r.dataset.bxdna]??r.value);r.value=v;const o=document.querySelector(`[data-bxdna-out="${r.dataset.bxdna}"]`);if(o)o.textContent=v+"%";r.style.setProperty('--range-fill',v+'%')});const intensity=Number(Store.get("bibleXDnaIntensity",3)||3),type=Store.get("bibleXDnaType","Expositiva"),duration=Number(Store.get("bibleXDnaDuration",40)||40);if($("#bxDnaIntensity"))$("#bxDnaIntensity").value=intensity;if($("#bxDnaType"))$("#bxDnaType").value=type;if($("#bxDnaDuration"))$("#bxDnaDuration").value=String(duration);if($("#bxDnaGoal"))$("#bxDnaGoal").value=Store.get("bibleXDnaGoal","");if($("#bxDnaNotes"))$("#bxDnaNotes").value=Store.get("bibleXDnaNotes","");const savedRef=Store.get("bibleXDnaReference","");const savedText=Store.get("bibleXDnaText","");if($("#bxDnaRef"))$("#bxDnaRef").value=savedRef||dnaPassageFromCurrent().ref;if($("#bxDnaText")&&savedText)$("#bxDnaText").textContent=savedText;if($("#bxDnaVerseCount")&&savedText)$("#bxDnaVerseCount").textContent=(savedText.split(/\n/).filter(Boolean).length||0)+" versículos";dnaUpdateSummary()};
 const dnaSendToStudio=(step=2)=>{const ref=normalizeBibleRef($("#bxDnaRef")?.value||Store.get("bibleXDnaReference","")||dnaPassageFromCurrent().ref),text=Store.get("bibleXDnaText","")||dnaPassageFromCurrent().text,chars=dnaReadState(),intensity=Number($("#bxDnaIntensity")?.value||3),type=$("#bxDnaType")?.value||"Expositiva",duration=Number($("#bxDnaDuration")?.value||40),goal=$("#bxDnaGoal")?.value||"",notes=$("#bxDnaNotes")?.value||"";if(!ref&&!text)return alert("Abra uma passagem antes de enviar ao Studio X.");Store.set("studioPrefill",text);Store.set("studioDNACharacteristics",{exposicao:chars.exposicao,profundidade:chars.profundidade,aplicacao:chars.aplicacao,progressao:chars.progressao,climax:chars.climax,apelo:chars.apelo});Store.set("studioDNAIntensity",intensity);const cfg=Object.assign({},Store.get("studioMessageConfig",{}),{sourceMode:"passagem",text:ref||text,duration,type,goal,notes:[`Origem: Bíblia X • DNA K7`,text?`Texto selecionado:\n${text}`:"",notes].filter(Boolean).join("\n\n")});Store.set("studioMessageConfig",cfg);Store.set("bibleSelection",current||[]);Store.set("studioStep",step);render("studio")};
 document.querySelectorAll('[data-bible-jump="dna"],[data-bible-section="dna"]').forEach(btn=>btn.addEventListener('click',()=>setTimeout(()=>{dnaLoadSaved();if(!Store.get("bibleXDnaText","")&&current?.length)dnaUseCurrent()},0)));
 document.querySelectorAll('[data-bxdna]').forEach(r=>r.addEventListener('input',()=>{const chars=dnaReadState();chars[r.dataset.bxdna]=Number(r.value);Store.set("bibleXDnaCharacteristics",chars);const o=document.querySelector(`[data-bxdna-out="${r.dataset.bxdna}"]`);if(o)o.textContent=r.value+"%";r.style.setProperty('--range-fill',r.value+'%');dnaUpdateSummary()}));
 $("#bxDnaIntensity")?.addEventListener('input',e=>{Store.set("bibleXDnaIntensity",Number(e.target.value));dnaUpdateSummary()});$("#bxDnaType")?.addEventListener('change',e=>{Store.set("bibleXDnaType",e.target.value);dnaUpdateSummary()});$("#bxDnaDuration")?.addEventListener('change',e=>{Store.set("bibleXDnaDuration",Number(e.target.value));dnaUpdateSummary()});$("#bxDnaGoal")?.addEventListener('input',e=>Store.set("bibleXDnaGoal",e.target.value));$("#bxDnaNotes")?.addEventListener('input',e=>Store.set("bibleXDnaNotes",e.target.value));$("#bxDnaLoad")?.addEventListener('click',()=>dnaUseCurrent($("#bxDnaRef")?.value));$("#bxDnaUseCurrent")?.addEventListener('click',()=>dnaUseCurrent());$("#bxDnaReset")?.addEventListener('click',()=>{Store.set("bibleXDnaCharacteristics",dnaDefaults);Store.set("bibleXDnaIntensity",3);Store.set("bibleXDnaType","Expositiva");Store.set("bibleXDnaDuration",40);Store.set("bibleXDnaGoal","");Store.set("bibleXDnaNotes","");dnaLoadSaved()});$("#bxDnaSend")?.addEventListener('click',()=>dnaSendToStudio(2));$("#bxDnaSendConfig")?.addEventListener('click',()=>dnaSendToStudio(3));
 const bxApplyReading=()=>{const out=$("#bOut"),font=Number(Store.get("bibleFontSize",15))||15,line=Number(Store.get("bibleLineHeight",1.65))||1.65,compact=!!Store.get("bibleCompact",false);if(out){out.style.fontSize=`${font}px`;out.style.lineHeight=String(line);out.classList.toggle("bx-compact-reading",compact)}if($("#bxSetFont"))$("#bxSetFont").value=font;if($("#bxSetFontOut"))$("#bxSetFontOut").textContent=font+"px";if($("#bxSetLine"))$("#bxSetLine").value=line;if($("#bxSetLineOut"))$("#bxSetLineOut").textContent=line.toFixed(2);if($("#bxSetCompact"))$("#bxSetCompact").checked=compact;if($("#bxSetRemember"))$("#bxSetRemember").checked=Store.get("bibleRememberLast",true)!==false};
 const bxDbSnapshot=async()=>{const db=await openDB(),names=Array.from(db.objectStoreNames),data={};for(const name of names){data[name]=await new Promise((res,rej)=>{const r=db.transaction(name,"readonly").objectStore(name).getAll();r.onsuccess=()=>res(r.result||[]);r.onerror=()=>rej(r.error)})}return {schema:"logos-master-x-biblia-x",exportedAt:new Date().toISOString(),dbVersion:db.version,data}};
 const bxRenderStats=async()=>{const box=$("#bxSetStats");if(!box)return;try{const snap=await bxDbSnapshot(),labels={verses:"Versículos",crossrefs:"Referências",strong:"Strong",lexicon:"Léxico",context:"Contexto",maps:"Mapas",media:"Mídias",comments:"Comentários",people:"Personagens",timeline:"Linha do tempo",explore:"Explorar",favorites:"Favoritos",notes:"Notas",collections:"Coleções"};box.innerHTML=Object.entries(snap.data).filter(([k])=>k!=="meta").map(([k,v])=>`<div><span>${labels[k]||k}</span><b>${v.length}</b></div>`).join("")+`<div class="wide"><span>IndexedDB</span><b>v${snap.dbVersion} • disponível offline</b></div>`}catch(e){box.innerHTML=`<span>Falha ao ler diagnóstico: ${escapeHtml(e.message)}</span>`}};
 const bxGlobalCfg={verses:{label:'Bíblia',panel:'reader'},crossrefs:{label:'Referências',panel:'cross'},strong:{label:'Strong',panel:'strong'},lexicon:{label:'Léxico',panel:'lexicon'},context:{label:'Contexto',panel:'context'},comments:{label:'Comentários',panel:'comments'},maps:{label:'Mapas',panel:'maps'},people:{label:'Personagens',panel:'people'},timeline:{label:'Linha do Tempo',panel:'timeline'},explore:{label:'Explorar',panel:'explore'},favorites:{label:'Favoritos',panel:'favorites'},notes:{label:'Notas',panel:'notes'},collections:{label:'Coleções',panel:'collections'}};
 const bxGlobalText=row=>Object.values(row||{}).filter(v=>typeof v==='string'||typeof v==='number'||Array.isArray(v)).flatMap(v=>Array.isArray(v)?v:[v]).join(' ').toLowerCase();
 const bxGlobalSearch=async()=>{const q=String($('#bxGlobalQuery')?.value||'').trim().toLowerCase(),mod=$('#bxGlobalModule')?.value||'all',out=$('#bxGlobalResults');if(!out||!q)return;const stores=mod==='all'?Object.keys(bxGlobalCfg):[mod],rows=[];for(const store of stores){try{for(const row of await dbAll(store)){if(bxGlobalText(row).includes(q))rows.push({store,row})}}catch(e){}}rows.splice(150);$('#bxGlobalTotal').textContent=rows.length;$('#bxGlobalSources').textContent=new Set(rows.map(x=>x.store)).size;if(!rows.length){out.innerHTML='<div class="bx-adv-empty">Nenhum resultado local encontrado.</div>';return}out.innerHTML=rows.map(({store,row},i)=>{const cfg=bxGlobalCfg[store],title=row.title||row.name||row.reference||row.ref||row.number||row.id||cfg.label,sub=row.reference||row.book||row.type||row.language||row.period||'';return `<button class="bx-adv-item" data-global-open="${i}"><strong>${escapeHtml(cfg.label)} • ${escapeHtml(String(title))}</strong><small>${escapeHtml(String(sub))}</small></button>`}).join('');out.querySelectorAll('[data-global-open]').forEach(b=>b.onclick=()=>{const hit=rows[Number(b.dataset.globalOpen)],cfg=bxGlobalCfg[hit.store];activate(cfg.panel);document.querySelector(`[data-bible-section="${cfg.panel}"]`)?.click();const ref=normalizeBibleRef(hit.row.reference||hit.row.ref||'');if(ref&&cfg.panel==='reader'){if($('#bRef'))$('#bRef').value=ref;$('#bOpen')?.click()}})};
 document.querySelectorAll('[data-bible-section="global"]').forEach(btn=>btn.addEventListener('click',()=>setTimeout(()=>$('#bxGlobalQuery')?.focus(),0)));$('#bxGlobalFind')?.addEventListener('click',bxGlobalSearch);$('#bxGlobalQuery')?.addEventListener('keydown',e=>{if(e.key==='Enter')bxGlobalSearch()});
 const bxWords=s=>String(s||'').toLocaleLowerCase('pt-BR').normalize('NFD').replace(/[\u0300-\u036f]/g,'').match(/[a-z0-9À-ÿ]+/gi)||[];
 const bxRenderConc=async(top=false)=>{const all=await dbAll('verses'),out=$('#bxConcOut');if(!out)return;$('#bxConcDb').textContent=all.length.toLocaleString('pt-BR');if(top){const freq=new Map;for(const v of all)for(const w of bxWords(v.text)){if(w.length<3)continue;freq.set(w,(freq.get(w)||0)+1)}const rows=[...freq.entries()].sort((a,b)=>b[1]-a[1]).slice(0,50),max=rows[0]?.[1]||1;$('#bxConcHits').textContent=rows.reduce((a,b)=>a+b[1],0).toLocaleString('pt-BR');$('#bxConcVerses').textContent=all.length.toLocaleString('pt-BR');$('#bxConcBooks').textContent=new Set(all.map(x=>x.book)).size;out.innerHTML=`<div class="bx-conc-table">${rows.map(([w,n])=>`<button class="bx-conc-row" data-conc-word="${escapeHtml(w)}"><b>${escapeHtml(w)}</b><span>${n}</span><span class="bx-conc-bar"><i style="width:${Math.max(2,n/max*100)}%"></i></span></button>`).join('')}</div>`;out.querySelectorAll('[data-conc-word]').forEach(b=>b.onclick=()=>{if($('#bxConcQuery'))$('#bxConcQuery').value=b.dataset.concWord;bxRenderConc(false)});return}const raw=String($('#bxConcQuery')?.value||'').trim();if(!raw)return;const q=raw.toLocaleLowerCase('pt-BR'),hits=all.filter(v=>String(v.text||'').toLocaleLowerCase('pt-BR').includes(q)),occ=hits.reduce((n,v)=>n+(String(v.text||'').toLocaleLowerCase('pt-BR').split(q).length-1),0);$('#bxConcHits').textContent=occ.toLocaleString('pt-BR');$('#bxConcVerses').textContent=hits.length.toLocaleString('pt-BR');$('#bxConcBooks').textContent=new Set(hits.map(x=>x.book)).size;out.innerHTML=hits.length?`<div class="bx-adv-list">${hits.slice(0,250).map(v=>`<button class="bx-adv-item" data-conc-ref="${escapeHtml(v.ref||`${v.book} ${v.chapter}:${v.verse}`)}"><strong>${escapeHtml(v.ref||`${v.book} ${v.chapter}:${v.verse}`)}</strong><small>${escapeHtml(v.text||'')}</small></button>`).join('')}</div>`:'<div class="bx-adv-empty">Nenhuma ocorrência encontrada.</div>';out.querySelectorAll('[data-conc-ref]').forEach(b=>b.onclick=async()=>{activate('reader');if($('#bRef'))$('#bRef').value=b.dataset.concRef;current=await smartBibleRef(b.dataset.concRef);renderBibleVerses(current);setTimeout(()=>document.querySelector(`[data-ref="${CSS.escape(b.dataset.concRef)}"]`)?.scrollIntoView({behavior:"smooth",block:"center"}),30)})};
 $('#bxConcFind')?.addEventListener('click',()=>bxRenderConc(false));$('#bxConcTop')?.addEventListener('click',()=>bxRenderConc(true));$('#bxConcQuery')?.addEventListener('keydown',e=>{if(e.key==='Enter')bxRenderConc(false)});document.querySelectorAll('[data-bible-section="concordance"]').forEach(b=>b.addEventListener('click',()=>setTimeout(()=>bxRenderConc(false),0)));
 const bxPlanReset=(r={})=>{if($('#bxPlanId'))$('#bxPlanId').value=r.id||'';if($('#bxPlanTitle'))$('#bxPlanTitle').value=r.title||'';if($('#bxPlanDesc'))$('#bxPlanDesc').value=r.description||'';if($('#bxPlanItems'))$('#bxPlanItems').value=(r.items||[]).join('\n');if($('#bxPlanProgress'))$('#bxPlanProgress').value=Number(r.progress||0);if($('#bxPlanPct'))$('#bxPlanPct').textContent=`${Number(r.progress||0)}%`};
 const bxRenderPlans=async()=>{const q=String($('#bxPlanQuery')?.value||'').toLowerCase(),list=$('#bxPlanList');if(!list)return;let rows=await plansAll();rows=rows.filter(r=>!q||bxGlobalText(r).includes(q)).sort((a,b)=>String(b.updatedAt).localeCompare(String(a.updatedAt)));list.innerHTML=rows.length?rows.map(r=>`<button class="bx-adv-item" data-plan-id="${escapeHtml(r.id)}"><strong>${escapeHtml(r.title)}</strong><small>${r.progress}% • ${r.items.length} item(ns)</small><span class="bx-plan-progress"><i style="width:${r.progress}%"></i></span></button>`).join(''):'<div class="bx-adv-empty">Nenhum plano salvo.</div>';list.querySelectorAll('[data-plan-id]').forEach(b=>b.onclick=()=>bxPlanReset(rows.find(r=>r.id===b.dataset.planId)||{}))};
 $('#bxPlanProgress')?.addEventListener('input',e=>{if($('#bxPlanPct'))$('#bxPlanPct').textContent=`${e.target.value}%`});$('#bxPlanNew')?.addEventListener('click',()=>bxPlanReset({}));$('#bxPlanSave')?.addEventListener('click',async()=>{const title=$('#bxPlanTitle')?.value.trim();if(!title)return alert('Informe o título do plano.');await plansPut({id:$('#bxPlanId')?.value||undefined,title,description:$('#bxPlanDesc')?.value||'',items:$('#bxPlanItems')?.value||'',progress:Number($('#bxPlanProgress')?.value||0)});await bxRenderPlans();alert('Plano salvo localmente.')});$('#bxPlanDelete')?.addEventListener('click',async()=>{const id=$('#bxPlanId')?.value;if(!id||!confirm('Excluir este plano?'))return;await planDelete(id);bxPlanReset({});await bxRenderPlans()});$('#bxPlanOpen')?.addEventListener('click',async()=>{const items=String($('#bxPlanItems')?.value||'').split('\n').map(x=>x.trim()).filter(Boolean);if(!items.length)return alert('Adicione pelo menos uma passagem.');const pct=Number($('#bxPlanProgress')?.value||0),idx=Math.min(items.length-1,Math.floor((pct/100)*items.length)),ref=normalizeBibleRef(items[idx]);if(!ref)return;activate('reader');if($('#bRef'))$('#bRef').value=ref;current=await smartBibleRef(ref);if($('#bOut'))$('#bOut').textContent=formatVerses(current)||`Passagem ${ref} ainda não está na Bíblia local.`});$('#bxPlanQuery')?.addEventListener('input',bxRenderPlans);document.querySelectorAll('[data-bible-section="plans"]').forEach(b=>b.addEventListener('click',()=>setTimeout(()=>bxRenderPlans(),0)));
 const bxAllStores=async()=>{const db=await openDB();return Array.from(db.objectStoreNames)};const bxFullSnapshot=async()=>{const stores=await bxAllStores(),data={format:'logos-master-x-biblia-x-backup',version:1,createdAt:new Date().toISOString(),stores:{}};for(const s of stores){try{data.stores[s]=await dbAll(s)}catch(e){data.stores[s]=[]}}return data};const bxBackupStats=async()=>{const box=$('#bxBackupStats');if(!box)return;const snap=await bxFullSnapshot(),rows=Object.entries(snap.stores);box.innerHTML=`<div class="bx-adv-kpi"><b>${rows.length}</b><small>bancos</small></div><div class="bx-adv-kpi"><b>${rows.reduce((n,[,v])=>n+v.length,0)}</b><small>registros</small></div>`};const bxRestoreSnapshot=async snap=>{if(!snap?.stores)throw new Error('Formato de backup inválido.');const db=await openDB();for(const [store,rows] of Object.entries(snap.stores)){if(!db.objectStoreNames.contains(store)||!Array.isArray(rows))continue;await new Promise((res,rej)=>{const t=db.transaction(store,'readwrite'),st=t.objectStore(store);rows.forEach(r=>{try{st.put(r)}catch(e){}});t.oncomplete=()=>res();t.onerror=()=>rej(t.error)})}return true};
 $('#bxBackupExport')?.addEventListener('click',async()=>download(`biblia-x-backup-completo-${new Date().toISOString().slice(0,10)}.json`,JSON.stringify(await bxFullSnapshot(),null,2),'application/json'));$('#bxBackupPreview')?.addEventListener('click',async()=>{const f=$('#bxBackupFile')?.files?.[0],msg=$('#bxBackupMsg');if(!f)return alert('Escolha um JSON.');try{const j=JSON.parse(await f.text()),stores=Object.keys(j.stores||{}),count=Object.values(j.stores||{}).reduce((n,a)=>n+(Array.isArray(a)?a.length:0),0);msg.textContent=`Backup válido: ${stores.length} bancos • ${count} registros • ${j.createdAt||'sem data'}`;}catch(e){msg.textContent='Arquivo inválido: '+e.message}});$('#bxBackupRestore')?.addEventListener('click',async()=>{const f=$('#bxBackupFile')?.files?.[0];if(!f)return alert('Escolha um backup JSON.');if(!confirm('Restaurar este backup nos bancos locais da Bíblia X?'))return;try{await bxRestoreSnapshot(JSON.parse(await f.text()));alert('Restauração concluída. Reinicie a página para recarregar todos os módulos.');await bxBackupStats()}catch(e){alert('Falha ao restaurar: '+e.message)}});document.querySelectorAll('[data-bible-section="backup"]').forEach(b=>b.addEventListener('click',()=>setTimeout(()=>bxBackupStats(),0)));
 const bxHubRefresh=async()=>{const box=$('#bxHubKpis');if(!box)return;const stores=await bxAllStores(),stats=[];for(const s of stores){try{stats.push([s,(await dbAll(s)).length])}catch(e){}}const total=stats.reduce((n,[,c])=>n+c,0),verses=stats.find(([s])=>s==='verses')?.[1]||0;box.innerHTML=`<div class="bx-adv-kpi"><b>${verses.toLocaleString('pt-BR')}</b><small>versículos</small></div><div class="bx-adv-kpi"><b>${stores.length}</b><small>bancos locais</small></div><div class="bx-adv-kpi"><b>${total.toLocaleString('pt-BR')}</b><small>registros</small></div><div class="bx-adv-kpi"><b>26</b><small>etapas integradas</small></div>`};document.querySelectorAll('[data-hub]').forEach(b=>b.addEventListener('click',()=>{const target=b.dataset.hub;activate(target);document.querySelector(`[data-bible-section="${target}"]`)?.click()}));document.querySelectorAll('[data-bible-section="hub"]').forEach(b=>b.addEventListener('click',()=>setTimeout(()=>bxHubRefresh(),0)));
 $('#bxWorkLoad')?.addEventListener('click',async()=>{const ref=normalizeBibleRef($('#bxWorkRef')?.value||'');const rows=await smartBibleRef(ref);$('#bxWorkText').textContent=formatVerses(rows)||'Passagem não encontrada na Bíblia local.'});$('#bxWorkCurrent')?.addEventListener('click',()=>{const ref=current?.length?`${current[0].book} ${current[0].chapter}:${current[0].verse}`:normalizeBibleRef($('#bRef')?.value||'');if($('#bxWorkRef'))$('#bxWorkRef').value=ref;$('#bxWorkLoad')?.click()});$('#bxWorkStudio')?.addEventListener('click',()=>{const ref=$('#bxWorkRef')?.value||'',notes=$('#bxWorkNotes')?.value||'',title=$('#bxWorkTitle')?.value||'Estudo Bíblia X';Store.set('studioPrefill',$('#bxWorkText')?.textContent||ref);Store.set('studioMessageConfig',Object.assign({},Store.get('studioMessageConfig',{}),{sourceMode:'passagem',text:ref,theme:title,notes}));Store.set('studioStep',3);render('studio')});
 $('#bxParLoad')?.addEventListener('click',async()=>{for(const side of ['A','B']){const ref=normalizeBibleRef($(`#bxPar${side}`)?.value||''),rows=await smartBibleRef(ref);$(`#bxPar${side}Title`).textContent=ref||`Passagem ${side}`;$(`#bxPar${side}Out`).textContent=formatVerses(rows)||'Passagem não encontrada na Bíblia local.'}});
 $('#bxExpCurrent')?.addEventListener('click',()=>{if($('#bxExpText'))$('#bxExpText').value=current?.length?formatVerses(current):($('#bOut')?.textContent||'')});$('#bxExpTxt')?.addEventListener('click',()=>download('biblia-x-estudo.txt',$('#bxExpText')?.value||'','text/plain'));$('#bxExpMd')?.addEventListener('click',()=>download('biblia-x-estudo.md',`# ${$('#bxExpTitle')?.value||'Estudo Bíblia X'}\n\n${$('#bxExpText')?.value||''}`,'text/markdown'));$('#bxExpCopy')?.addEventListener('click',async()=>{await navigator.clipboard?.writeText($('#bxExpText')?.value||'');alert('Conteúdo copiado.')});$('#bxExpPrint')?.addEventListener('click',()=>{const w=window.open('','_blank');if(!w)return;w.document.write(`<title>${escapeHtml($('#bxExpTitle')?.value||'Bíblia X')}</title><pre style="white-space:pre-wrap;font:16px/1.6 Georgia,serif">${escapeHtml($('#bxExpText')?.value||'')}</pre>`);w.document.close();w.print()});
 const bxDiagRun=async()=>{const stores=await bxAllStores(),list=$('#bxDiagList');let total=0,ok=0,html=[];for(const s of stores){try{const n=(await dbAll(s)).length;total+=n;ok++;html.push(`<div>✅ <b>${escapeHtml(s)}</b><span>${n.toLocaleString('pt-BR')} registros</span></div>`)}catch(e){html.push(`<div>⚠️ <b>${escapeHtml(s)}</b><span>${escapeHtml(e.message)}</span></div>`)}}if($('#bxDiagStores'))$('#bxDiagStores').textContent=`${ok}/${stores.length}`;if($('#bxDiagRows'))$('#bxDiagRows').textContent=total.toLocaleString('pt-BR');if($('#bxDiagStatus'))$('#bxDiagStatus').textContent=navigator.onLine?'LOCAL':'OFFLINE';if(list)list.innerHTML=html.join('')||'<div>Nenhum banco encontrado.</div>'};$('#bxDiagRun')?.addEventListener('click',bxDiagRun);document.querySelectorAll('[data-bible-section="diagnostic"]').forEach(b=>b.addEventListener('click',()=>setTimeout(bxDiagRun,0)));
 $('#bxTopicBuild')?.addEventListener('click',async()=>{const refs=String($('#bxTopicRefs')?.value||'').split(/\n|,/).map(normalizeBibleRef).filter(Boolean),parts=[];for(const ref of refs){const rows=await smartBibleRef(ref);parts.push(`## ${ref}\n${formatVerses(rows)||'Passagem não encontrada na Bíblia local.'}`)}if($('#bxTopicOut'))$('#bxTopicOut').textContent=parts.join('\n\n')||'Nenhuma referência válida.'});$('#bxTopicStudio')?.addEventListener('click',()=>{Store.set('studioPrefill',$('#bxTopicOut')?.textContent||'');Store.set('studioMessageConfig',Object.assign({},Store.get('studioMessageConfig',{}),{theme:$('#bxTopicName')?.value||'Tema Bíblia X',notes:$('#bxTopicOut')?.textContent||''}));Store.set('studioStep',3);render('studio')});
 const bxBuildDossier=async()=>{const ref=normalizeBibleRef($('#bxDossierRef')?.value||$('#bRef')?.value||''),rows=await smartBibleRef(ref),chunks=[`Dossiê Bíblia X — ${ref}`,formatVerses(rows)||'Texto não encontrado localmente.'];for(const [store,label] of [['context','Contexto'],['comments','Comentários'],['notes','Notas'],['crossrefs','Referências cruzadas']]){try{const all=await dbAll(store),hit=all.filter(x=>JSON.stringify(x).toLowerCase().includes(ref.toLowerCase())).slice(0,8);if(hit.length)chunks.push(`\n${label}:\n`+hit.map(x=>JSON.stringify(x)).join('\n'))}catch(e){}}if($('#bxDossierOut'))$('#bxDossierOut').textContent=chunks.join('\n\n')};$('#bxDossierBuild')?.addEventListener('click',bxBuildDossier);$('#bxDossierCurrent')?.addEventListener('click',()=>{if($('#bxDossierRef'))$('#bxDossierRef').value=normalizeBibleRef($('#bRef')?.value||'');bxBuildDossier()});$('#bxDossierCopy')?.addEventListener('click',()=>navigator.clipboard?.writeText($('#bxDossierOut')?.textContent||''));
 $('#bxIntLoad')?.addEventListener('click',async()=>{const ref=normalizeBibleRef($('#bxIntRef')?.value||''),rows=await smartBibleRef(ref),strong=await dbAll('strong').catch(()=>[]),box=$('#bxIntOut');const txt=formatVerses(rows)||'Passagem não encontrada.';box.innerHTML=`<div><b>${escapeHtml(ref)}</b><span>${escapeHtml(txt)}</span></div>`+(strong.length?`<div><b>Strong local</b><span>${strong.length} verbetes disponíveis para consulta pela aba Strong.</span></div>`:`<div><b>Strong local</b><span>Nenhum banco Strong importado.</span></div>`)});
 const bxOffScan=async()=>{const stores=await bxAllStores(),items=[],counts=[];for(const st of stores){try{const n=(await dbAll(st)).length;counts.push(n);items.push(`<div>${n?'✅':'○'} <b>${escapeHtml(st)}</b><span>${n} registros</span></div>`)}catch(e){items.push(`<div>⚠️ <b>${escapeHtml(st)}</b><span>falha de leitura</span></div>`)}}if($('#bxOffStores'))$('#bxOffStores').textContent=stores.length;if($('#bxOffRows'))$('#bxOffRows').textContent=counts.reduce((a,b)=>a+b,0);if($('#bxOffNet'))$('#bxOffNet').textContent=navigator.onLine?'online':'offline';if($('#bxOffList'))$('#bxOffList').innerHTML=items.join('')};$('#bxOffScan')?.addEventListener('click',bxOffScan);document.querySelectorAll('[data-bible-section="offlinecenter"]').forEach(b=>b.addEventListener('click',()=>setTimeout(bxOffScan,0)));
 const bxFinalRun=async()=>{const checks=[],stores=await bxAllStores();checks.push(['Interface Bíblia X',!!document.querySelector('.bible-x-shell')]);checks.push(['IndexedDB',stores.length>0]);checks.push(['Bíblia local',stores.includes('verses')]);checks.push(['Backup',!!$('#bxBackupExport')]);checks.push(['Studio X',typeof render==='function']);checks.push(['Modo local',true]);const ok=checks.every(x=>x[1]);if($('#bxFinalStatus'))$('#bxFinalStatus').textContent=ok?'APROVADO':'REVISAR';if($('#bxFinalList'))$('#bxFinalList').innerHTML=checks.map(([n,v])=>`<div>${v?'✅':'⚠️'} <b>${escapeHtml(n)}</b><span>${v?'OK':'verificar'}</span></div>`).join('')};$('#bxFinalRun')?.addEventListener('click',bxFinalRun);
 document.querySelectorAll('[data-bible-section="settings"]').forEach(btn=>btn.addEventListener('click',()=>setTimeout(()=>{bxApplyReading();bxRenderStats()},0)));$("#bxSetFont")?.addEventListener("input",e=>{Store.set("bibleFontSize",Number(e.target.value));bxApplyReading()});$("#bxSetLine")?.addEventListener("input",e=>{Store.set("bibleLineHeight",Number(e.target.value));bxApplyReading()});$("#bxSetCompact")?.addEventListener("change",e=>{Store.set("bibleCompact",e.target.checked);bxApplyReading()});$("#bxSetRemember")?.addEventListener("change",e=>Store.set("bibleRememberLast",e.target.checked));$("#bxSetReset")?.addEventListener("click",()=>{Store.set("bibleFontSize",15);Store.set("bibleLineHeight",1.65);Store.set("bibleCompact",false);bxApplyReading()});$("#bxSetRefresh")?.addEventListener("click",bxRenderStats);$("#bxSetBackup")?.addEventListener("click",async()=>download(`biblia-x-backup-${new Date().toISOString().slice(0,10)}.json`,JSON.stringify(await bxDbSnapshot(),null,2),"application/json"));$("#bxSetClearPrefs")?.addEventListener("click",()=>{if(!confirm("Limpar apenas preferências visuais da Bíblia X?"))return;Store.set("bibleFontSize",15);Store.set("bibleLineHeight",1.65);Store.set("bibleCompact",false);Store.set("bibleRememberLast",true);bxApplyReading();if($("#bxSetSaved"))$("#bxSetSaved").textContent="Preferências restauradas. Seus bancos locais foram preservados."});
 let fs=Number(Store.get("bibleFontSize",15))||15;const applyFont=()=>{fs=Number(Store.get("bibleFontSize",15))||15;bxApplyReading()};applyFont();document.querySelector(".bible-x-top-actions .btn")?.addEventListener("click",()=>{fs=fs>=22?14:fs+2;Store.set("bibleFontSize",fs);applyFont()});
}

// V132 — manutenção corretiva + preventiva. Não apaga projetos, Bíblia, DNA, temas ou preferências.
function logosSafeStudioReset(){
 try{
   if(window.__logosGenerationController){try{window.__logosGenerationController.abort()}catch(e){} window.__logosGenerationController=null;}
   const exact=["studioGenerationState","studioProcessing","studioProgress","studioRunning","studioGeneration","studioRequestId","studioStartedAt","studioElapsed","generationId"];
   exact.forEach(k=>{try{localStorage.removeItem(k)}catch(e){}});
   for(let i=localStorage.length-1;i>=0;i--){const k=localStorage.key(i)||"";if(/studio.*(running|processing|progress|request|generation|started|elapsed)|generation.*(running|processing|progress|request|started|elapsed)/i.test(k)){try{localStorage.removeItem(k)}catch(e){}}}
   Store.set("studioStep",5);
   document.querySelectorAll('[disabled]').forEach(el=>{if(el.closest('.dna-studio-shell,.dna-processing-page,.studio-page'))el.disabled=false});
   document.querySelectorAll('.is-loading,.is-processing,.processing-lock,.loading-overlay').forEach(el=>{el.classList.remove('is-loading','is-processing','processing-lock');if(el.classList.contains('loading-overlay'))el.remove()});
   document.documentElement.classList.remove('is-loading','is-processing');document.body?.classList.remove('is-loading','is-processing','modal-open');
 }catch(e){console.warn('V132 Studio reset',e)}
}
async function logosRepairFrontendCache(){
 try{if('serviceWorker' in navigator){const regs=await navigator.serviceWorker.getRegistrations();await Promise.all(regs.map(r=>r.unregister()))}}catch(e){}
 try{if('caches' in window){const keys=await caches.keys();await Promise.all(keys.map(k=>caches.delete(k)))}}catch(e){}
}
window.LOGOS_SAFE_RESET=logosSafeStudioReset;
window.LOGOS_SAFE_RESTART=async()=>{logosSafeStudioReset();await logosRepairFrontendCache();location.reload()};

// V133 — atalho de emergência permanente da Etapa 6.
// Independente do fluxo normal de eventos: pode ser chamado diretamente pelo botão inline.
window.LOGOS_STEP6_UNLOCK=function(){
 if(window.__logosStep6Unlocking)return false;
 window.__logosStep6Unlocking=true;
 try{
   if(window.__logosGenerationController){try{window.__logosGenerationController.abort()}catch(e){} window.__logosGenerationController=null;}
   try{clearInterval(window.__logosGenerationTimer)}catch(e){}
   try{clearTimeout(window.__logosGenerationTimeout)}catch(e){}
   const now=new Date().toISOString();
   Store.set("studioProcessing",{status:"idle",progress:0,phase:0,message:"Geração destravada manualmente. Revise e tente novamente.",started:null,finished:now,engine:"",provider:"",model:"",quality:null,error:"",generationId:""});
   Store.set("studioGenerationRequest",Object.assign({},Store.get("studioGenerationRequest",{}),{status:"ready",recoveredAt:now}));
   document.querySelectorAll('.studio-step6 [disabled], .dna6-actions [disabled]').forEach(el=>{try{el.disabled=false;el.removeAttribute('disabled')}catch(e){}});
   document.querySelectorAll('.loading-overlay,.processing-lock,.is-processing,.is-loading').forEach(el=>{try{el.classList.remove('processing-lock','is-processing','is-loading');if(el.classList.contains('loading-overlay'))el.remove()}catch(e){}});
   document.documentElement.classList.remove('is-loading','is-processing');
   document.body?.classList.remove('is-loading','is-processing','modal-open');
   Store.set("studioStep",5);
   try{render("studio")}catch(e){location.reload()}
   setTimeout(()=>{window.__logosStep6Unlocking=false},500);
   return false;
 }catch(e){
   try{localStorage.removeItem('logosx:studioProcessing');localStorage.setItem('logosx:studioStep','5')}catch(_){}
   location.reload();
   return false;
 }
};

function bindNav(){
  $$(".nav button").forEach(b=>{b.onclick=()=>navigateView(b.dataset.view);});
  $$(".top-nav [data-go], .top-actions [data-go], .side-special [data-go]").forEach(b=>{
    b.onclick=e=>{e.preventDefault();navigateView(b.dataset.go);};
  });
}
async function clearOldFrontendCache(){
 try{
   if("caches" in window){
     const keys=await caches.keys();
     await Promise.all(keys.filter(k=>k.startsWith("logos-master-x")&&k!=="logos-master-x-3.7.6").map(k=>caches.delete(k)));
   }
 }catch(e){}
}

const APP_BUILD_VERSION="3.8.3";
function publicAsset(path){return "/"+String(path).replace(/^\/+/,"");}
const PRODUCTION_VERSION_URL="https://logos-master-x-api.onrender.com/static/version.json";
function showUpdateBanner(remoteVersion){
 if(sessionStorage.getItem("logosUpdateDismissed:"+remoteVersion)==="1") return;
 if(document.getElementById("logosUpdateBanner")) return;
 const bar=document.createElement("div");
 bar.id="logosUpdateBanner";bar.className="logos-update-banner";
 bar.innerHTML='<span class="update-rocket">🚀</span><span class="update-copy">Nova versão '+escapeHtml(remoteVersion)+' disponível</span><button id="logosUpdateNow" class="update-now">Atualizar agora</button><button id="logosUpdateClose" class="update-close" aria-label="Fechar aviso">✕</button>';
 document.body.appendChild(bar);
 document.getElementById("logosUpdateNow").onclick=async()=>{await forceFrontendRefresh(remoteVersion)};
 document.getElementById("logosUpdateClose").onclick=()=>{sessionStorage.setItem("logosUpdateDismissed:"+remoteVersion,"1");bar.remove();};
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
   const source=(IS_LOCAL_HOST?PRODUCTION_VERSION_URL:publicAsset("static/version.json"))+"?t="+Date.now();
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


let deferredInstallPrompt=null;
function pwaInstalled(){return window.matchMedia?.('(display-mode: standalone)').matches||window.navigator.standalone===true;}
function installToast(message){document.querySelector('#pwaInstallToast')?.remove();const el=document.createElement('div');el.id='pwaInstallToast';el.className='pwa-install-toast';el.innerHTML=`<span>📲</span><div><strong>Instalar LOGOS MASTER X</strong><small>${escapeHtml(message)}</small></div><button aria-label="Fechar">✕</button>`;document.body.appendChild(el);el.querySelector('button')?.addEventListener('click',()=>el.remove());setTimeout(()=>el?.remove(),9000);}
function updateInstallSideButton(){const b=$('#installPwaSide');if(!b)return;if(pwaInstalled()){b.classList.add('is-installed');b.querySelector('span').innerHTML='APP instalado<small>LOGOS MASTER X</small>';}else if(deferredInstallPrompt){b.classList.add('is-ready');b.querySelector('span').innerHTML='Instalar como APP<small>Pronto para instalar</small>';}}
window.addEventListener('beforeinstallprompt',e=>{e.preventDefault();deferredInstallPrompt=e;updateInstallSideButton();});
window.addEventListener('appinstalled',()=>{deferredInstallPrompt=null;updateInstallSideButton();installToast('Aplicativo instalado com sucesso.');});
async function installPwa(){if(pwaInstalled()){installToast('O aplicativo já está instalado neste dispositivo.');return;}if(deferredInstallPrompt){const prompt=deferredInstallPrompt;deferredInstallPrompt=null;await prompt.prompt();const choice=await prompt.userChoice.catch(()=>({outcome:'dismissed'}));if(choice?.outcome!=='accepted')installToast('Instalação cancelada. Você pode tentar novamente pelo botão lateral.');updateInstallSideButton();return;}installToast('O navegador não liberou o prompt automático agora. No Edge/Chrome, use o ícone de instalar na barra de endereço ou o menu ⋯ → Aplicativos → Instalar este site como aplicativo.');}
let autoPublishTimer=null;
async function devApi(path,opts={}){const r=await fetch(location.origin+path,{cache:"no-store",...opts});const j=await r.json().catch(()=>({}));if(!r.ok)throw new Error(j.detail||j.message||"Falha");return j;}
async function getProductionVersion(){try{const r=await fetch(PRODUCTION_VERSION_URL+"?t="+Date.now(),{cache:"no-store"});if(!r.ok)return "—";return String((await r.json()).version||"—")}catch{return "—"}}
async function waitForRenderDeploy(expected=APP_BUILD_VERSION,timeoutMs=240000){const started=Date.now();while(Date.now()-started<timeoutMs){const v=await getProductionVersion();if(v===expected)return {ok:true,version:v};await new Promise(r=>setTimeout(r,8000));}return {ok:false,version:await getProductionVersion()};}
async function openUpdateCenter(){let prod=await getProductionVersion(),dev=null;if(IS_LOCAL_HOST){try{dev=await devApi('/api/dev/status')}catch{}}const auto=Store.get('autoPublish',false);actionModal({icon:'🚀',title:'Update Center • LOGOS '+APP_BUILD_VERSION,message:IS_LOCAL_HOST?`Local ${APP_BUILD_VERSION} • Render ${prod} • Git ${dev?.dirty?'com alterações':'limpo'} • Auto-publicar ${auto?'ON':'OFF'}`:`Instalada ${APP_BUILD_VERSION} • Render ${prod}`,actions:IS_LOCAL_HOST?[{label:'📋 Git status',close:false,run:async()=>{const x=await devApi('/api/dev/status');actionModal({icon:'Git',title:'Status local',message:(x.branch||'main')+' • '+(x.dirty?'Há alterações para publicar':'Tudo publicado')+(x.files?.length?' • '+x.files.length+' arquivo(s)':''),actions:[{label:'Fechar',kind:'primary'}]})}},{label:'🚀 Publicar no Render',kind:'primary',close:false,run:async()=>{actionModal({icon:'↥',title:'GitHub → Render',message:'Enviando alterações ao GitHub. O Render deverá iniciar o deploy automático da branch principal.',actions:[]});try{const x=await devApi('/api/dev/publish',{method:'POST'});actionModal({icon:'⏳',title:'GitHub atualizado',message:(x.message||'Commit enviado')+' • commit '+(x.commit||'—')+'. Verificando o Render automaticamente...',actions:[]});const dep=await waitForRenderDeploy(APP_BUILD_VERSION);actionModal({icon:dep.ok?'✓':'⏳',title:dep.ok?'Render atualizado':'Render ainda processando',message:dep.ok?'Produção confirmada na versão '+dep.version+'. Local e Render estão sincronizados.':'O GitHub foi atualizado, mas o Render ainda informa '+dep.version+'. Você pode verificar novamente em alguns instantes.',actions:[{label:'Verificar novamente',kind:'primary',run:openUpdateCenter},{label:'Fechar'}]})}catch(e){actionModal({icon:'!',title:'Falha ao publicar',message:e.message,actions:[{label:'Fechar',kind:'primary'}]})}}},{label:`⚙ Auto-publicar ${auto?'ON':'OFF'}`,run:()=>toggleAutoPublish(!auto)}]:[{label:'🔄 Verificar atualização',kind:'primary',close:false,run:()=>checkFrontendVersion(true)},{label:'⬆️ Atualizar agora',run:()=>forceFrontendRefresh(prod)}]});}
function toggleAutoPublish(on){Store.set('autoPublish',!!on);if(autoPublishTimer){clearInterval(autoPublishTimer);autoPublishTimer=null}if(on&&IS_LOCAL_HOST){autoPublishTimer=setInterval(async()=>{try{const s=await devApi('/api/dev/status');if(s.dirty)await devApi('/api/dev/publish',{method:'POST'})}catch(e){console.warn('Auto-publicar:',e.message)}},15000)}actionModal({icon:on?'✓':'○',title:'Auto-publicar '+(on?'ativado':'desativado'),message:on?'Enquanto esta página local estiver aberta, o LOGOS verificará alterações a cada 15 segundos e publicará no GitHub para o Render fazer o deploy automático. Use somente quando quiser enviar mudanças automaticamente.':'As alterações só serão enviadas pelo botão Publicar agora.',actions:[{label:'Fechar',kind:'primary'}]});}
function safeTopInsert(node){const top=document.querySelector('.top');const actions=document.querySelector('.top-actions');const host=actions||top;if(!host||!node)return;const status=$('#status');if(status&&status.parentNode===host)host.insertBefore(node,status);else host.appendChild(node);}
function installUpdateControls(){
 // 3.7.6b: os controles visuais de atualização ficam exclusivamente no
 // botão "Update Center" do menu lateral. O próprio actionModal já possui
 // X, fecha ao clicar fora e só aparece quando o usuário solicitar.
 // Mantemos apenas o comportamento opcional de auto-publicação já salvo.
 $("#updateCenterBtn")?.remove();
 $("#updateDock")?.remove();
 if(IS_LOCAL_HOST&&Store.get('autoPublish',false)&&!autoPublishTimer){
   autoPublishTimer=setInterval(async()=>{
     try{const st=await devApi('/api/dev/status');if(st.dirty)await devApi('/api/dev/publish',{method:'POST'})}
     catch(e){console.warn('Auto-publicar:',e.message)}
   },15000);
 }
}


function __logosRelativeTime(ts){
 if(!ts)return '—'; const sec=Math.max(0,Math.round((Date.now()-ts)/1000));
 if(sec<5)return 'agora'; if(sec<60)return `há ${sec}s`; const m=Math.floor(sec/60); if(m<60)return `há ${m} min`; return new Date(ts).toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'});
}
function __logosThemeName(){try{const v=activeVisual();return (COLOR_THEMES[v.palette]||{}).name||v.palette||'Padrão'}catch{return document.documentElement.getAttribute('data-palette')||'Padrão'}}
async function refreshSystemSummary(){
 const root=document.getElementById('liveSystemSummary'); if(!root)return;
 const put=(id,text)=>{const e=document.getElementById(id);if(e)e.textContent=text};
 const providers=App.health?.providers||{}; const online=['gemini','groq','openrouter','huggingface','openai'].filter(k=>providers[k]).length;
 put('sysOverall',App.server?'● Online':(navigator.onLine?'● Local':'● Offline'));
 put('sysVersion','3.8.1'); put('sysStatus',navigator.onLine?(App.server?'Online':'Local / API indisponível'):'Offline');
 put('sysBackend',App.server?'Online':'Offline'); put('sysApiDetail',App.api||'API local');
 put('sysProviders',`${online} / 5 online`); put('sysSync',__logosRelativeTime(window.__logosLastHealthCheck));
 put('sysSyncDate',window.__logosLastHealthCheck?new Date(window.__logosLastHealthCheck).toLocaleString('pt-BR'):'Aguardando verificação');
 put('sysUpdate','Ativo'); put('sysUpdateDetail',`Painel automático • resposta ${window.__logosHealthLatency??'—'} ms`);
 const standalone=window.matchMedia?.('(display-mode: standalone)')?.matches||window.navigator.standalone===true;
 put('sysPwa',standalone?'Instalado / aberto':'Disponível'); put('sysPwaDetail',standalone?'Executando como aplicativo':'Executando no navegador');
 put('sysMode',window.matchMedia?.('(max-width: 760px)')?.matches?'Mobile':'Web Desktop'); put('sysBrowser',navigator.userAgentData?.brands?.map(x=>x.brand).join(' • ')||navigator.userAgent.split(' ').slice(-2).join(' '));
 put('sysTheme',__logosThemeName());
 try{const reg=await navigator.serviceWorker?.getRegistration();put('sysSw',reg?'Ativo':'Inativo');put('sysSwDetail',reg?(reg.waiting?'Atualização aguardando':'Cache/worker registrado'):'Sem registro')}catch{put('sysSw','Indisponível')}
 put('sysNextCheck','agora');
 const home=document.getElementById('homeSystemLive');
 if(home){
   const hp=(id,text)=>{const e=document.getElementById(id);if(e)e.textContent=text};
   hp('homeSysOnline',navigator.onLine?(App.server?'● Online':'● Local'):'● Offline');
   hp('homeSysVersion','3.8.1');
   const qRaw=App.health?.quality_gate;
   let q='—';
   if(typeof qRaw==='number') q=(qRaw<=20?`${Math.round(qRaw)}/20`:`${Math.round(qRaw)}%`);
   else if(qRaw===true) q='20/20';
   else if(qRaw) q=String(qRaw);
   hp('homeSysQuality',q);
   hp('homeSysUpdate',navigator.onLine?'Ativo':'Offline');
   hp('homeSysMode',window.matchMedia?.('(max-width: 760px)')?.matches?'Mobile':'Desktop');
   hp('homeSysApi',App.server?'Online':(navigator.onLine?'Local':'Offline'));
   hp('homeSysAi',`${online} / 5`);
   home.classList.toggle('is-offline',!navigator.onLine);
 }
}
window.addEventListener('online',()=>{refreshSystemSummary();checkApi()}); window.addEventListener('offline',refreshSystemSummary);
setInterval(()=>{refreshSystemSummary()},15000);
setInterval(()=>{checkApi().catch(()=>{})},60000);

window.addEventListener("DOMContentLoaded",async()=>{
 try{
   bindNav();
   // Inicialização única: sem splash, sem limpeza de cache durante a renderização
   // e sem consulta automática de versão que possa reiniciar a interface.
   const w=$("#workspace");
   if(w) w.innerHTML="";
   applyVisual();
   installMobileNav();
   installUpdateControls();
   setupNavigationHistory();
   updateInstallSideButton();
   // Libera o AudioContext na primeira interação quando o navegador bloquear autoplay.
   const unlockJourneyAudio=()=>{try{
     const AC=window.AudioContext||window.webkitAudioContext;
     if(AC){const c=__journeyAudioCtx||(__journeyAudioCtx=new AC());const resume=()=>{if(window.__logosJourneyAudioPending&&typeof window.__logosReplayHomeJourney==='function'){window.__logosJourneyAudioPending=false;setTimeout(()=>window.__logosReplayHomeJourney(),40)}};if(c.state==='suspended')c.resume().then(resume).catch(()=>{});else resume();}
   }catch(e){}};
   ['pointerdown','touchstart','keydown'].forEach(ev=>document.addEventListener(ev,unlockJourneyAudio,{once:true,passive:true}));
   // Monta a Home apenas uma vez.
   render("dashboard");
   refreshSystemSummary();
   // V10.1 — restaura EXATAMENTE o fluxo aprovado do arquivo de comparação:
   // DNA -> 3 fitas -> K7/bobinas -> retorno -> DNA -> Bíblia -> flash final (~4s).
   // O loading continua removido; finishMobileLoading() aqui serve somente para disparar
   // o canvas legado aprovado, que já trata a ausência do splash.
   finishMobileLoading();
   // Evita FOUC/"vulto" na primeira abertura: só libera a interface após
   // tema, header, navegação e Home estarem montados.
   document.documentElement.classList.remove("logos-booting");
   document.documentElement.classList.add("logos-ready");
   // A verificação da API só atualiza o indicador de status; não remonta a Home.
   await checkApi();
 }catch(e){
   document.documentElement.classList.remove("logos-booting");
   document.documentElement.classList.add("logos-ready");
   console.error("LOGOS startup error",e);
   // Não substitui a interface por uma tela de diagnóstico.
 }
});

/* Biblia X - Etapa 31: Marcadores e Destaques X */
window.BIBLIAX_STAGE = 31;
window.BibliaXModules = window.BibliaXModules || {};
window.BibliaXModules["MARCADORES-DESTAQUES-X"] = {stage:31,title:"Marcadores e Destaques X",description:"marca\u00e7\u00f5es e destaques de passagens",localOnly:true};
window.BibliaXLocal = window.BibliaXLocal || {
  get(key,fallback=null){try{const v=localStorage.getItem('bibliax:'+key);return v===null?fallback:JSON.parse(v)}catch(e){return fallback}},
  set(key,value){localStorage.setItem('bibliax:'+key,JSON.stringify(value));return value},
  remove(key){localStorage.removeItem('bibliax:'+key)}
};

/* Biblia X - Etapa 32: Diário de Estudo X */
window.BIBLIAX_STAGE = 32;
window.BibliaXModules = window.BibliaXModules || {};
window.BibliaXModules["DIARIO-DE-ESTUDO-X"] = {stage:32,title:"Di\u00e1rio de Estudo X",description:"registros cronol\u00f3gicos de estudo",localOnly:true};
window.BibliaXLocal = window.BibliaXLocal || {
  get(key,fallback=null){try{const v=localStorage.getItem('bibliax:'+key);return v===null?fallback:JSON.parse(v)}catch(e){return fallback}},
  set(key,value){localStorage.setItem('bibliax:'+key,JSON.stringify(value));return value},
  remove(key){localStorage.removeItem('bibliax:'+key)}
};

/* Biblia X - Etapa 33: Cadeias Bíblicas X */
window.BIBLIAX_STAGE = 33;
window.BibliaXModules = window.BibliaXModules || {};
window.BibliaXModules["CADEIAS-BIBLICAS-X"] = {stage:33,title:"Cadeias B\u00edblicas X",description:"cadeias tem\u00e1ticas de refer\u00eancias",localOnly:true};
window.BibliaXLocal = window.BibliaXLocal || {
  get(key,fallback=null){try{const v=localStorage.getItem('bibliax:'+key);return v===null?fallback:JSON.parse(v)}catch(e){return fallback}},
  set(key,value){localStorage.setItem('bibliax:'+key,JSON.stringify(value));return value},
  remove(key){localStorage.removeItem('bibliax:'+key)}
};

/* Biblia X - Etapa 34: Workspace X */
window.BIBLIAX_STAGE = 34;
window.BibliaXModules = window.BibliaXModules || {};
window.BibliaXModules["WORKSPACE-X"] = {stage:34,title:"Workspace X",description:"\u00e1rea de trabalho para reunir estudos",localOnly:true};
window.BibliaXLocal = window.BibliaXLocal || {
  get(key,fallback=null){try{const v=localStorage.getItem('bibliax:'+key);return v===null?fallback:JSON.parse(v)}catch(e){return fallback}},
  set(key,value){localStorage.setItem('bibliax:'+key,JSON.stringify(value));return value},
  remove(key){localStorage.removeItem('bibliax:'+key)}
};

/* Biblia X - Etapa 35: Master Consolidada */
window.BIBLIAX_STAGE = 35;
window.BibliaXModules = window.BibliaXModules || {};
window.BibliaXModules["MASTER-CONSOLIDADA"] = {stage:35,title:"Master Consolidada",description:"consolida\u00e7\u00e3o das etapas 1\u201335",localOnly:true};
window.BibliaXLocal = window.BibliaXLocal || {
  get(key,fallback=null){try{const v=localStorage.getItem('bibliax:'+key);return v===null?fallback:JSON.parse(v)}catch(e){return fallback}},
  set(key,value){localStorage.setItem('bibliax:'+key,JSON.stringify(value));return value},
  remove(key){localStorage.removeItem('bibliax:'+key)}
};

/* Biblia X - Etapa 36: Histórico de Leitura X */
window.BIBLIAX_STAGE = 36;
window.BibliaXModules = window.BibliaXModules || {};
window.BibliaXModules["HISTORICO-DE-LEITURA-X"] = {stage:36,title:"Hist\u00f3rico de Leitura X",description:"hist\u00f3rico local de passagens abertas",localOnly:true};
window.BibliaXLocal = window.BibliaXLocal || {
  get(key,fallback=null){try{const v=localStorage.getItem('bibliax:'+key);return v===null?fallback:JSON.parse(v)}catch(e){return fallback}},
  set(key,value){localStorage.setItem('bibliax:'+key,JSON.stringify(value));return value},
  remove(key){localStorage.removeItem('bibliax:'+key)}
};

/* Biblia X - Etapa 37: Listas de Leitura X */
window.BIBLIAX_STAGE = 37;
window.BibliaXModules = window.BibliaXModules || {};
window.BibliaXModules["LISTAS-DE-LEITURA-X"] = {stage:37,title:"Listas de Leitura X",description:"listas personalizadas de leitura",localOnly:true};
window.BibliaXLocal = window.BibliaXLocal || {
  get(key,fallback=null){try{const v=localStorage.getItem('bibliax:'+key);return v===null?fallback:JSON.parse(v)}catch(e){return fallback}},
  set(key,value){localStorage.setItem('bibliax:'+key,JSON.stringify(value));return value},
  remove(key){localStorage.removeItem('bibliax:'+key)}
};

/* Biblia X - Etapa 38: Painel de Estudo X */
window.BIBLIAX_STAGE = 38;
window.BibliaXModules = window.BibliaXModules || {};
window.BibliaXModules["PAINEL-DE-ESTUDO-X"] = {stage:38,title:"Painel de Estudo X",description:"painel resumido do estudo atual",localOnly:true};
window.BibliaXLocal = window.BibliaXLocal || {
  get(key,fallback=null){try{const v=localStorage.getItem('bibliax:'+key);return v===null?fallback:JSON.parse(v)}catch(e){return fallback}},
  set(key,value){localStorage.setItem('bibliax:'+key,JSON.stringify(value));return value},
  remove(key){localStorage.removeItem('bibliax:'+key)}
};

/* Biblia X - Etapa 39: Integridade Local X */
window.BIBLIAX_STAGE = 39;
window.BibliaXModules = window.BibliaXModules || {};
window.BibliaXModules["INTEGRIDADE-LOCAL-X"] = {stage:39,title:"Integridade Local X",description:"verifica\u00e7\u00e3o local dos dados B\u00edblia X",localOnly:true};
window.BibliaXLocal = window.BibliaXLocal || {
  get(key,fallback=null){try{const v=localStorage.getItem('bibliax:'+key);return v===null?fallback:JSON.parse(v)}catch(e){return fallback}},
  set(key,value){localStorage.setItem('bibliax:'+key,JSON.stringify(value));return value},
  remove(key){localStorage.removeItem('bibliax:'+key)}
};

/* Biblia X - Etapa 40: Master Local Estável */
window.BIBLIAX_STAGE = 40;
window.BibliaXModules = window.BibliaXModules || {};
window.BibliaXModules["MASTER-LOCAL-ESTAVEL"] = {stage:40,title:"Master Local Est\u00e1vel",description:"checkpoint local cumulativo das etapas 1\u201340",localOnly:true};
window.BibliaXLocal = window.BibliaXLocal || {
  get(key,fallback=null){try{const v=localStorage.getItem('bibliax:'+key);return v===null?fallback:JSON.parse(v)}catch(e){return fallback}},
  set(key,value){localStorage.setItem('bibliax:'+key,JSON.stringify(value));return value},
  remove(key){localStorage.removeItem('bibliax:'+key)}
};

/* Bíblia X — Etapas 41–45: consolidação final cumulativa */
(function(){
  'use strict';
  window.BibliaXModules = window.BibliaXModules || {};
  const register=(key,stage,title,description)=>{window.BibliaXModules[key]={stage,title,description,localOnly:true};};

  register('BANCO-BIBLICO-REAL-X',41,'Banco Bíblico Real X','Infraestrutura local para importar, validar e indexar traduções bíblicas licenciadas ou de domínio público.');
  window.BibliaXBibleImport = window.BibliaXBibleImport || {
    validate(payload){
      if(!payload || typeof payload!=='object') return {ok:false,error:'Arquivo inválido'};
      const books=Array.isArray(payload.books)?payload.books:[];
      if(!books.length) return {ok:false,error:'Nenhum livro encontrado'};
      return {ok:true,books:books.length};
    },
    normalizeRef(ref){return String(ref||'').trim().replace(/\s+/g,' ');}
  };

  register('BASES-DE-ESTUDO-REAIS-X',42,'Bases de Estudo Reais X','Camada de importação para Strong, léxico, referências, concordância, contexto, personagens e cronologia.');
  window.BibliaXStudyDatasets = window.BibliaXStudyDatasets || {
    supported:['strong','lexicon','crossReferences','concordance','context','characters','timeline'],
    validate(type,data){return {ok:this.supported.includes(type)&&Array.isArray(data),type,count:Array.isArray(data)?data.length:0};}
  };

  register('ATLAS-MIDIA-REAL-X',43,'Atlas & Mídia Real X','Infraestrutura local para lugares, coordenadas, rotas e mídias associadas a referências bíblicas.');
  window.BibliaXAtlasMedia = window.BibliaXAtlasMedia || {
    validCoordinate(lat,lng){return Number.isFinite(+lat)&&Number.isFinite(+lng)&&+lat>=-90&&+lat<=90&&+lng>=-180&&+lng<=180;},
    mediaTypes:['image','audio','video','pdf']
  };

  register('BIBLIA-STUDIO-BRIDGE-X',44,'Integração Bíblia X ↔ Studio X','Ponte local consolidada para transferir passagem e contexto de estudo ao Studio X.');
  window.BibliaXStudioBridge = window.BibliaXStudioBridge || {
    buildPayload(input){
      const x=input||{};
      return {source:'biblia-x',reference:String(x.reference||''),text:String(x.text||''),context:x.context||{},strong:x.strong||[],lexicon:x.lexicon||[],crossReferences:x.crossReferences||[],dnaK7:x.dnaK7||{},createdAt:new Date().toISOString()};
    },
    save(payload){try{localStorage.setItem('logos-master-x:studio:from-biblia-x',JSON.stringify(payload));return true}catch(e){return false}}
  };

  register('MASTER-FINAL-BIBLIA-X',45,'MASTER FINAL BÍBLIA X','Consolidação autossuficiente das etapas 1–45; preparada para bancos reais e operação local estável.');
  window.BIBLIAX_STAGE = 45;
  window.BIBLIAX_MASTER = Object.freeze({stage:45,mode:'local',selfContained:true,autoPublish:false,schemaVersion:1});
  window.BibliaXDiagnostics = window.BibliaXDiagnostics || function(){
    const mods=Object.values(window.BibliaXModules||{});
    return {stage:window.BIBLIAX_STAGE,moduleCount:mods.length,localStorage:typeof localStorage!=='undefined',indexedDB:typeof indexedDB!=='undefined',online:navigator.onLine,mode:'local',autoPublish:false};
  };
})();

window.bxRenderCommentaryPanel=bxRenderCommentaryPanel;



/* V8.12 — CONTROLES DE LEITURA + NAVEGAÇÃO STUDIO + BÍBLIA CLEAN */
(function(){
  if(window.__LOGOS_V812__)return;
  window.__LOGOS_V812__=true;

  window.LMXStudioGoStep=function(n){
    n=Number(n);
    if(!n||n<1||n>7)return false;
    Store.set("studioStep",n);
    if(n===7)Store.set("studioResultTab",Store.get("studioResultTab","mensagem"));
    render("studio");
    return false;
  };

  function generatedArticle(el){return el?.closest?.(".generated-message")||null}
  function zoomOf(article){return Math.max(75,Math.min(200,Number(article?.dataset?.lmxZoom||100)||100))}
  function setZoom(article,z){
    if(!article)return;
    z=Math.max(75,Math.min(200,Math.round(z/10)*10));
    article.dataset.lmxZoom=String(z);
    article.style.setProperty("--lmx-reader-scale",String(z/100));
    article.querySelectorAll("[data-reader-zoom]").forEach(x=>x.textContent=z+"%");
  }
  function setFull(article,on){
    if(!article)return;
    article.classList.toggle("lmx-reader-full",!!on);
    document.body.classList.toggle("logos-reader-lock",!!on);
    const full=article.querySelector('[data-lmx-reader="fullscreen"]');
    const exit=article.querySelector('[data-lmx-reader="exitfullscreen"]');
    if(full)full.hidden=!!on;
    if(exit)exit.hidden=!on;
  }

  let autoTimer=null,autoArticle=null,autoButton=null;
  function stopAuto(){
    if(autoTimer)clearInterval(autoTimer);
    autoTimer=null;
    if(autoButton){autoButton.classList.remove("active");autoButton.textContent="●";}
    autoButton=null;autoArticle=null;
  }

  document.addEventListener("click",function(ev){
    const rb=ev.target.closest?.("[data-lmx-reader]");
    if(rb){
      ev.preventDefault();ev.stopPropagation();
      const article=generatedArticle(rb);
      if(!article)return;
      const a=rb.dataset.lmxReader,z=zoomOf(article);
      if(a==="smaller"){setZoom(article,z-10);return}
      if(a==="larger"){setZoom(article,z+10);return}
      if(a==="reset"){setZoom(article,100);return}
      if(a==="fullscreen"){setFull(article,true);return}
      if(a==="exitfullscreen"){setFull(article,false);return}
      if(a==="top"){window.scrollTo({top:Math.max(0,article.getBoundingClientRect().top+window.scrollY-90),behavior:"smooth"});return}
      if(a==="bottom"){window.scrollTo({top:article.getBoundingClientRect().bottom+window.scrollY-window.innerHeight+60,behavior:"smooth"});return}
      if(a==="autoscroll"){
        if(autoTimer){stopAuto();return}
        autoArticle=article;autoButton=rb;rb.classList.add("active");rb.textContent="Ⅱ";
        autoTimer=setInterval(()=>{
          const bottom=article.getBoundingClientRect().bottom;
          if(bottom<=window.innerHeight+4){stopAuto();return}
          window.scrollBy(0,1);
        },28);
        return;
      }
    }

    const step=ev.target.closest?.(".studio-steps .studio-step[data-studio-step]");
    if(step){ev.preventDefault();ev.stopPropagation();window.LMXStudioGoStep(step.dataset.studioStep);return}

    const clean=ev.target.closest?.("#bxCleanReadingToggle");
    if(clean){
      ev.preventDefault();
      const on=!Store.get("bibleXCleanReading",true);
      Store.set("bibleXCleanReading",on);
      document.querySelector(".bible-x-shell")?.classList.toggle("bx-clean-reading-mode",on);
      document.querySelector("#bOut")?.classList.toggle("bx-clean-reading",on);
      clean.classList.toggle("active",on);
      clean.textContent=on?"📖 Clean: ON":"📖 Leitura Clean";
      return;
    }


    const expand=ev.target.closest?.("[data-bx-expand]");
    if(expand){
      ev.preventDefault();ev.stopPropagation();
      const card=expand.closest("[data-bx-v3-verse]");
      if(!card)return;
      const mode=expand.dataset.bxExpand;
      const cls=mode==="x"?"bx-expand-x":"bx-expand-y";
      const on=!card.classList.contains(cls);
      card.classList.toggle(cls,on);
      expand.classList.toggle("active",on);
      expand.textContent=mode==="x"
        ? (on?"−X Ferramentas":"+X Ferramentas")
        : (on?"−Y Verso":"+Y Verso");
      return;
    }

    const primary=ev.target.closest?.("#bxPrimaryReading");
    if(primary){
      ev.preventDefault();ev.stopPropagation();
      try{
        if(typeof window.__bibleXOpen==="function") window.__bibleXOpen("read");
        else{
          const nav=document.querySelector('.bible-x-nav [data-bible-section="reader"]');
          nav?.click();
          Store.set("bibleXLastSection","reader");
          document.querySelector("#bOut")?.scrollIntoView({behavior:"smooth",block:"start"});
        }
      }catch(_){}
      return;
    }

    const br=ev.target.closest?.("[data-bx-read]");
    if(br){
      ev.preventDefault();ev.stopPropagation();
      const out=document.querySelector("#bOut");if(!out)return;
      const shell=document.querySelector(".bible-x-shell");
      const act=br.dataset.bxRead;
      let z=Number(out.dataset.bxZoom||100);

      if(act==="smaller")z=Math.max(70,z-10);
      if(act==="larger")z=Math.min(190,z+10);
      if(act==="reset")z=100;

      if(["smaller","larger","reset"].includes(act)){
        out.dataset.bxZoom=String(z);
        Store.set("bibleXZoom",z);
        out.style.setProperty("--bx-reader-scale",String(z/100));
        const reset=document.querySelector('[data-bx-read="reset"]');
        if(reset)reset.textContent=z+"%";
        return;
      }

      if(act==="fullscreen"){
        shell?.classList.add("bx-reading-full");
        document.body.classList.add("logos-reader-lock");
        br.hidden=true;
        const exit=document.querySelector('[data-bx-read="exit"]');if(exit)exit.hidden=false;
        setTimeout(()=>document.querySelector("#bOut")?.scrollIntoView({block:"start"}),30);
        return;
      }

      if(act==="exit"){
        shell?.classList.remove("bx-reading-full");
        document.body.classList.remove("logos-reader-lock");
        br.hidden=true;
        const full=document.querySelector('[data-bx-read="fullscreen"]');if(full)full.hidden=false;
        return;
      }
    }

  },true);

  document.addEventListener("keydown",function(ev){
    if(ev.key==="Escape"){
      const a=document.querySelector(".generated-message.lmx-reader-full");
      if(a)setFull(a,false);
      const bx=document.querySelector(".bible-x-shell.bx-reading-full");
      if(bx){bx.classList.remove("bx-reading-full");document.body.classList.remove("logos-reader-lock")}
    }
    const step=ev.target.closest?.(".studio-steps .studio-step[data-studio-step]");
    if(step&&(ev.key==="Enter"||ev.key===" ")){ev.preventDefault();window.LMXStudioGoStep(step.dataset.studioStep)}
  });

  function syncBibleClean(){
    const on=!!Store.get("bibleXCleanReading",true);
    document.querySelector(".bible-x-shell")?.classList.toggle("bx-clean-reading-mode",on);
    document.querySelector("#bOut")?.classList.toggle("bx-clean-reading",on);
    const b=document.querySelector("#bxCleanReadingToggle");
    if(b){b.classList.toggle("active",on);b.textContent=on?"📖 Clean: ON":"📖 Leitura Clean";}
  }
  new MutationObserver(syncBibleClean).observe(document.body,{childList:true,subtree:true});
  syncBibleClean();
})();

/* V8.13 — reforço funcional dos controles de leitura */
(function(){
  if(window.__LOGOS_READER_REPAIR_V813__)return;
  window.__LOGOS_READER_REPAIR_V813__=true;

  function article(btn){return btn.closest(".generated-message")}
  function apply(a,z){
    z=Math.max(70,Math.min(200,z));
    a.dataset.lmxZoom=String(z);
    a.style.setProperty("--lmx-reader-scale",String(z/100));
    a.querySelectorAll("[data-reader-zoom]").forEach(x=>x.textContent=z+"%");
  }

  document.addEventListener("click",function(e){
    const b=e.target.closest?.("[data-lmx-reader]");
    if(!b)return;
    const a=article(b);if(!a)return;
    e.preventDefault();e.stopImmediatePropagation();

    let z=Number(a.dataset.lmxZoom||100);
    const cmd=b.dataset.lmxReader;

    if(cmd==="smaller"){apply(a,z-10);return}
    if(cmd==="larger"){apply(a,z+10);return}
    if(cmd==="reset"){apply(a,100);return}
    if(cmd==="fullscreen"){
      a.classList.add("lmx-reader-full");
      document.body.classList.add("logos-reader-lock");
      const exit=a.querySelector('[data-lmx-reader="exitfullscreen"]');
      if(exit)exit.hidden=false;
      b.hidden=true;
      return;
    }
    if(cmd==="exitfullscreen"){
      a.classList.remove("lmx-reader-full");
      document.body.classList.remove("logos-reader-lock");
      const full=a.querySelector('[data-lmx-reader="fullscreen"]');
      if(full)full.hidden=false;
      b.hidden=true;
      return;
    }
    if(cmd==="top"){
      window.scrollTo({top:Math.max(0,a.getBoundingClientRect().top+scrollY-80),behavior:"smooth"});
      return;
    }
    if(cmd==="bottom"){
      window.scrollTo({top:a.getBoundingClientRect().bottom+scrollY-innerHeight+40,behavior:"smooth"});
      return;
    }
  },true);
})();

/* V8.13 — leitura global da Bíblia X */
(function(){
  if(window.__LOGOS_BX_GLOBAL_READER_V813__)return;
  window.__LOGOS_BX_GLOBAL_READER_V813__=true;

  function ensure(){
    const out=document.querySelector("#bOut");
    if(!out||document.querySelector(".bx-global-reader-toolbar"))return;
    const bar=document.createElement("div");
    bar.className="bx-global-reader-toolbar";
    bar.innerHTML=`<span>Leitura da Bíblia</span><div><button data-bx-global="smaller">A−</button><button data-bx-global="reset"><span data-bx-global-zoom>100%</span></button><button data-bx-global="larger">A+</button><button data-bx-global="fullscreen">⛶ Tela cheia</button><button data-bx-global="exit" hidden>✕ Sair</button></div>`;
    out.parentElement?.insertBefore(bar,out);
  }

  function apply(out,z){
    z=Math.max(70,Math.min(190,z));
    out.dataset.globalZoom=String(z);
    out.style.setProperty("--bx-reader-scale",String(z/100));
    document.querySelectorAll("[data-bx-global-zoom]").forEach(x=>x.textContent=z+"%");
  }

  document.addEventListener("click",e=>{
    const b=e.target.closest?.("[data-bx-global]");
    if(!b)return;
    const out=document.querySelector("#bOut");if(!out)return;
    e.preventDefault();e.stopPropagation();
    let z=Number(out.dataset.globalZoom||100);
    const c=b.dataset.bxGlobal;

    if(c==="smaller"){apply(out,z-10);return}
    if(c==="larger"){apply(out,z+10);return}
    if(c==="reset"){apply(out,100);return}

    if(c==="fullscreen"){
      out.classList.add("bx-global-full");
      document.body.classList.add("logos-reader-lock");
      b.hidden=true;
      const x=document.querySelector('[data-bx-global="exit"]');if(x)x.hidden=false;
      return;
    }
    if(c==="exit"){
      out.classList.remove("bx-global-full");
      document.body.classList.remove("logos-reader-lock");
      b.hidden=true;
      const f=document.querySelector('[data-bx-global="fullscreen"]');if(f)f.hidden=false;
    }
  },true);

  document.addEventListener("keydown",e=>{
    if(e.key!=="Escape")return;
    document.querySelector("#bOut")?.classList.remove("bx-global-full");
    document.body.classList.remove("logos-reader-lock");
    const f=document.querySelector('[data-bx-global="fullscreen"]'),x=document.querySelector('[data-bx-global="exit"]');
    if(f)f.hidden=false;if(x)x.hidden=true;
  });

  new MutationObserver(ensure).observe(document.body,{childList:true,subtree:true});
  ensure();
})();

/* V8.15 — controles diretos e resilientes da Bíblia X */
(function(){
  if(window.__LOGOS_BX_DIRECT_V815__)return;
  window.__LOGOS_BX_DIRECT_V815__=true;

  function applyState(){
    const out=document.querySelector("#bOut");
    const shell=document.querySelector(".bible-x-shell");
    if(!out||!shell)return;

    const clean=!!Store.get("bibleXCleanReading",true);
    const zoom=Number(Store.get("bibleXZoom",100))||100;
    out.classList.toggle("bx-clean-reading",clean);
    out.dataset.bxZoom=String(zoom);
    out.style.setProperty("--bx-reader-scale",String(zoom/100));

    const c=document.querySelector("#bxCleanReadingToggle");
    if(c){
      c.classList.toggle("active",clean);
      c.textContent=clean?"✨ Clean: ON":"✨ Clean";
    }
    const r=document.querySelector('[data-bx-read="reset"]');
    if(r)r.textContent=zoom+"%";
  }

  window.LMXBibleReader={
    open(){
      const nav=document.querySelector('.bible-x-nav [data-bible-section="reader"]');
      if(nav){nav.click();Store.set("bibleXLastSection","reader")}
      setTimeout(()=>{
        applyState();
        document.querySelector("#bOut")?.scrollIntoView({behavior:"smooth",block:"start"});
      },50);
    },
    clean(){
      const on=!Store.get("bibleXCleanReading",true);
      Store.set("bibleXCleanReading",on);
      applyState();
    },
    zoom(delta){
      let z=Number(Store.get("bibleXZoom",100))||100;
      if(delta===0)z=100;else z=Math.max(70,Math.min(190,z+delta));
      Store.set("bibleXZoom",z);
      applyState();
    },
    full(on){
      const shell=document.querySelector(".bible-x-shell");
      if(!shell)return;
      shell.classList.toggle("bx-reading-full",!!on);
      document.body.classList.toggle("logos-reader-lock",!!on);
      const full=document.querySelector('[data-bx-read="fullscreen"]');
      const exit=document.querySelector('[data-bx-read="exit"]');
      if(full)full.hidden=!!on;
      if(exit)exit.hidden=!on;
      if(on)setTimeout(()=>document.querySelector("#bOut")?.scrollIntoView({block:"start"}),30);
    }
  };

  document.addEventListener("click",function(e){
    const p=e.target.closest("#bxPrimaryReading");
    if(p){e.preventDefault();e.stopImmediatePropagation();window.LMXBibleReader.open();return}

    const c=e.target.closest("#bxCleanReadingToggle");
    if(c){e.preventDefault();e.stopImmediatePropagation();window.LMXBibleReader.clean();return}

    const b=e.target.closest("[data-bx-read]");
    if(!b)return;
    e.preventDefault();e.stopImmediatePropagation();
    const a=b.dataset.bxRead;
    if(a==="smaller")window.LMXBibleReader.zoom(-10);
    if(a==="larger")window.LMXBibleReader.zoom(10);
    if(a==="reset")window.LMXBibleReader.zoom(0);
    if(a==="fullscreen")window.LMXBibleReader.full(true);
    if(a==="exit")window.LMXBibleReader.full(false);
  },true);

  document.addEventListener("keydown",e=>{
    if(e.key==="Escape")window.LMXBibleReader.full(false);
  });

  new MutationObserver(applyState).observe(document.body,{childList:true,subtree:true});
  setTimeout(applyState,60);
})();

/* V8.17 — controlador DIRETO e único dos botões principais da Bíblia X */
(function(){
  if(window.__LMX_BX_V817__)return;
  window.__LMX_BX_V817__=true;

  const getOut=()=>document.querySelector("#bOut");
  const getShell=()=>document.querySelector(".bible-x-shell");
  const getZoom=()=>Math.max(70,Math.min(190,Number(Store.get("bibleXZoom",100))||100));

  function sync(){
    const out=getOut();
    if(!out)return;
    const clean=Store.get("bibleXCleanReading",true)!==false;
    const zoom=getZoom();

    out.classList.toggle("bx-clean-reading",clean);
    out.dataset.bxZoom=String(zoom);
    out.style.setProperty("--bx-reader-scale",String(zoom/100));

    const cleanBtn=document.querySelector("#bxCleanReadingToggle");
    if(cleanBtn){
      cleanBtn.classList.toggle("active",clean);
      cleanBtn.textContent=clean?"✨ Clean: ON":"✨ Clean: OFF";
    }
    const reset=document.querySelector("#bxZoomReset");
    if(reset)reset.textContent=zoom+"%";
  }

  window.LMXBX={
    openReader(){
      try{
        const btn=document.querySelector('.bible-x-nav [data-bible-section="reader"]');
        if(btn)btn.click();
        Store.set("bibleXLastSection","reader");
        setTimeout(()=>{
          sync();
          const out=getOut();
          if(out)out.scrollIntoView({behavior:"smooth",block:"start"});
        },60);
      }catch(e){console.error("[Bíblia X] abrir leitor",e)}
      return false;
    },

    toggleClean(){
      try{
        const next=!(Store.get("bibleXCleanReading",true)!==false);
        Store.set("bibleXCleanReading",next);
        sync();
      }catch(e){console.error("[Bíblia X] clean",e)}
      return false;
    },

    zoom(delta){
      try{
        let z=getZoom();
        z=Number(delta)===0?100:Math.max(70,Math.min(190,z+Number(delta||0)));
        Store.set("bibleXZoom",z);
        sync();
      }catch(e){console.error("[Bíblia X] zoom",e)}
      return false;
    },

    full(on){
      try{
        const shell=getShell();
        if(!shell)return false;
        shell.classList.toggle("bx-reading-full",!!on);
        document.body.classList.toggle("logos-reader-lock",!!on);

        const full=document.querySelector("#bxFullBtn");
        const exit=document.querySelector("#bxExitFullBtn");
        if(full)full.hidden=!!on;
        if(exit)exit.hidden=!on;

        if(on){
          setTimeout(()=>{
            sync();
            const out=getOut();
            if(out)out.scrollIntoView({block:"start"});
          },50);
        }
      }catch(e){console.error("[Bíblia X] fullscreen",e)}
      return false;
    },

    sync
  };

  // Extra: click no número do verso abre referência; duplo clique em palavra pesquisa concordância.
  document.addEventListener("keydown",e=>{
    if(e.key==="Escape"&&getShell()?.classList.contains("bx-reading-full"))window.LMXBX.full(false);
  });

  new MutationObserver(()=>{
    if(getOut())sync();
  }).observe(document.body,{childList:true,subtree:true});

  setTimeout(sync,100);
})();

