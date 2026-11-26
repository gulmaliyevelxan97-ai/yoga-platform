import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {randomUUID} from 'node:crypto';
import {PGlite} from '@electric-sql/pglite';

test('Retreat admission defaults closed and only its active cohort mentor can decide on an applicant', async () => {
 const db = new PGlite();
 try {
  await db.exec(`create role anon; create role authenticated;
   create schema auth; create table auth.users(id uuid primary key);
   create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('test.uid',true),'')::uuid $$;
   create function auth.jwt() returns jsonb language sql stable as $$ select jsonb_build_object('is_anonymous',current_setting('test.anon',true)='true') $$;
   grant usage on schema auth to authenticated;`);
  const dir = new URL('../supabase/migrations/',import.meta.url);
  for (const migration of ['00100_retreat_consent','00200_retreat_programme','00300_retreat_admission','00400_retreat_admission_decline']) {
   await db.exec(await readFile(new URL('202611260'+migration+'.sql',dir),'utf8'));
  }

  const [applicant,mentor,peer,otherMentor,cohort,otherCohort,secondApplicant] = Array.from({length:7},randomUUID);
  await db.query('insert into auth.users values ($1),($2),($3),($4),($5)',[applicant,mentor,peer,otherMentor,secondApplicant]);
  await db.query("insert into restart_retreat_cohorts(id,title) values ($1,'Group A'),($2,'Group B')",[cohort,otherCohort]);
  await db.query("insert into restart_retreat_members values ($1,$2,'mentor'),($1,$3,'participant'),($4,$5,'mentor')",
   [cohort,mentor,peer,otherCohort,otherMentor]);

  const asUser = id => db.query("select set_config('test.uid',$1,false)",[id]);
  const submit = (name,group=cohort) => db.query('select restart_submit_retreat_admission($1,$2) as id',[group,name]);
  const approve = id => db.query('select restart_approve_retreat_admission($1)',[id]);
  const decline = id => db.query('select restart_decline_retreat_admission($1)',[id]);
  const requests = async () => (await db.query('select full_name,status from restart_retreat_admissions')).rows;
  const membership = async () => (await db.query('select cohort_id,role from restart_retreat_members')).rows;
  const denied = {code:'42501'};

  await db.exec('set role authenticated');
  await asUser(applicant);
  await assert.rejects(submit('Test Applicant'),denied);
  await db.exec('reset role');
  await db.query('update restart_retreat_cohorts set admission_open=true where id=$1',[cohort]);
  await db.exec('set role authenticated');

  await assert.rejects(submit('Test Applicant',otherCohort),denied);
  await assert.rejects(submit('   '),{code:'22023'});
  await db.query("select set_config('test.anon','true',false)");
  await assert.rejects(submit('Test Applicant'),denied);
  await db.query("select set_config('test.anon','false',false)");
  const [{id}] = (await submit(' Test Applicant ')).rows;
  assert.deepEqual((await submit('Another name')).rows,[{id}]);
  assert.deepEqual(await requests(),[{full_name:'Test Applicant',status:'pending'}]);
  assert.deepEqual(await membership(),[]);
  await assert.rejects(approve(id),denied);
  await assert.rejects(db.query("update restart_retreat_admissions set status='approved'"),denied);

  for (const stranger of [peer,otherMentor]) {
   await asUser(stranger);
   assert.deepEqual(await requests(),[]);
   await assert.rejects(approve(id),denied);
  }

  await asUser(mentor);
  assert.deepEqual(await requests(),[{full_name:'Test Applicant',status:'pending'}]);
  await db.query("select set_config('test.anon','true',false)");
  await assert.rejects(approve(id),denied);
  assert.deepEqual(await requests(),[]);
  await db.query("select set_config('test.anon','false',false)");
  await approve(id);
  await approve(id);
  await asUser(applicant);
  assert.deepEqual(await membership(),[{cohort_id:cohort,role:'participant'}]);
  assert.deepEqual(await requests(),[{full_name:'Test Applicant',status:'approved'}]);

  await asUser(secondApplicant);
  const [{id:secondId}] = (await submit('Second Applicant')).rows;
  await assert.rejects(decline(secondId),denied);
  await asUser(otherMentor);
  await assert.rejects(decline(secondId),denied);
  await asUser(mentor);
  await db.query("select set_config('test.anon','true',false)");
  await assert.rejects(decline(secondId),denied);
  await db.query("select set_config('test.anon','false',false)");
  await assert.rejects(decline(id),{code:'22023'});
  await decline(secondId);
  await decline(secondId);
  await assert.rejects(approve(secondId),{code:'22023'});
  await asUser(secondApplicant);
  assert.deepEqual(await membership(),[]);
  assert.deepEqual(await requests(),[{full_name:'Second Applicant',status:'declined'}]);
  assert.deepEqual((await db.query('select declined_at is not null as has_decision from restart_retreat_admissions')).rows,[{has_decision:true}]);

  await db.exec('reset role; set role anon');
  await assert.rejects(requests(),denied);
  await assert.rejects(submit('Test Applicant'),denied);
  await assert.rejects(approve(id),denied);
  await assert.rejects(decline(secondId),denied);
 } finally {
  await db.close();
 }
});
