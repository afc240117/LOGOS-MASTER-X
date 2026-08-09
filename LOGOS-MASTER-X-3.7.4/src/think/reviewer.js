export function reviewStage(project={}){const checks=[
 ["texto informado",Boolean(project.input?.text||project.input?.passage)],
 ["tema/assunto identificado",Boolean(project.input?.theme||project.input?.text||project.input?.passage)],
 ["análise bíblica executada",Boolean(project.stages?.biblical)],
 ["contexto executado",Boolean(project.stages?.context)],
 ["exegese executada",Boolean(project.stages?.exegesis)],
 ["grande ideia preparada",Boolean(project.stages?.bigIdea)],
 ["estrutura preparada",Boolean(project.stages?.structure)],
 ["aplicações preparadas",Boolean(project.stages?.applications)],
 ["clímax preparado",Boolean(project.stages?.climax)],
 ["sem glossolalia no material",!/sharab|labax|alabass|rebianda/i.test(JSON.stringify(project))]
 ];const passed=checks.filter(x=>x[1]).length;return {stage:"REVISOR",checks,score:Math.round(100*passed/checks.length),status:passed===checks.length?"PASS":"REVISAR",questions:["O texto foi respeitado?","O contexto foi respeitado?","Existe uma ideia central?","Cristo aparece quando apropriado?","Existem aplicações?","Há coerência?","O sermão termina melhor do que começou?"]};}
