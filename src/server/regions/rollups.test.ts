import { describe, expect, it } from "vitest";
import { MIN_PRIVACY_SAMPLE_SIZE, applyPrivacyThreshold } from "./privacy";
import { calculateParentRollup, sortRankedRegions } from "./rollups";

describe("Regional Privacy Thresholds", () => {
  it("masks metrics when wells count is less than minimum sample size", () => {
    const rawStats = {
      wells_count: 2,
      nodes_online: 2,
      avg_depth_m: 14.5,
      median_depth_m: 14.5,
      pct_critical: 50.0,
      pct_warning: 0.0,
      pct_offline: 0.0,
      avg_change_30d_m: -0.8,
      worst_well_id: "well-123",
    };

    const masked = applyPrivacyThreshold(rawStats, false);
    expect(masked.isPrivacySuppressed).toBe(true);
    expect(masked.minSampleSize).toBe(MIN_PRIVACY_SAMPLE_SIZE);
    expect(masked.stats.avg_depth_m).toBeNull();
    expect(masked.stats.median_depth_m).toBeNull();
    expect(masked.stats.pct_critical).toBe(0);
    expect(masked.stats.worst_well_id).toBeNull();
    // Non-sensitive counts remain visible
    expect(masked.stats.wells_count).toBe(2);
  });

  it("retains all metrics when sample size is at or above threshold", () => {
    const rawStats = {
      wells_count: 5,
      nodes_online: 5,
      avg_depth_m: 12.3,
      median_depth_m: 11.9,
      pct_critical: 20.0,
      pct_warning: 20.0,
      pct_offline: 0.0,
      avg_change_30d_m: -0.4,
      worst_well_id: "well-456",
    };

    const result = applyPrivacyThreshold(rawStats, false);
    expect(result.isPrivacySuppressed).toBe(false);
    expect(result.stats.avg_depth_m).toBe(12.3);
    expect(result.stats.pct_critical).toBe(20.0);
    expect(result.stats.worst_well_id).toBe("well-456");
  });

  it("bypasses masking when caller has bypass permission", () => {
    const rawStats = {
      wells_count: 1,
      nodes_online: 1,
      avg_depth_m: 18.2,
      median_depth_m: 18.2,
      pct_critical: 100.0,
      pct_warning: 0.0,
      pct_offline: 0.0,
      avg_change_30d_m: -1.2,
      worst_well_id: "well-789",
    };

    const result = applyPrivacyThreshold(rawStats, true);
    expect(result.isPrivacySuppressed).toBe(false);
    expect(result.stats.avg_depth_m).toBe(18.2);
  });
});

describe("Regional Roll-ups and Sorting", () => {
  it("calculates weighted parent roll-ups accurately", () => {
    const children = [
      {
        wells_count: 10,
        nodes_online: 8,
        avg_depth_m: 10.0,
        median_depth_m: 10.0,
        pct_critical: 20.0,
        pct_warning: 10.0,
        pct_offline: 10.0,
        avg_change_30d_m: 1.0,
      },
      {
        wells_count: 20,
        nodes_online: 18,
        avg_depth_m: 25.0,
        median_depth_m: 25.0,
        pct_critical: 50.0,
        pct_warning: 20.0,
        pct_offline: 5.0,
        avg_change_30d_m: -2.0,
      },
    ];

    const parent = calculateParentRollup(children);
    expect(parent.wells_count).toBe(30);
    expect(parent.nodes_online).toBe(26);
    // Weighted avg depth: (10*10 + 20*25)/30 = 600/30 = 20.0
    expect(parent.avg_depth_m).toBe(20.0);
    // Weighted pct_critical: (10*20 + 20*50)/30 = 1200/30 = 40.0
    expect(parent.pct_critical).toBe(40.0);
    // Weighted avg_change: (10*1 + 20*-2)/30 = -30/30 = -1.0
    expect(parent.avg_change_30d_m).toBe(-1.0);
  });

  it("sorts regions deterministically with locale and tie-breakers", () => {
    const items = [
      {
        id: "1",
        code: "A",
        name: "Baramati",
        level: "block" as const,
        isPrivacySuppressed: false,
        stats: {
          wells_count: 15,
          nodes_online: 14,
          avg_depth_m: 18.0,
          median_depth_m: 18.0,
          pct_critical: 25.0,
          pct_warning: 10.0,
          pct_offline: 5.0,
          avg_change_30d_m: -0.5,
        },
      },
      {
        id: "2",
        code: "B",
        name: "Haveli",
        level: "block" as const,
        isPrivacySuppressed: false,
        stats: {
          wells_count: 25,
          nodes_online: 24,
          avg_depth_m: 12.0,
          median_depth_m: 12.0,
          pct_critical: 40.0,
          pct_warning: 10.0,
          pct_offline: 5.0,
          avg_change_30d_m: -1.5,
        },
      },
      {
        id: "3",
        code: "C",
        name: "Ambegaon",
        level: "block" as const,
        isPrivacySuppressed: false,
        stats: {
          wells_count: 10,
          nodes_online: 10,
          avg_depth_m: 15.0,
          median_depth_m: 15.0,
          pct_critical: 25.0,
          pct_warning: 10.0,
          pct_offline: 0.0,
          avg_change_30d_m: 0.2,
        },
      },
    ];

    const sortedByCritDesc = sortRankedRegions(items, "critical", "desc", "en");
    expect(sortedByCritDesc[0]?.name).toBe("Haveli");
    // Ambegaon and Baramati have same critical (25%), tie-breaker is name alphabetical
    expect(sortedByCritDesc[1]?.name).toBe("Ambegaon");
    expect(sortedByCritDesc[2]?.name).toBe("Baramati");
  });
});
