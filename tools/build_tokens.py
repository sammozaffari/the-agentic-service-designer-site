#!/usr/bin/env python3
"""Build assets/product/tokens.css from the DTCG token source.

The source of truth is assets/product/tokens.dtcg.json, written in the W3C Design
Tokens Community Group shape ($value, $type, $description). This script is the
build step that emits CSS custom properties, the same job Style Dictionary or
Terrazzo does on a larger system. Keeping the source in the DTCG shape means the
tokens can be read by Figma, Tokens Studio, Style Dictionary and Terrazzo without
a translation layer.

Modes and theming are deliberately not modelled here. The DTCG Resolver module,
which is the agreed answer to modes, is still a preview draft that says not to
implement it, so this system has one mode and says so.

Usage: build_tokens.py            build the CSS
       build_tokens.py --check    fail if the CSS on disk is out of date
"""
import json, pathlib, sys, re

ROOT = pathlib.Path(__file__).resolve().parent.parent
SRC = ROOT / "assets/product/tokens.dtcg.json"
OUT = ROOT / "assets/product/tokens.css"
HEADER_END = "/* --- generated from tokens.dtcg.json below this line --- */"

doc = json.loads(SRC.read_text())
GROUPS = [("typography", "Type"), ("dimension", "Space, radius and layout"), ("number", "Scale"),
          ("colour", "Colour"), ("alias", "Aliases"), ("shadow", "Elevation"), ("motion", "Motion"), ("other", "Other")]

lines = []
for key, label in GROUPS:
    items = doc.get(key)
    if not items:
        continue
    lines.append(f"\n  /* {label} */")
    for name, tok in items.items():
        val = tok["$value"]
        if isinstance(val, float) and val == int(val):
            val = int(val)
        if isinstance(val, list):
            val = ", ".join(f'"{v}"' if " " in str(v) else str(v) for v in val) if tok.get("$type") == "fontFamily" else f"cubic-bezier({','.join((str(int(v)) if float(v) == int(v) else str(v)).lstrip('0') or '0' for v in val)})"
        elif isinstance(val, str) and val.startswith("{") and val.endswith("}"):
            val = f"var(--p-{val[1:-1]})"
        desc = tok.get("$description")
        comment = f"  /* {desc} */" if desc else ""
        lines.append(f"  --p-{name}: {val};{comment}")

body = ":root {" + "\n".join(lines) + "\n}\n"

existing = OUT.read_text() if OUT.exists() else ""
head = existing.split(HEADER_END)[0].rstrip() if HEADER_END in existing else ""
if not head:
    # first run keeps the hand-written prose header that explains the decisions
    head = existing[: existing.index(":root {")].rstrip() if ":root {" in existing else "/* Product design tokens. */"

built = head + "\n\n" + HEADER_END + "\n" + body

if "--check" in sys.argv:
    if existing.strip() != built.strip():
        print("tokens.css is out of date. Run tools/build_tokens.py")
        sys.exit(1)
    print("tokens.css matches tokens.dtcg.json")
    sys.exit(0)

OUT.write_text(built)
n = sum(len(v) for k, v in doc.items() if isinstance(v, dict))
print(f"built {OUT.relative_to(ROOT)} from {n} DTCG tokens")
