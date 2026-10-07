import { NextResponse } from "next/server";
import { getServiceRoleClient } from "@/server/supabase/service-role";
import { processIngestion, IngestError } from "@/server/ingest/service";

export async function POST(request: Request) {
  try {
    const authHeader = request.headers.get("Authorization");
    const bodyRaw = await request.text();
    const clientIp = request.headers.get("x-forwarded-for") ?? "unknown";

    const db = getServiceRoleClient();

    const response = await processIngestion(db, authHeader, bodyRaw, clientIp);

    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    if (error instanceof IngestError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }

    console.error("Ingestion failed:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
