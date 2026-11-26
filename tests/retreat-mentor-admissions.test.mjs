import assert from 'node:assert/strict';
import test from 'node:test';
import {decideRetreatAdmission,loadMentorAdmissions,retreatMentorAdmissions,readParticipantInteractions} from '../app/retreat-mentor-admissions.mjs';

const request = {id:'7c59a9af-f851-4a46-b8a6-e20f69a86aa8',full_name:'<Test Name>',
 submitted_at:'2026-11-26T13:00:00Z',restart_retreat_cohorts:{title:'Test retreat'}};

const approved = {id:'0a8e8be9-df9a-45cb-b418-263191086888',cohort_id:'f1f12c0e-9cd3-4b05-8eaf-7365c6c4c272',full_name:'İlkin Test',approved_at:'2026-11-26T13:00:00Z',restart_retreat_cohorts:{title:'Test retreat'}};

function fixture(mentor=true) {
 const calls = [];
 let queue = [request];
 const client = {
  from(table){
   calls.push(['from',table]);
   let query,status;
   query=new Proxy({}, {get(_,method){
    if (method==='then') return resolve=>resolve({data:table==='restart_retreat_members' ?
     (mentor ? [{cohort_id:'cohort-a'}] : []) : status==='approved' ? [approved] : queue});
    return (...args)=>{if (method==='eq' && args[0]==='status') status=args[1];calls.push([method,...args]);return query;};
   }});
   return query;
  },
  async rpc(name,args){calls.push([name,args]);queue=[];return {data:null};}
 };
 return {client,calls};
}

test('Admission queue first checks mentor memberships and scopes by cohort and pending status',async()=>{
 const {client,calls}=fixture();
 assert.equal(await loadMentorAdmissions(client,null),null);
 assert.equal(await loadMentorAdmissions(client,{id:'guest',is_anonymous:true}),null);
 assert.deepEqual(calls,[]);
 assert.deepEqual(await loadMentorAdmissions(client,{id:'mentor'}),{pending:[request],approved:[approved],hasNext:false,memberships:[{cohort_id:'cohort-a'}],selectedGroup:''});
 assert.deepEqual(calls.slice(0,4),[
  ['from','restart_retreat_members'],['select','cohort_id,restart_retreat_cohorts(title)'],['eq','user_id','mentor'],['eq','role','mentor']
 ]);
 assert.equal(calls.filter(call=>call[0]==='in' && call[1]==='cohort_id' && call[2][0]==='cohort-a').length,2);
 assert.ok(calls.some(call=>call[0]==='eq' && call[1]==='status' && call[2]==='pending'));
 assert.ok(calls.some(call=>call[0]==='eq' && call[1]==='status' && call[2]==='approved'));
 const applicant=fixture(false);
 assert.equal(await loadMentorAdmissions(applicant.client,{id:'applicant'}),null);
 assert.equal(applicant.calls.some(call=>call[1]==='restart_retreat_admissions'),false);
});

test('Decisions use fixed RPCs and reject invalid operations or IDs',async()=>{
 const {client,calls}=fixture();
 await assert.rejects(decideRetreatAdmission(client,'invalid','approve'));
 await assert.rejects(decideRetreatAdmission(client,request.id,'delete'));
 await decideRetreatAdmission(client,request.id,'approve');
 await decideRetreatAdmission(client,request.id,'decline');
 assert.deepEqual(calls,[
  ['restart_approve_retreat_admission',{p_request_id:request.id}],
  ['restart_decline_retreat_admission',{p_request_id:request.id}]
 ]);
});

