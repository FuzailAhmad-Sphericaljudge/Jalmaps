"use client";

import { useTransition } from "react";
import { GlobeIcon } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";

import { isAppLocale, localeNativeNames, locales } from "@/i18n/config";
import { usePathname, useRouter } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

/**
 * Language switcher — native language names (English, हिन्दी), keyboard
 * friendly, icon + text per the farmer-first rules.
 *
 * Switching navigates to the same path in the new locale; next-intl's routing
 * persists the choice to the `NEXT_LOCALE` cookie, so it survives reloads and
 * future visits.
 */
export function LanguageSwitcher({ className }: { className?: string }) {
  const t = useTranslations("common.languageSwitcher");
  const locale = useLocale();
  const pathname = usePathname();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function switchTo(next: string) {
    if (!isAppLocale(next) || next === locale) return;
    startTransition(() => {
      // next-intl persists the NEXT_LOCALE cookie on navigation.
      router.replace(pathname, { locale: next });
    });
  }

  return (
    <div className={cn("relative inline-flex", isPending && "opacity-70", className)}>
      {/* A native <select>: the most accessible, keyboard-friendly picker on
          low-end Android browsers. Options use native names, never translated. */}
      <GlobeIcon
        aria-hidden
        className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-foreground-muted"
      />
      <select
        aria-label={t("label")}
        value={locale}
        onChange={(event) => switchTo(event.target.value)}
        className="h-12 appearance-none rounded-md border border-border bg-surface pr-8 pl-9 text-sm font-medium text-foreground"
      >
        {locales.map((code) => (
          <option key={code} value={code}>
            {localeNativeNames[code]}
          </option>
        ))}
      </select>
    </div>
  );
}
