#!/usr/bin/env python3
"""Capture showcase screens to 2x PNGs with headless Chrome.
Usage: capture.py manifest.json   where manifest is a list of {"src": html path, "w": px, "h": px, "out": png path}.
"""
import json, os, signal, subprocess, sys, pathlib, tempfile, shutil
CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
ROOT = pathlib.Path(__file__).resolve().parent.parent
items = json.load(open(sys.argv[1]))
MIN_W = 500  # headless Chrome lays out at about 500px minimum and crops below it,
             # so a narrower request silently returns a cropped desktop layout
for it in items:
    if it["w"] < MIN_W and "phone" not in it["src"] and "quick-add" not in it["src"]:
        print("WARNING", it["out"], f'requested {it["w"]}px; Chrome will lay out at ~{MIN_W}px and crop')
    path, _, q = it["src"].partition("?"); src = ROOT / path; out = ROOT / it["out"]; out.parent.mkdir(parents=True, exist_ok=True)
    url = f"file://{src}" + (f"?{q}" if q else "")
    ud = tempfile.mkdtemp(prefix="cap-")  # own profile per capture so parallel runs never share a lock
    cmd = [CHROME, "--headless=new", "--disable-gpu", "--hide-scrollbars", f"--user-data-dir={ud}", f"--window-size={it['w']},{it['h']}",
           "--force-device-scale-factor=2", "--virtual-time-budget=3000", f"--screenshot={out}", url]
    before = out.stat().st_mtime if out.exists() else 0
    # Chrome writes the PNG and then often fails to exit, leaving renderer and
    # zygote children behind. Run it in its own process group and kill the group,
    # otherwise the strays accumulate and starve later captures.
    proc = subprocess.Popen(cmd, start_new_session=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    try:
        proc.wait(timeout=int(os.environ.get("CAP_TIMEOUT", "60")))
    except subprocess.TimeoutExpired:
        pass
    try:
        os.killpg(os.getpgid(proc.pid), signal.SIGKILL)
    except (ProcessLookupError, PermissionError):
        pass
    proc.wait()
    shutil.rmtree(ud, ignore_errors=True)
    if out.exists() and out.stat().st_mtime > before:
        print("ok", it["out"], os.path.getsize(out))
    else:
        print("FAILED", it["out"])
