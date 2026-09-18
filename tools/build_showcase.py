#!/usr/bin/env python3
"""Build articles/57/showcase/index.html from showcase.json, the annotation
files and the Mobbin reference tables. Annotations are an HTML layer over each
PNG, so callouts stay live text and scale with the frame. No iframes.
Usage: build_showcase.py"""
import json, re, pathlib, html, struct

ROOT = pathlib.Path(__file__).resolve().parent.parent
SC = ROOT / "articles/57/showcase"
e = lambda s: html.escape(str(s), quote=False)

def png_size(p):
    d = (SC / p).read_bytes()[:24]
    return struct.unpack(">II", d[16:24])

def load_notes(rel):
    f = SC / rel
    if not f.exists():
        return None
    d = json.loads(f.read_text())
    d["markers"] = sorted(d.get("markers", []), key=lambda m: m["n"])
    return d

def md_tables(paths):
    rows, seen = [], set()
    for f in paths:
        if not f.exists():
            continue
        for line in f.read_text().splitlines():
            if not line.strip().startswith("|"):
                continue
            cells = [c.strip() for c in line.strip().strip("|").split("|")]
            if len(cells) < 4 or set("".join(cells)) <= set("-: "):
                continue
            if cells[0].lower().startswith(("screen or component", "pattern")):
                continue
            key = (cells[0], cells[1])
            if key in seen:
                continue
            seen.add(key)
            rows.append(cells[:4])
    return rows

def md_inline(s):
    s = e(s)
    s = re.sub(r'\[([^\]]+)\]\((https?://[^)]+)\)', r'<a href="\2" target="_blank" rel="noopener">\1</a>', s)
    s = re.sub(r'\*\*([^*]+)\*\*', r'<b>\1</b>', s)
    return s

def ref_link(s):
    m = re.match(r'(.*?)\s+[—-]\s+(https?://\S+)$', str(s).strip())
    if m:
        return f'<a href="{e(m.group(2))}" target="_blank" rel="noopener">{e(m.group(1))}</a>'
    m = re.search(r'(https?://\S+)', str(s))
    if m:
        return f'<a href="{e(m.group(1))}" target="_blank" rel="noopener">{e(str(s).replace(m.group(1), "").strip(" —-"))}</a>'
    return e(s)

def shot(img, markers=None, phone=False):
    w, h = png_size(img)
    if phone:
        # a real device frame: the display size, corner radius, island and safe
        # areas are the iPhone 15 specification scaled, not an eyeballed crop
        o = [f'<div class="dv-phone"><div class="dv-screen">'
             f'<img src="{e(img)}" width="{w//2}" height="{h//2}" alt="" loading="lazy">']
        for m in markers or []:
            o.append(f'<span class="mk" style="left:{m["x"]:.2f}%;top:{m["y"]:.2f}%">{m["n"]}</span>')
        o.append("</div></div>")
        return "".join(o)
    o = [f'<div class="shot"><img src="{e(img)}" width="{w//2}" height="{h//2}" alt="" loading="lazy">']
    for m in markers or []:
        o.append(f'<span class="mk" style="left:{m["x"]:.2f}%;top:{m["y"]:.2f}%">{m["n"]}</span>')
    o.append("</div>")
    return "".join(o)

def notes_block(d, limit=None):
    o = ['<div class="notes">']
    for m in (d["markers"][:limit] if limit else d["markers"]):
        o.append(f'<div class="note"><span class="n">{m["n"]}</span><div>')
        dd = str(m.get("finding", "")).strip().lower() in ("design decision", "design decision.")
        o.append(f'<h4>{e(m["title"])}{" <span class=\'dd\'>Design decision</span>" if dd else ""}</h4>')
        if m.get("finding") and not dd:
            o.append(f'<p><b>Finding</b>{e(m["finding"])}</p>')
        if m.get("decision"):
            o.append(f'<p><b>Decision</b>{e(m["decision"])}</p>')
        if m.get("rejected"):
            o.append(f'<p><b>Rejected</b>{e(m["rejected"])}</p>')
        # the pattern a decision was checked against stays in the working notes, not on the page
        o.append("</div></div>")
    o.append("</div>")
    return "".join(o)

def tokens_section():
    css = (ROOT / "assets/product/tokens.css").read_text()
    var = dict(re.findall(r'(--p-[a-z0-9-]+)\s*:\s*([^;]+);', css))
    groups = [
        ("Surfaces", ["--p-canvas", "--p-panel", "--p-panel-2", "--p-sidebar", "--p-line", "--p-line-strong"]),
        ("Ink", ["--p-ink", "--p-ink-2", "--p-ink-3", "--p-ink-inverse"]),
        ("Status", ["--p-danger", "--p-warning", "--p-success", "--p-info", "--p-neutral"]),
        ("Status grounds", ["--p-danger-bg", "--p-warning-bg", "--p-success-bg", "--p-info-bg", "--p-neutral-bg"]),
    ]
    o = []
    for name, keys in groups:
        o.append(f"<h3>{name}</h3><div class=\"swatches\">")
        for k in keys:
            v = var.get(k, "").strip()
            if not v:
                continue
            o.append(f'<div class="sw"><i style="background:{e(v)}"></i><span><b>{e(k.replace("--p-", ""))}</b>{e(v)}</span></div>')
        o.append("</div>")
    scale = [(k, v.strip()) for k, v in var.items() if re.fullmatch(r'--p-fs-\d', k)]
    o.append('<h3>Type scale</h3><div class="scale">')
    for k, v in sorted(scale, key=lambda kv: float(re.sub(r'[^\d.]', '', kv[1]) or 0)):
        px = re.sub(r'[^\d.]', '', v)
        o.append(f'<div><code>{e(k)}</code><em>{e(v)}</em><span style="font-size:{e(v)}">The manager classifies from the outcome</span></div>')
    o.append("</div>")
    return "".join(o)



