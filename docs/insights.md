# Aquifer Insights: Hydrogeological Methodology, Assumptions & Governance

> **Architecture Decision Record (ADR) & Hydrogeological Reference Document**  
> Status: Implemented (Phase 21)  
> Scope: Well-level and Village-level seasonal analysis, depletion, monsoon recharge, pump stress, and explainable health scoring.

---

## 1. Executive Summary

Groundwater level data from submersible telemetry sensors is inherently noisy, subject to abrupt pump drawdowns, seasonal rainfall pulses, and diurnal barometric variations. Raw water-level time series can easily mislead farmers and officials if presented without hydrogeological context.

Phase 21 introduces the **Aquifer Insights Engine**, transforming raw telemetry into explainable, plain-language metrics:

1. **Data Sufficiency & Quality Rules** preventing premature or misleading assertions.
2. **Seasonal Decomposition** (Trend + Seasonal + Residual) using robust moving medians.
3. **Pre- vs. Post-Monsoon Level Comparisons** adhering to Indian hydrogeological conventions (May pre-monsoon vs. Oct-Nov post-monsoon).
4. **Yearly Depletion Rates** estimated via robust, outlier-resistant Theil-Sen regression.
5. **Monsoon Recharge Estimation** based on the Water Table Fluctuation (WTF) method (with clearly stated specific yield assumptions).
6. **Pumping Stress Diagnostics** identifying drawdown magnitude and aquifer recovery duration.
7. **Aquifer Health Score (`health_v1`)** evaluating overall vulnerability on a 0–100 scale across 4 interpretable bands (`healthy`, `watch`, `stressed`, `critical`).

---

## 2. Hydrogeological Foundations & CGWB Comparison

### 2.1 Indian Hydrogeological Context & Central Ground Water Board (CGWB) Standards

In India, groundwater assessments conducted by the Central Ground Water Board (CGWB) and State Ground Water Departments follow the **Ground Water Resource Estimation Methodology (GEC-2015)**:

- **Pre-Monsoon Window**: April/May (peak dry season before South-West monsoon).
- **Post-Monsoon Window**: October/November (after monsoon retreat, maximum replenishment).
- **Water Table Fluctuation (WTF) Principle**:
  $$\text{Gross Recharge} = \Delta S = A \times \Delta h \times S_y$$
  Where:
  - $\Delta h$ = Water table rise (pre-monsoon water depth minus post-monsoon water depth in metres).
  - $S_y$ = Specific yield of the unconfined aquifer zone (dimensionless fraction).
  - $A$ = Geographic area under evaluation.

### 2.2 JalMaps Implementation vs. CGWB Official Assessments

| Aspect                     | CGWB / GEC-2015 Official Assessment                                                                     | JalMaps Aquifer Insights Engine                                                                                         |
| :------------------------- | :------------------------------------------------------------------------------------------------------ | :---------------------------------------------------------------------------------------------------------------------- |
| **Observation Frequency**  | 4 times a year (May, Aug, Nov, Jan) via manual tape/piezometers.                                        | Continuous near-real-time telemetry (hourly/2-hourly automated readings).                                               |
| **Pumping Noise**          | Field staff observe non-pumping static water level where possible.                                      | Automated statistical decomposition & recovery curve detection to isolate static level from active drawdown.            |
| **Recharge Method**        | Formal watershed-scale water budget (WTF + rainfall infiltration factor + canal seepage + return flow). | Point-scale Water Table Fluctuation (WTF) approximation + village-level spatial aggregation.                            |
| **Specific Yield ($S_y$)** | Pumping tests, geological borehole lithologs, or GEC-2015 regional norms.                               | Categorised defaults per aquifer type (Alluvial, Basalt, Hard Rock, Sandstone) with explicit per-well override support. |
| **Depletion Trend**        | 10-year decadal linear regression of seasonal water levels.                                             | Theil-Sen median slope over continuous daily medians ($\ge 2$ full years for reliable trend).                           |
| **Legal Status**           | Statutory classification (Safe, Semi-Critical, Critical, Over-Exploited).                               | Advisory & operational health indicator (`health_v1`, 0–100 score). Clearly labelled as non-statutory decision support. |

