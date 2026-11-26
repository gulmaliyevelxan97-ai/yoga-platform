begin;

create function public.restart_import_local(payload jsonb)
returns jsonb
language plpgsql
security invoker
set search_path = ''
as $$
declare
  me uuid := auth.uid();
  imported_journal integer;
  imported_practices integer;
begin
  if me is null or auth.jwt()->>'is_anonymous' = 'true' then
    raise exception 'Authentication required' using errcode = '42501';
  end if;
  if jsonb_typeof(payload) is distinct from 'object'
     or jsonb_typeof(payload->'journal') is distinct from 'array'
     or jsonb_typeof(payload->'practices') is distinct from 'array'
     or octet_length(payload::text) > 2000000 then
    raise exception 'Invalid import payload' using errcode = '22023';
  end if;
  if payload->>'expected_user' is distinct from me::text then
    raise exception 'Import account changed' using errcode = '42501';
  end if;
  if jsonb_array_length(payload->'journal') > 100 or jsonb_array_length(payload->'practices') > 100 then
    raise exception 'Import batch exceeds 100 rows per collection' using errcode = '22023';
  end if;

  if payload ? 'profile' then
    insert into public.restart_profiles (user_id, display_name)
      values (me, payload #>> '{profile,display_name}') on conflict (user_id) do nothing;
  end if;
  if payload ? 'goal' then
    insert into public.restart_goals (user_id, weekly_count)
      values (me, (payload #>> '{goal,weekly_count}')::integer) on conflict (user_id) do nothing;
  end if;
  if payload ? 'settings' then
    insert into public.restart_settings (user_id, locale, reminder_time, remind_practice, remind_schedule, remind_goal)
      select me, locale, reminder_time, remind_practice, remind_schedule, remind_goal
      from jsonb_to_record(payload->'settings') as s(locale text, reminder_time text, remind_practice boolean,
        remind_schedule boolean, remind_goal boolean)
      on conflict (user_id) do nothing;
  end if;

  insert into public.restart_journal (user_id, client_id, entry_date, mood, energy, wellbeing, before_note, after_note, notes)
    select me, client_id, entry_date, mood, energy, wellbeing, before_note, after_note, notes
    from jsonb_to_recordset(payload->'journal') as j(client_id uuid, entry_date date, mood smallint, energy smallint,
      wellbeing smallint, before_note text, after_note text, notes text)
    on conflict (user_id, client_id) do nothing;
  get diagnostics imported_journal = row_count;

  insert into public.restart_practice_events (user_id, client_id, practice, practice_day, seconds)
    select me, client_id, practice, practice_day, seconds
    from jsonb_to_recordset(payload->'practices') as p(client_id uuid, practice text, practice_day date, seconds integer)
    on conflict (user_id, client_id) do nothing;
  get diagnostics imported_practices = row_count;
  return jsonb_build_object('journal', imported_journal, 'practices', imported_practices);
end;
$$;
revoke all on function public.restart_import_local(jsonb) from public, anon, authenticated;
grant execute on function public.restart_import_local(jsonb) to authenticated;

commit;
