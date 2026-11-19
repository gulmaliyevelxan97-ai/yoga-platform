'use strict';

(() => {
 const measurementId = 'G-RXVXZ1CV0P';
 if (!/^G-[A-Z0-9]{6,20}$/.test(measurementId) || document.querySelector('[data-restart-analytics]')) return;
 const consentKey = 'restart.analytics.consent.v1';
 const disableKey = 'ga-disable-' + measurementId;
 const route = document.body.dataset.page;
 if (route === 'home' && typeof legacyRoute === 'function' && legacyRoute(location.hash)) return;
 const events = {about:'about_open',founder:'founder_open'};
 const sections = new Set(['about-directions','practices','work','directions','library','courses','live','pricing','profile','membership','plan','app-settings']);
 const languages = ['ru','az','en'];
 const language = () => languages.includes(document.documentElement.lang) ? document.documentElement.lang : 'ru';
 const local = (...labels) => labels[languages.indexOf(language())];
 const pageUrl = new URL(location.pathname, location.origin).href;
 let referrer = '';
 try { referrer = new URL(document.referrer).origin; } catch {}
 let consent;
 try { consent = localStorage.getItem(consentKey); } catch {}
 let initialized = false;
 let viewedProgramme = false;

 const settings = document.createElement('details');
 settings.className = 'restart-analytics';
 settings.dataset.restartAnalytics = '';
 settings.innerHTML = '<summary></summary><p></p><div><button type="button" data-choice="yes"></button> <button type="button" data-choice="no"></button></div><p role="status"></p>';
 document.querySelector('[data-school-footer]').after(settings);

 function updateLabels() {
  settings.querySelector('summary').textContent = local('Конфиденциальность и статистика','Məxfilik və statistika','Privacy and analytics');
  settings.querySelector('p').textContent = local(
   'С твоего согласия RESTART использует Google Analytics 4, чтобы узнать, какие страницы читают и какие разделы открывают. Google получает данные о визите и устройстве и может сохранять аналитические cookies. Сайт не передаёт содержимое форм. Выбор можно изменить здесь в любое время.',
   'Razılığınızla RESTART ziyarətçilərin hansı səhifələri oxuduğunu və hansı bölmələri açdığını öyrənmək üçün Google Analytics 4-dən istifadə edir. Google ziyarət və cihaz barədə məlumat alır və analitika kukiləri saxlaya bilər. Sayt formaların məzmununu göndərmir. Seçiminizi burada istənilən vaxt dəyişə bilərsiniz.',
   'With your permission, RESTART uses Google Analytics 4 to see which pages people read and which sections they open. Google receives visit and device data and may store analytics cookies. RESTART does not send form contents. You can change your choice here at any time.');
  settings.querySelector('[data-choice=yes]').textContent = local('Разрешить статистику','Statistikaya razılıq ver','Allow analytics');
  settings.querySelector('[data-choice=no]').textContent = local('Отключить статистику','Statistikanı söndür','Keep analytics off');
  settings.querySelector('[role=status]').textContent = consent === 'yes'
   ? local('Статистика разрешена.','Statistikaya razılıq verilib.','Analytics allowed.')
   : local('Статистика отключена.','Statistika söndürülüb.','Analytics is off.');
 }
 function send(name, parameters = {}) {
  if (consent !== 'yes' || !initialized) return;
  window.gtag('event', name, {send_to: measurementId, page_location: pageUrl, page_referrer: referrer, language: language(), ...parameters});
 }
 const observeProgramme = typeof IntersectionObserver === 'function' ? new IntersectionObserver(entries => {
  if (consent !== 'yes' || viewedProgramme || !entries.some(entry => entry.isIntersecting && entry.intersectionRatio >= 0.25)) return;
  viewedProgramme = true;
  observeProgramme.disconnect();
  send('programme_overview_view');
 }, {rootMargin:'0px', threshold:0.25}) : null;
 function watchProgramme() {
  if (!observeProgramme || consent !== 'yes' || viewedProgramme) return;
  observeProgramme.disconnect();
  const section = route === 'programme' ? document.querySelector('.about-weeks') : document.querySelector('#about-weeks');
  if (section) observeProgramme.observe(section);
 }
 function start() {
  if (initialized) return;
  initialized = true;
  window[disableKey] = false;
  window.dataLayer = window.dataLayer || [];
  window.gtag = function () { window.dataLayer.push(arguments); };
  window.gtag('consent','default',{analytics_storage:'denied',ad_storage:'denied',ad_user_data:'denied',ad_personalization:'denied'});
  window.gtag('consent','update',{analytics_storage:'granted'});
  window.gtag('js',new Date());
  window.gtag('config',measurementId,{
   send_page_view:false, page_location:pageUrl, page_referrer:referrer, page_title:route,
   allow_google_signals:false, allow_ad_personalization_signals:false
  });
  const script = document.createElement('script');
  script.async = true;
  script.referrerPolicy = 'origin';
  script.src = 'https://www.googletagmanager.com/gtag/js?id=' + measurementId;
  document.head.append(script);
  send('page_view', {page_title: route});
  if (events[route]) send(events[route]);
 }
 function choose(choice) {
  if (consent === choice) return;
  consent = choice;
  try { localStorage.setItem(consentKey, choice); } catch {}
  if (choice === 'yes') {
   window[disableKey] = false;
   if (initialized) window.gtag('consent','update',{analytics_storage:'granted'});
   else start();
   watchProgramme();
  } else {
   window[disableKey] = true;
   if (initialized) window.gtag('consent','update',{analytics_storage:'denied'});
   observeProgramme?.disconnect();
  }
  updateLabels();
 }
 settings.addEventListener('click', event => {
  const choice = event.target.closest('[data-choice]')?.dataset.choice;
  if (choice) choose(choice);
 });
 document.addEventListener('click', event => {
  if (!event.isTrusted || event.defaultPrevented || consent !== 'yes') return;
  const details = event.target.closest('.about-direction summary')?.parentElement;
  if (details && !details.open) {
   const direction = details.id.slice(3);
   if (['mind','body','nutrition','life'].includes(direction)) {
    setTimeout(() => {
     if (details.open && details.isConnected) send('philosophy_card_open',{direction});
    },0);
   }
   return;
  }
  const anchor = event.target.closest('a[href]');
  if (!anchor) return;
  const target = new URL(anchor.href, location.href);
  const section = target.hash.slice(1);
  if (target.origin === location.origin && target.pathname === location.pathname &&
      target.hash !== location.hash && sections.has(section)) send('section_open',{section});
  if (target.origin === location.origin && (
   target.pathname.endsWith('/participation.html') || (target.pathname === location.pathname && target.hash === '#live')
  )) send('booking_click');
  if (target.protocol === 'mailto:' || target.protocol === 'tel:' || target.hash === '#contacts' && target.origin === location.origin) send('contact_click');
  if (target.protocol === 'https:') {
   if (['instagram.com','www.instagram.com'].includes(target.hostname)) send('social_click',{network:'instagram'});
   if (['t.me','telegram.me','www.telegram.me'].includes(target.hostname)) send('social_click',{network:'telegram'});
  }
 });
 const picker = document.querySelector('#lang, #language');
 picker?.addEventListener('change',() => queueMicrotask(() => {updateLabels();watchProgramme();}));
 window.addEventListener('hashchange',watchProgramme);
 window.addEventListener('storage',event => {
  if (event.key === consentKey && event.newValue !== consent) choose(event.newValue === 'yes' ? 'yes' : 'no');
 });
 updateLabels();
 if (!consent) settings.open = true;
 if (consent === 'yes') {
  start();
  watchProgramme();
 }
})();
