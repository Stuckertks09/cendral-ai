export default class MarketingAdapter {
  constructor(persona) {
    this.persona = persona;
  }

  applyDefaults(data = {}) {
    this.persona.extensions = this.persona.extensions || {};
    this.persona.extensions.marketing = {
      ...(this.persona.extensions.marketing || {}),
      ...data
    };
  }

  updateFunnelStage(stage) {
    const ext = this.persona.extensions.marketing;
    if (!ext) return;
    ext.funnelStage = stage;
  }

  updateChannelResponse(channel, delta) {
    const ext = this.persona.extensions.marketing;
    if (!ext?.responses) return;

    const entry = ext.responses.find(c => c.channel === channel);
    if (entry) {
      entry.score = Math.min(1, Math.max(0, entry.score + delta));
    }
  }

  updateFromEvent(event) {
    // ad viewed, clicked, ignored → changes preferences
  }

  toJSON() {
    return this.persona.extensions?.marketing || {};
  }
}
