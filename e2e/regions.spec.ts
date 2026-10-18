import { expect, test } from "@playwright/test";

test.describe("Official Regional Hierarchy & Aggregation", () => {
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

    await page.goto("/en/official/regions");
  });

  test("loads administrative hierarchy overview with breadcrumbs and KPI metrics", async ({
    page,
  }) => {
    await expect(page.getByRole("heading", { name: "Administrative Hierarchy" })).toBeVisible();
    await expect(page.getByRole("navigation", { name: "Administrative Hierarchy" })).toBeVisible();
    await expect(page.getByText("Total Wells")).toBeVisible();
    await expect(page.getByText("Nodes Online")).toBeVisible();
  });

  test("allows switching between table and choropleth view", async ({ page }) => {
    const choroplethBtn = page.getByRole("button", { name: "Choropleth" });
    await expect(choroplethBtn).toBeVisible();
    await choroplethBtn.click();

    await expect(page.getByRole("region", { name: "Choropleth" })).toBeVisible();

    const tableBtn = page.getByRole("button", { name: "Table" });
    await expect(tableBtn).toBeVisible();
    await tableBtn.click();

    await expect(page.getByRole("table")).toBeVisible();
  });

  test("has accessible CSV export action", async ({ page }) => {
    const exportBtn = page.getByRole("button", { name: "Export CSV" });
    await expect(exportBtn).toBeVisible();
  });
});
