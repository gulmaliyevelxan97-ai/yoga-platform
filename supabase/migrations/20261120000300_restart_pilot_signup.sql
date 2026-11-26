begin;

create schema restart_private;
revoke all on schema restart_private from public, anon, authenticated;
grant usage on schema restart_private to supabase_auth_admin;

create table restart_private.pilot_emails (
  email text primary key check (email = lower(btrim(email)) and char_length(email) between 3 and 320)
);
alter table restart_private.pilot_emails enable row level security;
revoke all on restart_private.pilot_emails from public, anon, authenticated;
grant select on restart_private.pilot_emails to supabase_auth_admin;
create policy read_pilot_emails on restart_private.pilot_emails for select to supabase_auth_admin using (true);

create function public.restart_before_user_created(event jsonb)
returns jsonb
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if exists (
    select 1 from restart_private.pilot_emails
    where email = lower(btrim(event #>> '{user,email}'))
  ) then
    return '{}'::jsonb;
  end if;
  return jsonb_build_object('error', jsonb_build_object('http_code', 403, 'message', 'Signup is unavailable.'));
end;
$$;
revoke all on function public.restart_before_user_created(jsonb) from public, anon, authenticated;
grant usage on schema public to supabase_auth_admin;
grant execute on function public.restart_before_user_created(jsonb) to supabase_auth_admin;

commit;
