-- Phase 20: Aggregation Tables and Roll-up Engine

-- 1. Create area_stats table for materialized snapshots
CREATE TABLE IF NOT EXISTS public.area_stats (
  area_id uuid PRIMARY KEY REFERENCES public.admin_areas(id) ON DELETE CASCADE,
  as_of timestamptz NOT NULL DEFAULT now(),
  wells_count integer NOT NULL DEFAULT 0,
  nodes_online integer NOT NULL DEFAULT 0,
  avg_depth_m numeric(6, 2),
  median_depth_m numeric(6, 2),
  pct_critical numeric(5, 2) NOT NULL DEFAULT 0,
  pct_warning numeric(5, 2) NOT NULL DEFAULT 0,
  pct_offline numeric(5, 2) NOT NULL DEFAULT 0,
  avg_change_30d_m numeric(6, 2) NOT NULL DEFAULT 0,
  worst_well_id uuid REFERENCES public.wells(id) ON DELETE SET NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Index for ranking and filtering lookups
CREATE INDEX IF NOT EXISTS idx_area_stats_pct_critical ON public.area_stats(pct_critical DESC);
CREATE INDEX IF NOT EXISTS idx_area_stats_avg_change ON public.area_stats(avg_change_30d_m ASC);

-- 2. Create area_stats_daily table for historical trend sparklines
CREATE TABLE IF NOT EXISTS public.area_stats_daily (
  area_id uuid NOT NULL REFERENCES public.admin_areas(id) ON DELETE CASCADE,
  recorded_date date NOT NULL,
  wells_count integer NOT NULL DEFAULT 0,
  avg_depth_m numeric(6, 2),
  median_depth_m numeric(6, 2),
  pct_critical numeric(5, 2) NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (area_id, recorded_date)
);

CREATE INDEX IF NOT EXISTS idx_area_stats_daily_area_date 
  ON public.area_stats_daily(area_id, recorded_date DESC);

-- 3. Procedure to refresh area_stats bottom-up (villages -> blocks -> districts -> states)
CREATE OR REPLACE FUNCTION public.refresh_area_stats()
RETURNS void AS $$
DECLARE
  r_id uuid;
  r_level text;
BEGIN
  -- Village level calculations
  INSERT INTO public.area_stats (
    area_id,
    as_of,
    wells_count,
    nodes_online,
    avg_depth_m,
    median_depth_m,
    pct_critical,
    pct_warning,
    pct_offline,
    avg_change_30d_m,
    worst_well_id,
    updated_at
  )
  WITH latest_readings AS (
    SELECT DISTINCT ON (n.well_id)
      n.well_id,
      r.column_m as current_depth
    FROM public.nodes n
    JOIN public.readings r ON r.node_id = n.id
    ORDER BY n.well_id, r.recorded_at DESC
  ),
  well_active_alerts AS (
    SELECT 
      well_id,
      bool_or(severity = 'critical') as has_critical,
      bool_or(severity = 'warning') as has_warning
    FROM public.alerts
    WHERE status IN ('open', 'acknowledged')
    GROUP BY well_id
  ),
  village_wells AS (
    SELECT 
      w.admin_area_id as area_id,
      w.id as well_id,
      COALESCE(lr.current_depth, 15.0) as current_depth,
      0.0 as trend,
      CASE 
        WHEN COALESCE(al.has_critical, false) THEN 'critical'
        WHEN COALESCE(al.has_warning, false) THEN 'warning'
        ELSE 'normal'
      END as status,
      n.id as node_id,
      n.last_seen_at
    FROM public.wells w
    LEFT JOIN public.nodes n ON n.well_id = w.id
    LEFT JOIN latest_readings lr ON lr.well_id = w.id
    LEFT JOIN well_active_alerts al ON al.well_id = w.id
    WHERE w.admin_area_id IS NOT NULL
  ),
  village_aggs AS (
    SELECT 
      area_id,
      COUNT(DISTINCT well_id)::integer as wells_count,
      COUNT(DISTINCT CASE WHEN last_seen_at > now() - interval '24 hours' THEN node_id END)::integer as nodes_online,
      ROUND(AVG(current_depth)::numeric, 2) as avg_depth_m,
      ROUND(PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY current_depth)::numeric, 2) as median_depth_m,
      ROUND((COUNT(CASE WHEN status = 'critical' THEN 1 END)::numeric / NULLIF(COUNT(*), 0) * 100)::numeric, 2) as pct_critical,
      ROUND((COUNT(CASE WHEN status = 'warning' THEN 1 END)::numeric / NULLIF(COUNT(*), 0) * 100)::numeric, 2) as pct_warning,
      ROUND((COUNT(CASE WHEN last_seen_at IS NULL OR last_seen_at <= now() - interval '24 hours' THEN 1 END)::numeric / NULLIF(COUNT(*), 0) * 100)::numeric, 2) as pct_offline,
      ROUND(AVG(trend * 4.28)::numeric, 2) as avg_change_30d_m
    FROM village_wells
    GROUP BY area_id
  )
  SELECT 
    v.area_id,
    now() as as_of,
    v.wells_count,
    v.nodes_online,
    v.avg_depth_m,
    v.median_depth_m,
    COALESCE(v.pct_critical, 0),
    COALESCE(v.pct_warning, 0),
    COALESCE(v.pct_offline, 0),
    COALESCE(v.avg_change_30d_m, 0),
    NULL as worst_well_id,
    now() as updated_at
  FROM village_aggs v
  ON CONFLICT (area_id) DO UPDATE SET
    as_of = EXCLUDED.as_of,
    wells_count = EXCLUDED.wells_count,
    nodes_online = EXCLUDED.nodes_online,
    avg_depth_m = EXCLUDED.avg_depth_m,
    median_depth_m = EXCLUDED.median_depth_m,
    pct_critical = EXCLUDED.pct_critical,
    pct_warning = EXCLUDED.pct_warning,
    pct_offline = EXCLUDED.pct_offline,
    avg_change_30d_m = EXCLUDED.avg_change_30d_m,
    updated_at = now();

  -- Roll up parent tiers (blocks, districts, states) from child areas
  FOR r_id, r_level IN (
    SELECT a.id, a.level
    FROM public.admin_areas a
    WHERE a.level IN ('block', 'district', 'state')
    ORDER BY 
      CASE a.level
        WHEN 'block' THEN 1
        WHEN 'district' THEN 2
        WHEN 'state' THEN 3
      END
  ) LOOP
    WITH child_stats AS (
      SELECT 
        s.wells_count,
        s.nodes_online,
        s.avg_depth_m,
        s.pct_critical,
        s.pct_warning,
        s.pct_offline,
        s.avg_change_30d_m
      FROM public.admin_areas c
      JOIN public.area_stats s ON s.area_id = c.id
      WHERE c.parent_id = r_id
    )
    INSERT INTO public.area_stats (
      area_id,
      as_of,
      wells_count,
      nodes_online,
      avg_depth_m,
      median_depth_m,
      pct_critical,
      pct_warning,
      pct_offline,
      avg_change_30d_m,
      worst_well_id,
      updated_at
    )
    SELECT 
      r_id,
      now(),
      COALESCE(SUM(wells_count), 0)::integer,
      COALESCE(SUM(nodes_online), 0)::integer,
      ROUND(AVG(avg_depth_m)::numeric, 2),
      ROUND(AVG(avg_depth_m)::numeric, 2),
      ROUND(COALESCE(AVG(pct_critical), 0)::numeric, 2),
      ROUND(COALESCE(AVG(pct_warning), 0)::numeric, 2),
      ROUND(COALESCE(AVG(pct_offline), 0)::numeric, 2),
      ROUND(COALESCE(AVG(avg_change_30d_m), 0)::numeric, 2),
      NULL,
      now()
    FROM child_stats
    ON CONFLICT (area_id) DO UPDATE SET
      as_of = EXCLUDED.as_of,
      wells_count = EXCLUDED.wells_count,
      nodes_online = EXCLUDED.nodes_online,
      avg_depth_m = EXCLUDED.avg_depth_m,
      median_depth_m = EXCLUDED.median_depth_m,
      pct_critical = EXCLUDED.pct_critical,
      pct_warning = EXCLUDED.pct_warning,
      pct_offline = EXCLUDED.pct_offline,
      avg_change_30d_m = EXCLUDED.avg_change_30d_m,
      updated_at = now();
  END LOOP;

  -- Record daily historical snapshot for each area
  INSERT INTO public.area_stats_daily (
    area_id,
    recorded_date,
    wells_count,
    avg_depth_m,
    median_depth_m,
    pct_critical
  )
  SELECT 
    area_id,
    CURRENT_DATE,
    wells_count,
    avg_depth_m,
    median_depth_m,
    pct_critical
  FROM public.area_stats
  ON CONFLICT (area_id, recorded_date) DO UPDATE SET
    wells_count = EXCLUDED.wells_count,
    avg_depth_m = EXCLUDED.avg_depth_m,
    median_depth_m = EXCLUDED.median_depth_m,
    pct_critical = EXCLUDED.pct_critical;
END;
$$ LANGUAGE plpgsql;

-- 4. Enable RLS on aggregation tables
ALTER TABLE public.area_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.area_stats_daily ENABLE ROW LEVEL SECURITY;

-- 5. RLS Policies: Authenticated users can read area statistics
CREATE POLICY "Allow authenticated read on area_stats"
  ON public.area_stats
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated read on area_stats_daily"
  ON public.area_stats_daily
  FOR SELECT
  TO authenticated
  USING (true);

-- Permissions
REVOKE ALL ON public.area_stats FROM anon;
REVOKE ALL ON public.area_stats_daily FROM anon;
GRANT SELECT ON public.area_stats TO authenticated;
GRANT SELECT ON public.area_stats_daily TO authenticated;
