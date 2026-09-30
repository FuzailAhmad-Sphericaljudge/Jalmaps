import { cn } from "@/lib/utils";

/**
 * JalMaps logo mark: a water drop over a map-pin point.
 * Decorative by default (paired with a visible wordmark); pass a title for
 * standalone use.
 */
export function LogoMark({
  title,
  className,
}: {
  /** Accessible title when used without a wordmark. */
  title?: string;
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 32 32"
      role={title ? "img" : undefined}
      aria-hidden={title ? undefined : true}
      className={cn("size-8", className)}
    >
      {title && <title>{title}</title>}
      {/* Map pin base */}
      <path
        d="M16 29c-6-6.5-9.5-11.3-9.5-16A9.5 9.5 0 0 1 16 3.5 9.5 9.5 0 0 1 25.5 13c0 4.7-3.5 9.5-9.5 16Z"
        className="fill-primary"
      />
      {/* Water drop cutout */}
      <path
        d="M16 7.5c2.8 3.1 4.7 5.6 4.7 8a4.7 4.7 0 0 1-9.4 0c0-2.4 1.9-4.9 4.7-8Z"
        className="fill-primary-foreground"
      />
      {/* Ripple */}
      <path
        d="M11.5 18.5a4.5 4.5 0 0 0 9 0"
        fill="none"
        strokeWidth={1.4}
        strokeLinecap="round"
        className="stroke-primary-foreground/60"
      />
    </svg>
  );
}

/** Wordmark: logo mark + "JalMaps" text. Text is a prop (i18n stub). */
export function Wordmark({ text = "JalMaps", className }: { text?: string; className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      <LogoMark />
      <span className="text-xl font-semibold tracking-tight text-foreground">{text}</span>
    </span>
  );
}
