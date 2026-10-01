begin;

select plan(31);

set local role authenticated;
select set_config(
  'request.jwt.claims',
  json_build_object(
    'sub', md5('farmer.one@jalmaps.test')::uuid,
    'role', 'authenticated'
  )::text,
  true
);
select set_config('request.jwt.claim.sub', md5('farmer.one@jalmaps.test'), true);
select set_config('request.jwt.claim.role', 'authenticated', true);

select is(public.auth_role()::text, 'farmer', 'role helper reads the trusted profile role');
select is((select count(*)::integer from public.profiles), 1, 'farmer reads own profile only');
select is(
  (select count(*)::integer from public.wells where owner_id = auth.uid()),
  15,
  'farmer reads all owned wells'
);
select is(
  (select count(*)::integer from public.wells where id = md5('well-2')::uuid),
  0,
  'farmer cannot read another farmer well'
);
select is(
  (select count(*)::integer from public.nodes),
  15,
  'farmer can read nodes attached to owned wells'
);
select is(
  (select count(*)::integer from public.alert_rules),
  1,
  'farmer can read own-well alert rules'
);
select is(
  (select count(*)::integer from public.alerts),
  1,
  'farmer can read alerts for owned wells'
);
select is(
  (select count(*)::integer from public.notification_prefs),
  1,
  'farmer reads own notification preferences'
);
select is(
  (select count(*)::integer from public.api_keys),
  1,
  'farmer reads own API-key metadata'
);
select is((select count(*)::integer from public.audit_log), 0, 'farmer cannot read the audit log');

select throws_ok(
  $$select api_key_hash from public.nodes limit 1$$,
  '42501',
  null,
  'client roles cannot select node API-key hashes'
);
select throws_ok(
  $$insert into public.readings (node_id, recorded_at, column_m)
    values (md5('node-1')::uuid, now(), 8)$$,
  '42501',
  null,
  'client roles cannot insert readings'
);
select throws_ok(
  $$update public.profiles set role = 'admin'
    where id = md5('farmer.one@jalmaps.test')::uuid$$,
  '42501',
  null,
  'farmer cannot escalate their own role'
);
select throws_ok(
  $$update public.profiles set admin_area_id = md5('state-telangana')::uuid
    where id = md5('farmer.one@jalmaps.test')::uuid$$,
  '42501',
  null,
  'farmer cannot move their own administrative scope'
);
select lives_ok(
  $$update public.profiles set full_name = full_name
    where id = md5('farmer.one@jalmaps.test')::uuid$$,
  'farmer can update non-privileged profile fields'
);

select set_config(
  'request.jwt.claims',
  json_build_object(
    'sub', md5('village.admin@jalmaps.test')::uuid,
    'role', 'authenticated'
  )::text,
  true
);
select set_config('request.jwt.claim.sub', md5('village.admin@jalmaps.test'), true);
select is(public.auth_role()::text, 'village_admin', 'village admin role is loaded from profile');
select is(
  (select count(*)::integer from public.user_area_ids()),
  1,
  'village admin scope contains the assigned village'
);
select ok(
  (select count(*) > 0
   from public.wells
   where admin_area_id = md5('village-lakshmipuram')::uuid),
  'village admin reads wells in the assigned village'
);
select is(
  (select count(*)::integer
   from public.wells
   where admin_area_id = md5('village-kamalapur')::uuid),
  0,
  'village admin cannot read a different village'
);
select lives_ok(
  $$update public.wells set name = name
    where admin_area_id = md5('village-lakshmipuram')::uuid$$,
  'village admin may update a well in the assigned area'
);
select is(
  (select count(*)::integer from public.alerts),
  1,
  'village admin reads alerts for wells in the assigned village'
);
select lives_ok(
  $$update public.alerts
    set status = 'acknowledged', acknowledged_at = now(), acknowledged_by = auth.uid()
    where status = 'open'$$,
  'village admin update of an in-scope alert executes'
);
select is(
  (select count(*)::integer from public.alerts where status = 'acknowledged'),
  0,
  'village admin cannot update alerts for wells in the assigned village'
);

select set_config(
  'request.jwt.claims',
  json_build_object(
    'sub', md5('district.official@jalmaps.test')::uuid,
    'role', 'authenticated'
  )::text,
  true
);
select set_config('request.jwt.claim.sub', md5('district.official@jalmaps.test'), true);
select is(public.auth_role()::text, 'official', 'official role is loaded from profile');
select ok(
  (select count(*) > 0
   from public.wells
   where admin_area_id in (select public.user_area_ids())),
  'official reads wells in descendant administrative areas'
);
select is(
  (select count(*)::integer from public.alerts),
  2,
  'official can read alert events within the assigned district'
);

select set_config(
  'request.jwt.claims',
  json_build_object(
    'sub', md5('insurer@jalmaps.test')::uuid,
    'role', 'authenticated'
  )::text,
  true
);
select set_config('request.jwt.claim.sub', md5('insurer@jalmaps.test'), true);
select is(public.auth_role()::text, 'insurer', 'insurer role is loaded from profile');
select is((select count(*)::integer from public.wells), 0, 'insurer has no direct well access');
select is((select count(*)::integer from public.readings), 0, 'insurer has no direct reading access');

reset role;

select is(public.is_admin(), false, 'unauthenticated database context is not an admin');
select ok(
  not has_table_privilege('anon', 'public.wells', 'select'),
  'anonymous role has no application-table grants'
);

select * from finish();
rollback;
