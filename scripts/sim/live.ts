import { parseArgs } from "util";
import { createServiceRoleClient } from "../../src/server/supabase/service-role";
import { generateReading, NodeSimConfig } from "../../src/server/simulator/models";
import { createPRNG, hashString } from "../../src/server/simulator/prng";
import { writeSimulationBatch } from "../../src/server/simulator/writer";

async function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function main() {
  const { values } = parseArgs({
    options: {
      "interval-sec": { type: "string", default: "5" },
      speedup: { type: "string", default: "60" },
      seed: { type: "string", default: "42" },
    },
  });

  const intervalSec = parseInt(values["interval-sec"]!);
  const speedup = parseInt(values.speedup!);
  const globalSeed = parseInt(values.seed!);

  console.log(`Starting live simulator: ${intervalSec}s loop, ${speedup}x speedup.`);

  const client = createServiceRoleClient();

  const { data: nodes, error } = await client
    .from("nodes")
    .select("id, well_id, hang_depth_m")
    .eq("is_simulated", true);

  if (error || !nodes || nodes.length === 0) {
    console.error("Error or no simulated nodes found:", error);
    process.exit(1);
  }

  // Set up configs
  const nodeConfigs: { config: NodeSimConfig; prng: () => number }[] = nodes.map((node) => {
    const nodeSeed = hashString(`${globalSeed}-${node.id}`);
    const prng = createPRNG(nodeSeed);
    return {
      config: {
        nodeId: node.id,
        wellId: node.well_id,
        baselineDepthM: 10 + prng() * 30,
        hangDepthM: node.hang_depth_m || 50,
        sensorRangeM: 50,
        scenario: "normal",
      },
      prng,
    };
  });

  // Base virtual time
  let virtualTime = Date.now();

  while (true) {
    const batch = [];
    const simulatedDate = new Date(virtualTime);

    for (const { config, prng } of nodeConfigs) {
      const reading = generateReading(config, simulatedDate, prng);
      if (!reading.is_missing) {
        batch.push(reading);
      }
    }

    await writeSimulationBatch(client, batch);
    console.log(
      `Emitted ${batch.length} live readings for virtual time ${simulatedDate.toISOString()}`,
    );

    // Wait realtime
    await delay(intervalSec * 1000);
    // Advance virtual time
    virtualTime += intervalSec * 1000 * speedup;
  }
}

main().catch(console.error);
