begin;

select plan(14);

-- Test actors
-- md5('district.official@jalmaps.test')::uuid  (role: official, assigned area)
-- md5('village.admin@jalmaps.test')::uuid      (role: village_admin, assigned village)
-- md5('farmer.one@jalmaps.test')::uuid         (role: farmer)
-- md5('platform.admin@jalmaps.test')::uuid    (role: admin)

-- Check tables exist
select has_table('public', 'saved_views', 'saved_views table should exist');
select has_table('public', 'area_notes', 'area_notes table should exist');

-- Check RLS is enabled
select ok(
  (select relrowsecurity from pg_catalog.pg_class where relname = 'saved_views' and relnamespace = 'public'::regnamespace),
  'saved_views has RLS enabled'
);
select ok(
  (select relrowsecurity from pg_catalog.pg_class where relname = 'area_notes' and relnamespace = 'public'::regnamespace),
  'area_notes has RLS enabled'
);

-- Set authenticated role for RLS enforcement
set local role authenticated;

-- 1. Test saved_views isolation
-- Farmer creates a saved view
select set_config('request.jwt.claims', json_build_object('sub', md5('farmer.one@jalmaps.test')::uuid, 'role', 'authenticated')::text, true);
select set_config('request.jwt.claim.sub', (md5('farmer.one@jalmaps.test')::uuid)::text, true);
select set_config('request.jwt.claim.role', 'authenticated', true);

insert into public.saved_views (id, user_id, name, filters)
values (
  'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee',
  md5('farmer.one@jalmaps.test')::uuid,
  'Farmer Custom View',
  '{"status": "critical"}'::jsonb
);

select results_eq(
  'select count(*)::integer from public.saved_views where id = ''aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee''',
  array[1],
  'Farmer can see their own saved view'
);

-- Official cannot see farmer saved view
select set_config('request.jwt.claims', json_build_object('sub', md5('district.official@jalmaps.test')::uuid, 'role', 'authenticated')::text, true);
select set_config('request.jwt.claim.sub', (md5('district.official@jalmaps.test')::uuid)::text, true);
select set_config('request.jwt.claim.role', 'authenticated', true);

select results_eq(
  'select count(*)::integer from public.saved_views where id = ''aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee''',
  array[0],
  'Official cannot see other users private saved views'
);

-- Official can create their own saved view
insert into public.saved_views (id, user_id, name, filters, is_default)
values (
  'bbbbbbbb-cccc-dddd-eeee-ffffffffffff',
  md5('district.official@jalmaps.test')::uuid,
  'Official Priority View',
  '{"criticalOnly": true}'::jsonb,
  true
);

select results_eq(
  'select count(*)::integer from public.saved_views where user_id = md5(''district.official@jalmaps.test'')::uuid',
  array[1],
  'Official can see their own saved view'
);

-- 2. Test area_notes and audit trigger
-- Admin inserts area note
select set_config('request.jwt.claims', json_build_object('sub', md5('platform.admin@jalmaps.test')::uuid, 'role', 'authenticated')::text, true);
select set_config('request.jwt.claim.sub', (md5('platform.admin@jalmaps.test')::uuid)::text, true);
select set_config('request.jwt.claim.role', 'authenticated', true);

insert into public.area_notes (id, area_id, author_id, text, status, due_date)
values (
  'cccccccc-dddd-eeee-ffff-000000000000',
  md5('village-lakshmipuram')::uuid,
  md5('platform.admin@jalmaps.test')::uuid,
  'Recharge pit inspection scheduled',
  'open',
  '2026-11-01'
);

select results_eq(
  'select count(*)::integer from public.area_notes where id = ''cccccccc-dddd-eeee-ffff-000000000000''',
  array[1],
  'Admin can see created area note'
);

-- Check audit_log got the record
select results_eq(
  'select count(*)::integer from public.audit_log where entity_type = ''area_note'' and entity_id = ''cccccccc-dddd-eeee-ffff-000000000000'' and action = ''area_note_created''',
  array[1],
  'Audit log recorded area_note_created event'
);

-- Update status to in_progress
update public.area_notes
set status = 'in_progress'
where id = 'cccccccc-dddd-eeee-ffff-000000000000';

select results_eq(
  'select count(*)::integer from public.audit_log where entity_type = ''area_note'' and entity_id = ''cccccccc-dddd-eeee-ffff-000000000000'' and action = ''area_note_updated''',
  array[1],
  'Audit log recorded area_note_updated event'
);

-- Official assigned to area can view note
select set_config('request.jwt.claims', json_build_object('sub', md5('district.official@jalmaps.test')::uuid, 'role', 'authenticated')::text, true);
select set_config('request.jwt.claim.sub', (md5('district.official@jalmaps.test')::uuid)::text, true);
select set_config('request.jwt.claim.role', 'authenticated', true);

select results_eq(
  'select count(*)::integer from public.area_notes where id = ''cccccccc-dddd-eeee-ffff-000000000000''',
  array[1],
  'District official can read area note for assigned region'
);

-- Unassigned farmer cannot see notes for areas they do not manage
select set_config('request.jwt.claims', json_build_object('sub', md5('farmer.one@jalmaps.test')::uuid, 'role', 'authenticated')::text, true);
select set_config('request.jwt.claim.sub', (md5('farmer.one@jalmaps.test')::uuid)::text, true);
select set_config('request.jwt.claim.role', 'authenticated', true);

select results_eq(
  'select count(*)::integer from public.area_notes where id = ''cccccccc-dddd-eeee-ffff-000000000000''',
  array[0],
  'Farmer cannot read official area notes'
);

-- Reset role to delete test records
reset role;
delete from public.saved_views where id in ('aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee', 'bbbbbbbb-cccc-dddd-eeee-ffffffffffff');
delete from public.area_notes where id = 'cccccccc-dddd-eeee-ffff-000000000000';

select is_empty(
  'select id from public.saved_views where id in (''aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee'', ''bbbbbbbb-cccc-dddd-eeee-ffffffffffff'')',
  'Test saved views successfully cleaned up'
);

select is_empty(
  'select id from public.area_notes where id = ''cccccccc-dddd-eeee-ffff-000000000000''',
  'Test area notes successfully cleaned up'
);

select finish();
rollback;
