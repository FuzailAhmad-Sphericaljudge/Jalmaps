-- Reversible: drop dependent view/triggers/functions, then disable RLS.
create function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_set_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

create trigger admin_areas_set_updated_at
before update on public.admin_areas
for each row execute function public.set_updated_at();

create trigger wells_set_updated_at
before update on public.wells
for each row execute function public.set_updated_at();

create trigger nodes_set_updated_at
before update on public.nodes
for each row execute function public.set_updated_at();

create trigger alert_rules_set_updated_at
before update on public.alert_rules
for each row execute function public.set_updated_at();

create trigger alerts_set_updated_at
before update on public.alerts
for each row execute function public.set_updated_at();

create trigger notification_prefs_set_updated_at
before update on public.notification_prefs
for each row execute function public.set_updated_at();

create function public.calculate_depth_to_water_m(column_m numeric, hang_depth_m numeric)
returns numeric
language sql
immutable
strict
parallel safe
set search_path = ''
as $$
  select hang_depth_m - column_m;
$$;

comment on function public.calculate_depth_to_water_m(numeric, numeric) is
  'Returns sensor hang depth minus water column height, both in metres.';

create view public.latest_reading
with (security_invoker = true)
as
select distinct on (reading.node_id)
  reading.node_id,
  reading.id as reading_id,
  reading.recorded_at,
  reading.received_at,
  reading.column_m,
  reading.depth_to_water_m,
  reading.current_ma,
  reading.battery_v,
  reading.rssi,
  reading.quality
from public.readings as reading
order by reading.node_id, reading.recorded_at desc, reading.id desc;

comment on view public.latest_reading is 'Latest observation per node; invoker security preserves underlying RLS.';

alter table public.admin_areas enable row level security;
alter table public.profiles enable row level security;
alter table public.wells enable row level security;
alter table public.nodes enable row level security;
alter table public.readings enable row level security;
alter table public.alert_rules enable row level security;
alter table public.alerts enable row level security;
alter table public.notification_prefs enable row level security;
alter table public.api_keys enable row level security;
alter table public.audit_log enable row level security;

-- Intentionally define no policies in Phase 4: all API access remains denied until Phase 5.
