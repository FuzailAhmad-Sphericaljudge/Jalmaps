import { describe, it, expect } from "vitest";
import { classifyWellStatus } from "./index";
import type { Database } from "@/lib/db/types";

type Node = Database["public"]["Tables"]["nodes"]["Row"];
type Reading = Database["public"]["Tables"]["readings"]["Row"];

describe("classifyWellStatus", () => {
  it("returns empty if no node", () => {
    expect(classifyWellStatus(null, null)).toBe("empty");
  });

  it("returns fault if node status is fault", () => {
    expect(classifyWellStatus({ status: "fault" } as Node, null)).toBe("fault");
  });

  it("returns offline if node status is offline", () => {
    expect(classifyWellStatus({ status: "offline" } as Node, null)).toBe("offline");
  });

  it("returns empty if no reading", () => {
    expect(classifyWellStatus({ status: "active" } as Node, null)).toBe("empty");
  });

  it("returns stale if reading is older than 24 hours", () => {
    const now = new Date("2026-10-10T12:00:00Z").getTime();
    const reading = { recorded_at: "2026-10-09T11:00:00Z", quality: "good" };
    expect(classifyWellStatus({ status: "active" } as Node, reading as unknown as Reading, now)).toBe("stale");
  });

  it("returns fault if reading quality is bad", () => {
    const now = new Date("2026-10-10T12:00:00Z").getTime();
    const reading = { recorded_at: "2026-10-10T11:00:00Z", quality: "bad" };
    expect(classifyWellStatus({ status: "active" } as Node, reading as unknown as Reading, now)).toBe("fault");
  });

  it("returns online for recent good reading", () => {
    const now = new Date("2026-10-10T12:00:00Z").getTime();
    const reading = { recorded_at: "2026-10-10T11:00:00Z", quality: "good" };
    expect(classifyWellStatus({ status: "active" } as Node, reading as unknown as Reading, now)).toBe("online");
  });
});
