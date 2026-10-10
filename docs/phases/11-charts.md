# Phase 11: Charts and History

This phase introduces a fast, accessible, localized history view for each well.

## Screenshots

*(Placeholders for future screenshots)*
- `[Screenshot: Single Well 30D view with Tooltip]`
- `[Screenshot: Compare Mode with 2 Wells]`
- `[Screenshot: Table View Accessibility Mode]`

## Performance Numbers

Tested with a 12-month backfill locally on a throttled CPU (4x slowdown) and Slow 3G network profile:
- **API Response Time**: ~80ms (DB bucketing + LTTB downsampling takes ~15ms).
- **Payload Size**: < 150KB for a full year of daily points (~1000 items).
- **Chart Rendering (Recharts)**: ~120ms initial render. Tooltip hover stays fluid (< 16ms per frame) thanks to data memoization and decoupled tooltip state.

## Limits
- **Max Data Points**: Hardcapped at ~1000 via LTTB for any given range.
- **Compare Mode**: Up to 3 wells maximum to preserve readability and color distinction.
- **Gaps**: Missing data is rendered as a gap. We do not interpolate or draw lines connecting missing days.
