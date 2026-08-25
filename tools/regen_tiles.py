#!/usr/bin/env python3
"""Regenerate the archive card tile art.

Replaces every inline `.mini` SVG in index.html / articles.html with one of six
iconic, text-free marks keyed to the card's data-track, and sets the card
tint class so colour = taxonomy. Idempotent: run again after editing marks.
"""
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent

# ---------------------------------------------------------------- marks
# viewBox 0 0 320 140 · stroke-based · currentColor · no interior text.
# Strokes >= 2.25 so they survive the ~0.85 render scale on a 4-col grid.

S = 'stroke="currentColor" fill="none"'
F = 'fill="currentColor"'

MARKS = {
    # Foundations & Process — blueprint lanes with staged nodes
    "blueprint": f'''<line x1="24" y1="36" x2="296" y2="36" {S} stroke-width="2.25"/>
<line x1="24" y1="70" x2="296" y2="70" {S} stroke-width="2.25"/>
<line x1="24" y1="104" x2="296" y2="104" {S} stroke-width="2.25"/>
<rect x="52" y="26" width="20" height="20" rx="3" {F}/>
<circle cx="160" cy="36" r="10" {S} stroke-width="3"/>
<rect x="240" y="26" width="20" height="20" rx="3" {S} stroke-width="3"/>
<circle cx="100" cy="70" r="9" {F}/>
<path d="M 204 56 L 218 70 L 204 84 L 190 70 Z" {S} stroke-width="3"/>
<rect x="126" y="94" width="20" height="20" rx="3" {S} stroke-width="3"/>
<circle cx="260" cy="104" r="9" {F}/>
<line x1="160" y1="46" x2="104" y2="61" {S} stroke-width="2" stroke-dasharray="6 5"/>
<line x1="198" y1="79" x2="142" y2="94" {S} stroke-width="2" stroke-dasharray="6 5"/>''',

    # Research & Synthesis — evidence points converging into one insight
    "evidence": f'''<circle cx="40" cy="34" r="5" {F}/>
<circle cx="72" cy="66" r="5" {F}/>
<circle cx="44" cy="102" r="5" {F}/>
<circle cx="100" cy="30" r="5" {F}/>
<circle cx="108" cy="108" r="5" {F}/>
<circle cx="136" cy="70" r="5" {F}/>
<line x1="46" y1="37" x2="206" y2="62" {S} stroke-width="2" stroke-dasharray="6 5"/>
<line x1="78" y1="67" x2="204" y2="70" {S} stroke-width="2" stroke-dasharray="6 5"/>
<line x1="50" y1="100" x2="206" y2="78" {S} stroke-width="2" stroke-dasharray="6 5"/>
<circle cx="234" cy="70" r="28" {S} stroke-width="3"/>
<circle cx="234" cy="70" r="8" {F}/>''',

    # Mapping & Design — journey line over a baseline
    "journey": f'''<polyline points="24,96 88,48 152,82 216,38 296,66" {S} stroke-width="3" stroke-linejoin="round" stroke-linecap="round"/>
<circle cx="24" cy="96" r="8" {S} stroke-width="3"/>
<circle cx="88" cy="48" r="7" {F}/>
<circle cx="152" cy="82" r="8" {S} stroke-width="3"/>
<circle cx="216" cy="38" r="7" {F}/>
<circle cx="296" cy="66" r="8" {S} stroke-width="3"/>
<line x1="24" y1="120" x2="296" y2="120" {S} stroke-width="2.25" stroke-dasharray="6 5"/>''',

    # Innovation & Prototyping — one idea branching to options, one survives
    "prototype": f'''<path d="M 64 46 L 88 70 L 64 94 L 40 70 Z" {S} stroke-width="3"/>
<line x1="84" y1="58" x2="164" y2="32" {S} stroke-width="2.25"/>
<line x1="88" y1="70" x2="164" y2="70" {S} stroke-width="2.25"/>
<line x1="84" y1="82" x2="164" y2="108" {S} stroke-width="2.25"/>
<rect x="166" y="20" width="24" height="24" rx="3" {S} stroke-width="3"/>
<rect x="166" y="58" width="24" height="24" rx="3" {F}/>
<rect x="166" y="96" width="24" height="24" rx="3" {S} stroke-width="3"/>
<line x1="190" y1="70" x2="252" y2="70" {S} stroke-width="2.25"/>
<circle cx="268" cy="70" r="14" {S} stroke-width="3"/>
<circle cx="268" cy="70" r="5" {F}/>''',

    # Implementation & Operations — the operating loop
    "loop": f'''<circle cx="84" cy="38" r="11" {S} stroke-width="3"/>
<circle cx="236" cy="38" r="11" {F}/>
<circle cx="236" cy="102" r="11" {S} stroke-width="3"/>
<circle cx="84" cy="102" r="11" {F}/>
<line x1="95" y1="38" x2="225" y2="38" {S} stroke-width="2.25"/>
<line x1="236" y1="49" x2="236" y2="91" {S} stroke-width="2.25"/>
<line x1="225" y1="102" x2="95" y2="102" {S} stroke-width="2.25"/>
<line x1="84" y1="91" x2="84" y2="49" {S} stroke-width="2.25"/>
<polygon points="168,32 180,38 168,44" {F}/>
<polygon points="152,108 140,102 152,96" {F}/>
<path d="M 160 58 L 172 70 L 160 82 L 148 70 Z" {S} stroke-width="3"/>''',

    # Sectors, Theory & Future — steps rising into a horizon point
    "horizon": f'''<polyline points="24,116 88,116 88,84 152,84 152,52 216,52" {S} stroke-width="3" stroke-linejoin="round" stroke-linecap="round"/>
<circle cx="252" cy="52" r="20" {S} stroke-width="3"/>
<line x1="252" y1="20" x2="252" y2="8" {S} stroke-width="2.25"/>
<line x1="278" y1="30" x2="287" y2="21" {S} stroke-width="2.25"/>
<line x1="284" y1="52" x2="296" y2="52" {S} stroke-width="2.25"/>
<line x1="278" y1="74" x2="287" y2="83" {S} stroke-width="2.25"/>
<circle cx="252" cy="52" r="6" {F}/>
<circle cx="24" cy="116" r="6" {F}/>''',
}

