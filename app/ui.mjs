import {renderWeeklyProgram, renderWeeklyProgramLink} from './week.mjs';
import {readNotificationPlan,writeNotificationPlan,renderNotificationPlan,notificationPlanFromForm,dueNotifications,notificationPlanMessage} from './notification-plan.mjs';
import {renderPersonalPlan,submitPersonalPlan,suggestedPracticeId} from './personal-plan.mjs';
import {renderPracticeTrends,renderJournalFilter,filterJournal,journalEmptyLabel} from './progress-view.mjs';
import {schoolPage, schoolStrings} from './school.mjs';
import cloudConfig from './cloud-config.mjs';
import {cloudAccount, createPilotClient} from './cloud-auth.mjs';
import {cloudStrings} from './cloud-copy.mjs';
import {catalog, categories, mentorContent, strings} from './content.mjs';
import {localRepository, languages, dateKey, fromDateKey, shiftDate, weekStart, elapsed, pause, metrics, upsertEntry} from './state.mjs';

const $ = selector => document.querySelector(selector);
const repo = localRepository();
const seenReminderKey = 'restart.notification.seen.v1';
let seenReminders = new Set();
let activeReminder;
try {
 const items = JSON.parse(localStorage.getItem(seenReminderKey));
 if (Array.isArray(items)) seenReminders = new Set(items.filter(item=>typeof item==='string').slice(-12));
} catch {}

