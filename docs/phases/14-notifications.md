# Phase 14: Notifications

## Architecture
- Transactional Outbox pattern (`notification_outbox`).
- Pure function `planNotifications()` routes alerts to the outbox.
- Worker claims rows `FOR UPDATE SKIP LOCKED` to send messages.
- Provider abstractions behind feature flags, defaulting to a `MockProvider`.

## Checklist
- [ ] 1. Outbox Migration and Types
- [ ] 2. Provider Abstractions (Mock, Push, Telegram, SMS, Email)
- [ ] 3. Channel Linking & Consent
- [ ] 4. Preferences UI
- [ ] 5. i18n Templates & SMS Length Helper
- [ ] 6. Routing Planner Function
- [ ] 7. Worker & Cron Route
- [ ] 8. Delivery History UI & Webhooks
- [ ] 9. Safety Limits (Caps, Circuit Breaker)
- [ ] 10. Tests (Unit, Integration, E2E)
- [ ] 11. Documentation & ADR
