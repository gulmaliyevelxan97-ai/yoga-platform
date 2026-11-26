import test from 'node:test';
import assert from 'node:assert/strict';
import {academyCopy,programmeEditor,programmeCardInfo,saveProgrammeDetails} from '../app/academy-programs.mjs';

test('programme details preserve optional fields, escape editor content and localize all choices',()=>{
 const esc=value=>String(value??'').replaceAll('<','&lt;').replaceAll('"','&quot;');
 const sample={id:'p',title:'"title',summary:'<sample>',direction:'life',level:'intermediate',minutes:15,revision:1};
 assert.equal(programmeCardInfo({},key=>key,esc),'');
 for(const i of [0,1,2]){
  const t=key=>academyCopy[key]?.[i]||key;
  assert.ok(Object.values(academyCopy).every(texts=>texts[i]));
  const html=programmeEditor(sample,t,esc);
  assert.ok(html.includes('&lt;sample>'));
  assert.ok(html.includes('&quot;title'));
  assert.ok(html.includes('value="life" selected'));
  const info=programmeCardInfo(sample,t,esc);
  assert.ok(info.includes(t('courseIntermediate')));
  assert.ok(info.includes('LIFE'));
  assert.ok(!info.includes('<sample>'));
 }
});

test('editor sends only course fields, scopes updates to revision and signals stale data',async()=>{
 const fields={title:'  Title ',summary:' S ',minutes:'',level:'',direction:'body',revision:'2',role:'admin'};
 const calls=[];
 const builder={
  from(table){calls.push(table);return this;},update(payload){calls.push(payload);return this;},
  eq(key,value){calls.push([key,value]);return this;},select(){return this;},maybeSingle(){return {data:null,error:null};}
 };
 await assert.rejects(saveProgrammeDetails(builder,'example',fields),/courseConflict/);
 assert.deepEqual(calls,['restart_programs',{title:'Title',summary:'S',direction:'body',level:null,minutes:null},
  ['id','example'],['revision',2]]);
 await assert.rejects(saveProgrammeDetails(builder,'example',{...fields,minutes:'-1'}),/Invalid/);
});
