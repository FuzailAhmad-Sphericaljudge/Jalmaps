# JalMaps Firmware Contract

This document outlines the contract between the ESP32 firmware running on the JalMaps sensor nodes and the JalMaps Server Ingestion API.

## API Endpoint

- **Base URL:** `/api/v1`
- **Authentication:** Bearer token (`Authorization: Bearer <node_api_key>`)

### Node API Keys

- Format: `jm_live_<prefix>_<secret>`
- Keys are issued securely. The server only stores a hashed representation.
- Do not expose these keys in client-side applications. They belong strictly to the firmware.

## Endpoints

### 1. Ingest Data

`POST /api/v1/ingest`

Uploads bulk sensor readings. This endpoint is idempotent. If a request is retried, duplicate readings (matching `hardware_id` and timestamp) are ignored safely.

**Request Body**

```json
{
  "hardware_id": "JM-ESP32-0001",
  "firmware": "2.0.0",
  "sent_at": "2026-10-07T12:00:00Z",
  "readings": [
    {
      "current_ma": 12.34,
      "battery_v": 3.92,
      "rssi": -71,
      "age_s": 120,
      "seq": 1021
    }
  ]
}
```

_Notes on Timestamps:_
A reading must contain either `recorded_at` (an ISO 8601 string) if the node has an RTC/synced clock, or `age_s` (seconds since the reading was taken) if the node lacks a reliable clock. The server infers the timestamp by subtracting `age_s` from the server arrival time.

_Plausibility Checks:_

- `current_ma` must be between -1 and 30.
- `battery_v` must be between 2.5 and 5.5.
- `rssi` must be between -130 and 0.
- Calculated timestamps cannot be more than 5 minutes in the future or older than 30 days.

**Response**

```json
{
  "server_time": "2026-10-07T12:02:00.000Z",
  "next_interval_s": 900,
  "accepted": 1,
  "duplicates": 0,
  "rejected": 0,
  "results": [
    {
      "index": 0,
      "status": "accepted"
    }
  ]
}
```

Use `server_time` to correct the node's internal clock (if supported). Use `next_interval_s` to set the sleep/reporting cycle.

### 2. Connectivity Check (Ping)

`GET /api/v1/ingest/ping`

Validates the node's API key and returns the current server time. Useful for verifying connectivity before uploading bulk payloads or establishing an RTC baseline.

## Data Processing

The firmware remains "dumb"—it transmits the raw 4-20mA readings along with device health data. The backend server manages all calibration logic and translation to depth (in meters).

- **Good:** Current between 3.8 and 20.5 mA.
- **Fault/Anomaly:** Values above 20.5 mA or below 3.8 mA (except near 0 mA which indicates "sensor offline").
