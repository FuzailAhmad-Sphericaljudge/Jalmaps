"use client";

import React from "react";
import Link from "next/link";
import { ChevronRight, Home } from "lucide-react";
import { useTranslations } from "next-intl";

export interface BreadcrumbItem {
  id: string;
  name: string;
  level: string;
}

interface RegionBreadcrumbsProps {
  items: BreadcrumbItem[];
  locale: string;
}

export function RegionBreadcrumbs({ items, locale }: RegionBreadcrumbsProps) {
  const t = useTranslations("regions");

  return (
    <nav aria-label={t("title")} className="flex items-center overflow-x-auto py-2 text-sm">
      <ol className="flex items-center gap-1">
        <li className="flex items-center">
          <Link
            href={`/${locale}/official/regions`}
            className="flex min-h-[48px] min-w-[48px] items-center justify-center rounded-lg px-2 text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
            aria-label={t("allStates")}
          >
            <Home className="h-4 w-4" aria-hidden="true" />
            <span className="ml-1.5 font-medium">{t("allStates")}</span>
          </Link>
        </li>

        {items.map((item, index) => {
          const isLast = index === items.length - 1;
          return (
            <li key={item.id} className="flex items-center">
              <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
              {isLast ? (
                <span
                  aria-current="page"
                  className="flex min-h-[48px] items-center px-2 font-semibold text-foreground"
                >
                  {item.name}
                </span>
              ) : (
                <Link
                  href={`/${locale}/official/regions/${item.id}`}
                  className="flex min-h-[48px] items-center rounded-lg px-2 text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                >
                  {item.name}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
