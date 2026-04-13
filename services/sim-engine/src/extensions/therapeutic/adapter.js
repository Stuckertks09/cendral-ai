export default class TherapeuticAdapter {
  constructor(persona) {
    this.persona = persona;
  }

  applyDefaults(data = {}) {
    this.persona.extensions = this.persona.extensions || {};
    this.persona.extensions.therapeutic = {
      ...(this.persona.extensions.therapeutic || {}),
      ...data
    };
  }

  updateCopingStrategy(name, delta) {
    const ext = this.persona.extensions.therapeutic;
    if (!ext?.coping) return;

    const strat = ext.coping.find(c => c.strategy === name);
    if (strat) {
      strat.effectiveness = Math.min(1, Math.max(0, (strat.effectiveness || 0) + delta));
    }
  }

  updateFromEvent(event) {
    const ext = this.persona.extensions.therapeutic;
    if (!ext) return;

    if (event.type === 'conflict') {
      ext.emotionalSensitivity = Math.min(1, (ext.emotionalSensitivity || 0.5) + 0.1);
    }
  }

  toJSON() {
    return this.persona.extensions?.therapeutic || {};
  }
}
