# Template: Stakeholder Map (kind 05)

> Provenance: 01-this-is-service-design-doing/04 · 17-101-design-methods/03 · articles/12.
> Produced by: Researcher. Acceptance (machine-checked): actor non-empty · power/interest separated · relationship named. Review gate: critic (evidence sufficiency).

## Purpose

Map who shapes, who is affected by, and who can block the service — power and interest on separate axes, never merged (17/03). Basis: interviews, workshops, org documentation — evidence-cited.

## Template

```markdown
# Stakeholder Map — <engagement>

## Metadata
- Project: <project id>   Artifact: 05-stakeholder-map.<slug>   Status: <draft|final>

| Actor | Power (1-5) | Interest (1-5) | Relationship to service | Engagement strategy | Evidence refs |
|---|---|---|---|---|---|
| <actor> | <score> | <score> | <role, mandate, stake> | <inform/consult/involve/collaborate> | ev:<id> |

## Influence × interest grid (render)
<quadrant placement per actor>
## Co-creation partners
<actors to involve in co-design, with rationale>
## Missing actors
<roles the design depends on that are absent — surfaced, not papered over>
```

## Renderer spec

- Mermaid `quadrantChart` (title: words/hyphens only) or a position table; influence × interest kept orthogonal.
- Node ids must be ASCII-safe; no emoji.

## Anti-patterns

Single "importance" axis; actors invented without evidence; missing the blockers.