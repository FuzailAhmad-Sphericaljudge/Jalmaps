# JalMaps Groundwater Risk Scoring Model (`risk_v1`)

## 1. Executive Summary

The `risk_v1` model computes an explainable, village-level groundwater stress score (0 to 100) and risk band (`low`, `moderate`, `high`, `critical`) for approved insurers, agricultural lenders, and regional planners.

To honor farmer privacy:

- Scores are computed **strictly from consenting community telemetry** (`profiles.data_sharing_consent = true`).
- A minimum sample threshold of **$N \ge 3$ consenting wells** is enforced at the database level.
- Villages with fewer than 3 consenting wells have their scores withheld (`privacy_masked = true`).
- No individual well depths, owner IDs, coordinates, or exact positions are ever included in risk outputs.

## 2. Model Formula & Component Weights

The composite risk score $S \in [0, 100]$ is computed as a weighted sum of five hydrological components:

$$S = 0.25 C_{\text{history}} + 0.30 C_{\text{depletion}} + 0.20 C_{\text{pre-monsoon}} + 0.15 C_{\text{monsoon}} + 0.10 C_{\text{coverage}}$$

| Component                                               | Weight  | Hydrological Description                                                             | Scale Benchmark (0 to 100)                                                               |
| :------------------------------------------------------ | :------ | :----------------------------------------------------------------------------------- | :--------------------------------------------------------------------------------------- |
| **Level vs Historical Baseline** ($C_{\text{history}}$) | **25%** | Evaluates whether current water level is deeper than the village's long-term median. | $0$ if $\le 0\text{ m}$ deeper; $100$ if $\ge 5\text{ m}$ deeper than historical median. |
| **Annual Depletion Trend** ($C_{\text{depletion}}$)     | **30%** | Annualized drawdown rate (m/year) calculated over rolling 12-month window.           | $0$ if $\le 0\text{ m/yr}$ (rising/stable); $100$ if $\ge 1.5\text{ m/yr}$ depletion.    |
| **Pre-Monsoon Stress** ($C_{\text{pre-monsoon}}$)       | **20%** | Proximity of lowest water table to total well depth before monsoon arrival.          | $0$ if $< 30\%$ depth ratio; $100$ if $\ge 80\%$ of total depth is dry.                  |
| **Monsoon Recovery Deficit** ($C_{\text{monsoon}}$)     | **15%** | Percentage of dry-season drawdown unreplenished by the subsequent monsoon recharge.  | $0$ if $100\%$ replenished; $100$ if $0\%$ replenished.                                  |
| **Observational Coverage** ($C_{\text{coverage}}$)      | **10%** | Observation regularity and active node density across the 90-day evaluation window.  | $0$ if $\ge 90$ valid readings; $100$ if $< 10$ readings (high uncertainty).             |

## 3. Classification Bands

| Score Range  | Risk Band  | Color Code         | Operational Meaning                                                           |
| :----------- | :--------- | :----------------- | :---------------------------------------------------------------------------- |
| **0 – 30**   | `low`      | Green (`#16a34a`)  | Water table stable; healthy monsoon recovery; minimal aquifer stress.         |
| **31 – 60**  | `moderate` | Yellow (`#ca8a04`) | Manageable drawdown; seasonal recovery within historical variance.            |
| **61 – 80**  | `high`     | Orange (`#ea580c`) | Chronic depletion rate; partial monsoon recharge; elevated pump failure risk. |
| **81 – 100** | `critical` | Red (`#dc2626`)    | Severe over-extraction; wells approaching dry threshold; high default risk.   |

## 4. Confidence Levels

Confidence reflects observation density and historical depth:

- **`high`**: $\ge 5$ consenting wells, $\ge 60$ days of history, and $\ge 70\%$ observation coverage.
- **`medium`**: $3 - 4$ consenting wells and $\ge 30$ days of history.
- **`low`**: $< 30$ days of history or intermittent reporting.

## 5. Honest Limitations Notice

> [!WARNING]
> **Indicative Only — Not Formal Underwriting Advice**
> The `risk_v1` score is an indicative macro assessment derived from aggregate IoT water table measurements. It does **not** constitute formal underwriting, credit evaluation, or actuarial pricing advice. It does not measure geological transmissivity, water chemical quality, pump mechanical health, or localized perched aquifers. Users must cross-reference regional CGWB surveys before issuing commercial guarantees.

## 6. Model Changelog

- **v1.0.0 (2026-10-17)**: Initial versioned implementation (`risk_v1`) with 5 weighted components, automated consent filtering, and simulator validation.
