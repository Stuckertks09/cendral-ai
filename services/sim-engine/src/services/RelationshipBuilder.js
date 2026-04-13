// src/services/RelationshipBuilder.js
export default class RelationshipBuilder {
  constructor({ openai, graphMemory }) {
    if (!openai) throw new Error("RelationshipBuilder: openai client required");
    if (!graphMemory) throw new Error("RelationshipBuilder: graphMemory required");

    this.openai = openai;         // <-- RAW OPENAI CLIENT
    this.graph = graphMemory;
  }

  async generateRelationships({ personas, actors, leaders }) {
    const prompt = `
You are an expert geopolitical + behavioral graph modeler.

PERSONAS:
${JSON.stringify(personas, null, 2)}

ACTORS:
${JSON.stringify(actors, null, 2)}

LEADERS:
${JSON.stringify(leaders, null, 2)}

Construct STRICT JSON:

{
  "persona_relationships": [
    { "from": "...", "to": "...", "trust": 0.0, "hostility": 0.0, "rationale": "..." }
  ],
  "actor_relationships": [
    { "from": "...", "to": "...", "type": "ally|rival|neutral",
      "trust": 0.0, "hostility": 0.0, "rationale": "..." }
  ],
  "leader_links": [
    { "leaderKey": "...", "actorKey": "...", "influence": 0.0, "rationale": "..." }
  ]
}

Rules:
- Keep graph sparse and realistic.
- Opposing ideologies increase hostility.
- Shared values increase trust.
- Output STRICT JSON ONLY.
`.trim();

    const result = await this.openai.chat.completions.create({
      model: "gpt-4.1",
      temperature: 0.2,
      messages: [
        { role: "system", content: "You output strict JSON graphs only." },
        { role: "user", content: prompt }
      ]
    });

    return JSON.parse(result.choices[0].message.content);
  }

  async applyToGraph(json) {
    if (json.persona_relationships) {
      for (const rel of json.persona_relationships) {
        await this.graph.linkPersonas(rel.from, rel.to, {
          trust: rel.trust,
          hostility: rel.hostility
        });
      }
    }

    if (json.actor_relationships) {
      for (const rel of json.actor_relationships) {
        await this.graph.linkActors(rel.from, rel.to, {
          type: rel.type,
          trust: rel.trust,
          hostility: rel.hostility
        });
      }
    }

    if (json.leader_links) {
      for (const link of json.leader_links) {
        await this.graph.linkLeaderToActor(link.leaderKey, link.actorKey);
      }
    }

    return true;
  }
}
