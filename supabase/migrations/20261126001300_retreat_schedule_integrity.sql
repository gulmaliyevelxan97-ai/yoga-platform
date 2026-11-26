begin;

create schema if not exists extensions;
create extension if not exists btree_gist with schema extensions;

-- An item with no end time reserves only its start instant.
-- Explicit ends are exclusive, so consecutive activities can share a boundary.
alter table public.restart_retreat_programme_items
 add constraint retreat_published_schedule_no_overlap exclude using gist (
  cohort_id with =,
  tstzrange(starts_at, coalesce(ends_at, starts_at),
   case when ends_at is null then '[]' else '[)' end) with &&
 ) where (published);

commit;
