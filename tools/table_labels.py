#!/usr/bin/env python3
"""Stamp data-label on every td of a .plain or .blueprint table, taken from the
header row, so the table can stack as cards on a phone instead of scrolling sideways.
Also marks blueprint tables .tbl-bleed so they use the full artefact width.
Usage: table_labels.py articles/*/index.html"""
import re, sys, html

def process(src):
    out = src
    for m in list(re.finditer(r'<table class="(blueprint|plain)"[^>]*>(.*?)</table>', src, re.S)):
        kind, body = m.group(1), m.group(2)
        heads = [html.unescape(re.sub(r'<[^>]+>', '', h)).strip() for h in re.findall(r'<th[^>]*>(.*?)</th>', body, re.S)]
        if not heads:
            continue
        rows = re.findall(r'<tr[^>]*>.*?</tr>', body, re.S)
        new_body = body
        for row in rows:
            if '<th' in row:
                continue
            cells = re.findall(r'<td(?![^>]*data-label)([^>]*)>', row)
            new_row, i = row, 0
            for c in cells:
                if i >= len(heads):
                    break
                lbl = heads[i].replace('"', "'")
                new_row = new_row.replace(f'<td{c}>', f'<td{c} data-label="{lbl}">', 1)
                i += 1
            new_body = new_body.replace(row, new_row, 1)
        old = m.group(0)
        new = f'<table class="{kind}{" tbl-bleed" if kind == "blueprint" else ""}">{new_body}</table>'
        out = out.replace(old, new, 1)
    return out

for f in sys.argv[1:]:
    s = open(f).read()
    n = process(s)
    if n != s:
        open(f, 'w').write(n); print('labelled', f)
