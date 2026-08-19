# Template: Persona Set (kind 09)

> Provenance: 14-outside-in/04 · 17-101-design-methods/04 · 18-universal-methods-of-design/05 · articles/08, /06.
> Produced by: Synthesizer. Acceptance (machine-checked): ≥3 distinct evidence refs per persona · no persona attribute purely demographic · behavioural patterns present. Review gate: critic.

## Purpose

Behavioural personas from evidence — clusters of goals, patterns, and pain, not demographics. A persona you cannot trace to rows is an assumption, marked as such or cut.

## Template

```markdown
# Persona Set — <engagement>

## Metadata
- Project: <project id>   Artifact: 09-persona-set.<slug>   Status: <draft|final>
- Data basis: <register ranges / dataset>

## Persona: <name>

- Behavioural patterns: <what they do, from rows>
- Goals: <what they want to accomplish>
- Pain points: <evidence-cited>
- Context: <situational factors>
- Evidence refs: <≥3 distinct ev:<id> — quotes behind the patterns>
- Assumptions (unmarked rows): <explicit list, or "none">

## Segmentation note
<how clusters were formed, minority-position flags preserved>
```

## Renderer spec

- Markdown tables (no diagram required); optional Mermaid `flowchart LR` cluster view with evidence refs as edge labels.

## Anti-patterns

Demographics-only personas; personality fiction ("loves technology"); one persona per demographic cell; majority-wash of minority clusters (15/06 rule).
