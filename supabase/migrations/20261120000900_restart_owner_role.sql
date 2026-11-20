begin;

alter table public.restart_school_roles drop constraint if exists restart_school_roles_role_check;
alter table public.restart_school_roles add constraint restart_school_roles_role_check
  check (role in ('instructor','admin','owner'));

create or replace function restart_private.school_is_owner() returns boolean
language sql stable security definer set search_path = ''
as $$
  select restart_private.school_member() is true and exists (
    select 1 from public.restart_school_roles where user_id=auth.uid() and role='owner'
  )
$$;
revoke all on function restart_private.school_is_owner() from public,anon,authenticated;
grant execute on function restart_private.school_is_owner() to authenticated;

-- Preserve the capability used by existing Academy, Booking and metrics policies.
create or replace function restart_private.school_role() returns text
language sql stable security definer set search_path = ''
as $$
  select case when restart_private.school_member() then coalesce(
    (select case role when 'owner' then 'admin' else role end
     from public.restart_school_roles where user_id=auth.uid()), 'student') end
$$;

drop policy if exists roles_manage on public.restart_school_roles;
drop policy if exists roles_insert on public.restart_school_roles;
drop policy if exists roles_update on public.restart_school_roles;
drop policy if exists roles_delete on public.restart_school_roles;
create policy roles_insert on public.restart_school_roles for insert to authenticated
  with check (restart_private.school_is_owner() and role in ('admin','instructor'));
create policy roles_update on public.restart_school_roles for update to authenticated
  using (restart_private.school_is_owner() and role in ('admin','instructor'))
  with check (restart_private.school_is_owner() and role in ('admin','instructor'));
create policy roles_delete on public.restart_school_roles for delete to authenticated
  using (restart_private.school_is_owner() and role in ('admin','instructor'));

commit;
