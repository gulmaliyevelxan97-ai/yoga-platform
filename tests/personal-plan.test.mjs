import test from 'node:test';
import assert from 'node:assert/strict';
import {catalog} from '../app/content.mjs';
import {dateKey} from '../app/state.mjs';
import {practicePlanStore, renderPersonalPlan, suggestedPracticeId, weeklyPractices} from '../app/personal-plan.mjs';

const friday = new Date(2026, 10, 20, 12);
const settings = {theme: 'attention', minutes: 5, count: 3};
function storage() {
  const map = new Map();
  return {map, getItem: key => map.get(key) ?? null, setItem: (k, v) => map.set(k, v), removeItem: k => map.delete(k)};
}

test('plan uses existing timers, applies time and focus, and evenly distributes the week', () => {
  const plan = weeklyPractices(settings, friday);
  assert.deepEqual(plan.map(row => dateKey(row.date)), ['2026-11-16', '2026-11-18', '2026-11-20']);
  assert.deepEqual(plan.map(row => row.item.id), ['meditation', 'breathing', 'meditation']);
  for (const row of plan) assert.ok(catalog.includes(row.item) && row.item.minutes <= settings.minutes);
  assert.deepEqual(weeklyPractices({...settings, theme:'movement', minutes:3}, friday), []);
  assert.deepEqual(weeklyPractices({...settings, count:8}, friday), []);
  assert.deepEqual(weeklyPractices({...settings, theme:'__proto__'}, friday), []);
  assert.equal(suggestedPracticeId(friday, {read:()=>settings}), 'meditation');
  assert.equal(suggestedPracticeId(new Date(2026,10,21,12), {read:()=>settings}), null);
});

test('local opt-in persists only enumerated preferences and can be cleared independently', () => {
  const fake = storage();
  fake.setItem('restart.app.local.v1', 'history');
  const a = practicePlanStore(()=>fake);
  assert.equal(a.read(), null);
  a.write({...settings, privateNote:'discard'});
  assert.deepEqual(practicePlanStore(()=>fake).read(), settings);
  assert.deepEqual([...fake.map.values()].map(String), ['history', JSON.stringify(settings)]);
  a.write(null);
  assert.deepEqual([...fake.map.entries()], [['restart.app.local.v1', 'history']]);
  assert.equal(suggestedPracticeId(friday, a), null);
});

test('blocked storage, malformed data and all three locales', () => {
  const denied = practicePlanStore(()=>{throw Error('denied');});
  assert.equal(denied.write(settings), false);
  assert.deepEqual(denied.read(), settings);
  for (const [lang, title] of [['en','My weekly practice plan'], ['ru','Мой план на неделю'], ['az','Həftəlik məşq planım']]) {
    const view = renderPersonalPlan(lang, denied, '', friday);
    assert.ok(view.includes(title));
    assert.ok(view.includes('href="#practice/meditation"'));
  }
  const malformed = practicePlanStore(()=>({getItem:()=>'{'}));
  assert.equal(malformed.read(), null);
  assert.doesNotMatch(renderPersonalPlan('ru', malformed), /href="#practice/);
});
