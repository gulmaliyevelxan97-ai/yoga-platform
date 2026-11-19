import {catalog, categories, strings} from './content.mjs';
import {localRepository, languages, dateKey, fromDateKey, shiftDate, weekStart, elapsed, pause, metrics, upsertEntry} from './state.mjs';

const $ = selector => document.querySelector(selector);
const repo = localRepository();
const screen = $('#screen');
const tabs = ['today', 'practices', 'path', 'journal', 'profile'];
const icons = {
 today:'M3 10l9-7 9 7v10H3z M9 20v-6h6v6', practices:'M4 12h16 M12 4v16 M6.4 6.4l11.2 11.2 M17.6 6.4L6.4 17.6',
 path:'M3 20h18 M5 16l5-6 4 3 5-8 M15 5h4v4', journal:'M5 4h13v16H5z M8 8h7 M8 12h7 M8 16h4',
 profile:'M16 8a4 4 0 1 1-8 0 4 4 0 0 1 8 0z M4 21v-2a8 8 0 0 1 16 0v2',
 schedule:'M4 6h16v14H4z M8 3v6 M16 3v6 M4 11h16 M8 15h2 M14 15h2', arrow:'M6 18L18 6 M9 6h9v9'
};
const icon = name => '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.55" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="'+icons[name]+'"/></svg>';
const esc = value => String(value ?? '').replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
const state = () => repo.read();
const lang = () => languages.includes(state().lang) ? state().lang : 'ru';
const tr = triple => triple[languages.indexOf(lang())];
const t = key => tr(strings[key]);
const dateText = (date, options) => new Intl.DateTimeFormat(lang(), options).format(date);
const dateLabel = value => dateText(fromDateKey(value), {day:'numeric', month:'long', year:'numeric'});
const itemFor = id => catalog.find(item => item.id === id);
const title = item => tr(item.title);
const category = id => tr(categories[id]);
const localTime = item => dateText(item.date, {hour:'2-digit', minute:'2-digit'});
const displayTime = seconds => Math.floor(seconds/60) + ':' + String(seconds%60).padStart(2,'0');
const duration = seconds => Math.floor(seconds/60) + ' ' + t('min') + ' ' + seconds%60 + ' ' + t('sec');
const heading = key => '<h1>'+t(key)+'</h1>';
let filter = 'all';
let selectedDay = dateKey();
let scheduleOffset = 0;
let editing = null;
let installPrompt;
let waitingWorker;
let applyingUpdate = false;

function route() {
 const [name, id] = location.hash.slice(1).split('/');
 if (name === 'practice' && itemFor(id)) return {name, id};
 return {name: [...tabs, 'schedule'].includes(name) ? name : 'today'};
}

function sampleClass(date) {
 const day = date.getDay();
 if (day !== 2 && day !== 6) return null;
 const start = new Date(date);
 start.setHours(day === 2 ? 18 : 10, day === 2 ? 30 : 0, 0, 0);
 return {date: start, minutes: 45};
}
function nextClass(now) {
 for (let i = 0; i < 8; i++) {
  const item = sampleClass(shiftDate(now, i));
  if (item && item.date > now) return item;
 }
 return null;
}

function today() {
 const now = new Date();
 const current = state();
 const suggested = itemFor(current.active?.id) || catalog[now.getDay() % catalog.length];
 const next = nextClass(now);
 const stats = metrics(current.sessions, now);
 return `
 <div class="today-heading"><p class="eyebrow">${esc(dateText(now,{weekday:'long',day:'numeric',month:'long'}))}</p>
 <h1>${t('welcome')}${current.name ? ', '+esc(current.name) : ''}</h1></div>
 <article class="hero"><img src="../assets/hero.webp" width="900" height="900" alt="" fetchpriority="high">
 <div class="hero-content"><p class="eyebrow">${t('daily')} · ${suggested.minutes} ${t('min')}</p><h2>${title(suggested)}</h2>
 <a class="cta" href="#practice/${suggested.id}">${t(current.active ? 'resume' : 'start')} <span class="arrow" aria-hidden="true">${icon('arrow')}</span></a></div></article>
 <div class="home-grid">
 ${next ? `<article class="panel next-card"><p class="eyebrow">${t('next')}</p><h2>${t('classTitle')}</h2><p>${esc(dateLabel(dateKey(next.date)))} · ${localTime(next)}</p>
 <a class="link" href="#schedule">${t('sample')} <span aria-hidden="true">→</span></a></article>` : ''}
 <article class="panel goal-card"><p class="eyebrow">${t('progress')}</p><h2>${stats.week} <span class="muted">/ ${current.goal}</span></h2><progress aria-label="${t('progress')}" value="${stats.week}" max="${current.goal}"></progress><a class="link" href="#path">${t('path')} <span aria-hidden="true">→</span></a></article>
 </div>
 <article class="panel reflection"><div><p class="eyebrow">${t('journal')}</p><h2>${t('reflect')}</h2></div><a class="button" href="#journal">${t('addJournal')}</a></article>`;
}

