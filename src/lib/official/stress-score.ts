export interface VillageStressInput {
  wellsCount: number;
  nodesOnline: number;
  pctCritical: number;
  pctWarning: number;
  pctOffline: number;
  avgChange30dM: number | null;
  openCriticalAlerts: number;
  aquiferHealthScore: number | null; // 0-100 where 100 is healthy
  isPrivacySuppressed?: boolean;
}

export type StressSeverity = "critical" | "warning" | "watch" | "low";

export interface StressReasonChip {
  id:
    | "critical_wells"
    | "offline_sensors"
    | "rapid_depletion"
    | "critical_alerts"
    | "aquifer_vulnerability";
  severity: "critical" | "warning" | "info";
  translationKey: string;
  params: Record<string, string | number>;
  scoreContribution: number;
}

export interface VillageStressResult {
  score: number; // 0 to 100
  severity: StressSeverity;
  isPrivacySuppressed: boolean;
  components: {
    criticalWellsPoints: number;
    depletionPoints: number;
    offlineSensorsPoints: number;
    criticalAlertsPoints: number;
    aquiferPoints: number;
  };
  reasonChips: StressReasonChip[];
}

export const STRESS_SCORE_WEIGHTS = {
  CRITICAL_WELLS_MAX: 30,
  DEPLETION_MAX: 25,
  OFFLINE_SENSORS_MAX: 20,
  CRITICAL_ALERTS_MAX: 15,
  AQUIFER_VULNERABILITY_MAX: 10,
} as const;

/**
 * Calculates the explainable village stress score (0-100) and top reason chips.
 * All weights and score contributions are deterministic and fully transparent.
 */
export function calculateVillageStressScore(input: VillageStressInput): VillageStressResult {
  if (input.isPrivacySuppressed) {
    return {
      score: 0,
      severity: "low",
      isPrivacySuppressed: true,
      components: {
        criticalWellsPoints: 0,
        depletionPoints: 0,
        offlineSensorsPoints: 0,
        criticalAlertsPoints: 0,
        aquiferPoints: 0,
      },
      reasonChips: [
        {
          id: "critical_wells",
          severity: "info",
          translationKey: "chip_privacy_suppressed",
          params: {},
          scoreContribution: 0,
        },
      ],
    };
  }

  // 1. Critical Wells (Max: 30 pts)
  // 50% critical or higher gives full 30 pts
  const criticalWellsPoints = Math.min(
    STRESS_SCORE_WEIGHTS.CRITICAL_WELLS_MAX,
    Math.round((Math.max(0, input.pctCritical) / 50) * STRESS_SCORE_WEIGHTS.CRITICAL_WELLS_MAX),
  );

  // 2. Depletion Rate (30-day drop, Max: 25 pts)
  // Water level dropping deeper is positive avgChange30dM in groundwater convention
  let depletionPoints = 0;
  const drop30d = input.avgChange30dM ?? 0;
  if (drop30d > 0) {
    if (drop30d >= 1.0) {
      depletionPoints = 25;
    } else if (drop30d >= 0.5) {
      depletionPoints = 18;
    } else if (drop30d >= 0.2) {
      depletionPoints = 10;
    } else {
      depletionPoints = Math.round((drop30d / 0.2) * 8);
    }
  }

  // 3. Offline Sensors (Max: 20 pts)
  // 40% offline gives full 20 pts
  const offlineSensorsPoints = Math.min(
    STRESS_SCORE_WEIGHTS.OFFLINE_SENSORS_MAX,
    Math.round((Math.max(0, input.pctOffline) / 40) * STRESS_SCORE_WEIGHTS.OFFLINE_SENSORS_MAX),
  );

  // 4. Critical Alerts (Max: 15 pts)
  let criticalAlertsPoints = 0;
  if (input.openCriticalAlerts >= 3) {
    criticalAlertsPoints = 15;
  } else if (input.openCriticalAlerts === 2) {
    criticalAlertsPoints = 11;
  } else if (input.openCriticalAlerts === 1) {
    criticalAlertsPoints = 7;
  }

  // 5. Aquifer Vulnerability from Health Score (Max: 10 pts)
  let aquiferPoints = 5; // Default neutral if not yet computed
  if (input.aquiferHealthScore !== null) {
    // Stressed aquifer (low score) yields high stress points
    aquiferPoints = Math.min(
      STRESS_SCORE_WEIGHTS.AQUIFER_VULNERABILITY_MAX,
      Math.max(
        0,
        Math.round(
          ((100 - input.aquiferHealthScore) / 100) * STRESS_SCORE_WEIGHTS.AQUIFER_VULNERABILITY_MAX,
        ),
      ),
    );
  }

  const rawScore =
    criticalWellsPoints +
    depletionPoints +
    offlineSensorsPoints +
    criticalAlertsPoints +
    aquiferPoints;

  const score = Math.max(0, Math.min(100, rawScore));

  let severity: StressSeverity = "low";
  if (score >= 60) {
    severity = "critical";
  } else if (score >= 40) {
    severity = "warning";
  } else if (score >= 20) {
    severity = "watch";
  }

  // Generate plain-language reason chips sorted by highest concern
  const candidates: StressReasonChip[] = [];

  if (input.pctCritical > 0) {
    candidates.push({
      id: "critical_wells",
      severity: input.pctCritical >= 20 ? "critical" : "warning",
      translationKey: "chip_pct_critical",
      params: { percent: Math.round(input.pctCritical) },
      scoreContribution: criticalWellsPoints,
    });
  }

  if (input.openCriticalAlerts > 0) {
    candidates.push({
      id: "critical_alerts",
      severity: "critical",
      translationKey: "chip_open_critical_alerts",
      params: { count: input.openCriticalAlerts },
      scoreContribution: criticalAlertsPoints,
    });
  }

  if (drop30d >= 0.25) {
    candidates.push({
      id: "rapid_depletion",
      severity: drop30d >= 0.5 ? "critical" : "warning",
      translationKey: "chip_rapid_depletion",
      params: { dropM: Math.round(drop30d * 10) / 10 },
      scoreContribution: depletionPoints,
    });
  }

  const offlineNodesCount = Math.max(0, input.wellsCount - input.nodesOnline);
  if (offlineNodesCount > 0 && input.pctOffline >= 15) {
    candidates.push({
      id: "offline_sensors",
      severity: input.pctOffline >= 30 ? "critical" : "warning",
      translationKey: "chip_nodes_offline",
      params: { count: offlineNodesCount, percent: Math.round(input.pctOffline) },
      scoreContribution: offlineSensorsPoints,
    });
  }

  if (input.aquiferHealthScore !== null && input.aquiferHealthScore < 40) {
    candidates.push({
      id: "aquifer_vulnerability",
      severity: input.aquiferHealthScore < 25 ? "critical" : "warning",
      translationKey: "chip_aquifer_stressed",
      params: { score: input.aquiferHealthScore },
      scoreContribution: aquiferPoints,
    });
  }

  // Sort reason chips by score contribution descending
  const reasonChips = candidates.sort((a, b) => b.scoreContribution - a.scoreContribution);

  if (reasonChips.length === 0) {
    reasonChips.push({
      id: "critical_wells",
      severity: "info",
      translationKey: "chip_stable_condition",
      params: {},
      scoreContribution: 0,
    });
  }

  return {
    score,
    severity,
    isPrivacySuppressed: false,
    components: {
      criticalWellsPoints,
      depletionPoints,
      offlineSensorsPoints,
      criticalAlertsPoints,
      aquiferPoints,
    },
    reasonChips,
  };
}
