import assert from 'node:assert/strict';
import test from 'node:test';
import {renderRetreatOfficial,retreatOfficialClock,retreatStart,retreatEnd} from '../app/retreat-official.mjs';

test('The official retreat covers 24 hours and the countdown uses the Baku instant',()=>{
 assert.equal(new Date(retreatStart).toISOString(),'2026-11-28T10:00:00.000Z');
 assert.equal(new Date(retreatEnd).toISOString(),'2026-11-29T10:00:00.000Z');
 assert.equal(Date.parse(retreatEnd)-Date.parse(retreatStart),86400000);
 assert.deepEqual(retreatOfficialClock(new Date('2026-11-27T09:58:57.999Z')),
  {phase:'countdown',days:1,hours:0,minutes:1,seconds:3});
 assert.deepEqual(retreatOfficialClock(Date.parse(retreatStart)),{phase:'inProgress'});
 assert.deepEqual(retreatOfficialClock(Date.parse(retreatEnd)),{phase:'ended'});
});

test('The 22 confirmed programme slots, conditional alternative and leader copy render in all languages',()=>{
 for (const [lang,timezone,alternative] of [
  ['ru','Время Баку','Альтернатива'],['az','Bakı vaxtı','Alternativ'],['en','Baku time','Alternative']
 ]) {
  const html=renderRetreatOfficial(lang,{now:new Date('2026-11-27T12:00:00Z')});
  assert.ok(html.includes(timezone));
  assert.equal((html.match(/<li>/g) ?? []).length,22);
  assert.match(html,/WHITE.*BLACK.*REBIRTH/);
  assert.match(html,/role="timer" aria-live="off"/);
  assert.match(html,/2026-11-28T21:30:00\+04:00/);
  assert.ok(html.includes('FIRE & MOVEMENT<small>'));
  assert.ok(html.includes(alternative));
 }
 const final=renderRetreatOfficial('en',{now:new Date(retreatEnd)});
 assert.match(final,/The retreat has ended/);
});
