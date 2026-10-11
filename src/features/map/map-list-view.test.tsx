import React from "react";
import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { MapListView } from "./map-list-view";
import type { MapFeatureCollection } from "@/server/map/types";
import wellsMessages from "@/i18n/messages/en/wells.json";

function renderWithIntl(ui: React.ReactNode) {
  return render(
    <NextIntlClientProvider locale="en" messages={{ wells: wellsMessages }}>
      {ui}
    </NextIntlClientProvider>,
  );
}

describe("MapListView", () => {
  const mockData: MapFeatureCollection = {
    type: "FeatureCollection",
    features: [
      {
        type: "Feature",
        geometry: {
          type: "Point",
          coordinates: [77.209, 28.6139],
        },
        properties: {
          id: "w-1",
          isCluster: false,
          name: "Borewell Alpha",
          villageName: "Kishangarh",
          status: "normal",
          depthToWaterM: 10.5,
          trend7d: -0.1,
          lastReadingAt: "2026-10-10T12:00:00Z",
          isOwned: true,
        },
      },
      {
        type: "Feature",
        geometry: {
          type: "Point",
          coordinates: [77.21, 28.62],
        },
        properties: {
          id: "w-2",
          isCluster: false,
          name: "Borewell Beta",
          villageName: "Mehrauli",
          status: "critical",
          depthToWaterM: 25.0,
          trend7d: 0.4,
          lastReadingAt: "2026-10-10T12:00:00Z",
          isOwned: false,
        },
      },
    ],
  };

  it("renders table with well names, villages, and depths", () => {
    renderWithIntl(<MapListView data={mockData} locale="en" unit="m" />);

    expect(screen.getByText("Borewell Alpha")).toBeDefined();
    expect(screen.getByText("Kishangarh")).toBeDefined();
    expect(screen.getByText("10.5 m")).toBeDefined();
    expect(screen.getByText("Normal")).toBeDefined();
    expect(screen.getByText("My Well")).toBeDefined();

    expect(screen.getByText("Borewell Beta")).toBeDefined();
    expect(screen.getByText("Mehrauli")).toBeDefined();
    expect(screen.getByText("25.0 m")).toBeDefined();
    expect(screen.getByText("Critical")).toBeDefined();
  });

  it("renders empty state when there are no features", () => {
    renderWithIntl(<MapListView data={{ type: "FeatureCollection", features: [] }} locale="en" />);

    expect(screen.getByText("No wells in view")).toBeDefined();
  });
});
