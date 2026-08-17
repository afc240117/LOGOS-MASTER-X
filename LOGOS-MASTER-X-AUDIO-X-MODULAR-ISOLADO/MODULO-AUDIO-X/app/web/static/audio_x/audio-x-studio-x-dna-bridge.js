window.LogosStudioXDNABridge={
 storageKey:"logosMasterX.studioX.appliedDNAK7",
 async apply(profileId,strength=100){
   const r=await fetch("/api/audio-x/studio-x/apply",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({profile_id:profileId,strength})});
   let d=null;try{d=await r.json()}catch{}
   if(!r.ok)throw Error(d?.detail||`HTTP ${r.status}`);
   sessionStorage.setItem(this.storageKey,JSON.stringify(d));
   window.dispatchEvent(new CustomEvent("logosmasterx:studio-x-dna-applied",{detail:d}));
   return d;
 },
 get(){try{return JSON.parse(sessionStorage.getItem(this.storageKey)||"null")}catch{return null}},
 clear(){sessionStorage.removeItem(this.storageKey);window.dispatchEvent(new CustomEvent("logosmasterx:studio-x-dna-cleared"))},
 injectIntoPayload(payload={}){
   const d=this.get();
   if(!d?.config)return payload;
   return {...payload,dna_k7:d.config,dna_k7_prompt_block:d.prompt_block};
 },
 bindControls(map={}){
   const d=this.get();if(!d?.config?.controls)return;
   Object.entries(map).forEach(([key,selector])=>{
     const el=document.querySelector(selector),value=d.config.controls[key];
     if(el&&value!=null){el.value=value;el.dispatchEvent(new Event("input",{bubbles:true}));el.dispatchEvent(new Event("change",{bubbles:true}))}
   });
 }
};