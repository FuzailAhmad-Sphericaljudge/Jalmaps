# Phase 12: Realtime Updates

This phase introduces real-time WebSocket updates for well sensor data, ensuring the farmer dashboard and history chart reflect the latest readings instantly without page reloads.

## Features Implemented

- **Database Trigger & Broadcast**: A PostgreSQL trigger intercepts new readings and broadcasts a compact payload via `realtime.send()` to a private channel per well.
- **Strict Authorization**: Implemented Row Level Security (RLS) on `realtime.messages` to ensure farmers can only subscribe to channels for wells they own or manage.
- **Client Realtime Manager**: A robust singleton that manages Supabase Realtime subscriptions, enforces exponential backoff on disconnects, and deduplicates channels.
- **Resilient UI Hooks**:
  - `useWellRealtime`: Subscribes to well channels, buffers bursts of data, and seamlessly merges new readings into the TanStack Query caches (both latest reading and historical series) with a 1-second throttle.
  - `useAlerts`: A generic handler for system alerts and notifications.
- **UI Indicators**:
  - `LiveBadge`: A dynamic badge indicating connection state (`live`, `connecting`, `reconnecting`, `offline`).
  - `StaleBanner`: Detects when a node stops reporting and displays a warning to the user.
  - `ValueHighlight`: A subtle visual highlight animation that flashes when a new reading arrives.

## Documentation

- Architecture Decision Record: [ADR 0004: Realtime Updates Architecture](../adr/0004-realtime.md)

## Next Steps

In the future phases, we will introduce real-time Alert Generation (Phase 13) which will integrate with the `useAlerts` hook built in this phase.