def story_block(mod, notes):
    """A scroll-driven story: the stage stays, the copy moves past it, the screen
    changes with the step. Steps come either from the module's own story spec or
    from its annotation file, in which case each marker becomes a step and its
    coordinates become the lens."""
    spec = mod.get("story")
    if not spec:
        return ""
    device = spec.get("device", "phone")
    align = spec.get("align", "right")
    shots = spec.get("shots") or ([mod["img"]] if mod.get("img") else [])
    steps = spec.get("steps")
    if not steps and notes:
        steps = []
        for m in notes["markers"]:
            steps.append({
                "shot": 0,
                "zoom": f'{m["x"]:.1f},{m["y"]:.1f},{spec.get("zoom", 2.1)}',
                "kind": "Design decision" if str(m.get("finding", "")).strip().lower().startswith("design decision") else "Finding",
                "title": m.get("title", ""),
                "body": m.get("decision", ""),
                "quote": "" if str(m.get("finding", "")).strip().lower().startswith("design decision") else m.get("finding", ""),
                "rejected": m.get("rejected", ""),
            })
    if not steps:
        return ""

    stages = spec.get("devices") or [{"device": device, "shots": shots}]
    o = [f'<section class="st" data-align="{e(align)}">']
    o.append(f'<div class="st-rail"><div class="st-stage" data-devices="{len(stages)}">')
    for si, st_dev in enumerate(stages):
        dv = st_dev.get("device", "phone")
        ratio = ""
        if st_dev["shots"] and dv != "phone":
            rw, rh = png_size(st_dev["shots"][0])
            ratio = f' style="--st-ratio: {rw} / {rh}"'
        live = " is-live" if si == 0 else ""
        o.append(f'<div class="st-device {e(dv)}{live}"><div class="st-screen"{ratio}>')
        for i, sh in enumerate(st_dev["shots"]):
            w, h = png_size(sh)
            on = " is-on" if (si == 0 and i == 0) else ""
            o.append(f'<img class="st-shot{on}" src="{e(sh)}" width="{w//2}" height="{h//2}" alt="" loading="lazy">')
        o.append('</div></div>')
    o.append('</div></div>')
    o.append('<ol class="st-copy">')
    for i, st in enumerate(steps):
        zoom = f' data-zoom="{e(st["zoom"])}"' if st.get("zoom") else ""
        stg = f' data-stage="{st.get("stage", 0)}"'
        o.append(f'<li class="st-step" data-shot="{st.get("shot", i)}"{stg}{zoom}>')
        o.append(f'<span class="st-n">{i + 1:02d} / {len(steps):02d}</span>')
        if st.get("kind"):
            o.append(f'<span class="st-kind">{e(st["kind"])}</span>')
        o.append(f'<h3>{e(st.get("title", ""))}</h3>')
        if st.get("body"):
            o.append(f'<p>{md_inline(st["body"])}</p>')
        if st.get("quote"):
            o.append(f'<p class="st-quote">{md_inline(st["quote"])}</p>')
        if st.get("rejected"):
            o.append(f'<p class="st-rej"><b>Replaced</b>{md_inline(st["rejected"])}</p>')
        o.append('</li>')
    o.append('</ol></section>')
    return "".join(o)


