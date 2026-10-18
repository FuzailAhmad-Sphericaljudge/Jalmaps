import type { MapGeoJSONFeature, WellStatusType } from "./types";
import type { SanitizedWellFeature } from "./privacy";

export const STATUS_SEVERITY: Record<WellStatusType, number> = {
  critical: 4,
  warning: 3,
  normal: 2,
  unknown: 1,
};

export function getWorstStatus(statuses: WellStatusType[]): WellStatusType {
  let worst: WellStatusType = "unknown";
  let maxSeverity = 0;

  for (const st of statuses) {
    const sev = STATUS_SEVERITY[st] || 0;
    if (sev > maxSeverity) {
      maxSeverity = sev;
      worst = st;
    }
  }

  return worst;
}

/**
 * Computes grid cell size in degrees based on zoom level.
 */
export function getGridCellSize(zoom: number): number {
  // At zoom 0: ~20 degrees. At zoom 10: ~0.03 degrees.
  return 360 / Math.pow(2, Math.max(0, zoom) + 3);
}

/**
 * Clusters features using spatial grid aggregation when zoom < clusterZoomThreshold (default 12).
 * When zoom >= threshold, returns individual features.
 */
export function clusterFeatures(
  features: SanitizedWellFeature[],
  zoom: number,
  clusterZoomThreshold = 12,
  maxFeatures = 2000,
): MapGeoJSONFeature[] {
  if (features.length === 0) return [];

  // When zoomed in, return individual features up to maxFeatures
  if (zoom >= clusterZoomThreshold) {
    const limited = features.slice(0, maxFeatures);
    return limited.map((item) => ({
      type: "Feature",
      id: item.id,
      geometry: {
        type: "Point",
        coordinates: item.coordinates,
      },
      properties: {
        id: item.id,
        isCluster: false,
        status: item.status,
        name: item.name,
        isOwned: item.isOwned,
        isJittered: item.isJittered,
        villageName: item.villageName,
        lastReadingAt: item.lastReadingAt,
        depthToWaterM: item.depthToWaterM,
        totalDepthM: item.totalDepthM,
        trend7d: item.trend7d,
      },
    }));
  }

  // Grid-based clustering at lower zooms
  const cellSize = getGridCellSize(zoom);
  const grid = new Map<string, SanitizedWellFeature[]>();

  for (const feat of features) {
    const [lng, lat] = feat.coordinates;
    const gridX = Math.floor(lng / cellSize);
    const gridY = Math.floor(lat / cellSize);
    const key = `${gridX}:${gridY}`;

    const existing = grid.get(key);
    if (existing) {
      existing.push(feat);
    } else {
      grid.set(key, [feat]);
    }
  }

  const results: MapGeoJSONFeature[] = [];

  for (const [key, cellFeatures] of grid.entries()) {
    if (cellFeatures.length === 1) {
      // Single feature: return as individual marker
      const item = cellFeatures[0]!;
      results.push({
        type: "Feature",
        id: item.id,
        geometry: {
          type: "Point",
          coordinates: item.coordinates,
        },
        properties: {
          id: item.id,
          isCluster: false,
          status: item.status,
          name: item.name,
          isOwned: item.isOwned,
          isJittered: item.isJittered,
          villageName: item.villageName,
          lastReadingAt: item.lastReadingAt,
          depthToWaterM: item.depthToWaterM,
          totalDepthM: item.totalDepthM,
          trend7d: item.trend7d,
        },
      });
    } else {
      // Multiple features: aggregate into a cluster
      const count = cellFeatures.length;
      let sumLng = 0;
      let sumLat = 0;
      const statuses: WellStatusType[] = [];

      for (const item of cellFeatures) {
        sumLng += item.coordinates[0];
        sumLat += item.coordinates[1];
        statuses.push(item.status);
      }

      const clusterLng = Number((sumLng / count).toFixed(6));
      const clusterLat = Number((sumLat / count).toFixed(6));
      const worstStatus = getWorstStatus(statuses);

      results.push({
        type: "Feature",
        id: `cluster-${key}`,
        geometry: {
          type: "Point",
          coordinates: [clusterLng, clusterLat],
        },
        properties: {
          id: `cluster-${key}`,
          isCluster: true,
          count,
          status: worstStatus,
        },
      });
    }

    if (results.length >= maxFeatures) {
      break;
    }
  }

  return results;
}
