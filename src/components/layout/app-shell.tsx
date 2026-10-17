"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import {
  Bell,
  ChevronsLeft,
  ChevronsRight,
  Command,
  LogOut,
  Search,
  UserRound,
} from "lucide-react";
import { useLocale, useTranslations } from "next-intl";

import { Wordmark } from "@/components/jalmaps/logo";
import { useTheme, type Theme } from "@/components/theme/theme-context";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { LanguageSwitcher } from "@/components/layout/language-switcher";
import { ConnectivityIndicator } from "@/components/layout/connectivity-indicator";
import { Breadcrumbs } from "@/components/layout/page-scaffolding";
import { getNavItems } from "@/features/navigation/nav-config";
import type { AppLocale } from "@/i18n/config";
import { Link, usePathname, useRouter } from "@/i18n/navigation";
import { RoleNavigation } from "@/components/layout/role-navigation";
import type { UserRole } from "@/server/auth";
import { signOut } from "@/app/[locale]/account/actions";
import { cn } from "@/lib/utils";

const SIDEBAR_COOKIE = "jalmaps-sidebar";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

export function AppShell({
  children,
  role,
  fullName,
  locale,
  initiallyCollapsed,
  preferredTextSize,
  preferredTheme,
}: {
  children: React.ReactNode;
  role: UserRole;
  fullName: string;
  locale: AppLocale;
  initiallyCollapsed: boolean;
  preferredTextSize: "normal" | "large" | "extraLarge";
  preferredTheme: Theme;
}) {
  const t = useTranslations("shell");
  const common = useTranslations("common");
  const pathname = usePathname();
  const router = useRouter();
  const activeLocale = useLocale();
  const { setTheme } = useTheme();
  const items = useMemo(() => getNavItems(role), [role]);
  const [collapsed, setCollapsed] = useState(initiallyCollapsed);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [pending, startTransition] = useTransition();
  const primaryItems = items.filter((item) => item.order < 90);
  const filteredItems = items.filter((item) =>
    t(`nav.${item.labelKey}`)
      .toLocaleLowerCase(activeLocale)
      .includes(query.trim().toLocaleLowerCase(activeLocale)),
  );

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        if (!window.matchMedia("(min-width: 768px)").matches) return;
        event.preventDefault();
        setPaletteOpen(true);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  useEffect(() => {
    const heading = document.querySelector<HTMLElement>("main h1");
    heading?.focus({ preventScroll: true });
  }, [pathname]);

  useEffect(() => {
    document.documentElement.dataset.textSize = preferredTextSize;
    document.cookie = `jalmaps-text-size=${preferredTextSize}; path=/; max-age=${COOKIE_MAX_AGE}; samesite=lax`;
    setTheme(preferredTheme);
  }, [preferredTextSize, preferredTheme, setTheme]);

  function toggleSidebar() {
    setCollapsed((previous) => {
      const next = !previous;
      document.cookie = `${SIDEBAR_COOKIE}=${next ? "collapsed" : "expanded"}; path=/; max-age=${COOKIE_MAX_AGE}; samesite=lax`;
      return next;
    });
  }

  function navigateTo(href: `/${string}`) {
    setPaletteOpen(false);
    setQuery("");
    router.push(href);
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[1500] focus:rounded-md focus:bg-surface focus:px-4 focus:py-3 focus:font-medium focus:ring-2 focus:ring-ring"
      >
        {common("skipToContent")}
      </a>

      <header
        role="banner"
        className="sticky top-0 z-30 border-b border-border bg-background/95 backdrop-blur"
      >
        <div className="flex min-h-16 items-center gap-3 px-4 sm:px-6">
          <Link href={primaryItems[0]?.href ?? "/"} className="rounded-sm focus-visible:outline-2">
            <Wordmark text={common("appName")} />
          </Link>
          <div className="hidden min-w-0 flex-1 md:block">
            <p className="truncate font-semibold">{t("navTitle")}</p>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <div className="hidden lg:block">
              <ConnectivityIndicator />
            </div>
            <Button
              type="button"
              variant="outline"
              size="touch"
              className="hidden lg:inline-flex"
              onClick={() => setPaletteOpen(true)}
            >
              <Search aria-hidden="true" />
              {t("search")}
              <kbd className="ml-2 rounded border px-1.5 py-0.5 text-xs">
                {t("commandShortcut")}
              </kbd>
            </Button>
            <LanguageSwitcher className="hidden sm:inline-flex" />
            <ThemeToggle
              lightLabel={common("theme.light")}
              darkLabel={common("theme.dark")}
              className="hidden sm:inline-flex"
            />
            <Button
              type="button"
              variant="outline"
              size="icon-touch"
              className="relative"
              aria-label={t("notifications")}
            >
              <Bell aria-hidden="true" />
              <span
                aria-hidden="true"
                className="absolute -top-1 -right-1 flex size-5 items-center justify-center rounded-full border border-background bg-primary text-[0.65rem] font-bold text-primary-foreground"
              >
                {t("unreadBadge", { count: 0 })}
              </span>
              <span className="sr-only">{t("unreadCount", { count: 0 })}</span>
            </Button>
            <details className="group relative">
              <summary className="flex h-12 max-w-44 cursor-pointer list-none items-center gap-2 rounded-md border border-border px-3 text-sm font-medium focus-visible:outline-2 focus-visible:outline-ring">
                <UserRound aria-hidden="true" className="size-4 shrink-0" />
                <span className="truncate">{fullName || t("account")}</span>
              </summary>
              <div className="absolute right-0 z-40 mt-2 w-56 rounded-lg border border-border bg-popover p-2 text-popover-foreground shadow-lg">
                <Link
                  href="/account/profile"
                  className="flex min-h-12 items-center gap-2 rounded-md px-3 hover:bg-accent"
                >
                  <UserRound aria-hidden="true" className="size-4" />
                  {t("profile")}
                </Link>
                <Link
                  href="/app/settings"
                  className="flex min-h-12 items-center gap-2 rounded-md px-3 hover:bg-accent"
                >
                  <Command aria-hidden="true" className="size-4" />
                  {t("settings")}
                </Link>
                <form action={signOut.bind(null, locale)}>
                  <button
                    type="submit"
                    className="flex min-h-12 w-full items-center gap-2 rounded-md px-3 text-left hover:bg-accent"
                  >
                    <LogOut aria-hidden="true" className="size-4" />
                    {t("signOut")}
                  </button>
                </form>
              </div>
            </details>
          </div>
        </div>
      </header>

      <div className="flex flex-1">
        <aside
          className={cn(
            "hidden shrink-0 border-r border-border bg-surface transition-[width] duration-200 motion-reduce:transition-none md:block",
            collapsed ? "w-20" : "w-64",
          )}
        >
          <div className="sticky top-16 flex h-[calc(100vh-4rem)] flex-col p-3">
            <RoleNavigation role={role} collapsed={collapsed} />
            <div className="mt-auto border-t border-border pt-3">
              <Button
                type="button"
                variant="outline"
                size="touch"
                className={cn("w-full", collapsed && "px-2")}
                aria-label={collapsed ? t("expandSidebar") : t("collapseSidebar")}
                onClick={toggleSidebar}
              >
                {collapsed ? (
                  <ChevronsRight aria-hidden="true" />
                ) : (
                  <>
                    <ChevronsLeft aria-hidden="true" />
                    {t("collapseSidebar")}
                  </>
                )}
              </Button>
            </div>
          </div>
        </aside>

        <div className="min-w-0 flex-1">
          <div className="mx-auto w-full max-w-7xl px-4 pt-4 sm:px-6 lg:px-8">
            <div
              role="region"
              aria-label={t("workspaceStatus")}
              className="flex items-center justify-between gap-3 md:hidden"
            >
              <ConnectivityIndicator />
              <LanguageSwitcher />
            </div>
            <Breadcrumbs role={role} />
          </div>
          <div className="pb-20 md:pb-0">{children}</div>
        </div>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-surface/95 pb-[env(safe-area-inset-bottom)] shadow-[0_-8px_24px_-18px_rgba(0,0,0,.35)] backdrop-blur md:hidden">
        <RoleNavigation role={role} mobile />
      </div>

      <Dialog open={paletteOpen} onOpenChange={setPaletteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("commandTitle")}</DialogTitle>
            <DialogDescription>{t("commandDescription")}</DialogDescription>
          </DialogHeader>
          <Input
            autoFocus
            className="h-12"
            aria-label={t("search")}
            placeholder={t("search")}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
          <ul className="max-h-72 space-y-1 overflow-y-auto">
            {filteredItems.map((item) => {
              const Icon = item.icon;
              return (
                <li key={item.id}>
                  <button
                    type="button"
                    disabled={pending}
                    onClick={() => startTransition(() => navigateTo(item.href))}
                    className="flex min-h-12 w-full items-center gap-3 rounded-md px-3 text-left hover:bg-accent focus-visible:outline-2 focus-visible:outline-ring"
                  >
                    <Icon aria-hidden="true" className="size-5" />
                    {t(`nav.${item.labelKey}`)}
                  </button>
                </li>
              );
            })}
            {filteredItems.length === 0 ? (
              <li className="p-3 text-sm text-muted-foreground">{t("noDestinations")}</li>
            ) : null}
          </ul>
        </DialogContent>
      </Dialog>
    </div>
  );
}
