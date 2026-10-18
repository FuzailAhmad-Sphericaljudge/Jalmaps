import React from "react";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";

import { ProtectedAppShell } from "@/components/layout/protected-app-shell";
import { isAppLocale, type AppLocale } from "@/i18n/config";
import type { UserRole } from "@/server/auth";
import { requireRole } from "@/server/auth";
import { LazyMap } from "./lazy-map";

export interface MapViewPageProps {
  locale: string;
  role: UserRole;
}

export async function MapViewPage({ locale, role }: MapViewPageProps) {
  if (!isAppLocale(locale)) notFound();

  const current = await requireRole(locale as AppLocale, role);
  const t = await getTranslations({ locale, namespace: "wells.map" });
  const unit = (current.profile.preferred_unit === "ft" ? "ft" : "m") as "m" | "ft";

  return (
    <ProtectedAppShell locale={locale as AppLocale} current={current}>
      <div className="flex h-[calc(100vh-4rem)] flex-col gap-4 p-4 sm:p-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">{t("title")}</h1>
        </div>
        <div className="relative min-h-[500px] flex-1 overflow-hidden rounded-2xl border border-gray-200 shadow-sm">
          <LazyMap locale={locale} unit={unit} />
        </div>
      </div>
    </ProtectedAppShell>
  );
}
