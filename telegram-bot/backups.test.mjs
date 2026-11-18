import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawn, spawnSync } from 'node:child_process';
import { once } from 'node:events';
import { mkdtemp, readdir, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { backupOnce } from './backups.mjs';
import { openStore } from './store.mjs';

test('Online SQLite backup preserves committed WAL data and rotates old copies',async()=>{
  const dir=await mkdtemp(join(tmpdir(),'restart-backup-'));
  const store=openStore(join(dir,'source.sqlite'));
  const backups=join(dir,'snapshots');
  try {
    store.member(112,'az');
    store.setEnabled(112,true);
    store.advance(777);
    for (let day=1; day<=8; day++) {
      const date=new Date(Date.UTC(2026,0,day));
      assert.equal(await backupOnce(store,backups,date),true);
      assert.equal(await backupOnce(store,backups,date),false);
    }
    const files=(await readdir(backups)).sort();
    assert.equal(files.length,7);
    assert.equal(files[0],'restart-2026-01-02.sqlite');
    const restored=openStore(join(backups,files.at(-1)));
    try {
      assert.equal(restored.offset(),777);
      assert.equal(restored.member(112).lang,'az');
      assert.equal(restored.member(112).enabled,1);
    } finally {restored.close();}
  } finally {
    store.close();
    await rm(dir,{recursive:true,force:true});
  }
});
test('Kernel lock rejects a second poller and releases on termination',{
  skip:spawnSync('flock',['--version']).status!==0
},async()=>{
  const dir=await mkdtemp(join(tmpdir(),'restart-poller-'));
  const args=['--nonblock','--no-fork','--conflict-exit-code','75',join(dir,'polling.lock'),process.execPath];
  const first=spawn('flock',[...args,'-e',"console.log('locked');setInterval(()=>{},1000)"],{stdio:['ignore','pipe','ignore']});
  try {
    const [ready]=await once(first.stdout,'data');
    assert.match(String(ready),/locked/);
    assert.equal(spawnSync('flock',[...args,'-e','process.exit(0)']).status,75);
    const exited=once(first,'exit');first.kill();await exited;
    assert.equal(spawnSync('flock',[...args,'-e','process.exit(0)']).status,0);
  } finally {first.kill();await rm(dir,{recursive:true,force:true});}
});
