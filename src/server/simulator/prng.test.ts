import { describe, expect, it } from "vitest";
import { createPRNG, randomGaussian, hashString } from "./prng";

describe("PRNG", () => {
  it("mulberry32 generates deterministic output", () => {
    const rng1 = createPRNG(42);
    const rng2 = createPRNG(42);
    expect(rng1()).toBe(rng2());
    expect(rng1()).toBe(rng2());
  });

  it("different seeds generate different outputs", () => {
    const rng1 = createPRNG(42);
    const rng2 = createPRNG(43);
    expect(rng1()).not.toBe(rng2());
  });

  it("gaussian generates around mean", () => {
    const rng = createPRNG(12345);
    const mean = 10;
    const stdDev = 2;
    const samples = Array.from({ length: 1000 }, () => randomGaussian(rng, mean, stdDev));

    const sum = samples.reduce((a, b) => a + b, 0);
    const avg = sum / samples.length;

    expect(avg).toBeCloseTo(mean, 0); // Within tolerance
  });

  it("hashString is deterministic", () => {
    expect(hashString("node-1")).toBe(hashString("node-1"));
    expect(hashString("node-1")).not.toBe(hashString("node-2"));
  });
});
