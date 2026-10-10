import { useEffect } from "react";
import { toast } from "sonner"; // Assuming sonner is used for toasts, or adapt to the project's toast

export type AlertEvent = {
  id: string;
  well_id: string;
  type: "alert" | "rain" | "pump";
  severity: "info" | "warning" | "critical";
  message: string;
  created_at: string;
};

export function useAlerts(wellId?: string, onAlert?: (event: AlertEvent) => void) {
  useEffect(() => {
    // In Phase 13, this will subscribe to the `alerts` table via Supabase Realtime
    // For now, we simulate a fake event source for testing
    const interval = setInterval(() => {
      // 5% chance of a fake alert every 10 seconds for testing
      if (Math.random() < 0.05) {
        const fakeAlert: AlertEvent = {
          id: Math.random().toString(),
          well_id: wellId || "any",
          type: "alert",
          severity: "warning",
          message: "Fake alert for testing",
          created_at: new Date().toISOString(),
        };

        if (onAlert) {
          onAlert(fakeAlert);
        } else {
          toast(fakeAlert.message, {
            description: new Date(fakeAlert.created_at).toLocaleTimeString(),
          });
        }
      }
    }, 10000);

    return () => clearInterval(interval);
  }, [wellId, onAlert]);
}
