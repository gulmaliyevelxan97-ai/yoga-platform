begin;

create table public.restart_notice_preferences (
  user_id uuid primary key default auth.uid() references auth.users(id) on delete cascade,
  lesson_updates boolean not null default false
);
alter table public.restart_notice_preferences enable row level security;
revoke all on public.restart_notice_preferences from public, anon, authenticated;
grant select, insert, update on public.restart_notice_preferences to authenticated;
create policy own_notice_preferences on public.restart_notice_preferences to authenticated
  using (user_id = (select auth.uid()) and restart_private.school_member())
  with check (user_id = (select auth.uid()) and restart_private.school_member());

create table public.restart_inbox (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  kind text not null check (kind in ('booking_confirmed','booking_cancelled','class_changed','class_cancelled','lesson_added')),
  session_id uuid references public.restart_class_sessions(id) on delete cascade,
  lesson_id uuid references public.restart_lessons(id) on delete cascade,
  created_at timestamptz not null default now(),
  check ((kind = 'lesson_added') = (lesson_id is not null) and (session_id is null) = (lesson_id is not null))
);
create index restart_inbox_user_date_idx on public.restart_inbox(user_id, created_at desc);
alter table public.restart_inbox enable row level security;
revoke all on public.restart_inbox from public, anon, authenticated;
grant select on public.restart_inbox to authenticated;
create policy read_own_inbox on public.restart_inbox for select to authenticated using (
  user_id = (select auth.uid()) and restart_private.school_member()
  and (lesson_id is null or exists (select 1 from public.restart_lessons l where l.id = lesson_id))
);

create function restart_private.notify_school_event() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if tg_table_name = 'restart_bookings' then
    if tg_op = 'INSERT' or old.status is distinct from new.status then
      insert into public.restart_inbox(user_id,kind,session_id)
        select new.user_id, case new.status when 'booked' then 'booking_confirmed' else 'booking_cancelled' end, new.session_id
        from public.restart_settings s where s.user_id = new.user_id and s.remind_schedule;
    end if;
  elsif tg_table_name = 'restart_class_sessions' then
    insert into public.restart_inbox(user_id,kind,session_id)
      select b.user_id, case new.status when 'cancelled' then 'class_cancelled' else 'class_changed' end, new.id
      from public.restart_bookings b join public.restart_settings s using (user_id)
      where b.session_id = new.id and b.status = 'booked' and s.remind_schedule;
  elsif tg_table_name = 'restart_lessons' then
    insert into public.restart_inbox(user_id,kind,lesson_id)
      select e.user_id, 'lesson_added', new.id from public.restart_modules m
      join public.restart_programs p on p.id = m.program_id
      join public.restart_enrollments e on e.program_id = p.id
      join public.restart_notice_preferences n on n.user_id = e.user_id
      where m.id = new.module_id and p.status = 'published' and n.lesson_updates;
  end if;
  return null;
end;
$$;
revoke all on function restart_private.notify_school_event() from public, anon, authenticated;
create trigger restart_booking_notice after insert or update of status on public.restart_bookings
  for each row execute function restart_private.notify_school_event();
create trigger restart_session_notice after update on public.restart_class_sessions for each row
  when ((old.title,old.starts_at,old.ends_at,old.format,old.status,old.instructor_id)
    is distinct from (new.title,new.starts_at,new.ends_at,new.format,new.status,new.instructor_id))
  execute function restart_private.notify_school_event();
create trigger restart_lesson_notice after insert on public.restart_lessons
  for each row execute function restart_private.notify_school_event();

create function public.restart_school_metrics() returns jsonb
language plpgsql stable security definer set search_path = '' as $$
begin
  if not coalesce(restart_private.school_member(), false) or restart_private.school_role() is distinct from 'admin' then
    raise exception 'Administrator required' using errcode = '42501';
  end if;
  return jsonb_build_object(
    'registered_students', (select count(*) from auth.users u where u.email_confirmed_at is not null
      and u.deleted_at is null and not coalesce(u.is_anonymous,false)
      and not exists (select 1 from public.restart_school_roles r where r.user_id = u.id and r.role in ('instructor','admin'))),
    'active_learners_30d', (select count(*) from (
      select user_id from public.restart_practice_events where practice_day between current_date - 29 and current_date
      union select user_id from public.restart_lesson_progress where completed_at >= current_date - 29 and completed_at <= now()
    ) activity),
    'completed_practices', (select count(*) from public.restart_practice_events),
    'completed_lessons', (select count(*) from public.restart_lesson_progress),
    'bookings', (select count(*) from public.restart_bookings b join public.restart_class_sessions s on s.id = b.session_id
      where b.status = 'booked' and s.status = 'scheduled'),
    'attended', (select count(*) from public.restart_bookings where attendance = 'present')
  );
end;
$$;
revoke all on function public.restart_school_metrics() from public, anon, authenticated;
grant execute on function public.restart_school_metrics() to authenticated;

commit;
