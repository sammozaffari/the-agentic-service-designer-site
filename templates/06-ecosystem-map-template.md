# Template: Ecosystem / Context Map (kind 06)

> Provenance: 12-service-dominant-logic/04 · 09-mapping-experiences/06 · 08-orchestrating-experiences/05 · articles/12, /13.
> Produced by: Researcher (context view) and Mapper (mapping view). Acceptance (machine-checked): actors non-empty · value flows named · channels listed with roles. Review gate: critic.

## Purpose

Show the value network the service sits in — actors, value flows, channels, dependencies — through an SDL lens: exchange is value co-creation, not delivery (12/04). Basis: research evidence; every actor and flow cited.

## Template

```markdown
# Ecosystem Map — <service> (<context|mapping> view)

## Metadata
- Project: <project id>   Artifact: 06-ecosystem-map.<slug>   Status: <draft|final>
- View: <context — boundary setting | mapping — orchestration target>

## Actors
| Actor | Type (org/person/system) | Role in value network | Evidence refs |
|---|---|---|---|

## Value flows
| From → To | Value exchanged (co-created benefit) | Channel | Evidence refs |
|---|---|---|---|

## Dependencies & constraints
<regulatory, technical, contractual walls — evidence-cited>
## Orchestration implications (mapping view)
<channel-role candidates feeding kind 15>
```

## Renderer spec

- Mermaid `flowchart LR`; actors as nodes (ASCII ids), value flows as labeled edges (`V1[benefit]`); subgraphs per value chain; no emoji.
- Distinguish org/system/person by node shape (rect/rounded/cylinder) — never by color alone.

## Anti-patterns

Actor lists without value flows; channels without roles; SDL as buzzword with no value-in-use exchange named; single-org blinkers (ecosystem includes partners/customers of customers).