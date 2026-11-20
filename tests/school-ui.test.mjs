import assert from 'node:assert/strict';
import {test} from 'node:test';
import {schoolPage,schoolStrings} from '../app/school.mjs';

async function render({role,route,rows={},current=()=>true}) {
 const calls=[];
 const outlet={};
 const client={from(table){
  calls.push(table);
  const fixture=rows[table];
  const data=table==='restart_school_roles' ? (role ? {role} : null) :
   typeof fixture==='function' ? fixture() : fixture || [];
  const result=new Proxy({}, {get(_,method){
   return method==='then' ? (resolve)=>resolve({data,error:null}) : ()=>result;
  }});
  return result;
 }};
 await schoolPage({outlet,client,route,user:'test',lang:'ru',t:k=>schoolStrings[k]?.[0]||k,
  esc:s=>String(s).replaceAll('<','&lt;').replaceAll('>','&gt;'),current});
 return {html:outlet.innerHTML,calls,outlet};
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
 assert.match(html,/<progress value="1" max="2"/);
 assert.match(html,/data-continue="first">Предыдущий урок/);
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

test('Instructor lesson editor preselects the saved type and position',async()=>{
 const {html}=await render({role:'instructor',route:{name:'staff',id:'p'},rows:{
  restart_programs:[{id:'p',title:'Program',status:'draft',instructor_id:'test'}],
  restart_modules:[{id:'m',title:'Module'}],
  restart_lessons:[{id:'lesson',title:'Practice',module_id:'m',body:'Keep this text',kind:'practice',position:3}]
 }});
 const editor=html.match(/<form [^>]*data-school="edit".*?<\/form>/)?.[0];
 assert(editor);
 assert.match(editor,/name="position"[^>]*value="3"/);
 assert.match(editor,/<option value="practice" selected>/);
 assert.match(editor,/Keep this text/);
});

test('Schedule shows Baku time, real history and a filter that hides other formats',async()=>{
 let classQueries=0;
 const {html,outlet}=await render({route:{name:'classes'},rows:{
  restart_class_sessions:()=> (++classQueries===1 ? [
   {id:'a',title:'Full online class',starts_at:'2027-01-22T07:30:00Z',format:'online',kind:'group',capacity:1,seats_taken:1,status:'scheduled'},
   {id:'b',title:'Local class',starts_at:'2027-01-22T08:30:00Z',format:'onsite',kind:'group',capacity:5,seats_taken:2,status:'scheduled'}
  ] : [{id:'past',title:'Past class',starts_at:'2026-01-22T07:30:00Z',status:'scheduled',restart_bookings:[{status:'cancelled'}]}]),
  restart_bookings:[{session_id:'past',status:'cancelled'}],
  restart_lesson_notice_preferences:null
 }});
 assert.match(html,/11:30 · Время Баку/);
 assert.match(html,/Свободных мест нет/);
 assert.match(html,/Past class.*Запись отменена/);
 const cards=[{dataset:{classCard:'onsite'}},{dataset:{classCard:'online'}}];
 const empty={};
 outlet.querySelectorAll=()=>cards;
 outlet.querySelector=()=>empty;
 outlet.onchange({target:{matches:()=>true,value:'online'}});
 assert.deepEqual(cards.map(card=>card.hidden),[true,false]);
 assert.equal(empty.hidden,true);
});
