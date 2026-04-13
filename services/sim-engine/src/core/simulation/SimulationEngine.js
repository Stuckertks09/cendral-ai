// src/simulation/SimulationEngine.js

import WorldStateFactory from "../world/WorldStateFactory.js";

import EventModel from "../events/CoreEvents.js";
import CorePersona from "../persona/CorePersona.js";
import GeoActor from "../actors/GeoActor.js";
import GeoLeader from "../actors/GeoLeader.js";
import PromptPack from "../../models/PromptPack.js";

import CognitionModule from "../cognition/CognitionModule.js";

import GeoActorAdapter from "../actors/GeoActorAdapter.js";
import GeoLeaderAdapter from "../actors/GeoLeaderAdapter.js";
import ActorInfluenceEngine from "../actors/actorInfluenceEngine.js";

// Optional: your defense arbitrator implementation
// Adjust path/name as needed.
import DefenseArbitrator from "../../arbitration/DefenseArbitrator.js";


/**
 * SimulationEngine
 * ----------------
 * Orchestrates a single simulation "step" in response to an Event:
 *
 * 1. Load / clone WorldState for the run
 * 2. Run persona cognition (CognitionModule) for each CorePersona
 * 3. Run GeoLeaderAdapter → leaders react to event and modify actor doctrine
 * 4. Run GeoActorAdapter → actors update based on event
 * 5. Run ActorInfluenceEngine → alliance/rivalry propagation
 * 6. Run DefenseWorldStateAdapter → update defense slice
 * 7. Run DefenseArbitrator (LLM) → refine deltas & apply via WorldStateFactory.applyArbitration
 * 8. Persist WorldState (and optionally actors/leaders/personas)
 */



export default class SimulationEngine {
  /**
   * @param {Object} options
   * @param {Array}  options.extensions   Array of extension manifests (from WORLD_EXTENSIONS)
   * @param {Object} options.openai       OpenAI client instance
   * @param {Array}  options.personaRules Cognition rules for personas (array of rule objects)
   * @param {Object} options.personaSettings Global cognition settings / sliders
   */

  constructor({
  extensions = [],
  openai,
  semanticMemory = null,
  graphMemory = null,
  personaRules = [],
  personaSettings = {},
  memorySettings = {}   // 🔹 new
} = {}) {
  this.extensions = extensions;
  this.openai = openai;
  this.semanticMemory = semanticMemory;
  this.graphMemory = graphMemory;
  this.personaRules = personaRules;
  this.personaSettings = personaSettings;
  this.memorySettings = memorySettings || {};

  this.factory = new WorldStateFactory(extensions);
  this.WorldStateModel = this.factory.buildSchema();
  this.debug = {};
}

  /**
   * Run a single simulation step for a given event.
   *
   * @param {Object} params
   * @param {string} params.eventId    Event _id
   * @param {string} [params.runId]    SimulationRun _id (optional)
   *
   * If runId is provided, we clone the last WorldState for that run;
   * otherwise we create a brand new initial WorldState.
   */

    async #recallMemory({ event, worldState, actors, leaders }) {
    const memory = {};

    const {
      useSemanticMemory = true,
      useGraphMemory = true,
      semanticTopKPersona = 5,
      semanticTopKActor = 5,
      semanticTopKLeader = 5,
      semanticTopKEvents = 5
    } = this.memorySettings || {};

    // ===== SEMANTIC MEMORY (Pinecone) =====
    if (this.semanticMemory && useSemanticMemory) {
      const query = event.summary || event.rawText || JSON.stringify(event);

      memory.semantic = {
        persona: await this.semanticMemory.queryMemory({
          type: "persona",
          query,
          topK: semanticTopKPersona
        }),
        actor: await this.semanticMemory.queryMemory({
          type: "actor",
          query,
          topK: semanticTopKActor
        }),
        leader: await this.semanticMemory.queryMemory({
          type: "leader",
          query,
          topK: semanticTopKLeader
        }),
        events: await this.semanticMemory.queryEvents(query, semanticTopKEvents)
      };
    }

