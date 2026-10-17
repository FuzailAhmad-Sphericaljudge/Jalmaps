import { describe, expect, it } from "vitest";

import { emailSchema, indianPhoneSchema } from "./auth";

describe("authentication schemas", () => {
  it("normalizes a valid Indian phone number to E.164", () => {
    expect(indianPhoneSchema.parse(" 98765 43210 ")).toBe("+919876543210");
  });

  it("rejects invalid phone numbers", () => {
    expect(indianPhoneSchema.safeParse("123").success).toBe(false);
  });

  it("normalizes valid email addresses", () => {
    expect(emailSchema.parse(" Farmer.One@Example.COM ")).toBe("farmer.one@example.com");
  });

  it("rejects invalid email addresses", () => {
    expect(emailSchema.safeParse("not-an-email").success).toBe(false);
  });
});
