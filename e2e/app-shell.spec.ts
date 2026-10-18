import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";

async function signIn(page: Page, phone: string, userId: string) {
  await page.goto("/en/login");
  await page.getByLabel("Phone number").fill(phone);
  const otpRequest = page.waitForResponse((response) =>
    new URL(response.url()).pathname.endsWith("/api/auth/otp"),
  );
  await page.getByRole("button", { name: "Send one-time code" }).click();
  const response = await otpRequest;
  expect(response.status(), await response.text()).toBe(202);
  await page.getByLabel("6-digit code").fill("123456");
  const verification = page.waitForResponse((result) =>
    new URL(result.url()).pathname.endsWith("/auth/v1/verify"),
  );
  await page.getByRole("button", { name: "Verify and sign in" }).click();
  const result = await (await verification).json();
  expect(result.user.id).toBe(userId);
}

test("mobile farmer navigation and connectivity are accessible", async ({ page, context }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await signIn(page, "9000000002", "e5dd51f5-924c-1963-61b3-5c5ba4a4a3f6");
  await page.goto("/en/farmer");

  const mobileNavigation = page.getByTestId("mobile-navigation");
  await expect(mobileNavigation.getByRole("link")).toHaveCount(5);
  await expect(mobileNavigation.getByRole("link", { name: /Overview/ })).toHaveAttribute(
    "aria-current",
    "page",
  );
  const initialA11y = await new AxeBuilder({ page }).analyze();
  expect(initialA11y.violations).toEqual([]);

  await context.setOffline(true);
  await expect(page.getByRole("status").filter({ hasText: "You are offline" })).toBeVisible();
  await context.setOffline(false);
  await expect(page.getByRole("status").filter({ hasText: "Online" })).toBeVisible();
});

test("desktop shell persists sidebar and settings, opens command palette, and localizes", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await signIn(page, "9000000006", "dd6a693c-d7e2-3e51-b8b9-48047e974ee9");
  await page.goto("/en/admin");

  await page.getByRole("button", { name: "Collapse sidebar" }).click();
  await expect(page.getByRole("link", { name: "Administration" })).toHaveAttribute(
    "title",
    "Administration",
  );
  await expect(page.getByRole("button", { name: "Expand sidebar" })).toBeVisible();
  await expect(page.context().cookies()).resolves.toEqual(
    expect.arrayContaining([
      expect.objectContaining({ name: "jalmaps-sidebar", value: "collapsed" }),
    ]),
  );

  await page.keyboard.press("Control+k");
  const palette = page.getByRole("dialog");
  await expect(palette).toBeVisible();
  await palette.getByRole("textbox", { name: "Search pages" }).fill("Settings");
  await palette.getByRole("button", { name: "Settings" }).click();
  await expect(page).toHaveURL(/\/en\/app\/settings$/);

  await page.getByLabel("Measurement units").selectOption("ft");
  await page.getByLabel("Text size").selectOption("large");
  await page.getByLabel("Appearance").selectOption("dark");
  await page.getByLabel("Language", { exact: true }).selectOption("en");
  await page.getByRole("button", { name: "Save settings" }).click();
  await expect(page.getByText("Your settings were saved.")).toBeVisible();
  await expect(page.locator("html")).toHaveAttribute("data-text-size", "large");
  await expect(page.locator("html")).toHaveClass(/dark/);

  const darkA11y = await new AxeBuilder({ page }).analyze();
  expect(darkA11y.violations).toEqual([]);

  await page.reload();
  await expect(page.getByRole("button", { name: "Expand sidebar" })).toBeVisible();
  await expect(
    page.getByTestId("desktop-navigation").getByRole("link", { name: "Administration" }),
  ).toHaveAttribute("title", "Administration");
  await expect(page.getByLabel("Measurement units")).toHaveValue("ft");
  await expect(page.getByLabel("Text size")).toHaveValue("large");
  await expect(page.getByLabel("Appearance")).toHaveValue("dark");
  await page.getByLabel("Language", { exact: true }).selectOption("hi");
  await page.getByRole("button", { name: "Save settings" }).click();
  await expect(page).toHaveURL(/\/hi\/admin$/);
  await expect(
    page.getByTestId("desktop-navigation").getByRole("link", { name: "प्रशासन" }),
  ).toBeVisible();
});

test("wrong-role destinations render the localized forbidden page", async ({ page }) => {
  await signIn(page, "9000000005", "864b9662-f43a-90b7-4ee7-fe2303941b0b");
  await page.goto("/en/admin");
  await expect(page).toHaveURL(/\/en\/403$/);
  await expect(
    page.getByRole("heading", { name: "You do not have access to this page" }),
  ).toBeVisible();
});
