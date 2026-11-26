import assert from 'node:assert/strict';
import test from 'node:test';
import {readRetreatProgramme,renderRetreatProgramme,retreatProgrammeWindow,retreatProgrammePage} from '../app/retreat-programme.mjs';

test('The retreat programme only reads published items for the signed-in member’s groups',async()=>{
 const calls=[];
 let groups=[];
 const client={from(table){
  calls.push(table);
  let query;
  query=new Proxy({}, {get(_,method){
   if (method==='then') return resolve=>resolve({data:table==='restart_retreat_members'?groups:[]});
   return (...args)=>{calls.push([method,...args]);return query;};
  }});
  return query;
 }};
 assert.deepEqual(await readRetreatProgramme(client,{id:'guest',is_anonymous:true}),{groups:[],items:[]});
 assert.equal(calls.length,0);
 assert.deepEqual(await readRetreatProgramme(client,{id:'student'}),{groups:[],items:[]});
 assert.equal(calls.includes('restart_retreat_programme_items'),false);
 groups=[{cohort_id:'group-a'}];
 assert.deepEqual(await readRetreatProgramme(client,{id:'student'}),{groups,items:[]});
 assert.ok(calls.some(call=>Array.isArray(call) && call[0]==='eq' && call[1]==='published' && call[2]===true));
 assert.deepEqual(calls.find(call=>Array.isArray(call) && call[0]==='in'),['in','cohort_id',['group-a']]);
});

test('Programme cards render Baku time, escape content, and explain genuine empty states',()=>{
 const esc=value=>String(value).replaceAll('<','&lt;');
 const groups=[{cohort_id:'group-a',restart_retreat_cohorts:{title:'<Cohort'}},{cohort_id:'group-b'}];
 const items=[{cohort_id:'group-a',published:true,title:'<Practice',description:'Details',starts_at:'2026-12-02T06:00:00Z',ends_at:'2026-12-02T07:00:00Z'},
  {cohort_id:'unrelated',title:'Unrelated'}];
 const html=renderRetreatProgramme({groups,items},'en',esc);
 assert.match(html,/Baku time/);
 assert.match(html,/10:00 AM/);
 assert.match(html,/11:00 AM/);
 assert.match(html,/&lt;Cohort/);
 assert.match(html,/&lt;Practice/);
 assert.match(html,/no published items/);
 assert.doesNotMatch(html,/Unrelated/);
 assert.match(renderRetreatProgramme({groups:[],items:[]},'en',esc),/after you join a group/);
});

test('Live programme uses only published cohort times and never guesses an end time',()=>{
 const item=(title,start,end,extra={})=>({title,cohort_id:'g',published:true,starts_at:start,ends_at:end,...extra});
 const data=[
  item('Later','2026-12-02T07:00:00Z'),
  item('No duration','2026-12-02T05:30:00Z'),
  item('In progress','2026-12-02T06:00:00Z','2026-12-02T07:00:00Z'),
  item('Draft','2026-12-02T06:20:00Z','2026-12-02T07:00:00Z',{published:false}),
  item('Another group','2026-12-02T06:25:00Z','2026-12-02T07:00:00Z',{cohort_id:'other'}),
  item('Ended','2026-12-02T05:00:00Z','2026-12-02T06:30:00Z')
 ];
 const middle=new Date('2026-12-02T06:30:00Z');
 const active=retreatProgrammeWindow(data,'g',middle);
 assert.deepEqual(active.current.map(row=>row.title),['In progress']);
 assert.deepEqual(active.upcoming.map(row=>row.title),['Later']);
 assert.equal(active.timeline.length,4);
 const html=renderRetreatProgramme({groups:[{cohort_id:'g'}],items:data},'en',String,middle);
 assert.match(html,/<h3>Now<\/h3>.*In progress/);
 assert.match(html,/<h3>Next<\/h3>.*Later/);
 assert.match(html,/<details><summary>Full programme<\/summary>/);
 assert.doesNotMatch(html,/Draft|Another group/);
 const boundary=retreatProgrammeWindow(data,'g',new Date('2026-12-02T07:00:00Z'));
 assert.deepEqual(boundary.current,[]);
 assert.deepEqual(boundary.upcoming,[]);
});

test('Mounted programme changes from next to now without rerendering the expandable schedule',async t=>{
 t.mock.timers.enable({apis:['Date','setTimeout'],now:new Date('2026-12-02T05:59:59Z')});
 const group={cohort_id:'g'};
 const item={cohort_id:'g',title:'Practice',published:true,starts_at:'2026-12-02T06:00:00Z',ends_at:'2026-12-02T06:00:01Z'};
 const client={from(table){
  const query={select(){return query;},in(){return query;},eq(){return query;},order(){return query;},
   then(resolve){resolve({data:table==='restart_retreat_members'?[group]:[item]});}};
  return query;
 }};
 const summary={dataset:{retreatProgrammeWindow:'g'}};
 const outlet={isConnected:true,querySelectorAll:()=>[summary]};
 await retreatProgrammePage({outlet,client,user:{id:'account'},lang:'en',esc:String,current:()=>true});
 const initial=outlet.innerHTML;
 assert.match(initial,/<h3>Next<\/h3>/);
 t.mock.timers.tick(1000);
 assert.match(summary.innerHTML,/<h3>Now<\/h3>/);
 assert.equal(outlet.innerHTML,initial);
 t.mock.timers.tick(1000);
 assert.match(summary.innerHTML,/There are no upcoming items/);
});
