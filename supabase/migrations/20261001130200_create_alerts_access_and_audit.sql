-- Reversible: drop these tables and enums in reverse dependency order.
create type public.alert_metric as enum ('depth_to_water', 'battery', 'node_offline');
create type public.comparison_operator as enum ('above', 'below');
create type public.alert_severity as enum ('info', 'warning', 'critical');
create type public.alert_status as enum ('open', 'acknowledged', 'resolved');
create type public.notification_channel as enum ('sms', 'email', 'push', 'whatsapp');

create table public.alert_rules (
  id uuid primary key default gen_random_uuid(),
  created_by uuid not null references public.profiles(id) on delete cascade,
  well_id uuid references public.wells(id) on delete cascade,
  admin_area_id uuid references public.admin_areas(id) on delete cascade,
  metric public.alert_metric not null,
  operator public.comparison_operator,
  threshold numeric(10, 3),
  severity public.alert_severity not null default 'warning',
  enabled boolean not null default true,
  channels public.notification_channel[] not null default array['sms']::public.notification_channel[],
  cooldown_minutes integer not null default 60,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint alert_rules_scope_present check (well_id is not null or admin_area_id is not null),
  constraint alert_rules_threshold_required check (
    (metric = 'node_offline' and threshold is null and operator is null)
    or (metric <> 'node_offline' and threshold is not null and operator is not null)
  ),
  constraint alert_rules_cooldown_nonnegative check (cooldown_minutes >= 0)
);

comment on table public.alert_rules is 'Threshold or device-state conditions that can produce alerts.';

create index alert_rules_well_enabled_idx on public.alert_rules(well_id, enabled);
create index alert_rules_area_enabled_idx on public.alert_rules(admin_area_id, enabled);

create table public.alerts (
  id uuid primary key default gen_random_uuid(),
  rule_id uuid references public.alert_rules(id) on delete set null,
  well_id uuid not null references public.wells(id) on delete cascade,
  node_id uuid references public.nodes(id) on delete set null,
  metric public.alert_metric not null,
  severity public.alert_severity not null,
  status public.alert_status not null default 'open',
  message_key text not null,
  details jsonb not null default '{}'::jsonb,
  triggered_at timestamptz not null default now(),
  acknowledged_at timestamptz,
  acknowledged_by uuid references public.profiles(id) on delete set null,
  resolved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint alerts_details_object check (jsonb_typeof(details) = 'object'),
  constraint alerts_acknowledged_state check (
    status <> 'acknowledged' or (acknowledged_at is not null and acknowledged_by is not null)
  ),
  constraint alerts_resolved_state check (status <> 'resolved' or resolved_at is not null)
);

comment on table public.alerts is 'Alert events and their acknowledgement/resolution state.';
comment on column public.alerts.message_key is 'Translation key, not user-facing localized text.';

create index alerts_well_triggered_idx on public.alerts(well_id, triggered_at desc);
create index alerts_status_triggered_idx on public.alerts(status, triggered_at desc);
create index alerts_open_by_well_idx on public.alerts(well_id) where status = 'open';

create table public.notification_prefs (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  channel public.notification_channel not null,
  enabled boolean not null default false,
  destination text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint notification_prefs_profile_channel_unique unique (profile_id, channel)
);

comment on table public.notification_prefs is 'Per-profile notification preferences; destination values are user contact endpoints.';

create table public.api_keys (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  label text not null,
  key_hash text not null unique,
  scopes text[] not null,
  requests_per_minute integer not null default 60,
  requests_per_day integer not null default 10000,
  last_used_at timestamptz,
  expires_at timestamptz,
  revoked_at timestamptz,
  created_at timestamptz not null default now(),
  constraint api_keys_sha256 check (key_hash ~ '^[0-9a-f]{64}$'),
  constraint api_keys_scopes_nonempty check (cardinality(scopes) > 0),
  constraint api_keys_rate_limit_positive check (requests_per_minute > 0 and requests_per_day > 0),
  constraint api_keys_label_nonempty check (length(trim(label)) > 0)
);

comment on table public.api_keys is 'Insurer/API client credentials; key_hash contains only a SHA-256 digest, never the raw key.';
comment on column public.api_keys.scopes is 'Explicit API capabilities granted to the credential.';

create index api_keys_profile_id_idx on public.api_keys(profile_id);

create table public.audit_log (
  id bigint generated by default as identity primary key,
  actor_id uuid references public.profiles(id) on delete set null,
  action text not null,
  entity_type text not null,
  entity_id uuid,
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  constraint audit_log_details_object check (jsonb_typeof(details) = 'object'),
  constraint audit_log_action_nonempty check (length(trim(action)) > 0),
  constraint audit_log_entity_type_nonempty check (length(trim(entity_type)) > 0)
);

comment on table public.audit_log is 'Append-only operational record of sensitive domain actions.';

create index audit_log_entity_created_idx on public.audit_log(entity_type, entity_id, created_at desc);
create index audit_log_actor_created_idx on public.audit_log(actor_id, created_at desc);
