// src/world/WorldStateFactory.js
import mongoose from "mongoose";
import BaseWorldStateAdapter from "./base/BaseWorldStateAdapter.js";
import DomainConfig from "../../models/DomainConfig.js";

/**
 * WorldStateFactory
 * ------------------
 * Dynamically constructs unified WorldState schema based on:
 *  - core fields
 *  - registered domain extensions (content, enterprise, political, etc.)
 *  - runtime DomainConfig (topics + influence definitions)
 *
 * Handles:
 *  - schema creation
 *  - initial world-state creation
 *  - step cloning
 *  - domain adapter binding
 *  - arbitration deltas
 */
export default class WorldStateFactory {
  constructor(extensions = []) {
    this.extensions = extensions;
    this.WorldStateModel = null;
    this.domainCache = {}; // cached DomainConfig entries
  }

  /* ======================================================================
   * DOMAIN CONFIG LOADING
   * ====================================================================== */

  /**
   * Load a DomainConfig by name ("political", etc.)
   * Cached to avoid repeated DB hits.
   */
  async loadDomainConfig(domainName) {
    if (this.domainCache[domainName]) return this.domainCache[domainName];

    const cfg = await DomainConfig.findOne({ domain: domainName }).lean();
    if (!cfg) {
      console.warn(`⚠️ No DomainConfig found for domain "${domainName}"`);
      return null;
    }

    this.domainCache[domainName] = cfg;
    return cfg;
  }

  /* ======================================================================
   * SCHEMA BUILDING
   * ====================================================================== */

  buildSchema() {
    const { Schema } = mongoose;

    const fields = {
      runId: { type: Schema.Types.ObjectId, ref: "SimulationRun", index: true },
      stepIndex: { type: Number, index: true },
      basedOnEvent: { type: Schema.Types.ObjectId, ref: "Event" },

      createdAt: { type: Date, default: Date.now },
      debug: {
  type: Object,
  default: {},
}
    };

    // Inject each extension’s worldState fragment
    for (const ext of this.extensions) {
      if (ext.worldState) {
        fields[ext.name] = { type: ext.worldState, default: () => ({}) };
      }
    }

    const WorldStateSchema = new Schema(fields, { timestamps: false });

// Prevent duplicate steps *only for real runs* (runId != null)
WorldStateSchema.index(
  { runId: 1, stepIndex: 1 },
  {
    unique: true,
    partialFilterExpression: { runId: { $ne: null } }
  }
);

this.WorldStateModel =
  mongoose.models.WorldState ||
  mongoose.model("WorldState", WorldStateSchema);

return this.WorldStateModel;
  }

  /* ======================================================================
   * INITIAL CREATION
   * ====================================================================== */

  /**
   * Create the initial world state.
   * Includes loading domain configs (topics, metrics, influences).
   */
  async createInitialWorldState({ runId = null, event = null } = {}) {
    if (!this.WorldStateModel) {
      throw new Error(
        "WorldStateFactory: schema not built. Call buildSchema() first."
      );
    }

    const doc = new this.WorldStateModel({
      runId,
      stepIndex: 0,
      basedOnEvent: event ? event._id : null,
      createdAt: new Date(),
    });

    // Initialize domain slices from DomainConfig
    await this.initializeDomainsFromConfig(doc);

    return doc;
  }

  /**
   * Populate worldState.domain.topics from DomainConfig defaults.
   */
  async initializeDomainsFromConfig(doc) {
    for (const ext of this.extensions) {
      const domainName = ext.name;
      const cfg = await this.loadDomainConfig(domainName);
      if (!cfg?.topics) continue;

      // --- DEFENSE SPECIAL CASE (topics = theaters) ---
      if (domainName === "defense") {
        doc.defense = doc.defense || {};
        doc.defense.theaters = cfg.topics.map(t => ({
          key: t.key,
          label: t.label,
          region: t.category || "",
          tension: t.metadata?.tension ?? 0,
          stability: t.metadata?.stability ?? 1,
          conflictProbability: t.metadata?.conflictProbability ?? 0,
          alliedPresence: t.metadata?.alliedPresence ?? 0,
          adversaryPresence: t.metadata?.adversaryPresence ?? 0,
          escalationRisk: t.metadata?.escalationRisk ?? 0
        }));
        continue; // Skip generic topic init
      }

      // --- GENERIC TOPIC DOMAINS ---
      doc[domainName] = doc[domainName] || {};
      doc[domainName].topics = cfg.topics.map(t => ({
        topic: t.key,
        label: t.label,
        stance: t.defaults?.stance ?? 0,
        certainty: t.defaults?.certainty ?? 0.5,
        volatility: t.defaults?.volatility ?? 0.5,
      }));

      doc[domainName].metrics = {
        polarization: 0,
        radicalization: 0,
        instability: 0,
      };
    }
  }

