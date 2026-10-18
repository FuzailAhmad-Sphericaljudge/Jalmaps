import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  consumeOtpRateLimit: vi.fn(),
  createRouteHandlerClient: vi.fn(),
  signInWithOtp: vi.fn(),
}));

vi.mock("@/server/supabase/otp-rate-limit", () => ({
  consumeOtpRateLimit: mocks.consumeOtpRateLimit,
}));

vi.mock("@/server/supabase/route-handler", () => ({
  createRouteHandlerClient: mocks.createRouteHandlerClient,
}));
vi.mock("@/lib/db/public-env", () => ({
  getPublicEnv: () => ({ NEXT_PUBLIC_SITE_URL: "http://127.0.0.1:3000" }),
}));

import { POST } from "./route";

function makeRequest(body: unknown, forwardedFor = "198.51.100.22", locale = "en") {
  return new Request("http://localhost/api/auth/otp", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-forwarded-for": forwardedFor,
      "x-jalmaps-locale": locale,
    },
    body: JSON.stringify(body),
  });
}

describe("POST /api/auth/otp", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.consumeOtpRateLimit.mockResolvedValue({ status: "allowed" });
    mocks.signInWithOtp.mockResolvedValue({ error: null });
    mocks.createRouteHandlerClient.mockResolvedValue({
      auth: { signInWithOtp: mocks.signInWithOtp },
    });
  });

  it("normalizes a phone, limits it, and requests an OTP without revealing account state", async () => {
    const response = await POST(makeRequest({ phone: "98765 43210" }));

    expect(response.status).toBe(202);
    expect(await response.json()).toEqual({ status: "accepted" });
    expect(mocks.consumeOtpRateLimit).toHaveBeenCalledWith(
      { type: "phone", value: "+919876543210" },
      "198.51.100.22",
    );
    expect(mocks.signInWithOtp).toHaveBeenCalledWith({
      phone: "+919876543210",
      options: { shouldCreateUser: true },
    });
  });

  it("normalizes email requests", async () => {
    const response = await POST(makeRequest({ email: "Farmer@Example.COM " }));

    expect(response.status).toBe(202);
    expect(mocks.consumeOtpRateLimit).toHaveBeenCalledWith(
      { type: "email", value: "farmer@example.com" },
      "198.51.100.22",
    );
    expect(mocks.signInWithOtp).toHaveBeenCalledWith({
      email: "farmer@example.com",
      options: {
        shouldCreateUser: true,
        emailRedirectTo: "http://127.0.0.1:3000/api/auth/callback?locale=en",
      },
    });
  });

  it("preserves a supported locale in email callback URLs", async () => {
    await POST(makeRequest({ email: "farmer@example.com" }, "198.51.100.22", "hi"));

    expect(mocks.signInWithOtp).toHaveBeenCalledWith({
      email: "farmer@example.com",
      options: {
        shouldCreateUser: true,
        emailRedirectTo: "http://127.0.0.1:3000/api/auth/callback?locale=hi",
      },
    });
  });

  it("rejects malformed input before calling either backend", async () => {
    const response = await POST(makeRequest({ phone: "invalid" }));

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ error: "invalid_request" });
    expect(mocks.consumeOtpRateLimit).not.toHaveBeenCalled();
    expect(mocks.signInWithOtp).not.toHaveBeenCalled();
  });

  it("fails closed when the proxy client address is unavailable", async () => {
    const response = await POST(makeRequest({ email: "farmer@example.com" }, "spoofed"));

    expect(response.status).toBe(503);
    expect(mocks.consumeOtpRateLimit).not.toHaveBeenCalled();
  });

  it("does not send a code when the persistent limiter denies the request", async () => {
    mocks.consumeOtpRateLimit.mockResolvedValue({ status: "limited" });

    const response = await POST(makeRequest({ email: "farmer@example.com" }));

    expect(response.status).toBe(429);
    expect(await response.json()).toEqual({ error: "rate_limited" });
    expect(mocks.signInWithOtp).not.toHaveBeenCalled();
  });

  it("returns a generic unavailable response when the limiter fails", async () => {
    mocks.consumeOtpRateLimit.mockRejectedValue(new Error("database details"));

    const response = await POST(makeRequest({ phone: "+919876543210" }));

    expect(response.status).toBe(503);
    expect(await response.json()).toEqual({ error: "unavailable" });
    expect(mocks.signInWithOtp).not.toHaveBeenCalled();
  });

  it("fails closed when the limiter reports an unavailable database", async () => {
    mocks.consumeOtpRateLimit.mockResolvedValue({ status: "unavailable" });

    const response = await POST(makeRequest({ email: "farmer@example.com" }));

    expect(response.status).toBe(503);
    expect(await response.json()).toEqual({ error: "unavailable" });
    expect(mocks.signInWithOtp).not.toHaveBeenCalled();
  });

  it("does not expose Supabase Auth errors or turn them into success", async () => {
    mocks.signInWithOtp.mockResolvedValue({ error: { message: "account-specific detail" } });

    const response = await POST(makeRequest({ email: "farmer@example.com" }));

    expect(response.status).toBe(503);
    expect(await response.json()).toEqual({ error: "unavailable" });
  });

  it("returns an explicit generic failure when Supabase Auth throws", async () => {
    mocks.signInWithOtp.mockRejectedValue(new Error("provider details"));

    const response = await POST(makeRequest({ email: "farmer@example.com" }));

    expect(response.status).toBe(503);
    expect(await response.json()).toEqual({ error: "unavailable" });
  });

  it("returns JSON for malformed request bodies", async () => {
    const request = new Request("http://localhost/api/auth/otp", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: "{",
    });

    const response = await POST(request);

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ error: "invalid_request" });
  });
});
