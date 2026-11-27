import test from 'node:test';
import assert from 'node:assert/strict';
import {parseRetreatQuestions,retreatFormDraft,retreatFormAnswers,retreatFormsPage} from '../app/retreat-forms.mjs';

const escape = value=>String(value??'').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');

function fixtures(role,shared=false,hasResponse=true) {
 const calls=[];
 const forms=[{id:'published',cohort_id:'cohort',title:'<form>',published:true,questions:[{text:'What helped?'}]},
  {id:'draft',cohort_id:'cohort',title:'Internal draft',published:false,questions:[]}];
 const own={id:'response',cohort_id:'cohort',form_id:'published',answers:{q1:'<answer>'},share_with_mentor:shared};
 let failRefresh=false;
 const client={from(table) {
  const call={table,filters:[]};
  calls.push(call);
  const query={
   select(){return query;},order(){return query;},
   in(key,value){call.filters.push([key,value]);return query;},
   eq(key,value){call.filters.push([key,value]);return query;},
   update(value){call.update=value;return query;},single(){return query;},
   then(resolve){
    if (call.update) Object.assign(own,call.update);
    const rows=table==='restart_retreat_members'?[{cohort_id:'cohort',role,restart_retreat_cohorts:{title:'Cohort'}}]:
     table==='restart_retreat_forms'?forms:hasResponse?[own]:[];
    resolve({data:call.update?{id:own.id}:rows,error:failRefresh && !call.update?{code:'offline'}:null});
   }
  };
  return query;
 }};
 const outlet={querySelector(){return null;}};
 return {client,outlet,calls,own,forms,stopRefresh(){failRefresh=true;}};
}

const mount=(client,outlet,confirmAction)=>retreatFormsPage({
 client,outlet,user:{id:'person'},lang:'en',esc:escape,current:()=>true,confirmAction
});

function consentEvent() {
 const button={};
 return {
  target:{dataset:{retreatAction:'consent',cohort:'cohort',form:'published'},
   querySelector:()=>({}),querySelectorAll:()=>[button]},
  preventDefault(){},stopPropagation(){}
 };
}

test('Form builder accepts line-separated text, requires questions on publication and bounds answers',()=>{
 const form=retreatFormDraft({title:' Reflection ',questions:' First? \r\n\r\n Second? '},true);
 assert.deepEqual(form,{title:'Reflection',questions:[{text:'First?'},{text:'Second?'}]});
 assert.deepEqual(retreatFormAnswers(parseRetreatQuestions(form.questions),{q1:' a ',q2:'b',extra:'ignored'}),{q1:'a',q2:'b'});
 assert.throws(()=>retreatFormDraft({title:'Draft',questions:''},true),/invalid/);
 assert.throws(()=>retreatFormAnswers(['Question'],{q1:'X'.repeat(401)}),/answerInvalid/);
 assert.deepEqual(retreatFormAnswers(['Sensitive question','Other question'],{q1:' ',q2:'Useful'}),{q2:'Useful'});
 assert.throws(()=>retreatFormAnswers(['Optional question'],{q1:' '}),/answerInvalid/);
 assert.equal(parseRetreatQuestions([{text:{trim:true}}]),null);
});

test('Participant sees a private escaped answer and must confirm sharing; revocation is separate',async()=>{
 const {client,outlet,calls,own}=fixtures('participant');
 let confirmed=false;
 let confirmations=0;
 await mount(client,outlet,()=>{confirmations++;return confirmed;});
 assert.match(outlet.innerHTML,/Only you can see this answer/);
 assert.match(outlet.innerHTML,/&lt;answer&gt;/);
 assert.doesNotMatch(outlet.innerHTML,/Internal draft|New form/);
 const responseQuery=calls.find(call=>call.table==='restart_retreat_responses');
 assert.deepEqual(responseQuery.filters,[['cohort_id',['cohort']],['participant_id','person']]);

 await outlet.onsubmit(consentEvent());
 assert.equal(calls.some(call=>call.update),false);
 confirmed=true;
 await outlet.onsubmit(consentEvent());
 assert.equal(own.share_with_mentor,true);
 assert.match(outlet.innerHTML,/Revoke access/);
 await outlet.onsubmit(consentEvent());
 assert.equal(own.share_with_mentor,false);
 assert.equal(confirmations,2);
 assert.deepEqual(calls.filter(call=>call.update).map(call=>call.update),[{share_with_mentor:true},{share_with_mentor:false}]);
});

