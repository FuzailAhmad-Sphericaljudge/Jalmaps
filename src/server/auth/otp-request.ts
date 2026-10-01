import { isIP } from "node:net";
import { z } from "zod";

import { emailSchema, indianPhoneSchema } from "@/lib/schemas/auth";

const otpRequestSchema = z.union([
  z.object({ phone: z.string().trim().min(1).max(64) }).strict(),
  z.object({ email: z.string().trim().min(1).max(254) }).strict(),
]);

export type OtpDestination = { phone: string } | { email: string };

export function normalizeOtpRequest(input: unknown): OtpDestination | null {
  const parsed = otpRequestSchema.safeParse(input);
  if (!parsed.success) return null;

  if ("phone" in parsed.data) {
    const phone = indianPhoneSchema.safeParse(parsed.data.phone);
    return phone.success ? { phone: phone.data } : null;
  }

  const email = emailSchema.safeParse(parsed.data.email);
  return email.success ? { email: email.data } : null;
}

/**
 * Vercel overwrites X-Forwarded-For with the connecting client's IP. Accept
 * exactly one address so an untrusted forwarded chain can never pick the bucket.
 */
export function getTrustedClientIp(headers: Headers): string | null {
  const forwardedFor = headers.get("x-forwarded-for");
  if (!forwardedFor) return null;

  const candidate = forwardedFor.trim();
  if (!candidate || candidate.includes(",")) return null;

  const version = isIP(candidate);
  if (version === 4) return candidate;
  if (version !== 6) return null;

  return new URL(`http://[${candidate}]/`).hostname.slice(1, -1);
}
