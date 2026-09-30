/**
 * Vitest matcher augmentation for the jest-axe matchers used by src/test/a11y.tsx.
 */
import "vitest";

declare module "vitest" {
  interface Assertion<T> {
    toHaveNoViolations(): T;
  }
}
