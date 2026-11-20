import assert from 'node:assert/strict';
import {test} from 'node:test';
import {schoolPage,schoolStrings,lessonDraftStore,validLessonVideo} from '../app/school.mjs';

async function render({role,route,rows={},current=()=>true,draftStorage}) {
 const calls=[];
 const outlet={};
 const client={from(table){
  calls.push(table);
  const fixture=rows[table];
  const data=table==='restart_school_roles' ? (role ? {role} : null) :
   typeof fixture==='function' ? fixture() : fixture || [];
  const result=new Proxy({}, {get(_,method){
   return method==='then' ? (resolve)=>resolve({data,error:data?.schemaError ?? null}) : ()=>result;
  }});
  return result;
 }};
 await schoolPage({outlet,client,route,user:'test',lang:'ru',t:k=>schoolStrings[k]?.[0]||k,
  esc:s=>String(s).replaceAll('<','&lt;').replaceAll('>','&gt;'),current,draftStorage});
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
 const editor=html.match(/<form [^>]*data-school="edit"[\s\S]*?<\/form>/)?.[0];
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

function memoryStorage() {
 const items = new Map();
 return {
  getItem:key=>items.get(key),
  setItem:(key,value)=>items.set(key,value),
  removeItem:key=>items.delete(key)
 };
}

test('Lesson draft recovery is scoped by account, backend, lesson and editor action',()=>{
 const storage = memoryStorage();
 const lessonId = 'f46d1ed3-adf1-4503-b696-fe23004b60ca';
 const values = {title:'Draft', body:'New lesson', kind:'practice', position:'3'};
 const account = lessonDraftStore('staff','staging',storage);
 assert.equal(account.write('edit',lessonId,values),true);
 assert.deepEqual(account.read('edit',lessonId),values);
 assert.equal(account.read('lesson',lessonId),null);
 assert.equal(lessonDraftStore('another-staff','staging',storage).read('edit',lessonId),null);
 assert.equal(lessonDraftStore('staff','different-staging',storage).read('edit',lessonId),null);
 assert.equal(account.clear('edit',lessonId),true);
 assert.equal(account.read('edit',lessonId),null);
});

test('Recovered lesson draft opens the staff editor and is excluded from student rendering',async()=>{
 const storage = memoryStorage();
 const lessonId = 'f46d1ed3-adf1-4503-b696-fe23004b60ca';
 lessonDraftStore('test',null,storage).write('edit',lessonId,{
  title:'Draft title',body:'<private draft>',position:'4',kind:'practice'
 });
 const rows = {
  restart_programs:[{id:'p',title:'Program',status:'draft',instructor_id:'test'}],
  restart_modules:[{id:'m',title:'Module'}],
  restart_lessons:[{id:lessonId,title:'Original',module_id:'m',body:'Published text',kind:'lesson',position:2}]
 };
 const staff = await render({role:'instructor',route:{name:'staff',id:'p'},rows,draftStorage:storage});
 assert.match(staff.html,/data-lesson="[^"]+" open/);
 assert.match(staff.html,/value="Draft title"/);
 assert.match(staff.html,/&lt;private draft&gt;/);
 const student = await render({route:{name:'academy',id:'p'},rows,draftStorage:storage});
 assert.match(student.html,/Published text/);
 assert.doesNotMatch(student.html,/private draft/);
});

test('Disabled or corrupted browser storage does not block lesson editing',()=>{
 const id = 'f46d1ed3-adf1-4503-b696-fe23004b60ca';
 const unavailable = lessonDraftStore('staff','staging',{
  getItem:()=>'{ "body": 999 }',
  setItem:()=>{throw new Error('quota');},
  removeItem:()=>{throw new Error('permission');}
 });
 assert.equal(unavailable.read('edit',id),null);
 assert.equal(unavailable.write('edit',id,{title:'Draft'}),false);
 assert.equal(unavailable.clear('edit',id),false);
});

test('Academy accepts only direct approved video links and renders them without embedding',async()=>{
 const youtube = 'https://www.youtube.com/watch?v=abcdefghijk';
 assert.equal(validLessonVideo(youtube),true);
 assert.equal(validLessonVideo('https://youtu.be/abcdefghijk'),true);
 assert.equal(validLessonVideo('https://vimeo.com/123456789'),true);
 for (const url of ['javascript:alert(1)','http://youtu.be/abcdefghijk','https://youtu.be/abcdefghijk\n',
  'https://www.youtube.com.example.invalid/watch?v=abcdefghijk','https://vimeo.com@elsewhere.invalid/1',
  'https://www.youtube.com/redirect?q=https://elsewhere.invalid','https://vimeo.com/123?token=secret']) {
  assert.equal(validLessonVideo(url),false,url);
 }
 const {html}=await render({route:{name:'academy',id:'p'},rows:{
  restart_programs:[{id:'p',title:'Program',status:'published'}],
  restart_modules:[{id:'m',title:'Module'}],
  restart_lessons:[{id:'one',title:'Lesson',module_id:'m',body:'Text',media_url:youtube}]
 }});
 assert.match(html,/href="https:\/\/www\.youtube\.com\/watch\?v=abcdefghijk" target="_blank" rel="noopener noreferrer"/);
 assert.doesNotMatch(html,/<iframe/);
});

test('Academy renders previous backend schemas without the optional video field',async()=>{
 let queries=0;
 const {html}=await render({role:'instructor',route:{name:'staff',id:'p'},rows:{
  restart_programs:[{id:'p',title:'Program',status:'draft',instructor_id:'test'}],
  restart_modules:[{id:'m',title:'Module'}],
  restart_lessons:()=> ++queries===1 ? {schemaError:{code:'42703'}} :
   [{id:'old',title:'Original',module_id:'m',body:'Existing text',kind:'lesson',position:1}]
 }});
 assert.match(html,/Existing text/);
 assert.doesNotMatch(html,/name="media_url"/);
 assert.equal(queries,2);
});
