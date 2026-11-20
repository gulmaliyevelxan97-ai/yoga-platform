import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile,readdir} from 'node:fs/promises';
import {PGlite} from '@electric-sql/pglite';

test('School catalog check reports missing and weakened schema without reading student records',async()=>{
 const db = new PGlite();
 const migrations = new URL('../supabase/migrations/',import.meta.url);
 const sql = await readFile(new URL('../supabase/checks/installed_school.sql',import.meta.url),'utf8');
 try {
  await db.exec(`create role anon; create role authenticated; create role supabase_auth_admin;
    create schema auth; create table auth.users(id uuid primary key);
    create function auth.uid() returns uuid language sql stable as $$ select null::uuid $$;
    create function auth.jwt() returns jsonb language sql stable as $$ select '{}'::jsonb $$;
    grant usage on schema auth to authenticated;`);
  const checks = async () => {
   await db.exec('begin read only');
   try {return new Map((await db.query(sql)).rows.map(({check_name,ok})=>[check_name,ok]));}
   finally {await db.exec('rollback');}
  };
  for (const file of (await readdir(migrations)).filter(name=>name.endsWith('.sql')).sort()) {
   await db.exec(await readFile(new URL(file,migrations),'utf8'));
   if (file.startsWith('20261120000300')) {
    const result = await checks();
    assert.equal(result.get('restart_programs RLS and select grants'),false);
    assert.equal(result.get('public.restart_set_booking(uuid,boolean) definer and execute grants'),false);
    assert.equal(result.get('restart_class_sessions.time_zone is installed'),false);
    assert.equal(result.get('roles_insert owner policy is installed'),false);
   }
  }
  const installed = await checks();
  assert.equal(installed.size,33);
  assert.deepEqual([...installed].filter(([,ok])=>!ok),[]);
  await db.exec(`alter table public.restart_lessons disable row level security;
    alter table public.restart_bookings disable trigger restart_booking_count;
    grant execute on function public.restart_school_metrics() to anon;`);
  const weakened = [...await checks()].filter(([,ok])=>!ok).map(([name])=>name);
  assert.deepEqual(weakened,[
   'public.restart_school_metrics() definer and execute grants',
   'restart_bookings.restart_booking_count is enabled',
   'restart_lessons RLS and select grants'
  ]);
 } finally { await db.close(); }
});
