import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/db/types";
import { evaluateDataSufficiency } from "@/lib/insights/sufficiency";
import { computeDailyMedians, decomposeTimeSeries } from "@/lib/insights/seasonal";
import { compareMonsoonSeasons } from "@/lib/insights/monsoon";
import { computeTheilSenDepletion } from "@/lib/insights/depletion";
import { estimateMonsoonRecharge } from "@/lib/insights/recharge";
import { analyzePumpStress } from "@/lib/insights/pumping";
import { calculateAquiferHealthScore, type AquiferHealthBand } from "@/lib/insights/health-score";

type DbJson = NonNullable<Database["public"]["Tables"]["well_insights"]["Insert"]["sufficiency"]>;

/**
 * Creates an elevated Supabase service-role client for background calculation jobs.
 */
export function createServiceRoleClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || "http://127.0.0.1:54321";
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
  return createClient<Database>(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

/**
 * Computes and stores comprehensive aquifer insights for a single well.
 */
export async function computeWellInsights(
  wellId: string,
  asOfDateStr?: string,
  client = createServiceRoleClient(),
) {
  const asOf = asOfDateStr ?? new Date().toISOString().slice(0, 10);

  // 1. Fetch well and aquifer metadata
  const { data: well, error: wellErr } = await client
    .from("wells")
    .select("*, aquifer_types(*)")
    .eq("id", wellId)
    .single();

  if (wellErr || !well) {
    throw new Error(`Failed to fetch well ${wellId}: ${wellErr?.message ?? "Not found"}`);
  }

  // 2. Fetch associated nodes and readings
  const { data: nodes } = await client.from("nodes").select("id").eq("well_id", wellId);

  const nodeIds = (nodes ?? []).map((n) => n.id);
  if (nodeIds.length === 0) {
    return null;
  }

  const readingsData: Array<{
    recorded_at: string;
    depth_to_water_m: number;
    quality: string | null;
  }> = [];
  let page = 0;
  const pageSize = 1000;
  while (true) {
    const from = page * pageSize;
    const to = from + pageSize - 1;
    const { data: chunk, error: readingsErr } = await client
      .from("readings")
      .select("recorded_at, depth_to_water_m, quality")
      .in("node_id", nodeIds)
      .order("recorded_at", { ascending: true })
      .range(from, to);

    if (readingsErr) {
      throw new Error(`Failed to fetch readings for well ${wellId}: ${readingsErr.message}`);
    }
    if (!chunk || chunk.length === 0) break;
    readingsData.push(
      ...chunk.map((c) => ({
        recorded_at: c.recorded_at,
        depth_to_water_m: c.depth_to_water_m ?? 0,
        quality: c.quality,
      })),
    );
    if (chunk.length < pageSize) break;
    page++;
  }

  const samples = readingsData.map((r) => ({
    recordedAt: r.recorded_at,
    depthToWaterM: r.depth_to_water_m,
    quality: r.quality as "good" | "suspect" | "bad" | null,
  }));

  // 3. Evaluate Data Sufficiency
  const sufficiency = evaluateDataSufficiency(samples);

  if (!sufficiency.isSufficient) {
    // Record insufficient state with explanation
    await client.from("well_insights").upsert(
      {
        well_id: wellId,
        as_of: asOf,
        is_sufficient: false,
        sufficiency: sufficiency as unknown as DbJson,
        seasonal: {} as DbJson,
        monsoon: {} as DbJson,
        depletion: {} as DbJson,
        recharge: {} as DbJson,
        pumping: {} as DbJson,
        health: {} as DbJson,
        health_score: null,
        health_band: null,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "well_id,as_of" },
    );
    return { wellId, isSufficient: false, sufficiency };
  }

  // 4. Compute Seasonal Analysis & Decomposition
  const dailyMedians = computeDailyMedians(samples);
  const seasonalResult = decomposeTimeSeries(dailyMedians);

  // 5. Compute Pre- and Post-Monsoon Comparison
  const monsoon = compareMonsoonSeasons(dailyMedians);

  // 6. Compute Yearly Depletion Rate
  const depletion = computeTheilSenDepletion(dailyMedians);

  // 7. Compute Specific Yield & Recharge
  const aquiferType = well.aquifer_types as {
    default_specific_yield_min: number;
    default_specific_yield_max: number;
  } | null;

  const defaultSy = aquiferType
    ? (aquiferType.default_specific_yield_min + aquiferType.default_specific_yield_max) / 2
    : null;

  const specificYield = well.specific_yield_override ?? defaultSy ?? null;
  const specificYieldSource = well.specific_yield_override
    ? ("well_override" as const)
    : defaultSy !== null
      ? ("aquifer_type_default" as const)
      : null;

  const latestMonsoon = monsoon.latestYear;
  const recharge = latestMonsoon
    ? estimateMonsoonRecharge({
        monsoonComparison: latestMonsoon,
        specificYield,
        specificYieldSource,
      })
    : null;

  // 8. Compute Pump Stress Metrics
  const pumping = analyzePumpStress(samples);

  // 9. Compute Transparent Health Score
  const peakDrySeasonDepthM = latestMonsoon?.preMonsoonMedianDepthM ?? null;
  const health = calculateAquiferHealthScore({
    sufficiency,
    monsoon,
    depletion,
    peakDrySeasonDepthM,
    wellDepthOrCriticalThresholdM: well.total_depth_m ?? null,
  });

  // Calculate residual std dev if points exist
  const residuals = seasonalResult.decomposition.map((d) => d.residual);
  const meanRes =
    residuals.length > 0 ? residuals.reduce((a, b) => a + b, 0) / residuals.length : 0;
  const resVariance =
    residuals.length > 0
      ? residuals.reduce((acc, r) => acc + Math.pow(r - meanRes, 2), 0) / residuals.length
      : 0;
  const residualStdDevM = Math.round(Math.sqrt(resVariance) * 1000) / 1000;

  // 10. Persist to well_insights
  const { error: upsertErr } = await client.from("well_insights").upsert(
    {
      well_id: wellId,
      as_of: asOf,
      is_sufficient: true,
      sufficiency: sufficiency as unknown as DbJson,
      seasonal: {
        dailyPointsCount: dailyMedians.length,
        residualStdDevM,
        dailyMedians: dailyMedians.slice(-90), // store recent 90 days for snappy sparklines
      } as unknown as DbJson,
      monsoon: monsoon as unknown as DbJson,
      depletion: depletion as unknown as DbJson,
      recharge: (recharge ?? {}) as unknown as DbJson,
      pumping: {
        activePumpingDaysCount: pumping.activePumpingDaysCount,
        medianDrawdownM: pumping.medianDrawdownM,
        medianRecoveryTimeHours: pumping.medianRecoveryTimeHours,
        stressLevel: pumping.stressLevel,
        stressNoteKey: pumping.stressNoteKey,
      } as unknown as DbJson,
      health: health as unknown as DbJson,
      health_score: health.score,
      health_band: health.band,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "well_id,as_of" },
  );

  if (upsertErr) {
    throw new Error(`Failed to upsert well insights for ${wellId}: ${upsertErr.message}`);
  }

  return {
    wellId,
    isSufficient: true,
    healthScore: health.score,
    healthBand: health.band,
  };
}

/**
 * Refreshes insights across all active wells in the system.
 */
export async function refreshAllWellInsights(client = createServiceRoleClient()) {
  const { data: wells, error } = await client.from("wells").select("id");
  if (error) throw error;

  const results = [];
  for (const well of wells ?? []) {
    try {
      const res = await computeWellInsights(well.id, undefined, client);
      results.push(res);
    } catch (err) {
      console.error(`Error computing insights for well ${well.id}:`, err);
    }
  }
  return results;
}

/**
 * Aggregates village and regional aquifer insights while enforcing k >= 3 privacy threshold.
 */
export async function refreshAreaInsights(client = createServiceRoleClient()) {
  const asOf = new Date().toISOString().slice(0, 10);

  // Fetch all admin areas
  const { data: areas, error: areaErr } = await client
    .from("admin_areas")
    .select("id, names, level, parent_id");

  if (areaErr || !areas) throw areaErr;

  // Fetch recent well insights joined with well area
  const { data: wellInsights, error: wiErr } = await client
    .from("well_insights")
    .select(
      "well_id, is_sufficient, health_score, health_band, depletion, recharge, wells(admin_area_id)",
    )
    .eq("as_of", asOf);

  if (wiErr) throw wiErr;

  // Group by village / admin area
  const insightsByArea = new Map<string, typeof wellInsights>();
  for (const row of wellInsights ?? []) {
    const areaId = (row.wells as { admin_area_id: string | null } | null)?.admin_area_id;
    if (!areaId) continue;
    const list = insightsByArea.get(areaId) ?? [];
    list.push(row);
    insightsByArea.set(areaId, list);
  }

  const results: Array<{
    areaId: string;
    level: string;
    wellsCount: number;
    isSufficient: boolean;
    avgScore: number | null;
  }> = [];

  // Map to hold computed stats per area for rollups
  interface StoredAreaStat {
    wellsCount: number;
    sufficientWellsCount: number;
    avgScore: number | null;
    worstScore: number | null;
    dominantBand: string | null;
    avgDepletion: number | null;
    totalRechargeMCM: number | null;
  }
  const computedAreaStats = new Map<string, StoredAreaStat>();

  // 1. Process Village Level
  const villages = areas.filter((a) => a.level === "village");
  for (const village of villages) {
    const list = insightsByArea.get(village.id) ?? [];
    const wellsCount = list.length;

    if (wellsCount < 3) {
      await client.from("area_insights").upsert(
        {
          area_id: village.id,
          as_of: asOf,
          wells_count: wellsCount,
          is_sufficient: false,
          avg_health_score: null,
          worst_health_score: null,
          dominant_health_band: null,
          avg_depletion_rate_m_per_year: null,
          total_recharge_volume_mcm: null,
          insights: {
            reasonKey: "privacy_insufficient_sample_size",
            minRequired: 3,
            actualCount: wellsCount,
          } as unknown as DbJson,
        },
        { onConflict: "area_id,as_of" },
      );
      computedAreaStats.set(village.id, {
        wellsCount,
        sufficientWellsCount: 0,
        avgScore: null,
        worstScore: null,
        dominantBand: null,
        avgDepletion: null,
        totalRechargeMCM: null,
      });
      results.push({
        areaId: village.id,
        level: "village",
        wellsCount,
        isSufficient: false,
        avgScore: null,
      });
      continue;
    }

    const sufficientRows = list.filter((r) => r.is_sufficient && r.health_score !== null);
    if (sufficientRows.length === 0) {
      await client.from("area_insights").upsert(
        {
          area_id: village.id,
          as_of: asOf,
          wells_count: wellsCount,
          is_sufficient: false,
          avg_health_score: null,
          worst_health_score: null,
          dominant_health_band: null,
          avg_depletion_rate_m_per_year: null,
          total_recharge_volume_mcm: null,
          insights: {
            reasonKey: "area_no_sufficient_wells",
          } as unknown as DbJson,
        },
        { onConflict: "area_id,as_of" },
      );
      computedAreaStats.set(village.id, {
        wellsCount,
        sufficientWellsCount: 0,
        avgScore: null,
        worstScore: null,
        dominantBand: null,
        avgDepletion: null,
        totalRechargeMCM: null,
      });
      results.push({
        areaId: village.id,
        level: "village",
        wellsCount,
        isSufficient: false,
        avgScore: null,
      });
      continue;
    }

    const scores = sufficientRows.map((r) => r.health_score!);
    const avgScore = Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 10) / 10;
    const worstScore = Math.min(...scores);

    // Dominant band
    const bandCounts = new Map<AquiferHealthBand, number>();
    for (const r of sufficientRows) {
      if (!r.health_band) continue;
      const band = r.health_band as AquiferHealthBand;
      bandCounts.set(band, (bandCounts.get(band) ?? 0) + 1);
    }
    let dominantBand = "healthy";
    let maxBandCount = 0;
    for (const [band, count] of bandCounts.entries()) {
      if (count > maxBandCount) {
        maxBandCount = count;
        dominantBand = band;
      }
    }

    const depletions = sufficientRows
      .map((r) => (r.depletion as { depletionRateMPerYear?: number | null })?.depletionRateMPerYear)
      .filter((d): d is number => typeof d === "number");
    const avgDepletion =
      depletions.length > 0
        ? Math.round((depletions.reduce((a, b) => a + b, 0) / depletions.length) * 1000) / 1000
        : null;

    const rechargeVolumes = sufficientRows
      .map(
        (r) =>
          (r.recharge as { estimatedRechargeVolumeMCM?: number | null })
            ?.estimatedRechargeVolumeMCM,
      )
      .filter((v): v is number => typeof v === "number");
    const totalRechargeMCM =
      rechargeVolumes.length > 0
        ? Math.round(rechargeVolumes.reduce((a, b) => a + b, 0) * 1000) / 1000
        : null;

    await client.from("area_insights").upsert(
      {
        area_id: village.id,
        as_of: asOf,
        wells_count: wellsCount,
        is_sufficient: true,
        avg_health_score: avgScore,
        worst_health_score: worstScore,
        dominant_health_band: dominantBand,
        avg_depletion_rate_m_per_year: avgDepletion,
        total_recharge_volume_mcm: totalRechargeMCM,
        insights: { sampledWellsCount: sufficientRows.length } as unknown as DbJson,
      },
      { onConflict: "area_id,as_of" },
    );

    computedAreaStats.set(village.id, {
      wellsCount,
      sufficientWellsCount: sufficientRows.length,
      avgScore,
      worstScore,
      dominantBand,
      avgDepletion,
      totalRechargeMCM,
    });
    results.push({
      areaId: village.id,
      level: "village",
      wellsCount,
      isSufficient: true,
      avgScore,
    });
  }

  // 2. Roll up parent tiers (block -> district -> state)
  const tiers: Array<"block" | "district" | "state"> = ["block", "district", "state"];
  for (const tier of tiers) {
    const tierAreas = areas.filter((a) => a.level === tier);
    for (const area of tierAreas) {
      const childAreas = areas.filter((c) => c.parent_id === area.id);
      const childStats = childAreas
        .map((c) => computedAreaStats.get(c.id))
        .filter((s): s is StoredAreaStat => s !== undefined);

      const totalWells = childStats.reduce((acc, s) => acc + s.wellsCount, 0);
      const totalSufficient = childStats.reduce((acc, s) => acc + s.sufficientWellsCount, 0);

      if (totalWells < 3) {
        await client.from("area_insights").upsert(
          {
            area_id: area.id,
            as_of: asOf,
            wells_count: totalWells,
            is_sufficient: false,
            avg_health_score: null,
            worst_health_score: null,
            dominant_health_band: null,
            avg_depletion_rate_m_per_year: null,
            total_recharge_volume_mcm: null,
            insights: {
              reasonKey: "privacy_insufficient_sample_size",
              minRequired: 3,
              actualCount: totalWells,
            } as unknown as DbJson,
          },
          { onConflict: "area_id,as_of" },
        );
        computedAreaStats.set(area.id, {
          wellsCount: totalWells,
          sufficientWellsCount: 0,
          avgScore: null,
          worstScore: null,
          dominantBand: null,
          avgDepletion: null,
          totalRechargeMCM: null,
        });
        results.push({
          areaId: area.id,
          level: tier,
          wellsCount: totalWells,
          isSufficient: false,
          avgScore: null,
        });
        continue;
      }

      const validChildStats = childStats.filter(
        (s) => s.avgScore !== null && s.sufficientWellsCount > 0,
      );
      if (validChildStats.length === 0) {
        await client.from("area_insights").upsert(
          {
            area_id: area.id,
            as_of: asOf,
            wells_count: totalWells,
            is_sufficient: false,
            avg_health_score: null,
            worst_health_score: null,
            dominant_health_band: null,
            avg_depletion_rate_m_per_year: null,
            total_recharge_volume_mcm: null,
            insights: { reasonKey: "area_no_sufficient_wells" } as unknown as DbJson,
          },
          { onConflict: "area_id,as_of" },
        );
        computedAreaStats.set(area.id, {
          wellsCount: totalWells,
          sufficientWellsCount: 0,
          avgScore: null,
          worstScore: null,
          dominantBand: null,
          avgDepletion: null,
          totalRechargeMCM: null,
        });
        results.push({
          areaId: area.id,
          level: tier,
          wellsCount: totalWells,
          isSufficient: false,
          avgScore: null,
        });
        continue;
      }

      // Weighted average health score
      const totalWeightedScore = validChildStats.reduce(
        (acc, s) => acc + s.avgScore! * s.sufficientWellsCount,
        0,
      );
      const avgScore = Math.round((totalWeightedScore / totalSufficient) * 10) / 10;

      const worstScore = Math.min(...validChildStats.map((s) => s.worstScore!));

      // Recharges sum
      const totalRechargeMCM =
        Math.round(validChildStats.reduce((acc, s) => acc + (s.totalRechargeMCM ?? 0), 0) * 1000) /
        1000;

      // Depletions weighted average
      const totalWeightedDepletion = validChildStats.reduce(
        (acc, s) => acc + (s.avgDepletion ?? 0) * s.sufficientWellsCount,
        0,
      );
      const avgDepletion =
        totalSufficient > 0
          ? Math.round((totalWeightedDepletion / totalSufficient) * 1000) / 1000
          : null;

      // Determine dominant band
      let dominantBand = "healthy";
      if (avgScore < 40) dominantBand = "critical";
      else if (avgScore < 60) dominantBand = "stressed";
      else if (avgScore < 75) dominantBand = "moderate";

      await client.from("area_insights").upsert(
        {
          area_id: area.id,
          as_of: asOf,
          wells_count: totalWells,
          is_sufficient: true,
          avg_health_score: avgScore,
          worst_health_score: worstScore,
          dominant_health_band: dominantBand,
          avg_depletion_rate_m_per_year: avgDepletion,
          total_recharge_volume_mcm: totalRechargeMCM,
          insights: {
            sampledWellsCount: totalSufficient,
            childAreasCount: childAreas.length,
          } as unknown as DbJson,
        },
        { onConflict: "area_id,as_of" },
      );

      computedAreaStats.set(area.id, {
        wellsCount: totalWells,
        sufficientWellsCount: totalSufficient,
        avgScore,
        worstScore,
        dominantBand,
        avgDepletion,
        totalRechargeMCM,
      });
      results.push({
        areaId: area.id,
        level: tier,
        wellsCount: totalWells,
        isSufficient: true,
        avgScore,
      });
    }
  }

  return results;
}
