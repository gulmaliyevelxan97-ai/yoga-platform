import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {randomUUID} from 'node:crypto';
import {PGlite} from '@electric-sql/pglite';

test('Retreat tasks isolate groups and individual recipients; only cohort mentors write and review explicit submissions', async () => {
 const db = new PGlite();
 try {
  await db.exec(`create role anon; create role authenticated;
   create schema auth; create table auth.users(id uuid primary key);
   create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('test.uid',true),'')::uuid $$;
   create function auth.jwt() returns jsonb language sql stable as $$ select jsonb_build_object('is_anonymous',current_setting('test.anon',true)='true') $$;
   grant usage on schema auth to authenticated;`);
  for (const migration of ['20261126000100_retreat_consent','20261126000700_retreat_assignments','20261126001000_retreat_assignment_submissions']) {
   await db.exec(await readFile(new URL('../supabase/migrations/'+migration+'.sql',import.meta.url),'utf8'));
  }

  const [mentor,participant,peer,otherMentor,otherParticipant,cohort,otherCohort] = Array.from({length:7},randomUUID);
  await db.query('insert into auth.users values ($1),($2),($3),($4),($5)',[mentor,participant,peer,otherMentor,otherParticipant]);
  await db.query("insert into restart_retreat_cohorts(id,title) values ($1,'Group A'),($2,'Group B')",[cohort,otherCohort]);
  await db.query(`insert into restart_retreat_members values ($1,$2,'mentor'),($1,$3,'participant'),($1,$4,'participant'),
   ($5,$6,'mentor'),($5,$7,'participant')`,[cohort,mentor,participant,peer,otherCohort,otherMentor,otherParticipant]);

  const signIn = id => db.query("select set_config('test.uid',$1,false)",[id]);
  const save = (group,recipient,title,item=null,revision=null) => db.query(
   'select id,revision from restart_save_retreat_assignment($1,$2,$3,$4,$5,$6,null)',
   [group,item,revision,recipient,title,'Test instructions']);
  const tasks = async () => (await db.query('select title from restart_retreat_assignments order by title')).rows.map(row=>row.title);
  const submit = (group,assignment,response,share=true) => db.query(
   'select id,revision,status from restart_submit_retreat_assignment($1,$2,$3,$4)',[group,assignment,response,share]);
  const review = (group,id,revision,feedback) => db.query(
   'select id,revision,status from restart_review_retreat_assignment($1,$2,$3,$4)',[group,id,revision,feedback]);
  const submissions = async () => (await db.query('select response,status,feedback from restart_retreat_assignment_submissions order by response')).rows;
  const denied = {code:'42501'};

  await db.exec('set role authenticated');
  await signIn(mentor);
  const [{id:groupTask}] = (await save(cohort,null,'Group task')).rows;
  const [{id}] = (await save(cohort,participant,'Individual task')).rows;
  await assert.rejects(save(cohort,otherParticipant,'Cross-group recipient'),denied);
  await assert.rejects(save(cohort,mentor,'Mentor recipient'),denied);
  await assert.rejects(save(cohort,null,'Disclosure',id,1),{code:'40001'});
  await assert.rejects(save(cohort,peer,'Reassignment',id,1),{code:'40001'});
  assert.deepEqual((await save(cohort,participant,'Updated individual task',id,1)).rows,[{id,revision:2}]);
  await assert.rejects(save(cohort,participant,'Stale edit',id,1),{code:'40001'});
  assert.deepEqual(await tasks(),['Group task','Updated individual task']);
  await assert.rejects(db.query('update restart_retreat_assignments set instructions=\'Direct write\''),denied);
  await signIn(participant);
  assert.deepEqual(await tasks(),['Group task','Updated individual task']);
  await assert.rejects(save(cohort,participant,'Self assigned'),denied);
  await assert.rejects(submit(cohort,id,'Unshared response',false),{code:'22023'});
  const [{id:submission}] = (await submit(cohort,id,'Individual response')).rows;
  assert.deepEqual((await submit(cohort,id,'Individual response')).rows,[{id:submission,revision:1,status:'submitted'}]);
  await assert.rejects(submit(cohort,id,'Changed retry'),{code:'40001'});
  await assert.rejects(review(cohort,submission,1,'Self review'),denied);
  await signIn(peer);
  assert.deepEqual(await tasks(),['Group task']);
  assert.deepEqual(await submissions(),[]);
  await assert.rejects(submit(cohort,id,'Peer answer'),denied);
  await submit(cohort,groupTask,'Group response');
  await signIn(otherMentor);
  assert.deepEqual(await tasks(),[]);
  await assert.rejects(save(cohort,participant,'Other mentor edit',id,2),denied);
  await assert.rejects(save(otherCohort,null,'Other-cohort id',id,2),{code:'40001'});
  assert.deepEqual(await submissions(),[]);
  await assert.rejects(review(cohort,submission,1,'Foreign review'),denied);
  await assert.rejects(review(otherCohort,submission,1,'Foreign review'),{code:'40001'});
  await signIn(mentor);
  assert.equal((await submissions()).length,2);
  await assert.rejects(submit(cohort,groupTask,'Mentor response'),denied);
  await assert.rejects(review(cohort,submission,1,'  '),{code:'23514'});
  assert.deepEqual((await review(cohort,submission,1,'Private feedback')).rows,[{id:submission,revision:2,status:'reviewed'}]);
  await assert.rejects(review(cohort,submission,1,'Stale feedback'),{code:'40001'});
  await assert.rejects(db.query("update restart_retreat_assignment_submissions set feedback='Direct'"),denied);
  await signIn(participant);
  assert.deepEqual(await submissions(),[{response:'Individual response',status:'reviewed',feedback:'Private feedback'}]);
  await signIn(peer);
  assert.deepEqual(await submissions(),[{response:'Group response',status:'submitted',feedback:null}]);
  await signIn(mentor);
  await db.query("select set_config('test.anon','true',false)");
  assert.deepEqual(await submissions(),[]);
  await assert.rejects(review(cohort,submission,2,'Anonymous feedback'),denied);
  assert.deepEqual(await tasks(),[]);
  await assert.rejects(save(cohort,null,'Anonymous mentor task'),denied);

  await db.exec('reset role');
  await db.query('delete from restart_retreat_members where cohort_id=$1 and user_id=$2',[cohort,participant]);
  await db.query("insert into restart_retreat_members values ($1,$2,'participant')",[cohort,participant]);
  await db.exec('set role authenticated');
  await db.query("select set_config('test.anon','false',false)");
  await signIn(participant);
  assert.deepEqual(await tasks(),['Group task']);
  assert.deepEqual(await submissions(),[]);
  await db.exec('reset role; set role anon');
  await assert.rejects(tasks(),denied);
  await assert.rejects(submissions(),denied);
  await assert.rejects(submit(cohort,groupTask,'Guest response'),denied);
  await assert.rejects(save(cohort,null,'Guest task'),denied);
 } finally {
  await db.close();
 }
});
