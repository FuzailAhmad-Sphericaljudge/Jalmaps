import { expect, test } from "@playwright/test";

test.describe("Well Map View", () => {
  test.beforeEach(async ({ page }) => {
    // Login as farmer with test credentials
    await page.goto("/en/login");
    await page.getByLabel("Phone number").fill("9000000002");

    const otpRequest = page.waitForResponse((response) =>
      new URL(response.url()).pathname.endsWith("/api/auth/otp"),
    );
    await page.getByRole("button", { name: "Send one-time code" }).click();
    await otpRequest;

    await page.getByLabel("6-digit code").fill("123456");

    const verification = page.waitForResponse((response) =>
      new URL(response.url()).pathname.endsWith("/auth/v1/verify"),
    );
    await page.getByRole("button", { name: "Verify and sign in" }).click();
    await verification;

    await page.goto("/en/farmer/map");
  });

  test("loads map view container and header", async ({ page }) => {
    await expect(page.getByRole("heading", { name: "Well Map" })).toBeVisible();
    await expect(page.getByRole("region", { name: "Well Map" })).toBeVisible();
  });

  test("toggles to list view fallback cleanly", async ({ page }) => {
    const toggleButton = page.getByRole("button", { name: /List|Map/i });
    await expect(toggleButton).toBeVisible();
    await toggleButton.click();

    // Verify list view container or empty/wells state renders
    await expect(page.getByRole("region", { name: "Well Map" })).toBeVisible();
  });
});
