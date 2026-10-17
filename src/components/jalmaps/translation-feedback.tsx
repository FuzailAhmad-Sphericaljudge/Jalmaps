"use client";

import { useState, useTransition } from "react";
import { useTranslations, useLocale } from "next-intl";
import { MessageSquarePlus, X, Loader2, Mic } from "lucide-react";

import { submitTranslationFeedback } from "@/server/actions/translation-feedback";

interface TranslationFeedbackProps {
  sentences: { key: string; text: string }[];
}

export function TranslationFeedback({ sentences }: TranslationFeedbackProps) {
  const t = useTranslations("feedback");
  const locale = useLocale();
  const [isOpen, setIsOpen] = useState(false);
  const [selectedKey, setSelectedKey] = useState<string>(sentences[0]?.key || "");
  const [suggestedText, setSuggestedText] = useState("");
  const [isPending, startTransition] = useTransition();
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="mt-2 flex w-full items-center justify-center gap-1 text-xs text-muted-foreground hover:text-primary"
        aria-label={t("improve_translation")}
      >
        <MessageSquarePlus className="h-3 w-3" />
        <span>{t("improve_translation")}</span>
      </button>
    );
  }

  const selectedSentence = sentences.find((s) => s.key === selectedKey);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!selectedSentence) return;
    startTransition(async () => {
      const result = await submitTranslationFeedback({
        messageKey: selectedSentence.key,
        locale,
        reportedText: selectedSentence.text,
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

          <select
            value={selectedKey}
            onChange={(e) => setSelectedKey(e.target.value)}
            className="mb-1 w-full rounded border border-input bg-background p-2 text-xs"
          >
            {sentences.map((s) => (
              <option key={s.key} value={s.key}>
                {s.text}
              </option>
            ))}
          </select>

          <div className="relative">
            <textarea
              value={suggestedText}
              onChange={(e) => setSuggestedText(e.target.value)}
              placeholder={t("suggestion_placeholder")}
              className="min-h-[60px] w-full rounded border border-input bg-background p-2 pr-10 text-sm"
            />
            <button
              type="button"
              onClick={() => {
                if ("webkitSpeechRecognition" in window) {
                  // @ts-expect-error - SpeechRecognition is not fully typed
                  const recognition = new window.webkitSpeechRecognition();
                  recognition.lang = locale;
                  // @ts-expect-error - Event type is missing
                  recognition.onresult = (event) => {
                    setSuggestedText((prev) => prev + " " + event.results[0][0].transcript);
                  };
                  recognition.start();
                } else {
                  alert("Speech recognition not supported in this browser.");
                }
              }}
              className="absolute top-2 right-2 text-muted-foreground hover:text-primary"
              title="Dictate"
            >
              <Mic className="h-4 w-4" />
            </button>
          </div>

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
