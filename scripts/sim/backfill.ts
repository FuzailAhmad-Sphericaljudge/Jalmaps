// eslint-disable-next-line @typescript-eslint/no-require-imports
require("@next/env").loadEnvConfig(process.cwd());
import { parseArgs } from "util";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "../../src/lib/db/types";
import { generateSeries, NodeSimConfig, ScenarioType } from "../../src/server/simulator/models";
import { createPRNG, hashString } from "../../src/server/simulator/prng";
import { writeSimulationBatch } from "../../src/server/simulator/writer";
import { issueNodeKey } from "../../src/server/ingest/keys";

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

  const viaApi = values["via-api"] as boolean;
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://127.0.0.1:3000";

  const months = parseInt(values.months!);
  const interval = parseInt(values.interval!);
  const scenarioOpt = values.scenario!;
  const globalSeed = parseInt(values.seed!);

  console.log(
    `Starting backfill: ${months} months, ${interval}m interval, scenario=${scenarioOpt}, seed=${globalSeed}`,
  );

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !supabaseKey) throw new Error("Missing Supabase env vars");
  const client = createClient<Database>(supabaseUrl, supabaseKey);

  // Get simulated nodes
  const { data: nodes, error } = await client
    .from("nodes")
    .select("id, well_id, hang_depth_m, hardware_id")
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

    let keyString = "";
    if (viaApi && node.hardware_id) {
      const { keyString: ks } = await issueNodeKey(client, node.well_id, node.hardware_id);
      keyString = ks;
    }

    const series = generateSeries({ config, start, end, intervalMinutes: interval, prng });

    // Batch write in chunks of 200 (max API limit is 200)
    const batchSize = viaApi ? 200 : 1000;
    for (let j = 0; j < series.length; j += batchSize) {
      const batch = series.slice(j, j + batchSize);

      if (viaApi && node.hardware_id) {
        // Map to API format
        const readings = batch.map((r) => ({
          current_ma: r.current_ma,
          battery_v: r.battery_v,
          rssi: r.signal_rssi,
          recorded_at: r.recorded_at.toISOString(),
          seq: j + batch.indexOf(r),
        }));

        const res = await fetch(`${baseUrl}/api/v1/ingest`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${keyString}`,
          },
          body: JSON.stringify({
            hardware_id: node.hardware_id,
            firmware: "sim-1.0.0",
            readings,
          }),
        });

        if (!res.ok) {
          console.error(`API Error for node ${node.id}: ${res.status} ${await res.text()}`);
        }
      } else {
        await writeSimulationBatch(client, batch);
      }
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
