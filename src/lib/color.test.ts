import { describe, expect, it } from "vitest";

import { contrastRatio, oklchToSrgb, parseOklch, relativeLuminance } from "./color";

describe("parseOklch", () => {
  it("parses L C H values", () => {
    expect(parseOklch("oklch(0.52 0.09 220)")).toEqual({ l: 0.52, c: 0.09, h: 220 });
  });

  it("returns null for non-oklch input", () => {
    expect(parseOklch("#ffffff")).toBeNull();
    expect(parseOklch("var(--color-primary)")).toBeNull();
  });
});

describe("oklch -> sRGB", () => {
  it("maps oklch white and black to sRGB white and black", () => {
    const white = oklchToSrgb({ l: 1, c: 0, h: 0 });
    expect(white.r).toBeCloseTo(1, 5);
    expect(white.g).toBeCloseTo(1, 5);
    expect(white.b).toBeCloseTo(1, 5);

    const black = oklchToSrgb({ l: 0, c: 0, h: 0 });
    expect(black.r).toBeCloseTo(0, 5);
    expect(black.g).toBeCloseTo(0, 5);
    expect(black.b).toBeCloseTo(0, 5);
  });

  it("keeps neutral greys neutral (r == g == b)", () => {
    const grey = oklchToSrgb({ l: 0.5, c: 0, h: 180 });
    expect(grey.r).toBeCloseTo(grey.g, 5);
    expect(grey.g).toBeCloseTo(grey.b, 5);
  });
});

describe("WCAG contrast", () => {
  it("black vs white is 21:1", () => {
    const ratio = contrastRatio({ r: 0, g: 0, b: 0 }, { r: 1, g: 1, b: 1 });
    expect(ratio).toBeCloseTo(21, 1);
  });

  it("is order independent", () => {
    const a = oklchToSrgb({ l: 0.52, c: 0.09, h: 220 });
    const b = oklchToSrgb({ l: 0.985, c: 0.005, h: 95 });
    expect(contrastRatio(a, b)).toBeCloseTo(contrastRatio(b, a), 10);
  });

  it("matches a known sRGB luminance reference", () => {
    // #FF0000 (gamma-encoded) must yield WCAG luminance 0.2126.
    expect(relativeLuminance({ r: 1, g: 0, b: 0 })).toBeCloseTo(0.2126, 4);
  });
});
