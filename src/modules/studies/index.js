import { Store } from "../../core/store.js";
export const StudiesModule = {
 id:"studies", title:"Estudos", version:"1.0",
 capabilities:["estudo-local","salvar","reutilizar-sermao"],
 generate({text="",theme=""}={}){
   const material=`ESTUDO BÍBLICO
Tema: ${theme||text}
Texto: ${text}

1. Contexto do livro
2. Contexto imediato
3. Estrutura da passagem
4. Ideia central
5. Palavras importantes a verificar
6. Referências cruzadas a confirmar
7. Doutrinas relacionadas
8. Aplicações
9. Perguntas para reflexão
10. Conclusão`;
   Store.push("studies",{id:Date.now(),title:theme||text,text:material,created:new Date().toISOString()});
   return material;
 },
 render(){return `<h2>📖 Estudos</h2><p>Estudo bíblico estruturado e reutilizável.</p>`;}
};