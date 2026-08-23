# Template: Jobs-to-be-Done Map (kind 39)

> Provenance: 12-service-dominant-logic/03 · 17-101-design-methods/05.
> Produced by: Synthesizer (from Researcher interview evidence via the insight-set). Acceptance (machine-checked): min-nodes 3 · min-evidence-per-node 1 · statement non-empty · jobType never "feature" or "solution". Review gate: critic.

## Purpose

Record what customers hire the service to do — the progress they are trying to make — as evidence, not as a feature wishlist. Every job is a situation + motivation + desired outcome in the customer's own words, classified as functional, emotional or social. A job that names a product, feature or solution is a defect, not a job.

## Template

```markdown
# Jobs-to-be-Done Map — <segment> (<current|future>)

## Metadata
- Project: <project id>   Artifact: 39-jobs-to-be-done.<slug>   Status: <draft|final>
- Segment: <whose jobs>   Evidence base: <insight-set / interview register refs>

## Jobs

| # | Type (functional|emotional|social) | Job statement (When… I want to… so I can…) | Expected outcome | Current effort | Evidence refs |
|---|---|---|---|---|---|
| 1 | <type> | <statement in the customer's words> | <outcome> | <effort today> | ev:<id> |
| 2 | | | | | |

## Outcome links
<which journey stages, value propositions or blueprint steps each job informs — artifact refs>

## Open gaps
<jobs lacking evidence — marked [unverified], surfaced to Researcher>
```

## Renderer spec

- Deterministic SVG: statement cards grouped under Functional / Emotional / Social headers; each card shows the statement, expected outcome, current effort and an evidence-count badge.
- No emoji, no HTML labels; the model writes contract-shaped JSON, never diagram markup.

## Anti-patterns

Job statements that name features or solutions; jobs without evidence; emotional and social jobs collapsed into functional ones; a map beautified before the evidence exists.
