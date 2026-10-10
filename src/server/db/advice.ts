import { SupabaseClient } from "@supabase/supabase-js";
import { Database } from "@/lib/db/types";
import {
  WellFacts,
  buildFacts,
  MockForecastProvider,
  MockRainfallProvider,
} from "@/lib/advisory/facts";
import { runAdvisoryEngine, AdviceItem } from "@/lib/advisory/engine";
import { AdvisoryRuleSchema } from "@/lib/schemas/advisory";
import { getWellNode } from "./wells";

export async function getAdviceForWell(
  client: SupabaseClient<Database>,
  wellId: string,
): Promise<{ advice: AdviceItem[]; facts: WellFacts }> {
  // Get well_crops
  const { data: wellCrop } = await client
    .from("well_crops")
    .select("crop_id, sowing_date")
    .eq("well_id", wellId)
    .single();

  let cropProfile = null;
  if (wellCrop?.crop_id) {
    const { data: profileData } = await client
      .from("crop_profiles")
      .select("*")
      .eq("id", wellCrop.crop_id)
      .single();
    if (profileData) {
      cropProfile = profileData;
    }
  }

  const node = await getWellNode(client, wellId);

  // Get recent and historical readings
  let recentReadings: { recorded_at: string; depth_to_water_m: number }[] = [];
  let historicalReadings: { depth_to_water_m: number }[] = [];
  let faultStatus: "good" | "suspect" | "bad" = "good";

  if (node) {
    faultStatus = node.status as "good" | "suspect" | "bad";
    if (faultStatus !== "suspect" && faultStatus !== "bad") {
      faultStatus = "good";
    }

    const { data: recent } = await client
      .from("readings")
      .select("recorded_at, depth_to_water_m")
      .eq("node_id", node.id)
      .order("recorded_at", { ascending: false })
      .limit(10);
    if (recent)
      recentReadings = recent.filter((r) => r.depth_to_water_m !== null) as {
        recorded_at: string;
        depth_to_water_m: number;
      }[];

    const { data: historical } = await client
      .from("readings")
      .select("depth_to_water_m")
      .eq("node_id", node.id)
      .limit(100);
    if (historical)
      historicalReadings = historical.filter((r) => r.depth_to_water_m !== null) as {
        depth_to_water_m: number;
      }[];
  }

  const facts = await buildFacts(
    {
      wellId,
      sowingDate: wellCrop?.sowing_date || null,
      cropProfile: cropProfile as unknown as import("@/lib/schemas/advisory").CropProfile | null,
      recentReadings,
      historicalReadings,
      now: new Date(),
      thresholds: { warning: 20, critical: 30 }, // Placeholder thresholds
      faultStatus,
    },
    new MockForecastProvider(),
    new MockRainfallProvider(),
  );

  // Get active rules
  const { data: rulesData } = await client.from("advisory_rules").select("*").eq("enabled", true);

  const rules = (rulesData || []).map((r) => AdvisoryRuleSchema.parse(r));

  // Get history
  const recentAdviceHistory: { ruleId: string; date: string }[] = [];

  const advice = runAdvisoryEngine(rules, facts, recentAdviceHistory, new Date());

  return { advice, facts };
}
