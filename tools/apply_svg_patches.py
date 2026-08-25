#!/usr/bin/env python3
"""Apply browser-measured SVG fixes: viewBox expansion for clipped content,
textLength/font-size squeeze for labels overflowing their boxes, and fill
fixes for low-contrast labels. Patch JSON produced by __measure.js."""
import json, re, sys

PATCHES = sys.argv[1]


def fmt(v):
    return str(int(v)) if float(v) == int(float(v)) else str(v)


def apply_svg(block, patch):
    if patch.get('viewBox'):
        ox, oy, ow, oh = patch['oldVB']
        old_attr = re.search(r'viewBox="([^"]+)"', block).group(1)
        block = block.replace(f'viewBox="{old_attr}"', f'viewBox="{patch["viewBox"]}"', 1)
        # stretch a full-canvas background rect if present
        nx, ny, nw, nh = [float(x) for x in patch['viewBox'].split()]
        bg = re.search(r'<rect (?:x="0(?:\.0)?" y="0(?:\.0)?" )?width="%s" height="%s"' % (fmt(ow), fmt(oh)), block)
        if bg:
            block = block.replace(bg.group(0),
                f'<rect x="{fmt(nx)}" y="{fmt(ny)}" width="{fmt(nw)}" height="{fmt(nh)}"', 1)
    if patch.get('texts'):
        parts = re.split(r'(<text )', block)
        # parts: [pre, '<text ', rest0, '<text ', rest1, ...]
        for tp in patch['texts']:
            idx = 2 + tp['ti'] * 2
            if idx >= len(parts):
                print('  WARN text index out of range', tp)
                continue
            seg = parts[idx]
            if 'textLength' in tp:
                seg = re.sub(r'textLength="[^"]*" lengthAdjust="[^"]*" ', '', seg)
                seg = f'textLength="{tp["textLength"]}" lengthAdjust="spacingAndGlyphs" ' + seg
            if 'fontSize' in tp:
                seg = re.sub(r'font-size="[^"]+"', f'font-size="{tp["fontSize"]}"', seg, count=1)
            if 'fill' in tp:
                seg = re.sub(r'fill="[^"]+"', f'fill="{tp["fill"]}"', seg, count=1)
            parts[idx] = seg
        block = ''.join(parts)
    return block


def main():
    patches = json.load(open(PATCHES))
    for page, plist in patches.items():
        html = open(page).read()
        head_end = html.find('</head>')
        head, body = html[:head_end], html[head_end:]
        svgs = list(re.finditer(r'<svg\b.*?</svg>', body, re.S))
        n_applied = 0
        for patch in plist:
            if 'error' in patch:
                continue
            si = patch['svg']
            if si >= len(svgs):
                print(f'{page}: WARN svg {si} out of range ({len(svgs)})')
                continue
            m = svgs[si]
            new_block = apply_svg(m.group(0), patch)
            if new_block != m.group(0):
                body = body[:m.start()] + new_block + body[m.end():]
                svgs = list(re.finditer(r'<svg\b.*?</svg>', body, re.S))
                n_applied += 1
        open(page, 'w').write(head + body)
        print(f'{page}: {n_applied} svgs patched')


if __name__ == '__main__':
    main()
