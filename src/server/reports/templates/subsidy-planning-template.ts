import type { SubsidyPlanningReportData } from "../types";
import { renderBaseReportHtml } from "./base-layout";

export function renderSubsidyPlanningReportHtml(data: SubsidyPlanningReportData): string {
  const { scopeName, prioritizedVillages, summary, methodology, locale } = data;

  const villageRows = prioritizedVillages
    .map(
      (v) => `<tr>
      <td style="text-align:center;"><strong>#${v.rank}</strong></td>
      <td><strong>${v.name}</strong></td>
      <td>${v.block}</td>
      <td style="text-align:right;"><strong>${v.stressScore}</strong></td>
      <td><span class="tier-badge tier-${v.tier}">${v.tier.toUpperCase()}</span></td>
      <td style="text-align:right;">${v.depletionRateMPerYear !== null ? `${v.depletionRateMPerYear.toFixed(2)} m/yr` : "— (Protected)"}</td>
      <td style="text-align:right; color:${v.offlineNodeCount > 0 ? "#ef4444" : "#10b981"};">${v.offlineNodeCount}</td>
      <td><span class="tier-badge ${v.rechargeSuitability === "high" ? "tier-low" : "tier-warning"}">${v.rechargeSuitability.toUpperCase()}</span></td>
      <td style="font-size:9px;">${v.recommendedIntervention}</td>
    </tr>`,
    )
    .join("");

  const methodologyListHtml = methodology.criteria
    .map((c) => `<li style="margin-bottom:4px;">${c}</li>`)
    .join("");

  const contentHtml = `
    <!-- Executive KPI Strip -->
    <div class="kpi-strip">
      <div class="kpi-card">
        <div class="kpi-label">Villages Evaluated</div>
        <div class="kpi-value">${summary.totalVillagesAssessed}</div>
        <div class="kpi-sub">Official jurisdiction</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-label">Critical Interventions</div>
        <div class="kpi-value" style="color:#ef4444;">${summary.criticalPriorityCount}</div>
        <div class="kpi-sub">Priority allocation</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-label">Recharge Structures</div>
        <div class="kpi-value" style="color:#0284c7;">${summary.recommendedRechargeStructures}</div>
        <div class="kpi-sub">Check dams / percolation</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-label">Telemetry Repairs</div>
        <div class="kpi-value" style="color:#f59e0b;">${summary.offlineNodesToFix}</div>
        <div class="kpi-sub">Nodes needing dispatch</div>
      </div>
    </div>

    <!-- Prioritized Ranking Table -->
    <div class="section-title">
      <span>Prioritized Villages for Artificial Recharge & Micro-Irrigation Subsidies</span>
      <span style="font-size:9px; font-weight:normal; color:#64748b;">Sorted by composite stress score & rate of depletion</span>
    </div>
    <table class="data-table">
      <thead>
        <tr>
          <th style="text-align:center;">Rank</th>
          <th>Village</th>
          <th>Block</th>
          <th style="text-align:right;">Stress Score</th>
          <th>Tier</th>
          <th style="text-align:right;">Depletion Rate</th>
          <th style="text-align:right;">Offline Nodes</th>
          <th>Suitability</th>
          <th>Recommended Intervention Strategy</th>
        </tr>
      </thead>
      <tbody>
        ${villageRows}
      </tbody>
    </table>

    <!-- Methodology & Limitations -->
    <div class="section-title">Methodology, Assumptions & Data Governance</div>
    <div style="background:#f8fafc; border:1px solid #e2e8f0; border-radius:6px; padding:10px 14px; margin-bottom:14px;">
      <ul style="margin:0 0 8px 16px; padding:0; color:#334155; font-size:10px;">
        ${methodologyListHtml}
      </ul>
      <div style="border-top:1px solid #e2e8f0; padding-top:6px; margin-top:6px; font-size:9px; color:#64748b;">
        <strong>Weighting Rationale:</strong> ${methodology.weightingNotes}
      </div>
      <div style="margin-top:4px; font-size:9px; color:#b45309; font-weight:500;">
        <strong>Statutory Notice:</strong> ${methodology.dataNotice}
      </div>
    </div>
  `;

  return renderBaseReportHtml({
    title: "Groundwater Subsidy & Recharge Planning Report",
    subtitle: `${scopeName} • Interventions & Capital Allocation Advisory`,
    scopeBadge: "Planning Report",
    generatedAt: data.generatedAt,
    locale,
    qrCodeDataUrl: data.qrCodeDataUrl,
    liveUrl: data.liveUrl,
    contentHtml,
  });
}
