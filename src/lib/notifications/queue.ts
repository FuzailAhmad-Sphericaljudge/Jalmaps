import { createClient } from "@supabase/supabase-js";
import { planNotifications } from "./planner";
import { getEnv } from "@/lib/env";

export async function queueAlertNotifications(
  alert: { id: string; well_id: string; severity: string },
  event: "opened" | "escalated" | "resolved",
) {
  const env = getEnv();
  const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

  // 1. Get recipients (e.g. area admins, well owner)
  // For simplicity, we just fetch the farmer associated with the well.
  const { data: well } = await supabase
    .from("wells")
    .select("farmer_id")
    .eq("id", alert.well_id)
    .single();
  if (!well || !well.farmer_id) return;

  const recipients = [well.farmer_id];

  const now = new Date();

  for (const userId of recipients) {
    const { data: prefs } = await supabase
      .from("user_notification_prefs")
      .select("*")
      .eq("user_id", userId)
      .single();
    if (!prefs) continue;

    // We pass alert directly, assuming it matches the structure planNotifications expects
    const outboxRows = planNotifications(alert, userId, prefs, now, event);

    if (outboxRows.length > 0) {
      await supabase.from("notification_outbox").insert(outboxRows);
    }
  }
}
