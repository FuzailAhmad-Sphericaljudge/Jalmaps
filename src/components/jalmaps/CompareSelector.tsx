"use client";

import { useTranslations } from "next-intl";

interface CompareSelectorProps {
  otherWells: { id: string; name: string }[];
  selectedIds: string[];
  onChange: (ids: string[]) => void;
}

export function CompareSelector({ otherWells, selectedIds, onChange }: CompareSelectorProps) {
  const t = useTranslations("history");

  if (otherWells.length === 0) return null;

  const toggle = (id: string) => {
    if (selectedIds.includes(id)) {
      onChange(selectedIds.filter((x) => x !== id));
    } else {
      if (selectedIds.length < 3) {
        onChange([...selectedIds, id]);
      }
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-2 text-sm">
      <span className="text-muted-foreground">
        {t("compareWith", { fallback: "Compare with" })}
        {":"}
      </span>
      {otherWells.map((well) => {
        const isSelected = selectedIds.includes(well.id);
        const isDisabled = !isSelected && selectedIds.length >= 3;
        return (
          <button
            key={well.id}
            onClick={() => toggle(well.id)}
            disabled={isDisabled}
            className={`rounded-full border px-3 py-1 transition-colors ${
              isSelected
                ? "border-primary bg-primary text-primary-foreground"
                : isDisabled
                  ? "cursor-not-allowed border-border text-muted-foreground opacity-50"
                  : "border-border hover:bg-muted"
            }`}
          >
            {well.name}
          </button>
        );
      })}
    </div>
  );
}
