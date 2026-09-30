import { expect, test } from "@playwright/test";

test.describe("home page smoke", () => {
  test("loads the home page and shows the JalMaps heading", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("JalMaps");
  });
});
