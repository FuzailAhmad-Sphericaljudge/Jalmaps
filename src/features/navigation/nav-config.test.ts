import { describe, expect, it } from "vitest";

import { getNavItems } from "./nav-config";

describe("getNavItems", () => {
  it("keeps farmer primary navigation to five entries", () => {
    const items = getNavItems("farmer");

    expect(items.map((item) => item.id)).toEqual([
      "farmer-home",
      "farmer-wells",
      "farmer-readings",
      "farmer-alerts",
      "farmer-reports",
      "settings",
    ]);
    expect(items.filter((item) => item.order < 90)).toHaveLength(5);
  });

  it("does not expose another role's routes", () => {
    expect(getNavItems("insurer").map((item) => item.href)).toEqual([
      "/insurer",
      "/insurer/reports",
      "/insurer/wells",
      "/app/settings",
    ]);
    expect(getNavItems("village_admin").some((item) => item.href.startsWith("/admin"))).toBe(false);
  });

  it("sorts every role's destinations deterministically", () => {
    for (const role of ["farmer", "village_admin", "official", "insurer", "admin"] as const) {
      const items = getNavItems(role);
      expect(items.map((item) => item.order)).toEqual(
        [...items.map((item) => item.order)].sort((a, b) => a - b),
      );
    }
  });
});
