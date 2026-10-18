BEGIN;
SELECT plan(8);

-- 1. Test tables exist
SELECT has_table('public', 'area_stats', 'area_stats table should exist');
SELECT has_table('public', 'area_stats_daily', 'area_stats_daily table should exist');

-- 2. Test columns on area_stats
SELECT has_column('public', 'area_stats', 'wells_count', 'area_stats should have wells_count column');
SELECT has_column('public', 'area_stats', 'avg_depth_m', 'area_stats should have avg_depth_m column');
SELECT has_column('public', 'area_stats', 'pct_critical', 'area_stats should have pct_critical column');

-- 3. Test RLS enabled
SELECT table_privs_are(
  'public',
  'area_stats',
  'anon',
  ARRAY[]::text[],
  'anon should have no direct unauthenticated privileges on area_stats'
);

-- 4. Test refresh_area_stats function execution
SELECT has_function('public', 'refresh_area_stats', ARRAY[]::text[], 'refresh_area_stats function exists');

-- Execute refresh_area_stats without error
SELECT lives_ok(
  $$ SELECT public.refresh_area_stats() $$,
  'refresh_area_stats() runs cleanly'
);

SELECT * FROM finish();
ROLLBACK;

