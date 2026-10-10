import { Database } from "@/lib/db/types";

export type OutboxInsert = Database["public"]["Tables"]["notification_outbox"]["Insert"];
export type NotificationPrefs = Database["public"]["Tables"]["user_notification_prefs"]["Row"];

export function isQuietHours(now: Date, prefs: NotificationPrefs): boolean {
  if (!prefs.quiet_hours_start || !prefs.quiet_hours_end) return false;

  // Implementation of quiet hours check (assuming UTC/simple matching for MVP)
  const currentHour = now.getUTCHours();
  const startHour = parseInt(prefs.quiet_hours_start.split(":")[0] || "22");
  const endHour = parseInt(prefs.quiet_hours_end.split(":")[0] || "7");

  if (startHour > endHour) {
    // Spans midnight
    return currentHour >= startHour || currentHour < endHour;
  }
  return currentHour >= startHour && currentHour < endHour;
}

export function planNotifications(
  alert: { id: string; severity: string },
  userId: string,
  prefs: NotificationPrefs,
  now: Date,
  event: "opened" | "escalated" | "resolved" | "digest",
): OutboxInsert[] {
  const outbox: OutboxInsert[] = [];

  const quiet = isQuietHours(now, prefs);
  const severity = alert.severity as "critical" | "warning" | "info";

  // Check if we should bypass quiet hours
  if (quiet && !(severity === "critical" && prefs.critical_bypasses_quiet_hours)) {
    return outbox; // Skip or queue for digest
  }

  const routingObj = (prefs.severity_routing as Record<string, string[]>) || {
    critical: ["push", "sms"],
    warning: ["push"],
    info: ["push"],
  };

  const allowedChannels = routingObj[severity] || ["push"];

  for (const channel of allowedChannels) {
    outbox.push({
      alert_id: alert.id,
      user_id: userId,
      channel: channel as "push" | "telegram" | "sms" | "whatsapp" | "email",
      event,
    });
  }

  return outbox;
}
