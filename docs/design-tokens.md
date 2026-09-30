# JalMaps design tokens

Source of truth: `src/app/globals.css`. Values are oklch; Tailwind maps them via
`@theme inline` into utilities (`bg-surface`, `text-foreground-muted`, `bg-danger`, ...).
Light values live on `:root`, dark overrides on `.dark` (class on `<html>`, set pre-paint
by `src/components/theme/theme-script.ts` — no flash).

## Semantic colours

| Token                        | Light (oklch)    | Dark (oklch)     | Use                                    |
| ---------------------------- | ---------------- | ---------------- | -------------------------------------- |
| `--color-background`         | `0.985 0.005 95` | `0.2 0.015 240`  | Page background                        |
| `--color-surface`            | `1 0 0`          | `0.26 0.018 240` | Cards, sheets, dialogs                 |
| `--color-surface-muted`      | `0.96 0.008 95`  | `0.31 0.018 240` | Muted panels, table headers            |
| `--color-foreground`         | `0.24 0.02 80`   | `0.95 0.008 95`  | Primary text                           |
| `--color-foreground-muted`   | `0.44 0.02 80`   | `0.78 0.012 95`  | Secondary text                         |
| `--color-border`             | `0.88 0.012 85`  | `0.38 0.02 240`  | Borders, separators, inputs            |
| `--color-primary`            | `0.52 0.09 220`  | `0.75 0.1 210`   | Water blue/teal; primary actions       |
| `--color-primary-foreground` | `0.99 0.005 220` | `0.18 0.03 220`  | Text on primary                        |
| `--color-primary-soft`       | `0.93 0.03 220`  | `0.32 0.045 220` | Selected states, soft fills            |
| `--color-success`            | `0.5 0.12 150`   | `0.75 0.13 155`  | Good status (with icon + text)         |
| `--color-success-foreground` | `0.99 0.01 150`  | `0.18 0.04 155`  | Text on success                        |
| `--color-success-soft`       | `0.94 0.05 150`  | `0.32 0.055 155` | Status pill backgrounds                |
| `--color-warning`            | `0.45 0.11 75`   | `0.8 0.13 85`    | Warning status (darkened amber for AA) |
| `--color-warning-foreground` | `0.99 0.01 75`   | `0.2 0.04 75`    | Text on warning                        |
| `--color-warning-soft`       | `0.95 0.06 85`   | `0.34 0.055 80`  | Status pill backgrounds                |
| `--color-danger`             | `0.52 0.17 25`   | `0.72 0.15 25`   | Critical status                        |
| `--color-danger-foreground`  | `0.99 0.005 25`  | `0.18 0.04 25`   | Text on danger                         |
| `--color-danger-soft`        | `0.94 0.045 25`  | `0.33 0.06 25`   | Status pill backgrounds                |
| `--color-offline`            | `0.42 0.015 260` | `0.72 0.01 260`  | Offline/grey status                    |
| `--color-offline-foreground` | `0.99 0.005 260` | `0.2 0.01 260`   | Text on offline                        |
| `--color-offline-soft`       | `0.93 0.008 260` | `0.32 0.012 260` | Status pill backgrounds                |

Contrast rule: status text is either the status colour on `background`/`soft` (tested
≥ 4.5:1) or `*-foreground` on the status colour (≥ 4.5:1). Never rely on colour alone —
pair with icon + text (see `docs/design-system.md`).

## Type scale

`--text-xs 0.75rem`, `sm 0.875rem`, `base 1rem`, `lg 1.125rem`, `xl 1.375rem`,
`2xl 1.75rem`, `3xl 2.25rem`. Base body text is `base` or larger; data values use `2xl`/`3xl`.

## Spacing

Tailwind's default 4px scale. Farmer-first rule: interactive elements are ≥ 48px
(`h-12 min-w-12`); the Button `touch` size and all icon buttons enforce this.

## Radii, shadows, z-index, breakpoints

- Radii: `--radius-sm 0.25rem`, `md 0.5rem`, `lg 0.75rem`, `xl 1.25rem`.
- Shadows: `--shadow-sm/md/lg` (subtle; no heavy elevation).
- z-index scale: `--z-dropdown 1000`, `sticky 1100`, `overlay 1200`, `modal 1300`,
  `toast 1400`.
- Breakpoints: Tailwind defaults (`sm 640px`, `md 768px`, `lg 1024px`, `xl 1280px`).

## Motion

`prefers-reduced-motion: reduce` collapses all animations/transitions globally. Components
must remain fully usable without animation (e.g. WellTank water level becomes static).
