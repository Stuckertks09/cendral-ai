// src/core/arbitration/ArbitrationEngine.js

export default class ArbitrationEngine {
  /**
   * @param {Object} opts
   * @param {Object} opts.llm                - LlmClient instance
   * @param {Object} opts.domainExtensions   - { political: { worldState, ... }, economic: {...}, ... }
   */
  constructor({ llm, domainExtensions }) {
    this.llm = llm;
    this.domainExtensions = domainExtensions;
  }

  /**
   * Main arbitration call.
   *
   * @param {Object} params
   * @param {Object} params.event
   * @param {Array}  params.argumentsList
   * @param {Object} params.worldState   - full worldState document
   * @param {Array}  params.personas     - array of CorePersona docs
   * @param {string} params.domain       - e.g. "political"
   * @param {Object} [params.memory]     - optional memory blob (semantic / relational / episodic)
   */
  async arbitrate({ event, argumentsList, worldState, personas, domain, memory = null }) {
    const ext = this.domainExtensions[domain];
    if (!ext) {
      throw new Error(`Unknown domain "${domain}" passed into arbitrator`);
    }

    const domainState = worldState[domain] || worldState.domains?.[domain];
    if (!domainState) {
      throw new Error(`No domain slice found on worldState for "${domain}"`);
    }

    const schema = ext.worldState || ext.worldStateSchema;
    if (!schema) {
      throw new Error(`Domain extension "${domain}" has no worldState schema`);
    }

    const adjustableFields = this.#listAdjustableFields(schema);

    const prompt = this.#buildPrompt({
      event,
      argumentsList,
      domain,
      domainState,
      adjustableFields,
      personas,
      memory,
    });

    const raw = await this.llm.generate({
      system:
        "You are a domain-agnostic arbitration engine for a cognition simulator. Output ONLY strict JSON.",
      user: prompt,
    });

    let parsed;
    try {
      parsed = JSON.parse(this.#extractJson(raw));
    } catch (err) {
      console.error("❌ Arbitration JSON parse failed:", err);
      return { deltas: {}, personaUpdates: {}, metadata: { raw } };
    }

    const deltas = parsed.deltas || {};
    const personaUpdates = parsed.personas || {};
    const metadata = parsed.metadata || {};

    // Mutate the passed-in domain slice + personas.
    this.#applyDeltas(domainState, deltas);
    this.#applyPersonaUpdates(personas, personaUpdates);

    return { deltas, personaUpdates, metadata };
  }

  #buildPrompt({
    event,
    argumentsList,
    domain,
    domainState,
    adjustableFields,
    personas,
    memory,
  }) {
    const personaSummaries = personas.map((p) => ({
      id: String(p._id),
      name: p.identity?.name || p._id,
      keyTraits: p.psychology?.traits || {},
    }));

    const memoryBlock = memory
      ? `
Historical + Memory Context:
${JSON.stringify(memory, null, 2)}

Use this memory to:
- Prefer updates consistent with long-run patterns.
- Avoid overreacting to single events when memory shows stability.
- Detect early warning signs when memory shows repeated small escalations.
- Respect established alliances / rivalries found in relational memory.
`
      : `
Historical + Memory Context:
(null / not provided)
`;

    return `
You arbitrate disagreements in a cognition engine.

Domain: "${domain}"

You are given:
- An event
- Persona arguments about the event
- The current worldstate slice for this domain
- A list of fields that are allowed to be updated
- Lightweight persona summaries
- Optional historical memory (semantic / relational / episodic)

Adjustable fields:
${JSON.stringify(adjustableFields, null, 2)}

Current domain state:
${JSON.stringify(domainState, null, 2)}

Event:
${JSON.stringify(event, null, 2)}

Persona summaries:
${JSON.stringify(personaSummaries, null, 2)}

Persona arguments:
${JSON.stringify(argumentsList, null, 2)}

${memoryBlock}

Output STRICT JSON:

{
  "deltas": {
    "<fieldName>": <numeric delta between -0.5 and 0.5>,
    ...
  },
  "personas": {
    "<personaId>": {
      "valenceDelta": <number between -0.5 and 0.5>,
      "arousalDelta": <number between -0.5 and 0.5>
    }
  },
  "metadata": {
    "summary": "1-3 sentence arbitration summary",
    "drivers": ["key factors"],
    "notes": "optional"
  }
}

Rules:
- ONLY modify fields listed in adjustableFields.
- These are deltas, not absolute values.
- Keep deltas small and realistic.
- Do NOT introduce new fields.
- Use memory to smooth noise and highlight true structural change.
- Output STRICT JSON, no markdown.
    `.trim();
  }

  #extractJson(raw) {
    if (typeof raw !== "string") return JSON.stringify(raw);
    const start = raw.indexOf("{");
    const end = raw.lastIndexOf("}");
    if (start === -1 || end === -1 || end <= start) {
      throw new Error("No JSON found in LLM output");
    }
    return raw.slice(start, end + 1);
  }

  /**
   * Parse extension schema to list adjustable numeric fields.
   * Designed for Mongoose schemas.
   */
  #listAdjustableFields(schema) {
    const fields = [];

    if (!schema || typeof schema !== "object") return fields;

    // Case: actual Mongoose Schema instance
    const paths = schema.paths || {};

    for (const [key, pathObj] of Object.entries(paths)) {
      // Skip internal mongoose keys
      if (key.startsWith("__") || key === "_id") continue;

      // Skip arrays (arrays of topics shouldn't be directly mutated)
      if (pathObj.instance === "Array") continue;

      // Top-level numbers
      if (pathObj.instance === "Number") {
        fields.push(key);
        continue;
      }

      // Subdocument (nested schema)
      if (pathObj.schema) {
        const nested = this.#listAdjustableFields(pathObj.schema);
        nested.forEach((child) => fields.push(`${key}.${child}`));
      }
    }

    return fields;
  }

  #applyDeltas(domainState, deltas) {
    for (const [path, delta] of Object.entries(deltas)) {
      if (typeof delta !== "number") continue;

      const parts = path.split(".");
      let target = domainState;

      for (let i = 0; i < parts.length - 1; i++) {
        if (!target) break;
        target = target[parts[i]];
      }

      if (!target) continue;

      const field = parts[parts.length - 1];
      if (typeof target[field] === "number") {
        target[field] += delta;
      }
    }
  }

  #applyPersonaUpdates(personas, personaUpdates) {
    for (const [pid, updates] of Object.entries(personaUpdates)) {
      const p = personas.find((x) => String(x._id) === pid);
      if (!p) continue;

      if (typeof updates.valenceDelta === "number") {
        const prev = p.psychology?.valence ?? 0;
        p.psychology = p.psychology || {};
        p.psychology.valence = prev + updates.valenceDelta;
      }

      if (typeof updates.arousalDelta === "number") {
        const prev = p.psychology?.arousal ?? 0.5;
        p.psychology = p.psychology || {};
        p.psychology.arousal = prev + updates.arousalDelta;
      }
    }
  }
}
