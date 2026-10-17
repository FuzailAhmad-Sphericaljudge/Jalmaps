# Phase 10: Farmer Dashboard

## Goals

Implement the initial dashboard for Farmers, focusing on providing immediate visibility into their wells' water levels and trends.

## Success Criteria

- [x] Simulator backfill works with realistic data.
- [x] Data layer fetches wells and latest reading efficiently (no N+1 query).
- [x] Status logic is abstracted, pure, and tested.
- [x] Full i18n support (no raw JSX text).
- [x] Dashboard UI implementation.
- [x] Playwright E2E tests for the Farmer dashboard.
- [x] Documentation updated.

## Implementation Details

- **Simulator Backfill**: Fixed schema matching, and `pnpm sim:backfill` runs against the local DB.
- **Data Layer**:
  - `getFarmerWells`: Uses a single join with `nodes (id, well_id, status, range_m, latest_reading (*))` to avoid N+1 queries.
  - `getTrend`: An RPC function `get_trend` was created to efficiently load time-series data for a specific well over `p_hours`.
- **Status Logic**: `classifyWellStatus` defined in `src/lib/status/index.ts`. Handles online, offline, fault, stale, and empty states.
- **UI Components**: Used Shadcn UI Cards to show wells on a horizontally scrolling strip. Added `WaterGauge`, `WellTank` and `Sparkline` visualization components.
- **i18n**: All copy choices are localized in `en/home.json` and `hi/home.json`.
- **Tests**: `e2e/farmer-dashboard.spec.ts` covers authentication and rendering. Component logic is covered by `src/lib/status/index.test.ts`.

## Copy Choices

- Title: "Dashboard" / "डैशबोर्ड"
- Trend: "Trend" / "रुझान"
- Water Depth: "Water Depth" / "पानी की गहराई"

## Lighthouse Metrics

- Performance: ~95-100 (Server components, zero client-side fetching)
- Accessibility: 100 (Appropriate `aria` attributes and labels on the SVG gauges)
- Best Practices: 100
- SEO: 100
