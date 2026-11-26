-- Run on restart-staging only. All writes are reverted by the inner block.
do $$
<<retreat_consent_comms>>
declare
 mentor uuid := gen_random_uuid();
 participant uuid := gen_random_uuid();
 peer uuid := gen_random_uuid();
 cohort uuid := gen_random_uuid();
 form_id uuid;
 message_id uuid;
 assignment public.restart_retreat_assignments;
begin
 begin
  insert into auth.users(id) values (mentor),(participant),(peer);
  insert into public.restart_retreat_cohorts(id,title) values (cohort,'Synthetic QA communications');
  insert into public.restart_retreat_members(cohort_id,user_id,role)
   values (cohort,mentor,'mentor'),(cohort,participant,'participant'),(cohort,peer,'participant');
  set local role authenticated;
  perform set_config('request.jwt.claims',jsonb_build_object('sub',mentor,'is_anonymous',false)::text,true);
  insert into public.restart_retreat_forms(cohort_id,title,questions)
   values (cohort,'Synthetic QA form','[{"text":"Synthetic question"}]') returning id into form_id;
  update public.restart_retreat_forms set published=true where id=form_id;
  message_id := public.restart_send_retreat_message(cohort,participant,'Synthetic QA message');
  assignment := public.restart_save_retreat_assignment(cohort,null,null,participant,'Synthetic QA task','',null);

  perform set_config('request.jwt.claims',jsonb_build_object('sub',participant,'is_anonymous',false)::text,true);
  insert into public.restart_retreat_responses(cohort_id,form_id,answers) values (cohort,form_id,'{}');
  insert into public.restart_journal(client_id,entry_date,notes) values (gen_random_uuid(),current_date,'Synthetic QA diary');
  perform public.restart_submit_retreat_assignment(cohort,assignment.id,'Synthetic QA answer',true);
  if public.restart_retreat_unread_count(cohort)<>1 then raise exception 'Unread count mismatch'; end if;
  perform public.restart_mark_retreat_message_read(message_id);
  if public.restart_retreat_unread_count(cohort)<>0 then raise exception 'Receipt did not clear unread'; end if;

  perform set_config('request.jwt.claims',jsonb_build_object('sub',mentor,'is_anonymous',false)::text,true);
  if exists(select 1 from public.restart_retreat_responses r where r.form_id=retreat_consent_comms.form_id)
   or exists(select 1 from public.restart_journal j where j.user_id=participant) then
   raise exception 'Private answer or diary was exposed';
  end if;

  perform set_config('request.jwt.claims',jsonb_build_object('sub',participant,'is_anonymous',false)::text,true);
  update public.restart_retreat_responses r set share_with_mentor=true where r.form_id=retreat_consent_comms.form_id;
  perform set_config('request.jwt.claims',jsonb_build_object('sub',mentor,'is_anonymous',false)::text,true);
  if not exists(select 1 from public.restart_retreat_responses r where r.form_id=retreat_consent_comms.form_id)
   then raise exception 'Shared response was not accessible'; end if;

  perform set_config('request.jwt.claims',jsonb_build_object('sub',peer,'is_anonymous',false)::text,true);
  if exists(select 1 from public.restart_retreat_messages m where m.id=message_id)
   or exists(select 1 from public.restart_retreat_assignments a where a.id=assignment.id)
   or exists(select 1 from public.restart_retreat_responses r where r.form_id=retreat_consent_comms.form_id) then
   raise exception 'Peer could view protected retreat data';
  end if;
  raise exception using errcode='P0112',message='Revert fixtures';
 exception when sqlstate 'P0112' then
  raise notice 'Consent, messaging and tasks smoke passed. Synthetic fixtures rolled back.';
 end;
end;
$$;
