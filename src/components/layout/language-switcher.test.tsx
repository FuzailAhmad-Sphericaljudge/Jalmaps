import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { NextIntlClientProvider } from "next-intl";

import { LanguageSwitcher } from "./language-switcher";

// The component navigates through our locale-aware wrappers; mock them to
// capture the switch call (real route plumbing is covered by the Playwright
// i18n spec).
const replaceMock = vi.fn();
const pathnameMock = vi.fn(() => "/dev/design-system");

vi.mock("@/i18n/navigation", () => ({
  useRouter: () => ({ replace: replaceMock }),
  usePathname: () => pathnameMock(),
}));

function renderWithProviders(locale: string, messages: Record<string, unknown>) {
  return render(
    <NextIntlClientProvider locale={locale} messages={messages} timeZone="Asia/Kolkata">
      <LanguageSwitcher />
    </NextIntlClientProvider>,
  );
}

const enMessages = {
  common: {
    languageSwitcher: {
      label: "Change language",
      current: "Current language: {language}",
    },
  },
};

const hiMessages = {
  common: {
    languageSwitcher: {
      label: "भाषा बदलें",
      current: "वर्तमान भाषा: {language}",
    },
  },
};

describe("LanguageSwitcher", () => {
  it("lists every supported locale with native names in the en locale", () => {
    renderWithProviders("en", enMessages);
    const select = screen.getByRole("combobox", { name: "Change language" });
    expect(select).toHaveValue("en");
    const options = select.querySelectorAll("option");
    expect(options).toHaveLength(2);
    expect(options[0]).toHaveTextContent("English");
    expect(options[1]).toHaveTextContent("हिन्दी");
  });

  it("renders with a Hindi aria-label in the hi locale", () => {
    renderWithProviders("hi", hiMessages);
    expect(screen.getByRole("combobox", { name: "भाषा बदलें" })).toHaveValue("hi");
  });

  it("switches locale on the same path via the locale-aware router", async () => {
    const user = userEvent.setup();
    renderWithProviders("en", enMessages);

    pathnameMock.mockReturnValue("/dev/design-system");
    await user.selectOptions(screen.getByRole("combobox", { name: "Change language" }), "hi");

    expect(replaceMock).toHaveBeenCalledWith("/dev/design-system", { locale: "hi" });
  });

  it("does not navigate when the current locale is re-selected", async () => {
    const user = userEvent.setup();
    renderWithProviders("en", enMessages);

    await user.selectOptions(screen.getByRole("combobox", { name: "Change language" }), "en");
    expect(replaceMock).not.toHaveBeenCalled();
  });
});
