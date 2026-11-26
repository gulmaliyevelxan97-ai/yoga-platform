-- Assignment submission is an explicit disclosure to mentors of the assignment's cohort.
begin;

alter table public.restart_retreat_assignments
 add constraint restart_retreat_assignments_cohort_item_key unique (cohort_id,id);

create table public.restart_retreat_assignment_submissions (
 id uuid primary key default gen_random_uuid(),
 cohort_id uuid not null,
 assignment_id uuid not null,
 participant_id uuid not null,
 response text not null default '' check (char_length(response) <= 4000),
 status text not null default 'submitted' check (status in ('submitted','reviewed')),
 submitted_at timestamptz not null default now(),
 feedback text check (char_length(btrim(feedback)) between 1 and 4000),
 reviewed_at timestamptz,
 revision integer not null default 1 check (revision > 0),
 check ((status='reviewed' and feedback is not null and reviewed_at is not null) or
        (status='submitted' and feedback is null and reviewed_at is null)),
 foreign key (cohort_id,assignment_id) references public.restart_retreat_assignments(cohort_id,id) on delete cascade,
 foreign key (cohort_id,participant_id) references public.restart_retreat_members(cohort_id,user_id) on delete cascade,
 unique (assignment_id,participant_id)
);

create index restart_retreat_assignment_submissions_by_participant
 on public.restart_retreat_assignment_submissions(cohort_id,participant_id);

alter table public.restart_retreat_assignment_submissions enable row level security;
revoke all on public.restart_retreat_assignment_submissions from public, anon, authenticated;
grant select on public.restart_retreat_assignment_submissions to authenticated;

create policy retreat_assignment_submission_read on public.restart_retreat_assignment_submissions for select to authenticated
 using (
  exists (
   select 1 from public.restart_retreat_members m
   where m.cohort_id=restart_retreat_assignment_submissions.cohort_id and m.user_id=(select auth.uid()) and (
    m.role='mentor' or (m.role='participant' and restart_retreat_assignment_submissions.participant_id=m.user_id)
   )
  ) and exists (
   select 1 from public.restart_retreat_assignments a
   where a.cohort_id=restart_retreat_assignment_submissions.cohort_id and a.id=restart_retreat_assignment_submissions.assignment_id
    and (a.participant_id is null or a.participant_id=restart_retreat_assignment_submissions.participant_id)
  )
 );

create function public.restart_submit_retreat_assignment(
 p_cohort_id uuid, p_assignment_id uuid, p_response text, p_share_with_mentor boolean
) returns public.restart_retreat_assignment_submissions
language plpgsql security definer set search_path='' as $$
declare
 actor uuid := auth.uid();
 item public.restart_retreat_assignment_submissions;
begin
 if actor is null or (auth.jwt()->>'is_anonymous') is not distinct from 'true' then
  raise exception 'Account required' using errcode='42501';
 end if;

 if p_share_with_mentor is distinct from true then
  raise exception 'Sharing confirmation required' using errcode='22023';
 end if;

 perform 1 from public.restart_retreat_members m
 where m.cohort_id=p_cohort_id and m.user_id=actor and m.role='participant' for share;
 if not found then
  raise exception 'Assignment unavailable' using errcode='42501';
 end if;

 perform 1 from public.restart_retreat_assignments a
 where a.cohort_id=p_cohort_id and a.id=p_assignment_id and (a.participant_id is null or a.participant_id=actor)
 for share;
 if not found then
  raise exception 'Assignment unavailable' using errcode='42501';
 end if;

 insert into public.restart_retreat_assignment_submissions(cohort_id,assignment_id,participant_id,response)
 values (p_cohort_id,p_assignment_id,actor,coalesce(p_response,''))
 on conflict (assignment_id,participant_id) do nothing
 returning * into item;

 if not found then
  select s.* into strict item from public.restart_retreat_assignment_submissions s
  where s.assignment_id=p_assignment_id and s.participant_id=actor;
  if item.response<>coalesce(p_response,'') then
   raise exception 'Assignment already submitted' using errcode='40001';
  end if;
 end if;
 return item;
end;
$$;

create function public.restart_review_retreat_assignment(
 p_cohort_id uuid, p_submission_id uuid, p_expected_revision integer, p_feedback text
) returns public.restart_retreat_assignment_submissions
language plpgsql security definer set search_path='' as $$
declare
 actor uuid := auth.uid();
 item public.restart_retreat_assignment_submissions;
begin
 if actor is null or (auth.jwt()->>'is_anonymous') is not distinct from 'true' then
  raise exception 'Account required' using errcode='42501';
 end if;

 perform 1 from public.restart_retreat_members m
 where m.cohort_id=p_cohort_id and m.user_id=actor and m.role='mentor' for share;
 if not found then
  raise exception 'Submission unavailable' using errcode='42501';
 end if;

 update public.restart_retreat_assignment_submissions s
 set status='reviewed',feedback=btrim(p_feedback),reviewed_at=clock_timestamp(),revision=s.revision+1
 where s.cohort_id=p_cohort_id and s.id=p_submission_id and s.revision=p_expected_revision and exists (
  select 1 from public.restart_retreat_assignments a
  where a.cohort_id=s.cohort_id and a.id=s.assignment_id and (a.participant_id is null or a.participant_id=s.participant_id)
 )
 returning * into item;
 if not found then
  raise exception 'Submission unavailable or changed' using errcode='40001';
 end if;
 return item;
end;
$$;

revoke all on function public.restart_submit_retreat_assignment(uuid,uuid,text,boolean),
 public.restart_review_retreat_assignment(uuid,uuid,integer,text) from public, anon, authenticated;
grant execute on function public.restart_submit_retreat_assignment(uuid,uuid,text,boolean),
 public.restart_review_retreat_assignment(uuid,uuid,integer,text) to authenticated;

commit;
