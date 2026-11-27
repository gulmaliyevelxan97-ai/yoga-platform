import assert from 'node:assert/strict';
import test from 'node:test';
import {programmeSaveArgs,readMentorProgramme} from '../app/retreat-programme-editor.mjs';

test('Mentor draft form uses Baku times and accepts undated drafts',()=>{
 const args=programmeSaveArgs({title:'  Welcome ',description:'Meet the group',start:'2026-12-02T10:00',end:'2026-12-02T11:00'},'cohort');
 assert.deepEqual(args,{p_cohort_id:'cohort',p_item_id:null,p_expected_revision:null,p_title:'Welcome',
  p_description:'Meet the group',p_starts_at:'2026-12-02T06:00:00.000Z',p_ends_at:'2026-12-02T07:00:00.000Z'});
 assert.equal(programmeSaveArgs({title:'Draft'},'cohort').p_starts_at,null);
 assert.throws(()=>programmeSaveArgs({title:'Draft',end:'2026-12-02T11:00'},'cohort'));
 assert.throws(()=>programmeSaveArgs({title:'Draft',start:'2026-12-02T11:00',end:'2026-12-02T10:00'},'cohort'));
});

test('Published item saves timing and revision while retaining original wording',()=>{
 const original={id:'item',title:'Original',description:'Original details',published:true,revision:7,
  starts_at:'2026-12-02T06:00:10Z',ends_at:'2026-12-02T07:00:10Z'};
 const args=programmeSaveArgs({title:'Changed',description:'Changed',start:'2026-12-02T10:00',end:'2026-12-02T11:30'},'cohort',original);
 assert.equal(args.p_item_id,'item');
 assert.equal(args.p_expected_revision,7);
 assert.equal(args.p_title,'Original');
 assert.equal(args.p_description,'Original details');
 assert.equal(args.p_starts_at,original.starts_at);
 assert.equal(args.p_ends_at,'2026-12-02T07:30:00.000Z');
 assert.throws(()=>programmeSaveArgs({},'cohort',original));
});

test('Programme editor queries items only when assigned mentor cohorts exist',async()=>{
 let memberships=[];
 const calls=[];
 const client={from(name){
  calls.push(name);
  let query;
  query=new Proxy({}, {get(_,method){
   if (method==='then') return resolve=>resolve({data:name==='restart_retreat_members'?memberships:[]});
   return (...args)=>{calls.push([method,...args]);return query;};
  }});
  return query;
 }};
 assert.equal(await readMentorProgramme(client,{id:'guest',is_anonymous:true}),null);
 assert.deepEqual(calls,[]);
 assert.equal(await readMentorProgramme(client,{id:'participant'}),null);
 assert.equal(calls.includes('restart_retreat_programme_items'),false);
 memberships=[{cohort_id:'assigned'}];
 assert.deepEqual(await readMentorProgramme(client,{id:'mentor'}),{memberships,items:[]});
 assert.ok(calls.some(call=>Array.isArray(call) && call[0]==='in' && call[2][0]==='assigned'));
});

test('Suggested end time respects Baku calendar rollover',async()=>{
 const {suggestedProgrammeEnd}=await import('../app/retreat-programme-editor.mjs');
 assert.equal(suggestedProgrammeEnd('2026-11-28T23:45'),'2026-11-29T00:15');
 assert.equal(suggestedProgrammeEnd(''),'');
 assert.equal(suggestedProgrammeEnd('invalid'),'');
});
