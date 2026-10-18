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

    Object.defineProperty(globalThis, "SpeechSynthesisUtterance", {
      value: class {
        text: string;
        voice = null;
        rate = 1;
        pitch = 1;
        onend = null;
        onerror = null;
        constructor(text: string) {
          this.text = text;
        }
      },
      writable: true,
    });
  });

  it("should queue utterances and play them sequentially", () => {
    service.speak("Test 1", "en-US");
    service.speak("Test 2", "en-US");

    expect(speakMock).toHaveBeenCalledTimes(1);

    // Simulate first utterance completing
    const utterance = speakMock.mock.calls[0]?.[0] as SpeechSynthesisUtterance | undefined;
    if (utterance?.onend) {
      utterance.onend(new Event("end") as unknown as SpeechSynthesisEvent);
    }

    expect(speakMock).toHaveBeenCalledTimes(2);
  });

  it("should resolve correct voices including fallbacks for Indian locales", () => {
    // Add additional mock voices
    getVoicesMock.mockReturnValue([
      { lang: "en-US", name: "English Voice" },
      { lang: "hi-IN", name: "Hindi Voice" },
      { lang: "mr-IN", name: "Marathi Voice" },
      { lang: "ta-IN", name: "Tamil Voice" },
    ]);

    // Exact match
    const hiVoice = service.discoverVoices("hi-IN");
    expect(hiVoice?.name).toBe("Hindi Voice");

    // Prefix match
    const mrVoice = service.discoverVoices("mr");
    expect(mrVoice?.name).toBe("Marathi Voice");

    // Fallback to first voice when unsupported
    const unsupported = service.discoverVoices("xyz-IN");
    expect(unsupported?.name).toBe("English Voice");
  });
});
