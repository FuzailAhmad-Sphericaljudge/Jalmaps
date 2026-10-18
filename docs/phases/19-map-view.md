# Phase 19: Map View

## Goal

A fast, accessible, privacy-aware map of wells coloured by status, with clustering, filters and search, that stays smooth with thousands of wells.

## Strategy

1. **Map Stack**: MapLibre GL JS loaded lazily. Tile strategy documented in `docs/maps.md`.
2. **PostGIS Data**: Add `postgis` extension and `geom` geography column on wells.
3. **Data API**: `GET /api/v1/wells/map` providing minimal GeoJSON and server-side clustering.
4. **UI**: Map markers, clusters, filters, locate me, bottom sheet popups, URL state sync.
5. **Privacy Enforcement**: Jitter locations or limit access depending on user role (Owner vs Admin vs Insurer vs User).
6. **Accessibility**: Provide List view fallback and screen-reader summaries.
7. **Offline Support**: Integrate with Phase 18 IDB hooks to cache the latest map view.

## Performance Target

- 5,000 synthetic wells generated.
- Smooth panning/zooming on mobile devices.
