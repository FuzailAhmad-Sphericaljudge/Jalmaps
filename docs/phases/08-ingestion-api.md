# Phase 8: Ingestion API

This document details the decisions and implementation for Phase 8, the telemetry ingestion API.

## API Contract

See `docs/firmware-contract.md` for full details. The API is a stateless POST endpoint `/api/v1/ingest` requiring an HTTP Authorization header and a JSON array of readings.

## Security Decisions

1. **API Keys**: Stored only as SHA-256 hashes. Node prefix acts as the ID (`jm_live_ABCD`), the hash allows constant-time verification.
2. **Pepper**: The server uses an environment variable pepper combined with the hash so rainbow table attacks on the database dump are ineffective.
3. **No CORS**: The API explicitly forbids browser access.
4. **Idempotency**: Implemented at the database level on `(node_id, recorded_at)`.
5. **Rate Limiting**: A fixed window limiter inside Postgres.

## Rate Limiting ADR

**Context**: We need to protect the ingestion API against abuse or malfunctioning nodes spamming it, but we do not want to introduce Redis in this phase.
**Decision**: We use a `node_rate_limits` table with an upsert function `check_node_rate_limit(node_id, max_reqs)`.
**Trade-offs**: Adds minor write load per request to Postgres, but avoids a new infrastructure dependency. If scale demands it, we will migrate this to Redis.

## Test Results

- **Load test**: 50 virtual nodes executing the K6 script `scripts/load/ingest.js`.
- **Latency**: Under 500 ms p95 (local machine).
