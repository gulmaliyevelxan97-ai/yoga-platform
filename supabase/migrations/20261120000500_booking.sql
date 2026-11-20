begin;

create table public.restart_class_sessions (
  id uuid primary key default gen_random_uuid(),
  instructor_id uuid not null default auth.uid() references auth.users(id) on delete restrict,
  title text not null check (char_length(btrim(title)) between 1 and 180),
  starts_at timestamptz not null,
  ends_at timestamptz not null check (ends_at > starts_at),
  format text not null check (format in ('onsite','online')),
  kind text not null check (kind in ('group','individual','event')),
  capacity integer not null check (capacity between 1 and 1000 and (kind <> 'individual' or capacity = 1)),
  status text not null default 'scheduled' check (status in ('scheduled','cancelled'))
);
create index restart_sessions_start on public.restart_class_sessions(starts_at);
create table public.restart_bookings (
  session_id uuid not null references public.restart_class_sessions(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  status text not null check (status in ('booked','cancelled')),
  attendance text not null default 'pending' check (attendance in ('pending','present','absent')),
  primary key (session_id,user_id)
);
create index restart_bookings_by_student on public.restart_bookings(user_id,session_id);

-- The counter is kept on the locked parent row. Deletes from auth.users and privileged
-- maintenance also pass through the counter trigger and release the seat.
alter table public.restart_class_sessions add column seats_taken integer not null default 0
  check (seats_taken between 0 and capacity);

create trigger restart_schedule_audit
  after insert or update of title,starts_at,ends_at,format,kind,capacity,status or delete
  on public.restart_class_sessions for each row execute function restart_private.school_audit_change();

alter table public.restart_class_sessions enable row level security;
alter table public.restart_bookings enable row level security;
revoke all on public.restart_class_sessions,public.restart_bookings from public,anon,authenticated;
grant select on public.restart_class_sessions,public.restart_bookings to authenticated;
grant insert (title,instructor_id,starts_at,ends_at,format,kind,capacity,status),
      update (title,starts_at,ends_at,format,kind,capacity,status)
  on public.restart_class_sessions to authenticated;
create policy school_schedule on public.restart_class_sessions for select to authenticated
  using (restart_private.school_role() is not null);
create policy create_class on public.restart_class_sessions for insert to authenticated
  with check (restart_private.school_role() in ('admin','instructor') and instructor_id = auth.uid());
create policy manage_class on public.restart_class_sessions for update to authenticated
  using (restart_private.school_role() = 'admin' or
    (restart_private.school_role() = 'instructor' and instructor_id = auth.uid()))
  with check (restart_private.school_role() = 'admin' or
    (restart_private.school_role() = 'instructor' and instructor_id = auth.uid()));

create policy booking_visibility on public.restart_bookings for select to authenticated
  using (restart_private.school_role() is not null and
    (user_id = auth.uid() or restart_private.school_role() = 'admin' or
    (restart_private.school_role() = 'instructor' and exists (
      select 1 from public.restart_class_sessions s where s.id = session_id and s.instructor_id = auth.uid()
    ))));

create function restart_private.adjust_booked_seats() returns trigger
language plpgsql security definer set search_path = '' as $$
declare
  difference integer := 0;
  class_id uuid;
begin
  if tg_op <> 'INSERT' then
    class_id := old.session_id;
    if old.status = 'booked' then difference := difference - 1; end if;
  end if;
  if tg_op <> 'DELETE' then
    class_id := new.session_id;
    if new.status = 'booked' then difference := difference + 1; end if;
  end if;
  if difference <> 0 then
    update public.restart_class_sessions set seats_taken = seats_taken + difference where id = class_id;
  end if;
  return null;
end;
$$;
revoke all on function restart_private.adjust_booked_seats() from public,anon,authenticated;
create trigger restart_booking_count after insert or update of status or delete on public.restart_bookings
  for each row execute function restart_private.adjust_booked_seats();

create function public.restart_set_booking(p_session_id uuid,p_book boolean) returns text
language plpgsql security definer set search_path = '' as $$
declare
  me uuid := auth.uid();
  slot public.restart_class_sessions%rowtype;
  previous text;
begin
  if me is null or restart_private.school_role() is null then
    raise exception 'Authentication required' using errcode='42501';
  end if;
  if p_book is null then raise exception 'Missing booking action' using errcode='22023'; end if;
  select * into strict slot from public.restart_class_sessions where id=p_session_id for update;
  select status into previous from public.restart_bookings where session_id=slot.id and user_id=me;
  if p_book and slot.status <> 'scheduled' then raise exception 'Class cancelled'; end if;
  if p_book and previous = 'booked' then return 'booked'; end if;
  if not p_book and previous is distinct from 'booked' then return 'cancelled'; end if;
  if slot.starts_at <= clock_timestamp() then raise exception 'Booking closed'; end if;
  if p_book then
    if slot.seats_taken >= slot.capacity then raise exception 'Class full'; end if;
    insert into public.restart_bookings(session_id,user_id,status) values(slot.id,me,'booked')
      on conflict(session_id,user_id) do update set status='booked',attendance='pending';
    return 'booked';
  end if;
  update public.restart_bookings set status='cancelled',attendance='pending' where session_id=slot.id and user_id=me;
  return 'cancelled';
end;
$$;
create function public.restart_mark_attendance(p_session_id uuid,p_user_id uuid,p_attendance text) returns void
language plpgsql security definer set search_path = '' as $$
declare
  slot public.restart_class_sessions%rowtype;
  actor_role text := restart_private.school_role();
begin
  if actor_role is null or actor_role not in ('admin','instructor') then
    raise exception 'Staff only' using errcode='42501';
  end if;
  select * into strict slot from public.restart_class_sessions where id=p_session_id for update;
  if actor_role <> 'admin' and slot.instructor_id <> auth.uid() then
    raise exception 'Class owner only' using errcode='42501';
  end if;
  if slot.starts_at > clock_timestamp() or slot.status <> 'scheduled' then raise exception 'Attendance unavailable'; end if;
  update public.restart_bookings set attendance=p_attendance where session_id=slot.id and user_id=p_user_id and status='booked';
  if not found then raise exception 'Active booking required'; end if;
end;
$$;
revoke all on function public.restart_set_booking(uuid,boolean),public.restart_mark_attendance(uuid,uuid,text)
  from public,anon,authenticated;
grant execute on function public.restart_set_booking(uuid,boolean),public.restart_mark_attendance(uuid,uuid,text) to authenticated;

commit;
