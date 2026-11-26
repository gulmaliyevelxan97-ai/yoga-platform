import assert from 'node:assert/strict';
import test from 'node:test';
import {readRetreatPreparation,renderRetreatPreparation,writeRetreatPreparation} from '../app/retreat-preparation.mjs';

function fixture(){
 const data=new Map();
 return {data,storage:{
  getItem:key=>data.get(key),
  setItem:(key,value)=>data.set(key,value),
  removeItem:key=>data.delete(key)
 }};
}

test('Guest retreat preparation persists only known checks and a bounded local reflection',()=>{
 const {data,storage}=fixture();
 assert.deepEqual(readRetreatPreparation(storage),{items:[],reflection:''});
 assert.equal(writeRetreatPreparation({items:['water','unknown','water'],reflection:'a'.repeat(1201)},storage),true);
 assert.deepEqual(readRetreatPreparation(storage),{items:['water'],reflection:'a'.repeat(1200)});
 assert.equal(writeRetreatPreparation({},storage),true);
 assert.equal(data.size,0);
 assert.equal(writeRetreatPreparation({items:['water']},{setItem(){throw Error('blocked');}}),false);
});

test('Preparation restores checkboxes and escapes the optional note in each locale',()=>{
 const {storage}=fixture();
 const esc=value=>value.replaceAll('<','&lt;');
 writeRetreatPreparation({items:['clothes'],reflection:'</textarea>'},storage);
 for (const [lang,title] of [['ru','Подготовка к ретриту'],['az','Retritə hazırlıq'],['en','Prepare for the retreat']]) {
  const html=renderRetreatPreparation(lang,esc,storage);
  assert.ok(html.includes(title));
  assert.match(html,/name="clothes" checked/);
  assert.match(renderRetreatPreparation(lang,esc,storage,true),/&lt;\/textarea>/);
  assert.match(html,/role="status"/);
  assert.doesNotMatch(html,/https?:\/\//);
 }
});
