#!/usr/bin/env python3
"""Capture showcase screens to 2x PNGs with headless Chrome.
Usage: capture.py manifest.json   where manifest is a list of {"src": html path, "w": px, "h": px, "out": png path}.
"""
import json, os, subprocess, sys, pathlib, tempfile, shutil
CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
ROOT = pathlib.Path(__file__).resolve().parent.parent
items = json.load(open(sys.argv[1]))
for it in items:
    path, _, q = it["src"].partition("?"); src = ROOT / path; out = ROOT / it["out"]; out.parent.mkdir(parents=True, exist_ok=True)
    url = f"file://{src}" + (f"?{q}" if q else "")
    ud = tempfile.mkdtemp(prefix="cap-")  # own profile per capture so parallel runs never share a lock
    cmd = [CHROME, "--headless=new", "--disable-gpu", "--hide-scrollbars", f"--user-data-dir={ud}", f"--window-size={it['w']},{it['h']}",
           "--force-device-scale-factor=2", "--virtual-time-budget=3000", f"--screenshot={out}", url]
    before = out.stat().st_mtime if out.exists() else 0
    try:
        subprocess.run(cmd, timeout=int(os.environ.get("CAP_TIMEOUT", "60")), capture_output=True)
    except subprocess.TimeoutExpired:
        pass  # Chrome writes the PNG then sometimes fails to exit; judge by the file, not the exit
    shutil.rmtree(ud, ignore_errors=True)
    if out.exists() and out.stat().st_mtime > before:
        print("ok", it["out"], os.path.getsize(out))
    else:
        print("FAILED", it["out"])
