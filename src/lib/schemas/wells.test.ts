import { describe, it, expect } from "vitest";
import { wellCreateSchema, NodeSettingsSchema, CsvRowSchema } from "./wells";
import { randomUUID } from "crypto";

describe("Well schemas", () => {
  it("validates a correct CreateWell input", () => {
    const valid = {
      name: "Test Well",
      well_type: "borewell",
      latitude: 12.34,
      longitude: 56.78,
      admin_area_id: randomUUID(),
    };
    expect(wellCreateSchema.safeParse(valid).success).toBe(true);
  });

  it("validates a correct NodeSettings input", () => {
    const valid = {
      hardware_id: "JM-001",
      range_m: 10,
      hang_depth_m: 5,
    };
    expect(NodeSettingsSchema.safeParse(valid).success).toBe(true);
  });

  it("validates a correct CsvRow input", () => {
    const valid = {
      name: "Bulk Well",
      well_type: "open_well",
      latitude: 10.0,
      longitude: 20.0,
    };
    expect(CsvRowSchema.safeParse(valid).success).toBe(true);
  });
});
