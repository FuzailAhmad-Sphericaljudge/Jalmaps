# Notifications Architecture

## Transactional Outbox
To guarantee that notifications are sent reliably when an alert changes state, we use the transactional outbox pattern. Alerts insert rows into `notification_outbox` in the same database transaction. A separate worker picks up pending rows.

## Providers
- **Mock**: Used in development and testing. Does not send real messages.
- **Web Push**: Browser notifications using VAPID.
- **Telegram**: Chatbot integration.
- **SMS/WhatsApp**: Sent via an aggregator. Note: SMS in India requires DLT registration for sender IDs and templates. WhatsApp requires Meta approved templates. 
- **Email**: For village admins/officials.

## Testing Channels in Sandbox
Run the local simulator. In sandbox mode, the `MockProvider` intercepts all calls and writes them to the DB log or console.

## Incident Runbook
- **Provider Down**: The circuit breaker will pause sending to that provider. Messages remain in outbox.
- **Runaway Sending**: The global kill-switch env variable `NEXT_PUBLIC_NOTIFICATIONS_ENABLED=false` can be set to drop the worker queue immediately.
