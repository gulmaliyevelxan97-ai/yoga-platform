-- A task is addressed to the whole cohort or one current participant.
begin;

create table public.restart_retreat_assignments (
 id uuid primary key default gen_random_uuid(),
 cohort_id uuid not null references public.restart_retreat_cohorts(id) on delete cascade,
 participant_id uuid,
 title text not null check (char_length(btrim(title)) between 1 and 160),
 instructions text not null default '' check (char_length(instructions) <= 4000),
 due_at timestamptz check (isfinite(due_at)),
 revision integer not null default 1 check (revision > 0),
 foreign key (cohort_id,participant_id) references public.restart_retreat_members(cohort_id,user_id) on delete cascade
);

create index restart_retreat_assignments_by_recipient
 on public.restart_retreat_assignments(cohort_id,participant_id);

alter table public.restart_retreat_assignments enable row level security;
revoke all on public.restart_retreat_assignments from public, anon, authenticated;
grant select on public.restart_retreat_assignments to authenticated;

create policy retreat_assignment_read on public.restart_retreat_assignments for select to authenticated
 using (exists (
  select 1 from public.restart_retreat_members m
  where m.cohort_id=restart_retreat_assignments.cohort_id and m.user_id=(select auth.uid()) and (
   m.role='mentor' or (m.role='participant' and
    (restart_retreat_assignments.participant_id is null or restart_retreat_assignments.participant_id=m.user_id))
  )
 ));

create function public.restart_save_retreat_assignment(
 p_cohort_id uuid, p_item_id uuid, p_expected_revision integer, p_participant_id uuid,
 p_title text, p_instructions text, p_due_at timestamptz
) returns public.restart_retreat_assignments
language plpgsql security definer set search_path='' as $$
declare
 actor uuid := auth.uid();
 item public.restart_retreat_assignments;
begin
 if actor is null or (auth.jwt()->>'is_anonymous') is not distinct from 'true' then
  raise exception 'Account required' using errcode='42501';
 end if;

 perform 1 from public.restart_retreat_members m
 where m.cohort_id=p_cohort_id and m.user_id=actor and m.role='mentor' for share;
 if not found then
  raise exception 'Assignment unavailable' using errcode='42501';
 end if;

 if p_participant_id is not null then
  perform 1 from public.restart_retreat_members m
  where m.cohort_id=p_cohort_id and m.user_id=p_participant_id and m.role='participant' for share;
  if not found then
   raise exception 'Recipient unavailable' using errcode='42501';
  end if;
 end if;

 if p_item_id is null then
  if p_expected_revision is not null then
   raise exception 'New assignments do not have a revision' using errcode='22023';
  end if;
  insert into public.restart_retreat_assignments(cohort_id,participant_id,title,instructions,due_at)
  values (p_cohort_id,p_participant_id,btrim(p_title),coalesce(p_instructions,''),p_due_at)
  returning * into item;
 else
  update public.restart_retreat_assignments a
  set title=btrim(p_title),instructions=coalesce(p_instructions,''),due_at=p_due_at,revision=a.revision+1
  where a.cohort_id=p_cohort_id and a.id=p_item_id and a.revision=p_expected_revision
   and a.participant_id is not distinct from p_participant_id
  returning * into item;
  if not found then
   raise exception 'Assignment unavailable or changed' using errcode='40001';
  end if;
 end if;
 return item;
end;
$$;

revoke all on function public.restart_save_retreat_assignment(uuid,uuid,integer,uuid,text,text,timestamptz)
 from public, anon, authenticated;
grant execute on function public.restart_save_retreat_assignment(uuid,uuid,integer,uuid,text,text,timestamptz)
 to authenticated;

commit;
