"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Download, X } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: "accepted" | "dismissed";
    platform: string;
  }>;
  prompt(): Promise<void>;
}

export function InstallBanner() {
  const t = useTranslations("pwa");
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showBanner, setShowBanner] = useState(false);
  const [isIOS] = useState(() => {
    if (typeof window !== "undefined") {
      return /iPad|iPhone|iPod/.test(navigator.userAgent) && !("MSStream" in window);
    }
    return false;
  });

  useEffect(() => {
    // Check if already installed / standalone
    if (window.matchMedia("(display-mode: standalone)").matches) {
      return;
    }

    const hasDismissed = localStorage.getItem("pwa-install-dismissed");
    if (hasDismissed) return;

    // Show after some engagement (delaying for demo purposes)
    const timer = setTimeout(() => {
      setShowBanner(true);
    }, 10000); // 10 seconds of engagement

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setShowBanner(true);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    return () => {
      clearTimeout(timer);
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    };
  }, []);

  if (!showBanner) return null;

  const handleInstall = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === "accepted") {
        setShowBanner(false);
      }
      setDeferredPrompt(null);
    }
  };

  const handleDismiss = () => {
    localStorage.setItem("pwa-install-dismissed", "true");
    setShowBanner(false);
  };

  return (
    <div className="fixed right-4 bottom-4 left-4 z-50 rounded-xl border bg-card p-4 shadow-lg sm:left-auto sm:w-96">
      <div className="flex items-start justify-between">
        <div className="flex gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
            <Download className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold">
              {t("installTitle", { defaultMessage: "Install JalMaps" })}
            </h3>
            <p className="text-sm text-muted-foreground">
              {isIOS
                ? t("installIosText", {
                    defaultMessage: "Tap Share then 'Add to Home Screen' to install.",
                  })
                : t("installText", {
                    defaultMessage: "Install for offline access and better performance.",
                  })}
            </p>
          </div>
        </div>
        <button onClick={handleDismiss} className="text-muted-foreground hover:text-foreground">
          <X className="h-5 w-5" />
          <span className="sr-only">{t("close", { defaultMessage: "Close" })}</span>
        </button>
      </div>
      {!isIOS && (
        <div className="mt-4 flex justify-end gap-2">
          <Button variant="ghost" size="sm" onClick={handleDismiss}>
            {t("notNow", { defaultMessage: "Not now" })}
          </Button>
          <Button size="sm" onClick={handleInstall}>
            {t("install", { defaultMessage: "Install" })}
          </Button>
        </div>
      )}
    </div>
  );
}
