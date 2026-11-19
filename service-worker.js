const VERSION = '037aef6f6c0669';
const ASSETS = [
  "./releases/stages-4-5/styles.css?v=a1d433382246",
  "./releases/stages-4-5/languages.js?v=29df1c64cbcf",
  "./releases/stages-4-5/studio.js?v=677ccc1c2037",
  "./releases/restart/pathways.js?v=d5120e5cfa50",
  "./video-labels.js?v=4325b0b4b98a",
  "./releases/restart/labels.js?v=7c7aecb969a5",
  "./releases/restart/philosophy.js?v=5dafaf54c441",
  "./releases/pwa/labels.js?v=ca053aa1ddd3",
  "./releases/restart/app.js?v=6fc1f65a03b8",
  "./stage-6.css?v=24337244debc",
  "./video-data.js?v=ea5f73532e52",
  "./releases/restart/video-library.js?v=8878e31f4155",
  "./releases/restart/restart.css?v=ac66e15fcc92",
  "./releases/restart/media.js?v=4d074b67daae",
  "./releases/restart/philosophy.css?v=361fd3ebe1b4",
  "./manifest.webmanifest",
  "./assets/pwa/restart-192.png",
  "./assets/pwa/restart-apple.png",
  "./releases/pwa/config.js?v=3c4c71d549d0",
  "./releases/pwa/client.js?v=d544b3231377",
  "./assets/brand/restart-1188.webp",
  "./assets/yoga.webp",
  "./assets/meditation.webp",
  "./assets/performance.webp",
  "./assets/author.webp",
  "./assets/founder-championship.webp",
  "./assets/founder-yoga.webp",
  "./assets/hero.webp",
  "./assets/breath.webp",
  "./assets/brand/yoga-space-archive.jpg",
  "./index.html",
  "./assets/brand/restart-640.webp",
  "./assets/brand/restart-dawn-640.webp",
  "./assets/brand/restart-dawn-1280.webp",
  "./assets/lake.jpg",
  "./assets/pwa/restart-512.png",
  "./assets/pwa/restart-maskable.png",
  "./releases/navigation/design.css?v=a133c5ff8277",
  "./releases/navigation/shell.js?v=ce3879ac7c54",
  "./releases/navigation/pages.js?v=9a0e1bd07cfa",
  "./about.html",
  "./philosophy.html",
  "./code.html",
  "./programme.html",
  "./my-path.html",
  "./journal.html",
  "./progress.html",
  "./participation.html",
  "./practices.html",
  "./releases/navigation/studio-shell.js?v=d14087e4962f",
  "./activity.html",
  "./founder.html",
  "./releases/navigation/founder.js?v=61ff41f268dc",
  "./releases/navigation/founder.css?v=51c01721fad4",
  "./releases/navigation/about.css?v=b4bac6134f5a",
  "./releases/navigation/about.js?v=91bb303c3c0d",
  "./releases/navigation/school-public.js?v=2f83392d5082",
  "./releases/navigation/school-runtime.js?v=7e610b673bca",
  "./releases/navigation/analytics.css?v=1f979a080ace",
  "./releases/navigation/analytics.js?v=8a391170c35b",
  "./assets/founder-nunchaku-first-frame.webp?v=002fc08f6759",
  "./releases/navigation/founder-portrait.js?v=d9db613f69c0"
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
  if (request.mode === 'navigate') {
    url.search = '';
    const page = url.pathname === scope.pathname ? home : url.href;
    if (urls.has(page)) event.respondWith(navigationResponse(request,page));
  } else if (urls.has(url.href)) {
    event.respondWith(caches.match(request,{cacheName:CACHE}).then(hit => hit || fetch(request)));
  }
});
async function navigationResponse(request,page) {
  try {
    const response = await fetch(request,{cache:'no-cache'});
    if (response.status < 500) return response;
    return (await caches.match(page,{cacheName:CACHE})) || response;
  } catch (error) {
    const offlinePage = await caches.match(page,{cacheName:CACHE});
    if (offlinePage) return offlinePage;
    throw error;
  }
}
function localLink(path) {
  if (typeof path !== 'string') return scope.href;
  try {
    const target = new URL(path,scope);
    if (target.origin === scope.origin && (target.pathname === scope.pathname || (target.pathname.endsWith('.html') && urls.has(target.origin + target.pathname)))) return target.href;
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
