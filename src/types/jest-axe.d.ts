/**
 * Ambient type declarations for jest-axe, which ships without types.
 * This file must stay a global script (no top-level imports/exports) so the
 * `declare module` block creates the declaration rather than augmenting it.
 */
declare module "jest-axe" {
  export function axe(
    html: Element | string,
    config?: Record<string, unknown>,
  ): Promise<import("axe-core").AxeResults>;

  /** A record of matcher functions, passed to `expect.extend()`. */
  export const toHaveNoViolations: {
    toHaveNoViolations: (expectation: unknown) => { pass: boolean; message: () => string };
  };
}
