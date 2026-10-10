import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { PageContainer, PageHeader } from "@/components/layout/page-scaffolding";
import { ProtectedAppShell } from "@/components/layout/protected-app-shell";
import { isAppLocale } from "@/i18n/config";
import { requireRole } from "@/server/auth";
import { createServerComponentClient } from "@/server/supabase/server-component";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
export default async function AlertCenterPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isAppLocale(locale)) notFound();

  // Allow farmers to view their alerts. We might also allow area admins later.
  const current = await requireRole(locale, "farmer");
  const t = await getTranslations({ locale, namespace: "alerts" });
  const client = await createServerComponentClient();

  // Query open alerts accessible via RLS
  const { data: alerts } = await client
    .from("alerts")
    .select(
      `
      id,
      severity,
      status,
      message_key,
      triggered_at,
      well_id,
      wells!inner(name)
    `,
    )
    .in("status", ["open", "acknowledged"])
    .order("triggered_at", { ascending: false });

  type AlertRecord = NonNullable<typeof alerts>[0];

  return (
    <ProtectedAppShell locale={locale} current={current}>
      <PageContainer>
        <PageHeader title={t("rules.title")} />

        <div className="mt-6 grid gap-4">
          {alerts?.length === 0 ? (
            <div className="rounded-lg border border-dashed p-8 text-center text-muted-foreground">
              {t("center.noAlerts")}
            </div>
          ) : (
            alerts?.map((alert: AlertRecord) => (
              <Card key={alert.id}>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">
                      <Link href={`/app/farmer/wells/${alert.well_id}`} className="hover:underline">
                        {alert.wells?.name}
                      </Link>
                    </CardTitle>
                    <Badge variant={alert.severity === "critical" ? "destructive" : "secondary"}>
                      {alert.severity}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="mb-1 text-sm font-medium">
                    {/* Simplified translation lookup for MVP */}
                    {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                    {t(alert.message_key.replace("alerts.", "") as any)}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {t("center.triggeredAgo", {
                      time: new Date(alert.triggered_at).toLocaleString(),
                    })}
                  </div>
                  <div className="mt-4 flex gap-2">
                    {alert.status === "open" && (
                      <button className="rounded bg-primary px-3 py-1 text-xs text-primary-foreground">
                        {t("center.acknowledge")}
                      </button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </PageContainer>
    </ProtectedAppShell>
  );
}
