import type { SupabaseClient } from "@supabase/supabase-js";
import type { Profile } from "@/server/auth";
import type { Database } from "@/lib/db/types";
import { clusterFeatures } from "./cluster";
import { applyRolePrivacy, type RawWell, type SanitizedWellFeature } from "./privacy";
import type { MapFeatureCollection, MapGeoJSONFeature, MapQueryParams } from "./types";

export interface MapServiceOptions {
  supabase: SupabaseClient<Database>;
  user: { id: string };
  profile: Profile;
  params: MapQueryParams;
}

export async function getMapGeoJSON({
  supabase,
  user,
  profile,
  params,
}: MapServiceOptions): Promise<MapFeatureCollection> {
  const [minLng, minLat, maxLng, maxLat] = params.bbox;
  const zoom = params.zoom;
  const role = profile.role;

  // 1. Role: Insurer (Aggregated village records only)
  if (role === "insurer") {
    const { data: villages, error: villageError } = await supabase
      .from("admin_areas")
      .select("id, code, names, centroid_lat, centroid_lng")
      .eq("level", "village")
      .gte("centroid_lng", minLng)
      .lte("centroid_lng", maxLng)
      .gte("centroid_lat", minLat)
      .lte("centroid_lat", maxLat);

    if (villageError) {
      throw villageError;
    }

    const features: MapGeoJSONFeature[] = (villages || [])
      .filter((v) => v.centroid_lat !== null && v.centroid_lng !== null)
      .map((v) => {
        const names = v.names as Record<string, string>;
        const villageName = names?.en || v.code;
        return {
          type: "Feature" as const,
          id: `village-${v.id}`,
          geometry: {
            type: "Point" as const,
            coordinates: [v.centroid_lng!, v.centroid_lat!] as [number, number],
          },
          properties: {
            id: `village-${v.id}`,
            isCluster: true,
            count: 1, // Village summary marker
            status: "normal" as const,
            villageName,
            name: villageName,
          },
        };
      });

    return {
      type: "FeatureCollection",
      features,
      metadata: {
        totalFeatures: features.length,
        isClustered: true,
        zoom,
      },
    };
  }

  // 2. Fetch wells inside bounding box
  let wellsQuery = supabase
    .from("wells")
    .select(
      `
      id,
      name,
      latitude,
      longitude,
      owner_id,
      admin_area_id,
      status,
      total_depth_m,
      well_type
    `,
    )
    .gte("longitude", minLng)
    .lte("longitude", maxLng)
    .gte("latitude", minLat)
    .lte("latitude", maxLat);

  if (params.type && params.type !== "all") {
    wellsQuery = wellsQuery.eq(
      "well_type",
      params.type as Database["public"]["Enums"]["well_type"],
    );
  }

  const { data: rawWellsData, error: wellsError } = await wellsQuery;
  if (wellsError) {
    throw wellsError;
  }

  const rawWells: RawWell[] = (rawWellsData || []).map((w) => ({
    id: w.id,
    name: w.name,
    latitude: w.latitude,
    longitude: w.longitude,
    owner_id: w.owner_id,
    admin_area_id: w.admin_area_id,
    status: w.status,
    total_depth_m: w.total_depth_m,
    well_type: w.well_type,
  }));

  // 3. Apply role privacy
  let sanitized: SanitizedWellFeature[] = applyRolePrivacy(rawWells, profile, user.id);

  // 4. Filter by status if specified
  if (params.status && params.status !== "all") {
    sanitized = sanitized.filter((w) => w.status === params.status);
  }

  // 5. Cluster features if zoom < 12, or return individual features
  const isClustered = zoom < 12;
  const features = clusterFeatures(sanitized, zoom, 12, 2000);

  return {
    type: "FeatureCollection",
    features,
    metadata: {
      totalFeatures: features.length,
      isClustered,
      zoom,
    },
  };
}
