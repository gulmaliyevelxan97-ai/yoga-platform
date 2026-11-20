begin;

-- Bootstrap the first admin by verified auth.users.id using the database owner.
-- No real users, course content or enrollment records are seeded here.
create table public.restart_school_roles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  role text not null check (role in ('instructor','admin'))
);
create function restart_private.school_member() returns boolean
language sql stable security invoker set search_path = ''
as $$ select auth.uid() is not null and auth.jwt()->>'is_anonymous' = 'false' $$;

create function restart_private.school_role() returns text
language sql stable security definer set search_path = ''
as $$ select case when restart_private.school_member() then coalesce(
  (select role from public.restart_school_roles where user_id = auth.uid()), 'student') end $$;

create table public.restart_programs (
  id uuid primary key default gen_random_uuid(),
  instructor_id uuid not null default auth.uid() references auth.users(id),
  title text not null check (char_length(btrim(title)) between 1 and 180),
  status text not null default 'draft' check (status in ('draft','published','archived'))
);
create table public.restart_modules (
  id uuid primary key default gen_random_uuid(),
  program_id uuid not null references public.restart_programs(id),
  title text not null check (char_length(btrim(title)) between 1 and 180),
  position integer not null check (position > 0),
  unique(program_id, position)
);
create table public.restart_lessons (
  id uuid primary key default gen_random_uuid(),
  module_id uuid not null references public.restart_modules(id),
  title text not null check (char_length(btrim(title)) between 1 and 180),
  body text not null default '' check (char_length(body) <= 50000),
  position integer not null check (position > 0),
  kind text not null default 'lesson' check (kind in ('lesson','practice','assignment')),
  unique(module_id, position)
);
create table public.restart_enrollments (
  user_id uuid not null references auth.users(id) on delete cascade,
  program_id uuid not null references public.restart_programs(id),
  primary key (program_id,user_id)
);
create table public.restart_lesson_progress (
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  lesson_id uuid not null references public.restart_lessons(id),
  completed_at timestamptz not null default now(),
  primary key (user_id,lesson_id)
);
create table public.restart_school_audit (
  id bigint generated always as identity primary key,
  happened_at timestamptz not null default now(),
  actor uuid,
  operation text not null,
  relation_name text not null,
  previous_role text,
  assigned_role text,
  record_key jsonb not null
);
create function restart_private.program_access(program uuid, editing boolean) returns boolean
language sql stable security definer set search_path = ''
as $$ select exists (
  select 1 from public.restart_programs p where p.id = program and (
    restart_private.school_role() = 'admin' or
    (restart_private.school_role() = 'instructor' and p.instructor_id = auth.uid() and (not editing or p.status = 'draft')) or
    (not editing and restart_private.school_member() and p.status = 'published' and exists (
      select 1 from public.restart_enrollments e where e.program_id = p.id and e.user_id = auth.uid()))
  )) $$;

grant usage on schema restart_private to authenticated;
revoke all on function restart_private.school_member(), restart_private.school_role(), restart_private.program_access(uuid,boolean) from public,anon,authenticated;
grant execute on function restart_private.school_member(), restart_private.school_role(), restart_private.program_access(uuid,boolean) to authenticated;

-- Keep audit data to identifiers, without lesson text or private student notes.
create function restart_private.school_audit_change() returns trigger
language plpgsql security definer set search_path = ''
as $$
declare
  row_data jsonb;
begin
  row_data := case when tg_op = 'DELETE' then to_jsonb(old) else to_jsonb(new) end;
  insert into public.restart_school_audit(actor,operation,relation_name,previous_role,assigned_role,record_key)
  values(auth.uid(),tg_op,tg_table_name,
    case when tg_table_name='restart_school_roles' and tg_op <> 'INSERT' then to_jsonb(old)->>'role' end,
    case when tg_table_name='restart_school_roles' and tg_op <> 'DELETE' then to_jsonb(new)->>'role' end,
    jsonb_strip_nulls(jsonb_build_object(
    'id',row_data->'id','user_id',row_data->'user_id','program_id',row_data->'program_id')));
  return null;
end;
$$;
revoke all on function restart_private.school_audit_change() from public,anon,authenticated;

do $$
declare
  rel text;
begin
  foreach rel in array array['restart_school_roles','restart_programs','restart_modules','restart_lessons',
    'restart_enrollments','restart_lesson_progress','restart_school_audit'] loop
    execute format('alter table public.%I enable row level security', rel);
    execute format('revoke all on public.%I from public,anon,authenticated', rel);
    execute format('grant select on public.%I to authenticated', rel);
    if rel not in ('restart_lesson_progress','restart_school_audit') then
      execute format('create trigger school_audit after insert or update or delete on public.%I for each row execute function restart_private.school_audit_change()',rel);
    end if;
  end loop;
