import { describe, expect, it } from "vitest";

import { getTrustedClientIp, normalizeOtpRequest } from "./otp-request";

describe("normalizeOtpRequest", () => {
  it("normalizes Indian phone numbers to E.164", () => {
    expect(normalizeOtpRequest({ phone: " 98765 43210 " })).toEqual({
      phone: "+919876543210",
    });
  });

  it("trims and lowercases valid email addresses", () => {
    expect(normalizeOtpRequest({ email: " Farmer.One@Example.COM " })).toEqual({
      email: "farmer.one@example.com",
    });
  });

  it.each([
    null,
    {},
    { phone: "+919876543210", email: "farmer@example.com" },
    { phone: "123" },
    { email: "not-an-email" },
    { phone: "+919876543210", extra: true },
  ])("rejects invalid OTP destinations: %j", (input) => {
    expect(normalizeOtpRequest(input)).toBeNull();
  });
});

describe("getTrustedClientIp", () => {
  it("accepts the single client address supplied by the trusted proxy", () => {
    expect(getTrustedClientIp(new Headers({ "x-forwarded-for": "203.0.113.7" }))).toBe(
      "203.0.113.7",
    );
  });

  it("canonicalizes IPv6 addresses", () => {
    expect(getTrustedClientIp(new Headers({ "x-forwarded-for": "2001:0db8:0:0:0:0:0:1" }))).toBe(
      "2001:db8::1",
    );
  });

  it("rejects missing, invalid, and oversized proxy headers", () => {
    expect(getTrustedClientIp(new Headers())).toBeNull();
    expect(getTrustedClientIp(new Headers({ "x-forwarded-for": "not-an-ip" }))).toBeNull();
    expect(
      getTrustedClientIp(new Headers({ "x-forwarded-for": "198.51.100.99, 203.0.113.7" })),
    ).toBeNull();
    expect(getTrustedClientIp(new Headers({ "x-forwarded-for": "1".repeat(1000) }))).toBeNull();
  });
});
