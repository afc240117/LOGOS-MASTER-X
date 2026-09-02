/* HOTFIX Áudio X — corrige POST /api/audio-x/cloud/upload -> /api/audio-x/upload
   Carregado depois de audio-x-etapa-15.js ou usado como substituição complementar.
*/
(()=>{
  const originalFetch = window.fetch.bind(window);
  window.fetch = function(input, init){
    try{
      const url = typeof input === "string" ? input : input?.url;
      if(url === "/api/audio-x/cloud/upload"){
        input = "/api/audio-x/upload";
      }
    }catch{}
    return originalFetch(input, init);
  };
  console.info("[Áudio X HOTFIX] Upload endpoint corrigido: /api/audio-x/upload");
})();