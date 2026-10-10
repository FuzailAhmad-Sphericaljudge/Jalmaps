import { describe, it, expect, beforeEach, vi } from "vitest";
import { SpeechService } from "./service";

describe("SpeechService", () => {
  let service: SpeechService;
  let speakMock: ReturnType<typeof vi.fn>;
  let getVoicesMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    service = new SpeechService();
    speakMock = vi.fn();
    getVoicesMock = vi.fn().mockReturnValue([
      { lang: "en-US", name: "English Voice" },
      { lang: "hi-IN", name: "Hindi Voice" },
    ]);

    Object.defineProperty(window, "speechSynthesis", {
      value: {
        speak: speakMock,
        getVoices: getVoicesMock,
        cancel: vi.fn(),
        pause: vi.fn(),
        resume: vi.fn(),
      },
      writable: true,
    });
  });

  it("should queue utterances and play them sequentially", () => {
    service.speak("Test 1", "en-US");
    service.speak("Test 2", "en-US");

    expect(speakMock).toHaveBeenCalledTimes(1);

    // Simulate first utterance completing
    const utterance = speakMock.mock.calls[0][0] as SpeechSynthesisUtterance;
    utterance?.onend?.(new Event("end") as unknown as SpeechSynthesisEvent);

    expect(speakMock).toHaveBeenCalledTimes(2);
  });
});
