import { NextResponse } from "next/server";
import { z } from "zod";
import { createRouteHandlerClient } from "@/server/supabase/route-handler";
import { getMapGeoJSON } from "@/server/map/service";

const querySchema = z.object({
  bbox: z.string().refine((val) => {
    const parts = val.split(",").map(Number);
    return (
      parts.length === 4 &&
      !parts.some((n) => Number.isNaN(n)) &&
      parts[0]! >= -180 &&
      parts[0]! <= 180 &&
      parts[2]! >= -180 &&
      parts[2]! <= 180 &&
      parts[1]! >= -90 &&
      parts[1]! <= 90 &&
      parts[3]! >= -90 &&
      parts[3]! <= 90 &&
      parts[0]! <= parts[2]! &&
      parts[1]! <= parts[3]!
    );
  }, "bbox must be minLng,minLat,maxLng,maxLat"),
  zoom: z.coerce.number().min(0).max(24).default(10),
  status: z.enum(["all", "normal", "warning", "critical", "unknown"]).optional(),
  type: z.enum(["all", "borewell", "open_well", "tank", "pond"]).optional(),
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
    bbox: searchParams.get("bbox"),
    zoom: searchParams.get("zoom") || undefined,
    status: searchParams.get("status") || undefined,
    type: searchParams.get("type") || undefined,
  });

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid parameters", details: parsed.error.issues },
      { status: 400 },
    );
  }

  const { bbox, zoom, status, type } = parsed.data;
  const bboxParts = bbox.split(",").map(Number) as [number, number, number, number];

  // Fetch caller's profile
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", session.user.id)
    .maybeSingle();

  if (profileError || !profile) {
    return NextResponse.json({ error: "Profile not found" }, { status: 403 });
  }

  try {
    const geojson = await getMapGeoJSON({
      supabase,
      user: { id: session.user.id },
      profile,
      params: {
        bbox: bboxParts,
        zoom,
        status,
        type,
      },
    });

    return NextResponse.json(geojson, {
      headers: {
        "Content-Type": "application/geo+json",
        "Cache-Control": "private, max-age=30, stale-while-revalidate=60",
      },
    });
  } catch (err) {
    return NextResponse.json(
      { error: "Failed to generate map data", details: (err as Error).message },
      { status: 500 },
    );
  }
}
