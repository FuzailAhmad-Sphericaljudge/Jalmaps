-- Drop existing tables to recreate them cleanly since this is still early development
-- and we want a pristine state for the refined alerts engine.

DROP TABLE IF EXISTS public.alert_events CASCADE;
DROP TABLE IF EXISTS public.alerts CASCADE;
DROP TABLE IF EXISTS public.alert_rules CASCADE;
DROP TABLE IF EXISTS public.alert_jobs CASCADE;

DROP TYPE IF EXISTS public.alert_rule_scope CASCADE;
DROP TYPE IF EXISTS public.alert_rule_type CASCADE;
DROP TYPE IF EXISTS public.alert_severity CASCADE;
DROP TYPE IF EXISTS public.alert_status CASCADE;
DROP TYPE IF EXISTS public.alert_resolved_reason CASCADE;

CREATE TYPE public.alert_rule_scope AS ENUM ('well', 'area_default', 'global_default');
CREATE TYPE public.alert_rule_type AS ENUM ('level_below', 'drop_rate', 'no_data', 'low_battery', 'sensor_fault');
CREATE TYPE public.alert_severity AS ENUM ('info', 'warning', 'critical');
CREATE TYPE public.alert_status AS ENUM ('open', 'acknowledged', 'snoozed', 'resolved');
CREATE TYPE public.alert_resolved_reason AS ENUM ('auto', 'manual');

CREATE TABLE public.alert_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  scope public.alert_rule_scope NOT NULL DEFAULT 'well',
  well_id uuid REFERENCES public.wells(id) ON DELETE CASCADE,
  rule_type public.alert_rule_type NOT NULL,
  params jsonb NOT NULL DEFAULT '{}'::jsonb,
  severity public.alert_severity NOT NULL DEFAULT 'warning',
  cooldown_minutes integer NOT NULL DEFAULT 60,
  enabled boolean NOT NULL DEFAULT true,
  created_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT alert_rules_scope_check CHECK (
    (scope = 'well' AND well_id IS NOT NULL) OR
    (scope IN ('area_default', 'global_default') AND well_id IS NULL)
  ),
  CONSTRAINT alert_rules_params_object CHECK (jsonb_typeof(params) = 'object')
);

CREATE TABLE public.alerts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  well_id uuid NOT NULL REFERENCES public.wells(id) ON DELETE CASCADE,
  node_id uuid REFERENCES public.nodes(id) ON DELETE SET NULL,
  rule_id uuid REFERENCES public.alert_rules(id) ON DELETE SET NULL,
  severity public.alert_severity NOT NULL,
  status public.alert_status NOT NULL DEFAULT 'open',
  message_key text NOT NULL,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  dedupe_key text NOT NULL,
  triggered_at timestamptz NOT NULL DEFAULT now(),
  acknowledged_at timestamptz,
  acknowledged_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  snoozed_until timestamptz,
  resolved_at timestamptz,
  resolved_reason public.alert_resolved_reason,
  escalated_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT alerts_payload_object CHECK (jsonb_typeof(payload) = 'object')
);

-- Partial unique index on dedupe_key for non-resolved alerts to prevent duplicates
CREATE UNIQUE INDEX alerts_dedupe_key_open_idx ON public.alerts (dedupe_key) WHERE status <> 'resolved';

CREATE TABLE public.alert_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  alert_id uuid NOT NULL REFERENCES public.alerts(id) ON DELETE CASCADE,
  previous_status public.alert_status,
  new_status public.alert_status NOT NULL,
  reason text,
  created_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.alert_jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  well_id uuid NOT NULL REFERENCES public.wells(id) ON DELETE CASCADE,
  queued_at timestamptz NOT NULL DEFAULT now(),
  locked_at timestamptz,
  locked_by text,
  attempts integer NOT NULL DEFAULT 0,
  max_attempts integer NOT NULL DEFAULT 3
);
-- Enforce one active job per well to act as a debounce/queue
CREATE UNIQUE INDEX alert_jobs_well_id_idx ON public.alert_jobs (well_id);

-- RLS Setup
ALTER TABLE public.alert_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alert_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alert_jobs ENABLE ROW LEVEL SECURITY;

-- Farmers can read and manage alert rules for their own wells
CREATE POLICY "Farmers can read alert rules for their wells" 
ON public.alert_rules FOR SELECT TO authenticated 
USING (scope = 'global_default' OR scope = 'area_default' OR public.can_read_well(well_id));

CREATE POLICY "Farmers can insert alert rules for their wells" 
ON public.alert_rules FOR INSERT TO authenticated 
WITH CHECK (scope = 'well' AND public.can_manage_well(well_id));

CREATE POLICY "Farmers can update alert rules for their wells" 
ON public.alert_rules FOR UPDATE TO authenticated 
USING (scope = 'well' AND public.can_manage_well(well_id));

CREATE POLICY "Farmers can delete alert rules for their wells" 
ON public.alert_rules FOR DELETE TO authenticated 
USING (scope = 'well' AND public.can_manage_well(well_id));

-- Admins can read all rules in their area
-- (Assuming we will expand global_default later, keeping it simple for now)

-- Alerts RLS
CREATE POLICY "Users can read alerts for their wells" 
ON public.alerts FOR SELECT TO authenticated 
USING (public.can_read_well(well_id));

-- Only the service role / backend creates alerts via functions. 
-- Wait, farmers can acknowledge and resolve alerts:
CREATE POLICY "Users can update their alerts" 
ON public.alerts FOR UPDATE TO authenticated 
USING (public.can_read_well(well_id));

-- Alert Events RLS
CREATE POLICY "Users can read alert events for their wells" 
ON public.alert_events FOR SELECT TO authenticated 
USING (EXISTS (SELECT 1 FROM public.alerts WHERE alerts.id = alert_events.alert_id AND public.can_read_well(alerts.well_id)));

-- Alert Jobs are strictly for the backend (service role), but we allow farmers to insert jobs when they mutate things? 
-- The backend uses service_role, which bypasses RLS. So no policies needed for insert/update on alert_jobs.

