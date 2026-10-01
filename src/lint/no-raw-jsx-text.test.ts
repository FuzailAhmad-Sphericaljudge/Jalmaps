import { readFileSync } from "node:fs";
import path from "node:path";

import { RuleTester } from "eslint";
import { describe, expect, it } from "vitest";

import plugin from "../../eslint-rules/no-raw-jsx-text.mjs";

// The .mjs import widens meta.type to string; RuleTester needs the literal.
const rule = plugin.rules["no-raw-jsx-text"] as Parameters<
  InstanceType<typeof RuleTester>["run"]
>[1];

// Plain JSX snippets — espree (ESLint's default parser) handles them fine.
const ruleTester = new RuleTester({
  languageOptions: {
    ecmaVersion: "latest",
    sourceType: "module",
    parserOptions: { ecmaFeatures: { jsx: true } },
  },
});

describe("no-raw-jsx-text rule", () => {
  it("is wired into the flat config under the jalmaps plugin", () => {
    // Read as text: importing eslint.config.mjs pulls in the full next
    // config chain and costs seconds per run.
    const config = readFileSync(path.resolve("eslint.config.mjs"), "utf8");
    expect(config).toContain('"jalmaps/no-raw-jsx-text": "error"');
    expect(config).toContain("jalmaps: localRules");
  });

  ruleTester.run("jalmaps/no-raw-jsx-text", rule, {
    valid: [
      { code: 'const x = <div>{t("greeting")}</div>;' },
      { code: "const x = <div>{count}</div>;" },
      { code: 'const x = <div>{"⌂"}</div>;' },
      { code: "const x = <div> </div>;" },
      { code: 'const x = <div>{"\\n"}</div>;' },
      { code: "const x = <div>JalMaps</div>;" },
      { code: "const x = <option>हिन्दी</option>;" },
      { code: "const x = <code>npm run dev</code>;" },
      {
        code: "const x = <div>Custom brand</div>;",
        options: [{ allowList: ["Custom brand"] }],
      },
    ],
    invalid: [
      {
        code: "const x = <div>Hello world</div>;",
        errors: [{ messageId: "rawText", data: { text: "Hello world" } }],
      },
      {
        code: "const x = <div> Hello </div>;",
        errors: [{ messageId: "rawText", data: { text: "Hello" } }],
      },
      {
        code: "const x = <span>Close</span>;",
        errors: [{ messageId: "rawText" }],
      },
      {
        code: "const x = <div><p>Nested</p></div>;",
        errors: [{ messageId: "rawText", data: { text: "Nested" } }],
      },
      {
        // option allowlist does not extend to other elements
        code: "const x = <button>हिन्दी</button>;",
        errors: [{ messageId: "rawText" }],
      },
    ],
  });
});
