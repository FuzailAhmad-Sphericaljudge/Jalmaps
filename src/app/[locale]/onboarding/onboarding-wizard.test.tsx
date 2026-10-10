import { render, screen } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { describe, expect, it, vi } from "vitest";

import type { Database } from "@/lib/db/types";
import { expectNoAxeViolations } from "@/test/a11y";

import onboardingMessages from "../../../i18n/messages/en/onboarding.json";

vi.mock("./actions", () => ({
  completeOnboarding: vi.fn(),
}));

import { OnboardingWizard } from "./onboarding-wizard";

type AreaOption = Pick<
  Database["public"]["Tables"]["admin_areas"]["Row"],
  "id" | "parent_id" | "level" | "names"
>;

const states: AreaOption[] = [
  {
    id: "52f3560c-2a48-465e-96e0-5129a9028220",
    parent_id: null,
    level: "state",
    names: { en: "Andhra Pradesh", hi: "आंध्र प्रदेश" },
  },
];

function renderWizard() {
  return render(
    <NextIntlClientProvider
      locale="en"
      messages={{ onboarding: onboardingMessages }}
      timeZone="Asia/Kolkata"
    >
      <OnboardingWizard locale="en" states={states} initialLocale="en" />
    </NextIntlClientProvider>,
  );
}

describe("OnboardingWizard", () => {
  it("shows one question and clear progress at a time", () => {
    renderWizard();

    expect(screen.getByRole("group", { name: "Which language do you prefer?" })).toBeVisible();
    expect(screen.getByLabelText("Step 1 of 7")).toBeInTheDocument();
    expect(
      screen.queryByRole("group", { name: "Which unit should we use for water depth?" }),
    ).not.toBeInTheDocument();
  });

  it("provides an accessible first onboarding step", async () => {
    const rendered = renderWizard();
    await expectNoAxeViolations(rendered);
  });
});
