import { NextResponse } from "next/server";
import { z } from "zod";
import { createRouteHandlerClient } from "@/server/supabase/route-handler";
import { downsampleWithGaps } from "@/lib/series/lttb";

const querySchema = z
  .object({
    from: z.string().datetime(),
    to: z.string().datetime(),
    bucket: z.enum(["auto", "raw", "hourly", "daily"]).default("auto"),
    metric: z.enum(["depth_to_water_m"]).default("depth_to_water_m"),
  })
  .refine((data) => new Date(data.from).getTime() < new Date(data.to).getTime(), {
    message: "'from' must be before 'to'",
    path: ["from"],
  });

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createRouteHandlerClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const parsed = querySchema.safeParse({
    from: searchParams.get("from"),
    to: searchParams.get("to"),
    bucket: searchParams.get("bucket") || undefined,
    metric: searchParams.get("metric") || undefined,
  });

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid parameters", details: parsed.error.issues },
      { status: 400 },
    );
  }

  const { from, to, metric } = parsed.data;
  let bucket = parsed.data.bucket;

  const durationHours = (new Date(to).getTime() - new Date(from).getTime()) / (1000 * 60 * 60);

  if (bucket === "auto") {
    if (durationHours <= 48) {
      bucket = "raw";
    } else if (durationHours <= 24 * 30) {
      // 30 days
      bucket = "hourly";
    } else {
      bucket = "daily";
    }
  }

  // 1. Get node IDs for the well (RLS applies)
  const { data: nodes, error: nodesError } = await supabase
    .from("nodes")
    .select("id")
    .eq("well_id", id);

  if (nodesError) {
    return NextResponse.json({ error: "Database error", details: nodesError }, { status: 500 });
  }

  if (!nodes || nodes.length === 0) {
    return NextResponse.json([]); // No nodes or not allowed
  }

  const nodeIds = nodes.map((n) => n.id);

  // 2. Fetch bucketed readings
  const { data: readings, error: readingsError } = await supabase.rpc("readings_bucketed", {
    p_node_ids: nodeIds,
    p_from: from,
    p_to: to,
    p_bucket: bucket,
  });

  if (readingsError) {
    return NextResponse.json({ error: "Database error", details: readingsError }, { status: 500 });
  }

  if (!readings || readings.length === 0) {
    return NextResponse.json([]);
  }

  // 3. Downsample with LTTB (max 1000 points)
  // Gap threshold based on bucket
  let maxGapMs = 1000 * 60 * 60 * 2; // 2 hours for raw
  if (bucket === "hourly") maxGapMs = 1000 * 60 * 60 * 3; // 3 hours
  if (bucket === "daily") maxGapMs = 1000 * 60 * 60 * 24 * 3; // 3 days

  const dataPoints = readings.map((r) => ({
    x: new Date(r.bucket_time).getTime(),
    y: r.avg_depth !== null ? Number(r.avg_depth) : null,
    // we also keep the min, max, count just in case the frontend needs them?
    // Wait, downsampleWithGaps only uses x and y.
    // To preserve min/max, we'd need a custom LTTB or just use downsampled points
    ...r,
  }));

  const downsampled = downsampleWithGaps(dataPoints, 1000, maxGapMs);

  return NextResponse.json(downsampled);
}
