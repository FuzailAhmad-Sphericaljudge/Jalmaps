"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Play, Square, Pause } from "lucide-react";
import { SpeechService } from "@/lib/speech/service";

interface ReadAloudProps {
  text: string;
  locale: string;
  ariaLabel?: string;
}

export function ReadAloud({ text, locale, ariaLabel = "Read aloud" }: ReadAloudProps) {
  const [status, setStatus] = useState<"idle" | "speaking" | "paused">("idle");
  const serviceRef = useRef<SpeechService | null>(null);

  useEffect(() => {
    serviceRef.current = new SpeechService();
    serviceRef.current.onStateChange = (newState) => {
      setStatus(newState);
    };
    return () => {
      serviceRef.current?.stop();
    };
  }, []);

  const handleToggle = () => {
    if (!serviceRef.current) return;

    if (status === "idle") {
      serviceRef.current.speak(text, locale);
    } else if (status === "speaking") {
      serviceRef.current.pause();
    } else if (status === "paused") {
      serviceRef.current.resume();
    }
  };

  const handleStop = () => {
    if (!serviceRef.current) return;
    serviceRef.current.stop();
  };

  return (
    <div className="flex items-center gap-2 rounded-lg border bg-background p-3 shadow-sm">
      <Button
        variant="outline"
        size="icon"
        className="h-12 w-12 rounded-full"
        onClick={handleToggle}
        aria-label={status === "idle" ? ariaLabel : status === "speaking" ? "Pause" : "Resume"}
      >
        {status === "idle" ? (
          <Play className="h-6 w-6" />
        ) : status === "speaking" ? (
          <Pause className="h-6 w-6" />
        ) : (
          <Play className="h-6 w-6" />
        )}
      </Button>

      {status !== "idle" && (
        <Button
          variant="ghost"
          size="icon"
          className="h-12 w-12 rounded-full text-muted-foreground"
          onClick={handleStop}
          aria-label="Stop reading"
        >
          <Square className="h-6 w-6" />
        </Button>
      )}

      {status === "speaking" && (
        <div aria-hidden="true" className="ml-2 flex h-6 items-center gap-1">
          {/* Simple CSS waveform animation */}
          <div className="h-full w-1.5 animate-pulse rounded-full bg-primary [animation-delay:0ms]"></div>
          <div className="h-3/4 w-1.5 animate-pulse rounded-full bg-primary [animation-delay:150ms]"></div>
          <div className="h-full w-1.5 animate-pulse rounded-full bg-primary [animation-delay:300ms]"></div>
          <div className="h-1/2 w-1.5 animate-pulse rounded-full bg-primary [animation-delay:450ms]"></div>
        </div>
      )}

      <div aria-live="polite" className="sr-only">
        {status === "speaking" ? "Now reading aloud" : ""}
      </div>
    </div>
  );
}
