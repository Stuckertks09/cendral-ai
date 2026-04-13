import embedText from "../memory/semantic/embedText.js";

export default class PineconeSeeder {
  constructor({ semanticMemory }) {
    if (!semanticMemory) throw new Error("PineconeSeeder requires semanticMemory");
    this.semantic = semanticMemory;
  }

  async seedPersonas(personas) {
    const vectors = [];

    for (const p of personas) {
      const text = `
Persona: ${p.profile?.name}
Summary: ${p.summary || ""}
Values: ${JSON.stringify(p.values || {}, null, 2)}
Beliefs: ${JSON.stringify(p.beliefs || {}, null, 2)}
Psychology: ${JSON.stringify(p.psychology || {}, null, 2)}
      `.trim();

      const embedding = await embedText(text);

      vectors.push({
        id: `persona:${p._id}`,
        values: embedding,
        metadata: {
          type: "persona",
          name: p.profile?.name || "",
        }
      });
    }

    await this.semantic.upsert("persona", vectors);
    return vectors.length;
  }

  async seedActors(actors) {
    const vectors = actors.map(async (a) => {
      const text = `
Actor: ${a.label}
Doctrine: ${JSON.stringify(a.doctrine, null, 2)}
Military: ${JSON.stringify(a.military, null, 2)}
Presence: ${JSON.stringify(a.presence, null, 2)}
      `;

      const emb = await embedText(text);

      return {
        id: `actor:${a.key}`,
        values: emb,
        metadata: { type: "actor", label: a.label }
      };
    });

    const resolved = await Promise.all(vectors);
    await this.semantic.upsert("actor", resolved);
    return resolved.length;
  }

  async seedLeaders(leaders) {
    const vectors = leaders.map(async (l) => {
      const text = `
Leader: ${l.name}
Ideology: ${JSON.stringify(l.ideology, null, 2)}
Crisis Response: ${JSON.stringify(l.crisisResponse, null, 2)}
Influence: ${l.doctrineInfluence}
      `;

      const emb = await embedText(text);

      return {
        id: `leader:${l.key}`,
        values: emb,
        metadata: { type: "leader", name: l.name }
      };
    });

    const resolved = await Promise.all(vectors);
    await this.semantic.upsert("leader", resolved);
    return resolved.length;
  }
}
