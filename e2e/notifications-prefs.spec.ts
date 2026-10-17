import { test, expect } from "@playwright/test";

test.describe("Notification Preferences UI", () => {
  test("should allow toggling daily digest", async ({ page }) => {
    // Navigate to settings (assumes mock auth works)
    await page.goto("/en/app/settings");

    const digestSwitch = page.locator("button[role='switch']", { hasText: /daily/i }).first();

    // Check initial state
    await expect(digestSwitch).toBeVisible();

    // Toggle
    await digestSwitch.click();

    // Click save
    await page.getByRole("button", { name: /save/i }).click();

    // Optional: Check success toast if implemented
  });
});
