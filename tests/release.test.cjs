const {test}=require('node:test');
const assert=require('node:assert/strict');
const {readFileSync,existsSync}=require('node:fs');
const {join,resolve}=require('node:path');
const {createHash}=require('node:crypto');
const vm=require('node:vm');
const root=resolve(__dirname,'..');
const read=file=>readFileSync(join(root,file),'utf8');
const readStudio=name=>read('releases/stages-4-5/'+name);
const html=read('index.html');
test('Each script and stylesheet carries its content fingerprint',()=>{
  const urls=[...html.matchAll(/(?:src|href)="\.\/([^"?]+\.(?:js|css))\?v=([a-f0-9]+)"/g)];
  const assets = [...html.matchAll(/(?:src|href)="\.\/[^"]+\.(?:js|css)(?:\?[^"]*)?"/g)];
  assert.equal(urls.length,assets.length);
  assert.ok(urls.length >= 5);
  for(const [,file,hash] of urls)assert.equal(hash,createHash('sha256').update(read(file)).digest('hex').slice(0,12));
});
test('Static fallback contains the founder and all local images exist',()=>{
  assert.match(html,/id="founderTitle"[^>]*>Elxan Gülmalıyev/);
  assert.match(html,/Yetenek Sizsiniz Türkiye/);
  for(const [,file] of html.matchAll(/src="\.\/(assets\/[^"]+)"/g))assert.ok(existsSync(join(root,file)),file);
});
test('Every programme references available modules, translations and a real teacher',()=>{
  const data=vm.runInNewContext(['languages.js','studio.js','pathways.js'].map(readStudio).concat(read('video-labels.js')).join('\n')+'\n;({programmes,practices,teachers,phrases,lessonsByLanguage})');
  const ids=new Set(data.practices.map(p=>p.id));
  assert.equal(ids.size,6);assert.equal(new Set(data.programmes.map(c=>c.area)).size,7);
  for(const row of Object.values(data.phrases)){assert.equal(row.length,3);assert.ok(row.every(v=>typeof v==='string'&&v.trim()));}
  for(const [,key] of html.matchAll(/data-t="([^"]+)"/g))assert.ok(data.phrases[key],key);
  for(const c of data.programmes){
    assert.ok(data.teachers[c.teacher]);assert.ok(data.phrases[c.title]);
    for(const id of c.lessons){
      assert.ok(ids.has(id));const [group,index]=id.split('/');
      for(const lang of ['ru','az','en'])assert.equal(data.lessonsByLanguage[lang][group].lessons[index-1][2].length,3);
    }
  }
});
test('Weekly planner honours all filters and an empty intersection',()=>{
  const context=vm.createContext({});
  vm.runInContext(['languages.js','studio.js','pathways.js'].map(readStudio).join('\n'),context);
  assert.equal(vm.runInContext("matchesPlan({area:'yoga',level:'basic',goal:'movement'})[0].id",context),'yoga/1');
  assert.equal(vm.runInContext("matchesPlan({area:'yoga',level:'basic',goal:'release'}).length",context),0);
  assert.equal(vm.runInContext('monday(new Date(2026,10,22,15)).getDate()',context),16);
});
test('Completion counts only modules finished within that programme',()=>{
  const scripts=['languages.js','studio.js','pathways.js'].map(readStudio).join('\n');
  const expression="courseDone(programmes[0],[{group:'yoga',index:0},{group:'yoga',index:1,course:'yoga'},{group:'yoga',index:1,course:'yoga'}])";
  assert.deepEqual(Array.from(vm.runInNewContext(scripts+'\n'+expression)),['yoga/2']);
});
