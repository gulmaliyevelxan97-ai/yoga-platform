const storageKey = 'restart.notifications.v1';
const periods = ['morning', 'day', 'evening'];
const categories = ['practice', 'academy', 'schedule', 'journal', 'goal'];
const weekdays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const defaultZone = 'Asia/Baku';
const validTime = value => typeof value === 'string' && /^(?:[01]\d|2[0-3]):[0-5]\d$/.test(value);

const copy = {
 ru: {
  days:'Дни недели', weekdays:['Пн','Вт','Ср','Чт','Пт','Сб','Вс'],
  preview:'Как выглядят напоминания', prompts:[
   'Начните день с нескольких минут внимания к себе.',
   'Сделайте паузу, чтобы подвигаться или восстановить внимание.',
   'Завершите день спокойной практикой или записью в дневнике.'
  ],
  title:'Расписание напоминаний', description:'Напоминания появляются на этом устройстве, пока RESTART открыт.',
  enabled:'Включить расписание', timezone:'Часовой пояс (например, Asia/Baku)',
  morning:'Утро', day:'День', evening:'Вечер', quiet:'Тихие часы',
  quietStart:'Начало', quietEnd:'Конец', quietHelp:'Оставьте оба поля пустыми, если тихие часы не нужны.',
  topics:'Темы напоминаний', practice:'Практики', academy:'Академия', schedule:'Расписание занятий',
  journal:'Дневник', goal:'Недельная цель', save:'Сохранить',
  saved:'Расписание напоминаний сохранено.', invalid:'Проверьте часовой пояс и заполните оба поля тихих часов.',
  missingSchedule:'Укажите время и выберите хотя бы один день и одну тему.',
  storageError:'Устройство не сохранило расписание напоминаний.'
 },
 az: {
  days:'Həftənin günləri', weekdays:['B.e.','Ç.a.','Ç.','C.a.','C.','Ş.','B.'],
  preview:'Xatırlatma nümunələri', prompts:[
   'Günə özünüzə bir neçə dəqiqə ayırmaqla başlayın.',
   'Bir qədər hərəkət etmək və ya diqqətinizi toplamaq üçün fasilə verin.',
   'Günü sakit məşqlə və ya gündəliyə bir qeyd yazmaqla bitirin.'
  ],
  title:'Xatırlatma cədvəli', description:'Xatırlatmalar RESTART açıq olduğu müddətdə bu cihazda görünür.',
  enabled:'Cədvəli aktiv et', timezone:'Saat qurşağı (məsələn, Asia/Baku)',
  morning:'Səhər', day:'Gündüz', evening:'Axşam', quiet:'Sakit saatlar',
  quietStart:'Başlanğıc', quietEnd:'Son', quietHelp:'Sakit saatlar lazım deyilsə, hər iki sahəni boş saxlayın.',
  topics:'Xatırlatma mövzuları', practice:'Məşqlər', academy:'Akademiya', schedule:'Məşğələlərin cədvəli',
  journal:'Gündəlik', goal:'Həftəlik məqsəd', save:'Yadda saxla',
  saved:'Xatırlatma cədvəli yadda saxlanıldı.', invalid:'Saat qurşağını yoxlayın və sakit saatlar üçün hər iki sahəni doldurun.',
  missingSchedule:'Vaxtı, ən azı bir günü və bir mövzunu seçin.',
  storageError:'Cihaz xatırlatma cədvəlini yadda saxlaya bilmədi.'
 },
 en: {
  days:'Days of the week', weekdays:['Mon','Tue','Wed','Thu','Fri','Sat','Sun'],
  preview:'Reminder previews', prompts:[
   'Start the day with a few minutes for yourself.',
   'Take a break to move or refocus.',
   'End the day with a quiet practice or a journal entry.'
  ],
  title:'Reminder schedule', description:'Reminders appear on this device while RESTART is open.',
  enabled:'Enable schedule', timezone:'Time zone (for example, Asia/Baku)',
  morning:'Morning', day:'Daytime', evening:'Evening', quiet:'Quiet hours',
  quietStart:'Start', quietEnd:'End', quietHelp:'Leave both fields empty to turn off quiet hours.',
  topics:'Reminder topics', practice:'Practices', academy:'Academy', schedule:'Class schedule',
  journal:'Journal', goal:'Weekly goal', save:'Save',
  saved:'Reminder schedule saved.', invalid:'Check the time zone and fill in both quiet-hour fields.',
  missingSchedule:'Choose a time, at least one day and at least one topic.',
  storageError:'The device could not save the reminder schedule.'
 }
};

function normalizedZone(value) {
 // Accept IANA-style names such as UTC, Asia/Baku and America/New_York.
 if (typeof value !== 'string' || !/^[A-Za-z][A-Za-z0-9_+\/-]{0,63}$/.test(value)) return null;
 try {
  new Intl.DateTimeFormat('en',{timeZone:value});
  return value;
 } catch {
  return null;
 }
}

function normalize(value) {
 const times = Object.fromEntries(periods.map(period=>[
  period,validTime(value?.times?.[period]) ? value.times[period] : ''
 ]));
 const start = value?.quiet?.start;
 const end = value?.quiet?.end;
 return {
  version:1,
  enabled:value?.enabled===true,
  timeZone:normalizedZone(value?.timeZone) || defaultZone,
  times,
  days:Array.isArray(value?.days) ? weekdays.filter(day=>value.days.includes(day)) : [...weekdays],
  categories:Array.isArray(value?.categories) ? categories.filter(id=>value.categories.includes(id)) : ['practice'],
  quiet:validTime(start) && validTime(end) && start!==end ? {start,end} : {start:'',end:''}
 };
}

