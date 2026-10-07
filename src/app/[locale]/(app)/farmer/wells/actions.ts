"use server";

import { isAppLocale } from "@/i18n/config";
import { wellCreateSchema, WellMemberSchema, NodeSettingsSchema } from "@/lib/schemas/wells";
import { requireRole } from "@/server/auth";
import {
  createWell,
  updateWell,
  createNode,
  updateNodeSettings,
  retireNode as dbRetireNode,
  addWellMember,
} from "@/server/db/wells";
import { issueNodeKey, revokeNodeKey } from "@/server/ingest/keys";
import { createServerComponentClient } from "@/server/supabase/server-component";

// ─── Result types ───────────────────────────────────────────────────────────

export type CreateWellResult =
  | { status: "ok"; wellId: string }
  | { status: "invalid"; message: string }
  | { status: "error"; message: string };

export type RegisterNodeResult =
  | { status: "ok"; nodeId: string; keyString: string }
  | { status: "invalid"; message: string }
  | { status: "error"; message: string };

export type RotateKeyResult =
  { status: "ok"; keyString: string } | { status: "error"; message: string };

export type AddMemberResult =
  { status: "ok" } | { status: "not_found" } | { status: "error"; message: string };

// ─── Well CRUD ───────────────────────────────────────────────────────────────

export async function createWellAction(locale: string, input: unknown): Promise<CreateWellResult> {
  if (!isAppLocale(locale)) return { status: "invalid", message: "Invalid locale" };
  const current = await requireRole(locale, "farmer", "village_admin", "official", "admin");

  const parsed = wellCreateSchema.safeParse(input);
  if (!parsed.success) {
    return { status: "invalid", message: parsed.error.issues[0]?.message ?? "Validation failed" };
  }

  try {
    const client = await createServerComponentClient();
    const well = await createWell(client, { ...parsed.data, owner_id: current.profile.id });
    return { status: "ok", wellId: well.id };
  } catch (err) {
    console.error("createWellAction failed", err);
    return { status: "error", message: "Could not save the well. Please try again." };
  }
}

export async function updateWellAction(
  locale: string,
  wellId: string,
  input: unknown,
): Promise<{ status: "ok" } | { status: "invalid"; message: string } | { status: "error" }> {
  if (!isAppLocale(locale)) return { status: "invalid", message: "Invalid locale" };
  await requireRole(locale, "farmer", "village_admin", "official", "admin");

  const parsed = wellCreateSchema.partial().safeParse(input);
  if (!parsed.success) {
    return { status: "invalid", message: parsed.error.issues[0]?.message ?? "Validation failed" };
  }

  try {
    const client = await createServerComponentClient();
    await updateWell(client, wellId, parsed.data);
    return { status: "ok" };
  } catch {
    return { status: "error" };
  }
}

export async function markWellDryAction(
  locale: string,
  wellId: string,
): Promise<{ status: "ok" } | { status: "error" }> {
  if (!isAppLocale(locale)) return { status: "error" };
  await requireRole(locale, "farmer", "village_admin", "admin");
  try {
    const client = await createServerComponentClient();
    await updateWell(client, wellId, { status: "dry" });
    return { status: "ok" };
  } catch {
    return { status: "error" };
  }
}

// ─── Node registration ───────────────────────────────────────────────────────

export async function registerNodeAction(
  locale: string,
  wellId: string,
  input: unknown,
): Promise<RegisterNodeResult> {
  if (!isAppLocale(locale)) return { status: "invalid", message: "Invalid locale" };
  await requireRole(locale, "farmer", "admin");

  const parsed = NodeSettingsSchema.safeParse(input);
  if (!parsed.success) {
    return { status: "invalid", message: parsed.error.issues[0]?.message ?? "Validation failed" };
  }

  try {
    const client = await createServerComponentClient();
    const node = await createNode(client, wellId, parsed.data.hardware_id, parsed.data);
    // Issue key — plaintext key returned once, NEVER stored
    const { keyString } = await issueNodeKey(client, wellId, parsed.data.hardware_id);
    return { status: "ok", nodeId: node.id, keyString };
  } catch (err) {
    console.error("registerNodeAction failed", err);
    return { status: "error", message: "Could not register the sensor. Please try again." };
  }
}

export async function rotateKeyAction(
  locale: string,
  nodeId: string,
  hardwareId: string,
  _actorId: string,
): Promise<RotateKeyResult> {
  if (!isAppLocale(locale)) return { status: "error", message: "Invalid locale" };
  const current = await requireRole(locale, "farmer", "admin");

  try {
    const client = await createServerComponentClient();
    // Revoke old key, issue new — new key returned once, NEVER stored
    await revokeNodeKey(client, hardwareId);
    const { keyString } = await issueNodeKey(client, nodeId, hardwareId);
    await updateNodeSettings(client, nodeId, {}, current.profile.id);
    return { status: "ok", keyString };
  } catch {
    return { status: "error", message: "Could not rotate the key. Please try again." };
  }
}

export async function retireNodeAction(
  locale: string,
  nodeId: string,
  actorId: string,
): Promise<{ status: "ok" } | { status: "error" }> {
  if (!isAppLocale(locale)) return { status: "error" };
  await requireRole(locale, "farmer", "admin");
  try {
    const client = await createServerComponentClient();
    await dbRetireNode(client, nodeId, actorId);
    return { status: "ok" };
  } catch {
    return { status: "error" };
  }
}

export async function updateNodeSettingsAction(
  locale: string,
  nodeId: string,
  input: unknown,
  actorId: string,
): Promise<{ status: "ok" } | { status: "invalid"; message: string } | { status: "error" }> {
  if (!isAppLocale(locale)) return { status: "invalid", message: "Invalid locale" };
  await requireRole(locale, "farmer", "admin");

  const parsed = NodeSettingsSchema.omit({ hardware_id: true }).partial().safeParse(input);
  if (!parsed.success) {
    return { status: "invalid", message: parsed.error.issues[0]?.message ?? "Validation failed" };
  }

  try {
    const client = await createServerComponentClient();
    await updateNodeSettings(client, nodeId, parsed.data, actorId);
    return { status: "ok" };
  } catch {
    return { status: "error" };
  }
}

// ─── Well sharing ────────────────────────────────────────────────────────────

export async function addWellMemberAction(
  locale: string,
  wellId: string,
  input: unknown,
): Promise<AddMemberResult> {
  if (!isAppLocale(locale)) return { status: "error", message: "Invalid locale" };
  await requireRole(locale, "farmer", "admin");

  const parsed = WellMemberSchema.safeParse(input);
  if (!parsed.success) {
    return { status: "error", message: parsed.error.issues[0]?.message ?? "Validation failed" };
  }

  try {
    const client = await createServerComponentClient();
    await addWellMember(client, wellId, parsed.data.phone, parsed.data.role);
    return { status: "ok" };
  } catch (err) {
    if (err instanceof Error && err.message === "NOT_FOUND") {
      return { status: "not_found" };
    }
    return { status: "error", message: "Could not add member. Please try again." };
  }
}
