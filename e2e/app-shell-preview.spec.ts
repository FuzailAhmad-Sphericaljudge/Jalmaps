import { mkdir } from "node:fs/promises";
import { resolve } from "node:path";

import { expect, test, type Page } from "@playwright/test";

test.skip(
  process.env.JALMAPS_CAPTURE_PREVIEWS !== "1",
  "Set JALMAPS_CAPTURE_PREVIEWS=1 to regenerate the committed design preview set.",
);

async function signInAsAdmin(page: Page) {
  await page.goto("/en/login");
  await page.getByLabel("Phone number").fill("9000000006");
  const otpRequest = page.waitForResponse((response) =>
    new URL(response.url()).pathname.endsWith("/api/auth/otp"),
  );
  await page.getByRole("button", { name: "Send one-time code" }).click();
  expect((await otpRequest).status()).toBe(202);
  await page.getByLabel("6-digit code").fill("123456");
  const verification = page.waitForResponse((response) =>
    new URL(response.url()).pathname.endsWith("/auth/v1/verify"),
  );
  await page.getByRole("button", { name: "Verify and sign in" }).click();
  expect((await (await verification).json()).user.id).toBe("dd6a693c-d7e2-3e51-b8b9-48047e974ee9");
}

test("captures localized shell previews for mobile/desktop and light/dark", async ({ page }) => {
  await signInAsAdmin(page);
  const directory = resolve(process.cwd(), "docs", "phases", "screenshots");
  await mkdir(directory, { recursive: true });

  for (const locale of ["en", "hi"] as const) {
    const settingsPath = `/${locale}/app/settings`;
    const appearanceLabel = locale === "en" ? "Appearance" : "रूप";
    const saveLabel = locale === "en" ? "Save settings" : "सेटिंग सहेजें";
    const languageLabel = locale === "en" ? "Language" : "भाषा";
    for (const theme of ["light", "dark"] as const) {
      await page.goto(settingsPath);
      await page.getByLabel(languageLabel, { exact: true }).selectOption(locale);
      await page.getByLabel(appearanceLabel).selectOption(theme);
      await page.getByRole("button", { name: saveLabel }).click();
      await expect(
        page.getByText(locale === "en" ? "Your settings were saved." : "आपकी सेटिंग सहेज दी गई।"),
      ).toBeVisible();

      await page.goto(`/${locale}/admin`);
      for (const viewport of [
        { name: "mobile", width: 375, height: 812 },
        { name: "desktop", width: 1280, height: 900 },
      ]) {
        await page.setViewportSize({ width: viewport.width, height: viewport.height });
        const previewPath = resolve(
          directory,
          `06-app-shell-${locale}-${theme}-${viewport.name}.png`,
        );
        await page.screenshot({
          path: previewPath,
          fullPage: true,
          animations: "disabled",
          style: "nextjs-portal { display: none; }",
        });
      }
    }
  }
});
