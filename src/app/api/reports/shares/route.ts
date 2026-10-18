import { NextResponse } from "next/server";
import { getCurrentUser } from "@/server/auth";
import { createRouteHandlerClient } from "@/server/supabase/route-handler";
import { createReportShare, revokeReportShare } from "@/server/reports/shares";

export async function POST(request: Request) {
  const current = await getCurrentUser();
  if (!current?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = (await request.json()) as { reportId?: string; expiryDays?: number };
    if (!body.reportId) {
      return NextResponse.json({ error: "Missing reportId" }, { status: 400 });
    }

    const supabase = await createRouteHandlerClient();
    const url = new URL(request.url);
    const baseUrl = `${url.protocol}//${url.host}`;

    const share = await createReportShare(supabase, body.reportId, current.user.id, {
      expiryDays: body.expiryDays ?? 30,
      baseUrl,
    });

    return NextResponse.json(share);
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Failed to create share link";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const current = await getCurrentUser();
  if (!current?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = (await request.json()) as { shareId?: string };
    if (!body.shareId) {
      return NextResponse.json({ error: "Missing shareId" }, { status: 400 });
    }

    const supabase = await createRouteHandlerClient();
    await revokeReportShare(supabase, body.shareId, current.user.id);

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Failed to revoke share link";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
