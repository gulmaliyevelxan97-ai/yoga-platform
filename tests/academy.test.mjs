import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile,readdir} from 'node:fs/promises';
import {randomUUID} from 'node:crypto';
import {PGlite} from '@electric-sql/pglite';

test('Academy protects drafts, enrollments, progress, roles and journals independently',async()=>{
 const db=new PGlite();
 try {
  const [admin,teacher,student,other]=Array.from({length:4},randomUUID);
  await db.exec(`create role anon; create role authenticated; create role supabase_auth_admin;
    create schema auth; create table auth.users(id uuid primary key);
    create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('test.uid',true),'')::uuid$$;
    create function auth.jwt() returns jsonb language sql stable as $$select current_setting('test.jwt',true)::jsonb$$;
    grant usage on schema auth to authenticated;`);
  const dir=new URL('../supabase/migrations/',import.meta.url);
  for(const file of (await readdir(dir)).filter(f=>f<='20261120000700_programme_details.sql').sort()){
   await db.exec(await readFile(new URL(file,dir),'utf8'));
  }
  await db.exec(await readFile(new URL('20261120001000_lesson_media.sql',dir),'utf8'));
  const query=async(sql,params=[]) => (await db.query(sql,params)).rows;
  for(const uid of [admin,teacher,student,other]) await query('insert into auth.users values($1)',[uid]);
  await query("insert into restart_school_roles values($1,'admin'),($2,'instructor')",[admin,teacher]);
  const signIn=async(uid,anonymous=false)=>{
   await db.exec('set role authenticated');
   await query("select set_config('test.uid',$1,false),set_config('test.jwt',$2,false)",[uid,JSON.stringify({is_anonymous:anonymous})]);
  };
  const denied={code:'42501'};
  await signIn(teacher);
  const [{id:program}]=await query("insert into restart_programs(title) values('Fixture') returning id");
  const details = "update restart_programs set summary=$1,direction='mind',minutes=25,level='beginner' where id=$2 and revision=$3 returning revision";
  assert.deepEqual(await query(details,['Reflection',program,1]),[{revision:2}]);
  assert.deepEqual(await query(details,['Stale text',program,1]),[]);
  await assert.rejects(query('update restart_programs set minutes=0 where id=$1',[program]),{code:'23514'});
  await assert.rejects(query("update restart_programs set direction='other' where id=$1",[program]),{code:'23514'});
  await assert.rejects(query('update restart_programs set revision=1 where id=$1',[program]),denied);
  const [{id:module}]=await query("insert into restart_modules(program_id,title,position) values($1,'Module',1) returning id",[program]);
  const [{id:lesson}]=await query("insert into restart_lessons(module_id,title,position) values($1,'Lesson',1) returning id",[module]);
  const media = 'https://www.youtube.com/watch?v=abcdefghijk';
  await query('update restart_lessons set media_url=$1 where id=$2',[media,lesson]);
  for (const video of ['http://youtu.be/abcdefghijk','https://youtu.be.example.invalid/abcdefghijk',
   'https://vimeo.com/123?token=private','https://youtu.be/abcdefghijk\n']) {
   await assert.rejects(query('update restart_lessons set media_url=$1 where id=$2',[video,lesson]),{code:'23514'});
  }
  await assert.rejects(query("update restart_programs set status='published' where id=$1",[program]),denied);
  await signIn(student);
  assert.equal((await query('select * from restart_programs')).length,0);
  await assert.rejects(query("insert into restart_school_roles values($1,'admin')",[student]),denied);
  await assert.rejects(query('insert into restart_enrollments values($1,$2)',[student,program]),denied);
  await signIn(admin);
  await query("insert into restart_school_roles values($1,'instructor')",[other]);
  await query("update restart_school_roles set role='admin' where user_id=$1",[other]);
  await query('delete from restart_school_roles where user_id=$1',[other]);
  assert.deepEqual(await query("select previous_role,assigned_role from restart_school_audit where record_key->>'user_id'=$1 order by id",[other]),[
   {previous_role:null,assigned_role:'instructor'},{previous_role:'instructor',assigned_role:'admin'},{previous_role:'admin',assigned_role:null}]);
  await query('insert into restart_enrollments values($1,$2)',[student,program]);
  await signIn(student);
  assert.equal((await query('select * from restart_lessons')).length,0);
  await signIn(admin);
  await query("update restart_programs set status='published' where id=$1",[program]);
  await signIn(student,true);
  assert.equal((await query('select * from restart_lessons')).length,0);
  await signIn(student);
  assert.deepEqual(await query('select id,media_url from restart_lessons'),[{id:lesson,media_url:media}]);
  assert.deepEqual(await query('update restart_lessons set media_url=null where id=$1 returning id',[lesson]),[]);
  assert.deepEqual(await query('select summary,direction,minutes from restart_programs'),[{summary:'Reflection',direction:'mind',minutes:25}]);
  assert.deepEqual(await query(details,['Unauthorized',program,3]),[]);
  await query('insert into restart_lesson_progress(lesson_id) values($1)',[lesson]);
  await assert.rejects(query('insert into restart_lesson_progress(lesson_id) values($1)',[lesson]),{code:'23505'});
  await query("insert into restart_journal(client_id,entry_date,notes) values(gen_random_uuid(),current_date,'Private fixture')");
  await signIn(other);
  assert.equal((await query('select * from restart_lessons')).length,0);
  assert.equal((await query('select * from restart_lesson_progress')).length,0);
  await assert.rejects(query('insert into restart_lesson_progress(lesson_id) values($1)',[lesson]),denied);
  await signIn(teacher);
  assert.deepEqual(await query('select user_id from restart_enrollments'),[{user_id:student}]);
  assert.equal((await query('select * from restart_journal')).length,0);
  assert.equal((await query('select * from restart_school_audit')).length,0);
  await signIn(admin);
  assert.equal((await query('select * from restart_journal')).length,0);
  assert.ok((await query('select * from restart_school_audit')).length>=6);
  await query('delete from restart_enrollments where user_id=$1',[student]);
  await signIn(student);
  assert.equal((await query('select * from restart_lessons')).length,0);
  assert.equal((await query('select * from restart_lesson_progress')).length,1);
 } finally { await db.close(); }
});
