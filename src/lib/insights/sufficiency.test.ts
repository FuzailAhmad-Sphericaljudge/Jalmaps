import { describe, it, expect } from "vitest";
import { evaluateDataSufficiency } from "./sufficiency";

describe("evaluateDataSufficiency", () => {
  it("rejects empty or null readings array", () => {
    const res = evaluateDataSufficiency([]);
    expect(res.isSufficient).toBe(false);
    expect(res.missingCriteria).toContain("no_readings_available");
  });

  it("identifies insufficient timespan when readings span only 15 days", () => {
    const now = new Date("2026-06-15T00:00:00Z").getTime();
    const readings = Array.from({ length: 100 }, (_, i) => ({
      recordedAt: new Date(now - i * 3600 * 1000 * 3), // every 3 hours over ~12 days
      depthToWaterM: 10.5,
      quality: "good" as const,
    }));

    const res = evaluateDataSufficiency(readings);
    expect(res.isSufficient).toBe(false);
    expect(res.missingCriteria).toContain("insufficient_timespan");
  });

  it("flags low quality ratio when majority of readings are suspect or bad", () => {
    const start = new Date("2026-01-01T00:00:00Z").getTime();
    const readings = Array.from({ length: 120 }, (_, i) => ({
      recordedAt: new Date(start + i * 24 * 3600 * 1000), // 120 days = ~4 months
      depthToWaterM: 12.0,
      quality: (i % 3 === 0 ? "good" : "bad") as "good" | "bad",
    }));

    const res = evaluateDataSufficiency(readings);
    expect(res.isSufficient).toBe(false);
    expect(res.missingCriteria).toContain("low_quality_ratio");
  });

  it("passes sufficiency when data spans 4 months with good quality readings", () => {
    const start = new Date("2026-01-01T00:00:00Z").getTime();
    const readings = Array.from({ length: 120 }, (_, i) => ({
      recordedAt: new Date(start + i * 24 * 3600 * 1000),
      depthToWaterM: 8.5 + (i % 5) * 0.1,
      quality: "good" as const,
    }));

    const res = evaluateDataSufficiency(readings);
    expect(res.isSufficient).toBe(true);
    expect(res.missingCriteria).toHaveLength(0);
    expect(res.spanMonths).toBeGreaterThanOrEqual(3.8);
    expect(res.coverageRatio).toBe(1);
  });
});

