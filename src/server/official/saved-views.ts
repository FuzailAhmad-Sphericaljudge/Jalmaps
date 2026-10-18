import type { SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";

export const savedViewFilterSchema = z.object({
  areaId: z.string().uuid().optional(),
  preset: z.enum(["7d", "30d", "90d", "1y"]).optional(),
  metric: z.enum(["critical", "depth", "offline", "stress"]).optional(),
  severityFilter: z.enum(["all", "critical", "warning", "watch"]).optional(),
});

export type SavedViewFilter = z.infer<typeof savedViewFilterSchema>;

export const saveViewInputSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().min(1, "Name is required").max(100, "Name is too long"),
  filters: savedViewFilterSchema,
  is_default: z.boolean().optional().default(false),
  is_pinned: z.boolean().optional().default(false),
});

export type SaveViewInput = z.infer<typeof saveViewInputSchema>;

export interface SavedViewRecord {
  id: string;
  user_id: string;
  name: string;
  filters: SavedViewFilter;
  is_default: boolean;
  is_pinned: boolean;
  created_at: string;
  updated_at: string;
}

export async function listSavedViews(supabase: SupabaseClient): Promise<SavedViewRecord[]> {
  const { data, error } = await supabase
    .from("saved_views")
    .select("id, user_id, name, filters, is_default, is_pinned, created_at, updated_at")
    .order("is_pinned", { ascending: false })
    .order("name", { ascending: true });

  if (error) {
    throw new Error(`Failed to list saved views: ${error.message}`);
  }

  return (data || []).map((row) => ({
    ...row,
    filters: row.filters as SavedViewFilter,
  }));
}

export async function saveView(
  supabase: SupabaseClient,
  userId: string,
  input: SaveViewInput,
): Promise<SavedViewRecord> {
  const validated = saveViewInputSchema.parse(input);

  // If this view is set as default, unset other defaults for the user
  if (validated.is_default) {
    await supabase.from("saved_views").update({ is_default: false }).eq("user_id", userId);
  }

  if (validated.id) {
    const { data, error } = await supabase
      .from("saved_views")
      .update({
        name: validated.name,
        filters: validated.filters,
        is_default: validated.is_default,
        is_pinned: validated.is_pinned,
        updated_at: new Date().toISOString(),
      })
      .eq("id", validated.id)
      .eq("user_id", userId)
      .select()
      .single();

    if (error || !data) {
      throw new Error(`Failed to update saved view: ${error?.message}`);
    }
    return {
      ...data,
      filters: data.filters as SavedViewFilter,
    };
  }

  const { data, error } = await supabase
    .from("saved_views")
    .insert({
      user_id: userId,
      name: validated.name,
      filters: validated.filters,
      is_default: validated.is_default,
      is_pinned: validated.is_pinned,
    })
    .select()
    .single();

  if (error || !data) {
    throw new Error(`Failed to create saved view: ${error?.message}`);
  }

  return {
    ...data,
    filters: data.filters as SavedViewFilter,
  };
}

export async function deleteSavedView(
  supabase: SupabaseClient,
  userId: string,
  viewId: string,
): Promise<boolean> {
  const { error } = await supabase
    .from("saved_views")
    .delete()
    .eq("id", viewId)
    .eq("user_id", userId);

  if (error) {
    throw new Error(`Failed to delete saved view: ${error.message}`);
  }
  return true;
}

export async function togglePinSavedView(
  supabase: SupabaseClient,
  userId: string,
  viewId: string,
  isPinned: boolean,
): Promise<void> {
  const { error } = await supabase
    .from("saved_views")
    .update({ is_pinned: isPinned, updated_at: new Date().toISOString() })
    .eq("id", viewId)
    .eq("user_id", userId);

  if (error) {
    throw new Error(`Failed to update saved view pinned status: ${error.message}`);
  }
}
