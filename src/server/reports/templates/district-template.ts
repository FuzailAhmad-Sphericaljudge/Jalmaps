import type { DistrictReportData } from "../types";
import { renderBaseReportHtml } from "./base-layout";
import { renderTrendSvg } from "./svg-charts";

export function renderDistrictReportHtml(data: DistrictReportData): string {
  const { district, kpis, villagesRanked, trendSeries, alertsSummary, dataQuality, locale, unit } =
    data;

  const trendSvg = renderTrendSvg(trendSeries, unit, { width: 660, height: 180 });

  const villageRows = villagesRanked
    .map(
      (v) => `<tr>
      <td><strong>${v.name}</strong> ${v.privacyMasked ? '<span style="font-size:8px; color:#f59e0b;">(Protected)</span>' : ""}</td>
      <td>${v.block}</td>
      <td style="text-align:right;">${v.wellCount}</td>
      <td style="text-align:right;"><strong>${v.stressScore}</strong></td>
      <td><span class="tier-badge tier-${v.tier}">${v.tier.toUpperCase()}</span></td>
      <td style="text-align:right;">${v.criticalWellsPct}%</td>
      <td style="text-align:right;">${v.depletionRateMPerYear !== null ? `${v.depletionRateMPerYear.toFixed(2)} ${unit}/yr` : "—"}</td>
      <td style="text-align:right;">${v.offlineNodesPct}%</td>
    </tr>`,
    )
    .join("");

  const contentHtml = `
    <!-- Top KPI Strip -->
    <div class="kpi-strip">
      <div class="kpi-card">
        <div class="kpi-label">Villages Monitored</div>
        <div class="kpi-value">${kpis.totalVillages}</div>
        <div class="kpi-sub">${kpis.totalWells} operational wells</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-label">Telemetry Online</div>
        <div class="kpi-value" style="color:#0284c7;">${kpis.onlineNodesPct}%</div>
        <div class="kpi-sub">Network health</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-label">Critical Priority Villages</div>
        <div class="kpi-value" style="color:#ef4444;">${kpis.criticalVillagesCount}</div>
        <div class="kpi-sub">Score &ge; 70</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-label">Regional 30-Day Change</div>
        <div class="kpi-value" style="font-size:13px;">${kpis.change30dM !== null ? `${kpis.change30dM > 0 ? "Depleted by" : "Recharged by"} ${Math.abs(kpis.change30dM).toFixed(2)} ${unit}` : "Steady"}</div>
        <div class="kpi-sub">Avg depth: ${kpis.averageDepthM?.toFixed(1) ?? "—"} ${unit}</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-label">Open Alerts</div>
        <div class="kpi-value" style="color:#f59e0b;">${alertsSummary.openCritical}</div>
        <div class="kpi-sub">${alertsSummary.openWarning} warnings</div>
      </div>
    </div>

    <!-- Regional Trend Chart -->
    <div class="section-title">
      <span>District Groundwater Fluctuation (Past 30 Days)</span>
      <span style="font-size:9px; font-weight:normal; color:#64748b;">Area-weighted average depth to water</span>
    </div>
    <div style="margin-bottom:14px;">
      ${trendSvg}
    </div>

    <!-- Ranked Villages by Stress Score -->
    <div class="section-title">Villages Ranked by Composite Stress Score & Priority</div>
    <table class="data-table">
      <thead>
        <tr>
          <th>Village</th>
          <th>Block</th>
          <th style="text-align:right;">Wells</th>
          <th style="text-align:right;">Stress Score</th>
          <th>Severity</th>
          <th style="text-align:right;">Critical Wells</th>
          <th style="text-align:right;">Depletion Rate</th>
          <th style="text-align:right;">Offline Nodes</th>
        </tr>
      </thead>
      <tbody>
        ${villageRows}
      </tbody>
    </table>

    <!-- Data Quality Notes -->
    <div style="background:#f8fafc; border:1px solid #e2e8f0; border-radius:6px; padding:8px 10px; margin-top:10px;">
      <div style="font-weight:600; font-size:10px; color:#475569; margin-bottom:2px;">Jurisdictional Governance & Methodological Reference</div>
      <div style="color:#64748b; font-size:9px;">
        ${dataQuality.notes.join(" • ")} • Telemetry uptime: ${dataQuality.telemetryUptimePct}%
      </div>
    </div>
  `;

  return renderBaseReportHtml({
    title: "District Groundwater Overview Report",
    subtitle: `${district.name} District (${district.code}) • ${district.state}`,
    scopeBadge: "District Report",
    generatedAt: data.generatedAt,
    locale,
    qrCodeDataUrl: data.qrCodeDataUrl,
    liveUrl: data.liveUrl,
    contentHtml,
  });
}
