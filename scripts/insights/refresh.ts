// eslint-disable-next-line @typescript-eslint/no-require-imports
require("@next/env").loadEnvConfig(process.cwd());
import { refreshAllWellInsights, refreshAreaInsights } from "../../src/server/insights/jobs";

async function main() {
  console.log("Starting aquifer insights refresh...");
  const wellResults = await refreshAllWellInsights();
  console.log(`Refreshed insights for ${wellResults.length} wells.`);

  const areaResults = await refreshAreaInsights();
  console.log(`Refreshed insights for ${areaResults.length} areas.`);
  console.log("Aquifer insights refresh completed successfully.");
}

main().catch((err) => {
  console.error("Aquifer insights refresh failed:", err);
  process.exit(1);
});
