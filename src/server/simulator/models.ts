import { PRNG, randomGaussian } from "./prng";
import { columnToCurrentMa, currentToColumnM, columnToDepthToWater } from "../../lib/sensor/math";

export type ScenarioType =
  | "normal"
  | "drought"
  | "over_extraction"
  | "good_recharge"
  | "sensor_fault"
  | "offline_gaps"
  | "low_battery";

export interface SimScenarioConfig {
  type: ScenarioType;
  longTermTrendMYr: number;
  monsoonStrength: number;
  pumpHoursPerDay: number;
  faultProbability: number;
  gapProbability: number;
}

export const SCENARIOS: Record<ScenarioType, SimScenarioConfig> = {
  normal: {
    type: "normal",
    longTermTrendMYr: -0.2,
    monsoonStrength: 1.0,
    pumpHoursPerDay: 3,
    faultProbability: 0,
    gapProbability: 0.001,
  },
  drought: {
    type: "drought",
    longTermTrendMYr: -1.0,
    monsoonStrength: 0.3,
    pumpHoursPerDay: 4,
    faultProbability: 0,
    gapProbability: 0.001,
  },
  over_extraction: {
    type: "over_extraction",
    longTermTrendMYr: -1.5,
    monsoonStrength: 0.8,
    pumpHoursPerDay: 8,
    faultProbability: 0,
    gapProbability: 0.001,
  },
  good_recharge: {
    type: "good_recharge",
    longTermTrendMYr: +0.2,
    monsoonStrength: 1.5,
    pumpHoursPerDay: 2,
    faultProbability: 0,
    gapProbability: 0.001,
  },
  sensor_fault: {
    type: "sensor_fault",
    longTermTrendMYr: -0.2,
    monsoonStrength: 1.0,
    pumpHoursPerDay: 3,
    faultProbability: 0.05,
    gapProbability: 0.001,
  },
  offline_gaps: {
    type: "offline_gaps",
    longTermTrendMYr: -0.2,
    monsoonStrength: 1.0,
    pumpHoursPerDay: 3,
    faultProbability: 0,
    gapProbability: 0.1,
  },
  low_battery: {
    type: "low_battery",
    longTermTrendMYr: -0.2,
    monsoonStrength: 1.0,
    pumpHoursPerDay: 3,
    faultProbability: 0,
    gapProbability: 0.02,
  },
};

export interface NodeSimConfig {
  nodeId: string;
  wellId: string;
  baselineDepthM: number;
  hangDepthM: number;
  sensorRangeM: number;
  scenario: ScenarioType;
}

export interface ReadingResult {
  node_id: string;
  recorded_at: Date;
  column_m: number;
  depth_to_water_m: number;
  current_ma: number;
  battery_v: number;
  signal_rssi: number;
  is_missing: boolean;
  quality: "good" | "suspect" | "bad";
  raw_sim: {
    scenario: ScenarioType;
    truth_depth_m: number;
    injected_fault?: string;
  };
}

const MS_PER_YEAR = 1000 * 60 * 60 * 24 * 365.25;

export function getWaterDepthAtTime(
  config: NodeSimConfig,
  date: Date,
  prng: PRNG,
): { depthM: number; isPumping: boolean } {
  const scenarioConfig = SCENARIOS[config.scenario];
  const tYear = date.getTime() / MS_PER_YEAR;
  const month = date.getMonth();
  const hour = date.getHours();

  // Baseline + Trend
  let depth = config.baselineDepthM - tYear * scenarioConfig.longTermTrendMYr;

  // Annual seasonal cycle (sine wave, lowest pre-monsoon ~May, highest post-monsoon ~Oct)
  // tYear fraction part
  const yearFraction = (date.getTime() % MS_PER_YEAR) / MS_PER_YEAR;
  // Offset so May is peak depth (approx yearFraction = 5/12 = 0.41)
  const seasonalComponent = Math.sin((yearFraction - 0.41) * Math.PI * 2) * 2.0;
  depth += seasonalComponent;

  // Monsoon pulses (June to Sept)
  if (month >= 5 && month <= 8) {
    depth -= scenarioConfig.monsoonStrength * Math.abs(randomGaussian(prng, 0, 0.5));
  }

  // Pumping drawdown (simulate pumping mostly in morning)
  let isPumping = false;
  if (hour >= 6 && hour < 6 + scenarioConfig.pumpHoursPerDay) {
    isPumping = true;
    const pumpHourIndex = hour - 6;
    // Drawdown curve: quick drop, slow level off
    depth += 2 + Math.log(pumpHourIndex + 2);
  } else {
    // Recovery phase (exponential decay)
    const hoursSincePump =
      hour >= 6
        ? hour - (6 + scenarioConfig.pumpHoursPerDay)
        : hour + (24 - (6 + scenarioConfig.pumpHoursPerDay));
    if (hoursSincePump > 0 && hoursSincePump < 12) {
      depth += 3 * Math.exp(-hoursSincePump / 4);
    }
  }

  // Minor noise
  depth += randomGaussian(prng, 0, 0.05);

  return { depthM: Math.max(0, depth), isPumping };
}

