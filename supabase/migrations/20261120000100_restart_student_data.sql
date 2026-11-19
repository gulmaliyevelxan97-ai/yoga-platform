begin;

create table public.restart_profiles (
  user_id uuid primary key default auth.uid() references auth.users(id) on delete cascade,
  display_name text not null check (char_length(display_name) <= 40),
  revision integer not null default 1 check (revision > 0)
);

create table public.restart_goals (
  user_id uuid primary key default auth.uid() references auth.users(id) on delete cascade,
  weekly_count integer not null check (weekly_count between 1 and 99),
  revision integer not null default 1 check (revision > 0)
);

create table public.restart_settings (
  user_id uuid primary key default auth.uid() references auth.users(id) on delete cascade,
  locale text not null check (locale in ('ru','az','en')),
  reminder_time text not null check (reminder_time = '' or reminder_time ~ '^([01][0-9]|2[0-3]):[0-5][0-9]$'),
  remind_practice boolean not null,
  remind_schedule boolean not null,
  remind_goal boolean not null,
  revision integer not null default 1 check (revision > 0)
);

create table public.restart_practice_events (
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  client_id uuid not null,
  practice text not null check (practice in ('yoga','meditation','breathing','mobility','strength','recovery')),
  practice_day date not null,
  seconds integer not null check (seconds between 0 and 3600),
  primary key (user_id, client_id)
);
create index restart_practice_events_day_idx on public.restart_practice_events (user_id, practice_day desc, client_id);

create table public.restart_journal (
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  client_id uuid not null,
  entry_date date not null,
  mood smallint not null default 0 check (mood between 0 and 3),
  energy smallint not null default 0 check (energy between 0 and 3),
  wellbeing smallint not null default 0 check (wellbeing between 0 and 3),
  before_note text not null default '' check (char_length(before_note) <= 2000),
  after_note text not null default '' check (char_length(after_note) <= 2000),
  notes text not null default '' check (char_length(notes) <= 2000),
  deleted boolean not null default false,
  revision integer not null default 1 check (revision > 0),
  primary key (user_id, client_id),
  check (not deleted or (mood = 0 and energy = 0 and wellbeing = 0
    and before_note = '' and after_note = '' and notes = ''))
);
create index restart_journal_date_idx on public.restart_journal (user_id, entry_date desc, client_id);

create function public.restart_next_revision()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if tg_op = 'INSERT' then
    new.revision := 1;
  else
    new.revision := old.revision + 1;
  end if;
  return new;
end;
$$;
revoke all on function public.restart_next_revision() from public, anon, authenticated;

do $$
declare
  table_name text;
  -- Supabase anonymous sign-ins also use the authenticated Postgres role.
  own_record constant text :=
    '(select auth.uid()) = user_id and (select auth.jwt()->>''is_anonymous'') is distinct from ''true''';
begin
  foreach table_name in array array['restart_profiles','restart_goals','restart_settings','restart_practice_events','restart_journal'] loop
    execute format('alter table public.%I enable row level security', table_name);
    execute format('revoke all on public.%I from public, anon, authenticated', table_name);
    execute format('grant select, insert, update on public.%I to authenticated', table_name);
    execute format('create policy read_own on public.%I for select to authenticated using (%s)', table_name, own_record);
    execute format('create policy insert_own on public.%I for insert to authenticated with check (%s)', table_name, own_record);
    execute format('create policy update_own on public.%I for update to authenticated using (%s) with check (%s)',
      table_name, own_record, own_record);
    if table_name <> 'restart_practice_events' then
      execute format('create trigger restart_revision before insert or update on public.%I for each row execute function public.restart_next_revision()', table_name);
    end if;
  end loop;
end;
$$;

-- Application deletes clear journal content and retain a UUID marker so an old device
-- cannot restore a deleted record through migration. Account removal cascades all rows.
create function public.restart_guard_journal()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.client_id <> old.client_id or (old.deleted and not new.deleted) then
    raise exception 'Journal identity or deletion state cannot be changed' using errcode = '22023';
  end if;
  return new;
end;
$$;
revoke all on function public.restart_guard_journal() from public, anon, authenticated;
create trigger restart_journal_guard before update on public.restart_journal
  for each row execute function public.restart_guard_journal();

commit;
