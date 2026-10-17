"use client";

import { useTranslations } from "next-intl";
import {
  FileText,
  Table as TableIcon,
  FileSpreadsheet,
  Download,
  Share2,
  Trash2,
  Loader2,
  Inbox,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { ReportRow } from "@/server/reports/actions";

interface ReportHistoryTableProps {
  reports: ReportRow[];
  onDownload: (report: ReportRow) => void;
  onShare: (report: ReportRow) => void;
  onDelete: (report: ReportRow) => void;
  downloadingId?: string | null;
  deletingId?: string | null;
}

export function ReportHistoryTable({
  reports,
  onDownload,
  onShare,
  onDelete,
  downloadingId,
  deletingId,
}: ReportHistoryTableProps) {
  const t = useTranslations("reports");

  const getFormatIcon = (format: string) => {
    switch (format) {
      case "csv":
        return <TableIcon className="h-4 w-4 text-emerald-500" />;
      case "xlsx":
        return <FileSpreadsheet className="h-4 w-4 text-blue-500" />;
      default:
        return <FileText className="h-4 w-4 text-rose-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "done":
        return (
          <Badge
            variant="outline"
            className="border-emerald-500/40 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
          >
            {t("statuses.done")}
          </Badge>
        );
      case "running":
        return (
          <Badge
            variant="outline"
            className="border-sky-500/40 bg-sky-500/10 text-sky-600 dark:text-sky-400"
          >
            <Loader2 className="mr-1 h-3 w-3 animate-spin" />
            {t("statuses.running")}
          </Badge>
        );
      case "failed":
        return (
          <Badge
            variant="outline"
            className="border-destructive/40 bg-destructive/10 text-destructive"
          >
            {t("statuses.failed")}
          </Badge>
        );
      default:
        return (
          <Badge
            variant="outline"
            className="border-amber-500/40 bg-amber-500/10 text-amber-600 dark:text-amber-400"
          >
            {t("statuses.queued")}
          </Badge>
        );
    }
  };

  const formatScope = (scope: Record<string, unknown> | null) => {
    if (!scope) return "-";
    const sc = scope as Record<string, string>;
    return sc.villageName || sc.villageId || sc.districtName || sc.districtId || sc.wellId || "-";
  };

  const formatDate = (isoStr: string) => {
    try {
      const d = new Date(isoStr);
      return d.toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
    } catch {
      return isoStr;
    }
  };

  if (reports.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border/80 bg-muted/10 p-12 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted/50 text-muted-foreground">
          <Inbox className="h-6 w-6" />
        </div>
        <h3 className="mt-4 text-base font-semibold text-foreground">{t("history")}</h3>
        <p className="mt-1 max-w-sm text-sm text-muted-foreground">{t("historyEmpty")}</p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-border/80 bg-card shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-border/80 bg-muted/40 text-xs font-semibold text-muted-foreground">
            <tr>
              <th scope="col" className="px-4 py-3.5">
                {t("columns.type")}
              </th>
              <th scope="col" className="px-4 py-3.5">
                {t("columns.scope")}
              </th>
              <th scope="col" className="px-4 py-3.5">
                {t("columns.format")}
              </th>
              <th scope="col" className="px-4 py-3.5">
                {t("columns.status")}
              </th>
              <th scope="col" className="px-4 py-3.5">
                {t("columns.created")}
              </th>
              <th scope="col" className="px-4 py-3.5 text-right">
                {t("columns.actions")}
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/60">
            {reports.map((report) => (
              <tr key={report.id} className="transition-colors hover:bg-muted/20">
                <td className="px-4 py-3 font-medium text-foreground">
                  <div className="flex items-center gap-2">
                    {getFormatIcon(report.format)}
                    <span>
                      {t(
                        `types.${report.type as "well" | "village" | "district" | "subsidy_planning"}`,
                      )}
                    </span>
                  </div>
                </td>
                <td className="px-4 py-3 text-muted-foreground">
                  {formatScope(report.scope as Record<string, unknown>)}
                </td>
                <td className="px-4 py-3 font-mono text-xs text-muted-foreground uppercase">
                  {report.format}
                </td>
                <td className="px-4 py-3">{getStatusBadge(report.status)}</td>
                <td className="px-4 py-3 text-xs text-muted-foreground">
                  {formatDate(report.created_at)}
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="flex items-center justify-end gap-1.5">
                    {report.status === "done" && (
                      <>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => onDownload(report)}
                          disabled={downloadingId === report.id}
                          className="h-12 min-h-[48px] w-12 min-w-[48px] rounded-lg text-muted-foreground hover:text-foreground"
                          aria-label={t("actions.download")}
                        >
                          {downloadingId === report.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Download className="h-4 w-4" />
                          )}
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => onShare(report)}
                          className="h-12 min-h-[48px] w-12 min-w-[48px] rounded-lg text-muted-foreground hover:text-foreground"
                          aria-label={t("actions.share")}
                        >
                          <Share2 className="h-4 w-4" />
                        </Button>
                      </>
                    )}
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => onDelete(report)}
                      disabled={deletingId === report.id}
                      className="h-12 min-h-[48px] w-12 min-w-[48px] rounded-lg text-muted-foreground hover:text-destructive"
                      aria-label={t("actions.delete")}
                    >
                      {deletingId === report.id ? (
                        <Loader2 className="h-4 w-4 animate-spin text-destructive" />
                      ) : (
                        <Trash2 className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
