# ADR 0004: Realtime Updates Architecture

## Status

Accepted

## Context

We need to provide real-time updates for well readings (depth, battery, quality) on the farmer dashboard and history chart.
The requirements are:

- Farmers should see updates without a page refresh when new sensor data arrives.
- Data must be authorized; a farmer should only receive real-time data for wells they have permission to view.
- The system must degrade gracefully (fallback to polling or offline state) if WebSocket connection fails.
- The system must handle high-throughput edge cases efficiently without spamming clients.

## Decision

We chose to use **private broadcast channels per well (`well:<id>`)** fed by a PostgreSQL database trigger (`realtime.send()`), with Row Level Security (RLS) applied on the `realtime.messages` table.

1. **Trigger over `postgres_changes`**:
   We considered streaming changes directly from the `readings` table via Supabase's `postgres_changes`. However, a trigger allows us to shape the payload, batch the notification (using `FOR EACH STATEMENT`), and enforce that exactly one message per well is broadcast per transaction, regardless of how many raw readings were ingested in that transaction.

2. **Authorization**:
   By using Supabase Realtime Authorization, clients subscribe to private channels. When the client subscribes, Supabase validates the user's JWT against the RLS policies defined on `realtime.messages`. We added an RLS policy that ensures a user can only subscribe to `topic = 'well:<id>'` if they have read access to the corresponding well.

3. **Client-side Management**:
   We built a `RealtimeManager` singleton on the client to manage subscriptions and prevent duplicate channel creations. It implements an exponential backoff state machine (`connecting`, `live`, `reconnecting`, `offline`) and throttles UI updates to maximum 1 render per second, accumulating bursts into a buffer before flushing to TanStack Query caches.

## Consequences

- **Positive**: High scalability. The server does the heavy lifting of deduplication per transaction.
- **Positive**: Strict authorization via RLS.
- **Positive**: Smooth UI experience with resilient reconnection logic.
- **Negative**: Requires local Supabase version to support `realtime.send` and Realtime Authorization.
- **Negative**: The singleton manager and query cache manipulation adds some client-side complexity.

## Fallback

If the real-time connection is unavailable or unsupported on the user's device, we plan to implement a fallback polling mechanism (every 30-60 seconds) in the future (Phase 18). Currently, it gracefully degrades to "offline" and relies on the user to refresh, or the `visibilitychange` listener to refetch when the tab becomes active again.
