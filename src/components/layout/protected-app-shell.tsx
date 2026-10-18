import { cookies } from "next/headers";

import { AppShell } from "@/components/layout/app-shell";
import type { AppLocale } from "@/i18n/config";
import { settingsSchema } from "@/lib/schemas/settings";
import type { AuthenticatedUser } from "@/server/auth";

export async function ProtectedAppShell({
  children,
  current,
  locale,
}: {
  children: React.ReactNode;
  current: AuthenticatedUser & { profile: NonNullable<AuthenticatedUser["profile"]> };
  locale: AppLocale;
}) {
  const cookieStore = await cookies();
  const initiallyCollapsed = cookieStore.get("jalmaps-sidebar")?.value === "collapsed";
  const preferredTextSize = settingsSchema.shape.text_size.safeParse(
    current.profile.preferred_text_size,
  );
  const preferredTheme = settingsSchema.shape.theme.safeParse(current.profile.preferred_theme);

  return (
    <AppShell
      role={current.profile.role}
      fullName={current.profile.full_name ?? ""}
      locale={locale}
      initiallyCollapsed={initiallyCollapsed}
      preferredTextSize={preferredTextSize.success ? preferredTextSize.data : "normal"}
      preferredTheme={preferredTheme.success ? preferredTheme.data : "system"}
    >
      {children}
    </AppShell>
  );
}
