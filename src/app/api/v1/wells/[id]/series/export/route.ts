import { NextResponse } from "next/server";
import { z } from "zod";
import { createRouteHandlerClient } from "@/server/supabase/route-handler";
import { getTranslations } from "next-intl/server";

const querySchema = z
  .object({
    from: z.string().datetime(),
    to: z.string().datetime(),
    bucket: z.enum(["auto", "raw", "hourly", "daily"]).default("auto"),
    locale: z.string().default("en"),
    unit: z.enum(["m", "ft"]).default("m"),
  })
  .refine((data) => new Date(data.from).getTime() < new Date(data.to).getTime(), {
    message: "'from' must be before 'to'",
    path: ["from"],
  });

const ROW_LIMIT = 50000;

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createRouteHandlerClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const parsed = querySchema.safeParse({
    from: searchParams.get("from"),
    to: searchParams.get("to"),
    bucket: searchParams.get("bucket") || undefined,
    locale: searchParams.get("locale") || undefined,
    unit: searchParams.get("unit") || undefined,
  });

  if (!parsed.success) {
    return new NextResponse("Invalid parameters", { status: 400 });
  }

  const { from, to, locale, unit } = parsed.data;
  let bucket = parsed.data.bucket;

  const durationHours = (new Date(to).getTime() - new Date(from).getTime()) / (1000 * 60 * 60);

  if (bucket === "auto") {
    if (durationHours <= 48) {
      bucket = "raw";
    } else if (durationHours <= 24 * 30) {
      bucket = "hourly";
    } else {
      bucket = "daily";
    }
  }

  // 1. Get nodes
  const { data: nodes, error: nodesError } = await supabase
    .from("nodes")
    .select("id")
    .eq("well_id", id);

  if (nodesError || !nodes || nodes.length === 0) {
    return new NextResponse("Not Found", { status: 404 });
  }

  const nodeIds = nodes.map((n) => n.id);

  // 2. Fetch data
  const { data: readings, error: readingsError } = await supabase.rpc("readings_bucketed", {
    p_node_ids: nodeIds,
    p_from: from,
    p_to: to,
    p_bucket: bucket,
  });

  if (readingsError) {
    return new NextResponse("Database error", { status: 500 });
  }

  if (!readings) {
    return new NextResponse("No data", { status: 404 });
  }

  if (readings.length > ROW_LIMIT) {
    return new NextResponse("Too many rows requested", { status: 413 });
  }

  // 3. Format CSV
  const t = await getTranslations({ locale, namespace: "history.export" });

  // UTF-8 BOM
  const BOM = "\uFEFF";
  const header = `${t("date")},${t("depth")} (${unit}),${t("minDepth")} (${unit}),${t("maxDepth")} (${unit}),${t("readingCount")}\n`;

  const multiplier = unit === "ft" ? 3.28084 : 1;

  const rows = readings.map((r) => {
    const date = new Date(r.bucket_time).toISOString();
    const avg = r.avg_depth ? (Number(r.avg_depth) * multiplier).toFixed(3) : "";
    const min = r.min_depth ? (Number(r.min_depth) * multiplier).toFixed(3) : "";
    const max = r.max_depth ? (Number(r.max_depth) * multiplier).toFixed(3) : "";
    return `${date},${avg},${min},${max},${r.reading_count}`;
  });

  const csv = BOM + header + rows.join("\n");

  const filename = `jalmaps_well_${id}_${from.split("T")[0]}_${to.split("T")[0]}.csv`;

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
