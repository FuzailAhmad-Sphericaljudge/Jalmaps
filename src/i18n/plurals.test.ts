import { describe, expect, it } from "vitest";

describe("Plural rules support for Indian languages", () => {
  it("supports 'one' and 'other' for most Indic locales", () => {
    const testLocales = ["hi", "mr", "gu", "bn", "ta", "te", "kn", "ml", "or", "pa"];

    testLocales.forEach((locale) => {
      const pr = new Intl.PluralRules(locale);
      expect(pr.select(1)).toBe("one");
      expect(pr.select(2)).toBe("other");
      expect(["one", "other"]).toContain(pr.select(0));
      expect(pr.select(1.5)).toBe("other");
    });
  });

  it("formats appropriately", () => {
    // English
    expect(new Intl.PluralRules("en").select(1)).toBe("one");
    expect(new Intl.PluralRules("en").select(2)).toBe("other");
  });
});
