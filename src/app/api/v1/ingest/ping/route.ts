import { NextResponse } from "next/server";
import { createServiceRoleClient } from "@/server/supabase/service-role";
import { verifyNodeKey } from "@/server/ingest/keys";

export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // To verify node key we need the hardwareId. For ping, maybe it's in the URL or we can verify just the prefix.
    // Since verifyNodeKey requires hardwareId, we can extract it from search params.
    const url = new URL(request.url);
    const hardwareId = url.searchParams.get("hardware_id");

    if (!hardwareId) {
      return NextResponse.json(
        { error: "hardware_id query parameter is required" },
        { status: 400 },
      );
    }

    const token = authHeader.substring(7);
    const db = createServiceRoleClient();

    const nodeId = await verifyNodeKey(db, token, hardwareId);
    if (!nodeId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    return NextResponse.json({ server_time: new Date().toISOString() }, { status: 200 });
  } catch {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
