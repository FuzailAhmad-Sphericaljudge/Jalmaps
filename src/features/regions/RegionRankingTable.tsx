"use client";

import React, { useState } from "react";
import Link from "next/link";
import { ArrowUpDown, ChevronRight, Search } from "lucide-react";
import { useTranslations } from "next-intl";
import type { RankedRegionItem } from "@/server/regions/rollups";

interface RegionRankingTableProps {
  regions: RankedRegionItem[];
  locale: string;
  onSelectCompare?: (region: RankedRegionItem) => void;
  selectedCompareIds?: string[];
}

export function RegionRankingTable({
  regions,
  locale,
  onSelectCompare,
  selectedCompareIds = [],
}: RegionRankingTableProps) {
  const t = useTranslations("regions");
  const [searchTerm, setSearchTerm] = useState("");
  const [sortField, setSortField] = useState<"name" | "wells" | "critical" | "depth">("critical");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");

  const filtered = regions.filter((r) => {
    const matchName = r.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchCode = r.code.toLowerCase().includes(searchTerm.toLowerCase());
    return matchName || matchCode;
  });

  const sorted = [...filtered].sort((a, b) => {
    let diff = 0;
    if (sortField === "name") {
      diff = a.name.localeCompare(b.name);
    } else if (sortField === "wells") {
      diff = a.stats.wells_count - b.stats.wells_count;
    } else if (sortField === "critical") {
      diff = (a.stats.pct_critical ?? 0) - (b.stats.pct_critical ?? 0);
    } else if (sortField === "depth") {
      diff = (a.stats.avg_depth_m ?? 0) - (b.stats.avg_depth_m ?? 0);
    }
    return sortDirection === "asc" ? diff : -diff;
  });

  const toggleSort = (field: "name" | "wells" | "critical" | "depth") => {
    if (sortField === field) {
      setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDirection("desc");
    }
  };

  return (
    <div className="space-y-4">
      {/* Search Input */}
      <div className="relative">
        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-muted-foreground">
          <Search className="h-5 w-5" aria-hidden="true" />
        </div>
        <input
          type="search"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder={t("searchPlaceholder")}
          aria-label={t("searchPlaceholder")}
          className="min-h-[48px] w-full rounded-xl border bg-background py-3 pr-4 pl-10 text-sm shadow-sm transition placeholder:text-muted-foreground focus:ring-2 focus:ring-primary focus:outline-none"
        />
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-xl border bg-card shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="border-b bg-muted/40 text-xs font-semibold text-muted-foreground uppercase">
            <tr>
              <th scope="col" className="px-4 py-3">
                <button
                  type="button"
                  onClick={() => toggleSort("name")}
                  className="flex min-h-[48px] items-center gap-1 font-semibold hover:text-foreground"
                >
                  <span>{t("table.region")}</span>
                  <ArrowUpDown className="h-4 w-4" aria-hidden="true" />
                </button>
              </th>
              <th scope="col" className="px-4 py-3 text-right">
                <button
                  type="button"
                  onClick={() => toggleSort("wells")}
                  className="ml-auto flex min-h-[48px] items-center gap-1 font-semibold hover:text-foreground"
                >
                  <span>{t("table.wells")}</span>
                  <ArrowUpDown className="h-4 w-4" aria-hidden="true" />
                </button>
              </th>
              <th scope="col" className="px-4 py-3 text-right">
                <button
                  type="button"
                  onClick={() => toggleSort("depth")}
                  className="ml-auto flex min-h-[48px] items-center gap-1 font-semibold hover:text-foreground"
                >
                  <span>{t("table.avgDepth")}</span>
                  <ArrowUpDown className="h-4 w-4" aria-hidden="true" />
                </button>
              </th>
              <th scope="col" className="px-4 py-3 text-right">
                <button
                  type="button"
                  onClick={() => toggleSort("critical")}
                  className="ml-auto flex min-h-[48px] items-center gap-1 font-semibold hover:text-foreground"
                >
                  <span>{t("table.critical")}</span>
                  <ArrowUpDown className="h-4 w-4" aria-hidden="true" />
                </button>
              </th>
              <th scope="col" className="px-4 py-3 text-center">
                <span className="sr-only">{t("table.actions")}</span>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {sorted.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-8 text-center text-muted-foreground">
                  {t("noRegions")}
                </td>
              </tr>
            ) : (
              sorted.map((item) => {
                const isSelected = selectedCompareIds.includes(item.id);
                return (
                  <tr key={item.id} className="transition-colors hover:bg-muted/30">
                    <td className="px-4 py-3 font-medium">
                      <div className="flex flex-col">
                        <Link
                          href={`/${locale}/official/regions/${item.id}`}
                          className="flex min-h-[48px] items-center text-foreground hover:underline"
                        >
                          {item.name}
                        </Link>
                        <span className="text-xs text-muted-foreground">{item.code}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right font-medium">{item.stats.wells_count}</td>
                    <td className="px-4 py-3 text-right font-medium">
                      {item.isPrivacySuppressed || item.stats.avg_depth_m === null
                        ? t("units.unrecorded")
                        : t("units.meters", { value: item.stats.avg_depth_m.toFixed(1) })}
                    </td>
                    <td className="px-4 py-3 text-right font-semibold">
                      {item.isPrivacySuppressed ? (
                        t("units.unrecorded")
                      ) : (
                        <span className={item.stats.pct_critical > 30 ? "text-rose-600" : ""}>
                          {t("units.percent", { value: (item.stats.pct_critical ?? 0).toFixed(1) })}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex items-center justify-center gap-2">
                        {onSelectCompare && (
                          <button
                            type="button"
                            onClick={() => onSelectCompare(item)}
                            className={`min-h-[48px] min-w-[48px] rounded-lg px-2 text-xs font-semibold transition ${
                              isSelected
                                ? "bg-primary text-primary-foreground"
                                : "border text-muted-foreground hover:bg-muted"
                            }`}
                            aria-label={`${t("actions.compare")} ${item.name}`}
                          >
                            {isSelected ? t("actions.comparing") : t("actions.compare")}
                          </button>
                        )}
                        <Link
                          href={`/${locale}/official/regions/${item.id}`}
                          className="flex min-h-[48px] min-w-[48px] items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground"
                          aria-label={`${t("actions.viewDrilldown")}: ${item.name}`}
                        >
                          <ChevronRight className="h-5 w-5" aria-hidden="true" />
                        </Link>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
