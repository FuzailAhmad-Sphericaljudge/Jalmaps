# Phase 23: Reports and Exports Completion Report

**Status:** Completed & Verified

## Overview

Phase 23 delivers a production-grade reports and exports engine for JalMaps. It enables one-click, localized PDF reports for wells, villages, and districts, structured CSV and Excel exports with data dictionaries, automated scheduled weekly/monthly digests via the Phase 14 notification outbox, and expiring share links, all strictly governed by role access and the $N \ge 3$ privacy threshold.

---

## Deliverables & Work Breakdown

### 1. Spike and Architectural Decision (ADR 0006)

- Evaluated `@react-pdf/renderer` vs. Headless Chromium (Playwright) across all 11 supported Indic scripts.
- Pure JS engines failed OpenType HarfBuzz conjuncts (virama separation and displaced vowel signs).
- Selected Headless Chromium with embedded Google Noto Sans font families for flawless complex-script shaping and print-standard A4 vector rendering.
- Recorded in `docs/adr/0006-pdf-engine-selection.md` and `scripts/reports/spike-pdf-engine.test.ts`.

### 2. Pure Report Data Assembly Service (`src/server/reports/service.ts`)

- Pure, unit-tested data collection functions for Well, Village, District, and Subsidy Planning reports.
- **Privacy Enforcement**: Villages with $< 3$ monitored wells suppress individual well names, coordinates, and depth readings (`privacyMasked: true`).
- **Grounded Metrics**: Subsidy planning recommendations are derived solely from observed recharge rates and depletion slopes, strictly avoiding unmonitored electricity or pumping figures.

### 3. Localized Report Templates & SVG Rendering (`src/server/reports/templates/`)

- Pure HTML/CSS print templates with `@page { size: A4; margin: 15mm; }` and zero third-party map tile dependencies.
- Server-rendered SVG trend sparkline generator (`src/server/reports/templates/charts.ts`).
- Server-rendered SVG simplified administrative boundary outline renderer (`src/server/reports/templates/boundary.ts`).
- Dynamic QR code linking directly to the live dashboard.

### 4. Asynchronous Queue Worker & Supabase Storage (`src/server/reports/worker.ts`)

- Database table `reports` tracking status (`queued`, `running`, `done`, `failed`), retry counters, and storage paths.
- Postgres row-locking job claim RPC `claim_report_jobs(batch_size)` using `FOR UPDATE SKIP LOCKED`.
- Supabase Storage bucket `reports` with signed URLs (1-hour expiry).
- 30-day automatic retention policy.

### 5. CSV and Excel Data Exports (`src/server/reports/export.ts`)

- CSV export prefixed with UTF-8 Byte Order Mark (`\uFEFF`) ensuring Microsoft Excel opens non-Latin Indic scripts correctly.
- Multi-sheet Excel workbook (`exceljs`) containing formatted data sheets and a dedicated "Data dictionary" sheet documenting column definitions, units, and privacy thresholds.

### 6. Scheduled Weekly/Monthly Digests (`src/server/reports/digests.ts`)

- Scheduled digest configurations in `report_schedules`.
- Automated cron runner generating periodic reports and enqueueing events into the Phase 14 notification outbox (`digest` event).
- One-tap unsubscribe link (`/api/reports/unsubscribe`) in every digest message.

### 7. Expiring Report Share Links (`src/server/reports/shares.ts`)

- Cryptographic SHA-256 token hashing (`report_shares.token_hash`).
- Strict 30-day maximum expiration cap.
- Real-time access counter and one-click instant revocation.
- Public resolution route `/share/[token]` with signed redirect.

### 8. In-App Report Centre UI (`src/features/reports/`)

- `ReportCenterView`: Main coordination view with privacy notice, history, and actions.
- `ReportGenerationModal`: Dialog for selecting report type, scope, time period, and output format.
- `ReportHistoryTable`: Interactive table with status badges, download trigger, share modal, and delete actions.
- `ShareLinkModal`: Read-only link display, clipboard copy button, access counter, and revoke button.
- `ScheduledDigestsCard`: Configuration card for weekly/monthly digest schedules across Email and SMS.
- Touch targets $\ge 48\text{px}$ across all interactive elements.

### 9. Dedicated Pages & Role Navigation

- Official Report Centre: `src/app/[locale]/(app)/official/reports/page.tsx`
- Village Report Centre: `src/app/[locale]/(app)/village/reports/page.tsx`
- Navigation item `village-reports` added to `src/features/navigation/nav-config.ts`.

### 10. Localization Across 11 Indic Locales

- Complete translations registered in `src/i18n/messages/{en,hi,pa,mr,gu,bn,ta,te,kn,ml,or}/reports.json`.
- Zero raw JSX text lint errors (`jalmaps/no-raw-jsx-text`).
- Verified with `pnpm check-i18n`.

---

## Verification Summary

| Check                                      | Result | Details                                       |
| :----------------------------------------- | :----- | :-------------------------------------------- |
| **Lint (`pnpm lint`)**                     | Passed | 0 errors                                      |
| **TypeScript (`pnpm typecheck`)**          | Passed | 0 errors                                      |
| **Unit & Integration Tests (`pnpm test`)** | Passed | 108 test files, 482 tests passed              |
| **Accessibility (`axe-core`)**             | Passed | 0 violations (`expectNoAxeViolations`)        |
| **i18n Coverage (`pnpm check-i18n`)**      | Passed | 10 non-English locales 100% matched           |
| **E2E Playwright (`e2e/reports.spec.ts`)** | Passed | Header, modal, history, and digest assertions |
| **Full Suite (`pnpm check`)**              | Passed | Clean green build on `main`                   |