let cloud;
let pilotClient;
let renderSequence = 0;
const screen = $('#screen');
$('#skip-to-content').addEventListener('click',()=>{
 screen.focus();
 screen.scrollIntoView({block:'start'});
});
const tabs = ['today', 'practices', 'academy', 'path', 'profile'];
const icons = {
 today:'M3 10l9-7 9 7v10H3z M9 20v-6h6v6', practices:'M4 16c5-8 11-8 16 0 M8 17c2-4 6-4 8 0 M12 4v2 M5 7l1.5 1.5 M19 7l-1.5 1.5',
 academy:'M12 6c-3-2-6-3-9-2v15c3-1 6 0 9 2 3-2 6-3 9-2V4c-3-1-6 0-9 2v15',
 check:'M5 12l4 4L19 6',
 yoga:'M12 4a2 2 0 1 0 0 4 2 2 0 1 0 0-4 M8 19H5a2 2 0 0 1-1-3l4-3 4-3 4 3 4 3a2 2 0 0 1-1 3h-7 M12 10v6',
 meditation:'M12 20C6 20 3 17 3 12c4 0 6 1 9 5 3-4 5-5 9-5 0 5-3 8-9 8 M8 13c0-4 2-7 4-9 2 2 4 5 4 9',
 breathing:'M3 8h11a2 2 0 1 0-2-2 M3 12h16a2 2 0 1 1-2 2 M3 16h8a2 2 0 1 1-2 2',
 mobility:'M4 10a8 8 0 0 1 13-4l3 3 M20 4v5h-5 M20 14a8 8 0 0 1-13 4l-3-3 M4 20v-5h5',
 strength:'M8 12h8 M5 5h3v14H5z M16 5h3v14h-3z M2 9h3v6H2z M19 9h3v6h-3z',
 recovery:'M20 16a8 8 0 0 1-12-12 8.5 8.5 0 1 0 12 12',
 path:'M3 20h18 M5 16l5-6 4 3 5-8 M15 5h4v4', journal:'M5 4h13v16H5z M8 8h7 M8 12h7 M8 16h4',
 profile:'M16 8a4 4 0 1 1-8 0 4 4 0 0 1 8 0z M4 21v-2a8 8 0 0 1 16 0v2',
 schedule:'M4 6h16v14H4z M8 3v6 M16 3v6 M4 11h16 M8 15h2 M14 15h2', arrow:'M6 18L18 6 M9 6h9v9'
};
const icon = name => '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.55" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="'+icons[name]+'"/></svg>';
const esc = value => String(value ?? '').replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
const state = () => cloud?.state || repo.read();
const lang = () => languages.includes(state().lang) ? state().lang : 'ru';
const tr = triple => triple[languages.indexOf(lang())];
const mobileStrings = {
 theme:['Оформление','Görünüş','Appearance'],
 themeSystem:['Как на устройстве','Cihaz ayarına uyğun','System'],
 themeLight:['Светлое','İşıqlı','Light'],
 themeDark:['Тёмное','Tünd','Dark'],
 week:['Программа недели','Həftəlik proqram','Weekly program'],
 pathTab:['Прогресс','İrəliləyiş','Progress'],
 academyTab:['Академия','Akademiya','Academy'],
 welcomeNote:['Выберите время для движения и внимания к себе.','Hərəkətə və özünüzə diqqət ayırmağa vaxt seçin.','Make time for movement and a moment of attention.'],
 dailyDone:['Выполнено сегодня','Bu gün tamamlanıb','Completed today'],
 dailyActive:['Практика начата','Məşq başlayıb','Practice in progress'],
 selectDuration:['Длительность','Müddət','Duration'],
 shortDuration:['До 4 мин','4 dəqiqəyədək','Up to 4 min'],
 longDuration:['5–6 мин','5–6 dəqiqə','5–6 min'],
 noResults:['Под эти фильтры ничего не подходит.','Bu filtrlərə uyğun məşq yoxdur.','No practices match these filters.'],
 practiceLevel:['Подготовка','Hazırlıq','Experience'],
 practiceGuided:['Без подготовки','Hazırlıq tələb olunmur','No experience needed'],
 practiceFamiliar:['Знакомые упражнения','Tanış hərəkətlər','Familiar exercises'],
 practiceGoal:['Цель практики','Məşqin məqsədi','Practice goal'],
 goalMove:['Движение','Hərəkət','Movement'],
 goalFocus:['Внимание','Diqqət','Focus'],
 goalRest:['Отдых','İstirahət','Rest'],
 clearFilters:['Сбросить фильтры','Filtrləri sıfırla','Clear filters'],
 academyWelcome:['Авторские программы RESTART','RESTART-ın müəllif proqramları','RESTART programmes'],
 academyOverview:['О программе','Proqram haqqında','Explore the programme'],
 academyLocal:['Откройте программу школы, чтобы узнать о её направлениях и формате обучения.','Məktəbin istiqamətləri və tədris formatı ilə tanış olmaq üçün proqramı açın.','Explore the school’s programme, learning format and areas of focus.']
};
const t = key => tr(mobileStrings[key] || strings[key] || cloudStrings[key] || schoolStrings[key]);
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
const practiceFilters = [
 {key:'duration',label:'selectDuration',options:{short:'shortDuration',long:'longDuration'}},
 {key:'level',label:'practiceLevel',options:{open:'practiceGuided',familiar:'practiceFamiliar'}},
 {key:'goal',label:'practiceGoal',options:{move:'goalMove',focus:'goalFocus',rest:'goalRest'}}
];
const practiceChoices = {duration:'all',level:'all',goal:'all'};
const practiceLevels = practiceFilters.find(({key})=>key==='level').options;
const practiceDetails = {
 yoga:{level:'familiar',goal:'move'}, meditation:{level:'open',goal:'focus'},
 breathing:{level:'open',goal:'focus'}, mobility:{level:'open',goal:'move'},
 strength:{level:'familiar',goal:'move'}, recovery:{level:'open',goal:'rest'}
};
let selectedDay = dateKey();
let scheduleOffset = 0;
let editing = null;
let journalPeriod = 'all';
let journalQuery = '';
let installPrompt;
let waitingWorker;
let applyingUpdate = false;

