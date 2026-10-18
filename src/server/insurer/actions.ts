"use server";

import { getCurrentUser } from "@/server/auth";
import { createServerComponentClient } from "@/server/supabase/server-component";
import {
  generateInsurerKey,
  revokeInsurerKey,
  rotateInsurerKey,
  listInsurerKeys,
  type InsurerScope,
} from "./keys";
import { getDailyUsageRollup } from "./metering";

export async function createKeyAction(params: {
  name: string;
  scopes?: InsurerScope[];
  isSandbox?: boolean;
  expiresInDays?: number;
}) {
  const current = await getCurrentUser();
  if (!current?.user) {
    throw new Error("Unauthorized");
  }
  const client = await createServerComponentClient();

  const key = await generateInsurerKey(client, {
    userId: current.user.id,
    name: params.name,
    scopes: params.scopes,
    isSandbox: params.isSandbox,
    expiresInDays: params.expiresInDays,
  });

  return { success: true, key };
}

export async function revokeKeyAction(keyId: string) {
  const current = await getCurrentUser();
  if (!current?.user) {
    throw new Error("Unauthorized");
  }
  const client = await createServerComponentClient();

  const ok = await revokeInsurerKey(client, keyId, current.user.id);
  return { success: ok };
}

export async function rotateKeyAction(keyId: string) {
  const current = await getCurrentUser();
  if (!current?.user) {
    throw new Error("Unauthorized");
  }
  const client = await createServerComponentClient();

  const newKey = await rotateInsurerKey(client, keyId, current.user.id);
  return { success: true, key: newKey };
}

export async function listKeysAction() {
  const current = await getCurrentUser();
  if (!current?.user) {
    throw new Error("Unauthorized");
  }
  const client = await createServerComponentClient();

  const keys = await listInsurerKeys(client, current.user.id);
  return { success: true, keys };
}

export async function getKeyUsageAction(keyId: string, days = 30) {
  const current = await getCurrentUser();
  if (!current?.user) {
    throw new Error("Unauthorized");
  }
  const client = await createServerComponentClient();

  const usage = await getDailyUsageRollup(client, keyId, days);
  return { success: true, usage };
}
