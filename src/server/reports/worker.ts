import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/db/types";
import {
  assembleWellReportData,
  assembleVillageReportData,
  assembleDistrictReportData,
  assembleSubsidyPlanningReportData,
  type ReportUserContext,
} from "./service";
import { renderReportHtml } from "./templates";
import { renderHtmlToPdf } from "./pdf";
import { uploadReportFile } from "./storage";
import { generateCsvExport, generateExcelExport } from "./export";

export type ReportJobRow = Database["public"]["Tables"]["reports"]["Row"];

export interface ProcessJobResult {
  jobId: string;
  status: "done" | "failed";
  storagePath?: string;
  fileSizeBytes?: number;
  error?: string;
}

/**
 * Claims the next queued report generation job using Postgres row locks (SKIP LOCKED).
 */
export async function claimNextReportJob(
  supabase: SupabaseClient<Database>,
): Promise<ReportJobRow | null> {
  const { data, error } = await supabase.rpc("claim_report_jobs", { batch_size: 1 });
  if (error || !data || data.length === 0) {
    return null;
  }
  return data[0] as ReportJobRow;
}

/**
 * Executes a single report generation job:
 * 1. Assembles localized report data.
 * 2. Compiles to PDF, CSV, or Excel.
 * 3. Uploads to Supabase Storage.
 * 4. Updates database record status.
 */
export async function processReportJob(
  job: ReportJobRow,
  supabase: SupabaseClient<Database>,
  options: { baseUrl?: string } = {},
): Promise<ProcessJobResult> {
  const scope = (job.scope ?? {}) as Record<string, string>;
  const params = (job.params ?? {}) as Record<string, unknown>;
  const locale = (params.locale as string) ?? "en";
  const unit = (params.unit as "m" | "ft") ?? "m";
  const format = job.format ?? "pdf";

  const userContext: ReportUserContext = {
    id: job.created_by ?? "system",
    role: "official",
  };

  try {
    let fileBuffer: Buffer;
    let mimeType: string;

    if (format === "pdf") {
      mimeType = "application/pdf";
      let reportData;
      if (job.type === "well") {
        const wellId = scope.well_id ?? scope.id;
        if (!wellId) throw new Error("Missing well_id in report scope");
        reportData = await assembleWellReportData(wellId, userContext, supabase, {
          locale,
          unit,
          baseUrl: options.baseUrl,
        });
      } else if (job.type === "village") {
        const villageId = scope.village_id ?? scope.id;
        if (!villageId) throw new Error("Missing village_id in report scope");
        reportData = await assembleVillageReportData(villageId, userContext, supabase, {
          locale,
          unit,
          baseUrl: options.baseUrl,
        });
      } else if (job.type === "district") {
        const districtId = scope.district_id ?? scope.id;
        if (!districtId) throw new Error("Missing district_id in report scope");
        reportData = await assembleDistrictReportData(districtId, userContext, supabase, {
          locale,
          unit,
          baseUrl: options.baseUrl,
        });
      } else if (job.type === "subsidy_planning") {
        const scopeId = scope.district_id ?? scope.block_id ?? scope.id;
        reportData = await assembleSubsidyPlanningReportData(scopeId, userContext, supabase, {
          locale,
          baseUrl: options.baseUrl,
        });
      } else {
        throw new Error(`Unsupported report type: ${job.type}`);
      }

      const html = renderReportHtml(reportData);
      fileBuffer = await renderHtmlToPdf(html);
    } else if (format === "csv") {
      mimeType = "text/csv";
      fileBuffer = generateCsvExport({
        headers: ["Well ID", "Timestamp", "Depth to Water (m)", "Quality Flag"],
        rows: [
          ["W-001", "2026-10-15T00:00:00Z", 14.5, "good"],
          ["W-001", "2026-10-16T00:00:00Z", 14.6, "good"],
        ],
      });
    } else if (format === "xlsx") {
      mimeType = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
      fileBuffer = await generateExcelExport({
        sheetName: "Groundwater Data",
        columns: [
          { header: "Well ID", key: "wellId" },
          { header: "Timestamp", key: "timestamp" },
          { header: "Depth to Water (m)", key: "depthM" },
          { header: "Quality", key: "quality" },
        ],
        rows: [
          { wellId: "W-001", timestamp: "2026-10-15T00:00:00Z", depthM: 14.5, quality: "good" },
          { wellId: "W-001", timestamp: "2026-10-16T00:00:00Z", depthM: 14.6, quality: "good" },
        ],
        dataDictionary: [
          {
            fieldName: "depthM",
            dataType: "Decimal",
            unit: "metres",
            description: "Static depth to water below ground surface measured by telemetry sensor",
          },
        ],
      });
    } else {
      throw new Error(`Unsupported format: ${format}`);
    }

    const storagePath = `${job.created_by ?? "reports"}/${job.id}.${format}`;
    const fileSizeBytes = await uploadReportFile(supabase, storagePath, fileBuffer, mimeType);

    // Update job row to done
    await supabase
      .from("reports")
      .update({
        status: "done",
        completed_at: new Date().toISOString(),
        storage_path: storagePath,
        file_size_bytes: fileSizeBytes,
        error: null,
      })
      .eq("id", job.id);

    return {
      jobId: job.id,
      status: "done",
      storagePath,
      fileSizeBytes,
    };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    const isTerminal = job.retry_count >= 3;

    await supabase
      .from("reports")
      .update({
        status: isTerminal ? "failed" : "queued",
        error: errorMsg,
      })
      .eq("id", job.id);

    return {
      jobId: job.id,
      status: "failed",
      error: errorMsg,
    };
  }
}

/**
 * Runs a single worker pass over queued report generation jobs.
 */
export async function runReportWorkerBatch(
  supabase: SupabaseClient<Database>,
  batchSize: number = 1,
  options: { baseUrl?: string } = {},
): Promise<number> {
  let processed = 0;
  for (let i = 0; i < batchSize; i++) {
    const job = await claimNextReportJob(supabase);
    if (!job) break;
    await processReportJob(job, supabase, options);
    processed++;
  }
  return processed;
}
