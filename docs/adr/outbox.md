# ADR: Transactional Outbox for Notifications

## Status

Accepted

## Context

Alerts change states and need to notify users. If we send HTTP requests to notification providers directly during the alert evaluation transaction, a provider timeout could fail the transaction. If we send them after the transaction, a crash could result in the alert being saved but the notification lost.

## Decision

We will use the **Transactional Outbox** pattern. The alert evaluation will insert rows into `notification_outbox` in the same Postgres transaction. A separate background worker will claim rows (`FOR UPDATE SKIP LOCKED`) and handle the unreliable network calls to providers.

## Consequences

- **Pros**: Guaranteed at-least-once delivery; no network blocking during alert evaluation.
- **Cons**: Requires a background worker/cron to process the outbox; slight delay in delivery.