function practices() {
 return heading('practices') + '<p class="muted">'+t('timer')+'</p><div class="filters">'+['all',...catalog.map(p=>p.id)].map(id=>
  `<button data-filter="${id}" aria-pressed="${filter === id}">${id === 'all' ? t('all') : category(id)}</button>`).join('')+'</div><div class="practice-grid">'+
 catalog.filter(item=>filter==='all'||filter===item.id).map(item=>`<a class="practice-card ${item.id}" href="#practice/${item.id}"><span class="eyebrow">${category(item.id)} · ${item.minutes} ${t('min')}</span><h2>${title(item)}</h2><span class="arrow" aria-hidden="true">${icon('arrow')}</span></a>`).join('')+'</div>';
}

function practice(id) {
 const item = itemFor(id);
 const active = state().active;
 const own = active?.id === id;
 const video = item.video;
 return `<a class="link back" href="#practices">← ${t('practices')}</a><article class="panel practice-detail ${id}">
 <p class="eyebrow">${category(id)} · ${item.minutes} ${t('min')}</p><h1>${title(item)}</h1><p>${tr(item.description)}</p>
 <p class="muted">${t('timer')}</p>
 <p class="timer" id="timer" role="timer" aria-label="${t('timer')}">${displayTime(item.minutes*60-elapsed(own?active:null,item.minutes*60))}</p>
 ${own ? `<div class="actions"><button data-action="${active.startedAt === null?'start':'pause'}">${t(active.startedAt === null?'resume':'pause')}</button><button class="cta" data-action="finish">${t('finish')}</button></div><button class="text-button" data-action="stop">${t('stop')}</button>` :
 active ? `<p>${t('activeOther')}</p><a class="button" href="#practice/${active.id}">${t('resume')}</a>` : `<button class="cta" data-action="start">${t('start')}</button>`}
 </article>${video ? `<article class="panel"><p class="eyebrow">${t('videoNote')} · ${video.language}</p><h2>${video.title}</h2><p>${video.author}</p><a class="link" href="https://www.youtube.com/watch?v=${video.id}" target="_blank" rel="noopener noreferrer">${t('video')} ↗</a></article>` : ''}`;
}

function path() {
 const current = state();
 const stats = metrics(current.sessions);
 const days = Array.from({length:28}, (_,i)=>shiftDate(new Date(), i-27));
 const history = [...current.sessions].reverse().map(session=>{
  const item = itemFor(session.practice);
  return `<li><div><strong>${item ? title(item) : 'RESTART'}</strong><small>${esc(dateLabel(session.day))}</small></div><span>${duration(session.seconds)}</span></li>`;
 }).join('');
 return heading('path') + `
 <div class="stats"><div><strong>${stats.count}</strong><span>${t('sessions')}</span></div><div><strong>${duration(stats.seconds)}</strong><span>${t('total')}</span></div><div><strong>${stats.streak}</strong><span>${t('streak')}</span></div></div>
 <article class="panel"><h2>${t('calendar')}</h2><ol class="activity">${days.map(day=>{
  const done = stats.days.has(dateKey(day));
  const label = dateLabel(dateKey(day)) + (done ? ' · '+t('completed') : '');
  return '<li title="'+esc(label)+'" aria-label="'+esc(label)+'" class="'+(done?'done':'')+'">'+day.getDate()+(done?' <span aria-hidden="true">✓</span>':'')+'</li>';
 }).join('')}</ol></article>
 <form id="goal-form" class="panel"><h2>${t('goal')}</h2><label>${t('goalField')}<input type="number" name="goal" min="1" max="99" value="${current.goal}" required></label><button class="cta">${t('save')}</button></form>
 <article class="panel"><h2>${t('history')}</h2>${history?'<ul class="history">'+history+'</ul>':'<p class="muted">'+t('noSessions')+'</p>'}</article>`;
}

