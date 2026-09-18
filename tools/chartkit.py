#!/usr/bin/env python3
"""Render a data visualisation as SVG from a JSON spec, on the site's palette.

Every chart is labelled, has a stated source line, and carries a one-sentence
reading under it, because a chart in a case study has to say what it means.

Spec:
{
  "type": "bars" | "grouped" | "stacked" | "line" | "ranked" | "dumbbell" | "matrix" | "smallmult",
  "title": str, "subtitle": str, "note": str, "source": str,
  "width": int (default 960),
  "categories": [str],                       # x axis (or rows, for ranked/dumbbell/matrix)
  "series": [{"name": str, "values": [num], "colour": "key or #hex"}],
  "yLabel": str, "unit": str, "max": num,    # optional
  "highlight": int | [int],                  # index/indices to emphasise
  "panels": [{"name": str, "values": [num], "note": str}]   # smallmult only
}
Usage: chartkit.py spec.json out.svg
"""
import json, sys, textwrap

# Site palette. Warm paper, ink, and a five-step data ramp that reads at small sizes.
INK = "#111110"; SOFT = "#3f3f3b"; MUTED = "#6e6e69"; LINE = "#d8d7d1"; GRID = "#e8e7e1"
PAPER = "#ffffff"; TINT = "#f6f5f0"
PAL = {
    "ink":    "#23231f",
    "clay":   "#9b3427",
    "ochre":  "#a8781c",
    "slate":  "#3f5a7a",
    "sage":   "#4a6b4f",
    "stone":  "#8a8a83",
    "quiet":  "#cfcec7",
}
ORDER = ["ink", "clay", "ochre", "slate", "sage", "stone"]
FONT = "Inter, Helvetica, Arial, sans-serif"
MONO = "IBM Plex Mono, Menlo, monospace"

esc = lambda s: str(s).replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")


def colour(key, i=0):
    if not key:
        key = ORDER[i % len(ORDER)]
    return PAL.get(key, key)


def wrap(s, w):
    return textwrap.wrap(str(s), w) or [""]


def nice_max(v, given=None):
    if given:
        return given
    if v <= 0:
        return 1
    for step in (1, 2, 2.5, 5, 10, 20, 25, 50, 100, 200, 250, 500, 1000, 2000, 2500, 5000):
        for mult in (1, 10, 100, 1000):
            top = step * mult
            if top >= v:
                return top
    return v


def txt(x, y, s, size=11, fill=MUTED, weight=None, anchor=None, font=FONT):
    a = f' text-anchor="{anchor}"' if anchor else ""
    w = f' font-weight="{weight}"' if weight else ""
    return f'<text x="{x:.1f}" y="{y:.1f}" font-family="{font}" font-size="{size}"{w} fill="{fill}"{a}>{esc(s)}</text>'


def header(spec, W, M):
    o, y = [], M
    o.append(txt(M, y + 18, spec["title"], 19, INK, 700)); y += 28
    for ln in wrap(spec.get("subtitle", ""), int(W / 7.2)):
        if ln:
            o.append(txt(M, y + 12, ln, 12.5, MUTED)); y += 18
    return o, y + 10


def footer(spec, W, M, y):
    o = []
    if spec.get("note"):
        y += 6
        for ln in wrap(spec["note"], int(W / 6.6)):
            o.append(txt(M, y + 12, ln, 12, SOFT)); y += 17
    if spec.get("source"):
        y += 4
        for ln in wrap(spec["source"], int(W / 5.6)):
            o.append(txt(M, y + 10, ln, 10.5, MUTED, font=MONO)); y += 15
    return o, y + M


def legend(series, x, y, W):
    o, cx = [], x
    for i, s in enumerate(series):
        c = colour(s.get("colour"), i)
        o.append(f'<rect x="{cx}" y="{y - 8}" width="10" height="10" rx="2" fill="{c}"/>')
        o.append(txt(cx + 16, y + 1, s["name"], 11.5, SOFT))
        cx += 16 + len(s["name"]) * 6.4 + 22
    return o, y + 16


def axes(o, x0, x1, ytop, ybot, top, unit, ylabel, ticks=4):
    for i in range(ticks + 1):
        v = top * i / ticks
        yy = ybot - (ybot - ytop) * i / ticks
        o.append(f'<line x1="{x0}" y1="{yy:.1f}" x2="{x1}" y2="{yy:.1f}" stroke="{GRID if i else LINE}" stroke-width="1"/>')
        lab = f"{v:g}{unit or ''}"
        o.append(txt(x0 - 8, yy + 4, lab, 10.5, MUTED, anchor="end", font=MONO))
    if ylabel:
        o.append(txt(x0 - 8, ytop - 12, ylabel, 10.5, MUTED, font=MONO))


