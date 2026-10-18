import { NextResponse } from "next/server";
import { createRouteHandlerClient } from "@/server/supabase/route-handler";
import { unsubscribeReportSchedule } from "@/server/reports/digests";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  if (!id) {
    return NextResponse.json({ error: "Missing schedule id" }, { status: 400 });
  }

  try {
    const supabase = await createRouteHandlerClient();
    const success = await unsubscribeReportSchedule(supabase, id);

    if (!success) {
      return NextResponse.json({ error: "Schedule not found or error occurred" }, { status: 404 });
    }

    return new Response(
      `<!DOCTYPE html>
      <html lang="en">
        <head>
          <meta charset="utf-8"/>
          <title>Unsubscribed - JalMaps</title>
          <style>
            body { font-family: system-ui, sans-serif; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; background: #f8fafc; color: #0f172a; }
            .card { background: white; padding: 32px; border-radius: 8px; border: 1px solid #e2e8f0; max-width: 420px; text-align: center; }
            h1 { font-size: 20px; color: #0369a1; margin-top: 0; }
            p { color: #64748b; font-size: 14px; line-height: 1.5; }
          </style>
        </head>
        <body>
          <div class="card">
            <h1>Unsubscribed Successfully</h1>
            <p>You will no longer receive scheduled groundwater report digests for this area.</p>
          </div>
        </body>
      </html>`,
      {
        headers: { "content-type": "text/html; charset=utf-8" },
      },
    );
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Error unsubscribing";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
