import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {randomUUID} from 'node:crypto';
import {PGlite} from '@electric-sql/pglite';

test('Retreat transport isolates direct messages, announcements and personal unread state', async () => {
 const db = new PGlite();
 try {
  await db.exec(`create role anon; create role authenticated;
   create schema auth; create table auth.users(id uuid primary key);
   create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('test.uid',true),'')::uuid $$;
   create function auth.jwt() returns jsonb language sql stable as $$ select jsonb_build_object('is_anonymous',current_setting('test.anon',true)='true') $$;
   grant usage on schema auth to authenticated;`);
  for (const file of ['20261126000100_retreat_consent.sql','20261126000800_retreat_messaging.sql']) {
   await db.exec(await readFile(new URL('../supabase/migrations/'+file,import.meta.url),'utf8'));
  }

  const [participant,peer,mentor,peerMentor,otherMentor,outsider,cohort,otherCohort] = Array.from({length:8},randomUUID);
  await db.query('insert into auth.users values ($1),($2),($3),($4),($5),($6)',[participant,peer,mentor,peerMentor,otherMentor,outsider]);
  await db.query("insert into restart_retreat_cohorts(id,title) values ($1,'First'),($2,'Second')",[cohort,otherCohort]);
  await db.query(`insert into restart_retreat_members values
   ($1,$2,'participant'),($1,$3,'participant'),($1,$4,'mentor'),($1,$5,'mentor'),($6,$7,'mentor')`,
   [cohort,participant,peer,mentor,peerMentor,otherCohort,otherMentor]);

  const asUser = id => db.query("select set_config('test.uid',$1,false)",[id]);
  const send = async (group,to,body,clientId=randomUUID()) => (await db.query(
   'select restart_send_retreat_message($1,$2,$3,$4) as id',[group,to,body,clientId])).rows[0].id;
  const read = id => db.query('select restart_mark_retreat_message_read($1)',[id]);
  const unread = async group => Number((await db.query(
   'select restart_retreat_unread_count($1) as total',[group])).rows[0].total);
  const visible = async () => (await db.query(
   'select body from restart_retreat_messages order by body')).rows.map(row=>row.body);
  const receipts = async () => (await db.query(
   'select message_id from restart_retreat_message_reads')).rows.map(row=>row.message_id);

  await db.exec('set role authenticated');
  await asUser(mentor);
  const clientId = randomUUID();
  const direct = await send(cohort,participant,'  Check-in  ',clientId);
  assert.equal(await send(cohort,participant,'Check-in',clientId),direct);
  await assert.rejects(send(cohort,participant,'Changed check-in',clientId),{code:'22023'});
  const announcement = await send(cohort,null,'Schedule update');
  await assert.rejects(send(cohort,peerMentor,'Staff messages are outside this transport'),{code:'42501'});
  await assert.rejects(send(otherCohort,null,'Wrong cohort'),{code:'42501'});
  await assert.rejects(send(cohort,participant,'\t\n'),{code:'22023'});
  await assert.rejects(send(cohort,participant,'x'.repeat(4001)),{code:'22023'});
  await assert.rejects(read(direct),{code:'42501'});
  assert.equal(await unread(cohort),0);

  await asUser(participant);
  assert.deepEqual(await visible(),['Check-in','Schedule update']);
  assert.equal(await unread(cohort),2);
  await assert.rejects(send(cohort,null,'A participant cannot post to a group'),{code:'42501'});
  await assert.rejects(send(cohort,peer,'A participant cannot message a peer'),{code:'42501'});
  await assert.rejects(send(cohort,otherMentor,'Cohort crossing'),{code:'42501'});
  await assert.rejects(send(cohort,participant,'Self message'),{code:'42501'});
  await assert.rejects(db.query(`insert into restart_retreat_messages(cohort_id,sender_id,recipient_id,body)
   values ($1,$2,$3,'Forged')`,[cohort,mentor,participant]),{code:'42501'});
  await read(direct);
  await read(direct);
  assert.deepEqual(await receipts(),[direct]);
  assert.equal(await unread(cohort),1);
  const reply = await send(cohort,mentor,'Private reply',clientId);
  await assert.rejects(db.query('select client_id from restart_retreat_messages'),{code:'42501'});
  assert.equal(await unread(cohort),1);
  await assert.rejects(db.query('update restart_retreat_messages set body=$1 where id=$2',['Other',reply]),{code:'42501'});

  await asUser(peer);
  assert.deepEqual(await visible(),['Schedule update']);
  assert.equal(await unread(cohort),1);
  await assert.rejects(read(direct),{code:'42501'});
  await assert.rejects(db.query('insert into restart_retreat_message_reads(message_id,reader_id) values ($1,$2)',
   [announcement,participant]),{code:'42501'});
  await read(announcement);
  assert.deepEqual(await receipts(),[announcement]);
  assert.equal(await unread(cohort),0);

  await asUser(peerMentor);
  assert.deepEqual(await visible(),['Schedule update']);
  await asUser(mentor);
  assert.deepEqual(await visible(),['Check-in','Private reply','Schedule update']);
  assert.deepEqual(await receipts(),[]);
  assert.equal(await unread(cohort),1);

  await asUser(otherMentor);
  const isolated = await send(otherCohort,null,'Second cohort welcome');
  assert.deepEqual(await visible(),['Second cohort welcome']);
  assert.equal(await unread(cohort),0);
  await asUser(outsider);
  assert.deepEqual(await visible(),[]);
  await assert.rejects(read(isolated),{code:'42501'});
  await assert.rejects(send(cohort,mentor,'Outside the group'),{code:'42501'});

  await asUser(mentor);
  await db.exec("select set_config('test.anon','true',false)");
  assert.deepEqual(await visible(),[]);
  await assert.rejects(send(cohort,null,'Guest bypass'),{code:'42501'});
  await db.exec("select set_config('test.anon','false',false); reset role; set role anon");
  await assert.rejects(visible(),{code:'42501'});
  await assert.rejects(send(cohort,null,'Anonymous role'),{code:'42501'});

  await db.exec('reset role');
  await db.query('delete from restart_retreat_members where cohort_id=$1 and user_id=$2',[cohort,participant]);
  await db.exec('set role authenticated');
  await asUser(participant);
  assert.deepEqual(await visible(),[]);
  assert.deepEqual(await receipts(),[]);
  await asUser(mentor);
  assert.deepEqual(await visible(),['Schedule update']);
 } finally {
  await db.close();
 }
});
