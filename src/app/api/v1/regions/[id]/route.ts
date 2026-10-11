import { NextResponse } from "next/server";
import { z } from "zod";
import { createRouteHandlerClient } from "@/server/supabase/route-handler";
import { getRegionDetail } from "@/server/regions/service";

const paramsSchema = z.object({
  id: z.string().uuid(),
});

export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  const supabase = await createRouteHandlerClient();

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const resolvedParams = await context.params;
  const parsedParams = paramsSchema.safeParse(resolvedParams);

  if (!parsedParams.success) {
    return NextResponse.json({ error: "Invalid region ID" }, { status: 400 });
  }

  const { searchParams } = new URL(request.url);
  const locale = searchParams.get("locale") || "en";

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", session.user.id)
    .maybeSingle();

  const isSuperUser = profile?.role === "super_admin";

  try {
    const detail = await getRegionDetail(supabase, parsedParams.data.id, {
      locale,
      bypassPrivacy: isSuperUser,
    });

    if (!detail) {
      return NextResponse.json({ error: "Region not found" }, { status: 404 });
    }

    return NextResponse.json({ data: detail });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Internal Server Error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
