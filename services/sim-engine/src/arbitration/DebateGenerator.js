// src/core/arbitration/DebateGenerator.js

export default class DebateGenerator {
  constructor({ llm }) {
    this.llm = llm;
  }

  async generateArguments({ personas, event }) {
    const results = [];

    for (const persona of personas) {
      const summary = persona.toOverviewCard
        ? persona.toOverviewCard()
        : JSON.stringify(persona.profile || {}, null, 2);

      const prompt = `
You are simulating a political persona in a multi-agent debate.

Persona summary:
${summary}

Event:
${JSON.stringify(event, null, 2)}

Task:
Write a short argument (3–6 sentences) describing how this persona reacts to this event,
what they believe it means, and what they think should happen next.

Respond with plain text only. No JSON.
      `.trim();

      const text = await this.llm.generate({
        system: 'You generate realistic political arguments for a debate simulator.',
        user: prompt
      });

      results.push({
        personaId: String(persona._id),
        personaName: persona.profile?.name || persona._id,
        argument: text
      });
    }

    return results;
  }
}
