BEGIN;
SELECT plan(6);

-- 1. Test that the postgis extension exists
SELECT has_extension('extensions', 'postgis', 'postgis extension should exist');

-- 2. Test that the geom column exists on wells
SELECT has_column('public', 'wells', 'geom', 'wells table should have a geom column');

-- 3. Test that the geom column is of type geography
SELECT col_type_is('public', 'wells', 'geom', 'geography(Point,4326)', 'geom column should be geography(Point, 4326)');

-- 4. Test that the GiST index exists
SELECT has_index('public', 'wells', 'idx_wells_geom', 'geom', 'wells table should have a GiST index on geom');

-- 5. Test the trigger functionality: inserting a row sets the geom
INSERT INTO admin_areas (id, type, name) VALUES ('test-area', 'village', 'Test Area');
INSERT INTO wells (id, area_id, owner_id, latitude, longitude)
VALUES ('test-well', 'test-area', (SELECT id FROM users LIMIT 1), 20.0, 78.0);

SELECT is(
  (SELECT ST_X(geom::geometry) FROM wells WHERE id = 'test-well'),
  78.0::double precision,
  'trigger should set correct longitude'
);

SELECT is(
  (SELECT ST_Y(geom::geometry) FROM wells WHERE id = 'test-well'),
  20.0::double precision,
  'trigger should set correct latitude'
);

SELECT * FROM finish();
ROLLBACK;
