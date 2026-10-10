# Wells and Nodes Management

## Workflows

1. **Farmer registers a well**: Uses the multi-step wizard to capture name, type, depth (in local units, stored in metres), GPS coordinates, and photos.
2. **Farmer attaches a node**: Scans the node's QR code (format `JM:<hardware_id>`) or enters it manually. The system provisions the API key.
3. **Village Admin bulk imports**: Admins can upload a CSV to register multiple wells efficiently.

## Node QR Format

The QR code on the sensor nodes encodes the hardware ID in the format:
`JM:<hardware_id>` (e.g. `JM:JM-ESP32-0001`).

## Key Provisioning

API keys are strictly provisioned once upon node registration.

- The raw key is shown only once to the farmer to save or download.
- Only a hashed version of the key is stored in the database.
- Key rotation revokes the old key and generates a new one.

## CSV Format for Bulk Import

Admins can upload a CSV file with the following headers:
`name,well_type,latitude,longitude,total_depth_m,notes,owner_phone`

Validation ensures required fields are present and formats are correct before saving to the database.
