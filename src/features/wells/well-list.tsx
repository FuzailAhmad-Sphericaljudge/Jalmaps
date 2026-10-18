"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { Droplets, Cylinder, Waves, Fish, Wifi, WifiOff, Clock, Search } from "lucide-react";
import { useTranslations } from "next-intl";

import type { Tables } from "@/lib/db/types";
import { getNodeConnectionState } from "@/lib/wells/status";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";

type Well = Tables<"wells"> & {
  nodes?: Tables<"nodes">[] | null;
};

const WELL_TYPE_ICONS = {
  borewell: Cylinder,
  open_well: Droplets,
  tank: Waves,
  pond: Fish,
} as const;

function WellCard({ well, locale }: { well: Well; locale: string }) {
  const t = useTranslations("wells");
  const Icon = WELL_TYPE_ICONS[well.well_type] ?? Droplets;

  const activeNode = well.nodes?.find((n) => n.status !== "retired" && n.status !== "fault");
  const connectionState = activeNode ? getNodeConnectionState(activeNode, new Date()) : null;

  const statusColorMap: Record<string, string> = {
    planned: "bg-muted text-muted-foreground",
    active: "bg-success-soft text-success",
    inactive: "bg-warning-soft text-warning",
    dry: "bg-orange-100 text-orange-700",
    decommissioned: "bg-danger-soft text-danger",
  };

  const nodeStateColorMap: Record<string, string> = {
    online: "text-success",
    offline: "text-warning",
    never_reported: "text-muted-foreground",
  };

  return (
    <Link
      href={`/${locale}/app/farmer/wells/${well.id}`}
      className={cn(
        "flex items-start gap-4 rounded-xl border border-border bg-surface p-4",
        "hover:bg-surface-hover min-h-[72px] transition-colors focus-visible:outline-2",
        "focus-visible:outline-offset-2 focus-visible:outline-primary",
      )}
    >
      <span
        className="mt-0.5 flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary"
        aria-hidden
      >
        <Icon className="size-5" />
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="truncate font-semibold">{well.name}</span>
          <span
            className={cn(
              "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
              statusColorMap[well.status] ?? "bg-muted text-muted-foreground",
            )}
          >
            {t(`status.${well.status}`)}
          </span>
        </div>
        <p className="mt-0.5 text-sm text-muted-foreground">{t(`wellTypes.${well.well_type}`)}</p>
        {connectionState && (
          <p
            className={cn(
              "mt-1 flex items-center gap-1 text-xs",
              nodeStateColorMap[connectionState],
            )}
          >
            {connectionState === "online" ? (
              <Wifi aria-hidden className="size-3" />
            ) : (
              <WifiOff aria-hidden className="size-3" />
            )}
            {t(`nodeStatus.${connectionState}`)}
            {activeNode?.last_seen_at && connectionState !== "never_reported" && (
              <>
                {" · "}
                <Clock aria-hidden className="size-3" />
                {new Date(activeNode.last_seen_at).toLocaleDateString()}
              </>
            )}
          </p>
        )}
      </div>
    </Link>
  );
}

export function WellList({ wells, locale }: { wells: Well[]; locale: string }) {
  const t = useTranslations("wells");
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");

  const wellTypes = ["all", "borewell", "open_well", "tank", "pond"] as const;

  const filtered = useMemo(() => {
    return wells.filter((w) => {
      const matchesSearch = !search || w.name.toLowerCase().includes(search.toLowerCase());
      const matchesType = typeFilter === "all" || w.well_type === typeFilter;
      return matchesSearch && matchesType;
    });
  }, [wells, search, typeFilter]);

  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="relative">
        <Search
          aria-hidden
          className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
        />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={t("search")}
          aria-label={t("search")}
          className="min-h-12 pl-9"
        />
      </div>

      {/* Type filter tabs */}
      <div role="tablist" aria-label={t("filterType")} className="flex flex-wrap gap-2">
        {wellTypes.map((type) => (
          <button
            key={type}
            role="tab"
            aria-selected={typeFilter === type}
            onClick={() => setTypeFilter(type)}
            className={cn(
              "min-h-10 rounded-full px-4 py-2 text-sm font-medium transition-colors",
              "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary",
              typeFilter === type
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:bg-muted/80",
            )}
          >
            {type === "all" ? t("filterType") : t(`wellTypes.${type}`)}
          </button>
        ))}
      </div>

      {/* Well cards */}
      <ul className="space-y-3" aria-label={t("title")}>
        {filtered.map((well) => (
          <li key={well.id}>
            <WellCard well={well} locale={locale} />
          </li>
        ))}
      </ul>

      {filtered.length === 0 && (
        <p className="py-8 text-center text-sm text-muted-foreground">{t("emptyTitle")}</p>
      )}
    </div>
  );
}
