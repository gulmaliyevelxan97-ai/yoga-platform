import assert from 'node:assert/strict';
import test from 'node:test';
import {decideRetreatAdmission,loadMentorAdmissions,retreatMentorAdmissions} from '../app/retreat-mentor-admissions.mjs';

const request = {id:'7c59a9af-f851-4a46-b8a6-e20f69a86aa8',full_name:'<Test Name>',
 submitted_at:'2026-11-26T13:00:00Z',restart_retreat_cohorts:{title:'Test retreat'}};

const approved = {full_name:'İlkin Test',approved_at:'2026-11-26T13:00:00Z',restart_retreat_cohorts:{title:'Test retreat'}};

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
