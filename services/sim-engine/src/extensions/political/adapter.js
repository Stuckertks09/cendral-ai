export default class PoliticalAdapter {
  constructor(persona) {
    this.persona = persona;
  }

  applyDefaults(data = {}) {
    this.persona.extensions = this.persona.extensions || {};
    this.persona.extensions.political = {
      ...(this.persona.extensions.political || {}),
      ...data
    };
  }

  shiftStance(topic, delta) {
    const issues = this.persona.extensions.political?.issues || [];
    const t = issues.find(i => i.topic === topic);
    if (!t) return;

    t.stance = Math.max(-1, Math.min(1, t.stance + delta));
  }

  updateFromEvent(event) {
    // later you’ll plug in your arbitrator logic here
  }

  toJSON() {
    return this.persona.extensions?.political || {};
  }
}
