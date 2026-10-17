import { redirect } from "next/navigation";
import { getSession } from "@/server/auth";
import { createServerComponentClient } from "@/server/supabase/server-component";
import { getOfficialDashboardData } from "@/server/official/service";
import { listSavedViews } from "@/server/official/saved-views";
import { OfficialDashboardView } from "@/features/official/OfficialDashboardView";

interface PageProps {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ areaId?: string; preset?: "7d" | "30d" | "90d" | "1y" }>;
}

export default async function OfficialDashboardPage({ params, searchParams }: PageProps) {
  const { locale } = await params;
  const { areaId, preset } = await searchParams;
  const session = await getSession();

  if (!session || !session.user.role || !["official", "admin"].includes(session.user.role)) {
    redirect(`/${locale}/auth/login`);
  }

  const supabase = await createServerComponentClient();
  const [data, savedViews] = await Promise.all([
    getOfficialDashboardData(supabase, { areaId, preset, locale }),
    listSavedViews(supabase),
  ]);

  return (
    <div className="container mx-auto max-w-7xl px-4 py-6">
      <OfficialDashboardView
        data={data}
        savedViews={savedViews}
        locale={locale}
        userRole={session.user.role}
      />
    </div>
  );
}
