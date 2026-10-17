import { describe, it, expect } from "vitest";
import { renderHtmlToPdf } from "./pdf";
import { PDFParse } from "pdf-parse";

describe("PDF Generation & Text Extraction", () => {
  it("renders an HTML page into a vector PDF buffer with standard PDF headers", async () => {
    const sampleHtml = `<!DOCTYPE html>
    <html>
      <head><meta charset="utf-8"/><title>Test Document</title></head>
      <body>
        <h1>JalMaps Groundwater Report</h1>
        <p>जल स्तर निगरानी एवं भूजल विश्लेषण</p>
      </body>
    </html>`;

    const pdfBuffer = await renderHtmlToPdf(sampleHtml);
    expect(pdfBuffer).toBeInstanceOf(Buffer);
    expect(pdfBuffer.length).toBeGreaterThan(1000);

    // Standard PDF file signature: %PDF-1.4 or %PDF-1.7
    const signature = pdfBuffer.slice(0, 5).toString("utf8");
    expect(signature).toBe("%PDF-");

    // Extract text using PDFParse
    const parser = new PDFParse({ data: pdfBuffer });
    const parsed = await parser.getText();
    expect(parsed.text).toContain("JalMaps Groundwater Report");
    expect(parsed.text).toContain("जल");
  }, 60000);
});
