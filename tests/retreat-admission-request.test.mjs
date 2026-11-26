import assert from 'node:assert/strict';
import test from 'node:test';
import {admissionRequestArgs,readOwnRetreatAdmissions,retreatAdmissionRequestPage} from '../app/retreat-admission-request.mjs';

const invitation='7c59a9af-f851-4a46-b8a6-e20f69a86aa8';

test('A request requires invitation, valid name and explicit consent',()=>{
 assert.equal(admissionRequestArgs({invitation,name:'Name'}),null);
 assert.equal(admissionRequestArgs({invitation:'missing',name:'Name',consent:'yes'}),null);
 assert.equal(admissionRequestArgs({invitation,name:'Bad\nName',consent:'yes'}),null);
 assert.deepEqual(admissionRequestArgs({invitation,name:' Test Name ',consent:'yes'}),
  {p_cohort_id:invitation,p_full_name:'Test Name'});
});

function fixture() {
 const calls=[];
 let submitted=false;
 const history={};
 const message={};
 const outlet={querySelector:selector=>selector==='[data-request-history]'?history:message,querySelectorAll:()=>[]};
 const client={
  from(table){
   calls.push(table);
   let query;
   query=new Proxy({}, {get(_,method){
    if (method==='then') return resolve=>resolve({data:submitted?[{cohort_id:invitation,status:'pending',submitted_at:'2026-11-26T14:00:00Z'}]:[]});
    return (...args)=>{calls.push([method,...args]);return query;};
   }});
   return query;
  },
  rpc(name,args){calls.push([name,args]);submitted=true;return Promise.resolve({data:invitation});}
 };
 return {calls,history,message,outlet,client};
}

test('History loads only the signed-in applicant’s statuses and leaves out their name',async()=>{
 const {calls,client}=fixture();
 assert.deepEqual(await readOwnRetreatAdmissions(client,{id:'guest',is_anonymous:true}),[]);
 assert.deepEqual(calls,[]);
 await readOwnRetreatAdmissions(client,{id:'applicant'});
 assert.deepEqual(calls.find(call=>call[0]==='eq'),['eq','applicant_id','applicant']);
 assert.doesNotMatch(calls.find(call=>call[0]==='select')[1],/full_name/);
});

test('After consent the page sends one RPC and displays the returned pending status',async()=>{
 const {calls,history,message,outlet,client}=fixture();
 const previous=globalThis.FormData;
 globalThis.FormData=class {constructor(form){return Object.entries(form.values);}};
 try {
  await retreatAdmissionRequestPage({outlet,client,user:{id:'applicant'},lang:'en',esc:String,current:()=>true});
  assert.match(history.innerHTML,/no applications yet/);
  let reset=false;
  const form={matches:()=>true,values:{invitation,name:'Test Name',consent:'yes'},reset(){reset=true;}};
  outlet.onsubmit({target:form,preventDefault(){},stopPropagation(){}});
  await new Promise(resolve=>setImmediate(resolve));
  assert.equal(reset,true);
  assert.deepEqual(calls.find(call=>call[0]==='restart_submit_retreat_admission'),
   ['restart_submit_retreat_admission',{p_cohort_id:invitation,p_full_name:'Test Name'}]);
  assert.match(history.innerHTML,/Pending/);
  assert.match(message.textContent,/See its status/);
 } finally {globalThis.FormData=previous;}
});
