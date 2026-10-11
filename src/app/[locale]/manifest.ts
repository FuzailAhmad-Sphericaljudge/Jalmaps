import { MetadataRoute } from "next";
import { getTranslations } from "next-intl/server";
import { AppLocale } from "@/i18n/config";

export default async function manifest({
  params: { locale },
}: {
  params: { locale: AppLocale };
}): Promise<MetadataRoute.Manifest> {
  const t = await getTranslations({ locale, namespace: "pwa" });

  return {
    name: t("name"),
    short_name: t("shortName"),
    description: t("description"),
    start_url: `/${locale}`,
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#0f172a", // Match app primary/brand color
    icons: [
      {
        src: "/icon-192.svg",
        sizes: "192x192",
        type: "image/svg+xml",
        purpose: "maskable",
      },
      {
        src: "/icon-512.svg",
        sizes: "512x512",
        type: "image/svg+xml",
        purpose: "maskable",
      },
    ],
    shortcuts: [
      {
        name: t("shortcutMyWells"),
        url: `/${locale}/app/farmer`,
      },
      {
        name: t("shortcutAlerts"),
        url: `/${locale}/app/farmer/alerts`,
      },
    ],
  };
}
