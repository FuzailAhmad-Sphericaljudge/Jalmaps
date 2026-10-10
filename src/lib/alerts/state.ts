import type { AlertStatus, AlertResolvedReason } from "./types";

export type TransitionResult =
  | {
      success: true;
      newStatus: AlertStatus;
      reason?: string;
      resolvedReason?: AlertResolvedReason;
      snoozedUntil?: Date;
    }
  | { success: false; error: string };

export const transitionAlertState = (
  currentStatus: AlertStatus,
  action: "acknowledge" | "snooze" | "resolve_auto" | "resolve_manual" | "wake",
  options?: { snoozedUntil?: Date; reason?: string },
): TransitionResult => {
  switch (action) {
    case "acknowledge":
      if (currentStatus !== "open")
        return { success: false, error: "Can only acknowledge open alerts." };
      return { success: true, newStatus: "acknowledged", reason: options?.reason };

    case "snooze":
      if (currentStatus === "resolved")
        return { success: false, error: "Cannot snooze resolved alerts." };
      if (!options?.snoozedUntil)
        return { success: false, error: "Snooze requires a snoozedUntil date." };
      return {
        success: true,
        newStatus: "snoozed",
        snoozedUntil: options.snoozedUntil,
        reason: options?.reason,
      };

    case "wake":
      if (currentStatus !== "snoozed")
        return { success: false, error: "Can only wake snoozed alerts." };
      return { success: true, newStatus: "open", reason: "Snooze expired" };

    case "resolve_auto":
      if (currentStatus === "resolved") return { success: false, error: "Already resolved." };
      return {
        success: true,
        newStatus: "resolved",
        resolvedReason: "auto",
        reason: "Auto-resolved by evaluator.",
      };

    case "resolve_manual":
      if (currentStatus === "resolved") return { success: false, error: "Already resolved." };
      return {
        success: true,
        newStatus: "resolved",
        resolvedReason: "manual",
        reason: options?.reason || "Manually resolved.",
      };

    default:
      return { success: false, error: "Unknown action." };
  }
};
