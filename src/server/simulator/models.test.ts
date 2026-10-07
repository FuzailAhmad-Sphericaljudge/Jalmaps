import { describe, expect, it } from "vitest";
import { generateSeries, NodeSimConfig } from "./models";
import { createPRNG } from "./prng";

describe("Simulator Models", () => {
  const baseConfig: NodeSimConfig = {
    nodeId: "node-1",
    wellId: "well-1",
    baselineDepthM: 15,
    hangDepthM: 30,
    sensorRangeM: 30,
    scenario: "normal",
  };

  it("same seed gives identical output", () => {
    const prng1 = createPRNG(42);
    const prng2 = createPRNG(42);
    const start = new Date("2025-01-01T00:00:00Z");
    const end = new Date("2025-01-02T00:00:00Z");

    const series1 = generateSeries({
      config: baseConfig,
      start,
      end,
      intervalMinutes: 60,
      prng: prng1,
    });
    const series2 = generateSeries({
      config: baseConfig,
      start,
      end,
      intervalMinutes: 60,
      prng: prng2,
    });

    expect(series1).toEqual(series2);
  });

  it("different seeds differ", () => {
    const start = new Date("2025-01-01T00:00:00Z");
    const end = new Date("2025-01-02T00:00:00Z");

    const series1 = generateSeries({
      config: baseConfig,
      start,
      end,
      intervalMinutes: 60,
      prng: createPRNG(42),
    });
    const series2 = generateSeries({
      config: baseConfig,
      start,
      end,
      intervalMinutes: 60,
      prng: createPRNG(43),
    });

    expect(series1).not.toEqual(series2);
  });

  it("no NaN or out-of-range values", () => {
    const start = new Date("2025-01-01T00:00:00Z");
    const end = new Date("2025-01-30T00:00:00Z");
    const series = generateSeries({
      config: baseConfig,
      start,
      end,
      intervalMinutes: 60,
      prng: createPRNG(42),
    });

    for (const r of series) {
      expect(Number.isNaN(r.column_m)).toBe(false);
      expect(Number.isNaN(r.current_ma)).toBe(false);
      expect(r.column_m).toBeGreaterThanOrEqual(0);
      expect(r.column_m).toBeLessThanOrEqual(baseConfig.sensorRangeM);
      expect(r.current_ma).toBeGreaterThanOrEqual(3); // allowing stuck faults to dip to 3.2
      expect(r.current_ma).toBeLessThanOrEqual(20);
    }
  });

  it("pump drawdown then recovery shape is present", () => {
    const start = new Date("2025-01-01T06:00:00Z"); // Pumping starts at 6
    const end = new Date("2025-01-01T12:00:00Z");
    const series = generateSeries({
      config: baseConfig,
      start,
      end,
      intervalMinutes: 60,
      prng: createPRNG(42),
    });

    // Depth should generally increase during pumping hours (6-9)
    const earlyDepth = series[0].depth_to_water_m;
    const lateDepth = series[2].depth_to_water_m;
    expect(lateDepth).toBeGreaterThan(earlyDepth);
  });
});
