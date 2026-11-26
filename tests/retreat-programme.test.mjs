import assert from 'node:assert/strict';
import test from 'node:test';
import {readRetreatProgramme,renderRetreatProgramme} from '../app/retreat-programme.mjs';

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
 const items=[{cohort_id:'group-a',title:'<Practice',description:'Details',starts_at:'2026-12-02T06:00:00Z',ends_at:'2026-12-02T07:00:00Z'},
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
