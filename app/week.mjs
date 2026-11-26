import {catalog, categories, strings} from './content.mjs';
import {dateKey, languages, shiftDate, weekStart} from './state.mjs';

const schedule = [
 {id:'yoga', level:'familiar',
  morning:['Заметьте, как стопы опираются на пол.','Ayaqlarınızın döşəməyə necə söykəndiyinə diqqət yetirin.','Notice how your feet rest on the floor.'],
  evening:['В каких движениях вы лучше чувствовали опору?','Hansı hərəkətlərdə dayağı daha yaxşı hiss etdiniz?','Which movements made you feel more grounded?']},
 {id:'breathing', level:'open',
  morning:['Найдите минуту, чтобы спокойно посидеть.','Sakit oturmaq üçün bir dəqiqə ayırın.','Take a minute to sit quietly.'],
  evening:['Когда сегодня было легче дышать в естественном ритме?','Bu gün nə vaxt təbii ritmdə nəfəs almaq daha asan idi?','When did breathing at your natural pace feel easiest today?']},
 {id:'mobility', level:'open',
  morning:['Обратите внимание, как ощущаются плечи и кисти.','Çiyinlərinizdə və biləklərinizdə nə hiss etdiyinizə fikir verin.','Notice how your shoulders and wrists feel.'],
  evening:['Какое движение сегодня давалось легко?','Bu gün hansı hərəkəti rahat etdiniz?','Which movement felt easy today?']},
 {id:'meditation', level:'open',
  morning:['Прислушайтесь к одному звуку вокруг.','Ətrafınızdakı səslərdən birinə qulaq asın.','Listen to one sound around you.'],
  evening:['Что помогло вам мягко вернуть внимание?','Diqqətinizi toplamağa nə kömək etdi?','What helped you gently bring your attention back?']},
 {id:'strength', level:'familiar',
  morning:['Вспомните знакомое упражнение и выберите посильный темп.','Tanış bir məşqi xatırlayın və sizə uyğun temp seçin.','Choose a familiar exercise and a pace that feels manageable.'],
  evening:['Как вы поняли, что пора сделать паузу?','Fasilə vaxtının gəldiyini necə anladınız?','How did you know it was time for a pause?']},
 {id:'recovery', level:'open',
  morning:['Найдите несколько минут без спешки.','Tələsmədən keçirmək üçün bir neçə dəqiqə ayırın.','Find a few minutes with no need to rush.'],
  evening:['Что сегодня помогло вам расслабиться?','Bu gün rahatlamağınıza nə kömək etdi?','What helped you unwind today?']},
 {id:null,
  morning:['Прислушайтесь к себе и оставьте время на отдых.','Özünüzü dinləyin və istirahətə vaxt ayırın.','Check in with yourself and make time for rest.'],
  evening:['Что из этой недели хотелось бы повторить?','Bu həftədən nəyi təkrarlamaq istərdiniz?','What would you like to repeat from this week?']}
];
const practices = new Map(catalog.map(item => [item.id, item]));
const copy = {
 title: ['Программа недели', 'Həftənin proqramı', 'Weekly programme'],
 intro: [
  'Короткие практики движения, дыхания и внимания. Выбирайте комфортный темп.',
  'Hərəkət, nəfəs və diqqət üçün qısa məşqlər. Sizə uyğun temp seçin.',
  'Short practices in movement, breath and attention. Choose a pace that feels right.'
 ],
 safety:[
  'Подсказки на утро и вечер необязательны. Во время движения сохраняйте комфортный темп и остановитесь, если почувствуете боль или дискомфорт.',
  'Səhər və axşam üçün təkliflər könüllüdür. Hərəkət zamanı sizə rahat olan tempi saxlayın. Ağrı və ya narahatlıq hiss etsəniz, dayanın.',
  'Morning and evening prompts are optional. Move at a comfortable pace and stop if you feel pain or discomfort.'
 ],
 morning:['Утро','Səhər','Morning'],
 main:['Основная практика','Əsas məşq','Main practice'],
 evening:['Вечер','Axşam','Evening'],
 support:['Дополнительные практики','Əlavə məşqlər','Optional practices'],
 warmup:['Перед занятием · разминка и подвижность','Məşqdən əvvəl · isinmə və hərəkətlilik','Before the session · warm-up and mobility'],
 breathe:['После занятия · спокойное дыхание','Məşqdən sonra · sakit nəfəs','After the session · gentle breathing'],
 settle:['Завершение · медитация или восстановление','Yekun · meditasiya və ya bərpa','To finish · meditation or recovery'],
 open:['Для любого уровня','Bütün səviyyələr üçün','All levels'],
 familiar:['Знакомые упражнения','Tanış məşqlər','Familiar exercises'],
 rest: ['День отдыха', 'İstirahət günü', 'Rest day'],
 restNote: ['Оставьте время на восстановление.', 'Bərpa üçün vaxt ayırın.', 'Make time for recovery.'],
 start: ['Открыть практику', 'Məşqi aç', 'Open practice'],
 repeat: ['Повторить практику', 'Məşqi təkrarla', 'Repeat practice'],
 done: ['Выполнено', 'Tamamlanıb', 'Completed'],
 progress: ['Выполнено на этой неделе', 'Bu həftə tamamlanan məşqlər', 'Completed this week'],
 jump: ['Дни недели', 'Həftənin günləri', 'Days of the week'],
 planner: ['Настроить свой план', 'Öz planını tənzimlə', 'Set up your own plan']
};

