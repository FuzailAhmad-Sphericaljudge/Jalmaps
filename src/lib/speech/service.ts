export interface SpeechConfig { rate: number; pitch: number; }

export class SpeechService {
  private queue: SpeechSynthesisUtterance[] = [];
  private isSpeaking = false;

  constructor() {}

  public discoverVoices(locale: string): SpeechSynthesisVoice | null {
    if (typeof window === "undefined" || !window.speechSynthesis) return null;
    const voices = window.speechSynthesis.getVoices();
    const prefix = locale.split("-")[0];
    return (
      voices.find((v) => v.lang === locale) ||
      (prefix ? voices.find((v) => v.lang.startsWith(prefix)) : null) ||
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

    utterance.onend = () => {
      this.isSpeaking = false;
      this.processQueue();
    };

    utterance.onerror = () => {
      this.isSpeaking = false;
      this.processQueue();
    };

    this.queue.push(utterance);
    this.processQueue();
  }

  private processQueue() {
    if (this.isSpeaking || this.queue.length === 0) return;
    if (typeof window === "undefined" || !window.speechSynthesis) return;

    const utterance = this.queue.shift();
    if (utterance) {
      this.isSpeaking = true;
      window.speechSynthesis.speak(utterance);
    }
  }

  public stop() {
    if (typeof window === "undefined" || !window.speechSynthesis) return;
    this.queue = [];
    this.isSpeaking = false;
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
