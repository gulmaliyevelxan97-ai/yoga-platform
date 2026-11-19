-- Read-only. Run in the project's SQL Editor before applying any migration.
with expected_relations(name) as (
  values ('restart_profiles'), ('restart_goals'), ('restart_settings'),
    ('restart_practice_events'), ('restart_journal'), ('restart_profiles_pkey'),
    ('restart_goals_pkey'), ('restart_settings_pkey'), ('restart_practice_events_pkey'),
    ('restart_journal_pkey'), ('restart_practice_events_day_idx'), ('restart_journal_date_idx')
), expected_functions(signature) as (
  values ('public.restart_next_revision()'), ('public.restart_guard_journal()'),
    ('public.restart_import_local(jsonb)'), ('public.restart_before_user_created(jsonb)')
), required_roles(name) as (
  values ('anon'), ('authenticated'), ('supabase_auth_admin')
), required_functions(signature) as (
  values ('auth.uid()'), ('auth.jwt()')
)
select 'already exists' as issue, 'public.' || name as object_name
from expected_relations
where to_regclass('public.' || name) is not null or to_regtype('public.' || name) is not null
union all
select 'already exists', signature
from expected_functions
where to_regprocedure(signature) is not null
union all
select 'already exists', 'restart_private'
where to_regnamespace('restart_private') is not null
union all
select 'missing prerequisite', name
from required_roles
where to_regrole(name) is null
union all
select 'missing prerequisite', signature
from required_functions
where to_regprocedure(signature) is null
union all
select 'missing prerequisite', 'auth.users'
where to_regclass('auth.users') is null
order by issue, object_name;
