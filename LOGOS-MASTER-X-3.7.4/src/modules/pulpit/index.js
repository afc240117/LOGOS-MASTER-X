export const PulpitModule={
 id:"pulpit",title:"Modo Púlpito",version:"1.0",capabilities:["cronometro","tela-grande"],
 start(minutes=30){return {started:Date.now(),minutes:Number(minutes)};},
 elapsed(session){return Math.floor((Date.now()-session.started)/1000);},
 render(){return `<h2>🎙️ Modo Púlpito</h2><p>Cronômetro e visualização de tópicos.</p>`;}
};