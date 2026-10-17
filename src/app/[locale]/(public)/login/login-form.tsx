"use client";

import { useEffect, useState, type FormEvent } from "react";
import { ArrowLeft, Globe2, Mail, Phone } from "lucide-react";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createBrowserSupabaseClient } from "@/lib/db/client";
import { getPublicEnv } from "@/lib/db/public-env";
import type { AppLocale } from "@/i18n/config";
import { emailSchema, indianPhoneSchema, otpCodeSchema } from "@/lib/schemas/auth";
import { useRouter } from "@/i18n/navigation";

type LoginMethod = "phone" | "email";
type LoginStep = "destination" | "verify" | "sent";

export function LoginForm({ locale }: { locale: AppLocale }) {
  const t = useTranslations("auth");
  const router = useRouter();
  const [method, setMethod] = useState<LoginMethod>("phone");
  const [step, setStep] = useState<LoginStep>("destination");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [secondsToResend, setSecondsToResend] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  useEffect(() => {
    if (secondsToResend <= 0) return;
    const timeout = window.setTimeout(() => setSecondsToResend((value) => value - 1), 1000);
    return () => window.clearTimeout(timeout);
  }, [secondsToResend]);

  function changeMethod(nextMethod: LoginMethod) {
    setMethod(nextMethod);
    setStep("destination");
    setError("");
    setNotice("");
    setCode("");
    setSecondsToResend(0);
  }

  async function sendOtp(destination: { phone: string } | { email: string }) {
    setBusy(true);
    setError("");
    setNotice("");

    try {
      const response = await fetch("/api/auth/otp", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-jalmaps-locale": locale,
        },
        body: JSON.stringify(destination),
      });

      if (response.status === 429) {
        setError(t("rateLimited"));
        return;
      }
      if (!response.ok) {
        setError(t("genericError"));
        return;
      }

      if ("phone" in destination) {
        setStep("verify");
        setSecondsToResend(60);
        setNotice(t("codeSent"));
      } else {
        setStep("sent");
        setNotice(t("emailSent"));
      }
    } catch (caught) {
      if (!(caught instanceof TypeError)) throw caught;
      setError(t("genericError"));
    } finally {
      setBusy(false);
    }
  }

  function submitDestination(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    if (method === "phone") {
      const result = indianPhoneSchema.safeParse(phone);
      if (!result.success) {
        setError(t("invalidPhone"));
        return;
      }
      void sendOtp({ phone: result.data });
      return;
    }

    const result = emailSchema.safeParse(email);
    if (!result.success) {
      setError(t("invalidEmail"));
      return;
    }
    void sendOtp({ email: result.data });
  }

  async function verifyCode(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    const parsedPhone = indianPhoneSchema.safeParse(phone);
    if (!parsedPhone.success || !otpCodeSchema.safeParse(code).success) {
      setError(t("invalidCode"));
      return;
    }

    setBusy(true);
    try {
      const { error: verifyError } = await createBrowserSupabaseClient().auth.verifyOtp({
        phone: parsedPhone.data,
        token: code,
        type: "sms",
      });
      if (verifyError) {
        setError(t("invalidCode"));
        return;
      }
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  async function signInWithGoogle() {
    setBusy(true);
    setError("");
    try {
      const callbackUrl = new URL("/api/auth/callback", getPublicEnv().NEXT_PUBLIC_SITE_URL);
      callbackUrl.searchParams.set("locale", locale);
      const { error: oauthError } = await createBrowserSupabaseClient().auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo: callbackUrl.toString() },
      });
      if (oauthError) setError(t("genericError"));
    } catch (caught) {
      if (!(caught instanceof TypeError)) throw caught;
      setError(t("genericError"));
    } finally {
      setBusy(false);
    }
  }

  const googleEnabled = getPublicEnv().NEXT_PUBLIC_GOOGLE_OAUTH_ENABLED;

  return (
    <section className="mx-auto w-full max-w-md rounded-2xl border bg-card p-5 shadow-sm sm:p-8">
      <h1 className="text-2xl font-semibold">{t("loginTitle")}</h1>
      <p className="mt-2 text-muted-foreground">{t("loginDescription")}</p>

      <div className="mt-6 grid grid-cols-2 gap-2" role="group" aria-label={t("loginTitle")}>
        <Button
          type="button"
          size="touch"
          variant={method === "phone" ? "default" : "outline"}
          aria-pressed={method === "phone"}
          onClick={() => changeMethod("phone")}
        >
          <Phone aria-hidden="true" />
          {t("phoneTab")}
        </Button>
        <Button
          type="button"
          size="touch"
          variant={method === "email" ? "default" : "outline"}
          aria-pressed={method === "email"}
          onClick={() => changeMethod("email")}
        >
          <Mail aria-hidden="true" />
          {t("emailTab")}
        </Button>
      </div>

      {method === "phone" && step === "verify" ? (
        <form className="mt-6 space-y-4" onSubmit={verifyCode}>
          <div>
            <label className="mb-2 block font-medium" htmlFor="otp-code">
              {t("otpLabel")}
            </label>
            <Input
              id="otp-code"
              autoComplete="one-time-code"
              inputMode="numeric"
              pattern="[0-9]{6}"
              maxLength={6}
              className="h-12 text-center text-xl tracking-[0.4em]"
              value={code}
              onChange={(event) => setCode(event.target.value.replace(/\D/g, "").slice(0, 6))}
              required
            />
          </div>
          <Button className="w-full" size="touch" type="submit" disabled={busy}>
            {t("verifyCode")}
          </Button>
          <div className="flex flex-col items-stretch gap-2 sm:flex-row">
            <Button
              type="button"
              size="touch"
              variant="outline"
              className="flex-1"
              disabled={busy || secondsToResend > 0}
              onClick={() => {
                const result = indianPhoneSchema.safeParse(phone);
                if (result.success) void sendOtp({ phone: result.data });
              }}
            >
              {secondsToResend > 0 ? t("resendIn", { seconds: secondsToResend }) : t("resendCode")}
            </Button>
            <Button
              type="button"
              size="touch"
              variant="ghost"
              className="flex-1"
              onClick={() => changeMethod("phone")}
            >
              <ArrowLeft aria-hidden="true" />
              {t("changeNumber")}
            </Button>
          </div>
        </form>
      ) : method === "email" && step === "sent" ? (
        <div className="mt-6 space-y-4" role="status">
          <p>{notice}</p>
          <Button
            type="button"
            size="touch"
            variant="outline"
            onClick={() => {
              setStep("destination");
              setNotice("");
            }}
          >
            <ArrowLeft aria-hidden="true" />
            {t("emailTab")}
          </Button>
        </div>
      ) : (
        <form className="mt-6 space-y-4" onSubmit={submitDestination}>
          {method === "phone" ? (
            <div>
              <label className="mb-2 block font-medium" htmlFor="phone-number">
                {t("phoneLabel")}
              </label>
              <div className="flex min-h-12">
                <span className="inline-flex min-w-16 items-center justify-center rounded-l-md border border-r-0 bg-muted px-3 font-medium">
                  {t("phonePrefix")}
                </span>
                <Input
                  id="phone-number"
                  type="tel"
                  autoComplete="tel-national"
                  inputMode="numeric"
                  className="h-12 rounded-l-none"
                  value={phone}
                  onChange={(event) => setPhone(event.target.value)}
                  aria-describedby="phone-hint"
                  required
                />
              </div>
              <p className="mt-2 text-sm text-muted-foreground" id="phone-hint">
                {t("phoneHint")}
              </p>
            </div>
          ) : (
            <div>
              <label className="mb-2 block font-medium" htmlFor="email-address">
                {t("emailLabel")}
              </label>
              <Input
                id="email-address"
                type="email"
                autoComplete="email"
                className="h-12"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
              />
            </div>
          )}
          <Button className="w-full" size="touch" type="submit" disabled={busy}>
            {method === "phone" ? <Phone aria-hidden="true" /> : <Mail aria-hidden="true" />}
            {method === "phone" ? t("sendCode") : t("sendLink")}
          </Button>
        </form>
      )}

      <div className="mt-4 min-h-6 text-sm" aria-live="polite">
        {error ? <p className="text-destructive">{error}</p> : notice ? <p>{notice}</p> : null}
      </div>

      {googleEnabled ? (
        <Button
          type="button"
          size="touch"
          variant="outline"
          className="mt-3 w-full"
          disabled={busy}
          onClick={() => void signInWithGoogle()}
        >
          <Globe2 aria-hidden="true" />
          {t("continueWithGoogle")}
        </Button>
      ) : null}
    </section>
  );
}
