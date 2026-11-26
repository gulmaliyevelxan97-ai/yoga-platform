import assert from 'node:assert/strict';
import test from 'node:test';
import {readParticipantTasks,taskSubmissionArgs,retreatTasksPage} from '../app/retreat-tasks.mjs';

const task={id:'task-a',cohort_id:'group-a',title:'<Walk>',instructions:'Find a quiet space',
 due_at:'2026-12-03T09:00:00Z',restart_retreat_cohorts:{title:'Group A'}};

function fixture() {
 const calls=[];
 const client={from(table){
  calls.push(table);
  let query;
  query=new Proxy({}, {get(_,method){
   if (method==='then') return resolve=>resolve({data:{
    restart_retreat_members:[{cohort_id:'group-a'}],restart_retreat_assignments:[task],
    restart_retreat_assignment_submissions:[{assignment_id:task.id,response:'Done',feedback:'<Thanks>',status:'reviewed'}]
   }[table]});
   return (...args)=>{calls.push([method,...args]);return query;};
  }});
  return query;
 }};
 return {calls,client};
}

test('Participant tasks use assigned cohorts, address visibility and own results only',async()=>{
 const {calls,client}=fixture();
 assert.deepEqual(await readParticipantTasks(client,{id:'guest',is_anonymous:true}),{tasks:[],submissions:[]});
 assert.deepEqual(calls,[]);
 const {tasks,submissions}=await readParticipantTasks(client,{id:'participant'});
 assert.deepEqual(tasks,[task]);
 assert.equal(submissions[0].status,'reviewed');
 assert.ok(calls.some(call=>Array.isArray(call)&&call[0]==='eq'&&call[1]==='role'&&call[2]==='participant'));
 assert.deepEqual(calls.find(call=>call[0]==='or'),['or','participant_id.is.null,participant_id.eq.participant']);
 assert.ok(calls.some(call=>Array.isArray(call)&&call[0]==='eq'&&call[1]==='participant_id'&&call[2]==='participant'));
});

test('Task sharing is explicit and permits a completion-only reply',()=>{
 assert.equal(taskSubmissionArgs(task,'Done',null),null);
 assert.equal(taskSubmissionArgs(task,'x'.repeat(4001),'yes'),null);
 assert.equal(taskSubmissionArgs(null,'Done','yes'),null);
 assert.deepEqual(taskSubmissionArgs(task,'','yes'),{
  p_cohort_id:'group-a',p_assignment_id:'task-a',p_response:'',p_share_with_mentor:true
 });
});

test('Task results render review status, escaped feedback and Baku deadline',async()=>{
 const {client}=fixture();
 const outlet={querySelectorAll:()=>[]};
 await retreatTasksPage({outlet,client,user:{id:'participant'},lang:'en',current:()=>true,
  esc:value=>String(value).replaceAll('<','&lt;')});
 assert.match(outlet.innerHTML,/Reviewed/);
 assert.match(outlet.innerHTML,/&lt;Thanks>/);
 assert.match(outlet.innerHTML,/Due \(Baku time\).*1:00 PM/);
 assert.doesNotMatch(outlet.innerHTML,/data-retreat-task=/);
});
