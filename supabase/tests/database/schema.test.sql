begin;

select plan(25);

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
  25,
  'every application table has its Phase 5 role policies'
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
  (select count(*) = 7
   from public.profiles
   where preferred_text_size = 'normal'
     and preferred_theme = 'system'),
  'profile shell preferences have supported defaults for every seeded user'
);

select ok(
  has_column_privilege('authenticated', 'public.profiles', 'preferred_text_size', 'UPDATE')
  and has_column_privilege('authenticated', 'public.profiles', 'preferred_theme', 'UPDATE'),
  'authenticated profile owners can update shell preference columns'
);

select is(
  (select count(*)::integer
   from auth.users
   where email like '%@jalmaps.test'
     and instance_id = '00000000-0000-0000-0000-000000000000'::uuid
     and phone_confirmed_at is not null
     and confirmation_token = ''
     and recovery_token = ''),
  7,
  'seeded Auth users have the default instance and token values required for OTP lookup'
);

select is(
  (select count(*)::integer
   from auth.identities as identity
   join auth.users as auth_user on auth_user.id = identity.user_id
   where auth_user.email like '%@jalmaps.test'
     and identity.provider in ('phone', 'email')),
  14,
  'every seeded Auth fixture can use its phone and email identities'
);

select ok(
  not has_column_privilege('authenticated', 'public.profiles', 'onboarding_completed_at', 'UPDATE'),
  'onboarding completion timestamps are server-managed'
);

select ok(
  (select onboarding_completed_at is null
   from public.profiles
   where id = md5('onboarding@jalmaps.test')::uuid),
  'seed includes a phone-verifiable farmer who has not completed onboarding'
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

insert into auth.users (
  id, aud, role, email, phone, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at
) values (
  md5('delete-cascade@jalmaps.test')::uuid,
  'authenticated',
  'authenticated',
  'delete-cascade@jalmaps.test',
  '+919999999998',
  '',
  now(),
  '{"provider":"email","providers":["email"]}'::jsonb,
  '{"full_name":"Delete Cascade Test"}'::jsonb,
  now(),
  now()
);

insert into public.wells (
  id, owner_id, admin_area_id, name, well_type, latitude, longitude
) values (
  md5('delete-cascade-well')::uuid,
  md5('delete-cascade@jalmaps.test')::uuid,
  md5('village-lakshmipuram')::uuid,
  'Delete Cascade Test',
  'borewell',
  14.635,
  77.61
);

insert into public.nodes (id, well_id, hardware_id)
values (
  md5('delete-cascade-node')::uuid,
  md5('delete-cascade-well')::uuid,
  'DELETE-CASCADE-NODE'
);

insert into public.readings (node_id, recorded_at, column_m)
values (
  md5('delete-cascade-node')::uuid,
  '2099-01-01T00:00:00Z',
  8
);

insert into public.notification_prefs (profile_id, channel, enabled)
values (md5('delete-cascade@jalmaps.test')::uuid, 'sms', true);

insert into public.api_keys (profile_id, label, key_hash, scopes)
values (
  md5('delete-cascade@jalmaps.test')::uuid,
  'Delete cascade test',
  repeat('a', 64),
  array['wells:read']
);

insert into public.audit_log (actor_id, action, entity_type, entity_id)
values (
  md5('delete-cascade@jalmaps.test')::uuid,
  'account.deleted',
  'profile',
  md5('delete-cascade@jalmaps.test')::uuid
);

delete from auth.users
where id = md5('delete-cascade@jalmaps.test')::uuid;

select is(
  (select (
    (select count(*) from public.profiles where id = md5('delete-cascade@jalmaps.test')::uuid)
    + (select count(*) from public.wells where id = md5('delete-cascade-well')::uuid)
    + (select count(*) from public.nodes where id = md5('delete-cascade-node')::uuid)
    + (select count(*) from public.readings where node_id = md5('delete-cascade-node')::uuid)
    + (select count(*) from public.notification_prefs
       where profile_id = md5('delete-cascade@jalmaps.test')::uuid)
    + (select count(*) from public.api_keys
       where profile_id = md5('delete-cascade@jalmaps.test')::uuid)
  )::integer),
  0,
  'deleting an Auth user cascades their profile, wells, nodes, readings and account data'
);

select ok(
  (select actor_id is null and entity_id = md5('delete-cascade@jalmaps.test')::uuid
   from public.audit_log
   where action = 'account.deleted'
     and entity_type = 'profile'
     and entity_id = md5('delete-cascade@jalmaps.test')::uuid),
  'account deletion retains the audit event while detaching the deleted actor'
);

select * from finish();
rollback;
