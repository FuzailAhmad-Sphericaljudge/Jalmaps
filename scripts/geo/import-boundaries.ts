import fs from "node:fs/promises";
import path from "node:path";
import simplify from "@turf/simplify";
import { z } from "zod";

export type Position = [number, number];
export type PolygonCoordinates = Position[][];
export type MultiPolygonCoordinates = PolygonCoordinates[];

export const GeoBoundaryFeatureSchema = z.object({
  type: z.literal("Feature"),
  properties: z
    .object({
      code: z.string().min(1),
      parent_code: z.string().optional(),
      level: z.enum(["state", "district", "block", "village"]),
      name_en: z.string().min(1),
      name_hi: z.string().optional(),
      name_pa: z.string().optional(),
      name_mr: z.string().optional(),
      name_gu: z.string().optional(),
      name_bn: z.string().optional(),
      name_ta: z.string().optional(),
      name_te: z.string().optional(),
      name_kn: z.string().optional(),
      name_ml: z.string().optional(),
      name_or: z.string().optional(),
    })
    .passthrough(),
  geometry: z.object({
    type: z.enum(["Polygon", "MultiPolygon"]),
    coordinates: z.array(z.unknown()),
  }),
});

export const GeoBoundaryCollectionSchema = z.object({
  type: z.literal("FeatureCollection"),
  features: z.array(GeoBoundaryFeatureSchema),
});

export type GeoBoundaryFeature = z.infer<typeof GeoBoundaryFeatureSchema>;

export interface ProcessedBoundary {
  code: string;
  parent_code?: string;
  level: "state" | "district" | "block" | "village";
  names: Record<string, string>;
  geometry: {
    type: "MultiPolygon";
    coordinates: MultiPolygonCoordinates;
  };
  simplifiedGeometry: {
    type: "MultiPolygon";
    coordinates: MultiPolygonCoordinates;
  };
}

/**
 * Normalizes Polygon to MultiPolygon structure
 */
function ensureMultiPolygon(geometry: { type: string; coordinates: unknown[] }): {
  type: "MultiPolygon";
  coordinates: MultiPolygonCoordinates;
} {
  if (geometry.type === "Polygon") {
    return {
      type: "MultiPolygon",
      coordinates: [geometry.coordinates as PolygonCoordinates],
    };
  }
  return geometry as { type: "MultiPolygon"; coordinates: MultiPolygonCoordinates };
}

/**
 * Pure parsing and geometry processing function for testability
 */
export function parseAndProcessBoundaries(
  rawGeoJson: unknown,
  options: { tolerance?: number } = {},
): ProcessedBoundary[] {
  const tolerance = options.tolerance ?? 0.001;
  const parsed = GeoBoundaryCollectionSchema.parse(rawGeoJson);

  return parsed.features.map((feature) => {
    const multiGeom = ensureMultiPolygon(feature.geometry);

    // Extract localized names
    const names: Record<string, string> = {
      en: feature.properties.name_en,
    };
    const locales = ["hi", "pa", "mr", "gu", "bn", "ta", "te", "kn", "ml", "or"];
    for (const loc of locales) {
      const val = feature.properties[`name_${loc}`];
      if (typeof val === "string" && val.length > 0) {
        names[loc] = val;
      }
    }

    // Simplify geometry using Turf
    const turfFeature = {
      type: "Feature" as const,
      properties: {},
      geometry: multiGeom,
    };
    const simplified = simplify(turfFeature, {
      tolerance,
      highQuality: true,
      mutate: false,
    });

    return {
      code: feature.properties.code,
      parent_code: feature.properties.parent_code,
      level: feature.properties.level,
      names,
      geometry: multiGeom,
      simplifiedGeometry: ensureMultiPolygon(simplified.geometry),
    };
  });
}

export async function importBoundariesFromFile(
  filePath: string,
  options: { dryRun?: boolean; tolerance?: number } = {},
) {
  const resolved = path.resolve(process.cwd(), filePath);
  const raw = await fs.readFile(resolved, "utf-8");
  const data = JSON.parse(raw);

  const processed = parseAndProcessBoundaries(data, options);
  console.log(`Parsed and validated ${processed.length} boundary features from ${filePath}`);

  if (options.dryRun) {
    console.log("Dry run mode: skipped database operations.");
    return processed;
  }

  const { createServiceRoleClient } = await import("../../src/server/supabase/service-role");
  const client = createServiceRoleClient();

  // Sort hierarchy insertion: state -> district -> block -> village
  const hierarchyOrder: Record<string, number> = {
    state: 1,
    district: 2,
    block: 3,
    village: 4,
  };

  const sorted = [...processed].sort(
    (a, b) => (hierarchyOrder[a.level] ?? 99) - (hierarchyOrder[b.level] ?? 99),
  );

  for (const item of sorted) {
    let parentId: string | null = null;
    if (item.parent_code) {
      const { data: parent } = await client
        .from("admin_areas")
        .select("id")
        .eq("code", item.parent_code)
        .maybeSingle();
      if (parent) {
        parentId = parent.id;
      }
    }

    const { error } = await client.from("admin_areas").upsert(
      {
        code: item.code,
        parent_id: parentId,
        level: item.level,
        names: item.names,
        // PostGIS geometry will be parsed from GeoJSON text via PostgREST / Supabase
        boundary: JSON.stringify(item.geometry) as unknown as never,
        boundary_simplified: JSON.stringify(item.simplifiedGeometry) as unknown as never,
      },
      { onConflict: "code" },
    );

    if (error) {
      console.error(`Failed to upsert area ${item.code} (${item.level}):`, error.message);
    } else {
      console.log(`Upserted ${item.level} [${item.code}]: ${item.names.en}`);
    }
  }

  // Trigger well point-in-polygon backfill and refresh area stats
  console.log("Triggering well-to-area assignment and area stats refresh...");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error: backfillErr } = await (client as any).rpc("backfill_well_admin_areas");
  if (backfillErr) {
    console.warn("Backfill warning:", backfillErr.message);
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error: refreshErr } = await (client as any).rpc("refresh_area_stats");
  if (refreshErr) {
    console.warn("Refresh stats warning:", refreshErr.message);
  }

  console.log("Boundary import completed successfully.");
  return processed;
}

async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes("--dry-run");
  const fileArg =
    args.find((a) => !a.startsWith("--")) ?? "data/geo/fixtures/sample-boundaries.json";

  await importBoundariesFromFile(fileArg, { dryRun });
}

if (process.env.NODE_ENV !== "test" && import.meta.url === `file://${process.argv[1]}`) {
  main().catch((err) => {
    console.error("Boundary import failed:", err);
    process.exit(1);
  });
}
