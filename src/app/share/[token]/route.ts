import { NextResponse } from "next/server";
import { createRouteHandlerClient } from "@/server/supabase/route-handler";
import { resolveReportShare } from "@/server/reports/shares";

export async function GET(_request: Request, context: { params: Promise<{ token: string }> }) {
  const { token } = await context.params;

  if (!token) {
    return NextResponse.json({ error: "Missing token" }, { status: 400 });
  }

  const supabase = await createRouteHandlerClient();
  const share = await resolveReportShare(supabase, token);

  if (!share.valid) {
    const errorMessages = {
      not_found: "The requested shared report could not be found.",
      expired: "This shared report link has expired (maximum 30-day retention).",
      revoked: "This shared report link has been revoked by the creator.",
    };

    const message = errorMessages[share.error ?? "not_found"];
    const status = share.error === "not_found" ? 404 : 410;

    return new Response(
      `<!DOCTYPE html>
      <html lang="en">
        <head>
          <meta charset="utf-8"/>
          <title>Link Unavailable - JalMaps</title>
          <style>
            body { font-family: system-ui, sans-serif; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; background: #f8fafc; color: #0f172a; }
            .card { background: white; padding: 32px; border-radius: 8px; border: 1px solid #e2e8f0; max-width: 440px; text-align: center; }
            h1 { font-size: 20px; color: #991b1b; margin-top: 0; }
            p { color: #64748b; font-size: 14px; line-height: 1.5; }
          </style>
        </head>
        <body>
          <div class="card">
            <h1>Shared Link Unavailable</h1>
            <p>${message}</p>
          </div>
        </body>
      </html>`,
      {
        status,
        headers: { "content-type": "text/html; charset=utf-8" },
      },
    );
  }

  if (share.signedDownloadUrl) {
    return NextResponse.redirect(share.signedDownloadUrl, { status: 302 });
  }

  return NextResponse.json({
    reportId: share.reportId,
    type: share.reportType,
    expiresAt: share.expiresAt,
  });
}
