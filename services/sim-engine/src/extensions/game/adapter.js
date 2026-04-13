export default class GameAdapter {
  constructor(persona) {
    this.persona = persona;
  }

  applyDefaults(data = {}) {
    this.persona.extensions = this.persona.extensions || {};
    this.persona.extensions.game = {
      ...(this.persona.extensions.game || {}),
      ...data
    };
  }

  adjustStat(stat, delta) {
    const ext = this.persona.extensions.game;
    if (!ext?.stats) return;

    ext.stats[stat] = Math.min(1, Math.max(0, (ext.stats[stat] || 0) + delta));
  }

  unlockTrait(trait) {
    const ext = this.persona.extensions.game;
    if (!ext?.traits) ext.traits = [];
    if (!ext.traits.includes(trait)) {
      ext.traits.push(trait);
    }
  }

  updateFromEvent(event) {
    // XP, leveling, buffs, debuffs, etc.
  }

  toJSON() {
    return this.persona.extensions?.game || {};
  }
}
