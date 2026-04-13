# Cendral AI

**A cognitive simulation engine for modeling how geopolitical actors, organizations, and human systems think, argue, remember, and change.**

Cendral is a cognitive simulation engine for modeling how actors perceive events, form beliefs, argue positions, and update shared world state.

It replaces prompt-driven agent loops with:
- deterministic cognition (rule-based belief physics)
- schema-constrained arbitration
- fused semantic, relational, and episodic memory

The result is a structured, reproducible simulation of how systems think and evolve under pressure.

Feed it a real-world event — a border incident, a policy shift, a market shock, a tweet. It produces a structured, reproducible simulation of how actors perceive the event, argue their positions, update the world, and carry the consequences forward.

---

## What It Actually Does

A simulation step runs like this:

1. **An event arrives** — typed, domain-tagged, severity-normalized. Real signals (News API, Twitter) or synthetic.
2. **Personas perceive it** — the PerceptionEngine computes threat vs. opportunity deterministically, based on traits and world context. No LLM required.
3. **Each actor generates an argument** — domain-specific, ideologically grounded, actor-aware. For defense: US doctrine vs. China doctrine vs. proxy actors.
4. **Memory context is fused** — semantic (Pinecone vector similarity to past events), relational (Neo4j graph: alliances, rivalries, trust/hostility), and episodic (recent simulation history). All three feed every arbitration call.
5. **The arbitration engine synthesizes** — a multi-stage LLM pipeline (perception → arguments → final deltas) collapses competing actor positions into bounded, schema-validated worldstate updates.
6. **Cognition rules update each persona** — rule-based, slider-controlled, parametric. Big Five traits, mood, threat perception, strategic posture.
7. **Four macro systems advance** — economic, environmental, informational, demographic drift.
8. **WorldState is saved as an immutable snapshot** — every step is a new document. Time-travel, differential analysis, reproducible runs are native to the design.

Repeat. Emergence follows.

---

## Architecture

| Layer | Doc | What It Does |
|---|---|---|
| Core Architecture | `01-core-architecture.md` | Persona model (10 subsystems), perception engine, cognitive primitives |
| Systems Layer | `02-systems-layer.md` | Economic, environmental, informational, demographic macro-dynamics |
| Simulation Layer | `03-simulation.md` | Orchestration, step/run APIs, worldstate lifecycle |
| WorldState Layer | `04-worldstate-layer.md` | Immutable snapshots, timeline, domain schemas |
| Arbitration Layer | `05-arbitration-layer.md` | Multi-agent fusion — the cognitive core |
| Domain Extensions | `06-domain-extensions.md` | Nine domain packs |
| Cognition Layer | `07-cognition-layer.md` | Rule-based persona drift with parametric sliders |
| Event Layer | `08-event-layer.md` | Signal ingestion, normalization, OSINT pipeline |

**[Executive Summary →](./docs/architecture/exec-summary.md)**

### Three things that make this different

**1. Deterministic cognition, not prompt roleplay.**
The PerceptionEngine and CognitionModule run without LLM calls. Cognition is rule-driven (`trigger → effect → weight × slider`), bounded, and fully auditable. LLMs handle argument generation and arbitration synthesis — not the physics of belief.

**2. Schema-driven arbitration with whitelisted mutations.**
The ArbitrationEngine inspects the domain's Mongoose schema to generate a whitelist of numeric fields the LLM is allowed to modify. It cannot hallucinate new fields or corrupt types. Deltas are bounded. Structural integrity is enforced at the engine level.

**3. Three-tier fused memory.**
Every arbitration call is grounded in:
- **Semantic memory** (Pinecone) — vector similarity to past events and personas
- **Relational memory** (Neo4j) — actor/persona graph with typed edges: alliance, rivalry, proxy, neutral, trust weight, hostility weight
- **Episodic memory** — time-ordered step history for the current run

`MemoryFusion` builds a unified context blob from all three before every LLM call. The arbitration prompt uses it to smooth noise, detect escalation patterns, and respect established alliances rather than overreacting to single events.

---

## Domain Extensions

Nine domains implemented. Each ships with a worldstate schema, persona adapter, cognition rule pack, worldstate adapter, and arbitration configuration. Add a new domain without touching core logic.

| Domain | What It Models |
|---|---|
| **Defense** | Theaters (Indo-Pacific, Eastern Europe, Middle East), actor doctrines, alliance/rivalry graphs, deterrence balance, escalation risk |
| **Political** | Ideology, polarization, electoral dynamics, policy stances |
| **Enterprise** | Organizational health, leadership conflict, decision cycles |
| **Economic** | Market conditions, inflation, volatility, growth |
| **Consumer** | Sentiment, purchasing behavior, brand trust |
| **Marketing** | Content saturation, campaign reach, audience response |
| **Therapeutic** | Individual psychological modeling |
| **Content** | Topic heat, media saturation, narrative spread |
| **Game** | NPC behavior, faction dynamics |

---

## Stack

| Component | Technology |
|---|---|
| Sim Engine | Node.js / Express |
| Relationship Graph | Neo4j |
| Semantic Memory | Pinecone (5 indexes: agents, threads, personas, users, feed) |
| Persistent State | MongoDB / Mongoose |
| LLM | OpenAI GPT-4.1 |
| Signal Ingestion | News API, Twitter OAuth2 |
| Frontend Studio | Next.js (`apps/studio`) |

---

## Getting Started

**Prerequisites:** Node.js 18+, MongoDB, Neo4j, Pinecone, OpenAI API key

```bash
git clone https://github.com/Stuckertks09/cendral-ai.git
cd cendral-ai
npm install
cp .env.example .env
# Configure credentials in .env
npm run dev
```

Sim engine starts on `PORT=5002`.

### Core API

| Endpoint | Description |
|---|---|
| `GET /api/sim/state` | Current worldstate snapshot |
| `POST /api/sim/step` | Advance one macro step |
| `POST /api/sim/reset` | Reset simulation |
| `GET /api/sim/history` | Full worldstate timeline |
| `POST /api/sim/run` | Full multi-step run with debate + arbitration |
| `POST /api/run-complete` | Single step, full pipeline with memory fusion |

---

## Use Cases

**Defense & geopolitical analysis** — theater-level escalation modeling, deterrence dynamics, alliance fragility, adversary doctrine, influence operations

**Political & social research** — opinion drift, polarization cascades, narrative warfare, electorate modeling

**Institutional decision simulation** — organizational stress testing, leadership posture under pressure

**Macro research** — agent-based reactions to policy shocks with full reproducible worldstate history

**Academic** — computational social science, emergent behavior from rule-based cognitive physics

---

## Status

Core engine functional. Memory fusion implemented. Defense domain fully scaffolded. Nine extension packs built.

In progress: Studio UI (scenario builder, side-by-side run comparison, analytics), social graph propagation refinement, exportable reports.

---

## License

ISC