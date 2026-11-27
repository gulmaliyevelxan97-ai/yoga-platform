import assert from 'node:assert/strict';
import test from 'node:test';
import {readRetreatLetter,writeRetreatLetter,retreatLetterReady,renderRetreatLetter} from '../app/retreat-letter.mjs';

function fixture() {
 const values=new Map();
 return {values,storage:{
  getItem:key=>values.get(key),
  setItem:(key,value)=>values.set(key,value),
  removeItem:key=>values.delete(key)
 }};
}

test('Retreat letter is browser-local, bounded, and can be edited or deleted',()=>{
 const {values,storage}=fixture();
 assert.equal(writeRetreatLetter({text:'First',revisit:'2026-12-01'},storage),true);
 assert.deepEqual(readRetreatLetter(storage),{text:'First',revisit:'2026-12-01'});
 assert.equal(writeRetreatLetter({text:'a'.repeat(2401),revisit:'2026-02-30'},storage),true);
 assert.deepEqual(readRetreatLetter(storage),{text:'a'.repeat(2400),revisit:''});
 assert.equal(writeRetreatLetter({},storage),true);
 assert.equal(values.size,0);
 assert.equal(writeRetreatLetter({text:'Letter'},{setItem(){throw Error('blocked');}}),false);
});

test('Revisit is based on the Baku calendar date and optional',()=>{
 assert.equal(retreatLetterReady('2026-12-01',new Date('2026-11-30T19:59:59Z')),false);
 assert.equal(retreatLetterReady('2026-12-01',new Date('2026-11-30T20:00:00Z')),true);
 assert.equal(retreatLetterReady('',new Date('2026-11-30T20:00:00Z')),false);
});

test('Saved letter starts folded, restores text safely, and displays labels in all locales',()=>{
 const {storage}=fixture();
 const esc=text=>text.replaceAll('<','&lt;');
 writeRetreatLetter({text:'</textarea>',revisit:'2026-12-01'},storage);
 for (const [lang,title] of [['ru','Письмо себе'],['az','Özümə məktub'],['en','Letter to yourself']]) {
  const html=renderRetreatLetter(lang,esc,storage,new Date('2026-11-30T20:00:00Z'));
  assert.ok(html.includes(title));
  assert.match(html,/<details>/);
  assert.match(html,/&lt;\/textarea>/);
  assert.match(html,/data-letter-due>/);
  assert.doesNotMatch(html,/https?:\/\//);
 }
});

test('A new letter suggests thirty calendar days from the current Baku date',async()=>{
 const {futureLetterDate}=await import('../app/retreat-letter.mjs');
 assert.equal(futureLetterDate(new Date('2026-11-28T20:00:00Z')),'2026-12-29');
 assert.equal(futureLetterDate(new Date('2026-11-28T19:59:59Z')),'2026-12-28');
});
