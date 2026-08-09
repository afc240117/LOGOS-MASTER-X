const CACHE_VERSION="logos-master-x-3.6.6";
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
    try{return await fetch(req,{cache:"no-store"});}
    catch(err){const c=await caches.open(CACHE_VERSION);const hit=await c.match(req);return hit||Response.error();}
  })());
});
