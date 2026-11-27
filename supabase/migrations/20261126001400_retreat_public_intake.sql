begin;

-- Returns only the identifier needed by the signup and admission forms. If the
-- named retreat is closed or ambiguous, the public intake stays unavailable.
create function public.restart_public_retreat_intake()
returns uuid
language sql stable security definer set search_path='' as $$
 select case when count(*)=1 then (array_agg(id))[1] else null end
 from public.restart_retreat_cohorts
 where admission_open
   and title='RESTART RETREAT — WHITE & BLACK EXPERIENCE'
$$;

revoke all on function public.restart_public_retreat_intake() from public,anon,authenticated;
grant execute on function public.restart_public_retreat_intake() to anon,authenticated;

commit;
