import { describe, it, expect } from "vitest";
import { compareMonsoonSeasons } from "./monsoon";
import type { TimeSeriesPoint } from "./seasonal";

describe("compareMonsoonSeasons", () => {
  it("evaluates net water-table rise with high confidence when both windows have sufficient data", () => {
    const points: TimeSeriesPoint[] = [];

    // May 2025 (pre-monsoon): deep water level ~18m
    for (let day = 1; day <= 20; day++) {
      const dStr = day < 10 ? `0${day}` : `${day}`;
      points.push({ date: `2025-05-${dStr}`, depthM: 18 + (day % 3) * 0.1 });
    }

    // October-November 2025 (post-monsoon): shallow water level ~12m
    for (let day = 1; day <= 20; day++) {
      const dStr = day < 10 ? `0${day}` : `${day}`;
      points.push({ date: `2025-10-${dStr}`, depthM: 12 + (day % 3) * 0.1 });
    }

    const summary = compareMonsoonSeasons(points);

    expect(summary.years).toHaveLength(1);
    const yr = summary.years[0]!;
    expect(yr.year).toBe(2025);
    expect(yr.preMonsoonDaysCount).toBe(20);
    expect(yr.postMonsoonDaysCount).toBe(20);
    expect(yr.confidence).toBe("high");
    expect(yr.confidenceNoteKey).toBe("confidence_high_coverage");
    expect(yr.preMonsoonMedianDepthM).toBeCloseTo(18.1, 1);
    expect(yr.postMonsoonMedianDepthM).toBeCloseTo(12.1, 1);
    // Net rise = 18.1 - 12.1 = +6m
    expect(yr.netRiseM).toBeCloseTo(6.0, 1);
    expect(summary.averageNetRiseM).toBeCloseTo(6.0, 1);
  });

  it("handles low and insufficient confidence states accurately", () => {
    // Only 3 pre-monsoon points and 0 post-monsoon points
    const points: TimeSeriesPoint[] = [
      { date: "2025-05-01", depthM: 20 },
      { date: "2025-05-02", depthM: 20.2 },
      { date: "2025-05-03", depthM: 19.8 },
    ];

    const summary = compareMonsoonSeasons(points);
    expect(summary.years).toHaveLength(1);
    const yr = summary.years[0]!;
    expect(yr.confidence).toBe("insufficient");
    expect(yr.confidenceNoteKey).toBe("confidence_missing_post_monsoon");
    expect(yr.netRiseM).toBeNull();
    expect(summary.averageNetRiseM).toBeNull();
  });

  it("supports multiple years and calculates average net rise", () => {
    const points: TimeSeriesPoint[] = [
      // 2024: 15m in May, 10m in Oct (rise 5m)
      ...Array.from({ length: 15 }, (_, i) => ({
        date: `2024-05-${i + 1 < 10 ? "0" : ""}${i + 1}`,
        depthM: 15,
      })),
      ...Array.from({ length: 15 }, (_, i) => ({
        date: `2024-10-${i + 1 < 10 ? "0" : ""}${i + 1}`,
        depthM: 10,
      })),
      // 2025: 16m in May, 13m in Oct (rise 3m)
      ...Array.from({ length: 15 }, (_, i) => ({
        date: `2025-05-${i + 1 < 10 ? "0" : ""}${i + 1}`,
        depthM: 16,
      })),
      ...Array.from({ length: 15 }, (_, i) => ({
        date: `2025-10-${i + 1 < 10 ? "0" : ""}${i + 1}`,
        depthM: 13,
      })),
    ];

    const summary = compareMonsoonSeasons(points);
    expect(summary.years).toHaveLength(2);
    expect(summary.years[0]!.netRiseM).toBe(5);
    expect(summary.years[1]!.netRiseM).toBe(3);
    expect(summary.averageNetRiseM).toBe(4);
    expect(summary.latestYear?.year).toBe(2025);
  });
});

