import { parseArgs } from "util";
import { createServiceRoleClient } from "../../src/server/supabase/service-role";
import { issueNodeKey } from "../../src/server/ingest/keys";

async function main() {
  const { positionals } = parseArgs({
    allowPositionals: true,
  });

  const hardwareId = positionals[0];

  if (!hardwareId) {
    console.error("Usage: pnpm node:key <hardware_id>");
    process.exit(1);
  }

  const client = createServiceRoleClient();

  // Find the node
  const { data: node, error } = await client
    .from("nodes")
    .select("id, well_id")
    .eq("hardware_id", hardwareId)
    .single();

  if (error || !node) {
    console.error(`Node not found with hardware_id: ${hardwareId}`);
    process.exit(1);
  }

  const { keyString } = await issueNodeKey(client, node.well_id, hardwareId);

  console.log(`API Key for node ${hardwareId}:`);
  console.log(keyString);
  console.log("\nThis key will only be shown once. Please save it securely.");
}

main().catch((error) => {
  console.error("Failed to issue key:", error);
  process.exit(1);
});