end;
$$;

grant insert(user_id,role),update(role),delete on public.restart_school_roles to authenticated;
create policy roles_read on public.restart_school_roles for select to authenticated using (
  restart_private.school_member() and (user_id=auth.uid() or restart_private.school_role()='admin'));
create policy roles_manage on public.restart_school_roles for all to authenticated
using (restart_private.school_role()='admin') with check (restart_private.school_role()='admin');

grant insert(instructor_id,title,status),update(instructor_id,title,status) on public.restart_programs to authenticated;
create policy programs_read on public.restart_programs for select to authenticated using (
  restart_private.school_role()='admin' or (restart_private.school_role()='instructor' and instructor_id=auth.uid())
  or restart_private.program_access(id,false));
create policy programs_create on public.restart_programs for insert to authenticated with check (
  restart_private.school_role()='admin' or (restart_private.school_role()='instructor' and instructor_id=auth.uid() and status='draft'));
create policy programs_edit on public.restart_programs for update to authenticated using (restart_private.program_access(id,true))
with check (restart_private.school_role()='admin' or (restart_private.school_role()='instructor' and instructor_id=auth.uid() and status='draft'));

grant insert(program_id,title,position),update(title,position) on public.restart_modules to authenticated;
create policy modules_read on public.restart_modules for select to authenticated using (restart_private.program_access(program_id,false));
create policy modules_edit on public.restart_modules for all to authenticated
using (restart_private.program_access(program_id,true)) with check (restart_private.program_access(program_id,true));

grant insert(module_id,title,position,kind,body),update(title,position,kind,body) on public.restart_lessons to authenticated;
create policy lessons_read on public.restart_lessons for select to authenticated using (
  exists(select 1 from public.restart_modules m where m.id=module_id));
create policy lessons_edit on public.restart_lessons for all to authenticated using (
  exists(select 1 from public.restart_modules m where m.id=module_id and restart_private.program_access(m.program_id,true)))
with check (exists(select 1 from public.restart_modules m where m.id=module_id and restart_private.program_access(m.program_id,true)));

grant insert(user_id,program_id),delete on public.restart_enrollments to authenticated;
create policy enroll_read on public.restart_enrollments for select to authenticated using (restart_private.school_member() and (
  user_id=auth.uid() or exists(select 1 from public.restart_programs p where p.id=program_id and p.instructor_id=auth.uid() and restart_private.school_role()='instructor')));
create policy enroll_manage on public.restart_enrollments for all to authenticated
using (restart_private.school_role()='admin') with check (restart_private.school_role()='admin');

grant insert(lesson_id) on public.restart_lesson_progress to authenticated;
create policy progress_read on public.restart_lesson_progress for select to authenticated using (restart_private.school_member() and user_id=auth.uid());
create policy progress_add on public.restart_lesson_progress for insert to authenticated with check (
  restart_private.school_member() and user_id=auth.uid() and exists (
    select 1 from public.restart_lessons l join public.restart_modules m on m.id=l.module_id
    join public.restart_enrollments e on e.program_id=m.program_id and e.user_id=auth.uid()
    join public.restart_programs p on p.id=e.program_id and p.status='published'
    where l.id=lesson_id));
-- Serialize instructor edits against an administrator publishing or transferring
-- the program. At READ COMMITTED a waiting locking read sees the latest row.
create function restart_private.lock_draft_for_edit() returns trigger
language plpgsql security definer set search_path = ''
as $$
declare
  program uuid;
  school_program public.restart_programs%rowtype;
begin
  if restart_private.school_role() = 'instructor' then
    if tg_table_name = 'restart_modules' then
      program := new.program_id;
    else
      select m.program_id into strict program from public.restart_modules m where m.id = new.module_id;
    end if;
    select * into strict school_program from public.restart_programs where id=program for share;
    if school_program.status <> 'draft' or school_program.instructor_id <> auth.uid() then
      raise exception 'Instructor may edit only their own draft' using errcode='42501';
    end if;
  end if;
  return new;
end;
$$;
revoke all on function restart_private.lock_draft_for_edit() from public,anon,authenticated;
create trigger lock_draft before insert or update on public.restart_modules
  for each row execute function restart_private.lock_draft_for_edit();
create trigger lock_draft before insert or update on public.restart_lessons
  for each row execute function restart_private.lock_draft_for_edit();

create policy audit_read on public.restart_school_audit for select to authenticated using (restart_private.school_role()='admin');
commit;
