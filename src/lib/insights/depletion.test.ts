import { describe, it, expect } from "vitest";
import { computeTheilSenDepletion } from "./depletion";
import type { TimeSeriesPoint } from "./seasonal";

describe("computeTheilSenDepletion", () => {
  it("refuses to extrapolate without sufficient multi-year span", () => {
    // Only 180 days (~0.5 year)
    const points: TimeSeriesPoint[] = Array.from({ length: 180 }, (_, i) => ({
      date: new Date(Date.UTC(2025, 0, 1) + i * 24 * 3600 * 1000).toISOString().slice(0, 10),
      depthM: 10 + i * 0.01,
    }));

    const result = computeTheilSenDepletion(points);
    expect(result.hasEnoughYears).toBe(false);
    expect(result.statusNoteKey).toBe("depletion_insufficient_span_years");
    expect(result.depletionRateMPerYear).toBeNull();
  });

  it("accurately computes positive depletion rate (water table dropping) over a 2-year synthetic series", () => {
    // 730 days (2 years), depth steadily increasing at ~0.50 m/year plus seasonal wave
    const points: TimeSeriesPoint[] = Array.from({ length: 730 }, (_, i) => {
      const date = new Date(Date.UTC(2024, 0, 1) + i * 24 * 3600 * 1000).toISOString().slice(0, 10);
      const yearFraction = i / 365.25;
      const seasonal = Math.sin((i / 365.25) * 2 * Math.PI) * 1.5;
      const depth = 12 + yearFraction * 0.5 + seasonal;
      return { date, depthM: depth };
    });

    const result = computeTheilSenDepletion(points);
    expect(result.hasEnoughYears).toBe(true);
    expect(result.depletionRateMPerYear).not.toBeNull();
    // Expected slope is ~0.50 m/year
    expect(result.depletionRateMPerYear).toBeGreaterThan(0.35);
    expect(result.depletionRateMPerYear).toBeLessThan(0.65);
    expect(result.uncertaintyRangeMPerYear).toBeDefined();
    expect(result.uncertaintyRangeMPerYear!.min).toBeLessThanOrEqual(result.depletionRateMPerYear!);
    expect(result.uncertaintyRangeMPerYear!.max).toBeGreaterThanOrEqual(
      result.depletionRateMPerYear!,
    );
  });
});
