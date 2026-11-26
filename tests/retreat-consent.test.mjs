import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {randomUUID} from 'node:crypto';
import {PGlite} from '@electric-sql/pglite';

test('Retreat programme and answers respect cohort membership and consent; journals remain private', async () => {
 const db = new PGlite();
 try {
  await db.exec(`create role anon; create role authenticated; create role supabase_auth_admin;
   create schema auth; create table auth.users(id uuid primary key);
   create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('test.uid',true),'')::uuid $$;
   create function auth.jwt() returns jsonb language sql stable as $$ select jsonb_build_object('is_anonymous',current_setting('test.anon',true)='true') $$;
   grant usage on schema auth to authenticated;`);
  for (const file of ['20261120000100_restart_student_data.sql','20261126000100_retreat_consent.sql','20261126000200_retreat_programme.sql']) {
   await db.exec(await readFile(new URL('../supabase/migrations/'+file,import.meta.url),'utf8'));
  }
  const [participant,peer,mentor,otherMentor,cohort,otherCohort,form,draft] = Array.from({length:8},randomUUID);
  await db.query('insert into auth.users values ($1),($2),($3),($4)',[participant,peer,mentor,otherMentor]);
  await db.query("insert into restart_retreat_cohorts(id,title) values ($1,'First'),($2,'Second')",[cohort,otherCohort]);
  await db.query("insert into restart_retreat_members values ($1,$2,'participant'),($1,$3,'participant'),($1,$4,'mentor'),($5,$6,'mentor')",
   [cohort,participant,peer,mentor,otherCohort,otherMentor]);
  await db.query("insert into restart_retreat_forms(id,cohort_id,title,questions,published) values ($1,$3,'Published','[]',true),($2,$3,'Draft','[]',false)",[form,draft,cohort]);
  await db.query(`insert into restart_retreat_programme_items(cohort_id,title,starts_at,published) values
   ($1,'First published','2026-11-28T09:00:00+04:00',true),
   ($1,'First draft',null,false),
   ($2,'Second published','2026-11-28T10:00:00+04:00',true)`,[cohort,otherCohort]);
  await assert.rejects(db.query("insert into restart_retreat_programme_items(cohort_id,title,published) values ($1,'Unscheduled publication',true)",[cohort]),{code:'23514'});
  await assert.rejects(db.query(`insert into restart_retreat_programme_items(cohort_id,title,starts_at,ends_at)
   values ($1,'Invalid duration','2026-11-28T09:00:00+04:00','2026-11-28T08:00:00+04:00')`,[cohort]),{code:'23514'});
  const programme = async () => (await db.query('select title from restart_retreat_programme_items order by title')).rows.map(row=>row.title);
  const asUser = id => db.query("select set_config('test.uid',$1,false)",[id]);
  const visible = async () => (await db.query('select id from restart_retreat_responses')).rows.length;
  const submit = id => db.query("insert into restart_retreat_responses(cohort_id,form_id,answers) values ($1,$2,'{}')",[cohort,id]);
  await db.exec('set role authenticated');
  await asUser(participant);
  assert.deepEqual(await programme(),['First published']);
  await assert.rejects(db.query("update restart_retreat_programme_items set published=false"),{code:'42501'});
  assert.equal((await db.query('select id from restart_retreat_forms')).rows.length,1);
  await assert.rejects(submit(draft),{code:'42501'});
  await assert.rejects(db.query("insert into restart_retreat_responses(cohort_id,form_id,answers,share_with_mentor) values ($1,$2,'{}',true)",[cohort,form]),{code:'42501'});
  await submit(form);
  await db.query("insert into restart_journal(client_id,entry_date,notes) values ($1,current_date,'Local fixture')",[randomUUID()]);
  assert.equal(await visible(),1);
  await assert.rejects(db.query("update restart_retreat_members set role='mentor'"),{code:'42501'});
  await asUser(mentor);
  assert.deepEqual(await programme(),['First draft','First published']);
  await assert.rejects(db.query("insert into restart_retreat_programme_items(cohort_id,title) values ($1,'Unauthorized')",[cohort]),{code:'42501'});
  assert.equal(await visible(),0);
  await assert.rejects(submit(form),{code:'42501'});
  await asUser(participant);
  await db.query('update restart_retreat_responses set share_with_mentor=true');
  await asUser(mentor);
  assert.equal(await visible(),1);
  assert.equal((await db.query('select notes from restart_journal')).rows.length,0);
  assert.equal((await db.query('update restart_retreat_responses set share_with_mentor=false')).affectedRows,0);
  await asUser(peer);
  assert.equal(await visible(),0);
  await asUser(otherMentor);
  assert.deepEqual(await programme(),['Second published']);
  assert.equal(await visible(),0);
  await asUser(participant);
  await db.query('update restart_retreat_responses set share_with_mentor=false');
  await asUser(mentor);
  assert.equal(await visible(),0);
  await db.query("select set_config('test.anon','true',false)");
  assert.deepEqual(await programme(),[]);
  await db.exec("reset role; set role anon");
  await assert.rejects(programme(),{code:'42501'});
  await assert.rejects(db.query('select * from restart_retreat_forms'),{code:'42501'});
 } finally {
  await db.close();
 }
});
