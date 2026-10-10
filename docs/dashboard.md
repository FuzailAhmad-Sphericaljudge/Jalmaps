# Farmer Dashboard Architecture

The Farmer Dashboard (`/app/[locale]/app/farmer`) is the primary entry point for the `farmer` role. It provides a real-time overview of their monitored wells.

## Data Fetching Strategy

The dashboard embraces Server Components to maximize performance and avoid client-side waterfalls.

### Single Query for Status

We fetch all wells owned by the farmer, joining `nodes` and the `latest_reading` view in a single Supabase call.
This guarantees O(1) database queries regardless of how many wells a farmer owns, strictly avoiding the N+1 problem.

```typescript
// Fetching strategy
await client
  .from("wells")
  .select(
    `
    *,
    nodes (
      id, well_id, status, range_m,
      latest_reading (*)
    )
  `,
  )
  .eq("owner_id", userId);
```

_Note: We only select allowed columns for `nodes` to respect Row Level Security (RLS)._

### Time-series Trend

To determine the trend (rising or falling), we created an RPC function `get_trend(well_id, hours)` which directly filters and orders readings on the database side, returning only the timestamp and water depth.

## Status Classification

The status of a well is determined by a pure function (`classifyWellStatus`), which is thoroughly unit-tested. It incorporates:

- Node configured status (`fault`, `offline`)
- Recency of the reading (`stale` if > 24h)
- Quality of the reading (`suspect`, `bad`)

## UI and Visualization

- **Horizontal Scrolling**: Optimized for touch interfaces (farmers typically use mobile phones).
- **WaterGauge / WellTank**: Graphical indicators with proper ARIA attributes to ensure accessibility.
- **Sparklines**: Lightweight SVG line charts providing an immediate visual sense of the water trend over the last 7 days.
