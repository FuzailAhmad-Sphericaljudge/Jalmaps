"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import { ChevronDown, ChevronUp, ThumbsUp, ThumbsDown } from "lucide-react";
import { AdviceItem } from "@/lib/advisory/engine";
import { WellFacts } from "@/lib/advisory/facts";
import { Button } from "@/components/ui/button";

export function AdviceCard({
  advice,
  facts,
}: {
  wellId: string;
  advice: AdviceItem[];
  facts: WellFacts;
}) {
  const t = useTranslations("advisory");
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [feedback, setFeedback] = useState<Record<string, "helpful" | "not_helpful">>({});

  const toggleExpand = (id: string) => {
    setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleFeedback = (id: string, type: "helpful" | "not_helpful") => {
    setFeedback((prev) => ({ ...prev, [id]: type }));
    // In a real app, this would submit feedback to the server
  };

  return (
    <div className="flex flex-col space-y-4 rounded-xl border bg-card p-6">
      <h3 className="text-lg font-semibold">{t("title")}</h3>

      {advice.map((item) => (
        <div key={item.id} className="rounded-lg border bg-muted/50 p-4">
          <div className="font-medium">
            {/* item.adviceKey is like 'advice.critical_stage_low_water'. Let's assume we mapped keys to just 'critical_stage_low_water' in the JSON */}
            {t(`${item.id}.action` as Parameters<typeof t>[0])}
          </div>

          <button
            onClick={() => toggleExpand(item.id)}
            className="mt-2 flex items-center text-sm text-primary hover:underline"
          >
            {t("why")}
            {expanded[item.id] ? (
              <ChevronUp className="ml-1 h-4 w-4" />
            ) : (
              <ChevronDown className="ml-1 h-4 w-4" />
            )}
          </button>

          {expanded[item.id] && (
            <div className="mt-3 space-y-3 border-t pt-3 text-sm">
              <ul className="list-inside list-disc space-y-1 text-muted-foreground">
                {/* We just list some relevant facts for now */}
                {facts.stressLevel !== "unknown" && (
                  <li>{t("facts.stressLevel", { value: facts.stressLevel })}</li>
                )}
                {facts.depthTrend7d !== 0 && (
                  <li>{t("facts.depthTrend7d", { value: facts.depthTrend7d.toFixed(2) })}</li>
                )}
                {facts.cropWaterSensitivity && (
                  <li>{t("facts.cropWaterSensitivity", { value: facts.cropWaterSensitivity })}</li>
                )}
                {facts.dataQuality !== "good" && (
                  <li>{t("facts.dataQuality", { value: facts.dataQuality })}</li>
                )}
              </ul>

              <div className="flex items-center justify-between pt-2">
                <span className="text-xs text-muted-foreground italic">{t("limits_note")}</span>
                {!feedback[item.id] ? (
                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleFeedback(item.id, "helpful")}
                    >
                      <ThumbsUp className="mr-1 h-3 w-3" />
                      {t("feedback.helpful")}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleFeedback(item.id, "not_helpful")}
                    >
                      <ThumbsDown className="mr-1 h-3 w-3" />
                      {t("feedback.not_helpful")}
                    </Button>
                  </div>
                ) : (
                  <span className="text-xs font-medium text-green-600">{t("feedback.thanks")}</span>
                )}
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
