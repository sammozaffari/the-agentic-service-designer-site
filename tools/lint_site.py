#!/usr/bin/env python3
"""Site lint: fails on self-sabotage strings, blocked names, wrong tooling counts,
em dashes in prose, missing en-AU, stray Library nav, appended arrows and numbered kickers,
and on any local href or src that does not resolve. Run from the site root."""
import re, sys, pathlib, glob, html, struct
ROOT = pathlib.Path(__file__).resolve().parent.parent
BANNED = ['under review', 'unconfirmed', 'illustrative', 'not verified', 'cannot confirm', 'would be fabrication',
          'being confirmed', 'being re-checked', 'Failed at nothing', 'Friday ritual', 'client engagements', 'practice studies',
          'Whether this write-up']
BLOCKED = ['Lifelenz', 'Macromatix', 'Vault', 'Yum', 'Donesafe', 'Clever First Aid']
WRONG_COUNTS = [r'\b80 (?:methods|skills)', r'\b30(?:-tool| tools| runtime tools)', r'\b(?:38|39) (?:registered |runtime )?(?:artifact|template) kinds', r'\b12 (?:emitted|platform|distribution)', r'\b232 (?:corpus )?resources', r'\b(?:51|50) published', r'\b43 practice']
def text_of(s):
    s = re.sub(r'<script.*?</script>|<style.*?</style>|<pre.*?</pre>|<code.*?</code>|<svg.*?</svg>', ' ', s, flags=re.S)
    return html.unescape(re.sub(r'<[^>]+>', ' ', s))
errors = []
pages = sorted(glob.glob(str(ROOT/'*.html')) + glob.glob(str(ROOT/'docs/*.html')) + glob.glob(str(ROOT/'articles/*/index.html')) + glob.glob(str(ROOT/'writing/*/index.html')))
for f in pages:
    p = pathlib.Path(f); s = p.read_text(errors='ignore'); rel = p.relative_to(ROOT); t = text_of(s)
    for b in (BANNED if not str(rel).startswith('docs/') else []):
        for m in re.finditer(re.escape(b), t, flags=re.I): errors.append(f'{rel}: banned "{b}"')
    for b in BLOCKED:
        if re.search(r'\b'+re.escape(b)+r'\b', s): errors.append(f'{rel}: blocked name {b}')
    for pat in WRONG_COUNTS:
        if re.search(pat, t): errors.append(f'{rel}: wrong tooling count {pat}')
    if '<html lang="en-AU">' not in s: errors.append(f'{rel}: lang is not en-AU')
    if re.search(r'<nav class="main-nav">(?:(?!</nav>).)*library\.html', s, flags=re.S): errors.append(f'{rel}: Library in header nav')
    if re.search(r'brand-title">The Agentic Service Designer', s): errors.append(f'{rel}: wrong brand block')
    n_dash = len(re.findall(r'—', t))
    if n_dash and str(rel).startswith(('index','articles.html','about','cv','library','writing')) : errors.append(f'{rel}: {n_dash} em dashes in prose')
    if str(rel).startswith('articles/57') and n_dash: errors.append(f'{rel}: {n_dash} em dashes in prose')
    if re.search(r'<span class="kicker">0\d\s*[—·]', s): errors.append(f'{rel}: numbered kicker')

    # v9: artefacts must not be cropped or scroll inside their container
    for m in re.finditer(r'<iframe[^>]*height:\s*\d+px', s):
        errors.append(f'{rel}: iframe with a fixed pixel height')
    for m in re.finditer(r'<(?:div|figure)[^>]*overflow-x:\s*auto[^>]*>\s*<(?:img|svg|table)', s):
        errors.append(f'{rel}: scrolling wrapper around an artefact')
    for m in re.finditer(r'<figure[^>]*class="([^"]*)"', s):
        cls = m.group(1)
        if str(rel).startswith('articles/') and 'fig-wide' not in cls and 'fig-bleed' not in cls:
            errors.append(f'{rel}: figure is not a bleed figure (class="{cls}")')
    col = 1400 if 'showcase' in str(rel) else 1100
    for m in re.finditer(r'<img[^>]+src="([^"]+\.png)"', s):
        src = p.parent / m.group(1).split('?')[0]
        if not src.exists():
            continue
        try:
            w = struct.unpack('>I', src.read_bytes()[16:20])[0] // 2
        except Exception:
            continue
        if w > col / 0.6:
            errors.append(f'{rel}: {m.group(1)} is {w}px wide and would render at {col*100//w} per cent in a {col}px column')
    for m in re.finditer(r'(?:href|src)="([^"#:]+?)(?:#[^"]*)?"', s):
        tgt = m.group(1)
        if tgt.startswith(('http', 'mailto', 'tel', 'data:')): continue
        tgt = tgt.split('?')[0]
        if not (p.parent / tgt).exists(): errors.append(f'{rel}: missing {tgt}')
if errors:
    print('LINT FAILED'); [print(' -', e) for e in sorted(set(errors))]; sys.exit(1)
print('LINT OK', len(pages), 'pages')
