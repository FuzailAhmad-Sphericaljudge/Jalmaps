import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";

import { DataSharingConsentToggle } from "./data-sharing-consent";

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => {
    const messages: Record<string, string> = {
      dataSharingTitle: "Anonymous Data Sharing",
      dataSharingDescription: "Help agricultural researchers understand groundwater risks.",
      dataSharingConsentLabel: "Allow anonymous village aggregate sharing",
      dataSharingConsentActive: "Active: Anonymous village aggregate sharing enabled",
      dataSharingConsentInactive: "Off: Your data is excluded from all external aggregates",
      dataSharingWithdrawNotice: "You can withdraw consent at any time.",
      legalReviewNote: "Plain-language copy (marked for legal review)",
      saved: "Your settings were saved.",
      saveError: "Settings could not be saved. Please try again.",
    };
    return messages[key] ?? key;
  },
}));

vi.mock("@/app/[locale]/(app)/app/settings/consent-actions", () => ({
  saveConsentSettings: vi.fn(),
}));

import { saveConsentSettings } from "@/app/[locale]/(app)/app/settings/consent-actions";

describe("DataSharingConsentToggle", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders with initial consent off (default)", () => {
    render(<DataSharingConsentToggle initialConsent={false} locale="en" />);

    expect(screen.getByText("Anonymous Data Sharing")).toBeInTheDocument();
    expect(screen.getByText("Plain-language copy (marked for legal review)")).toBeInTheDocument();
    expect(
      screen.getByText("Off: Your data is excluded from all external aggregates"),
    ).toBeInTheDocument();

    const checkbox = screen.getByRole("checkbox");
    expect(checkbox).not.toBeChecked();
  });

  it("renders with initial consent on", () => {
    render(<DataSharingConsentToggle initialConsent={true} locale="en" />);

    expect(
      screen.getByText("Active: Anonymous village aggregate sharing enabled"),
    ).toBeInTheDocument();

    const checkbox = screen.getByRole("checkbox");
    expect(checkbox).toBeChecked();
  });

  it("calls saveConsentSettings and updates status when toggled", async () => {
    vi.mocked(saveConsentSettings).mockResolvedValue({
      status: "saved",
      data_sharing_consent: true,
    });

    render(<DataSharingConsentToggle initialConsent={false} locale="en" />);

    const checkbox = screen.getByRole("checkbox");
    fireEvent.click(checkbox);

    expect(saveConsentSettings).toHaveBeenCalledWith("en", { data_sharing_consent: true });

    await waitFor(() => {
      expect(screen.getByText("Your settings were saved.")).toBeInTheDocument();
      expect(
        screen.getByText("Active: Anonymous village aggregate sharing enabled"),
      ).toBeInTheDocument();
    });
  });

  it("handles failure gracefully", async () => {
    vi.mocked(saveConsentSettings).mockResolvedValue({
      status: "invalid",
    });

    render(<DataSharingConsentToggle initialConsent={false} locale="en" />);

    const checkbox = screen.getByRole("checkbox");
    fireEvent.click(checkbox);

    await waitFor(() => {
      expect(
        screen.getByText("Settings could not be saved. Please try again."),
      ).toBeInTheDocument();
    });
  });
});
