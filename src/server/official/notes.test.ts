import { describe, expect, it } from "vitest";
import { areaNoteInputSchema } from "./notes";

describe("areaNoteInputSchema", () => {
  it("accepts valid open note", () => {
    const input = {
      area_id: "e44d5c90-955a-4b95-a7b6-96a9e15ad533",
      text: "Field visit scheduled with sarpanch",
      status: "open" as const,
      due_date: "2026-10-25",
    };
    const parsed = areaNoteInputSchema.parse(input);
    expect(parsed.status).toBe("open");
    expect(parsed.due_date).toBe("2026-10-25");
  });

  it("defaults status to open if omitted", () => {
    const input = {
      area_id: "e44d5c90-955a-4b95-a7b6-96a9e15ad533",
      text: "Check pump sensor battery",
    };
    const parsed = areaNoteInputSchema.parse(input);
    expect(parsed.status).toBe("open");
  });

  it("accepts valid status transitions", () => {
    for (const status of ["open", "in_progress", "done"] as const) {
      const parsed = areaNoteInputSchema.parse({
        area_id: "e44d5c90-955a-4b95-a7b6-96a9e15ad533",
        text: "Status change test",
        status,
      });
      expect(parsed.status).toBe(status);
    }
  });

  it("rejects invalid status", () => {
    expect(() =>
      areaNoteInputSchema.parse({
        area_id: "e44d5c90-955a-4b95-a7b6-96a9e15ad533",
        text: "Invalid status test",
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        status: "invalid" as any,
      }),
    ).toThrow();
  });

  it("rejects invalid area_id format", () => {
    expect(() =>
      areaNoteInputSchema.parse({
        area_id: "not-a-uuid",
        text: "Note with bad area id",
      }),
    ).toThrow("Invalid area ID");
  });

  it("rejects excessively long note (> 2000 chars)", () => {
    const longText = "a".repeat(2001);
    expect(() =>
      areaNoteInputSchema.parse({
        area_id: "e44d5c90-955a-4b95-a7b6-96a9e15ad533",
        text: longText,
      }),
    ).toThrow("Note is too long");
  });
});
