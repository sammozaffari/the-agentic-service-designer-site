#!/usr/bin/env python3
"""Capture showcase screens to 2x PNGs with headless Chrome.
Usage: capture.py manifest.json   where manifest is a list of {"src": html path, "w": px, "h": px, "out": png path}.
"""
import json, os, subprocess, sys, pathlib
CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
ROOT = pathlib.Path(__file__).resolve().parent.parent
items = json.load(open(sys.argv[1]))
for it in items:
    path, _, q = it["src"].partition("?"); src = ROOT / path; out = ROOT / it["out"]; out.parent.mkdir(parents=True, exist_ok=True)
    url = f"file://{src}" + (f"?{q}" if q else "")
    cmd = [CHROME, "--headless=new", "--disable-gpu", "--hide-scrollbars", f"--window-size={it['w']},{it['h']}",
           "--force-device-scale-factor=2", "--virtual-time-budget=3000", f"--screenshot={out}", url]
    try:
        subprocess.run(cmd, timeout=60, capture_output=True); print("ok", it["out"], os.path.getsize(out))
    except subprocess.TimeoutExpired:
        print("timeout", it["out"])
