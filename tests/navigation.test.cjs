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

test('Programme links point to the first incomplete day or the completed report', () => {
  const counts = [4,4,2,0,0,0,0];
  const context = {
    weekdays: counts, tracks: ['MIND','BODY','NUTRITION','LIFE'],
    count: day => counts[day], restartPages: {calendar:['week-one.html','Первая неделя']},
    nextDay: () => counts.findIndex(n=>n<4),
    t: label => label,
    go: (path,label) => path+' · '+label,
    pageUrl: key => './'+key+'.html'
  };
  const run = expression => runInNewContext('(()=>{'+read('releases/navigation/pages.js')+'\nreturn '+expression+';})()', context);
  assert.equal(run('weekAction()'),'day-3 · Продолжить с дня 3');
  assert.match(run('weekStatus()'), /10 \/ 28/);
  counts.fill(4);
  assert.equal(run('weekAction()'),'progress · Открыть отчёт');
  assert.match(run('myPath()'), /Первая неделя завершена/);
  counts.fill(0);
  assert.equal(run('weekAction()'),'day-1 · Начать первую неделю');
});

test('Practice search matches localized words across title and topic', () => {
  const match = runInNewContext(read('releases/stages-4-5/studio.js')+'\npracticeMatchesQuery');
  assert.equal(match('  NEFES   DIQQET  ',['Nəfəs məşqi','Diqqət'],'az'),true);
  assert.equal(match('nefes diqqet',['Nəfəs məşqi','Diqqət'],'en'),true);
  assert.equal(match('NƏFƏS DİQQƏT',['Nəfəs məşqi','Diqqət'],'az'),true);
  assert.equal(match('relax breath',['Breathing practice','Relaxation'],'en'),true);
  assert.equal(match('breath running',['Breathing practice','Relaxation'],'en'),false);
});
