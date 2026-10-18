# 18. PWA and Offline Support

## Goal

The app installs like a native app, opens instantly, shows the last known well data without internet, queues user actions while offline, and uses less data on slow connections. Many users have patchy networks.

## Technical Strategy

- **Service Worker:** Serwist (`@serwist/next`, `serwist`)
- **Offline Data:** IndexedDB (`idb-keyval`) for storing specific TanStack query data locally (wiped on sign out).
- **Offline Action Queue:** Wrap mutations, store in an indexedDB outbox queue when offline, replay when online.
- **Install Experience:** Capture `beforeinstallprompt` and show a dismissible custom banner.

## Caching Strategy

- App shell and static assets: Precache
- API GET requests (JSON): Network-first with short timeout + Cache fallback (persisted to IDB via TanStack Query offline persister)
- Images: Cache-first
- Authenticated Mutations: Network-only, queued locally if offline.
