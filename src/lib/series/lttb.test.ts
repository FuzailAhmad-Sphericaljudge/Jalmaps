import { describe, expect, it } from "vitest";

import { downsampleWithGaps, type DataPoint } from "./lttb";

describe("downsampleWithGaps", () => {
  it("returns original data if under threshold", () => {
    const data: DataPoint[] = [
      { x: 1, y: 10 },
      { x: 2, y: 20 },
      { x: 3, y: 30 },
    ];
    const result = downsampleWithGaps(data, 10, 100);
    expect(result).toEqual(data);
  });

  it("downsamples data cleanly without gaps", () => {
    const data: DataPoint[] = Array.from({ length: 100 }).map((_, i) => ({
      x: i,
      y: Math.sin(i),
    }));
    const result = downsampleWithGaps(data, 10, 10);
    expect(result.length).toBe(10);
    expect(result[0]!.x).toBe(0); // first
    expect(result[9]!.x).toBe(99); // last
  });

  it("detects gaps and inserts nulls", () => {
    const data: DataPoint[] = [
      { x: 1, y: 10 },
      { x: 2, y: 20 },
      // gap of 5
      { x: 7, y: 30 },
      { x: 8, y: 40 },
    ];

    // threshold 2 means segment 1 gets 2 points, segment 2 gets 2 points -> 4 total + 1 gap
    const result = downsampleWithGaps(data, 4, 3);

    expect(result.length).toBe(5);
    expect(result[0]).toEqual({ x: 1, y: 10 });
    expect(result[1]).toEqual({ x: 2, y: 20 });
    // gap inserted
    expect(result[2]!.y).toBe(null);
    expect(result[3]).toEqual({ x: 7, y: 30 });
    expect(result[4]).toEqual({ x: 8, y: 40 });
  });

  it("handles explicit nulls in data", () => {
    const data: DataPoint[] = [
      { x: 1, y: 10 },
      { x: 2, y: null },
      { x: 3, y: 30 },
    ];

    const result = downsampleWithGaps(data, 5, 100);
    expect(result.length).toBe(3);
    expect(result[1]!.y).toBe(null);
  });
});
