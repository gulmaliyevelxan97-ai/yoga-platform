import test from 'node:test';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {mkdtemp, readFile, writeFile, cp, symlink, rm, mkdir} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {runInNewContext} from 'node:vm';

test('packaged pilot precaches the SDK and every shell resource exists', async () => {
 const root = fileURLToPath(new URL('../',import.meta.url));
 const dir = await mkdtemp(path.join(tmpdir(),'restart-pilot-build-'));
 try {
  for (const sub of ['app','scripts','assets/pwa','assets/brand']) {
   await mkdir(path.dirname(path.join(dir,sub)),{recursive:true});
   await cp(path.join(root,sub),path.join(dir,sub),{recursive:true});
  }
  await symlink(path.join(root,'node_modules'),path.join(dir,'node_modules'),'dir');
  // Offline packaging fixtures only. No connection is made to a Supabase project.
  await writeFile(path.join(dir,'app','.env.local'),'fixture-private-file');
  await writeFile(path.join(dir,'assets/pwa','draft.txt'),'fixture-draft');
  const buildOptions={cwd:dir,env:{...process.env,RESTART_PILOT_OUTPUT:'dist',
   RESTART_SUPABASE_URL:'https://offline-build-fixture.supabase.co',
   RESTART_SUPABASE_PUBLISHABLE_KEY:'sb_publishable_offline_fixture'}};
  execFileSync(process.execPath,['scripts/build-cloud-pilot.mjs'],buildOptions);
  await assert.rejects(readFile(path.join(dir,'dist/app/.env.local')),{code:'ENOENT'});
  await assert.rejects(readFile(path.join(dir,'dist/assets/pwa/draft.txt')),{code:'ENOENT'});
  assert.throws(()=>execFileSync(process.execPath,['scripts/build-cloud-pilot.mjs'],
   {...buildOptions,stdio:'pipe'}),{message:/Pilot output already exists/});
  const script = await readFile(path.join(dir,'dist/app/sw.js'),'utf8');
  // Replacing only an icon must still invalidate the installed worker's cache.
  await writeFile(path.join(dir,'assets/pwa/restart-192.png'),'replacement icon');
  execFileSync(process.execPath,['scripts/build-cloud-pilot.mjs'],{
   ...buildOptions,env:{...buildOptions.env,RESTART_PILOT_OUTPUT:'dist-icon-change'}
  });
  const updated = await readFile(path.join(dir,'dist-icon-change/app/sw.js'),'utf8');
  const version = source => source.match(/const VERSION = 'pilot-[a-f0-9]+';/)?.[0];
  assert(version(script));
  assert(version(updated));
  assert.notEqual(version(script),version(updated));
  const scope = 'https://staging.invalid/app/';
  const handlers = {};
  const requests = [];
  runInNewContext(script,{URL,Request,self:{registration:{scope},
   addEventListener:(name,fn)=>{handlers[name]=fn;}},caches:{open:async()=>({
    addAll:async entries=>requests.push(...entries.map(request=>request.url))
   })}});
  await new Promise(resolve=>handlers.install({waitUntil:resolve}));
  for (const url of [
   'https://offline-build-fixture.supabase.co/rest/v1/restart_journal',
   scope+'rest/v1/restart_journal', scope+'cloud-config.mjs?auth=private'
  ]) {
   handlers.fetch({request:{url,method:'GET',mode:'cors'},
    respondWith:()=>assert.fail('Worker intercepted a private or non-shell request')});
  }
  assert(requests.includes(scope+'supabase-sdk.mjs'));
  for (const url of requests) {
   assert.equal(new URL(url).origin,new URL(scope).origin);
   await readFile(path.join(dir,'dist',new URL(url).pathname));
  }
 } finally {
  await rm(dir,{recursive:true,force:true});
 }
});
