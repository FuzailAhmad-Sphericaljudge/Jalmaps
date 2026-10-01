/**
 * eslint-plugin-local — project-local ESLint rules for JalMaps.
 *
 * Loaded from eslint.config.mjs as a flat-config plugin object.
 */

/**
 * Rule: no-raw-jsx-text
 *
 * Flags literal text inside JSX, which cannot be translated. All
 * user-facing copy must go through next-intl (`t("...")` /
 * `getTranslations`) so the check-i18n gate can verify locale parity.
 *
 * Allowed:
 *   - whitespace-only text (JSX formatting)
 *   - text inside allowlisted elements (`code`, `pre`, `option`) where
 *     content is technical sample output or a locale's native name
 *   - the JalMaps wordmark string, configured via `allowList`
 *
 * Options:
 *   allowList: string[] — exact strings that may appear as raw text.
 */

const DEFAULT_ALLOWED_ELEMENTS = new Set(["code", "pre", "option"]);

function isWhitespaceOnly(text) {
  return /^\s*$/.test(text);
}

const noRawJsxText = {
  meta: {
    type: "problem",
    docs: {
      description:
        "Disallow untranslated literal text in JSX; route copy through next-intl instead.",
    },
    schema: [
      {
        type: "object",
        properties: {
          allowList: {
            type: "array",
            items: { type: "string" },
          },
          allowedElements: {
            type: "array",
            items: { type: "string" },
          },
        },
        additionalProperties: false,
      },
    ],
    messages: {
      rawText:
        'Raw JSX text "{{text}}" is not translatable. Use a next-intl message key (e.g. t("key")) instead.',
    },
  },

  create(context) {
    const options = context.options[0] ?? {};
    const allowList = new Set(options.allowList ?? ["JalMaps"]);
    const allowedElements = new Set([
      ...DEFAULT_ALLOWED_ELEMENTS,
      ...(options.allowedElements ?? []),
    ]);

    function closestJsxElementName(jsxText) {
      let node = jsxText.parent;
      while (node) {
        if (node.type === "JSXElement" && node.openingElement?.name?.type === "JSXIdentifier") {
          return node.openingElement.name.name;
        }
        node = node.parent;
      }
      return null;
    }

    return {
      JSXText(node) {
        const text = node.value.trim();
        if (isWhitespaceOnly(node.value) || text === "") {
          return;
        }
        if (allowList.has(text)) {
          return;
        }
        const elementName = closestJsxElementName(node);
        if (elementName !== null && allowedElements.has(elementName)) {
          return;
        }
        context.report({ node, messageId: "rawText", data: { text } });
      },
    };
  },
};

const localRulesPlugin = {
  rules: {
    "no-raw-jsx-text": noRawJsxText,
  },
};

export default localRulesPlugin;
