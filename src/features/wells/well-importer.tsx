"use client";

import { useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { Upload, Download, AlertCircle, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { importWellsAction } from "@/app/[locale]/(app)/village/wells/actions";

type PreviewRow = {
  index: number;
  name: string;
  well_type: string;
  latitude: string;
  longitude: string;
  total_depth_m?: string;
  notes?: string;
  owner_phone?: string;
};

type ResultRow = {
  index: number;
  status: "ok" | "error";
  name: string;
  reason?: string;
};

const CSV_TEMPLATE = `name,well_type,latitude,longitude,total_depth_m,notes,owner_phone
North field borewell,borewell,20.5937,78.9629,120,Sandy soil,+919876543210
Village tank,tank,20.5938,78.9630,,Community water tank,
`;

function parseCsvLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      inQuotes = !inQuotes;
    } else if (ch === "," && !inQuotes) {
      result.push(current.trim());
      current = "";
    } else {
      current += ch;
    }
  }
  result.push(current.trim());
  return result;
}

function parseCsv(text: string): { headers: string[]; rows: string[][] } {
  const lines = text.trim().split(/\r?\n/);
  const headers = parseCsvLine(lines[0] ?? "");
  const rows = lines.slice(1).map((l) => parseCsvLine(l));
  return { headers, rows };
}

function rowsToPreview(headers: string[], rows: string[][]): PreviewRow[] {
  return rows.slice(0, 500).map((cols, i) => {
    const get = (key: string) => cols[headers.indexOf(key)] ?? "";
    return {
      index: i + 1,
      name: get("name"),
      well_type: get("well_type"),
      latitude: get("latitude"),
      longitude: get("longitude"),
      total_depth_m: get("total_depth_m") || undefined,
      notes: get("notes") || undefined,
      owner_phone: get("owner_phone") || undefined,
    };
  });
}

export function WellImporter({ locale }: { locale: string }) {
  const t = useTranslations("wells");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [preview, setPreview] = useState<PreviewRow[] | null>(null);
  const [rawCsv, setRawCsv] = useState<string>("");
  const [results, setResults] = useState<ResultRow[] | null>(null);
  const [importing, setImporting] = useState(false);
  const [error, setError] = useState("");

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.name.endsWith(".csv")) {
      setError("Please upload a CSV file.");
      return;
    }
    setError("");
    setResults(null);
    const text = await file.text();
    setRawCsv(text);
    const { headers, rows } = parseCsv(text);
    if (rows.length > 500) {
      setError(t("import.maxRows"));
    }
    setPreview(rowsToPreview(headers, rows));
  };

  const handleDownloadTemplate = () => {
    const blob = new Blob([CSV_TEMPLATE], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "wells-template.csv";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleImport = async () => {
    if (!preview) return;
    setImporting(true);
    setError("");
    try {
      const result = await importWellsAction(locale, rawCsv);
      if (result.status === "ok") {
        setResults(result.rows);
      } else {
        setError(result.message ?? "Import failed");
      }
    } catch {
      setError("Import failed. Please try again.");
    } finally {
      setImporting(false);
    }
  };

  const handleDownloadErrors = () => {
    if (!results) return;
    const errors = results.filter((r) => r.status === "error");
    const csv = [
      "row,name,reason",
      ...errors.map(
        (e) => `${e.index},${JSON.stringify(e.name)},${JSON.stringify(e.reason ?? "")}`,
      ),
    ].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "import-errors.csv";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const successCount = results?.filter((r) => r.status === "ok").length ?? 0;
  const errorCount = results?.filter((r) => r.status === "error").length ?? 0;

  return (
    <div className="max-w-2xl space-y-6">
      <div className="flex flex-wrap gap-3">
        <Button variant="outline" onClick={handleDownloadTemplate} className="h-12">
          <Download className="mr-2 h-5 w-5" aria-hidden />
          {t("import.download")}
        </Button>
        <Button variant="outline" onClick={() => fileInputRef.current?.click()} className="h-12">
          <Upload className="mr-2 h-5 w-5" aria-hidden />
          {t("import.upload")}
        </Button>
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv"
          className="sr-only"
          onChange={handleFileChange}
          aria-label={t("import.upload")}
        />
      </div>

      {error && (
        <div
          role="alert"
          className="flex items-center gap-2 rounded-lg border border-destructive bg-destructive/10 p-4 text-destructive"
        >
          <AlertCircle className="h-5 w-5 shrink-0" />
          {error}
        </div>
      )}

      {results && (
        <div className="space-y-2 rounded-lg border bg-card p-4">
          <div className="flex items-center gap-2 font-medium text-success">
            <CheckCircle className="h-5 w-5" />
            {t("import.successCount", { count: successCount })}
          </div>
          {errorCount > 0 && (
            <div className="flex items-center justify-between">
              <span className="text-sm text-destructive">
                {t("import.failedRows", { count: errorCount })}
              </span>
              <Button variant="ghost" size="sm" onClick={handleDownloadErrors}>
                <Download className="mr-1 h-4 w-4" />
                {t("import.errors")}
              </Button>
            </div>
          )}
        </div>
      )}

      {preview && !results && (
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            {t("import.preview")}
            {": "}
            {t("import.previewRows", { count: preview.length })}
          </p>
          <div className="overflow-x-auto rounded-lg border">
            <table className="w-full text-sm">
              <thead className="bg-muted">
                <tr>
                  {["#", "name", "well_type", "latitude", "longitude", "depth", "owner_phone"].map(
                    (h) => (
                      <th key={h} className="px-3 py-2 text-left font-medium">
                        {h}
                      </th>
                    ),
                  )}
                </tr>
              </thead>
              <tbody>
                {preview.slice(0, 20).map((row) => (
                  <tr key={row.index} className="border-t">
                    <td className="px-3 py-2 text-muted-foreground">{row.index}</td>
                    <td className="px-3 py-2 font-medium">{row.name}</td>
                    <td className="px-3 py-2">{row.well_type}</td>
                    <td className="px-3 py-2">{row.latitude}</td>
                    <td className="px-3 py-2">{row.longitude}</td>
                    <td className="px-3 py-2">{row.total_depth_m ?? "-"}</td>
                    <td className="px-3 py-2">{row.owner_phone ?? "-"}</td>
                  </tr>
                ))}
                {preview.length > 20 && (
                  <tr className="border-t">
                    <td colSpan={7} className="px-3 py-2 text-center text-xs text-muted-foreground">
                      {t("import.moreRows", { count: preview.length - 20 })}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <Button onClick={handleImport} disabled={importing} className="h-12 w-full">
            {importing ? t("import.importing") : t("import.import")}
          </Button>
        </div>
      )}
    </div>
  );
}
