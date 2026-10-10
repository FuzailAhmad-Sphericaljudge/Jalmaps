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

  public speak(text: string, locale: string, config?: SpeechConfig) {
    if (typeof window === "undefined" || !window.speechSynthesis) return;
    const utterance = new SpeechSynthesisUtterance(text);
    const voice = this.discoverVoices(locale);
    if (voice) utterance.voice = voice;
    if (config) {
      utterance.rate = config.rate;
      utterance.pitch = config.pitch;
    }
    window.speechSynthesis.speak(utterance);
  }

  public stop() {
    if (typeof window === "undefined" || !window.speechSynthesis) return;
    window.speechSynthesis.cancel();
  }

  public pause() {
    if (typeof window === "undefined" || !window.speechSynthesis) return;
    window.speechSynthesis.pause();
  }

  public resume() {
    if (typeof window === "undefined" || !window.speechSynthesis) return;
    window.speechSynthesis.resume();
  }
}
