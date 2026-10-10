"use server";

import { z } from "zod";
import { createServerComponentClient } from "@/server/supabase/server-component";

const FeedbackSchema = z.object({
  messageKey: z.string().min(1),
  locale: z.string().min(2),
  reportedText: z.string().min(1),
  suggestedText: z.string().optional(),
  audioUrl: z.string().optional(),
});

export async function submitTranslationFeedback(data: z.infer<typeof FeedbackSchema>) {
  const supabase = await createServerComponentClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return { success: false, error: "Unauthorized" };
  }

  const parsed = FeedbackSchema.safeParse(data);
  if (!parsed.success) {
    return { success: false, error: "Invalid data" };
  }

  const { error } = await supabase.from("translation_feedback").insert({
    user_id: user.id,
    message_key: parsed.data.messageKey,
    locale: parsed.data.locale,
    reported_text: parsed.data.reportedText,
    suggested_text: parsed.data.suggestedText || null,
    audio_url: parsed.data.audioUrl || null,
    status: "pending",
  });

  if (error) {
    console.error("Failed to submit translation feedback", error);
    return { success: false, error: error.message };
  }

  return { success: true };
}
