/**
 * Converts a water column height to the 4-20mA sensor loop current.
 */
export function columnToCurrentMa(columnM: number, rangeM: number = 30): number {
  if (rangeM <= 0) throw new Error("Range must be greater than 0");
  const clampedColumn = Math.max(0, Math.min(columnM, rangeM));
  return 4 + (clampedColumn * 16) / rangeM;
}

/**
 * Converts a 4-20mA sensor loop current to water column height.
 * Includes calibration offset if provided.
 */
export function currentToColumnM(
  currentMa: number,
  options: { range_m: number; calibration_offset_m?: number },
): number {
  const rangeM = options.range_m;
  if (rangeM <= 0) throw new Error("Range must be greater than 0");

  // Do not clamp the mA here, let the caller classify quality first.
  // We'll process raw values to detect out-of-range later.
  const column = ((currentMa - 4) * rangeM) / 16;
  return column + (options.calibration_offset_m || 0);
}

/**
 * Calculates depth to water from the surface.
 */
export function columnToDepthToWater(columnM: number, hangDepthM: number): number {
  // If column is larger than hang depth, the water is overflowing (depth 0 or negative, typically clamped to 0)
  // For physical realism, we'll just return the difference.
  return Math.max(0, hangDepthM - columnM);
}

export type SensorQuality = "good" | "suspect" | "bad";

export interface QualityContext {
  currentMa: number;
  previousMa?: number;
  minutesSincePrevious?: number;
}

/**
 * Classifies the quality of a sensor reading based on mA values and rate of change.
 * - good: current between 3.8 and 20.5 mA and no suspicious jump
 * - suspect: 3.5 to 3.8 mA or 20.5 to 21 mA, or a jump > 5mA / minute
 * - bad: below 3.5 mA (broken wire or no power) or above 21 mA
 */
export function classifyQuality(ctx: QualityContext): SensorQuality {
  const { currentMa, previousMa, minutesSincePrevious } = ctx;

  if (currentMa < 3.5 || currentMa > 21) {
    return "bad";
  }

  if (currentMa < 3.8 || currentMa > 20.5) {
    return "suspect";
  }

  // Check rate of change if we have previous data
  if (previousMa !== undefined && minutesSincePrevious !== undefined && minutesSincePrevious > 0) {
    const deltaMa = Math.abs(currentMa - previousMa);
    const rateOfChange = deltaMa / minutesSincePrevious;
    // Suspicious jump threshold: 5 mA per minute
    if (rateOfChange > 5) {
      return "suspect";
    }
  }

  return "good";
}
