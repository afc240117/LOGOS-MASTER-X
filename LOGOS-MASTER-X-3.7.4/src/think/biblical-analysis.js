export function biblicalAnalysis(input={}){
 const text=input.text||input.passage||""; const theme=input.theme||"";
 return {stage:"ANALISTA BÍBLICO",text,theme,questions:[
  "Quem é o autor humano do livro?","Quem são os destinatários?","Qual é o contexto histórico?","Qual é o contexto cultural relevante?","Qual é o contexto imediato?","Qual é a ideia central da unidade?","Qual problema o texto trata?","Que resposta o texto apresenta?","O que o texto revela sobre Deus?","O que revela sobre o ser humano?","Como se relaciona com Cristo quando apropriado?","Quais aplicações são legitimamente deriváveis?"
 ],rule:"Responder com dados verificáveis. Marcar qualquer detalhe incerto para conferência."};
}
