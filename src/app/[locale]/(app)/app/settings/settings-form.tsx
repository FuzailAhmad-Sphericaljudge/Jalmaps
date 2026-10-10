"use client";

import { useState, type FormEvent } from "react";
import { Save } from "lucide-react";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { isAppLocale, localeNativeNames, type AppLocale } from "@/i18n/config";
import { Link, useRouter } from "@/i18n/navigation";
import type { SettingsInput } from "@/lib/schemas/settings";
import { useTheme } from "@/components/theme/theme-context";

import { saveSettings } from "./actions";

const textSizeCookieAge = 60 * 60 * 24 * 365;

function setTextSize(size: SettingsInput["text_size"]) {
  document.documentElement.dataset.textSize = size;
  document.cookie = `jalmaps-text-size=${size}; path=/; max-age=${textSizeCookieAge}; samesite=lax`;
}

export function SettingsForm({
  locale,
  initialLocale,
  initialUnit,
  initialTextSize,
  initialTheme,
}: {
  locale: AppLocale;
  initialLocale: AppLocale;
  initialUnit: SettingsInput["preferred_unit"];
  initialTextSize: SettingsInput["text_size"];
  initialTheme: SettingsInput["theme"];
}) {
  const t = useTranslations("settings");
  const router = useRouter();
  const { setTheme } = useTheme();
  const [preferredLocale, setPreferredLocale] = useState(initialLocale);
  const [preferredUnit, setPreferredUnit] = useState(initialUnit);
  const [textSize, setTextSizeState] = useState(initialTextSize);
  const [theme, setThemeState] = useState(initialTheme);
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);
  const [busy, setBusy] = useState(false);

  function changeTextSize(value: string) {
    if (value === "normal" || value === "large" || value === "extraLarge") {
      setTextSizeState(value);
      setTextSize(value);
    }
  }

  function changeTheme(value: string) {
    if (value === "system" || value === "light" || value === "dark") {
      setThemeState(value);
      setTheme(value);
    }
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setMessage("");
    try {
      const result = await saveSettings(locale, {
        preferred_locale: preferredLocale,
        preferred_unit: preferredUnit,
        text_size: textSize,
        theme,
      });
      setIsError(result.status !== "saved");
      setMessage(result.status === "saved" ? t("saved") : t("saveError"));
      if (result.status === "saved" && preferredLocale !== locale) {
        router.replace("/", { locale: preferredLocale });
      }
    } catch (caught) {
      if (!(caught instanceof Error)) throw caught;
      setIsError(true);
      setMessage(t("saveError"));
      setTextSizeState(initialTextSize);
      setTextSize(initialTextSize);
      setThemeState(initialTheme);
      setTheme(initialTheme);
    } finally {
      setBusy(false);
    }
  }

  return (
    <form className="space-y-6" onSubmit={submit}>
      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="settings-language" className="mb-2 block font-medium">
            {t("language")}
          </label>
          <p id="settings-language-description" className="mb-2 text-sm text-muted-foreground">
            {t("languageDescription")}
          </p>
          <select
            id="settings-language"
            aria-describedby="settings-language-description"
            className="h-12 w-full rounded-md border border-input bg-background px-3 text-base focus-visible:outline-2 focus-visible:outline-ring"
            value={preferredLocale}
            onChange={(event) => {
              if (isAppLocale(event.target.value)) setPreferredLocale(event.target.value);
            }}
          >
            <option value="en">{localeNativeNames.en}</option>
            <option value="hi">{localeNativeNames.hi}</option>
          </select>
        </div>
        <div>
          <label htmlFor="settings-unit" className="mb-2 block font-medium">
            {t("unit")}
          </label>
          <p id="settings-unit-description" className="mb-2 text-sm text-muted-foreground">
            {t("unitDescription")}
          </p>
          <select
            id="settings-unit"
            aria-describedby="settings-unit-description"
            className="h-12 w-full rounded-md border border-input bg-background px-3 text-base focus-visible:outline-2 focus-visible:outline-ring"
            value={preferredUnit}
            onChange={(event) => {
              if (event.target.value === "m" || event.target.value === "ft") {
                setPreferredUnit(event.target.value);
              }
            }}
          >
            <option value="m">{t("metres")}</option>
            <option value="ft">{t("feet")}</option>
          </select>
        </div>
        <div>
          <label htmlFor="settings-text-size" className="mb-2 block font-medium">
            {t("textSize")}
          </label>
          <p id="settings-text-size-description" className="mb-2 text-sm text-muted-foreground">
            {t("textSizeDescription")}
          </p>
          <select
            id="settings-text-size"
            aria-describedby="settings-text-size-description"
            className="h-12 w-full rounded-md border border-input bg-background px-3 text-base focus-visible:outline-2 focus-visible:outline-ring"
            value={textSize}
            onChange={(event) => changeTextSize(event.target.value)}
          >
            <option value="normal">{t("normal")}</option>
            <option value="large">{t("large")}</option>
            <option value="extraLarge">{t("extraLarge")}</option>
          </select>
        </div>
        <div>
          <label htmlFor="settings-theme" className="mb-2 block font-medium">
            {t("appearance")}
          </label>
          <p id="settings-theme-description" className="mb-2 text-sm text-muted-foreground">
            {t("appearanceDescription")}
          </p>
          <select
            id="settings-theme"
            aria-describedby="settings-theme-description"
            className="h-12 w-full rounded-md border border-input bg-background px-3 text-base focus-visible:outline-2 focus-visible:outline-ring"
            value={theme}
            onChange={(event) => changeTheme(event.target.value)}
          >
            <option value="system">{t("system")}</option>
            <option value="light">{t("light")}</option>
            <option value="dark">{t("dark")}</option>
          </select>
        </div>
      </div>

      <section
        className="rounded-xl border border-border p-4"
        aria-labelledby="notifications-title"
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 id="notifications-title" className="font-semibold">
              {t("notifications")}
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">{t("notificationsDescription")}</p>
          </div>
          <span className="rounded-full border border-border px-3 py-2 text-sm font-medium">
            {t("comingSoon")}
          </span>
        </div>
      </section>

      <section className="rounded-xl border border-border p-4" aria-labelledby="account-title">
        <h2 id="account-title" className="font-semibold">
          {t("account")}
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">{t("accountDescription")}</p>
        <Link
          href="/account"
          className="mt-3 inline-flex min-h-12 items-center rounded-md border border-border px-4 font-medium underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-ring"
        >
          {t("profile")}
        </Link>
      </section>

      <div aria-live="polite" className="min-h-6 text-sm">
        {message ? (
          <p className={isError ? "text-destructive" : "text-muted-foreground"}>{message}</p>
        ) : null}
      </div>
      <Button type="submit" size="touch" disabled={busy}>
        <Save aria-hidden="true" />
        {busy ? t("saving") : t("save")}
      </Button>
    </form>
  );
}
