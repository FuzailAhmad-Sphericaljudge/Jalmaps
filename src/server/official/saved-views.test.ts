import { describe, expect, it } from "vitest";
import { saveViewInputSchema, savedViewFilterSchema } from "./saved-views";
import { areaNoteInputSchema } from "./notes";

describe("savedViewFilterSchema", () => {
  it("validates valid filter inputs", () => {
    const valid = savedViewFilterSchema.parse({
      areaId: "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11",
      preset: "30d",
      metric: "critical",
      severityFilter: "critical",
    });
    expect(valid.preset).toBe("30d");
    expect(valid.metric).toBe("critical");
  });

  it("handles empty filters", () => {
    const valid = savedViewFilterSchema.parse({});
    expect(valid.preset).toBeUndefined();
  });
});

describe("saveViewInputSchema", () => {
  it("validates view input", () => {
    const valid = saveViewInputSchema.parse({
      name: "Drought Monitoring - Haveli",
      filters: { preset: "7d" },
      is_pinned: true,
    });
    expect(valid.name).toBe("Drought Monitoring - Haveli");
    expect(valid.is_pinned).toBe(true);
    expect(valid.is_default).toBe(false);
  });

  it("rejects empty name", () => {
    expect(() =>
      saveViewInputSchema.parse({
        name: "",
        filters: {},
      }),
    ).toThrow();
  });
});

describe("areaNoteInputSchema", () => {
  it("validates area note creation", () => {
    const valid = areaNoteInputSchema.parse({
      area_id: "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11",
      text: "Investigate sensor 3 telemetry outage with field technician",
      status: "open",
    });
    expect(valid.status).toBe("open");
    expect(valid.text).toContain("Investigate");
  });

  it("rejects empty text", () => {
    expect(() =>
      areaNoteInputSchema.parse({
        area_id: "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11",
        text: "",
      }),
    ).toThrow();
  });
});
