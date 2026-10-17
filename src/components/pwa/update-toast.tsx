"use client";

import { useEffect } from "react";
import { toast } from "sonner";
import { useTranslations } from "next-intl";

export function ServiceWorkerUpdater() {
  const t = useTranslations("pwa");

  useEffect(() => {
    if (process.env.NODE_ENV !== "production") {
      return;
    }

    if (typeof window !== "undefined" && "serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/sw.js")
        .then((reg) => {
          reg.addEventListener("updatefound", () => {
            const newWorker = reg.installing;
            if (newWorker) {
              newWorker.addEventListener("statechange", () => {
                if (newWorker.state === "installed" && navigator.serviceWorker.controller) {
                  toast(
                    t("updateAvailable", { defaultMessage: "Update available. Reload to apply." }),
                    {
                      duration: 10000,
                      action: {
                        label: t("reload", { defaultMessage: "Reload" }),
                        onClick: () => {
                          newWorker.postMessage({ type: "SKIP_WAITING" });
                        },
                      },
                    },
                  );
                }
              });
            }
          });
        })
        .catch(() => {
          // Ignore registration failures in environments where sw.js is absent
        });

      let refreshing = false;
      navigator.serviceWorker.addEventListener("controllerchange", () => {
        if (!refreshing) {
          refreshing = true;
          window.location.reload();
        }
      });
    }
  }, [t]);

  return null;
}
