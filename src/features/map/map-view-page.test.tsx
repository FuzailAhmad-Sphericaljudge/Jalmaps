import React from "react";
import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { MapViewPage } from "./map-view-page";

vi.mock("@/server/auth", () => ({
  requireRole: vi.fn().mockResolvedValue({
    user: { id: "user-123" },
    profile: {
      id: "user-123",
      role: "farmer",
      full_name: "Ramesh Kumar",
      preferred_unit: "m",
      preferred_text_size: "normal",
      preferred_theme: "system",
    },
  }),
}));

vi.mock("next-intl/server", () => ({
  getTranslations: vi.fn().mockResolvedValue((key: string) => {
    if (key === "title") return "Groundwater Map";
    return key;
  }),
}));

vi.mock("next/headers", () => ({
  cookies: vi.fn().mockResolvedValue({
    get: vi.fn().mockReturnValue(undefined),
  }),
}));

vi.mock("@/components/layout/protected-app-shell", () => ({
  ProtectedAppShell: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="protected-shell">{children}</div>
  ),
}));

vi.mock("./lazy-map", () => ({
  LazyMap: ({ locale, unit }: { locale: string; unit: string }) => (
    <div data-testid="lazy-map-mock" data-locale={locale} data-unit={unit}>
      Map Rendered
    </div>
  ),
}));

describe("MapViewPage", () => {
  it("renders protected shell with map heading and lazy map", async () => {
    const page = await MapViewPage({ locale: "en", role: "farmer" });
    render(page);

    expect(screen.getByRole("heading", { name: "Groundwater Map" })).toBeDefined();
    expect(screen.getByTestId("lazy-map-mock")).toBeDefined();
    expect(screen.getByTestId("lazy-map-mock").getAttribute("data-unit")).toBe("m");
  });
});
