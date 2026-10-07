import { parseArgs } from "util";
import { createServiceRoleClient } from "../../src/server/supabase/service-role";
import { generateSeries, NodeSimConfig, ScenarioType } from "../../src/server/simulator/models";
import { createPRNG, hashString } from "../../src/server/simulator/prng";
import { writeSimulationBatch } from "../../src/server/simulator/writer";

async function main() {
  const { values } = parseArgs({
    options: {
      months: { type: "string", default: "12" },
      interval: { type: "string", default: "60" },
      scenario: { type: "string", default: "mix" },
      seed: { type: "string", default: "42" },
      "via-api": { type: "boolean", default: false },
    },
  });

  if (values["via-api"]) {
    console.log("TODO: via-api is stubbed. Phase 8 completes it.");
    process.exit(0);
  }

  const months = parseInt(values.months!);
  const interval = parseInt(values.interval!);
  const scenarioOpt = values.scenario!;
  const globalSeed = parseInt(values.seed!);

  console.log(
    `Starting backfill: ${months} months, ${interval}m interval, scenario=${scenarioOpt}, seed=${globalSeed}`,
  );

  const client = createServiceRoleClient();

  // Get simulated nodes
  const { data: nodes, error } = await client
    .from("nodes")
    .select("id, well_id, hang_depth_m")
    .eq("is_simulated", true);

  if (error || !nodes) {
    console.error("Error fetching simulated nodes:", error);
    process.exit(1);
  }

  console.log(`Found ${nodes.length} simulated nodes.`);

  const start = new Date();
  start.setMonth(start.getMonth() - months);
  const end = new Date();

  const startTime = Date.now();

  let totalReadings = 0;

  for (const node of nodes) {
    if (!node) continue;
    const nodeSeed = hashString(`${globalSeed}-${node.id}`);
    const prng = createPRNG(nodeSeed);

    let scenario: ScenarioType = "normal";
    if (scenarioOpt === "mix") {
      const r = prng();
      if (r < 0.6) scenario = "normal";
      else if (r < 0.75) scenario = "drought";
      else if (r < 0.9) scenario = "over_extraction";
      else scenario = "sensor_fault";
    } else {
      scenario = scenarioOpt as ScenarioType;
    }

    // Determine baseline from 10 to 40m
    const baselineDepthM = 10 + prng() * 30;
    const sensorRangeM = 50; // default for simulation

    const config: NodeSimConfig = {
      nodeId: node.id,
      wellId: node.well_id,
      baselineDepthM,
      hangDepthM: node.hang_depth_m || 50,
      sensorRangeM,
      scenario,
    };

    const series = generateSeries({ config, start, end, intervalMinutes: interval, prng });

    // Batch write in chunks of 1000
    for (let j = 0; j < series.length; j += 1000) {
      const batch = series.slice(j, j + 1000);
      await writeSimulationBatch(client, batch);
      totalReadings += batch.length;
    }

    console.log(`Node ${node.id} backfilled ${series.length} readings.`);
  }

  const durationMs = Date.now() - startTime;
  console.log(
    `Backfill complete: ${totalReadings} total readings in ${(durationMs / 1000).toFixed(2)}s.`,
  );
}

main().catch(console.error);
