"use client";

import { useTranslations } from "next-intl";

import { getNavItems } from "@/features/navigation/nav-config";
import { Link, usePathname } from "@/i18n/navigation";
import type { UserRole } from "@/server/auth";
import { cn } from "@/lib/utils";

export function RoleNavigation({
  role,
  mobile = false,
  collapsed = false,
}: {
  role: UserRole;
  mobile?: boolean;
  collapsed?: boolean;
}) {
  const t = useTranslations("shell");
  const pathname = usePathname();
  const items = getNavItems(role).filter((item) => !mobile || item.order < 90);

  return (
    <nav
      aria-label={t("primaryNavigation")}
      data-testid={mobile ? "mobile-navigation" : "desktop-navigation"}
    >
      <ul className={cn(mobile ? "flex h-14 items-stretch justify-around" : "flex flex-col gap-1")}>
        {items.map((item) => {
          const Icon = item.icon;
          const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <li key={item.id} className={mobile ? "min-w-0 flex-1" : undefined}>
              <Link
                href={item.href}
                aria-current={active ? "page" : undefined}
                title={collapsed ? t(`nav.${item.labelKey}`) : undefined}
                className={cn(
                  mobile
                    ? "flex h-14 flex-col items-center justify-center gap-1 border-t-2 px-1 text-[0.68rem] leading-none font-medium focus-visible:outline-2 focus-visible:outline-ring"
                    : "flex min-h-12 items-center gap-3 rounded-lg px-3 font-medium transition-colors hover:bg-accent focus-visible:outline-2 focus-visible:outline-ring",
                  active &&
                    (mobile
                      ? "border-primary bg-primary-soft text-foreground"
                      : "bg-primary-soft font-semibold text-foreground ring-1 ring-primary/40"),
                  !active && mobile && "border-transparent text-muted-foreground",
                  collapsed && !mobile && "justify-center px-2",
                )}
              >
                <Icon aria-hidden="true" className="size-5 shrink-0" />
                {!collapsed || mobile ? (
                  <span className={mobile ? "max-w-full truncate" : undefined}>
                    {t(`nav.${item.labelKey}`)}
                  </span>
                ) : null}
                {active && mobile ? <span className="sr-only">{t("currentPage")}</span> : null}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
