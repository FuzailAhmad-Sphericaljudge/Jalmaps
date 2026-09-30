import { AlertTriangle, CircleCheck, WifiOff, type LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";

export type WellStatus = "good" | "warning" | "critical" | "offline";

const STATUS_CONFIG: Record<WellStatus, { icon: LucideIcon; classes: string }> = {
  good: {
    icon: CircleCheck,
    classes: "bg-success-soft text-success",
  },
  warning: {
    icon: AlertTriangle,
    classes: "bg-warning-soft text-warning",
  },
  critical: {
    icon: AlertTriangle,
    classes: "bg-danger-soft text-danger",
  },
  offline: {
    icon: WifiOff,
    classes: "bg-offline-soft text-offline",
  },
};

/**
 * Status indicator: icon + text + colour, never colour alone.
 * All wording comes from props (i18n arrives in Phase 3).
 */
export function StatusPill({
  status,
  label,
  className,
}: {
  status: WellStatus;
  /** Human-readable status text, e.g. "Water level good". */
  label: string;
  className?: string;
}) {
  const config = STATUS_CONFIG[status];
  const Icon = config.icon;

  return (
    <span
      data-status={status}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-medium",
        config.classes,
        className,
      )}
    >
      <Icon aria-hidden className="size-4 shrink-0" />
      <span>{label}</span>
    </span>
  );
}
