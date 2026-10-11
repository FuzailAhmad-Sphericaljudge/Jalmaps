/**
 * Synthetic 5,000 wells clustering benchmark script.
 * Demonstrates smooth grid-based clustering under dense multi-well conditions.
 */
import { clusterFeatures } from "../../src/server/map/cluster";
import type { SanitizedWellFeature, WellStatusType } from "../../src/server/map/privacy";

function generateSyntheticWells(count: number): SanitizedWellFeature[] {
  const minLng = 68.7;
  const maxLng = 97.25;
  const minLat = 8.4;
  const maxLat = 37.6;

  const statuses: WellStatusType[] = ["critical", "warning", "normal", "normal", "unknown"];

  const features: SanitizedWellFeature[] = [];

  for (let i = 0; i < count; i++) {
    const lng = minLng + Math.random() * (maxLng - minLng);
    const lat = minLat + Math.random() * (maxLat - minLat);
    const status = statuses[i % statuses.length]!;

    features.push({
      id: `synthetic-well-${i + 1}`,
      coordinates: [Number(lng.toFixed(5)), Number(lat.toFixed(5))],
      status,
      name: `Well ${i + 1}`,
      villageName: `Village ${(i % 100) + 1}`,
      depthToWaterM: Number((5 + Math.random() * 35).toFixed(1)),
      totalDepthM: 50,
      trend7d: Number((-0.5 + Math.random()).toFixed(2)),
      lastReadingAt: new Date().toISOString(),
      isOwned: i % 20 === 0,
      isJittered: false,
    });
  }

  return features;
}

export function benchmarkClustering() {
  const wellCount = 5000;
  console.log(`Generating ${wellCount} synthetic wells across India...`);
  const wells = generateSyntheticWells(wellCount);

  const testZooms = [4, 6, 8, 10, 12, 14];

  console.log("Running viewport clustering benchmarks:");

  for (const zoom of testZooms) {
    const start = performance.now();
    const result = clusterFeatures(wells, zoom);
    const elapsed = performance.now() - start;

    console.log(
      `Zoom ${zoom.toString().padStart(2)}: generated ${result.length.toString().padStart(4)} output features ` +
        `from ${wellCount} wells in ${elapsed.toFixed(2)}ms`,
    );

    if (elapsed > 100) {
      console.warn(`Warning: clustering took > 100ms at zoom ${zoom}`);
    }
  }

  console.log("Benchmark complete.");
}

if (require.main === module || !process.env.VITEST) {
  benchmarkClustering();
}
