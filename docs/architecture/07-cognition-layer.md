# **7. Cognition Layer**

*Event-Driven Microphysics for Belief, Emotion, Threat, and Strategic Drift*

The **Cognition Layer** is the engine’s “internal biology.”
Where arbitration updates *shared world state*, the cognition layer updates **each individual persona** based on:

* event characteristics
* domain-specific rules
* persona traits
* sliders (CognitionSettings)
* dynamic world context

Cognition is executed **after arbitration**, ensuring that personas evolve in response to both:

1. the **event itself**, and
2. the **post-event global environment**

This creates a two-tier system:

* **Arbitration → “What happened to the world?”**
* **Cognition → “What does this change mean to me?”**

The Cognition Module is intentionally modular:
each domain (Defense, Political, Economic, Enterprise, etc.) can attach its own rule packs without modifying core logic.

---

# **7.1 CognitionModule Overview**

The `CognitionModule` is instantiated once per persona per simulation step.

```js
new CognitionModule({
  persona,
  worldState,
  event,
  rules,      // merged base rules + domain rules
  settings    // CognitionSettings schema (sliders)
});
```

### **Execution Model**

```js
run() {
  for each rule:
    if trigger matches:
      apply rule
}
```

The module acts like a **rule interpreter**, consuming domain-neutral and domain-specific rules.

---

# **7.2 Rule Structure**

A cognition rule has the following shape:

```js
{
  name: "treaties_reduce_threat_and_escalation",
  trigger: { eventType: "treaty_signed" },
  effect: {
    target: "persona.extensions.defense.posture.escalationPreference",
    operator: "add",
    value: -0.15,
    bounds: [0, 1]
  },
  weight: 1.0,
  slider: "cooperationPreference"
}
```

### **Components**

#### **1. Trigger**

Determines whether the rule activates.

Supports:

* `eventType`
* `topic`
* trait conditions, e.g.:

```js
trigger: { trait: { name: "openness", gt: 0.6 } }
```

#### **2. Effect**

Specifies what to mutate:

* persona fields
* worldstate fields
* domain slices (e.g., world.defense.theaters[*].tension)

Effect fields:

* `target` (string path)
* `operator` (`add`, with others extendable)
* `value` (base delta)
* `bounds` (min/max)

#### **3. Weight**

Local importance factor (0–1+).
Used for tuning domain behaviors.

#### **4. Slider**

Links the rule to **CognitionSettings**, allowing user-driven or system-driven modulation.

Example sliders:

* beliefPlasticity
* emotionalReactivity
* threatSensitivity (Defense-specific)
* cooperationPreference

This makes rules **parametric and tunable**, enabling scenario exploration and A/B simulation.

---

# **7.3 Trigger Matching Mechanics**

The rule fires only if all conditions are met:

```js
#matchesTrigger(trigger)
```

Checks include:

### **Event-Based Conditions**

```js
trigger.eventType === event.type
trigger.topic === event.topic
```

### **Trait-Based Conditions**

```js
trigger.trait = { name, gt, lt }
```

The persona’s psychology must meet numeric constraints.

### **Fallback**

If no trigger is provided, rule always fires.

---

# **7.4 Target Resolution**

Targets use dot-paths:

* `persona.psychology.valence`
* `persona.extensions.defense.posture.escalationPreference`
* `world.defense.theaters[theater].tension`

The engine resolves paths dynamically:

```js
persona → persona object root
world → worldState root
```

The resolver walks the object tree to locate the mutation point.

---

# **7.5 Delta Application**

The core logic:

```js
delta = rule.effect.value * rule.weight * slider
```

Where:

* **value** = rule’s base impact
* **weight** = rule importance
* **slider** = global/local sensitivity modifier

Then:

```js
newValue = clamp(oldValue + delta, bounds)
```

This enforces domain-specific realism.

---

# **7.6 Cognition Settings (Sliders)**

Stored in Mongo:

```js
CognitionSettingsSchema
```

Settings allow **global tuning** of the engine’s cognitive responsiveness.

### **Key Sliders**

| Slider                  | Effect                                  |
| ----------------------- | --------------------------------------- |
| **emotionalReactivity** | Amplifies mood/arousal drift            |
| **beliefPlasticity**    | Controls belief updating rate           |
| **crossTopicInfluence** | Multiplies topic-to-topic bleed         |
| **moodDecayRate**       | How fast mood returns to baseline       |
| **trustWeight**         | How strongly trust modulates persuasion |
| **identityProtection**  | Resistance to belief change             |
| **noveltySensitivity**  | Reactions to unprecedented events       |
| **globalChaos**         | Injects controlled stochasticity        |

### **Pack-Specific Overrides**

Each domain (political, enterprise, defense…) can have custom sub-sliders, e.g.:

* `exerciseSensitivity`
* `cooperationPreference`
* `threatSensitivity`

This allows fine-grained tuning of defense-specific cognition without rewriting base logic.

---

# **7.7 Domain Rule Packs**

Each extension may export a rule pack.

### Example: Defense Rules

```js
export default [
  {
    name: "attack_raises_threat_perception",
    trigger: { eventType: "terror_attack" },
    effect: {
      target: "persona.extensions.defense.threatPerception[theater].level",
      operator: "add",
      value: 0.2,
      bounds: [0,1]
    },
    weight: 1.0,
    slider: "threatSensitivity"
  },

  {
    name: "alliance_buffers_escalation",
    trigger: { eventType: "border_incident" },
    effect: {
      target: "persona.extensions.defense.posture.escalationPreference",
      operator: "add",
      value: -0.1,
      bounds: [0,1]
    },
    weight: 0.7,
    slider: "allianceReliance"
  }
];
```

These rules produce:

* **micro-level persona drift**
* **strategic posture shifts**
* **threat recalibration**
* **context-dependent escalation/de-escalation**

Rules may also target:

* worldstate variables
* global defense metrics
* cross-theater propagation

---

# **7.8 Why This Cognition Model Works**

### **1. Parametric, not hardcoded**

Rules are data-driven, not compiled into the engine.

### **2. Domain-agnostic**

Defense, enterprise, marketing, political, economic — all use the same logic.

### **3. Fully interpretable**

Every rule is explicit; nothing is a “black-box NN.”

### **4. Simulation-ready**

Sliders allow A/B testing, tuning, and scenario exploration.

### **5. Supports multi-step drift**

Cognition accumulates across steps, enabling emergent persona evolution.

---

# **7.9 Summary**

The Cognition Layer gives each persona an **adaptive internal state** capable of:

* responding to events
* altering beliefs, moods, preferences
* updating strategic posture
* reacting to worldstate shifts
* evolving according to domain-specific rule packs

This transforms static agent profiles into **dynamic, evolving actors** consistent across defense, enterprise, consumer, political, and other domains.

