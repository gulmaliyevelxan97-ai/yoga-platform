const test = require('node:test');
const assert = require('node:assert/strict');
const {readFileSync, existsSync} = require('node:fs');
const {resolve} = require('node:path');
const {runInNewContext} = require('node:vm');
const read = path => readFileSync(resolve(__dirname,'..',path),'utf8');
const model = import('../app/state.mjs');

test('App timer persists, pauses, and never claims more than the practice duration', async () => {
 const {elapsed,pause,localRepository} = await model;
 let saved;
 const storage = {getItem: () => saved, setItem: (_, value) => { saved = value; }};
 const repo = localRepository(() => storage);
 repo.write({active:{id:'breathing',startedAt:1000,accumulated:0}});
 const resumed = localRepository(() => storage);
 assert.equal(elapsed(resumed.read().active,180,7000),6);
 const paused = pause(resumed.read().active,180,7000);
 assert.equal(elapsed(paused,180,15000),6);
 assert.equal(elapsed({...paused,startedAt:15000},180,999000),180);
 assert.equal(resumed.available,true);
});

test('Progress counts actual time and a streak may include yesterday', async () => {
 const {metrics,dateKey,shiftDate} = await model;
 const now = new Date(2026,10,20,12);
 const sessions = [
  {day:dateKey(shiftDate(now,-1)),seconds:17},
  {day:dateKey(shiftDate(now,-1)),seconds:36},
  {day:dateKey(shiftDate(now,-2)),seconds:5},
  {day:dateKey(shiftDate(now,-7)),seconds:9}
 ];
 const result = metrics(sessions,now);
 assert.deepEqual([result.count,result.seconds,result.streak,result.week],[4,67,2,3]);
 assert.equal(metrics([],now).streak,0);
});

test('Journal updates one entry and local storage failures are visible to the UI', async () => {
 const {upsertEntry,localRepository} = await model;
 const entry = {id:'e',date:'2026-11-20',notes:'first'};
 const edited = upsertEntry([entry],{...entry,notes:'edited'});
 assert.deepEqual(edited,[{...entry,notes:'edited'}]);
 const repo = localRepository(()=>{throw Error('Unavailable');});
 assert.equal(repo.available,false);
 repo.write({journal:edited});
 assert.equal(repo.read().journal[0].notes,'edited');
});

test('Every label and each practice has RU/AZ/EN and video IDs match the public catalogue', async () => {
 const {strings,catalog,categories} = await import('../app/content.mjs');
 assert.deepEqual(catalog.map(item=>item.id),Object.keys(categories));
 for (const triple of [...Object.values(strings),...Object.values(categories),...catalog.flatMap(item=>[item.title,item.description])]) {
  assert.equal(triple.length,3);
  assert(triple.every(value=>typeof value==='string'&&value.trim().length>0));
 }
 for (const item of catalog.filter(item=>item.video)) assert(read('video-data.js').includes(item.video.id));
});

test('Manifest and worker use the app scope, use existing RESTART assets and exclude private routes', () => {
 const manifest = JSON.parse(read('app/manifest.webmanifest'));
 assert.deepEqual([manifest.name,manifest.id,manifest.scope,manifest.start_url,manifest.display],['RESTART','./','./','./','standalone']);
 for (const icon of manifest.icons) assert(existsSync(resolve(__dirname,'../app',icon.src)));
 assert(manifest.icons.some(icon=>icon.sizes==='512x512'&&icon.purpose==='maskable'));
 const handlers = {};
 const scope = 'https://example.test/yoga-platform/app/';
 const captures = [];
 const cache = {addAll(requests){captures.push(...requests.map(r=>r.url));}};
 runInNewContext(read('app/sw.js'),{
  URL, Request, self:{registration:{scope},addEventListener:(name,handler)=>{handlers[name]=handler;}},
  caches:{open: async()=>cache,match: async()=> 'offline-shell'}
 });
 return new Promise(resolve=>handlers.install({waitUntil:resolve})).then(async ()=>{
  assert(captures.includes(scope+'index.html'));
  assert(captures.every(url=>url.startsWith(scope)||url.startsWith('https://example.test/yoga-platform/assets/')));
  let response;
  handlers.fetch({request:{method:'GET',mode:'navigate',url:scope},respondWith:value=>{response=value;}});
  assert.equal(await response,'offline-shell');
  for (const external of ['../about.html','../releases/week/content.js','../week-one.html']) {
   handlers.fetch({request:{method:'GET',mode:'navigate',url:new URL(external,scope).href},respondWith:()=>assert.fail(external)});
  }
  assert.doesNotMatch(read('app/index.html')+read('app/ui.mjs'),/gtag|googletagmanager|google-analytics/i);
 });
});
