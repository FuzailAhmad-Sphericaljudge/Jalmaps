import { expect, test } from "@playwright/test";

const roleUsers = [
  {
    phone: "9000000002",
    id: "e5dd51f5-924c-1963-61b3-5c5ba4a4a3f6",
    role: "farmer",
  },
  {
    phone: "9000000003",
    id: "fa781bf3-6efb-b897-baa1-f18ff830f394",
    role: "village_admin",
  },
  {
    phone: "9000000004",
    id: "f38dfbf8-aa61-b33c-6e4f-3c89b84c5b8b",
    role: "official",
  },
  {
    phone: "9000000005",
    id: "864b9662-f43a-90b7-4ee7-fe2303941b0b",
    role: "insurer",
  },
  {
    phone: "9000000006",
    id: "dd6a693c-d7e2-3e51-b8b9-48047e974ee9",
    role: "admin",
  },
];

test("every seeded role can sign in with its database-backed role", async ({ page }) => {
  for (const fixture of roleUsers) {
    await page.goto("/en/login");
    await page.getByLabel("Phone number").fill(fixture.phone);

    const otpRequest = page.waitForResponse((response) =>
      new URL(response.url()).pathname.endsWith("/api/auth/otp"),
    );
    await page.getByRole("button", { name: "Send one-time code" }).click();
    const otpResponse = await otpRequest;
    expect(otpResponse.status(), await otpResponse.text()).toBe(202);

    await page.getByLabel("6-digit code").fill("123456");
    const verification = page.waitForResponse((response) =>
      new URL(response.url()).pathname.endsWith("/auth/v1/verify"),
    );
    await page.getByRole("button", { name: "Verify and sign in" }).click();
    const result = await (await verification).json();
    expect(result.user.id).toBe(fixture.id);

    await page.goto("/en/account");
    await expect(page.getByRole("heading", { name: "Your account" })).toBeVisible();
    const exportedResponse = await page.request.get("/api/account/export");
    expect(exportedResponse.status()).toBe(200);
    const exported = (await exportedResponse.json()) as {
      profile: { id: string; role: string };
    };
    expect(exported.profile).toMatchObject({ id: fixture.id, role: fixture.role });

    await page.getByRole("button", { name: "Sign out" }).click();
    await expect(page).toHaveURL(/\/en\/login$/);
  }
});
