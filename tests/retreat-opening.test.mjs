import test from 'node:test';
import assert from 'node:assert/strict';
import {openingTime,renderRetreatOpening} from '../app/retreat-opening.mjs';
import {renderRetreatExperience} from '../app/retreat-experience.mjs';

test('Text practice starts at five minutes and offers a direct route to intention',()=>{
 assert.equal(openingTime(300),'5:00');
 assert.equal(openingTime(59),'0:59');
 assert.equal(openingTime(0),'0:00');
 for(const lang of ['ru','az','en']) {
  assert.match(renderRetreatOpening(lang),/role="timer".*5:00/);
  assert.match(renderRetreatExperience(lang,{section:'opening'}),/href="#retreat\/intention"/);
  assert.match(renderRetreatExperience(lang,{section:'preparation'}),/href="#retreat\/opening"/);
 }
});
