import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { DesignSystemGallery } from "@/components/ui-gallery/design-system-gallery";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "gallery" });

  return {
    title: `JalMaps — ${t("title")}`,
    description: t("description"),
    robots: { index: false, follow: false },
  };
}

/**
 * Component gallery — enabled outside production only.
 * Set NODE_ENV=production (the default for `next start` in prod builds) to disable.
 */
export default async function DesignSystemPage({ params }: Props) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "gallery" });

  if (process.env.NODE_ENV === "production") {
    return (
      <main id="main" className="mx-auto max-w-md p-8">
        <h1 className="text-xl font-semibold">{t("unavailable.title")}</h1>
        <p className="text-foreground-muted">{t("unavailable.description")}</p>
      </main>
    );
  }

  return (
    <main id="main" className="min-h-screen">
      <DesignSystemGallery />
    </main>
  );
}
