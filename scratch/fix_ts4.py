import sys

with open('src/server/ingest/service.ts', 'r', encoding='utf-8') as f:
    lines = f.readlines()

for i in range(len(lines)):
    if 'Object is possibly undefined' in lines[i] or 'req.readings[res.index]' in lines[i]:
        pass

# Let's just find `req.readings[res.index].recorded_at` or something.
# Wait, I did replace it, but maybe I missed one?
content = "".join(lines)
content = content.replace('req.readings[res.index].recorded_at', 'req.readings[res.index]?.recorded_at')
content = content.replace('req.readings[res.index].age_s', 'req.readings[res.index]?.age_s')
content = content.replace('req.readings[i - 1].recorded_at', 'req.readings[i - 1]?.recorded_at')
content = content.replace('previousR.recorded_at', 'previousR?.recorded_at')

with open('src/server/ingest/service.ts', 'w', encoding='utf-8') as f:
    f.write(content)

