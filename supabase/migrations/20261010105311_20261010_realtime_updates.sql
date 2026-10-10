

DROP POLICY IF EXISTS "Users can subscribe to their wells" ON realtime.messages;
CREATE POLICY "Users can subscribe to their wells"
ON realtime.messages
FOR SELECT
TO authenticated
USING (
    topic LIKE 'well:%'
    AND public.can_read_well((substring(topic from 6))::uuid)
);

CREATE OR REPLACE FUNCTION public.broadcast_new_readings()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  PERFORM realtime.send(
    json_build_object(
      'node_id', r.node_id,
      'well_id', r.well_id,
      'recorded_at', r.recorded_at,
      'depth_to_water_m', r.depth_to_water_m,
      'column_m', r.column_m,
      'quality', r.quality,
      'battery_v', r.battery_v
    )::jsonb,
    'reading',
    'well:' || r.well_id,
    true
  )
  FROM (
    SELECT DISTINCT ON (well_id) *
    FROM new_readings
    ORDER BY well_id, recorded_at DESC
  ) r;
  
  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS on_reading_inserted_broadcast ON public.readings;
CREATE TRIGGER on_reading_inserted_broadcast
  AFTER INSERT ON public.readings
  REFERENCING NEW TABLE AS new_readings
  FOR EACH STATEMENT
  EXECUTE FUNCTION public.broadcast_new_readings();
