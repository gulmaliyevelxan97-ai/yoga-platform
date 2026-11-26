import assert from 'node:assert/strict';
import test from 'node:test';
import {catalog} from '../app/content.mjs';
import {practiceGuide,practiceStage} from '../app/practice-guide.mjs';

test('Every catalogue practice has three distinct guides in each supported language',()=>{
 for (const {id} of catalog) {
  const translations=[0,1,2].map(index=>practiceGuide(id,index));
  for (const steps of translations) assert.equal(new Set(steps).size,3);
  assert.equal(new Set(translations.map(steps=>steps.join(' '))).size,3);
 }
 assert.deepEqual(practiceGuide('toString',0),[]);
});

test('Active cues follow elapsed time and clamp at the final stage',()=>{
 assert.deepEqual([0,59,60,119,120,180,220].map(seconds=>practiceStage(seconds,180)),[0,0,1,1,2,2,2]);
});
