# **SECTION 10 — PROMPT PACKS & CONFIG PACKAGES**

*Runtime-configurable prompts and reproducible scenario snapshots.*

---

## **10.1 Overview**

Two models govern how the engine is configured at runtime: **PromptPack** and **ConfigPackage**.

They solve different problems.

**PromptPack** answers: *"What instructions does the LLM receive for this domain's perception, argument generation, and arbitration stages?"*

**ConfigPackage** answers: *"What is the complete, reproducible configuration snapshot required to run this scenario?"*

Together they allow the engine to be tuned, versioned, forked, and reproduced without touching code.

---

## **10.2 PromptPack**

**File:** `src/models/PromptPack.js`
**Storage:** MongoDB
**Unique index:** `domain + key + environment`

### What it is

A PromptPack is a versioned, domain-specific set of LLM instructions stored in the database. Instead of hardcoding prompts inside arbitration classes, the engine loads the appropriate PromptPack at runtime before any LLM call is made.

This means prompts can be updated, A/B tested, or swapped between environments without a code deploy.

### Schema

```javascript
{
  domain:             String   // "defense" | "political" | "enterprise" | ...
  key:                String   // e.g. "default_v1", "hawkish_v2"
  environment:        String   // "prod" | "staging" | "dev"

  systemPrompt:       String   // Top-level LLM persona / role definition
  perceptionPrompt:   String   // Instructions for the global threat assessment stage
  argumentPrompt:     String   // Instructions for actor-specific argument generation
  arbitrationPrompt:  String   // Instructions for final delta synthesis

  metadata: {
    version:    Number
    author:     String
    notes:      String
    createdAt:  Date
  }
}
```

### The four prompt slots

Each PromptPack carries four prompts that map directly to the four reasoning stages of the arbitration pipeline:

**`systemPrompt`** — defines the LLM's role for all calls in this domain. For defense: "You are a geopolitical analyst with deep expertise in military doctrine, deterrence theory, and alliance dynamics." This is passed as the system message on every OpenAI call within the domain.

**`perceptionPrompt`** — instructions for the global threat assessment stage. Receives the event, worldstate, actor summaries, and memory context. Outputs a structured JSON perception object.

**`argumentPrompt`** — instructions for actor-specific argument generation. Each actor generates a position on the event tied to their doctrine, theater presence, and alliance structure. Outputs a structured arguments array.

**`arbitrationPrompt`** — instructions for final synthesis. Merges all actor arguments into net theater-level deltas and global metric deltas. This is the stage that produces the worldstate updates.

### How it's loaded

The `DefenseArbitrator` loads a PromptPack at the start of every `run()` call:

```javascript
const promptPack = await PromptPack.findOne({
  domain: "defense",
  environment: "prod",
  key: "default_v1"
}).lean();
```

If no PromptPack is found, the arbitrator skips gracefully and returns empty results. This makes the system fault-tolerant — a missing pack doesn't crash the simulation.

### Versioning and environments

The unique compound index on `domain + key + environment` means you can maintain parallel prompt versions:

```
defense / default_v1 / prod      ← live
defense / default_v1 / dev       ← development
defense / hawkish_v2 / staging   ← experiment
```

Switching between versions is a database query change, not a code change. This is how you'd run controlled experiments — same event, same actors, different prompt packs — and compare outputs.

### Supported domains

```
political | defense | enterprise | marketing |
content | therapeutic | consumer | game | general
```

---

## **10.3 ConfigPackage**

**File:** `src/models/ConfigPackage.js`
**Storage:** MongoDB
**Schema mode:** strict, minimize: false (preserves empty objects for diffing)

### What it is

A ConfigPackage is an immutable snapshot of every engine setting required to deterministically reproduce a simulation run. It captures cognition sliders, memory settings, macro system settings, domain topic configurations, and which systems are enabled — all in one document.

The design intent is reproducibility. Given a ConfigPackage ID, you can reconstruct exactly how a simulation was configured and re-run it with different events or different personas and isolate the variables.

### Schema

```javascript
{
  // Identity
  name:              String    // human-readable label
  description:       String
  tags:              [String]
  parentPackageId:   ObjectId  // optional — for forked configurations

  // Engine configuration snapshots
  cognition:         Object    // full CognitionSettings snapshot (sliders, pack overrides)
  memory:            Object    // full MemorySettings snapshot
  systems:           Object    // { SystemClassName: settingsObject, ... }

  // Domain topic initialization
  domains: {
    defense: {
      topics: [
        {
          key:        String
          label:      String
          stance:     Number
          certainty:  Number
          volatility: Number
          category:   String
          tags:       [String]
        }
      ]
    }
    // political, economic, content — future
  }

  // Runtime flags
  enabledSystems:    [String]  // e.g. ["EconomicSystem", "InfoFlowSystem"]

  // Metadata
  createdAt:         Date
  createdBy:         String
  version:           Number
}
```

### Key design decisions

**`parentPackageId` enables forking.** If you want to run a variant of an existing configuration — same everything except one slider — create a new ConfigPackage with `parentPackageId` pointing to the original. This creates an auditable lineage of configuration changes over time.

**`minimize: false`** keeps empty objects in the document. This matters for diffing — you can compare two ConfigPackages and see exactly which fields changed, even if some nested objects are empty. An empty `{}` and a missing field are treated differently.

**`enabledSystems`** controls which macro systems run during a simulation. You can run a defense simulation with only `InfoFlowSystem` and `EconomicSystem` active, leaving out environment and population dynamics. This allows focused simulations without modifying code.

**Domain topics are initialized here.** The starting `stance`, `certainty`, and `volatility` for each topic in a domain come from the ConfigPackage, not from the worldstate schema defaults. This means two simulations can start with identical code but different topic postures — one starting from a high-tension baseline, one from a stable baseline.

### Relationship to PromptPack

ConfigPackage and PromptPack are complementary but separate:

- ConfigPackage controls **how the engine behaves** (cognition physics, system dynamics, topic initialization)
- PromptPack controls **what the LLM is told** (reasoning instructions per domain per stage)

A fully reproducible simulation requires both: the same ConfigPackage ID and the same PromptPack key. Together they define the complete experimental condition.

---

## **10.4 Operational Pattern**

A typical simulation setup sequence:

```
1. Seed PromptPack for domain ("defense", "default_v1", "prod")
2. Create or load ConfigPackage (cognition sliders, enabled systems, topic baselines)
3. Initialize WorldState from ConfigPackage domain topics
4. Run simulation — DefenseArbitrator loads PromptPack per step
5. ConfigPackage ID stored on SimulationRun for reproducibility
```

To run a variant:
```
1. Fork ConfigPackage (parentPackageId = original)
2. Adjust one slider or topic baseline
3. Run with same PromptPack
4. Compare worldstate timelines
```

To test prompt changes:
```
1. Create new PromptPack (same domain, new key, staging environment)
2. Run simulation with new pack
3. Compare arbitration outputs to prod pack
4. Promote to prod when satisfied
```

This separation of prompt configuration from engine configuration is what makes Cendral a research platform rather than a fixed simulation — every variable is independently controllable and every run is reproducible.