import type { Metadata } from "next";

import { DesignSystemGallery } from "@/components/ui-gallery/design-system-gallery";

export const metadata: Metadata = {
  title: "JalMaps — Design system",
  description: "Internal component gallery (not available in production).",
  robots: { index: false, follow: false },
};

/**
 * Component gallery — enabled outside production only.
 * Set NODE_ENV=production (the default for `next start` in prod builds) to disable.
 */
export default function DesignSystemPage() {
  if (process.env.NODE_ENV === "production") {
    return (
      <main className="mx-auto max-w-md p-8">
        <h1 className="text-xl font-semibold">Not available</h1>
        <p className="text-foreground-muted">
          The design system gallery is only enabled outside production.
        </p>
      </main>
    );
  }

  return (
    <main className="min-h-screen">
      <DesignSystemGallery />
    </main>
  );
}
