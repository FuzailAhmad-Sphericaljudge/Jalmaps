"use client";

import { useTranslations } from "next-intl";

export function DeliveryHistory({
  history,
}: {
  history: { id: string; channel: string; event: string; status: string; created_at: string }[];
}) {
  const t = useTranslations("notifications");

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium">
        {t("history.title", { defaultValue: "Delivery History" })}
      </h3>
      {history.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          {t("history.empty", { defaultValue: "No notifications sent yet." })}
        </p>
      ) : (
        <ul className="space-y-2">
          {history.map((item) => (
            <li key={item.id} className="flex justify-between rounded border p-3 text-sm">
              <div>
                <p className="font-medium">{item.channel}</p>
                <p className="text-muted-foreground">{item.event}</p>
              </div>
              <div className="text-right">
                <p className="font-medium capitalize">{item.status}</p>
                <p className="text-xs text-muted-foreground">
                  {new Date(item.created_at).toLocaleString()}
                </p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
