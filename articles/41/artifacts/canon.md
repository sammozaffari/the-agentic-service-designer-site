# COPPERLINE 2000 — Project Canon (single source of truth)

> INTERNAL: every agent building an artifact for this engagement reads this file
> first and follows it exactly. If your artifact contradicts the canon, the canon
> wins. Fictional composite engagement — all people, quotes, figures, stores and
> outcomes are synthetic.

## 1. The fictional client

| Field | Value |
|---|---|
| Company | **Copperline Chicken** (colloquially "Copperline") |
| What | Charcoal-grilled chicken fast-food chain |
| Scale | **2,000 stores**, single country, 41,300 crew, 2,140 salaried managers |
| Ownership | 1,220 company-owned; 780 franchised across 62 franchise partners |
| HQ | Port Meridian Support Centre (fictional) — 340 head-office staff |
| Supply | 4 regional distribution centres (Northline, Eastcliff, Harbourgate, Southmere) |
| Engagement | **"Copperline 2000" — Full-Operation Service Blueprint & Field Study** |
| Duration | 6-week field study, then reporting |

**Store formats (use these exact numbers everywhere):**

| Format | Count | Avg daily orders | Crew per shift (peak) |
|---|---|---|---|
| Flagship grill-house | 68 | 1,850 | 18 |
| Standard | 1,214 | 720 | 9 |
| Food-court | 389 | 940 | 7 |
| Drive-thru express | 251 | 1,310 | 8 |
| Travel-hub kiosk | 78 | 610 | 4 |

**Revenue mix:** dine-in 36% · drive-thru 38% · app + delivery aggregators 26%.
**Peak windows:** 11:30–13:30 and 17:30–19:30 (62% of daily volume).

## 2. Named systems (use these exact names)

- **CopperPOS v7** — point of sale (dine-in, kiosk, drive-thru lane screens)
- **ShiftOrbit** — rostering, shift swaps, time-and-attendance (crew app + manager console)
- **StockBeak** — inventory, waste logging, auto-replenishment proposals
- **Q-Pulse** — food-safety and quality checklists (temperature logs, closure audits)
- **VoiceBoard** — customer feedback ingestion (app reviews, receipts QR, aggregator ratings)
- **Flamebook** — franchisee intranet (ops manuals, LTO launches, compliance notices)
- **Route56** — delivery aggregator integration layer (three aggregators: "Dashly", "Wheelio", "Pedalr")

## 3. Named people (fictional — reuse, never rename)

