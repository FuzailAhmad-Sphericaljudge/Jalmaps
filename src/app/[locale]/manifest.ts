import { MetadataRoute } from "next";
import { getTranslations } from "next-intl/server";
import { AppLocale, locales } from "@/i18n/config";
import { theme } from "@/styles/tokens"; // We can hardcode colors if tokens is not structured for this

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
        purpose: "any maskable",
      },
      {
        src: "/icon-512.svg",
        sizes: "512x512",
        type: "image/svg+xml",
        purpose: "any maskable",
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
