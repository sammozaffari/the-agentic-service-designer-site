# Working in this repository

This is a portfolio site. It is also the design system that the portfolio is arguing for,
so the gates below are part of the work, not overhead. Everything here fails the build
rather than warning.

## Before writing a component

Search `assets/product/components.manifest.json` first. It lists every class the design
system defines, generated from `assets/product/components.css` so it cannot drift. If a
component already exists, use it. If you need a new one, add it to `components.css` and
regenerate the manifest; the lint fails on any `p-` class used in a screen that is neither
in the manifest nor defined in that screen's own style block.

## Tokens

`assets/product/tokens.dtcg.json` is the source, written in the W3C Design Tokens
Community Group shape. `assets/product/tokens.css` is generated from it by
`tools/build_tokens.py`. Never edit the CSS directly: `tools/lint_site.py` runs
`build_tokens.py --check` and fails if the two are out of step.

There is one mode. The DTCG Resolver module is the agreed answer to theming and is still
a preview draft that says not to implement it, so this system does not pretend to have
modes it cannot build.

No raw colour values in a screen. Every colour, space, radius and duration comes from a
token.

## The gates

| Gate | Command | Fails on |
|---|---|---|
| Tokens in step | `tools/build_tokens.py --check` | CSS out of date with the DTCG source |
| Contrast | `tools/contrast_check.py` | Any text pair under 4.5:1, any control border under 3:1 |
| Component registry | `tools/lint_site.py` | A `p-` class that is not declared anywhere |
| Site content | `tools/lint_site.py` | Blocked vendor names, wrong counts, broken local links, cropped artefacts, em dashes |
| Visual regression | `tools/visual_check.py` | A screen that has changed against its committed baseline |

Run `tools/lint_site.py` before you consider anything finished.

## Capturing screens

`tools/capture.py manifest.json` renders a page to a 2x PNG. Two things about headless
Chrome are load-bearing: it lays out at about 500px minimum, so anything requested
narrower comes back as a cropped desktop layout rather than a phone view, and it writes
the PNG and then often fails to exit, so success is judged by the written file and the
process group is killed either way.

## Writing

Australian English. No em dashes. Nothing negative about Sam, and nothing that disclaims
the work. Never invent research, counts, quotations or outcomes; scale figures live in
`data-scale.json` and are propagated by `tools/apply_scale.py`.