    // ===== GRAPH MEMORY (Neo4j) =====
    if (this.graphMemory && useGraphMemory) {
      // implement getActorNetworkSnapshot on GraphMemory if you haven't yet
      memory.relational = await this.graphMemory.getActorNetworkSnapshot?.();
    }

    // ===== EPISODIC MEMORY (Past World States) =====
    const recent = await this.WorldStateModel
      .find({ runId: worldState.runId })
      .sort({ createdAt: -1 })
      .limit(3)
      .lean();

    memory.episodic = recent;

    return memory;
  }


  async runStep({ eventId, runId = null }) {
    // 1. Load the event
    const event = await EventModel.findById(eventId).lean();
    if (!event) {
      throw new Error(`SimulationEngine: Event not found for id=${eventId}`);
    }

    
    // 2. Prepare world state: new or cloned
    const worldState = await this.#prepareWorldState({ runId, event });

    // 3. Load personas, actors, leaders
    const [personas, actors, leaders] = await Promise.all([
      CorePersona.find().exec(),
      GeoActor.find().exec(),
      GeoLeader.find().exec()
    ]);

    // 4. Run persona cognition (micro layer)
    await this.#runPersonaCognition({ personas, worldState, event });

    // 5. Run leader & actor updates (meso + macro)
    await this.#runActorsPipeline({ actors, leaders, event });

    // 6. Run domain-specific worldstate adapters (defense, political, etc.)
    await this.#runDomainAdapters({ worldState, event });

    // 7. Run LLM-based arbitration for defense (optional if config exists)
    await this.#runDefenseArbitration({ worldState, actors, leaders, event });


    // 8. Persist worldState (and optionally actors/leaders/personas)
    await worldState.save();

    // NOTE: If you want actor/leader changes persisted as well, uncomment:
    // await Promise.all(actors.map(a => a.save()));
    // await Promise.all(leaders.map(l => l.save()));
    // await Promise.all(personas.map(p => p.save()));

    return worldState;
  }

  /* ======================================================================
   * WORLD STATE PREPARATION
   * ====================================================================== */

  async #prepareWorldState({ runId, event }) {
    if (!runId) {
      // No runId → treat as a single-step or ad-hoc run
      return this.factory.createInitialWorldState({ runId: null, event });
    }

    // Look for the latest worldstate in this run
    const prev = await this.WorldStateModel
      .findOne({ runId })
      .sort({ stepIndex: -1 })
      .exec();

    if (!prev) {
      // First step in this run
      return this.factory.createInitialWorldState({ runId, event });
    }

    // Clone last step
    const cloned = this.factory.cloneWorldState(prev);
    cloned.basedOnEvent = event._id;
    return cloned;
  }

  /* ======================================================================
   * PERSONA COGNITION
   * ====================================================================== */

  async #runPersonaCognition({ personas, worldState, event }) {
    if (!personas || personas.length === 0) return;
    if (!this.personaRules || this.personaRules.length === 0) {
      // No rules defined → nothing to do
      return;
    }

    for (const persona of personas) {
      const module = new CognitionModule({
        persona,
        worldState,
        event,
        rules: this.personaRules,
        settings: this.personaSettings || {}
      });

      module.run();

      // Persist persona changes
      await persona.save();
    }
  }

  /* ======================================================================
   * ACTORS + LEADERS PIPELINE
   * ====================================================================== */

  async #runActorsPipeline({ actors, leaders, event }) {
    if (!actors || actors.length === 0) return;

    // 1. Leaders react and push into actor doctrine
    if (leaders && leaders.length > 0) {
      const leaderAdapter = new GeoLeaderAdapter(actors, leaders);
      leaderAdapter.runLeaderUpdates(event);
    }

    // 2. Actors respond directly to the event
    const actorAdapter = new GeoActorAdapter(actors);
    actorAdapter.applyEvent(event);

    // 3. Actor-to-actor influence propagation (alliances, rivalries)
    const influenceEngine = new ActorInfluenceEngine(actors);
    influenceEngine.propagate();

    // Optional: persist actor & leader changes here if you want per-step persistence
    // await Promise.all(actors.map(a => a.save()));
    // await Promise.all(leaders.map(l => l.save()));
  }

  /* ======================================================================
   * DOMAIN ADAPTERS (WORLDSTATE EXTENSIONS)
   * ====================================================================== */

  async #runDomainAdapters({ worldState, event }) {
    const adapters = this.factory.createAdapters(worldState);

    // This will include: political, defense, economic, etc.
    for (const [name, adapter] of Object.entries(adapters)) {
      if (typeof adapter.applyEvent === "function") {
        adapter.applyEvent(event);
      }
    }
  }

  /* ======================================================================
   * DEFENSE ARBITRATION (LLM)
   * ====================================================================== */

 async #runDefenseArbitration({ worldState, actors, leaders, event }) {
  if (!this.openai) {
    console.warn("⚠ SimulationEngine: No OpenAI client provided; skipping defense arbitration.");
    return;
  }

  // Only arbitrate for defense events
  if (event.domain !== "defense") return;

  const promptPack = await PromptPack.findOne({
    domain: "defense",
    environment: "prod",
  }).lean();

  if (!promptPack) {
    console.warn("⚠ SimulationEngine: No PromptPack for defense/prod; skipping arbitration.");
    return;
  }

  const arbitrator = new DefenseArbitrator({ openai: this.openai });

  // HERE: FETCH MEMORY ---------------------------------------
  const memory = await this.#recallMemory({
  event,
  worldState,
  actors,
  leaders
});

