import assert from 'node:assert/strict';
import {test} from 'node:test';
import {schoolPage,schoolStrings} from '../app/school.mjs';

async function render({role,route,rows={},current=()=>true}) {
 const calls=[];
 const outlet={};
 const client={from(table){
  calls.push(table);
  const data=table==='restart_school_roles' ? (role ? {role} : null) : rows[table] || [];
  const result=new Proxy({}, {get(_,method){
   return method==='then' ? (resolve)=>resolve({data,error:null}) : ()=>result;
  }});
  return result;
 }};
 await schoolPage({outlet,client,route,user:'test',lang:'ru',t:k=>schoolStrings[k]?.[0]||k,
  esc:s=>String(s).replaceAll('<','&lt;').replaceAll('>','&gt;'),current});
 return {html:outlet.innerHTML,calls};
}

test('Student can resume at the first incomplete lesson and lesson markup is escaped',async()=>{
 const {html}=await render({route:{name:'academy',id:'p'},rows:{
  restart_programs:[{id:'p',title:'Program',status:'published'}],
  restart_modules:[{id:'m',title:'Module'}],
  restart_lessons:[{id:'first',title:'First',module_id:'m',body:'a'},
   {id:'next',title:'Next',module_id:'m',body:'<img>'}],
  restart_lesson_progress:[{lesson_id:'first'}]
 }});
 assert.match(html,/data-continue="next"/);
 assert.match(html,/&lt;img&gt;/);
 assert.doesNotMatch(html,/data-school="edit"/);
});

test('Student staff route makes no roster or statistics requests',async()=>{
 const {html,calls}=await render({route:{name:'staff'}});
 assert.match(html,/Доступ ограничен/);
 assert.deepEqual(calls,['restart_school_roles']);
});

test('A closed session cannot render private school records',async()=>{
 const {html,calls}=await render({route:{name:'classes'},current:()=>false});
 assert.equal(html,undefined);
 assert.deepEqual(calls,[]);
});
