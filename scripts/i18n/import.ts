import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

import { type AppLocale, locales } from "../../src/i18n/config";

const MESSAGES_DIR = path.resolve("src/i18n/messages");
const STATUS_FILE = path.resolve("i18n/status.json");

function unflatten(flat: Record<string, string>, namespace: string): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  const prefix = `${namespace}.`;
  for (const [key, value] of Object.entries(flat)) {
    if (!key.startsWith(prefix)) continue;
    const parts = key.slice(prefix.length).split(".");
    let current = result;
    for (let i = 0; i < parts.length - 1; i++) {
      const part = parts[i]!;
      current[part] = current[part] || {};
      current = current[part] as Record<string, unknown>;
    }
    current[parts[parts.length - 1]!] = value;
  }
  return result;
}

// Simple CSV parser that handles quotes
function parseCsv(content: string): string[][] {
  const rows: string[][] = [];
  let currentRow: string[] = [];
  let currentVal = "";
  let inQuotes = false;

  for (let i = 0; i < content.length; i++) {
    const char = content[i];
    if (char === '"') {
      if (inQuotes && content[i + 1] === '"') {
        currentVal += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === "," && !inQuotes) {
      currentRow.push(currentVal);
      currentVal = "";
    } else if ((char === "\n" || char === "\r") && !inQuotes) {
      if (char === "\r" && content[i + 1] === "\n") i++;
      currentRow.push(currentVal);
      rows.push(currentRow);
      currentRow = [];
      currentVal = "";
    } else {
      currentVal += char;
    }
  }
  if (currentVal || currentRow.length > 0) {
    currentRow.push(currentVal);
    rows.push(currentRow);
  }
  return rows;
}

export function importTranslations(targetLocale: string, csvFile: string) {
  if (!locales.includes(targetLocale as AppLocale) || targetLocale === "en") {
    throw new Error(`Invalid target locale: ${targetLocale}`);
  }

  const csvContent = readFileSync(csvFile, "utf8");
  const rows = parseCsv(csvContent);
  const headers = rows.shift() || [];

  const keyIdx = headers.indexOf("Key");
  const statusIdx = headers.indexOf("Status");
  const transIdx = headers.findIndex((h) => h.startsWith("Translation"));

  if (keyIdx === -1 || statusIdx === -1 || transIdx === -1) {
    throw new Error("Invalid CSV format. Missing required headers.");
  }

  const flatTranslations: Record<string, string> = {};
  const newStatusData: Record<string, Record<string, string>> = JSON.parse(
    readFileSync(STATUS_FILE, "utf8"),
  );

  for (const row of rows) {
    if (row.length < Math.max(keyIdx, statusIdx, transIdx) + 1) continue;
    const key = row[keyIdx]!;
    const status = row[statusIdx]!;
    const translation = row[transIdx]!;

    if (!key) continue;

    flatTranslations[key] = translation;

    if (!newStatusData[key]) newStatusData[key] = {};
    newStatusData[key]![targetLocale] = status;
  }

  const namespaces = [
    "account",
    "advisory",
    "alerts",
    "auth",
    "common",
    "errors",
    "gallery",
    "history",
    "home",
    "notifications",
    "onboarding",
    "settings",
    "shell",
    "speech",
    "wells",
  ];

  for (const ns of namespaces) {
    const unflattened = unflatten(flatTranslations, ns);
    if (Object.keys(unflattened).length > 0) {
      const filePath = path.join(MESSAGES_DIR, targetLocale, `${ns}.json`);
      writeFileSync(filePath, JSON.stringify(unflattened, null, 2) + "\n", "utf8");
    }
  }

  writeFileSync(STATUS_FILE, JSON.stringify(newStatusData, null, 2) + "\n", "utf8");
  console.log(`Imported translations for ${targetLocale} from ${csvFile}`);
}

const isDirectRun =
  typeof process !== "undefined" &&
  process.argv[1] !== undefined &&
  process.argv[1].replace(/\\/g, "/").endsWith("import.ts");

if (isDirectRun) {
  const target = process.argv[2];
  const file = process.argv[3];
  if (!target || !file) {
    console.error("Usage: pnpm i18n:import <locale> <csv-file>");
    process.exit(1);
  }
  importTranslations(target, file);
}
