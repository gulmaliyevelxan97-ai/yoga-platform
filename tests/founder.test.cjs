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

test('Each founder language has the biography, founder attribution and original project images', () => {
 const labels=['предоставлены основателем','təsisçi təqdim edib','reported by the founder'];
 for (const [index,label] of labels.entries()) {
  const fragment = runInNewContext(read('releases/navigation/founder.js')+'\nfounderPage()', {
   t:(...items)=>items[index],
   pageName:key=>key,
   go:key=>'<a href="./'+key+'.html">'+key+'</a>'
  });
  assert.ok(fragment.includes(label));
  assert.match(fragment,/id="founder-mission"/);
  assert.equal((fragment.match(/class="founder-mission-lead"/g)||[]).length,2);
  if (index===0) {
   assert.match(fragment,/Сила тела\. Гармония сознания\./);
   assert.match(fragment,/Не стать другим\. Раскрыть себя\./);
  }
  assert.doesNotMatch(fragment,/Требует подтверждения|Təsdiq tələb edir|Requires confirmation/);
  if (index===0) assert.match(fragment,/Мастер владения нунчаку/);
  assert.match(fragment,/href="\.\/practices\.html"/);
  assert.match(fragment,/href="\.\/programme\.html"/);
  const images = [...fragment.matchAll(/src="\.\/assets\/([^"]+)"/g)].map(x=>x[1]);
  assert.deepEqual(images,['author.webp','hero.webp','performance.webp']);
  for (const image of images) assert.ok(fs.existsSync(path.join(root,'assets',image)));
 }
});

test('Portrait stays static with reduced motion or rejected autoplay', async () => {
 const events = {};
 const updates = {};
 const attributes = new Map();
 const classes = new Set();
 const media = {matches:true, addEventListener:(_type,callback)=>{updates.motion=callback}};
 let rejectPlay;
 const video = {
  dataset:{src:'./assets/founder-portrait.mp4'},
  hasAttribute:key=>attributes.has(key), removeAttribute:key=>attributes.delete(key), load(){}, pause(){},
  set src(value){attributes.set('src',value)},
  addEventListener:(type,callback)=>{events[type]=callback},
  play:()=>new Promise((_resolve,reject)=>{rejectPlay=reject})
 };
 const portrait = {querySelector:()=>video, classList:{add:key=>classes.add(key),remove:key=>classes.delete(key)}};
 runInNewContext(read('releases/navigation/founder-portrait.js'), {
  document:{querySelector:()=>portrait},window:{matchMedia:()=>media}
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
 }
});
