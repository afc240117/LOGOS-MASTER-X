const CACHE_VERSION="logos-master-x-themes-414";
self.addEventListener("install",event=>{self.skipWaiting();});
self.addEventListener("activate",event=>{event.waitUntil((async()=>{
  const keys=await caches.keys();
  await Promise.all(keys.filter(k=>k!==CACHE_VERSION).map(k=>caches.delete(k)));
  await self.clients.claim();
})());});
self.addEventListener("fetch",event=>{
  const req=event.request;
  if(req.method!=="GET") return;
  event.respondWith((async()=>{
    try{
      const fresh=await fetch(req,{cache:"no-store"});
      if(fresh && fresh.ok && new URL(req.url).origin===self.location.origin){
        const c=await caches.open(CACHE_VERSION); c.put(req,fresh.clone()).catch(()=>{});
      }
      return fresh;
    }catch(err){
      const c=await caches.open(CACHE_VERSION);
      return (await c.match(req)) || (req.mode==="navigate" ? await c.match("/") : null) || Response.error();
    }
  })());
});
