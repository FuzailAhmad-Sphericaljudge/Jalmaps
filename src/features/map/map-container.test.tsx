import React from "react";
import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MapContainer } from "./map-container";
import { MapSkeleton } from "./lazy-map";
import wellsMessages from "@/i18n/messages/en/wells.json";

// Mock next/navigation
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    replace: vi.fn(),
  }),
  useSearchParams: () => new URLSearchParams(),
}));

// Mock react-map-gl/maplibre
vi.mock("react-map-gl/maplibre", () => ({
  __esModule: true,
  default: ({ children }: { children?: React.ReactNode }) => (
    <div data-testid="mock-maplibre-map">{children}</div>
  ),
  Marker: ({ children }: { children?: React.ReactNode }) => (
    <div data-testid="mock-map-marker">{children}</div>
  ),
  NavigationControl: () => <div data-testid="mock-nav-control" />,
  Source: ({ children }: { children?: React.ReactNode }) => (
    <div data-testid="mock-source">{children}</div>
  ),
  Layer: () => <div data-testid="mock-layer" />,
}));

function renderWithProviders(ui: React.ReactNode) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <NextIntlClientProvider locale="en" messages={{ wells: wellsMessages }}>
        {ui}
      </NextIntlClientProvider>
    </QueryClientProvider>,
  );
}

describe("MapContainer", () => {
  it("renders map container, filters, and locate button", () => {
    renderWithProviders(<MapContainer locale="en" unit="m" />);

    expect(screen.getByTestId("mock-maplibre-map")).toBeDefined();
    expect(screen.getByLabelText("Status")).toBeDefined();
    expect(screen.getByLabelText("Type")).toBeDefined();
    expect(screen.getByLabelText("Locate me on map")).toBeDefined();
  });
});

describe("MapSkeleton", () => {
  it("renders loading skeleton with localized title", () => {
    render(
      <NextIntlClientProvider locale="en" messages={{ wells: wellsMessages }}>
        <MapSkeleton />
      </NextIntlClientProvider>,
    );

    expect(screen.getByRole("status")).toBeDefined();
  });
});
