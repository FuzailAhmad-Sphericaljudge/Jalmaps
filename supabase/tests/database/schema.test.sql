begin;

select plan(17);

select ok(
  (not exists (
    select expected.table_name
    from (values
      ('admin_areas'),
      ('profiles'),
      ('wells'),
      ('nodes'),
      ('readings'),
      ('alert_rules'),
      ('alerts'),
      ('notification_prefs'),
      ('api_keys'),
      ('audit_log')
    ) as expected(table_name)
    left join pg_catalog.pg_class as relation
      on relation.relname = expected.table_name
     and relation.relnamespace = 'public'::regnamespace
    where relation.oid is null
  ) and not exists (
    select 1
    from pg_catalog.pg_class as relation
    where relation.relnamespace = 'public'::regnamespace
      and relation.relkind in ('r', 'p')
      and not relation.relrowsecurity
  )),
  'all expected tables exist and every public table has RLS enabled'
);

select is(
  (select count(*)::integer
   from pg_catalog.pg_policy as policy
   join pg_catalog.pg_class as relation on relation.oid = policy.polrelid
   where relation.relnamespace = 'public'::regnamespace),
  0,
  'Phase 4 has no permissive role policies'
);

select is(
  public.calculate_depth_to_water_m(12.5, 30),
  17.5::numeric,
  'depth helper returns hang depth minus water column in metres'
);

select throws_ok(
  $$insert into public.admin_areas (code, level, parent_id, names)
    values ('test-invalid-village', 'village', md5('state-andhra-pradesh')::uuid, '{"en":"Invalid"}')$$,
  '23514',
  null,
  'a village cannot use a state as its parent'
);

select throws_ok(
  $$insert into public.admin_areas (
      code, level, names, centroid_lat, centroid_lng
    ) values (
      'test-partial-centroid', 'state', '{"en":"Invalid"}', 15, null
    )$$,
  '23514',
  null,
  'administrative centroid coordinates must be both null or both valid'
);

select throws_ok(
  $$insert into public.wells (
      admin_area_id, name, well_type, latitude, longitude, total_depth_m
    ) values (
      md5('village-lakshmipuram')::uuid, 'Invalid depth',
      'borewell', 14.635, 77.61, 0
    )$$,
  '23514',
  null,
  'well depth must be a positive metre value'
);

select is(
  (select count(*)::integer from public.readings),
  0,
  'the development seed does not add readings'
);

insert into public.readings (node_id, recorded_at, column_m)
values
  (md5('node-1')::uuid, '2026-09-01T00:00:00Z', 10),
  (md5('node-1')::uuid, '2026-09-02T00:00:00Z', 11)
on conflict (node_id, recorded_at) do nothing;

insert into public.readings (node_id, recorded_at, column_m)
values (md5('node-1')::uuid, '2026-09-02T00:00:00Z', 11)
on conflict (node_id, recorded_at) do nothing;

select is(
  (select count(*)::integer
   from public.readings
   where node_id = md5('node-1')::uuid
     and recorded_at = '2026-09-02T00:00:00Z'),
  1,
  'duplicate node/timestamp inserts are idempotent'
);

select is(
  (select latest.reading_id
   from public.latest_reading as latest
   where latest.node_id = md5('node-1')::uuid),
  (select reading.id
   from public.readings as reading
   where reading.node_id = md5('node-1')::uuid
   order by reading.recorded_at desc, reading.id desc
   limit 1),
  'latest_reading selects the newest observation for each node'
);

select ok(
  (select count(*) = 36 from public.admin_areas where level = 'village'),
  'the development hierarchy includes more than twenty villages'
);

select is(
  (select count(distinct role)::integer from public.profiles),
  5,
  'seed profiles cover all five application roles'
);

select ok(
  (select count(*) = 30 and bool_and(is_simulated)
   from public.nodes),
  'all thirty seeded wells have simulated sensor nodes'
);

select lives_ok(
  $$insert into auth.users (
      id, aud, role, phone, phone_confirmed_at, encrypted_password,
      raw_app_meta_data, raw_user_meta_data, created_at, updated_at
    ) values (
      'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'authenticated', 'authenticated',
      '+919999999999', now(), '',
      '{"provider":"phone","providers":["phone"]}'::jsonb,
      '{"preferred_locale":"hi","role":"admin","full_name":"New Farmer"}'::jsonb,
      now(), now()
    )$$,
  'auth.users insert creates the linked application profile'
);

select is(
  (select role::text from public.profiles where id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'),
  'farmer',
  'new Auth profiles ignore client role metadata and default to farmer'
);

select is(
  (select preferred_locale from public.profiles where id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'),
  'hi',
  'new Auth profiles preserve a supported locale preference from metadata'
);

select is(
  (select preferred_unit::text from public.profiles where id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'),
  'm',
  'new Auth profiles default to metre units'
);

select ok(
  (select onboarding_completed_at is null and crops = '{}'
   from public.profiles where id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'),
  'new Auth profiles begin with incomplete onboarding and no crop preferences'
);

select * from finish();
rollback;
