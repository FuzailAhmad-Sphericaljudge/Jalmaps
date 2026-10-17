import type { Profile } from "@/server/auth";
import type { WellStatusType } from "./types";
export type { WellStatusType } from "./types";

export interface RawWell {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  owner_id: string | null;
  admin_area_id: string;
  status: string;
  total_depth_m: number | null;
  well_type: string;
  latest_depth_m?: number | null;
  last_reading_at?: string | null;
  trend_7d?: number | null;
  warning_threshold?: number | null;
  critical_threshold?: number | null;
  village_name?: string;
}

export interface SanitizedWellFeature {
  id: string;
  coordinates: [number, number]; // [lng, lat]
  status: WellStatusType;
  name?: string;
  isOwned?: boolean;
  isJittered?: boolean;
  villageName?: string;
  lastReadingAt?: string | null;
  depthToWaterM?: number | null;
  totalDepthM?: number | null;
  trend7d?: number | null;
}

/**
 * Deterministically jitters coordinates by up to maxDistanceMeters.
 * Same seed always yields the exact same coordinates to prevent triangulation.
 */
export function jitterCoordinates(
  lat: number,
  lng: number,
  seed: string,
  maxDistanceMeters = 150,
): { lat: number; lng: number } {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (Math.imul(31, hash) + seed.charCodeAt(i)) | 0;
  }

  // Generate 2 pseudo-random numbers in [0, 1)
  const rand1 = Math.abs((Math.sin(hash) * 10000) % 1);
  const rand2 = Math.abs((Math.cos(hash) * 10000) % 1);

  // Random distance with square root for uniform disk distribution
  const distance = maxDistanceMeters * Math.sqrt(rand1);
  const angle = rand2 * 2 * Math.PI;

  // Approx conversions: 1 deg lat ≈ 111,111 meters
  const deltaLat = (distance * Math.cos(angle)) / 111111;
  const deltaLng =
    (distance * Math.sin(angle)) / (111111 * Math.cos((lat * Math.PI) / 180) || 111111);

  return {
    lat: Number((lat + deltaLat).toFixed(6)),
    lng: Number((lng + deltaLng).toFixed(6)),
  };
}

export function computeWellStatus(well: RawWell): WellStatusType {
  const depth = well.latest_depth_m;
  if (depth === null || depth === undefined) {
    if (well.status === "dry") return "critical";
    if (well.status === "inactive" || well.status === "decommissioned") return "unknown";
    return "normal";
  }

  if (well.critical_threshold !== null && well.critical_threshold !== undefined) {
    if (depth >= well.critical_threshold) return "critical";
  }
  if (well.warning_threshold !== null && well.warning_threshold !== undefined) {
    if (depth >= well.warning_threshold) return "warning";
  }

  if (well.status === "dry") return "critical";
  return "normal";
}

/**
 * Applies privacy controls based on user role and relationship to the wells.
 */
export function applyRolePrivacy(
  wells: RawWell[],
  profile: Profile | null,
  userId: string,
): SanitizedWellFeature[] {
  if (!profile) return [];

  const role = profile.role;

  // Insurers receive village aggregated records only; individual wells are never returned.
  if (role === "insurer") {
    return [];
  }

  return wells.map((well) => {
    const isOwned = well.owner_id === userId;
    const wellStatus = computeWellStatus(well);

    if (role === "admin") {
      return {
        id: well.id,
        coordinates: [well.longitude, well.latitude],
        status: wellStatus,
        name: well.name,
        isOwned,
        isJittered: false,
        villageName: well.village_name,
        lastReadingAt: well.last_reading_at,
        depthToWaterM: well.latest_depth_m,
        totalDepthM: well.total_depth_m,
        trend7d: well.trend_7d,
      };
    }

    if (role === "official" || role === "village_admin") {
      // Officials and Village Admins see exact locations in their jurisdiction
      return {
        id: well.id,
        coordinates: [well.longitude, well.latitude],
        status: wellStatus,
        name: well.name,
        isOwned,
        isJittered: false,
        villageName: well.village_name,
        lastReadingAt: well.last_reading_at,
        depthToWaterM: well.latest_depth_m,
        totalDepthM: well.total_depth_m,
        trend7d: well.trend_7d,
      };
    }

    // Farmer role:
    if (isOwned) {
      // Exact location, full details for own well
      return {
        id: well.id,
        coordinates: [well.longitude, well.latitude],
        status: wellStatus,
        name: well.name,
        isOwned: true,
        isJittered: false,
        villageName: well.village_name,
        lastReadingAt: well.last_reading_at,
        depthToWaterM: well.latest_depth_m,
        totalDepthM: well.total_depth_m,
        trend7d: well.trend_7d,
      };
    }

    // Other wells in the village: jittered by ~150m, name masked
    const jittered = jitterCoordinates(well.latitude, well.longitude, well.id, 150);
    return {
      id: well.id,
      coordinates: [jittered.lng, jittered.lat],
      status: wellStatus,
      name: "Village Well",
      isOwned: false,
      isJittered: true,
      villageName: well.village_name,
      lastReadingAt: well.last_reading_at,
      depthToWaterM: well.latest_depth_m,
      totalDepthM: null, // redacted for privacy
      trend7d: well.trend_7d,
    };
  });
}
