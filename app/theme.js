(() => {
 const key = 'restart.ui.theme';
 const supported = ['system', 'light', 'dark'];
 const system = matchMedia('(prefers-color-scheme: light)');
 const root = document.documentElement;
 let preference = 'system';
 try {
  const stored = localStorage.getItem(key);
  if (supported.includes(stored)) preference = stored;
 } catch {}

 function apply() {
  if (preference === 'system') delete root.dataset.theme;
  else root.dataset.theme = preference;
  const light = preference === 'light' || (preference === 'system' && system.matches);
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', light ? '#f7f2e9' : '#141b22');
  const select = document.getElementById('restart-theme');
  if (select) select.value = preference;
 }

 document.addEventListener('change', event => {
  const {id, value} = event.target;
  if (id !== 'restart-theme' || !supported.includes(value)) return;
  preference = value;
  try { localStorage.setItem(key, preference); } catch {}
  apply();
 });
 system.addEventListener('change', apply);
 const screen = document.getElementById('screen');
 if (screen) new MutationObserver(apply).observe(screen, {childList:true});
 apply();
})();
