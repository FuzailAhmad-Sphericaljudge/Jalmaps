# PWA and Offline Support

JalMaps is a Progressive Web App (PWA) built for rural India, meaning it functions efficiently under poor connectivity and can be installed on home screens.

## Caching Strategy Table

| Resource Type      | Strategy                           | Reason                                                                                                                             |
| ------------------ | ---------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| Static Assets & JS | Precache                           | Ensures the app shell can load entirely offline.                                                                                   |
| Fonts              | Stale-while-revalidate             | Fast loading, updates in the background.                                                                                           |
| Images             | Cache-first                        | Saves data, images rarely change.                                                                                                  |
| API Data (JSON)    | Persisted IDB (via TanStack Query) | Network-first fetching with short timeout. Fallback to cached IDB data if offline. Gives immediate read access to previous state.  |
| Mutations          | Network-only + Queue               | Actions like snoozing alerts or updating settings are written to an offline outbox and replayed via Background Sync/online events. |
| Auth Endpoints     | Network-only                       | Never cached for security.                                                                                                         |

## Privacy Rules

- **No shared cache for user data:** All user-specific data (readings, alerts, advice) is scoped to the user ID and stored in IndexedDB.
- **Wipe on Sign-Out:** An explicit sign-out completely clears the IDB caches and service worker caches containing user data.

## Offline Behavior per Screen

- **Dashboard:** Shows last known readings and trends. Includes a "Last updated X mins ago, you are offline" banner.
- **Alerts/Advice:** Actions (e.g. Acknowledge, Feedback) can be tapped offline. They go to a pending state and sync automatically.
- **Settings:** Preferences can be updated offline.

## Data Saver Mode

Triggered by an explicit setting or automatically via `navigator.connection.saveData`.

- Reduces polling frequencies.
- Limits animation.
- Restricts WebSockets (unless explicitly requested).
- Requests smaller media payloads.

## Debugging Tips

1. Use Chrome DevTools > Application > Service Workers to mock Offline mode or update the worker.
2. Check IndexedDB in DevTools for the `tanstack-query` and `offline-outbox` databases.
3. To test the Install Banner, clear site data and trigger the `beforeinstallprompt` event via DevTools.
