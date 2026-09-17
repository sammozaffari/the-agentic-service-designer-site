#!/usr/bin/env python3
"""Print a local page to PDF with headless Chrome, judging success by the written
file rather than by the exit code, because Chrome often writes the PDF and then
fails to exit. Usage: print_pdf.py page.html out.pdf
"""
import os, re, signal, subprocess, sys, pathlib, tempfile

CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
src = pathlib.Path(sys.argv[1]).resolve()
out = pathlib.Path(sys.argv[2]).resolve()
before = out.stat().st_mtime if out.exists() else 0
ud = tempfile.mkdtemp(prefix="pdf-")  # left in place; the OS clears its own temp dir
cmd = [CHROME, "--headless=new", "--disable-gpu", f"--user-data-dir={ud}",
       "--no-pdf-header-footer", "--virtual-time-budget=4000",
       f"--print-to-pdf={out}", f"file://{src}"]
proc = subprocess.Popen(cmd, start_new_session=True,
                        stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
try:
    proc.wait(timeout=int(os.environ.get("CAP_TIMEOUT", "90")))
except subprocess.TimeoutExpired:
    pass
try:
    os.killpg(os.getpgid(proc.pid), signal.SIGKILL)
except (ProcessLookupError, PermissionError):
    pass
proc.wait()

if out.exists() and out.stat().st_mtime > before:
    data = out.read_bytes()
    pages = len(re.findall(rb"/Type\s*/Page[^s]", data))
    print("ok", out, out.stat().st_size, "bytes,", pages, "pages")
    sys.exit(0 if pages else 1)
print("FAILED", out)
sys.exit(1)
