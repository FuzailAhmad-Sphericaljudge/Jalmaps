# JalMaps Project Roadmap

This document serves as a tracker for all completed and ongoing development phases.
It is specifically designed for agents to easily understand the project history and goals.

## Completed Phases (1-10)

- **Phase 1-4:** Initial setup, authentication, core models, localization, and basic UI system.
- **Phase 5-7:** Nodes, Wells logic, real-time sync foundation, alerts engine foundation.
- **Phase 8-10:** Farmer dashboard, map view, onboarding, basic visualisations (Water Gauge, Well Tank).

## Ongoing Phase (11)

- **Phase 11: Charts and history**
  - **Pitch:** A fast, accessible, localised history view for each well that stays smooth with a year of data on a low-end phone.
  - **Status:** In Progress. Implemented LTTB downsampling, `readings_bucketed` RPC, Range presets, History Chart with Recharts (Tooltip, Area band, Brush, ReferenceLine for thresholds), and server-computed summary stats.
  - **Next Steps:** Compare mode, accessibility table toggle, CSV export, and performance/a11y testing.

## Upcoming Phases (12+)

- **Phase 12:** Realtime updates for chart and dashboard.
- **Phase 13:** Robust alert generation (cron or webhooks).
- **Phase 25:** Advanced forecasting overlay (ML / predictive models).
