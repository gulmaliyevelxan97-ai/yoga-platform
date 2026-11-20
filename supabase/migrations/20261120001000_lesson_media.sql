-- Optional external video. Existing lesson access policies still govern this column.
alter table public.restart_lessons
  add column media_url text,
  add constraint restart_lessons_media_url_check check (
    media_url is null or (
      char_length(media_url) <= 80 and media_url !~ '[[:cntrl:]]' and
      media_url ~ '^https://(www[.]youtube[.]com/watch[?]v=[A-Za-z0-9_-]{11}|youtu[.]be/[A-Za-z0-9_-]{11}|vimeo[.]com/[1-9][0-9]{0,11})$'
    )
  );

grant insert (media_url), update (media_url) on public.restart_lessons to authenticated;
