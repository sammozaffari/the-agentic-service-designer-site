#!/usr/bin/env python3
"""Recover a blueprint poster JSON spec from an SVG rendered by blueprint_poster.py.
Usage: poster_spec_from_svg.py in.svg out.json"""
import re, sys, json, html
s = open(sys.argv[1]).read()
texts = [(float(m.group(1)), float(m.group(2)), m.group(3), html.unescape(m.group(4))) for m in re.finditer(r'<text x="([\d.]+)" y="([\d.]+)"([^>]*)>(.*?)</text>', s)]
rects = [(float(m.group(1)), float(m.group(2)), float(m.group(3)), float(m.group(4))) for m in re.finditer(r'<rect x="([\d.]+)" y="([\d.]+)" width="([\d.]+)" height="([\d.]+)"', s)]
def fs(a): return float(re.search(r'font-size="([\d.]+)"', a).group(1))
def bold(a): return 'font-weight="7' in a or 'font-weight="6' in a
title = next(t for x,y,a,t in texts if fs(a)==24)
subtitle = " ".join(t for x,y,a,t in texts if fs(a)==13 and x==20 and '#6e6e69' in a)
stages = [t for x,y,a,t in texts if fs(a)==14 and bold(a) and x>100]
footer = " ".join(t for x,y,a,t in texts if fs(a)==11 and x==20 and '#6e6e69' in a)
hdr_y = min(y for x,y,w,h in rects if x==20 and h==40)
lane_rows = sorted({(y,h) for x,y,w,h in rects if x==20 and y>hdr_y})
label_w = next(w for x,y,w,h in rects if x==20 and h==40)
col_w = next(w for x,y,w,h in rects if x>20 and h==40)
def join(lines):
    out = ""
    for ln in lines:
        if out and out.endswith("-") and ln[:1].islower(): out += ln
        else: out = (out + " " + ln).strip()
    return out
lanes = []
for li,(y,h) in enumerate(lane_rows):
    name = join([t for x,yy,a,t in texts if fs(a)==13 and bold(a) and x==30 and y<yy<y+h])
    cells = []
    for si in range(len(stages)):
        x0 = 20 + label_w + si*col_w + 10
        lab = join([t for x,yy,a,t in texts if abs(x-x0)<0.5 and y<yy<y+h and fs(a)==12.5])
        note = join([t for x,yy,a,t in texts if abs(x-x0)<0.5 and y<yy<y+h and fs(a)==11.5])
        cells.append(lab + (" || " + note if note else ""))
    lanes.append({"name": name, "cells": cells})
lines = {}
for m in re.finditer(r'<line x1="20" y1="([\d.]+)"[^>]*stroke-dasharray', s):
    y = float(m.group(1)); lbl = next((t for x,yy,a,t in texts if abs(yy-(y-4))<0.5 and 'text-anchor="end"' in a), "")
    key = "visibility" if "visibility" in lbl else "internal"
    lines[key] = next(i for i,(ly,lh) in enumerate(lane_rows) if abs(ly-y)<0.5)
spec = {"title": title, "subtitle": subtitle, "stages": stages, "lanes": lanes, "lines": lines, "footer": footer}
json.dump(spec, open(sys.argv[2], "w"), indent=1, ensure_ascii=False)
print(sys.argv[2], len(stages), "stages", len(lanes), "lanes", [len(l["cells"]) for l in lanes], lines)
