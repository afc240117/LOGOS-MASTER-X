self.addEventListener("install",e=>self.skipWaiting());
self.addEventListener("activate",e=>e.waitUntil((async()=>{
 const keys=await caches.keys();
 await Promise.all(keys.filter(k=>k.startsWith("logos-master-x")).map(k=>caches.delete(k)));
 await self.registration.unregister();
 const clientsList=await self.clients.matchAll({type:"window"});
 clientsList.forEach(c=>c.navigate(c.url));
})()));
self.addEventListener("fetch",()=>{});
