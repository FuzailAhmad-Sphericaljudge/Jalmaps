"use client";

import { useState, type FormEvent } from "react";
import { Save } from "lucide-react";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { isAppLocale, type AppLocale } from "@/i18n/config";
import { updateProfile } from "./actions";

export function ProfileForm({
  locale,
  initialName,
  initialLocale,
  initialUnit,
}: {
  locale: AppLocale;
  initialName: string;
  initialLocale: AppLocale;
  initialUnit: "m" | "ft";
}) {
  const t = useTranslations("account");
  const [name, setName] = useState(initialName);
  const [preferredLocale, setPreferredLocale] = useState(initialLocale);
  const [preferredUnit, setPreferredUnit] = useState(initialUnit);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [messageIsError, setMessageIsError] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setMessage("");
    try {
      const result = await updateProfile(locale, {
        full_name: name,
        preferred_locale: preferredLocale,
        preferred_unit: preferredUnit,
      });
      setMessageIsError(result.status !== "saved");
      setMessage(result.status === "saved" ? t("saved") : t("invalid"));
    } catch (caught) {
      if (!(caught instanceof Error)) throw caught;
      setMessageIsError(true);
      setMessage(t("profileError"));
    } finally {
      setBusy(false);
    }
  }

  return (
    <form className="space-y-5" onSubmit={submit}>
      <div>
        <label className="mb-2 block font-medium" htmlFor="profile-name">
          {t("nameLabel")}
        </label>
        <Input
          id="profile-name"
          className="h-12"
          autoComplete="name"
          maxLength={120}
          value={name}
          onChange={(event) => setName(event.target.value)}
          required
        />
      </div>

      <div>
        <label className="mb-2 block font-medium" htmlFor="profile-language">
          {t("languageLabel")}
        </label>
        <select
          id="profile-language"
          className="h-12 w-full rounded-md border border-input bg-background px-3 text-base"
          value={preferredLocale}
          onChange={(event) => {
            if (isAppLocale(event.target.value)) setPreferredLocale(event.target.value);
          }}
        >
          <option value="en">{t("english")}</option>
          <option value="hi">{t("hindi")}</option>
        </select>
      </div>

      <div>
        <label className="mb-2 block font-medium" htmlFor="profile-unit">
          {t("unitLabel")}
        </label>
        <select
          id="profile-unit"
          className="h-12 w-full rounded-md border border-input bg-background px-3 text-base"
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

      <div aria-live="polite" className="min-h-6 text-sm">
        {message ? (
          <p className={messageIsError ? "text-destructive" : "text-muted-foreground"}>{message}</p>
        ) : null}
      </div>
      <Button type="submit" size="touch" disabled={busy}>
        <Save aria-hidden="true" />
        {busy ? t("saving") : t("save")}
      </Button>
    </form>
  );
}
