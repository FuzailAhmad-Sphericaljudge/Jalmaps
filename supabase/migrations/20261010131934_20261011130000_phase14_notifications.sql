-- Phase 14: Notifications

-- Notification channels enum
CREATE TYPE notification_channel AS ENUM ('push', 'telegram', 'sms', 'whatsapp', 'email');

-- Notification events enum
CREATE TYPE notification_event AS ENUM ('opened', 'escalated', 'resolved', 'digest');

-- Notification status enum
CREATE TYPE notification_status AS ENUM ('pending', 'sending', 'sent', 'failed', 'skipped');

-- Transactional outbox
CREATE TABLE notification_outbox (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    alert_id UUID NOT NULL REFERENCES alerts(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    channel notification_channel NOT NULL,
    event notification_event NOT NULL,
    status notification_status NOT NULL DEFAULT 'pending',
    attempts INT NOT NULL DEFAULT 0,
    next_attempt_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    locale TEXT NOT NULL DEFAULT 'en',
    payload JSONB NOT NULL DEFAULT '{}'::jsonb,
    provider_message_id TEXT,
    error TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    sent_at TIMESTAMPTZ,
    CONSTRAINT outbox_idempotency UNIQUE (alert_id, user_id, channel, event)
);

-- Indexes for the worker
CREATE INDEX idx_notification_outbox_pending ON notification_outbox(next_attempt_at) WHERE status = 'pending';
CREATE INDEX idx_notification_outbox_user ON notification_outbox(user_id);

-- Enable RLS (Users can only read their own notifications)
ALTER TABLE notification_outbox ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own notifications"
    ON notification_outbox FOR SELECT
    USING (auth.uid() = user_id);

-- User Notification Channels (Consent)
CREATE TABLE user_notification_channels (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    channel notification_channel NOT NULL,
    enabled BOOLEAN NOT NULL DEFAULT true,
    provider_token TEXT, -- e.g., Push subscription JSON, Telegram chat_id
    verified_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (user_id, channel)
);

-- Enable RLS
ALTER TABLE user_notification_channels ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own channels"
    ON user_notification_channels FOR ALL
    USING (auth.uid() = user_id);

-- User Notification Preferences
CREATE TABLE user_notification_prefs (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    quiet_hours_start TIME, -- e.g., '22:00'
    quiet_hours_end TIME,   -- e.g., '07:00'
    quiet_hours_tz TEXT NOT NULL DEFAULT 'Asia/Kolkata',
    critical_bypasses_quiet_hours BOOLEAN NOT NULL DEFAULT true,
    daily_digest BOOLEAN NOT NULL DEFAULT false,
    severity_routing JSONB NOT NULL DEFAULT '{"critical": ["push", "sms"], "warning": ["push"], "info": ["push"]}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE user_notification_prefs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own prefs"
    ON user_notification_prefs FOR ALL
    USING (auth.uid() = user_id);

