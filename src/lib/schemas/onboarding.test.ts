import { describe, expect, it } from "vitest";

import { onboardingSchema } from "./onboarding";

describe("onboardingSchema", () => {
  it("accepts seeded database UUIDs and a valid onboarding payload", () => {
    expect(
      onboardingSchema.safeParse({
        locale: "en",
        preferred_locale: "hi",
        preferred_unit: "ft",
        state_id: "4b0d9dcb-7ed5-6f66-9466-9704256b5455",
        district_id: "4abf5b1e-dad9-8385-19eb-15a7dd041daf",
        block_id: "2d4fbe40-d19c-97a2-4343-dfedb5fa7e9d",
        village_id: "2d4fbe40-d19c-97a2-4343-dfedb5fa7e9d",
        crops: ["rice"],
      }).success,
    ).toBe(true);
  });

  it("rejects unsupported preferences and empty crop lists", () => {
    expect(
      onboardingSchema.safeParse({
        locale: "en",
        preferred_locale: "te",
        preferred_unit: "yards",
        state_id: "not-an-id",
        district_id: "not-an-id",
        block_id: "not-an-id",
        village_id: "not-an-id",
        crops: [],
      }).success,
    ).toBe(false);
  });
});
