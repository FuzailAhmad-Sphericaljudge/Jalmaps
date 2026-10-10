"use client";

import { useState, useTransition } from "react";
import { useTranslations, useLocale } from "next-intl";
import { MessageSquarePlus, X, Loader2 } from "lucide-react";

import { submitTranslationFeedback } from "@/server/actions/translation-feedback";

interface TranslationFeedbackProps {
  messageKey: string;
  reportedText: string;
}

export function TranslationFeedback({ messageKey, reportedText }: TranslationFeedbackProps) {
  const t = useTranslations("feedback");
  const locale = useLocale();
  const [isOpen, setIsOpen] = useState(false);
  const [suggestedText, setSuggestedText] = useState("");
  const [isPending, startTransition] = useTransition();
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="mt-2 flex items-center gap-1 text-xs text-muted-foreground hover:text-primary"
        aria-label={t("improve_translation")}
      >
        <MessageSquarePlus className="h-3 w-3" />
        <span>{t("improve_translation")}</span>
      </button>
    );
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = await submitTranslationFeedback({
        messageKey,
        locale,
        reportedText,
        suggestedText: suggestedText.trim(),
      });
      if (result.success) {
        setIsSuccess(true);
        setTimeout(() => setIsOpen(false), 2000);
      } else {
        setError(result.error || t("error_submitting"));
      }
    });
  };

  return (
    <div className="relative mt-2 rounded-md bg-muted p-3 text-sm">
      <button
        onClick={() => setIsOpen(false)}
        className="absolute top-2 right-2 text-muted-foreground hover:text-foreground"
        aria-label={t("close")}
      >
        <X className="h-4 w-4" />
      </button>

      {isSuccess ? (
        <div className="py-2 font-medium text-green-600">{t("thank_you")}</div>
      ) : (
        <form onSubmit={handleSubmit} className="flex flex-col gap-2 pt-2">
          <p className="font-medium text-foreground">{t("improve_translation")}</p>
          <div className="mb-1 text-xs text-muted-foreground">
            {t("reported_text_label", { text: reportedText })}
          </div>

          <textarea
            value={suggestedText}
            onChange={(e) => setSuggestedText(e.target.value)}
            placeholder={t("suggestion_placeholder")}
            className="min-h-[60px] w-full rounded border border-input bg-background p-2 text-sm"
          />

          {error && <div className="text-xs text-destructive">{error}</div>}

          <button
            type="submit"
            disabled={isPending}
            className="flex items-center gap-1 self-end rounded bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90"
          >
            {isPending && <Loader2 className="h-3 w-3 animate-spin" />}
            {t("submit")}
          </button>
        </form>
      )}
    </div>
  );
}
