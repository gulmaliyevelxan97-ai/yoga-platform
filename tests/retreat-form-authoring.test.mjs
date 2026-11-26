import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {randomUUID} from 'node:crypto';
import {PGlite} from '@electric-sql/pglite';

test('Mentor publishes cohort forms without allowing edits to published questions', async () => {
 const db = new PGlite();
 try {
  await db.exec(`create role anon; create role authenticated; create schema auth;
   create table auth.users(id uuid primary key);
   create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('test.uid',true),'')::uuid $$;
   create function auth.jwt() returns jsonb language sql stable as $$ select jsonb_build_object('is_anonymous',current_setting('test.anon',true)='true') $$;
   grant usage on schema auth to authenticated;`);
  for (const file of ['20261126000100_retreat_consent.sql','20261126000900_retreat_form_authoring.sql']) {
   await db.exec(await readFile(new URL('../supabase/migrations/'+file,import.meta.url),'utf8'));
  }
  const [mentor,participant,outsider,cohort,other] = Array.from({length:5},randomUUID);
  await db.query('insert into auth.users values ($1),($2),($3)',[mentor,participant,outsider]);
  await db.query("insert into restart_retreat_cohorts(id,title) values ($1,'One'),($2,'Two')",[cohort,other]);
  await db.query("insert into restart_retreat_members values ($1,$2,'mentor'),($1,$3,'participant'),($4,$5,'mentor')",[cohort,mentor,participant,other,outsider]);
  await db.exec('set role authenticated');
  const as = id => db.query("select set_config('test.uid',$1,false)",[id]);
  const create = id => db.query("insert into restart_retreat_forms(cohort_id,title,questions) values ($1,'Intention','[]') returning id",[id]);
  await as(participant);
  await assert.rejects(create(cohort),{code:'42501'});
  await as(mentor);
  await assert.rejects(create(other),{code:'42501'});
  const [{id}] = (await create(cohort)).rows;
  await db.query("select set_config('test.anon','true',false)");
  await assert.rejects(create(cohort),{code:'42501'});
  assert.equal((await db.query("update restart_retreat_forms set title='Should not change' where id=$1",[id])).affectedRows,0);
  await db.query("select set_config('test.anon','false',false)");
  await assert.rejects(db.query('update restart_retreat_forms set published=true where id=$1',[id]),{code:'42501'});
  await as(participant);
  assert.equal((await db.query('select id from restart_retreat_forms')).rows.length,0);
  await as(outsider);
  assert.equal((await db.query('update restart_retreat_forms set published=true where id=$1',[id])).affectedRows,0);
  await as(mentor);
  await db.query("update restart_retreat_forms set questions='[{\"text\":\"What do you want to discover?\"}]',published=true where id=$1",[id]);
  assert.equal((await db.query("update restart_retreat_forms set questions='[]' where id=$1",[id])).affectedRows,0);
  assert.equal((await db.query('update restart_retreat_forms set published=false where id=$1',[id])).affectedRows,0);
  await as(participant);
  assert.equal((await db.query('select id from restart_retreat_forms')).rows[0].id,id);
 } finally {
  await db.close();
 }
});