const localeIndex = lang => Math.max(0, languages.indexOf(lang));

export function weeklyProgramDays(sessions = [], today = new Date()) {
 const monday = weekStart(today);
 const todayKey = dateKey(today);
 const completions = new Set(sessions.map(({day, practice}) => day + '/' + practice));
 return schedule.map(({id,level,morning,evening}, index) => {
  const date = shiftDate(monday, index);
  const key = dateKey(date);
  const practice = practices.get(id) ?? null;
  return {date, key, practice, level, morning, evening, current: key === todayKey,
   completed: Boolean(practice && key <= todayKey && completions.has(key + '/' + id))};
 });
}

export function weeklyProgramPracticeId(today = new Date()) {
 return schedule[(today.getDay() + 6) % 7].id;
}

export function renderWeeklyProgramLink(lang) {
 return '<a class="button" href="#week">' + copy.title[localeIndex(lang)] + '</a>';
}

export function renderWeeklyProgram({lang, sessions, today, selectedDate} = {}) {
 const index = localeIndex(lang);
 const t = id => copy[id][index];
 const dateFormat = new Intl.DateTimeFormat(languages[index], {weekday:'long', day:'numeric', month:'short'});
 const days = weeklyProgramDays(sessions, today);
 const active = days.find(day=>day.key===selectedDate) || days.find(day=>day.current);
 const shortDate = new Intl.DateTimeFormat(languages[index], {weekday:'short'});
 const jump = '<nav class="week-jump" aria-label="' + t('jump') + '">' + days.map(day => {
  const weekday = shortDate.format(day.date);
  const number = day.date.getDate();
  const description = dateFormat.format(day.date) + (day.completed ? ' · ' + t('done') : '');
  return '<a href="#week/' + day.key + '" aria-describedby="week-date-' + day.key + '"' +
   (day===active ? ' aria-current="date"' : '') + '><span>' + weekday +
   '</span> <strong>' + number + '</strong>' +
   '<span id="week-date-' + day.key + '" hidden>' + description + '</span>' +
   (day.completed ? '<span class="week-jump-check" aria-hidden="true">✓</span>' : '') + '</a>';
 }).join('') + '</nav>';
 const supportLink = (id, label) => '<p>' + t(label) + '<br><a class="link" href="#practice/' +
  id + '">' + practices.get(id).title[index] + '</a></p>';
 const support = '<details class="week-phase"><summary>' + t('support') + '</summary>' +
  supportLink('mobility','warmup') + supportLink('breathing','breathe') +
  '<p>' + t('settle') + '<br><a class="link" href="#practice/meditation">' + practices.get('meditation').title[index] +
  '</a> · <a class="link" href="#practice/recovery">' + practices.get('recovery').title[index] + '</a></p></details>';
 const total = days.filter(day => day.practice).length;
 const completed = days.filter(day => day.completed).length;
 const items = days.map(day => {
  const {date, key, practice, level, morning, evening, current, completed} = day;
  const time = '<time datetime="' + key + '">' + dateFormat.format(date) + '</time>';
  const markers = [current && strings.today[index], completed && t('done')].filter(Boolean)
   .map(marker => '<span class="week-day-marker">' + marker + '</span>').join('');
  const heading = practice?.title[index] ?? t('rest');
  const detail = practice ? [categories[practice.id][index], practice.minutes + ' ' + strings.min[index], t(level)].join(' · ') : '';
  const label = t(completed ? 'repeat' : 'start');
  const action = practice ? '<a class="button" href="#practice/' + practice.id +
   '" aria-label="' + label + ' · ' + heading + '">' + label + '</a>' : '';
  return '<li id="week/' + key + '" tabindex="-1" class="panel week-day"' + (current ? ' aria-current="date"' : '') +
   (selectedDate===key ? ' data-selected' : '') + '><div>' +
   '<p class="muted week-day-date">' + time + markers +
   '</p><h2>' + heading + '</h2>' + (detail ? '<p class="muted">' + detail + '</p>' : '') + '</div>' +
   '<div class="week-phases"><section class="week-phase"><h3>' + t('morning') + '</h3><p>' + morning[index] +
   '</p></section><section class="week-phase week-phase-main"><h3>' + t('main') + '</h3><p>' +
   (practice?.description[index] ?? t('restNote')) + '</p>' + action +
   '</section>' + (practice ? support : '') + '<section class="week-phase"><h3>' + t('evening') + '</h3><p>' + evening[index] +
   '</p><a class="link" href="#journal">' + strings.addJournal[index] + '</a></section></div></li>';
 }).join('');
 return '<h1>' + t('title') + '</h1><p>' + t('intro') + '</p><p class="muted">' + t('safety') + '</p>' +
  '<div class="panel week-progress"><label>' + t('progress') + ' · ' + completed + ' / ' + total +
  '<progress value="' + completed + '" max="' + total + '"></progress></label></div>' +
  jump + '<ol class="week-days">' + items + '</ol><a class="link" href="#path">' + t('planner') + '</a>';
}
