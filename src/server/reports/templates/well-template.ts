import type { WellReportData } from "../types";
import { renderBaseReportHtml } from "./base-layout";
import { renderTrendSvg } from "./svg-charts";

export function renderWellReportHtml(data: WellReportData): string {
  const { well, kpis, trendSeries, insights, alerts, dataQuality, locale, unit } = data;

  const currentDepthStr =
    kpis.currentDepthM !== null ? `${kpis.currentDepthM.toFixed(2)} ${unit}` : "No reading";
  const change30dStr =
    kpis.change30dM !== null
      ? `${kpis.change30dM > 0 ? "Depleted by" : "Recharged by"} ${Math.abs(kpis.change30dM).toFixed(2)} ${unit}`
      : "Steady / Insufficient history";

  const batteryStr = kpis.batteryV !== null ? `${kpis.batteryV.toFixed(2)} V` : "N/A";
  const signalStr = kpis.signalRssi !== null ? `${kpis.signalRssi} dBm` : "N/A";

  const trendSvg = renderTrendSvg(trendSeries, unit, { width: 660, height: 210 });

  const alertsRows =
    alerts.length > 0
      ? alerts
          .map(
            (a) => `<tr>
        <td><span class="tier-badge tier-${a.severity}">${a.severity.toUpperCase()}</span></td>
        <td>${a.message}</td>
        <td>${new Date(a.createdAt).toLocaleDateString("en-IN")}</td>
      </tr>`,
          )
          .join("")
      : `<tr><td colspan="3" style="text-align:center; color:#94a3b8;">No active alerts in the last 30 days</td></tr>`;

  const contentHtml = `
    <!-- Top KPI Strip -->
    <div class="kpi-strip">
      <div class="kpi-card">
        <div class="kpi-label">Current Water Depth</div>
        <div class="kpi-value">${currentDepthStr}</div>
        <div class="kpi-sub">Below ground level</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-label">30-Day Fluctuation</div>
        <div class="kpi-value" style="font-size:13px;">${change30dStr}</div>
        <div class="kpi-sub">Seasonal rate</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-label">Telemetry Status</div>
        <div class="kpi-value" style="color:#0284c7;">${kpis.status.toUpperCase()}</div>
        <div class="kpi-sub">Bat: ${batteryStr} | Sig: ${signalStr}</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-label">Aquifer Health</div>
        <div class="kpi-value" style="color:#10b981;">${insights.healthScore ?? 75}/100</div>
        <div class="kpi-sub">${insights.healthBand?.toUpperCase() ?? "HEALTHY"}</div>
      </div>
    </div>

    <!-- Hydrogeological Trend Chart -->
    <div class="section-title">
      <span>Groundwater Level Trend (Last 30 Days)</span>
      <span style="font-size:9px; font-weight:normal; color:#64748b;">Telemetry interval: 1-hour automated sampling</span>
    </div>
    <div style="margin-bottom:14px;">
      ${trendSvg}
    </div>

    <!-- Details Grid -->
    <div style="display:grid; grid-template-columns: 1fr 1fr; gap:16px; margin-bottom:14px;">
      <div>
        <div class="section-title">Well Specifications & Location</div>
        <table class="data-table">
          <tr><th>Well Name</th><td>${well.name}</td></tr>
          <tr><th>Well Type</th><td style="text-transform:capitalize;">${well.wellType}</td></tr>
          <tr><th>Total Depth</th><td>${well.depthTotalM ? `${well.depthTotalM} ${unit}` : "Unrecorded"}</td></tr>
          <tr><th>Village / Block</th><td>${well.village} / ${well.block}</td></tr>
          <tr><th>Coordinates</th><td>${well.lat?.toFixed(4) ?? "-"}, ${well.lng?.toFixed(4) ?? "-"}</td></tr>
        </table>
      </div>

      <div>
        <div class="section-title">Aquifer & Recharge Insights</div>
        <table class="data-table">
          <tr><th>Yearly Depletion Rate</th><td>${insights.depletionRateMPerYear !== null && insights.depletionRateMPerYear !== undefined ? `${insights.depletionRateMPerYear} ${unit}/year` : "Calculating"}</td></tr>
          <tr><th>Monsoon Recharge (WTF)</th><td>${insights.monsoonRechargeM ? `${insights.monsoonRechargeM} ${unit} net rise` : "Awaiting post-monsoon"}</td></tr>
          <tr><th>Data Sufficiency</th><td>${dataQuality.qualityScorePct}% nominal readings</td></tr>
          <tr><th>Sensor Reliability</th><td>${dataQuality.goodReadings} of ${dataQuality.totalReadings} valid samples</td></tr>
        </table>
      </div>
    </div>

    <!-- Recent Alerts -->
    <div class="section-title">Telemetry Alerts & Advisory Notifications</div>
    <table class="data-table">
      <thead>
        <tr><th>Severity</th><th>Event Description</th><th>Timestamp</th></tr>
      </thead>
      <tbody>
        ${alertsRows}
      </tbody>
    </table>

    <!-- Data Quality Notes -->
    <div style="background:#f8fafc; border:1px solid #e2e8f0; border-radius:6px; padding:8px 10px; margin-top:10px;">
      <div style="font-weight:600; font-size:10px; color:#475569; margin-bottom:2px;">Data Quality & Integrity Notes</div>
      <div style="color:#64748b; font-size:9px;">${dataQuality.notes.join(" • ")}</div>
    </div>
  `;

  return renderBaseReportHtml({
    title: "Farmer Well Monitoring Report",
    subtitle: `${well.name} • ${well.village}, ${well.district}`,
    scopeBadge: "Farmer Report",
    generatedAt: data.generatedAt,
    locale,
    qrCodeDataUrl: data.qrCodeDataUrl,
    liveUrl: data.liveUrl,
    contentHtml,
  });
}
