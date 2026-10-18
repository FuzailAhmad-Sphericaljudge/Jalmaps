import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

import { type AppLocale, locales } from "../../src/i18n/config";

const MESSAGES_DIR = path.resolve("src/i18n/messages");
const STATUS_FILE = path.resolve("i18n/status.json");

type Messages = Record<string, unknown>;

function flatten(messages: Messages, prefix = ""): Record<string, string> {
  let out: Record<string, string> = {};
  for (const [key, value] of Object.entries(messages)) {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    if (typeof value === "string") {
      out[fullKey] = value;
    } else if (value && typeof value === "object") {
      out = { ...out, ...flatten(value as Messages, fullKey) };
    }
  }
  return out;
}

function loadAllMessages(locale: string) {
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
  let all: Record<string, string> = {};
  for (const ns of namespaces) {
    try {
      const file = path.join(MESSAGES_DIR, locale, `${ns}.json`);
      const data = JSON.parse(readFileSync(file, "utf8"));
      const flat = flatten(data, ns);
      all = { ...all, ...flat };
    } catch {
      // Ignore missing files
    }
  }
  return all;
}

function escapeCsv(str: string) {
  return `"${str.replace(/"/g, '""')}"`;
}

export function exportTranslations(targetLocale: string) {
  if (!locales.includes(targetLocale as AppLocale) || targetLocale === "en") {
    throw new Error(`Invalid target locale: ${targetLocale}`);
  }

  const enMessages = loadAllMessages("en");
  const targetMessages = loadAllMessages(targetLocale);
  const statusData = JSON.parse(readFileSync(STATUS_FILE, "utf8"));

  const csvRows = [["Key", "Status", "English", `Translation (${targetLocale})`]];

  for (const [key, enValue] of Object.entries(enMessages)) {
    const targetValue = targetMessages[key] || "";
    const status = statusData[key]?.[targetLocale] || "draft_machine";
    csvRows.push([key, status, escapeCsv(enValue), escapeCsv(targetValue)]);
  }

  const csvContent = csvRows.map((row) => row.join(",")).join("\n");
  const outputPath = path.resolve(`i18n/export_${targetLocale}.csv`);
  writeFileSync(outputPath, csvContent, "utf8");
  console.log(`Exported ${csvRows.length - 1} keys to ${outputPath}`);
}

const isDirectRun =
  typeof process !== "undefined" &&
  process.argv[1] !== undefined &&
  process.argv[1].replace(/\\/g, "/").endsWith("export.ts");

if (isDirectRun) {
  const target = process.argv[2];
  if (!target) {
    console.error("Usage: pnpm i18n:export <locale>");
    process.exit(1);
  }
  exportTranslations(target);
}