TRACKS = {
    "Foundations & Process":        ("blueprint", ""),
    "Research & Synthesis":         ("evidence",  "g-lavender"),
    "Mapping & Design":             ("journey",   "g-sage"),
    "Innovation & Prototyping":     ("prototype", "g-butter"),
    "Implementation & Operations":  ("loop",      "g-blue"),
    "Sectors, Theory & Future":     ("horizon",   "g-rose"),
}


def svg_for(track: str, dark: bool) -> str:
    mark, tint = TRACKS.get(track, ("blueprint", ""))
    if dark:
        tint = "g-dark"
    cls = f"card-graphic {tint}".rstrip()
    body = MARKS[mark].replace("\n", "")
    return (f'<div class="{cls}"><svg viewBox="0 0 320 140" class="mini m-{mark}" '
            f'aria-hidden="true" preserveAspectRatio="xMidYMid meet">{body}</svg></div>')


CARD_RE = re.compile(
    r'(<article class="card(?P<dark> dark)?"[^>]*?data-track="(?P<track>[^"]*)".*?)'
    r'<div class="card-graphic[^"]*">.*?</svg></div>',
    re.DOTALL,
)


def process(path: Path) -> int:
    html = path.read_text()
    n = 0

    def repl(m: re.Match) -> str:
        nonlocal n
        n += 1
        track = m.group("track").replace("&amp;", "&")
        return m.group(1) + svg_for(track, bool(m.group("dark")))

    out = CARD_RE.sub(repl, html)
    path.write_text(out)
    return n


if __name__ == "__main__":
    for name in ("index.html", "articles.html"):
        p = ROOT / name
        if p.exists():
            print(f"{name}: {process(p)} tiles regenerated")
        else:
            print(f"{name}: missing", file=sys.stderr)
