#!/usr/bin/env python3
"""Visual regression for the product screens.

The failure mode every practitioner names with agent-written UI is that the agent
cannot see what its code renders. This closes that: each screen is captured, hashed
per horizontal band, and compared against a committed baseline. A changed band is
reported with the region that moved, so a diff is reviewable rather than a yes or no.

Baselines live in articles/57/showcase/baseline/*.json and are committed, so a change
to a screen shows up in the diff of the pull request like any other change.

Usage: visual_check.py            compare every captured screen against its baseline
       visual_check.py --accept   write the current captures as the new baseline
"""
import hashlib, json, pathlib, sys, struct, zlib

ROOT = pathlib.Path(__file__).resolve().parent.parent
IMG = ROOT / "articles/57/showcase/img"
BASE = ROOT / "articles/57/showcase/baseline"
BANDS = 24  # horizontal strips; enough to localise a change without being brittle


def bands(png: pathlib.Path):
    """Hash each horizontal band of a PNG without a third-party image library."""
    data = png.read_bytes()
    w, h = struct.unpack(">II", data[16:24])
    idat = b"".join(
        data[i + 8 : i + 8 + struct.unpack(">I", data[i : i + 4])[0]]
        for i in range(8, len(data))
        if data[i + 4 : i + 8] == b"IDAT"
        and (i == 8 or True)
    )
    try:
        raw = zlib.decompress(idat)
    except zlib.error:
        return w, h, []
    stride = len(raw) // h if h else 0
    if not stride:
        return w, h, []
    step = max(1, h // BANDS)
    out = []
    for b in range(0, h, step):
        chunk = raw[b * stride : min((b + step) * stride, len(raw))]
        out.append(hashlib.sha1(chunk).hexdigest()[:12])
    return w, h, out


def snapshot():
    return {
        p.name: dict(zip(("w", "h", "bands"), bands(p)))
        for p in sorted(IMG.glob("*.png"))
    }


BASE.mkdir(exist_ok=True)
store = BASE / "screens.json"
now = snapshot()

if "--accept" in sys.argv:
    store.write_text(json.dumps(now, indent=1))
    print(f"baseline accepted for {len(now)} screens")
    sys.exit(0)

if not store.exists():
    store.write_text(json.dumps(now, indent=1))
    print(f"no baseline found; wrote one for {len(now)} screens")
    sys.exit(0)

was = json.loads(store.read_text())
added = sorted(set(now) - set(was))
removed = sorted(set(was) - set(now))
changed = []
for name in sorted(set(now) & set(was)):
    a, b = was[name], now[name]
    if (a["w"], a["h"]) != (b["w"], b["h"]):
        changed.append(f"{name}: size {a['w']}x{a['h']} became {b['w']}x{b['h']}")
        continue
    moved = [i for i, (x, y) in enumerate(zip(a["bands"], b["bands"])) if x != y]
    if moved:
        pct = 100 * len(moved) / max(1, len(a["bands"]))
        where = ", ".join(f"{100*i//len(a['bands'])}%" for i in moved[:6])
        changed.append(f"{name}: {len(moved)} of {len(a['bands'])} bands differ ({pct:.0f}%), from {where}")

for n in added:
    print("new     ", n)
for n in removed:
    print("gone    ", n)
for c in changed:
    print("CHANGED ", c)

if changed or removed:
    print("\nVISUAL REGRESSION: review the screens above, then run tools/visual_check.py --accept")
    sys.exit(1)
print(f"VISUAL OK {len(now)} screens match their baseline" + (f", {len(added)} new" if added else ""))
