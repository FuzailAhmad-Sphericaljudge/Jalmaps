import { describe, expect, it } from "vitest";

import { settingsSchema } from "./settings";

describe("settingsSchema", () => {
  it("accepts supported profile and accessibility preferences", () => {
    expect(
      settingsSchema.safeParse({
        preferred_locale: "hi",
        preferred_unit: "ft",
        text_size: "extraLarge",
        theme: "system",
      }).success,
    ).toBe(true);
  });

  it("rejects unsupported preferences", () => {
    expect(
      settingsSchema.safeParse({
        preferred_locale: "ta",
        preferred_unit: "yards",
        text_size: "tiny",
        theme: "neon",
      }).success,
    ).toBe(false);
  });
});
