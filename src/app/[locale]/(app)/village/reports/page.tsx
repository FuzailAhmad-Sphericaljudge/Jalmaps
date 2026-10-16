import { redirect } from "next/navigation";
import { getSession } from "@/server/auth";
import { createServerComponentClient } from "@/server/supabase/server-component";
import { ReportCenterView } from "@/features/reports/ReportCenterView";
import type { ReportRow, ScheduleRow } from "@/server/reports/actions";

interface PageProps {
  params: Promise<{ locale: string }>;
}

export default async function VillageReportsPage({ params }: PageProps) {
  const { locale } = await params;
  const session = await getSession();

  if (
    !session ||
    !session.user.role ||
    !["village_admin", "admin", "official"].includes(session.user.role)
  ) {
    redirect(`/${locale}/auth/login`);
    return null;
  }

  const supabase = await createServerComponentClient();

  const [reportsRes, schedulesRes] = await Promise.all([
    supabase
      .from("reports")
      .select("*")
      .eq("created_by", session.user.id)
      .order("created_at", { ascending: false })
      .limit(50),
    supabase
      .from("report_schedules")
      .select("*")
      .eq("user_id", session.user.id)
      .order("created_at", { ascending: false }),
  ]);

  const initialReports = (reportsRes.data ?? []) as ReportRow[];
  const initialSchedules = (schedulesRes.data ?? []) as ScheduleRow[];

  return (
    <div className="container mx-auto max-w-7xl px-4 py-6">
      <ReportCenterView
        initialReports={initialReports}
        initialSchedules={initialSchedules}
        defaultType="village"
        defaultScope={{ villageId: "vil-1" }}
        locale={locale}
      />
    </div>
  );
}
