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

test('Public pages expose the founder and application before JavaScript starts', () => {
  for (const file of ['index', 'founder', 'about', 'philosophy', 'code', 'programme', 'my-path', 'journal', 'progress', 'participation', 'practices', 'activity']) {
    const html=read(file+'.html');
    const menu=html.match(/<nav class="all-links"[^>]*>([\s\S]*?)<\/nav>/)[1];
    assert.match(menu,/href="\.\/founder\.html"/);
    assert.match(menu,/href="\.\/app\/"/);
    assert.match(html,/<a class="school-skip" href="#top">/);
    assert.match(html,/<main[^>]*id="top"[^>]*tabindex="-1"/);
  }
  assert.match(read('index.html'), /id="home-founder"><a href="\.\/founder\.html">Elxan Gülmalıyev/);
  assert.match(read('founder.html'), /id="founder-workshops"/);
});

test('Legacy home hashes open their canonical school destinations', () => {
  for (const [hash, expected] of [['#founder','./founder.html'],['#teacher-elxan','./founder.html'],['#watch/lesson','./practices.html#watch/lesson'],['#profile','./activity.html#profile']]) {
    let redirected;
    runInNewContext(read('releases/navigation/shell.js'), {
      document:{body:{dataset:{page:'home'}},querySelector:()=>({querySelector(){}}),addEventListener(){}},
      location:{hash,replace:url=>{redirected=url}},window:{addEventListener(){}},navigator:{}
    });
    assert.equal(redirected,expected);
  }
});

test('Public home renders original media and links to studios without JavaScript', () => {
  const home = read('index.html');
  const studio = read('practices.html');
  for (const destination of ['courses', 'live']) {
    assert.match(home, new RegExp('href="\\./practices\\.html#' + destination + '"'));
    assert.match(studio, new RegExp('id="' + destination + '"'));
  }
  for (const route of ['yoga', 'breathing', 'listening']) {
    assert.ok(home.includes('href="./practices.html#course/' + route + '"'));
    assert.ok(studio.includes('href="#course/' + route + '"'));
  }
  for (const relative of ['brand/restart-1188.webp', 'author.webp', 'yoga.webp', 'breath.webp', 'meditation.webp']) {
    assert.ok(home.includes('src="./assets/' + relative + '"'));
    assert.ok(readFileSync(root + '/assets/' + relative).length > 0);
  }
  for (const picture of ['group', 'talk', 'outdoors']) {
    assert.ok(read('service-worker.js').includes('"./assets/founder-workshop-' + picture + '.webp"'));
  }
});
