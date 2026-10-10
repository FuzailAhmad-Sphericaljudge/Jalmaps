import { render, screen } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { describe, expect, it, vi } from "vitest";

import { expectNoAxeViolations } from "@/test/a11y";

import authMessages from "../../../../i18n/messages/en/auth.json";

const mocks = vi.hoisted(() => ({
  replace: vi.fn(),
  signInWithOAuth: vi.fn(),
  verifyOtp: vi.fn(),
}));

vi.mock("@/i18n/navigation", () => ({
  useRouter: () => ({ replace: mocks.replace }),
}));
vi.mock("@/lib/db/public-env", () => ({
  getPublicEnv: () => ({
    NEXT_PUBLIC_SITE_URL: "http://127.0.0.1:3000",
    NEXT_PUBLIC_GOOGLE_OAUTH_ENABLED: false,
    NEXT_PUBLIC_SUPABASE_URL: "http://127.0.0.1:54321",
    NEXT_PUBLIC_SUPABASE_ANON_KEY: "test-anon-key",
  }),
}));
vi.mock("@/lib/db/client", () => ({
  createBrowserSupabaseClient: () => ({
    auth: {
      signInWithOAuth: mocks.signInWithOAuth,
      verifyOtp: mocks.verifyOtp,
    },
  }),
}));

import { LoginForm } from "./login-form";

function renderLoginForm() {
  return render(
    <NextIntlClientProvider locale="en" messages={{ auth: authMessages }} timeZone="Asia/Kolkata">
      <LoginForm locale="en" />
    </NextIntlClientProvider>,
  );
}

describe("LoginForm", () => {
  it("starts with the phone method, +91 prefix, and a large touch target", () => {
    renderLoginForm();

    expect(screen.getByRole("button", { name: "Phone" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByLabelText("Phone number")).toBeInTheDocument();
    expect(screen.getByText("+91")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Send one-time code/ })).toHaveClass("h-12");
  });

  it("provides an accessible login form", async () => {
    const rendered = renderLoginForm();
    await expectNoAxeViolations(rendered);
  });
});
