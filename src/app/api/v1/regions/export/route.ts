import { NextResponse } from "next/server";
import { z } from "zod";
import { createRouteHandlerClient } from "@/server/supabase/route-handler";
import { generateRegionsCSV, listRegions } from "@/server/regions/service";

const querySchema = z.object({
  level: z.enum(["state", "district", "block", "village"]).optional(),
  parentId: z.string().uuid().optional(),
  locale: z.string().default("en"),
});

export async function GET(request: Request) {
  const supabase = await createRouteHandlerClient();

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const parsed = querySchema.safeParse({
    level: searchParams.get("level") || undefined,
    parentId: searchParams.get("parentId") || undefined,
    locale: searchParams.get("locale") || undefined,
  });

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid parameters", details: parsed.error.issues },
      { status: 400 },
    );
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", session.user.id)
    .maybeSingle();

  const isSuperUser = profile?.role === "admin";

  try {
    const regions = await listRegions(supabase, {
      level: parsed.data.level,
      parentId: parsed.data.parentId,
      locale: parsed.data.locale,
      bypassPrivacy: isSuperUser,
    });

    const csvData = generateRegionsCSV(regions);
    const filename = `regions-${parsed.data.level ?? "all"}-${new Date().toISOString().slice(0, 10)}.csv`;

    return new NextResponse(csvData, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "private, no-cache, no-store, must-revalidate",
      },
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Internal Server Error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
