// memory/MemoryFusion.js

import PineconeMemory from "./semantic/PineconeMemory.js";
import GraphMemory from "./relational/GraphMemory.js";
import { computeActorSignals } from "./relational/graphSignals.js";

export default class MemoryFusion {
  constructor(opts = {}) {
    this.semantic = opts.semanticMemory || new PineconeMemory();
    this.relational = opts.relationalMemory || new GraphMemory();
    this.episodic = opts.episodicMemory || null;
  }

  async init() {
    if (this.semantic && this.semantic.init) {
      await this.semantic.init();
    }
    if (this.relational && this.relational.init) {
      await this.relational.init();
    }
    if (this.episodic && this.episodic.init) {
      await this.episodic.init();
    }
  }

  // ============================================================
  // WRITE: record arbitration step
  // ============================================================
  async recordStep(params) {
    const {
      domain,
      event,
      worldState,
      actors = [],
      leaders = [],
      personas = [],
      arbitration,
    } = params;

    // ----------------------------
    // Semantic memory (Pinecone)
    // ----------------------------
    try {
      if (event && this.semantic.upsertEvent) {
        await this.semantic.upsertEvent(event, { domain });
      }

      for (const p of personas) {
        if (p && p._id && this.semantic.upsertPersona) {
          await this.semantic.upsertPersona(p, { domain });
        }
      }

      for (const actor of actors) {
        if (!actor?.key) continue;

        const primaryLeader = this.pickPrimaryLeader(actor, leaders);
        if (this.semantic.upsertActor) {
          await this.semantic.upsertActor(actor, {
            domain,
            leader: primaryLeader,
          });
        }
      }
    } catch (err) {
      console.error("❌ Semantic memory error:", err);
    }

    // ----------------------------
    // Relational memory (Neo4j)
    // ----------------------------
    try {
      for (const actor of actors) {
        if (!actor?.key) continue;

        await this.relational.createActorNode(actor);

        const relations = Array.isArray(actor.relations)
          ? actor.relations
          : [];

        for (const rel of relations) {
          if (!rel?.target) continue;

          const trust = typeof rel.trust === "number" ? rel.trust : 0.5;
          const hostility =
            typeof rel.hostility === "number" ? rel.hostility : 0.2;
          const type = rel.type || "neutral";

          await this.relational.linkActors(actor.key, rel.target, {
            type,
            trust,
            hostility,
          });
        }
      }

      for (const leader of leaders) {
        if (!leader?.key) continue;

        await this.relational.createLeaderNode(leader);

        const actorKey = leader.actorKey;
        if (actorKey) {
          await this.relational.linkLeaderToActor(leader.key, actorKey);
        }
      }

      for (const persona of personas) {
        if (!persona?._id) continue;

        await this.relational.createPersonaNode(persona);

        const rels = persona.social?.relationships || [];
        for (const rel of rels) {
          if (!rel?.targetPersonaId) continue;
          await this.relational.linkPersonas(persona._id, rel.targetPersonaId, {
            trust: rel.trust ?? 0.5,
            hostility: rel.hostility ?? 0.1,
          });
        }
      }
    } catch (err) {
      console.error("❌ Relational memory error:", err);
    }

    // ----------------------------
    // Episodic memory
    // ----------------------------
    try {
      if (this.episodic && this.episodic.recordEpisode) {
        await this.episodic.recordEpisode({
          domain,
          eventId: event?._id,
          worldStateId: worldState?._id,
          runId: worldState?.runId,
          stepIndex: worldState?.stepIndex || 0,
          arbitrationSummary: arbitration?.summary,
          raw: { event, worldState, arbitration },
        });
      }
    } catch (err) {
      console.error("❌ Episodic memory error:", err);
    }
  }

  // ============================================================
  // READ: Build fused LLM context
  // ============================================================
  async buildContext(params) {
    const {
      domain,
      event,
      focalActorKey,
      personaIds = [],
      theaterKey,
    } = params;

    const semantic = await this.buildSemanticContext({
      domain,
      event,
      personaIds,
    });

    const relational = await this.buildRelationalContext({
      focalActorKey,
    });

    const episodic = await this.buildEpisodicContext({
      domain,
      personaIds,
    });

    return {
      domain,
      eventId: event?._id,
      theaterKey,
      semantic,
      relational,
      episodic,
    };
  }

  // ============================================================
  // HELPERS (JS-safe)
  // ============================================================
  pickPrimaryLeader(actor, leaders) {
    if (!actor?.leaders || !Array.isArray(leaders)) return null;

    const primary = actor.leaders.find((l) => l.isPrimary);
    if (!primary) return null;

    return leaders.find((l) => l.key === primary.leaderKey) || null;
  }

  async buildSemanticContext({ domain, event, personaIds }) {
    const result = { similarEvents: [], relatedPersonas: [] };

    if (!this.semantic || !this.semantic.querySimilarByText) return result;

    const text =
      event?.parsed?.summary ||
      event?.rawText ||
      [event?.type, event?.topic].filter(Boolean).join(" ");

    if (!text) return result;

    try {
      result.similarEvents = await this.semantic.querySimilarByText({
        text,
        topK: 8,
        filter: { kind: "event", domain },
      });

      if (personaIds.length > 0) {
        result.relatedPersonas = await this.semantic.querySimilarByText({
          text,
          topK: 5,
          filter: { kind: "persona" },
        });
      }
    } catch (err) {
      console.error("❌ Semantic query error:", err);
    }

    return result;
  }

  async buildRelationalContext({ focalActorKey }) {
    const result = { actorRelations: [], actorSignals: null };

    if (!focalActorKey) return result;

    try {
      const relations = await this.relational.getActorRelations(
        focalActorKey
      );
      const signals = computeActorSignals(relations);

      result.actorRelations = relations;
      result.actorSignals = signals;
    } catch (err) {
      console.error("❌ Relational query error:", err);
    }

    return result;
  }

  async buildEpisodicContext({ domain, personaIds }) {
    if (!this.episodic || !this.episodic.queryRecent) {
      return { episodes: [] };
    }

    try {
      const episodes = await this.episodic.queryRecent({
        domain,
        personaIds,
        limit: 10,
      });
      return { episodes };
    } catch (err) {
      console.error("❌ Episodic query error:", err);
      return { episodes: [] };
    }
  }
}
