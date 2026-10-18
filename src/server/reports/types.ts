/**
 * Types and interfaces for JalMaps Phase 23 Reports and Exports.
 */

export type ReportType = "well" | "village" | "district" | "subsidy_planning";
export type ReportFormat = "pdf" | "csv" | "xlsx";
export type ReportStatus = "queued" | "running" | "done" | "failed";
export type ReportCadence = "weekly" | "monthly";
export type DeliveryChannel = "email" | "sms" | "whatsapp" | "in_app";

export interface ReportTrendPoint {
  timestamp: string;
  depthM: number | null;
}

export interface ReportAlertSummary {
  id: string;
  severity: "critical" | "warning" | "info";
  message: string;
  createdAt: string;
}

export interface ReportDataQuality {
  totalReadings: number;
  goodReadings: number;
  suspectReadings: number;
  qualityScorePct: number;
  notes: string[];
}

export interface WellReportData {
  type: "well";
  well: {
    id: string;
    name: string;
    wellType: string;
    depthTotalM: number | null;
    village: string;
    block: string;
    district: string;
    lat: number | null;
    lng: number | null;
  };
  kpis: {
    currentDepthM: number | null;
    change30dM: number | null;
    status: string;
    batteryV: number | null;
    signalRssi: number | null;
    lastSeenAt: string | null;
  };
  trendSeries: ReportTrendPoint[];
  insights: {
    healthScore?: number;
    healthBand?: "healthy" | "watch" | "stressed" | "critical";
    depletionRateMPerYear?: number | null;
    monsoonRechargeM?: number | null;
  };
  alerts: ReportAlertSummary[];
  dataQuality: ReportDataQuality;
  generatedAt: string;
  locale: string;
  unit: "m" | "ft";
  liveUrl: string;
  qrCodeDataUrl?: string;
}

export interface VillageWellRow {
  id: string;
  name: string;
  type: string;
  status: string;
  currentDepthM: number | null;
  lastSeenAt: string | null;
}

export interface VillageReportData {
  type: "village";
  village: {
    id: string;
    name: string;
    code: string;
    block: string;
    district: string;
  };
  privacyMasked: boolean;
  kpis: {
    totalWells: number;
    onlineNodes: number;
    criticalWellsCount: number;
    averageDepthM: number | null;
    change30dM: number | null;
    stressScore: number;
  };
  stressBreakdown: {
    criticalScore: number;
    depletionScore: number;
    offlineScore: number;
    alertsScore: number;
    aquiferScore: number;
    total: number;
    tier: "critical" | "warning" | "watch" | "low";
  };
  wells: VillageWellRow[];
  trendSeries: ReportTrendPoint[];
  insights: {
    healthScore?: number;
    healthBand?: string;
    averageDepletionRate?: number | null;
    totalMonsoonRecharge?: number | null;
  };
  boundaryOutline: [number, number][] | null;
  alerts: ReportAlertSummary[];
  dataQuality: {
    totalReadings: number;
    coveragePct: number;
    notes: string[];
  };
  generatedAt: string;
  locale: string;
  unit: "m" | "ft";
  liveUrl: string;
  qrCodeDataUrl?: string;
}

export interface DistrictVillageRow {
  id: string;
  name: string;
  block: string;
  wellCount: number;
  stressScore: number;
  tier: "critical" | "warning" | "watch" | "low";
  criticalWellsPct: number;
  depletionRateMPerYear: number | null;
  offlineNodesPct: number;
  privacyMasked: boolean;
}

export interface DistrictReportData {
  type: "district";
  district: {
    id: string;
    name: string;
    code: string;
    state: string;
  };
  kpis: {
    totalVillages: number;
    totalWells: number;
    onlineNodesPct: number;
    criticalVillagesCount: number;
    averageDepthM: number | null;
    change30dM: number | null;
  };
  villagesRanked: DistrictVillageRow[];
  trendSeries: ReportTrendPoint[];
  alertsSummary: {
    openCritical: number;
    openWarning: number;
    totalRecent: number;
  };
  dataQuality: {
    reportingWellsCount: number;
    telemetryUptimePct: number;
    notes: string[];
  };
  generatedAt: string;
  locale: string;
  unit: "m" | "ft";
  liveUrl: string;
  qrCodeDataUrl?: string;
}

export interface SubsidyPlanningVillageRow {
  rank: number;
  id: string;
  name: string;
  block: string;
  wellCount: number;
  stressScore: number;
  tier: "critical" | "warning" | "watch" | "low";
  depletionRateMPerYear: number | null;
  offlineNodeCount: number;
  rechargeSuitability: "high" | "medium" | "low";
  recommendedIntervention: string;
  privacyMasked: boolean;
}

export interface SubsidyPlanningReportData {
  type: "subsidy_planning";
  scopeName: string;
  scopeType: "district" | "block";
  prioritizedVillages: SubsidyPlanningVillageRow[];
  summary: {
    totalVillagesAssessed: number;
    criticalPriorityCount: number;
    recommendedRechargeStructures: number;
    offlineNodesToFix: number;
  };
  methodology: {
    criteria: string[];
    weightingNotes: string;
    dataNotice: string;
  };
  generatedAt: string;
  locale: string;
  liveUrl: string;
  qrCodeDataUrl?: string;
}

export type ReportData =
  WellReportData | VillageReportData | DistrictReportData | SubsidyPlanningReportData;
