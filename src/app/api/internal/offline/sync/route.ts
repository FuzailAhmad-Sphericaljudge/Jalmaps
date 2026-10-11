import { NextResponse } from "next/server";
import { z } from "zod";
import { submitTranslationFeedback } from "@/server/actions/translation-feedback";

const syncSchema = z.object({
  id: z.string(),
  type: z.string(),
  payload: z.unknown(),
  createdAt: z.number(),
});

export async function POST(req: Request) {
  try {
    const json = await req.json();
    const action = syncSchema.parse(json);

    switch (action.type) {
      case "translation_feedback":
        await submitTranslationFeedback(
          action.payload as Parameters<typeof submitTranslationFeedback>[0],
        );
        break;
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Sync error:", err);
    return NextResponse.json({ success: false }, { status: 400 });
  }
}
