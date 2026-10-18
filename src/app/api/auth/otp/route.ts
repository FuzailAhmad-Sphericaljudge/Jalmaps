import { NextResponse } from "next/server";

import { defaultLocale, isAppLocale } from "@/i18n/config";
import { getPublicEnv } from "@/lib/db/public-env";
import { getTrustedClientIp, normalizeOtpRequest } from "@/server/auth/otp-request";
import { createRouteHandlerClient } from "@/server/supabase/route-handler";
import { consumeOtpRateLimit } from "@/server/supabase/otp-rate-limit";

export const runtime = "nodejs";

function jsonError(error: string, status: number) {
  return NextResponse.json({ error }, { status });
}

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch (caught) {
    if (caught instanceof SyntaxError || caught instanceof TypeError) {
      return jsonError("invalid_request", 400);
    }
    throw caught;
  }

  const destination = normalizeOtpRequest(body);
  if (!destination) return jsonError("invalid_request", 400);

  const ip = getTrustedClientIp(request.headers);
  if (!ip) {
    console.error("OTP request missing a trusted client IP");
    return jsonError("unavailable", 503);
  }

  let rateLimit: Awaited<ReturnType<typeof consumeOtpRateLimit>>;
  try {
    rateLimit = await consumeOtpRateLimit(
      "phone" in destination
        ? { type: "phone", value: destination.phone }
        : { type: "email", value: destination.email },
      ip,
    );
  } catch (caught) {
    console.error(
      "OTP rate-limit backend unavailable",
      caught instanceof Error ? caught.name : "unknown error",
    );
    return jsonError("unavailable", 503);
  }

  if (rateLimit.status === "limited") return jsonError("rate_limited", 429);
  if (rateLimit.status === "unavailable") return jsonError("unavailable", 503);

  try {
    const supabase = await createRouteHandlerClient();
    const localeHeader = request.headers.get("x-jalmaps-locale");
    const locale = isAppLocale(localeHeader) ? localeHeader : defaultLocale;
    const callbackUrl = new URL("/api/auth/callback", getPublicEnv().NEXT_PUBLIC_SITE_URL);
    callbackUrl.searchParams.set("locale", locale);
    const { error } = await supabase.auth.signInWithOtp({
      ...destination,
      options: {
        shouldCreateUser: true,
        ...("email" in destination && { emailRedirectTo: callbackUrl.toString() }),
      },
    });

    if (error) {
      console.error("OTP delivery failed", error.status, error.code);
      return jsonError("unavailable", 503);
    }
  } catch (caught) {
    console.error(
      "OTP delivery backend unavailable",
      caught instanceof Error ? caught.name : "unknown error",
    );
    return jsonError("unavailable", 503);
  }

  return NextResponse.json({ status: "accepted" }, { status: 202 });
}
