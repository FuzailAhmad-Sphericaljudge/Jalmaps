import { createServiceRoleClient } from "../../src/server/supabase/service-role";

async function main() {
  const client = createServiceRoleClient();

  const { data: nodes, error } = await client
    .from("nodes")
    .select("id, hardware_id, is_simulated, last_seen_at")
    .eq("is_simulated", true);

  if (error || !nodes) {
    console.error("Error fetching nodes:", error);
    process.exit(1);
  }

  console.log(`Found ${nodes.length} simulated nodes.`);

  for (const node of nodes) {
    // Count readings
    const { count } = await client
      .from("readings")
      .select("*", { count: "exact", head: true })
      .eq("node_id", node.id);

    console.log(
      `Node ${node.id} (${node.hardware_id}) - ${count || 0} readings - Last seen: ${node.last_seen_at || "Never"}`,
    );
  }
}

main().catch(console.error);
