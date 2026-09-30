import { cn } from "cn";

/**
 * Skeleton placeholder. Wrap content in `role="status"` so screen readers
 * announce loading; provide the accessible name via `aria-label` (i18n stub:
 * labels come from props, per design-system rules).
 */
function Skeleton({
  className,
  status = true,
  statusLabel,
  ...props
}: React.ComponentProps<"div"> & {
  /** Render an accessible `role="status"` wrapper. Default true. */
  status?: boolean;
  /** Accessible name announced while loading (e.g. "Loading levels"). */
  statusLabel?: string;
}) {
  const skeleton = (
    <div
      data-slot="skeleton"
      aria-hidden={status ? true : undefined}
      className={cn("animate-pulse rounded-md bg-muted", className)}
      {...props}
    />
  );

  if (!status) return skeleton;

  return (
    <div role="status" aria-label={statusLabel} aria-busy="true">
      {skeleton}
    </div>
  );
}

export { Skeleton };
