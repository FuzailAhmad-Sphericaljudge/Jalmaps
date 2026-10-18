create table public.otp_rate_limits (
  subject_type text not null check (subject_type in ('phone', 'email', 'ip')),
  subject_hash text not null check (subject_hash ~ '^[0-9a-f]{64}$'),
  window_started_at timestamptz not null,
  request_count smallint not null check (request_count > 0),
  primary key (subject_type, subject_hash)
);

create index otp_rate_limits_window_started_at_idx
  on public.otp_rate_limits (window_started_at);

alter table public.otp_rate_limits enable row level security;

revoke all on public.otp_rate_limits from public, anon, authenticated, service_role;

create function public.consume_otp_rate_limit(
  p_destination_type text,
  p_destination_hash text,
  p_ip_hash text
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_now timestamptz := clock_timestamp();
  v_destination_started_at timestamptz;
  v_destination_count smallint;
  v_ip_started_at timestamptz;
  v_ip_count smallint;
begin
  if p_destination_type is null
     or p_destination_type not in ('phone', 'email')
     or p_destination_hash is null
     or p_destination_hash !~ '^[0-9a-f]{64}$'
     or p_ip_hash is null
     or p_ip_hash !~ '^[0-9a-f]{64}$' then
    raise exception 'Invalid OTP rate-limit identifier' using errcode = '22023';
  end if;

  if pg_catalog.pg_try_advisory_xact_lock(913005, 1) then
    delete from public.otp_rate_limits
    where window_started_at <= v_now - interval '24 hours';
  else
    perform pg_catalog.pg_advisory_xact_lock_shared(913005, 1);
  end if;

  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended(
      'otp:destination:' || p_destination_type || ':' || p_destination_hash, 0
    )
  );
  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended('otp:ip:' || p_ip_hash, 0)
  );

  select window_started_at, request_count
  into v_destination_started_at, v_destination_count
  from public.otp_rate_limits
  where subject_type = p_destination_type and subject_hash = p_destination_hash;

  select window_started_at, request_count
  into v_ip_started_at, v_ip_count
  from public.otp_rate_limits
  where subject_type = 'ip' and subject_hash = p_ip_hash;

  if v_destination_started_at is null
     or v_destination_started_at <= v_now - interval '1 hour' then
    v_destination_count := 0;
  end if;

  if v_ip_started_at is null
     or v_ip_started_at <= v_now - interval '1 hour' then
    v_ip_count := 0;
  end if;

  if v_destination_count >= 5 or v_ip_count >= 20 then
    return false;
  end if;

  insert into public.otp_rate_limits (
    subject_type, subject_hash, window_started_at, request_count
  ) values (
    p_destination_type, p_destination_hash, v_now, 1
  )
  on conflict (subject_type, subject_hash) do update
  set window_started_at = case
        when public.otp_rate_limits.window_started_at <= v_now - interval '1 hour'
          then v_now
        else public.otp_rate_limits.window_started_at
      end,
      request_count = case
        when public.otp_rate_limits.window_started_at <= v_now - interval '1 hour'
          then 1
        else public.otp_rate_limits.request_count + 1
      end;

  insert into public.otp_rate_limits (
    subject_type, subject_hash, window_started_at, request_count
  ) values (
    'ip', p_ip_hash, v_now, 1
  )
  on conflict (subject_type, subject_hash) do update
  set window_started_at = case
        when public.otp_rate_limits.window_started_at <= v_now - interval '1 hour'
          then v_now
        else public.otp_rate_limits.window_started_at
      end,
      request_count = case
        when public.otp_rate_limits.window_started_at <= v_now - interval '1 hour'
          then 1
        else public.otp_rate_limits.request_count + 1
      end;

  return true;
end;
$$;

revoke all on function public.consume_otp_rate_limit(text, text, text)
  from public, anon, authenticated;
grant execute on function public.consume_otp_rate_limit(text, text, text) to service_role;
