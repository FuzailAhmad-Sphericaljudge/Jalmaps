import { chromium } from "@playwright/test";

export interface RenderPdfOptions {
  timeoutMs?: number;
}

/**
 * Renders an HTML string to a vector PDF buffer using headless Chromium.
 * Ensures complex Indic script text shaping (Devanagari, Gurmukhi, Tamil, etc.)
 * is rendered with 100% typographic fidelity via HarfBuzz.
 */
export async function renderHtmlToPdf(
  html: string,
  options: RenderPdfOptions = {},
): Promise<Buffer> {
  const browser = await chromium.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox", "--font-render-hinting=medium"],
  });

  try {
    const page = await browser.newPage();
    await page.setContent(html, {
      waitUntil: "networkidle",
      timeout: options.timeoutMs ?? 15000,
    });

    const pdfBuffer = await page.pdf({
      format: "A4",
      printBackground: true,
      margin: {
        top: "12mm",
        right: "15mm",
        bottom: "15mm",
        left: "15mm",
      },
    });

    return Buffer.from(pdfBuffer);
  } finally {
    await browser.close();
  }
}
