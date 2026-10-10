# Charts Architecture

This document describes the design and architecture of the charts in JalMaps.

## Data Flow

1. **API (`/api/v1/wells/[id]/series`)**: The client requests a series for a specific date range.
2. **Bucketing (`readings_bucketed` SQL function)**: The database aggregates raw readings into buckets (`raw`, `hourly`, `daily`) to reduce the amount of data processed and sent over the wire. This automatically aligns points by timestamp.
3. **Downsampling (LTTB)**: For large date ranges, if the bucketed data still exceeds ~1000 points, it is passed through an implementation of the Largest Triangle Three Buckets (LTTB) algorithm. This preserves the visual shape of the data while capping points. Crucially, missing data gaps are preserved and never interpolated.
4. **Client-side Merging**: The chart component can merge multiple series (in compare mode) by `bucket_time` because the SQL bucketing guarantees aligned timestamps.

## Bucketing Rules

- Less than 48 hours -> `raw` (no bucketing, exact readings)
- Less than 30 days -> `hourly`
- Greater than 30 days -> `daily`

## Accessibility Decisions

1. **Contrast & Colours**: The compare mode uses distinctive colours along with different dash arrays (`strokeDasharray`) so lines are distinguishable even by colour-blind users.
2. **Table View**: We provide a "View Table" toggle which replaces the chart with a standard paginated `<table>` element, readable by screen readers.
3. **Keyboard Navigation**: While Recharts is not fully navigable by default, we provide a plain-language summary on top, e.g., "Water rose 0.8 m in the last 30 days." and the alternative table view.
4. **Tooltips**: Data in the tooltip is localized correctly (using `.toLocaleString()`) and adapts to the user's preferred unit (m/ft).

## Performance

- The payload size is capped by ensuring downsampling never returns more than ~1000 points. Tests enforce that a 1000-point payload stays under 200KB and serialization is fast (under 200ms locally).
- Recharts re-renders are minimized by memoizing the formatted data array.
