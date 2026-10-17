"use client";

import { useTranslations } from "next-intl";
import { WifiOff, RefreshCw, Activity } from "lucide-react";
import { ConnectionState } from "@/lib/realtime/manager";
import { cn } from "@/lib/utils";

export function LiveBadge({ state }: { state: ConnectionState }) {
  const t = useTranslations("realtime");

  const config = {
    live: {
      icon: Activity,
      color: "bg-success-soft text-success",
      label: "live",
      pulse: true,
    },
    connecting: {
      icon: RefreshCw,
      color: "bg-muted text-muted-foreground",
      label: "connecting",
      pulse: true,
    },
    reconnecting: {
      icon: RefreshCw,
      color: "bg-warning-soft text-warning",
      label: "reconnecting",
      pulse: true,
    },
    offline: {
      icon: WifiOff,
      color: "bg-danger-soft text-danger",
      label: "offline",
      pulse: false,
    },
  };

  const curr = config[state];
  const Icon = curr.icon;

  return (
    <div
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium",
        curr.color,
      )}
    >
      <Icon
        className={cn("size-3.5", {
          "animate-pulse motion-reduce:animate-none": curr.pulse,
          "animate-spin motion-reduce:animate-none":
            state === "connecting" || state === "reconnecting",
        })}
        aria-hidden="true"
      />
      <span>{t(curr.label, { fallback: curr.label })}</span>
    </div>
  );
}
