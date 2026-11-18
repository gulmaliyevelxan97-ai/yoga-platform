const { test } = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync, existsSync } = require('node:fs');
const { resolve, join } = require('node:path');
const { createHash } = require('node:crypto');
const root = resolve(__dirname, '..');
const read = file => readFileSync(join(root,file));

test('Publication includes each philosophy route and project-scoped standalone PWA', () => {
  const html = read('practices.html').toString();
  for (const [route,title] of [['mind','MIND'],['body','BODY'],['nutrition','NUTRITION'],['life','LIFE']]) {
    assert.match(html, new RegExp('href="#ph-'+route+'"'));
    assert.match(html, new RegExp('id="ph-'+route+'"'));
    assert.ok(html.includes('>'+title+'<'));
  }
  assert.match(html, /rel="manifest" href="\.\/manifest\.webmanifest"/);
  const manifest = JSON.parse(read('manifest.webmanifest'));
  for (const key of ['id','start_url','scope']) assert.equal(manifest[key],'./');
  assert.equal(manifest.display,'standalone');
  for (const icon of manifest.icons) assert.ok(read(icon.src).length>1000,icon.src);
});

test('Offline assets match their version and exclude private application files', () => {
  const worker = read('service-worker.js').toString();
  const assets = JSON.parse(worker.match(/const ASSETS = (\[[\s\S]*?\]);/)[1]);
  const digest = createHash('sha256');
  assert.ok(assets.includes('./index.html'));
  for (const asset of assets) {
    assert.match(asset,/^\.\/(?:assets\/|releases\/|[a-z-]+\.html|stage-6\.css|video-|manifest\.webmanifest)/);
    digest.update(read(asset.split('?')[0]));
  }
  assert.ok(worker.includes("const VERSION = '"+digest.digest('hex').slice(0,14)+"'"));
  for (const blocked of ['admin','notification-server','.env']) assert.equal(existsSync(join(root,blocked)),false);
  assert.match(read('releases/pwa/config.js').toString(),/const restartPushApi = '';/);
});

test('School destinations use real project-relative offline pages', () => {
  const rootHTML = read('index.html').toString();
  assert.match(rootHTML, /Не стать другим\. Раскрыть себя/);
  const worker = read('service-worker.js').toString();
  for (const page of ['about','philosophy','code','programme','my-path','practices','journal','progress','participation','week-one','activity']) {
    assert.ok(read(page+'.html').length>100);
    assert.ok(worker.includes('"./'+page+'.html"'));
  }
});

test('Offline requests use the requested page in a GitHub Pages subdirectory', async () => {
  const handlers = {};
  const prefix = 'https://example.test/yoga-platform/';
  const vm = require('node:vm');
  vm.runInNewContext(read('service-worker.js').toString(), {
    URL,
    self: { registration: { scope: prefix }, addEventListener: (event, handler) => handlers[event]=handler },
    caches: { match: async url => url },
    fetch: async () => { throw Error('offline'); }
  });
  for (const page of ['','week-one.html','journal.html','progress.html','practices.html']) {
    let reply;
    handlers.fetch({request:{ url:prefix+page+'?test=1',method:'GET',mode:'navigate' },respondWith: p=>reply=p});
    assert.equal(await reply,prefix+(page||'index.html'));
  }
  let reply;
  handlers.fetch({request:{ url:'https://example.test/progress.html',method:'GET',mode:'navigate' },respondWith: p=>reply=p});
  assert.equal(reply,undefined);
});

test('Navigation revalidates HTML and keeps an offline fallback for temporary server errors', async () => {
  const handlers = {};
  const origin = 'https://example.test/yoga-platform/';
  let status = 200;
  let storedPage = 'offline page';
  let cacheMode;
  require('node:vm').runInNewContext(read('service-worker.js').toString(), {
    URL,
    self: {registration:{scope:origin},addEventListener:(event,handler)=>handlers[event]=handler},
    caches: {match:async()=>storedPage},
    fetch: async (_,options)=>{cacheMode=options.cache;return {status};}
  });
  const navigate = () => {
    let reply;
    handlers.fetch({request:{url:origin+'week-one.html',method:'GET',mode:'navigate'},respondWith:p=>reply=p});
    return reply;
  };
  assert.equal((await navigate()).status,200);
  assert.equal(cacheMode,'no-cache');
  status=404;
  assert.equal((await navigate()).status,404);
  status=503;
  assert.equal(await navigate(),'offline page');
  storedPage=undefined;
  assert.equal((await navigate()).status,503);
});
