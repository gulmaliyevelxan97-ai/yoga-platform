const el = id => document.getElementById(id);
function link(label, hash, className) {
  const a = document.createElement('a');
  a.textContent = label;
  a.href = '#' + hash;
  a.className = className;
  return a;
}
const sessionPrefix = 'yogaspace.session.';
const memorySessions = new Map();
let storageOK = true;
let language = 'ru';
try {
  const saved = localStorage.getItem('yogaspace.language');
  if (Object.hasOwn(lessonsByLanguage, saved)) language = saved;
} catch { storageOK = false; }
const t = key => phrases[key][['ru','az','en'].indexOf(language)];
let library = lessonsByLanguage[language];
function renderCards() {
el('categories').replaceChildren();
for (const [id, group] of Object.entries(library)) {
  const card = link('', id, 'card');
  const arrow = document.createElement('span');
  arrow.textContent = '↗';
  arrow.setAttribute('aria-hidden','true');
  const title = document.createElement('b');
  title.textContent = group.name;
  const desc = document.createElement('p');
  desc.textContent = group.description;
  const figure = document.createElement('figure');
  const photo = document.createElement('img');
  photo.src = './assets/' + id + '.webp';
  photo.alt = '';
  photo.loading = 'lazy';
  figure.append(photo);
  card.append(figure,arrow,title,desc);
  el('categories').append(card);
}
}
let remaining = 0, deadline = 0, interval, activeRoute = '', lesson;
function renderProfile() {
  const sessions = new Map(memorySessions);
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (!key?.startsWith(sessionPrefix)) continue;
      try {
        const entry = JSON.parse(localStorage.getItem(key));
        if (Object.hasOwn(library,entry.group) && [0,1].includes(entry.index) &&
          [1,3,5,10,15].includes(entry.minutes) && Number.isSafeInteger(entry.date) &&
          Number.isFinite(new Date(entry.date).getTime())) sessions.set(key,entry);
      } catch { /* Skip an incomplete history entry. */ }
    }
  } catch { storageOK = false; }
  const sorted = [...sessions.values()].sort((a,b)=>b.date-a.date);
  el('sessionCount').textContent = sorted.length;
  el('minuteCount').textContent = sorted.reduce((sum,s)=>sum+s.minutes,0);
  el('storageNote').textContent = t(storageOK?'local':'unavailable');
  el('empty').hidden = !!sorted.length;
  el('history').replaceChildren(...sorted.slice(0,5).map(s=>{
    const li = document.createElement('li');
    const date = new Intl.DateTimeFormat(language,{day:'numeric',month:'short'}).format(s.date);
    li.textContent = library[s.group].lessons[s.index][0] + ' · ' + s.minutes + ' ' + t('minute') + ' · ' + date;
    return li;
  }));
}
function complete() {
  const [group,index] = activeRoute.split('/');
  const date = Date.now();
  const key = sessionPrefix + date + '.' + Math.random().toString(36).slice(2);
  const entry = {group,index:Number(index)-1,date,minutes:Number(el('length').value)};
  memorySessions.set(key,entry);
  try { localStorage.setItem(key,JSON.stringify(entry)); } catch { storageOK = false; }
  renderProfile();
}
function duration() { return Number(el('length').value) * 60000; }
function stop() {
  clearInterval(interval);
  deadline = 0;
}
function draw() {
  if (deadline) remaining = Math.max(0,deadline - Date.now());
  if (!remaining && deadline) { stop(); complete(); }
  const seconds = Math.ceil(remaining / 1000);
  el('time').textContent = [Math.floor(seconds/60),seconds%60].map(n=>String(n).padStart(2,'0')).join(':');
  const step = Math.min(2,Math.floor(3*(1-remaining/duration())));
  Array.from(el('steps').children).forEach((item,i)=>item.classList.toggle('current',Boolean(deadline) && i===step));
  const elapsed = duration() - remaining;
  el('elapsed').value = elapsed / duration();
  const guide = activeRoute === 'breath/1' && step === 1 && Boolean(deadline);
  el('breathCue').hidden = !guide;
  if (guide) el('breathCue').textContent = t(Math.floor((elapsed-duration()/3)/2000)%2 ? 'exhale':'inhale');
  const status = deadline ? t('step').replace('{n}',step+1) : t(!remaining?'done':remaining===duration()?'ready':'paused');
  if (el('status').textContent !== status) el('status').textContent = status;
  el('toggle').textContent = t(deadline?'pause':!remaining?'again':remaining===duration()?'start':'resume');
}
function reset() {
  stop();
  remaining = duration();
  draw();
}
el('toggle').onclick = () => {
  if (deadline) {
    draw();
    stop();
  } else {
    if (!remaining) remaining = duration();
    deadline = Date.now()+remaining;
    interval = setInterval(draw,200);
  }
  draw();
};
el('reset').onclick = reset;
el('length').onchange = reset;
document.addEventListener('visibilitychange',()=>{ if (deadline) draw(); });
function route(translateOnly = false) {
  const [id,index='1'] = location.hash.slice(1).split('/');
  if (!Object.hasOwn(library,id)) {
    if (deadline) draw();
    stop();
    activeRoute = '';
    el('studio').hidden = true;
    return;
  }
  const group = library[id];
  const selected = index === '2' ? 1 : 0;
  const key = id + '/' + (selected+1);
  const changed = key !== activeRoute;
  if (changed || translateOnly === true) {
    if (changed && deadline) { draw(); stop(); }
    activeRoute = key;
    el('category').textContent = group.name;
    el('lessons').replaceChildren(...group.lessons.map(([name],i)=>{
      const a = link(name,id+'/'+(i+1),'pill');
      if (i===selected) a.setAttribute('aria-current','true');
      return a;
    }));
    lesson = group.lessons[selected];
    el('title').textContent = lesson[0];
    el('intro').textContent = lesson[1];
    el('steps').replaceChildren(...lesson[2].map(text=>{
      const li = document.createElement('li');
      li.textContent = text;
      return li;
    }));
    if (changed) {
      el('length').value = id==='yoga' ? '10' : '5';
      reset();
    } else draw();
  }
  el('studio').hidden = false;
  if (translateOnly === true) return;
  el('studio').scrollIntoView();
  el('category').focus({preventScroll:true});
}
el('category').tabIndex=-1;
window.addEventListener('hashchange',route);
document.querySelector('#categories').addEventListener('click', e=>{
  if (e.target.closest('a')?.hash === location.hash) route();
});
function translate() {
  library = lessonsByLanguage[language];
  document.documentElement.lang = language;
  document.title = 'Yoga Space · ' + t('page');
  document.querySelectorAll('[data-t]').forEach(node=>node.textContent = t(node.dataset.t));
  document.querySelector('nav').setAttribute('aria-label',t('nav'));
  el('language').setAttribute('aria-label',t('language'));
  el('language').value = language;
  el('lessons').setAttribute('aria-label',t('lessons'));
  const value = el('length').value || '5';
  el('length').replaceChildren(...[1,3,5,10,15].map(n=>new Option(n+' '+t('minute'),n)));
  el('length').value = value;
  renderCards();
  renderProfile();
  route(true);
}
el('language').onchange = () => {
  language = el('language').value;
  try {localStorage.setItem('yogaspace.language',language);} catch {storageOK = false;}
  translate();
};
window.addEventListener('storage', e=>{
  if (!e.key || e.key.startsWith(sessionPrefix)) renderProfile();
});
translate();
if (activeRoute) route();
