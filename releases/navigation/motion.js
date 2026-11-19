'use strict';

(() => {
 const motion = matchMedia('(prefers-reduced-motion: no-preference)');
 if (!motion.matches) return;

 const page = document.body.dataset.page;
 if (page === 'home') {
  try {
   const key = 'restart.motion.home-seen';
   if (!sessionStorage.getItem(key)) {
    sessionStorage.setItem(key, '1');
    document.body.classList.add('motion-home-intro');
   }
  } catch {
   // Keep the introduction still when session storage is unavailable.
  }
 }

 const selector = {
  about: '.about-direction',
  method: '.about-direction',
  programme: '.about-weeks li',
  founder: '.founder-feature h2, .founder-feature p, .founder-feature figure, .founder-invitation'
 }[page];
 if (!selector || !('IntersectionObserver' in window)) return;

 const view = document.getElementById('view');
 const seen = new Set();
 const observer = new IntersectionObserver(entries => {
  for (const {target, isIntersecting} of entries) {
   if (!isIntersecting) continue;
   observer.unobserve(target);
   seen.add(target.dataset.revealIndex);
   if (motion.matches && target.isConnected) target.classList.add('motion-reveal');
  }
 }, {threshold: 0.12});

 const observe = () => {
  observer.disconnect();
  view.querySelectorAll(selector).forEach((element, index) => {
   element.dataset.revealIndex = String(index);
   if (!seen.has(element.dataset.revealIndex)) observer.observe(element);
  });
 };
 observe();
 // The language picker replaces the content without navigating away.
 new MutationObserver(observe).observe(view, {childList: true});
})();
