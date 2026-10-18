# Phase 9: Wells and Nodes Management

**Status:** Completed

## Objective

A farmer can register a well, attach a sensor node to it, receive the node's API key exactly once, and manage both afterwards. Village admins, officials and admins can bulk-import wells. Everything is mobile-first, translated and accessible.

## Implementation Details

1. **Well Wizard**: Mobile-first multi-step form to capture well details, Geolocation, and resize photos.
2. **Node Management**: UI for QR scanning, provision one-time node API keys, and managing node details (hang depth, calibration).
3. **Bulk Import**: CSV upload functionality for village admins, with strict Zod validation.
4. **Member Sharing**: Role-based access for well members (`viewer`, `editor`).
5. **Localization**: Fully translated in English and Hindi.
6. **Tests**: Unit tests, integration tests, E2E play-throughs, and axe accessibility checks.

## Future Phases

- Map Integration (Phase 19).
