begin;

alter table public.restart_programs
  add column if not exists summary text not null default '' check (char_length(summary) <= 1600),
  add column if not exists direction text check (direction in ('mind','body','nutrition','life')),
  add column if not exists level text check (level in ('beginner','intermediate','advanced','all')),
  add column if not exists minutes integer check (minutes between 1 and 10080),
  add column if not exists revision integer not null default 1 check (revision > 0);

-- Existing program policies restrict draft edits and control enrollment visibility.
grant update (summary, direction, level, minutes) on public.restart_programs to authenticated;
drop trigger if exists restart_program_revision on public.restart_programs;
create trigger restart_program_revision before insert or update on public.restart_programs
  for each row execute function public.restart_next_revision();

commit;
