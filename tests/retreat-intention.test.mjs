import assert from 'node:assert/strict';
import test from 'node:test';
import {readRetreatIntention, renderRetreatIntention, updateRetreatIntention} from '../app/retreat-intention.mjs';

test('Guest intention is optional, bounded, stored locally and deletable',()=>{
 const values = new Map();
 const storage = {getItem:key=>values.get(key),setItem:(key,value)=>values.set(key,value),removeItem:key=>values.delete(key)};
 assert.equal(readRetreatIntention(storage),'');
 assert.equal(updateRetreatIntention('  Breathe calmly  ',storage),'saved');
 assert.equal(readRetreatIntention(storage),'Breathe calmly');
 assert.equal(updateRetreatIntention('a'.repeat(502),storage),'saved');
 assert.equal(readRetreatIntention(storage).length,500);
 assert.equal(updateRetreatIntention('',storage),'removed');
 assert.equal(values.size,0);
 assert.equal(updateRetreatIntention('text',{setItem(){throw Error('blocked');}}),'failed');
});

test('Intention form has localized save and privacy copy and passes note to escaping',()=>{
 for (const [lang,title] of [['ru','Моё намерение'],['az','Niyyətim'],['en','My intention']]) {
  const html = renderRetreatIntention(lang,'</textarea>',value=>value.replaceAll('<','&lt;'));
  assert.ok(html.includes(title));
  assert.match(html,/id="retreat-intention-form"/);
  assert.match(html,/&lt;\/textarea>/);
  assert.match(html,/value="delete"/);
  assert.match(html,/role="status"/);
 }
});
