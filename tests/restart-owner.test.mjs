import {btree_gist} from '@electric-sql/pglite/contrib/btree_gist';
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile,readdir} from 'node:fs/promises';
import {randomUUID} from 'node:crypto';
import {PGlite} from '@electric-sql/pglite';

test('Owner alone changes staff roles, and browser sessions cannot assign or remove an owner',async()=>{
 const db=new PGlite({extensions:{btree_gist}});
 try {
  await db.exec(`create role anon; create role authenticated; create role supabase_auth_admin;
    create schema auth; create table auth.users(id uuid primary key);
    create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('test.uid',true),'')::uuid $$;
    create function auth.jwt() returns jsonb language sql stable as $$ select '{"is_anonymous":false}'::jsonb $$;
    grant usage on schema auth to authenticated;`);
  const dir=new URL('../supabase/migrations/',import.meta.url);
  for (const file of (await readdir(dir)).sort().filter(file=>file.slice(0,14)<='20261120000400'||file.startsWith('20261120000900'))) {
   const sql=await readFile(new URL(file,dir),'utf8');
   await db.exec(sql);
   if(file.startsWith('20261120000900')) await db.exec(sql);
  }
  const [owner,admin,target]=Array.from({length:3},randomUUID);
  await db.query('insert into auth.users values ($1),($2),($3)',[owner,admin,target]);
  await db.query("insert into public.restart_school_roles values ($1,'owner'),($2,'admin')",[owner,admin]);
  await db.exec('set role authenticated');
  await db.query("select set_config('test.uid',$1,false)",[admin]);
  await assert.rejects(db.query("insert into public.restart_school_roles values ($1,'instructor')",[target]),{code:'42501'});
  await db.query("select set_config('test.uid',$1,false)",[owner]);
  await db.query("insert into public.restart_school_roles values ($1,'instructor')",[target]);
  await assert.rejects(db.query("update public.restart_school_roles set role='owner' where user_id=$1",[target]),{code:'42501'});
  assert.deepEqual((await db.query('delete from public.restart_school_roles where user_id=$1 returning role',[owner])).rows,[]);
  assert.deepEqual((await db.query('select restart_private.school_role() as access,restart_private.school_is_owner() as owner')).rows,[{access:'admin',owner:true}]);
 } finally {await db.close();}
});
