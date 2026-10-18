import React from "react";
import { describe, expect, it, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { MapFilters } from "./map-filters";
import wellsMessages from "@/i18n/messages/en/wells.json";

function renderWithIntl(ui: React.ReactNode) {
  return render(
    <NextIntlClientProvider locale="en" messages={{ wells: wellsMessages }}>
      {ui}
    </NextIntlClientProvider>,
  );
}

describe("MapFilters", () => {
  it("renders status and type filters with min 48px touch targets", () => {
    const onStatusChange = vi.fn();
    const onTypeChange = vi.fn();
    const onViewModeToggle = vi.fn();

    renderWithIntl(
      <MapFilters
        status="all"
        onStatusChange={onStatusChange}
        type="all"
        onTypeChange={onTypeChange}
        viewMode="map"
        onViewModeToggle={onViewModeToggle}
        wellsCount={42}
      />,
    );

    const statusSelect = screen.getByLabelText("Status");
    expect(statusSelect.className).toContain("min-h-[48px]");
    fireEvent.change(statusSelect, { target: { value: "critical" } });
    expect(onStatusChange).toHaveBeenCalledWith("critical");

    const typeSelect = screen.getByLabelText("Type");
    expect(typeSelect.className).toContain("min-h-[48px]");
    fireEvent.change(typeSelect, { target: { value: "borewell" } });
    expect(onTypeChange).toHaveBeenCalledWith("borewell");

    const toggleBtn = screen.getByRole("button", { name: "List view" });
    expect(toggleBtn.className).toContain("min-h-[48px]");
    fireEvent.click(toggleBtn);
    expect(onViewModeToggle).toHaveBeenCalledOnce();

    expect(screen.getByText("42 wells in view")).toBeDefined();
  });
});
