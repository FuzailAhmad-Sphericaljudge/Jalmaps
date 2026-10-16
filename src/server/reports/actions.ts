"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/server/auth";
import { createServerComponentClient } from "@/server/supabase/server-component";
import { createServiceRoleClient } from "@/server/supabase/service-role";
import { processReportJob } from "./worker";
import { getReportSignedUrl, deleteReportFile } from "./storage";
import { createReportShare, revokeReportShare, getActiveShareForReport } from "./shares";
import type { Database } from "@/lib/db/types";

export type ReportRow = Database["public"]["Tables"]["reports"]["Row"];
export type ScheduleRow = Database["public"]["Tables"]["report_schedules"]["Row"];

export interface GenerateReportInput {
  type: "well" | "village" | "district" | "subsidy_planning";
  format?: "pdf" | "csv" | "xlsx";
  scope: {
    wellId?: string;
    villageId?: string;
    districtId?: string;
    blockId?: string;
  };
  params?: {
    locale?: string;
    unit?: "m" | "ft";
    periodDays?: number;
    includeQualityNotes?: boolean;
  };
}

export interface SaveScheduleInput {
  type: "well" | "village" | "district" | "subsidy_planning";
  scope: Record<string, string>;
  cadence: "weekly" | "monthly";
  dayOfWeek?: number;
  dayOfMonth?: number;
  timeUtc?: string;
  locale?: string;
  channel?: "email" | "sms" | "whatsapp" | "in_app";
}

/**
 * Creates and processes a new report generation job.
 */
export async function generateReportAction(input: GenerateReportInput) {
  const auth = await getCurrentUser();
  if (!auth?.user) {
    throw new Error("Unauthorized");
  }

  const supabase = await createServerComponentClient();
  const serviceRole = createServiceRoleClient();

  const expiresAt = new Date(Date.now() + 30 * 86400 * 1000).toISOString();

  const { data: newJob, error: insertError } = await supabase
    .from("reports")
    .insert({
      type: input.type,
      format: input.format ?? "pdf",
      scope: input.scope,
      params: input.params ?? {},
      status: "queued",
      created_by: auth.user.id,
      expires_at: expiresAt,
    })
    .select()
    .single();

  if (insertError || !newJob) {
    throw new Error(`Failed to queue report: ${insertError?.message ?? "Unknown error"}`);
  }

  // Execute processing with service role client
  try {
    const jobResult = await processReportJob(newJob, serviceRole);
    // Fetch refreshed row
    const { data: updatedReport } = await supabase
      .from("reports")
      .select()
      .eq("id", newJob.id)
      .single();

    revalidatePath("/[locale]/official/reports", "page");
    revalidatePath("/[locale]/village/reports", "page");

    return {
      success: true,
      report: updatedReport ?? newJob,
      jobResult,
    };
  } catch (procErr) {
    console.error("Report processing error:", procErr);
    return {
      success: false,
      report: newJob,
      error: procErr instanceof Error ? procErr.message : "Processing failed",
    };
  }
}

/**
 * Generates a short-lived signed URL for downloading a completed report.
 */
export async function getReportDownloadUrlAction(reportId: string) {
  const auth = await getCurrentUser();
  if (!auth?.user) {
    throw new Error("Unauthorized");
  }

  const supabase = await createServerComponentClient();
  const serviceRole = createServiceRoleClient();

  const { data: report, error } = await supabase
    .from("reports")
    .select("id, storage_path, status, created_by")
    .eq("id", reportId)
    .single();

  if (error || !report) {
    throw new Error("Report not found");
  }

  // Check access: creator or official/admin
  const role = auth.profile?.role;
  const isOwner = report.created_by === auth.user.id;
  const isStaff = role === "official" || role === "admin" || role === "village_admin";

  if (!isOwner && !isStaff) {
    throw new Error("Access denied");
  }

  if (report.status !== "done" || !report.storage_path) {
    throw new Error("Report is not ready for download");
  }

  const downloadUrl = await getReportSignedUrl(serviceRole, report.storage_path, 3600);
  return { success: true, downloadUrl };
}

/**
 * Deletes a report record and associated storage file.
 */
