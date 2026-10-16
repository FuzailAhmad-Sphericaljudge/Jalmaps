"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { FileText, Plus, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ReportGenerationModal } from "./ReportGenerationModal";
import { ReportHistoryTable } from "./ReportHistoryTable";
import { ShareLinkModal } from "./ShareLinkModal";
import { ScheduledDigestsCard } from "./ScheduledDigestsCard";
import {
  getReportDownloadUrlAction,
  deleteReportAction,
  type ReportRow,
  type ScheduleRow,
} from "@/server/reports/actions";

interface ReportCenterViewProps {
  initialReports: ReportRow[];
  initialSchedules: ScheduleRow[];
  defaultType?: "well" | "village" | "district" | "subsidy_planning";
  defaultScope?: { wellId?: string; villageId?: string; districtId?: string; name?: string };
  locale: string;
}

export function ReportCenterView({
  initialReports,
  initialSchedules,
  defaultType = "village",
  defaultScope = {},
  locale,
}: ReportCenterViewProps) {
  const t = useTranslations("reports");

  const [reports, setReports] = useState<ReportRow[]>(initialReports);
  const [isGenerateOpen, setIsGenerateOpen] = useState<boolean>(false);
  const [shareReportId, setShareReportId] = useState<string | null>(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleReportGenerated = (newReport: ReportRow) => {
    setReports((prev) => [newReport, ...prev]);
  };

  const handleDownload = async (report: ReportRow) => {
    try {
      setDownloadingId(report.id);
      const res = await getReportDownloadUrlAction(report.id);
      if (res.success && res.downloadUrl) {
        // Open or trigger download
        const a = document.createElement("a");
        a.href = res.downloadUrl;
        a.download = `jalmaps-report-${report.type}-${report.id}.${report.format}`;
        a.target = "_blank";
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      }
    } catch (err) {
      console.error("Download failed:", err);
    } finally {
      setDownloadingId(null);
    }
  };

  const handleShare = (report: ReportRow) => {
    setShareReportId(report.id);
  };

  const handleDelete = async (report: ReportRow) => {
    if (!window.confirm(t("deleteConfirm"))) return;
    try {
      setDeletingId(report.id);
      await deleteReportAction(report.id);
      setReports((prev) => prev.filter((r) => r.id !== report.id));
    } catch (err) {
      console.error("Delete failed:", err);
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Page Header */}
      <div className="flex flex-col justify-between gap-4 border-b border-border/60 pb-5 sm:flex-row sm:items-center">
        <div>
          <div className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <FileText className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-foreground">{t("title")}</h1>
              <p className="text-xs text-muted-foreground">{t("subtitle")}</p>
            </div>
          </div>
        </div>

        <Button
          type="button"
          onClick={() => setIsGenerateOpen(true)}
          className="h-12 min-h-[48px] px-5 sm:shrink-0"
        >
          <Plus className="mr-2 h-4 w-4" />
          <span>{t("generateReport")}</span>
        </Button>
      </div>

      {/* Privacy Notice Banner */}
      <div className="flex items-center gap-3 rounded-xl border border-primary/20 bg-primary/5 p-4 text-xs text-muted-foreground">
        <ShieldCheck className="h-5 w-5 shrink-0 text-primary" />
        <span>{t("privacyNotice")}</span>
      </div>

      {/* Report History */}
      <div className="space-y-3">
        <h2 className="text-sm font-semibold tracking-wider text-muted-foreground uppercase">
          {t("history")}
        </h2>
        <ReportHistoryTable
          reports={reports}
          onDownload={handleDownload}
          onShare={handleShare}
          onDelete={handleDelete}
          downloadingId={downloadingId}
          deletingId={deletingId}
        />
      </div>

      {/* Scheduled Digests */}
      <ScheduledDigestsCard
        initialSchedules={initialSchedules}
        defaultScope={{ villageId: defaultScope.villageId ?? "vil-1" }}
        locale={locale}
      />

      {/* Generation Modal */}
      <ReportGenerationModal
        isOpen={isGenerateOpen}
        onClose={() => setIsGenerateOpen(false)}
        defaultType={defaultType}
        defaultScope={defaultScope}
        locale={locale}
        onReportGenerated={handleReportGenerated}
      />

      {/* Share Modal */}
      <ShareLinkModal
        isOpen={Boolean(shareReportId)}
        onClose={() => setShareReportId(null)}
        reportId={shareReportId}
      />
    </div>
  );
}
