import {test} from 'node:test';
import assert from 'node:assert/strict';
import {filterJournal, journalEmptyLabel, renderJournalFilter, renderPracticeTrends, weeklyPracticeTrends} from '../app/progress-view.mjs';

const today = new Date(2026,10,20,12);

test('Four calendar weeks aggregate only completed practice records through today',()=>{
 const sessions = [
  {day:'2026-10-25',seconds:442},
  {day:'2026-10-26',seconds:60},
  {day:'2026-11-01',seconds:59},
  {day:'2026-11-02',seconds:300},
  {day:'2026-11-16',seconds:59},
  {day:'2026-11-20',seconds:0},
  {day:'2026-11-21',seconds:800},
  {day:'2026-12-24',seconds:800}
 ];
 const trends = weeklyPracticeTrends(sessions,today);
 assert.deepEqual(trends.map(week=>[week.start,week.end,week.count,week.seconds]),[
  ['2026-10-26','2026-11-01',2,119],['2026-11-02','2026-11-08',1,300],
  ['2026-11-09','2026-11-15',0,0],['2026-11-16','2026-11-22',2,59]
 ]);
 assert.equal(sessions.length,8);
 assert.deepEqual(weeklyPracticeTrends([],today).map(week=>week.count),[0,0,0,0]);
});

test('Trend markup provides localized text alternatives and exact durations',()=>{
 for (const [language,expected] of [['ru','Последние четыре недели'],['az','Son dörd həftə'],['en','Past four weeks']]) {
  const markup = renderPracticeTrends([{day:'2026-11-20',seconds:127}],language,today);
  assert.ok(markup.includes(expected));
  assert.match(markup, /<time datetime="2026-11-16">/);
  assert.match(markup, /1 · 2 [^ ]+ 7 [^<]+/);
  assert.match(markup, /<meter max="1" value="1" aria-hidden="true">/);
 }
});

test('Journal date range is inclusive, stays in memory, and preserves original entries',()=>{
 const entries = [
  {id:'old',date:'2026-11-13',notes:'private content'},
  {id:'first',date:'2026-11-14'},
  {id:'last',date:'2026-11-20'},
  {id:'future',date:'2026-11-21'},
  {id:'outside-month',date:'2026-10-21'}
 ];
 assert.deepEqual(filterJournal(entries,'week',today).map(entry=>entry.id),['last','first']);
 assert.deepEqual(filterJournal(entries,'month',today).map(entry=>entry.id),['last','first','old']);
 assert.equal(filterJournal(entries,'all',today).length,5);
 assert.equal(entries[0].notes,'private content');
 assert.match(renderJournalFilter('week','az'),/<option value="week" selected>Son 7 gün/);
 assert.equal(journalEmptyLabel('month','en'),'No entries in this date range.');
});

test('Practice milestones require completed records on distinct past or current days',()=>{
 const records = Array.from({length:7},(_,day)=>({day:'2026-11-'+(day+14),seconds:60}));
 const future = {day:'2026-11-21',seconds:60};
 assert.doesNotMatch(renderPracticeTrends([future],'en',today),/First practice/);
 assert.match(renderPracticeTrends([records[0]],'en',today),/First practice/);
 assert.doesNotMatch(renderPracticeTrends([...records.slice(0,6),records[0],future],'en',today),/Seven practice days/);
 assert.match(renderPracticeTrends(records,'en',today),/Seven practice days/);
});
