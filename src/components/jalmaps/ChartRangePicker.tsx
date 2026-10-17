"use client";

import { useTranslations } from "next-intl";
import type { TimeRangePreset } from "@/lib/series/ranges";
import { Button } from "@/components/ui/button";

interface ChartRangePickerProps {
  value: TimeRangePreset;
  onChange: (value: TimeRangePreset) => void;
}

const PRESETS: TimeRangePreset[] = ["24h", "7d", "30d", "kharif", "rabi", "zaid", "1y"];

export function ChartRangePicker({ value, onChange }: ChartRangePickerProps) {
  const t = useTranslations("history.ranges");

  return (
    <div className="flex flex-wrap gap-2">
      {PRESETS.map((preset) => (
        <Button
          key={preset}
          variant={value === preset ? "default" : "outline"}
          size="sm"
          onClick={() => onChange(preset)}
          className="min-h-[48px]" // 48px touch target rule
        >
          {t(preset)}
        </Button>
      ))}
    </div>
  );
}
