import { getCurrentUser } from "@/server/auth";
import { getAccountExportData } from "@/server/db/account-export";
import { DatabaseError } from "@/server/db/errors";
import { createRouteHandlerClient } from "@/server/supabase/route-handler";

export async function GET() {
  const current = await getCurrentUser();
  if (!current?.profile?.onboarding_completed_at) {
    return Response.json({ error: "unauthorized" }, { status: 401 });
  }

  const supabase = await createRouteHandlerClient();
  try {
    const accountData = await getAccountExportData(supabase, current.user.id);
    return new Response(
      JSON.stringify(
        {
          exported_at: new Date().toISOString(),
          profile: current.profile,
          ...accountData,
        },
        null,
        2,
      ),
      {
        headers: {
          "content-type": "application/json; charset=utf-8",
          "content-disposition": 'attachment; filename="jalmaps-data.json"',
          "cache-control": "private, no-store",
        },
      },
    );
  } catch (error) {
    if (!(error instanceof DatabaseError)) throw error;
    console.error("Account data export failed", error.code);
    return Response.json({ error: "export_unavailable" }, { status: 503 });
  }
}
