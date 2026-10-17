-- Phase 22: Official Dashboard (Saved Views and Area Follow-up Notes)

-- 1. Create saved_views table
CREATE TABLE IF NOT EXISTS public.saved_views (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name text NOT NULL,
  filters jsonb NOT NULL DEFAULT '{}'::jsonb,
  is_default boolean NOT NULL DEFAULT false,
  is_pinned boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT saved_views_name_nonempty CHECK (length(trim(name)) > 0),
  CONSTRAINT saved_views_filters_object CHECK (jsonb_typeof(filters) = 'object')
);

CREATE INDEX IF NOT EXISTS idx_saved_views_user_id ON public.saved_views(user_id);
CREATE INDEX IF NOT EXISTS idx_saved_views_user_default ON public.saved_views(user_id, is_default) WHERE is_default = true;

-- 2. Create area_notes table for follow-up tracking
CREATE TYPE public.area_note_status AS ENUM ('open', 'in_progress', 'done');

CREATE TABLE IF NOT EXISTS public.area_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  area_id uuid NOT NULL REFERENCES public.admin_areas(id) ON DELETE CASCADE,
  author_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  text text NOT NULL,
  status public.area_note_status NOT NULL DEFAULT 'open',
  due_date date,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT area_notes_text_nonempty CHECK (length(trim(text)) > 0)
);

CREATE INDEX IF NOT EXISTS idx_area_notes_area_id ON public.area_notes(area_id);
CREATE INDEX IF NOT EXISTS idx_area_notes_status ON public.area_notes(status);
CREATE INDEX IF NOT EXISTS idx_area_notes_due_date ON public.area_notes(due_date);

-- 3. Audit log trigger for area_notes (every insert, update, delete goes to audit_log)
CREATE OR REPLACE FUNCTION public.audit_area_notes_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  acting_user uuid;
  action_name text;
  entity_uuid uuid;
  details_payload jsonb;
BEGIN
  acting_user := auth.uid();
  IF TG_OP = 'INSERT' THEN
    action_name := 'area_note_created';
    entity_uuid := NEW.id;
    details_payload := jsonb_build_object(
      'area_id', NEW.area_id,
      'status', NEW.status,
      'text', NEW.text,
      'due_date', NEW.due_date
    );
  ELSIF TG_OP = 'UPDATE' THEN
    action_name := 'area_note_updated';
    entity_uuid := NEW.id;
    details_payload := jsonb_build_object(
      'area_id', NEW.area_id,
      'old_status', OLD.status,
      'new_status', NEW.status,
      'text', NEW.text,
      'due_date', NEW.due_date
    );
  ELSIF TG_OP = 'DELETE' THEN
    action_name := 'area_note_deleted';
    entity_uuid := OLD.id;
    details_payload := jsonb_build_object(
      'area_id', OLD.area_id,
      'status', OLD.status
    );
  END IF;

  INSERT INTO public.audit_log (
    actor_id,
    action,
    entity_type,
    entity_id,
    details
  ) VALUES (
    acting_user,
    action_name,
    'area_note',
    entity_uuid,
    details_payload
  );

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  ELSE
    RETURN NEW;
  END IF;
END;
$$;

DROP TRIGGER IF EXISTS trg_audit_area_notes ON public.area_notes;
CREATE TRIGGER trg_audit_area_notes
  AFTER INSERT OR UPDATE OR DELETE ON public.area_notes
  FOR EACH ROW
  EXECUTE FUNCTION public.audit_area_notes_change();

-- 4. Enable RLS
ALTER TABLE public.saved_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saved_views FORCE ROW LEVEL SECURITY;
ALTER TABLE public.area_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.area_notes FORCE ROW LEVEL SECURITY;

-- 5. RLS Policies for saved_views: Users manage their own saved views
CREATE POLICY saved_views_owner_all ON public.saved_views
  FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- 6. RLS Policies for area_notes:
-- Officials and Admins can view notes for their assigned areas (or all for admin).
-- Village admins can view and create notes for their specific village.
-- Farmers and insurers cannot view or modify internal area follow-up notes.
CREATE POLICY area_notes_select ON public.area_notes
  FOR SELECT
  TO authenticated
  USING (
    public.is_admin()
    OR (
      public.auth_role() IN ('official', 'village_admin')
      AND area_id IN (SELECT public.user_area_ids())
    )
  );

CREATE POLICY area_notes_insert ON public.area_notes
  FOR INSERT
  TO authenticated
  WITH CHECK (
    (
      public.is_admin()
      OR (
        public.auth_role() IN ('official', 'village_admin')
        AND area_id IN (SELECT public.user_area_ids())
      )
    )
    AND author_id = auth.uid()
  );

CREATE POLICY area_notes_update ON public.area_notes
  FOR UPDATE
  TO authenticated
  USING (
    public.is_admin()
    OR (
      public.auth_role() IN ('official', 'village_admin')
      AND area_id IN (SELECT public.user_area_ids())
    )
  )
  WITH CHECK (
    public.is_admin()
    OR (
      public.auth_role() IN ('official', 'village_admin')
      AND area_id IN (SELECT public.user_area_ids())
    )
  );

CREATE POLICY area_notes_delete ON public.area_notes
  FOR DELETE
  TO authenticated
  USING (
    public.is_admin()
    OR (
      author_id = auth.uid()
      AND public.auth_role() IN ('official', 'village_admin')
      AND area_id IN (SELECT public.user_area_ids())
    )
  );

-- Grants
GRANT SELECT, INSERT, UPDATE, DELETE ON public.saved_views TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.area_notes TO authenticated;

