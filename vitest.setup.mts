import "@testing-library/jest-dom/vitest";

import { cleanup } from "@testing-library/react";
import { afterEach, beforeAll } from "vitest";

// jsdom does not implement matchMedia; components and tests need it.
beforeAll(() => {
  if (typeof window !== "undefined" && !window.matchMedia) {
    Object.defineProperty(window, "matchMedia", {
      writable: true,
      value: (query: string): MediaQueryList => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: () => undefined,
        removeListener: () => undefined,
        addEventListener: () => undefined,
        removeEventListener: () => undefined,
        dispatchEvent: () => false,
      }),
    });
  }

  // jsdom lacks PointerEvent and pointer-capture APIs used by Radix primitives.
  if (typeof window !== "undefined") {
    if (!window.PointerEvent) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (window as any).PointerEvent = class PointerEvent extends MouseEvent {};
    }
    if (!Element.prototype.hasPointerCapture) {
      Element.prototype.hasPointerCapture = () => false;
      Element.prototype.setPointerCapture = () => undefined;
      Element.prototype.releasePointerCapture = () => undefined;
    }
    if (!Element.prototype.scrollIntoView) {
      Element.prototype.scrollIntoView = () => undefined;
    }

    if (!window.ResizeObserver) {
      class ResizeObserverPolyfill {
        observe() {}
        unobserve() {}
        disconnect() {}
      }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (window as any).ResizeObserver = ResizeObserverPolyfill;
    }
  }
});

afterEach(() => {
  cleanup();
});
