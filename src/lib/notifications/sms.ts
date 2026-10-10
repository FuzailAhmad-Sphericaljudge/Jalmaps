export function estimateSmsSegments(text: string): number {
  // Simple heuristic: if the text contains non-GSM-7 characters, it's Unicode.
  // GSM-7 uses up to 160 chars per segment.
  // Unicode (e.g. Hindi) uses up to 70 chars per segment.
  // Multi-part messages reduce this to 153 and 67 respectively due to UDH.

  const isUnicode = /[^\x00-\x7F]/.test(text);
  const length = text.length;

  if (isUnicode) {
    if (length <= 70) return 1;
    return Math.ceil(length / 67);
  } else {
    if (length <= 160) return 1;
    return Math.ceil(length / 153);
  }
}
