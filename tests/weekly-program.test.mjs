import assert from 'node:assert/strict';
import test from 'node:test';
import {catalog} from '../app/content.mjs';
import {renderWeeklyProgram, renderWeeklyProgramLink, weeklyProgramDays, weeklyProgramPracticeId} from '../app/week.mjs';

const week = new Date(2026, 10, 20, 12);

test('Weekly programme uses existing practices, local week dates and a rest day', () => {
 const days = weeklyProgramDays([], week);
 assert.deepEqual(days.map(day => day.key), [
  '2026-11-16', '2026-11-17', '2026-11-18', '2026-11-19', '2026-11-20', '2026-11-21', '2026-11-22'
 ]);
 assert.equal(days.filter(day => day.current).length, 1);
 assert.equal(weeklyProgramPracticeId(week), days.find(day => day.current).practice.id);
 assert.equal(days.at(-1).practice, null);
 assert.deepEqual(new Set(days.slice(0, -1).map(day => day.practice)), new Set(catalog));
});

test('Programme progress requires a matching practice and date, with no credit for future dates', () => {
 const days = weeklyProgramDays([
  {day:'2026-11-16', practice:'yoga'},
  {day:'2026-11-16', practice:'yoga'},
  {day:'2026-11-17', practice:'meditation'},
  {day:'2026-11-10', practice:'breathing'},
  {day:'2026-11-21', practice:'recovery'}
 ], week);
 assert.deepEqual(days.filter(day => day.completed).map(day => day.key), ['2026-11-16']);
});

test('Programme localizes the date, links and truthful progress', () => {
 for (const [lang, title, rest, repeat] of [
  ['ru', 'Программа недели', 'День отдыха', 'Повторить практику'],
  ['az', 'Həftənin proqramı', 'İstirahət günü', 'Məşqi təkrarla'],
  ['en', 'Weekly programme', 'Rest day', 'Repeat practice']
 ]) {
  const html = renderWeeklyProgram({lang, sessions:[{day:'2026-11-16', practice:'yoga'}], today:week});
  assert.ok(html.includes('<h1>' + title + '</h1>'));
  assert.ok(html.includes('<h2>' + rest + '</h2>'));
  assert.match(html, /<progress value="1" max="6">/);
  assert.match(html, /<time datetime="2026-11-20">/);
  assert.match(html, /href="#practice\/strength"/);
  assert.ok(html.includes('href="#practice/yoga" aria-label="' + repeat));
  assert.ok(renderWeeklyProgramLink(lang).includes('href="#week">' + title));
 }
});

test('Week day links expose localized dates and match focusable day cards',()=>{
 const html = renderWeeklyProgram({lang:'en',today:week,selectedDate:'2026-11-22'});
 const nav = html.match(/<nav class="week-jump"[^>]*>(.*?)<\/nav>/)?.[1];
 assert.equal((nav.match(/href="#week\//g) || []).length,7);
 assert.match(nav,/href="#week\/2026-11-22" aria-label="[^"]+" aria-current="date"/);
 for (const [,id] of nav.matchAll(/href="#(week\/[\d-]+)"/g)) {
  assert.ok(html.includes('id="'+id+'" tabindex="-1"'));
 }
 const expired = renderWeeklyProgram({lang:'en',today:week,selectedDate:'2026-11-15'});
 assert.match(expired,/href="#week\/2026-11-20" aria-label="[^"]+" aria-current="date"/);
});
