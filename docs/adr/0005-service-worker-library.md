# 5. Service Worker Library (Serwist)

Date: 2026-10-11

## Status

Accepted

## Context

For Phase 18, we needed to make JalMaps a robust PWA capable of functioning offline, precaching the app shell, and managing complex runtime caching strategies (e.g., Network First with short timeouts for API data).

Historically, Next.js projects relied on `next-pwa` (which wrapped Workbox). However, `next-pwa` is largely unmaintained and has issues with modern Next.js App Router and Webpack 5 setups. Google's Workbox is excellent but configuring it manually for Next.js is complex and brittle.

## Decision

We chose **Serwist** (`@serwist/next` and `serwist`), a modern fork/successor to Workbox designed with native TypeScript support and first-class Next.js integration.

## Consequences

- **Pros:** Type-safe, works seamlessly with Next.js App Router, provides the same battle-tested strategies as Workbox (precaching, routing, strategies).
- **Cons:** Slightly newer ecosystem, requiring us to learn its specific API differences from Workbox.
