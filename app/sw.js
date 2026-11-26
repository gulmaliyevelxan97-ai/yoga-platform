/* The app has an independent scope and cache. Bump VERSION when shell assets change. */
const VERSION = '2.3.22';
const base = new URL(self.registration.scope);
const prefix = 'restart-app:' + base.pathname + ':';
const name = prefix + VERSION;
// Directory hosting can redirect index.html to the app start URL.
const shell = base.href;
const indexPath = new URL('./index.html',base).pathname;
const resources = new Set([
 './swipe-navigation.mjs','./retreat-welcome.mjs','./retreat-intention.mjs','./retreat-mentor-admissions.mjs','./retreat-admission-request.mjs','./retreat-programme-editor.mjs','./retreat-programme.mjs','./practice-guide.mjs','./week.css','./week.mjs','./notification-plan.mjs','./premium.css','./theme.js','./academy-programs.mjs','./booking-calendar.mjs','./personal-plan.mjs','./progress-view.mjs','./school.mjs','./school-notices.mjs','./cloud-config.mjs','./cloud-auth.mjs','./cloud-copy.mjs','./cloud-data.mjs','./','./style.css','./ui.mjs','./content.mjs','./state.mjs','./manifest.webmanifest',
 '../assets/pwa/restart-192.png','../assets/pwa/restart-512.png',
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
function isAppPage(url) {
 return url.origin===base.origin && (url.pathname===base.pathname || url.pathname===indexPath);
}

self.addEventListener('message',event=>{
 if(event.data?.type!=='ACTIVATE' || event.source?.type!=='window')return;
 if(isAppPage(new URL(event.source.url)))event.waitUntil(self.skipWaiting());
});
self.addEventListener('fetch',event=>{
 if(event.request.method!=='GET' || event.request.headers.has('Range'))return;
 const url=new URL(event.request.url);
 if(url.origin!==base.origin)return;
 const nav=event.request.mode==='navigate';
 if(nav && !isAppPage(url))return;
 const key=nav?shell:url.href;
 if(!resources.has(key))return;
 event.respondWith(caches.match(key,{cacheName:name}).then(hit=>hit||fetch(event.request)));
});

const pushCopy = {
 ru: {morning:'Начните утро с дыхания.',day:'Сделайте паузу для движения.',evening:'Выделите время на спокойную практику.'},
 az: {morning:'Səhərə nəfəs məşqi ilə başlayın.',day:'Hərəkət etmək üçün fasilə verin.',evening:'Sakit məşq üçün vaxt ayırın.'},
 en: {morning:'Start your morning with breathing.',day:'Take a movement break.',evening:'Make time for a calm practice.'}
};

self.addEventListener('push',event=>{
 let payload;
 try {payload = event.data?.json();}
 catch {return;}
 const period = payload?.period;
 if (!['morning','day','evening'].includes(period) || !/^\d{4}-\d{2}-\d{2}$/.test(payload.day)) return;
 const copy = Object.hasOwn(pushCopy,payload.locale) ? pushCopy[payload.locale] : pushCopy.en;
 event.waitUntil(self.registration.showNotification('RESTART',{
  body:copy[period],tag:'restart-'+payload.day+'-'+period,renotify:false,
  icon:new URL('../assets/pwa/restart-192.png',base).href
 }));
});

self.addEventListener('notificationclick',event=>{
 if (!/^restart-\d{4}-\d{2}-\d{2}-(morning|day|evening)$/.test(event.notification.tag)) return;
 event.notification.close();
 event.waitUntil((async()=>{
  const windows = await self.clients.matchAll({type:'window',includeUncontrolled:true});
  const app = windows.find(client=>isAppPage(new URL(client.url)));
  if (app) return app.focus();
  return self.clients.openWindow(new URL('./#today',base).href);
 })());
});
