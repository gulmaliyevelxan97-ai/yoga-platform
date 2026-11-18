const VERSION = '54574d15f77334';
const ASSETS = [
  "./releases/stages-4-5/styles.css?v=a1d433382246",
  "./releases/stages-4-5/languages.js?v=29df1c64cbcf",
  "./releases/stages-4-5/studio.js?v=4745727b5f64",
  "./releases/restart/pathways.js?v=d5120e5cfa50",
  "./video-labels.js?v=4325b0b4b98a",
  "./releases/restart/labels.js?v=538a9d1149a6",
  "./releases/restart/philosophy.js?v=5dafaf54c441",
  "./releases/pwa/labels.js?v=ca053aa1ddd3",
  "./releases/restart/app.js?v=6fc1f65a03b8",
  "./stage-6.css?v=24337244debc",
  "./video-data.js?v=ea5f73532e52",
  "./releases/restart/video-library.js?v=c12a07112ee5",
  "./releases/restart/restart.css?v=ac66e15fcc92",
  "./releases/restart/media.js?v=4d074b67daae",
  "./releases/restart/philosophy.css?v=361fd3ebe1b4",
  "./manifest.webmanifest",
  "./assets/pwa/restart-192.png",
  "./assets/pwa/restart-apple.png",
  "./releases/pwa/config.js?v=3c4c71d549d0",
  "./releases/pwa/client.js?v=8f0fe5807980",
  "./assets/brand/restart-1188.webp",
  "./assets/yoga.webp",
  "./assets/meditation.webp",
  "./assets/performance.webp",
  "./assets/author.webp",
  "./assets/hero.webp",
  "./assets/breath.webp",
  "./assets/brand/yoga-space-archive.jpg",
  "./index.html",
  "./assets/brand/restart-640.webp",
  "./assets/lake.jpg",
  "./assets/pwa/restart-512.png",
  "./assets/pwa/restart-maskable.png"
];
const scope = new URL(self.registration.scope);
const cachePrefix = 'restart-shell:' + scope.pathname + ':';
const CACHE = cachePrefix + VERSION;
const home = new URL('./index.html',scope).href;
const urls = new Set(ASSETS.map(path => new URL(path,scope).href));
const icon = new URL('assets/pwa/restart-192.png',scope).href;

self.addEventListener('install', event => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE);
    await cache.addAll(ASSETS.map(path => new Request(new URL(path,scope),{cache:'reload'})));
    await self.skipWaiting();
  })());
});
self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    for (const key of await caches.keys()) {
      if (key.startsWith(cachePrefix) && key !== CACHE) await caches.delete(key);
    }
    await self.clients.claim();
  })());
});
self.addEventListener('fetch', event => {
  const {request} = event;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  if (url.origin !== scope.origin || !url.pathname.startsWith(scope.pathname)) return;
  if (request.mode === 'navigate' && (url.pathname === scope.pathname || url.pathname === new URL(home).pathname)) {
    event.respondWith(fetch(request).catch(async () => caches.match(home,{cacheName:CACHE})));
  } else if (urls.has(url.href)) {
    event.respondWith(caches.match(request,{cacheName:CACHE}).then(hit => hit || fetch(request)));
  }
});
function localLink(path) {
  if (typeof path !== 'string') return scope.href;
  try {
    const target = new URL(path,scope);
    if (target.origin === scope.origin && [scope.pathname, new URL(home).pathname].includes(target.pathname)) return target.href;
  } catch {}
  return scope.href;
}
self.addEventListener('push', event => {
  let message;
  try { message = event.data?.json(); } catch {}
  const title = typeof message?.title === 'string' ? message.title.slice(0,80) : 'RESTART';
  const body = typeof message?.body === 'string' ? message.body.slice(0,240) : '';
  event.waitUntil(self.registration.showNotification(title, {body,icon,data:{url:localLink(message?.url)}}));
});
self.addEventListener('notificationclick', event => {
  event.notification.close();
  const url = localLink(event.notification.data?.url);
  event.waitUntil((async () => {
    const tabs = await self.clients.matchAll({type:'window',includeUncontrolled:true});
    const tab = tabs.find(client => {
      const current = new URL(client.url);
      return current.origin === scope.origin && [scope.pathname,new URL(home).pathname].includes(current.pathname);
    });
    if (!tab) return self.clients.openWindow(url);
    await tab.navigate(url);
    return tab.focus();
  })());
});
