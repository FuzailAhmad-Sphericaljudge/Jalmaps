import { describe, it, expect } from "vitest";
import { renderTrendSvg, renderBoundarySvg, renderStressGaugeSvg } from "./svg-charts";
import { renderReportHtml } from "./index";
import type {
  WellReportData,
  VillageReportData,
  DistrictReportData,
  SubsidyPlanningReportData,
} from "../types";

describe("SVG Charts", () => {
  it("renders trend SVG with proper coordinates and inverted Y axis", () => {
    const series = [
      { timestamp: "2026-10-01T00:00:00Z", depthM: 10.5 },
      { timestamp: "2026-10-08T00:00:00Z", depthM: 11.2 },
      { timestamp: "2026-10-15T00:00:00Z", depthM: 12.0 },
    ];
    const svg = renderTrendSvg(series, "m", { width: 500, height: 200 });
    expect(svg).toContain("<svg");
    expect(svg).toContain('viewBox="0 0 500 200"');
    expect(svg).toContain("<path");
    expect(svg).toContain("10-01");
    expect(svg).toContain("10-15");
  });

  it("handles empty series with an informative fallback notice in SVG", () => {
    const svg = renderTrendSvg([], "m");
    expect(svg).toContain("Insufficient telemetry data");
  });

  it("renders boundary outline SVG with compass rose", () => {
    const coords: [number, number][] = [
      [10, 10],
      [20, 10],
      [20, 20],
      [10, 20],
    ];
    const svg = renderBoundarySvg(coords, { width: 200, height: 150 });
    expect(svg).toContain("<svg");
    expect(svg).toContain("polygon points=");
    expect(svg).toContain(">N<");
  });

  it("renders stress gauge SVG with needle and score", () => {
    const svg = renderStressGaugeSvg(85, "critical");
    expect(svg).toContain("85");
    expect(svg).toContain('stroke="#ef4444"');
  });
});

describe("Report Templates", () => {
  it("renders well report HTML with embedded QR code and KPIs", () => {
    const wellData: WellReportData = {
      type: "well",
      well: {
        id: "w-1",
        name: "Well Alpha",
        wellType: "borewell",
        depthTotalM: 50,
        village: "Rampur",
        block: "East",
        district: "Varanasi",
        lat: 25.3,
        lng: 82.9,
      },
      kpis: {
        currentDepthM: 12.4,
        change30dM: 0.3,
        status: "active",
        batteryV: 3.6,
        signalRssi: -75,
        lastSeenAt: "2026-10-16T12:00:00Z",
      },
      trendSeries: [{ timestamp: "2026-10-01T00:00:00Z", depthM: 12.1 }],
      insights: { healthScore: 80, healthBand: "healthy", depletionRateMPerYear: 0.2 },
      alerts: [],
      dataQuality: {
        totalReadings: 100,
        goodReadings: 98,
        suspectReadings: 2,
        qualityScorePct: 98,
        notes: ["Nominal telemetry"],
      },
      generatedAt: "2026-10-17T00:00:00Z",
      locale: "hi",
      unit: "m",
      liveUrl: "https://jalmaps.in/hi/app/farmer?well=w-1",
      qrCodeDataUrl: "data:image/png;base64,mockqr",
    };

    const html = renderReportHtml(wellData);
    expect(html).toContain("Farmer Well Monitoring Report");
    expect(html).toContain("Well Alpha");
    expect(html).toContain("data:image/png;base64,mockqr");
    expect(html).toContain("12.40 m");
  });

  it("renders village report HTML with privacy banner when masked", () => {
    const villageData: VillageReportData = {
      type: "village",
      village: {
        id: "v-1",
        name: "Chhota Gaon",
        code: "CG01",
        block: "North",
        district: "Varanasi",
      },
      privacyMasked: true,
      kpis: {
        totalWells: 2,
        onlineNodes: 2,
        criticalWellsCount: 0,
        averageDepthM: null,
        change30dM: null,
        stressScore: 35,
      },
      stressBreakdown: {
        criticalScore: 0,
        depletionScore: 10,
        offlineScore: 0,
        alertsScore: 10,
        aquiferScore: 15,
        total: 35,
        tier: "watch",
      },
      wells: [
        {
          id: "w-1",
          name: "Well #1 (Anonymous)",
          type: "borewell",
          status: "active",
          currentDepthM: null,
          lastSeenAt: null,
        },
      ],
      trendSeries: [],
      insights: { healthScore: 70 },
      boundaryOutline: null,
      alerts: [],
      dataQuality: { totalReadings: 50, coveragePct: 95, notes: ["Privacy threshold applied"] },
      generatedAt: "2026-10-17T00:00:00Z",
      locale: "en",
      unit: "m",
      liveUrl: "https://jalmaps.in/en/official/village/v-1",
    };

    const html = renderReportHtml(villageData);
    expect(html).toContain("Privacy Threshold Active (N &lt; 3 wells)");
    expect(html).toContain("Masked (Privacy)");
    expect(html).toContain("Well #1 (Anonymous)");
  });

  it("renders subsidy planning report HTML with priority ranks and methodology", () => {
    const planData: SubsidyPlanningReportData = {
      type: "subsidy_planning",
      scopeName: "Varanasi District",
      scopeType: "district",
      prioritizedVillages: [
        {
          rank: 1,
          id: "v-p1",
          name: "Rampur Kalan",
          block: "East",
          wellCount: 6,
          stressScore: 84,
          tier: "critical",
          depletionRateMPerYear: 1.8,
          offlineNodeCount: 2,
          rechargeSuitability: "high",
          recommendedIntervention: "Check dam construction",
          privacyMasked: false,
        },
      ],
      summary: {
        totalVillagesAssessed: 1,
        criticalPriorityCount: 1,
        recommendedRechargeStructures: 3,
        offlineNodesToFix: 2,
      },
      methodology: {
        criteria: ["Stress score >= 70"],
        weightingNotes: "Deterministic telemetry",
        dataNotice: "No unmeasured electricity figures",
      },
      generatedAt: "2026-10-17T00:00:00Z",
      locale: "en",
      liveUrl: "https://jalmaps.in/en/official/planning",
    };

    const html = renderReportHtml(planData);
    expect(html).toContain("Groundwater Subsidy & Recharge Planning Report");
    expect(html).toContain("#1");
    expect(html).toContain("Check dam construction");
    expect(html).toContain("No unmeasured electricity figures");
  });
});
