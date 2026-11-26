import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {randomUUID} from 'node:crypto';
import {PGlite} from '@electric-sql/pglite';
import {readRetreatControlAccess,retreatControlSection} from '../app/retreat-control.mjs';
import {programmeOverlaps} from '../app/retreat-programme-editor.mjs';

test('Control Center distinguishes owner, assigned mentor and participant',async()=>{
 const client=(role,memberships)=>({from(table){
  const query={select:()=>query,eq:()=>query,maybeSingle:()=>({data:role}),
   then:resolve=>resolve({data:memberships})};
  assert.ok(['restart_school_roles','restart_retreat_members'].includes(table));
  return query;
 }});
 assert.equal(await readRetreatControlAccess(null,{id:'guest',is_anonymous:true}),null);
 assert.equal(await readRetreatControlAccess(client({role:'admin'},[]),{id:'admin'}),null);
 assert.deepEqual(await readRetreatControlAccess(client({role:'owner'},[]),{id:'owner'}),{founder:true,hasCohorts:false});
 assert.deepEqual(await readRetreatControlAccess(client(null,[{}]),{id:'mentor'}),{founder:false,hasCohorts:true});
 assert.equal(retreatControlSection('__proto__'),'events');
});

test('Programme overlap warnings ignore other groups, drafts and adjacent items',()=>{
 const item={id:'one',cohort_id:'a',published:true,starts_at:'2026-11-01T10:00Z',ends_at:'2026-11-01T11:00Z'};
 const candidate=(start,end,other={})=>({p_cohort_id:'a',p_starts_at:'2026-11-01T'+start+'Z',p_ends_at:end?'2026-11-01T'+end+'Z':null,...other});
 assert.equal(programmeOverlaps([item],candidate('09:30','10:20')),true);
 assert.equal(programmeOverlaps([item],candidate('10:30')),true);
 assert.equal(programmeOverlaps([item],candidate('11:00','12:00')),false);
 assert.equal(programmeOverlaps([item],candidate('10:30',null,{p_item_id:'one'})),false);
 assert.equal(programmeOverlaps([item],candidate('10:30',null,{p_cohort_id:'b'})),false);
 assert.equal(programmeOverlaps([{...item,published:false}],candidate('10:00')),false);
});

test('Only the authenticated founder creates a retreat and its mentor membership atomically',async()=>{
 const db=new PGlite();
 try {
  await db.exec(`create role anon; create role authenticated;
   create schema auth; create table auth.users(id uuid primary key);
   create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('test.uid',true),'')::uuid$$;
   create function auth.jwt() returns jsonb language sql stable as $$select jsonb_build_object('is_anonymous',current_setting('test.anon',true)='true')$$;
   grant usage on schema auth to authenticated;
   create table public.restart_school_roles(user_id uuid primary key, role text not null);`);
  for (const filename of ['20261126000100_retreat_consent','20261126001200_retreat_founder_control']) {
   await db.exec(await readFile(new URL('../supabase/migrations/'+filename+'.sql',import.meta.url),'utf8'));
  }
  const [owner,admin,participant]=Array.from({length:3},randomUUID);
  await db.query('insert into auth.users values ($1),($2),($3)',[owner,admin,participant]);
  await db.query("insert into restart_school_roles values ($1,'owner'),($2,'admin')",[owner,admin]);
  const create=title=>db.query('select restart_create_retreat($1) as id',[title]);
  const signIn=id=>db.query("select set_config('test.uid',$1,false)",[id]);
  await db.exec('set role anon');
  await assert.rejects(create('Test'),{code:'42501'});
  await db.exec('reset role; set role authenticated');
  for (const actor of [admin,participant]) {
   await signIn(actor);
   await assert.rejects(create('Test'),{code:'42501'});
  }
  await signIn(owner);
  await db.query("select set_config('test.anon','true',false)");
  await assert.rejects(create('Test'),{code:'42501'});
  await db.query("select set_config('test.anon','false',false)");
  await assert.rejects(create('  '),{code:'22023'});
  const {rows:[{id}]}=await create(' Synthetic retreat ');
  assert.deepEqual((await db.query('select title from restart_retreat_cohorts')).rows,[{title:'Synthetic retreat'}]);
  assert.deepEqual((await db.query('select cohort_id,role from restart_retreat_members')).rows,[{cohort_id:id,role:'mentor'}]);
  await signIn(participant);
  assert.deepEqual((await db.query('select id from restart_retreat_cohorts')).rows,[]);
 } finally {
  await db.close();
 }
});
