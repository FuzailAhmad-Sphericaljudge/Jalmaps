export function formatNumberForSpeech(value: number, locale: string): string {
  // Round to nearest 0.5 for speech
  const rounded = Math.round(value * 2) / 2;
  
  return new Intl.NumberFormat(locale, {
    maximumFractionDigits: 1,
    minimumFractionDigits: Number.isInteger(rounded) ? 0 : 1,
  }).format(rounded);
}
