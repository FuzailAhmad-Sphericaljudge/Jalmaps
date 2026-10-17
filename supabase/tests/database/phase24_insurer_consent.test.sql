BEGIN;
SELECT plan(12);

-- 1. Table and Column Existence
SELECT has_column('public', 'profiles', 'data_sharing_consent', 'profiles has data_sharing_consent');
SELECT has_column('public', 'profiles', 'data_sharing_consent_at', 'profiles has data_sharing_consent_at');
SELECT has_table('public', 'insurer_area_grants', 'insurer_area_grants table exists');
SELECT has_table('public', 'insurer_api_keys', 'insurer_api_keys table exists');
SELECT has_table('public', 'api_usage', 'api_usage table exists');
SELECT has_table('public', 'area_risk_scores', 'area_risk_scores table exists');

-- 2. Function Existence
SELECT has_function('public', 'get_insurer_village_stats', ARRAY['uuid', 'integer'], 'get_insurer_village_stats exists');
SELECT has_function('public', 'get_insurer_village_timeseries', ARRAY['uuid', 'date', 'date', 'text', 'integer'], 'get_insurer_village_timeseries exists');

-- 3. Behavioral Test Setup
DO $$
DECLARE
  v_state_id uuid := gen_random_uuid();
  v_dist_id uuid := gen_random_uuid();
  v_block_id uuid := gen_random_uuid();
  v_village_id uuid := gen_random_uuid();
  u1 uuid := gen_random_uuid();
  u2 uuid := gen_random_uuid();
  u3 uuid := gen_random_uuid();
  w1 uuid := gen_random_uuid();
  w2 uuid := gen_random_uuid();
  w3 uuid := gen_random_uuid();
  n1 uuid := gen_random_uuid();
  n2 uuid := gen_random_uuid();
  n3 uuid := gen_random_uuid();
  r_rec record;
BEGIN
  -- Insert mock hierarchy
  INSERT INTO public.admin_areas (id, code, level, names)
  VALUES (v_state_id, 'STATE_PH24', 'state', '{"en": "State 24"}'::jsonb);

  INSERT INTO public.admin_areas (id, code, level, names, parent_id)
  VALUES (v_dist_id, 'DIST_PH24', 'district', '{"en": "District 24"}'::jsonb, v_state_id);

  INSERT INTO public.admin_areas (id, code, level, names, parent_id)
  VALUES (v_block_id, 'BLOCK_PH24', 'block', '{"en": "Block 24"}'::jsonb, v_dist_id);

  INSERT INTO public.admin_areas (id, code, level, names, parent_id)
  VALUES (v_village_id, 'VILLAGE_PH24', 'village', '{"en": "Village 24"}'::jsonb, v_block_id);

  -- Insert 3 users & profiles with consent = true
  INSERT INTO auth.users (id, email) VALUES (u1, 'f1@example.com'), (u2, 'f2@example.com'), (u3, 'f3@example.com');

  INSERT INTO public.profiles (id, full_name, role, data_sharing_consent, data_sharing_consent_at)
  VALUES
    (u1, 'Farmer 1', 'farmer', true, now()),
    (u2, 'Farmer 2', 'farmer', true, now()),
    (u3, 'Farmer 3', 'farmer', true, now())
  ON CONFLICT (id) DO UPDATE SET
    full_name = EXCLUDED.full_name,
    role = EXCLUDED.role,
    data_sharing_consent = EXCLUDED.data_sharing_consent,
    data_sharing_consent_at = EXCLUDED.data_sharing_consent_at;

  -- Insert wells and nodes
  INSERT INTO public.wells (id, owner_id, admin_area_id, name, well_type, latitude, longitude)
  VALUES
    (w1, u1, v_village_id, 'Well 1', 'borewell', 20.1, 78.1),
    (w2, u2, v_village_id, 'Well 2', 'borewell', 20.2, 78.2),
    (w3, u3, v_village_id, 'Well 3', 'borewell', 20.3, 78.3);

  INSERT INTO public.nodes (id, well_id, hardware_id, status, last_seen_at)
  VALUES
    (n1, w1, 'HW-P24-1', 'active', now()),
    (n2, w2, 'HW-P24-2', 'active', now()),
    (n3, w3, 'HW-P24-3', 'active', now());

  -- Insert readings
  INSERT INTO public.readings (node_id, recorded_at, column_m, depth_to_water_m)
  VALUES
    (n1, now(), 5.0, 12.5),
    (n2, now(), 5.0, 14.0),
    (n3, now(), 5.0, 15.5);

  -- Store village_id for tests in temporary table
  CREATE TEMP TABLE ph24_ctx AS SELECT v_village_id AS village_id, u1 AS user1_id;
END;
$$;

-- 4. Test: When 3 consenting wells exist, stats are not privacy masked
SELECT is(
  (SELECT privacy_masked FROM public.get_insurer_village_stats((SELECT village_id FROM ph24_ctx), 3)),
  false,
  '3 consenting wells produce unmasked village statistics'
);

SELECT is(
  (SELECT consenting_wells_count FROM public.get_insurer_village_stats((SELECT village_id FROM ph24_ctx), 3)),
  3,
  'Consenting wells count is 3'
);

-- 5. Test: Withdrawing consent from 1 farmer drops count to 2 and triggers privacy masking
UPDATE public.profiles
SET data_sharing_consent = false,
    data_sharing_consent_at = now()
WHERE id = (SELECT user1_id FROM ph24_ctx);

SELECT is(
  (SELECT privacy_masked FROM public.get_insurer_village_stats((SELECT village_id FROM ph24_ctx), 3)),
  true,
  'Withdrawn consent drops count below 3 and masks statistics'
);

-- 6. Test: Audit log recorded the consent revocation
SELECT is(
  (SELECT count(*)::int FROM public.audit_log WHERE entity_id = (SELECT user1_id FROM ph24_ctx) AND action = 'consent_withdrawn'),
  1,
  'Audit log recorded the consent_withdrawn action'
);

SELECT * FROM finish();
ROLLBACK;
