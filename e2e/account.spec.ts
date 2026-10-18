import { readFile } from "node:fs/promises";

import { expect, test, type Page } from "@playwright/test";

async function signIn(page: Page, phoneNumber: string, expectedUserId: string) {
  await page.goto("/en/login");
  await page.getByLabel("Phone number").fill(phoneNumber);
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
  expect(result.user.id).toBe(expectedUserId);
  await expect(page).toHaveURL(/\/en(?:\/onboarding|\/farmer)?\/?$/);
}

test("account export, profile update, sign-out, and deletion", async ({ page }) => {
  await signIn(page, "9000000002", "e5dd51f5-924c-1963-61b3-5c5ba4a4a3f6");
  await page.goto("/en/account");
  await expect(page.getByRole("heading", { name: "Your account" })).toBeVisible();

  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("link", { name: "Download my data" }).click();
  const download = await downloadPromise;
  const downloadPath = await download.path();
  if (!downloadPath) throw new Error("The account export did not produce a file.");
  const exported = JSON.parse(await readFile(downloadPath, "utf8")) as {
    profile: { id: string };
    wells: Array<{ owner_id: string }>;
  };
  expect(exported.profile.id).toBe("e5dd51f5-924c-1963-61b3-5c5ba4a4a3f6");
  expect(exported.wells.length).toBeGreaterThan(0);
  expect(exported.wells.every((well) => well.owner_id === exported.profile.id)).toBe(true);
  expect(JSON.stringify(exported)).not.toContain("key_hash");

  await page.getByRole("link", { name: "Edit profile" }).click();
  await page.getByLabel("Full name").fill("Updated Test Farmer");
  await page.getByRole("button", { name: "Save changes" }).click();
  await expect(page.getByText("Your profile was updated.")).toBeVisible();
  await page.getByRole("link", { name: "Your account" }).click();
  await page.getByRole("button", { name: "Sign out" }).click();
  await expect(page).toHaveURL(/\/en\/login$/);

  await signIn(page, "9000000001", "76dc318e-3787-1a4e-47df-1b08873c73aa");
  await page.goto("/en/account");
  await page.getByRole("button", { name: "Delete my account" }).click();
  await page.getByRole("dialog").getByRole("button", { name: "Delete my account" }).click();
  await expect(page).toHaveURL(/\/en\/login$/);

  const exportAfterDeletion = await page.request.get("/api/account/export");
  expect(exportAfterDeletion.status()).toBe(401);
});
