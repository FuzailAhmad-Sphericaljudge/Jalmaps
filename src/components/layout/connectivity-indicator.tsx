"use client";

import { Wifi, WifiOff } from "lucide-react";
import { useTranslations } from "next-intl";

import { useOnlineStatus } from "@/features/navigation/use-online-status";

export function ConnectivityIndicator() {
  const t = useTranslations("shell.connectivity");
  const isOnline = useOnlineStatus();
  const Icon = isOnline ? Wifi : WifiOff;

  return (
    <span
      role="status"
      aria-live="polite"
      className="inline-flex min-h-10 items-center gap-2 rounded-full border border-border px-3 text-sm font-medium"
      data-testid="connectivity-indicator"
    >
      <Icon aria-hidden="true" className="size-4" />
      {isOnline ? t("online") : t("offline")}
    </span>
  );
}
