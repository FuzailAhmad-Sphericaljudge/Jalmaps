-- Phase 21: Aquifer Insights Storage & Aggregations

-- 1. Well Insights Table
CREATE TABLE IF NOT EXISTS public.well_insights (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  well_id uuid NOT NULL REFERENCES public.wells(id) ON DELETE CASCADE,
  as_of date NOT NULL,
  is_sufficient boolean NOT NULL DEFAULT false,
  sufficiency jsonb NOT NULL DEFAULT '{}'::jsonb,
  seasonal jsonb NOT NULL DEFAULT '{}'::jsonb,
  monsoon jsonb NOT NULL DEFAULT '{}'::jsonb,
  depletion jsonb NOT NULL DEFAULT '{}'::jsonb,
  recharge jsonb NOT NULL DEFAULT '{}'::jsonb,
  pumping jsonb NOT NULL DEFAULT '{}'::jsonb,
  health jsonb NOT NULL DEFAULT '{}'::jsonb,
  health_score integer,
  health_band text CHECK (health_band IN ('healthy', 'watch', 'stressed', 'critical')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT uq_well_insights_well_date UNIQUE (well_id, as_of)
);

CREATE INDEX IF NOT EXISTS idx_well_insights_well_date ON public.well_insights(well_id, as_of DESC);
CREATE INDEX IF NOT EXISTS idx_well_insights_health_score ON public.well_insights(health_score);
CREATE INDEX IF NOT EXISTS idx_well_insights_health_band ON public.well_insights(health_band);

-- 2. Area Insights Aggregation Table
CREATE TABLE IF NOT EXISTS public.area_insights (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  area_id uuid NOT NULL REFERENCES public.admin_areas(id) ON DELETE CASCADE,
  as_of date NOT NULL,
  wells_count integer NOT NULL DEFAULT 0,
  is_sufficient boolean NOT NULL DEFAULT false,
  avg_health_score numeric(5, 2),
  worst_health_score integer,
  dominant_health_band text,
  avg_depletion_rate_m_per_year numeric(6, 3),
  total_recharge_volume_mcm numeric(10, 3),
  insights jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT uq_area_insights_area_date UNIQUE (area_id, as_of)
);

CREATE INDEX IF NOT EXISTS idx_area_insights_area_date ON public.area_insights(area_id, as_of DESC);
CREATE INDEX IF NOT EXISTS idx_area_insights_avg_health ON public.area_insights(avg_health_score);

-- 3. Enable Row Level Security
ALTER TABLE public.well_insights ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.area_insights ENABLE ROW LEVEL SECURITY;

-- 4. RLS Policies
-- Users can view insights for wells they can view (via canonical can_read_well)
CREATE POLICY "Allow view well_insights for accessible wells"
  ON public.well_insights
  FOR SELECT
  TO authenticated
  USING (
    public.can_read_well(well_id)
  );

-- Users can view area insights respecting the k-anonymity (>=3 wells) privacy rule,
-- unless they hold an official/admin role.
CREATE POLICY "Allow view area_insights with k-anonymity"
  ON public.area_insights
  FOR SELECT
  TO authenticated
  USING (
    wells_count >= 3
    OR public.auth_role() IN ('admin'::public.user_role, 'official'::public.user_role)
  );