  /* ======================================================================
   * ADAPTER CREATION
   * ====================================================================== */

  createAdapters(worldStateDoc) {
    const adapters = {};

    for (const ext of this.extensions) {
      if (ext.worldStateAdapter) {
        adapters[ext.name] = new ext.worldStateAdapter(worldStateDoc);
      } else {
        adapters[ext.name] = new BaseWorldStateAdapter(worldStateDoc);
      }
    }

    return adapters;
  }

  /* ======================================================================
   * CLONING STEPS
   * ====================================================================== */

  cloneWorldState(prev) {
    if (!this.WorldStateModel) {
      throw new Error("WorldStateFactory: schema not built.");
    }

    const newDoc = new this.WorldStateModel({
      ...prev.toObject(),
      _id: undefined,
      stepIndex: prev.stepIndex + 1,
      createdAt: new Date(),
    });

    return newDoc;
  }

  /* ======================================================================
   * ARBITRATION DELTAS
   * ====================================================================== */

applyArbitration({ topicUpdates = {}, metrics = {} }) {
  if (!topicUpdates || typeof topicUpdates !== "object") return;

  // ----------------------------
  // GLOBAL WEIGHTS (tunable)
  // ----------------------------
  const W_STANCE = 0.5;        // stanceDelta → tension
  const W_CERTAINTY = 0.5;     // certaintyDelta → stability
  const W_VOLATILITY = 0.5;    // volatilityDelta → escalationRisk

  // Collect propagation magnitudes for later
  const propagationQueue = [];

  // ----------------------------
  // 1. Apply per-theater deltas
  // ----------------------------
  for (const [theaterKey, deltas] of Object.entries(topicUpdates)) {
    const node = this._getTheater(theaterKey);
    if (!node || !deltas) continue;

    const stanceDelta = Number(deltas.stanceDelta ?? 0);
    const certaintyDelta = Number(deltas.certaintyDelta ?? 0);
    const volatilityDelta = Number(deltas.volatilityDelta ?? 0);

    // (A) Direct LLM → world updates
    node.tension = this._clamp01(node.tension + stanceDelta * W_STANCE);
    node.stability = this._clamp01(node.stability + certaintyDelta * W_CERTAINTY);
    node.escalationRisk = this._clamp01(node.escalationRisk + volatilityDelta * W_VOLATILITY);

    // Save for propagation pass
    if (stanceDelta !== 0) {
      propagationQueue.push({ theaterKey, magnitude: stanceDelta });
    }
  }

  // ----------------------------
  // 2. Apply system-level metrics
  // ----------------------------
  if (metrics && this.state.metrics) {
    const m = this.state.metrics;

    m.systemEscalationRisk = this._clamp01(
      m.systemEscalationRisk + Number(metrics.systemEscalationDelta ?? 0)
    );

    m.allianceCohesion = this._clamp01(
      m.allianceCohesion + Number(metrics.allianceCohesionDelta ?? 0)
    );

    m.deterrenceBalance = this._clampSigned(
      m.deterrenceBalance + Number(metrics.deterrenceBalanceDelta ?? 0)
    );
  }

  // ----------------------------
  // 3. PROPAGATION PHYSICS
  // ----------------------------
  // LLM deltas ripple across alliances & rivalries
  for (const { theaterKey, magnitude } of propagationQueue) {
    this._propagateFromTheater(theaterKey, magnitude);
  }

  // ----------------------------
  // 4. UPDATE DOMAIN METRICS
  // ----------------------------
  // Recompute:
  // - systemEscalationRisk
  // - allianceCohesion
  // - deterrenceBalance
  // - activeConflictCount (unchanged here, but measured)
  this._updateMetrics();
}

}
