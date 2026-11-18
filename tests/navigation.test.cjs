const test = require('node:test');
const assert = require('node:assert/strict');
const {readFileSync} = require('node:fs');
const {runInNewContext} = require('node:vm');
const root = require('node:path').resolve(__dirname,'..');
const read = file => readFileSync(root+'/'+file,'utf8');

test('A checked task survives reload and weekly report links target the original day', () => {
  const values = new Map([['yogaspace.language','az']]);
  const location = {hash:''};
  const view = {addEventListener(type,handler){this[type]=handler;}};
  const elements = {'#view':view,'#lang':{},'#notice':{}};
  const document = {body:{dataset:{page:'progress'}},documentElement:{},querySelector:key=>elements[key]};
  const setup = () => runInNewContext(read('releases/week/week.js')+'\nreport();', {
    document,location,
    pageUrl:key=>key==='calendar'?'./week-one.html':'./'+key+'.html',
    buildShell(){},schoolHeader(){},hydrateFields(){},schoolTabs:()=>[],
    routePage:()=>String(view.innerHTML ?? ''),
    window:{addEventListener(){}},
    localStorage:{getItem:key=>values.get(key),setItem:(key,value)=>values.set(key,value)}
  }, {filename:'week.js'});
  setup();
  view.change({target:{dataset:{task:'w01.d3.body'},checked:true}});
  const report = setup();
  assert.equal(document.documentElement.lang,'az');
  assert.match(report,/href="\.\/week-one\.html#day-3">Gün 3 · BODY/);
  assert.match(report,/1 \/ 28/);
  elements['#lang'].onchange({target:{value:'en'}});
  assert.equal(document.documentElement.lang,'en');
  assert.equal(values.get('yogaspace.language'),'en');
});
