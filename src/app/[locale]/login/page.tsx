import { notFound } from "next/navigation";

import { isAppLocale } from "@/i18n/config";
import { redirect } from "@/i18n/navigation";
import { getCurrentUser } from "@/server/auth";

import { LoginForm } from "./login-form";

export default async function LoginPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isAppLocale(locale)) notFound();

  const current = await getCurrentUser();
  if (current) {
    redirect({
      href: current.profile?.onboarding_completed_at ? "/" : "/onboarding",
      locale,
    });
  }

  return (
    <main id="main" className="flex flex-1 items-center justify-center px-4 py-10">
      <LoginForm locale={locale} />
    </main>
  );
}
