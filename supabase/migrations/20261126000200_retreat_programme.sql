-- Programme content is scoped to a retreat cohort and populated by the server.
begin;

create table public.restart_retreat_programme_items (
 id uuid primary key default gen_random_uuid(),
 cohort_id uuid not null references public.restart_retreat_cohorts(id) on delete cascade,
 title text not null check (char_length(btrim(title)) between 1 and 160),
 description text not null default '' check (char_length(description) <= 4000),
 starts_at timestamptz check (isfinite(starts_at)),
 ends_at timestamptz check (isfinite(ends_at)),
 published boolean not null default false,
 check (ends_at is null or (starts_at is not null and ends_at > starts_at)),
 check (not published or starts_at is not null)
);

create index restart_retreat_programme_by_cohort
 on public.restart_retreat_programme_items(cohort_id, starts_at, id);

alter table public.restart_retreat_programme_items enable row level security;
revoke all on public.restart_retreat_programme_items from public, anon, authenticated;
grant select on public.restart_retreat_programme_items to authenticated;

create policy retreat_programme_read on public.restart_retreat_programme_items for select to authenticated
 using (exists (
  select 1 from public.restart_retreat_members m
  where m.cohort_id=restart_retreat_programme_items.cohort_id
   and m.user_id=(select auth.uid())
   and (restart_retreat_programme_items.published or m.role='mentor')
 ));

commit;
