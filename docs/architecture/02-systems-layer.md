# # **SECTION 2 — SYSTEMS LAYER (World Dynamics Architecture)**

The **Systems Layer** is the engine’s macro-dynamics module — the part of the architecture that produces *emergent* world behavior.

While the Cognitive Layer governs **individual persona updates**, the Systems Layer governs **collective, environmental, economic, informational, and population dynamics**.

Systems are:

* Modular
* Domain-independent
* Executed every simulation step
* Driven by event shocks + internal drift
* Tunable via global + per-system sliders
* Responsible for updating **worldState.domains**

Systems are where the simulation becomes *alive*.

---

# ## **2.1 Purpose of the Systems Layer**

The Systems Layer answers the core question:

> *“How does the world evolve in response to events and internal forces?”*

Each system operates on its own slice of the world state.
Collectively, systems model:

* Economic stability & volatility
* Environmental changes & disasters
* Information spread, media saturation & attention
* Population dynamics, social trust & demographic shifts
* Cross-domain feedback loops

This layer is designed to:

* Produce emergent behavior
* Provide context that shapes perception, cognition, and agent debates
* Allow **complex simulations** from **simple primitives**

---

# ## **2.2 Architecture of a System**

Every system follows the same structure:

```
constructor(worldState, settings)

bindWorldState(newState)

update(event)
```

And each system:

* Reads the world state slice for its domain
* Applies **event-driven shocks**
* Applies **baseline drift**
* Applies **noise / randomness**
* Writes back updated metrics

This makes systems interchangeable, extensible, and independently testable.

---

# ## **2.3 SystemRegistry — The Macro-Orchestrator**

**File:** `src/core/systems/SystemRegistry.js`
**Role:** Controls all registered systems.

### Responsibilities:

* Register each system and give it access to worldState + settings
* Maintain which systems are enabled/disabled
* Execute each system’s update in sequence
* Update system settings on the fly
* Bind systems to new worldState copies between simulation steps

### Execution Flow:

```
Simulation Step N:
  1. Perception Engine (per persona)
  2. Cognition Module (per persona)
  3. SystemRegistry.update(event)
       → EconomicSystem.update(event)
       → EnvironmentSystem.update(event)
       → InfoFlowSystem.update(event)
       → PopulationSystem.update(event)
  4. WorldState saved
```

The registry ensures **macro-level dynamics move in sync with micro-level cognition.**

---

# ## **2.4 EconomicSystem**

**File:** `src/core/systems/EconomicSystem.js`
**Domain:** `worldState.domains.economic`

### **Purpose**

Models macroeconomic conditions:

* Inflation
* Growth
* Unemployment
* Liquidity
* Market volatility
* Shocks (financial, supply, inflation)
* Drift + noise

### **Inputs**

* External events

  * `inflation_shock`
  * `supply_shock`
  * `financial_shock`
* System settings (sensitivity sliders)
* Prior worldState

### **Outputs**

Updates:

```
inflation
growth
unemployment
marketVolatility
liquidity
marketMomentum
shocks[]
```

### **Mechanics**

#### **1. Event-driven shocks**

Each shock adds immediate effects + a slowly decaying shock object:

```js
econ.shocks.push({
  type: "inflation",
  magnitude,
  decayRate
});
```

These shocks influence future steps.

#### **2. Baseline drift**

* Volatility decay
* Shock decay
* Market momentum
* Random economic noise

#### **3. Emergence**

EconomicSystem creates:

* Cycles
* Volatility clustering
* Delay effects
* Compound instability under repeated shocks

It forms the economic backbone for all domains that depend on stability.

---

# ## **2.5 EnvironmentSystem**

**File:** `src/core/systems/EnvironmentSystem.js`
**Domain:** `worldState.domains.environment`

### **Purpose**

Models environmental and natural resource conditions:

* Seasonal cycles
* Temperature + precipitation
* Climate trends
* Natural disasters
* Resource stress (energy, food, water)

### **Inputs**

* Climate anomalies
* Natural disaster events
* Resource shortage events
* Noise + baseline drift

### **Outputs**

Updates:

```
temperatureIndex
precipitationIndex
disasterRisk
activeDisasters[]
energyStress
foodStress
waterStress
climateTrend
```

### **Mechanics**

#### **1. Seasonal cycle**

* Uses sine/cosine approximations
* Influences temperature and precipitation

#### **2. Climate drift**

* Long-term trend increases/decreases heat

#### **3. Disaster mechanics**

