
# # **SECTION 5 — ARBITRATION LAYER**

The Arbitration Layer is the **core cognitive fusion mechanism** of the entire engine.

It takes:

* Persona arguments
* Persona psychological states
* Domain configuration
* Current worldstate
* Incoming event

…and produces **deltas** that update:

* Domain-level worldstate
* Topic stances/certainty/volatility
* Macro-level domain metrics
* Persona emotional states

It is the closest conceptual analogue to:

* A Bayesian update
* A committee decision
* A cognitive aggregator
* A social inference engine

This is the **brain** of the multi-agent simulation.

---

# ## **5.1 Purpose of the Arbitration Layer**

The arbitration process answers:

> *“Given how different personas interpret an event, how should the world actually change?”*

Personas argue.
The arbitrator integrates.
WorldState evolves.

Unlike voting or averaging, your arbitrator:

* Considers persona traits
* Considers argument content
* Considers domain schemas
* Produces controlled, bounded deltas
* Emits persona-level feedback
* Produces research metadata (drivers, summary, justification)

This is what makes the simulation **coherent**, not chaotic.

---

# ## **5.2 High-Level Flow**

```
Personas generate arguments →
ArbitrationEngine builds strict JSON prompt →
LLM outputs deltas →
ArbitrationEngine applies deltas to:
   • worldState
   • personas
   • metadata
```

Arbitration is performed **per domain per step**.

---

# ## **5.3 ArbitrationEngine Overview**

**File:** `src/core/arbitration/ArbitrationEngine.js`

Constructor:

```js
constructor({ llm, domainExtensions })
```

Inputs:

* `llm` — OpenAI client
* `domainExtensions` — schemas + adapters from each domain

Arbitration is domain-specific but system-general.

---

# ## **5.4 The arbitrate() Method**

Signature:

```js
async arbitrate({
  event,
  argumentsList,
  worldState,
  personas,
  domain
})
```

### Step-by-step:

### **1. Validate and load domain extension**

Ensures the domain exists and has a valid worldState schema.

### **2. List adjustable fields**

The arbitration engine inspects the domain’s schema to determine which fields are allowed to change:

```js
stance
certainty
volatility
polarization
radicalization
instability
```

This prevents the LLM from hallucinating new fields.

### **3. Build the prompt**

The prompt includes:

* event
* current domain state
* persona argument list
* persona summaries
* adjustable fields
* rules and constraints

The prompt is strict: output must be **pure JSON**.

### **4. LLM generates arbitration JSON**

Returned structure:

```json
{
  "deltas": {
    "topicX.stance": 0.12,
    "metrics.polarization": -0.03
  },
  "personas": {
    "personaId123": {
      "valenceDelta": 0.1,
      "arousalDelta": -0.05
    }
  },
  "metadata": {
    "summary": "...",
    "drivers": ["..."],
    "notes": "..."
  }
}
```

### **5. Parse JSON safely**

Invalid JSON is caught and returned as raw metadata.

### **6. Apply deltas**

* Topic updates
* Metric updates
* Persona emotion updates

The ArbitrationEngine mutates the passed-in worldState document **in place**, enabling:

* immediate System updates
* persona cognition updates
* next-step worldstate creation

---

# ## **5.5 Prompt Construction**

The heart of arbitration is the structured prompt.

```js
#buildPrompt()
```

The prompt includes:

* Domain name
* Adjustable fields
* Domain slice of worldstate
* Event details
* Persona summaries
* Persona arguments
* Strict JSON schema description
* Rules

### Key guarantee:

**Arbitrator never sets absolute values — only deltas.**

This preserves:

* continuity
* realism
* drift-based evolution

---

# ## **5.6 JSON Extraction**

The engine ensures the LLM output is valid JSON:

```js
#extractJson(raw)
```

* Finds first `{` and last `}`
* Throws if JSON absent
* This protects the simulation from malformed LLM output

---

# ## **5.7 Adjustable Field Discovery**

```js
#listAdjustableFields(schema)
```

A unique feature:

* Recursively inspects Mongoose schema
* Filters numeric fields
* Ignores arrays
* Produces a whitelist of fields the LLM is allowed to modify

This prevents:

* hallucinated fields
* structural corruption
* type violations

Example output:

```json
[
  "stances",
  "metrics.polarization",
  "metrics.radicalization",
  "metrics.instability"
]
```

---

# ## **5.8 Applying Deltas**

### **1. Apply domain deltas**

`#applyDeltas(domainState, deltas)`

* Navigates dotted paths
* Adds delta to existing field
* Silent fail if field not found
* Ensures type safety

### **2. Apply persona deltas**

`#applyPersonaUpdates(personas, personaUpdates)`

* persona.psychology.valence
* persona.psychology.arousal

These affect:

* future argumentation
* future perception
* emotional drift

---

# ## **5.9 DebateGenerator**

**File:** `src/core/arbitration/DebateGenerator.js`

The Debate Generator:

* Takes persona + event
* Produces short domain-specific argument

Uses persona.toOverviewCard() if available to ensure:

* ideological nuance
* demographic context
* psychological traits

Arguments feed directly into arbitration.

This creates **micro → macro coherence**.

---

# ## **5.10 utils.js — Topic, Metric, and Persona Update Helpers**

### **applyTopicUpdates**

Updates:

* stance
* certainty
* volatility

Clamps within:

```
stance: [-1, 1]
certainty: [0, 1]
volatility: [0, 1]
```

### **applyMetricUpdates**

Updates:

* polarization
* radicalization
* instability

Clamped into `[0,1]`.

### **applyPersonaUpdates**

Emotion drift:

* valenceDelta
* arousalDelta

These feed into later cognition cycles.

---

# ## **5.11 Why Arbitration Is the Engine’s Intellectual Core**

### **1. Converts multi-agent interpretations into a single world update**

No voting.
No averaging.
No black-box hidden state.

### **2. Produces structured deltas**

Preserves numerical integrity and simulation stability.

### **3. Persona-level emotional feedback**

Arguments affect the agents themselves.

### **4. Domain-agnostic design**

Arbitrator can handle:

* political domains
* economic domains
* marketing domains
* enterprise domains
* therapeutic domains
* game domains

ANY domain with a schema becomes arbitratable.

### **5. Full explainability**

Metadata includes:

* summary
* drivers
* notes

This is research-grade transparency.

### **6. Integrates cleanly with Systems Layer + Cognition Layer**

Arbitration updates domain structure →
Systems amplify drift →
Personas react →
Arguments shift →
Arbitration updates again

Emergent cognition emerges from this loop.

---

# ## **5.12 Summary of the Arbitration Layer**

The Arbitration Layer is the simulation’s:

* **fusion center**
* **deliberation engine**
* **belief integrator**
* **opinion aggregator**
* **emergent cognition catalyst**

It’s the only component with global awareness across:

* personas
* domain schemas
* world state
* events
* arguments

Its design allows your simulation to remain:

* stable
* emergent
* explainable
* generalizable

And most importantly:

**It turns thousands of competing micro-opinions into a coherent macro-world.**

