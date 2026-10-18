export type WellStatusType = "critical" | "warning" | "normal" | "unknown";
export type WellStatus = WellStatusType;
export type WellType = "open_well" | "borewell";

export interface MapPointProperties {
  id: string;
  isCluster: boolean;
  count?: number;
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

export interface MapGeoJSONFeature {
  type: "Feature";
  id: string | number;
  geometry: {
    type: "Point";
    coordinates: [number, number]; // [longitude, latitude]
  };
  properties: MapPointProperties;
}

export interface MapFeatureCollection {
  type: "FeatureCollection";
  features: MapGeoJSONFeature[];
  metadata: {
    totalFeatures: number;
    isClustered: boolean;
    zoom: number;
  };
}

export interface MapQueryParams {
  bbox: [number, number, number, number]; // [minLng, minLat, maxLng, maxLat]
  zoom: number;
  status?: string;
  type?: string;
}
