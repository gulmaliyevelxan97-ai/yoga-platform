import assert from 'node:assert/strict';
import test from 'node:test';
import {renderRetreatWelcome, retreatWelcomeTitle} from '../app/retreat-welcome.mjs';

test('Retreat welcome offers the practice and journal entry points in each supported language', () => {
 for (const [language, title, voluntary, storage] of [
  ['ru', 'Добро пожаловать в RESTART', 'Участие добровольное', 'только в браузере'],
  ['az', 'RESTART-a xoş gəlmisən', 'İştirak könüllüdür', 'yalnız bu cihazdakı brauzerdə'],
  ['en', 'Welcome to RESTART', 'Taking part is voluntary', 'this device’s browser']
 ]) {
  const welcome = renderRetreatWelcome(language);
  assert.equal(retreatWelcomeTitle(language), title);
  assert.ok(welcome.includes(voluntary));
  assert.ok(welcome.includes(storage));
  assert.deepEqual([...welcome.matchAll(/href="([^"]+)"/g)].map(([,href]) => href), [
   '#practice/breathing', '#practice/meditation', '#journal', '#week'
  ]);
 }
});
