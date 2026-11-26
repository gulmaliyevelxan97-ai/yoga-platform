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
 const {strings,catalog,categories,mentorContent} = await import('../app/content.mjs');
 assert.deepEqual(catalog.map(item=>item.id),Object.keys(categories));
 assert.deepEqual(Object.keys(mentorContent.pillars),['MIND','BODY','NUTRITION','LIFE']);
 const mentorStrings = [mentorContent.history, mentorContent.teaching, ...mentorContent.background, ...Object.values(mentorContent.pillars)];
 for (const triple of [...mentorStrings,...Object.values(strings),...Object.values(categories),...catalog.flatMap(item=>[item.title,item.description])]) {
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
  const portraits = [...read('index.html').matchAll(/assets\/brand\/restart-\d+\.webp/g)];
  assert.equal(new Set(portraits.map(match=>match[0])).size,2);
  for (const [portrait] of portraits) {
   assert(existsSync(resolve(__dirname,'..',portrait)));
   assert(!captures.includes(new URL('../'+portrait,scope).href));
  }
  for (const file of ['swipe-navigation.mjs','retreat-welcome.mjs']) assert(captures.includes(scope+file));
  assert(!captures.includes(new URL('../assets/hero.webp',scope).href));
  assert(captures.every(url=>url.startsWith(scope)||url.startsWith('https://example.test/yoga-platform/assets/')));
  let response;
  handlers.fetch({request:{method:'GET',headers:new Headers(),mode:'navigate',url:scope},respondWith:value=>{response=value;}});
  assert.equal(await response,'offline-shell');
  for (const external of ['../about.html','../releases/week/content.js','../week-one.html']) {
   handlers.fetch({request:{method:'GET',headers:new Headers(),mode:'navigate',url:new URL(external,scope).href},respondWith:()=>assert.fail(external)});
  }
  handlers.fetch({request:new Request(scope+'index.html',{headers:{Range:'bytes=0-12'}}),
   respondWith:()=>assert.fail('Range requests require an origin response')});
  handlers.fetch({request:new Request(scope+'rest/v1/restart_journal'),
   respondWith:()=>assert.fail('The worker must bypass private data routes')});
  assert.doesNotMatch(read('app/index.html')+read('app/ui.mjs'),/gtag|googletagmanager|google-analytics/i);
 });
});

test('Only app windows can activate a waiting app worker', async () => {
 const handlers = {};
 const scope = 'https://example.test/yoga-platform/app/';
 let updates=0;
 runInNewContext(read('app/sw.js'),{
  URL, self:{registration:{scope},skipWaiting:async()=>{updates++;},
  addEventListener:(name,handler)=>{handlers[name]=handler;}}
 });
 const post=(source,type='ACTIVATE')=>{
  let pending;
  handlers.message({data:{type},source,waitUntil:promise=>{pending=promise;}});
  return pending;
 };
 await post(null);
 await post({type:'worker',url:scope});
 await post({type:'window',url:'https://example.test/yoga-platform/'});
 await post({type:'window',url:'https://other.example/yoga-platform/app/'});
 await post({type:'window',url:scope},'OTHER');
 assert.equal(updates,0);
 await post({type:'window',url:scope+'#journal'});
 assert.equal(updates,1);
 await post({type:'window',url:scope+'index.html?code=fixture#account'});
 assert.equal(updates,2);
});

test('Push receiver uses built-in copy, a stable tag and fixed in-scope navigation', async () => {
 const handlers={};
 const scope='https://example.test/app/';
 const shown=[];
 const opened=[];
 runInNewContext(read('app/sw.js'),{URL,self:{
  registration:{scope,showNotification:async(title,options)=>shown.push({title,options})},
  clients:{matchAll:async()=>[],openWindow:async url=>opened.push(url)},
  addEventListener:(name,handler)=>{handlers[name]=handler;}
 }});
 function run(handler,fields) {
  let pending;
  handler({...fields,waitUntil:value=>{pending=value;}});
  return pending;
 }
 await run(handlers.push,{data:{json:()=>({period:'invalid',day:'2026-11-21'})}});
 assert.equal(shown.length,0);
 await run(handlers.push,{data:{json:()=>({period:'morning',day:'2026-11-21',locale:'en',body:'untrusted',url:'https://example.invalid/'})}});
 assert.equal(shown[0].options.body,'Start your morning with breathing.');
 assert.equal(shown[0].options.tag,'restart-2026-11-21-morning');
 await run(handlers.notificationclick,{notification:{tag:shown[0].options.tag,close(){}}});
 assert.deepEqual(opened,[scope+'#today']);
});
