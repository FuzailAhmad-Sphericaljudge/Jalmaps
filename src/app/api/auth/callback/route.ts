import { NextResponse } from "next/server";

import { defaultLocale, isAppLocale } from "@/i18n/config";
import { getPublicEnv } from "@/lib/db/public-env";
import { createRouteHandlerClient } from "@/server/supabase/route-handler";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const requestedLocale = requestUrl.searchParams.get("locale");
  const locale = isAppLocale(requestedLocale) ? requestedLocale : defaultLocale;
  const siteUrl = getPublicEnv().NEXT_PUBLIC_SITE_URL;
  const code = requestUrl.searchParams.get("code");

  if (!code) {
    return NextResponse.redirect(new URL(`/${locale}/login`, siteUrl));
  }

  const supabase = await createRouteHandlerClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) {
    return NextResponse.redirect(new URL(`/${locale}/login`, siteUrl));
  }

  return NextResponse.redirect(new URL(`/${locale}/`, siteUrl));
}
