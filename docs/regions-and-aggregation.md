# Administrative Hierarchy, Aggregation, and Boundary Governance

## 1. Overview & Hierarchy Design

JalMaps models administrative boundaries in India following the official four-tier structure of the Local Government Directory (LGD):

```
State (LGD State Code)
  └── District (LGD District Code)
        └── Block / Sub-District / Taluk (LGD Block Code)
              └── Village / Gram Panchayat (LGD Village Code)
                    └── Well / Borewell (Point in Polygon)
```

Each administrative boundary is stored with:

- `code`: Official Local Government Directory (LGD) census or administrative code.
- `level`: `state` | `district` | `block` | `village`.
- `names`: Multilingual JSONB dictionary storing localized names (e.g. `{"en": "Pune", "mr": "पुणे"}`).
- `boundary`: PostGIS `geometry(MultiPolygon, 4326)` representing full territorial boundaries.
- `boundary_simplified`: PostGIS `geometry(MultiPolygon, 4326)` simplified using Visvalingam / Douglas-Peucker algorithms for fast vector transport in web views.
- `centroid_lat`, `centroid_lng`: Geographic centroid coordinates for bounding box views and initial zooms.

## 2. Open Boundary Data Sources & Licensing Caution

> [!WARNING]
> Official Indian administrative boundaries are subject to the National Map Policy and Survey of India guidelines. Never claim custom or third-party boundaries are official without verification. All ingested boundary files must have their open data licenses audited.

| Data Source                          | Source URL                 | Intended Level                       | License                                               | Verification Notes                                                               |
| ------------------------------------ | -------------------------- | ------------------------------------ | ----------------------------------------------------- | -------------------------------------------------------------------------------- |
| **DataMeet Spatial**                 | `datameet/maps` on GitHub  | State, District                      | Creative Commons Attribution 2.5 India (CC BY 2.5 IN) | Requires explicit attribution to DataMeet contributors.                          |
| **Local Government Directory (LGD)** | `lgd.gov.in`               | LGD Codes & Hierarchies              | Open Government Data (OGD) Platform India             | Primary authority for codes, names, and hierarchical parent-child relationships. |
| **OpenStreetMap India**              | OpenStreetMap contributors | Village boundaries (where available) | Open Database License (ODbL) 1.0                      | Requires "© OpenStreetMap contributors" attribution.                             |

### Import Guidelines

1. Do **not** commit multi-megabyte GeoJSON files directly to git.
2. Ingest boundary datasets locally using the CLI command:
   ```bash
   pnpm geo:import <path-to-geojson-file> --level <state|district|block|village>
   ```
3. Test fixtures reside under `data/geo/fixtures/` and are strictly capped to minimal test polygons.

## 3. Automated Well-to-Area Spatial Assignment

Wells are assigned to an administrative village automatically via PostGIS point-in-polygon assignment:

- **Trigger**: When a well is inserted or its coordinates (`latitude`, `longitude`) are updated without an explicit `admin_area_id`, PostGIS executes:
  ```sql
  SELECT id FROM admin_areas
  WHERE level = 'village'
    AND boundary IS NOT NULL
    AND ST_Contains(boundary, ST_SetSRID(ST_MakePoint(NEW.longitude, NEW.latitude), 4326))
  LIMIT 1;
  ```
- **Fallback**: If coordinates fall slightly outside surveyed village boundaries, nearest centroid spatial search or manual selection is used.

## 4. Privacy Threshold (Differential Privacy & K-Anonymity)

To protect individual farmers from de-anonymization in groundwater statistics:

- **Minimum Sample Size**: Configured to **3 wells** (`MIN_SAMPLE_SIZE = 3`).
- **Anonymity Rule**: For any administrative region with fewer than 3 reporting wells:
  - Average depth, median depth, trend sparklines, and ranking percentiles are withheld.
  - The API and UI display an honest indicator: **"Not enough data to protect privacy"** (`privacyThresholdMessage`).
  - Admins retain access to audit raw aggregates for calibration.
- **Insurers**: Insurers only have access to aggregated statistics (`area_stats`) for permitted regions and cannot access raw well records.

## 5. Aggregation Pipeline & Schedule

Aggregated statistics are materialized in:

- `area_stats`: Current snapshot (wells count, nodes online, avg depth, median depth, % critical, % warning, % offline, 30d change, worst well).
- `area_stats_daily`: Daily historical snapshots for 30-day sparklines and comparative trend analysis.

### Refresh Schedule

- Continuous refresh via scheduled worker or `pg_cron` every **15 minutes**.
- Executed via `REFRESH MATERIALIZED VIEW CONCURRENTLY` or upsert procedures to prevent query locking.
