const test = require('node:test');
const assert = require('node:assert/strict');
const {readFileSync} = require('node:fs');
const {runInNewContext} = require('node:vm');
const root = require('node:path').resolve(__dirname,'..');
const read = file => readFileSync(root+'/'+file,'utf8');

test('Private programme retirement preserves saved progress and language choice', () => {
  const values = new Map([['yogaspace.language','az'],['restart.programme56.awakening.v3',JSON.stringify({done:{'w01.d3.body':1700000000000}})]]);
  const elements = {'#view':{addEventListener(){}},'#lang':{}};
  const document = {body:{dataset:{page:'progress'}},documentElement:{},querySelector:key=>elements[key]};
  const result = runInNewContext(read('releases/navigation/school-runtime.js')+'\nreport();', {
    document,buildShell(){},schoolHeader(){},hydrateFields(){},routePage:()=>'',window:{addEventListener(){}},
    localStorage:{getItem:key=>values.get(key),setItem:(key,value)=>values.set(key,value)}
  });
  assert.equal(document.documentElement.lang,'az');
  assert.match(result,/Gün 3 · BODY/);
  assert.match(result,/1 \/ 28/);
  assert.doesNotMatch(result,/href=/);
  elements['#lang'].onchange({target:{value:'en'}});
  assert.equal(values.get('yogaspace.language'),'en');
});

test('Practice search matches localized words across title and topic', () => {
  const match = runInNewContext(read('releases/stages-4-5/studio.js')+'\npracticeMatchesQuery');
  assert.equal(match('  NEFES   DIQQET  ',['Nəfəs məşqi','Diqqət'],'az'),true);
  assert.equal(match('nefes diqqet',['Nəfəs məşqi','Diqqət'],'en'),true);
  assert.equal(match('NƏFƏS DİQQƏT',['Nəfəs məşqi','Diqqət'],'az'),true);
  assert.equal(match('relax breath',['Breathing practice','Relaxation'],'en'),true);
  assert.equal(match('breath running',['Breathing practice','Relaxation'],'en'),false);
});
