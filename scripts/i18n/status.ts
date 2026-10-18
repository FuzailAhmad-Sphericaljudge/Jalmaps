import { readFileSync } from "node:fs";
import path from "node:path";

import { locales } from "../../src/i18n/config";

const STATUS_FILE = path.resolve("i18n/status.json");

type StatusValue = "draft_machine" | "reviewed" | "approved";
type StatusMap = Record<string, Record<string, StatusValue>>;

export function getStatus() {
  const data = JSON.parse(readFileSync(STATUS_FILE, "utf8")) as StatusMap;

  const stats: Record<
    string,
    { total: number; draft_machine: number; reviewed: number; approved: number }
  > = {};

  for (const locale of locales) {
    if (locale === "en") continue;
    stats[locale] = { total: 0, draft_machine: 0, reviewed: 0, approved: 0 };
  }

  for (const [, localeStatus] of Object.entries(data)) {
    for (const [locale, status] of Object.entries(localeStatus)) {
      if (!stats[locale]) continue;
      stats[locale].total++;
      if (status === "draft_machine") stats[locale].draft_machine++;
      if (status === "reviewed") stats[locale].reviewed++;
      if (status === "approved") stats[locale].approved++;
    }
  }

  return stats;
}

const isDirectRun =
  typeof process !== "undefined" &&
  process.argv[1] !== undefined &&
  process.argv[1].replace(/\\/g, "/").endsWith("status.ts");

if (isDirectRun) {
  const stats = getStatus();
  console.log("Translation Status:\n");
  const table = [];
  for (const [locale, counts] of Object.entries(stats)) {
    const percentComplete =
      counts.total > 0 ? Math.round(((counts.reviewed + counts.approved) / counts.total) * 100) : 0;
    const percentApproved =
      counts.total > 0 ? Math.round((counts.approved / counts.total) * 100) : 0;
    table.push({
      Locale: locale,
      Total: counts.total,
      Draft: counts.draft_machine,
      Reviewed: counts.reviewed,
      Approved: counts.approved,
      "% Complete": `${percentComplete}%`,
      "% Approved": `${percentApproved}%`,
    });
  }
  console.table(table);
}
