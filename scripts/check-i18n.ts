/**
 * i18n consistency checker — CI gate for translation completeness.
 *
 * Fails when any locale, compared against English (the source of truth):
 *   1. is missing a key,
 *   2. has an extra key English does not have,
 *   3. has a different ICU argument list, or
 *   4. has different plural/select options for the same key.
 *
 * Run: pnpm check-i18n  (exits non-zero on any problem)
 */
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";

import { extractIcuArguments, extractIcuOptions } from "../src/i18n/icu";
import { locales } from "../src/i18n/config";

const MESSAGES_DIR = path.resolve("src/i18n/messages");
const SOURCE_LOCALE = "en";

type Messages = Record<string, unknown>;

function loadNamespace(locale: string, namespace: string): Messages {
  const file = path.join(MESSAGES_DIR, locale, `${namespace}.json`);
  return JSON.parse(readFileSync(file, "utf8")) as Messages;
}

function listNamespaces(locale: string): string[] {
  return readdirSync(path.join(MESSAGES_DIR, locale))
    .filter((name) => name.endsWith(".json"))
    .map((name) => name.replace(/\.json$/, ""));
}

/** Flatten nested message objects into dot-delimited key paths. */
function flatten(messages: Messages, prefix = ""): Map<string, string> {
  const out = new Map<string, string>();
  for (const [key, value] of Object.entries(messages)) {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    if (typeof value === "string") {
      out.set(fullKey, value);
    } else if (value && typeof value === "object") {
      for (const [subKey, subValue] of flatten(value as Messages, fullKey)) {
        out.set(subKey, subValue);
      }
    }
  }
  return out;
}

export function checkI18n(): string[] {
  const problems: string[] = [];
  const namespaces = listNamespaces(SOURCE_LOCALE);

  // Keys that appear in more than one English namespace (e.g. both en/home
  // and en/common define "title") would collide in a single global map, so
  // each namespace keeps its own unprefixed flattened map.
  const source = new Map<string, Map<string, string>>();
  for (const namespace of namespaces) {
    source.set(namespace, flatten(loadNamespace(SOURCE_LOCALE, namespace)));
  }

  const targetLocales = locales.filter((locale) => locale !== SOURCE_LOCALE);
  for (const locale of targetLocales) {
    const localeNamespaces = listNamespaces(locale);
    for (const namespace of namespaces) {
      if (!localeNamespaces.includes(namespace)) {
        problems.push(`${locale}: missing namespace "${namespace}"`);
        continue;
      }
      const sourceKeys = source.get(namespace);
      if (!sourceKeys) {
        continue;
      }
      const messages = flatten(loadNamespace(locale, namespace));

      for (const [key, sourceValue] of sourceKeys) {
        const value = messages.get(key);
        if (value === undefined) {
          problems.push(`${locale}: missing key "${namespace}.${key}"`);
          continue;
        }

        const sourceArgs = extractIcuArguments(sourceValue).sort().join(",");
        const localeArgs = extractIcuArguments(value).sort().join(",");
        if (sourceArgs !== localeArgs) {
          problems.push(
            `${locale}: "${namespace}.${key}" ICU arguments differ (en: [${sourceArgs}], ${locale}: [${localeArgs}])`,
          );
        }

        const sourceOptions = JSON.stringify(extractIcuOptions(sourceValue));
        const localeOptions = JSON.stringify(extractIcuOptions(value));
        if (sourceOptions !== localeOptions) {
          problems.push(
            `${locale}: "${namespace}.${key}" plural/select options differ from English (verify plural categories)`,
          );
        }
      }

      for (const key of messages.keys()) {
        if (!sourceKeys.has(key)) {
          problems.push(`${locale}: extra key "${namespace}.${key}" not present in English`);
        }
      }
    }

    for (const namespace of localeNamespaces) {
      if (!namespaces.includes(namespace)) {
        problems.push(`${locale}: extra namespace "${namespace}" not present in English`);
      }
    }
  }

  return problems;
}

const isDirectRun =
  typeof process !== "undefined" &&
  process.argv[1] !== undefined &&
  process.argv[1].replace(/\\/g, "/").endsWith("check-i18n.ts");

if (isDirectRun) {
  const problems = checkI18n();
  if (problems.length > 0) {
    console.error(`i18n check failed with ${problems.length} problem(s):\n`);
    for (const problem of problems) {
      console.error(`  - ${problem}`);
    }
    process.exit(1);
  }
  console.log(`i18n check passed: ${locales.length - 1} locale(s) match English.`);
}
