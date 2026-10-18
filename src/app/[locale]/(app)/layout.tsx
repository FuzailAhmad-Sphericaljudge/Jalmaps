import { notFound } from "next/navigation";

import { isAppLocale } from "@/i18n/config";

export default async function SignedInLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale: requestedLocale } = await params;
  if (!isAppLocale(requestedLocale)) notFound();
  return children;
}
