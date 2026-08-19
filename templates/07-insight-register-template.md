# Template: Insight Register (kind 07)

> Provenance: 01-this-is-service-design-doing/05 · 03-service-design-from-insight-to-implementation/04 · articles/16.
> Produced by: Researcher (rows) and Synthesizer (insight statements). Acceptance (machine-checked): each insight named · ≥1 evidence ref · observation → implication → design response present. Review gate: critic (traceability chain).

## Purpose

The single evidence-backed statement layer between research and design. Every insight carries the observation (evidence-cited), the implication, and the design response — the traceability chain articles demand (insight → HMW → concept → hypothesis → KPI).

## Template

```markdown
# Insight Register — <engagement>

## Metadata
- Project: <project id>   Artifact: 07-insight-register.<slug>   Status: <draft|final>

| Insight id | Observation (evidence-cited) | Implication | Design response | Evidence refs | Traced to (HMW/concept/KPI ids) |
|---|---|---|---|---|---|
| INS-01 | <what users said/did, quoted> | <so what> | <therefore design should…> | ev:<id> | HMW-… → CON-… → KPI-… |

## Minority positions
<contradictions and small clusters preserved — with evidence>

## Open questions
<what the register cannot yet answer — surfaced to Researcher>
```

## Renderer spec

- Markdown table (canonical); optional Mermaid `flowchart LR` traceability chain INS → HMW → CON → KPI (article 16 pattern). No emoji.

## Anti-patterns

Insights without observations; observations without quotes; design responses without implications; contradictions flattened; chain broken (insight with no downstream HMW/KPI).