function journal() {
 const current = state().journal.find(entry=>entry.id===editing) || {};
 const levels = ['unset','low','medium','high'];
 const scales = ['mood','energy','wellbeing'];
 const fields = ['before','after','notes'];
 return heading('journal')+`<p class="muted">${t('localNote')}</p><form id="journal-form" class="panel">
 <label>${t('date')}<input type="date" name="date" value="${esc(current.date||dateKey())}" required></label>
 <div class="field-row">${scales.map(key=>`<label>${t(key)}<select name="${key}">${levels.map((level,i)=>`<option value="${i}" ${current[key]===String(i)?'selected':''}>${t(level)}</option>`).join('')}</select></label>`).join('')}</div>
 ${fields.map(key=>`<label>${t(key)}<textarea name="${key}" rows="2" maxlength="2000">${esc(current[key])}</textarea></label>`).join('')}
 <div class="actions"><button class="cta">${t('save')}</button>${editing?`<button type="button" data-action="cancel-edit">${t('cancel')}</button>`:''}</div></form>
 <h2>${t('entries')}</h2>
 ${[...state().journal].sort((a,b)=>b.date.localeCompare(a.date)).map(entry=>`<article class="panel entry"><h3>${esc(dateLabel(entry.date))}</h3>
 <dl>${[...scales,...fields].filter(key=>entry[key]&&entry[key]!=='0').map(key=>{
  const value = scales.includes(key) ? t(levels[Number(entry[key])]||'unset') : esc(entry[key]);
  return `<dt>${t(key)}</dt><dd>${value}</dd>`;
 }).join('')}</dl><div class="actions"><button data-edit="${esc(entry.id)}">${t('edit')}</button><button data-remove="${esc(entry.id)}">${t('remove')}</button></div></article>`).join('') || '<p class="muted">'+t('emptyNotes')+'</p>'}`;
}

function schedule() {
 const first = shiftDate(weekStart(new Date()),scheduleOffset*7);
 const days = Array.from({length:7},(_,i)=>shiftDate(first,i));
 const item = sampleClass(fromDateKey(selectedDay));
 const upcoming = Array.from({length:10},(_,i)=>sampleClass(shiftDate(new Date(),i))).filter(item=>item&&item.date>new Date()).slice(0,3);
 return heading('schedule')+`<p class="muted">${t('scheduleNote')}</p><article class="panel">
 <div class="calendar-header"><button data-week="-1" aria-label="${t('previous')}">←</button><h2>${esc(dateText(first,{month:'long',year:'numeric'}))}</h2><button data-week="1" aria-label="${t('nextWeek')}">→</button></div>
 <div class="schedule-grid">${days.map(day=>{
  const value = dateKey(day);
  return `<button data-day="${value}" aria-pressed="${selectedDay===value}" aria-label="${esc(dateLabel(value))}"><small>${esc(dateText(day,{weekday:'short'}))}</small>${day.getDate()}${sampleClass(day)?'<span aria-hidden="true">·</span>':''}</button>`;
 }).join('')}</div></article>
 <article class="panel"><p class="eyebrow">${esc(dateLabel(selectedDay))} · ${t('sample')}</p>
 ${item?`<h2>${t('classTitle')}</h2><p>${localTime(item)} · ${item.minutes} ${t('min')}</p><p>${t('classDetail')}</p>`:`<p>${t('noClass')}</p>`}</article>
 <article class="panel"><h2>${t('next')} · ${t('sample')}</h2><ul class="history">${upcoming.map(item=>`<li><button type="button" data-day="${dateKey(item.date)}"><span>${esc(dateLabel(dateKey(item.date)))} · ${localTime(item)}</span><small>${t('classTitle')}</small></button></li>`).join('')}</ul></article>`;
}

