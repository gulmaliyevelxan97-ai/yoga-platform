-- Add a terminal decline decision without granting membership.
begin;

alter table public.restart_retreat_admissions
 add column declined_at timestamptz,
 drop constraint restart_retreat_admissions_status_check,
 add constraint restart_retreat_admissions_status_check check (status in ('pending','approved','declined')),
 add constraint restart_retreat_admissions_declined_at_check check ((status='declined') = (declined_at is not null));

create or replace function public.restart_approve_retreat_admission(p_request_id uuid)
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
 if target.status<>'pending' then
  raise exception 'Admission already decided' using errcode='22023';
 end if;

 insert into public.restart_retreat_members(cohort_id,user_id,role)
 values (target.cohort_id,target.applicant_id,'participant')
 on conflict (cohort_id,user_id) do nothing;

 update public.restart_retreat_admissions
 set status='approved', approved_at=clock_timestamp()
 where id=target.id;
end;
$$;

create function public.restart_decline_retreat_admission(p_request_id uuid)
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

 if target.status='declined' then return; end if;
 if target.status<>'pending' then
  raise exception 'Admission already decided' using errcode='22023';
 end if;

 update public.restart_retreat_admissions
 set status='declined', declined_at=clock_timestamp()
 where id=target.id;
end;
$$;

revoke all on function public.restart_decline_retreat_admission(uuid) from public, anon, authenticated;
grant execute on function public.restart_decline_retreat_admission(uuid) to authenticated;

commit;
