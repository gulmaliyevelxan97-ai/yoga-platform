begin;

alter table public.restart_class_sessions
  add column if not exists time_zone text check (char_length(time_zone) between 1 and 100),
  add column if not exists venue text not null default '' check (char_length(venue) <= 180 and venue !~ '[[:cntrl:]]');

-- Older classes have known instants but no known source time zone.
create or replace function restart_private.validate_class_zone() returns trigger
language plpgsql security invoker set search_path = '' as $$
begin
  if new.time_zone is not null and not exists (
    select 1 from pg_catalog.pg_timezone_names where name = new.time_zone
  ) then
    raise exception 'Invalid class time zone' using errcode='22023';
  end if;
  return new;
end;
$$;
revoke all on function restart_private.validate_class_zone() from public,anon,authenticated;
drop trigger if exists restart_class_validate_zone on public.restart_class_sessions;
create trigger restart_class_validate_zone before insert or update of time_zone on public.restart_class_sessions
  for each row execute function restart_private.validate_class_zone();

grant insert (venue,time_zone),update (venue,time_zone) on public.restart_class_sessions to authenticated;

-- One notification per committed class update, even when several details change.
drop trigger restart_session_notice on public.restart_class_sessions;
create trigger restart_session_notice after update on public.restart_class_sessions for each row
  when ((old.title,old.starts_at,old.ends_at,old.format,old.status,old.instructor_id,old.venue,old.time_zone)
    is distinct from (new.title,new.starts_at,new.ends_at,new.format,new.status,new.instructor_id,new.venue,new.time_zone))
  execute function restart_private.notify_school_event();

drop trigger restart_schedule_audit on public.restart_class_sessions;
create trigger restart_schedule_audit after insert or update of title,starts_at,ends_at,format,kind,capacity,status,venue,time_zone or delete
  on public.restart_class_sessions for each row
  execute function restart_private.school_audit_change();

commit;
