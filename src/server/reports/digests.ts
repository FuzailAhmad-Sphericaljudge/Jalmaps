import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/db/types";

export type ReportScheduleRow = Database["public"]["Tables"]["report_schedules"]["Row"];

export interface DigestDispatchResult {
  scheduleId: string;
  userId: string;
  channel: string;
  queuedReportId: string;
}

/**
 * Evaluates active report schedules and dispatches digest generation
 * and delivery notifications through the Phase 14 notification outbox.
 */
export async function processScheduledDigests(
  supabase: SupabaseClient<Database>,
  options: { baseUrl?: string } = {},
): Promise<DigestDispatchResult[]> {
  const baseUrl = options.baseUrl ?? "https://jalmaps.in";
  const now = new Date();

  // 1. Fetch active schedules that are due (or haven't run in the last 6 days for weekly)
  const { data: schedules, error } = await supabase
    .from("report_schedules")
    .select("*")
    .eq("active", true);

  if (error || !schedules) {
    return [];
  }

  const results: DigestDispatchResult[] = [];

  for (const schedule of schedules) {
    // Check if due: if last_run_at is missing or older than 6 days (weekly)
    if (schedule.last_run_at) {
      const lastRun = new Date(schedule.last_run_at);
      const daysSince = (now.getTime() - lastRun.getTime()) / (86400 * 1000);
      if (schedule.cadence === "weekly" && daysSince < 6.5) continue;
      if (schedule.cadence === "monthly" && daysSince < 27) continue;
    }

    // 2. Queue the report generation in `reports`
    const { data: newReport, error: reportError } = await supabase
      .from("reports")
      .insert({
        type: schedule.type,
        format: "pdf",
        scope: schedule.scope,
        params: { locale: schedule.locale, unit: "m" },
        created_by: schedule.user_id,
        status: "queued",
      })
      .select("id")
      .single();

    if (reportError || !newReport) {
      continue;
    }

    // 3. Insert notification event into `notification_outbox` (digest event)
    const unsubscribeUrl = `${baseUrl}/api/reports/unsubscribe?id=${schedule.id}`;
    const payload = {
      title: "JalMaps Scheduled Water Digest",
      reportId: newReport.id,
      scope: schedule.scope,
      cadence: schedule.cadence,
      unsubscribeUrl,
    };

    const outboxChannel = (
      ["sms", "email", "push", "whatsapp", "telegram"].includes(schedule.channel)
        ? schedule.channel
        : "email"
    ) as Database["public"]["Enums"]["notification_channel"];

    await supabase.from("notification_outbox").insert({
      alert_id: "00000000-0000-0000-0000-000000000000",
      user_id: schedule.user_id,
      channel: outboxChannel,
      event: "digest",
      locale: schedule.locale,
      payload,
      status: "pending",
    });

    // 4. Update schedule last_run_at
    await supabase
      .from("report_schedules")
      .update({
        last_run_at: now.toISOString(),
        updated_at: now.toISOString(),
      })
      .eq("id", schedule.id);

    results.push({
      scheduleId: schedule.id,
      userId: schedule.user_id,
      channel: schedule.channel,
      queuedReportId: newReport.id,
    });
  }

  return results;
}

/**
 * One-tap unsubscribe handler for weekly/monthly digests.
 */
export async function unsubscribeReportSchedule(
  supabase: SupabaseClient<Database>,
  scheduleId: string,
): Promise<boolean> {
  const { error } = await supabase
    .from("report_schedules")
    .update({ active: false, updated_at: new Date().toISOString() })
    .eq("id", scheduleId);

  return !error;
}
