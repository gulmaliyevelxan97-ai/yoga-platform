import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile,readdir} from 'node:fs/promises';
import {PGlite} from '@electric-sql/pglite';
import {initialState} from '../app/state.mjs';
import {importBatches} from '../app/cloud-data.mjs';
import {cloudAccount,createPilotClient} from '../app/cloud-auth.mjs';

const personA = '1c3a630d-bb23-4ad8-89c2-188ba7f0df09';
const personB = '735df12d-cd83-46b3-a4c7-c7dab009a2aa';
const journalId = '79529faa-6a8f-462b-8be8-94d65d433974';
const practiceId = 'fa00dd3a-a867-4011-9339-e3593d2da767';
const local = {...initialState(),name:'Pilot A',goal:4,
 journal:[{id:journalId,date:'2026-11-20',mood:'1',energy:'2',wellbeing:'3',before:'before',after:'after',notes:'private note'}],
 sessions:[{id:practiceId,practice:'breathing',day:'2026-11-20',seconds:120}]
};
const fixtures = new URL('../supabase/migrations/',import.meta.url);

test('PostgreSQL migrations enforce private CRUD, pilot signup and idempotent import', async ()=>{
 const db = new PGlite();
 try {
  await db.exec(`
  create role anon;
  create role authenticated;
  create role supabase_auth_admin;
  create schema auth;
  create table auth.users(id uuid primary key);
  create function auth.uid() returns uuid language sql stable
    as $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
  create function auth.jwt() returns jsonb language sql stable
    as $$ select nullif(current_setting('request.jwt.claims', true), '')::jsonb $$;
  grant usage on schema auth to anon, authenticated;
  insert into auth.users values ('${personA}'),('${personB}');`);
  const preflight = await readFile(new URL('../supabase/checks/preflight.sql',import.meta.url),'utf8');
  assert.deepEqual((await db.query(preflight)).rows,[]);
  await db.exec("create type public.restart_profiles as enum ('collision')");
  assert.deepEqual((await db.query(preflight)).rows,[{issue:'already exists', object_name:'public.restart_profiles'}]);
  await db.exec('drop type public.restart_profiles');
  for (const file of (await readdir(fixtures)).sort()) {
   await db.exec(await readFile(new URL(file,fixtures),'utf8'));
  }
  assert((await db.query(preflight)).rows.some(row=>row.object_name==='restart_private'));
  const role = async (name, id='', anonymous=false) => {
   await db.exec('reset role; set role '+name);
   await db.query("select set_config('request.jwt.claim.sub',$1,false), set_config('request.jwt.claims',$2,false)",
    [id,JSON.stringify({is_anonymous:anonymous})]);
  };
  const importFor = async payload => (await db.query('select public.restart_import_local($1) as imported',[JSON.stringify(payload)])).rows[0].imported;
  const records = ['profiles','goals','settings','practice_events','journal'];
  const [payload] = importBatches(local,personA);
  await role('anon');
  for (const suffix of records) await assert.rejects(db.query('select * from public.restart_'+suffix), {code:'42501'});
  await assert.rejects(importFor(payload),{code:'42501'});

  await role('authenticated',personA);
  assert.deepEqual(await importFor(payload),{journal:1,practices:1});
  assert.deepEqual(await importFor(payload),{journal:0,practices:0});
  await role('authenticated',personA,true);
  for (const suffix of records) {
   assert.deepEqual((await db.query('select * from public.restart_'+suffix)).rows,[]);
   assert.deepEqual((await db.query('update public.restart_'+suffix+' set user_id=user_id returning user_id')).rows,[]);
  }
  await assert.rejects(importFor(payload),{code:'42501'});
  await assert.rejects(db.query("insert into public.restart_journal (client_id,entry_date) values ($1,'2026-11-20')",[practiceId]),{code:'42501'});
  await role('authenticated',personA);
  assert.equal((await db.query('select display_name from public.restart_profiles')).rows[0].display_name,'Pilot A');
  const update = await db.query("update public.restart_journal set notes='new' where revision=1 returning revision");
  assert.equal(update.rows[0].revision,2);
  const versionAfterSpoof = await db.query('update public.restart_profiles set revision=999 returning revision');
  assert.equal(versionAfterSpoof.rows[0].revision,2);
  assert.equal((await db.query("update public.restart_journal set notes='stale' where revision=1 returning revision")).rows.length,0);
  await assert.rejects(db.query('update public.restart_goals set user_id=$1',[personB]),{code:'42501'});
  await assert.rejects(db.query("insert into public.restart_practice_events (user_id,client_id,practice,practice_day,seconds) values ($1,$2,'yoga','2026-11-20',1)",[personB,practiceId]),{code:'42501'});
  await assert.rejects(db.query("update public.restart_journal set deleted=true"),{code:'23514'});
  const deleted = await db.query("update public.restart_journal set deleted=true, notes='', before_note='', after_note='', mood=0, energy=0, wellbeing=0 where revision=2 returning revision");
  assert.equal(deleted.rows[0].revision,3);
  await assert.rejects(db.query("update public.restart_journal set client_id=$1",[practiceId]),{code:'22023'});
  assert.deepEqual(await importFor(payload),{journal:0,practices:0});
  assert.deepEqual((await db.query('select notes, deleted from public.restart_journal')).rows,[{notes:'',deleted:true}]);
  await assert.rejects(db.query("update public.restart_journal set deleted=false"),{code:'22023'});
  await assert.rejects(db.query('delete from public.restart_journal'),{code:'42501'});
  await assert.rejects(db.query('select * from restart_private.pilot_emails'),{code:'42501'});
  await assert.rejects(db.query("select public.restart_before_user_created('{}')"),{code:'42501'});

  await role('authenticated',personB);
  for (const suffix of records) {
   assert.deepEqual((await db.query('select * from public.restart_'+suffix)).rows,[]);
   assert.deepEqual((await db.query('update public.restart_'+suffix+' set user_id=user_id returning user_id')).rows,[]);
  }
  assert.deepEqual((await db.query("update public.restart_journal set notes='foreign' returning *")).rows,[]);
  await assert.rejects(importFor(payload),{code:'42501'});
  const malformed = {...payload,expected_user:personB,goal:{weekly_count:100}};
  await assert.rejects(importFor(malformed),{code:'23514'});
  assert.deepEqual((await db.query('select display_name from public.restart_profiles')).rows,[]);
  assert.deepEqual(await importFor({...payload,expected_user:personB}),{journal:1,practices:1});
  assert.equal((await db.query('select notes from public.restart_journal')).rows[0].notes,'private note');


  await db.exec("reset role; insert into restart_private.pilot_emails values ('tester@example.invalid')");
  await role('supabase_auth_admin');
  const check = async email => (await db.query('select public.restart_before_user_created($1) as result',
    [JSON.stringify({user:{email}})])).rows[0].result;
  assert.deepEqual(await check('TESTER@example.invalid'),{});
  assert.equal((await check('outsider@example.invalid')).error.http_code,403);
 } finally {
  await db.close();
 }
});

