// extensions/therapeutic/worldStateAdapter.js

export default class TherapeuticWorldStateAdapter {
  constructor(worldState) {
    this.worldState = worldState;
  }

  /**
   * Apply incoming event signals (emotion, trust, themes, etc.)
   */
  applyEvent(event) {
    if (!event) return;

    const ws = this.worldState;

    // Example signal mapping
    if (event.type === 'emotional_breakthrough') {
      ws.metrics.emotionalProgress = Math.min(1, ws.metrics.emotionalProgress + 0.1);
      ws.climate.sessionIntensity = Math.min(1, ws.climate.sessionIntensity + 0.05);
    }

    if (event.type === 'conflict') {
      ws.metrics.dysregulation = Math.min(1, ws.metrics.dysregulation + 0.15);
      ws.climate.stressLevel = Math.min(1, ws.climate.stressLevel + 0.1);
    }

    if (event.theme) {
      this.addTheme(event.theme);
    }

    ws.updatedAt = new Date();
  }

  /**
   * Add or update a theme
   */
  addTheme(label) {
    const ws = this.worldState;

    const existing = ws.themes.find(t => t.label === label);
    if (existing) {
      existing.salience = Math.min(1, existing.salience + 0.1);
    } else {
      ws.themes.push({ label, salience: 0.3 });
    }
  }

  /**
   * Simple decay over time to simulate emotional drift
   */
  decay(factor = 0.98) {
    const ws = this.worldState;

    ws.climate.stressLevel *= factor;
    ws.climate.sessionIntensity *= factor;

    ws.metrics.dysregulation *= factor;
    ws.metrics.emotionalProgress *= factor;

    // theme salience decay
    ws.themes = ws.themes.map(t => ({
      ...t,
      salience: t.salience * factor
    }));
  }

  /**
   * Return JSON for storage or API responses.
   */
  toJSON() {
    return this.worldState;
  }
}
