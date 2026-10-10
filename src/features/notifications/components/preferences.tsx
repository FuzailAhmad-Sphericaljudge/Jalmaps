"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";

export function NotificationPreferences({
  initialPrefs,
  initialChannels,
}: {
  initialPrefs: Record<string, unknown>;
  initialChannels: any[];
}) {
  const t = useTranslations("notifications");
  const [dailyDigest, setDailyDigest] = useState(!!initialPrefs.daily_digest);

  const savePreferences = async () => {
    try {
      await fetch("/api/notifications/prefs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          daily_digest: dailyDigest,
        }),
      });
    } catch (err) {
      console.error("Failed to save prefs");
    }
  };

  return (
    <div className="space-y-6 max-w-lg p-4 border rounded-lg shadow-sm">
      <h2 className="text-xl font-semibold">{t("preferences.title")}</h2>
      <p className="text-sm text-muted-foreground">{t("preferences.description")}</p>

      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-medium">{t("preferences.dailyDigest")}</h3>
          <p className="text-sm text-muted-foreground">{t("preferences.dailyDigestDescription")}</p>
        </div>
        <Switch checked={dailyDigest} onCheckedChange={setDailyDigest} />
      </div>

      <Button onClick={savePreferences}>{t("preferences.save")}</Button>
    </div>
  );
}
