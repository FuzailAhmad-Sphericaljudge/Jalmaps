-- 1. Create a type for the bucket interval
create type bucket_interval as enum ('raw', 'hourly', 'daily');

-- 2. Create the readings_bucketed function
create or replace function public.readings_bucketed(
  p_node_ids uuid[],
  p_from timestamptz,
  p_to timestamptz,
  p_bucket bucket_interval
)
returns table (
  bucket_time timestamptz,
  node_id uuid,
  avg_depth numeric,
  min_depth numeric,
  max_depth numeric,
  reading_count bigint
)
language sql security invoker as $$
  select
    case 
      when p_bucket = 'daily' then date_trunc('day', r.recorded_at)
      when p_bucket = 'hourly' then date_trunc('hour', r.recorded_at)
      else r.recorded_at
    end as bucket_time,
    r.node_id,
    avg(r.depth_to_water_m) as avg_depth,
    min(r.depth_to_water_m) as min_depth,
    max(r.depth_to_water_m) as max_depth,
    count(*) as reading_count
  from public.readings r
  where r.node_id = any(p_node_ids)
    and r.recorded_at >= p_from
    and r.recorded_at <= p_to
  group by 1, 2
  order by 1 asc;
$$;

grant execute on function public.readings_bucketed(uuid[], timestamptz, timestamptz, bucket_interval) to authenticated;
