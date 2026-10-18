"use server";

import { isAppLocale } from "@/i18n/config";
import { requireRole } from "@/server/auth";
import { createServerComponentClient } from "@/server/supabase/server-component";
import { CsvRowSchema } from "@/lib/schemas/wells";
import { createWell } from "@/server/db/wells";

type RowResult = {
  index: number;
  status: "ok" | "error";
  name: string;
  reason?: string;
};

type ImportResult = { status: "ok"; rows: RowResult[] } | { status: "error"; message: string };

function parseCsvLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      inQuotes = !inQuotes;
    } else if (ch === "," && !inQuotes) {
      result.push(current.trim());
      current = "";
    } else {
      current += ch;
    }
  }
  result.push(current.trim());
  return result;
}

export async function importWellsAction(locale: string, csvText: string): Promise<ImportResult> {
  if (!isAppLocale(locale)) {
    return { status: "error", message: "Invalid locale" };
  }

  const current = await requireRole(locale, "village_admin", "official", "admin");

  const lines = csvText.trim().split(/\r?\n/);
  if (lines.length < 2) {
    return { status: "error", message: "CSV is empty" };
  }

  const headers = parseCsvLine(lines[0] ?? "");
  const dataLines = lines.slice(1).slice(0, 500);

  const client = await createServerComponentClient();

  // Look up admin_area_id from the actor's profile
  const adminAreaId = current.profile.admin_area_id;
  if (!adminAreaId) {
    return { status: "error", message: "Your account is not linked to an admin area." };
  }

  const results: RowResult[] = [];

  for (let i = 0; i < dataLines.length; i++) {
    const line = dataLines[i];
    if (!line || line.trim() === "") continue;

    const cols = parseCsvLine(line);
    const get = (key: string): string => cols[headers.indexOf(key)] ?? "";

    const raw = {
      name: get("name"),
      well_type: get("well_type"),
      latitude: Number(get("latitude")),
      longitude: Number(get("longitude")),
      total_depth_m: get("total_depth_m") ? Number(get("total_depth_m")) : undefined,
      notes: get("notes") || undefined,
      owner_phone: get("owner_phone") || undefined,
    };

    const parsed = CsvRowSchema.safeParse(raw);
    if (!parsed.success) {
      results.push({
        index: i + 1,
        status: "error",
        name: raw.name,
        reason: parsed.error.issues[0]?.message ?? "Validation failed",
      });
      continue;
    }

    // Resolve owner by phone if provided
    let ownerId: string = current.profile.id;
    if (parsed.data.owner_phone) {
      const { data: profiles } = await client
        .from("profiles")
        .select("id")
        .eq("phone", parsed.data.owner_phone)
        .limit(1);
      if (profiles?.[0]) {
        ownerId = profiles[0].id;
      }
    }

    try {
      await createWell(client, {
        ...parsed.data,
        admin_area_id: adminAreaId,
        owner_id: ownerId,
        status: "active",
      });
      results.push({ index: i + 1, status: "ok", name: parsed.data.name });
    } catch (err) {
      results.push({
        index: i + 1,
        status: "error",
        name: parsed.data.name,
        reason: err instanceof Error ? err.message : "Database error",
      });
    }
  }

  return { status: "ok", rows: results };
}
