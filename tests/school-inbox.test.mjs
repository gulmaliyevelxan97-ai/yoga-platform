import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile,readdir} from 'node:fs/promises';
import {PGlite} from '@electric-sql/pglite';

test('School notices respect consent, enrollment and account boundaries; metrics require school admin', async () => {
 const db = new PGlite();
 const admin = '00000000-0000-4000-8000-000000000001';
 const student = '00000000-0000-4000-8000-000000000002';
 const other = '00000000-0000-4000-8000-000000000003';
 const owner = '00000000-0000-4000-8000-000000000004';
 const instructor = '00000000-0000-4000-8000-000000000005';
 const assume = async (id, anonymous = false) => {
   await db.exec('reset role; set role authenticated');
   await db.query("select set_config('request.jwt.claims',$1,false)",[JSON.stringify({sub:id,is_anonymous:anonymous})]);
 };
 const first = async (sql,args=[]) => (await db.query(sql,args)).rows[0];
 const counts = async () => (await first('select count(*)::int as n from public.restart_inbox')).n;
 const denied = {code:'42501'};
 try {
   await db.exec(`create role authenticated; create role anon; create role supabase_auth_admin;
     create schema auth; create table auth.users(id uuid primary key, email_confirmed_at timestamptz default now(),
       deleted_at timestamptz, is_anonymous boolean default false);
     create function auth.jwt() returns jsonb language sql stable as $$select current_setting('request.jwt.claims',true)::jsonb$$;
     create function auth.uid() returns uuid language sql stable as $$select (auth.jwt()->>'sub')::uuid$$;
     grant usage on schema auth to authenticated, anon;`);
   const dir = new URL('../supabase/migrations/',import.meta.url);
   for (const name of (await readdir(dir)).sort()) await db.exec(await readFile(new URL(name,dir),'utf8'));
   for (const id of [student,other,admin,owner,instructor]) await db.query('insert into auth.users(id) values($1)',[id]);
   await db.query("insert into public.restart_school_roles values($1,'admin'),($2,'owner'),($3,'instructor')",[admin,owner,instructor]);
   await db.exec(`insert into auth.users(id,email_confirmed_at,deleted_at,is_anonymous)
     values (gen_random_uuid(),null,null,false), (gen_random_uuid(),now(),now(),false),
       (gen_random_uuid(),now(),null,true)`);
   const {id:session} = await first(`insert into public.restart_class_sessions(instructor_id,title,starts_at,ends_at,kind,format,capacity)
     values($1,'test',now()+interval '1 day',now()+interval '2 days','group','online',2) returning id`,[admin]);
   await assume(student);
   await db.exec("insert into public.restart_settings(locale,reminder_time,remind_practice,remind_schedule,remind_goal) values('ru','',false,true,false)");
   for (let i=0;i<2;i++) await db.query('select public.restart_set_booking($1,true)',[session]);
   assert.equal(await counts(),1);
   await assert.rejects(db.query('select public.restart_school_metrics()'),denied);
   await assume(other);
   await db.query('select public.restart_set_booking($1,true)',[session]);
   assert.equal(await counts(),0);
   await assume(admin);
   assert.equal(await counts(),0);
   const {metrics} = await first('select public.restart_school_metrics() as metrics');
   assert.equal(metrics.registered_students,2);
   assert.equal(metrics.bookings,2);
   await assume(owner);
   assert.deepEqual((await first('select public.restart_school_metrics() as metrics')).metrics,metrics);
   await assume(instructor);
   await assert.rejects(db.query('select public.restart_school_metrics()'),denied);
   await assume(admin);
   await db.query("update public.restart_class_sessions set status='cancelled' where id=$1",[session]);
   await assume(student);
   assert.equal(await counts(),2);
   await db.exec('insert into public.restart_notice_preferences(lesson_updates) values(true)');
   await db.exec('reset role');
   const {id:program} = await first("insert into public.restart_programs(title,instructor_id,status) values('test',$1,'published') returning id",[admin]);
   await db.query('insert into public.restart_enrollments values($1,$2)',[student,program]);
   const {id:module} = await first("insert into public.restart_modules(program_id,title,position) values($1,'m',1) returning id",[program]);
   await db.query("insert into public.restart_lessons(module_id,title,position) values($1,'l',1)",[module]);
   await assume(student);
   assert.equal(await counts(),3);
   await db.exec('reset role');
   await db.query('delete from public.restart_enrollments where user_id=$1 and program_id=$2',[student,program]);
   await assume(student);
   assert.equal(await counts(),2);
   await assume(admin,true);
   await assert.rejects(db.query('select public.restart_school_metrics()'),denied);
   await db.exec('reset role; set role anon');
   await assert.rejects(db.query('select * from public.restart_inbox'),denied);
   await assert.rejects(db.query('select public.restart_school_metrics()'),denied);
 } finally {await db.close();}
});

test('Inbox uses only translated event names and separates explicit lesson preference from delivery',async()=>{
 const {schoolNotices,saveLessonPreference} = await import('../app/school-notices.mjs');
 const responses = {
  restart_inbox:{data:[{kind:'class_changed',created_at:'2026-01-02T10:00:00Z'},
    {kind:'<img src=x>',created_at:'2026-01-02T10:00:00Z'}]},
  restart_notice_preferences:{data:{lesson_updates:false}}
 };
 const writes = [];
 const client = {from(table) {
  const query = {
   select(){return query;}, eq(column,id){assert.equal(column,'user_id');assert.equal(id,'learner');return query;},
   order(){return query;},limit(){return responses[table];},maybeSingle(){return responses[table];},
   upsert(row){writes.push(row);return {error:null};}
  };
  return query;
 }};
 for (const [locale,title] of Object.entries({ru:'Уведомления',az:'Bildirişlər',en:'Notifications'})) {
  const html = await schoolNotices(client,'learner',locale);
  assert(html.includes(title));
  assert(!html.includes('<img'));
  assert(!html.includes(' checked'));
 }
 assert.deepEqual(writes,[]);
 await saveLessonPreference(client,'learner',true);
 assert.deepEqual(writes,[{user_id:'learner',lesson_updates:true}]);
});
