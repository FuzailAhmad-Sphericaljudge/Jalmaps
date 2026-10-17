import { expect, test } from "@playwright/test";

test.describe("Farmer Dashboard", () => {
  test.beforeEach(async ({ page }) => {
    // Login as farmer
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

    await page.goto("/en/app/farmer");
  });

  test("loads dashboard and displays title", async ({ page }) => {
    await expect(page.getByRole("heading", { name: "Dashboard" })).toBeVisible();
  });

  test("displays well cards and trend data", async ({ page }) => {
    // Wait for the snapshot cards to render
    const cards = page.locator(".snap-center");
    await expect(cards).not.toHaveCount(0);
  });
});
