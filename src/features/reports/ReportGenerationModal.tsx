"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { FileText, Table, FileSpreadsheet, Sparkles, Loader2, X, Check } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { generateReportAction, type ReportRow } from "@/server/reports/actions";

interface ReportGenerationModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultType?: "well" | "village" | "district" | "subsidy_planning";
  defaultScope?: { wellId?: string; villageId?: string; districtId?: string; name?: string };
  locale: string;
  onReportGenerated?: (report: ReportRow) => void;
}

export function ReportGenerationModal({
  isOpen,
  onClose,
  defaultType = "village",
  defaultScope = {},
  locale,
  onReportGenerated,
}: ReportGenerationModalProps) {
  const t = useTranslations("reports");

  const [type, setType] = useState<"well" | "village" | "district" | "subsidy_planning">(
    defaultType,
  );
  const [format, setFormat] = useState<"pdf" | "csv" | "xlsx">("pdf");
  const [period, setPeriod] = useState<"7d" | "30d" | "90d" | "1y">("30d");
  const [targetId, setTargetId] = useState<string>(
    defaultScope.villageId ?? defaultScope.wellId ?? defaultScope.districtId ?? "",
  );
  const [targetName, setTargetName] = useState<string>(defaultScope.name ?? "");
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const getPeriodDays = (p: "7d" | "30d" | "90d" | "1y"): number => {
    switch (p) {
      case "7d":
        return 7;
      case "30d":
        return 30;
      case "90d":
        return 90;
      case "1y":
        return 365;
    }
  };

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsGenerating(true);
    setError(null);

    const scope: Record<string, string> = {};
    if (type === "well") scope.wellId = targetId || defaultScope.wellId || "well-1";
    if (type === "village") scope.villageId = targetId || defaultScope.villageId || "vil-1";
    if (type === "district") scope.districtId = targetId || defaultScope.districtId || "dist-1";
    if (type === "subsidy_planning")
      scope.districtId = targetId || defaultScope.districtId || "dist-1";

    try {
      const res = await generateReportAction({
        type,
        format,
        scope,
        params: {
          locale,
          unit: "m",
          periodDays: getPeriodDays(period),
          includeQualityNotes: true,
        },
      });

      if (res.success && res.report) {
        if (onReportGenerated) {
          onReportGenerated(res.report as ReportRow);
        }
        onClose();
      } else {
        setError(res.error ?? "Failed to generate report");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to generate report");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            <span>{t("generateReport")}</span>
          </DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground">
            {t("subtitle")}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleGenerate} className="space-y-4 pt-2">
          {/* Report Type */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
              {t("reportType")}
            </label>
            <Select
              value={type}
              onValueChange={(val) =>
                setType(val as "well" | "village" | "district" | "subsidy_planning")
              }
            >
              <SelectTrigger aria-label={t("reportType")} className="h-12 min-h-[48px] w-full">
                <SelectValue placeholder={t("selectType")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="well">{t("types.well")}</SelectItem>
                <SelectItem value="village">{t("types.village")}</SelectItem>
                <SelectItem value="district">{t("types.district")}</SelectItem>
                <SelectItem value="subsidy_planning">{t("types.subsidy_planning")}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Area / Scope identifier */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
              {t("scope")}
            </label>
            <Input
              type="text"
              value={targetName || targetId}
              onChange={(e) => {
                setTargetName(e.target.value);
                setTargetId(e.target.value);
              }}
              placeholder={t("selectScope")}
              className="h-12 min-h-[48px]"
              aria-label={t("scope")}
            />
          </div>

          {/* Period & Format Grid */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                {t("period")}
              </label>
              <Select
                value={period}
                onValueChange={(val) => setPeriod(val as "7d" | "30d" | "90d" | "1y")}
              >
                <SelectTrigger aria-label={t("period")} className="h-12 min-h-[48px] w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7d">{t("periods.7d")}</SelectItem>
                  <SelectItem value="30d">{t("periods.30d")}</SelectItem>
                  <SelectItem value="90d">{t("periods.90d")}</SelectItem>
                  <SelectItem value="1y">{t("periods.1y")}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                {t("format")}
              </label>
              <Select
                value={format}
                onValueChange={(val) => setFormat(val as "pdf" | "csv" | "xlsx")}
              >
                <SelectTrigger aria-label={t("format")} className="h-12 min-h-[48px] w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pdf">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-rose-500" />
                      <span>{t("formats.pdf")}</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="csv">
                    <div className="flex items-center gap-2">
                      <Table className="h-4 w-4 text-emerald-500" />
                      <span>{t("formats.csv")}</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="xlsx">
                    <div className="flex items-center gap-2">
                      <FileSpreadsheet className="h-4 w-4 text-blue-500" />
                      <span>{t("formats.xlsx")}</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Preview Summary Card */}
          <div className="space-y-1.5 rounded-lg border border-border/70 bg-muted/30 p-3.5 text-xs">
            <div className="flex items-center justify-between font-semibold text-foreground">
              <span>{t("previewSummary")}</span>
              <span className="rounded bg-primary/10 px-1.5 py-0.5 font-mono text-[11px] text-primary uppercase">
                {format.toUpperCase()}
              </span>
            </div>
            <p className="text-muted-foreground">
              {t(`types.${type}`)}
              {" • "}
              {t(`periods.${period}`)}
            </p>
            <p className="text-[11px] text-muted-foreground italic">{t("privacyNotice")}</p>
          </div>

          {error && (
            <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-xs text-destructive">
              <span>{error}</span>
            </div>
          )}

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-2 border-t border-border/60 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isGenerating}
              className="h-12 min-h-[48px] px-4"
            >
              <X className="mr-1.5 h-4 w-4" />
              <span>{t("actions.cancel")}</span>
            </Button>
            <Button type="submit" disabled={isGenerating} className="h-12 min-h-[48px] px-5">
              {isGenerating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  <span>{t("generating")}</span>
                </>
              ) : (
                <>
                  <Check className="mr-2 h-4 w-4" />
                  <span>{t("actions.confirm")}</span>
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
