import sys

with open('src/server/ingest/service.ts', 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace('import type { Database } from "@/lib/db/types";', 'import type { Database, Json } from "@/lib/db/types";')

content = content.replace('_clientIp: string,', '/* eslint-disable-next-line @typescript-eslint/no-unused-vars */\n  _clientIp: string,')

content = content.replace('req.readings[res.index].recorded_at', 'req.readings[res.index]?.recorded_at')
content = content.replace('req.readings[res.index].age_s', 'req.readings[res.index]?.age_s')
content = content.replace('req.readings[res.index]!', 'req.readings[res.index]')

content = content.replace('const latest = readingsToInsert[latestAcceptedIndex];\n      await db', 'const latest = readingsToInsert[latestAcceptedIndex];\n      if (!latest) return;\n      await db')

content = content.replace('raw: r as unknown as Record<string, unknown>', 'raw: r as unknown as Json')
content = content.replace('payload: jsonPayload as unknown as Record<string, unknown>', 'payload: jsonPayload as unknown as Json')

content = content.replace('export async function onReadingsIngested(', '/* eslint-disable @typescript-eslint/no-unused-vars */\nexport async function onReadingsIngested(')

with open('src/server/ingest/service.ts', 'w', encoding='utf-8') as f:
    f.write(content)

