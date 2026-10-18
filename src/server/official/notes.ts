import type { SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";

export const areaNoteInputSchema = z.object({
  id: z.string().uuid().optional(),
  area_id: z.string().uuid("Invalid area ID"),
  text: z.string().min(1, "Note content cannot be empty").max(2000, "Note is too long"),
  status: z.enum(["open", "in_progress", "done"]).default("open"),
  due_date: z.string().nullable().optional(),
});

export type AreaNoteInput = z.infer<typeof areaNoteInputSchema>;

export interface AreaNoteRecord {
  id: string;
  area_id: string;
  author_id: string;
  author_name?: string;
  text: string;
  status: "open" | "in_progress" | "done";
  due_date: string | null;
  created_at: string;
  updated_at: string;
}

export async function listAreaNotes(
  supabase: SupabaseClient,
  areaId?: string,
): Promise<AreaNoteRecord[]> {
  let query = supabase
    .from("area_notes")
    .select("id, area_id, author_id, text, status, due_date, created_at, updated_at")
    .order("created_at", { ascending: false });

  if (areaId) {
    query = query.eq("area_id", areaId);
  }

  const { data, error } = await query;
  if (error) {
    throw new Error(`Failed to list area notes: ${error.message}`);
  }

  return (data || []) as AreaNoteRecord[];
}

export async function createAreaNote(
  supabase: SupabaseClient,
  authorId: string,
  input: AreaNoteInput,
): Promise<AreaNoteRecord> {
  const validated = areaNoteInputSchema.parse(input);

  const { data, error } = await supabase
    .from("area_notes")
    .insert({
      area_id: validated.area_id,
      author_id: authorId,
      text: validated.text,
      status: validated.status,
      due_date: validated.due_date || null,
    })
    .select()
    .single();

  if (error || !data) {
    throw new Error(`Failed to create area note: ${error?.message}`);
  }

  return data as AreaNoteRecord;
}

export async function updateAreaNoteStatus(
  supabase: SupabaseClient,
  noteId: string,
  status: "open" | "in_progress" | "done",
): Promise<void> {
  const { error } = await supabase
    .from("area_notes")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", noteId);

  if (error) {
    throw new Error(`Failed to update note status: ${error.message}`);
  }
}

export async function deleteAreaNote(supabase: SupabaseClient, noteId: string): Promise<void> {
  const { error } = await supabase.from("area_notes").delete().eq("id", noteId);

  if (error) {
    throw new Error(`Failed to delete area note: ${error.message}`);
  }
}
