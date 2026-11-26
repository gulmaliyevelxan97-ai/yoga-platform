-- Retreat identity and submitted answers are independent of private journals.
begin;

create table public.restart_retreat_cohorts (
 id uuid primary key default gen_random_uuid(),
 title text not null check (char_length(title) between 1 and 160),
 created_at timestamptz not null default now()
);

create table public.restart_retreat_members (
 cohort_id uuid not null references public.restart_retreat_cohorts(id) on delete cascade,
 user_id uuid not null references auth.users(id) on delete cascade,
 role text not null check (role in ('participant','mentor')),
 primary key (cohort_id,user_id)
);

create table public.restart_retreat_forms (
 id uuid primary key default gen_random_uuid(),
 cohort_id uuid not null references public.restart_retreat_cohorts(id) on delete cascade,
 title text not null check (char_length(title) between 1 and 160),
 questions jsonb not null check (jsonb_typeof(questions)='array' and octet_length(questions::text)<24000),
 published boolean not null default false,
 unique (cohort_id,id)
);

create table public.restart_retreat_responses (
 id uuid primary key default gen_random_uuid(),
 cohort_id uuid not null,
 form_id uuid not null,
 participant_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
 answers jsonb not null check (jsonb_typeof(answers)='object' and octet_length(answers::text)<24000),
 share_with_mentor boolean not null default false,
 recorded_at timestamptz not null default now(),
 foreign key (cohort_id,form_id) references public.restart_retreat_forms(cohort_id,id),
 unique (form_id,participant_id)
);

alter table public.restart_retreat_cohorts enable row level security;
alter table public.restart_retreat_members enable row level security;
alter table public.restart_retreat_forms enable row level security;
alter table public.restart_retreat_responses enable row level security;

revoke all on public.restart_retreat_cohorts, public.restart_retreat_members,
 public.restart_retreat_forms, public.restart_retreat_responses from public, anon, authenticated;
grant select on public.restart_retreat_cohorts, public.restart_retreat_members,
 public.restart_retreat_forms, public.restart_retreat_responses to authenticated;
grant insert (cohort_id,form_id,answers), update (share_with_mentor), delete
 on public.restart_retreat_responses to authenticated;

create policy retreat_member_reads_self on public.restart_retreat_members for select to authenticated
 using (user_id=(select auth.uid()) and (select auth.jwt()->>'is_anonymous') is distinct from 'true');

create policy retreat_cohort_read on public.restart_retreat_cohorts for select to authenticated
 using (exists (select 1 from public.restart_retreat_members m
  where m.cohort_id=restart_retreat_cohorts.id and m.user_id=(select auth.uid())));

create policy retreat_form_read on public.restart_retreat_forms for select to authenticated
 using (exists (select 1 from public.restart_retreat_members m
  where m.cohort_id=restart_retreat_forms.cohort_id and m.user_id=(select auth.uid())
   and (restart_retreat_forms.published or m.role='mentor')));

create policy retreat_response_read on public.restart_retreat_responses for select to authenticated
 using (exists (select 1 from public.restart_retreat_members m
  where m.cohort_id=restart_retreat_responses.cohort_id and m.user_id=(select auth.uid()) and (
   (m.role='participant' and restart_retreat_responses.participant_id=m.user_id) or
   (m.role='mentor' and restart_retreat_responses.share_with_mentor))));

create policy retreat_response_insert on public.restart_retreat_responses for insert to authenticated
 with check (participant_id=(select auth.uid()) and not share_with_mentor and
  exists (select 1 from public.restart_retreat_members m where m.cohort_id=restart_retreat_responses.cohort_id
   and m.user_id=(select auth.uid()) and m.role='participant') and
  exists (select 1 from public.restart_retreat_forms f where f.cohort_id=restart_retreat_responses.cohort_id
   and f.id=restart_retreat_responses.form_id and f.published));

create policy retreat_response_consent on public.restart_retreat_responses for update to authenticated
 using (participant_id=(select auth.uid()) and exists (
  select 1 from public.restart_retreat_members m where m.cohort_id=restart_retreat_responses.cohort_id
   and m.user_id=(select auth.uid()) and m.role='participant'))
 with check (participant_id=(select auth.uid()));

create policy retreat_response_delete on public.restart_retreat_responses for delete to authenticated
 using (participant_id=(select auth.uid()) and exists (
  select 1 from public.restart_retreat_members m where m.cohort_id=restart_retreat_responses.cohort_id
   and m.user_id=(select auth.uid()) and m.role='participant'));

commit;
