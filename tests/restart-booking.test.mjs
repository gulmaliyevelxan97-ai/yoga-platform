import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile, readdir} from 'node:fs/promises';
import {randomUUID} from 'node:crypto';
import {PGlite} from '@electric-sql/pglite';

test('school roles, seats, repeat requests, roster privacy and attendance', async () => {
  const db = new PGlite();
  const fixtures = new URL('../supabase/migrations/', import.meta.url);
  const [teacher, colleague, a, b] = Array.from({length:4}, () => randomUUID());
  try {
    await db.exec(`create role authenticated; create role anon; create role supabase_auth_admin;
      create schema auth; create table auth.users(id uuid primary key);
      create function auth.jwt() returns jsonb language sql stable as $$
        select current_setting('request.jwt.claims',true)::jsonb $$;
      create function auth.uid() returns uuid language sql stable as $$ select (auth.jwt()->>'sub')::uuid $$;
      grant usage on schema auth to authenticated, anon;`);
    for (const file of (await readdir(fixtures)).filter(f => f.endsWith('.sql')).sort()) {
      await db.exec(await readFile(new URL(file, fixtures),'utf8'));
    }
    for (const id of [teacher,colleague,a,b]) await db.query('insert into auth.users values ($1)',[id]);
    await db.query("insert into public.restart_school_roles values ($1,'instructor'),($2,'instructor')",[teacher,colleague]);
    const login = async (id,anonymous=false) => {
      await db.exec('reset role; set role authenticated');
      await db.query("select set_config('request.jwt.claims',$1,false)",[JSON.stringify({sub:id,is_anonymous:anonymous})]);
    };
    const scalar = async (sql,args=[]) => Object.values((await db.query(sql,args)).rows[0])[0];
    const create = () => scalar(`insert into public.restart_class_sessions(title,starts_at,ends_at,format,kind,capacity)
      values ('fixture','2099-01-01 12:00+04','2099-01-01 13:00+04','online','individual',1) returning id`);
    await login(a);
    await assert.rejects(create(),{code:'42501'});
    await login(teacher);
    const id = await create();
    assert.equal(await scalar('select time_zone from public.restart_class_sessions'), null);
    await assert.rejects(db.query("update public.restart_class_sessions set time_zone='Unknown/Not_A_Zone'"),{code:'22023'});
    await db.query("update public.restart_class_sessions set time_zone='Asia/Baku',venue='Bakı studiyası'");
    await assert.rejects(db.query("update public.restart_class_sessions set venue=$1",['Hall\n1']),{code:'23514'});
    assert.equal(await scalar("select starts_at = '2099-01-01 08:00Z'::timestamptz from public.restart_class_sessions"),true);
    const reserve = book => scalar('select public.restart_set_booking($1,$2)',[id,book]);
    const attendance = () => scalar("select public.restart_mark_attendance($1,$2,'present')",[id,b]);
    const seats = () => scalar('select seats_taken from public.restart_class_sessions');
    await login(a,true);
    await assert.rejects(reserve(true),{code:'42501'});
    await login(a);
    assert.equal(await reserve(true),'booked');
    assert.equal(await reserve(true),'booked');
    assert.equal(await seats(),1);
    await login(b);
    assert.equal(await scalar('select count(*)::int from public.restart_bookings'),0);
    await assert.rejects(reserve(true),/Class full/);
    await assert.rejects(db.query("insert into public.restart_bookings values($1,$2,'booked')",[id,b]),{code:'42501'});
    await assert.rejects(attendance(),{code:'42501'});
    await login(a);
    assert.equal(await reserve(false),'cancelled');
    assert.equal(await reserve(false),'cancelled');
    assert.equal(await seats(),0);
    await login(b);
    assert.equal(await reserve(true),'booked');
    await login(teacher);
    assert.equal(await scalar('select count(*)::int from public.restart_bookings'),2);
    await assert.rejects(attendance(),/Attendance unavailable/);
    await db.query("update public.restart_class_sessions set status='cancelled' where id=$1",[id]);
    await login(b);
    await assert.rejects(reserve(true),/Class cancelled/);
    await login(teacher);
    await db.exec("update public.restart_class_sessions set status='scheduled', starts_at=now()-interval '1 hour',ends_at=now()");
    await login(colleague);
    assert.equal((await db.query("update public.restart_class_sessions set venue='Another studio' returning venue")).rows.length,0);
    assert.equal(await scalar('select count(*)::int from public.restart_bookings'),0);
    await assert.rejects(attendance(),{code:'42501'});
    await login(teacher);
    await attendance();
    await login(b);
    assert.equal(await scalar('select attendance from public.restart_bookings'),'present');
    await assert.rejects(reserve(false),/Booking closed/);
    await db.exec('reset role');
    await db.query('delete from auth.users where id=$1',[b]);
    assert.equal(await seats(),0);
  } finally { await db.close(); }
});
