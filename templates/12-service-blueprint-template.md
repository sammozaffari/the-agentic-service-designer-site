# Template: Service Blueprint (kind 12)

> Provenance: 09-mapping-experiences/05 · 19-service-management-and-marketing/07 · 01-this-is-service-design-doing/07 · articles/11, /22, /25.
> Produced by: Mapper. Acceptance (machine-checked): min-nodes 4 · min-evidence-per-node 1 · lane non-empty · lane ∉ {unknown, tbd, n/a}. Review gate: critic.

## Purpose

Specify a service's delivery reality — the organizational x-ray under the journey. Use for operational diagnosis (current state) or delivery specification (future state). Separate artifacts per state; scenario variants are separate artifacts with explicit deltas.

## Template

```markdown
# Service Blueprint — <service name> (<current|future|scenario: name>)

## Metadata
- Project: <project id>   Artifact: 12-service-blueprint.<slug>   Status: <draft|final>
- Variant delta (if scenario): <what changed vs baseline>

## Lanes (five, all mandatory)

| Lane | Nodes (evidence-cited) |
|---|---|
| Physical evidence | <what the customer senses — screens, forms, spaces, notifications> |
| Customer actions | <observable actions, each → evidence ref> |
| Frontstage (above line of visibility) | <visible employee/actor behaviors> |
| Backstage | <invisible employee work> |
| Support processes | <systems, policy, third parties> |

## Line of visibility
<where it is drawn and why — the accountability decision>

## Structural marks
| Mark | Node | Evidence ref | Notes |
|---|---|---|---|
| Wait | <node> | ev:<id> | <duration if known> |
| Failure point (F) | <node> | ev:<id> | <recovery row required — see kind 34> |
| Handoff | <node> | ev:<id> | <between whom> |
| Moment of truth | <node> | ev:<id> | |

## Evidence
<list evidence refs cited by this artifact; every node cites ≥1>
```

## Renderer spec

- Mermaid `flowchart TB`; five `subgraph` lanes in the order: physical evidence → customer actions → frontstage → backstage → support processes; line of visibility drawn as a labeled edge between frontstage and backstage.
- Node ids: `PE<n>`, `CA<n>`, `FS<n>`, `BS<n>`, `SP<n>`; marks as labeled edges (`-->|wait 4m|`), F nodes as `F<n>[text]`.
- No emoji, no HTML labels, ASCII-safe ids (article template rules).

## Anti-patterns

Placeholder lanes; merged as-is/to-be; LLM-drawn Mermaid; backstage orphans (nodes not enabling a frontstage node); failure points without recovery rows.
