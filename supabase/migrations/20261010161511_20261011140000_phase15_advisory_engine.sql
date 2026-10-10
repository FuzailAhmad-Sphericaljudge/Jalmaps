-- Phase 15: Advisory Engine Data Model

-- 1. Crop Profiles
CREATE TABLE public.crop_profiles (
  id TEXT PRIMARY KEY,
  name_en TEXT NOT NULL,
  name_hi TEXT NOT NULL,
  water_sensitivity VARCHAR(10) NOT NULL CHECK (water_sensitivity IN ('high', 'medium', 'low')),
  growth_stages JSONB NOT NULL, -- Array of { name_en, name_hi, duration_days, water_sensitivity }
  sowing_windows JSONB NOT NULL, -- Record of { kharif?: [start, end], rabi?: [start, end], zaid?: [start, end] }
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Advisory Rules
CREATE TABLE public.advisory_rules (
  id TEXT PRIMARY KEY,
  version INTEGER NOT NULL DEFAULT 1,
  enabled BOOLEAN NOT NULL DEFAULT true,
  priority INTEGER NOT NULL DEFAULT 100,
  cooldown_days INTEGER NOT NULL DEFAULT 3,
  conditions JSONB NOT NULL, -- Rule conditions evaluated against facts
  advice_key TEXT NOT NULL, -- Key for i18n
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Well Crops (link between well and crop)
CREATE TABLE public.well_crops (
  well_id UUID NOT NULL REFERENCES public.wells(id) ON DELETE CASCADE,
  crop_id TEXT NOT NULL REFERENCES public.crop_profiles(id),
  sowing_date DATE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (well_id, crop_id)
);

-- 4. Advisory Feedback
CREATE TABLE public.advisory_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  well_id UUID NOT NULL REFERENCES public.wells(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  advice_key TEXT NOT NULL,
  is_helpful BOOLEAN NOT NULL,
  reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- RLS Policies
ALTER TABLE public.crop_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.advisory_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.well_crops ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.advisory_feedback ENABLE ROW LEVEL SECURITY;

-- Read access to profiles and rules for all authenticated users
CREATE POLICY "Anyone can read crop profiles" ON public.crop_profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "Anyone can read advisory rules" ON public.advisory_rules FOR SELECT TO authenticated USING (true);

-- Well crops access
CREATE POLICY "Farmers can read their well crops" ON public.well_crops FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM public.wells WHERE id = public.well_crops.well_id AND owner_id = auth.uid())
);
CREATE POLICY "Farmers can manage their well crops" ON public.well_crops FOR ALL TO authenticated USING (
  EXISTS (SELECT 1 FROM public.wells WHERE id = public.well_crops.well_id AND owner_id = auth.uid())
);

-- Feedback access
CREATE POLICY "Farmers can read their feedback" ON public.advisory_feedback FOR SELECT TO authenticated USING (
  user_id = auth.uid() OR
  EXISTS (SELECT 1 FROM public.wells WHERE id = public.advisory_feedback.well_id AND owner_id = auth.uid())
);
CREATE POLICY "Farmers can insert feedback" ON public.advisory_feedback FOR INSERT TO authenticated WITH CHECK (
  user_id = auth.uid()
);

-- Seed Starter Crops
INSERT INTO public.crop_profiles (id, name_en, name_hi, water_sensitivity, growth_stages, sowing_windows) VALUES
('wheat', 'Wheat', 'गेहूँ', 'medium', '[
  {"name_en": "Germination", "name_hi": "अंकुरण", "duration_days": 15, "water_sensitivity": "medium"},
  {"name_en": "Tillering", "name_hi": "कल्ले निकलना", "duration_days": 40, "water_sensitivity": "high"},
  {"name_en": "Booting/Flowering", "name_hi": "बालियाँ निकलना/फूल आना", "duration_days": 20, "water_sensitivity": "high"},
  {"name_en": "Grain Filling", "name_hi": "दाना भरना", "duration_days": 30, "water_sensitivity": "medium"},
  {"name_en": "Maturity", "name_hi": "पकना", "duration_days": 15, "water_sensitivity": "low"}
]', '{"rabi": ["10-15", "12-15"]}'),
('paddy', 'Paddy (Rice)', 'धान', 'high', '[
  {"name_en": "Seedling", "name_hi": "पौध", "duration_days": 25, "water_sensitivity": "high"},
  {"name_en": "Tillering", "name_hi": "कल्ले निकलना", "duration_days": 40, "water_sensitivity": "high"},
  {"name_en": "Panicle Initiation", "name_hi": "बालियाँ बनना", "duration_days": 25, "water_sensitivity": "high"},
  {"name_en": "Flowering", "name_hi": "फूल आना", "duration_days": 15, "water_sensitivity": "high"},
  {"name_en": "Maturity", "name_hi": "पकना", "duration_days": 30, "water_sensitivity": "low"}
]', '{"kharif": ["06-01", "07-31"]}');

INSERT INTO public.crop_profiles (id, name_en, name_hi, water_sensitivity, growth_stages, sowing_windows) VALUES
('sugarcane', 'Sugarcane', 'गन्ना', 'high', '[
  {"name_en": "Germination", "name_hi": "अंकुरण", "duration_days": 45, "water_sensitivity": "medium"},
  {"name_en": "Tillering", "name_hi": "कल्ले निकलना", "duration_days": 75, "water_sensitivity": "high"},
  {"name_en": "Grand Growth", "name_hi": "तेजी से बढ़वार", "duration_days": 150, "water_sensitivity": "high"},
  {"name_en": "Maturity", "name_hi": "पकना", "duration_days": 90, "water_sensitivity": "low"}
]', '{"kharif": ["02-15", "03-31"]}'),
('cotton', 'Cotton', 'कपास', 'medium', '[
  {"name_en": "Seedling", "name_hi": "पौध", "duration_days": 30, "water_sensitivity": "low"},
  {"name_en": "Vegetative", "name_hi": "वानस्पतिक बढ़वार", "duration_days": 45, "water_sensitivity": "medium"},
  {"name_en": "Flowering", "name_hi": "फूल आना", "duration_days": 45, "water_sensitivity": "high"},
  {"name_en": "Boll Formation", "name_hi": "डेंडू बनना", "duration_days": 40, "water_sensitivity": "high"},
  {"name_en": "Maturity", "name_hi": "पकना", "duration_days": 20, "water_sensitivity": "low"}
]', '{"kharif": ["05-15", "06-30"]}'),
('maize', 'Maize', 'मक्का', 'medium', '[
  {"name_en": "Seedling", "name_hi": "पौध", "duration_days": 20, "water_sensitivity": "low"},
  {"name_en": "Knee High", "name_hi": "घुटने तक की ऊँचाई", "duration_days": 30, "water_sensitivity": "medium"},
  {"name_en": "Tasseling/Silking", "name_hi": "मंजरी आना/सिल्क निकलना", "duration_days": 20, "water_sensitivity": "high"},
  {"name_en": "Grain Filling", "name_hi": "दाना भरना", "duration_days": 30, "water_sensitivity": "high"},
  {"name_en": "Maturity", "name_hi": "पकना", "duration_days": 15, "water_sensitivity": "low"}
]', '{"kharif": ["06-15", "07-15"], "rabi": ["10-15", "11-15"]}'),
('mustard', 'Mustard', 'सरसों', 'low', '[
  {"name_en": "Seedling", "name_hi": "पौध", "duration_days": 25, "water_sensitivity": "low"},
  {"name_en": "Vegetative", "name_hi": "वानस्पतिक बढ़वार", "duration_days": 35, "water_sensitivity": "low"},
  {"name_en": "Flowering", "name_hi": "फूल आना", "duration_days": 30, "water_sensitivity": "medium"},
  {"name_en": "Pod Formation", "name_hi": "फली बनना", "duration_days": 35, "water_sensitivity": "medium"},
  {"name_en": "Maturity", "name_hi": "पकना", "duration_days": 15, "water_sensitivity": "low"}
]', '{"rabi": ["10-01", "10-31"]}'),
('vegetables', 'Vegetables', 'सब्जियां', 'high', '[
  {"name_en": "Seedling", "name_hi": "पौध", "duration_days": 20, "water_sensitivity": "medium"},
  {"name_en": "Vegetative", "name_hi": "वानस्पतिक बढ़वार", "duration_days": 30, "water_sensitivity": "high"},
  {"name_en": "Flowering/Fruiting", "name_hi": "फूल आना/फल बनना", "duration_days": 40, "water_sensitivity": "high"},
  {"name_en": "Harvesting", "name_hi": "तुड़ाई", "duration_days": 30, "water_sensitivity": "medium"}
]', '{"kharif": ["06-15", "07-30"], "rabi": ["10-15", "11-30"], "zaid": ["02-15", "03-31"]}');