function profile() {
 const current = state();
 const reminder = current.reminders;
 const running = matchMedia('(display-mode: standalone)').matches || navigator.standalone;
 return heading('profile')+`<p class="muted">${t('localNote')}</p>
 <form id="profile-form" class="panel"><label>${t('name')}<input name="name" maxlength="40" value="${esc(current.name)}"></label><button class="cta">${t('save')}</button></form>
 <form id="reminder-form" class="panel"><h2>${t('reminders')}</h2><p class="muted">${t('reminderNote')}</p><label>${t('reminderTime')}<input type="time" name="time" value="${esc(reminder.time)}" required></label>
 ${['practice','schedule','goal'].map((key,i)=>`<label class="check"><input type="checkbox" name="${key}" ${reminder[key]?'checked':''}>${t(['remindPractice','remindSchedule','remindGoal'][i])}</label>`).join('')}<button class="cta">${t('save')}</button></form>
 <article class="panel"><h2>${t(running?'installed':'install')}</h2>${running?'':`<p>${t('installHelp')}</p>${installPrompt?`<button data-action="install">${t('install')}</button>`:''}`}
 <p><a class="link" href="../">${t('site')} ↗</a></p></article>`;
}

const screens = {today, practices, practice, path, journal, schedule, profile};

function refreshBanner() {
 const current = state();
 const now = new Date();
 const time = String(now.getHours()).padStart(2,'0')+':'+String(now.getMinutes()).padStart(2,'0');
 const reminders = current.reminders;
 const stats = metrics(current.sessions, now);
 const item = sampleClass(now);
 const messages = [];
 if (!navigator.onLine) messages.push(t('offline'));
 if (!repo.available) messages.push(t('storageError'));
 if (reminders.time && time >= reminders.time) {
  if (reminders.practice && !stats.days.has(dateKey(now))) messages.push(t('remindPractice'));
  if (reminders.schedule && item?.date > now) messages.push(t('remindSchedule'));
  if (reminders.goal && stats.week < current.goal) messages.push(t('remindGoal'));
 }
 const banner = $('#reminder');
 banner.hidden = !messages.length && !waitingWorker;
 banner.replaceChildren(document.createTextNode(messages.join(' · ')));
 if (waitingWorker) {
  const button = document.createElement('button');
  button.dataset.action = 'update';
  button.textContent = t('update');
  banner.append(' ', button);
 }
}

function refreshTimer() {
 const value = $('#timer');
 if (!value) return;
 const item = itemFor(route().id);
 const active = state().active?.id === item.id ? state().active : null;
 value.textContent = displayTime(item.minutes*60-elapsed(active,item.minutes*60));
}

function render() {
 const current = route();
 document.documentElement.lang = lang();
 $('#language').value = lang();
 const calendar = $('#schedule-link');
 calendar.innerHTML = icon('schedule');
 calendar.setAttribute('aria-label',t('schedule'));
 if (current.name === 'schedule') calendar.setAttribute('aria-current','page');
 else calendar.removeAttribute('aria-current');
 $('#mode').textContent = t('demo');
 const activeTab = current.name === 'practice' ? 'practices' : current.name;
 $('#tabs').innerHTML = tabs.map(name=>`<a href="#${name}" ${activeTab===name?'aria-current="page"':''}>${icon(name)}<span>${t(name)}</span></a>`).join('');
 document.title = 'RESTART · '+t(activeTab);
 screen.innerHTML = screens[current.name](current.id);
 refreshBanner();
}

$('#language').addEventListener('change', event=>{
 const form = screen.querySelector('form');
 const inputs = form && Array.from(form.elements).filter(el=>el.name).map(el=>[el.name,el.type==='checkbox'?el.checked:el.value]);
 repo.write({lang:event.target.value});
 render();
 if (inputs) for (const [name,value] of inputs) {
  const field = document.getElementById(form.id)?.elements.namedItem(name);
  if (field && field.type==='checkbox') field.checked=value;
  else if (field) field.value=value;
 }
});

window.addEventListener('hashchange',()=>{
 editing = null;
 if (route().name==='schedule') {
  selectedDay = dateKey(nextClass(new Date())?.date || new Date());
  scheduleOffset = weekStart(fromDateKey(selectedDay)).getTime() > weekStart(new Date()).getTime() ? 1 : 0;
 }
 render();
 screen.focus();
 window.scrollTo(0,0);
});

function setScheduleDay(day) {
 selectedDay = day;
 const difference = weekStart(fromDateKey(day)) - weekStart(new Date());
 scheduleOffset = Math.round(difference/604800000);
 render();
 screen.querySelector('[data-day="'+day+'"]')?.focus({preventScroll:true});
}

