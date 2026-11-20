import test from 'node:test';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';

const root=new URL('../',import.meta.url);

test('RESTART 2 preserves original tracked media and leaves the public app in local mode',async()=>{
 const base='cf69a6a64154862a6bd6e8e3bdd1ea9ecb7efa60';
 const files=execFileSync('git',['ls-tree','-r','--name-only',base,'assets'],{cwd:root,encoding:'utf8'}).trim().split('\n');
 const media=files.filter(name=>/\.(png|jpe?g|webp|svg|mp4|webm|mov|avif|gif)$/i.test(name));
 assert.ok(media.length>=24);
 for(const file of media) {
  const original=execFileSync('git',['rev-parse',base+':'+file],{cwd:root,encoding:'utf8'});
  const current=execFileSync('git',['hash-object','--',file],{cwd:root,encoding:'utf8'});
  assert.equal(current,original,file);
 }
 assert.equal((await import('../app/cloud-config.mjs')).default,null);
});
