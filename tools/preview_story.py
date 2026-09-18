#!/usr/bin/env python3
"""Render each step of a scroll story as a still, inside a real viewport.

A full-page screenshot cannot check a sticky stage, because Chrome expands the
viewport to the page height and 100vh stops meaning a screen. This writes one
file per step with the stage pinned to a 900px viewport and that step marked
active, which is exactly what a reader sees when they scroll to it.

Usage: preview_story.py page.html <section-index> outdir/prefix
"""
import re, sys, pathlib

src = pathlib.Path(sys.argv[1])
which = int(sys.argv[2]) if len(sys.argv) > 2 else 0
prefix = pathlib.Path(sys.argv[3]) if len(sys.argv) > 3 else src.with_name("story")

page = src.read_text()
head = page[page.index("<head>") + 6 : page.index("</head>")]
sections = re.findall(r'<section class="st".*?</section>', page, re.S)
if not sections:
    raise SystemExit("no scroll story in " + str(src))
sec = sections[which]

sec = sec.replace(' is-on', '')  # start from a clean slate so every state can be set
steps = re.findall(r'<li class="st-step".*?</li>', sec, re.S)
shots = re.findall(r'<img class="st-shot[^>]*>', sec)

VIEW = """
<style>
  body { margin:0; }
  .vp { width:1440px; height:900px; overflow:hidden; position:relative; background:#fff; }
  .vp .st { display:grid; grid-template-columns:minmax(0,1fr) minmax(0,1fr); gap:0 72px;
            max-width:1320px; margin:0 auto; padding:0 40px; align-items:center; height:900px; }
  .vp .st-stage { position:static; height:900px; }
  .vp .st-copy { list-style:none; margin:0; padding:0; }
  .vp .st-step { min-height:0; padding:0; }
  .vp .st-step:not(.is-on) { display:none; }
</style>
"""

prefix.parent.mkdir(parents=True, exist_ok=True)
for i, step in enumerate(steps):
    shot_i = int((re.search(r'data-shot="(\d+)"', step) or [0, i])[1]) if 'data-shot' in step else i
    body = sec
    body = body.replace(step, step.replace('class="st-step"', 'class="st-step is-on"'), 1)
    target = shots[min(shot_i, len(shots) - 1)]
    body = body.replace(target, target.replace('class="st-shot"', 'class="st-shot is-on"'), 1)
    # open the lens if this step declares one
    lens = re.search(r'data-lens="([^"]+)"', step)
    if lens:
        x, y, r = (lens.group(1).split(",") + ["12"])[:3]
        body = body.replace('<div class="st-lens"></div>',
                            f'<div class="st-lens is-on" style="--lx:{x}%;--ly:{y}%;--lr:{r}%"></div>')
    out = prefix.with_name(prefix.name + f"-{i + 1}.html")
    out.write_text(f"<!doctype html><html lang=\"en-AU\"><head>{head}{VIEW}</head>"
                   f"<body><div class=\"vp\">{body}</div></body></html>")
    print("wrote", out)
