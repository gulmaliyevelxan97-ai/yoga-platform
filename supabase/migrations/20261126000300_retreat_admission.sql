-- Staging admission queue. Opening an intake and distributing its cohort id are server operations.
begin;

alter table public.restart_retreat_cohorts
 add column admission_open boolean not null default false;

create table public.restart_retreat_admissions (
 id uuid primary key default gen_random_uuid(),
 cohort_id uuid not null references public.restart_retreat_cohorts(id) on delete cascade,
 applicant_id uuid not null references auth.users(id) on delete cascade,
 full_name text not null check (char_length(full_name) between 1 and 160 and full_name !~ '[[:cntrl:]]'),
 status text not null default 'pending' check (status in ('pending','approved')),
 submitted_at timestamptz not null default now(),
 approved_at timestamptz,
 check ((status='approved') = (approved_at is not null)),
 unique (cohort_id,applicant_id)
);

create index restart_retreat_admission_by_applicant on public.restart_retreat_admissions(applicant_id);
alter table public.restart_retreat_admissions enable row level security;
revoke all on public.restart_retreat_admissions from public, anon, authenticated;
grant select on public.restart_retreat_admissions to authenticated;

create policy retreat_admission_read on public.restart_retreat_admissions for select to authenticated
 using ((select auth.jwt()->>'is_anonymous') is distinct from 'true' and (
  applicant_id=(select auth.uid()) or exists (
   select 1 from public.restart_retreat_members m
   where m.cohort_id=restart_retreat_admissions.cohort_id
    and m.user_id=(select auth.uid()) and m.role='mentor'
  )
 ));

create function public.restart_submit_retreat_admission(p_cohort_id uuid, p_full_name text)
returns uuid language plpgsql security definer set search_path='' as $$
declare
 actor uuid := auth.uid();
 normalized_name text := btrim(p_full_name);
 request_id uuid;
begin
 if actor is null or (auth.jwt()->>'is_anonymous') is not distinct from 'true' then
  raise exception 'Account required' using errcode='42501';
 end if;

 if normalized_name is null or char_length(normalized_name) not between 1 and 160
    or normalized_name ~ '[[:cntrl:]]' then
  raise exception 'Invalid full name' using errcode='22023';
 end if;

 perform 1 from public.restart_retreat_cohorts c
 where c.id=p_cohort_id and c.admission_open for share;
 if not found then
  raise exception 'Intake unavailable' using errcode='42501';
 end if;

 if exists (select 1 from public.restart_retreat_members m
  where m.cohort_id=p_cohort_id and m.user_id=actor) then
  raise exception 'Already a member' using errcode='42501';
 end if;

 insert into public.restart_retreat_admissions(cohort_id, applicant_id, full_name)
 values (p_cohort_id, actor, normalized_name)
 on conflict (cohort_id, applicant_id) do nothing
 returning id into request_id;

 if request_id is null then
  select a.id into strict request_id from public.restart_retreat_admissions a
  where a.cohort_id=p_cohort_id and a.applicant_id=actor;
 end if;
 return request_id;
end;
$$;

create function public.restart_approve_retreat_admission(p_request_id uuid)
returns void language plpgsql security definer set search_path='' as $$
declare
 actor uuid := auth.uid();
 target public.restart_retreat_admissions%rowtype;
begin
 if actor is null or (auth.jwt()->>'is_anonymous') is not distinct from 'true' then
  raise exception 'Account required' using errcode='42501';
 end if;

 select a.* into target from public.restart_retreat_admissions a
 join public.restart_retreat_members m on m.cohort_id=a.cohort_id and m.user_id=actor and m.role='mentor'
 where a.id=p_request_id
 for share of m for update of a;

 if not found then
  raise exception 'Admission unavailable' using errcode='42501';
 end if;

 if target.status='approved' then return; end if;

 insert into public.restart_retreat_members(cohort_id,user_id,role)
 values (target.cohort_id,target.applicant_id,'participant')
 on conflict (cohort_id,user_id) do nothing;

 update public.restart_retreat_admissions
 set status='approved', approved_at=clock_timestamp()
 where id=target.id;
end;
$$;

revoke all on function public.restart_submit_retreat_admission(uuid,text),
 public.restart_approve_retreat_admission(uuid) from public, anon, authenticated;
grant execute on function public.restart_submit_retreat_admission(uuid,text),
 public.restart_approve_retreat_admission(uuid) to authenticated;

commit;
