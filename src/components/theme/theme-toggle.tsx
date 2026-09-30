"use client";

import { Moon, Sun } from "lucide-react";

import { useTheme } from "./theme-context";

/**
 * Manual theme toggle. Icon + text (never icon alone), 48px touch target.
 * Labels are props so i18n can supply them in Phase 3.
 */
export function ThemeToggle({
  lightLabel = "Light",
  darkLabel = "Dark",
}: {
  lightLabel?: string;
  darkLabel?: string;
}) {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === "dark";

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-pressed={isDark}
      className="inline-flex h-12 min-w-12 items-center justify-center gap-2 rounded-md border border-border bg-surface px-3 text-sm font-medium text-foreground transition-colors hover:bg-surface-muted"
    >
      {isDark ? <Moon aria-hidden className="size-4" /> : <Sun aria-hidden className="size-4" />}
      <span>{isDark ? darkLabel : lightLabel}</span>
    </button>
  );
}
