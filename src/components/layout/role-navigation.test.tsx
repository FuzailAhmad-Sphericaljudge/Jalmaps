import { render, screen, within } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { describe, expect, it, vi } from "vitest";

import { RoleNavigation } from "./role-navigation";

vi.mock("@/i18n/navigation", () => ({
  Link: ({ href, children, ...props }: React.ComponentProps<"a"> & { href: string }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
  usePathname: () => "/farmer",
}));

const navMessages = {
  primaryNavigation: "Primary navigation",
  currentPage: "Current page",
  nav: {
    farmerHome: "Overview",
    farmerWells: "My wells",
    wells: "Wells",
    readings: "Readings",
    alerts: "Alerts",
    reports: "Reports",
    villageOverview: "Village overview",
    map: "Map",
    officialOverview: "Area overview",
    insurerOverview: "Portfolio overview",
    adminOverview: "Administration",
    users: "Users",
    systemStatus: "System status",
    security: "Security",
    settings: "Settings",
  },
};

function renderNavigation(
  role: "farmer" | "village_admin" | "official" | "insurer" | "admin",
  mobile = false,
) {
  return render(
    <NextIntlClientProvider locale="en" messages={{ shell: navMessages }} timeZone="Asia/Kolkata">
      <RoleNavigation role={role} mobile={mobile} />
    </NextIntlClientProvider>,
  );
}

describe("RoleNavigation", () => {
  it.each([
    ["farmer", "Overview", "/farmer"],
    ["village_admin", "Village overview", "/village"],
    ["official", "Area overview", "/official"],
    ["insurer", "Portfolio overview", "/insurer"],
    ["admin", "Administration", "/admin"],
  ] as const)("shows the %s role's own destinations", (role, label, href) => {
    renderNavigation(role);
    const navigation = screen.getByRole("navigation");
    expect(within(navigation).getByRole("link", { name: new RegExp(label) })).toHaveAttribute(
      "href",
      href,
    );
    expect(within(navigation).queryByRole("link", { name: "Administration" })).toBe(
      role === "admin" ? within(navigation).getByRole("link", { name: /Administration/ }) : null,
    );
  });

  it("limits mobile navigation to the primary farmer destinations", () => {
    renderNavigation("farmer", true);
    const navigation = screen.getByTestId("mobile-navigation");
    expect(within(navigation).getAllByRole("link")).toHaveLength(5);
    expect(within(navigation).queryByRole("link", { name: "Settings" })).not.toBeInTheDocument();
  });
});
