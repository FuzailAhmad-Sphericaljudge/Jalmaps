import "server-only";

import { createHmac } from "node:crypto";

import { getEnv } from "@/lib/env";
import { createServiceRoleClient } from "@/server/supabase/service-role";

type RateLimitResult = { status: "allowed" } | { status: "limited" } | { status: "unavailable" };

function hashIdentifier(type: "destination" | "ip", identifier: string): string {
  const { SUPABASE_SERVICE_ROLE_KEY } = getEnv();
  return createHmac("sha256", SUPABASE_SERVICE_ROLE_KEY)
    .update(`${type}:${identifier}`)
    .digest("hex");
}

export async function consumeOtpRateLimit(
  destination: { type: "phone" | "email"; value: string },
  ip: string,
): Promise<RateLimitResult> {
  const client = createServiceRoleClient();
  const { data, error } = await client.rpc("consume_otp_rate_limit", {
    p_destination_type: destination.type,
    p_destination_hash: hashIdentifier("destination", `${destination.type}:${destination.value}`),
    p_ip_hash: hashIdentifier("ip", ip),
  });

  if (error) {
    console.error("OTP rate-limit RPC failed", error.code);
    return { status: "unavailable" };
  }
  if (typeof data !== "boolean") {
    console.error("OTP rate-limit RPC returned a non-boolean result");
    return { status: "unavailable" };
  }
  return data ? { status: "allowed" } : { status: "limited" };
}
