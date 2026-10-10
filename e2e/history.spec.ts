import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import fs from "fs";

test.describe("Farmer History View", () => {
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
    // Click on the first well's History button (assuming it exists on dashboard)
    // Actually just navigate directly to a seeded well since we know it exists.
    // The seeder creates a well for farmer. We can get it from the UI.
    const historyLink = page.getByRole("link", { name: "View history" }).first();
    await expect(historyLink).toBeVisible();
    await historyLink.click();
  });

  test("should have no automatically detectable accessibility violations", async ({ page }) => {
    // We wait for the chart to load
    await expect(page.locator(".recharts-wrapper")).toBeVisible();

    const accessibilityScanResults = await new AxeBuilder({ page }).analyze();
    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test("switch ranges", async ({ page }) => {
    await expect(page.locator(".recharts-wrapper")).toBeVisible();

    await page.getByRole("button", { name: "30D" }).click();
    // Verify it switched (we can't easily verify SVG, but we can verify active class)
    await expect(page.getByRole("button", { name: "30D" })).toHaveClass(/bg-primary/);
  });

  test("compare wells", async ({ page }) => {
    // Wait for CompareSelector to be visible
    const compareButtons = page.locator("button", { hasText: "Well" });
    if ((await compareButtons.count()) > 0) {
      await compareButtons.first().click();
      // Should now render a second line
      const lines = page.locator(".recharts-line");
      await expect(lines).toHaveCount(2);
    }
  });

  test("accessibility table toggle", async ({ page }) => {
    await expect(page.locator(".recharts-wrapper")).toBeVisible();

    await page.getByRole("button", { name: "View Table" }).click();

    // The table should be visible
    await expect(page.getByRole("table")).toBeVisible();
    // And chart gone
    await expect(page.locator(".recharts-wrapper")).toBeHidden();
  });

  test("CSV export", async ({ page }) => {
    // Wait for it
    await expect(page.locator(".recharts-wrapper")).toBeVisible();

    const downloadPromise = page.waitForEvent("download");
    await page.getByRole("button", { name: "Export CSV" }).click();
    const download = await downloadPromise;

    expect(download.suggestedFilename()).toMatch(/history_.*\.csv/);

    // Wait for the download to complete
    const downloadPath = await download.path();
    expect(downloadPath).toBeTruthy();

    // Parse it and verify BOM and headers
    if (downloadPath) {
      const content = fs.readFileSync(downloadPath, "utf-8");
      // Check for UTF-8 BOM
      expect(content.charCodeAt(0)).toBe(0xfeff);
      expect(content).toContain("Date,Average Depth,Min Depth,Max Depth,Reading Count");
    }
  });
});