const { topicUpdates, metrics, debug } = await arbitrator.run({
  event,
  worldState,
  actors,
  leaders,
  memory
});


  // --- SAFETY: if no defense slice, bail ---
  const defense = worldState.defense;
  if (!defense) {
    console.warn("⚠ SimulationEngine: worldState.defense not present; skipping defense arbitration apply.");
    return;
  }

  const clamp01 = (v) => {
    if (typeof v !== "number" || Number.isNaN(v)) return 0;
    return Math.max(0, Math.min(1, v));
  };

  const clampSigned = (v) => {
    if (typeof v !== "number" || Number.isNaN(v)) return 0;
    return Math.max(-1, Math.min(1, v));
  };

  // ------------------------------------------------------------------
  // 1) Apply topic-level deltas into defense.theaters
  // ------------------------------------------------------------------
  if (defense.theaters && Array.isArray(defense.theaters)) {
    for (const [theaterKey, deltas] of Object.entries(topicUpdates)) {
      const node = defense.theaters.find((t) => t.key === theaterKey);
      if (!node) continue;

      const {
        stanceDelta = 0,
        certaintyDelta = 0,
        volatilityDelta = 0,
      } = deltas || {};

      // Map stance/certainty/volatility deltas into domain-specific fields
      node.tension = clamp01((node.tension ?? 0) + stanceDelta * 0.5);
      node.stability = clamp01((node.stability ?? 0) + certaintyDelta * 0.5);
      node.escalationRisk = clamp01((node.escalationRisk ?? 0) + volatilityDelta * 0.5);
    }
  }

  // ------------------------------------------------------------------
  // 2) Apply system-level metrics
  // ------------------------------------------------------------------
  defense.metrics = defense.metrics || {
    systemEscalationRisk: 0,
    allianceCohesion: 0.5,
    deterrenceBalance: 0,
    activeConflictCount: 0,
  };

  defense.metrics.systemEscalationRisk = clamp01(
    (defense.metrics.systemEscalationRisk ?? 0) +
      (metrics.systemEscalationDelta ?? 0)
  );

  defense.metrics.allianceCohesion = clamp01(
    (defense.metrics.allianceCohesion ?? 0.5) +
      (metrics.allianceCohesionDelta ?? 0)
  );

  defense.metrics.deterrenceBalance = clampSigned(
    (defense.metrics.deterrenceBalance ?? 0) +
      (metrics.deterrenceBalanceDelta ?? 0)
  );

  // ------------------------------------------------------------------
  // 3) Attach debug for inspection
  // ------------------------------------------------------------------
  worldState.debug ??= {};
  worldState.debug.defense = debug;
}
}
