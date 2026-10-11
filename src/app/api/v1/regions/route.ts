import { NextResponse } from "next/server";
import { z } from "zod";
import { createRouteHandlerClient } from "@/server/supabase/route-handler";
import { listRegions } from "@/server/regions/service";

const querySchema = z.object({
  level: z.enum(["state", "district", "block", "village"]).optional(),
  parentId: z.string().uuid().optional(),
  sort: z.enum(["name", "wells", "critical", "depth", "change"]).default("critical"),
  order: z.enum(["asc", "desc"]).default("desc"),
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
    sort: searchParams.get("sort") || undefined,
    order: searchParams.get("order") || undefined,
    locale: searchParams.get("locale") || undefined,
  });

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid parameters", details: parsed.error.issues },
      { status: 400 },
    );
  }

  // Check caller role to see if privacy threshold bypass is permitted
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", session.user.id)
    .maybeSingle();

  const isSuperUser = profile?.role === "super_admin";

  try {
    const regions = await listRegions(supabase, {
      level: parsed.data.level,
      parentId: parsed.data.parentId,
      sort: parsed.data.sort,
      order: parsed.data.order,
      locale: parsed.data.locale,
      bypassPrivacy: isSuperUser,
    });

    return NextResponse.json({ data: regions });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Internal Server Error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
