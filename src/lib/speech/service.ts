export interface SpeechConfig { rate: number; pitch: number; }

export class SpeechService {
  private queue: string[] = [];

  constructor() {}

  public discoverVoices(locale: string): SpeechSynthesisVoice | null {
    if (typeof window === "undefined" || !window.speechSynthesis) return null;
    const voices = window.speechSynthesis.getVoices();
    return (
      voices.find((v) => v.lang === locale) ||
      voices.find((v) => v.lang.startsWith(locale.split("-")[0])) ||
      voices[0] ||
      null
    );
  }
}
