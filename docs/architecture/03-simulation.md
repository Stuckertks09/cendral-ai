# # **SECTION 3 — SIMULATION LAYER**

The Simulation Layer orchestrates **the entire cognitive + world dynamics pipeline**.

It is responsible for:

* Turning events into simulation runs
* Managing worldstate lifecycles
* Executing perception, debate, arbitration, cognition
* Updating macro-systems (economic, info, environment, population)
* Persisting world history
* Providing interfaces for stepping, running, retrieving history, or running full debates

This layer acts as **the conductor** connecting all other architecture components.

---

# ## **3.1 Responsibilities of the Simulation Layer**

At high level, every simulation step evaluates:

```
1. Event arrives  
2. Personas perceive the event  
3. Personas generate arguments  
4. Arbitration fuses arguments into world-level change  
5. Cognition rules update each persona  
6. Domain systems update macro-world dynamics  
7. WorldState saved for step+1  
```

This creates a **multi-loop emergent simulation engine** driven by both micro (persona) and macro (systems) forces.

---

# ## **3.2 SimulationRun Model**

**File:** `src/core/simulation/SimulationRun.js`

Tracks metadata for a single simulation run:

* eventId
* label
* startedAt / finishedAt
* number of steps
* mode (political, economic, therapeutic, etc.)
* cognition settings snapshot

This allows reproducibility, comparison, and evaluation.

Each simulation run creates a **timeline** of WorldStates.

---

# ## **3.3 SimulationService (Full-Run Engine)**

**File:** `src/core/simulation/SimulationService.js`

This is the high-level simulation orchestrator for **multi-step runs**, including debates and cognitive updates.

### **Key collaborators:**

* `worldStateFactory`
* `PersonaFactory`
* `DebateGenerator`
* `ArbitrationEngine`
* `CognitionModule`
* MongoDB PersonaModel
* SystemRegistry (via other simulation routes)

### **Execution flow for runSimulation():**

#### **Step 0 — Initialization**

```
Load event  
Load cognition settings  
Create SimulationRun  
Create initial WorldState
```

#### **Each step (loop):**

```
1. Load personas  
2. Generate arguments for this event  
3. Clone worldstate → nextWorldState  
4. Run Arbitration on nextWorldState  
5. Run CognitionModule for each persona  
6. Save nextWorldState + personas  
7. Append nextWorldState to timeline  
```

#### **Return:**

* runId
* eventId
* domain
* worldStates: [{ id, stepIndex }]

This is your **multi-agent political cognition loop**.

---

# ## **3.4 Per-Step Simulation (The Step API)**

Your engine also supports stepping *one simulation tick at a time* — this is how the frontend performs interactive simulations.

---

# ### **3.4.1 SimulationService (step-based)**

**File:** `src/services/SimulationService.js`

This version of SimulationService is built for:

* `/api/sim/state`
* `/api/sim/step`
* `/api/sim/reset`
* `/api/sim/history`

This is used by your **Next.js simulator UI**.

### `step(event)` flow:

```
1. prev = get latest worldstate  
2. next = clone prev with stepIndex+1  
3. systemRegistry.bindWorldState(next)  
4. systemRegistry.update(event)  
5. next.save()  
6. return next
```

This is *macro-only stepping* — no debate, arbitration, cognition.
Perfect for simulating economic, environmental, informational drift.

---

# ## **3.5 WorldStateManager**

**File:** `src/services/WorldStateManager.js`

Manages:

* Creating initial worldstates
* Cloning previous state
* Resetting world
* Getting latest state
* Listing full history

**Core principle:**

> *WorldState is immutable per step — every step is a new document.*

This enables:

* Time-travel visualization
* Differential state analysis
* Research reproducibility
* Visualization timelines

---

# ## **3.6 Simulation Routes (REST API)**

These routes allow:

* UI control
* Programmatic simulations
* Batch experiments
* External tools (Twitter → Confluent → Simulation Engine)

---

# ### **3.6.1 simControlRoutes — Macro Simulation**

**File:** `src/routes/simControl.js`

Endpoints:

| Endpoint       | Purpose                          |
| -------------- | -------------------------------- |
| `GET /state`   | Get latest worldstate            |
| `POST /reset`  | Reset simulation                 |
| `POST /step`   | Advance one step                 |
| `GET /history` | List all worldstates in timeline |

This is the live simulation control panel.

---

# ### **3.6.2 simulationRoutes — Full Run Engine**

**File:** `src/routes/sim.js`

Endpoints:

| Endpoint          | Description                                          |
| ----------------- | ---------------------------------------------------- |
| `POST /run`       | Full debate + arbitration + cognition + systems loop |
| `GET /run/:runId` | Fetch run metadata + worldstate timeline             |

This is the **research** interface.

---

# ## **3.7 Complete Run Mode (run-complete endpoint)**

**File:** `src/routes/runComplete.js`

This is the *most advanced* simulation path — it blends:

* PerceptionEngine
* DebateGenerator
* ArbitrationEngine
* SystemRegistry
* Persona updates
* WorldState evolution

### **Flow:**

```
1. Load prev state
2. Clone → nextState
3. Load personas
4. Normalize event
5. For each persona:
     a. PerceptionEngine.generate(...)
     b. DebateGenerator.generateArguments(...)
6. ArbitrationEngine.arbitrate(...) → update nextState + personas
7. systemRegistry.update(event)
8. Save worldState + personas
9. Return full packet (arguments, arbitration, updated state)
```

This is the endpoint that powers:

* **political cognition research**
* **event-to-opinion modeling**
* **emergent world reactions**
* **multi-agent narrative simulations**

---

# ## **3.8 Event Normalization**

A utility that ensures all incoming events have standard fields:

```
type  
domain  
headline  
topic  
topicLabel  
```

This makes all downstream components deterministic and schema-driven.

---

# ## **3.9 The Simulation Loop (Full Flow Overview)**

Bringing it all together:

```
Event arrives
↓  
Perception (persona-level)
↓  
Argument generation (persona → LLM)
↓  
Arbitration (LLM → update world)
↓  
Cognition rules (persona drift)
↓  
Systems Layer (macro drift)
↓  
WorldState saved
↓  
Step Index++
```

This is the **Cognitive Engine Protocol** — the defining contribution of your architecture.

---

# ## **3.10 Why This Architecture is Research-Grade**

### **1. Immutable worldstate timeline**

→ reproducible, comparable simulations.

### **2. Clear separation of micro vs. macro cognition**

* Personas evolve psychologically
* Systems evolve structurally

### **3. Deterministic + stochastic hybrid**

→ controlled but emergent behavior.

### **4. Modular system registry**

→ plug-and-play world dynamics.

### **5. Debate → Arbitration pipeline**

→ multi-agent reasoning fused into coherent world drift.

### **6. Step APIs + Full-Run APIs**

→ supports real-time UI and scientific batch experiments.