---

## 3. Detailed Methodology

### 3.1 Data Sufficiency Rules (`src/lib/insights/sufficiency.ts`)

Before any hydrogeological assertion is surfaced in the farmer or official UI, the system runs strict data sufficiency checks:

- **Minimum Data Span**: At least 90 calendar days are required for basic seasonal profiles; at least 365 days (1 full hydrological cycle) for monsoon comparisons; at least 730 days (2 complete cycles) for long-term depletion rates.
- **Minimum Data Coverage**: At least 70% of expected days within the evaluation period must have valid sensor readings.
- **Reading Quality**: Only readings flagged as `good` (or unflagged legacy readings) are included; `suspect` or `bad` records (such as dry-well air readings, electrical shorts, or transducer faults) are excluded.
- **Farmer-First Fallback**: If data is insufficient, the UI displays an informative notice explaining exactly what is missing (e.g. _"Needs 6 more months of data to compute yearly depletion rate"_).

### 3.2 Daily Medians & Seasonal Decomposition (`src/lib/insights/seasonal.ts`)

1. **Daily Aggregation**: To eliminate diurnal pumping cycles, daily median depth $\tilde{D}_t$ is computed for each calendar day:
   $$\tilde{D}_t = \text{median}(\{d_{t,i}\})$$
2. **Trend Extraction**: A 365-day centered moving average is calculated to separate multi-year climatic and extraction trends from annual seasonal cycles.
3. **Seasonal Component**:
   $$S_t = \text{median}(\tilde{D}_t - T_t \mid \text{day\_of\_year}(t))$$
4. **Residual Anomaly**:
   $$R_t = \tilde{D}_t - (T_t + S_t)$$
   Large residuals highlight sudden events such as severe pump breakdowns, flash-flood recharge pulses, or sensor calibration shifts.

### 3.3 Pre- vs. Post-Monsoon Comparison (`src/lib/insights/monsoon.ts`)

- **Pre-Monsoon Window**: May 1 to May 31 (month 5).
- **Post-Monsoon Window**: October 1 to November 30 (months 10–11).
- **Net Rise ($\Delta h$)**:
  $$\Delta h = \tilde{D}_{\text{pre}} - \tilde{D}_{\text{post}}$$
  _(Note: A positive $\Delta h$ indicates the water table rose closer to the surface)._
- **Confidence Rating**:
  - `high`: $\ge 20$ days of observations in both windows.
  - `medium`: $\ge 10$ days of observations in both windows.
  - `low`: $< 10$ days in either window (requires user caution).

### 3.4 Outlier-Resistant Yearly Depletion Rate (`src/lib/insights/depletion.ts`)

Standard Ordinary Least Squares (OLS) regression is vulnerable to extreme seasonal swings and sensor dropouts. JalMaps uses the **Theil-Sen estimator**:

- For all pairs of daily medians $(t_i, D_i)$ and $(t_j, D_j)$ separated by at least 180 days:
  $$\text{Slope}_{ij} = \frac{D_j - D_i}{t_j - t_i}$$
- **Depletion Rate**:
  $$\text{Depletion Rate (m/year)} = \text{median}(\{\text{Slope}_{ij}\}) \times 365.25$$
- An uncertainty range (95% non-parametric confidence interval) is reported alongside the point estimate.

### 3.5 Monsoon Recharge Estimation via Water Table Fluctuation (`src/lib/insights/recharge.ts`)

- **Specific Yield ($S_y$) Lookup**: Default values are drawn from standard hydrogeological ranges:
  - Alluvial / Sand: $0.12$ (range $0.08 - 0.20$)
  - Hard Rock / Granite / Gneiss (Weathered zone): $0.03$ (range $0.01 - 0.05$)
  - Deccan Trap Basalt (Vesicular / Fractured): $0.025$ (range $0.01 - 0.04$)
  - Sandstone / Sedimentary: $0.06$ (range $0.03 - 0.10$)
