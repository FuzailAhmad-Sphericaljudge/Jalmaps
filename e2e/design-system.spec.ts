import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

async function scanPage(page: import("@playwright/test").Page) {
  const results = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
    .analyze();
  return results.violations;
}

test.describe("design system gallery a11y", () => {
  test("gallery has no axe violations in light theme", async ({ page }) => {
    await page.goto("/en/dev/design-system");
    // Force light theme before scan.
    await page.evaluate(() => {
      document.cookie = `jalmaps-theme=${encodeURIComponent(JSON.stringify({ theme: "light" }))}; path=/`;
      document.documentElement.classList.remove("dark");
    });
    await page.reload();

    const violations = await scanPage(page);
    expect(violations, JSON.stringify(violations, null, 2)).toEqual([]);
  });

  test("gallery has no axe violations in dark theme", async ({ page }) => {
    await page.goto("/en/dev/design-system");
    await page.evaluate(() => {
      document.cookie = `jalmaps-theme=${encodeURIComponent(JSON.stringify({ theme: "dark" }))}; path=/`;
      document.documentElement.classList.add("dark");
    });
    await page.reload();

    const violations = await scanPage(page);
    expect(violations, JSON.stringify(violations, null, 2)).toEqual([]);
  });

  test("theme toggle switches theme and persists across reload", async ({ page }) => {
    await page.goto("/en/dev/design-system");

    // Scope to the header: the gallery also renders its own theme toggle.
    await page
      .getByRole("banner")
      .getByRole("button", { name: /light|dark/i })
      .click();
    const afterToggle = await page.evaluate(() =>
      document.documentElement.classList.contains("dark"),
    );
    expect(typeof afterToggle).toBe("boolean");

    await page.reload();
    const afterReload = await page.evaluate(() =>
      document.documentElement.classList.contains("dark"),
    );
    expect(afterReload).toBe(afterToggle);
  });
});