function updatePractice(action) {
 const id = route().id;
 const item = itemFor(id);
 if (!item) return;
 const current = state();
 const active = current.active;
 const now = Date.now();
 if (active && active.id !== id) return;
 if (action === 'start') {
  repo.write({active: {...(active || {id, sessionId:crypto.randomUUID(), accumulated:0}), startedAt: now}});
 } else if (active && action === 'pause') {
  repo.write({active: pause(active,item.minutes*60,now)});
 } else if (active && action === 'finish') {
  const session = {id: active.sessionId, practice:id, seconds:elapsed(active,item.minutes*60,now), day:dateKey()};
  repo.write({active:null,sessions:[...current.sessions,session]});
  $('#status').textContent=t('completed');
  location.hash='path';
  return;
 } else if (active && action === 'stop') {
  repo.write({active:null});
 }
 render();
 screen.querySelector('[data-action]')?.focus({preventScroll:true});
}

document.addEventListener('click',async event=>{
 const button = event.target.closest('button');
 if (!button) return;
 const {filter:categoryFilter, action, edit, remove, day, week} = button.dataset;
 if (categoryFilter) {
  filter = categoryFilter;
  render();
  screen.querySelector('[data-filter="'+categoryFilter+'"]').focus();
 } else if (edit) {
  editing = edit;
  render();
  $('#journal-form input').focus();
 } else if (remove && confirm(t('confirmDelete'))) {
  repo.write({journal:state().journal.filter(entry=>entry.id !== remove)});
  render();
  $('#journal-form input').focus({preventScroll:true});
 } else if (day) {
  setScheduleDay(day);
 } else if (week) {
  setScheduleDay(dateKey(shiftDate(weekStart(new Date()),(scheduleOffset+Number(week))*7)));
 } else if (action === 'cancel-edit') {
  editing = null;
  render();
  $('#journal-form input').focus({preventScroll:true});
 } else if (action === 'install' && installPrompt) {
  const prompt = installPrompt;
  installPrompt = null;
  await prompt.prompt();
  if (route().name==='profile') render();
 } else if (action === 'update') {
  if (screen.querySelector('form') && !confirm(t('updateConfirm'))) return;
  if (waitingWorker) {
   applyingUpdate = true;
   waitingWorker.postMessage({type:'ACTIVATE'});
  }
 } else if (['start','pause','finish','stop'].includes(action)) {
  updatePractice(action);
 }
});

screen.addEventListener('submit', event=>{
 event.preventDefault();
 const form = event.target;
 const data = Object.fromEntries(new FormData(form));
 if (form.id === 'journal-form') {
  const entry = {...data, id:editing || crypto.randomUUID()};
  repo.write({journal:upsertEntry(state().journal,entry)});
  editing = null;
 } else if (form.id === 'goal-form') {
  repo.write({goal:Number(data.goal)});
 } else if (form.id === 'profile-form') {
  repo.write({name:data.name.trim()});
 } else if (form.id === 'reminder-form') {
  repo.write({reminders:{time:data.time,practice:!!data.practice,schedule:!!data.schedule,goal:!!data.goal}});
 } else return;
 render();
 document.getElementById(form.id)?.querySelector('button').focus({preventScroll:true});
 $('#status').textContent = t(repo.available ? 'saved' : 'storageError');
});

window.addEventListener('online',refreshBanner);
window.addEventListener('offline',refreshBanner);
window.addEventListener('beforeinstallprompt',event=>{
 event.preventDefault();
 installPrompt=event;
 if (route().name==='profile' && !screen.contains(document.activeElement)) render();
});
window.addEventListener('appinstalled',()=>{
 installPrompt=null;
 if (route().name==='profile') render();
});

render();
setInterval(refreshTimer,1000);
setInterval(refreshBanner,30000);
document.addEventListener('visibilitychange',()=>{refreshTimer();refreshBanner()});

if ('serviceWorker' in navigator && !globalThis.Capacitor?.isNativePlatform?.()) {
 navigator.serviceWorker.addEventListener('controllerchange',()=>{
  if (applyingUpdate) location.reload();
 });
 navigator.serviceWorker.register('./sw.js',{scope:'./',updateViaCache:'none'}).then(registration=>{
  function offerUpdate() {
   waitingWorker = registration.active ? registration.waiting : null;
   refreshBanner();
  }
  offerUpdate();
  registration.addEventListener('updatefound',()=>{
   registration.installing?.addEventListener('statechange',offerUpdate);
  });
  navigator.serviceWorker.addEventListener('controllerchange',offerUpdate);
 }).catch(()=>{});
}