export function generateReading(config: NodeSimConfig, date: Date, prng: PRNG): ReadingResult {
  const scenarioConfig = SCENARIOS[config.scenario];
  const { depthM, isPumping } = getWaterDepthAtTime(config, date, prng);

  let truthDepthM = depthM;
  let injectedFault: string | undefined = undefined;
  let quality: "good" | "suspect" | "bad" = "good";

  // Gap probability
  if (prng() < scenarioConfig.gapProbability) {
    return {
      node_id: config.nodeId,
      recorded_at: date,
      column_m: 0,
      depth_to_water_m: 0,
      current_ma: 0,
      battery_v: 0,
      signal_rssi: 0,
      is_missing: true,
      quality: "bad",
      raw_sim: { scenario: config.scenario, truth_depth_m: truthDepthM, injected_fault: "offline" },
    };
  }

  // Faults
  if (config.scenario === "sensor_fault" && prng() < scenarioConfig.faultProbability) {
    const faultType = Math.floor(prng() * 3);
    quality = "bad";
    if (faultType === 0) {
      truthDepthM = 0; // Spike
      injectedFault = "spike";
    } else if (faultType === 1) {
      truthDepthM = config.hangDepthM + 5; // Dry well / flatline
      injectedFault = "flatline";
    } else {
      injectedFault = "stuck_low";
    }
  }

  // Calculate column
  let column = Math.max(0, config.hangDepthM - truthDepthM);
  column = Math.min(column, config.sensorRangeM);

  // Add quantization (simulate ADC resolution)
  column = Math.round(column * 100) / 100;

  let currentMa = columnToCurrentMa(column, config.sensorRangeM);

  if (injectedFault === "stuck_low") {
    currentMa = 3.2 + prng() * 0.2; // stuck below 3.5 mA
    column = currentToColumnM(currentMa, config.sensorRangeM);
  }

  // Device model (Battery & RSSI)
  // Battery discharges slightly during pumping or night, charges during day
  const hour = date.getHours();
  let batteryV =
    config.scenario === "low_battery"
      ? 3.3 + Math.sin(hour) * 0.1
      : 3.8 + Math.sin(((hour - 12) * Math.PI) / 12) * 0.2;
  batteryV += randomGaussian(prng, 0, 0.02);

  const rssi = -70 + randomGaussian(prng, 0, 5);

  return {
    node_id: config.nodeId,
    recorded_at: date,
    column_m: column,
    depth_to_water_m: columnToDepthToWater(column, config.hangDepthM),
    current_ma: currentMa,
    battery_v: Math.round(batteryV * 100) / 100,
    signal_rssi: Math.round(rssi),
    is_missing: false,
    quality,
    raw_sim: {
      scenario: config.scenario,
      truth_depth_m: truthDepthM,
      injected_fault: injectedFault,
    },
  };
}

export function generateSeries(params: {
  config: NodeSimConfig;
  start: Date;
  end: Date;
  intervalMinutes: number;
  prng: PRNG;
}): ReadingResult[] {
  const results: ReadingResult[] = [];
  let current = new Date(params.start);

  while (current <= params.end) {
    const reading = generateReading(params.config, current, params.prng);
    if (!reading.is_missing) {
      results.push(reading);
    }
    current = new Date(current.getTime() + params.intervalMinutes * 60000);
  }

  return results;
}
