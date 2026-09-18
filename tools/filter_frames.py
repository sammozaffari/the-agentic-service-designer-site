#!/usr/bin/env python3
"""Render a filtering sequence as a set of SVG frames.

Every record in the research tool is one dot. Each frame applies one more filter,
so the set narrows in front of the reader and the evidence behind a single
recommendation is the handful still lit at the end. This is what the insight
filtering in the tool actually does, drawn rather than described.

Spec: filter-frames.json
{
 "title": str, "total": int, "width": int,
 "frames": [{"label": str, "note": str, "keep": int}]   keep is how many stay lit
}
The dots that stay lit are chosen deterministically from a seeded shuffle, so the
same spec always produces the same picture and the frames stay consistent.

Usage: filter_frames.py spec.json outdir/prefix
"""
import json, math, random, sys, pathlib

INK = "#23231f"; CLAY = "#9b3427"; QUIET = "#e2e1da"; MUTED = "#6e6e69"; SOFT = "#3f3f3b"
FONT = "Inter, Helvetica, Arial, sans-serif"
MONO = "IBM Plex Mono, Menlo, monospace"
esc = lambda s: str(s).replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")


def render(spec, frame_index):
    W = spec.get("width", 760)
    total = spec["total"]
    frames = spec["frames"]
    f = frames[frame_index]

    cols = spec.get("cols", 23)
    rows = math.ceil(total / cols)
    pad = 30
    gap = spec.get("gap", 7)
    r = spec.get("dot", 5.5)
    grid_w = cols * (r * 2 + gap) - gap
    scale = min(1.0, (W - pad * 2) / grid_w)
    step = (r * 2 + gap) * scale
    rr = r * scale

    top = 96
    H = int(top + rows * step + 126)

    # deterministic pick of which dots survive each filter, nested so each frame
    # is a subset of the one before it
    rnd = random.Random(spec.get("seed", 7))
    order = list(range(total))
    rnd.shuffle(order)
    keep = set(order[: f["keep"]])
    prev = set(order[: frames[frame_index - 1]["keep"]]) if frame_index else set(range(total))

    o = []
    o.append(f'<text x="{pad}" y="34" font-family="{FONT}" font-size="17" font-weight="700" fill="{INK}">{esc(spec["title"])}</text>')
    o.append(f'<text x="{pad}" y="58" font-family="{MONO}" font-size="11" fill="{MUTED}">'
             f'{esc(f["label"])}</text>')
    o.append(f'<text x="{W - pad}" y="58" text-anchor="end" font-family="{MONO}" font-size="11" fill="{CLAY}">'
             f'{f["keep"]} of {total}</text>')

    x0 = pad
    for i in range(total):
        c, rw = i % cols, i // cols
        cx = x0 + c * step + rr
        cy = top + rw * step + rr
        if i in keep:
            o.append(f'<circle cx="{cx:.1f}" cy="{cy:.1f}" r="{rr:.1f}" fill="{CLAY}"/>')
        elif i in prev:
            o.append(f'<circle cx="{cx:.1f}" cy="{cy:.1f}" r="{rr:.1f}" fill="{QUIET}" stroke="{CLAY}" stroke-width="1" stroke-opacity=".35"/>')
        else:
            o.append(f'<circle cx="{cx:.1f}" cy="{cy:.1f}" r="{rr:.1f}" fill="{QUIET}"/>')

    import textwrap
    y = top + rows * step + 34
    for ln in textwrap.wrap(f.get("note", ""), int(W / 7.6)) or [""]:
        o.append(f'<text x="{pad}" y="{y}" font-family="{FONT}" font-size="13" fill="{SOFT}">{esc(ln)}</text>')
        y += 19
    if spec.get("source") and frame_index == len(frames) - 1:
        y += 6
        for ln in textwrap.wrap(spec["source"], int(W / 5.9)):
            o.append(f'<text x="{pad}" y="{y}" font-family="{MONO}" font-size="10" fill="{MUTED}">{esc(ln)}</text>')
            y += 14

    return (f'<svg xmlns="http://www.w3.org/2000/svg" width="{W}" height="{H}" viewBox="0 0 {W} {H}" '
            f'role="img" aria-label="{esc(spec["title"])}: {esc(f["label"])}, {f["keep"]} of {total} records">'
            f'<rect width="{W}" height="{H}" fill="#ffffff"/>' + "".join(o) + "</svg>")


if __name__ == "__main__":
    spec = json.load(open(sys.argv[1]))
    prefix = pathlib.Path(sys.argv[2])
    prefix.parent.mkdir(parents=True, exist_ok=True)
    for i in range(len(spec["frames"])):
        out = prefix.with_name(prefix.name + f"-{i + 1}.svg")
        out.write_text(render(spec, i))
        print("wrote", out)
