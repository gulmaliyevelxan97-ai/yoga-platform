import assert from 'node:assert/strict';
import test from 'node:test';
import {readFile} from 'node:fs/promises';
import {PGlite} from '@electric-sql/pglite';

test('Public intake reveals the single open named cohort and never changes RLS',async()=>{
 const db=new PGlite();
 try {
  await db.exec(`create role anon; create role authenticated;
   create table public.restart_retreat_cohorts (id uuid primary key, title text not null, admission_open boolean not null);
   alter table public.restart_retreat_cohorts enable row level security;`);
  const migration=await readFile(new URL('../supabase/migrations/20261126001400_retreat_public_intake.sql',import.meta.url),'utf8');
  await db.exec(migration);
  const id='00112233-4455-6677-8899-aabbccddeeff';
  const title='RESTART RETREAT — WHITE & BLACK EXPERIENCE';
  await db.query('insert into public.restart_retreat_cohorts values ($1,$2,false), (gen_random_uuid(),$3,true)',[id,title,'Other retreat']);
  async function check(expected){
   await db.exec('set role anon');
   assert.equal((await db.query('select public.restart_public_retreat_intake() as cohort')).rows[0].cohort,expected);
   await assert.rejects(db.query('select * from public.restart_retreat_cohorts'),{code:'42501'});
   await db.exec('reset role');
  }
  await check(null);
  await db.query('update public.restart_retreat_cohorts set admission_open=true where id=$1',[id]);
  await check(id);
  await db.query('insert into public.restart_retreat_cohorts values (gen_random_uuid(),$1,true)',[title]);
  await check(null);
 } finally {await db.close();}
});
