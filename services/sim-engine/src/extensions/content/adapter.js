export default class ContentAdapter {
  constructor(persona) {
    this.persona = persona;
  }

  applyDefaults(data = {}) {
    this.persona.extensions = this.persona.extensions || {};
    this.persona.extensions.content = {
      ...(this.persona.extensions.content || {}),
      ...data
    };
  }

  updateTopicAffinity(topic, delta) {
    const ext = this.persona.extensions.content;
    if (!ext?.topicAffinities) return;

    const entry = ext.topicAffinities.find(t => t.topic === topic);
    if (entry) {
      entry.score = Math.min(1, Math.max(0, entry.score + delta));
    }
  }

  trackContentConsumption(category) {
    const ext = this.persona.extensions.content;
    if (!ext?.history) return;

    ext.history.push({
      category,
      timestamp: Date.now()
    });
  }

  updateFromEvent(event) {
    // Could trigger content avoidance or seeking
  }

  toJSON() {
    return this.persona.extensions?.content || {};
  }
}