function route() {
 const [name, id] = location.hash.slice(1).split('/');
 if (cloud && (name === 'account' || cloud.recovery)) return {name:'account'};
 if (cloudConfig && ['academy','classes','staff'].includes(name)) return {name,id};
 if (name === 'practice' && itemFor(id)) return {name, id};
 return {name: [...tabs, 'journal', 'schedule', 'mentor', 'week'].includes(name) ? name : 'today'};
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
 const suggested = itemFor(current.active?.id) || itemFor(suggestedPracticeId(now)) || catalog[now.getDay() % catalog.length];
 const next = nextClass(now);
 const stats = metrics(current.sessions, now);
 const complete = current.sessions.some(session=>session.practice===suggested.id && session.day===dateKey(now));
 const avatar = current.name ? esc(Array.from(current.name.trim())[0]?.toLocaleUpperCase(lang()) || '') : icon('profile');
 return `
 <div class="today-heading"><div><p class="eyebrow">${esc(dateText(now,{weekday:'long',day:'numeric',month:'long'}))}</p>
 <h1>${t('welcome')}${current.name ? ', '+esc(current.name) : ''}</h1><p class="muted">${t('welcomeNote')}</p></div>
 <a class="today-avatar" href="#profile" aria-label="${t('profile')}">${avatar}</a></div>
 <article class="today-practice practice-cover-${suggested.id}"><div class="today-copy">
 <p class="eyebrow">${t('daily')} · ${category(suggested.id)} · ${suggested.minutes} ${t('min')}</p>
 <h2>${title(suggested)}</h2>
 <p class="practice-level">${t(practiceLevels[practiceDetails[suggested.id].level])}</p>
 ${current.active || complete ? `<p class="practice-state">${icon(current.active?'practices':'check')} ${t(current.active?'dailyActive':'dailyDone')}</p>` : ''}
 <a class="cta" href="#practice/${suggested.id}">${t(current.active ? 'resume' : 'start')} <span class="arrow" aria-hidden="true">${icon('arrow')}</span></a></div></article>
 <div class="home-grid">
 <article class="panel goal-card"><p class="eyebrow">${t('progress')}</p><h2>${stats.week} <span class="muted">/ ${current.goal}</span></h2>
 <progress aria-label="${t('progress')}" value="${stats.week}" max="${current.goal}"></progress><a class="link" href="#path">${t('goal')} <span aria-hidden="true">→</span></a></article>
 ${next && !cloud?.user ? `<article class="panel next-card"><p class="eyebrow">${t('next')}</p><h2>${t('classTitle')}</h2>
 <p>${esc(dateText(next.date,{day:'numeric',month:'short'}))} · ${localTime(next)}</p><a class="link" href="#schedule">${t('sample')} <span aria-hidden="true">→</span></a></article>` : ''}
 </div>
 <article class="panel reflection"><div><p class="eyebrow">${t('journal')}</p><h2>${t('reflect')}</h2></div><a class="button" href="#journal">${t('addJournal')}</a></article>
 <div class="today-actions">
 ${renderWeeklyProgramLink(lang())}
 <a class="button" href="#academy">${icon('academy')} ${t('academyTab')}</a>
 <a class="button" href="#${cloud?.user?'classes':'schedule'}">${icon('schedule')} ${t('schedule')}</a>
 </div>
 <a class="link mentor-link" href="#mentor">${t('meetMentor')} <span aria-hidden="true">→</span></a>`;
}

function practices() {
 const matching = catalog.filter(item=>{
  const values = {duration:item.minutes<=4?'short':'long',...practiceDetails[item.id]};
  return (filter==='all' || filter===item.id) &&
   practiceFilters.every(({key})=>practiceChoices[key]==='all' || practiceChoices[key]===values[key]);
 });
 const options = practiceFilters.map(({key,label,options})=>
  `<label>${t(label)}<select data-practice-choice="${key}">
   ${Object.entries({all:'all',...options}).map(([value,name])=>
   `<option value="${value}" ${value===practiceChoices[key]?'selected':''}>${t(name)}</option>`).join('')}
  </select></label>`).join('');
 return heading('practices') + `<p class="muted">${t('timer')}</p>
 <div class="filters practice-filters">${['all',...catalog.map(p=>p.id)].map(id=>
  `<button data-filter="${id}" aria-pressed="${filter===id}">${id==='all'?t('all'):category(id)}</button>`).join('')}</div>
 <div class="field-row practice-options">${options}</div>
 ${matching.length ? `<div class="practice-grid">${matching.map(item=>
  `<a class="practice-card practice-cover-${item.id}" href="#practice/${item.id}">
  <div class="practice-card-art">${icon(item.id)}</div><div class="practice-card-copy">
  <p class="eyebrow">${category(item.id)} · ${item.minutes} ${t('min')}</p>
  <h2>${title(item)}</h2><div class="practice-card-footer"><small>${t(practiceLevels[practiceDetails[item.id].level])}</small>
  <span class="arrow">${icon('arrow')}</span></div></div></a>`).join('')}</div>`
  : `<div class="panel" role="status"><p>${t('noResults')}</p><button data-action="clear-practice-filters">${t('clearFilters')}</button></div>`}`;
}

