import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { z } from "zod";

const channelSchema = z.object({
  channel: z.enum(["push", "telegram", "sms", "whatsapp", "email"]),
  enabled: z.boolean(),
  provider_token: z.string().optional(),
});

export async function POST(request: Request) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const body = await request.json();
    const result = channelSchema.safeParse(body);

    if (!result.success) {
      return new NextResponse("Invalid channel payload", { status: 400 });
    }

    const { channel, enabled, provider_token } = result.data;

    // Upsert user_notification_channels
    const { error } = await supabase
      .from("user_notification_channels")
      .upsert({
        user_id: session.user.id,
        channel,
        enabled,
        provider_token: provider_token || null,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'user_id, channel' });

    if (error) {
      console.error("[Channel API] DB Error", error);
      return new NextResponse("Internal Server Error", { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
