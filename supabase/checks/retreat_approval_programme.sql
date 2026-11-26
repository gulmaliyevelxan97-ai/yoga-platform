-- Run on restart-staging only. The exception block rolls back all fixture writes.
do $$
declare
 mentor uuid := gen_random_uuid();
 participant uuid := gen_random_uuid();
 outsider uuid := gen_random_uuid();
 cohort uuid := gen_random_uuid();
 admission uuid;
 item public.restart_retreat_programme_items;
begin
 begin
  insert into auth.users(id) values (mentor),(participant),(outsider);
  insert into public.restart_retreat_cohorts(id,title,admission_open)
   values (cohort,'Synthetic QA cohort',true);
  insert into public.restart_retreat_members(cohort_id,user_id,role) values (cohort,mentor,'mentor');
  set local role authenticated;

  perform set_config('request.jwt.claims',jsonb_build_object('sub',participant,'is_anonymous',false)::text,true);
  admission := public.restart_submit_retreat_admission(cohort,'Synthetic QA participant');
  if exists(select 1 from public.restart_retreat_members m where m.cohort_id=cohort) then
   raise exception 'Pending applicant gained cohort access';
  end if;

  perform set_config('request.jwt.claims',jsonb_build_object('sub',mentor,'is_anonymous',false)::text,true);
  perform public.restart_approve_retreat_admission(admission);
  item := public.restart_save_retreat_programme_item(cohort,null,null,'Synthetic QA item','',
   '2026-11-29 10:00+04'::timestamptz,null);

  perform set_config('request.jwt.claims',jsonb_build_object('sub',participant,'is_anonymous',false)::text,true);
  if not exists(select 1 from public.restart_retreat_members m where m.cohort_id=cohort and m.role='participant')
    or exists(select 1 from public.restart_retreat_programme_items p where p.id=item.id) then
   raise exception 'Member or draft visibility is incorrect';
  end if;

  perform set_config('request.jwt.claims',jsonb_build_object('sub',mentor,'is_anonymous',false)::text,true);
  perform public.restart_publish_retreat_programme_item(cohort,item.id,item.revision);
  perform set_config('request.jwt.claims',jsonb_build_object('sub',participant,'is_anonymous',false)::text,true);
  if not exists(select 1 from public.restart_retreat_programme_items p where p.id=item.id) then
   raise exception 'Participant cannot see published programme';
  end if;

  perform set_config('request.jwt.claims',jsonb_build_object('sub',outsider,'is_anonymous',false)::text,true);
  if exists(select 1 from public.restart_retreat_programme_items p where p.id=item.id) then
   raise exception 'Unaffiliated user can see published programme';
  end if;

  raise exception using errcode='P0111', message='Revert synthetic retreat fixtures';
 exception when sqlstate 'P0111' then
  raise notice 'Approval and programme smoke passed. Synthetic fixtures rolled back.';
 end;
end;
$$;