- **Point-Scale Recharge**:
  $$\text{Recharge (mm)} = \Delta h \times S_y \times 1000$$
- **Clear Limitation Notice**: The UI displays an explicit badge: _"Estimated using point-scale Water Table Fluctuation with default specific yield ($S_y = 0.08$). Verify local aquifer lithology with a hydrogeologist."_

### 3.6 Pumping Stress & Aquifer Recovery (`src/lib/insights/pumping.ts`)

By inspecting high-resolution telemetry:

- **Pumping Onset**: Characterized by sudden steep drawdown ($> 0.5\text{ m/hour}$).
- **Drawdown Depth**: Difference between pre-pump baseline and maximum depth reached during pumping.
- **Recovery Duration**: Time taken for the water level to bounce back to within 90% of the pre-pumping baseline.
- **Aquifer Stress Indicator**: Recovery times $> 8\text{ hours}$ in unconfined aquifers or persistent residual drawdown suggest localized aquifer dewatering or low transmissivity.

### 3.7 Aquifer Health Score `health_v1` (`src/lib/insights/health-score.ts`)

The score ranges from 0 (severely degraded/dry) to 100 (excellent hydrogeological buffer). It is composed of 4 weighted pillars:

```
Total Score (100 pts) =
  ├── Depletion Pillar (35 pts): Penalizes long-term falling water table (> 1.0 m/yr = 0 pts)
  ├── Recharge Pillar (25 pts): Rewards positive monsoon replenishment
  ├── Seasonal Buffer (25 pts): Evaluates remaining water column in dry season (May)
  └── Pumping Stress (15 pts): Evaluates pump drawdown and aquifer recovery kinetics
```

#### Health Score Bands & Actions:

1. **Healthy (80–100)**: Aquifer shows stable or rising water levels, good monsoon response, and rapid recovery.
2. **Watch (60–79)**: Minor depletion or delayed recovery. Monitor closely during Rabi irrigation season.
3. **Stressed (40–59)**: Significant multi-year drawdown, high pump stress, or inadequate monsoon recharge. Water conservation measures recommended.
4. **Critical (0–39)**: Accelerated depletion, severe dewatering risk during summer, water table approaching well bottom. Immediate demand management needed.

---

## 4. Village-Level Aggregation & Privacy Governance

When aggregating well insights up to village (`admin_area_id`) level:

- **K-Anonymity ($k \ge 3$)**: If a village has fewer than 3 active monitored wells, summary metrics and health scores are masked as _"Not enough monitored wells"_ to prevent inferring an individual farmer's private extraction patterns.
- **Spatial Weighting**: Village health score is computed as the median of verified well scores in the village, accompanied by the count of active wells and sensor coverage.

---

## 5. Hydrogeologist Verification Checklist

Before publishing regional reports or using JalMaps insights for official policy interventions, hydrogeologists should review this checklist:

- [ ] **Lithology & Aquifer Type Verification**: Check whether the assigned `aquifer_type` matches ground truth geological survey maps. Override `specific_yield` if pumping test data is available.
- [ ] **Sensor Hang Depth Audit**: Confirm that `wells.hang_depth_m` and `wells.total_depth_m` reflect the physical installation to ensure seasonal buffer percentages are accurate.
- [ ] **Well Interference & Clustered Pumping**: Ensure that sudden drawdowns in single wells are not caused by an unmonitored high-capacity agricultural borewell operating 10 metres away.
- [ ] **Data Period Integrity**: Confirm that at least two full monsoon seasons have elapsed before relying on the yearly depletion trend.
- [ ] **Rainfall Gauge Cross-Check**: Compare the estimated monsoon water level rise ($\Delta h$) against block-level IMD rainfall records to distinguish drought-driven drops from extraction-driven drops.
