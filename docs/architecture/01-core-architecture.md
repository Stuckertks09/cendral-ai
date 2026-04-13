
#  **SECTION 1 — CORE ARCHITECTURE (Cognitive Engine)**

*How the engine understands events, transforms internal states, updates personas, and forms the primitives for every simulation domain.*

---

# ## **1. Overview**

The **Core Architecture** provides the fundamental “cognitive physics” layer of the system.
Everything else — political reasoning, market reactions, therapeutic behavior, content flows — is built on top of these primitives.

This layer defines:

* What a **persona** *is*
* How personas **perceive events**
* How cognition rules **modify internal state**
* How global sliders and domain packs **shape sensitivity**
* How events are structured and consumed
* How LLMs are called (optionally)
* How personas are created, hydrated, saved, and extended

This section documents the purpose, structure, and operation of each core component.

---

# ## **2. Core Components**

---

# ### **2.1 CorePersona — The Agent Substrate**

**File:** `src/core/persona/CorePersona.js`
**Type:** Mongoose schema + instance methods

The **CorePersona** model is the universal definition of an agent.
It is intentionally over-complete to support *any* domain (political, economic, enterprise, therapeutic, etc.) without needing separate base models.

A persona contains **ten major subsystems**:

1. **Identity**

   * Name, demographics, geography, religion, socioeconomic context
   * Self-image and how they believe others see them

2. **Background**

   * Upbringing, education, trauma history, cultural influences
   * Key life events with impact levels

3. **Values, Beliefs, Goals**

   * Vector of priorities
   * Domain-specific belief structures
   * Goal systems with priority bands

4. **Psychology**

   * Big Five traits
   * Mood, arousal, valence
   * Triggers, fears, regulation style
   * Intent profiles

5. **Reasoning Engine Fields**

   * Policy rules
   * Sensitivity to world changes (economic, social, institutional, novelty)

6. **Social Graph**

   * Relationships with strength, confidence, type
   * Supports influence propagation and trust weighting

7. **Communication Style**

   * Tone sliders (authority, warmth, brevity, etc.)
   * Conflict style and rhetorical preferences

8. **Memory Interface**

   * Episodic, semantic, working memory hooks
   * (Future) integration with Pinecone or Mongo vector stores

9. **Action Space**

   * Allowed cognitive or behavioral actions
   * Useful for planning or simulation games

10. **Extensions Container**

    * Domain-specific additions (“packs”)
    * E.g., `political`, `therapeutic`, `content`, `economic`, etc.

**Runtime Enhancements**
Each loaded persona is hydrated with **extension adapters** via PersonaFactory.
These provide domain-specific logic, defaults, and cognition rules.

---

# ### **2.2 PersonaFactory — Construction + Hydration Layer**

**File:** `src/core/persona/PersonaFactory.js`
**Purpose:**
Transforms stored JSON/Mongoose docs into *live personas* with:

* Extensions
* Adapters
* Defaults
* Runtime behavior

**Key Responsibilities:**

| Function                          | Purpose                                                       |
| --------------------------------- | ------------------------------------------------------------- |
| `create(coreData, extensionsMap)` | Create a **new persona** from scratch with extension packs    |
| `loadFromObject(raw)`             | Hydrate a stored persona into a runtime persona with adapters |
| `fromPayload(payload)`            | Create from a generic `{ core, extensions }` API payload      |
| `toPublicJSON(persona)`           | Strip runtime objects for API/UI output                       |

This module ensures personas behave correctly inside the simulation.

---

# ### **2.3 PersonaRepository — Persistence Layer**

**File:** `src/core/persona/PersonaRepository.js`

Wraps MongoDB operations with Cognitive Engine semantics.

| Method     | Description                               |
| ---------- | ----------------------------------------- |
| `getById`  | Load persona & hydrate it                 |
| `list`     | Query multiple personas                   |
| `create`   | Create + save new persona with extensions |
| `save`     | Persist persona back to DB                |
| `saveMany` | Batch save                                |
| `export`   | Raw JSON export                           |

This layer abstracts away storage and ensures persona objects always maintain their runtime shape.

---

# ### **2.4 Event Model — The World Input Interface**

**File:** `src/models/Event.js`
**Purpose:**
Defines the **universal event format** used across all domains.

**Key fields:**

