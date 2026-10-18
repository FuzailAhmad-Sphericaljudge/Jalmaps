# Sensor Data Simulator

The Phase 7 Simulator provides deterministic, physically-realistic groundwater data generation for JalMaps. It simulates groundwater level changes, pumping events, device battery profiles, and sensor faults.

## Features

- **Realistic Physical Model**: Models baseline well depths, seasonal cycles (monsoons), long-term trends, and hourly pumping drawdowns.
- **Device Model**: Simulates solar-charging battery curves, RSSI fluctuations, gaps, and ADC quantisation.
- **Configurable Scenarios**: `normal`, `drought`, `over_extraction`, `good_recharge`, `sensor_fault`, `offline_gaps`, `low_battery`.
- **Deterministic output**: Built on a `mulberry32` PRNG. A given seed always yields the exact same generated series.
- **Idempotency**: Uses database UPSERT with `ON CONFLICT DO NOTHING`, allowing safe script reruns without data duplication.

## CLI Commands

- `pnpm sim:backfill --months 12 --interval 60 --scenario mix --seed 42`
  Backfills data for all simulated nodes. You can specify a scenario (e.g. `normal` or `mix`) and a timeframe.
- `pnpm sim:live --interval-sec 5 --speedup 60`
  Emits readings in a continuous loop to simulate real-time devices for live demos.
- `pnpm sim:reset`
  Safely deletes all simulated readings and resets node metadata. Prompts for confirmation unless `--confirm` is provided.
- `pnpm sim:status`
  Displays the number of readings and `last_seen_at` for each simulated node.
- `pnpm sim:export --node <id> --csv`
  Exports readings to CSV or prints a quick ASCII sparkline to the terminal.

## Adding a Scenario

To add a new scenario, modify `SCENARIOS` in `src/server/simulator/models.ts`. Adjust the `monsoonStrength`, `longTermTrendMYr`, and `pumpHoursPerDay` to tune the simulated behavior.

## Known Simplifications

- The pumping model assumes constant daily routines rather than farmer-driven ad-hoc schedules.
- Recovery is a simple exponential decay that doesn't account for complex aquifer transmissivity.
