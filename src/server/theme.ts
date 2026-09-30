import { z } from "zod";

/** Theme preference stored in a cookie; readable on the server for no-flash SSR. */
export const THEME_COOKIE_NAME = "jalmaps-theme";

export const themeSchema = z.enum(["light", "dark"]);
export type Theme = z.infer<typeof themeSchema>;

export const themeCookieSchema = z.object({ theme: themeSchema }).catch({ theme: "light" });

export function parseThemeCookieValue(value: string | undefined): Theme {
  let raw: unknown;
  try {
    raw = value ? JSON.parse(value) : undefined;
  } catch {
    return "light";
  }
  const parsed = themeCookieSchema.safeParse(raw);
  return parsed.success ? parsed.data.theme : "light";
}

/** Serialise the cookie value; safe for `cookies().set()`. */
export function serializeThemeCookieValue(theme: Theme): string {
  return JSON.stringify({ theme });
}
