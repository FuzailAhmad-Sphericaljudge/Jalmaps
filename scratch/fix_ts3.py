import sys

with open('src/server/ingest/service.ts', 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace('raw: r as unknown as Json', 'raw: r as unknown as NonNullable<Json>')
content = content.replace('payload: jsonPayload as unknown as Json', 'payload: jsonPayload as unknown as NonNullable<Json>')

content = content.replace('req.readings[res.index].recorded_at', 'req.readings[res.index]?.recorded_at')
content = content.replace('req.readings[res.index].age_s', 'req.readings[res.index]?.age_s')

content = content.replace('const latest = readingsToInsert[latestAcceptedIndex];\n      if (!latest) return;\n      await db', 'const latest = readingsToInsert[latestAcceptedIndex];\n      if (latest) {\n        await db.from("nodes").update({\n          last_seen_at: latest.recorded_at,\n          battery_v: latest.battery_v,\n          signal_rssi: latest.rssi,\n          firmware_version: req.firmware,\n        }).eq("id", nodeId);\n        await onReadingsIngested(db, nodeId, latest.recorded_at);\n      }')

# Clean up duplicate await db that might be left by the replace
content = content.replace('''      if (latest) {
        await db.from("nodes").update({
          last_seen_at: latest.recorded_at,
          battery_v: latest.battery_v,
          signal_rssi: latest.rssi,
          firmware_version: req.firmware,
        }).eq("id", nodeId);
        await onReadingsIngested(db, nodeId, latest.recorded_at);
      }
        .from("nodes")
        .update({
          last_seen_at: latest.recorded_at,
          battery_v: latest.battery_v,
          signal_rssi: latest.rssi,
          firmware_version: req.firmware,
        })
        .eq("id", nodeId);

      // Extension point
      await onReadingsIngested(db, nodeId, latest.recorded_at);''', '''      if (latest) {
        await db.from("nodes").update({
          last_seen_at: latest.recorded_at,
          battery_v: latest.battery_v,
          signal_rssi: latest.rssi,
          firmware_version: req.firmware,
        }).eq("id", nodeId);
        await onReadingsIngested(db, nodeId, latest.recorded_at);
      }''')

with open('src/server/ingest/service.ts', 'w', encoding='utf-8') as f:
    f.write(content)

