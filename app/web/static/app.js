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
const App={view:"dashboard",server:false,api:Store.get("api",DEFAULT_API),provider:Store.get("aiProvider","auto"),aiMode:Store.get("aiMode","automatico"),model:Store.get("aiModel",""),health:null,currentText:"",timer:null,timerStart:0,timerSeconds:0};

const commands=["ESTUDAR","CONTEXTO","EXEGESE","HERMENÊUTICA","ESBOÇO","SERMÃO","SÉRIE","REVISAR","APLICAR","ILUSTRAR","CONCLUIR","ORAÇÃO","DEVOCIONAL","AULA"];

function escapeHtml(s=""){return String(s).replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#039;"}[m]))}
function download(name,text,type="text/plain"){const a=document.createElement("a");a.href=URL.createObjectURL(new Blob([text],{type}));a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),500)}
async function copy(text){try{await navigator.clipboard.writeText(text);alert("Copiado.")}catch{alert("Não foi possível copiar automaticamente.")}}

function durationProfile(m){
 m=Number(m);
 if(m<=20)return "2 pontos; introdução curta; contexto essencial; aplicações diretas; clímax e apelo objetivos.";
 if(m<=35)return "3 pontos; contexto suficiente; aplicações maiores; transições claras.";
 if(m<=50)return "4 pontos; contexto e exposição ampliados; mais aplicações; uma ilustração quando útil.";
 return "máximo 5 pontos; exposição profunda; sínteses intermediárias; aplicações variadas; clímax construído lentamente.";
}
function k7(level){
 const map={1:"Expositivo suave",2:"Expositivo pentecostal",3:"K7 equilibrado",4:"K7 intenso",5:"K7 máximo com controle"};
 return map[level]||map[3];
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
INTENSIDADE K7: ${d.intensity}/5 — ${k7(d.intensity)}
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
DNA K7: ${d.intensity}/5 (${k7(d.intensity)})

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
Nível: ${d.intensity}/5.

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
     const r=await fetch(App.api.replace(/\/$/,"")+"/api/generate-ai",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({
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
function saveMaterial(type,title,text,meta={}){return Store.push("library",{id:Date.now(),type,title:title||"Sem título",text,meta,created:new Date().toISOString()})}

async function checkApi(){
 if(!App.api){App.server=false;App.health=null;setStatus();return}
 try{
   const c=new AbortController();setTimeout(()=>c.abort(),2500);
   const r=await fetch(App.api.replace(/\/$/,"")+"/api/health",{signal:c.signal,cache:"no-store"});
   App.server=r.ok;
   App.health=r.ok?await r.json():null;
 }catch{App.server=false;App.health=null}
 setStatus();
}
function setStatus(){const e=$("#status");if(!e)return;
 if(App.server){
   const ps=App.health?.providers||{};
   const n=Object.values(ps).filter(Boolean).length;
   e.textContent=`ONLINE / IA ${n} provedor${n===1?"":"es"} ✅`;
   e.className="status online";
 }else{e.textContent="LOCAL / OFFLINE ✅";e.className="status "}
}

function form(){
 return `<div class="two">
 <div><label>Texto bíblico / tema</label><textarea id="fText" placeholder="Ex.: Lamentações 5:21-22 — restauração espiritual"></textarea></div>
 <div><label>Objetivo</label><textarea id="fObjective" placeholder="Ex.: levar a igreja ao arrependimento e à esperança"></textarea></div></div>
 <div class="three">
 <div><label>Tempo</label><select id="fDuration">${[20,30,35,40,50,60,70].map(x=>`<option ${x===40?"selected":""}>${x}</option>`).join("")}</select></div>
 <div><label>Tipo de culto</label><select id="fCult">${["Avivamento","Doutrina","Santa Ceia","Missões","Jovens","Família","Círculo de Oração","Evangelístico","EBD"].map(x=>`<option>${x}</option>`).join("")}</select></div>
 <div><label>Intensidade K7</label><select id="fK7">${[1,2,3,4,5].map(x=>`<option ${x===3?"selected":""}>${x}</option>`).join("")}</select></div>
 </div>
 <label>Público</label><input id="fAudience" value="Igreja local">
 <label>Observações</label><textarea id="fNotes" placeholder="Observações, foco, limitações..."></textarea>`;
}
function fd(){return {text:$("#fText")?.value.trim()||"",objective:$("#fObjective")?.value.trim()||"",duration:Number($("#fDuration")?.value||40),cult:$("#fCult")?.value||"Avivamento",intensity:Number($("#fK7")?.value||3),audience:$("#fAudience")?.value||"Igreja local",notes:$("#fNotes")?.value.trim()||""}}

const views={
 dashboard(){const lib=Store.get("library",[]),proj=Store.get("projects",[]);return `<div class="hero"><h1>LOGOS MASTER X</h1><p>Sistema de preparação bíblica • Local/Offline + API opcional • DNA K7</p></div>
 <div class="grid">
 <div class="card"><h3>🎛️ Studio</h3><p class="muted">Central de produção com 14 comandos LOGOS.</p><button class="btn primary" data-go="studio">Abrir</button></div>
 <div class="card"><h3>📖 Bíblia</h3><p class="muted">Importação local, referência, pesquisa e concordância.</p><button class="btn primary" data-go="bible">Abrir</button></div>
 <div class="card"><h3>🔥 DNA K7</h3><p class="muted">Progressão homilética, intensidade e laboratório de transcrições.</p><button class="btn primary" data-go="k7">Abrir</button></div>
 <div class="card"><h3>📚 Biblioteca</h3><p class="muted">${lib.length} materiais locais.</p><button class="btn secondary" data-go="library">Abrir</button></div>
 <div class="card"><h3>📂 Projetos</h3><p class="muted">${proj.length} projetos salvos.</p><button class="btn secondary" data-go="projects">Abrir</button></div>
 <div class="card"><h3>🤖 AI HUB</h3><p class="muted">Provedores, modelos, prioridade e fallback.</p><button class="btn primary" data-go="aihub">Abrir</button></div>
 <div class="card"><h3>⚙️ Sistema</h3><p class="muted">Configuração API, backup e dados locais.</p><button class="btn secondary" data-go="settings">Abrir</button></div>
 </div>`},
 studio(){return `<h2>🎛️ LOGOS STUDIO</h2>${form()}<label>Comando</label><select id="cmd">${commands.map(c=>`<option>${c}</option>`).join("")}</select>
 <div class="row"><button class="btn primary" id="run">Gerar / Executar</button><button class="btn success" id="chat">Preparar e abrir ChatGPT</button><button class="btn secondary" id="save">Salvar resultado</button><button class="btn secondary" id="project">Salvar projeto</button></div><div id="out" class="output">Pronto.</div>`},
 bible(){return `<h2>📖 Bíblia Local</h2><p class="muted">Importe uma tradução cuja licença permita seu uso. O texto fica somente neste navegador.</p>
 <div class="row"><input type="file" id="bFile" accept=".json,.csv,.txt"><button class="btn primary" id="bImport">Importar Bíblia</button><button class="btn secondary" id="bMeta">Status</button></div>
 <label>Referência</label><input id="bRef" placeholder="João 3:16 ou Romanos 8"><div class="row"><button class="btn primary" id="bOpen">Abrir</button><button class="btn secondary" id="bSend">Enviar ao Studio</button></div>
 <label>Pesquisar palavra/frase</label><input id="bSearch" placeholder="oração"><div class="row"><button class="btn blue" id="bFind">Pesquisar</button><button class="btn secondary" id="bConcordance">Concordância</button></div>
 <div id="bOut" class="output">Nenhuma Bíblia importada.</div>`},
 k7(){const analyses=Store.get("k7analyses",[]);return `<h2>🔥 Laboratório K7</h2><p class="muted">Analisa uma transcrição e extrai sinais estruturais. Não copia identidade vocal.</p>
 <label>Transcrição</label><textarea id="kText" rows="13" placeholder="Cole a transcrição K7..."></textarea>
 <div class="row"><button class="btn primary" id="kAnalyze">Analisar</button><button class="btn secondary" id="kPrompt">Ver DNA Mestre</button></div>
 <div id="kOut" class="output">Análises salvas: ${analyses.length}</div>`},
 library(){const q="";return `<h2>📚 Biblioteca</h2><label>Buscar</label><input id="libQ" placeholder="tema, texto, tipo..."><div class="row"><button class="btn primary" id="libSearch">Pesquisar</button><button class="btn secondary" id="libExport">Exportar biblioteca</button></div><div id="libList" class="list"></div>`},
 projects(){return `<h2>📂 Projetos</h2><div id="projList" class="list"></div>`},
 knowledge(){return `<h2>🧠 Biblioteca Viva Local</h2><div class="chips"><span class="chip">Temas</span><span class="chip">Doutrinas</span><span class="chip">Personagens</span><span class="chip">História</span><span class="chip">Geografia</span><span class="chip">Cronologia</span><span class="chip">Ilustrações</span><span class="chip">Aplicações</span></div>
 <label>Pesquisar em dados locais</label><input id="knowQ" placeholder="Ex.: restauração, Paulo, Jerusalém"><button class="btn primary" id="knowSearch">Pesquisar</button><div id="knowOut" class="output">Digite uma pesquisa.</div>`},
 editor(){const x=Store.get("editor",{title:"",text:""});return `<h2>📝 Editor</h2><label>Título</label><input id="edTitle" value="${escapeHtml(x.title)}"><label>Texto</label><textarea id="edText" rows="22">${escapeHtml(x.text)}</textarea>
 <div class="row"><button class="btn primary" id="edSave">Salvar</button><button class="btn secondary" id="edLib">Enviar à Biblioteca</button><button class="btn secondary" id="edTxt">TXT</button><button class="btn secondary" id="edMd">Markdown</button><button class="btn secondary" id="edDoc">Word (.doc)</button><button class="btn secondary" id="edPdf">Imprimir/PDF</button></div>`},
 pulpit(){return `<h2>🎙️ Modo Púlpito</h2><div class="timer" id="timer">00:00</div><div class="row"><button class="btn primary" id="tStart">Iniciar</button><button class="btn secondary" id="tPause">Pausar</button><button class="btn danger" id="tReset">Zerar</button></div><label>Anotações de púlpito</label><textarea id="pText" rows="18" placeholder="Cole aqui a versão de púlpito..."></textarea>`},
 backup(){return `<h2>💾 Backup</h2><p class="muted">Exporta/restaura todos os dados locais do LOGOS neste navegador.</p><div class="row"><button class="btn primary" id="bkExport">Exportar JSON</button><input type="file" id="bkFile" accept=".json"><button class="btn secondary" id="bkImport">Restaurar</button></div><div id="bkOut" class="output">Pronto.</div>`},
 aihub(){const p=App.health?.providers||{},m=App.health?.models||{},orders=App.health?.orders||{};const names=[["gemini","Gemini"],["groq","Groq"],["openrouter","OpenRouter"],["mistral","Mistral"],["github","GitHub Models"],["huggingface","Hugging Face"],["openai","OpenAI"]];return `<h2>🤖 LOGOS AI HUB</h2>
<p class="muted">As chaves ficam somente no Render. O navegador recebe apenas status e nomes dos modelos.</p>
<div class="grid">${names.map(([k,n])=>`<div class="card"><h3>${p[k]?"🟢":"⚪"} ${n}</h3><p class="muted">${escapeHtml(m[k]||"—")}</p><button class="btn secondary" data-provider-test="${k}" ${p[k]?"":"disabled"}>Testar</button></div>`).join("")}</div>
<div class="two">
<div><label>Modo do roteador</label><select id="hubMode">
<option value="economico" ${App.aiMode==="economico"?"selected":""}>Econômico</option>
<option value="automatico" ${App.aiMode==="automatico"?"selected":""}>Automático</option>
<option value="qualidade" ${App.aiMode==="qualidade"?"selected":""}>Qualidade</option>
<option value="manual" ${App.aiMode==="manual"?"selected":""}>Manual</option>
</select></div>
<div><label>Provedor</label><select id="hubProvider"><option value="auto">Automático</option>${names.map(([k,n])=>`<option value="${k}" ${App.provider===k?"selected":""}>${n} ${p[k]?"✅":"—"}</option>`).join("")}</select></div>
</div>
<label>Modelo manual (opcional)</label><input id="hubModel" value="${escapeHtml(App.model||"")}" placeholder="Deixe vazio para usar o modelo padrão do servidor">
<div class="row"><button class="btn primary" id="hubSave">Salvar</button><button class="btn secondary" id="hubRefresh">Atualizar status</button></div>
<div class="output" id="hubOut">Econômico: ${(orders.economico||[]).join(" → ")||"—"}
Automático: ${(orders.automatico||[]).join(" → ")||"—"}
Qualidade: ${(orders.qualidade||[]).join(" → ")||"—"}</div>`},
 settings(){const p=App.health?.providers||{},m=App.health?.models||{};return `<h2>⚙️ Configurações</h2>
<label>URL da API</label><input id="api" value="${escapeHtml(App.api)}" placeholder="https://seu-backend.onrender.com">
<div class="row"><button class="btn primary" id="apiSave">Salvar/Testar</button><button class="btn secondary" id="apiOff">Usar somente local</button><button class="btn secondary" data-go="aihub">Abrir AI HUB</button></div>
<div class="output">Modo: ${App.server?"ONLINE/API":"LOCAL/OFFLINE"}
Versão: ${App.health?.version||"—"}
Prompt Engine: ${App.health?.prompt_engine||"—"}
Think Engine: ${App.health?.think_engine||"—"}
DNA K7: ${App.health?.dna_k7||"—"}

${Object.entries(p).map(([k,v])=>`${v?"🟢":"⚪"} ${k}: ${m[k]||"—"}`).join("\\n")}

As chaves secretas ficam somente no Render.</div>`}
};

async function render(view){
 App.view=view; $$(".nav button").forEach(b=>b.classList.toggle("active",b.dataset.view===view)); $("#workspace").innerHTML=views[view]?views[view]():"<h2>Módulo</h2>";
 $$("[data-go]").forEach(b=>b.onclick=()=>render(b.dataset.go));
 if(view==="studio"){let last="";
   $("#run").onclick=async()=>{const d=fd();if(!d.text)return alert("Informe texto/tema.");$("#out").textContent="Processando...";const r=await runCommand($("#cmd").value,d);last=r.text;const meta=[r.provider&&`IA: ${r.provider}`,r.model&&`Modelo: ${r.model}`,r.seconds!=null&&`Tempo: ${r.seconds}s`,r.quality&&`Quality Gate: ${r.quality.score}%`].filter(Boolean).join(" • ");
   $("#out").textContent=`[${r.engine.toUpperCase()}]${meta?"\n"+meta:""}\n\n${r.text}`;
   Store.push("history",{id:Date.now(),cmd:$("#cmd").value,input:d,engine:r.engine,provider:r.provider,model:r.model,seconds:r.seconds,quality:r.quality,created:new Date().toISOString()});};
   $("#chat").onclick=async()=>{const d=fd();if(!d.text)return alert("Informe texto/tema.");const p=masterPrompt($("#cmd").value,d);Store.set("lastPrompt",p);await copy(p);location.href="https://chatgpt.com/";};
   $("#save").onclick=()=>{const t=$("#out").textContent;if(!t||t==="Pronto.")return;saveMaterial($("#cmd").value,fd().text,t,fd());alert("Salvo.");};
   $("#project").onclick=()=>{const d=fd();Store.push("projects",{id:Date.now(),name:d.text||"Projeto",command:$("#cmd").value,data:d,result:$("#out").textContent,created:new Date().toISOString()});alert("Projeto salvo.");};
 }
 if(view==="bible") initBibleUI();
 if(view==="k7"){ $("#kAnalyze").onclick=()=>{const t=$("#kText").value;const words=["restaura","altar","oração","igreja","espírito","voltemos","olhe","perceba","clamor","renova"];const hits=words.map(w=>[w,(t.toLowerCase().match(new RegExp(w,"g"))||[]).length]).filter(x=>x[1]);const r=`ANÁLISE K7 LOCAL
Caracteres: ${t.length}
Ocorrências estruturais:
${hits.map(x=>`• ${x[0]}: ${x[1]}`).join("\n")||"Nenhum marcador principal encontrado."}

Progressão de referência:
abertura → contexto → exposição → aplicação → intensificação → clímax → convite

Leitura: esta análise identifica sinais lexicais simples; a interpretação homilética deve considerar a transcrição inteira.`;$("#kOut").textContent=r;Store.push("k7analyses",{id:Date.now(),hits,textLength:t.length,created:new Date().toISOString()});}; $("#kPrompt").onclick=()=>$("#kOut").textContent=P.dna||"DNA K7 está em prompts/dna-k7-MASTER.txt"; }
 if(view==="library"){function show(q=""){const a=Store.get("library",[]).filter(x=>JSON.stringify(x).toLowerCase().includes(q.toLowerCase()));$("#libList").innerHTML=a.length?a.map((x,i)=>`<div class="item"><strong>${escapeHtml(x.title)}</strong><br><small>${escapeHtml(x.type)} • ${new Date(x.created).toLocaleString()}</small><div class="row"><button class="btn secondary" data-copy="${i}">Copiar</button></div></div>`).join(""):"<div class='item'>Nenhum resultado.</div>"; $$("[data-copy]").forEach((b,i)=>b.onclick=()=>copy(a[Number(b.dataset.copy)].text));} show();$("#libSearch").onclick=()=>show($("#libQ").value);$("#libExport").onclick=()=>download("logos-biblioteca.json",JSON.stringify(Store.get("library",[]),null,2),"application/json");}
 if(view==="projects"){const a=Store.get("projects",[]);$("#projList").innerHTML=a.length?a.map(x=>`<div class="item"><strong>${escapeHtml(x.name)}</strong><br><small>${escapeHtml(x.command)} • ${new Date(x.created).toLocaleString()}</small></div>`).join(""):"<div class='item'>Nenhum projeto salvo.</div>";}
 if(view==="knowledge"){ $("#knowSearch").onclick=async()=>{const q=$("#knowQ").value.toLowerCase().trim();const urls=["data/themes/themes.json","data/doctrine/doctrine.json","data/characters/characters.json","data/history/history.json","data/geography/geography.json","data/chronology/chronology.json","data/illustrations/illustrations.json","data/applications/applications.json"];let all=[];for(const u of urls){try{const j=await fetch("../../"+u);all=all.concat(j.map(x=>({...x,_source:u})))}catch{}}const hits=all.filter(x=>JSON.stringify(x).toLowerCase().includes(q));$("#knowOut").textContent=hits.length?hits.slice(0,50).map(x=>`${x.name||x.title||x.scope||x.label} — ${x.summary||x.text||x.notes||JSON.stringify(x)}`).join("\n\n"):"Nenhum resultado. Se abriu por file://, o navegador pode bloquear leitura dos JSON; use a versão servida/PWA.";};}
 if(view==="editor"){ $("#edSave").onclick=()=>{Store.set("editor",{title:$("#edTitle").value,text:$("#edText").value});alert("Salvo localmente.");};$("#edLib").onclick=()=>{saveMaterial("editor",$("#edTitle").value,$("#edText").value);alert("Enviado.");};$("#edTxt").onclick=()=>download(($("#edTitle").value||"sermao")+".txt",$("#edText").value);$("#edMd").onclick=()=>download(($("#edTitle").value||"sermao")+".md",`# ${$("#edTitle").value}\n\n${$("#edText").value}`,"text/markdown");$("#edDoc").onclick=()=>{const html=`<html><meta charset="utf-8"><body><h1>${escapeHtml($("#edTitle").value)}</h1><div style="white-space:pre-wrap">${escapeHtml($("#edText").value)}</div></body></html>`;download(($("#edTitle").value||"sermao")+".doc",html,"application/msword");};$("#edPdf").onclick=()=>{const w=window.open("","_blank");w.document.write(`<html><head><title>${escapeHtml($("#edTitle").value)}</title><style>body{font-family:Arial;padding:40px;white-space:pre-wrap}</style></head><body><h1>${escapeHtml($("#edTitle").value)}</h1>${escapeHtml($("#edText").value)}</body></html>`);w.document.close();w.print();};}
 if(view==="pulpit"){const update=()=>{const s=App.timerSeconds+(App.timerStart?Math.floor((Date.now()-App.timerStart)/1000):0);$("#timer").textContent=`${String(Math.floor(s/60)).padStart(2,"0")}:${String(s%60).padStart(2,"0")}`};$("#tStart").onclick=()=>{if(!App.timerStart)App.timerStart=Date.now();clearInterval(App.timer);App.timer=setInterval(update,500)};$("#tPause").onclick=()=>{if(App.timerStart){App.timerSeconds+=Math.floor((Date.now()-App.timerStart)/1000);App.timerStart=0}clearInterval(App.timer);update()};$("#tReset").onclick=()=>{clearInterval(App.timer);App.timerStart=0;App.timerSeconds=0;update()};}
 if(view==="backup"){$("#bkExport").onclick=()=>download("logos-master-x-backup.json",JSON.stringify({version:1,created:new Date().toISOString(),data:Store.export()},null,2),"application/json");$("#bkImport").onclick=async()=>{const f=$("#bkFile").files[0];if(!f)return alert("Escolha o backup.");try{const j=JSON.parse(await f.text());Store.import(j.data||j);$("#bkOut").textContent="Backup restaurado. Recarregue o aplicativo."; }catch(e){$("#bkOut").textContent="Erro: "+e.message}};}
 if(view==="aihub"){
   $("#hubSave").onclick=()=>{App.aiMode=$("#hubMode").value;App.provider=$("#hubProvider").value;App.model=$("#hubModel").value.trim();Store.set("aiMode",App.aiMode);Store.set("aiProvider",App.provider);Store.set("aiModel",App.model);$("#hubOut").textContent="Configuração salva neste dispositivo. Próximas gerações usarão esta preferência.";};
   $("#hubRefresh").onclick=async()=>{await checkApi();render("aihub")};
   $$("[data-provider-test]").forEach(b=>b.onclick=async()=>{const p=b.dataset.provider;b.disabled=true;const old=b.textContent;b.textContent="Testando...";try{const r=await fetch(App.api.replace(/\\/$/,"")+"/api/provider-test/"+p,{method:"POST"});const j=await r.json();$("#hubOut").textContent=r.ok?`✅ ${p}: ${j.model} • ${j.seconds}s\\n${j.preview||""}`:`❌ ${p}: ${j.detail||"falha"}`;}catch(e){$("#hubOut").textContent=`❌ ${p}: ${e.message}`;}finally{b.disabled=false;b.textContent=old;}});
 }
 if(view==="settings"){ $("#apiSave").onclick=async()=>{App.api=$("#api").value.trim().replace(/\/$/,"");App.provider=$("#aiProvider").value;Store.set("api",App.api);Store.set("aiProvider",App.provider);await checkApi();render("settings")};$("#apiOff").onclick=()=>{App.api="";App.server=false;App.health=null;Store.set("api","");setStatus();render("settings")};}
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

$$(".nav button").forEach(b=>b.onclick=()=>render(b.dataset.view));
window.addEventListener("DOMContentLoaded",()=>{checkApi();render("dashboard")});

if("serviceWorker" in navigator && /^https?:$/.test(location.protocol)) navigator.serviceWorker.register("./sw.js").catch(()=>{});
