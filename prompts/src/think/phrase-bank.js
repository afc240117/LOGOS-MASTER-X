export const PHRASES = {
  observe:["Observe este detalhe.","Perceba a sequência do texto.","Voltemos à passagem.","A Escritura coloca algo importante diante de nós."],
  reflect:["Pense por um instante.","Que resposta esta verdade pede de nós?","O que muda quando levamos esta palavra a sério?","Onde esta verdade encontra nossa vida hoje?"],
  transition:["Com isso em mente, avance para o próximo movimento.","Essa verdade prepara o caminho para o que vem a seguir.","Agora o texto aprofunda a questão.","Da explicação, seguimos para a resposta prática."],
  climax:["A verdade já foi apresentada; agora ela exige resposta.","O texto não termina na informação, mas nos conduz à decisão.","A esperança bíblica nos chama a responder com fé e obediência."]
};
export function pickPhrase(group,index=0){const a=PHRASES[group]||[]; return a.length?a[index%a.length]:"";}
