# Phase 20: Administrative Hierarchy and Aggregation Build Notes

## Overview

Phase 20 enables state-to-well hierarchical drilldown, automated point-in-polygon administrative assignment, materialized regional aggregation with privacy thresholds, ranking tables, choropleth map layers, region comparison, and CSV export.

## Key Deliverables

1. Boundary data pipeline (`pnpm geo:import <file>`) with LGD codes and GeoJSON simplification.
2. Well-to-area PostGIS point-in-polygon trigger and backfill.
3. Materialized regional aggregation (`area_stats`, `area_stats_daily`) with 15-minute refresh.
4. Privacy threshold: k-anonymity minimum sample size (3 wells) masking individual wells.
5. Official drill-down UI at `/[locale]/app/official/regions` with localised breadcrumbs and sparklines.
6. Choropleth metric visualization layer with sequential colorblind-safe palette.
7. Multi-area comparison view (up to 3 regions).
8. Synthetic demo data generator (`pnpm sim:geo-demo`).
9. Full role-level security verification across all tiers.
