# Pattern references: Store emergency information

Searched on Mobbin on 17 September 2026 before the screen was built. Each row: the pattern, the reference, what was taken and what was rejected.

| Pattern | Reference | Taken | Rejected |
|---|---|---|---|
| Numbered markers on a plan, paired one-to-one with a numbered list | [Tripadvisor, tour itinerary with mapped stops](https://mobbin.com/screens/b18c23ab-39ce-48a9-9666-d7d1423ab0b5) | The marker number is the only link between the drawing and the words, so the legend can carry the detail the plan has no room for. Markers are filled circles with the number reversed out, large enough to read at a glance | The travel styling: photography, ratings and a booking rail. Nothing on an emergency screen competes with the plan |
| Schematic plan of a building with labelled zones and a controls row above it | [Zillow, property floor plan](https://mobbin.com/screens/13d32017-f704-4bb5-995d-a2059063795b) | A flat line drawing rather than a photograph or a render. Rooms named in small caps inside their own outline, fittings drawn as plain rectangles, the whole thing readable in one colour | Zoom controls and floor switching. One restaurant is one floor, and a control that can hide half the plan is the wrong idea when somebody is looking for a fire blanket |
| A list beside a map where each row states where the thing is in words | [Klook, things to do with mapped pins](https://mobbin.com/screens/5ce8c0d9-c3cb-4724-a68d-50b770767ddc) | Every legend row repeats the location in plain words ("Kitchen, wall beside fryer 1") so the screen still works when it is printed, photocopied and taped inside a cupboard door | Card imagery and prices. The legend rows carry a last-checked date instead, because that is the fact a manager is audited on |

## Colour

Markers are grouped by what the thing does, not by where it is: fire red, first aid and spills green, exits blue, isolation points amber, assembly black. The five groups are named in a legend strip directly under the plan. This uses the semantic tokens already in the design system rather than inventing a sixth palette.
