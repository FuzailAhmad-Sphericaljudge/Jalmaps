import { describe, expect, it } from "vitest";

import { getFontClassName } from "./fonts";

describe("getFontClassName", () => {
  it("loads only the Latin font for English pages", () => {
    const className = getFontClassName("en");
    expect(className).toContain("--font-inter");
    expect(className).not.toContain("devanagari");
  });

  it("loads Devanagari plus Latin for Hindi pages", () => {
    const className = getFontClassName("hi");
    expect(className).toContain("--font-noto-devanagari");
    expect(className).toContain("--font-inter");
  });

  it("falls back to the Latin stack for unknown locales", () => {
    const className = getFontClassName("xx");
    expect(className).toContain("--font-inter");
    expect(className).not.toContain("devanagari");
  });
});
