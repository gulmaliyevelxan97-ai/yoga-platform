-- Staging transport for private mentor/participant messages and cohort announcements.
begin;

create table public.restart_retreat_messages (
 id uuid primary key default gen_random_uuid(),
 cohort_id uuid not null,
 sender_id uuid not null,
 client_id uuid not null,
 recipient_id uuid,
 body text not null check (char_length(body) between 1 and 4000),
 sent_at timestamptz not null default now(),
 foreign key (cohort_id,sender_id)
  references public.restart_retreat_members(cohort_id,user_id) on delete cascade,
 foreign key (cohort_id,recipient_id)
  references public.restart_retreat_members(cohort_id,user_id) on delete cascade,
 unique (cohort_id,sender_id,client_id),
 check (recipient_id is distinct from sender_id)
);

create index restart_retreat_messages_by_sender
 on public.restart_retreat_messages(cohort_id,sender_id,sent_at desc,id);
create index restart_retreat_messages_by_recipient
 on public.restart_retreat_messages(cohort_id,recipient_id,sent_at desc,id);

create table public.restart_retreat_message_reads (
 message_id uuid not null references public.restart_retreat_messages(id) on delete cascade,
 reader_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
 read_at timestamptz not null default now(),
 primary key (reader_id,message_id)
);

create index restart_retreat_message_reads_by_message
 on public.restart_retreat_message_reads(message_id);

alter table public.restart_retreat_messages enable row level security;
alter table public.restart_retreat_message_reads enable row level security;
revoke all on public.restart_retreat_messages, public.restart_retreat_message_reads
 from public, anon, authenticated;
grant select (id,cohort_id,sender_id,recipient_id,body,sent_at)
 on public.restart_retreat_messages to authenticated;
grant select on public.restart_retreat_message_reads to authenticated;
grant insert (message_id) on public.restart_retreat_message_reads to authenticated;

create policy retreat_messages_read on public.restart_retreat_messages for select to authenticated
 using (
  exists (select 1 from public.restart_retreat_members m
   where m.cohort_id=restart_retreat_messages.cohort_id
    and m.user_id=(select auth.uid()))
  and (select auth.jwt()->>'is_anonymous') is distinct from 'true'
  and (recipient_id is null or (select auth.uid()) in (sender_id,recipient_id))
 );

create policy retreat_read_receipts_read on public.restart_retreat_message_reads for select to authenticated
 using (reader_id=(select auth.uid()) and exists (
  select 1 from public.restart_retreat_messages m
  where m.id=restart_retreat_message_reads.message_id
 ));

create policy retreat_read_receipts_add on public.restart_retreat_message_reads for insert to authenticated
 with check (reader_id=(select auth.uid()) and exists (
  select 1 from public.restart_retreat_messages m
  where m.id=restart_retreat_message_reads.message_id and m.sender_id<>(select auth.uid())
 ));

-- Each write locks the current sender and recipient memberships before validating roles.
-- The caller cannot choose sender identity, sent time, or announcement audience.
create function public.restart_send_retreat_message(
 p_cohort_id uuid,p_recipient_id uuid,p_body text,p_client_id uuid default gen_random_uuid()
)
returns uuid language plpgsql security definer set search_path='' as $$
declare
 actor uuid := auth.uid();
 sender_role text;
 recipient_role text;
 normalized_body text := btrim(p_body,E' \t\n\r');
 message uuid;
begin
 if actor is null or (auth.jwt()->>'is_anonymous') is not distinct from 'true' then
  raise exception 'Account required' using errcode='42501';
 end if;

 select m.role into sender_role from public.restart_retreat_members m
 where m.cohort_id=p_cohort_id and m.user_id=actor for share;
 if sender_role is null or p_recipient_id is not distinct from actor then
  raise exception 'Messaging unavailable' using errcode='42501';
 end if;

 if p_recipient_id is null then
  if sender_role<>'mentor' then
   raise exception 'Messaging unavailable' using errcode='42501';
  end if;
 else
  select m.role into recipient_role from public.restart_retreat_members m
  where m.cohort_id=p_cohort_id and m.user_id=p_recipient_id for share;
  if recipient_role is null or recipient_role=sender_role then
   raise exception 'Messaging unavailable' using errcode='42501';
  end if;
 end if;

 if p_client_id is null or normalized_body is null or char_length(normalized_body) not between 1 and 4000 then
  raise exception 'Invalid message' using errcode='22023';
 end if;

 insert into public.restart_retreat_messages(cohort_id,sender_id,client_id,recipient_id,body)
 values (p_cohort_id,actor,p_client_id,p_recipient_id,normalized_body)
 on conflict (cohort_id,sender_id,client_id) do nothing
 returning id into message;
 if message is null then
  select m.id into message from public.restart_retreat_messages m
  where m.cohort_id=p_cohort_id and m.sender_id=actor and m.client_id=p_client_id
   and m.recipient_id is not distinct from p_recipient_id and m.body=normalized_body;
  if message is null then
   raise exception 'Message request already used' using errcode='22023';
  end if;
 end if;
 return message;
end;
$$;

create function public.restart_mark_retreat_message_read(p_message_id uuid)
returns void language sql security invoker set search_path='' as $$
 insert into public.restart_retreat_message_reads(message_id)
 values (p_message_id)
 on conflict (reader_id,message_id) do nothing
$$;

create function public.restart_retreat_unread_count(p_cohort_id uuid)
returns bigint language sql stable security invoker set search_path='' as $$
 select count(*) from public.restart_retreat_messages m
 where m.cohort_id=p_cohort_id and m.sender_id<>(select auth.uid())
 and not exists (
  select 1 from public.restart_retreat_message_reads r
  where r.message_id=m.id and r.reader_id=(select auth.uid())
 )
$$;

revoke all on function public.restart_send_retreat_message(uuid,uuid,text,uuid),
 public.restart_mark_retreat_message_read(uuid), public.restart_retreat_unread_count(uuid)
 from public, anon, authenticated;
grant execute on function public.restart_send_retreat_message(uuid,uuid,text,uuid),
 public.restart_mark_retreat_message_read(uuid), public.restart_retreat_unread_count(uuid)
 to authenticated;

commit;
