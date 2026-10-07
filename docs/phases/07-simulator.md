# Phase 07 — Sensor Data Simulator

- **Status:** Implemented
- **Branching:** Worked directly on `main`.

## Delivered

- **Architecture:** Pure TypeScript PRNG (`mulberry32`) and models in `src/server/simulator/`.
- **Sensor Math:** Isolated 4-20mA conversion logic in `src/lib/sensor/math.ts` (tested and ready for Phase 8).
- **CLI Suite:** Configured scripts in `scripts/sim/` for backfilling, live emitting, checking status, exporting, and safely resetting data.
- **Scenarios:** Included `normal`, `drought`, `over_extraction`, `good_recharge`, `sensor_fault`, `offline_gaps`, `low_battery`, and a `mix` mode.
- **Tests:** Integrated structurally sound Unit Tests for model boundaries and determinism.
