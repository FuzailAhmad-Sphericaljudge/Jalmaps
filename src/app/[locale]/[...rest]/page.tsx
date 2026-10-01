import { notFound } from "next/navigation";

/**
 * Catch-all under the locale segment: any unknown path under `/en/...` or
 * `/hi/...` renders the localized `not-found.tsx`. Real routes are added as
 * siblings of this file in later phases.
 */
export default function CatchAllPage() {
  notFound();
}
