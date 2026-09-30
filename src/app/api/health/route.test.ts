import { describe, expect, it } from "vitest";

import { GET } from "./route";

describe("GET /api/health", () => {
  it("returns ok status with the app version and an ISO timestamp", async () => {
    const response = await GET();

    expect(response.status).toBe(200);

    const body = (await response.json()) as {
      status: string;
      version: string;
      time: string;
    };

    expect(body.status).toBe("ok");
    expect(body.version).toBe("0.1.0");
    expect(Number.isNaN(Date.parse(body.time))).toBe(false);
  });

  it("sets the response content type to JSON", async () => {
    const response = await GET();
    expect(response.headers.get("content-type")).toContain("application/json");
  });
});
