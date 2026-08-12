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
let mobileLoadingProgress=8;let mobileLoadingTimer=null;const mobileLoadingStartedAt=performance.now();
function startMobileLoading(){const el=document.getElementById('mobileLoadingBar');if(!el)return;mobileLoadingTimer=setInterval(()=>{mobileLoadingProgress=Math.min(92,mobileLoadingProgress+Math.max(1,(92-mobileLoadingProgress)*.08));el.style.width=mobileLoadingProgress+'%';},120);}
function finishMobileLoading(){
 if(mobileLoadingTimer){clearInterval(mobileLoadingTimer);mobileLoadingTimer=null}
 const el=document.getElementById('mobileLoadingBar');
 if(el)el.style.width='100%';
 const minVisible=1650;
 const wait=Math.max(180,minVisible-(performance.now()-mobileLoadingStartedAt));
 setTimeout(()=>{
   const splash=document.getElementById('mobileLoading');
   const startHomeFx=()=>{
     const host=window.matchMedia('(max-width:760px)').matches
       ? document.querySelector('.mobile-home-piece.mobile-home-hero')
       : document.querySelector('.reference-body-wrap.desktop-reference-home');
     if(!host || host.querySelector('.dna-canvas-fx-427')) return;

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
     const duration=4000; /* percurso completo ~4s */

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
const ROUTER_PROFILE_VERSION="3.5.0";
let _savedProvider=Store.get("aiProvider","auto"), _savedMode=Store.get("aiMode","automatico");
if(Store.get("routerProfileVersion","")!==ROUTER_PROFILE_VERSION){_savedProvider="gemini";_savedMode="rapido";Store.set("aiProvider",_savedProvider);Store.set("aiMode",_savedMode);Store.set("routerProfileVersion",ROUTER_PROFILE_VERSION);}
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
function setStatus(){const e=$("#status");if(!e)return;if(App.server){const ps=App.health?.providers||{};const n=["gemini","groq","openrouter","huggingface","openai"].filter(k=>ps[k]).length;e.innerHTML=`<span class="status-dot"></span><strong>${n} ONLINE</strong><span class="status-reserve">• 1 RESERVA LOCAL</span><span class="status-chevron">⌄</span>`;e.className="status top-provider-status online status-clickable";e.title="${n} provedores online + 9Router como reserva local";e.onclick=providerStatusModal;}else{e.innerHTML='<span class="status-dot"></span><strong>LOCAL</strong><span>API offline</span>';e.className="status top-provider-status status-clickable";e.onclick=providerStatusModal;}}

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
  <div class="mobile-home-piece mobile-home-slogan"><img data-piece="slogan" src="${(COLOR_THEMES[activeVisual().palette]||COLOR_THEMES.bluegold).mobile}/slogan.jpg?v=themes4" alt="Da Palavra ao Púlpito. Da inspiração à preparação."></div>
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
 return `<div class="quick-generator-pro">
  <section class="quick-hero"><div><span>⚡ GERADOR RÁPIDO</span><h2>Gerador Rápido</h2><p>Geração ultra rápida de mensagens e dicas em segundos, com a mesma identidade visual do Studio X.</p></div><button class="btn secondary" data-go="studio">Studio X completo →</button></section>
  <div class="quick-tabs"><button class="active" data-quick-tab="message">⚡ Mensagem rápida</button><button data-quick-tab="tips">💡 Dica rápida</button></div>
  <div class="quick-layout"><main>
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
   <div class="quick-run-grid" id="quickRunGrid">
    <button class="btn primary quick-run quick-run-full" id="quickRunFull">⚡ GERAR MENSAGEM COMPLETA <small>Usa o direcionamento selecionado acima</small></button>
    <button class="btn secondary quick-run quick-run-outline" id="quickRunOutline">📋 GERAR SOMENTE ESBOÇO <small>Estrutura resumida, sem desenvolver toda a mensagem</small></button>
   </div>
   <div class="quick-actions"><button class="btn secondary" id="quickCopy">📋 COPIAR TEXTO</button><button class="btn secondary" id="quickEditor">✏️ ABRIR NO EDITOR</button><button class="btn secondary" id="quickLibrary">📚 SALVAR NA BIBLIOTECA</button><button class="btn secondary" id="quickProject">📁 SALVAR PROJETO</button></div>
   <div class="output quick-output" id="quickOut">✓ Pronto para gerar!
Preencha os campos acima e clique em GERAR / EXECUTAR.</div>
  </main></div>
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
 dnaProfiles.forEach(x=>{if(savedProfileScores && savedProfileScores[x.id]!=null)x.score=Math.max(0,Math.min(110,Number(savedProfileScores[x.id])||0))});
 const graphMode=Store.get("studioDNAGraphMode","gauge");
 const profileGraph=(x)=>{
   if(graphMode==="line"){
     const base=[28,44,35,55,43,62,49,68,58,76,65,84];
     const pts=base.map((v,i)=>`${8+i*10},${58-Math.min(52,Math.max(5,(v*x.score/110)*.62))}`).join(" ");
     return `<div class="dna-score-viz dna-score-line"><svg viewBox="0 0 120 64" aria-hidden="true"><polyline points="${pts}" fill="none" stroke="currentColor" stroke-width="2.7" stroke-linecap="round" stroke-linejoin="round"/><g>${pts.split(' ').map(pt=>{const [cx,cy]=pt.split(',');return `<circle cx="${cx}" cy="${cy}" r="2.2" fill="currentColor"/>`}).join('')}</g></svg></div>`;
   }
   const pct=Math.max(0,Math.min(110,Number(x.score)||0));
   return `<div class="dna-score-viz dna-score-gauge"><svg viewBox="0 0 120 72" aria-hidden="true"><path class="gauge-track" d="M10 62 A50 50 0 0 1 110 62" pathLength="110"/><path class="gauge-value" d="M10 62 A50 50 0 0 1 110 62" pathLength="110" stroke-dasharray="${pct} 110"/></svg></div>`;
 };
 const charRows=[
  ["fidelidade","✦","Fidelidade Bíblica","Uso e exposição das Escrituras"],
  ["exposicao","📖","Exposição","Profundidade da explicação do texto"],
  ["aplicacao","💡","Aplicação","Aplicações práticas à vida"],
  ["progressao","↗","Progressão","Crescimento e intensidade da mensagem"],
  ["climax","🔥","Clímax","Força do clímax e impacto"],
  ["apelo","🎯","Apelo","Convocação e desafio final"]
 ];
 return `<div class="studio-wizard studio-refined">
  <section class="dna-studio-title"><div class="dna-title-mark">🧬</div><div><h2>DNA K7 Studio X</h2><p>Oficina de Padrões e Criação de Mensagens</p></div><div class="dna-title-actions"><button class="btn secondary">▶ Tutoriais</button><button class="btn secondary">📖 Biblioteca DNA</button><button class="btn secondary">♟ Meus Perfis</button><button class="btn secondary" data-go="dashboard">← Voltar ao Studio</button></div></section>
  <div class="studio-steps">${[[1,"Selecionar DNA","Escolha um perfil ou crie"],[2,"Personalizar","Ajuste características"],[3,"Configurar Mensagem","Texto, tempo, público e foco"],[4,"Visualizar Estrutura","Veja o esboço gerado"],[5,"Gerar Mensagem","IA cria sua pregação"],[6,"Processando","Acompanhe a geração"],[7,"Mensagem","Resultado completo"]].map(([n,t,sub])=>`<div class="studio-step ${n===1?"active":""}"><b>${n}</b><span><strong>${t}</strong><small>${sub}</small></span></div>`).join("")}</div>
  <div class="dna-main-layout"><main>
   <section class="dna-ref-panel dna-profile-panel"><div class="dna-panel-head"><div><h3>Escolha o DNA de referência</h3><p>Use um perfil pronto, combine perfis ou crie um novo do zero.</p></div><div class="dna-panel-tools"><div class="dna-graph-switch" role="group" aria-label="Modelo do gráfico"><button type="button" data-graph-mode="gauge" class="${graphMode==='gauge'?'active':''}">◔ Medidor</button><button type="button" data-graph-mode="line" class="${graphMode==='line'?'active':''}">⌁ Linha</button></div><button class="btn secondary" id="dnaFilterToggle">⚱ Filtros</button><div class="dna-mini-search">⌕ <input id="dnaSearch" placeholder="Buscar DNA..."></div></div></div>
    <div class="dna-filter-row" id="dnaFilterRow"><button class="active" data-dna-filter="all">Todos</button><button data-dna-filter="Pentecostal">Pentecostal</button><button data-dna-filter="Bíblico">Bíblico</button><button data-dna-filter="Pastoral">Pastoral</button><button data-dna-filter="Profundo">Profundo</button></div>
    <div class="dna-profile-grid" id="dnaGrid">${dnaProfiles.map(x=>`<article class="dna-profile-card ${selected.includes(x.id)?"selected":""}" data-dna-card="${x.id}" data-name="${(x.code+' '+x.name+' '+x.tag+' '+x.tags.join(' ')).toLowerCase()}"><button class="dna-fav ${selected.includes(x.id)?'active':''}" title="DNA de referência" aria-label="DNA de referência">🧬</button><div class="dna-profile-top"><i>${x.icon}</i><div><h4>${x.name.replace(' K7','').replace(' Forte','').replace(' Clássico','')}</h4><small>${x.tag}</small></div></div>${profileGraph(x)}<div class="dna-score"><strong data-profile-score-value="${x.id}">${x.score}%</strong><small>DNA Score</small></div><div class="dna-score-adjust"><button type="button" data-score-step="-1" data-score-id="${x.id}">−</button><input type="range" min="0" max="110" step="1" value="${x.score}" data-profile-score="${x.id}"><button type="button" data-score-step="1" data-score-id="${x.id}">+</button></div><button class="dna-select-btn" data-dna-select="${x.id}">${selected.includes(x.id)?'✓ Selecionado ✓':'Selecionar'}</button></article>`).join('')}<article class="dna-profile-card dna-create-card"><div class="dna-create-plus">＋</div><h4>Criar novo DNA</h4><small>Comece do zero</small><button class="dna-select-btn" id="dnaCreate">Criar</button></article></div>
   </section>
   <section class="dna-ref-panel dna-mixer"><div class="dna-panel-head"><div><h3>Misturador de DNA <small>(opcional)</small></h3><p>Combine até 3 perfis para gerar um DNA único e personalizado.</p></div><div class="dna-total"><small>Total</small><strong id="dnaMixTotal">100%</strong></div></div><div id="dnaMixerRows" class="dna-mixer-rows">${selected.map((id,i)=>{const x=dnaProfiles.find(p=>p.id===id);return `<div class="dna-mix-row" data-mix-id="${id}"><div class="dna-mix-label"><span>${x?.icon||'🧬'}</span><div><strong>${(x?.name||id).replace(' K7','').replace(' Forte','').replace(' Clássico','')}</strong><small>${i===0?'Perfil principal':'Perfil complementar'}</small></div></div><input class="dna-mix-range" data-mix-range="${id}" type="range" min="0" max="100" step="1" value="${weights[id]||0}"><output data-mix-output="${id}">${weights[id]||0}%</output><button data-mix-remove="${id}" title="Remover">×</button></div>`}).join('')}</div><button class="dna-add-profile" id="dnaAddProfile">＋ Adicionar perfil</button></section>
   <section class="dna-adjust-grid"><div class="dna-ref-panel dna-adjust"><div class="dna-panel-head"><div><h3>Ajuste fino das características do DNA</h3><p>Personalize os níveis de cada característica do perfil selecionado ou combinado.</p></div></div><div class="dna-characteristics">${charRows.map(([key,ico,name,desc])=>`<div class="dna-char-row"><div class="dna-char-info"><i>${ico}</i><div><strong>${name}</strong><small>${desc}</small></div></div><input type="range" min="0" max="100" step="1" value="${chars[key]}" data-char-range="${key}"><output data-char-output="${key}">${chars[key]}%</output></div>`).join('')}</div><button class="dna-reset" id="dnaResetChars">Restaurar padrões</button></div>
    <div class="dna-ref-panel dna-radar-panel"><h3>Visualização do DNA</h3><svg id="dnaRadar" class="dna-radar" viewBox="0 0 360 300" role="img" aria-label="Gráfico radar do DNA"></svg><div class="dna-radar-legend"><span><i></i> Seu perfil</span><span><i class="avg"></i> Média geral</span></div></div></section>
  </main><aside class="dna-summary-col"><section class="dna-ref-panel dna-summary"><h3>Resumo do DNA Atual</h3><div class="dna-summary-top"><div class="dna-orbit"><div><b id="dnaScore">${Math.round(Object.values(chars).reduce((a,b)=>a+b,0)/6)}</b><small>DNA Score</small></div></div><div class="dna-summary-bars">${charRows.map(([key,,name])=>`<label>${name}<i><b data-summary-bar="${key}" style="width:${chars[key]}%"></b></i><span data-summary-value="${key}">${chars[key]}</span></label>`).join('')}</div></div><div class="dna-style-box"><span>💡</span><div><strong>Estilo predominante</strong><p id="dnaStyleText">Expositivo progressivo com forte clímax e aplicações práticas.</p></div></div><button class="btn secondary dna-full-btn">Ver detalhes completos</button></section>
   <section class="dna-ref-panel dna-system-summary"><h3>Resumo do Sistema <em>${App.server?'● Online':'● Local'}</em></h3><div><span>Versão</span><b>3.8.1</b></div><div><span>DNA K7 (Perfis)</span><b>${dnaProfiles.length}</b></div><div><span>Precisão (Quality Gate)</span><b>${escapeHtml(String(App.health?.quality_gate||'—'))}</b></div><div><span>Update Center</span><b>${App.server?'Ativo':'Modo local'}</b></div><div><span>Modo Mobile</span><b>${window.matchMedia?.('(max-width: 760px)')?.matches?'Mobile':'Desktop'}</b></div><div><span>Backend / API</span><b>${App.server?'Online':'Local/Offline'}</b></div><div><span>Provedores IA</span><b>${Object.values(App.health?.providers||{}).filter(Boolean).length} online</b></div><div><span>Versão fixa</span><b>3.8.1</b></div></section>
   <section class="dna-ref-panel dna-apps"><h3>Aplicações características</h3><label>✓ Conecta o texto com a vida do ouvinte</label><label>✓ Usa ilustrações e exemplos marcantes</label><label>✓ Progressão crescente até o clímax</label><label>✓ Apelo claro e desafiador ao final</label></section>
   <section class="dna-ref-panel dna-origin"><h3>DNA foi gerado de</h3><div id="dnaOriginList"></div></section>
   <section class="dna-ref-panel dna-tip"><b>💡 Dica</b><p>Quanto mais perfis você combina, mais único e equilibrado ficará o resultado.</p></section>
  </aside></div>
  <section class="dna-nextbar"><div><strong>A próxima etapa</strong><p>Após ajustar e combinar seu DNA, você poderá configurar o texto e os detalhes da mensagem.</p></div><div class="dna-next-stats"><span>🧬 <b id="dnaSelectedCount">${selected.length}</b> DNA(s)</span><span>📖 Mistura <b id="dnaMixCount">${selected.length}</b> perfil(is)</span><span>⚙ <b>6</b> características</span><span>🏅 Score <b id="dnaBottomScore">${Math.round(Object.values(chars).reduce((a,b)=>a+b,0)/6)}/100</b></span></div><button class="dna-next-btn" id="dnaNext">Próximo passo <small>Personalizar</small> →</button></section>
 </div>`},
 bible(){return `<h2>📖 Bíblia Local</h2><p class="muted">Importe uma tradução cuja licença permita seu uso. O texto fica somente neste navegador.</p>
 <div class="row"><input type="file" id="bFile" accept=".json,.csv,.txt"><button class="btn primary" id="bImport">Importar Bíblia</button><button class="btn secondary" id="bMeta">Status</button></div>
 <label>Referência</label><input id="bRef" placeholder="João 3:16 ou Romanos 8"><div class="row"><button class="btn primary" id="bOpen">Abrir</button><button class="btn secondary" id="bSend">Enviar ao Studio</button></div>
 <label>Pesquisar palavra/frase</label><input id="bSearch" placeholder="oração"><div class="row"><button class="btn blue" id="bFind">Pesquisar</button><button class="btn secondary" id="bConcordance">Concordância</button></div>
 <div id="bOut" class="output">Nenhuma Bíblia importada.</div>`},
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

async function render(view){
 App.view=view; $$(".nav button").forEach(b=>b.classList.toggle("active",b.dataset.view===view)); $("#workspace").innerHTML=views[view]?views[view]():"<h2>Módulo</h2>";
 $$("[data-go]").forEach(b=>b.onclick=()=>navigateView(b.dataset.go));
 if(view==="dashboard"){$("#installPwaHome")?.addEventListener("click",installPwa);} $$(".top-nav [data-go]").forEach(b=>b.classList.toggle("active",b.dataset.go===view)); if($("#installPwaSide"))$("#installPwaSide").onclick=installPwa;
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
     if(full)full.innerHTML=t==="tips"
       ?'💡 GERAR DICA RÁPIDA <small>Gerar dicas a partir do tema ou passagem</small>'
       :'⚡ GERAR MENSAGEM COMPLETA <small>Usa o direcionamento selecionado acima</small>';
     if(outline)outline.hidden=t==="tips";
   };
   $$('[data-quick-tab]').forEach(b=>b.onclick=()=>setTab(b.dataset.quickTab));
   $$('[data-quick-mode]').forEach(b=>b.onclick=()=>{mode=b.dataset.quickMode;Store.set("quickGenMode",mode);$$('[data-quick-mode]').forEach(x=>x.classList.toggle('active',x===b));});
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
         const r=await runCommand('ESTUDAR',d);App.lastStudioText=r.text;out.textContent=r.text;
         Store.push('history',{id:Date.now(),cmd:'DICA RÁPIDA',input:d,result:r.text,created:new Date().toISOString()});
       }finally{App.aiMode=oldMode}
       return;
     }
     const d=fd();if(!d.text){out.textContent='Digite o texto bíblico ou tema.';return}
     const cmd=kind==='outline'?'ESBOÇO':($('#cmd').value||'SERMÃO');
     out.textContent=kind==='outline'?'Gerando somente o esboço...':'Gerando mensagem completa...';
     const oldMode=App.aiMode;App.aiMode=mode;const started=performance.now();
     try{
       const r=await runCommand(cmd,d);
       const secs=Math.round((performance.now()-started)/1000);saveModeTime(mode,secs);
       App.lastStudioText=r.text;out.textContent=r.text;
       Store.push('history',{id:Date.now(),cmd,input:d,result:r.text,provider:r.provider||'',quality:r.quality||null,created:new Date().toISOString()});
     }finally{App.aiMode=oldMode}
   };
   $('#quickRunFull').onclick=()=>runQuick('full');
   $('#quickRunOutline').onclick=()=>runQuick('outline');
   setTab(tab);
   $('#quickCopy').onclick=()=>copy($('#quickOut').textContent||'');
   $('#quickEditor').onclick=()=>{const t=$('#quickOut').textContent||'';Store.set('editor',{title:'Gerador Rápido',text:t});render('editor')};
   $('#quickLibrary').onclick=()=>{const t=$('#quickOut').textContent||'';if(!t||t==='Pronto.')return;saveMaterial('quick','Gerador Rápido',t,{mode});alert('Salvo na Biblioteca.')};
   $('#quickProject').onclick=()=>{const t=$('#quickOut').textContent||'';if(!t||t==='Pronto.')return;Store.push('projects',{name:'Gerador Rápido',result:t,created:new Date().toISOString()});alert('Projeto salvo.')};
 }
 if(view==="studio"){
   const profiles={k7:{code:"K7-003",name:"Clássico K7",icon:"🧬",score:91},pentecostal:{code:"K7-001",name:"Pentecostal",icon:"🔥",score:89},pastoral:{code:"K7-007",name:"Pastoral Forte",icon:"💚",score:86},biblico:{code:"K7-002",name:"Bíblico Clássico",icon:"📖",score:90},textual:{code:"K7-004",name:"Textual",icon:"🎯",score:88},tematica:{code:"K7-005",name:"Temática",icon:"💡",score:87},doutrinaria:{code:"K7-006",name:"Doutrinária",icon:"📚",score:92},exegetica:{code:"K7-008",name:"Exegética",icon:"🔎",score:94}};const savedScores=Store.get("studioDNAScores",{});Object.keys(profiles).forEach(id=>{if(savedScores[id]!=null)profiles[id].score=Math.max(0,Math.min(110,Number(savedScores[id])||0))});
   let selected=Store.get("studioDNASelection",["k7"]);if(!Array.isArray(selected)||!selected.length)selected=["k7"];
   let weights=Object.assign({},Store.get("studioDNAWeights",{}));
   const defaultWeights=()=>selected.length===1?[100]:selected.length===2?[60,40]:[50,30,20];
   const normalizeWeights=()=>{const d=defaultWeights();let sum=0;selected.forEach((id,i)=>{let v=Number(weights[id]);if(!Number.isFinite(v))v=d[i]||0;weights[id]=Math.max(0,Math.min(100,v));sum+=weights[id]});if(sum!==100){selected.forEach((id,i)=>weights[id]=d[i]||0)};Object.keys(weights).forEach(id=>{if(!selected.includes(id))delete weights[id]})};normalizeWeights();
   const charDefaults={fidelidade:90,exposicao:85,aplicacao:80,progressao:90,climax:95,apelo:85};let chars=Object.assign({},charDefaults,Store.get("studioDNACharacteristics",{}));
   const charNames={fidelidade:"Fidelidade Bíblica",exposicao:"Exposição",aplicacao:"Aplicação",progressao:"Progressão",climax:"Clímax",apelo:"Apelo"};
   const saveState=()=>{Store.set("studioDNASelection",selected);Store.set("studioDNAWeights",weights);Store.set("studioDNACharacteristics",chars)};
   const paintRange=(el)=>{if(el)el.style.setProperty("--range-fill",`${Math.max(0,Math.min(100,Number(el.value)||0))}%`)};
   const paintAllRanges=()=>{$$('[data-mix-range],[data-char-range]').forEach(paintRange)};
   const rebalance=(changedId,newValue)=>{newValue=Math.max(0,Math.min(100,Number(newValue)||0));const others=selected.filter(id=>id!==changedId);if(!others.length){weights[changedId]=100;return}const remain=100-newValue;const oldTotal=others.reduce((s,id)=>s+(weights[id]||0),0);weights[changedId]=newValue;if(oldTotal<=0){const each=Math.floor(remain/others.length);let used=0;others.forEach((id,i)=>{weights[id]=i===others.length-1?remain-used:each;used+=weights[id]})}else{let used=0;others.forEach((id,i)=>{let v=i===others.length-1?remain-used:Math.round(remain*(weights[id]||0)/oldTotal);v=Math.max(0,Math.min(remain-used,v));weights[id]=v;used+=v})}};
   const renderRadar=()=>{const svg=$("#dnaRadar");if(!svg)return;const keys=["fidelidade","exposicao","aplicacao","progressao","climax","apelo"],labels=["Fidelidade Bíblica","Exposição","Aplicação","Progressão","Clímax","Apelo"],cx=180,cy=145,r=104,pts=(factor)=>keys.map((k,i)=>{const a=-Math.PI/2+i*Math.PI*2/6,rr=r*factor*(chars[k]/100);return [cx+Math.cos(a)*rr,cy+Math.sin(a)*rr]}),poly=a=>a.map(p=>p.map(n=>n.toFixed(1)).join(',')).join(' ');let html='';for(let ring=1;ring<=5;ring++){const rr=r*ring/5;const q=keys.map((_,i)=>{const a=-Math.PI/2+i*Math.PI*2/6;return [cx+Math.cos(a)*rr,cy+Math.sin(a)*rr]});html+=`<polygon points="${poly(q)}" class="radar-grid"/>`}keys.forEach((_,i)=>{const a=-Math.PI/2+i*Math.PI*2/6,x=cx+Math.cos(a)*r,y=cy+Math.sin(a)*r,lx=cx+Math.cos(a)*(r+25),ly=cy+Math.sin(a)*(r+25);html+=`<line x1="${cx}" y1="${cy}" x2="${x}" y2="${y}" class="radar-axis"/><text x="${lx}" y="${ly}" class="radar-label" text-anchor="middle">${labels[i]}</text>`});const avg=keys.map((_,i)=>{const a=-Math.PI/2+i*Math.PI*2/6,rr=r*.72;return [cx+Math.cos(a)*rr,cy+Math.sin(a)*rr]});const p=pts(1);html+=`<polygon points="${poly(avg)}" class="radar-average"/><polygon points="${poly(p)}" class="radar-profile"/>`;p.forEach(([x,y])=>html+=`<circle cx="${x}" cy="${y}" r="4" class="radar-dot"/>`);svg.innerHTML=html};
   const syncSummary=()=>{const score=Math.round(Object.values(chars).reduce((a,b)=>a+Number(b),0)/Object.keys(charDefaults).length);$("#dnaScore")&&($("#dnaScore").textContent=score);$("#dnaBottomScore")&&($("#dnaBottomScore").textContent=score+"/100");Object.keys(charDefaults).forEach(k=>{const bar=document.querySelector(`[data-summary-bar="${k}"]`),val=document.querySelector(`[data-summary-value="${k}"]`);if(bar)bar.style.width=chars[k]+"%";if(val)val.textContent=chars[k]});const origin=$("#dnaOriginList");if(origin)origin.innerHTML=selected.map((id,i)=>`<p><b>${i===0?'Perfil principal':'Perfil complementar'}:</b> ${profiles[id]?.code||''} ${profiles[id]?.name||id} (${weights[id]||0}%)</p>`).join('')+`<small>Última atualização: ${new Date().toLocaleString()}</small>`;$("#dnaSelectedCount")&&($("#dnaSelectedCount").textContent=selected.length);$("#dnaMixCount")&&($("#dnaMixCount").textContent=selected.length);renderRadar()};
   const syncCards=()=>{$$('[data-dna-card]').forEach(c=>{const on=selected.includes(c.dataset.dnaCard);c.classList.toggle('selected',on);const b=c.querySelector('.dna-select-btn');if(b)b.textContent=on?'✓ Selecionado ✓':'Selecionar'});};
   const rerender=()=>{saveState();render('studio')};
   $$('[data-dna-select]').forEach(b=>b.onclick=e=>{e.stopPropagation();const id=b.dataset.dnaSelect;if(selected.includes(id)){if(selected.length===1)return actionModal({icon:"🧬",title:"Mantenha um DNA",message:"É necessário manter pelo menos um perfil selecionado.",actions:[{label:"Entendi",kind:"primary"}]});selected=selected.filter(x=>x!==id)}else{if(selected.length>=3)return actionModal({icon:"🧬",title:"Limite de 3 perfis",message:"Remova um perfil antes de adicionar outro.",actions:[{label:"Entendi",kind:"primary"}]});selected.push(id)}weights={};normalizeWeights();rerender()});
   $$('[data-dna-card]').forEach(c=>c.onclick=e=>{if(e.target.closest('button'))return;c.querySelector('.dna-select-btn')?.click()});
   const saveProfileScore=(id,value)=>{const x=profiles[id];if(!x)return;const v=Math.max(0,Math.min(110,Number(value)||0));x.score=v;const saved=Store.get("studioDNAScores",{});saved[id]=v;Store.set("studioDNAScores",saved);const out=document.querySelector(`[data-profile-score-value="${id}"]`);if(out)out.textContent=v+"%";const range=document.querySelector(`[data-profile-score="${id}"]`);if(range)range.value=v};
   $$('[data-profile-score]').forEach(r=>{r.oninput=()=>saveProfileScore(r.dataset.profileScore,r.value);r.onchange=()=>render('studio')});
   $$('[data-graph-mode]').forEach(b=>b.onclick=e=>{e.stopPropagation();Store.set("studioDNAGraphMode",b.dataset.graphMode);render('studio')});
   $$('[data-score-step]').forEach(b=>b.onclick=e=>{e.stopPropagation();const id=b.dataset.scoreId,range=document.querySelector(`[data-profile-score="${id}"]`);if(range)saveProfileScore(id,Number(range.value)+Number(b.dataset.scoreStep||0))});
   $$('[data-mix-range]').forEach(r=>r.oninput=()=>{rebalance(r.dataset.mixRange,r.value);selected.forEach(id=>{const input=document.querySelector(`[data-mix-range="${id}"]`),out=document.querySelector(`[data-mix-output="${id}"]`);if(input){input.value=weights[id];paintRange(input)}if(out)out.textContent=weights[id]+"%"});$("#dnaMixTotal")&&($("#dnaMixTotal").textContent="100%");saveState();syncSummary()});
   $$('[data-mix-remove]').forEach(b=>b.onclick=()=>{if(selected.length===1)return;selected=selected.filter(id=>id!==b.dataset.mixRemove);weights={};normalizeWeights();rerender()});
   $("#dnaAddProfile")?.addEventListener('click',()=>{if(selected.length>=3)return actionModal({icon:"🧬",title:"Mistura completa",message:"Você já combinou 3 perfis, que é o limite desta etapa.",actions:[{label:"Fechar",kind:"primary"}]});const next=Object.keys(profiles).find(id=>!selected.includes(id));if(next){selected.push(next);weights={};normalizeWeights();rerender()}});
   $$('[data-char-range]').forEach(r=>r.oninput=()=>{const k=r.dataset.charRange;chars[k]=Number(r.value);const o=document.querySelector(`[data-char-output="${k}"]`);if(o)o.textContent=r.value+'%';paintRange(r);saveState();syncSummary()});
   $("#dnaResetChars")?.addEventListener('click',()=>{chars={...charDefaults};Store.set("studioDNACharacteristics",chars);rerender()});
   const filterCards=()=>{const q=($("#dnaSearch")?.value||'').toLowerCase().trim(),active=document.querySelector('[data-dna-filter].active')?.dataset.dnaFilter||'all';let count=0;$$('[data-dna-card]').forEach(c=>{const hit=(!q||c.dataset.name.includes(q))&&(active==='all'||c.dataset.name.includes(active.toLowerCase()));c.style.display=hit?'':'none';if(hit)count++})};$("#dnaSearch")?.addEventListener('input',filterCards);$$('[data-dna-filter]').forEach(b=>b.onclick=()=>{$$('[data-dna-filter]').forEach(x=>x.classList.remove('active'));b.classList.add('active');filterCards()});$("#dnaFilterToggle")?.addEventListener('click',()=>$("#dnaFilterRow")?.classList.toggle('show'));$("#dnaCreate")?.addEventListener('click',()=>actionModal({icon:"＋",title:"Criar novo DNA",message:"O construtor de DNA personalizado será ligado à área Meus Perfis. Nesta etapa, os perfis prontos já podem ser combinados e ajustados.",actions:[{label:"Entendi",kind:"primary"}]}));
   $("#dnaNext")?.addEventListener('click',()=>{saveState();actionModal({icon:"✓",title:"Etapa 1 concluída",message:"DNA selecionado, mistura e características foram salvos. Próxima página: Personalizar.",actions:[{label:"Continuar",kind:"primary"}]})});normalizeWeights();saveState();syncCards();syncSummary();paintAllRanges();
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

const APP_BUILD_VERSION="3.8.2";
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
   const top=document.querySelector('.top');
   if(top&&!document.querySelector('#aboutTopBtn')){
     const x=document.createElement('button');x.id='aboutTopBtn';x.className='top-mini';x.textContent='ⓘ Sobre';x.onclick=()=>toggleTopView('about');safeTopInsert(x);
   }
   updateInstallSideButton();
   const top2=document.querySelector(".top");
   if(top2&&!document.querySelector("#appearanceBtn")){
     const b=document.createElement("button");b.id="appearanceBtn";b.className="btn secondary appearance-trigger";b.textContent="🎨 Aparência";b.onclick=toggleAppearancePanel;safeTopInsert(b);
   }
   // Monta a Home apenas uma vez.
   render("dashboard");
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
