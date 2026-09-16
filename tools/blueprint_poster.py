#!/usr/bin/env python3
"""Render a service blueprint poster as SVG from a JSON spec.

Spec: {"title": str, "subtitle": str, "stages": [str], "lanes": [{"name": str, "cells": [str]}],
       "fails": [{"id": "F-01", "stage": 0, "text": str}], "lines": {"visibility": lane_index, "internal": lane_index}}
Each cell string may contain " || " to separate a short label from a one-line note.
Usage: blueprint_poster.py spec.json out.svg
"""
import json, sys, textwrap

INK = "#111110"; SOFT = "#4a4a46"; MUTED = "#6e6e69"; LINE = "#bdbdb7"; TINT = "#f4f3ee"; FAIL = "#b3261e"
LANE_BG = ["#ffffff", "#fbfaf6", "#f4f3ee", "#eeede7"]; FAIL_BG = "#fdf3f2"

def esc(s): return s.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")

def wrap(s, width): return textwrap.wrap(s, width) or [""]

def render(spec):
    stages = spec["stages"]; lanes = spec["lanes"]; fails = spec.get("fails", [])
    W = 1600; label_w = 170; col_w = (W - label_w - 40) / len(stages); pad = 10
    y = 20
    out = []
    out.append(f'<text x="20" y="{y+26}" font-family="Inter, Helvetica, Arial, sans-serif" font-size="24" font-weight="700" fill="{INK}">{esc(spec["title"])}</text>')
    y += 40
    for i, ln in enumerate(wrap(spec.get("subtitle", ""), 150)):
        out.append(f'<text x="20" y="{y+14}" font-family="Inter, Helvetica, Arial, sans-serif" font-size="13" fill="{MUTED}">{esc(ln)}</text>'); y += 18
    y += 14
    # stage header
    hh = 40
    for si, st in enumerate(stages):
        x = 20 + label_w + si * col_w
        out.append(f'<rect x="{x}" y="{y}" width="{col_w}" height="{hh}" fill="{TINT}" stroke="{LINE}"/>')
        out.append(f'<text x="{x+pad}" y="{y+25}" font-family="Inter, Helvetica, Arial, sans-serif" font-size="14" font-weight="700" fill="{INK}">{esc(st)}</text>')
    out.append(f'<rect x="20" y="{y}" width="{label_w}" height="{hh}" fill="{TINT}" stroke="{LINE}"/>')
    out.append(f'<text x="30" y="{y+25}" font-family="Inter, Helvetica, Arial, sans-serif" font-size="12" fill="{MUTED}">Stage</text>')
    y += hh
    lines = spec.get("lines", {})
    chars = int(col_w / 7.0)
    for li, lane in enumerate(lanes):
        # compute row height
        cells = []
        for c in lane["cells"]:
            label, _, note = c.partition(" || ")
            ls = wrap(label.strip(), chars); ns = wrap(note.strip(), chars + 4) if note.strip() else []
            cells.append((ls, ns))
        rh = max(18 + len(ls) * 17 + (len(ns) * 15 + 6 if ns else 0) + 12 for ls, ns in cells)
        rh = max(rh, 64)
        for key, lbl in (("visibility", "Line of visibility"), ("internal", "Line of internal interaction")):
            if lines.get(key) == li:
                out.append(f'<line x1="20" y1="{y}" x2="{W-20}" y2="{y}" stroke="{INK}" stroke-width="1.5" stroke-dasharray="6 4"/>')
                out.append(f'<text x="{W-24}" y="{y-4}" text-anchor="end" font-family="Inter, Helvetica, Arial, sans-serif" font-size="11" fill="{SOFT}">{lbl}</text>')
        is_fail = lane["name"].lower().startswith("fail")
        bg = FAIL_BG if is_fail else LANE_BG[li % len(LANE_BG)]
        out.append(f'<rect x="20" y="{y}" width="{label_w}" height="{rh}" fill="{bg}" stroke="{LINE}"/>')
        for k, ln in enumerate(wrap(lane["name"], 20)):
            out.append(f'<text x="30" y="{y+22+k*16}" font-family="Inter, Helvetica, Arial, sans-serif" font-size="13" font-weight="700" fill="{FAIL if is_fail else INK}">{esc(ln)}</text>')
        for si, (ls, ns) in enumerate(cells):
            x = 20 + label_w + si * col_w
            out.append(f'<rect x="{x}" y="{y}" width="{col_w}" height="{rh}" fill="{bg}" stroke="{LINE}"/>')
            yy = y + 20
            for ln in ls:
                out.append(f'<text x="{x+pad}" y="{yy}" font-family="Inter, Helvetica, Arial, sans-serif" font-size="12.5" font-weight="600" fill="{FAIL if is_fail else INK}">{esc(ln)}</text>'); yy += 17
            for ln in ns:
                out.append(f'<text x="{x+pad}" y="{yy}" font-family="Inter, Helvetica, Arial, sans-serif" font-size="11.5" fill="{SOFT}">{esc(ln)}</text>'); yy += 15
        y += rh
    H = y + 30
    out.append(f'<text x="20" y="{H-10}" font-family="Inter, Helvetica, Arial, sans-serif" font-size="11" fill="{MUTED}">{esc(spec.get("footer", ""))}</text>')
    return f'<svg xmlns="http://www.w3.org/2000/svg" width="{W}" height="{H}" viewBox="0 0 {W} {H}" role="img" aria-label="{esc(spec["title"])}"><rect width="{W}" height="{H}" fill="#fff"/>' + "".join(out) + "</svg>"

if __name__ == "__main__":
    spec = json.load(open(sys.argv[1]))
    open(sys.argv[2], "w").write(render(spec))
    print("wrote", sys.argv[2])
