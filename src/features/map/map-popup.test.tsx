import React from "react";
import { describe, expect, it, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { MapPopup } from "./map-popup";
import type { MapPointProperties } from "@/server/map/types";
import wellsMessages from "@/i18n/messages/en/wells.json";

function renderWithIntl(ui: React.ReactNode, locale = "en") {
  return render(
    <NextIntlClientProvider locale={locale} messages={{ wells: wellsMessages }}>
      {ui}
    </NextIntlClientProvider>,
  );
}

describe("MapPopup", () => {
  const baseProperties: MapPointProperties = {
    id: "well-99",
    isCluster: false,
    status: "critical",
    name: "South Tubewell",
    villageName: "Rampur",
    depthToWaterM: 14.2,
    trend7d: 0.8,
    lastReadingAt: "2026-10-10T12:00:00Z",
    isOwned: true,
  };

  it("renders well title, status, depth, and village", () => {
    const onClose = vi.fn();
    renderWithIntl(<MapPopup properties={baseProperties} locale="en" unit="m" onClose={onClose} />);

    expect(screen.getByText("South Tubewell")).toBeDefined();
    expect(screen.getByText("Rampur")).toBeDefined();
    expect(screen.getByText("Critical")).toBeDefined();
    expect(screen.getByText("14.2 m")).toBeDefined();
    expect(screen.getByText("Falling")).toBeDefined();
    expect(screen.getByText("My Well")).toBeDefined();

    const closeBtn = screen.getByLabelText("Close");
    fireEvent.click(closeBtn);
    expect(onClose).toHaveBeenCalledOnce();
  });

  it("formats depth in feet when unit is ft", () => {
    renderWithIntl(
      <MapPopup properties={baseProperties} locale="en" unit="ft" onClose={vi.fn()} />,
    );

    // 14.2 * 3.28084 ≈ 46.6 ft
    expect(screen.getByText("46.6 ft")).toBeDefined();
  });

  it("renders a link to the well detail page with min 48px target", () => {
    const { container } = renderWithIntl(
      <MapPopup properties={baseProperties} locale="hi" unit="m" onClose={vi.fn()} />,
      "en",
    );

    const link = container.querySelector("a");
    expect(link?.getAttribute("href")).toBe("/hi/wells/well-99");
    expect(link?.className).toContain("min-h-[48px]");
  });
});