* Probabilistic disaster spawning
* Event-driven disasters
* Decay of disaster severity
* Resource stress changes

#### **4. Noise**

Adds controlled randomness to avoid deterministic, frozen worlds.

EnvironmentSystem interacts with:

* EconomicSystem (resource shocks)
* PopulationSystem (disaster-related migration/mortality)
* Personas (perception of danger, scarcity)

---

# ## **2.6 InfoFlowSystem**

**File:** `src/core/systems/InfoFlowSystem.js`
**Domain:** `worldState.domains.info`

### **Purpose**

Models the information environment:

* Topic attention distribution
* Media load
* Misinformation
* Censorship
* Connectivity/outages
* Attention entropy

This system determines how *aware* society is of certain topics, which strongly shapes:

* Persona perception
* Public opinion
* Domain event amplification

### **Inputs**

* Breaking news (`media_event`)
* Disinformation campaigns
* Censorship events
* Infrastructure outages
* Content domain’s topic map

### **Outputs**

Updates:

```
topics[]  // { topic, share }
mediaLoad
misinformationIndex
censorshipIndex
connectivityIndex
attentionEntropy
```

### **Mechanics**

#### **1. Align attention with content**

If `domains.content` exists, topics inherit weights from content:

* heat
* saturation
* polarity

#### **2. Event reactions**

* Breaking news boosts topic share
* Disinfo increases misinfo + media load
* Censorship reduces entropy
* Outages reduce connectivity + load

#### **3. Drift + entropy normalization**

Keeps the system stable but responsive.

InfoFlowSystem forms the **media substrate** for political, consumer, content, and enterprise sims.

---

# ## **2.7 PopulationSystem**

**File:** `src/core/systems/PopulationSystem.js`
**Domain:** `worldState.domains.population`

### **Purpose**

Models aggregate demographic + social structure:

* Population size
* Age bands
* Fertility & mortality
* Migration
* Urbanization
* Labor force
* Inequality
* Diversity
* Social trust

### **Inputs**

* `demographic_shock`
* `pandemic_event`
* `conflict_event`
* `migration_event`
* Drift + noise

### **Outputs**

Updates:

```
total population
ageBands
migration rates
urbanizationRate
fertilityRate
mortalityRate
inequalityIndex
diversityIndex
socialTrust
```

### **Mechanics**

#### **1. Event dynamics**

* Pandemics increase mortality & decrease labor force + trust
* Conflicts raise migration + reduce trust
* Demographic shocks modify fertility
* Migration events alter diversity + population

#### **2. Baseline dynamics**

* Natural births/deaths
* Aging of cohorts
* Normalized age bands
* Drift in inequality and diversity
* Trust reversion to baseline

#### **3. Randomness**

Keeps demographic movement from becoming stale.

PopulationSystem provides macro-context for:

* EconomicSystem (labor, growth, workforce)
* Political simulations (electorate shape)
* Social stability modeling

---

# ## **2.8 Interaction Between Systems**

Systems are **loosely coupled** but produce rich feedback loops.

### **Examples:**

* **Disaster → EnvironmentSystem**
  → raises energy stress
  → **EconomicSystem** amplifies inflation
  → personas perceive higher threat
  → debates become more extreme

* **Content heat → InfoFlowSystem**
  → increases attention to specific topics
  → personas focus cognitive resources
  → political worldState drifts in that direction

* **Pandemic → PopulationSystem**
  → reduces workforce participation
  → **EconomicSystem** experiences contraction
  → **InfoFlowSystem** increases media load
  → personas' emotional states shift

This is what makes the simulation **emergent**, not scripted.

---

# ## **2.9 System Lifecycle**

Each simulation step:

```
1. event = (external event or null)
2. systems.update(event):
     EconomicSystem.update(event)
     EnvironmentSystem.update(event)
     InfoFlowSystem.update(event)
     PopulationSystem.update(event)
3. worldState updated for step+1
4. personas perceive + react next cycle
```

System output becomes **input for cognition**, giving you a multi-loop adaptive environment.

---

# ## **2.10 Design Principles**

### **Modularity**

Every system is a standalone unit.

### **Deterministic + stochastic hybrid**

Baseline drift = stable
Noise = unpredictable variation

### **Pluggability**

Systems can be enabled/disabled dynamically.

### **Extensibility**

New systems (e.g., HealthSystem, CultureSystem, CrisisSystem, MarketCorrelationSystem) can be added without touching existing ones.

### **Research-grade**

Systems provide explicit mechanics, not opaque emergent black boxes.


