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
 */
export function currentToColumnM(currentMa: number, rangeM: number = 30): number {
  if (rangeM <= 0) throw new Error("Range must be greater than 0");
  const clampedMa = Math.max(4, Math.min(currentMa, 20));
  return ((clampedMa - 4) * rangeM) / 16;
}

/**
 * Calculates depth to water from the surface.
 */
export function columnToDepthToWater(columnM: number, hangDepthM: number): number {
  // If column is larger than hang depth, the water is overflowing (depth 0 or negative, typically clamped to 0)
  // For physical realism, we'll just return the difference.
  return Math.max(0, hangDepthM - columnM);
}
