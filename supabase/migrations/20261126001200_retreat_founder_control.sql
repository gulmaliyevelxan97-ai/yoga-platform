begin;

create function public.restart_create_retreat(p_title text)
returns uuid
language plpgsql security definer set search_path='' as $$
declare
 actor uuid := auth.uid();
 retreat_id uuid;
begin
 if actor is null or (auth.jwt()->>'is_anonymous') is not distinct from 'true' then
  raise exception 'Retreat creation requires the founder' using errcode='42501';
 end if;
 perform 1 from public.restart_school_roles
 where user_id=actor and role='owner' for share;
 if not found then
  raise exception 'Retreat creation requires the founder' using errcode='42501';
 end if;

 if p_title is null or char_length(btrim(p_title)) not between 1 and 160 then
  raise exception 'Invalid retreat title' using errcode='22023';
 end if;
 insert into public.restart_retreat_cohorts(title)
 values (btrim(p_title)) returning id into retreat_id;
 insert into public.restart_retreat_members(cohort_id,user_id,role)
 values (retreat_id,actor,'mentor');
 return retreat_id;
end;
$$;

revoke all on function public.restart_create_retreat(text) from public,anon,authenticated;
grant execute on function public.restart_create_retreat(text) to authenticated;

commit;
