import React from "react";
import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { OfficialKpiStripComponent } from "./OfficialKpiStripComponent";
import { OfficialCaveatsBanner } from "./OfficialCaveatsBanner";
import { NeedsAttentionList } from "./NeedsAttentionList";
import officialMessages from "@/i18n/messages/en/official.json";
import type { NeedsAttentionVillage, OfficialKpiStrip } from "@/server/official/service";

function renderWithIntl(ui: React.ReactNode) {
  return render(
    <NextIntlClientProvider
      locale="en"
      messages={{ official: officialMessages }}
      timeZone="Asia/Kolkata"
    >
      {ui}
    </NextIntlClientProvider>,
  );
}

describe("OfficialKpiStripComponent", () => {
  const mockKpis: OfficialKpiStrip = {
    wellsMonitored: 124,
    nodesOnlinePct: 88,
    villagesCriticalPct: 15,
    avgChange30dM: -0.45,
    openCriticalAlerts: 3,
    dataFreshness: "2026-10-16T08:30:00Z",
  };

  it("renders all KPI metrics correctly", () => {
    renderWithIntl(<OfficialKpiStripComponent kpis={mockKpis} locale="en" />);

    expect(screen.getByText("124")).toBeInTheDocument();
    expect(screen.getByText("88%")).toBeInTheDocument();
    expect(screen.getByText("15%")).toBeInTheDocument();
    expect(screen.getByText("-0.45 m")).toBeInTheDocument();
    expect(screen.getByText("3")).toBeInTheDocument();
    expect(screen.getByText("Wells Monitored")).toBeInTheDocument();
  });
});

describe("OfficialCaveatsBanner", () => {
  it("renders warning when offline sensors percentage is high", () => {
    renderWithIntl(
      <OfficialCaveatsBanner
        offlineSensorsPct={18}
        offlineSensorsCount={22}
        privacySuppressedCount={0}
      />,
    );

    expect(screen.getByRole("alert")).toBeInTheDocument();
    expect(screen.getByText(/18% of sensors \(22\) are currently offline/)).toBeInTheDocument();
  });

  it("renders privacy suppression notice when villages are masked", () => {
    renderWithIntl(
      <OfficialCaveatsBanner
        offlineSensorsPct={2}
        offlineSensorsCount={1}
        privacySuppressedCount={4}
      />,
    );

    expect(screen.getByRole("alert")).toBeInTheDocument();
    expect(screen.getByText(/4 villages have fewer than 3 wells/)).toBeInTheDocument();
  });

  it("returns null when no caveats apply", () => {
    const { container } = renderWithIntl(
      <OfficialCaveatsBanner
        offlineSensorsPct={5}
        offlineSensorsCount={2}
        privacySuppressedCount={0}
      />,
    );

    expect(container.firstChild).toBeNull();
  });
});

describe("NeedsAttentionList", () => {
  const mockVillages: NeedsAttentionVillage[] = [
    {
      id: "v-1",
      code: "VIL001",
      name: "Boparai Kalan",
      parentName: "Sidhwan Bet",
      wellsCount: 10,
      nodesOnline: 7,
      pctCritical: 30,
      pctOffline: 30,
      avgDepthM: 14.2,
      avgChange30dM: -0.8,
      stressScore: 78,
      severity: "critical",
      isPrivacySuppressed: false,
      reasonChips: [
        {
          id: "critical_wells",
          severity: "critical",
          translationKey: "critical_wells",
          params: { pct: 30 },
          scoreContribution: 25,
        },
        {
          id: "rapid_depletion",
          severity: "warning",
          translationKey: "rapid_depletion",
          params: { rate: 0.8 },
          scoreContribution: 20,
        },
      ],
    },
  ];

  it("renders ranked villages with reason chips", () => {
    renderWithIntl(<NeedsAttentionList villages={mockVillages} locale="en" />);

    expect(screen.getByText("Boparai Kalan")).toBeInTheDocument();
    expect(screen.getByText("(Sidhwan Bet)")).toBeInTheDocument();
    expect(screen.getByText("Score: 78")).toBeInTheDocument();
    expect(screen.getByText("30% wells critical")).toBeInTheDocument();
    expect(screen.getByText("Depleting fast (0.8 m/yr)")).toBeInTheDocument();
    expect(screen.getByText("High Stress")).toBeInTheDocument();
  });

  it("renders empty state when no villages need attention", () => {
    renderWithIntl(<NeedsAttentionList villages={[]} locale="en" />);

    expect(
      screen.getByText("No villages currently flagged for urgent attention."),
    ).toBeInTheDocument();
  });
});