def render(spec):
    W = spec.get("width", 960); M = 28
    kind = spec["type"]
    o, y = header(spec, W, M)
    cats = spec.get("categories", [])
    series = spec.get("series", [])

    if kind in ("bars", "grouped", "stacked", "line"):
        gx = M + 46; gw = W - gx - M
        gh = spec.get("height", 260); gy = y
        gb = gy + gh
        if kind == "stacked":
            peak = max(sum(s["values"][i] for s in series) for i in range(len(cats)))
        else:
            peak = max(max(s["values"]) for s in series)
        top = nice_max(peak, spec.get("max"))
        axes(o, gx, gx + gw, gy, gb, top, spec.get("unit"), spec.get("yLabel"))
        step = gw / max(1, len(cats))
        hl = spec.get("highlight")
        hl = [hl] if isinstance(hl, int) else (hl or [])

        if kind == "line":
            for i, s in enumerate(series):
                c = colour(s.get("colour"), i)
                pts = [(gx + step * (j + .5), gb - (v / top) * gh) for j, v in enumerate(s["values"])]
                d = " ".join(f"{'M' if j == 0 else 'L'}{px:.1f},{py:.1f}" for j, (px, py) in enumerate(pts))
                o.append(f'<path d="{d}" fill="none" stroke="{c}" stroke-width="2.2" stroke-linejoin="round" stroke-linecap="round"/>')
                for px, py in pts:
                    o.append(f'<circle cx="{px:.1f}" cy="{py:.1f}" r="3" fill="{PAPER}" stroke="{c}" stroke-width="2"/>')
        elif kind == "stacked":
            for j in range(len(cats)):
                acc = 0
                bw = min(46, step * .62)
                bx = gx + step * (j + .5) - bw / 2
                for i, s in enumerate(series):
                    v = s["values"][j]; h = (v / top) * gh
                    o.append(f'<rect x="{bx:.1f}" y="{gb - acc - h:.1f}" width="{bw:.1f}" height="{h:.1f}" fill="{colour(s.get("colour"), i)}"/>')
                    acc += h
        else:
            n = len(series); bw = min(30, (step * .66) / n)
            for j in range(len(cats)):
                for i, s in enumerate(series):
                    v = s["values"][j]; h = (v / top) * gh
                    bx = gx + step * (j + .5) - (bw * n) / 2 + bw * i
                    c = colour(s.get("colour"), i)
                    if hl and j not in hl:
                        c = PAL["quiet"] if n == 1 else c
                    o.append(f'<rect x="{bx:.1f}" y="{gb - h:.1f}" width="{bw - 2:.1f}" height="{h:.1f}" fill="{c}"/>')
                    if n == 1:
                        o.append(txt(bx + (bw - 2) / 2, gb - h - 6, f"{v:g}", 11, INK if (not hl or j in hl) else MUTED, 600, "middle", MONO))
        for j, c in enumerate(cats):
            lines = wrap(c, max(6, int(step / 6.4)))
            for k, ln in enumerate(lines[:2]):
                o.append(txt(gx + step * (j + .5), gb + 18 + k * 13, ln, 11, MUTED, anchor="middle"))
        y = gb + 18 + 26
        if len(series) > 1:
            ls, y = legend(series, gx, y + 6, W); o += ls

    elif kind in ("ranked", "dumbbell"):
        rows = cats; lw = spec.get("labelWidth", 190)
        gx = M + lw; gw = W - gx - M - spec.get("rightGutter", 46)
        rh = 30; gy = y
        peak = max(max(s["values"]) for s in series)
        top = nice_max(peak, spec.get("max"))
        hl = spec.get("highlight"); hl = [hl] if isinstance(hl, int) else (hl or [])
        for j, r in enumerate(rows):
            ry = gy + j * rh
            o.append(txt(M, ry + 19, r, 12.5, INK if (not hl or j in hl) else SOFT, 500 if (not hl or j in hl) else None))
            if kind == "ranked":
                v = series[0]["values"][j]
                bw = (v / top) * gw
                c = colour(series[0].get("colour"), 0) if (not hl or j in hl) else PAL["quiet"]
                o.append(f'<rect x="{gx}" y="{ry + 6}" width="{bw:.1f}" height="16" rx="2" fill="{c}"/>')
                o.append(txt(gx + bw + 8, ry + 19, f"{v:g}{spec.get('unit','')}", 11.5, SOFT, 600, font=MONO))
            else:
                a, b = series[0]["values"][j], series[1]["values"][j]
                xa, xb = gx + (a / top) * gw, gx + (b / top) * gw
                if abs(xa - xb) < 2:
                    o.append(f'<circle cx="{xb:.1f}" cy="{ry + 14}" r="5.5" fill="{colour(series[1].get("colour"), 1)}"/>')
                    o.append(f'<circle cx="{xb:.1f}" cy="{ry + 14}" r="9" fill="none" stroke="{colour(series[0].get("colour"), 0)}" stroke-width="1.5"/>')
                    o.append(txt(xb + 16, ry + 18, spec.get("sameLabel", "unchanged"), 11, MUTED, font=MONO))
                else:
                    o.append(f'<line x1="{xa:.1f}" y1="{ry + 14}" x2="{xb:.1f}" y2="{ry + 14}" stroke="{LINE}" stroke-width="3"/>')
                    o.append(f'<circle cx="{xa:.1f}" cy="{ry + 14}" r="5.5" fill="{colour(series[0].get("colour"), 0)}"/>')
                    o.append(f'<circle cx="{xb:.1f}" cy="{ry + 14}" r="5.5" fill="{colour(series[1].get("colour"), 1)}"/>')
                    o.append(txt(max(xa, xb) + 12, ry + 18, spec.get("moveLabel", "moves to review"), 11, SOFT, font=MONO))
        y = gy + len(rows) * rh + 8
        if kind == "dumbbell" and spec.get("axisLabels"):
            o.append(f'<line x1="{gx}" y1="{y:.1f}" x2="{gx + gw:.1f}" y2="{y:.1f}" stroke="{LINE}" stroke-width="1"/>')
            o.append(txt(gx, y + 15, spec["axisLabels"][0], 10.5, MUTED, font=MONO))
            o.append(txt(gx + gw, y + 15, spec["axisLabels"][-1], 10.5, MUTED, anchor="end", font=MONO))
            y += 22
        if len(series) > 1:
            ls, y = legend(series, M, y + 8, W); o += ls

    elif kind == "matrix":
        rows = cats; cols = spec["columns"]; lw = spec.get("labelWidth", 170)
        cw = (W - M * 2 - lw) / len(cols); rh = 34
        gy = y + 22
        for i, c in enumerate(cols):
            for k, ln in enumerate(wrap(c, max(6, int(cw / 6.2)))[:2]):
                o.append(txt(M + lw + cw * (i + .5), y + 6 + k * 12, ln, 10.5, MUTED, anchor="middle", font=MONO))
        peak = max(max(r) for r in spec["values"])
        for j, r in enumerate(rows):
            ry = gy + j * rh
            o.append(txt(M, ry + 21, r, 12.5, INK, 500))
            for i in range(len(cols)):
                v = spec["values"][j][i]
                a = 0.10 + 0.78 * (v / peak if peak else 0)
                o.append(f'<rect x="{M + lw + cw * i + 2:.1f}" y="{ry + 4}" width="{cw - 4:.1f}" height="{rh - 8}" rx="3" fill="{colour(spec.get("colour"), 0)}" fill-opacity="{a:.2f}"/>')
                o.append(txt(M + lw + cw * (i + .5), ry + 21, f"{v:g}", 11.5, PAPER if a > .55 else INK, 600, "middle", MONO))
        y = gy + len(rows) * rh + 6

    elif kind == "smallmult":
        panels = spec["panels"]; per = spec.get("perRow", 4)
        pw = (W - M * 2 - 14 * (per - 1)) / per; ph = spec.get("panelHeight", 86)
        peak = max(max(p["values"]) for p in panels)
        top = nice_max(peak, spec.get("max"))
        hl = set(spec.get("highlight") or [])
        for k, p in enumerate(panels):
            col, row = k % per, k // per
            px = M + col * (pw + 14); py = y + row * (ph + 54)
            on = (not hl) or (k in hl)
            o.append(f'<rect x="{px:.1f}" y="{py}" width="{pw:.1f}" height="{ph + 44}" rx="6" fill="{TINT if on else PAPER}" stroke="{LINE}"/>')
            o.append(txt(px + 10, py + 18, p["name"], 12, INK if on else SOFT, 600))
            o.append(txt(px + 10, py + 33, p.get("note", ""), 10.5, MUTED, font=MONO))
            n = len(p["values"]); bw = (pw - 20) / n
            for i, v in enumerate(p["values"]):
                h = (v / top) * ph
                o.append(f'<rect x="{px + 10 + i * bw:.1f}" y="{py + 40 + ph - h:.1f}" width="{bw - 2:.1f}" height="{h:.1f}" fill="{colour(spec.get("colour"), 0) if on else PAL["quiet"]}"/>')
        rows = (len(panels) + per - 1) // per
        y = y + rows * (ph + 54)

    fo, H = footer(spec, W, M, y)
    o += fo
    return (f'<svg xmlns="http://www.w3.org/2000/svg" width="{W}" height="{int(H)}" viewBox="0 0 {W} {int(H)}" '
            f'role="img" aria-label="{esc(spec["title"])}"><rect width="{W}" height="{int(H)}" fill="{PAPER}"/>'
            + "".join(o) + "</svg>")


if __name__ == "__main__":
    spec = json.load(open(sys.argv[1]))
    open(sys.argv[2], "w").write(render(spec))
    print("wrote", sys.argv[2])
