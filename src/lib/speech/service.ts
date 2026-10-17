export interface SpeechConfig {
  rate: number;
  pitch: number;
}

export class SpeechService {
  private queue: SpeechSynthesisUtterance[] = [];
  private isSpeaking = false;
  private isPaused = false;
  public onStateChange?: (state: "idle" | "speaking" | "paused") => void;

  constructor() {}

  private notifyState() {
    if (this.onStateChange) {
      if (this.isPaused) this.onStateChange("paused");
      else if (this.isSpeaking) this.onStateChange("speaking");
      else if (this.queue.length > 0) this.onStateChange("speaking");
      else this.onStateChange("idle");
    }
  }

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
      this.notifyState();
    };

    utterance.onerror = () => {
      this.isSpeaking = false;
      this.processQueue();
      this.notifyState();
    };

    this.queue.push(utterance);
    this.processQueue();
    this.notifyState();
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
    this.isPaused = false;
    window.speechSynthesis.cancel();
    this.notifyState();
  }

  public pause() {
    if (typeof window === "undefined" || !window.speechSynthesis) return;
    this.isPaused = true;
    window.speechSynthesis.pause();
    this.notifyState();
  }

  public resume() {
    if (typeof window === "undefined" || !window.speechSynthesis) return;
    this.isPaused = false;
    window.speechSynthesis.resume();
    this.notifyState();
  }
}
