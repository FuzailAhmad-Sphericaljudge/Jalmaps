import sys

with open('src/server/ingest/service.ts', 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace('req.readings[res.index]?.age_s!', '(req.readings[res.index]?.age_s ?? 0)')

with open('src/server/ingest/service.ts', 'w', encoding='utf-8') as f:
    f.write(content)

