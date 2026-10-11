-- Enable PostGIS extension if it doesn't exist
CREATE EXTENSION IF NOT EXISTS postgis WITH SCHEMA extensions;

-- Add a geometry column to the wells table for fast spatial queries
-- Using geography(Point, 4326) allows distance queries in meters natively on the spheroid.
ALTER TABLE wells ADD COLUMN IF NOT EXISTS geom geography(Point, 4326);

-- Backfill the geom column for existing wells using their latitude and longitude
UPDATE wells 
SET geom = ST_SetSRID(ST_MakePoint(longitude, latitude), 4326)::geography 
WHERE longitude IS NOT NULL AND latitude IS NOT NULL;

-- Create a GiST index for efficient spatial bounding box searches
CREATE INDEX IF NOT EXISTS idx_wells_geom ON wells USING GIST (geom);

-- We can also add a trigger to automatically update the geom column when lat/lon change
CREATE OR REPLACE FUNCTION update_well_geom()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.latitude IS NOT NULL AND NEW.longitude IS NOT NULL THEN
    NEW.geom = ST_SetSRID(ST_MakePoint(NEW.longitude, NEW.latitude), 4326)::geography;
  ELSE
    NEW.geom = NULL;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_update_well_geom ON wells;
CREATE TRIGGER trg_update_well_geom
BEFORE INSERT OR UPDATE OF latitude, longitude
ON wells
FOR EACH ROW
EXECUTE FUNCTION update_well_geom();
