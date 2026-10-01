import { expect, test } from "@playwright/test";

test.describe("i18n routing and locale switching", () => {
  test("unknown locales fall back to the English home page", async ({ page }) => {
    // The proxy rewrites /fr into the locale segment, the layout rejects the
    // unknown locale via notFound(), and the localized 404 redirects to /en.
    await page.goto("/fr");
    await expect(page).toHaveURL(/\/en$/);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("JalMaps");
  });

  test("switching language from home keeps the user on the same route", async ({ page }) => {
    await page.goto("/en");

    const switcher = page.getByRole("combobox", { name: /language/i });
    await switcher.selectOption({ label: "हिन्दी" });

    await expect(page).toHaveURL(/\/hi$/);
    await expect(page.locator("html")).toHaveAttribute("lang", "hi");
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("जलमैप्स");
  });

  test("switching language from a nested route preserves the pathname", async ({ page }) => {
    await page.goto("/en/dev/design-system");

    const switcher = page.getByRole("combobox", { name: /language/i });
    await switcher.selectOption({ label: "हिन्दी" });

    await expect(page).toHaveURL(/\/hi\/dev\/design-system$/);
    await expect(page.locator("html")).toHaveAttribute("lang", "hi");
    // The gallery header is translated — confirms messages switched too.
    await expect(page.getByRole("heading", { level: 1 })).not.toHaveText(/design system/i);
  });

  test("NEXT_LOCALE cookie drives the unprefixed redirect target", async ({ page }) => {
    // next-intl persists a locale choice in the NEXT_LOCALE cookie; a later
    // visit to / must honour it instead of the default locale.
    await page
      .context()
      .addCookies([{ name: "NEXT_LOCALE", value: "hi", url: "http://localhost:3000" }]);

    await page.goto("/");
    await expect(page).toHaveURL(/\/hi$/);
    await expect(page.locator("html")).toHaveAttribute("lang", "hi");
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("जलमैप्स");
  });

  test("pseudo-localisation expands text for layout testing", async ({ page }) => {
    await page.goto("/en?pseudo=1");

    // Pseudo mode wraps all copy in […!!!] brackets — nothing should be left
    // as plain English source text, and strings grow ~40%.
    const heading = page.getByRole("heading", { level: 1 });
    await expect(heading).toContainText("[");
    await expect(heading).toContainText("!!!]");

    // Layout smoke check: pseudo-expanded copy must not break page overflow.
    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);
    expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 1);

    // pseudo=0 clears the cookie — normal English is restored.
    await page.goto("/en?pseudo=0");
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("JalMaps");
  });
});
