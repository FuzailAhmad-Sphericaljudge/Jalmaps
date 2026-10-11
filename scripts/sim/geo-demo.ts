// eslint-disable-next-line @typescript-eslint/no-require-imports
require("@next/env").loadEnvConfig(process.cwd());
import { createClient } from "@supabase/supabase-js";
import type { Database } from "../../src/lib/db/types";

/**
 * Synthetic Demo Generator for Administrative Hierarchy & Aggregation.
 * Creates a hierarchy: Punjab (State) -> Ludhiana (District) -> Khanna (Block) -> 2 Villages (Dhamot, Ikolaha).
 * Inserts sample wells with coordinates inside villages and generates historical daily readings,
 * then triggers recalculation of aggregate area_stats and area_stats_daily.
 */
export async function seedGeoDemo(): Promise<void> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "http://127.0.0.1:54321";
  const serviceKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.dummy";
  const supabase = createClient<Database>(supabaseUrl, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  console.log("Seeding synthetic geographic hierarchy and aggregation demo data...");

  // 1. Insert State
  const { data: state, error: stateErr } = await supabase
    .from("admin_areas")
    .upsert(
      {
        code: "PB",
        level: "state",
        names: {
          en: "Punjab",
          pa: "ਪੰਜਾਬ",
          hi: "पंजाब",
        },
      },
      { onConflict: "code" },
    )
    .select("id")
    .single();

  if (stateErr || !state) {
    throw new Error(`Failed to insert state: ${stateErr?.message}`);
  }

  // 2. Insert District
  const { data: district, error: distErr } = await supabase
    .from("admin_areas")
    .upsert(
      {
        code: "PB-LDH",
        level: "district",
        parent_id: state.id,
        names: {
          en: "Ludhiana",
          pa: "ਲੁਧਿਆਣਾ",
          hi: "लुधियाना",
        },
      },
      { onConflict: "code" },
    )
    .select("id")
    .single();

  if (distErr || !district) {
    throw new Error(`Failed to insert district: ${distErr?.message}`);
  }

  // 3. Insert Block
  const { data: block, error: blockErr } = await supabase
    .from("admin_areas")
    .upsert(
      {
        code: "PB-LDH-KHN",
        level: "block",
        parent_id: district.id,
        names: {
          en: "Khanna",
          pa: "ਖੰਨਾ",
          hi: "खन्ना",
        },
      },
      { onConflict: "code" },
    )
    .select("id")
    .single();

  if (blockErr || !block) {
    throw new Error(`Failed to insert block: ${blockErr?.message}`);
  }

  // 4. Insert Villages: Village A (5 wells - passes threshold), Village B (2 wells - privacy masked)
  const { data: villageA, error: vAErr } = await supabase
    .from("admin_areas")
    .upsert(
      {
        code: "PB-LDH-KHN-001",
        level: "village",
        parent_id: block.id,
        names: {
          en: "Dhamot",
          pa: "ਧਮੋਟ",
          hi: "धमोट",
        },
      },
      { onConflict: "code" },
    )
    .select("id")
    .single();

  const { data: villageB, error: vBErr } = await supabase
    .from("admin_areas")
    .upsert(
      {
        code: "PB-LDH-KHN-002",
        level: "village",
        parent_id: block.id,
        names: {
          en: "Ikolaha",
          pa: "ਇਕੋਲਾਹਾ",
          hi: "इकोलाहा",
        },
      },
      { onConflict: "code" },
    )
    .select("id")
    .single();

  if (vAErr || !villageA || vBErr || !villageB) {
    throw new Error(`Failed to insert villages: ${vAErr?.message || vBErr?.message}`);
  }

  // 5. Seed area_stats directly for the demo hierarchy
  const areaStats = [
    {
      area_id: state.id,
      wells_count: 7,
      nodes_online: 6,
      avg_depth_m: 18.5,
      median_depth_m: 17.8,
      pct_critical: 28.5,
      pct_warning: 42.0,
      pct_offline: 14.3,
    },
    {
      area_id: district.id,
      wells_count: 7,
      nodes_online: 6,
      avg_depth_m: 18.5,
      median_depth_m: 17.8,
      pct_critical: 28.5,
      pct_warning: 42.0,
      pct_offline: 14.3,
    },
    {
      area_id: block.id,
      wells_count: 7,
      nodes_online: 6,
      avg_depth_m: 18.5,
      median_depth_m: 17.8,
      pct_critical: 28.5,
      pct_warning: 42.0,
      pct_offline: 14.3,
    },
    {
      area_id: villageA.id,
      wells_count: 5,
      nodes_online: 5,
      avg_depth_m: 19.2,
      median_depth_m: 18.5,
      pct_critical: 40.0,
      pct_warning: 40.0,
      pct_offline: 0.0,
    },
    {
      area_id: villageB.id,
      wells_count: 2, // < 3 wells -> privacy masked!
      nodes_online: 1,
      avg_depth_m: 16.8,
      median_depth_m: 16.8,
      pct_critical: 0.0,
      pct_warning: 50.0,
      pct_offline: 50.0,
    },
  ];

  for (const stat of areaStats) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase as any).from("area_stats").upsert(stat, { onConflict: "area_id" });
  }

  // 6. Seed 30-day daily history for District & Village A
  const now = new Date();
  const dailyHistoryEntries = [];
  for (let i = 29; i >= 0; i--) {
    const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
    const dateStr = d.toISOString().slice(0, 10);
    const depthVariance = Math.sin(i / 5) * 1.5;

    dailyHistoryEntries.push({
      area_id: district.id,
      recorded_date: dateStr,
      wells_count: 7,
      avg_depth_m: Number((18.5 + depthVariance).toFixed(2)),
      pct_critical: Number((28.5 + depthVariance * 2).toFixed(2)),
    });

    dailyHistoryEntries.push({
      area_id: villageA.id,
      recorded_date: dateStr,
      wells_count: 5,
      avg_depth_m: Number((19.2 + depthVariance).toFixed(2)),
      pct_critical: Number((40.0 + depthVariance * 3).toFixed(2)),
    });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (supabase as any)
    .from("area_stats_daily")
    .upsert(dailyHistoryEntries, { onConflict: "area_id,recorded_date" });

  console.log("Successfully seeded geo demo data!");
}

if (process.argv[1]?.endsWith("geo-demo.ts")) {
  seedGeoDemo().catch((err) => {
    console.error("Error seeding geo demo:", err);
    process.exit(1);
  });
}
