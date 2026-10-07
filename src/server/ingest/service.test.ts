import { describe, expect, it, beforeAll, vi } from "vitest";

vi.mock("server-only", () => ({}));

import { createServiceRoleClient } from "../../server/supabase/service-role";
import { issueNodeKey, revokeNodeKey } from "./keys";
import { processIngestion, IngestError } from "./service";
import crypto from "node:crypto";

describe("Ingestion Service Integration", () => {
  const db = createServiceRoleClient();
  let validNodeId: string;
  let validHardwareId: string;
  let validKey: string;

  beforeAll(async () => {
    // Create a node directly or find one
    validHardwareId = "TEST-NODE-" + crypto.randomUUID();

    // We need an admin area to create a well
    let { data: area } = await db.from("admin_areas").select("id").limit(1).maybeSingle();
    if (!area) {
      const { data: newArea, error } = await db
        .from("admin_areas")
        .insert({
          code: "TEST-AREA",
          level: "state",
          names: { en: "Test Area" },
        })
        .select("id")
        .single();
      if (error) console.error("Admin area insert error:", error);
      area = newArea;
    }
    if (!area) throw new Error("No admin area");

    const { data: well } = await db
      .from("wells")
      .insert({
        admin_area_id: area.id,
        name: "Test Well",
        latitude: 10,
        longitude: 10,
        well_type: "borewell",
      })
      .select("id")
      .single();

    if (!well) throw new Error("No well");

    const issued = await issueNodeKey(db, well.id, validHardwareId);
    validKey = issued.keyString;

    // Update node with range
    await db
      .from("nodes")
      .update({
        range_m: 30,
        hang_depth_m: 50,
        calibration_offset_m: 0,
      })
      .eq("hardware_id", validHardwareId);

    const { data: node } = await db
      .from("nodes")
      .select("id")
      .eq("hardware_id", validHardwareId)
      .single();
    validNodeId = node!.id;
  });

  it("rejects missing auth", async () => {
    await expect(processIngestion(db, null, "{}", "127.0.0.1")).rejects.toThrowError(IngestError);
  });

  it("rejects invalid JSON", async () => {
    await expect(
      processIngestion(db, `Bearer ${validKey}`, "{ bad", "127.0.0.1"),
    ).rejects.toThrowError(/Invalid JSON/);
  });

  it("rejects missing hardware_id", async () => {
    await expect(
      processIngestion(
        db,
        `Bearer ${validKey}`,
        JSON.stringify({
          readings: [],
        }),
        "127.0.0.1",
      ),
    ).rejects.toThrowError(/Bad Request/);
  });

  it("accepts a valid payload", async () => {
    const payload = {
      hardware_id: validHardwareId,
      readings: [
        {
          current_ma: 12,
          age_s: 10,
        },
      ],
    };

    const res = await processIngestion(
      db,
      `Bearer ${validKey}`,
      JSON.stringify(payload),
      "127.0.0.1",
    );
    expect(res.accepted).toBe(1);
    expect(res.rejected).toBe(0);

    // Verify it updated node's last_seen
    const { data: node } = await db
      .from("nodes")
      .select("last_seen_at")
      .eq("id", validNodeId)
      .single();
    expect(node!.last_seen_at).toBeTruthy();
  });

  it("detects duplicates", async () => {
    const timestamp = new Date().toISOString();
    const payload = {
      hardware_id: validHardwareId,
      readings: [
        {
          current_ma: 12,
          recorded_at: timestamp,
        },
      ],
    };

    const res1 = await processIngestion(
      db,
      `Bearer ${validKey}`,
      JSON.stringify(payload),
      "127.0.0.1",
    );
    expect(res1.accepted).toBe(1);

    const res2 = await processIngestion(
      db,
      `Bearer ${validKey}`,
      JSON.stringify(payload),
      "127.0.0.1",
    );
    expect(res2.duplicates).toBe(1);
    expect(res2.accepted).toBe(0);
  });

  it("rejects revoked key", async () => {
    await revokeNodeKey(db, validHardwareId);

    const payload = {
      hardware_id: validHardwareId,
      readings: [],
    };

    await expect(
      processIngestion(db, `Bearer ${validKey}`, JSON.stringify(payload), "127.0.0.1"),
    ).rejects.toThrowError(/Unauthorized/);
  });
});
