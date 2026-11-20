begin;

-- Student accounts have no school role. The role table contains staff, including owners.
create or replace function public.restart_school_metrics() returns jsonb
language plpgsql stable security definer set search_path = '' as $$
begin
  if not coalesce(restart_private.school_member(), false) or restart_private.school_role() is distinct from 'admin' then
    raise exception 'Administrator required' using errcode = '42501';
  end if;
  return jsonb_build_object(
    'registered_students', (select count(*) from auth.users u where u.email_confirmed_at is not null
      and u.deleted_at is null and not coalesce(u.is_anonymous,false)
      and not exists (select 1 from public.restart_school_roles r where r.user_id = u.id)),
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

commit;
