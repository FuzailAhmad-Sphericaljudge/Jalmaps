import { parseArgs } from "util";
import { createServiceRoleClient } from "../../src/server/supabase/service-role";

async function main() {
  const { values } = parseArgs({
    options: {
      node: { type: "string" },
      csv: { type: "boolean", default: false },
    },
  });

  const nodeId = values.node;
  if (!nodeId) {
    console.error("Please specify a node with --node <id>");
    process.exit(1);
  }

  const client = createServiceRoleClient();

  const { data: readings, error } = await client
    .from("readings")
    .select("*")
    .eq("node_id", nodeId)
    .order("recorded_at", { ascending: true });

  if (error || !readings) {
    console.error("Error fetching readings:", error);
    process.exit(1);
  }

  if (values.csv) {
    console.log("recorded_at,column_m,depth_to_water_m,current_ma,quality");
    for (const r of readings) {
      console.log(
        `${r.recorded_at},${r.column_m},${r.depth_to_water_m},${r.current_ma},${r.quality}`,
      );
    }
  } else {
    // Sparkline
    if (readings.length === 0) {
      console.log("No readings found.");
      return;
    }

    // Simple ASCII sparkline for depth to water
    const depths = readings.map((r) => Number(r.depth_to_water_m) || 0);
    const min = Math.min(...depths);
    const max = Math.max(...depths);
    const range = max - min || 1;

    const sparks = " ▂▃▄▅▆▇█";
    let line = "";

    // Sample if too many
    const sampleRate = Math.max(1, Math.floor(depths.length / 80));

    for (let i = 0; i < depths.length; i += sampleRate) {
      const normalized = (depths[i] - min) / range;
      const sparkIdx = Math.floor(normalized * (sparks.length - 1));
      line += sparks[sparkIdx];
    }

    console.log(`Depth sparkline for ${nodeId} (${readings.length} readings)`);
    console.log(`Min: ${min.toFixed(2)}m, Max: ${max.toFixed(2)}m`);
    console.log(line);
  }
}

main().catch(console.error);
