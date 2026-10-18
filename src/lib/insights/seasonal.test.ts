import { describe, it, expect } from "vitest";
import {
  calculateMedian,
  computeDailyMedians,
  getDayOfYear,
  computeCenteredMovingAverage,
  decomposeTimeSeries,
} from "./seasonal";

describe("Seasonal Analysis", () => {
  it("calculates median correctly for odd and even length arrays", () => {
    expect(calculateMedian([5, 1, 3])).toBe(3);
    expect(calculateMedian([10, 20, 30, 40])).toBe(25);
    expect(calculateMedian([])).toBe(0);
  });

  it("aggregates hourly readings into daily medians", () => {
    const readings = [
      { recordedAt: "2026-05-01T06:00:00Z", depthToWaterM: 10.0 },
      { recordedAt: "2026-05-01T12:00:00Z", depthToWaterM: 12.0 },
      { recordedAt: "2026-05-01T18:00:00Z", depthToWaterM: 11.0 },
      { recordedAt: "2026-05-02T06:00:00Z", depthToWaterM: 9.5 },
    ];

    const medians = computeDailyMedians(readings);
    expect(medians).toHaveLength(2);
    expect(medians[0]!.date).toBe("2026-05-01");
    expect(medians[0]!.depthM).toBe(11.0);
    expect(medians[1]!.date).toBe("2026-05-02");
    expect(medians[1]!.depthM).toBe(9.5);
  });

  it("computes day of year accurately", () => {
    expect(getDayOfYear("2026-01-01")).toBe(1);
    expect(getDayOfYear("2026-01-31")).toBe(31);
    expect(getDayOfYear("2026-02-01")).toBe(32);
  });

  it("smoothes series using centered moving average", () => {
    const series = [
      { date: "2026-01-01", depthM: 10 },
      { date: "2026-01-02", depthM: 20 },
      { date: "2026-01-03", depthM: 30 },
    ];
    const trend = computeCenteredMovingAverage(series, 3);
    expect(trend).toHaveLength(3);
    expect(trend[1]!.trend).toBe(20);
  });

  it("decomposes daily medians into additive trend, seasonal, and residual components", () => {
    // Generate 60 days of synthetic data
    const dailyMedians = Array.from({ length: 60 }, (_, i) => {
      const day = i + 1;
      const date = `2026-03-${day < 10 ? "0" + day : day > 31 ? (day - 31 < 10 ? "0" + (day - 31) : day - 31) : day}`;
      const depthM = 10 + Math.sin((i / 15) * Math.PI) * 2;
      return { date, depthM };
    });

    const res = decomposeTimeSeries(dailyMedians, 7);
    expect(res.decomposition).toHaveLength(60);
    const first = res.decomposition[0]!;
    expect(first.observed).toBeDefined();
    expect(first.trend).toBeDefined();
    expect(first.seasonal).toBeDefined();
    expect(first.residual).toBeDefined();

    // Verify additive identity: observed ≈ trend + seasonal + residual
    for (const pt of res.decomposition) {
      const sum = Math.round((pt.trend + pt.seasonal + pt.residual) * 1000) / 1000;
      expect(Math.abs(pt.observed - sum)).toBeLessThan(0.01);
    }
  });
});

