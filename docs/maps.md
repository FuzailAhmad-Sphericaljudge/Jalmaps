# Architecture Decision Record: Maps and Tile Strategy

## 1. Context

We need a performant, reliable vector map background for groundwater well visualization across India. The client uses MapLibre GL JS, which is an open-source, fast, WebGL-based vector map engine.

## 2. Decision: Tile Provider Strategy

- **Production Choice**: Self-hosted PMTiles or open provider (such as Protomaps or Stadia Maps) using standard MapLibre-compatible vector styles.
- **Do not use standard OSM tile servers**: Direct usage of OSM tile servers is prohibited for production bulk/app usage.
- **Attribution Requirement**: All maps must display the OpenStreetMap attribution: `© OpenStreetMap contributors`.
- **Environment Variable**: `MAP_STYLE_URL` controls the style sheet. Default points to a demo or mock style for tests, or self-hosted styles in production.
- **Offline / Tile Failure Fallback**: A bundled, simplified India boundary GeoJSON is used if tiles cannot load or when offline.

## 3. PostGIS and Spatial Database

- `postgis` extension enabled via database migrations.
- `geom` column of type `geography(Point, 4326)` generated from `latitude` and `longitude`.
- GiST spatial indexing (`CREATE INDEX idx_wells_geom ON wells USING GIST(geom)`) for sub-millisecond bounding box searches.

## 4. Privacy Rules

- **Owners and Area Admins**: Exact coordinates returned.
- **Public / Other Users**: Coordinates jittered deterministically by ~200-500m or aggregated to village centroids.
- **Insurers**: Can only query aggregate counts and risk indicators, never precise individual well points.

## 5. Performance

- Viewport bounding-box filtering (`bbox`).
- Dynamic server-side clustering at low zoom levels to minimize payloads.
- Target interaction smoothness: 60 FPS panning/zooming with 5,000 synthetic wells.
