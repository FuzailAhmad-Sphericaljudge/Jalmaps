import { parsePhoneNumberFromString } from "libphonenumber-js";
import { z } from "zod";

export const indianPhoneSchema = z
  .string()
  .trim()
  .min(1)
  .max(64)
  .transform((value, context) => {
    const parsed = parsePhoneNumberFromString(value, "IN");
    if (!parsed?.isValid()) {
      context.addIssue({ code: "custom", message: "invalid_phone" });
      return z.NEVER;
    }
    return parsed.number;
  });

export const emailSchema = z.string().trim().toLowerCase().pipe(z.email().max(254));

export const otpCodeSchema = z.string().regex(/^\d{6}$/);
