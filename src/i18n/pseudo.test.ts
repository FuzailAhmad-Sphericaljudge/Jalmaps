import { describe, expect, it } from "vitest";

import { pseudoIcuMessage, pseudoMessages, pseudoText } from "./pseudo";

describe("pseudoText", () => {
  it("brackets and pads text so clipping becomes visible", () => {
    const out = pseudoText("Save well");
    expect(out.startsWith("[")).toBe(true);
    expect(out.endsWith("!!!]")).toBe(true);
  });

  it("expands text by roughly 40%", () => {
    const out = pseudoText("Save well");
    // [ + accented + !!! + ] = 8 extra chars on a 9-char string.
    expect(out.length).toBeGreaterThanOrEqual(9);
    expect(out.length).toBeLessThanOrEqual(20);
  });

  it("keeps digits legible", () => {
    expect(pseudoText("Well 42")).toContain("42");
  });

  it("accents ASCII vowels", () => {
    const out = pseudoText("water level");
    expect(out).not.toContain("water");
    expect(out.toLowerCase()).toContain("á");
  });
});

describe("pseudoIcuMessage", () => {
  it("leaves plain messages fully pseudo-fied", () => {
    expect(pseudoIcuMessage("Hello")).toMatch(/^\[.+!!!\]$/);
  });

  it("keeps ICU arguments intact", () => {
    const out = pseudoIcuMessage("Current: {language}");
    expect(out).toContain("{language}");
    expect(out).not.toContain("Current: {language}".slice(0, 8) + "!!!");
  });

  it("keeps plural machinery while pseudo-fying option text", () => {
    const out = pseudoIcuMessage("{count, plural, =0 {No wells} other {# wells reporting}}");
    expect(out).toContain("{count, plural,");
    expect(out).toContain("=0 {");
    expect(out).toContain("#");
    expect(out).toContain("!!!");
  });

  it("expands literal text by about 40% overall", () => {
    const original = "Groundwater monitoring for India's wells";
    const out = pseudoIcuMessage(original);
    expect(out.length).toBeGreaterThan(original.length);
    const growth = (out.length - original.length) / original.length;
    expect(growth).toBeGreaterThan(0.3);
    expect(growth).toBeLessThan(0.8);
  });
});

describe("pseudoMessages", () => {
  it("transforms nested message trees", () => {
    const tree = {
      common: {
        appName: "JalMaps",
        nested: { greeting: "Hello {name}" },
      },
    };
    const out = pseudoMessages(tree);
    const common = (out as { common: { appName: string; nested: { greeting: string } } }).common;
    expect(common.appName).toMatch(/^\[.+!!!\]$/);
    expect(common.nested.greeting).toContain("{name}");
  });

  it("passes non-string leaves through", () => {
    expect(pseudoMessages(42)).toBe(42);
    expect(pseudoMessages(null)).toBe(null);
  });
});
