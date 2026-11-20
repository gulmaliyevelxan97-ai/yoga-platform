-- Read only. Run after the three original migrations.
-- Each row should be true. Does not read student records or email addresses.
with relations(name) as (
  values ('public.restart_profiles'), ('public.restart_goals'),
    ('public.restart_settings'), ('public.restart_journal'),
    ('public.restart_practice_events'), ('restart_private.pilot_emails')
), functions(signature, caller) as (
  values ('public.restart_import_local(jsonb)', 'authenticated'),
    ('public.restart_before_user_created(jsonb)', 'supabase_auth_admin')
)
select name || ' RLS' as check_name, coalesce(c.relrowsecurity, false) as ok
from relations left join pg_class c on c.oid = to_regclass(name)
union all
select signature || ' invoker and intended caller',
  coalesce(not p.prosecdef and has_function_privilege(caller, p.oid, 'EXECUTE')
    and not has_function_privilege('anon', p.oid, 'EXECUTE'), false)
from functions left join pg_proc p on p.oid = to_regprocedure(signature)
union all
select 'authenticated cannot execute signup hook',
  coalesce(not has_function_privilege('authenticated',
    to_regprocedure('public.restart_before_user_created(jsonb)'), 'EXECUTE'), false)
union all
select 'pilot list inaccessible to student roles', coalesce(
  not has_table_privilege('authenticated', to_regclass('restart_private.pilot_emails'), 'SELECT')
  and not has_table_privilege('anon', to_regclass('restart_private.pilot_emails'), 'SELECT'), false)
order by check_name;
