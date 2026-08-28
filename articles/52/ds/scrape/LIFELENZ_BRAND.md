# Lifelenz — brand design language extraction (evidence)

Source: https://www.lifelenz.com (live) + shared Webflow CSS
`cdn.prod.website-files.com/62900796070f7821feab0a4c/css/lifelenz.webflow.shared.02740a5a2.min.css`
Captured 2026-08-28.

## Typography
- **Gotham** (primary brand sans; licensed) with **Montserrat** fallback
- Semantic display used in product marketing; product UI conventions from the engagement (mono for data)

## Colour system (by frequency in CSS)
| Colour | Role |
|---|---|
| #0a3558 | Brand navy (primary) |
| #10235d | Brand indigo (deep) |
| #0050bd | Primary blue |
| #2179de | Mid blue |
| #92c3fb | Light blue |
| #758696 | Slate grey (secondary) |
| #e5f2fb | Light blue tint |
| #1a1b1f | Charcoal (text/sidebar) |
| #fafafa / #eaeff3 | Surface neutrals |

## Applied in the recreation
- `ds-tokens.css` :root: `--ds-brand-*` layer + functional status palette kept
  AA-safe and independent of the navy (compliance semantics).
- Font stack: Gotham → Montserrat → system sans. Mono retained for data.
