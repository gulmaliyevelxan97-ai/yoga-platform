const { test } = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync, existsSync } = require('node:fs');
const { resolve, join } = require('node:path');
const { createHash } = require('node:crypto');
const root = resolve(__dirname, '..');
const read = file => readFileSync(join(root,file));

test('Publication includes each philosophy route and project-scoped standalone PWA', () => {
  const html = read('index.html').toString();
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
    assert.match(asset,/^\.\/(?:assets\/|releases\/|index\.html|stage-6\.css|video-|manifest\.webmanifest)/);
    digest.update(read(asset.split('?')[0]));
  }
  assert.ok(worker.includes("const VERSION = '"+digest.digest('hex').slice(0,14)+"'"));
  for (const blocked of ['admin','notification-server','.env']) assert.equal(existsSync(join(root,blocked)),false);
  assert.match(read('releases/pwa/config.js').toString(),/const restartPushApi = '';/);
});
