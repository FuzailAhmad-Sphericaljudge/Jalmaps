-- Phase 24: Insurer view, Consent model, and Data API
-- Adds data sharing consent to profiles, insurer area grants, API keys, API usage, and area risk scores

-- 1. Profiles: Data sharing consent
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS data_sharing_consent boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS data_sharing_consent_at timestamptz;

COMMENT ON COLUMN public.profiles.data_sharing_consent IS 'Farmer opt-in for anonymous village-level aggregated data sharing with approved partners.';
COMMENT ON COLUMN public.profiles.data_sharing_consent_at IS 'Timestamp when the farmer last granted or updated data sharing consent.';

-- Trigger to record consent changes into audit_log
CREATE OR REPLACE FUNCTION public.log_profile_consent_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.data_sharing_consent IS DISTINCT FROM OLD.data_sharing_consent THEN
    INSERT INTO public.audit_log (
      actor_id,
      action,
      entity_type,
      entity_id,
      details
    ) VALUES (
      COALESCE(auth.uid(), NEW.id),
      CASE WHEN NEW.data_sharing_consent THEN 'consent_granted' ELSE 'consent_withdrawn' END,
      'profile',
      NEW.id,
      jsonb_build_object(
        'data_sharing_consent', NEW.data_sharing_consent,
        'data_sharing_consent_at', NEW.data_sharing_consent_at,
        'previous_consent', OLD.data_sharing_consent
      )
    );
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_profile_consent_change ON public.profiles;
CREATE TRIGGER trg_profile_consent_change
  AFTER UPDATE OF data_sharing_consent ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.log_profile_consent_change();

-- 2. Insurer Area Grants
CREATE TABLE IF NOT EXISTS public.insurer_area_grants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  insurer_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  area_id uuid NOT NULL REFERENCES public.admin_areas(id) ON DELETE CASCADE,
  scopes text[] NOT NULL DEFAULT ARRAY['stats:read', 'risk:read', 'timeseries:read'],
  valid_from timestamptz NOT NULL DEFAULT now(),
  valid_to timestamptz,
  granted_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT uq_insurer_area_grant UNIQUE (insurer_user_id, area_id)
);

CREATE INDEX IF NOT EXISTS idx_insurer_area_grants_user_area
  ON public.insurer_area_grants(insurer_user_id, area_id);
CREATE INDEX IF NOT EXISTS idx_insurer_area_grants_valid
  ON public.insurer_area_grants(valid_from, valid_to);

ALTER TABLE public.insurer_area_grants ENABLE ROW LEVEL SECURITY;

-- Insurers can read their own valid grants
CREATE POLICY insurer_area_grants_read_own
  ON public.insurer_area_grants
  FOR SELECT
  TO authenticated
  USING (
    insurer_user_id = auth.uid()
    AND valid_from <= now()
    AND (valid_to IS NULL OR valid_to > now())
  );

-- Admins can manage all grants
CREATE POLICY insurer_area_grants_admin_all
  ON public.insurer_area_grants
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role = 'admin'
    )
  );

-- 3. Insurer API Keys
CREATE TABLE IF NOT EXISTS public.insurer_api_keys (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  key_prefix text NOT NULL,
  key_hash text NOT NULL UNIQUE,
  scopes text[] NOT NULL DEFAULT ARRAY['stats:read', 'risk:read', 'timeseries:read'],
  is_sandbox boolean NOT NULL DEFAULT false,
  rate_limit_per_min int NOT NULL DEFAULT 60,
  monthly_quota int NOT NULL DEFAULT 50000,
  revoked_at timestamptz,
  expires_at timestamptz,
  last_used_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_insurer_api_keys_user
  ON public.insurer_api_keys(user_id);
CREATE INDEX IF NOT EXISTS idx_insurer_api_keys_hash
  ON public.insurer_api_keys(key_hash);
CREATE INDEX IF NOT EXISTS idx_insurer_api_keys_prefix
  ON public.insurer_api_keys(key_prefix);

ALTER TABLE public.insurer_api_keys ENABLE ROW LEVEL SECURITY;

CREATE POLICY insurer_api_keys_select_own
  ON public.insurer_api_keys
  FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role = 'admin'
    )
  );

CREATE POLICY insurer_api_keys_insert_own
  ON public.insurer_api_keys
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY insurer_api_keys_update_own
  ON public.insurer_api_keys
  FOR UPDATE
  TO authenticated
  USING (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role = 'admin'
    )
  );

-- 4. API Usage Metering
CREATE TABLE IF NOT EXISTS public.api_usage (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key_id uuid REFERENCES public.insurer_api_keys(id) ON DELETE CASCADE,
  endpoint text NOT NULL,
  status int NOT NULL,
  bytes int NOT NULL DEFAULT 0,
  ts timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_api_usage_key_ts
  ON public.api_usage(key_id, ts DESC);
CREATE INDEX IF NOT EXISTS idx_api_usage_endpoint_ts
  ON public.api_usage(endpoint, ts DESC);

ALTER TABLE public.api_usage ENABLE ROW LEVEL SECURITY;

CREATE POLICY api_usage_select_own
  ON public.api_usage
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.insurer_api_keys
      WHERE insurer_api_keys.id = api_usage.key_id
        AND insurer_api_keys.user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role = 'admin'
    )
  );

-- 5. Area Risk Scores (risk_v1)
CREATE TABLE IF NOT EXISTS public.area_risk_scores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  area_id uuid NOT NULL REFERENCES public.admin_areas(id) ON DELETE CASCADE,
  model_version text NOT NULL DEFAULT 'risk_v1',
  as_of date NOT NULL DEFAULT CURRENT_DATE,
  score numeric(5, 2) NOT NULL CHECK (score >= 0 AND score <= 100),
  band text NOT NULL CHECK (band IN ('low', 'moderate', 'high', 'critical')),
  components jsonb NOT NULL DEFAULT '{}'::jsonb,
  confidence text NOT NULL DEFAULT 'medium' CHECK (confidence IN ('low', 'medium', 'high')),
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT uq_area_risk_score UNIQUE (area_id, model_version, as_of)
);

CREATE INDEX IF NOT EXISTS idx_area_risk_scores_area_as_of
  ON public.area_risk_scores(area_id, as_of DESC);

ALTER TABLE public.area_risk_scores ENABLE ROW LEVEL SECURITY;

CREATE POLICY area_risk_scores_select_authenticated
  ON public.area_risk_scores
  FOR SELECT
  TO authenticated
  USING (
    -- Admins and officials can read all
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role IN ('admin', 'official')
    )
    -- Insurers can read if they have a grant for the area
    OR EXISTS (
      SELECT 1 FROM public.insurer_area_grants
      WHERE insurer_area_grants.insurer_user_id = auth.uid()
        AND insurer_area_grants.area_id = area_risk_scores.area_id
        AND insurer_area_grants.valid_from <= now()
        AND (insurer_area_grants.valid_to IS NULL OR insurer_area_grants.valid_to > now())
    )
  );

