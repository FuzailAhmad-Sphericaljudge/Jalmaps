import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

test("phone OTP sign-in completes onboarding accessibly", async ({ page }) => {
  await page.goto("/en/login");

  const loginA11y = await new AxeBuilder({ page }).analyze();
  expect(loginA11y.violations).toEqual([]);

  await page.getByLabel("Phone number").fill("9000000007");
  const otpRequest = page.waitForResponse((response) =>
    new URL(response.url()).pathname.endsWith("/api/auth/otp"),
  );
  await page.getByRole("button", { name: "Send one-time code" }).click();
  const otpResponse = await otpRequest;
  expect(otpResponse.status(), await otpResponse.text()).toBe(202);
  await expect(
    page.getByText("If this number can receive sign-in codes, one is on the way."),
  ).toBeVisible();

  await page.getByLabel("6-digit code").fill("123456");
  const verification = page.waitForResponse((response) =>
    new URL(response.url()).pathname.endsWith("/auth/v1/verify"),
  );
  await page.getByRole("button", { name: "Verify and sign in" }).click();
  const result = await (await verification).json();
  expect(result.user.id).toBe("78881ea9-cfc6-5279-4a8a-099955a6634a");
  await expect(page).toHaveURL(/\/en\/onboarding$/);

  const onboardingA11y = await new AxeBuilder({ page }).analyze();
  expect(onboardingA11y.violations).toEqual([]);

  await page.getByRole("button", { name: "Next", exact: true }).click();
  await page.getByRole("button", { name: "Next", exact: true }).click();
  const areaSelect = page.locator("main#main select");
  await areaSelect.selectOption({ index: 1 });
  await page.getByRole("button", { name: "Next", exact: true }).click();
  await areaSelect.selectOption({ index: 1 });
  await page.getByRole("button", { name: "Next", exact: true }).click();
  await areaSelect.selectOption({ index: 1 });
  await page.getByRole("button", { name: "Next", exact: true }).click();
  await areaSelect.selectOption({ index: 1 });
  await page.getByRole("button", { name: "Next", exact: true }).click();

  await page.getByLabel("Rice").check();
  await page.getByRole("button", { name: "Finish setup" }).click();
  await expect(page).toHaveURL(/\/en\/farmer$/);
});
