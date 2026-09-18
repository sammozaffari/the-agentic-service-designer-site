#!/usr/bin/env python3
"""Propagate the scale figures in data-scale.json across every page that cites them.

Sam owns the numbers. Change a value in data-scale.json, run this, and every page
that quotes it is rewritten. Nothing else on the site should hard-code a headcount,
a restaurant count or a survey response count.

Placeholders inside the HTML look like: <span data-scale="network_people">tens of
thousands of team members</span>. The script replaces the text inside the span with
the current value, leaving the markup alone.

Usage: apply_scale.py [--check]
"""
import json, pathlib, re, sys, glob

ROOT = pathlib.Path(__file__).resolve().parent.parent
scale = json.load(open(ROOT / "data-scale.json"))
check = "--check" in sys.argv

missing, changed, cited = set(), 0, {}
for f in sorted(glob.glob(str(ROOT / "*.html")) + glob.glob(str(ROOT / "articles/*/index.html"))
                + glob.glob(str(ROOT / "writing/*/index.html"))):
    p = pathlib.Path(f)
    s = p.read_text()
    out = s

    def sub(m):
        global missing
        key, inner = m.group(1), m.group(2)
        val = scale.get(key)
        if val is None or not isinstance(val, str):
            missing.add(key)
            return m.group(0)
        cited.setdefault(key, []).append(p.name)
        return f'<span data-scale="{key}">{val}</span>'

    out = re.sub(r'<span data-scale="([a-z_]+)">(.*?)</span>', sub, out, flags=re.S)
    if out != s:
        changed += 1
        if not check:
            p.write_text(out)

todo = scale.get("_sam_to_confirm", {})
print(f"{'would update' if check else 'updated'} {changed} page(s)")
for k, where in sorted(cited.items()):
    print(f"  {k}: {scale[k]!r} on {len(where)} page(s)")
if missing:
    print("MISSING KEYS in data-scale.json:", ", ".join(sorted(missing)))
if todo:
    print("\nWaiting on Sam:")
    for k, why in todo.items():
        print(f"  - {k}: {why}")
sys.exit(1 if missing else 0)