* `type` — required (e.g., "news", "tweet", "speech", "attack", "policy")
* `domain` — political, therapeutic, enterprise, etc.
* `topic` — optional fine-grain categorization
* `severity` — normalized 0–1 shock intensity
* `rawText` — raw unprocessed event
* `parsed` — LLM-generated metadata (sentiment, entities, keywords)
* `source` — origin metadata (Twitter, RSS, manual, etc.)
* `timestamp` — ordering and temporal modeling

Events are the **atomic triggers** for cognition.

---

# ### **2.5 PerceptionEngine — Interpreting Events**

**File:** `src/core/perception/PerceptionEngine.js`

The **PerceptionEngine** converts:

```
(event + persona traits + world metrics) → structured perception
```

This stage is intentionally **non-LLM**, giving you deterministic cognitive physics:

* Computes threat vs. opportunity
* Reads trait-based sensitivity
* Reads world metrics (e.g., polarization, instability)
* Forms a natural-language summary for debugging/UI

Example output:

```json
{
  "domain": "political",
  "eventType": "news",
  "topic": "immigration",
  "perceivedThreat": 0.67,
  "perceivedOpportunity": 0.32,
  "summary": "Alice perceives this immigration news event as more threatening..."
}
```

Perception feeds directly into **cognition**, **argument generation**, and **arbitration**.

---

# ### **2.6 CognitionSettings — Global Sliders & Domain Packs**

**File:** `src/core/cognition/CoreSettings.js` (schema lives in `models`)
**Purpose:**
Define global slider parameters that scale cognitive behavior.

Example sliders:

* `emotionalReactivity`
* `beliefPlasticity`
* `trustWeight`
* `identityProtection`
* `moodDecayRate`
* `noveltySensitivity`
* `globalChaos`

Also includes **domain pack overrides**, e.g.:

```json
{
  "politicalPack": { ... },
  "therapeuticPack": { ... }
}
```

These allow you to tune entire worlds without changing code.

---

# ### **2.7 CognitionModule — Rule-Based Cognitive Physics**

**File:** `src/core/cognition/CognitionModule.js`
**Purpose:**
Implements the **core cognition loop**:

1. For each cognition rule:

   * Check trigger
   * If matches: apply effect

2. Apply domain extensions + global settings

3. Return updated persona + updated world slices

#### **Trigger Logic**

Rules may trigger on:

* Event type
* Topic
* Persona trait comparisons (gt, lt)
* Domain-specific conditions

#### **Effect Logic**

Rules can:

* Add deltas
* Modify world state
* Be influenced by sliders
* Apply bounds

Example:

```
effect.value * rule.weight * settings[rule.slider]
```

This makes cognition:

* transparent
* tunable
* deterministic
* portable across domains

#### **Path Resolution**

Targets can be:

```
persona.psychology.valence
persona.psychology.traits.openness
worldState.political.metrics.polarization
```

This layer is the **essence of your cognitive physics**.

---

# ### **2.8 LlmClient — Optional Language Reasoning**

**File:** `src/core/llm/LlmClient.js`

Provides a simple wrapper around OpenAI:

* System + user messages
* Clean content return
* Centralized model configuration

This is used for:

* Argument generation
* Topic framing
* Summaries
* Complex reasoning tasks

Cognition does **not depend on** LLMs, but the system allows hybrid cognition.

---

# ## **3. How These Components Work Together**

```
       Event
         ↓
  PerceptionEngine
         ↓
  CognitionModule (rules + sliders)
         ↓
    Persona State Updated
         ↓
 Argument Generation / Arbitration
         ↓
   World State Evolves
```

The core layer establishes the first three steps — the mechanical, explainable cognition engine.

Everything else (agents debating, world updates, shocks, influence graphs) is built on these primitives.

---

# ## **4. Why This Architecture Works**

### **Domain-agnostic**

Political personas, market agents, therapeutic modeling, game NPCs — all share the same cognition substrate.

### **Transparent & controllable**

Cognition isn’t an opaque LLM prompt — it’s rule-driven, debuggable, tunable.

### **Scalable**

Hundreds of agents can be updated simultaneously without model calls.

### **LLM-optional**

LLMs enhance narratives and reasoning but do not define cognition.

### **Extensible**

Every domain can add:

* New cognition rules
* New world state variables
* New perception adapters
* New social dynamics

This gives you **research-grade capabilities** with **production-grade structure**.

