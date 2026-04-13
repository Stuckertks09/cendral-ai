// src/arbitration/DefenseArbitrator.js
import PromptPack from "../models/PromptPack.js";

/**
 * DefenseArbitrator (Actor-Aware + Memory-Aware)
 * ----------------------------------------------
 * Multi-stage LLM-driven arbitration for the Defense domain.
 *
 * Stages:
 *  0. Memory context   → semantic, relational, episodic (optional, passed in)
 *  1. Perception       → global threat assessment
 *  2. Arguments        → actor-specific strategic interpretations
 *  3. Arbitration      → merge into final deltas + metrics
 *
 * `memory` is an optional blob passed from the caller, e.g.:
 *
 *  {
 *    semantic: [...],      // Pinecone results or similar
 *    relational: {...},    // Neo4j / graph summaries
 *    episodic: [...],      // prior worldstate / run snapshots
 *  }
 *
 * Shape of debug (for logging / UI):
 *  {
 *    perception: { ... },
 *    arguments: { arguments: [ ... ] },
 *    arbitration: {
 *      topicUpdates: { ... },
 *      metrics: { ... }
 *    }
 *  }
 */

export default class DefenseArbitrator {
  constructor({ openai }) {
    if (!openai) throw new Error("DefenseArbitrator: openai client required");
    this.openai = openai;
  }

