import { createNavigation } from "next-intl/navigation";

import { routing } from "./routing";

/**
 * Locale-aware navigation. Always import `Link`, `redirect`, `useRouter`,
 * `usePathname` and `getPathname` from here — never from `next/link` — so
 * navigation keeps the active `/en` or `/hi` prefix.
 */
export const { Link, redirect, usePathname, useRouter, getPathname } = createNavigation(routing);
