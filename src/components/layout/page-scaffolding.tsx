"use client";

import type { ReactNode } from "react";
import { Fragment } from "react";
import { ChevronRight } from "lucide-react";
import { useTranslations } from "next-intl";

import { Link, usePathname } from "@/i18n/navigation";
import { getNavItems } from "@/features/navigation/nav-config";
import type { UserRole } from "@/server/auth";
import { cn } from "@/lib/utils";

export function PageContainer({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <main
      id="main"
      className={cn(
        "mx-auto w-full max-w-7xl flex-1 px-4 py-6 pb-20 sm:px-6 sm:pb-24 md:pb-8 lg:px-8",
        className,
      )}
    >
      {children}
    </main>
  );
}

export function PageHeader({
  title,
  description,
  actions,
  className,
}: {
  title: string;
  description?: string;
  actions?: ReactNode;
  className?: string;
}) {
  return (
    <header
      className={cn(
        "mb-6 flex flex-col gap-4 border-b border-border pb-5 sm:flex-row sm:items-end sm:justify-between",
        className,
      )}
    >
      <div>
        <h1 tabIndex={-1} className="text-3xl font-semibold tracking-tight">
          {title}
        </h1>
        {description ? <p className="mt-2 max-w-2xl text-muted-foreground">{description}</p> : null}
      </div>
      {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
    </header>
  );
}

export function Section({
  title,
  description,
  children,
  className,
}: {
  title: string;
  description?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("space-y-4", className)}>
      <header>
        <h2 className="text-xl font-semibold">{title}</h2>
        {description ? <p className="mt-1 text-muted-foreground">{description}</p> : null}
      </header>
      {children}
    </section>
  );
}

export function Breadcrumbs({ role }: { role: UserRole }) {
  const t = useTranslations("shell");
  const pathname = usePathname();
  const items = getNavItems(role);
  const current = [...items]
    .filter((item) => pathname === item.href || pathname.startsWith(`${item.href}/`))
    .sort((left, right) => right.href.length - left.href.length)[0];
  const root = items.find((item) => item.href.split("/").length === 2);

  if (!current) return null;
  const crumbs = root && current.id !== root.id ? [root, current] : [current];

  return (
    <nav aria-label={t("breadcrumbs")} className="mb-5 text-sm text-muted-foreground">
      <ol className="flex flex-wrap items-center gap-2">
        {crumbs.map((item, index) => (
          <Fragment key={item.id}>
            {index > 0 ? <ChevronRight aria-hidden="true" className="size-4" /> : null}
            <li>
              {index === crumbs.length - 1 ? (
                <span aria-current="page" className="font-medium text-foreground">
                  {t(`nav.${item.labelKey}`)}
                </span>
              ) : (
                <Link href={item.href} className="rounded-sm underline-offset-4 hover:underline">
                  {t(`nav.${item.labelKey}`)}
                </Link>
              )}
            </li>
          </Fragment>
        ))}
      </ol>
    </nav>
  );
}
