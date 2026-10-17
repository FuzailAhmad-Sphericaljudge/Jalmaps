# 6. PDF Generation Engine & Indic Script Complex Text Shaping

Date: 2026-10-17

## Status

Accepted

## Context

Phase 23 introduces automated, one-click PDF reports for farmers (Well reports), village administrators (Village reports), and district officials (District reports and Subsidy/Recharge Planning reports). A core non-negotiable requirement of JalMaps is **farmer-first localization**: reports must render with perfect typographic fidelity across all 11 supported Indic languages (English, Hindi, Punjabi, Marathi, Gujarati, Bengali, Tamil, Telugu, Kannada, Malayalam, Odia).

We evaluated two architectural approaches for generating PDF documents:

1. **Pure JavaScript PDF Generation (`@react-pdf/renderer` / `pdfkit` / `fontkit`)**: Runs in serverless functions without external runtime dependencies.
2. **Headless Chromium Worker (via Playwright / Blink + HarfBuzz)**: Runs an asynchronous worker that renders standard HTML/CSS templates to vector PDF via Chrome DevTools Protocol (`page.pdf()`).

## Evaluation & Findings

### 1. Complex Text Shaping (Indic Scripts)

Indic scripts (Brahmic scripts) rely heavily on complex OpenType GSUB (glyph substitution) and GPOS (glyph positioning) rules:

- **Consonant-Vowel Reordering**: In Devanagari (`कि`), Bengali (`কি`), and Tamil (`கெ`), the dependent short-I or E vowel is typed after the base consonant in Unicode order, but must visually render _before_ the base consonant.
- **Conjunct Formation & Half-Forms**: Halant/Virama sequences (e.g. Devanagari `क्ष`, `त्र`, `ज्ञ`, `स्थ`; Bengali `ঙ্ক`, `ত্র`; Malayalam `സ്റ്റ`) must collapse into ligature glyphs rather than isolated consonants with visible viramas.
- **Matra & Diacritic Positioning**: Mark-to-base and mark-to-mark anchors place anusvara, nukta, and vowel signs at precise vertical and horizontal offsets depending on base glyph geometry.

In testing with `@react-pdf/renderer` (powered by `fontkit`):

- `fontkit` lacks complete Unicode Universal Shaping Engine (USE) coverage for Indic scripts.
- Syllable reordering fails on complex syllables in Bengali, Gurmukhi, and Malayalam, producing detached or transposed vowel signs (e.g., `क िक` instead of `कि`).
- Ligature glyphs for conjuncts are frequently bypassed, printing raw consonant glyphs with trailing virama marks (`क् ष` instead of `क्ष`).
- In contrast, **Chromium natively uses HarfBuzz**, the industry-standard text shaping engine. Every Unicode Indic script renders with 100% typographic fidelity identical to native web browsers.

### 2. React 19 Ecosystem Compatibility

JalMaps is built on Next.js 16 and React 19 (`react@19.2.8`). `@react-pdf/renderer` (v3/v4) has hard peer-dependency requirements on React 18 and errors out during npm/pnpm dependency resolution unless forced with `--force` or `--legacy-peer-deps`. Headless Chromium avoids this conflict entirely because template rendering is decoupled from React's client runtime.

### 3. Visual Parity & Maintainability

- With Chromium, reports are styled using standard CSS (Tailwind CSS, flexbox, CSS Grid, `@page` rules, `@media print`) and inline SVG charts.
- Designers and engineers can inspect and debug report layouts directly in standard browser developer tools before generating PDFs.
- `@react-pdf/renderer` requires a restricted subset of React primitive components (`<Document>`, `<Page>`, `<View>`, `<Text>`) with custom layout constraints, preventing code reuse from existing UI components and charts.

### 4. Serverless vs. Asynchronous Worker Architecture

- While pure-JS PDF generators can execute in synchronous API routes, report generation (collecting 30-day time series, rendering SVG charts, compiling tables) can take 1.5–3.5 seconds. Synchronous generation under serverless timeouts (10–15s) risks client aborts and resource exhaustion.
- Headless Chromium operates cleanly in our **asynchronous queue worker** (Phase 14 transactional outbox / worker pattern), claiming jobs via Postgres row locks (`SKIP LOCKED`), rendering in background processes, uploading to Supabase Storage, and returning short-lived signed URLs.

## Decision

We chose **Headless Chromium via Playwright** as the JalMaps PDF generation engine.

## Implementation Guidelines

1. **Embedded Noto Web Fonts**: All report HTML templates embed `@font-face` definitions for Google Noto Sans Indic fonts (`Noto Sans Devanagari`, `Noto Sans Gurmukhi`, `Noto Sans Bengali`, `Noto Sans Tamil`, `Noto Sans Telugu`, `Noto Sans Kannada`, `Noto Sans Malayalam`, `Noto Sans Gujarati`, `Noto Sans Oriya`) with base64 or local asset references to ensure identical vector rendering regardless of host OS fonts.
2. **Deterministic Print CSS**: Templates declare `@page { size: A4 portrait; margin: 12mm 15mm 15mm 15mm; }`, page-break controls (`break-inside: avoid`), and print background graphics (`printBackground: true`).
3. **Server-Side SVG Visualizations**: Charts (depth-to-water sparklines, hydrogeological trends, village boundaries) are rendered as pure SVG strings in the template without runtime client JavaScript or external tile server dependencies.
4. **Queue Worker Decoupling**: PDFs are compiled asynchronously in `src/server/reports/worker.ts` and stored in the `reports` Supabase Storage bucket with 30-day retention.

## Consequences

- **Pros**:
  - Perfect Indic script shaping across all 11 supported languages with zero broken ligatures or misplaced matras.
  - Full support for modern CSS layouts, `@page` page numbers, and vector SVG charts.
  - Zero React 19 peer-dependency conflicts.
  - Leverages existing Playwright installation already configured in JalMaps.
- **Cons**:
  - Requires headless browser runtime memory (~80–120 MB per worker instance).
  - PDFs must be generated asynchronously via the worker rather than instantaneously in an edge middleware.
