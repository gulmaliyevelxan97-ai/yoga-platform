import {dateKey, fromDateKey, shiftDate, weekStart} from './state.mjs';

const journalPeriods = new Map([['all', null], ['week', 7], ['month', 30]]);

const milestones = {
 ru:['Достижения','Первая практика','Семь дней с практикой'],
 az:['Nailiyyətlər','İlk məşğələ','Yeddi məşğələ günü'],
 en:['Milestones','First practice','Seven practice days']
};

export function practiceMilestones(sessions, today = new Date()) {
 const latest = dateKey(today);
 const days = new Set(sessions.filter(session => session.day <= latest).map(session => session.day));
 return {first:days.size > 0, sevenDays:days.size >= 7};
}

function renderMilestones(sessions, language, today) {
 const earned = practiceMilestones(sessions,today);
 if (!earned.first) return '';
 const [title,first,sevenDays] = milestones[language] || milestones.ru;
 const items = earned.sevenDays ? [first,sevenDays] : [first];
 return '<section class="panel"><h2>'+title+'</h2><ul class="milestone-list">'+items.map(label=>
  '<li><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="10" r="6"/><path d="m9.5 10 1.5 1.5 3-3m-6 7-1 5 5-2 5 2-1-5"/></svg>'+label+'</li>'
 ).join('')+'</ul></section>';
}

const copy = {
 ru: {trend:'Последние четыре недели', count:'Практик', min:'мин', sec:'с',
  filter:'Период дневника', all:'Все записи', week:'Последние 7 дней', month:'Последние 30 дней',
  empty:'Здесь появятся ваши записи.', emptyPeriod:'За этот период записей нет.'},
 az: {trend:'Son dörd həftə', count:'Məşq sayı', min:'dəq', sec:'san',
  filter:'Gündəlik dövrü', all:'Bütün qeydlər', week:'Son 7 gün', month:'Son 30 gün',
  empty:'Qeydləriniz burada görünəcək.', emptyPeriod:'Bu dövr üçün qeyd yoxdur.'},
 en: {trend:'Past four weeks', count:'Practices', min:'min', sec:'sec',
  filter:'Journal date range', all:'All entries', week:'Last 7 days', month:'Last 30 days',
  empty:'Your entries will appear here.', emptyPeriod:'No entries in this date range.'}
};

export function weeklyPracticeTrends(sessions, today = new Date()) {
 const monday = weekStart(today);
 const latest = dateKey(today);
 const weeks = Array.from({length:4}, (_,index)=>{
  const start = shiftDate(monday, (index - 3)*7);
  return {start:dateKey(start), end:dateKey(shiftDate(start,6)), count:0, seconds:0};
 });
 for (const session of sessions) {
  if (session.day > latest) continue;
  const week = weeks.find(item=>session.day >= item.start && session.day <= item.end);
  if (!week) continue;
  week.count++;
  if (Number.isFinite(session.seconds) && session.seconds > 0) week.seconds += session.seconds;
 }
 return weeks;
}

export function renderPracticeTrends(sessions, language, today = new Date()) {
 const labels = copy[language] || copy.ru;
 const format = new Intl.DateTimeFormat(language, {day:'numeric', month:'short'});
 const number = new Intl.NumberFormat(language);
 const weeks = weeklyPracticeTrends(sessions,today);
 const max = Math.max(1,...weeks.map(week=>week.count));
 return '<section class="panel"><h2>'+labels.trend+'</h2><ul class="history practice-trend">'+weeks.map(week=>{
  const date = '<time datetime="'+week.start+'">'+format.format(fromDateKey(week.start))+'</time>';
  const count = labels.count+' '+number.format(week.count);
  const duration = number.format(Math.floor(week.seconds / 60))+' '+labels.min+' '+number.format(week.seconds % 60)+' '+labels.sec;
  return '<li><div>'+date+'<small>'+count+' · '+duration+'</small></div><meter max="'+max+'" value="'+week.count+'" aria-hidden="true"></meter></li>';
 }).join('')+'</ul></section>'+renderMilestones(sessions,language,today);
}

export function filterJournal(entries, period, today = new Date(), query = '', language = 'ru') {
 const normalize = value => String(value ?? '').normalize('NFC').toLocaleLowerCase(language);
 const terms = normalize(query).trim().split(/\s+/u).filter(Boolean);
 const days = journalPeriods.get(period);
 const latest = dateKey(today);
 const earliest = days ? dateKey(shiftDate(today,1-days)) : null;
 return entries.filter(entry=>earliest === null || (entry.date >= earliest && entry.date <= latest))
  .filter(entry=>terms.every(term=>['before','after','notes'].some(field=>normalize(entry[field]).includes(term))))
  .sort((left,right)=>right.date.localeCompare(left.date));
}

export function renderJournalFilter(period, language) {
 const labels = copy[language] || copy.ru;
 return '<label>'+labels.filter+'<select data-journal-period>'+[...journalPeriods.keys()]
  .map(key=>'<option value="'+key+'"'+(key===period?' selected':'')+'>'+labels[key]+'</option>').join('')+'</select></label>';
}

export function journalEmptyLabel(period, language) {
 const labels = copy[language] || copy.ru;
 return journalPeriods.get(period) ? labels.emptyPeriod : labels.empty;
}
