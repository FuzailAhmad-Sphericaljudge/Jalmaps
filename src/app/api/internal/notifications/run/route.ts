import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { getNotificationProvider } from "@/server/notifications/factory";

export async function POST(request: Request) {
  // Simple cron secret protection
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  // Use service role for internal worker
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );

  // Claim up to 50 pending rows using an RPC that implements FOR UPDATE SKIP LOCKED
  const { data: outboxRows, error } = await supabase.rpc("claim_notification_outbox", {
    batch_size: 50,
  });

  if (error || !outboxRows) {
    console.error("[Notifications Worker] Failed to claim outbox rows", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }

  let sentCount = 0;

  for (const row of outboxRows) {
    const provider = getNotificationProvider(row.channel);

    // In a real app we would get the channel specific address from user_notification_channels
    const { data: channelData } = await supabase
      .from("user_notification_channels")
      .select("provider_token")
      .eq("user_id", row.user_id)
      .eq("channel", row.channel)
      .single();

    if (!channelData || !channelData.provider_token) {
      await supabase
        .from("notification_outbox")
        .update({ status: "skipped", error: "No provider token" })
        .eq("id", row.id);
      continue;
    }

    const result = await provider.send(channelData.provider_token, row.payload);

    if (result.success) {
      await supabase
        .from("notification_outbox")
        .update({
          status: "sent",
          sent_at: new Date().toISOString(),
          provider_message_id: result.providerMessageId,
        })
        .eq("id", row.id);
      sentCount++;
    } else {
      const attempts = row.attempts + 1;
      const status = attempts >= 3 ? "failed" : "pending";
      // Exponential backoff
      const nextAttemptAt = new Date(Date.now() + Math.pow(2, attempts) * 60000);

      await supabase
        .from("notification_outbox")
        .update({
          status,
          attempts,
          error: result.error,
          next_attempt_at: nextAttemptAt.toISOString(),
        })
        .eq("id", row.id);
    }
  }

  return NextResponse.json({ success: true, processed: outboxRows.length, sent: sentCount });
}
