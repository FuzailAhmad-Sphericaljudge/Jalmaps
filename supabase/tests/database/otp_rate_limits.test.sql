begin;

select plan(10);

select ok(
  (select relrowsecurity
   from pg_catalog.pg_class
   where oid = 'public.otp_rate_limits'::regclass),
  'OTP rate-limit storage has RLS enabled'
);

select ok(
  not has_table_privilege('anon', 'public.otp_rate_limits', 'select')
  and not has_table_privilege('authenticated', 'public.otp_rate_limits', 'select')
  and not has_table_privilege('service_role', 'public.otp_rate_limits', 'select'),
  'no API role can read OTP rate-limit storage directly'
);

select ok(
  has_function_privilege(
    'service_role',
    'public.consume_otp_rate_limit(text,text,text)',
    'execute'
  )
  and not has_function_privilege(
    'anon',
    'public.consume_otp_rate_limit(text,text,text)',
    'execute'
  )
  and not has_function_privilege(
    'authenticated',
    'public.consume_otp_rate_limit(text,text,text)',
    'execute'
  ),
  'only the service role can execute the rate-limit RPC'
);

select set_config('request.jwt.claims', '{"role":"service_role"}', true);
set local role service_role;

select is(
  (with attempts as materialized (
     select public.consume_otp_rate_limit(
       'phone', repeat('a', 64), repeat('b', 64)
     ) as allowed
     from generate_series(1, 6)
   )
   select count(*)::integer from attempts where allowed),
  5,
  'a phone destination is allowed five times per hour'
);

select is(
  public.consume_otp_rate_limit('phone', repeat('a', 64), repeat('c', 64)),
  false,
  'the sixth attempt for a phone is denied'
);

select is(
  public.consume_otp_rate_limit('phone', repeat('d', 64), repeat('c', 64)),
  true,
  'a denied destination attempt does not consume the IP allowance'
);

select is(
  (with attempts as materialized (
     select public.consume_otp_rate_limit(
       'email', repeat('9', 64), repeat('8', 64)
     ) as allowed
     from generate_series(1, 6)
   )
   select count(*)::integer from attempts where allowed),
  5,
  'an email destination is also limited to five requests per hour'
);

select is(
  (with attempts as materialized (
     select public.consume_otp_rate_limit(
       'email', lpad(to_hex(attempt), 64, '0'), repeat('e', 64)
     ) as allowed
     from generate_series(1, 21) as attempt
   )
   select count(*)::integer from attempts where allowed),
  20,
  'an IP is allowed twenty times per hour across email destinations'
);

select is(
  public.consume_otp_rate_limit('email', repeat('f', 64), repeat('e', 64)),
  false,
  'the twenty-first attempt from an IP is denied'
);

reset role;

select ok(
  exists (
    select 1
    from public.otp_rate_limits
    where subject_type = 'phone'
      and subject_hash = repeat('a', 64)
      and request_count = 5
  )
  and exists (
    select 1
    from public.otp_rate_limits
    where subject_type = 'ip'
      and subject_hash = repeat('b', 64)
      and request_count = 5
  ),
  'successful requests atomically increment destination and IP counters'
);

select * from finish();
rollback;
