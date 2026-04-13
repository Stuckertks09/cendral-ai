export default class ConsumerAdapter {
  constructor(persona) {
    this.persona = persona;
  }

  applyDefaults(data = {}) {
    this.persona.extensions = this.persona.extensions || {};
    this.persona.extensions.consumer = {
      ...(this.persona.extensions.consumer || {}),
      ...data
    };
  }

  updateBrandAffinity(brand, delta) {
    const ext = this.persona.extensions.consumer;
    if (!ext?.brandPrefs) return;

    const pref = ext.brandPrefs.find(b => b.brand === brand);
    if (pref) {
      pref.affinity = Math.min(1, Math.max(0, pref.affinity + delta));
    }
  }

  recordEngagement(channel, score) {
    const ext = this.persona.extensions.consumer;
    if (!ext?.channels) return;

    const entry = ext.channels.find(c => c.type === channel);
    if (entry) {
      entry.engagement = Math.min(1, Math.max(0, score));
    }
  }

  updateFromEvent(event) {
    // later: purchase signals, media exposure, ad interactions
  }

  toJSON() {
    return this.persona.extensions?.consumer || {};
  }
}
