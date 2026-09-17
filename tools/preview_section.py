#!/usr/bin/env python3
"""Extract one <section id="..."> from a built page and write it as a standalone
file, so a tall page can be checked section by section.
Usage: preview_section.py page.html section-id out.html"""
import re, sys, pathlib
src = pathlib.Path(sys.argv[1]); sec_id = sys.argv[2]; out = pathlib.Path(sys.argv[3])
s = src.read_text()
head = s[s.index('<head>') + 6: s.index('</head>')]
# rewrite relative asset paths so the preview can live in the same folder
depth_fix = lambda t: t
m = re.search(r'<section class="[^"]*" id="%s">.*?</section>' % re.escape(sec_id), s, re.S)
if not m:
    raise SystemExit('section not found: ' + sec_id)
wrap_open, wrap_close = ('<main class="art art-article"><div class="art-layout art-layout--body"><aside class="art-rail"></aside><article class="art-body">', '</article></div></main>') if 'art-sec' in m.group(0)[:60] else ('<main class="sc">', '</main>')
out.write_text(f'<!doctype html><html lang="en-AU"><head>{head}</head><body>{wrap_open}{m.group(0)}{wrap_close}</body></html>')
print('wrote', out, len(m.group(0)), 'bytes')
