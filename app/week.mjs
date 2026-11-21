import {catalog, categories, strings} from './content.mjs';
import {dateKey, languages, shiftDate, weekStart} from './state.mjs';

const schedule = ['yoga', 'breathing', 'mobility', 'meditation', 'strength', 'recovery', null];
const practices = new Map(catalog.map(item => [item.id, item]));
const copy = {
 title: ['Программа недели', 'Həftənin proqramı', 'Weekly programme'],
 intro: [
  'Короткие практики движения, дыхания и внимания. Выбирайте комфортный темп.',
  'Hərəkət, nəfəs və diqqət üçün qısa məşqlər. Sizə uyğun temp seçin.',
  'Short practices in movement, breath and attention. Choose a pace that feels right.'
 ],
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
 return schedule.map((id, index) => {
  const date = shiftDate(monday, index);
  const key = dateKey(date);
  const practice = practices.get(id) ?? null;
  return {date, key, practice, current: key === todayKey,
   completed: Boolean(practice && key <= todayKey && completions.has(key + '/' + id))};
 });
}

export function weeklyProgramPracticeId(today = new Date()) {
 return schedule[(today.getDay() + 6) % 7];
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
 const jump = '<nav class="week-jump" aria-label="' + t('jump') + '">' + days.map(day =>
  '<a href="#week/' + day.key + '" aria-label="' + dateFormat.format(day.date) + (day.completed ? ' · ' + t('done') : '') + '"' +
  (day===active ? ' aria-current="date"' : '') + '><span>' + shortDate.format(day.date) +
  '</span><strong>' + day.date.getDate() + '</strong>' +
  (day.completed ? '<span class="week-jump-check" aria-hidden="true">✓</span>' : '') + '</a>'
 ).join('') + '</nav>';
 const total = days.filter(day => day.practice).length;
 const completed = days.filter(day => day.completed).length;
 const items = days.map(day => {
  const {date, key, practice, current, completed} = day;
  const time = '<time datetime="' + key + '">' + dateFormat.format(date) + '</time>';
  const markers = [current && strings.today[index], completed && t('done')].filter(Boolean)
   .map(marker => '<span class="week-day-marker">' + marker + '</span>').join('');
  const heading = practice?.title[index] ?? t('rest');
  const detail = practice ? categories[practice.id][index] + ' · ' + practice.minutes + ' ' + strings.min[index] : t('restNote');
  const label = t(completed ? 'repeat' : 'start');
  const action = practice ? '<a class="button" href="#practice/' + practice.id +
   '" aria-label="' + label + ' · ' + heading + '">' + label + '</a>' : '';
  return '<li id="week/' + key + '" tabindex="-1" class="panel week-day"' + (current ? ' aria-current="date"' : '') +
   (selectedDate===key ? ' data-selected' : '') + '><div>' +
   '<p class="muted week-day-date">' + time + markers +
   '</p><h2>' + heading + '</h2><p>' + detail + '</p></div>' + action + '</li>';
 }).join('');
 return '<h1>' + t('title') + '</h1><p class="muted">' + t('intro') + '</p>' +
  '<div class="panel week-progress"><label>' + t('progress') + ' · ' + completed + ' / ' + total +
  '<progress value="' + completed + '" max="' + total + '"></progress></label></div>' +
  jump + '<ol class="week-days">' + items + '</ol><a class="link" href="#path">' + t('planner') + '</a>';
}
