const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const {runInNewContext} = require('node:vm');
const root = path.resolve(__dirname,'..');
const read = file => fs.readFileSync(path.join(root,file),'utf8');

test('Founder page links from the school shell and is cached offline', () => {
 const html = read('founder.html');
 assert.match(html, /data-page="founder"/);
 assert.match(html, /src="\.\/assets\/author\.webp"/);
 assert.match(read('releases/navigation/shell.js'), /founder:\['founder\.html'/);
 assert.match(read('service-worker.js'), /"\.\/founder\.html"/);
});

test('Each founder language has the approved title, mission and links in the new order', () => {
 const titles=['Чемпион Мира и Европы по каратэ','Karate üzrə Dünya və Avropa çempionu','World and European Karate Champion'];
 for (const [index,title] of titles.entries()) {
  const fragment = runInNewContext(read('releases/navigation/founder.js')+'\nfounderPage()', {
   t:(...items)=>items[index],
   pageName:key=>key,
   go:key=>'<a href="./'+key+'.html">'+key+'</a>'
  });
  assert.ok(fragment.includes(title));
  const gallery = [...fragment.matchAll(/href="\.\/assets\/(founder-workshop-[a-z]+\.webp)"><img src="\.\/assets\/\1"/g)];
  assert.equal(gallery.length,3);
  for (const photo of gallery) assert.ok(fs.existsSync(path.join(root,'assets',photo[1])));
  const photo = fragment.match(/<img src="\.\/assets\/founder-championship\.webp" width="1024" height="1029" loading="lazy" decoding="async" alt="([^"]+)">/);
  assert.ok(photo && fragment.indexOf(photo[0]) < fragment.indexOf(title));
  assert.ok(photo[1].includes(['с кубком и медалью','kubok və medalla','with a trophy and medal'][index]));
  assert.deepEqual([...fragment.matchAll(/<h2 id="founder-([\w-]+)"/g)].map(match=>match[1]),[
   'karate','yoga','workshops','invitation','mission'
  ]);
  assert.equal((fragment.match(/class="founder-mission-lead"/g)||[]).length,2);
  if (index===0) {
   assert.match(fragment,/Сила тела\. Гармония сознания\./);
   assert.match(fragment,/Не стать другим\. Раскрыть себя\./);
  }
  assert.doesNotMatch(fragment,/Личный архив|Şəxsi arxiv|Personal archive|Четырёхкратный|dördqat|Four-time/i);
  assert.doesNotMatch(fragment,/Требует подтверждения|Təsdiq tələb edir|Requires confirmation/);
  assert.match(fragment,/href="\.\/practices\.html"/);
  assert.match(fragment,/href="\.\/programme\.html"/);
  assert.match(fragment,/<video data-src="\.\/assets\/founder-yoga\.mp4" poster="\.\/assets\/founder-yoga\.webp" muted playsinline autoplay loop preload="none" aria-hidden="true">/);
 }
});

test('Championship photo is available in the offline cache', () => {
 assert.ok(fs.existsSync(path.join(root,'assets','founder-championship.webp')));
 assert.match(read('service-worker.js'), /"\.\/assets\/founder-championship\.webp"/);
});

test('Portrait stays static with reduced motion or rejected autoplay', async () => {
 const events = {};
 const updates = {};
 const attributes = new Map();
 const classes = new Set();
 const media = {matches:true, addEventListener:(_type,callback)=>{updates.motion=callback}};
 let rejectPlay;
 const video = {
  dataset:{src:'./assets/founder-portrait.mp4'},isConnected:true,
  hasAttribute:key=>attributes.has(key), removeAttribute:key=>attributes.delete(key), load(){}, pause(){},
  set src(value){attributes.set('src',value)},
  addEventListener:(type,callback)=>{events[type]=callback},
  play:()=>new Promise((_resolve,reject)=>{rejectPlay=reject})
 };
 const portrait = {querySelector:()=>video, classList:{add:key=>classes.add(key),remove:key=>classes.delete(key)}};
 runInNewContext(read('releases/navigation/founder-portrait.js'), {
  document:{querySelector:()=>({}),querySelectorAll:()=>[portrait]},window:{matchMedia:()=>media},
  MutationObserver:class { observe(){} }
 });
 assert.equal(attributes.has('src'),false);
 media.matches=false;
 updates.motion();
 assert.equal(video.muted,true);
 assert.equal(attributes.get('src'),'./assets/founder-portrait.mp4');
 rejectPlay(Error('Autoplay blocked'));
 await Promise.resolve();
 assert.equal(classes.has('is-playing'),false);
 events.playing();
 assert.equal(classes.has('is-playing'),true);
 media.matches=true;
 updates.motion();
 assert.equal(attributes.has('src'),false);
 assert.equal(classes.has('is-playing'),false);
});

test('Generated hero uses the photo alone until video is available', () => {
 const hasVideo = fs.existsSync(path.join(root,'assets/founder-portrait.mp4'));
 const html = read('founder.html');
 assert.match(html,/class="school-mast"[^]*src="\.\/assets\/author\.webp"/);
 if (!hasVideo) assert.doesNotMatch(html,/<video|founder-portrait\.mp4/);
 else {
  assert.match(html,/<video [^>]*poster="\.\/assets\/author\.webp" muted playsinline autoplay loop preload="none"/);
  assert.doesNotMatch(html,/<video [^>]*\scontrols[\s=>]/);
  assert.match(html,/Мастер владения нунчаками/);
  assert.match(html,/Nunçaku ustası/);
  assert.match(html,/Nunchaku practitioner/);
  assert.match(html,/data-src="\.\/assets\/founder-portrait\.mp4\?v=/);
 }
});
