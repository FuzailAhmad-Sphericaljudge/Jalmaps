import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { z } from "zod";

const prefsSchema = z.object({
  quiet_hours_start: z.string().optional(),
  quiet_hours_end: z.string().optional(),
  quiet_hours_tz: z.string().optional(),
  critical_bypasses_quiet_hours: z.boolean().optional(),
  daily_digest: z.boolean().optional(),
  severity_routing: z.any().optional(),
});

export async function GET() {
  const supabase = createRouteHandlerClient({ cookies });
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) return new NextResponse("Unauthorized", { status: 401 });

  const { data: prefs } = await supabase
    .from("user_notification_prefs")
    .select("*")
    .eq("user_id", session.user.id)
    .single();

  const { data: channels } = await supabase
    .from("user_notification_channels")
    .select("channel, enabled, verified_at")
    .eq("user_id", session.user.id);

  return NextResponse.json({ prefs: prefs || {}, channels: channels || [] });
}

export async function POST(request: Request) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) return new NextResponse("Unauthorized", { status: 401 });

    const body = await request.json();
    const result = prefsSchema.safeParse(body);

    if (!result.success) return new NextResponse("Invalid prefs payload", { status: 400 });

    const { error } = await supabase.from("user_notification_prefs").upsert({
      user_id: session.user.id,
      ...result.data,
      updated_at: new Date().toISOString(),
    });

    if (error) {
      console.error("[Prefs API] DB Error", error);
      return new NextResponse("Internal Server Error", { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (_error) {
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
