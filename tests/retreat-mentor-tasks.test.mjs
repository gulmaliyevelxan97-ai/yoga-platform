import assert from 'node:assert/strict';
import test from 'node:test';
import {assignmentReviewArgs,assignmentSaveArgs,readRetreatMentorTasks} from '../app/retreat-mentor-tasks.mjs';

test('New assignments accept a group or a known recipient and interpret deadlines in Baku',()=>{
 const data={title:' Walk ',due:'2026-12-12T10:00',instructions:'Choose a quiet spot'};
 assert.deepEqual(assignmentSaveArgs('group',data,[]),{
  p_cohort_id:'group',p_item_id:null,p_expected_revision:null,p_participant_id:null,p_title:'Walk',
  p_instructions:'Choose a quiet spot',p_due_at:'2026-12-12T06:00:00.000Z'
 });
 assert.equal(assignmentSaveArgs('group',{...data,recipient:'other'},[]),null);
 assert.equal(assignmentSaveArgs('group',{...data,recipient:'approved'},['approved']).p_participant_id,'approved');
 assert.equal(assignmentSaveArgs('group',{...data,due:'invalid'},[]),null);
});

test('Updates retain recipients and require current revision, reviews require nonempty feedback',()=>{
 const task={id:'task',participant_id:'original',revision:2,due_at:'2026-12-12T06:00:15Z'};
 const update=assignmentSaveArgs('group',{title:'Updated',due:'2026-12-12T10:00',recipient:'other'},[],task);
 assert.equal(update.p_participant_id,'original');
 assert.equal(update.p_expected_revision,2);
 assert.equal(update.p_due_at,task.due_at);
 const review={cohort_id:'group',id:'review',revision:3};
 assert.equal(assignmentReviewArgs(review,'  '),null);
 assert.deepEqual(assignmentReviewArgs(review,' Thanks '),{
  p_cohort_id:'group',p_submission_id:'review',p_expected_revision:3,p_feedback:'Thanks'
 });
});

test('Mentor task and recipient reads are restricted to assigned cohorts',async()=>{
 const calls=[];
 let groups=[];
 const client={from(table){
  calls.push(['from',table]);
  let query;
  query=new Proxy({}, {get(_,method){
   if (method==='then') return resolve=>resolve({data:table==='restart_retreat_members'?groups:[]});
   return (...args)=>{calls.push([method,...args]);return query;};
  }});
  return query;
 }};
 assert.equal(await readRetreatMentorTasks(client,{id:'guest',is_anonymous:true}),null);
 assert.deepEqual(calls,[]);
 assert.equal(await readRetreatMentorTasks(client,{id:'member'}),null);
 assert.equal(calls.filter(row=>row[0]==='from').length,1);
 groups=[{cohort_id:'group'}];
 assert.deepEqual(await readRetreatMentorTasks(client,{id:'mentor'}),{groups,tasks:[],submissions:[],people:[]});
 assert.deepEqual(calls.filter(row=>row[0]==='in'),Array(3).fill(['in','cohort_id',['group']]));
 assert.ok(calls.some(row=>row[0]==='eq' && row[1]==='status' && row[2]==='approved'));
});
