import { toHaveNoViolations } from "jest-axe";
import { axe } from "jest-axe";
import { expect } from "vitest";

import type { RenderResult } from "@testing-library/react";

expect.extend(toHaveNoViolations);

/** Run axe against a rendered component and assert zero violations. */
export async function expectNoAxeViolations(
  rendered: RenderResult,
  /** jest-axe config overrides (e.g. rules to disable for a known exception). */
  config = {},
) {
  const results = await axe(rendered.container, config);
  expect(results).toHaveNoViolations();
}