test('Migration payloads keep stable record IDs and never modify local originals',()=>{
 const old = structuredClone(local);
 const batches = importBatches({...local,journal:[...local.journal,{...local.journal[0],id:practiceId}]},personA,1);
 assert.equal(batches.length,2);
 assert.equal(batches[0].journal[0].client_id,journalId);
 assert.equal(batches[0].practices[0].client_id,practiceId);
 assert.equal(batches[1].journal[0].client_id,practiceId);
 assert(!('profile' in batches[1]));
 assert.deepEqual(local,old);
});

test('Pilot Auth uses PKCE and recovery cannot read student rows before a password reset',async()=>{
 const options = createPilotClient((_url,_key,value)=>value,{});
 assert.equal(options.auth.flowType,'pkce');
 assert.equal(options.auth.detectSessionInUrl,false);
 const original = {location:globalThis.location,history:globalThis.history,sessionStorage:globalThis.sessionStorage};
 const values = new Map();
 const calls = [];
 globalThis.location = {href:'https://pilot.example.invalid/app/?code=fixture'};
 globalThis.history = {replaceState:(_state,_title,path)=>calls.push(path)};
 globalThis.sessionStorage = {setItem:(name,value)=>values.set(name,value),removeItem:name=>values.delete(name),getItem:name=>values.get(name)};
 const user = {id:personA,email:'tester@example.invalid'};
 const client = {from:()=>assert.fail('Recovery state read student records'),auth:{
  exchangeCodeForSession:async code=>({data:{session:{user},redirectType:code==='fixture'?'recovery':null}}),
  getSession:async()=>({data:{session:{user}}}),
  onAuthStateChange:()=>{}, updateUser:async({password})=>{calls.push(password);return {data:{user}};},
  signOut:async()=>{calls.push('signout');return {};}
 }};
 try {
  const account = cloudAccount(client,()=>{},()=> 'ru');
  assert.equal(await account.action('password',{password:'rejected'}),false);
  await account.init();
  assert.equal(account.recovery,true);
  assert.equal(account.state,null);
  assert.equal(await account.action('password',{password:'local-test-password'}),true);
  assert.equal(account.user,null);
  assert.equal(account.notice,'cloudPasswordSaved');
  assert.deepEqual(calls,['/app/#account','local-test-password','signout']);
 } finally {Object.assign(globalThis,original);}
});

test('Maximum escaped note content stays below the database import byte limit', () => {
 const text = '\u0001'.repeat(2000);
 const journal = Array.from({length:100},()=>({...local.journal[0],before:text,after:text,notes:text}));
 const batches = importBatches({...local,journal},personA);
 assert.equal(batches.length,2);
 assert(batches.every(batch=>Buffer.byteLength(JSON.stringify(batch))<1999000));
});
