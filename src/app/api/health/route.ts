import { NextResponse } from "next/server";

import packageJson from "../../../../package.json";

export const dynamic = "force-dynamic";

/**
 * Health check for uptime monitoring and CI smoke tests.
 * Returns `{ status, version, time }` as JSON.
 */
export function GET() {
  return NextResponse.json({
    status: "ok",
    version: packageJson.version,
    time: new Date().toISOString(),
  });
}
