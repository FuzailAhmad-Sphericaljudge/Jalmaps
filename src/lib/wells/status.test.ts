import { describe, it, expect } from "vitest";
import { getNodeConnectionState } from "./status";

describe("getNodeConnectionState", () => {
  it("returns never_reported if last_seen_at is null", () => {
    expect(
      getNodeConnectionState({ last_seen_at: null, status: "provisioning", range_m: 10 }),
    ).toBe("never_reported");
  });

  it("returns online if last_seen_at is within 1 hour", () => {
    const now = new Date("2026-10-09T10:00:00Z");
    const lastSeen = new Date("2026-10-09T09:30:00Z"); // 30 mins ago
    expect(
      getNodeConnectionState(
        { last_seen_at: lastSeen.toISOString(), status: "active", range_m: 10 },
        now,
      ),
    ).toBe("online");
  });

  it("returns offline if last_seen_at is older than 1 hour", () => {
    const now = new Date("2026-10-09T10:00:00Z");
    const lastSeen = new Date("2026-10-09T08:59:00Z"); // 61 mins ago
    expect(
      getNodeConnectionState(
        { last_seen_at: lastSeen.toISOString(), status: "active", range_m: 10 },
        now,
      ),
    ).toBe("offline");
  });
});
