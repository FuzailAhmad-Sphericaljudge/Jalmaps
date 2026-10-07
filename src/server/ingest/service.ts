import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/db/types";
import {
  ingestRequestSchema,
  type IngestResponse,
  validateTimestampPlausibility,
} from "@/lib/schemas/ingest";
import { verifyNodeKey } from "./keys";
import { currentToColumnM, columnToDepthToWater, classifyQuality } from "@/lib/sensor/math";

// Limits
const MAX_PAYLOAD_SIZE = 64 * 1024; // 64 KB
const MAX_REJECT_PAYLOAD_SIZE = 16 * 1024; // 16 KB

export class IngestError extends Error {
  constructor(
    public statusCode: number,
    message: string,
  ) {
    super(message);
    this.name = "IngestError";
  }
}

export async function processIngestion(
  db: SupabaseClient<Database>,
  authHeader: string | null,
  bodyRaw: string,
  _clientIp: string,
): Promise<IngestResponse> {
  const serverTime = new Date();

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    throw new IngestError(401, "Unauthorized");
  }

  const token = authHeader.substring(7);

  if (bodyRaw.length > MAX_PAYLOAD_SIZE) {
    throw new IngestError(413, "Payload Too Large");
  }

  let bodyJson: unknown;
  try {
    bodyJson = JSON.parse(bodyRaw);
  } catch {
    throw new IngestError(400, "Invalid JSON");
  }

  const parseResult = ingestRequestSchema.safeParse(bodyJson);
  if (!parseResult.success) {
    await recordReject(db, null, null, "Schema validation failed", bodyRaw);
    throw new IngestError(400, "Bad Request: " + parseResult.error.message);
  }

  const req = parseResult.data;

  // Authenticate
  const nodeId = await verifyNodeKey(db, token, req.hardware_id);
  if (!nodeId) {
    throw new IngestError(401, "Unauthorized");
  }

  // Rate limit (60 req/min)
  const { data: rateLimitOk, error: rateLimitError } = await db.rpc("check_node_rate_limit", {
    p_node_id: nodeId,
    p_max_reqs: 60,
  });

  if (rateLimitError) {
    console.error("Rate limit check error:", rateLimitError);
    throw new IngestError(500, "Internal Server Error");
  }

  if (!rateLimitOk) {
    throw new IngestError(429, "Too Many Requests");
  }

  // Fetch node config
  const { data: node, error: nodeError } = await db
    .from("nodes")
    .select("id, range_m, hang_depth_m, calibration_offset_m")
    .eq("id", nodeId)
    .single();

  if (nodeError || !node) {
    throw new IngestError(500, "Internal Server Error");
  }

  // Process readings
  const results: IngestResponse["results"] = [];
  let accepted = 0;
  let duplicates = 0;
  let rejected = 0;

  const readingsToInsert: Database["public"]["Tables"]["readings"]["Insert"][] = [];

  let latestAcceptedIndex = -1;

  for (let i = 0; i < req.readings.length; i++) {
    const r = req.readings[i];

    // Resolve timestamp
    let recordedAt: Date;
    if (r.recorded_at) {
      recordedAt = new Date(r.recorded_at);
    } else if (r.age_s !== undefined) {
      recordedAt = new Date(serverTime.getTime() - r.age_s * 1000);
    } else {
      results.push({ index: i, status: "rejected", reason: "Missing timestamp" });
      rejected++;
      continue;
    }

    if (!validateTimestampPlausibility(recordedAt, serverTime)) {
      results.push({ index: i, status: "rejected", reason: "Implausible timestamp" });
      rejected++;
      continue;
    }

    const previousMa = i > 0 ? req.readings[i - 1].current_ma : undefined;
    const minutesSincePrev =
      i > 0 && r.recorded_at && req.readings[i - 1].recorded_at
        ? (new Date(r.recorded_at).getTime() -
            new Date(req.readings[i - 1].recorded_at!).getTime()) /
          60000
        : undefined;

    const quality = classifyQuality({
      currentMa: r.current_ma,
      previousMa,
      minutesSincePrevious: minutesSincePrev ? Math.abs(minutesSincePrev) : undefined,
    });

    let columnM = 0;
    let depthM: number | null = null;

    // We compute even if suspect, but might skip if bad or if we want to be safe.
    // The prompt says "compute column_m and depth_to_water_m on the server."
    if (node.range_m && node.hang_depth_m) {
      columnM = currentToColumnM(r.current_ma, {
        range_m: node.range_m,
        calibration_offset_m: node.calibration_offset_m,
      });
      depthM = columnToDepthToWater(columnM, node.hang_depth_m);
    } else {
      // Missing calibration config
      results.push({ index: i, status: "rejected", reason: "Node missing calibration" });
      rejected++;
      continue;
    }

    readingsToInsert.push({
      node_id: nodeId,
      recorded_at: recordedAt.toISOString(),
      received_at: serverTime.toISOString(),
      column_m: columnM,
      depth_to_water_m: depthM,
      current_ma: r.current_ma,
      battery_v: r.battery_v ?? null,
      rssi: r.rssi ?? null,
      quality: quality,
      raw: r as unknown as Record<string, unknown>,
    });

    results.push({ index: i, status: "accepted" });
    accepted++;

    // Keep track of latest reading to update node
    if (
      latestAcceptedIndex === -1 ||
      new Date(readingsToInsert[latestAcceptedIndex].recorded_at).getTime() < recordedAt.getTime()
    ) {
      latestAcceptedIndex = readingsToInsert.length - 1;
    }
  }

  // Insert readings batch
  if (readingsToInsert.length > 0) {
    // We use ON CONFLICT DO NOTHING to ignore duplicates
    const { error: insertError } = await db
      .from("readings")
      .upsert(readingsToInsert, { onConflict: "node_id, recorded_at", ignoreDuplicates: true });

    if (insertError) {
      console.error("Insert error:", insertError);
      throw new IngestError(500, "Database Error");
    }

    // Now we must count duplicates vs actual accepted. Since Supabase upsert doesn't tell us which rows were ignored easily without fetching,
    // we can either assume all are accepted if no error, but the prompt says: "Duplicate sends do not create duplicate rows. report duplicates per reading."
    // Actually, to report duplicates accurately per reading, we should ideally check which timestamps exist first.
    // For this Phase, we'll do a quick check of existing timestamps if there are readings to insert.
    const timestamps = readingsToInsert.map((r) => r.recorded_at);
    const { data: existing } = await db
      .from("readings")
      .select("recorded_at")
      .eq("node_id", nodeId)
      .in("recorded_at", timestamps);

    if (existing && existing.length > 0) {
      const existingMap = new Set(existing.map((e) => e.recorded_at));

      // Update results
      accepted = 0;
      for (const r of readingsToInsert) {
        const origResult = results.find(
          (res) =>
            req.readings[res.index].recorded_at === r.recorded_at ||
            (req.readings[res.index].age_s !== undefined &&
              new Date(
                serverTime.getTime() - req.readings[res.index].age_s! * 1000,
              ).toISOString() === r.recorded_at),
        );
        if (origResult) {
          if (existingMap.has(r.recorded_at)) {
            origResult.status = "duplicate";
            duplicates++;
          } else {
            accepted++;
          }
        }
      }
    }

    // Update side effects
    if (latestAcceptedIndex !== -1) {
      const latest = readingsToInsert[latestAcceptedIndex];
      await db
        .from("nodes")
        .update({
          last_seen_at: latest.recorded_at,
          battery_v: latest.battery_v,
          signal_rssi: latest.rssi,
          firmware_version: req.firmware,
        })
        .eq("id", nodeId);

      // Extension point
      await onReadingsIngested(db, nodeId, latest.recorded_at);
    }
  }

  // Record rejects if any
  if (rejected > 0) {
    await recordReject(db, nodeId, req.hardware_id, "Some readings rejected", bodyRaw);
  }

  return {
    server_time: serverTime.toISOString(),
    next_interval_s: 900,
    accepted,
    duplicates,
    rejected,
    results,
  };
}

async function recordReject(
  db: SupabaseClient<Database>,
  nodeId: string | null,
  hardwareId: string | null,
  reason: string,
  payloadStr: string,
) {
  let safePayload = payloadStr;
  if (safePayload.length > MAX_REJECT_PAYLOAD_SIZE) {
    safePayload = safePayload.substring(0, MAX_REJECT_PAYLOAD_SIZE) + "...[truncated]";
  }

  let jsonPayload = { raw: safePayload };
  try {
    const parsed = JSON.parse(safePayload);
    // Strip api keys just in case? API keys shouldn't be in the body anyway, they are in the header.
    jsonPayload = parsed;
  } catch {}

  await db.from("ingest_rejects").insert({
    node_id: nodeId,
    hardware_id: hardwareId,
    reason,
    payload: jsonPayload as unknown as Record<string, unknown>,
  });
}

/**
 * Extension point for evaluating alerts, etc.
 * Will be implemented in Phase 13.
 */
export async function onReadingsIngested(
  _db: SupabaseClient<Database>,
  _nodeId: string,
  _latestRecordedAt: string,
) {
  // no-op for Phase 8
}
