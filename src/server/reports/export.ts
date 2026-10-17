import ExcelJS from "exceljs";

export interface DataDictionaryField {
  fieldName: string;
  dataType: string;
  unit: string;
  description: string;
}

export interface CsvExportOptions {
  headers: string[];
  rows: (string | number | boolean | null | undefined)[][];
  includeBom?: boolean;
}

export interface ExcelExportOptions {
  sheetName: string;
  columns: { header: string; key: string; width?: number }[];
  rows: Record<string, string | number | boolean | null | undefined>[];
  dataDictionary: DataDictionaryField[];
}

/**
 * Generates a CSV buffer with UTF-8 BOM prefix (\uFEFF)
 * so Microsoft Excel on Windows opens non-Latin and Indic headers correctly.
 */
export function generateCsvExport(options: CsvExportOptions): Buffer {
  const { headers, rows, includeBom = true } = options;

  const escapeCell = (val: string | number | boolean | null | undefined): string => {
    if (val === null || val === undefined) return "";
    const str = String(val);
    if (str.includes(",") || str.includes('"') || str.includes("\n") || str.includes("\r")) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  const headerLine = headers.map(escapeCell).join(",");
  const rowLines = rows.map((r) => r.map(escapeCell).join(","));
  const csvContent = [headerLine, ...rowLines].join("\r\n");

  const bom = includeBom ? "\uFEFF" : "";
  return Buffer.from(bom + csvContent, "utf8");
}

/**
 * Generates an Excel workbook buffer (.xlsx) using ExcelJS.
 * Contains:
 * 1. Primary data sheet with styled headers and zebra striping.
 * 2. "Data dictionary" sheet documenting column definitions, units, and methodology.
 */
export async function generateExcelExport(options: ExcelExportOptions): Promise<Buffer> {
  const { sheetName, columns, rows, dataDictionary } = options;

  const workbook = new ExcelJS.Workbook();
  workbook.creator = "JalMaps";
  workbook.created = new Date();

  // 1. Primary Data Sheet
  const dataSheet = workbook.addWorksheet(sheetName, {
    views: [{ state: "frozen", ySplit: 1 }],
  });

  dataSheet.columns = columns.map((col) => ({
    header: col.header,
    key: col.key,
    width: col.width ?? Math.max(col.header.length + 5, 12),
  }));

  // Style Header Row
  const headerRow = dataSheet.getRow(1);
  headerRow.font = { bold: true, color: { argb: "FFFFFFFF" }, name: "Segoe UI", size: 10 };
  headerRow.fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FF0284C7" }, // Brand blue
  };
  headerRow.height = 24;
  headerRow.alignment = { vertical: "middle" };

  // Add Data Rows with zebra striping
  for (let i = 0; i < rows.length; i++) {
    const row = dataSheet.addRow(rows[i]);
    row.height = 18;
    row.font = { name: "Segoe UI", size: 9 };
    if (i % 2 === 1) {
      row.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FFF8FAFC" },
      };
    }
  }

  // 2. Data Dictionary Sheet
  const dictSheet = workbook.addWorksheet("Data dictionary", {
    views: [{ state: "frozen", ySplit: 1 }],
  });

  dictSheet.columns = [
    { header: "Field Name", key: "fieldName", width: 22 },
    { header: "Data Type", key: "dataType", width: 14 },
    { header: "Unit of Measure", key: "unit", width: 16 },
    { header: "Description & Hydrogeological Definition", key: "description", width: 50 },
  ];

  const dictHeader = dictSheet.getRow(1);
  dictHeader.font = { bold: true, color: { argb: "FFFFFFFF" }, name: "Segoe UI", size: 10 };
  dictHeader.fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FF334155" }, // Slate
  };
  dictHeader.height = 24;

  for (const entry of dataDictionary) {
    dictSheet.addRow(entry);
  }

  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer);
}
