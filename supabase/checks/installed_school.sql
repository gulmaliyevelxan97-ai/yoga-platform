-- Read-only catalog check for school migrations 004–009.
-- Each row should be true. This query reads no student records.
with school_tables(name) as (
  values ('restart_school_roles'), ('restart_programs'), ('restart_modules'),
    ('restart_lessons'), ('restart_enrollments'), ('restart_lesson_progress'),
    ('restart_school_audit'), ('restart_class_sessions'), ('restart_bookings'),
    ('restart_notice_preferences'), ('restart_inbox')
), school_functions(signature) as (
  values ('public.restart_set_booking(uuid,boolean)'),
    ('public.restart_mark_attendance(uuid,uuid,text)'),
    ('public.restart_school_metrics()'),
    ('restart_private.school_is_owner()')
), school_columns(relation, column_name) as (
  values ('restart_programs', 'summary'), ('restart_programs', 'direction'),
    ('restart_programs', 'level'), ('restart_programs', 'minutes'),
    ('restart_programs', 'revision'), ('restart_class_sessions', 'venue'),
    ('restart_class_sessions', 'time_zone')
), school_triggers(relation, name) as (
  values ('restart_bookings', 'restart_booking_count'),
    ('restart_bookings', 'restart_booking_notice'),
    ('restart_class_sessions', 'restart_session_notice'),
    ('restart_class_sessions', 'restart_schedule_audit'),
    ('restart_class_sessions', 'restart_class_validate_zone'),
    ('restart_lessons', 'restart_lesson_notice'),
    ('restart_programs', 'restart_program_revision')
), owner_policies(name, command) as (
  values ('roles_insert', 'a'), ('roles_update', 'w'), ('roles_delete', 'd')
)
select name || ' RLS and select grants' as check_name,
  coalesce(c.relrowsecurity and has_table_privilege('authenticated', c.oid, 'SELECT')
    and not has_table_privilege('anon', c.oid, 'SELECT'), false) as ok
from school_tables
left join pg_catalog.pg_class c on c.oid = to_regclass('public.' || name)
union all
select signature || ' definer and execute grants',
  coalesce(p.prosecdef and has_function_privilege('authenticated', p.oid, 'EXECUTE')
    and not has_function_privilege('anon', p.oid, 'EXECUTE'), false)
from school_functions
left join pg_catalog.pg_proc p on p.oid = to_regprocedure(signature)
union all
select relation || '.' || column_name || ' is installed',
  exists (select 1 from pg_catalog.pg_attribute a
    where a.attrelid = to_regclass('public.' || relation)
      and a.attname = column_name and a.attnum > 0 and not a.attisdropped)
from school_columns
union all
select relation || '.' || name || ' is enabled',
  exists (select 1 from pg_catalog.pg_trigger t
    where t.tgrelid = to_regclass('public.' || relation)
      and t.tgname = name and not t.tgisinternal and t.tgenabled in ('O', 'A'))
from school_triggers
union all
select name || ' owner policy is installed',
  exists (select 1 from pg_catalog.pg_policy p
    where p.polrelid = to_regclass('public.restart_school_roles')
      and p.polname = name and p.polcmd::text = command
      and p.polroles = array['authenticated'::regrole::oid])
from owner_policies
union all
select 'legacy roles_manage policy is absent',
  not exists (select 1 from pg_catalog.pg_policy p
    where p.polrelid = to_regclass('public.restart_school_roles')
      and p.polname = 'roles_manage')
order by check_name;
