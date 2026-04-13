// memory/semantic/PineconeMemory.js
import { Pinecone } from "@pinecone-database/pinecone";
import embedText from "./embedText.js";

export default class PineconeMemory {
  constructor() {
    this.pc = new Pinecone({
      apiKey: process.env.PINECONE_API_KEY,
    });

    // Define all memory spaces
    this.indexConfig = {
      persona: {
        name: "cendral-personas-v1",
        dimension: 3072,
        metric: "cosine",
      },
      actor: {
        name: "cendral-actors-v1",
        dimension: 3072,
        metric: "cosine",
      },
      leader: {
        name: "cendral-leaders-v1",
        dimension: 3072,
        metric: "cosine",
      },
      events: {
        name: "cendral-events-v1",
        dimension: 3072,
        metric: "cosine",
      },
      // ready for future:
      // cognition: { name: "cendral-cognition-v1", ... }
      // narratives: { name: "cendral-narratives-v1", ... }
    };

    this.indexes = {}; // will be filled in init()
  }

  async init() {
    const existing = await this.pc.listIndexes();
    const existingNames = existing.indexes.map((i) => i.name);

    for (const [key, cfg] of Object.entries(this.indexConfig)) {
      if (!existingNames.includes(cfg.name)) {
        console.log(`🆕 Creating Pinecone index: ${cfg.name}`);

        await this.pc.createIndex({
          name: cfg.name,
          dimension: cfg.dimension,
          metric: cfg.metric,
          spec: {
            serverless: {
              cloud: "aws",
              region: "us-east-1",
            },
          },
        });

        // Wait for index readiness
        await this.waitUntilReady(cfg.name);
      }

      // Attach index handle
      this.indexes[key] = this.pc.index(cfg.name);
    }

    console.log("✅ Pinecone indexes initialized:");
    console.table(Object.fromEntries(Object.entries(this.indexConfig).map(([k,v]) => [k, v.name])));
  }

  async waitUntilReady(indexName) {
    let ready = false;

    while (!ready) {
      const desc = await this.pc.describeIndex(indexName);
      ready = desc.status?.ready || desc.status?.state === "Ready";

      if (!ready) {
        console.log(`⏳ Waiting for index ${indexName} to become ready…`);
        await new Promise((r) => setTimeout(r, 3000));
      }
    }
  }

  // -----------------------------------------------------------
  // HELPERS
  // -----------------------------------------------------------
  async #embed(text) {
    return embedText(text);
  }

  #normalizeMeta(meta = {}) {
    return Object.fromEntries(
      Object.entries(meta).filter(
        ([_, v]) =>
          v !== undefined &&
          v !== null &&
          typeof v !== "function" // safety
      )
    );
  }

  #pickIndex(type) {
  if (!this.indexes[type]) {
    throw new Error(`Invalid Pinecone index type: ${type}`);
  }
  return this.indexes[type];
}

  // -----------------------------------------------------------
  // UPSERT (STORE MEMORY)
  // -----------------------------------------------------------
  async storeMemory({
    type,       // "persona" | "actor" | "leader"
    id,         // ID inside the type (personaId, actorKey, leaderKey)
    subKey,     // memory subtype: "belief", "episodic", "doctrine", etc.
    text,       // actual textual memory
    metadata = {}
  }) {
    if (!text) return;

    const index = this.#pickIndex(type);
    const embedding = await this.#embed(text);

    // Vector ID example:
    // persona:alex:belief:1234
    const vectorId = `${type}:${id}:${subKey}:${Date.now()}`;

    const vector = {
      id: vectorId,
      values: embedding,
      metadata: this.#normalizeMeta({
        type,
        owner: id,
        subKey,
        text,
        ...metadata,
      }),
    };

    await index.upsert([vector]);
    return vectorId;
  }

  // -----------------------------------------------------------
  // QUERY MEMORY (Semantic recall)
  // -----------------------------------------------------------
  async queryMemory({
    type,         // persona | actor | leader
    id,           // optional filter (personaId, actorKey, leaderKey)
    query,        // natural language query
    topK = 5,
    filter = {},  // pinecone metadata filter
  }) {
    const index = this.#pickIndex(type);
    const embedding = await this.#embed(query);

    const fullFilter =
      id
        ? { ...filter, owner: id, type } // restrict to that persona/actor/leader
        : { ...filter, type };          // restrict only by memory type

    const results = await index.query({
      vector: embedding,
      topK,
      includeMetadata: true,
      filter: fullFilter,
    });

    return results.matches || [];
  }

  // -----------------------------------------------------------
  // SPECIALIZED WRAPPERS
  // (Convenience functions used across the engine)
  // -----------------------------------------------------------

  // PERSONA MEMORY --------------------------------------------
  storePersonaBelief(personaId, beliefObj) {
    const text = `${beliefObj.statement} (salience: ${beliefObj.salience}, confidence: ${beliefObj.confidence})`;
    return this.storeMemory({
      type: "persona",
      id: personaId,
      subKey: "belief",
      text,
      metadata: {
        salience: beliefObj.salience,
        confidence: beliefObj.confidence,
        domain: beliefObj.domain,
      },
    });
  }

  storePersonaEpisodic(personaId, event, summary) {
    const base = `${summary}\nEvent: ${event.rawText}`;
    return this.storeMemory({
      type: "persona",
      id: personaId,
      subKey: `episode:${event._id}`,
      text: base,
      metadata: {
        eventId: String(event._id),
        domain: event.domain,
        topic: event.topic,
      },
    });
  }

  // ACTOR MEMORY -----------------------------------------------
  storeActorDoctrine(actorKey, doctrineObj) {
    const text = `Doctrine for ${actorKey}: ${JSON.stringify(doctrineObj)}`;
    return this.storeMemory({
      type: "actor",
      id: actorKey,
      subKey: "doctrine",
      text,
      metadata: doctrineObj,
    });
  }

  storeActorEvent(actorKey, event) {
    const text = `Actor ${actorKey} encountered event: ${event.summary}`;
    return this.storeMemory({
      type: "actor",
      id: actorKey,
      subKey: `event:${event._id}`,
      text,
      metadata: {
        eventId: String(event._id),
        severity: event.severity,
        theater: event.theater,
      },
    });
  }

  // EVENT MEMORY ----------------------------------------------

  storeEventMemory(event) {
  const text = event.summary || event.rawText;
  return this.storeMemory({
    type: "events",
    id: event._id,
    subKey: "event",
    text,
    metadata: {
      domain: event.domain,
      topic: event.topic,
      severity: event.severity
    }
  });
}

queryEvents(query, topK = 5) {
  return this.queryMemory({
    type: "events",
    query,
    topK,
  });
}

  // -------------------------------------------
  // Access index by logical type
  // -------------------------------------------
  index(type) {
    const idx = this.indexes[type];
    if (!idx) throw new Error(`Unknown Pinecone index: ${type}`);
    return idx;
  }

  // Upsert vectors into a specific index
  // -------------------------------------------
  async upsert(type, vectors) {
    const index = this.index(type);
    return await index.upsert(vectors);
  }

  // LEADER MEMORY ----------------------------------------------
  storeLeaderCrisisMemory(leaderKey, event, interpretation) {
    const text = `Leader ${leaderKey} crisis response: ${interpretation}`;
    return this.storeMemory({
      type: "leader",
      id: leaderKey,
      subKey: `crisis:${event._id}`,
      text,
      metadata: {
        eventId: String(event._id),
        domain: event.domain,
        severity: event.severity,
      },
    });
  }
}
