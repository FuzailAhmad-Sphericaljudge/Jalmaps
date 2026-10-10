import "@testing-library/jest-dom/vitest";

import { cleanup } from "@testing-library/react";
import { afterEach, beforeAll, vi } from "vitest";

// next/font functions rely on a compile-time transform; emulate the transform's
// output (a component + a --font-* CSS variable class) for unit tests.
vi.mock("next/font/google", async (importOriginal) => {
  const mod = await importOriginal<typeof import("next/font/google")>();
  const stubFont = (variable: string) => () => ({ variable, className: variable.slice(2) });
  return {
    ...mod,
    Inter: stubFont("--font-inter"),
    Noto_Sans_Devanagari: stubFont("--font-noto-devanagari"),
    Noto_Sans_Gurmukhi: stubFont("--font-noto-gurmukhi"),
    Noto_Sans_Gujarati: stubFont("--font-noto-gujarati"),
    Noto_Sans_Bengali: stubFont("--font-noto-bengali"),
    Noto_Sans_Tamil: stubFont("--font-noto-tamil"),
    Noto_Sans_Telugu: stubFont("--font-noto-telugu"),
    Noto_Sans_Kannada: stubFont("--font-noto-kannada"),
    Noto_Sans_Malayalam: stubFont("--font-noto-malayalam"),
    Noto_Sans_Oriya: stubFont("--font-noto-oriya"),
  };
});

// next-intl's navigation module imports next/navigation, which requires the
// Next.js runtime; stub the App Router hooks our components use.
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    refresh: vi.fn(),
    prefetch: vi.fn(),
  }),
  usePathname: () => "/",
  useSearchParams: () => new URLSearchParams(),
  useParams: () => ({}),
  useSelectedLayoutSegment: () => null,
  useSelectedLayoutSegments: () => [],
  redirect: vi.fn(),
  permanentRedirect: vi.fn(),
  notFound: vi.fn(),
  forbidden: vi.fn(),
  unauthorized: vi.fn(),
}));

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
