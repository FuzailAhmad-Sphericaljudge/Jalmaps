-- Phase 23: Reports and exports schema
-- Tables: reports, report_schedules, report_shares
-- Storage bucket: reports

CREATE TABLE IF NOT EXISTS reports (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    type text NOT NULL CHECK (type IN ('well', 'village', 'district', 'subsidy_planning')),
    format text NOT NULL DEFAULT 'pdf' CHECK (format IN ('pdf', 'csv', 'xlsx')),
    scope jsonb NOT NULL DEFAULT '{}'::jsonb,
    params jsonb NOT NULL DEFAULT '{}'::jsonb,
    status text NOT NULL DEFAULT 'queued' CHECK (status IN ('queued', 'running', 'done', 'failed')),
    storage_path text,
    created_by uuid REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at timestamptz NOT NULL DEFAULT now(),
    completed_at timestamptz,
    expires_at timestamptz NOT NULL DEFAULT (now() + interval '30 days'),
    error text,
    retry_count int NOT NULL DEFAULT 0,
    file_size_bytes bigint
);

CREATE INDEX IF NOT EXISTS idx_reports_created_by ON reports(created_by);
CREATE INDEX IF NOT EXISTS idx_reports_status_created ON reports(status, created_at) WHERE status = 'queued';
CREATE INDEX IF NOT EXISTS idx_reports_expires_at ON reports(expires_at);

ALTER TABLE reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can select own reports" ON reports
    FOR SELECT TO authenticated
    USING (created_by = auth.uid());

CREATE POLICY "Users can insert own reports" ON reports
    FOR INSERT TO authenticated
    WITH CHECK (created_by = auth.uid());

CREATE POLICY "Users can delete own reports" ON reports
    FOR DELETE TO authenticated
    USING (created_by = auth.uid());

-- Scheduled Digests table
CREATE TABLE IF NOT EXISTS report_schedules (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    type text NOT NULL CHECK (type IN ('well', 'village', 'district', 'subsidy_planning')),
    scope jsonb NOT NULL DEFAULT '{}'::jsonb,
    cadence text NOT NULL DEFAULT 'weekly' CHECK (cadence IN ('weekly', 'monthly')),
    day_of_week int NOT NULL DEFAULT 1 CHECK (day_of_week BETWEEN 0 AND 6),
    day_of_month int NOT NULL DEFAULT 1 CHECK (day_of_month BETWEEN 1 AND 28),
    time_utc text NOT NULL DEFAULT '04:00',
    locale text NOT NULL DEFAULT 'en',
    channel text NOT NULL DEFAULT 'email' CHECK (channel IN ('email', 'sms', 'whatsapp', 'in_app')),
    active boolean NOT NULL DEFAULT true,
    last_run_at timestamptz,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_report_schedules_user_id ON report_schedules(user_id);
CREATE INDEX IF NOT EXISTS idx_report_schedules_active_cadence ON report_schedules(active, cadence);

ALTER TABLE report_schedules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can select own report schedules" ON report_schedules
    FOR SELECT TO authenticated
    USING (user_id = auth.uid());

CREATE POLICY "Users can manage own report schedules" ON report_schedules
    FOR ALL TO authenticated
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

-- Expiring Share Links table
CREATE TABLE IF NOT EXISTS report_shares (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    report_id uuid NOT NULL REFERENCES reports(id) ON DELETE CASCADE,
    token_hash text NOT NULL UNIQUE,
    created_by uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at timestamptz NOT NULL DEFAULT now(),
    expires_at timestamptz NOT NULL DEFAULT (now() + interval '30 days'),
    revoked_at timestamptz,
    access_count int NOT NULL DEFAULT 0,
    last_accessed_at timestamptz
);

CREATE INDEX IF NOT EXISTS idx_report_shares_token_hash ON report_shares(token_hash);
CREATE INDEX IF NOT EXISTS idx_report_shares_report_id ON report_shares(report_id);

ALTER TABLE report_shares ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own report shares" ON report_shares
    FOR SELECT TO authenticated
    USING (created_by = auth.uid());

CREATE POLICY "Users can manage own report shares" ON report_shares
    FOR ALL TO authenticated
    USING (created_by = auth.uid())
    WITH CHECK (created_by = auth.uid());

CREATE POLICY "Anyone can view valid report shares by token" ON report_shares
    FOR SELECT TO anon, authenticated
    USING (revoked_at IS NULL AND expires_at > now());

-- Claim worker RPC
CREATE OR REPLACE FUNCTION claim_report_jobs(batch_size INT)
RETURNS SETOF reports
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  UPDATE reports
  SET status = 'running',
      retry_count = retry_count + 1
  WHERE id IN (
    SELECT id
    FROM reports
    WHERE (status = 'queued' OR (status = 'failed' AND retry_count < 3))
      AND expires_at > now()
    ORDER BY created_at ASC
    FOR UPDATE SKIP LOCKED
    LIMIT batch_size
  )
  RETURNING *;
END;
$$;

-- Storage Bucket for Reports
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'reports',
    'reports',
    false,
    52428800,
    ARRAY['application/pdf', 'text/csv', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet']
)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Users can upload their own reports" ON storage.objects
    FOR INSERT TO authenticated
    WITH CHECK (
        bucket_id = 'reports' AND
        (storage.foldername(name))[1] = auth.uid()::text
    );

CREATE POLICY "Users can read their own reports" ON storage.objects
    FOR SELECT TO authenticated
    USING (
        bucket_id = 'reports' AND
        (storage.foldername(name))[1] = auth.uid()::text
    );

CREATE POLICY "Users can delete their own reports" ON storage.objects
    FOR DELETE TO authenticated
    USING (
        bucket_id = 'reports' AND
        (storage.foldername(name))[1] = auth.uid()::text
    );