spec = json.loads((SC / "showcase.json").read_text())
parts = []
for mod in spec["modules"]:
    d = load_notes(mod["annotations"]) if mod.get("annotations") else None
    img = mod.get("img") or (d and d.get("img"))
    if not img or not (SC / img).exists():
        print("skip (no image yet):", mod["id"]); continue
    parts.append(f'<section class="sc-sec" id="{e(mod["id"])}"><div class="sc-wrap">')
    parts.append(f'<span class="sc-num">{e(mod["kicker"])}</span><h2>{e(mod["title"])}</h2>')
    if mod.get("finding"):
        parts.append(f'<div class="sc-finding"><b>{e(mod.get("findingLabel", "What the research found"))}</b><p>{md_inline(mod["finding"])}</p></div>')
    for p in mod.get("body", []):
        parts.append(f'<p class="sc-prose">{md_inline(p)}</p>')
    sb = story_block(mod, d)
    if sb:
        parts.append(sb)
    else:
        parts.append(shot(img, d["markers"] if d else None, mod.get("phone")))
    parts.append(f'<p class="shot-cap"><span class="fignum">{e(mod["figure"])}</span>{md_inline(mod["caption"])}</p>')
    if d and not sb:
        # a module without a story shows the decisions that carry it, not all of them
        parts.append(notes_block(d, limit=mod.get("noteLimit", 4)))
    states = [s for s in mod.get("states", []) if (SC / s["img"]).exists()]
    if states:
        parts.append(f'<h3>{e(mod.get("statesTitle", "The states that matter"))}</h3>')
        state_notes = []
        parts.append('<div class="states phones">' if mod.get("phone") else '<div class="states">')
        for s in states:
            sd = load_notes(s["annotations"]) if s.get("annotations") else None
            parts.append(f'<figure>{shot(s["img"], sd["markers"] if sd else None, mod.get("phone"))}<figcaption><b>{e(s["title"])}</b>{md_inline(s["cap"])}</figcaption></figure>')
            if sd:
                state_notes.append((s["title"], sd))
        parts.append("</div>")
        for title, sd in state_notes:
            parts.append(f'<h3>{e(title)}, decision by decision</h3>')
            parts.append(notes_block(sd))
    parts.append("</div></section>")

refs = []  # kept in the repo as working material; not published
ref_rows = "" and "".join(
    f'<tr><td data-label="Pattern">{md_inline(r[0])}</td><td data-label="Reference">{md_inline(r[1])}</td>'
    f'<td data-label="Taken">{md_inline(r[2])}</td><td data-label="Rejected">{md_inline(r[3])}</td></tr>' for r in refs)

page = f"""<!doctype html>
<html lang="en-AU"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="description" content="{e(spec['description'])}">
<title>{e(spec['title'])} · Sam Mozaffari</title>
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400;500&display=swap" rel="stylesheet">
<link rel="stylesheet" href="../../../assets/style.css?v=9">
<link rel="stylesheet" href="../../../assets/showcase.css?v=9">
<link rel="stylesheet" href="../../../assets/scrollytell.css?v=12">
<link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><rect width='100' height='100' rx='8' fill='%23171817'/><text x='50' y='70' font-size='56' text-anchor='middle' fill='%23f8f8f5' font-family='sans-serif' font-weight='600'>S</text></svg>">
</head><body>
<a class="skip-link" href="#main">Skip to content</a>
<header class="site-head">
  <a class="brand" href="../../../index.html">
    <div class="brand-title">Sam Mozaffari</div>
    <div class="brand-sub">Experience Designer</div>
  </a>
  <nav class="main-nav">
    <a href="../../../index.html">Home</a>
    <a href="../../../articles.html" class="on">Work</a>
    <a href="../../../about.html">About</a>
    <a href="../../../cv.html">CV</a><a href="../../../writing/index.html">Writing</a>
  </nav>
</header>
<main id="main" class="sc">
<div class="sc-wrap sc-hero">
  <span class="sc-eyebrow">{e(spec['eyebrow'])}</span>
  <h1>{e(spec['title'])}</h1>
  <p class="sc-deck">{md_inline(spec['deck'])}</p>
  <dl class="sc-hero-facts">{''.join(f'<div><dt>{e(f["dt"])}</dt><dd>{md_inline(f["dd"])}</dd></div>' for f in spec['facts'])}</dl>
</div>
<section class="sc-sec"><div class="sc-wrap">
  <span class="sc-num">{e(spec['intro']['kicker'])}</span><h2>{e(spec['intro']['title'])}</h2>
  {''.join(f'<p class="sc-prose sc-lede">{md_inline(p)}</p>' for p in spec['intro']['body'])}
</div></section>
{''.join(parts)}
<section class="sc-sec" id="design-system"><div class="sc-wrap">
  <span class="sc-num">{e(spec['system']['kicker'])}</span><h2>{e(spec['system']['title'])}</h2>
  {''.join(f'<p class="sc-prose">{md_inline(p)}</p>' for p in spec['system']['body'])}
  {tokens_section()}
</div></section>

<div class="sc-wrap"><div class="sc-foot-nav">
  <a class="btn-ink" href="../index.html">Back to the case study</a>
  <a class="btn-ghost" href="../prototype/index.html">Open the form prototype</a>
</div></div>
</main>
<script src="../../../assets/scrollytell.js?v=12"></script>
<footer class="footer">
  <span>Sam Mozaffari · Experience Designer, Sydney.</span>
  <span><a href="../../../library.html">Library</a> · <a href="../../../llms.txt">llms.txt</a> · <a href="https://github.com/sammozaffari" target="_blank" rel="noopener">GitHub</a> · <a href="https://www.linkedin.com/in/sam-mozaffari-210588a7" target="_blank" rel="noopener">LinkedIn</a></span>
</footer>
</body></html>
"""
(SC / "index.html").write_text(page)
print("wrote", (SC / "index.html").relative_to(ROOT), len(page), "bytes,", sum(1 for x in parts if x.startswith("<section")), "modules,", len(refs), "reference rows")
