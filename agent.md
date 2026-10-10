# JalMaps Project Roadmap

This document serves as a tracker for all completed and ongoing development phases.
It is specifically designed for agents to easily understand the project history and goals.

## Completed Phases (1-12)

- **Phase 1-4:** Initial setup, authentication, core models, localization, and basic UI system.
- **Phase 5-7:** Nodes, Wells logic, real-time sync foundation, alerts engine foundation.
- **Phase 8-10:** Farmer dashboard, map view, onboarding, basic visualisations (Water Gauge, Well Tank).
- **Phase 11: Charts and history**
  - **Pitch:** A fast, accessible, localised history view for each well that stays smooth with a year of data on a low-end phone.
  - **Status:** Completed. Implemented LTTB downsampling, `readings_bucketed` RPC, Range presets, History Chart with Recharts, server-computed summary stats, Compare mode, accessibility table toggle, CSV export, E2E testing, and Documentation.
- **Phase 12: Realtime updates**
  - **Pitch:** Instantly updates the dashboard and history chart when a new sensor reading arrives without a refresh, degrading gracefully when offline.
  - **Status:** Completed. Implemented `realtime.send` trigger, `realtime.messages` RLS, Client RealtimeManager, connection state UI badges, and chart integration.

## Upcoming Phases (13+)

- **Phase 13:** Robust alert generation (cron or webhooks).
- **Phase 25:** Advanced forecasting overlay (ML / predictive models).
