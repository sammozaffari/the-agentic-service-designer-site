# Figma import kit: mechanism-first incident form

Six artboards at 390 x 844 (iPhone 14 frame), exported as SVG with real text and flat shapes so they import into Figma as editable layers. Drag every `.svg` in this folder onto a Figma page. Each artboard is a named group; buttons, choices, fields and cards are named sub-groups, so they can be turned into components after import.

| File | Screen | State |
|---|---|---|
| 00-current-form.svg | The live form, generalised from research notes | Default, submit disabled |
| 01-entry.svg | Proposed start: one entry point | "Something happened" selected |
| 02-incident-what.svg | Incident step 1, mechanism first | "Burn" selected |
| 03-incident-error.svg | Incident step 4, validation | Error summary and two field errors |
| 04-incident-submitted.svg | Submitted, with the summary the manager sees | Success |
| 05-manager-review.svg | Manager assessment after the welfare check | Default |

## Tokens

| Token | Value | Use |
|---|---|---|
| Ink | #111110 | Text, primary button, selected choice |
| Ink soft | #4a4a46 | Secondary text |
| Muted | #6e6e69 | Hints, step labels |
| Line | #bdbdb7 | Borders (3.1:1 against white) |
| Tint | #f4f3ee | Cards, status bar |
| Error | #b3261e on #fbeae8 | Validation |
| Success | #1f6b3a on #eaf4ec | Submitted states |
| Focus | #1d4ed8, 3 px outline, 2 px offset | Keyboard focus on every control |
| Type | Inter 22/700 title, 15/400 body, 14/600 labels, 12.5/400 hints | |
| Radius | 8 px controls, 12 px cards, 22 px phone frame | |
| Spacing | 4 px base; 8, 12, 16, 20 | |

## Components to create after import

Choice (default, selected, focus), Field (default, focus, error, with hint), Button (primary, secondary, disabled), Alert (error), Card (success, summary), Checkbox (unchecked, checked), Status bar.

## Interaction spec

- Entry: one radio group; Continue without a choice shows the error alert and keeps focus on the group.
- Incident: four steps. Step 2 lists only the causes that fit the mechanism chosen at step 1. Step 4 validates when and where; the error summary names both, and each field shows its own message. Submit shows the success card and the summary the manager will receive.
- Hazard: three steps; conditions only; photo recommended, not required.
- Manager review: welfare-check checkboxes, outcome classification (required), immediate actions, preliminary root cause. Submit is disabled after success.
- Every step change moves focus to the screen title and announces through an `aria-live` region.

Built September 2026 from the December 2025 safety reporting research. Concept work; not the employer's system.
