# Donesafe — brand design language extraction (evidence)

Source: https://www.donesafe.com (live) + theme stylesheet
`/wp-content/themes/hsi-donesafe/dist/styles/main_4fc75884.css` + Typekit `use.typekit.net/xlk4wqj.css`
Captured 2026-08-28.

## Typography
- **MabryPro** (primary sans; `MabryPro, Inter, sans-serif`) — distinctive rounded-humanist grotesque
- **PPFormula** + **novel-display** (Typekit) for display/headlines (`PPFormula, novel-display, serif`)
- **Inter**, **Roboto** (loading fallbacks), **PPWriter** (quotes/refs), SF Mono (code)

## Colour system (by frequency in CSS)
| Colour | Role |
|---|---|
| #3cce93 | Brand mint (dominant accent — fills/icons only; 2.1:1 on white fails AA for text) |
| #097abf | Brand blue (links/focus) |
| #053745 / #074e62 / #206072 | Deep teals (headers, depth) |
| #313e48 / #465660 | Charcoal / slate (text, chrome) |
| #e91d36 | Danger/safety red (fills) |
| #ecfaf4 / #e6edef | Mint / light-grey tints |
| #dadddf | Hairline rules |

## Applied in the recreation
- `base.css` :root: `--brand-*` layer, `--display` stack; `--focus` → #097abf;
  severity/danger text colour → #b42318 (AA on white) with #e91d36 fills.
- Mint used only as non-text accent (icons, chips, progress) — documented decision,
  not an accidental failure.
