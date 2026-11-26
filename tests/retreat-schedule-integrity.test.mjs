import assert from 'node:assert/strict';
import test from 'node:test';
import {readFile} from 'node:fs/promises';
import {randomUUID} from 'node:crypto';
import {PGlite} from '@electric-sql/pglite';
import {btree_gist} from '@electric-sql/pglite/contrib/btree_gist';

test('Database enforces cohort schedule integrity on publishing and rescheduling',async()=>{
 const db=new PGlite({extensions:{btree_gist}});
 try {
  await db.exec(`create role anon; create role authenticated;
   create schema auth; create table auth.users(id uuid primary key);
   create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('test.uid',true),'')::uuid $$;
   create function auth.jwt() returns jsonb language sql stable as $$ select '{}'::jsonb $$;
   grant usage on schema auth to authenticated;`);
  for (const name of ['00100_retreat_consent','00200_retreat_programme','00500_retreat_programme_editor','00600_retreat_published_schedule','01300_retreat_schedule_integrity']) {
   await db.exec(await readFile(new URL('../supabase/migrations/202611260'+name+'.sql',import.meta.url),'utf8'));
  }
  const [mentor,group,other]=Array.from({length:3},randomUUID);
  await db.query('insert into auth.users values ($1)',[mentor]);
  await db.query("insert into restart_retreat_cohorts(id,title) values ($1,'Group'),($2,'Other')",[group,other]);
  await db.query("insert into restart_retreat_members values ($1,$3,'mentor'),($2,$3,'mentor')",[group,other,mentor]);
  await db.query("select set_config('test.uid',$1,false)",[mentor]);
  await db.exec('set role authenticated');
  const time=value=>value && '2026-12-01T'+value+':00+04:00';
  const save=async (cohort,start,end,item)=> (await db.query(
   "select id,revision from restart_save_retreat_programme_item($1,$2,$3,'Activity','',$4,$5)",
   [cohort,item?.id??null,item?.revision??null,time(start),time(end)])).rows[0];
  const publish=async (cohort,item)=> (await db.query(
   'select id,revision from restart_publish_retreat_programme_item($1,$2,$3)',
   [cohort,item.id,item.revision])).rows[0];
  await publish(group,await save(group,'10:00','11:00'));
  const clash=await save(group,'10:30',null);
  await assert.rejects(publish(group,clash),{code:'23P01'});
  const adjacent=await publish(group,await save(group,'11:00',null));
  await assert.rejects(save(group,'10:59',null,adjacent),{code:'23P01'});
  await assert.rejects(publish(group,await save(group,'11:00',null)),{code:'23P01'});
  await publish(other,await save(other,'10:30','11:30'));
  const {rows}=await db.query('select published,revision from restart_retreat_programme_items where id=$1',[clash.id]);
  assert.deepEqual(rows,[{published:false,revision:clash.revision}]);
 } finally {
  await db.close();
 }
});
