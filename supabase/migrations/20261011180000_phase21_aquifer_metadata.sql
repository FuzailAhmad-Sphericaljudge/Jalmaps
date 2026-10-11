-- Phase 21: Aquifer Types and Well Specific Yield Overrides

-- 1. Create aquifer_types table
CREATE TABLE IF NOT EXISTS public.aquifer_types (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  name text NOT NULL,
  description text,
  default_sy_min numeric(5, 4) NOT NULL,
  default_sy_max numeric(5, 4) NOT NULL,
  default_sy numeric(5, 4) NOT NULL,
  source_notes text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT chk_sy_range CHECK (default_sy_min > 0 AND default_sy_max >= default_sy_min AND default_sy BETWEEN default_sy_min AND default_sy_max)
);

COMMENT ON TABLE public.aquifer_types IS 'Aquifer lithology types with indicative specific yield (Sy) ranges. CAUTION: Rough regional defaults only; verify with a hydrogeologist before critical decisions.';

-- 2. Add aquifer reference and specific yield override to wells
ALTER TABLE public.wells
  ADD COLUMN IF NOT EXISTS aquifer_type_id uuid REFERENCES public.aquifer_types(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS specific_yield_override numeric(5, 4),
  ADD CONSTRAINT chk_wells_sy_override CHECK (specific_yield_override IS NULL OR (specific_yield_override > 0 AND specific_yield_override <= 0.40));

CREATE INDEX IF NOT EXISTS idx_wells_aquifer_type ON public.wells(aquifer_type_id);

-- 3. Seed baseline Indian aquifer types (CGWB / NIH reference defaults)
INSERT INTO public.aquifer_types (code, name, description, default_sy_min, default_sy_max, default_sy, source_notes)
VALUES
  (
    'alluvial',
    'Alluvial / Unconsolidated',
    'Indo-Gangetic and coastal alluvial tracts consisting of sand, silt, gravel and clay beds.',
    0.0800,
    0.2000,
    0.1200,
    'Central Ground Water Board (CGWB) GEC-2015 methodology. Rough defaults: verify with a hydrogeologist.'
  ),
  (
    'hard_rock',
    'Hard Rock / Crystalline',
    'Peninsular granites, gneisses and schists where groundwater occurs in weathered mantle and fractures.',
    0.0100,
    0.0500,
    0.0250,
    'CGWB GEC-2015 & National Institute of Hydrology (NIH). Rough defaults: verify with a hydrogeologist.'
  ),
  (
    'basalt',
    'Basalt / Deccan Traps',
    'Volcanic flow sequences with vesicular and fractured zones serving as unconfined to semi-confined aquifers.',
    0.0150,
    0.0600,
    0.0300,
    'CGWB Deccan Trap studies & GSDA Maharashtra. Rough defaults: verify with a hydrogeologist.'
  ),
  (
    'sedimentary_soft',
    'Semi-consolidated Sedimentary',
    'Sandstones, limestones and shales across Gondwana and Tertiary formations.',
    0.0300,
    0.1200,
    0.0600,
    'CGWB GEC-2015 guidelines. Rough defaults: verify with a hydrogeologist.'
  )
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  default_sy_min = EXCLUDED.default_sy_min,
  default_sy_max = EXCLUDED.default_sy_max,
  default_sy = EXCLUDED.default_sy,
  source_notes = EXCLUDED.source_notes,
  updated_at = now();

-- 4. Enable RLS on aquifer_types
ALTER TABLE public.aquifer_types ENABLE ROW LEVEL SECURITY;

-- Read policy: accessible to all authenticated users
CREATE POLICY "Allow authenticated read on aquifer_types"
  ON public.aquifer_types
  FOR SELECT
  TO authenticated
  USING (true);

-- Allow public read so onboarding and public well views can display aquifer info
CREATE POLICY "Allow anon read on aquifer_types"
  ON public.aquifer_types
  FOR SELECT
  TO anon
  USING (true);

