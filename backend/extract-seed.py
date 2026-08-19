import re
import json
import sys

# Read data.js
with open('../reading-demo/src/data.js', 'r', encoding='utf-8') as f:
    content = f.read()

# Find the PAPERS array
match = re.search(r'export const PAPERS\s*=\s*(\[)', content)
if not match:
    print("ERROR: Could not find PAPERS array", file=sys.stderr)
    sys.exit(1)

start = match.start(1)
# Track braces to find matching ]
depth = 0
end = start
for i in range(start, len(content)):
    if content[i] == '[':
        depth += 1
    elif content[i] == ']':
        depth -= 1
        if depth == 0:
            end = i + 1
            break

js_array = content[start:end]

# Convert JS-like to JSON-compatible
# Remove trailing commas before ] or }
js_array = re.sub(r',(\s*[}\]])', r'\1', js_array)
# Remove block comments
js_array = re.sub(r'//.*?\n', '\n', js_array)
# Remove multi-line comments
js_array = re.sub(r'/\*.*?\*/', '', js_array, flags=re.DOTALL)
# Quote property names: word: → "word":
js_array = re.sub(r'([\s\[{,])([a-zA-Z_]\w*)\s*:', r'\1"\2":', js_array)
# Convert single-quoted strings to double-quoted (careful with apostrophes)
js_array = re.sub(r"'((?:[^'\\]|\\.)*)'", r'"\1"', js_array)

try:
    data = json.loads(js_array)
except json.JSONDecodeError as e:
    print(f"Parse failed at pos {e.pos}: ...{js_array[max(0,e.pos-30):e.pos+30]}...", file=sys.stderr)
    sys.exit(1)

with open('../backend/prisma/seed-data.json', 'w', encoding='utf-8') as f:
    json.dump(data, f, ensure_ascii=False, indent=2)

print(f"Extracted {len(data)} papers")
for p in data:
    print(f"  {p['id']}: {p['name']} ({len(p.get('passages',[]))} passages)")
    for ps in p.get('passages', []):
        print(f"    {ps['id']}: {ps['title']} ({len(ps.get('questions',[]))} questions)")
