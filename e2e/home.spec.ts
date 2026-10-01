import { expect, test } from "@playwright/test";

test.describe("home page smoke", () => {
  test("redirects / to the default locale and shows the English heading", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveURL(/\/en$/);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("JalMaps");
    // ICU plural renders Latin digits in en-IN (see lib/format tests).
    await expect(page.getByTestId("wells-count")).toHaveText("2 wells reporting");
  });

  test("renders the Hindi locale with the correct document language", async ({ page }) => {
    await page.goto("/hi");
    await expect(page.locator("html")).toHaveAttribute("lang", "hi");
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("जलमैप्स");
    await expect(page.getByTestId("wells-count")).toHaveText("2 कुएँ जुड़े हैं");
  });
});
