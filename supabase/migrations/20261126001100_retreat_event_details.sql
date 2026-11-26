-- A cohort's participant-facing event details are optional and explicitly published.
begin;

create table public.restart_retreat_event_details (
 cohort_id uuid primary key references public.restart_retreat_cohorts(id) on delete cascade,
 event_date date check (isfinite(event_date)),
 location text check (char_length(location) <= 300),
 dress_code text check (char_length(dress_code) <= 1000),
 packing_list text check (char_length(packing_list) <= 2000),
 published boolean not null default false,
 revision integer not null default 1 check (revision > 0),
 check (not published or num_nonnulls(event_date,location,dress_code,packing_list)>0)
);

alter table public.restart_retreat_event_details enable row level security;
revoke all on public.restart_retreat_event_details from public, anon, authenticated;
grant select on public.restart_retreat_event_details to authenticated;

create policy retreat_event_details_read on public.restart_retreat_event_details for select to authenticated
 using (exists (
  select 1 from public.restart_retreat_members m
  where m.cohort_id=restart_retreat_event_details.cohort_id and m.user_id=(select auth.uid())
   and (m.role='mentor' or (m.role='participant' and restart_retreat_event_details.published))
 ));

create function public.restart_save_retreat_event_details(
 p_cohort_id uuid, p_expected_revision integer, p_event_date date,
 p_location text, p_dress_code text, p_packing_list text, p_published boolean default false
) returns public.restart_retreat_event_details
language plpgsql security definer set search_path='' as $$
declare
 actor uuid := auth.uid();
 item public.restart_retreat_event_details;
 normalized_location text := nullif(btrim(p_location,E' \t\r\n'),'');
 normalized_dress text := nullif(btrim(p_dress_code,E' \t\r\n'),'');
 normalized_packing text := nullif(btrim(p_packing_list,E' \t\r\n'),'');
begin
 if actor is null or (auth.jwt()->>'is_anonymous') is not distinct from 'true' then
  raise exception 'Account required' using errcode='42501';
 end if;

 perform 1 from public.restart_retreat_members m
 where m.cohort_id=p_cohort_id and m.user_id=actor and m.role='mentor' for share;
 if not found then
  raise exception 'Event details unavailable' using errcode='42501';
 end if;

 if p_expected_revision is null then
  insert into public.restart_retreat_event_details(cohort_id,event_date,location,dress_code,packing_list,published)
  values (p_cohort_id,p_event_date,normalized_location,normalized_dress,normalized_packing,p_published)
  on conflict (cohort_id) do nothing
  returning * into item;
 else
  update public.restart_retreat_event_details d
  set event_date=p_event_date,location=normalized_location,dress_code=normalized_dress,packing_list=normalized_packing,
   published=p_published,revision=d.revision+1
  where d.cohort_id=p_cohort_id and d.revision=p_expected_revision
  returning * into item;
 end if;

 if not found then
  raise exception 'Event details unavailable or changed' using errcode='40001';
 end if;
 return item;
end;
$$;

revoke all on function public.restart_save_retreat_event_details(uuid,integer,date,text,text,text,boolean)
 from public, anon, authenticated;
grant execute on function public.restart_save_retreat_event_details(uuid,integer,date,text,text,text,boolean)
 to authenticated;

commit;
