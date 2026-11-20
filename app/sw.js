/* The app has an independent scope and cache. Bump VERSION when shell assets change. */
const VERSION = '2.1.0';
const base = new URL(self.registration.scope);
const prefix = 'restart-app:' + base.pathname + ':';
const name = prefix + VERSION;
const shell = new URL('./index.html',base).href;
const resources = new Set([
 './school.mjs','./school-notices.mjs','./cloud-config.mjs','./cloud-auth.mjs','./cloud-copy.mjs','./cloud-data.mjs','./index.html','./style.css','./ui.mjs','./content.mjs','./state.mjs','./manifest.webmanifest',
 '../assets/brand/restart-640.webp','../assets/brand/restart-1188.webp','../assets/pwa/restart-192.png','../assets/pwa/restart-512.png',
 '../assets/pwa/restart-maskable.png','../assets/pwa/restart-apple.png'
].map(path=>new URL(path,base).href));

self.addEventListener('install',event=>{
 event.waitUntil(caches.open(name).then(cache=>cache.addAll([...resources].map(url=>new Request(url,{cache:'reload'})))));
});
self.addEventListener('activate',event=>{
 event.waitUntil((async()=>{
  for(const key of await caches.keys()) {
   if(key.startsWith(prefix)&&key!==name)await caches.delete(key);
  }
  await self.clients.claim();
 })());
});
self.addEventListener('message',event=>{
 if(event.data?.type==='ACTIVATE')event.waitUntil(self.skipWaiting());
});
self.addEventListener('fetch',event=>{
 if(event.request.method!=='GET')return;
 const url=new URL(event.request.url);
 if(url.origin!==base.origin)return;
 const nav=event.request.mode==='navigate';
 if(nav && url.pathname!==base.pathname && url.pathname!==new URL(shell).pathname)return;
 const key=nav?shell:url.href;
 if(!resources.has(key))return;
 event.respondWith(caches.match(key,{cacheName:name}).then(hit=>hit||fetch(event.request)));
});
