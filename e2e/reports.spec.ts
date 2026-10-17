import { expect, test } from "@playwright/test";

test.describe("Reports & Exports Centre", () => {
  test.beforeEach(async ({ page }) => {
    // Login as official with test credentials
    await page.goto("/en/login");
    await page.getByLabel("Phone number").fill("9000000003");

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

    await page.goto("/en/official/reports");
  });

  test("loads report centre header, privacy banner, and history table", async ({ page }) => {
    await expect(page.getByRole("heading", { name: "Reports & Exports" })).toBeVisible();
    await expect(
      page.getByText(
        "Privacy Protection: Aggregations with fewer than 3 wells mask individual well metrics.",
      ),
    ).toBeVisible();
    await expect(page.getByRole("button", { name: "Generate Report" })).toBeVisible();
    await expect(page.getByText("Report Generation History")).toBeVisible();
  });

  test("opens and cancels report generation modal", async ({ page }) => {
    const generateBtn = page.getByRole("button", { name: "Generate Report" });
    await expect(generateBtn).toBeVisible();
    await generateBtn.click();

    // Modal opens
    await expect(page.getByRole("dialog")).toBeVisible();
    await expect(page.getByText("Preview Summary")).toBeVisible();
    await expect(page.getByText("Confirm & Generate")).toBeVisible();

    // Cancel closes dialog
    await page.getByRole("button", { name: "Cancel" }).click();
    await expect(page.getByRole("dialog")).not.toBeVisible();
  });

  test("displays scheduled digests card with frequency and channel options", async ({ page }) => {
    await expect(page.getByText("Scheduled Digests")).toBeVisible();
    await expect(
      page.getByText("Automatically receive weekly groundwater summaries via Email or SMS."),
    ).toBeVisible();
    await expect(page.getByRole("button", { name: "Schedule Digest" })).toBeVisible();
  });
});
