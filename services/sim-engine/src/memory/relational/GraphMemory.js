// memory/relational/GraphMemory.js
import neo4j from "neo4j-driver";

export default class GraphMemory {
  constructor() {
    this.driver = neo4j.driver(
      process.env.NEO4J_URI,
      neo4j.auth.basic(
        process.env.NEO4J_USER,
        process.env.NEO4J_PASSWORD
      )
    );

    this.session = this.driver.session();
  }

  async init() {
    try {
      await this.session.run("RETURN 1");
      console.log("🕸️ Neo4j connected");
    } catch (err) {
      console.error("❌ Neo4j connection test failed:", err);
      throw err;
    }
  }

  // ============================================================
  // INTERNAL HELPERS
  // ============================================================
  async run(cypher, params = {}) {
    try {
      const res = await this.session.run(cypher, params);
      return res.records;
    } catch (err) {
      console.error("Neo4j query error:", cypher, params, err);
      throw err;
    }
  }

  // Normalize numbers to avoid undefined/null issues
  normalize(v, fallback = 0) {
    return typeof v === "number" && !isNaN(v) ? v : fallback;
  }

  // ============================================================
  // NODE CREATION
  // ============================================================

  async createPersonaNode(persona) {
    return this.run(
      `
      MERGE (p:Persona {id: $id})
      SET p.name = $name,
          p.openness = $openness,
          p.neuroticism = $neuroticism
      RETURN p
      `,
      {
        id: persona._id,
        name: persona.identity?.name || "Unknown",
        openness: persona.psychology?.traits?.openness ?? 0.5,
        neuroticism: persona.psychology?.traits?.neuroticism ?? 0.5,
      }
    );
  }

  async createActorNode(actor) {
    return this.run(
      `
      MERGE (a:Actor {key: $key})
      SET a.label = $label,
          a.militaryStrength = $militaryStrength,
          a.cyberCapability = $cyberCapability,
          a.nuclearPosture = $nuclearPosture
      RETURN a
      `,
      {
        key: actor.key,
        label: actor.label,
        militaryStrength: actor.military?.strength ?? 0.5,
        cyberCapability: actor.military?.cyberCapability ?? 0.5,
        nuclearPosture: actor.military?.nuclearPosture ?? 0.5,
      }
    );
  }

  async createLeaderNode(leader) {
    return this.run(
      `
      MERGE (l:Leader {key: $key})
      SET l.name = $name,
          l.title = $title,
          l.hawkishness = $hawkishness,
          l.riskTolerance = $riskTolerance
      RETURN l
      `,
      {
        key: leader.key,
        name: leader.name,
        title: leader.title,
        hawkishness: leader.ideology?.hawkishness ?? 0.5,
        riskTolerance: leader.ideology?.riskTolerance ?? 0.5,
      }
    );
  }

  // ============================================================
  // RELATIONSHIPS
  // ============================================================

  // PERSONA → PERSONA (social ties)
  async linkPersonas(id1, id2, { trust = 0.5, hostility = 0.1 }) {
    return this.run(
      `
      MATCH (a:Persona {id: $id1}), (b:Persona {id: $id2})
      MERGE (a)-[r:RELATES_TO]->(b)
      SET r.trust = $trust,
          r.hostility = $hostility
      RETURN r
      `,
      {
        id1,
        id2,
        trust: this.normalize(trust),
        hostility: this.normalize(hostility),
      }
    );
  }

  // ACTOR → ACTOR (alliances, rivalries)
  async linkActors(key1, key2, { type, trust = 0.5, hostility = 0.2 }) {
    return this.run(
      `
      MATCH (a:Actor {key: $key1}), (b:Actor {key: $key2})
      MERGE (a)-[r:RELATION {type: $type}]->(b)
      SET r.trust = $trust,
          r.hostility = $hostility
      RETURN r
      `,
      {
        key1,
        key2,
        type,
        trust: this.normalize(trust),
        hostility: this.normalize(hostility),
      }
    );
  }

  // LEADER → ACTOR (leadership)
  async linkLeaderToActor(leaderKey, actorKey) {
    return this.run(
      `
      MATCH (l:Leader {key: $leaderKey}), (a:Actor {key: $actorKey})
      MERGE (l)-[:LEADS]->(a)
      RETURN l, a
      `,
      { leaderKey, actorKey }
    );
  }

  // ============================================================
  // UPDATE RELATIONSHIP SCORES (dynamic)
  // called by arbitration + event handlers
  // ============================================================
  async updateActorRelationship(actorA, actorB, delta) {
    return this.run(
      `
      MATCH (a:Actor {key: $actorA})-[r:RELATION]->(b:Actor {key: $actorB})
      SET r.trust = coalesce(r.trust, 0.5) + $trustDelta,
          r.hostility = coalesce(r.hostility, 0.2) + $hostilityDelta
      RETURN r
      `,
      {
        actorA,
        actorB,
        trustDelta: delta.trust ?? 0,
        hostilityDelta: delta.hostility ?? 0,
      }
    );
  }

  // ============================================================
  // FETCH RELATIONSHIPS
  // ============================================================

  async getActorRelations(actorKey) {
    const records = await this.run(
      `
      MATCH (a:Actor {key: $actorKey})-[r:RELATION]->(b:Actor)
      RETURN b.key AS target, r.type AS type, r.trust AS trust, r.hostility AS hostility
      `,
      { actorKey }
    );

    return records.map((rec) => ({
      target: rec.get("target"),
      type: rec.get("type"),
      trust: rec.get("trust"),
      hostility: rec.get("hostility"),
    }));
  }

  async getPersonaNetwork(personaId) {
    const records = await this.run(
      `
      MATCH (a:Persona {id: $personaId})-[r:RELATES_TO]->(b:Persona)
      RETURN b.id AS target, r.trust AS trust, r.hostility AS hostility
      `,
      { personaId }
    );

    return records.map((rec) => ({
      target: rec.get("target"),
      trust: rec.get("trust"),
      hostility: rec.get("hostility"),
    }));
  }
}
