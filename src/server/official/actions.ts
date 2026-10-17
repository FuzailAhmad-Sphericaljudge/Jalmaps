"use server";

import { revalidatePath } from "next/cache";
import { createServerComponentClient } from "@/server/supabase/server-component";
import { saveView, deleteSavedView, togglePinSavedView, type SaveViewInput } from "./saved-views";
import { createAreaNote, updateAreaNoteStatus, deleteAreaNote, type AreaNoteInput } from "./notes";

export async function acknowledgeAlertAction(alertId: string) {
  const supabase = await createServerComponentClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Unauthorized");
  }

  const { error } = await supabase
    .from("alerts")
    .update({
      status: "acknowledged",
      acknowledged_at: new Date().toISOString(),
      acknowledged_by: user.id,
    })
    .eq("id", alertId);

  if (error) {
    throw new Error(`Failed to acknowledge alert: ${error.message}`);
  }

  revalidatePath("/[locale]/app/official", "page");
  revalidatePath("/[locale]/app/village", "page");
  return { success: true };
}

export async function saveViewAction(input: SaveViewInput) {
  const supabase = await createServerComponentClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Unauthorized");
  }

  const saved = await saveView(supabase, user.id, input);
  revalidatePath("/[locale]/app/official", "page");
  return { success: true, view: saved };
}

export async function deleteViewAction(viewId: string) {
  const supabase = await createServerComponentClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Unauthorized");
  }

  await deleteSavedView(supabase, user.id, viewId);
  revalidatePath("/[locale]/app/official", "page");
  return { success: true };
}

export async function togglePinViewAction(viewId: string, isPinned: boolean) {
  const supabase = await createServerComponentClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Unauthorized");
  }

  await togglePinSavedView(supabase, user.id, viewId, isPinned);
  revalidatePath("/[locale]/app/official", "page");
  return { success: true };
}

export async function createNoteAction(input: AreaNoteInput) {
  const supabase = await createServerComponentClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Unauthorized");
  }

  const note = await createAreaNote(supabase, user.id, input);
  revalidatePath("/[locale]/app/official", "page");
  revalidatePath("/[locale]/app/village", "page");
  return { success: true, note };
}

export async function updateNoteStatusAction(
  noteId: string,
  status: "open" | "in_progress" | "done",
) {
  const supabase = await createServerComponentClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Unauthorized");
  }

  await updateAreaNoteStatus(supabase, noteId, status);
  revalidatePath("/[locale]/app/official", "page");
  revalidatePath("/[locale]/app/village", "page");
  return { success: true };
}

export async function deleteNoteAction(noteId: string) {
  const supabase = await createServerComponentClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Unauthorized");
  }

  await deleteAreaNote(supabase, noteId);
  revalidatePath("/[locale]/app/official", "page");
  revalidatePath("/[locale]/app/village", "page");
  return { success: true };
}
