import { getTranslations } from "next-intl/server";

import { Skeleton } from "@/components/ui/skeleton";

export default async function AppLoading() {
  const t = await getTranslations("shell");
  return (
    <main
      id="main"
      aria-busy="true"
      className="mx-auto w-full max-w-7xl flex-1 space-y-6 px-4 py-8 sm:px-6 lg:px-8"
    >
      <span className="sr-only">{t("loading")}</span>
      <Skeleton className="h-10 w-64" />
      <Skeleton className="h-5 w-96 max-w-full" />
      <Skeleton className="h-48 w-full rounded-xl" />
    </main>
  );
}
