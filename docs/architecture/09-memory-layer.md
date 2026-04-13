# **SECTION 9 — MEMORY LAYER**

*How the engine remembers, what it remembers, and why three distinct systems are required.*

---

## **9.1 Why Memory Exists**

A simulation without memory is stateless. Each step reacts to the current event with no awareness of what came before — no recognition of patterns, no respect for established relationships, no ability to distinguish a genuine escalation from noise.

The Memory Layer solves this by giving every reasoning call in the engine access to three distinct dimensions of prior knowledge:

- **What similar events felt like** (semantic)
- **Who is allied with or hostile to whom** (relational)
- **What just happened in this run** (episodic)

Each dimension captures something the others cannot. Together, they produce the kind of grounded, context-aware reasoning that prevents the simulation from overreacting to single events and allows patterns to accumulate meaningfully over time.

---

## **9.2 Architecture Overview**

The Memory Layer is organized into three subsystems, each with its own storage backend, plus a fusion class that assembles all three into a single context blob before each LLM reasoning call.

```
MemoryFusion
    ├── PineconeMemory     (semantic — vector similarity)
    ├── GraphMemory        (relational — Neo4j graph)
    └── EpisodicMemory     (temporal — step history)
```

**File:** `src/memory/MemoryFusion.js`

All three subsystems are initialized through `MemoryFusion`. The engine calls `MemoryFusion.buildContext()` before arbitration, which queries all three layers and returns a unified memory blob. That blob is passed into every LLM call in the arbitration pipeline.

---

## **9.3 Semantic Memory — PineconeMemory**

**File:** `src/memory/semantic/PineconeMemory.js`
**Backend:** Pinecone (serverless, AWS us-east-1)
**Embedding dimension:** 3072 (OpenAI text-embedding-3-large)
**Metric:** Cosine similarity

### What it stores

Four typed indexes, each serving a distinct memory space:

| Index | What it holds |
|---|---|
| `cendral-personas-v1` | Persona beliefs, episodic summaries per persona |
| `cendral-actors-v1` | Actor doctrines, event histories per actor |
| `cendral-leaders-v1` | Leader crisis responses and interpretations |
| `cendral-events-v1` | All simulation events with domain/topic/severity metadata |

### What it answers

Given a natural language query — typically derived from the current event's summary or raw text — it returns the top-K most semantically similar entries from any index. This answers questions like:

- "Have we seen an event like this before in this domain?"
- "What doctrine has this actor historically held around events of this type?"
- "What beliefs does this persona hold that are relevant to this topic?"

### Vector ID structure

Every stored vector follows a hierarchical ID format:

```
{type}:{id}:{subKey}:{timestamp}
```

Examples:
```
persona:alex:belief:1712345678901
actor:usa:doctrine:1712345678902
leader:potus:crisis:event_abc123
```

This allows precise filtered recall by owner, type, and memory subtype without scanning the full index.

### Specialized write methods

Rather than generic upserts, PineconeMemory exposes intent-specific write methods that ensure consistent text formatting and metadata:

- `storePersonaBelief(personaId, beliefObj)` — stores belief statement with salience and confidence
- `storePersonaEpisodic(personaId, event, summary)` — stores persona's lived experience of an event
- `storeActorDoctrine(actorKey, doctrineObj)` — stores actor strategic doctrine
- `storeActorEvent(actorKey, event)` — stores actor's encounter with a specific event
- `storeLeaderCrisisMemory(leaderKey, event, interpretation)` — stores leader's crisis response pattern
- `storeEventMemory(event)` — stores the event itself for cross-domain similarity search

---

## **9.4 Relational Memory — GraphMemory**

**File:** `src/memory/relational/GraphMemory.js`
**Backend:** Neo4j (Aura or self-hosted)
**Query language:** Cypher

### What it stores

A live property graph with three node types and typed edges between them:

**Node types:**

| Node | Key properties |
|---|---|
| `Persona` | id, name, openness, neuroticism |
| `Actor` | key, label, militaryStrength, cyberCapability, nuclearPosture |
| `Leader` | key, name, title, hawkishness, riskTolerance |

**Edge types:**

| Edge | Between | Properties |
|---|---|---|
| `RELATES_TO` | Persona → Persona | trust, hostility |
| `RELATION` | Actor → Actor | type (alliance/rivalry/proxy/neutral), trust, hostility |
| `LEADS` | Leader → Actor | (structural) |

### What it answers

Given a focal actor key, GraphMemory returns all outbound relationships with their type and current trust/hostility scores. The `graphSignals.js` layer computes aggregate signals from those relationships:

```javascript
{
  cohesion: computeNetworkCohesion(relations),
  avgTrust: ...,
  avgHostility: ...,
  escalationRisk: ...
}
```

These signals feed directly into arbitration context, telling the LLM things like: "This actor's alliance network is currently fragmented" or "This actor faces high average hostility from its neighbors."

### Dynamic relationship updates

Relationships are not static. `updateActorRelationship(actorA, actorB, delta)` applies trust and hostility deltas in place:

