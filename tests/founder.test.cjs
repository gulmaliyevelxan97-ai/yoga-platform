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
 assert.match(html, /src="\.\/assets\/founder-nunchaku-first-frame\.webp\?v=/);
 assert.match(read('releases/navigation/shell.js'), /founder:\['founder\.html'/);
 assert.match(read('service-worker.js'), /"\.\/founder\.html"/);
});

test('Each founder language has the approved title and links without duplicating the school history', () => {
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
   'karate','yoga','workshops','invitation'
  ]);
  assert.doesNotMatch(fragment,/founder-mission/);
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
 let frameCallback;
 const video = {
  dataset:{src:'./assets/founder-portrait.mp4'},isConnected:true,
  hasAttribute:key=>key==='data-first-frame'||attributes.has(key),
  requestVideoFrameCallback(callback){frameCallback=callback;return 1},
  cancelVideoFrameCallback(){frameCallback=undefined}, removeAttribute:key=>attributes.delete(key), load(){}, pause(){},
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
 assert.equal(classes.has('is-playing'),false);
 frameCallback();
 assert.equal(classes.has('is-playing'),true);
 media.matches=true;
 updates.motion();
 assert.equal(attributes.has('src'),false);
 assert.equal(classes.has('is-playing'),false);
});

test('Generated hero only uses the extracted frame while the video loads', () => {
 const hasVideo = fs.existsSync(path.join(root,'assets/founder-portrait.mp4'));
 const html = read('founder.html');

 if (!hasVideo) assert.doesNotMatch(html,/<video|founder-portrait\.mp4/);
 else {
  assert.doesNotMatch(html,/src="\.\/assets\/author\.webp"/);
  const frame=html.match(/<img src="([^"]*founder-nunchaku-first-frame[^"]*)"/)[1];
  assert.ok(html.includes('poster="'+frame+'"'));
  assert.ok(read('service-worker.js').includes(frame));
  assert.match(html,/<video [^>]*poster="[^"]+" muted playsinline autoplay loop preload="none"/);
  assert.doesNotMatch(html,/<video [^>]*\scontrols[\s=>]/);
  assert.match(html,/Мастер владения нунчаками/);
  assert.match(html,/Nunçaku ustası/);
  assert.match(html,/Nunchaku practitioner/);
  assert.match(html,/data-src="\.\/assets\/founder-portrait\.mp4\?v=/);
 }
});


test('About localizes the history and four directions, and lists only week numbers and names', () => {
 const source=read('releases/navigation/school-public.js')+'\n'+read('releases/navigation/pages.js')+'\n'+read('releases/navigation/about.js');
 for (const index of [0,1,2]) {
  const fragment=runInNewContext(source+'\naboutPage()',{
   document:{addEventListener(){}},
   t:(...items)=>items[index],
   tracks:['MIND','BODY','NUTRITION','LIFE'],
   pageUrl:key=>'./'+key+'.html'
  });
  assert.match(fragment,/id="about-story"/);
  assert.equal((fragment.match(/<details class="about-direction"/g)||[]).length,4);
  for (const name of ['mind','body','nutrition','life']) {
   const expanded=fragment.match(new RegExp('id="ph-'+name+'">([^]*?)</details>'))[1];
   assert.equal((expanded.match(/<h3>/g)||[]).length,2);
   assert.match(expanded,/about-reading-lead/);
   assert.match(expanded,/about-reading-close/);
  }
  const list=fragment.match(/<ol class="about-weeks">([^]*?)<\/ol>/)[1];
  const items=[...list.matchAll(/<li><span>(0[1-8])<\/span><strong>[^<]+<\/strong><\/li>/g)];
  assert.deepEqual(items.map(item=>item[1]),['01','02','03','04','05','06','07','08']);
  assert.equal(items.map(item=>item[0]).join(''),list);
 }
 assert.doesNotMatch(read('about.html'),/releases\/week\/content.js/);
 for(const width of [640,1280]){
  const image='assets/brand/restart-dawn-'+width+'.webp';
  assert.ok(fs.existsSync(path.join(root,image)));
  assert.ok(read('about.html').includes(image));
 }
});