export async function deleteReportAction(reportId: string) {
  const auth = await getCurrentUser();
  if (!auth?.user) {
    throw new Error("Unauthorized");
  }

  const supabase = await createServerComponentClient();
  const serviceRole = createServiceRoleClient();

  const { data: report } = await supabase
    .from("reports")
    .select("id, storage_path, created_by")
    .eq("id", reportId)
    .single();

  if (!report) {
    return { success: true };
  }

  if (report.created_by !== auth.user.id && auth.profile?.role !== "admin") {
    throw new Error("Access denied");
  }

  if (report.storage_path) {
    try {
      await deleteReportFile(serviceRole, report.storage_path);
    } catch {
      // Storage cleanup failure does not prevent record deletion
    }
  }

  await supabase.from("reports").delete().eq("id", reportId);

  revalidatePath("/[locale]/official/reports", "page");
  revalidatePath("/[locale]/village/reports", "page");

  return { success: true };
}

/**
 * Creates an expiring share link for a report.
 */
export async function createReportShareAction(
  reportId: string,
  options: { expiryDays?: number; baseUrl?: string } = {},
) {
  const auth = await getCurrentUser();
  if (!auth?.user) {
    throw new Error("Unauthorized");
  }

  const serviceRole = createServiceRoleClient();

  const shareResult = await createReportShare(serviceRole, reportId, auth.user.id, options);
  return { success: true, share: shareResult };
}

/**
 * Revokes an existing report share link.
 */
export async function revokeReportShareAction(shareId: string) {
  const auth = await getCurrentUser();
  if (!auth?.user) {
    throw new Error("Unauthorized");
  }

  const serviceRole = createServiceRoleClient();
  await revokeReportShare(serviceRole, shareId, auth.user.id);

  return { success: true };
}

/**
 * Fetches the active share link for a report if one exists.
 */
export async function getActiveShareAction(reportId: string) {
  const auth = await getCurrentUser();
  if (!auth?.user) {
    throw new Error("Unauthorized");
  }

  const serviceRole = createServiceRoleClient();
  const share = await getActiveShareForReport(serviceRole, reportId, auth.user.id);

  return { success: true, share };
}

/**
 * Creates or updates a scheduled report digest.
 */
export async function saveReportScheduleAction(input: SaveScheduleInput) {
  const auth = await getCurrentUser();
  if (!auth?.user) {
    throw new Error("Unauthorized");
  }

  const supabase = await createServerComponentClient();

  const { data: schedule, error } = await supabase
    .from("report_schedules")
    .insert({
      user_id: auth.user.id,
      type: input.type,
      scope: input.scope,
      cadence: input.cadence,
      day_of_week: input.dayOfWeek ?? 1,
      day_of_month: input.dayOfMonth ?? 1,
      time_utc: input.timeUtc ?? "04:00",
      locale: input.locale ?? "en",
      channel: input.channel ?? "email",
      active: true,
    })
    .select()
    .single();

  if (error || !schedule) {
    throw new Error(`Failed to save digest schedule: ${error?.message ?? "Unknown error"}`);
  }

  revalidatePath("/[locale]/official/reports", "page");
  revalidatePath("/[locale]/village/reports", "page");

  return { success: true, schedule };
}

/**
 * Deletes a scheduled report digest.
 */
export async function deleteReportScheduleAction(scheduleId: string) {
  const auth = await getCurrentUser();
  if (!auth?.user) {
    throw new Error("Unauthorized");
  }

  const supabase = await createServerComponentClient();

  const { error } = await supabase
    .from("report_schedules")
    .delete()
    .eq("id", scheduleId)
    .eq("user_id", auth.user.id);

  if (error) {
    throw new Error(`Failed to delete schedule: ${error.message}`);
  }

  revalidatePath("/[locale]/official/reports", "page");
  revalidatePath("/[locale]/village/reports", "page");

  return { success: true };
}

/**
 * Lists reports generated by the current user.
 */
export async function listUserReportsAction() {
  const auth = await getCurrentUser();
  if (!auth?.user) {
    throw new Error("Unauthorized");
  }

  const supabase = await createServerComponentClient();

  const { data: reports, error } = await supabase
    .from("reports")
    .select("*")
    .eq("created_by", auth.user.id)
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) {
    throw new Error(`Failed to list reports: ${error.message}`);
  }

  return { success: true, reports: (reports ?? []) as ReportRow[] };
}

/**
 * Lists scheduled digests configured by the current user.
 */
export async function listUserSchedulesAction() {
  const auth = await getCurrentUser();
  if (!auth?.user) {
    throw new Error("Unauthorized");
  }

  const supabase = await createServerComponentClient();

  const { data: schedules, error } = await supabase
    .from("report_schedules")
    .select("*")
    .eq("user_id", auth.user.id)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(`Failed to list schedules: ${error.message}`);
  }

  return { success: true, schedules: (schedules ?? []) as ScheduleRow[] };
}
