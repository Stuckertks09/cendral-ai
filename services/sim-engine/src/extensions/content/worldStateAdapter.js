export default class ContentWorldStateAdapter {
  constructor(worldState) {
    this.worldState = worldState;
  }

  // ensure structure exists
  initIfMissing() {
    this.worldState.content = this.worldState.content || {
      topics: [],
      creators: [],
      feedDynamics: {
        recencyBias: 0.7,
        noveltyBias: 0.5,
        diversityBias: 0.3,
        personalizationStrength: 0.6
      },
      sentiment: { positive: 0.4, negative: 0.3, ironic: 0.2, outrage: 0.2 },
      trends: []
    };
  }

  /** 
   * EVENT: A new piece of content hits the ecosystem
   * event = { topic, sentiment, creatorId, virality, polarity }
   */
  onContentPublished(event) {
    this.initIfMissing();
    const ws = this.worldState.content;

    this.#updateTopic(event.topic, event);
    this.#updateCreator(event.creatorId, event);
    this.#updateSentiment(event);
    this.#maybeCreateTrend(event);
  }

  /** 
   * EVENT: Personas interact with content (like, share, comment, ignore)
   * interactions = [{ personaId, topic, action }]
   */
  onContentInteractions(interactions) {
    this.initIfMissing();
    const ws = this.worldState.content;

    interactions.forEach(int => {
      const { topic, action } = int;
      this.#applyInteraction(topic, action);
    });
  }

  // --- PRIVATE METHODS ------------------------------------------------------

  #updateTopic(topic, evt) {
    const ws = this.worldState.content;
    let t = ws.topics.find(x => x.topic === topic);

    if (!t) {
      t = { topic, heat: 0.3, saturation: 0.2, polarity: 0 };
      ws.topics.push(t);
    }

    t.heat = Math.min(1, t.heat + 0.05);
    t.saturation = Math.min(1, t.saturation + 0.03);

    if (typeof evt.polarity === 'number') {
      t.polarity = Math.max(-1, Math.min(1, t.polarity + evt.polarity * 0.2));
    }
  }

  #updateCreator(creatorId, evt) {
    if (!creatorId) return;

    const ws = this.worldState.content;
    let c = ws.creators.find(x => x.creatorId === creatorId);

    if (!c) {
      c = { creatorId, influence: 0.3, trust: 0.5, virality: 0.2 };
      ws.creators.push(c);
    }

    c.influence = Math.min(1, c.influence + (evt.virality || 0) * 0.1);
    c.virality = Math.min(1, c.virality + (evt.virality || 0) * 0.1);
  }

  #updateSentiment(evt) {
    const s = this.worldState.content.sentiment;
    if (evt.sentiment === 'positive') s.positive = Math.min(1, s.positive + 0.02);
    if (evt.sentiment === 'negative') s.negative = Math.min(1, s.negative + 0.02);
    if (evt.sentiment === 'ironic') s.ironic = Math.min(1, s.ironic + 0.02);
    if (evt.sentiment === 'outrage') s.outrage = Math.min(1, s.outrage + 0.03);
  }

  #maybeCreateTrend(evt) {
    const ws = this.worldState.content;
    if (!evt.virality || evt.virality < 0.7) return;

    ws.trends.push({
      label: evt.topic,
      strength: Math.min(1, 0.5 + evt.virality * 0.5),
      spreadRate: evt.virality,
      decayRate: 0.5
    });
  }

  #applyInteraction(topic, action) {
    const ws = this.worldState.content;
    const t = ws.topics.find(x => x.topic === topic);
    if (!t) return;

    if (action === 'share') t.heat = Math.min(1, t.heat + 0.05);
    if (action === 'ignore') t.heat = Math.max(0, t.heat - 0.02);
    if (action === 'comment') t.saturation = Math.min(1, t.saturation + 0.03);
  }

  toJSON() {
    return this.worldState.content || {};
  }
}
