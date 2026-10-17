-- Phase 20: Administrative Boundaries and Spatial Point-in-Polygon Assignment

-- 1. Add boundary and simplified boundary columns to admin_areas
ALTER TABLE admin_areas 
  ADD COLUMN IF NOT EXISTS boundary geometry(MultiPolygon, 4326),
  ADD COLUMN IF NOT EXISTS boundary_simplified geometry(MultiPolygon, 4326);

-- Spatial index on full boundary for fast point-in-polygon containment
CREATE INDEX IF NOT EXISTS idx_admin_areas_boundary 
  ON admin_areas USING GIST (boundary);

-- Spatial index on simplified boundary for fast bounding box and rendering filters
CREATE INDEX IF NOT EXISTS idx_admin_areas_boundary_simplified 
  ON admin_areas USING GIST (boundary_simplified);

-- 2. Function to assign a well to its containing village administrative area
CREATE OR REPLACE FUNCTION assign_well_admin_area()
RETURNS TRIGGER AS $$
DECLARE
  found_area_id uuid;
BEGIN
  -- Only execute if admin_area_id is missing or null, and coordinates exist
  IF NEW.admin_area_id IS NULL AND NEW.longitude IS NOT NULL AND NEW.latitude IS NOT NULL THEN
    SELECT id INTO found_area_id
    FROM admin_areas
    WHERE level = 'village'
      AND boundary IS NOT NULL
      AND ST_Contains(boundary, ST_SetSRID(ST_MakePoint(NEW.longitude, NEW.latitude), 4326))
    LIMIT 1;

    -- If found, assign the village area id
    IF found_area_id IS NOT NULL THEN
      NEW.admin_area_id := found_area_id;
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 3. Trigger on wells table before insert or update of coordinates
DROP TRIGGER IF EXISTS trg_assign_well_admin_area ON wells;
CREATE TRIGGER trg_assign_well_admin_area
BEFORE INSERT OR UPDATE OF latitude, longitude, admin_area_id
ON wells
FOR EACH ROW
EXECUTE FUNCTION assign_well_admin_area();

-- 4. One-off backfill procedure for existing unassigned wells
CREATE OR REPLACE FUNCTION backfill_well_admin_areas()
RETURNS integer AS $$
DECLARE
  updated_count integer := 0;
BEGIN
  WITH matched AS (
    SELECT w.id as well_id, a.id as area_id
    FROM wells w
    JOIN admin_areas a 
      ON a.level = 'village'
      AND a.boundary IS NOT NULL
      AND ST_Contains(a.boundary, ST_SetSRID(ST_MakePoint(w.longitude, w.latitude), 4326))
    WHERE w.admin_area_id IS NULL
      AND w.longitude IS NOT NULL
      AND w.latitude IS NOT NULL
  )
  UPDATE wells
  SET admin_area_id = matched.area_id
  FROM matched
  WHERE wells.id = matched.well_id;

  GET DIAGNOSTICS updated_count = ROW_COUNT;
  RETURN updated_count;
END;
$$ LANGUAGE plpgsql;
