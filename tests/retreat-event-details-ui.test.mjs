import assert from 'node:assert/strict';
import test from 'node:test';
import {eventDetailsSaveArgs,readRetreatEventDetails,renderRetreatEventDetails,retreatDaysUntil} from '../app/retreat-event-details.mjs';

test('Countdown rolls over by Baku date and omits absent, invalid or past dates',()=>{
 assert.equal(retreatDaysUntil('2026-12-01',new Date('2026-11-30T19:59:59Z')),1);
 assert.equal(retreatDaysUntil('2026-12-01',new Date('2026-11-30T20:00:00Z')),0);
 assert.equal(retreatDaysUntil('2026-12-01',new Date('2026-12-01T20:00:00Z')),null);
 assert.equal(retreatDaysUntil('2026-02-29'),null);
 assert.equal(retreatDaysUntil(null),null);
});

test('Editor accepts empty drafts or partial publication and validates time and field limits',()=>{
 assert.deepEqual(eventDetailsSaveArgs('cohort',null,{}),{
  p_cohort_id:'cohort',p_expected_revision:null,p_event_date:null,p_location:null,
  p_dress_code:null,p_packing_list:null,p_published:false
 });
 assert.equal(eventDetailsSaveArgs('cohort',null,{visible:'yes'}),null);
 assert.equal(eventDetailsSaveArgs('cohort',null,{event_date:'2026-02-30'}),null);
 assert.equal(eventDetailsSaveArgs('cohort',null,{location:'a'.repeat(301)}),null);
 const partial=eventDetailsSaveArgs('cohort',{revision:2},{location:' Hall ',visible:'yes'});
 assert.equal(partial.p_published,true);
 assert.equal(partial.p_location,'Hall');
 assert.equal(partial.p_event_date,null);
 assert.equal(partial.p_expected_revision,2);
});

test('Participant cards show only real published details and escape text',()=>{
 const groups=[{cohort_id:'cohort',restart_retreat_cohorts:{title:'Group'}}];
 const row={cohort_id:'cohort',event_date:'2026-12-01',location:'<Hall',packing_list:'Mat\nWater'};
 const esc=value=>String(value).replaceAll('<','&lt;');
 assert.doesNotMatch(renderRetreatEventDetails({groups,details:[row]},'en',esc),/Hall|Days until/);
 const shown=renderRetreatEventDetails({groups,details:[{...row,published:true}]},'en',esc,new Date('2026-11-30T19:59:59Z'));
 assert.match(shown,/Days until the retreat · 1/);
 assert.match(shown,/&lt;Hall/);
 assert.match(shown,/Mat<br>Water/);
 assert.doesNotMatch(renderRetreatEventDetails({groups,details:[{...row,event_date:null,published:true}]},'en',esc),/Days until|<time/);
});

test('Participant selects published rows for own memberships; editor selects only mentor cohorts',async()=>{
 const calls=[];
 const client={from(table){
  calls.push(['from',table]);
  let query;
  query=new Proxy({}, {get(_,method){
   if (method==='then') return resolve=>resolve({data:table==='restart_retreat_members'?[{cohort_id:'cohort'}]:[]});
   return (...args)=>{calls.push([method,...args]);return query;};
  }});
  return query;
 }};
 await readRetreatEventDetails(client,{id:'guest',is_anonymous:true});
 assert.equal(calls.length,0);
 await readRetreatEventDetails(client,{id:'participant'});
 assert.ok(calls.some(row=>row[0]==='eq'&&row[1]==='published'&&row[2]===true));
 assert.ok(calls.some(row=>row[0]==='in'&&row[1]==='cohort_id'&&row[2][0]==='cohort'));
 calls.length=0;
 await readRetreatEventDetails(client,{id:'mentor'},true);
 assert.ok(calls.some(row=>row[0]==='eq'&&row[1]==='role'&&row[2]==='mentor'));
 assert.equal(calls.some(row=>row[1]==='published'),false);
});
