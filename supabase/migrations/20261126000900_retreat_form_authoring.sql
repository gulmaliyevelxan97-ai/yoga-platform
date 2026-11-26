-- Mentors author drafts in their own cohorts. Published questions are immutable.
begin;

grant insert (cohort_id,title,questions), update (title,questions,published)
 on public.restart_retreat_forms to authenticated;

create policy retreat_form_create on public.restart_retreat_forms for insert to authenticated
 with check (not published and exists (
  select 1 from public.restart_retreat_members m
  where m.cohort_id=restart_retreat_forms.cohort_id and m.user_id=(select auth.uid()) and m.role='mentor'
 ));

create policy retreat_form_edit on public.restart_retreat_forms for update to authenticated
 using (not published and exists (
  select 1 from public.restart_retreat_members m
  where m.cohort_id=restart_retreat_forms.cohort_id and m.user_id=(select auth.uid()) and m.role='mentor'
 ))
 with check ((not published or jsonb_array_length(questions)>0) and exists (
  select 1 from public.restart_retreat_members m
  where m.cohort_id=restart_retreat_forms.cohort_id and m.user_id=(select auth.uid()) and m.role='mentor'
 ));

commit;
