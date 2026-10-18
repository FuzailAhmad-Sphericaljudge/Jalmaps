BEGIN;
SELECT plan(6);

-- 1. Test boundary column on admin_areas
SELECT has_column('public', 'admin_areas', 'boundary', 'admin_areas should have boundary column');
SELECT has_column('public', 'admin_areas', 'boundary_simplified', 'admin_areas should have boundary_simplified column');

-- 2. Test boundary spatial indexes
SELECT has_index('public', 'admin_areas', 'idx_admin_areas_boundary', 'boundary', 'admin_areas should have GIST index on boundary');
SELECT has_index('public', 'admin_areas', 'idx_admin_areas_boundary_simplified', 'boundary_simplified', 'admin_areas should have GIST index on boundary_simplified');

-- 3. Test well-to-area point-in-polygon trigger
-- Insert a test village with a polygon around lat 18.5, lng 73.8
INSERT INTO admin_areas (
  id,
  code,
  level,
  names,
  boundary
) VALUES (
  '11111111-2222-3333-4444-555555555555',
  'TEST_VILLAGE_001',
  'village',
  '{"en": "Test Village Pip"}'::jsonb,
  ST_Multi(ST_GeomFromText('POLYGON((73.80 18.50, 73.85 18.50, 73.85 18.55, 73.80 18.55, 73.80 18.50))', 4326))
);

-- Insert a well with coordinates inside the test village polygon without specifying admin_area_id
INSERT INTO wells (
  id,
  latitude,
  longitude,
  well_type
) VALUES (
  '66666666-7777-8888-9999-000000000000',
  18.52,
  73.82,
  'borewell'
);

SELECT is(
  (SELECT admin_area_id FROM wells WHERE id = '66666666-7777-8888-9999-000000000000'),
  '11111111-2222-3333-4444-555555555555'::uuid,
  'trigger should automatically assign well to containing village by point-in-polygon'
);

-- 4. Test well with coordinates outside the polygon remains unassigned (or unchanged)
INSERT INTO wells (
  id,
  latitude,
  longitude,
  well_type
) VALUES (
  '77777777-8888-9999-0000-111111111111',
  19.50,
  74.50,
  'borewell'
);

SELECT is(
  (SELECT admin_area_id FROM wells WHERE id = '77777777-8888-9999-0000-111111111111'),
  NULL::uuid,
  'well outside any known boundary polygon should not have admin_area_id assigned'
);

SELECT * FROM finish();
ROLLBACK;
