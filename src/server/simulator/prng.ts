export type PRNG = () => number;

/**
 * Creates a mulberry32 PRNG.
 * @param a The seed.
 */
export function createPRNG(a: number): PRNG {
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Returns a normally distributed random number using Box-Muller transform.
 */
export function randomGaussian(prng: PRNG, mean = 0, stdDev = 1): number {
  const u1 = prng();
  const u2 = prng();

  // Avoid log(0)
  const safeU1 = u1 === 0 ? 1e-10 : u1;

  const z0 = Math.sqrt(-2.0 * Math.log(safeU1)) * Math.cos(2.0 * Math.PI * u2);
  return z0 * stdDev + mean;
}

/**
 * Generates a simple 32-bit hash from a string to derive a numeric seed.
 */
export function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0; // Convert to 32bit integer
  }
  return hash >>> 0; // unsigned
}
