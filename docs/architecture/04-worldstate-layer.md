# # **SECTION 4 — WORLD STATE LAYER**

The **World State Layer** defines the evolving global environment in which personas operate.
It is the *central memory* of the simulation — a snapshot of global conditions at each timestep.

Every step produces a **new immutable WorldState object**.
This unlocks:

* Time-travel
* Differential analysis
* Research reproducibility
* Dynamic visualization
* Multi-branch simulations

WorldState is the **single source of truth** about the environment in which cognition occurs.

---

# ## **4.1 What Is a WorldState?**

A WorldState is your simulation’s equivalent of a *frame in a physics engine*:

```
WorldState(step=0) → WorldState(step=1) → WorldState(step=2) → ...
```

Each WorldState document encapsulates:

### **1. Global emotional climate**

(Shares across all domains)

* valence (positive → negative atmosphere)
* arousal (energy level)
* tension (background stress)
* cohesion (social fabric strength)
* entropy (degree of disorder)

### **2. Domain slices (pluggable)**

Each domain — political, therapeutic, economic, consumer, enterprise, content, game — contributes:

* topic states
* domain metrics
* world-level variables

These are loaded via **extensions**.

### **3. Environment variables**

Arbitrary key-value world factors:

* “weather_index”
* “market_sentiment_global”
* “seasonality_multiplier”

### **4. Persona snapshots**

Lightweight summaries for UI/history:

* personaId
* summary

### **5. Simulation metadata**

* runId
* stepIndex
* basedOnEvent
* createdAt

---

# ## **4.2 BaseWorldStateAdapter**

**File:** `src/world/base/BaseWorldStateAdapter.js`

WorldState is extensible.
Each domain (political, enterprise, etc.) can attach an adapter to participate in updates.

The base adapter exposes optional hooks:

```js
onEvent() {}
onPersonaChanged() {}
toJSON() {}
```

A domain adds logic (e.g., "when economic event occurs, increase instability") without modifying core code.

This is how you future-proof the engine.

---

# ## **4.3 WORLD_EXTENSIONS Registry**

**File:** `src/world/extensions/index.js`

This registry defines which domains exist in the simulation:

```
consumer
content
enterprise
marketing
political
therapeutic
game
economic
```

Each extension provides:

```
- worldState schema fragment  
- worldStateAdapter  
- default domain config
```

Simulation is **automatically aware** of any domain you add here.

This design enables:

* dropping a new “Health” domain in seconds
* enabling/disabling domains per run
* experimenting with custom academic models

---

# ## **4.4 CoreWorldState Schema**

**File:** `models/CoreWorldState.js`

This is the canonical schema for world snapshots.

### **Key fields:**

#### **runId, stepIndex**

Unique timeline identity.

#### **globalEmotion**

Universal emotional climate shaping persona moods and topic drift.

#### **envVars**

Dynamic environmental values.

#### **domains**

Pluggable slices for each registered extension:

```js
domains: {
  political: {},
  therapeutic: {},
  marketing: {},
  enterprise: {},
  consumer: {},
  game: {},
  economic: {}
}
```

#### **personaSnapshots**

Lightweight logs of persona summaries.

#### **createdAt**

Timestamp for reproducibility and time-series analytics.

---

# ## **4.5 WorldStateFactory (Schema Builder & Cloner)**

**File:** `src/world/WorldStateFactory.js`

The WorldStateFactory is the **most important infrastructure class** in the entire simulation.

### It handles:

### **1. Schema building (dynamic)**

Constructs a unified WorldState model by merging:

* core schema
* all extension schemas
* runtime DomainConfig (topics + defaults)

This means **WorldState is not hard-coded** — it is generated from domain definitions.

### **2. DomainConfig loading**

Reads DB configs for each domain:

* topic list
* default stances/certainty/volatility
* domain metrics
* influence maps

These configs determine initial world conditions.

### **3. Initial worldstate creation**

Creates step=0:

```js
worldState = {
  runId,
  stepIndex: 0,
  basedOnEvent: eventId,
  domains: { political, economic, ... },
  globalEmotion: defaults
}
```

### **4. Step cloning**

Critical:

```
cloneWorldState(prev) →
  copy fields
  assign new _id
  increment stepIndex
  preserve domains, emotions, env, metrics
```

This produces **immutable snapshots** — a non-negotiable requirement for research-caliber simulation.

### **5. Arbitration application**

When the Arbitration Engine outputs deltas:

```js
stanceDelta
certaintyDelta
volatilityDelta
metricsDelta
```

The factory applies these to the correct domain slice.

This isolates cognitive fusion logic from world-state persistence.

### **6. Adapter creation**

Each extension gets a domain-specific adapter:

```
political.worldStateAdapter
economic.worldStateAdapter
```

Adapters allow domains to alter worldState behavior after:

* events
* persona updates
* arbitration cycles

---

# ## **4.6 Domain Initialization from DomainConfig**

When creating a new initial WorldState:

```
doc[domainName].topics = cfg.topics.map(…)
doc[domainName].metrics = { polarization, radicalization, instability }
```

This means:

* Topics are defined entirely outside code
* Defaults are customizable
* Domains can add arbitrary metrics

The architecture is **schema-less but structured**, similar to knowledge graphs or ontology-based modeling.

---

# ## **4.7 Persona Snapshots**

This small but powerful feature allows you to record persona summaries after cognition:

```js
personaSnapshots: [
  { personaId, summary }
]
```

UI can display:

* how personas drifted over time
* how arguments change as worldstate evolves
* how domains influence individuals

This is essential for explainability.

---

# ## **4.8 WorldStateManager (Storage Manager)**

**File:** `src/services/WorldStateManager.js`

Handles the persistence lifecycle:

### **getLatest()**

Fetches most recent worldstate.

### **createInitialWorldState()**

Wraps factory method + saves to DB.

### **createNextStep(prev)**

Creates immutable step documents:

```
step=3 → step=4
```

### **reset()**

Clears history and starts fresh.

### **listHistory()**

Returns full timeline for visualization.

---

# ## **4.9 WorldRoutes (Optional CRUD API)**

You also expose:

```
GET /api/world
POST /api/world
```

This route is just syntactic sugar for external tools that want:

* to inspect world snapshots
* to inject new states (e.g. research tools)

---

# ## **4.10 How WorldState Fits Into the Cognitive Engine**

WorldState mediates all interactions:

### **Input**

* raw events
* system updates
* persona updates
* arbitration outputs
* domain configs

### **Output**

* environment for next cognition cycle
* structured data for visualization
* metrics for researchers
* stable foundation for emergent behavior

All other layers plug into WorldState:

```
EVENT → PERCEPTION → ARGUMENTS → ARBITRATION → WORLDSTATE
                              ↘︎ SYSTEMS → WORLDSTATE
                              ↘︎ COGNITION → PERSONA → WORLDSTATE SNAPSHOTS
```

---

# ## **4.11 Why This Design Works**

### **1. Immutable world snapshots**

Allows replay, branching, visual graphs.

### **2. Fully pluggable domains**

Sim evolves beyond political: enterprise, marketing, therapeutic, etc.

### **3. Unified schema built dynamically**

No hardcoded domain logic → research extensibility.

### **4. Arbitrator and cognition write deltas into a consistent world representation**

### **5. WorldState acts as shared memory for all agents**

Enabling multi-agent emergent behavior.