function academy() {
 return heading('academyTab')+`<article class="panel academy-intro">${icon('academy')}
 <h2>${t('academyWelcome')}</h2><p>${t('academyLocal')}</p>
 <a class="cta" href="../programme.html">${t('academyOverview')}</a></article>`;
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
 ${renderPracticeTrends(current.sessions,lang())}
 ${renderPersonalPlan(lang())}
 <form id="goal-form" class="panel"><h2>${t('goal')}</h2><label>${t('goalField')}<input type="number" name="goal" min="1" max="99" value="${current.goal}" required></label><button class="cta">${t('save')}</button></form>
 <article class="panel"><h2>${t('history')}</h2>${history?'<ul class="history">'+history+'</ul>':'<p class="muted">'+t('noSessions')+'</p>'}</article>`;
}

function journal() {
 const draft = cloud?.journalDraft;
 const current = draft || state().journal.find(entry=>entry.id===editing) || {};
 const levels = ['unset','low','medium','high'];
 const scales = ['mood','energy','wellbeing'];
 const fields = ['before','after','notes'];
 return heading('journal')+`<p class="muted">${t(cloud?.user?'cloudNetworkNote':'localNote')}</p>${draft?`<p role="status">${t('cloudDraft')}</p>`:''}<form id="journal-form" class="panel">
 <label>${t('date')}<input type="date" name="date" value="${esc(current.date||dateKey())}" required></label>
 <div class="field-row">${scales.map(key=>`<label>${t(key)}<select name="${key}">${levels.map((level,i)=>`<option value="${i}" ${current[key]===String(i)?'selected':''}>${t(level)}</option>`).join('')}</select></label>`).join('')}</div>
 ${fields.map(key=>`<label>${t(key)}<textarea name="${key}" rows="2" maxlength="2000">${esc(current[key])}</textarea></label>`).join('')}
 <div class="actions"><button class="cta">${t('save')}</button>${(editing||draft)?`<button type="button" data-action="cancel-edit">${t('cancel')}</button>`:''}</div></form>
 <h2>${t('entries')}</h2>
 ${renderJournalFilter(journalPeriod,lang())}
 <form id="journal-search" class="panel"><label>${tr(['Поиск по записям','Qeydlərdə axtarış','Search entries'])}<input name="query" type="search" maxlength="120" value="${esc(journalQuery)}" autocomplete="off"></label><button>${tr(['Найти','Axtar','Search'])}</button></form>
 <div id="journal-results" aria-live="polite">${journalEntries()}</div>`;
}

function journalEntries() {
 const levels = ['unset','low','medium','high'];
 const scales = ['mood','energy','wellbeing'];
 const fields = ['before','after','notes'];
 return filterJournal(state().journal,journalPeriod,new Date(),journalQuery,lang()).map(entry=>`<article class="panel entry"><h3>${esc(dateLabel(entry.date))}</h3>
 <dl>${[...scales,...fields].filter(key=>entry[key]&&entry[key]!=='0').map(key=>{
  const value = scales.includes(key) ? t(levels[Number(entry[key])]||'unset') : esc(entry[key]);
  return `<dt>${t(key)}</dt><dd>${value}</dd>`;
 }).join('')}</dl><div class="actions"><button data-edit="${esc(entry.id)}">${t('edit')}</button><button data-remove="${esc(entry.id)}">${t('remove')}</button></div></article>`).join('') || '<p class="muted">'+esc(journalQuery ? tr(['Совпадений нет.','Uyğun qeyd tapılmadı.','No matching entries.']) : journalEmptyLabel(journalPeriod,lang()))+'</p>';
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
 return heading('profile')+`<div class="today-actions"><a class="button" href="#journal">${icon('journal')} ${t('journal')}</a>
 <a class="button" href="#${cloud?.user?'classes':'schedule'}">${icon('schedule')} ${t('schedule')}</a></div><p class="muted">${t(cloud?.user?'cloudNetworkNote':'localNote')}</p>
 ${cloudConfig?`<p><a class="button" href="#account">${t('account')}</a></p>`:''}
 <form id="profile-form" class="panel"><label>${t('name')}<input name="name" maxlength="40" value="${esc(current.name)}"></label><button class="cta">${t('save')}</button></form>
 <div class="panel"><label for="restart-theme">${t('theme')}<select id="restart-theme">
 ${[['system','themeSystem'],['light','themeLight'],['dark','themeDark']].map(([value,key])=>
 `<option value="${value}">${t(key)}</option>`).join('')}</select></label></div>
 <form id="reminder-form" class="panel"><h2>${t('reminders')}</h2><p class="muted">${t('reminderNote')}</p><label>${t('reminderTime')}<input type="time" name="time" value="${esc(reminder.time)}" required></label>
 ${['practice','schedule','goal'].map((key,i)=>`<label class="check"><input type="checkbox" name="${key}" ${reminder[key]?'checked':''}>${t(['remindPractice','remindSchedule','remindGoal'][i])}</label>`).join('')}<button class="cta">${t('save')}</button></form>
 ${renderNotificationPlan(readNotificationPlan(),lang())}
 <article class="panel"><h2>${t(running?'installed':'install')}</h2>${running?'':`<p>${t('installHelp')}</p>${installPrompt?`<button data-action="install">${t('install')}</button>`:''}`}
 <p><a class="link" href="../">${t('site')} ↗</a></p></article>`;
}

function mentor() {
 const {history, background, teaching, pillars} = mentorContent;
 return `<a class="link back" href="#today">← ${t('today')}</a>
 <div class="mentor-hero">
 <div class="mentor-intro"><p class="eyebrow">${t('mentor')}</p><h1>Elxan Gülmalıyev</h1>
 <p>${t('mentorRole')}</p></div>
 <img class="mentor-portrait" src="../assets/brand/restart-1188.webp"
      srcset="../assets/brand/restart-640.webp 640w, ../assets/brand/restart-1188.webp 1188w"
      sizes="(max-width: 640px) 92vw, 340px" width="1188" height="1536" alt="Elxan Gülmalıyev">
 </div>
 <div class="mentor-details">
 <section class="panel"><h2>${t('mentorStory')}</h2><p>${tr(history)}</p></section>
 <section class="panel"><h2>${t('mentorSport')}</h2><ul class="mentor-achievements">${background.map(item=>`<li>${tr(item)}</li>`).join('')}</ul></section>
 <section class="panel"><h2>${t('mentorTeaching')}</h2><p>${tr(teaching)}</p></section>
 <section class="mentor-pillars"><h2>${t('mentorPillars')}</h2><dl>${Object.entries(pillars).map(([name,copy])=>
  `<div class="panel"><dt>${name}</dt><dd>${tr(copy)}</dd></div>`).join('')}</dl></section>
 </div>`;
}

function importCounts(counts) {
 return t('cloudCounts').replace('{j}',counts.journal).replace('{p}',counts.practices);
}

function account() {
 const local = repo.read();
 const email = `<label>${t('cloudEmail')}<input name="email" type="email" autocomplete="email" maxlength="254" required></label>`;
 const password = kind => `<label>${t('cloudPassword')}<input name="password" type="password"
   autocomplete="${kind==='login'?'current-password':'new-password'}" ${kind==='login'?'':'minlength="12"'} maxlength="72" required></label>`;
 const form = (kind,label,fields) => `<form class="panel" data-cloud-auth="${kind}">
  <h2>${t(label)}</h2>${fields}<button class="cta">${t(label)}</button></form>`;
 if (cloud.recovery) return heading('account')+form('password','cloudNewPassword',password('password'));
 if (!cloud.user) return heading('account')+form('login','cloudLogin',email+password('login'))+
  form('register','cloudRegister',email+password('register'))+form('reset','cloudReset',email);
 return heading('account')+`<div class="panel"><p>${esc(cloud.user.email)}</p><p>${t('cloudNetworkNote')}</p>
  <div class="actions"><button data-action="cloud-refresh">${t('cloudSync')}</button>
  <button data-action="cloud-logout">${t('cloudLogout')}</button></div></div>
  <form class="panel" data-cloud-auth="import" data-owner="${esc(cloud.user.id)}">
   <h2>${t('cloudImport')}</h2><p>${t('cloudImportNote')}</p><p>${importCounts({journal:local.journal.length,practices:local.sessions.length})}</p>
   <label class="check"><input type="checkbox" name="consent" required>${t('cloudImportConsent')}</label>
   <button>${t('cloudImport')}</button>
  </form>`;
}

function cloudNotice() {
 const status = $('#cloud-status');
 status.textContent = cloud?.notice ? t(cloud.notice) : '';
 if (cloud?.notice==='cloudImported' && cloud.lastImport) status.textContent += ' '+importCounts(cloud.lastImport);
 status.hidden = !status.textContent;
}

function setActive(active) {
 if (cloud?.state) cloud.state.active = active;
 else repo.write({active});
}

const week = () => renderWeeklyProgram({lang:lang(),sessions:state().sessions});
const screens = {today, practices, practice, path, journal, schedule, profile, mentor, account, academy, week};

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
 const plan = readNotificationPlan();
 const due = dueNotifications(plan,{now,windowMinutes:10});
 if (!due.some(item=>item.id===activeReminder?.id)) activeReminder = null;
 const pending = due.filter(item=>!seenReminders.has(item.id));
 if (pending.length && document.visibilityState==='visible') {
  activeReminder = pending.at(-1);
  for (const item of pending) seenReminders.add(item.id);
  seenReminders = new Set([...seenReminders].slice(-12));
  try {localStorage.setItem(seenReminderKey,JSON.stringify([...seenReminders]));} catch {}
 }
 if (activeReminder) {
  const titles = {morning:['Утро','Səhər','Morning'],day:['День','Gündüz','Daytime'],evening:['Вечер','Axşam','Evening']};
  const labels = {practice:'practices',academy:'academyTab',schedule:'schedule',journal:'journal',goal:'goal'};
  messages.push(tr(titles[activeReminder.period])+': '+activeReminder.categories.map(key=>t(labels[key])).join(', '));
 }
 if (!plan.enabled && reminders.time && time >= reminders.time) {
  if (reminders.practice && !stats.days.has(dateKey(now))) messages.push(t('remindPractice'));
  if (reminders.schedule && item?.date > now) messages.push(t('remindSchedule'));
  if (reminders.goal && stats.week < current.goal) messages.push(t('remindGoal'));
 }
 const banner = $('#reminder');
 banner.hidden = !messages.length && !waitingWorker;
 const bannerText = messages.join(' · ');
 const existingUpdate = banner.querySelector('[data-action=update]');
 if (banner.firstChild?.textContent === bannerText && Boolean(existingUpdate) === Boolean(waitingWorker)) return;
 banner.replaceChildren(document.createTextNode(bannerText));
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
 const sequence = ++renderSequence;
 const current = route();
 document.documentElement.lang = lang();
 $('#language').value = lang();
 $('#skip-to-content').textContent = tr(['К содержанию','Məzmuna keç','Skip to content']);
 const calendar = $('#schedule-link');
 calendar.innerHTML = icon('schedule');
 calendar.setAttribute('aria-label',t('schedule'));
 calendar.href = cloud?.user ? '#classes' : '#schedule';
 if (['schedule','classes'].includes(current.name)) calendar.setAttribute('aria-current','page');
 else calendar.removeAttribute('aria-current');
 $('#mode').textContent = t(cloud?.user ? 'cloudMode' : cloudConfig ? 'cloudLocal' : 'demo');
 const activeTab = {practice:'practices',journal:'profile',account:'profile',week:'today'}[current.name] || current.name;
 const tabLabel = name => t({path:'pathTab',academy:'academyTab'}[name] || name);
 $('#tabs').innerHTML = tabs.map(name=>`<a href="#${name}" ${activeTab===name?'aria-current="page"':''}>${icon(name)}<span>${tabLabel(name)}</span></a>`).join('');
 document.title = 'RESTART · '+tabLabel(current.name==='practice'?'practices':current.name);
 screen.innerHTML = cloud?.user && !cloud.state && current.name!=='account'
  ? `<h1>${t('account')}</h1><p>${t(cloud.notice==='cloudLoadFailed'?'cloudLoadFailed':'cloudLoading')}</p><a class="button" href="#account">${t('account')}</a>`
  : ['academy','classes','staff'].includes(current.name)
    && cloudConfig ? '<h1>'+t(current.name==='academy'?'academyTab':current.name)+'</h1><div id="school-content" aria-live="polite"></div>'
    : screens[current.name](current.id);
 const outlet = document.getElementById('school-content');
 if (outlet) {
  if (cloud?.state && pilotClient) {
   schoolPage({outlet,client:pilotClient,user:cloud.user.id,route:current,t,esc,lang:lang(),current:()=>sequence===renderSequence && !!cloud?.state && !cloud.recovery});
  } else outlet.innerHTML = '<a class="button" href="#account">'+t('cloudLogin')+'</a>';
 }
 cloudNotice();
 refreshBanner();
}

$('#language').addEventListener('change', async event=>{
 const form = screen.querySelector('form');
 const inputs = form && Array.from(form.elements).filter(el=>el.name&&el.type!=='password').map(el=>[el.name,el.type==='checkbox'?el.checked:el.value]);
 const selection = event.target.value;
 if (cloud?.user) {
  if (!cloud.state || !(await cloud.save('saveSettings',selection,cloud.state.reminders,cloud.state.revisions.settings))) {
   event.target.value = lang();
   return;
  }
 } else repo.write({lang:selection});
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

async function updatePractice(action) {
 const id = route().id;
 const item = itemFor(id);
 if (!item) return;
 const current = state();
 const active = current.active;
 const now = Date.now();
 if (active && active.id !== id) return;
 if (action === 'start') {
  setActive({...(active || {id, sessionId:crypto.randomUUID(), accumulated:0}), startedAt: now});
 } else if (active && action === 'pause') {
  setActive(pause(active,item.minutes*60,now));
 } else if (active && action === 'finish') {
  const session = {id: active.sessionId, practice:id, seconds:elapsed(active,item.minutes*60,now), day:dateKey()};
  if (cloud?.user) {
   if (!await cloud.save('complete',session)) return;
   if (cloud.state) cloud.state.active = null;
  } else repo.write({active:null,sessions:[...current.sessions,session]});
  $('#status').textContent=t('completed');
  location.hash='path';
  return;
 } else if (active && action === 'stop') {
  setActive(null);
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
 } else if (action === 'clear-practice-filters') {
  filter = 'all';
  for (const {key} of practiceFilters) practiceChoices[key] = 'all';
  render();
  screen.querySelector('[data-filter="all"]').focus();
 } else if (edit) {
  if (cloud?.journalDraft && !confirm(t('cloudDiscard'))) return;
  cloud?.discardJournalDraft();
  editing = edit;
  render();
  $('#journal-form input').focus();
 } else if (remove && confirm(t('confirmDelete'))) {
  if (cloud?.user) {
   const entry = state().journal.find(item=>item.id===remove);
   if (!entry || !await cloud.save('deleteJournal',entry)) return;
  } else repo.write({journal:state().journal.filter(entry=>entry.id !== remove)});
  render();
  $('#journal-form input').focus({preventScroll:true});
 } else if (day) {
  setScheduleDay(day);
 } else if (week) {
  setScheduleDay(dateKey(shiftDate(weekStart(new Date()),(scheduleOffset+Number(week))*7)));
 } else if (action === 'cancel-edit') {
  cloud?.discardJournalDraft();
  editing = null;
  render();
  $('#journal-form input').focus({preventScroll:true});
 } else if (action === 'cloud-refresh') {
  await cloud.save('refresh');
  render();
 } else if (action === 'cloud-logout') {
  await cloud.action('logout');
  render();
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

screen.addEventListener('change', event=>{
 const {practiceChoice} = event.target.dataset;
 if (practiceChoice) {
  practiceChoices[practiceChoice] = event.target.value;
  render();
  screen.querySelector('[data-practice-choice="'+practiceChoice+'"]')?.focus({preventScroll:true});
  return;
 }
 if (!event.target.matches('[data-journal-period]')) return;
 journalPeriod = event.target.value;
 $('#journal-results').innerHTML = journalEntries();
});

screen.addEventListener('submit', async event=>{
 event.preventDefault();
 const form = event.target;
 if (form.id==='personal-plan-form') {
  submitPersonalPlan(form,lang(),event.submitter);
  return;
 }
 if (form.id==='notification-plan-form') {
  let outcome;
  try {outcome=writeNotificationPlan(notificationPlanFromForm(form))?'saved':'storageError';}
  catch {outcome='invalid';}
  form.querySelector('#notification-plan-status').textContent=notificationPlanMessage(lang(),outcome);
  refreshBanner();
  return;
 }
 const data = Object.fromEntries(new FormData(form));
 if (form.id==='journal-search') {
  journalQuery = data.query.trim();
  $('#journal-results').innerHTML = journalEntries();
  return;
 }
 if (form.dataset.cloudAuth) {
  const kind = form.dataset.cloudAuth;
  const ok = kind==='import' ? Boolean(data.consent) && form.dataset.owner===cloud.user?.id && await cloud.save('import',repo.read()) : await cloud.action(kind,data);
  if (ok) render();
  return;
 }
 if (cloud?.user && !cloud.state) return;
 const revisions = cloud?.state?.revisions;
 if (form.id === 'journal-form') {
  const original = editing ? state().journal.find(item=>item.id===editing) : null;
  const draft = cloud?.journalDraft;
  const entry = {...data, id:draft?.id || editing || (form.dataset.entryId ||= crypto.randomUUID()), revision:draft ? draft.revision : original?.revision};
  if (cloud?.user) {
   if (cloud.busy) return;
   form.inert = true;
   try {
    if (!await cloud.save('saveJournal',entry)) return;
   } finally { form.inert = false; }
  } else repo.write({journal:upsertEntry(state().journal,entry)});
  editing = null;
 } else if (form.id === 'goal-form') {
  if (cloud?.user) {
   if (!await cloud.save('saveGoal',Number(data.goal),revisions.goal)) return;
  } else repo.write({goal:Number(data.goal)});
 } else if (form.id === 'profile-form') {
  if (cloud?.user) {
   if (!await cloud.save('saveName',data.name.trim(),revisions.name)) return;
  } else repo.write({name:data.name.trim()});
 } else if (form.id === 'reminder-form') {
  const reminders = {time:data.time,practice:!!data.practice,schedule:!!data.schedule,goal:!!data.goal};
  if (cloud?.user) {
   if (!await cloud.save('saveSettings',lang(),reminders,revisions.settings)) return;
  } else repo.write({reminders});
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
if (cloudConfig) {
 import('./supabase-sdk.mjs').then(({createClient})=>{
  pilotClient = createPilotClient(createClient,cloudConfig);
  cloud = cloudAccount(pilotClient,replaceScreen=>{
   if (replaceScreen) { editing = null; journalPeriod = 'all'; journalQuery = ''; render(); }
   else cloudNotice();
  },()=>repo.read().lang);
  return cloud.init();
 }).catch(()=>{
  const status = $('#cloud-status');
  status.textContent = t('cloudFailed');
  status.hidden = false;
 });
}

async function refreshReturningAccount() {
 if (!cloud?.user || cloud.recovery || cloud.busy || !navigator.onLine ||
     document.visibilityState==='hidden' || screen.querySelector('form')) return;
 if (await cloud.save('refresh')) render();
}
window.addEventListener('online',refreshReturningAccount);
document.addEventListener('visibilitychange',refreshReturningAccount);

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
