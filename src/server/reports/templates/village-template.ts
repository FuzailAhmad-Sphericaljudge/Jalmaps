import type { VillageReportData } from "../types";
import { renderBaseReportHtml } from "./base-layout";
import { renderTrendSvg, renderBoundarySvg, renderStressGaugeSvg } from "./svg-charts";

export function renderVillageReportHtml(data: VillageReportData): string {
  const {
    village,
    privacyMasked,
    kpis,
    stressBreakdown,
    wells,
    trendSeries,
    insights,
    boundaryOutline,
    alerts,
    dataQuality,
    locale,
    unit,
  } = data;

  const avgDepthStr =
    kpis.averageDepthM !== null ? `${kpis.averageDepthM.toFixed(2)} ${unit}` : "Masked (Privacy)";
  const change30dStr =
    kpis.change30dM !== null
      ? `${kpis.change30dM > 0 ? "Depleted by" : "Recharged by"} ${Math.abs(kpis.change30dM).toFixed(2)} ${unit}`
      : "Masked (Privacy)";

  const trendSvg = renderTrendSvg(trendSeries, unit, { width: 380, height: 170 });
  const boundarySvg = renderBoundarySvg(boundaryOutline, { width: 250, height: 170 });
  const stressGaugeSvg = renderStressGaugeSvg(stressBreakdown.total, stressBreakdown.tier);

  const privacyNoticeHtml = privacyMasked
    ? `<div class="banner-warning">
        <strong>Privacy Threshold Active (N &lt; 3 wells):</strong> This village has only ${kpis.totalWells} monitored telemetry well(s).
        To protect farmer data and preserve operational privacy, individual well depths, water column measurements,
        and owner names are masked in this report.
      </div>`
    : "";

  const wellRows = wells
    .map(
      (w) => `<tr>
      <td>${w.name}</td>
      <td style="text-transform:capitalize;">${w.type}</td>
      <td><span class="tier-badge ${w.status === "active" ? "tier-low" : "tier-critical"}">${w.status.toUpperCase()}</span></td>
      <td>${w.currentDepthM !== null ? `${w.currentDepthM.toFixed(2)} ${unit}` : "— (Protected)"}</td>
      <td>${w.lastSeenAt ? new Date(w.lastSeenAt).toLocaleDateString("en-IN") : "Offline"}</td>
    </tr>`,
    )
    .join("");

  const contentHtml = `
    ${privacyNoticeHtml}

    <!-- Top KPI Strip -->
    <div class="kpi-strip">
      <div class="kpi-card">
        <div class="kpi-label">Wells Monitored</div>
        <div class="kpi-value">${kpis.totalWells}</div>
        <div class="kpi-sub">${kpis.onlineNodes} online telemetry nodes</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-label">Average Water Depth</div>
        <div class="kpi-value">${avgDepthStr}</div>
        <div class="kpi-sub">Village median</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-label">30-Day Trend</div>
        <div class="kpi-value" style="font-size:13px;">${change30dStr}</div>
        <div class="kpi-sub">Net water table shift</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-label">Village Stress Score</div>
        <div class="kpi-value" style="color:#0284c7;">${stressBreakdown.total}/100</div>
        <div class="kpi-sub">Tier: <span class="tier-badge tier-${stressBreakdown.tier}">${stressBreakdown.tier.toUpperCase()}</span></div>
      </div>
    </div>

    <!-- Visualizations: Trend & Simplified Boundary -->
    <div style="display:flex; gap:16px; margin-bottom:14px;">
      <div style="flex:1;">
        <div class="section-title">Water Level Profile (30 Days)</div>
        ${trendSvg}
      </div>
      <div style="width:250px;">
        <div class="section-title">Village Boundary & Locator</div>
        ${boundarySvg}
      </div>
    </div>

    <!-- Stress Score Breakdown -->
    <div class="section-title">Explainable Village Stress Score Breakdown</div>
    <div style="display:flex; align-items:center; gap:20px; background:#f8fafc; border:1px solid #e2e8f0; border-radius:6px; padding:10px; margin-bottom:14px;">
      <div style="text-align:center;">
        ${stressGaugeSvg}
        <div style="font-size:9px; font-weight:bold; color:#475569;">COMPOSITE SCORE</div>
      </div>
      <div style="flex:1; display:grid; grid-template-columns: repeat(5, 1fr); gap:8px;">
        <div style="background:#ffffff; border:1px solid #e2e8f0; border-radius:4px; padding:6px; text-align:center;">
          <div style="font-size:8px; color:#64748b;">CRITICAL WELLS</div>
          <div style="font-size:12px; font-weight:700; color:#0f172a;">${stressBreakdown.criticalScore}/30</div>
        </div>
        <div style="background:#ffffff; border:1px solid #e2e8f0; border-radius:4px; padding:6px; text-align:center;">
          <div style="font-size:8px; color:#64748b;">DEPLETION RATE</div>
          <div style="font-size:12px; font-weight:700; color:#0f172a;">${stressBreakdown.depletionScore}/25</div>
        </div>
        <div style="background:#ffffff; border:1px solid #e2e8f0; border-radius:4px; padding:6px; text-align:center;">
          <div style="font-size:8px; color:#64748b;">OFFLINE NODES</div>
          <div style="font-size:12px; font-weight:700; color:#0f172a;">${stressBreakdown.offlineScore}/20</div>
        </div>
        <div style="background:#ffffff; border:1px solid #e2e8f0; border-radius:4px; padding:6px; text-align:center;">
          <div style="font-size:8px; color:#64748b;">ALERTS</div>
          <div style="font-size:12px; font-weight:700; color:#0f172a;">${stressBreakdown.alertsScore}/15</div>
        </div>
        <div style="background:#ffffff; border:1px solid #e2e8f0; border-radius:4px; padding:6px; text-align:center;">
          <div style="font-size:8px; color:#64748b;">AQUIFER HEALTH</div>
          <div style="font-size:12px; font-weight:700; color:#0f172a;">${stressBreakdown.aquiferScore}/10</div>
        </div>
      </div>
    </div>

    <!-- Well Inventory Table -->
    <div class="section-title">Village Well Inventory</div>
    <table class="data-table">
      <thead>
        <tr><th>Well Identifier</th><th>Type</th><th>Telemetry Status</th><th>Current Depth (${unit})</th><th>Last Telemetry Seen</th></tr>
      </thead>
      <tbody>
        ${wellRows}
      </tbody>
    </table>

    <!-- Quality & Governance -->
    <div style="background:#f8fafc; border:1px solid #e2e8f0; border-radius:6px; padding:8px 10px; margin-top:10px;">
      <div style="font-weight:600; font-size:10px; color:#475569; margin-bottom:2px;">Data Quality & Privacy Compliance</div>
      <div style="color:#64748b; font-size:9px;">${dataQuality.notes.join(" • ")} • Telemetry completeness: ${dataQuality.coveragePct}%</div>
    </div>
  `;

  return renderBaseReportHtml({
    title: "Village Groundwater Monitoring Report",
    subtitle: `${village.name} (${village.code}) • ${village.block}, ${village.district}`,
    scopeBadge: "Village Report",
    generatedAt: data.generatedAt,
    locale,
    qrCodeDataUrl: data.qrCodeDataUrl,
    liveUrl: data.liveUrl,
    contentHtml,
  });
}