test('Mentor sees editable drafts and only explicitly shared escaped answers',async()=>{
 const {client,outlet,calls,own}=fixtures('mentor');
 await mount(client,outlet);
 assert.match(outlet.innerHTML,/Internal draft/);
 assert.match(outlet.innerHTML,/New form/);
 assert.doesNotMatch(outlet.innerHTML,/&lt;answer&gt;/);
 assert.deepEqual(calls.find(call=>call.table==='restart_retreat_responses').filters,[['cohort_id',['cohort']],['share_with_mentor',true]]);
 own.share_with_mentor=true;
 await mount(client,outlet);
 assert.match(outlet.innerHTML,/&lt;answer&gt;/);
 assert.doesNotMatch(outlet.innerHTML,/Save answer for yourself/);
});

test('A confirmed consent write keeps its acknowledgement when the list refresh fails',async()=>{
 const {client,outlet,own,stopRefresh}=fixtures('participant',true);
 await mount(client,outlet);
 stopRefresh();
 await outlet.onsubmit(consentEvent());
 assert.equal(own.share_with_mentor,false);
 assert.match(outlet.innerHTML,/Saved\./);
 assert.match(outlet.innerHTML,/Could not refresh the list of forms/);
 assert.doesNotMatch(outlet.innerHTML,/action could not be confirmed/);
 assert.doesNotMatch(outlet.innerHTML,/Revoke access/);
});

test('A form draft with unsupported question metadata cannot be overwritten by the text editor',async()=>{
 const {client,outlet,forms}=fixtures('mentor');
 forms[1].questions=[{text:'A choice',choices:['A','B']}];
 await mount(client,outlet);
 assert.match(outlet.innerHTML,/This form version requires an update/);
 assert.doesNotMatch(outlet.innerHTML,/data-form="draft"/);
 assert.match(outlet.innerHTML,/New form/);
});

test('Participant can skip sensitive questions before submitting an answer',async()=>{
 const {client,outlet}=fixtures('participant',false,false);
 await mount(client,outlet);
 assert.match(outlet.innerHTML,/You may skip any question/);
 assert.match(outlet.innerHTML,/<textarea name="q1" maxlength="400">/);
 assert.doesNotMatch(outlet.innerHTML,/textarea[^>]*required/);
});

test('Mentor preview validates draft rows and escapes input without publishing',async()=>{
 const {retreatFormPreview}=await import('../app/retreat-forms.mjs');
 const esc=value=>value.replaceAll('<','&lt;');
 assert.equal(retreatFormPreview({title:'<title>',questions:'First\n<script>'},esc),
  '<h5>&lt;title></h5><ol><li>First</li><li>&lt;script></li></ol>');
 assert.throws(()=>retreatFormPreview({title:'Draft',questions:''},esc),/invalid/);
});

test('Copying a published form omits identity, publication and response data',async()=>{
 const {retreatFormDuplicate}=await import('../app/retreat-forms.mjs');
 assert.deepEqual(retreatFormDuplicate({id:'original',cohort_id:'source',published:true,
  title:'Тест',questions:[{text:' Вопрос '}],answers:{q1:'Private'}}),
  {title:'Тест',questions:[{text:'Вопрос'}]});
 assert.throws(()=>retreatFormDuplicate({title:'Invalid',questions:[{text:'Question',type:'unknown'}]}),/invalid/);
});
