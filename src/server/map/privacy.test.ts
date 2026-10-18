import { describe, expect, it } from "vitest";
import type { Profile } from "@/server/auth";
import { applyRolePrivacy, computeWellStatus, jitterCoordinates, type RawWell } from "./privacy";

describe("jitterCoordinates", () => {
  it("is deterministic for identical seeds", () => {
    const lat = 28.6139;
    const lng = 77.209;
    const seed = "well-123";

    const res1 = jitterCoordinates(lat, lng, seed, 150);
    const res2 = jitterCoordinates(lat, lng, seed, 150);

    expect(res1.lat).toBe(res2.lat);
    expect(res1.lng).toBe(res2.lng);
  });

  it("produces different offsets for different seeds", () => {
    const lat = 28.6139;
    const lng = 77.209;

    const res1 = jitterCoordinates(lat, lng, "well-1", 150);
    const res2 = jitterCoordinates(lat, lng, "well-2", 150);

    expect(res1.lat !== res2.lat || res1.lng !== res2.lng).toBe(true);
  });

  it("stays within ~150 meters offset bounds", () => {
    const lat = 28.6139;
    const lng = 77.209;

    const res = jitterCoordinates(lat, lng, "test-seed", 150);
    const deltaLatMeters = Math.abs(res.lat - lat) * 111111;
    expect(deltaLatMeters).toBeLessThanOrEqual(155);
  });
});

describe("computeWellStatus", () => {
  const baseWell: RawWell = {
    id: "w1",
    name: "Farm Well",
    latitude: 28.0,
    longitude: 77.0,
    owner_id: "u1",
    admin_area_id: "area-1",
    status: "active",
    total_depth_m: 50,
    well_type: "borewell",
    warning_threshold: 15,
    critical_threshold: 25,
  };

  it("computes normal status when depth is below warning", () => {
    expect(computeWellStatus({ ...baseWell, latest_depth_m: 10 })).toBe("normal");
  });

  it("computes warning status when depth reaches warning threshold", () => {
    expect(computeWellStatus({ ...baseWell, latest_depth_m: 18 })).toBe("warning");
  });

  it("computes critical status when depth reaches critical threshold", () => {
    expect(computeWellStatus({ ...baseWell, latest_depth_m: 26 })).toBe("critical");
  });

  it("computes critical for dry wells even without reading", () => {
    expect(computeWellStatus({ ...baseWell, status: "dry", latest_depth_m: null })).toBe(
      "critical",
    );
  });
});

describe("applyRolePrivacy", () => {
  const farmerProfile: Profile = {
    id: "user-farmer",
    role: "farmer",
    admin_area_id: "village-1",
    full_name: "Farmer John",
    phone: "+919876543210",
    preferred_locale: "en",
    preferred_unit: "m",
    onboarding_completed_at: "2026-01-01T00:00:00Z",
    crops: [],
    preferred_high_contrast: false,
    preferred_text_size: "normal",
    preferred_theme: "system",
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
    data_sharing_consent: false,
    data_sharing_consent_at: null,
    deleted_at: null,
  };

  const wells: RawWell[] = [
    {
      id: "my-well",
      name: "My Own Well",
      latitude: 28.123456,
      longitude: 77.123456,
      owner_id: "user-farmer",
      admin_area_id: "village-1",
      status: "active",
      total_depth_m: 60,
      well_type: "borewell",
      latest_depth_m: 12.5,
    },
    {
      id: "neighbor-well",
      name: "Neighbor Well",
      latitude: 28.125,
      longitude: 77.125,
      owner_id: "user-neighbor",
      admin_area_id: "village-1",
      status: "active",
      total_depth_m: 80,
      latest_depth_m: 15.0,
      well_type: "borewell",
    },
  ];

  it("gives farmer exact coords for own well and jittered for neighbor", () => {
    const result = applyRolePrivacy(wells, farmerProfile, "user-farmer");
    expect(result).toHaveLength(2);

    const own = result.find((w) => w.id === "my-well")!;
    expect(own.isOwned).toBe(true);
    expect(own.isJittered).toBe(false);
    expect(own.name).toBe("My Own Well");
    expect(own.coordinates).toEqual([77.123456, 28.123456]);
    expect(own.totalDepthM).toBe(60);

    const neighbor = result.find((w) => w.id === "neighbor-well")!;
    expect(neighbor.isOwned).toBe(false);
    expect(neighbor.isJittered).toBe(true);
    expect(neighbor.name).toBe("Village Well");
    expect(neighbor.totalDepthM).toBeNull(); // Redacted
    expect(neighbor.coordinates[0]).not.toBe(77.125);
  });

  it("gives official exact coords and real names for all wells", () => {
    const officialProfile: Profile = { ...farmerProfile, role: "official" };
    const result = applyRolePrivacy(wells, officialProfile, "user-official");
    expect(result).toHaveLength(2);
    expect(result[0]!.isJittered).toBe(false);
    expect(result[1]!.isJittered).toBe(false);
    expect(result[1]!.name).toBe("Neighbor Well");
    expect(result[1]!.totalDepthM).toBe(80);
  });

  it("returns empty array of individual wells for insurer", () => {
    const insurerProfile: Profile = { ...farmerProfile, role: "insurer" };
    const result = applyRolePrivacy(wells, insurerProfile, "user-insurer");
    expect(result).toEqual([]);
  });
});
