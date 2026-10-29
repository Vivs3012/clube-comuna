-- The first voting cycle started on 29 October 2026. Existing dates and
-- availability rows are intentionally preserved.
alter table public.club_config
  add column if not exists date_voting_opened_at date;

update public.club_config
set date_voting_opened_at = date '2026-10-29'
where id = 1 and date_voting_opened_at is null;

alter table public.club_config
  alter column date_voting_opened_at set default current_date,
  alter column date_voting_opened_at set not null;

create or replace function public.suggest_club_date(
  p_date date,
  p_time time without time zone default time '19:00'
)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  poll_status text;
  opened_at date;
  option_text text;
  affected_rows integer;
begin
  if auth.uid() is null then
    raise exception 'Entre no clube para sugerir uma data.' using errcode = '42501';
  end if;
  if not exists (
    select 1 from public.club_profiles
    where id = auth.uid() and is_active
  ) then
    raise exception 'Este perfil não está ativo no clube.' using errcode = '42501';
  end if;
  if p_date is null or p_time is null then
    raise exception 'Informe uma data e um horário.';
  end if;

  select status ->> 'date', date_voting_opened_at
  into poll_status, opened_at
  from public.club_config
  where id = 1
  for update;

  if poll_status is distinct from 'open' then
    raise exception 'A votação de datas está encerrada.';
  end if;
  if p_date < opened_at or p_date < current_date then
    raise exception 'Sugira uma data a partir do início da votação e que ainda não tenha passado.';
  end if;

  option_text := to_char(p_date, 'YYYY-MM-DD') || 'T' || to_char(p_time, 'HH24:MI');
  update public.club_config cfg
  set date_options = (
    select array_agg(options.value order by options.value)
    from (
      select distinct value
      from unnest(coalesce(cfg.date_options, '{}'::text[]) || array[option_text]) as items(value)
    ) as options
  ),
  updated_at = now()
  where cfg.id = 1
    and not (option_text = any(coalesce(cfg.date_options, '{}'::text[])));

  get diagnostics affected_rows = row_count;
  if affected_rows > 0 then
    return 'added';
  end if;
  return 'already_exists';
end;
$$;

revoke all on function public.suggest_club_date(date, time without time zone) from public, anon;
grant execute on function public.suggest_club_date(date, time without time zone) to authenticated;