```cypher
SET r.trust = coalesce(r.trust, 0.5) + $trustDelta,
    r.hostility = coalesce(r.hostility, 0.2) + $hostilityDelta
```

This means the graph evolves with the simulation. An alliance that weathers repeated stress events accumulates trust. A rivalry that experiences repeated incidents accumulates hostility. The graph is a living record of relationship state, not a static configuration.

### Why Neo4j and not a relational DB

Graph traversal is the operation. "Who are all actors within 2 hops of the USA that have hostility > 0.6?" is a natural graph query and an expensive join chain in SQL. Neo4j handles this natively and the Cypher syntax maps directly to the relational reasoning the arbitration layer needs.

---

## **9.5 Episodic Memory**

**File:** `src/memory/episodic/`
**Backend:** MongoDB

### What it stores

A time-ordered record of simulation steps within a run:

```javascript
{
  domain,
  eventId,
  worldStateId,
  runId,
  stepIndex,
  arbitrationSummary,
  raw: { event, worldState, arbitration }
}
```

### What it answers

Given a domain and a set of persona IDs, episodic memory returns the most recent N steps. This answers: "What has actually happened in this simulation so far?" It provides the short-term context that prevents arbitration from treating step 15 with the same naivety as step 1.

The arbitration prompt uses episodic context to:
- Detect repeated escalation in a theater (bias delta upward)
- Recognize successful de-escalation patterns (moderate the response)
- Avoid contradicting recent worldstate changes that haven't had time to settle

---

## **9.6 MemoryFusion — The Integration Layer**

**File:** `src/memory/MemoryFusion.js`

This is the class the rest of the engine interacts with. It abstracts all three memory systems behind two primary operations: **write** and **read**.

### Write: `recordStep(params)`

Called after every arbitration step. Writes to all three systems simultaneously:

```javascript
await memoryFusion.recordStep({
  domain,
  event,
  worldState,
  actors,
  leaders,
  personas,
  arbitration
});
```

- Semantic: upserts event, personas, and actors to Pinecone
- Relational: creates/merges actor nodes, leader nodes, persona nodes, and all their edges in Neo4j
- Episodic: records the step summary to MongoDB

Each subsystem write is wrapped in independent try/catch — a failure in one does not abort the others.

### Read: `buildContext(params)`

Called before every arbitration LLM call. Queries all three systems and returns a unified blob:

```javascript
const memory = await memoryFusion.buildContext({
  domain,
  event,
  focalActorKey,
  personaIds,
  theaterKey
});

// Returns:
{
  domain,
  eventId,
  theaterKey,
  semantic: {
    similarEvents: [...],
    relatedPersonas: [...]
  },
  relational: {
    actorRelations: [...],
    actorSignals: { cohesion, avgTrust, avgHostility, escalationRisk }
  },
  episodic: {
    episodes: [...]
  }
}
```

This blob is passed as the `memory` parameter to both `ArbitrationEngine.arbitrate()` and `DefenseArbitrator.run()`.

---

## **9.7 How Memory Shapes Arbitration**

The arbitration prompt uses memory explicitly. From `ArbitrationEngine.js`:

```
Use this memory to:
- Prefer updates consistent with long-run patterns
- Avoid overreacting to single events when memory shows stability
- Detect early warning signs when memory shows repeated small escalations
- Respect established alliances / rivalries found in relational memory
```

From `DefenseArbitrator.js` arbitration stage:

```
- If memory shows repeated escalation in this theater → bias stanceDelta & volatilityDelta upward
- If memory shows successful de-escalation patterns → modestly reduce stanceDelta / escalation risk
- If historical alliance strain exists → dampen positive allianceCohesionDelta
- If relational memory indicates very strong alliances → do not overstate fragmentation
```

This is the mechanism that makes the simulation accumulate meaning over time rather than resetting cognitively with each event.

---

## **9.8 Memory Layer Design Principles**

**Each tier captures a different epistemological dimension.**
Semantic memory knows what's similar. Relational memory knows who's connected. Episodic memory knows what happened. No single backend captures all three. Collapsing them into one would lose the distinctions that make each tier useful.

**Writes are non-blocking and fault-tolerant.**
Memory writes happen after the simulation step completes. A Pinecone outage does not stop the sim. Each subsystem fails independently.

**The graph is a living structure, not a config file.**
Actor relationships are initialized from domain configuration but mutate as the simulation runs. Trust and hostility scores drift with events. The graph state at step 20 reflects the simulation's history, not just its starting conditions.

**Memory is optional at the call level.**
Both `ArbitrationEngine` and `DefenseArbitrator` accept `memory = null`. The system degrades gracefully without memory context — it simply runs without it. This allows single-step or stateless runs without requiring full memory infrastructure.

**Vector IDs are deterministic and hierarchical.**
The `{type}:{id}:{subKey}:{timestamp}` format allows targeted recall by any combination of owner, memory type, and subtype without scanning full indexes.