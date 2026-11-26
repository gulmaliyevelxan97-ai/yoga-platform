-- Cohort mentors can prepare and publish their own programme through controlled RPCs.
begin;

alter table public.restart_retreat_programme_items
 add column revision integer not null default 1 check (revision > 0);

create function public.restart_save_retreat_programme_item(
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
  set title=btrim(p_title),description=coalesce(p_description,''),starts_at=p_starts_at,ends_at=p_ends_at,revision=p.revision+1
  where p.cohort_id=p_cohort_id and p.id=p_item_id and not p.published and p.revision=p_expected_revision
  returning * into item;
  if not found then
   raise exception 'Programme draft unavailable or changed' using errcode='40001';
  end if;
 end if;
 return item;
end;
$$;

create function public.restart_publish_retreat_programme_item(
 p_cohort_id uuid, p_item_id uuid, p_expected_revision integer
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

 update public.restart_retreat_programme_items p
 set published=true,revision=p.revision+1
 where p.cohort_id=p_cohort_id and p.id=p_item_id and not p.published and p.revision=p_expected_revision
 returning * into item;
 if not found then
  raise exception 'Programme draft unavailable or changed' using errcode='40001';
 end if;
 return item;
end;
$$;

revoke all on function public.restart_save_retreat_programme_item(uuid,uuid,integer,text,text,timestamptz,timestamptz),
 public.restart_publish_retreat_programme_item(uuid,uuid,integer) from public, anon, authenticated;
grant execute on function public.restart_save_retreat_programme_item(uuid,uuid,integer,text,text,timestamptz,timestamptz),
 public.restart_publish_retreat_programme_item(uuid,uuid,integer) to authenticated;

commit;
