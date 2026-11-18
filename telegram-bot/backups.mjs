import { dirname, join } from 'node:path';
import { mkdir, readdir, rename, rm, stat } from 'node:fs/promises';

const snapshotName = /^restart-\d{4}-\d{2}-\d{2}\.sqlite$/;
const exists = path => stat(path).then(() => true, error => {
  if (error.code === 'ENOENT') return false;
  throw error;
});

export async function backupOnce(store, dir, now = new Date()) {
  await mkdir(dir, {recursive:true, mode:0o700});
  const name = `restart-${now.toISOString().slice(0,10)}.sqlite`;
  const file = join(dir,name);
  if (await exists(file)) return false;
  const previous = (await readdir(dir)).filter(entry=>snapshotName.test(entry)).sort();
  const temp = join(dirname(file),'.restart-backup.tmp');
  await rm(temp,{force:true});
  try {
    await store.backup(temp);
    await rename(temp,file);
  } finally { await rm(temp,{force:true}); }
  for (const old of [...previous,name].sort().slice(0,-7)) {
    await rm(join(dir,old));
  }
  return true;
}
