const phrases = [
 "Observe este detalhe.", "Voltemos ao texto.", "Perceba a sequência.",
 "A Escritura nos mostra.", "Há uma verdade importante aqui.",
 "O texto nos conduz a compreender.", "Pense por um instante.",
 "Essa é a pergunta que o texto coloca diante de nós.", "Veja como a Palavra responde."
];

function pointsForDuration(minutes) {
  if (minutes <= 20) return 2;
  if (minutes <= 35) return 3;
  if (minutes <= 50) return 4;
  return 5;
}

export function buildLocalSermon(input={}) {
  const text = input.text || "Texto bíblico não informado";
  const theme = input.theme || "Mensagem bíblica";
  const minutes = Number(input.duration||30);
  const count = pointsForDuration(minutes);
  const pts = Array.from({length:count}, (_,i) => ({
    title:`Movimento ${i+1}`,
    explanation:`Explique a unidade do texto relacionada a “${theme}”, respeitando o contexto e mostrando a verdade central.`,
    application:`Aplique essa verdade de maneira concreta à vida pessoal e à igreja.`,
    question:`Que resposta esta verdade pede de nós hoje?`,
    transition:phrases[(i+2)%phrases.length]
  }));
  return {
    title: theme,
    text,
    duration: minutes,
    bigIdea:`A mensagem deve nascer de ${text} e conduzir o ouvinte a responder à verdade bíblica sobre ${theme}.`,
    introduction:`Apresente a tensão do tema “${theme}” e conduza naturalmente ao texto ${text}.`,
    context:`Identifique autor, destinatários, contexto histórico, literário e imediato antes de aplicar.`,
    points:pts,
    climax:"Recordação → confronto → esperança → resposta da igreja → oração.",
    appeal:"Convide a uma resposta coerente com a verdade exposta, sem manipulação.",
    prayer:"Ore de forma coerente com o texto, pedindo compreensão, obediência e transformação."
  };
}

export function renderSermon(s) {
  const pts=s.points.map((p,i)=>`
${i+1}. ${p.title}
Explicação: ${p.explanation}
Aplicação: ${p.application}
Pergunta: ${p.question}
Transição: ${p.transition}`).join("\n");
  return `TÍTULO: ${s.title}
TEXTO: ${s.text}
TEMPO: ${s.duration} minutos

GRANDE IDEIA
${s.bigIdea}

INTRODUÇÃO
${s.introduction}

CONTEXTO
${s.context}

DESENVOLVIMENTO
${pts}

CLÍMAX
${s.climax}

APELO
${s.appeal}

ORAÇÃO
${s.prayer}`;
}
