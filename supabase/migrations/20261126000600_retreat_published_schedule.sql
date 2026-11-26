-- Keep published items visible while an authorized mentor reschedules them.
begin;

create or replace function public.restart_save_retreat_programme_item(
 p_cohort_id uuid, p_item_id uuid, p_expected_revision integer,
 p_title text, p_description text, p_starts_at timestamptz, p_ends_at timestamptz
) returns public.restart_retreat_programme_items
language plpgsql security definer set search_path='' as $$
declare
 actor uuid := auth.uid();
 item public.restart_retreat_programme_items;
begin
 if actor is null or (auth.jwt()->>'is_anonymous') is not distinct from 'true' then
  raise exception 'Account required' using errcode='42501';
 end if;

 perform 1 from public.restart_retreat_members m
 where m.cohort_id=p_cohort_id and m.user_id=actor and m.role='mentor' for share;
 if not found then
  raise exception 'Programme unavailable' using errcode='42501';
 end if;

 if p_item_id is null then
  if p_expected_revision is not null then
   raise exception 'New items do not have a revision' using errcode='22023';
  end if;
  insert into public.restart_retreat_programme_items(cohort_id,title,description,starts_at,ends_at)
  values (p_cohort_id,btrim(p_title),coalesce(p_description,''),p_starts_at,p_ends_at)
  returning * into item;
 else
  update public.restart_retreat_programme_items p
  set title=case when p.published then p.title else btrim(p_title) end,
   description=coalesce(p_description,''),starts_at=p_starts_at,ends_at=p_ends_at,revision=p.revision+1
  where p.cohort_id=p_cohort_id and p.id=p_item_id and p.revision=p_expected_revision
   and (not p.published or (p.title=p_title and p.description=coalesce(p_description,'')))
  returning * into item;
  if not found then
   raise exception 'Programme item unavailable or changed' using errcode='40001';
  end if;
 end if;
 return item;
end;
$$;

commit;
