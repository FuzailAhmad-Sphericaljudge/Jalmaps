"use client";

import { useEffect } from "react";
import { useTranslations } from "next-intl";

import { ErrorState } from "@/components/jalmaps/state-components";

function reportError(error: Error, digest?: string) {
  console.error("Application route failed", { error, digest });
}

export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const t = useTranslations("errors");
  useEffect(() => reportError(error, error.digest), [error]);

  return (
    <main id="main" className="mx-auto w-full max-w-3xl flex-1 px-4 py-12">
      <ErrorState
        title={t("genericTitle")}
        description={t("genericDescription")}
        action={{ label: t("retry"), onClick: reset }}
      />
    </main>
  );
}