export function readNotificationPlan(storage) {
 try {
  const plan = JSON.parse((storage ?? globalThis.localStorage).getItem(storageKey));
  return normalize(plan?.version===1 ? plan : null);
 } catch {
  return normalize(null);
 }
}

export function writeNotificationPlan(plan,storage) {
 try {
  (storage ?? globalThis.localStorage).setItem(storageKey,JSON.stringify(normalize(plan)));
  return true;
 } catch {
  return false;
 }
}

function isQuiet(time,{start,end}) {
 if (!start || !end) return false;
 return start<end ? time>=start && time<end : time>=start || time<end;
}

export function dueNotifications(value,{now=new Date(),seen=new Set(),windowMinutes=1}={}) {
 const plan = normalize(value);
 if (!plan.enabled || !plan.days.length || !plan.categories.length || !Object.values(plan.times).some(Boolean)) return [];
 const timestamp = Number(now);
 if (!Number.isFinite(timestamp)) return [];
 const clock = new Intl.DateTimeFormat('en',{
  timeZone:plan.timeZone,weekday:'short',year:'numeric',month:'2-digit',day:'2-digit',
  hour:'2-digit',minute:'2-digit',hourCycle:'h23'
 });
 const displayed = minute=>{
  const parts = Object.fromEntries(clock.formatToParts(minute).map(({type,value})=>[type,value]));
  return {date:parts.year+'-'+parts.month+'-'+parts.day,time:parts.hour+':'+parts.minute,weekday:parts.weekday};
 };
 const currentMinute = Math.floor(timestamp/60000)*60000;
 const current = displayed(currentMinute);
 if (!plan.days.includes(current.weekday) || isQuiet(current.time,plan.quiet)) return [];
 const window = Number.isInteger(windowMinutes) ? Math.max(1,Math.min(windowMinutes,180)) : 1;
 const due = new Map();
 for (let offset=window-1; offset>=0; offset--) {
  const {date,time,weekday} = displayed(currentMinute-offset*60000);
  if (!plan.days.includes(weekday) || isQuiet(time,plan.quiet)) continue;
  for (const period of periods) {
   const id = date+':'+period;
   if (plan.times[period]===time && !seen.has(id) && !due.has(id)) {
    due.set(id,{id,date,time,period,categories:[...plan.categories]});
   }
  }
 }
 return [...due.values()];
}

export function notificationPlanFromForm(form) {
 const data = new FormData(form);
 const timeZone = normalizedZone(data.get('timeZone')?.trim());
 const quiet = {start:data.get('quietStart'),end:data.get('quietEnd')};
 if (!timeZone || Boolean(quiet.start)!==Boolean(quiet.end) ||
     (quiet.start && (!validTime(quiet.start) || !validTime(quiet.end) || quiet.start===quiet.end))) {
  throw new RangeError('Invalid reminder schedule');
 }
 const plan = normalize({
  enabled:data.has('enabled'),timeZone,quiet,
  times:Object.fromEntries(periods.map(period=>[period,data.get(period)])),
  categories:data.getAll('topics'),
  days:data.getAll('days')
 });
 if (plan.enabled && (!plan.days.length || !plan.categories.length || !Object.values(plan.times).some(Boolean))) {
  throw new RangeError('missingSchedule');
 }
 return plan;
}

export function notificationPlanMessage(lang,key) {
 return (copy[lang] || copy.ru)[key];
}

export function reminderPrompt(lang,period) {
 return (copy[lang] || copy.ru).prompts[periods.indexOf(period)];
}

export function renderNotificationPlan(value,lang) {
 const plan = normalize(value);
 const labels = copy[lang] || copy.ru;
 const check = (name,value,label,checked)=>'<label class="check"><input type="checkbox" name="'+
  name+'" value="'+value+'"'+(checked?' checked':'')+'>'+label+'</label>';
 const time = (name,label,value)=>'<label>'+label+'<input type="time" name="'+name+'" value="'+value+'"></label>';
 return '<form id="notification-plan-form" class="panel"><h2>'+labels.title+'</h2><p>'+labels.description+'</p>'+
  check('enabled','1',labels.enabled,plan.enabled)+
  '<label>'+labels.timezone+'<input name="timeZone" value="'+plan.timeZone+'" required maxlength="64" spellcheck="false"></label>'+
  '<div class="field-row">'+periods.map(period=>time(period,labels[period],plan.times[period])).join('')+'</div>'+
  '<fieldset><legend>'+labels.days+'</legend><div class="field-row">'+
  weekdays.map((day,index)=>check('days',day,labels.weekdays[index],plan.days.includes(day))).join('')+'</div></fieldset>'+
  '<fieldset><legend>'+labels.topics+'</legend>'+categories.map(id=>check('topics',id,labels[id],plan.categories.includes(id))).join('')+'</fieldset>'+
  '<fieldset><legend>'+labels.quiet+'</legend><p>'+labels.quietHelp+'</p><div class="field-row">'+
  time('quietStart',labels.quietStart,plan.quiet.start)+time('quietEnd',labels.quietEnd,plan.quiet.end)+'</div></fieldset>'+
  '<details><summary>'+labels.preview+'</summary>'+periods.map(period=>
   '<p><strong>'+labels[period]+'</strong> '+reminderPrompt(lang,period)+'</p>').join('')+'</details>'+
  '<button class="cta">'+labels.save+'</button><p id="notification-plan-status" role="status"></p></form>';
}