  /**
   * Main entry
   */
  async run({ event, worldState, actors, leaders, memory = null }) {
    if (!event) throw new Error("DefenseArbitrator: event is required");

    const promptPack = await this.#loadPromptPack();
    if (!promptPack) {
      console.warn("⚠️ DefenseArbitrator: no PromptPack found, skipping.");
      return {
        topicUpdates: {},
        metrics: {},
        debug: {
          perception: null,
          arguments: null,
          arbitration: null,
        },
      };
    }

    // 1) Global perception (now memory-aware)
    const perception = await this.#runPerception({
      event,
      worldState,
      actors,
      leaders,
      promptPack,
      memory,
    });

    // 2) Actor-aware arguments (now memory-aware)
    const argumentsOut = await this.#runArguments({
      event,
      worldState,
      perception,
      actors,
      leaders,
      promptPack,
      memory,
    });

    // 3) Final arbitration (LLM merges actor arguments into deltas; memory-aware)
    const arbitration = await this.#runArbitration({
      event,
      worldState,
      perception,
      argumentsOut,
      actors,
      leaders,
      promptPack,
      memory,
    });

    return {
      topicUpdates: arbitration.topicUpdates || {},
      metrics: arbitration.metrics || {},
      debug: {
        perception,
        arguments: argumentsOut,
        arbitration,
      },
    };
  }

  /* ======================================================================
   * PROMPT PACK LOADING
   * ====================================================================== */

  async #loadPromptPack() {
    return await PromptPack.findOne({
      domain: "defense",
      environment: "prod",
      key: "default_v1",
    }).lean();
  }

  /* ======================================================================
   * PERCEPTION (GLOBAL)
   * ====================================================================== */

  async #runPerception({
    event,
    worldState,
    actors,
    leaders,
    promptPack,
    memory,
  }) {
    const actorsSummary = this.#summarizeActors(actors, leaders);

    const memoryBlock = memory
      ? `
Historical + Memory Context (for perception):
${JSON.stringify(memory, null, 2)}
`
      : `
Historical + Memory Context:
(null / not provided)
`;

    const user = `
Event:
${JSON.stringify(event, null, 2)}

Defense WorldState:
${JSON.stringify(worldState.defense, null, 2)}

Actors (doctrine, capabilities, theater presence):
${JSON.stringify(actorsSummary, null, 2)}

${memoryBlock}

Instructions:
${promptPack.perceptionPrompt}

Remember: output STRICT JSON only.
`.trim();

    const result = await this.openai.chat.completions.create({
      model: "gpt-4.1",
      temperature: 0.1,
      messages: [
        { role: "system", content: promptPack.systemPrompt },
        { role: "user", content: user },
      ],
    });

    return this.#safeJSON(result.choices[0].message.content, "perception");
  }

  /* ======================================================================
   * ARGUMENTS (ACTOR-AWARE)
   * ====================================================================== */

  async #runArguments({
    event,
    worldState,
    perception,
    actors,
    leaders,
    promptPack,
    memory,
  }) {
    const actorsSummary = this.#summarizeActors(actors, leaders);

    const argumentInstructions = `
${promptPack.argumentPrompt}

You MUST output STRICT JSON with the following shape:

{
  "arguments": [
    {
      "actorKey": "usa",
      "actorLabel": "United States",
      "theater": "indo_pacific" | "eastern_europe" | "middle_east" | "global" | "other",
      "direction": "increase_tension" | "decrease_tension",
      "magnitude": 0-1,
      "rationale": "string explanation"
    }
  ]
}

Memory integration rules:
- Use semantic memory to recognize similar past events or doctrines.
- Use relational memory (alliances, rivalries, trust/hostility) to ground arguments.
- Use episodic memory (recent steps in this run) to avoid overreacting or underreacting.
- Keep the graph realistic and consistent with past patterns.

- Include one or more arguments per relevant actor.
- Each argument MUST be tied to a specific actorKey and theater.
`.trim();

    const memoryBlock = memory
      ? `
Historical + Memory Context (for arguments):
${JSON.stringify(memory, null, 2)}
`
      : `
Historical + Memory Context:
(null / not provided)
`;

    const user = `
Event:
${JSON.stringify(event, null, 2)}

Perception:
${JSON.stringify(perception, null, 2)}

Defense WorldState:
${JSON.stringify(worldState.defense, null, 2)}

Actors & Leaders:
${JSON.stringify(actorsSummary, null, 2)}

${memoryBlock}

Instructions:
${argumentInstructions}
`.trim();

    const result = await this.openai.chat.completions.create({
      model: "gpt-4.1",
      temperature: 0.3,
      messages: [
        { role: "system", content: promptPack.systemPrompt },
        { role: "user", content: user },
      ],
    });

    return this.#safeJSON(result.choices[0].message.content, "arguments");
  }

  /* ======================================================================
   * FINAL ARBITRATION (DELTAS)
   * ====================================================================== */

  async #runArbitration({
    event,
    worldState,
    perception,
    argumentsOut,
    actors,
    leaders,
    promptPack,
    memory,
  }) {
    const actorsSummary = this.#summarizeActors(actors, leaders);

    const arbitrationInstructions = `
${promptPack.arbitrationPrompt}

You are merging ACTOR-SPECIFIC arguments into a single, system-level update.

Memory integration rules:
- If memory shows repeated escalation in this theater → bias stanceDelta & volatilityDelta upward.
- If memory shows successful de-escalation patterns → modestly reduce stanceDelta / escalation risk.
- If historical alliance strain exists → dampen positive allianceCohesionDelta.
- If relational memory indicates very strong alliances → do not overstate fragmentation.
- Always keep numeric outputs within the allowed ranges.

You MUST:

- Consider each actor's doctrine, capabilities, and alliances.
- Weight arguments naturally (e.g., USA/China > minor actors).
- Combine all arguments for each theater into net deltas.

Output STRICT JSON:

{
  "topicUpdates": {
    "indo_pacific": {
      "stanceDelta": -1 to 1,
      "certaintyDelta": -1 to 1,
      "volatilityDelta": -1 to 1
    },
    "eastern_europe": {
      "stanceDelta": -1 to 1,
      "certaintyDelta": -1 to 1,
      "volatilityDelta": -1 to 1
    }
  },
  "metrics": {
    "systemEscalationDelta": -1 to 1,
    "allianceCohesionDelta": -1 to 1,
    "deterrenceBalanceDelta": -1 to 1
  }
}
`.trim();

    const memoryBlock = memory
      ? `
Historical + Memory Context (for arbitration):
${JSON.stringify(memory, null, 2)}
`
      : `
Historical + Memory Context:
(null / not provided)
`;

    const user = `
Event:
${JSON.stringify(event, null, 2)}

Perception:
${JSON.stringify(perception, null, 2)}

Actor-Specific Arguments:
${JSON.stringify(argumentsOut, null, 2)}

Defense WorldState:
${JSON.stringify(worldState.defense, null, 2)}

Actors & Leaders:
${JSON.stringify(actorsSummary, null, 2)}

${memoryBlock}

Instructions:
${arbitrationInstructions}
`.trim();

    const result = await this.openai.chat.completions.create({
      model: "gpt-4.1",
      temperature: 0.1,
      messages: [
        { role: "system", content: promptPack.systemPrompt },
        { role: "user", content: user },
      ],
    });

    return this.#safeJSON(result.choices[0].message.content, "arbitration");
  }

  /* ======================================================================
   * ACTOR / LEADER SUMMARIZATION
   * ====================================================================== */

  #summarizeActors(actors = [], leaders = []) {
    if (!Array.isArray(actors)) actors = [];
    if (!Array.isArray(leaders)) leaders = [];

    // quick lookup by actorKey
    const leadersByActor = {};
    for (const leader of leaders) {
      if (!leader.actorKey) continue;
      if (!leadersByActor[leader.actorKey]) leadersByActor[leader.actorKey] = [];
      leadersByActor[leader.actorKey].push({
        key: leader.key,
        name: leader.name,
        title: leader.title,
        isPrimary: leader.isPrimary,
        approval: leader.approval,
        stability: leader.stability,
        ideology: leader.ideology,
        crisisResponse: leader.crisisResponse,
        doctrineInfluence: leader.doctrineInfluence,
      });
    }

    return actors.map((actor) => ({
      actorKey: actor.key,
      label: actor.label,
      type: actor.type,
      doctrine: actor.doctrine,
      military: actor.military,
      relations: actor.relations,
      presence: actor.presence,
      leaders: leadersByActor[actor.key] || [],
    }));
  }

  /* ======================================================================
   * JSON SAFETY
   * ====================================================================== */

  #safeJSON(text, stage) {
    try {
      return JSON.parse(text);
    } catch (err) {
      console.error(`❌ DefenseArbitrator: invalid JSON in ${stage}`, text);
      return {};
    }
  }
}
