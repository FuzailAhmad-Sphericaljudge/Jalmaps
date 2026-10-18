import { describe, expect, it } from "vitest";
import { clusterFeatures, getWorstStatus } from "./cluster";
import type { SanitizedWellFeature } from "./privacy";

describe("getWorstStatus", () => {
  it("prioritizes critical above all", () => {
    expect(getWorstStatus(["normal", "warning", "critical"])).toBe("critical");
    expect(getWorstStatus(["warning", "unknown", "critical"])).toBe("critical");
  });

  it("prioritizes warning above normal and unknown", () => {
    expect(getWorstStatus(["normal", "warning", "normal"])).toBe("warning");
    expect(getWorstStatus(["unknown", "warning"])).toBe("warning");
  });

  it("returns normal if only normal and unknown exist", () => {
    expect(getWorstStatus(["normal", "unknown"])).toBe("normal");
  });

  it("returns unknown for empty array", () => {
    expect(getWorstStatus([])).toBe("unknown");
  });
});

describe("clusterFeatures", () => {
  const sampleFeatures: SanitizedWellFeature[] = [
    {
      id: "w1",
      coordinates: [77.1001, 28.5001],
      status: "normal",
      name: "Well 1",
    },
    {
      id: "w2",
      coordinates: [77.1002, 28.5002],
      status: "critical",
      name: "Well 2",
    },
    {
      id: "w3",
      coordinates: [77.2001, 28.6001], // Far away
      status: "warning",
      name: "Well 3",
    },
  ];

  it("clusters nearby points when zoom is low", () => {
    const clustered = clusterFeatures(sampleFeatures, 8, 12);
    // w1 and w2 should be in the same cell and form a cluster with critical status
    const cluster = clustered.find((f) => f.properties.isCluster);
    expect(cluster).toBeDefined();
    expect(cluster?.properties.count).toBe(2);
    expect(cluster?.properties.status).toBe("critical");
  });

  it("returns individual points when zoom is high", () => {
    const unclustered = clusterFeatures(sampleFeatures, 13, 12);
    expect(unclustered).toHaveLength(3);
    expect(unclustered.every((f) => !f.properties.isCluster)).toBe(true);
    expect(unclustered.find((f) => f.id === "w1")?.properties.name).toBe("Well 1");
  });

  it("respects maxFeatures limit", () => {
    const unclustered = clusterFeatures(sampleFeatures, 14, 12, 2);
    expect(unclustered).toHaveLength(2);
  });
});
