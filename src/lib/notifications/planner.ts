import { Database } from "@/lib/database.types";

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
  alert: any,
  recipients: Array<{ id: string; channels: string[] }>,
  prefsMap: Map<string, NotificationPrefs>,
  now: Date
): OutboxInsert[] {
  const outbox: OutboxInsert[] = [];

  for (const user of recipients) {
    const prefs = prefsMap.get(user.id);
    if (!prefs) continue;

    const quiet = isQuietHours(now, prefs);
    const severity = alert.severity as "critical" | "warning" | "info";
    
    // Check if we should bypass quiet hours
    if (quiet && !(severity === "critical" && prefs.critical_bypasses_quiet_hours)) {
      continue; // Skip or queue for digest
    }

    const routingObj = (prefs.severity_routing as any) || {
      critical: ["push", "sms"],
      warning: ["push"],
      info: ["push"],
    };

    const allowedChannels = routingObj[severity] || ["push"];

    for (const channel of allowedChannels) {
      if (user.channels.includes(channel)) {
        outbox.push({
          alert_id: alert.id,
          user_id: user.id,
          channel: channel as any,
          event: "opened",
        });
      }
    }
  }

  return outbox;
}
