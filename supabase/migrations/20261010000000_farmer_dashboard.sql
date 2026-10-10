-- Migration for Phase 10: Farmer Dashboard

-- 1. Create a function to fetch the trend of a well over a specific number of hours
create or replace function public.get_trend(p_well_id uuid, p_hours int)
returns table (
  recorded_at timestamptz,
  depth_to_water_m numeric
)
language sql
security invoker
as $$
  select 
    r.recorded_at,
    r.depth_to_water_m
  from public.nodes n
  join public.readings r on r.node_id = n.id
  where n.well_id = p_well_id
    and n.status not in ('retired', 'fault')
    and r.recorded_at >= (now() - (p_hours || ' hours')::interval)
  order by r.recorded_at asc;
$$;

-- Grant access
grant execute on function public.get_trend(uuid, int) to authenticated;

