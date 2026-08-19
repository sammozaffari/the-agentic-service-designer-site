# Template: Customer Journey Map (kind 11)

> Provenance: 09-mapping-experiences/04 · 08-orchestrating-experiences/04 · articles/09, /14, /02.
> Produced by: Mapper (from Researcher/Synthesizer evidence). Acceptance (machine-checked): min-nodes 3 · min-evidence-per-node 1 · emotion non-empty · touchpoint non-empty. Review gate: critic.

## Purpose

Capture what the customer experiences across stages — actions, channels, touchpoints, emotion, pain — as evidence, not fiction. Current and future states are separate artifacts. Emotion is derived from quoted lines, never inferred.

## Template

```markdown
# Customer Journey Map — <segment> (<current|future>)

## Metadata
- Project: <project id>   Artifact: 11-journey-map.<slug>   Status: <draft|final>
- Segment: <who is journeying>   Scope: <service boundary>

## Stages

| Stage | Customer actions (evidence) | Channels & touchpoints | Emotion (quoted) | Pain / breakdown | Evidence refs |
|---|---|---|---|---|---|
| <stage 1> | <actions> | <channels> | <emotion from quote> | <pain> | ev:<id> |
| <stage 2> | | | | | |

## Emotion line (derived)
| Stage | Emotion score (1-5) | Supporting quote | Evidence ref |
|---|---|---|---|

## Moments of truth
<list with evidence refs>

## Open gaps
<stages lacking evidence — marked [unverified], surfaced to Researcher>
```

## Renderer spec

- Mermaid `flowchart TB` with per-stage `subgraph` swimlanes; node ids `S<n>J<m>`.
- Emotion line as a markdown table (part of the artifact), not a chart, unless the number ledger exists — then `xychart-beta` (title: words and hyphens only).
- No emoji, no HTML labels.

## Anti-patterns

Emotion scores without quotes; stages without actions; current/future merged; beautifying before evidence exists.
