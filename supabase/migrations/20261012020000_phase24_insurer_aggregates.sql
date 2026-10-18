-- Phase 24: Insurer-Safe Aggregation Functions
-- Computes village-level groundwater stats and time series strictly from consenting farmers
-- Enforces minimum sample size (k-anonymity N >= 3) and completely withholds individual identifiers

-- 1. Function: get_insurer_village_stats
CREATE OR REPLACE FUNCTION public.get_insurer_village_stats(
  p_area_id uuid,
  p_min_wells int DEFAULT 3
)
RETURNS TABLE (
  area_id uuid,
  consenting_wells_count integer,
  privacy_masked boolean,
  privacy_reason text,
  avg_depth_m numeric,
  median_depth_m numeric,
  pct_critical numeric,
  pct_warning numeric,
  pct_offline numeric,
  nodes_online integer,
  as_of timestamptz
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_consenting_count integer;
BEGIN
  -- 1. Count consenting wells in the village
  SELECT COUNT(DISTINCT w.id)
  INTO v_consenting_count
  FROM public.wells w
  JOIN public.profiles p ON p.id = w.owner_id
  WHERE w.admin_area_id = p_area_id
    AND p.data_sharing_consent = true
    AND w.status != 'decommissioned';

  -- 2. Enforce k-anonymity privacy threshold
  IF v_consenting_count < p_min_wells THEN
    RETURN QUERY SELECT
      p_area_id,
      v_consenting_count,
      true AS privacy_masked,
      'insufficient_consenting_sample'::text AS privacy_reason,
      NULL::numeric AS avg_depth_m,
      NULL::numeric AS median_depth_m,
      NULL::numeric AS pct_critical,
      NULL::numeric AS pct_warning,
      NULL::numeric AS pct_offline,
      NULL::integer AS nodes_online,
      now() AS as_of;
    RETURN;
  END IF;

  -- 3. Compute stats across consenting wells only
  RETURN QUERY
  WITH consenting_wells AS (
    SELECT
      w.id AS well_id,
      n.id AS node_id,
      n.last_seen_at
    FROM public.wells w
    JOIN public.profiles p ON p.id = w.owner_id
    LEFT JOIN public.nodes n ON n.well_id = w.id
    WHERE w.admin_area_id = p_area_id
      AND p.data_sharing_consent = true
      AND w.status != 'decommissioned'
  ),
  latest_readings AS (
    SELECT DISTINCT ON (cw.well_id)
      cw.well_id,
      COALESCE(r.depth_to_water_m, r.column_m, 15.0) AS depth_val
    FROM consenting_wells cw
    JOIN public.readings r ON r.node_id = cw.node_id
    ORDER BY cw.well_id, r.recorded_at DESC
  ),
  well_alerts AS (
    SELECT
      cw.well_id,
      bool_or(a.severity = 'critical') AS has_critical,
      bool_or(a.severity = 'warning') AS has_warning
    FROM consenting_wells cw
    JOIN public.alerts a ON a.well_id = cw.well_id
    WHERE a.status IN ('open', 'acknowledged')
    GROUP BY cw.well_id
  ),
  well_metrics AS (
    SELECT
      cw.well_id,
      cw.node_id,
      cw.last_seen_at,
      lr.depth_val,
      CASE
        WHEN COALESCE(wa.has_critical, false) THEN 'critical'
        WHEN COALESCE(wa.has_warning, false) THEN 'warning'
        ELSE 'normal'
      END AS status
    FROM consenting_wells cw
    LEFT JOIN latest_readings lr ON lr.well_id = cw.well_id
    LEFT JOIN well_alerts wa ON wa.well_id = cw.well_id
  )
  SELECT
    p_area_id,
    v_consenting_count,
    false AS privacy_masked,
    NULL::text AS privacy_reason,
    ROUND(AVG(wm.depth_val)::numeric, 2) AS avg_depth_m,
    ROUND(PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY wm.depth_val)::numeric, 2) AS median_depth_m,
    ROUND((COUNT(CASE WHEN wm.status = 'critical' THEN 1 END)::numeric / NULLIF(COUNT(DISTINCT wm.well_id), 0) * 100)::numeric, 2) AS pct_critical,
    ROUND((COUNT(CASE WHEN wm.status = 'warning' THEN 1 END)::numeric / NULLIF(COUNT(DISTINCT wm.well_id), 0) * 100)::numeric, 2) AS pct_warning,
    ROUND((COUNT(CASE WHEN wm.last_seen_at IS NULL OR wm.last_seen_at <= now() - interval '24 hours' THEN 1 END)::numeric / NULLIF(COUNT(DISTINCT wm.well_id), 0) * 100)::numeric, 2) AS pct_offline,
    COUNT(DISTINCT CASE WHEN wm.last_seen_at > now() - interval '24 hours' THEN wm.node_id END)::integer AS nodes_online,
    now() AS as_of
  FROM well_metrics wm;
END;
$$;

-- 2. Function: get_insurer_village_timeseries
CREATE OR REPLACE FUNCTION public.get_insurer_village_timeseries(
  p_area_id uuid,
  p_start_date date,
  p_end_date date,
  p_bucket text DEFAULT 'day',
  p_min_wells int DEFAULT 3
)
RETURNS TABLE (
  bucket_ts timestamptz,
  consenting_wells_count integer,
  privacy_masked boolean,
  avg_depth_m numeric,
  median_depth_m numeric
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  WITH consenting_wells AS (
    SELECT
      w.id AS well_id,
      n.id AS node_id
    FROM public.wells w
    JOIN public.profiles p ON p.id = w.owner_id
    JOIN public.nodes n ON n.well_id = w.id
    WHERE w.admin_area_id = p_area_id
      AND p.data_sharing_consent = true
      AND w.status != 'decommissioned'
  ),
  bucketed_readings AS (
    SELECT
      date_trunc(p_bucket, r.recorded_at) AS b_ts,
      cw.well_id,
      AVG(COALESCE(r.depth_to_water_m, r.column_m)) AS well_depth
    FROM consenting_wells cw
    JOIN public.readings r ON r.node_id = cw.node_id
    WHERE r.recorded_at >= p_start_date::timestamptz
      AND r.recorded_at < (p_end_date + 1)::timestamptz
    GROUP BY date_trunc(p_bucket, r.recorded_at), cw.well_id
  ),
  bucket_aggs AS (
    SELECT
      b_ts,
      COUNT(DISTINCT well_id)::integer AS w_count,
      ROUND(AVG(well_depth)::numeric, 2) AS b_avg,
      ROUND(PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY well_depth)::numeric, 2) AS b_med
    FROM bucketed_readings
    GROUP BY b_ts
  )
  SELECT
    ba.b_ts AS bucket_ts,
    ba.w_count AS consenting_wells_count,
    (ba.w_count < p_min_wells) AS privacy_masked,
    CASE WHEN ba.w_count >= p_min_wells THEN ba.b_avg ELSE NULL END AS avg_depth_m,
    CASE WHEN ba.w_count >= p_min_wells THEN ba.b_med ELSE NULL END AS median_depth_m
  FROM bucket_aggs ba
  ORDER BY ba.b_ts ASC;
END;
$$;

