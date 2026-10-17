import { parseArgs } from "util";
import * as readline from "readline";
import { createServiceRoleClient } from "../../src/server/supabase/service-role";

async function main() {
  const { values } = parseArgs({
    options: {
      confirm: { type: "boolean", default: false },
    },
  });

  if (!values.confirm) {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    const answer = await new Promise<string>((resolve) =>
      rl.question("Are you sure you want to delete all simulated readings? (y/N) ", resolve),
    );
    rl.close();
    if (answer.toLowerCase() !== "y") {
      console.log("Aborted.");
      process.exit(0);
    }
  }

  const client = createServiceRoleClient();

  // Find all simulated nodes
  const { data: nodes, error } = await client.from("nodes").select("id").eq("is_simulated", true);

  if (error || !nodes) {
    console.error("Error fetching nodes:", error);
    process.exit(1);
  }

  const nodeIds = nodes.map((n) => n.id);

  if (nodeIds.length === 0) {
    console.log("No simulated nodes found.");
    process.exit(0);
  }

  console.log(`Deleting readings for ${nodeIds.length} simulated nodes...`);

  // Supabase delete with in filter
  const { error: delError } = await client.from("readings").delete().in("node_id", nodeIds);

  if (delError) {
    console.error("Error deleting readings:", delError);
    process.exit(1);
  }

  // Reset nodes metadata
  await client
    .from("nodes")
    .update({ last_seen_at: null, battery_v: null, signal_rssi: null })
    .in("id", nodeIds)
    .eq("is_simulated", true);

  console.log("Reset complete.");
}

main().catch(console.error);
