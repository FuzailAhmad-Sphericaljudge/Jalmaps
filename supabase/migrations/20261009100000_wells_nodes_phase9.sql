-- Add statuses to well_status enum
ALTER TYPE well_status ADD VALUE IF NOT EXISTS 'planned';
ALTER TYPE well_status ADD VALUE IF NOT EXISTS 'dry';

-- Create well_members table
CREATE TABLE IF NOT EXISTS public.well_members (
    well_id uuid REFERENCES public.wells(id) ON DELETE CASCADE,
    user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
    role text CHECK (role IN ('viewer', 'editor')),
    created_at timestamptz DEFAULT now(),
    PRIMARY KEY (well_id, user_id)
);

-- Enable RLS
ALTER TABLE public.well_members ENABLE ROW LEVEL SECURITY;

-- Partial unique index
CREATE UNIQUE INDEX IF NOT EXISTS nodes_one_active_per_well ON public.nodes(well_id) WHERE status NOT IN ('retired', 'fault');

-- RLS policies for well_members
CREATE POLICY "Owner can insert/delete well_members" ON public.well_members
    FOR ALL USING (
        well_id IN (SELECT id FROM public.wells WHERE owner_id = auth.uid())
    );

CREATE POLICY "Members can read own row" ON public.well_members
    FOR SELECT USING (
        user_id = auth.uid()
    );

CREATE POLICY "Admins and village_admins can read all well_members" ON public.well_members
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role IN ('admin', 'village_admin')
        )
    );