- **Priya Nair** — Chief Operating Officer (sponsor)
- **Marcus Adeyemi** — VP Store Operations
- **Sofia Reyes** — Director of Labour & Rostering
- **Daniel Okafor** — Head of Franchise Relations
- **Hana Kim** — Head of Digital & Delivery
- **Tom Whelan** — Regional Manager, Northline (14 years tenure)
- Flagship interviewees: **Aisha Rahman** (Flagship GM, Harbourgate Flagship #14), **Bo Chen** (shift leader), **Grace Mwangi** (crew, 8 months), **Elena Petrova** (franchisee, 6 stores), **Jack Doyle** (aggregator courier), **Mei Lin** (regular customer, office worker), **Raj Patel** (call-centre team lead), **Oscar Villanueva** (DC inbound supervisor)

## 4. Key synthetic metrics (use verbatim)

- Crew turnover: **94% annualised** (industry median 78%)
- Average shift-swap request: **11 per store per week**; 31% need manager rework
- Roster published <72h before week start: **41% of stores**
- Drive-thru window time: median **246s**, target 180s
- Order accuracy (mystery shopper): **91.4%**; aggregator in-app rating **4.3/5**
- Waste: **3.8%** of chicken weight; target 2.5%
- eNPS (crew): **−8**; customer NPS **+31**
- Breakage in handoffs crew→courier: **0.7%** of delivery orders
- Q-Pulse compliance: 96.2% checks done, but 22% logged "in bulk at close" (falsified timing)

## 5. Engagement structure

- **Channel (Buzz):** `sd/copperline-2000` on the `tm` community relay
- **ASD roles dispatched:** Orchestrator, Researcher, Synthesizer, Mapper, Ideator, Measurer, Presenter, Critic (`sd_review`); plus two coding-agent advisors (Codex CLI, Kimi CLI in article 42's lane; DSH plugin agents in article 43's lane)
- **Phases:** scaffold → research → synthesis → (this engagement stops at delivery of reports + proposals; prototyping NOT executed — say so honestly)
- **Data collection simulation:**
  - 8 flagship interviews (Harbourgate Flagship #14 + Northline Flagship #3)
  - Surveys: 412 store managers (of 2,000), 1,893 crew (of 41,300)
  - Channels: 90-day VoiceBoard extract, POS sample (120 stores), 60 mystery-shopper reports, 3 aggregator rating exports, call-centre logs (2 weeks)

## 6. House style — non-negotiable

1. **Provenance first.** Every artifact opens with a data-boundary note: "Fictional composite engagement. Every person, quote, figure and outcome is synthetic. No real company, store, or person is described."
2. **Template alignment.** Artifacts map to the SDAP template catalog kinds: brief→01(design-brief), stakeholder-map→05, ecosystem-map→06, insight-register→07, persona-set→09, journey-map→11, service-blueprint→12, proposals→31(opportunity-matrix), deck→33(presentation-deck), analysis→28(experience-audit lens)+32(executive-report). Cite books as `NN/CH` (e.g. `01/07` = This Is Service Design Doing ch.7).
3. **Color code (use exact hexes everywhere):**
   - Customer actions `#2563eb` (blue) · Frontstage `#16a34a` (green) · Backstage `#d97706` (amber) · Support processes `#9333ea` (purple) · Data & systems `#0891b2` (cyan) · Physical evidence `#64748b` (slate)
   - Node types: wait = hatched gray `#94a3b8`; fail-risk = red ring `#dc2626`; handoff = dashed border; decision = diamond
4. **Notes are numbered** `N001`…`N3xx` continuous across the whole artifact set. Blueprints/reports reference note IDs, never renumber.
5. Self-contained HTML artifacts (inline CSS, no external deps except optional Google-font-free system stack). Dark-on-light readable print-friendly pages with a fixed max-width and a sticky legend where relevant.
6. Articles use the site classes: `art-hero`, `art-meta` chips, `art-rail` TOC, `art-sec` with `sec-kicker`, author block, evidence ledger section, references. Title pattern: `NN. <Title> — The Agentic Service Designer`.

## 7. File inventory (who builds what)

```
articles/41/index.html                      ← Article 41 (Buzz approach)
articles/41/artifacts/brief.html            ← engagement brief
articles/41/artifacts/service-blueprint.html← THE comprehensive blueprint
articles/41/artifacts/analysis-report.html  ← blueprint analysis
articles/41/artifacts/stakeholder-map.html
articles/41/artifacts/ecosystem-map.html
articles/41/artifacts/insight-register.html
articles/41/artifacts/persona-set.html
articles/41/artifacts/journey-map.html
articles/41/artifacts/slide-deck.html       ← current-state deck
articles/41/artifacts/proposals.html        ← 10 directions
articles/41/artifacts/buzz-transcript.html  ← channel log
articles/41/artifacts/research/interviews.html
articles/41/artifacts/research/surveys.html
articles/41/artifacts/research/channels.html
articles/42/index.html                      ← Article 42 (CLI/OMP approach)
articles/43/index.html                      ← Article 43 (DSH approach)
```

Articles 42/43 link to shared artifacts via `../41/artifacts/<name>.html`.

## 8. The ten proposals (canon titles — proposals.html expands each)

1. **Roster Stability Program** — publish rosters ≥7 days ahead; standing swap marketplace in ShiftOrbit
2. **Drive-Thru 180** — kitchen-to-window sub-process redesign targeting 180s median
3. **One Copperline Handover** — single crew→courier handover standard across aggregators
4. **Crew Voice Loop** — weekly 2-minute crew pulse wired to Roster Stability metrics
5. **Waste-to-Order Forecasting** — StockBeak LTO-aware demand curves to cut chicken waste to 2.8%
6. **Q-Pulse Honest Logging** — timestamp-enforced checklists, kill "bulk-at-close"
7. **Franchise Ops Bridge** — Flamebook playbook versioning + Daniel's team office hours
8. **Kiosk Accessibility Pass** — travel-hub + food-court kiosk WCAG 2.2 AA remediation
9. **Recovery Ladder** — standardised service-recovery bands at POS, courier and call-centre
10. **Blueprint-as-Living-Document** — quarterly re-baseline of the Copperline 2000 blueprint via the same agent pipeline