test('Mentor queue escapes names and refreshes after a confirmed approval',async()=>{
 const {client,calls}=fixture();
 const outlet={querySelectorAll:()=>[],querySelector:()=>null};
 let mounted=true;
 await retreatMentorAdmissions({outlet,client,user:{id:'mentor'},lang:'en',
  esc:value=>String(value).replaceAll('<','&lt;').replaceAll('>','&gt;'),current:()=>mounted});
 assert.match(outlet.innerHTML,/&lt;Test Name&gt;/);
 assert.match(outlet.innerHTML,/data-admission-action="decline"/);
 assert.match(outlet.innerHTML,/Approved on/);
 assert.match(outlet.innerHTML,/İlkin Test/);
 const event={target:{closest:()=>({dataset:{admissionAction:'approve',request:request.id}})}};
 await outlet.onclick(event);
 assert.match(outlet.innerHTML,/Application approved/);
 assert.match(outlet.innerHTML,/no pending applications/);
 mounted=false;
 await outlet.onclick(event);
 assert.equal(calls.filter(call=>call[0]==='restart_approve_retreat_admission').length,1);
});

test('Approved filtering escapes regex, selects a verified group and uses a bounded server page',async()=>{
 const {client,calls}=fixture();
 const search='  A.*(name)[?]\\+|^$  ';
 await loadMentorAdmissions(client,{id:'mentor'},{search,group:'cohort-a',page:2});
 assert.deepEqual(calls.find(call=>call[0]==='filter'),
  ['filter','full_name','imatch','A\\.\\*\\(name\\)\\[\\?\\]\\\\\\+\\|\\^\\$']);
 assert.deepEqual(calls.find(call=>call[0]==='range'),['range',50,75]);
 assert.ok(calls.some(call=>call[0]==='eq' && call[1]==='cohort_id' && call[2]==='cohort-a'));
 const other=fixture();
 const queue=await loadMentorAdmissions(other.client,{id:'mentor'},{group:'unrelated',page:0});
 assert.equal(queue.selectedGroup,'');
 assert.equal(other.calls.some(call=>call[0]==='eq' && call[1]==='cohort_id'),false);
});

test('Participant summaries query only counts for verified cohort, shared responses and the mentor’s own conversation',async()=>{
 const participant='170ad418-d61f-4eff-978a-8bee3a4cbc9e';
 const mentor='f06a95df-744d-4b9f-9b27-dd58dafc7220';
 const calls=[];
 let authorized=true;

 const client={from(table) {
  const call={table,filters:[]};
  calls.push(call);
  const query={
   select(fields,options){call.fields=fields;call.options=options;return query;},
   eq(key,value){call.filters.push([key,value]);return query;},
   maybeSingle(){return query;},
   then(resolve){
    const data=table==='restart_retreat_members' ? (authorized?{cohort_id:approved.cohort_id}:null) :
     table==='restart_retreat_admissions' ? {applicant_id:participant} : null;
    resolve({data,count:table==='restart_retreat_messages'?2:1,error:null});
   }
  };
  return query;
 }};
 assert.deepEqual(await readParticipantInteractions(client,{id:mentor},approved),
  {sharedResponses:1,submittedTasks:1,reviewedTasks:1,directMessages:4});
 const [membership,application,forms,submitted,reviewed,sent,received]=calls;
 assert.deepEqual(membership.filters,[['cohort_id',approved.cohort_id],['user_id',mentor],['role','mentor']]);
 assert.deepEqual(application.filters,[['id',approved.id],['cohort_id',approved.cohort_id],['status','approved']]);
 for (const call of [forms,submitted,reviewed,sent,received]) {
  assert.equal(call.fields,'id');
  assert.deepEqual(call.options,{count:'exact',head:true});
  assert.deepEqual(call.filters[0],['cohort_id',approved.cohort_id]);
 }
 assert.deepEqual(forms.filters.slice(1),[['participant_id',participant],['share_with_mentor',true]]);
 assert.deepEqual(submitted.filters.slice(1),[['participant_id',participant],['status','submitted']]);
 assert.deepEqual(reviewed.filters.slice(1),[['participant_id',participant],['status','reviewed']]);
 assert.deepEqual(sent.filters.slice(1),[['sender_id',mentor],['recipient_id',participant]]);
 assert.deepEqual(received.filters.slice(1),[['sender_id',participant],['recipient_id',mentor]]);
 authorized=false;
 calls.length=0;
 assert.equal(await readParticipantInteractions(client,{id:mentor},approved),null);
 assert.deepEqual(calls.map(row=>row.table),['restart_retreat_members']);
});
