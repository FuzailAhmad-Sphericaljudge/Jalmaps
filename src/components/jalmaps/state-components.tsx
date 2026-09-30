import { AlertTriangle, Loader2, WifiOff, type LucideIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

function StateShell({
  icon: Icon,
  title,
  description,
  action,
  className,
}: {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: { label: string; onClick: () => void };
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex min-h-48 flex-col items-center justify-center gap-3 rounded-lg border border-border bg-surface p-6 text-center",
        className,
      )}
    >
      <Icon aria-hidden className="size-8 text-foreground-muted" />
      <p className="text-base font-semibold">{title}</p>
      {description && <p className="max-w-xs text-sm text-foreground-muted">{description}</p>}
      {action && (
        <Button variant="outline" size="touch" onClick={action.onClick}>
          {action.label}
        </Button>
      )}
    </div>
  );
}

/** Nothing to show yet (e.g. no wells registered). */
export function EmptyState(props: {
  title: string;
  description?: string;
  action?: { label: string; onClick: () => void };
  className?: string;
}) {
  return <StateShell icon={WifiOff} {...props} />;
}

/** A request or action failed; offers retry. */
export function ErrorState(props: {
  title: string;
  description?: string;
  action?: { label: string; onClick: () => void };
  className?: string;
}) {
  return <StateShell icon={AlertTriangle} {...props} />;
}

/** Inline loading state with an accessible spinner and label. */
export function LoadingState({
  label,
  className,
}: {
  /** e.g. "Loading water level". Announced by screen readers. */
  label: string;
  className?: string;
}) {
  return (
    <div
      role="status"
      aria-label={label}
      className={cn("flex items-center justify-center gap-3 p-6", className)}
    >
      <Loader2 aria-hidden className="size-6 animate-spin text-primary" />
      <span className="text-sm text-foreground-muted">{label}</span>
    </div>
  );
}

/** Skeleton block placeholder with an accessible loading name. */
export function LoadingSkeleton({ label, className }: { label: string; className?: string }) {
  return <Skeleton statusLabel={label} className={cn("h-24 w-full", className)} />;
}
