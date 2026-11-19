'use strict';

(() => {
 const motion = matchMedia('(prefers-reduced-motion: no-preference)');
 if (!motion.matches) return;

 const body = document.body;
 const page = body.dataset.page;
 function firstVisit(part) {
  try {
   const key = 'restart.motion.home.' + part + '.v2';
   if (sessionStorage.getItem(key)) return false;
   sessionStorage.setItem(key, '1');
   return true;
  } catch {
   return false;
  }
 }
 if (page === 'home' && firstVisit('text')) body.classList.add('motion-home-intro');
 if (!('IntersectionObserver' in window)) return;
 // The bottom navigation overlaps the scrollport on phones.
 const dockHeight = document.querySelector('.dock')?.getBoundingClientRect().height || 0;
 const rootMargin = '0px 0px -' + Math.ceil(dockHeight + 12) + 'px 0px';

 // Observe the untransformed frames. A below-fold photo can finish loading long
 // before the visitor gets to it, so loading alone must not start its motion.
 const photo = document.querySelector('.motion-photo');
 if (photo) {
  const image = photo.querySelector('img');
  const photoObserver = new IntersectionObserver(([entry]) => {
   if (!entry.isIntersecting || entry.intersectionRatio < 0.12) return;
   photoObserver.disconnect();
   if (motion.matches && (page !== 'home' || firstVisit('photo'))) photo.classList.add('motion-photo-enter');
  }, {threshold: 0.12, rootMargin});
  image.decode().then(() => photoObserver.observe(photo)).catch(() => {});
 }

 const selector = {
  about: '.about-direction',
  method: '.about-direction',
  programme: '.about-weeks li',
  founder: '.founder-feature h2, .founder-feature p, .founder-feature figure, .founder-invitation'
 }[page];
 if (!selector) return;

 const view = document.getElementById('view');
 const seen = new Set();
 const observer = new IntersectionObserver(entries => {
  let order = 0;
  for (const {target, isIntersecting, intersectionRatio} of entries) {
   if (!isIntersecting || intersectionRatio < 0.08 || !target.isConnected) continue;
   const index = target.dataset.revealIndex;
   observer.unobserve(target);
   if (seen.has(index)) continue;
   seen.add(index);
   if (!motion.matches || target.matches(':focus-within, :target, [open]')) continue;
   // Stagger only a group entering together. A card arriving on its own starts now.
   target.style.setProperty('--motion-delay', Math.min(order++, 2) * 115 + 'ms');
   target.classList.add('motion-reveal');
  }
 }, {threshold: 0.08, rootMargin});

 const observe = () => {
  observer.disconnect();
  view.querySelectorAll(selector).forEach((element, index) => {
   element.dataset.revealIndex = String(index);
   if (!seen.has(element.dataset.revealIndex)) observer.observe(element);
  });
 };
 observe();
 // A language change replaces the nodes, but does not replay a seen group.
 new MutationObserver(observe).observe(view, {childList: true});
})();
