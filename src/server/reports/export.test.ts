import { describe, it, expect } from "vitest";
import { generateCsvExport, generateExcelExport } from "./export";

describe("CSV Export", () => {
  it("prepends UTF-8 BOM so Excel opens non-Latin and Indic text cleanly", () => {
    const csvBuffer = generateCsvExport({
      headers: ["कुआं आईडी", "दिनांक", "जल स्तर (मीटर)", "गुणवत्ता"],
      rows: [
        ["W-101", "2026-10-15", 14.5, "उचित"],
        ["W-102", "2026-10-16", 15.2, "सामान्य"],
      ],
      includeBom: true,
    });

    // Check BOM bytes EF BB BF
    expect(csvBuffer[0]).toBe(0xef);
    expect(csvBuffer[1]).toBe(0xbb);
    expect(csvBuffer[2]).toBe(0xbf);

    const str = csvBuffer.toString("utf8");
    expect(str).toContain("कुआं आईडी");
    expect(str).toContain("14.5");
  });

  it("escapes cells containing commas and quotes properly", () => {
    const csvBuffer = generateCsvExport({
      headers: ["Name", "Notes"],
      rows: [["Well A", 'Notes with, comma and "quotes"']],
      includeBom: false,
    });

    const str = csvBuffer.toString("utf8");
    expect(str).toContain('"Notes with, comma and ""quotes"""');
  });
});

describe("Excel Export", () => {
  it("generates a multi-sheet Excel workbook with Data Dictionary", async () => {
    const xlsxBuffer = await generateExcelExport({
      sheetName: "Telemetric Readings",
      columns: [
        { header: "Well ID", key: "wellId" },
        { header: "Depth (m)", key: "depthM" },
      ],
      rows: [
        { wellId: "W-1", depthM: 12.4 },
        { wellId: "W-2", depthM: 14.1 },
      ],
      dataDictionary: [
        {
          fieldName: "depthM",
          dataType: "Float",
          unit: "metres",
          description: "Depth to water below ground surface",
        },
      ],
    });

    expect(xlsxBuffer).toBeInstanceOf(Buffer);
    expect(xlsxBuffer.length).toBeGreaterThan(1000);
    // Excel file magic bytes: PK (0x50, 0x4B)
    expect(xlsxBuffer[0]).toBe(0x50);
    expect(xlsxBuffer[1]).toBe(0x4b);
  });
});
