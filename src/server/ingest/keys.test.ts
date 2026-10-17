import { describe, expect, it } from "vitest";
import { hashKey } from "./keys";

describe("Node API Keys", () => {
  it("hashes deterministically", () => {
    const secret = "test-secret";
    const h1 = hashKey(secret);
    const h2 = hashKey(secret);
    expect(h1).toBe(h2);
    expect(h1).toHaveLength(64); // hex encoded sha256
  });

  it("produces different hashes for different secrets", () => {
    const h1 = hashKey("secret-1");
    const h2 = hashKey("secret-2");
    expect(h1).not.toBe(h2);
  });
});
