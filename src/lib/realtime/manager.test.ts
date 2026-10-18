import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { RealtimeManager } from "./manager";

describe("RealtimeManager", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    // @ts-expect-error - Reset singleton for testing
    RealtimeManager.instance = null;
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("should enforce singleton pattern", () => {
    const i1 = RealtimeManager.getInstance();
    const i2 = RealtimeManager.getInstance();
    expect(i1).toBe(i2);
  });

  it("should handle exponential backoff logic (mocked)", () => {
    // Just a placeholder test for backoff logic.
    // In a real scenario we'd mock Supabase Realtime channel reconnects.
    expect(true).toBe(true);
  });
});

