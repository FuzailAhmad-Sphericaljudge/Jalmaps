# Official Dashboard Architecture & Specification

## Overview

The Official Dashboard provides administrative users (district officers, block officers, state administrators, and village admins) with a unified, high-performance command center for groundwater monitoring and timely intervention.

---

## 1. Explainable Village Stress Score

To prioritize administrative attention objectively, villages are ranked using a deterministic, transparent composite stress score (0–100):

$$\text{Stress Score} = S_{\text{critical}} + S_{\text{depletion}} + S_{\text{offline}} + S_{\text{alerts}} + S_{\text{aquifer}}$$

### Component Weights & Formulas

1. **Critical Wells ($S\_{\text{critical}}$, Max 30 points)**
   - Scales linearly with the percentage of wells in critical groundwater state ($\ge 25\%$ critical earns max 30 points).
   - Chip: `"{pct}% wells critical"`
2. **Depletion Rate ($S\_{\text{depletion}}$, Max 25 points)**
   - Scales with 30-day water level decline ($\ge 1.5\text{ m/year}$ equivalent depletion earns max 25 points).
   - Chip: `"Depleting fast ({rate} m/yr)"`
3. **Offline Sensors ($S\_{\text{offline}}$, Max 20 points)**
   - Scales with the percentage of inactive telemetry nodes ($\ge 30\%$ offline earns max 20 points).
   - Chip: `"{pct}% nodes offline"`
4. **Critical Alerts ($S\_{\text{alerts}}$, Max 15 points)**
   - Scales with open high-severity threshold alerts ($\ge 5$ open alerts earns max 15 points).
   - Chip: `"{count} critical alerts"`
5. **Aquifer Vulnerability ($S\_{\text{aquifer}}$, Max 10 points)**
   - Based on Phase 21 Aquifer Health Score ($< 50$ indicates severe depletion stress).
   - Chip: `"Poor aquifer health ({score})"`

### Severity Tiers

- **Critical (High Stress):** Score $\ge 70$ (Red badge)
- **Warning (Moderate Stress):** $40 \le \text{Score} < 70$ (Amber badge)
- **Watch:** $20 \le \text{Score} < 40$ (Blue badge)
- **Low:** $\text{Score} < 20$ (Green badge)

---

## 2. Key Performance Indicator (KPI) Strip

All top-level metrics are computed from precomputed `area_stats` rollups (Phase 20) to guarantee sub-100ms render times:

1. **Wells Monitored**: Total operational groundwater monitoring wells.
2. **Nodes Online**: Telemetry nodes actively reporting within reporting intervals.
3. **Critical Villages**: Share of villages with $> 25\%$ critical wells or high stress score.
4. **30-Day Change**: Area-wide net water depth fluctuation.
5. **Open Critical Alerts**: High-severity alerts needing acknowledgment or intervention.
6. **Data Freshness**: Timestamp of latest ingested reading.

---

## 3. Privacy Thresholds & Role Scoping

- **Privacy Threshold ($N = 3$)**: When an area or village has fewer than 3 monitored wells, exact depths and depletion metrics are masked to preserve farmer privacy.
- **Role Scoping**: Official views enforce `user_area_ids()` through PostgreSQL Row Level Security (RLS). Officers cannot access data outside their assigned jurisdictions.

---

## 4. Administrative Features

- **Choropleth Map**: MapLibre GL choropleth visualization toggleable between critical wells, offline nodes, and average depth.
- **Alert Feed**: Area-scoped alerts with in-place acknowledgment.
- **Trend Panel**: Year-over-year comparison with date presets (`7d`, `30d`, `90d`, `1y`).
- **Saved Views**: Stored query filters with default and pin-to-home capabilities.
- **Follow-up Action Tracker**: Notes and field inspections with assigned status (`open`, `in_progress`, `done`).
- **Print Layout**: Clean A4 print layout via `@media print`.
