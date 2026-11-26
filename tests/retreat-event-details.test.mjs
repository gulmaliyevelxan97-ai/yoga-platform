import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {randomUUID} from 'node:crypto';
import {PGlite} from '@electric-sql/pglite';

test('Retreat event details stay private until a current mentor publishes them to the cohort', async () => {
 const db=new PGlite();
 try {
  await db.exec(`create role anon; create role authenticated;
   create schema auth; create table auth.users(id uuid primary key);
   create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('test.uid',true),'')::uuid $$;
   create function auth.jwt() returns jsonb language sql stable as $$ select jsonb_build_object('is_anonymous',current_setting('test.anon',true)='true') $$;
   grant usage on schema auth to authenticated;`);
  for (const filename of ['20261126000100_retreat_consent','20261126001100_retreat_event_details']) {
   await db.exec(await readFile(new URL('../supabase/migrations/'+filename+'.sql',import.meta.url),'utf8'));
  }

  const [mentor,participant,otherMentor,otherParticipant,cohort,otherCohort]=Array.from({length:6},randomUUID);
  await db.query('insert into auth.users values ($1),($2),($3),($4)',[mentor,participant,otherMentor,otherParticipant]);
  await db.query("insert into restart_retreat_cohorts(id,title) values ($1,'Group'),($2,'Other group')",[cohort,otherCohort]);
  await db.query(`insert into restart_retreat_members values ($1,$2,'mentor'),($1,$3,'participant'),
   ($4,$5,'mentor'),($4,$6,'participant')`,[cohort,mentor,participant,otherCohort,otherMentor,otherParticipant]);
  const signIn=id=>db.query("select set_config('test.uid',$1,false)",[id]);
  const save=(group,revision=null,opts={})=>db.query(
   `select event_date::text,location,dress_code,packing_list,published,revision
    from restart_save_retreat_event_details($1,$2,$3,$4,$5,$6,$7)`,
   [group,revision,opts.date??null,opts.location??null,opts.dress??null,opts.packing??null,opts.publish??false]);
  const read=async()=>(await db.query(
   'select event_date::text,location,dress_code,packing_list,published,revision from restart_retreat_event_details')).rows;
  const denied={code:'42501'};

  await db.exec('set role authenticated');
  await signIn(mentor);
  assert.deepEqual(await read(),[]);
  await assert.rejects(save(otherCohort),denied);
  await assert.rejects(save(cohort,null,{publish:true,location:'   '}),{code:'23514'});
  const draft={event_date:null,location:'Test hall',dress_code:null,packing_list:null,published:false,revision:1};
  assert.deepEqual((await save(cohort,null,{location:' Test hall '})).rows,[draft]);
  await assert.rejects(save(cohort,null,{location:'Duplicate'}),{code:'40001'});
  await assert.rejects(db.query('update restart_retreat_event_details set published=true'),denied);
  await signIn(participant);
  assert.deepEqual(await read(),[]);
  await assert.rejects(save(cohort,1,{publish:true,location:'Changed'}),denied);
  await signIn(mentor);
  const published={...draft,event_date:'2026-11-30',dress_code:'Test clothing',packing_list:'Test mat',published:true,revision:2};
  assert.deepEqual((await save(cohort,1,{
   date:published.event_date,location:published.location,dress:published.dress_code,packing:published.packing_list,publish:true
  })).rows,[published]);
  await assert.rejects(save(cohort,1,{location:'Stale'}),{code:'40001'});
  await signIn(participant);
  assert.deepEqual(await read(),[published]);
  await signIn(otherMentor);
  assert.deepEqual(await read(),[]);
  await assert.rejects(save(cohort,2),denied);
  await signIn(otherParticipant);
  assert.deepEqual(await read(),[]);
  await signIn(mentor);
  await db.query("select set_config('test.anon','true',false)");
  assert.deepEqual(await read(),[]);
  await assert.rejects(save(cohort,2),denied);
  await db.query("select set_config('test.anon','false',false)");
  await save(cohort,2,{date:published.event_date,location:published.location});
  await signIn(participant);
  assert.deepEqual(await read(),[]);
  await db.exec('reset role; set role anon');
  await assert.rejects(read(),denied);
  await assert.rejects(save(cohort),denied);
 } finally {
  await db.close();
 }
});
