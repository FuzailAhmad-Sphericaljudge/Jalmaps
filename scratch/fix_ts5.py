import sys

with open('src/server/ingest/service.ts', 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace('new Date(readingsToInsert[latestAcceptedIndex].recorded_at).getTime()', 'new Date(readingsToInsert[latestAcceptedIndex]?.recorded_at ?? "").getTime()')

with open('src/server/ingest/service.ts', 'w', encoding='utf-8') as f:
    f.write(content)

