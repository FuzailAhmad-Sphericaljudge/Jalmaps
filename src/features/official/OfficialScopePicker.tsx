"use client";

import { useTranslations } from "next-intl";
import { MapPin, ChevronDown } from "lucide-react";
import type { AllowedAreaItem } from "@/server/official/service";

interface OfficialScopePickerProps {
  allowedAreas: AllowedAreaItem[];
  selectedAreaId?: string;
  onSelectArea: (areaId?: string) => void;
}

export function OfficialScopePicker({
  allowedAreas,
  selectedAreaId,
  onSelectArea,
}: OfficialScopePickerProps) {
  const t = useTranslations("official");

  return (
    <div className="flex items-center gap-2">
      <div className="relative inline-flex items-center">
        <MapPin className="pointer-events-none absolute left-3 h-4 w-4 text-muted-foreground" />
        <select
          aria-label={t("scope.label")}
          value={selectedAreaId || ""}
          onChange={(e) => onSelectArea(e.target.value || undefined)}
          className="min-h-[44px] cursor-pointer appearance-none rounded-xl border border-border/80 bg-background py-2 pr-9 pl-9 text-xs font-medium text-foreground shadow-xs hover:border-primary/50 focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none"
        >
          <option value="">{t("scope.allAreas")}</option>
          {allowedAreas.map((area) => (
            <option key={area.id} value={area.id}>
              {area.name} ({area.level})
            </option>
          ))}
        </select>
        <ChevronDown className="pointer-events-none absolute right-3 h-4 w-4 text-muted-foreground" />
      </div>
    </div>
  );
}
